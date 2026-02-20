/**
 * Day Care CRM - Availability Module
 */

const Availability = {
    currentMonth: new Date(),
    selectedLocation: null,

    render(month = this.currentMonth) {
        try {
            this.currentMonth = month;
            const container = document.getElementById('availabilityContent');
            if (!container) return;

            // Update month display
            const monthDisplay = document.getElementById('currentMonth');
            if (monthDisplay) {
                monthDisplay.textContent = Utils.formatDate(month, 'monthYear');
            }

            const locations = Data.getLocations();

            // Default to first location if none selected or selected is invalid
            if (!this.selectedLocation || !locations.includes(this.selectedLocation)) {
                this.selectedLocation = locations[0] || '';
            }

            container.innerHTML = `
                <div style="display: flex; gap: var(--spacing-6); align-items: flex-start;">
                    <!-- Location Sidebar -->
                    <div class="availability-sidebar" style="flex: 0 0 250px; position: sticky; top: 20px;">
                        <div class="card" style="padding: 0;">
                            <div class="card-header">
                                <span class="card-title">Device Locations</span>
                            </div>
                            <div class="list-group">
                                ${locations.map(loc => {
                const isActive = loc === this.selectedLocation;
                const activeClass = isActive ? 'active-location' : '';
                const activeStyle = isActive ? 'background-color: var(--primary-50); border-left: 4px solid var(--primary-600); font-weight: 600;' : 'border-left: 4px solid transparent;';

                return `
                                        <button class="list-group-item ${activeClass}" 
                                                onclick="Availability.switchLocation('${loc}')"
                                                style="width: 100%; text-align: left; padding: var(--spacing-3) var(--spacing-4); border: none; border-bottom: 1px solid var(--neutral-100); background: white; cursor: pointer; ${activeStyle}">
                                            ${loc}
                                        </button>
                                    `;
            }).join('')}
                            </div>
                        </div>


                    </div>

                    <!-- Main Content Area -->
                    <div class="availability-content" style="flex: 1; min-width: 0;">
                        ${this.selectedLocation ? this.renderLocationView(this.selectedLocation) : '<div class="empty-state">No locations found</div>'}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Critical Error rendering Availability:', error);
            const container = document.getElementById('availabilityContent');
            if (container) {
                container.innerHTML = `<div style="padding: 20px; color: var(--error); text-align: center;">
                    <h3>Something went wrong loading availability.</h3>
                    <p>${error.message}</p>
                </div>`;
            }
        }
    },

    switchLocation(location) {
        this.selectedLocation = location;
        this.render(this.currentMonth);
    },

    renderLocationView(location) {
        const badgeClass = Utils.getLocationColor(location);

        return `
            <div class="location-section" style="margin-top: 0;">
                <div class="location-header">
                    <span class="${badgeClass}" style="font-size: 1.2rem; padding: 0.5rem 1rem;">${location}</span>
                </div>
                ${this.renderLocationTable(location)}
                ${this.renderWeeklyView(location)}
                ${this.renderMonthlyView(location)}
                ${this.renderForecastMain(location)}
            </div>
        `;
    },

    renderLocationTable(location) {
        const classrooms = Data.getClassroomsByLocation(location);

        return `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Classroom</th>
                            <th>Age Range</th>
                            <th>Total Spots</th>
                            <th>Filled</th>
                            <th>Available</th>
                            <th>Utilization</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${classrooms.map(classroom => {
            // Use current month for capacity check
            let capacity = Data.getClassroomCapacity(classroom.id);

            // Apply override for the viewed month
            const viewDate = Availability.currentMonth || new Date();
            const monthLabel = Utils.formatDate(viewDate, 'monthYear');

            if (classroom.capacityOverrides && classroom.capacityOverrides[monthLabel] !== undefined) {
                const total = classroom.capacityOverrides[monthLabel];
                capacity = {
                    total: total,
                    filled: capacity.filled,
                    available: Math.max(0, total - capacity.filled),
                    percentage: total > 0 ? Math.round((capacity.filled / total) * 100) : 0
                };
            }

            const fillClass = capacity.percentage >= 90 ? 'high' : capacity.percentage >= 70 ? 'medium' : 'low';

            let ageDisplay = `${classroom.ageRangeMonths?.min || 0} - ${classroom.ageRangeMonths?.max || 0} months`;
            if (classroom.ageCategory === 'Non Mobile Infant') {
                const minWeeks = Math.round((classroom.ageRangeMonths?.min || 0) * 4.33);
                ageDisplay = `${minWeeks} weeks - ${classroom.ageRangeMonths?.max || 0} months`;
            }

            return `
                                <tr>
                                    <td><strong>${classroom.name}</strong></td>
                                    <td>${ageDisplay}</td>
                                    <td>${capacity.total}</td>
                                    <td>${capacity.filled}</td>
                                    <td><strong style="color: ${capacity.available > 0 ? 'var(--success)' : 'var(--error)'}">${capacity.available}</strong></td>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: var(--spacing-2);">
                                            <div class="capacity-bar" style="flex: 1; max-width: 100px;">
                                                <div class="capacity-fill ${fillClass}" style="width: ${capacity.percentage}%"></div>
                                            </div>
                                            <span>${capacity.percentage}%</span>
                                        </div>
                                    </td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                    <tfoot>
                        <tr style="background: var(--neutral-100); font-weight: 600;">
                            <td colspan="2">Total</td>
                            <td>${classrooms.reduce((sum, c) => sum + c.maxCapacity, 0)}</td>
                            <td>${classrooms.reduce((sum, c) => sum + Data.getClassroomCapacity(c.id).filled, 0)}</td>
                            <td>${classrooms.reduce((sum, c) => sum + Data.getClassroomCapacity(c.id).available, 0)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    },

    renderForecastMini() {
        const months = Utils.getMonthsForForecast(new Date(), 4);
        const locations = Data.getLocations();

        // Just show total availability percent for each location next 3 months
        return `
            <table class="availability-report-table" style="font-size: 0.75rem;">
                <thead>
                    <tr>
                        <th>Loc</th>
                        ${months.map(m => `<th>${m.label.split(' ')[0][0]}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${locations.map(loc => {
            const classrooms = Data.getClassroomsByLocation(loc);
            if (!classrooms.length) return '';
            return `
                            <tr>
                                <td>${loc.split(' ').pop()}</td>
                                ${months.map(m => {
                let totalCap = 0;
                let totalFilled = 0;
                classrooms.forEach(c => {
                    const cap = Data.getClassroomProjectedCapacity(c.id, m.date);
                    totalCap += c.maxCapacity; // Simplified
                    totalFilled += cap.filled;
                });
                const percent = totalCap > 0 ? Math.round((totalFilled / totalCap) * 100) : 0;
                const color = percent >= 95 ? 'var(--error)' : percent >= 80 ? 'var(--warning)' : 'var(--success)';
                return `<td style="color: ${color}; font-weight: bold;">${percent}%</td>`;
            }).join('')}
                            </tr>
                        `;
        }).join('')}
                </tbody>
            </table>
        `;
    },

    renderWeeklyView(location) {
        try {
            const classrooms = Data.getClassroomsByLocation(location);
            const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

            return `
                <div class="card" style="margin-top: var(--spacing-6);">
                    <div class="card-header">
                        <span class="card-title">📅 Weekly Attendance Schedule</span>
                    </div>
                    <div class="card-body">
                        ${classrooms.map(classroom => {
                const children = Data.getChildrenByClassroom(classroom.id) || [];

                const childrenByDay = {};
                const allSchedules = typeof Data.getSchedules === 'function' ? Data.getSchedules() : [];

                weekDays.forEach(day => {
                    childrenByDay[day] = children.filter(child => {
                        if (!child || child.status !== 'Enrolled') return false;
                        if (child.scheduleType === 'Full Time') return true;

                        // Part Time logic reading from schedules
                        const childSchedules = allSchedules.filter(s => s.childId === child.id);
                        childSchedules.sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));
                        const activeSchedule = childSchedules[0];

                        if (activeSchedule && activeSchedule.daysOfWeek) {
                            let days = [];
                            try {
                                days = (typeof activeSchedule.daysOfWeek === 'string' ? JSON.parse(activeSchedule.daysOfWeek) : activeSchedule.daysOfWeek) || [];
                            } catch (e) {
                                if (typeof activeSchedule.daysOfWeek === 'string') {
                                    days = activeSchedule.daysOfWeek.split(',').map(d => d.trim());
                                }
                            }
                            return Array.isArray(days) && days.some(d => day.toLowerCase().startsWith(d.toLowerCase().substring(0, 3)));
                        }

                        return false;
                    });
                });

                return `
                                <div style="margin-bottom: var(--spacing-6);">
                                    <h4 style="margin-bottom: var(--spacing-3);">${classroom.name}</h4>
                                    <div class="table-container">
                                        <table class="weekly-schedule-table">
                                            <thead>
                                                <tr>
                                                    <th>Day</th>
                                                    <th>Expected Children</th>
                                                    <th>Count</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${weekDays.map(day => {
                    const count = childrenByDay[day]?.length || 0;
                    const capacity = classroom.maxCapacity || 0;

                    return `
                                                        <tr>
                                                        <td>${day}</td>
                                                        <td>
                                                            <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                                                                ${childrenByDay[day].sort((a, b) => a.firstName.localeCompare(b.firstName)).map(c => `
                                                                    <span class="badge" style="background-color: var(--primary-100); color: var(--primary-800); font-weight: normal; font-size: 0.75rem;">
                                                                        ${c.firstName}
                                                                    </span>
                                                                `).join('')}
                                                            </div>
                                                        </td>
                                                        <td><span style="font-weight: 600;">${count}</span> / ${capacity}</td>
                                                    </tr>
                                                `;
                }).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            `;
            }).join('')}
                    </div>
                </div>
            `;
        } catch (e) {
            console.error('Error rendering weekly view:', e);
            return `<div class="card" style="padding: 20px; color: var(--error);">Error loading weekly view: ${e.message}</div>`;
        }
    },

    renderMonthlyView(location) {
        try {
            const classrooms = Data.getClassroomsByLocation(location);
            if (!classrooms || classrooms.length === 0) return '';
            const year = this.currentMonth.getFullYear();
            const month = this.currentMonth.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun

            const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

            const getAvailability = (day) => {
                try {
                    const date = new Date(year, month, day);
                    const dayName = weekDays[date.getDay()];
                    if (dayName === 'Sunday' || dayName === 'Saturday') return '';

                    return classrooms.map(c => {
                        const capacity = c.maxCapacity || 0;
                        const children = Data.getChildrenByClassroom(c.id) || [];
                        const count = children.filter(child => {
                            if (!child || child.status !== 'Enrolled') return false;
                            const enrollDate = child.enrollmentDate ? new Date(child.enrollmentDate) : null;
                            if (enrollDate && enrollDate > date) return false;
                            if (child.scheduleType === 'Full Time') return true;

                            // Part Time logic reading from schedules
                            const allSchedules = typeof Data.getSchedules === 'function' ? Data.getSchedules() : [];
                            const childSchedules = allSchedules.filter(s => s.childId === child.id);
                            childSchedules.sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));
                            const activeSchedule = childSchedules[0];

                            if (activeSchedule && activeSchedule.daysOfWeek) {
                                let days = [];
                                try {
                                    days = (typeof activeSchedule.daysOfWeek === 'string' ? JSON.parse(activeSchedule.daysOfWeek) : activeSchedule.daysOfWeek) || [];
                                } catch (e) {
                                    if (typeof activeSchedule.daysOfWeek === 'string') {
                                        days = activeSchedule.daysOfWeek.split(',').map(d => d.trim());
                                    }
                                }
                                return Array.isArray(days) && days.some(d => dayName.toLowerCase().startsWith(d.toLowerCase().substring(0, 3)));
                            }
                            return false;
                        }).length;

                        const available = capacity - count;
                        const color = available > 0 ? 'var(--success)' : 'var(--error)';

                        return `<div style="font-size: 0.7rem; display: flex; justify-content: space-between; margin-bottom: 2px;">
                                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 70%;" title="${c.name}">${c.name}</span>
                                <span style="font-weight: bold; color: ${color};">${available}</span>
                            </div>`;
                    }).join('');
                } catch (err) {
                    return '';
                }
            };

            return `
            <div class="card" style="margin-top: var(--spacing-6);">
                <div class="card-header">
                    <span class="card-title">📅 Monthly Drop-In Availability</span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                         <button class="btn btn-icon" onclick="App.navigateMonth(-1)" style="width: 32px; height: 32px; font-size: 0.8rem;">◀</button>
                         <span style="font-weight: 600; font-size: 0.9rem; min-width: 120px; text-align: center;">${Utils.formatDate(this.currentMonth, 'monthYear')}</span>
                         <button class="btn btn-icon" onclick="App.navigateMonth(1)" style="width: 32px; height: 32px; font-size: 0.8rem;">▶</button>
                    </div>
                </div>
                <div class="card-body">
                    <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: var(--neutral-200); border: 1px solid var(--neutral-200);">
                        ${weekDays.map(d => `<div style="background: var(--neutral-50); padding: 8px; font-weight: bold; text-align: center; font-size: 0.8rem;">${d.slice(0, 3)}</div>`).join('')}
                        ${Array(firstDay).fill(0).map(() => `<div style="background: white; min-height: 100px;"></div>`).join('')}
                        ${Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const date = new Date(year, month, day);
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                const bg = isWeekend ? 'var(--neutral-50)' : 'white';
                return `
                                <div style="background: ${bg}; min-height: 100px; padding: 4px;">
                                    <div style="font-weight: bold; margin-bottom: 4px; font-size: 0.8rem; color: var(--neutral-600);">${day}</div>
                                    ${!isWeekend ? getAvailability(day) : ''}
                                </div>
                            `;
            }).join('')}
                    </div>
                </div>
            </div>
        `;
        } catch (e) {
            console.error('Error rendering monthly view:', e);
            return `<div class="card" style="margin-top: var(--spacing-6); padding: 20px; color: var(--error);">Error loading monthly view: ${e.message}</div>`;
        }
    },

    renderForecastMain(location) {
        const months = Utils.getMonthsForForecast(new Date(), 6); // Show 6 months for full view
        const classrooms = Data.getClassroomsByLocation(location);

        if (!classrooms.length) return '';

        return `
            <div class="card" style="margin-top: var(--spacing-6);">
                <div class="card-header">
                    <span class="card-title">🔮 Future Capacity Forecast</span>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Classroom</th>
                                    ${months.map(m => `<th>${m.label}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${classrooms.map(c => {
            return `
                                        <tr>
                                            <td><strong>${c.name}</strong><div style="font-size: 0.8rem; color: var(--neutral-500);">${c.ageCategory}</div></td>
                                            ${months.map(m => {
                const cap = Data.getClassroomProjectedCapacity(c.id, m.date);
                // Data.getClassroomProjectedCapacity now handles overrides internally!

                const percent = cap.total > 0 ? Math.round((cap.filled / cap.total) * 100) : 0;
                const color = percent >= 95 ? 'var(--error)' : percent >= 80 ? 'var(--warning)' : 'var(--success)';

                return `
                                                    <td>
                                                        <div style="display: flex; flex-direction: column; gap: 4px;">
                                                            <div style="font-weight: bold; color: ${color};">${percent}% Full</div>
                                                            <div style="font-size: 0.8rem; color: var(--neutral-600);">
                                                                ${cap.filled} / ${cap.total}
                                                            </div>
                                                        </div>
                                                    </td>
                                                `;
            }).join('')}
                                        </tr>
                                    `;
        }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
};
