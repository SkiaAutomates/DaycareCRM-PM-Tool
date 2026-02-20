/**
 * Day Care CRM - Attendance Module
 * Handles daily check-ins and check-outs for children.
 */

const Attendance = {
    currentDate: new Date().toISOString().split('T')[0],
    currentLocation: '',
    currentClassroom: '',
    showAll: false,          // When true, ignore schedule-day filter
    roster: [],
    attendanceData: {}, // Map of childId -> attendance record

    init() {
        const dateInput = document.getElementById('attendanceDate');
        dateInput.value = this.currentDate;

        dateInput.addEventListener('change', (e) => {
            this.currentDate = e.target.value;
            this.loadAttendanceData();
        });

        document.getElementById('attendanceLocationFilter').addEventListener('change', (e) => {
            this.currentLocation = e.target.value;
            this.updateClassroomDropdown();
            this.loadRoster();
        });

        document.getElementById('attendanceClassroomFilter').addEventListener('change', (e) => {
            this.currentClassroom = e.target.value;
            // Show toggle only when a classroom is actually selected
            const wrap = document.getElementById('showAllToggleWrap');
            if (wrap) wrap.style.display = e.target.value ? 'flex' : 'none';
            this.loadRoster();
        });

        this.populateLocationDropdown();
    },

    populateLocationDropdown() {
        const select = document.getElementById('attendanceLocationFilter');
        select.innerHTML = '<option value="">Select Location...</option>';
        Data.getLocations().forEach(loc => {
            select.innerHTML += `<option value="${loc}">${loc}</option>`;
        });
    },

    toggleShowAll(checked) {
        this.showAll = checked;
        // Update pill style to reflect active state
        const wrap = document.getElementById('showAllToggleWrap');
        if (wrap) {
            wrap.style.background = checked ? 'var(--primary-50)' : 'var(--neutral-100)';
            wrap.style.borderColor = checked ? 'var(--primary-400)' : 'var(--neutral-200)';
            wrap.style.color = checked ? 'var(--primary-700)' : 'var(--neutral-600)';
        }
        this.loadRoster();
    },

    updateClassroomDropdown() {
        const select = document.getElementById('attendanceClassroomFilter');
        select.innerHTML = '<option value="">Select Classroom...</option>';

        if (!this.currentLocation) return;

        const classrooms = Data.getClassroomsByLocation(this.currentLocation);
        classrooms.forEach(cr => {
            select.innerHTML += `<option value="${cr.id}">${cr.name}</option>`;
        });
    },

    async loadRoster() {
        const container = document.getElementById('attendanceContent');

        if (!this.currentLocation || !this.currentClassroom) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">✋</div>
                    <h3>Select a Location and Classroom</h3>
                    <p>Choose a classroom above to take attendance for today.</p>
                </div>`;
            return;
        }

        container.innerHTML = `<div style="text-align:center; padding: 40px;">Loading roster...</div>`;

        // Get the specific day of the week
        const parts = this.currentDate.split('-');
        const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[dateObj.getDay()];

        // Filter valid enrolled students for this classroom
        const allChildren = Data.getChildren();
        const allSchedules = typeof Data.getSchedules === 'function' ? Data.getSchedules() : [];

        this.roster = allChildren.filter(c => {
            if (c.location !== this.currentLocation ||
                (c.classroomId !== this.currentClassroom && c.classroom !== this.currentClassroom) ||
                c.status !== 'Enrolled') {
                return false;
            }

            // If "Show All Enrolled" is toggled on, skip schedule-day check
            if (this.showAll) return true;

            // Check if expected today based on schedule
            if (c.scheduleType === 'Full Time') return true;

            const childSchedules = allSchedules.filter(s => s.childId === c.id);
            childSchedules.sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));
            const activeSchedule = childSchedules[0];

            if (activeSchedule && activeSchedule.daysOfWeek) {
                let days = [];
                try {
                    days = (typeof activeSchedule.daysOfWeek === 'string' ? JSON.parse(activeSchedule.daysOfWeek) : activeSchedule.daysOfWeek) || [];
                } catch (e) {
                    // Try splitting by comma if it's a comma separated string
                    if (typeof activeSchedule.daysOfWeek === 'string') {
                        days = activeSchedule.daysOfWeek.split(',').map(d => d.trim());
                    }
                }

                return Array.isArray(days) && days.some(d => dayName.toLowerCase().startsWith(d.toLowerCase().substring(0, 3)));
            }

            // If part time and no schedule recorded, exclude for safety or include. Let's exclude.
            return false;
        });

        // Sort alphabetically by first name
        this.roster.sort((a, b) => {
            const nameA = a.childFirstName || a.firstName || '';
            const nameB = b.childFirstName || b.firstName || '';
            return nameA.localeCompare(nameB);
        });

        await this.loadAttendanceData();
    },

    async loadAttendanceData() {
        if (!this.currentLocation || !this.currentClassroom || this.roster.length === 0) {
            this.render();
            return;
        }

        try {
            // Fetch from Supabase
            // Note: If Supabase fails or not configured, fall back to local storage map for MVP
            const records = await Supabase.request('attendance', 'GET', null, `?date=eq.${this.currentDate}`);

            this.attendanceData = {};
            if (records && records.length > 0) {
                records.forEach(r => {
                    this.attendanceData[r.child_id] = r;
                });
            } else {
                // Fallback local storage for offline/testing if Supabase strictly not enabled
                const local = JSON.parse(localStorage.getItem('dc_attendance') || '{}');
                if (local[this.currentDate]) {
                    this.attendanceData = local[this.currentDate];
                }
            }
        } catch (e) {
            console.warn("Could not fetch attendance from DB:", e);
        }

        this.render();
    },

    async markStatus(childId, status) {
        let record = this.attendanceData[childId] || { child_id: childId, date: this.currentDate };

        record.status = status;

        // Auto check-in time for present
        if (status === 'Present' && !record.check_in_time) {
            record.check_in_time = new Date().toISOString();
        } else if (status !== 'Present') {
            record.check_in_time = null;
            record.check_out_time = null;
        }

        record.recorded_by = Auth.currentUser ? Auth.currentUser.name : 'System';

        this.attendanceData[childId] = record;

        // Optimitic UI update
        this.render();

        // Save to DB
        this.saveRecord(record);
    },

    async checkOut(childId) {
        let record = this.attendanceData[childId];
        if (!record || record.status !== 'Present') return;

        record.check_out_time = new Date().toISOString();
        this.attendanceData[childId] = record;
        this.render();
        this.saveRecord(record);
    },

    async markAllPresent() {
        if (this.roster.length === 0) {
            Utils.showToast('No students on the roster. Select a classroom first.', 'error');
            return;
        }

        Utils.showToast(`Marking all ${this.roster.length} students as Present...`, 'info');

        for (const child of this.roster) {
            await this.markStatus(child.id, 'Present');
        }

        Utils.showToast(`✅ ${this.roster.length} students marked Present!`, 'success');
    },

    async saveRecord(record) {
        // ALWAYS write to localStorage first — guaranteed persistence
        // regardless of whether Supabase is available or the table exists
        try {
            const local = JSON.parse(localStorage.getItem('dc_attendance') || '{}');
            const dateKey = record.date || this.currentDate;
            if (!local[dateKey]) local[dateKey] = {};
            local[dateKey][record.child_id] = record;
            localStorage.setItem('dc_attendance', JSON.stringify(local));
        } catch (localErr) {
            console.error('localStorage write failed:', localErr);
        }

        // Then attempt Supabase sync as a secondary (fire and forget, don't block UI)
        try {
            if (record.id) {
                const updated = await Supabase.update('attendance', record.id, record);
                if (!updated) console.warn('Supabase update returned null for attendance record');
            } else {
                const inserted = await Supabase.insert('attendance', record);
                if (inserted && inserted.id) {
                    // Store the DB id so future updates go to the right row
                    this.attendanceData[record.child_id] = {
                        ...this.attendanceData[record.child_id],
                        id: inserted.id
                    };
                    // Also update localStorage with the id
                    const local = JSON.parse(localStorage.getItem('dc_attendance') || '{}');
                    const dateKey = record.date || this.currentDate;
                    if (local[dateKey] && local[dateKey][record.child_id]) {
                        local[dateKey][record.child_id].id = inserted.id;
                        localStorage.setItem('dc_attendance', JSON.stringify(local));
                    }
                }
            }
        } catch (e) {
            // Supabase failed — localStorage already has the record, so this is fine
            console.warn('Supabase sync failed for attendance (localStorage has it):', e.message);
        }
    },


    formatTime(isoString) {
        if (!isoString) return '';
        const d = new Date(isoString);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },

    // =========================================================================
    // SUB-TAB SWITCHING
    // =========================================================================

    switchSubTab(tab) {
        const isHistory = tab === 'history';

        // Toggle panels
        document.getElementById('att-panel-daily').style.display = isHistory ? 'none' : 'block';
        document.getElementById('att-panel-history').style.display = isHistory ? 'block' : 'none';

        // Toggle header actions
        document.getElementById('attendanceDailyActions').style.display = isHistory ? 'none' : 'flex';
        document.getElementById('attendanceHistoryActions').style.display = isHistory ? 'flex' : 'none';

        // Update title
        document.getElementById('attendanceTabTitle').textContent = isHistory ? 'Attendance History' : 'Daily Attendance';

        // Style buttons
        const dailyBtn = document.getElementById('att-sub-daily');
        const historyBtn = document.getElementById('att-sub-history');

        dailyBtn.style.color = isHistory ? 'var(--neutral-500)' : 'var(--primary-700)';
        dailyBtn.style.borderBottom = isHistory ? '3px solid transparent' : '3px solid var(--primary-500)';
        historyBtn.style.color = isHistory ? 'var(--primary-700)' : 'var(--neutral-500)';
        historyBtn.style.borderBottom = isHistory ? '3px solid var(--primary-500)' : '3px solid transparent';

        // Populate history filters on first switch
        if (isHistory) this.populateHistoryFilters();
    },

    populateHistoryFilters() {
        // Location dropdown
        const locSel = document.getElementById('historyLocationFilter');
        if (locSel.options.length <= 1) {
            Data.getLocations().forEach(loc => {
                locSel.innerHTML += `<option value="${loc}">${loc}</option>`;
            });
        }

        // Classroom dropdown
        const crSel = document.getElementById('historyClassroomFilter');
        if (crSel.options.length <= 1) {
            Data.getClassrooms().forEach(cr => {
                crSel.innerHTML += `<option value="${cr.id}">${cr.name}</option>`;
            });
        }

        // Default date range: last 7 days
        const today = new Date();
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 6);
        document.getElementById('historyDateTo').value = today.toISOString().split('T')[0];
        document.getElementById('historyDateFrom').value = weekAgo.toISOString().split('T')[0];

        // Location filter → update classroom dropdown
        document.getElementById('historyLocationFilter').addEventListener('change', () => {
            const loc = document.getElementById('historyLocationFilter').value;
            const crSel2 = document.getElementById('historyClassroomFilter');
            crSel2.innerHTML = '<option value="">All Classrooms</option>';
            const classrooms = loc ? Data.getClassroomsByLocation(loc) : Data.getClassrooms();
            classrooms.forEach(cr => {
                crSel2.innerHTML += `<option value="${cr.id}">${cr.name}</option>`;
            });
        });
    },

    // =========================================================================
    // HISTORY VIEW
    // =========================================================================

    async loadHistory() {
        const container = document.getElementById('historyContent');
        const dateFrom = document.getElementById('historyDateFrom').value;
        const dateTo = document.getElementById('historyDateTo').value;
        const crId = document.getElementById('historyClassroomFilter').value;
        const loc = document.getElementById('historyLocationFilter').value;

        if (!dateFrom || !dateTo) {
            Utils.showToast('Please select a date range', 'error');
            return;
        }
        if (dateFrom > dateTo) {
            Utils.showToast('"From" date must be before "To" date', 'error');
            return;
        }

        container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--neutral-500);"><i class="fas fa-spinner fa-spin fa-2x"></i><p style="margin-top:12px;">Loading history...</p></div>';

        try {
            // 1. Try fetching from Supabase
            let query = `?date=gte.${dateFrom}&date=lte.${dateTo}&order=date.asc`;
            let supabaseRecords = [];
            try {
                supabaseRecords = await Supabase.request('attendance', 'GET', null, query) || [];
            } catch (e) {
                console.warn('Supabase attendance fetch failed, using localStorage only:', e.message);
            }

            // 2. Always also read localStorage (fallback + offline saves)
            const local = JSON.parse(localStorage.getItem('dc_attendance') || '{}');
            const localRecords = [];
            Object.keys(local).forEach(date => {
                if (date >= dateFrom && date <= dateTo) {
                    Object.values(local[date]).forEach(r => {
                        localRecords.push({ ...r, date });
                    });
                }
            });

            // 3. Merge: Supabase wins on duplicates (keyed by child_id+date)
            const mergedMap = {};
            localRecords.forEach(r => {
                const key = `${r.child_id}__${r.date}`;
                mergedMap[key] = r;
            });
            supabaseRecords.forEach(r => {
                const key = `${r.child_id}__${r.date}`;
                mergedMap[key] = r; // Supabase overwrites local if both exist
            });
            const records = Object.values(mergedMap);

            // 4. Filter children
            let children = Data.getChildren().filter(c => c.status === 'Enrolled');
            if (loc) children = children.filter(c => c.location === loc);
            if (crId) children = children.filter(c => c.classroomId === crId || c.classroom === crId);

            if (records.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📭</div>
                        <h3>No Records Found</h3>
                        <p>No attendance was recorded for this range. Try selecting a different date range.</p>
                    </div>`;
                return;
            }

            this.renderHistory(records, children, dateFrom, dateTo, crId);

        } catch (e) {
            console.error('History load error:', e);
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <h3>Error loading history</h3>
                    <p>${e.message}</p>
                </div>`;
        }
    },

    renderHistory(records, children, dateFrom, dateTo, crId = '') {
        const container = document.getElementById('historyContent');

        // Build list of dates in range
        const dates = [];
        let cur = new Date(dateFrom + 'T00:00:00');
        const end = new Date(dateTo + 'T00:00:00');
        while (cur <= end) {
            const d = cur.toISOString().split('T')[0];
            const dow = cur.getDay();
            if (dow !== 0 && dow !== 6) dates.push(d); // weekdays only
            cur.setDate(cur.getDate() + 1);
        }

        // Build lookup: date → childId → record
        const lookup = {};
        records.forEach(r => {
            if (!lookup[r.date]) lookup[r.date] = {};
            lookup[r.date][r.child_id] = r;
        });

        // Build child lookup from Data
        const childMap = {};
        Data.getChildren().forEach(c => { childMap[c.id] = c; });

        // Per-child summary stats
        // Collect unique child ids from records that match our filter
        const childrenInRecords = new Set(records.map(r => r.child_id));
        const displayChildren = children.length > 0
            ? children
            : [...childrenInRecords].map(id => childMap[id]).filter(Boolean);

        const statusColor = { Present: '#16a34a', Absent: '#dc2626', Excused: '#d97706' };
        const statusBg = { Present: '#f0fdf4', Absent: '#fef2f2', Excused: '#fffbeb' };

        // ---- Summary cards per child ----
        const summaryRows = displayChildren.map(child => {
            let p = 0, a = 0, e = 0;
            dates.forEach(d => {
                const rec = lookup[d] && lookup[d][child.id];
                if (!rec) return;
                if (rec.status === 'Present') p++;
                else if (rec.status === 'Absent') a++;
                else if (rec.status === 'Excused') e++;
            });
            const total = p + a + e;
            const pct = total > 0 ? Math.round((p / total) * 100) : null;
            const pctColor = pct === null ? '#94a3b8' : pct >= 90 ? '#16a34a' : pct >= 75 ? '#d97706' : '#dc2626';
            return { child, p, a, e, total, pct, pctColor };
        }).filter(r => r.total > 0);

        // ---- Date headers for the table ----
        const dateHeaders = dates.map(d => {
            const dt = new Date(d + 'T00:00:00');
            const dayLabel = dt.toLocaleDateString('en-US', { weekday: 'short' });
            const dateLabel = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return `<th style="text-align:center;padding:6px 8px;min-width:70px;font-size:0.8em;font-weight:700;white-space:nowrap;">${dayLabel}<br><span style="font-weight:400;color:var(--neutral-500);">${dateLabel}</span></th>`;
        }).join('');

        // ---- Build table body (grouped by classroom if All Classrooms selected) ----
        let bodyRows = '';

        if (!crId) {
            // Group by classroom
            const classrooms = Data.getClassrooms().filter(cr => {
                const loc = document.getElementById('historyLocationFilter').value;
                return !loc || cr.location === loc;
            });

            classrooms.forEach(cr => {
                const crChildren = summaryRows.filter(({ child }) =>
                    child.classroomId === cr.id || child.classroom === cr.id || child.classroom === cr.name
                );
                if (crChildren.length === 0) return;

                // Classroom header row
                bodyRows += `
                    <tr>
                        <td colspan="${dates.length + 2}"
                            style="padding:8px 14px;font-weight:700;font-size:0.82em;letter-spacing:0.05em;
                                   text-transform:uppercase;background:var(--primary-600);color:white;
                                   border-top:2px solid var(--primary-700);">
                            🏫 ${cr.name}
                            <span style="font-weight:400;opacity:0.8;margin-left:8px;">${crChildren.length} student${crChildren.length !== 1 ? 's' : ''}</span>
                        </td>
                    </tr>`;

                crChildren.forEach(({ child, pct, pctColor }) => {
                    const cells = dates.map(d => {
                        const rec = lookup[d] && lookup[d][child.id];
                        if (!rec) return `<td style="text-align:center;padding:6px;background:var(--neutral-50);">—</td>`;
                        const s = rec.status;
                        const short = s === 'Present' ? 'P' : s === 'Absent' ? 'A' : 'E';
                        return `<td style="text-align:center;padding:6px;background:${statusBg[s]};color:${statusColor[s]};font-weight:700;font-size:0.85em;">${short}</td>`;
                    }).join('');
                    const name = `${child.childFirstName || child.firstName || ''} ${child.childLastName || child.lastName || ''}`.trim();
                    bodyRows += `
                        <tr>
                            <td style="padding:8px 12px;font-weight:600;white-space:nowrap;border-right:1px solid var(--neutral-200);">${name}</td>
                            ${cells}
                            <td style="text-align:center;padding:8px;font-weight:700;color:${pctColor};border-left:1px solid var(--neutral-200);">${pct !== null ? pct + '%' : '—'}</td>
                        </tr>`;
                });
            });

            // Any students not matched to a known classroom
            const assignedIds = new Set(
                classrooms.flatMap(cr => summaryRows
                    .filter(({ child }) => child.classroomId === cr.id || child.classroom === cr.id || child.classroom === cr.name)
                    .map(({ child }) => child.id)
                )
            );
            const unassigned = summaryRows.filter(({ child }) => !assignedIds.has(child.id));
            if (unassigned.length > 0) {
                bodyRows += `<tr><td colspan="${dates.length + 2}" style="padding:8px 14px;font-weight:700;font-size:0.82em;background:var(--neutral-500);color:white;">📋 Unassigned</td></tr>`;
                unassigned.forEach(({ child, pct, pctColor }) => {
                    const cells = dates.map(d => {
                        const rec = lookup[d] && lookup[d][child.id];
                        if (!rec) return `<td style="text-align:center;padding:6px;background:var(--neutral-50);">—</td>`;
                        const s = rec.status;
                        const short = s === 'Present' ? 'P' : s === 'Absent' ? 'A' : 'E';
                        return `<td style="text-align:center;padding:6px;background:${statusBg[s]};color:${statusColor[s]};font-weight:700;font-size:0.85em;">${short}</td>`;
                    }).join('');
                    const name = `${child.childFirstName || child.firstName || ''} ${child.childLastName || child.lastName || ''}`.trim();
                    bodyRows += `
                        <tr>
                            <td style="padding:8px 12px;font-weight:600;white-space:nowrap;border-right:1px solid var(--neutral-200);">${name}</td>
                            ${cells}
                            <td style="text-align:center;padding:8px;font-weight:700;color:${pctColor};border-left:1px solid var(--neutral-200);">${pct !== null ? pct + '%' : '—'}</td>
                        </tr>`;
                });
            }
        } else {
            // Single classroom — flat list (original behaviour)
            bodyRows = summaryRows.map(({ child, pct, pctColor }) => {
                const cells = dates.map(d => {
                    const rec = lookup[d] && lookup[d][child.id];
                    if (!rec) return `<td style="text-align:center;padding:6px;background:var(--neutral-50);">—</td>`;
                    const s = rec.status;
                    const short = s === 'Present' ? 'P' : s === 'Absent' ? 'A' : 'E';
                    return `<td style="text-align:center;padding:6px;background:${statusBg[s]};color:${statusColor[s]};font-weight:700;font-size:0.85em;">${short}</td>`;
                }).join('');
                const name = `${child.childFirstName || child.firstName || ''} ${child.childLastName || child.lastName || ''}`.trim();
                return `
                    <tr>
                        <td style="padding:8px 12px;font-weight:600;white-space:nowrap;border-right:1px solid var(--neutral-200);">${name}</td>
                        ${cells}
                        <td style="text-align:center;padding:8px;font-weight:700;color:${pctColor};border-left:1px solid var(--neutral-200);">${pct !== null ? pct + '%' : '—'}</td>
                    </tr>`;
            }).join('');
        }

        if (summaryRows.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <h3>No matching records</h3>
                    <p>No attendance records found for the selected filters and date range.</p>
                </div>`;
            return;
        }

        // Store for CSV export
        this._historyData = { summaryRows, dates, lookup, childMap, crId };

        container.innerHTML = `
            <!-- Summary Stats -->
            <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;">
                ${summaryRows.slice(0, 5).map(({ child, p, a, e, pct, pctColor }) => {
            const name = `${child.childFirstName || child.firstName || ''} ${child.childLastName || child.lastName || ''}`.trim();
            return `
                        <div style="background:white;border:1px solid var(--neutral-200);border-radius:10px;padding:12px 16px;min-width:150px;flex:1;">
                            <div style="font-weight:700;color:var(--secondary-800);margin-bottom:6px;font-size:0.9em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${name}</div>
                            <div style="font-size:1.4em;font-weight:800;color:${pctColor};">${pct !== null ? pct + '%' : '—'}</div>
                            <div style="font-size:0.75em;color:var(--neutral-500);margin-top:2px;">
                                <span style="color:#16a34a;">P:${p}</span>
                                <span style="color:#dc2626;margin:0 4px;">A:${a}</span>
                                <span style="color:#d97706;">E:${e}</span>
                            </div>
                        </div>`;
        }).join('')}
                ${summaryRows.length > 5 ? `<div style="display:flex;align-items:center;justify-content:center;min-width:80px;color:var(--neutral-500);font-size:0.85em;">+${summaryRows.length - 5} more<br>in table below</div>` : ''}
            </div>

            <!-- Day-by-day table -->
            <div style="overflow-x:auto;border-radius:10px;border:1px solid var(--neutral-200);">
                <table style="width:100%;border-collapse:collapse;background:white;font-size:0.9em;">
                    <thead style="background:var(--neutral-50);border-bottom:2px solid var(--neutral-200);">
                        <tr>
                            <th style="text-align:left;padding:10px 12px;min-width:160px;border-right:1px solid var(--neutral-200);">Student</th>
                            ${dateHeaders}
                            <th style="text-align:center;padding:6px 10px;border-left:1px solid var(--neutral-200);min-width:60px;">Rate</th>
                        </tr>
                    </thead>
                    <tbody>${bodyRows}</tbody>
                </table>
            </div>
            <div style="margin-top:10px;font-size:0.8em;color:var(--neutral-500);">
                <span style="color:#16a34a;font-weight:700;">P</span> = Present &nbsp;
                <span style="color:#dc2626;font-weight:700;">A</span> = Absent &nbsp;
                <span style="color:#d97706;font-weight:700;">E</span> = Excused &nbsp;
                <span>— = Not recorded</span>
            </div>
        `;
    },

    exportHistoryCSV() {
        const data = this._historyData;
        if (!data || !data.summaryRows) {
            Utils.showToast('Load history first before exporting', 'error');
            return;
        }

        const { summaryRows, dates, lookup, crId: savedCrId } = data;
        const dateFrom = document.getElementById('historyDateFrom').value;
        const dateTo = document.getElementById('historyDateTo').value;

        let csv = 'Student Name,' + dates.join(',') + ',Attendance Rate\n';

        const writeChild = (child, pct) => {
            const name = `"${child.childFirstName || child.firstName || ''} ${child.childLastName || child.lastName || ''}"`;
            const cells = dates.map(d => {
                const rec = lookup[d] && lookup[d][child.id];
                return rec ? rec.status[0] : '';
            });
            csv += [name, ...cells, pct !== null ? pct + '%' : ''].join(',') + '\n';
        };

        if (!savedCrId) {
            // Grouped by classroom
            const loc = document.getElementById('historyLocationFilter').value;
            const classrooms = Data.getClassrooms().filter(cr => !loc || cr.location === loc);
            const assignedIds = new Set();

            classrooms.forEach(cr => {
                const crRows = summaryRows.filter(({ child }) =>
                    child.classroomId === cr.id || child.classroom === cr.id || child.classroom === cr.name
                );
                if (crRows.length === 0) return;

                // Classroom separator row
                csv += `"--- ${cr.name} ---"` + ','.repeat(dates.length) + '\n';
                crRows.forEach(({ child, pct }) => { writeChild(child, pct); assignedIds.add(child.id); });
            });

            // Unassigned children
            const unassigned = summaryRows.filter(({ child }) => !assignedIds.has(child.id));
            if (unassigned.length > 0) {
                csv += `"--- Unassigned ---"` + ','.repeat(dates.length) + '\n';
                unassigned.forEach(({ child, pct }) => writeChild(child, pct));
            }
        } else {
            // Flat list (single classroom selected)
            summaryRows.forEach(({ child, pct }) => writeChild(child, pct));
        }

        const filename = `attendance_${dateFrom}_to_${dateTo}.csv`;

        // --- Primary: File System Access API (works on file:// AND https://) ---
        if (window.showSaveFilePicker) {
            window.showSaveFilePicker({
                suggestedName: filename,
                types: [{ description: 'CSV Files', accept: { 'text/csv': ['.csv'] } }]
            }).then(async (fileHandle) => {
                const writable = await fileHandle.createWritable();
                await writable.write(csv);
                await writable.close();
                Utils.showToast('✅ CSV saved!', 'success');
            }).catch((err) => {
                if (err.name !== 'AbortError') this._showCSVModal(csv, filename);
            });
            return;
        }

        // --- Fallback: Modal with copy + open-in-tab ---
        this._showCSVModal(csv, filename);
    },

    _showCSVModal(csv, filename) {
        const existing = document.getElementById('csvExportModal');
        if (existing) existing.remove();

        const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
        const modal = document.createElement('div');
        modal.id = 'csvExportModal';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;';
        modal.innerHTML = `
            <div style="background:white;border-radius:12px;padding:28px;max-width:640px;width:92%;box-shadow:0 20px 60px rgba(0,0,0,0.3);display:flex;flex-direction:column;gap:16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <h3 style="margin:0;font-size:1.1em;">📄 ${filename}</h3>
                    <button onclick="document.getElementById('csvExportModal').remove()" style="border:none;background:none;font-size:1.4em;cursor:pointer;color:#888;">✕</button>
                </div>
                <p style="margin:0;font-size:0.88em;color:#666;">
                    Your browser can't auto-save from a local file (Chrome <code>file://</code> restriction).<br>
                    <strong>Option A:</strong> Click <em>Copy to Clipboard</em> → paste into Notepad → Save as <code>${filename}</code><br>
                    <strong>Option B:</strong> Once deployed to Vercel, downloads will work automatically.
                </p>
                <textarea id="csvModalContent" style="height:180px;font-family:monospace;font-size:0.78em;border:1px solid #ddd;border-radius:6px;padding:10px;resize:vertical;width:100%;box-sizing:border-box;" readonly>${csv}</textarea>
                <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;">
                    <a href="${dataUri}" download="${filename}" style="padding:8px 18px;background:var(--primary-600);color:white;border-radius:6px;text-decoration:none;font-size:0.9em;font-weight:600;">
                        ⬇ Try Download
                    </a>
                    <button onclick="navigator.clipboard.writeText(document.getElementById('csvModalContent').value).then(()=>Utils.showToast('Copied!','success'))"
                        style="padding:8px 18px;background:var(--secondary-500);color:white;border:none;border-radius:6px;cursor:pointer;font-size:0.9em;font-weight:600;">
                        📋 Copy to Clipboard
                    </button>
                    <button onclick="document.getElementById('csvExportModal').remove()"
                        style="padding:8px 18px;border:1px solid #ddd;background:white;border-radius:6px;cursor:pointer;font-size:0.9em;">
                        Close
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('csvModalContent').select();
    },

    render() {
        const container = document.getElementById('attendanceContent');

        if (this.roster.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🙈</div>
                    <h3>No Active Students</h3>
                    <p>There are no enrolled students in this classroom.</p>
                </div>`;
            return;
        }

        let html = `
            <div class="data-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Student Name</th>
                            <th>Status (<span style="color:var(--success-500)">P</span> / <span style="color:var(--danger-500)">A</span> / <span style="color:var(--warning-500)">E</span>)</th>
                            <th>Check In</th>
                            <th>Check Out</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        this.roster.forEach(child => {
            const record = this.attendanceData[child.id];
            const status = record ? record.status : null;

            const btnClass = (tgt) => status === tgt ? `btn-${tgt.toLowerCase()}` : 'btn-outline';

            html += `
                <tr>
                    <td>
                        <div style="font-weight: 600;">${child.firstName || ''} ${child.lastName || ''}</div>
                    </td>
                    <td>
                        <div class="button-group" style="display: flex; gap: 5px;">
                            <button class="btn ${btnClass('Present')}" onclick="Attendance.markStatus('${child.id}', 'Present')" style="padding: 4px 10px;">Present</button>
                            <button class="btn ${btnClass('Absent')}" onclick="Attendance.markStatus('${child.id}', 'Absent')" style="padding: 4px 10px;">Absent</button>
                            <button class="btn ${btnClass('Excused')}" onclick="Attendance.markStatus('${child.id}', 'Excused')" style="padding: 4px 10px;">Excused</button>
                        </div>
                    </td>
                    <td>
                        ${record && record.check_in_time ?
                    `<span class="badge" style="background:var(--success-50); color:var(--success-700)">${this.formatTime(record.check_in_time)}</span>` :
                    '<span style="color:var(--neutral-400)">--</span>'}
                    </td>
                    <td>
                        ${status === 'Present' ?
                    (record.check_out_time ?
                        `<span class="badge" style="background:var(--neutral-100); color:var(--neutral-700)">${this.formatTime(record.check_out_time)}</span>` :
                        `<button class="btn btn-secondary" onclick="Attendance.checkOut('${child.id}')" style="padding: 4px 10px;">Check Out</button>`)
                    : '<span style="color:var(--neutral-400)">--</span>'
                }
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
            <style>
                .btn-present { background-color: var(--success-500); color: white; border-color: var(--success-500); }
                .btn-absent { background-color: var(--danger-500); color: white; border-color: var(--danger-500); }
                .btn-excused { background-color: var(--warning-500); color: white; border-color: var(--warning-500); }
            </style>
        `;

        container.innerHTML = html;
    }
};
