/**
 * Day Care CRM - Reports Module
 */

const Reports = {
    // State to track the currently viewed week
    currentWeekStart: null,

    init() {
        // Initialize with current week if not set
        if (!this.currentWeekStart) {
            this.currentWeekStart = Utils.getWeekStart(new Date());
        }
    },

    render() {
        this.init(); // Ensure initialized

        const container = document.getElementById('reportsContent');
        const weekStart = this.currentWeekStart;
        const weekEnd = Utils.getWeekEnd(weekStart); // Mon-Sun

        container.innerHTML = `
            <div class="report-header" style="margin-bottom: var(--spacing-6); padding: var(--spacing-4); background: linear-gradient(135deg, var(--primary-600), var(--primary-500)); border-radius: var(--radius-lg); color: white;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <h2 style="margin: 0;">📊 Weekly Report</h2>
                        <p style="margin: var(--spacing-2) 0 0; opacity: 0.9;">
                            Week of ${Utils.formatDate(weekStart)} - ${Utils.formatDate(weekEnd)}
                        </p>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.1); padding: 5px; border-radius: 8px;">
                        <button class="btn btn-sm" onclick="Reports.prevWeek()" style="color: white; border: 1px solid rgba(255,255,255,0.5); background: transparent;">
                            <i class="fas fa-chevron-left"></i> Prev
                        </button>
                        <input type="date" 
                            value="${Utils.formatDateInput(weekStart)}" 
                            onchange="Reports.goToWeek(this.value)"
                            style="padding: 4px; border-radius: 4px; border: none; font-family: inherit;">
                        <button class="btn btn-sm" onclick="Reports.nextWeek()" style="color: white; border: 1px solid rgba(255,255,255,0.5); background: transparent;">
                            Next <i class="fas fa-chevron-right"></i>
                        </button>
                        <button class="btn btn-sm" onclick="Reports.goToToday()" style="color: white; border: 1px solid rgba(255,255,255,0.5); background: transparent; margin-left: 5px;">
                            Current
                        </button>
                    </div>
                </div>
            </div>

            <!-- Agenda Section -->
            ${this.renderAgendaSection()}

            <!-- Tours Section -->
            ${this.renderToursSection(weekStart, weekEnd)}

            <!-- Service Agreements Section -->
            ${this.renderServiceAgreementsSection()}

            <!-- Playdates Section -->
            ${this.renderPlaydatesSection(weekStart, weekEnd)}

            <!-- Onboarding/Offboarding Section -->
            ${this.renderOnboardingSection()}

            <!-- Availability Forecast -->
            ${(() => { try { return this.renderAvailabilityForecast(); } catch (e) { console.error('Availability Forecast error:', e); return ''; } })()}
        `;
    },

    // Navigation Methods
    prevWeek() {
        const newDate = new Date(this.currentWeekStart);
        newDate.setDate(newDate.getDate() - 7);
        this.currentWeekStart = newDate;
        this.render();
    },

    nextWeek() {
        const newDate = new Date(this.currentWeekStart);
        newDate.setDate(newDate.getDate() + 7);
        this.currentWeekStart = newDate;
        this.render();
    },

    goToWeek(dateString) {
        if (!dateString) return;
        // When picking a date, snap to the start of that week
        const date = new Date(dateString + 'T00:00:00'); // Ensure local time
        this.currentWeekStart = Utils.getWeekStart(date);
        this.render();
    },

    goToToday() {
        this.currentWeekStart = Utils.getWeekStart(new Date());
        this.render();
    },

    // Agenda Section
    renderAgendaSection() {
        // Ensure Data.getAgenda exists (if not, empty array)
        const agenda = Data.getAgenda ? Data.getAgenda() : [];

        return `
            <div class="card" style="margin-bottom: var(--spacing-6);">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="card-title">📝 Agenda</span>
                    <button class="btn btn-primary btn-sm" onclick="Reports.promptAddAgenda()">
                        <i class="fas fa-plus"></i> Add Item
                    </button>
                </div>
                <div class="card-body">
                    ${agenda.length ? `
                        <ul class="agenda-list" style="list-style: none; padding: 0;">
                            ${agenda.map(item => `
                                <li style="display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-3); border-bottom: 1px solid var(--neutral-200);">
                                    <div>
                                        <div style="font-weight: 500;">${item.title}</div>
                                        ${item.description ? `<div style="font-size: 0.9em; color: var(--neutral-500);">${item.description}</div>` : ''}
                                        <div style="font-size: 0.8em; color: var(--neutral-400); margin-top: 4px;">Created: ${Utils.formatDate(item.createdAt)}</div>
                                    </div>
                                    <button class="btn-icon" onclick="Reports.deleteAgenda('${item.id}')" style="color: var(--error);" title="Delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </li>
                            `).join('')}
                        </ul>
                    ` : '<p style="color: var(--neutral-500); font-style: italic; text-align: center; padding: var(--spacing-4);">No agenda items yet.</p>'}
                </div>
            </div>
        `;
    },

    promptAddAgenda() {
        const title = prompt("Enter agenda item title:");
        if (!title) return;
        const description = prompt("Enter description (optional):");

        if (Data.addAgendaItem) {
            Data.addAgendaItem({
                title,
                description,
                status: 'Open'
            });
            this.render();
        }
    },

    deleteAgenda(id) {
        if (confirm("Are you sure you want to delete this agenda item?")) {
            if (Data.deleteAgendaItem) {
                Data.deleteAgendaItem(id);
                this.render();
            }
        }
    },

    renderToursSection(weekStart, weekEnd) {
        const tours = Data.getTours();
        const locations = Data.getLocations();

        // Ensure time boundaries covers the whole day
        const start = new Date(weekStart);
        start.setHours(0, 0, 0, 0);

        const end = new Date(weekEnd);
        end.setHours(23, 59, 59, 999);

        // Previous week for Summary
        const lastWeekStart = new Date(start);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(end);
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

        // Tours Scheduled for THIS week (Upcoming in this context means "Scheduled" for the viewed week)
        const scheduledThisWeek = tours.filter(t => {
            const date = new Date(t.scheduledDate);
            return date >= start && date <= end && t.status === 'Scheduled';
        });

        // Next week's tours (relative to viewed week)
        const nextWeekStart = new Date(end);
        nextWeekStart.setDate(nextWeekStart.getDate() + 1);
        const nextWeekEnd = new Date(nextWeekStart);
        nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);
        nextWeekEnd.setHours(23, 59, 59, 999);

        const scheduledNextWeek = tours.filter(t => {
            const date = new Date(t.scheduledDate);
            return date >= nextWeekStart && date <= nextWeekEnd && t.status === 'Scheduled';
        });

        // Filter tours by LAST WEEK for summary (relative to viewed week)
        const completed = tours.filter(t => {
            const date = new Date(t.scheduledDate);
            return date >= lastWeekStart && date <= lastWeekEnd && t.status === 'Completed';
        });
        const rescheduled = tours.filter(t => {
            const date = new Date(t.scheduledDate);
            return date >= lastWeekStart && date <= lastWeekEnd && t.status === 'Rescheduled';
        });
        const cancelled = tours.filter(t => {
            const date = new Date(t.scheduledDate);
            return date >= lastWeekStart && date <= lastWeekEnd && t.status === 'Cancelled';
        });

        // Group by day of week - store actual tours by location
        // Including Saturday and Sunday now
        const toursByDay = {
            Monday: {},
            Tuesday: {},
            Wednesday: {},
            Thursday: {},
            Friday: {},
            Saturday: {},
            Sunday: {}
        };

        // Initialize location arrays for each day
        Object.keys(toursByDay).forEach(day => {
            locations.forEach(loc => {
                toursByDay[day][loc] = [];
            });
        });

        scheduledThisWeek.forEach(t => {
            const day = Utils.formatDate(t.scheduledDate, 'weekday');
            if (toursByDay[day]) {
                let locKey = t.location;
                // Location normalization logic if needed (matching existing logic)
                if (!toursByDay[day][locKey] && (locKey === 'Day Care Location 1' || locKey === 'Day Care Location 1')) {
                    const key = Object.keys(toursByDay[day]).find(k => k.includes('Location 1') || k.includes('Laguna'));
                    if (key) locKey = key;
                }

                if (toursByDay[day][locKey]) {
                    toursByDay[day][locKey].push(t);
                } else {
                    // Fallback for unknown/new locations
                    if (!toursByDay[day][t.location]) toursByDay[day][t.location] = [];
                    toursByDay[day][t.location].push(t);
                }
            }
        });

        // Helper function to get parent names for tours
        const getTourParentNames = (tourList) => {
            if (!tourList || tourList.length === 0) return 'None';
            return tourList.map(t => {
                if (t.parentName) return t.parentName;

                if (t.parentIds && t.parentIds.length > 0) {
                    const parent = Data.getParentById(t.parentIds[0]);
                    return parent ? `${parent.firstName} ${parent.lastName}` : 'Unknown Parent';
                }

                if (t.childId) {
                    const child = Data.getChildById(t.childId);
                    if (child && child.parentIds && child.parentIds.length > 0) {
                        const parent = Data.getParentById(child.parentIds[0]);
                        return parent ? `${parent.firstName} ${parent.lastName}` : 'Unknown Parent';
                    }
                }

                return 'Unknown';
            }).join('&#10;');
        };

        return `
            <div class="report-section">
                <div class="report-section-header">🚶 Tours</div>
                <div class="report-section-body">
                    <div class="report-grid">
                        <div>
                            <h4>Tour Summary (Week prior to viewed week)</h4>
                            <table style="width: 100%;">
                                <tr><td>Completed</td><td><strong title="${getTourParentNames(completed)}" style="cursor: pointer;">${completed.length}</strong></td></tr>
                                <tr><td>Rescheduled</td><td><strong title="${getTourParentNames(rescheduled)}" style="cursor: pointer;">${rescheduled.length}</strong></td></tr>
                                <tr><td>Cancelled</td><td><strong title="${getTourParentNames(cancelled)}" style="cursor: pointer;">${cancelled.length}</strong></td></tr>
                                <tr><td>Scheduled (Viewed Week)</td><td><strong title="${getTourParentNames(scheduledThisWeek)}" style="cursor: pointer;">${scheduledThisWeek.length}</strong></td></tr>
                                <tr><td>Scheduled (Week After)</td><td><strong title="${getTourParentNames(scheduledNextWeek)}" style="cursor: pointer;">${scheduledNextWeek.length}</strong></td></tr>
                            </table>
                        </div>
                        <div>
                            <h4>Scheduled Tours (Viewed Week)</h4>
                            <div class="table-container">
                                <table style="width: 100%;">
                                    <thead>
                                        <tr>
                                            <th>Day</th>
                                            ${locations.map(loc => `<th><span class="location-badge ${Utils.getLocationColor(loc)}">${loc}</span></th>`).join('')}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${Object.entries(toursByDay).map(([day, locData]) => `
                                            <tr>
                                                <td>${day}</td>
                                                ${locations.map(loc => `
                                                    <td><strong title="${getTourParentNames(locData[loc])}" style="cursor: pointer;">${locData[loc]?.length || 0}</strong></td>
                                                `).join('')}
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <h4 style="margin-top: var(--spacing-6);">Completed Tours Source (Week prior to viewed week)</h4>
                    <div class="report-grid">
                        ${locations.map(loc => {
            const locTours = completed.filter(t => t.location === loc || (loc === 'Day Care Location 1' && t.location === 'Day Care Location 1') || (loc === 'Day Care Location 2' && t.location === 'Day Care Location 2'));
            const sources = this.countTourSources(locTours);
            const badgeClass = Utils.getLocationColor(loc);

            return `
                                <div class="report-column">
                                    <h4><span class="${badgeClass}">${loc}</span></h4>
                                    ${Object.entries(sources).map(([source, count]) => `
                                        <div style="display: flex; justify-content: space-between;">
                                            <span>${source}</span><strong>${count}</strong>
                                        </div>
                                    `).join('') || '<p>No data</p>'}
                                </div>
                            `;
        }).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    countTourSources(tours) {
        const counts = {};
        tours.forEach(t => {
            const source = t.source || 'Unknown';
            counts[source] = (counts[source] || 0) + 1;
        });
        return counts;
    },

    renderServiceAgreementsSection() {
        // Service agreements are accumulated/status based, not strictly date-bound in the same way,
        // but we might want to filter recent activity? 
        // Logic remains similar to original for now, showing current status of agreements.
        const agreements = Data.getServiceAgreements();
        const locations = Data.getLocations();

        const countByStatus = (items) => ({
            sent: items.filter(i => i.status === 'Sent').length,
            signed: items.filter(i => i.status === 'Signed').length,
            followedUp: items.filter(i => i.status === 'Followed-up').length
        });

        return `
            <div class="report-section" style="margin-top: var(--spacing-6);">
                <div class="report-section-header">📄 Service Agreements</div>
                <div class="report-section-body">
                    <div class="report-grid">
                        ${locations.map(loc => {
            const locAgreements = agreements.filter(a => a.location === loc || (loc === 'Day Care Location 1' && a.location === 'Day Care Location 1') || (loc === 'Day Care Location 2' && a.location === 'Day Care Location 2'));
            const counts = countByStatus(locAgreements);
            const badgeClass = Utils.getLocationColor(loc);

            return `
                                <div class="report-column">
                                    <h4><span class="location-badge ${badgeClass}">${loc}</span></h4>
                                    
                                    ${(() => {
                    const getNames = (status) => {
                        const statusAgreements = locAgreements.filter(a => a.status === status);
                        if (!statusAgreements.length) return '';
                        return statusAgreements.map(a => {
                            const child = Data.getChildById(a.childId);
                            if (!child) return 'Unknown Child';
                            if (child.parentIds && child.parentIds.length) {
                                const parent = Data.getParentById(child.parentIds[0]);
                                return parent ? `${parent.firstName} ${parent.lastName} (${child.firstName})` : child.firstName;
                            }
                            return child.firstName;
                        }).join('\n');
                    };

                    return `
                                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding: 4px 0;">
                                        <span style="cursor: help; border-bottom: 1px dotted #ccc;" title="${getNames('Sent').replace(/\n/g, '&#10;')}">Sent</span>
                                        <strong title="${getNames('Sent').replace(/\n/g, '&#10;')}" style="cursor: pointer;">${counts.sent}</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding: 4px 0;">
                                        <span style="cursor: help; border-bottom: 1px dotted #ccc;" title="${getNames('Signed').replace(/\n/g, '&#10;')}">Signed</span>
                                        <strong title="${getNames('Signed').replace(/\n/g, '&#10;')}" style="cursor: pointer;">${counts.signed}</strong>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                                        <span style="cursor: help; border-bottom: 1px dotted #ccc;" title="${getNames('Followed-up').replace(/\n/g, '&#10;')}">Followed-up</span>
                                        <strong title="${getNames('Followed-up').replace(/\n/g, '&#10;')}" style="cursor: pointer;">${counts.followedUp}</strong>
                                    </div>
                                    `;
                })()}
                                </div>
                            `;
        }).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    renderPlaydatesSection(weekStart, weekEnd) {
        const playdates = Data.getPlaydates();
        const projects = Data.getProjects();
        const locations = Data.getLocations();

        // Cleanup
        const validPlaydateIds = new Set();
        projects.forEach(p => {
            if (p.playdateIds && Array.isArray(p.playdateIds)) {
                p.playdateIds.forEach(id => validPlaydateIds.add(id));
            }
            if (p.playdateId) validPlaydateIds.add(p.playdateId);
        });
        const cleanedPlaydates = playdates.filter(pd => validPlaydateIds.has(pd.id));
        if (cleanedPlaydates.length !== playdates.length) {
            localStorage.setItem(Data.STORAGE_KEYS.PLAYDATES, JSON.stringify(cleanedPlaydates));
        }

        // Time boundaries
        const start = new Date(weekStart);
        start.setHours(0, 0, 0, 0);
        const end = new Date(weekEnd);
        end.setHours(23, 59, 59, 999);

        const lastWeekStart = new Date(start);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(end);
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

        const parseLocalYMD = (dateStr) => {
            if (!dateStr) return new Date(0);
            const [y, m, d] = dateStr.split('-').map(Number);
            return new Date(y, m - 1, d);
        };

        // Completed (Week prior to viewed week)
        const completed = cleanedPlaydates.filter(p => {
            const pDate = parseLocalYMD(p.date);
            return pDate >= lastWeekStart && pDate <= lastWeekEnd && p.status === 'Completed';
        });

        // Upcoming/Scheduled/Completed (Viewed Week)
        const upcoming = cleanedPlaydates.filter(p => {
            const pDate = parseLocalYMD(p.date);
            return pDate >= start && pDate <= end && (p.status === 'Scheduled' || p.status === 'Confirmed' || p.status === 'Upcoming' || p.status === 'Completed');
        });

        const renderList = (items, location) => {
            const filtered = items.filter(p => p.location === location || (location === 'Day Care Location 1' && p.location === 'Day Care Location 1') || (location === 'Day Care Location 2' && p.location === 'Day Care Location 2'));
            if (!filtered.length) return '<p style="color: var(--neutral-400);">None</p>';

            return `<ul style="margin: 0; padding-left: var(--spacing-4);">
    ${filtered.map(p => {
                const child = Data.getChildById(p.childId);
                const statusIcon = p.status === 'Completed' ? '✅ ' : '';
                return `<li>${statusIcon}${child ? child.firstName + ' ' + child.lastName : 'Unknown'} - ${p.category || 'N/A'} (${Utils.formatDate(p.date)})</li>`;
            }).join('')
                }
            </ul>`;
        };

        return `
            <div class="report-section">
                <div class="report-section-header">🎮 Playdates</div>
                <div class="report-section-body">
                    <div class="report-grid">
                        <div>
                            <h4>Completed Playdates (Week Prior)</h4>
                            ${locations.map(loc => {
            const badgeClass = Utils.getLocationColor(loc);
            return `
                                    <div class="report-column" style="margin-top: var(--spacing-3);">
                                        <h5><span class="location-badge ${badgeClass}">${loc}</span></h5>
                                        ${renderList(completed, loc)}
                                    </div>
                                `;
        }).join('')}
                        </div>
                        <div>
                            <h4>Playdates (Viewed Week)</h4>
                            ${locations.map(loc => {
            const badgeClass = Utils.getLocationColor(loc);
            return `
                                    <div class="report-column" style="margin-top: var(--spacing-3);">
                                        <h5><span class="location-badge ${badgeClass}">${loc}</span></h5>
                                        ${renderList(upcoming, loc)}
                                    </div>
                                `;
        }).join('')}
                        </div>
                    </div>
                </div>
            </div>
    `;
    },

    renderOnboardingSection() {
        // Criteria:
        // 1. Child Status is 'Enrolled'
        // 2. Service Agreement is 'Signed'
        // 3. Deduplicate by Family (Parent)
        // 4. Show if NOT Onboarded OR (Onboarded AND OnboardedAt is in current view week)

        const allChildren = Data.getChildren();
        const serviceAgreements = Data.getServiceAgreements();
        const parents = Data.getParents();

        // Time boundaries for visibility check
        const weekStart = this.currentWeekStart;
        const weekEnd = Utils.getWeekEnd(weekStart);
        // Normalize to start/end of days
        const viewStart = new Date(weekStart); viewStart.setHours(0, 0, 0, 0);
        const viewEnd = new Date(weekEnd); viewEnd.setHours(23, 59, 59, 999);

        const onboardingList = [];
        const processedFamilyIds = new Set(); // Use primary parent ID as family key

        allChildren.forEach(child => {
            if (child.status === 'Enrolled') {
                // Check for Signed Service Agreement
                const hasSignedSA = serviceAgreements.some(sa => sa.childId === child.id && sa.status === 'Signed');

                if (hasSignedSA) {
                    // Find Parents
                    if (child.parentIds && child.parentIds.length > 0) {
                        // Use the first parent as the "key" for the family to avoid duplicates
                        const primaryParentId = child.parentIds[0];

                        if (!processedFamilyIds.has(primaryParentId)) {
                            const parent = Data.getParentById(primaryParentId);
                            if (parent) {
                                // VISIBILITY LOGIC:
                                // Show if:
                                // 1. Not onboarded (!parent.onboarded)
                                // 2. OR Onboarded within the current view week
                                let isVisible = true;
                                if (parent.onboarded) {
                                    if (parent.onboardedAt) {
                                        const onboardedDate = new Date(parent.onboardedAt);
                                        if (onboardedDate < viewStart || onboardedDate > viewEnd) {
                                            isVisible = false; // Onboarded outside this week (likely in past)
                                        }
                                    } else {
                                        // Onboarded but no date? Assume past?
                                        isVisible = false;
                                    }
                                }

                                if (isVisible) {
                                    processedFamilyIds.add(primaryParentId);

                                    // Get scheduled start date (Enrollment Date)
                                    // Use child.enrollmentDate or find from Schedules
                                    let dateStr = child.enrollmentDate;
                                    if (!dateStr) {
                                        const schedules = Data.getSchedulesByChild(child.id);
                                        if (schedules.length > 0) dateStr = schedules[0].startDate;
                                    }

                                    onboardingList.push({
                                        parentId: parent.id,
                                        parentName: `${parent.firstName} ${parent.lastName}`,
                                        childName: `${child.firstName} ${child.lastName}`,
                                        category: child.scheduleType || 'New Enrollment',
                                        date: dateStr,
                                        location: child.location,
                                        onboarded: !!parent.onboarded
                                    });
                                }
                            }
                        }
                    }
                }
            }
        });

        const locations = Data.getLocations();

        // Also fetch Offboarding (existing logic)
        const offboardingEntries = Data.getOnboarding().filter(o => o.type === 'Offboarding');

        const renderOnboardingList = (items, location) => {
            const filtered = items.filter(o => o.location === location || (location === 'Day Care Location 1' && o.location === 'Day Care Location 1') || (location === 'Day Care Location 2' && o.location === 'Day Care Location 2'));
            if (!filtered.length) return '<p style="color: var(--neutral-400);">None</p>';

            return `<table style="width: 100%; font-size: var(--font-size-sm);">
                <thead><tr><th>Parent</th><th>Child</th><th>Date</th><th>Onboarded</th></tr></thead>
                <tbody>
                    ${filtered.map(o => `
                        <tr>
                            <td>${o.parentName}</td>
                            <td>${o.childName}</td>
                            <td>${Utils.formatDate(o.date)}</td>
                            <td class="text-center">
                                <input type="checkbox" 
                                    ${o.onboarded ? 'checked' : ''} 
                                    onchange="Reports.toggleOnboarded('${o.parentId}')"
                                    style="cursor: pointer;">
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;
        };

        const renderOffboardingList = (items, location) => {
            const filtered = items.filter(o => o.location === location || (location === 'Day Care Location 1' && o.location === 'Day Care Location 1') || (location === 'Day Care Location 2' && o.location === 'Day Care Location 2'));
            if (!filtered.length) return '<p style="color: var(--neutral-400);">None</p>';
            return `<table style="width: 100%; font-size: var(--font-size-sm);">
                <thead><tr><th>Name</th><th>Date</th><th>Reason</th></tr></thead>
                <tbody>
                    ${filtered.map(o => {
                const parent = o.parentId ? Data.getParentById(o.parentId) : null;
                const child = o.childId ? Data.getChildById(o.childId) : null;
                const displayName = parent ? `${parent.firstName} ${parent.lastName}` : (child ? `${child.firstName} ${child.lastName}` : 'Unknown');
                return `
                        <tr>
                            <td>${displayName}</td>
                            <td>${Utils.formatDate(o.date)}</td>
                             <td>${o.reason || '-'}</td>
                        </tr>
                    `}).join('')}
                </tbody>
            </table>`;
        };

        return `
            <div class="report-section">
                <div class="report-section-header">👋 Onboarding / Offboarding</div>
                <div class="report-section-body">
                    <div class="report-grid">
                        <div>
                            <h4>Onboarding Families (Enrolled & Signed)</h4>
                            ${locations.map(loc => {
            const badgeClass = Utils.getLocationColor(loc);
            return `
                                    <div class="report-column" style="margin-top: var(--spacing-3);">
                                        <h5><span class="location-badge ${badgeClass}">${loc}</span></h5>
                                        ${renderOnboardingList(onboardingList, loc)}
                                    </div>
                                `;
        }).join('')}
                        </div>
                         <div>
                            <h4>Offboarding Families</h4>
                            ${locations.map(loc => {
            const badgeClass = Utils.getLocationColor(loc);
            return `
                                    <div class="report-column" style="margin-top: var(--spacing-3);">
                                        <h5><span class="location-badge ${badgeClass}">${loc}</span></h5>
                                        ${renderOffboardingList(offboardingEntries, loc)}
                                    </div>
                                `;
        }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    toggleOnboarded(parentId) {
        const parent = Data.getParentById(parentId);
        if (parent) {
            const newState = !parent.onboarded;
            Data.updateParent(parentId, {
                onboarded: newState,
                onboardedAt: newState ? new Date().toISOString() : null
            });
            this.render();
            const msg = newState ? 'Marked as onboarded' : 'Marked as not onboarded';
            // Optional: Utils.showToast(msg);
        }
    },

    renderAvailabilityForecast() {
        // Show forecast starting from the month of the VIEWED week
        const startMonth = this.currentWeekStart || new Date();
        const months = Utils.getMonthsForForecast(startMonth, 8);
        const locations = Data.getLocations();

        return `
            <div class="report-section">
                <div class="report-section-header">📅 Availability Forecast</div>
                <div class="report-section-body">
                    ${locations.map(loc => `
                        <h4>${loc}</h4>
                        <div class="table-container" style="margin-bottom: var(--spacing-6);">
                            <table class="availability-report-table">
                                <thead>
                                    <tr>
                                        <th>Month</th>
                                        <th>Classroom</th>
                                        <th>Max Capacity</th>
                                        <th>Filled</th>
                                        <th>Available</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${this.renderForecastRows(loc, months)}
                                </tbody>
                            </table>
                        </div>
                        `).join('')}
                </div>
            </div>
    `;
    },

    renderForecastRows(location, months) {
        const classrooms = Data.getClassroomsByLocation(location);
        if (!classrooms || classrooms.length === 0) {
            return `<tr><td colspan="5" style="text-align:center; color:var(--neutral-400); padding:16px;">No classrooms configured for this location.</td></tr>`;
        }
        let rows = '';

        months.forEach((month, monthIndex) => {
            classrooms.forEach((classroom, classIndex) => {
                const capacity = Data.getClassroomCapacity(classroom.id);
                if (!capacity) return; // skip if classroom ID not found

                // check for override
                const override = Data.getClassroomCapacityOverride(classroom.id, month.label);
                const totalSpots = override !== undefined ? override : classroom.maxCapacity;
                const available = totalSpots - capacity.filled;

                const rowStyle = this.getRowColor(monthIndex);

                rows += `
                    <tr style="background: ${rowStyle};">
                        ${classIndex === 0 ? `<td rowspan="${classrooms.length}" style="font-weight: 600; background: ${rowStyle};">${month.label.split(' ')[0]}</td>` : ''}
                        <td>${classroom.name}</td>
                        <td>${totalSpots}</td>
                        <td>${capacity.filled}</td>
                        <td style="font-weight: 600; color: ${available > 0 ? 'var(--success)' : 'var(--error)'};">
                            ${available}
                        </td>
                    </tr>
    `;
            });
        });

        return rows || `<tr><td colspan="5" style="text-align:center; color:var(--neutral-400); padding:16px;">No data available.</td></tr>`;
    },

    getRowColor(index) {
        const colors = [
            '#FEF3C7', // Yellow
            '#FED7AA', // Orange light
            '#FECACA', // Red light
            '#E9D5FF', // Purple light
            '#FBCFE8', // Pink light
            '#BFDBFE', // Blue light
            '#BBF7D0', // Green light
            '#DDD6FE'  // Violet light
        ];
        return colors[index % colors.length];
    },

    updateCapacity(classroomId, monthLabel, capacity) {
        Data.saveClassroomCapacityOverride(classroomId, monthLabel, capacity);
        this.render();
    }
};
