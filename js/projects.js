/**
 * Day Care CRM - Projects Module
 */

const Projects = {
    render() {
        const container = document.getElementById('projectsContent');
        const projects = Data.getProjects();
        // Active: 'In Progress'
        const activeProjects = projects.filter(p => p.status === 'In Progress');
        // Completed: 'Completed', 'Cancelled', 'Rescheduled'
        const completedProjects = projects.filter(p => ['Completed', 'Cancelled', 'Rescheduled'].includes(p.status));

        container.innerHTML = `
            <div class="tabs-inline" style="margin-bottom: var(--spacing-6);">
                <button class="btn btn-${this.currentView !== 'completed' ? 'primary' : 'secondary'}" onclick="Projects.showActive()">
                    Active (${activeProjects.length})
                </button>
                <button class="btn btn-${this.currentView === 'completed' ? 'primary' : 'secondary'}" onclick="Projects.showCompleted()">
                    Completed (${completedProjects.length})
                </button>
            </div>

            <div id="projectsList">
                ${this.currentView === 'completed'
                ? this.renderProjectsList(completedProjects)
                : this.renderProjectsList(activeProjects)}
            </div>
        `;
    },

    currentView: 'active',

    showActive() {
        this.currentView = 'active';
        this.render();
    },

    showCompleted() {
        this.currentView = 'completed';
        this.render();
    },

    renderProjectsList(projects) {
        if (!projects.length) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <h3>No projects found</h3>
                    <p>Create a new project to get started</p>
                </div>
            `;
        }

        return projects.map(project => this.renderProjectCard(project)).join('');
    },

    renderProjectCard(project) {
        const child = Data.getChildById(project.childId);
        const parent = project.parentIds && project.parentIds.length > 0 ? Data.getParentById(project.parentIds[0]) : null;

        // Safety checks for missing data (e.g. from partial sync)
        const tasks = project.tasks || [];
        const completedTasks = tasks.filter(t => t.completed).length;
        const totalTasks = tasks.length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return `
            <div class="project-card">
                <div class="project-header">
                    <div>
                        <span class="badge ${['Enrollment Inquiry', 'Scheduled Tour', 'Playdate', 'Waitlisted'].includes(project.type) ? 'badge-on-process' : 'badge-enrolled'}">
                            ${project.type || 'Unknown Type'}
                        </span>
                        <span class="project-title" style="margin-left: var(--spacing-2);">
                            ${project.childName || (child ? `${child.firstName} ${child.lastName}` : (project.parentName || (parent ? `${parent.firstName} ${parent.lastName}` : 'Unknown')))}
                        </span>
                        
                        <!-- Location Display -->
                        ${project.location ? `<div style="font-size: 0.85rem; color: var(--neutral-500); margin-top: 4px;">📍 ${project.location}</div>` : ''}

                        ${project.transitionCategory ? `<span class="project-meta"> - ${project.transitionCategory}</span>` : ''}
                        ${project.type === 'Scheduled Tour' && project.tourDate ? `<span class="project-meta"> - ${Utils.formatDate(project.tourDate)}</span>` : ''}
                        ${project.type === 'Playdate' ? (
                project.playdateDates && project.playdateDates.length
                    ? `<span class="project-meta"> - ${project.playdateDates.map(d => Utils.formatDate(d)).join(', ')}</span>`
                    : (project.playdateDate ? `<span class="project-meta"> - ${Utils.formatDate(project.playdateDate)}</span>` : '')
            ) : ''}
                    </div>
                    <div class="project-meta">
                        ${completedTasks}/${totalTasks} tasks • ${progress}% complete
                        ${project.status !== 'In Progress' && project.status !== 'Completed' ? `<br><span class="badge badge-drop-in">${project.status}</span>` : ''}
                    </div>
                </div>
                <div class="task-list">
                    ${tasks.map((task, index) => `
                        <div class="task-item">
                            <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                                 onclick="Projects.toggleTask('${project.id}', ${index})">
                                ${task.completed ? '✓' : ''}
                            </div>
                            <span class="task-name ${task.completed ? 'completed' : ''}">${task.name}</span>
                            ${task.completedAt ? `<small style="color: var(--neutral-400);">${Utils.formatDate(task.completedAt)}</small>` : ''}
                        </div>
                    `).join('')}
                </div>
                <div style="padding: var(--spacing-3) var(--spacing-5); border-top: 1px solid var(--neutral-100); display: flex; gap: var(--spacing-2);">
                    ${project.status === 'In Progress' ? `
                        <button class="btn btn-sm btn-success" onclick="Projects.completeProject('${project.id}')">Mark Complete</button>
                    ` : ''}
                    <!-- Removed Edit/Re-link Button -->
                    <button class="btn btn-sm btn-danger" onclick="Projects.deleteProject('${project.id}')">Delete</button>
                </div>
            </div>
        `;
    },

    showAddProjectModal() {
        const body = `
            <form id="projectTypeForm">
                <div class="form-group">
                    <label class="form-label">Project Type *</label>
                    <select class="form-select" name="type" required onchange="Projects.handleTypeChange()">
                        <option value="">Select Type</option>
                        <option value="Enrollment Inquiry">Enrollment Inquiry</option>
                        <option value="Scheduled Tour">Scheduled Tour</option>
                        <option value="Playdate">Playdate</option>
                        <option value="Transition">Transition</option>
                        <option value="Onboarding Families">Onboarding Families</option>
                        <option value="Offboarding Families">Offboarding Families</option>
                        <option value="Waitlisted">Waitlisted</option>
                    </select>
                </div>
                <div id="projectFormFields"></div>
            </form>
        `;
        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="Projects.saveProject()">Create Project</button>
        `;
        App.openModal('New Project', body, footer);
    },

    handleTypeChange() {
        const type = document.querySelector('[name="type"]').value;
        const fieldsContainer = document.getElementById('projectFormFields');

        if (type === 'Enrollment Inquiry') {
            fieldsContainer.innerHTML = this.getEnrollmentInquiryFields();
        } else if (type === 'Scheduled Tour') {
            fieldsContainer.innerHTML = this.getScheduledTourFields();
        } else if (type === 'Playdate') {
            fieldsContainer.innerHTML = this.getPlaydateFields();
        } else if (type === 'Transition') {
            fieldsContainer.innerHTML = this.getTransitionFields();
        } else if (type === 'Onboarding Families') {
            fieldsContainer.innerHTML = this.getOnboardingFields();
        } else if (type === 'Offboarding Families') {
            fieldsContainer.innerHTML = this.getOffboardingFields();
        } else if (type === 'Waitlisted') {
            fieldsContainer.innerHTML = this.getWaitlistedFields();
        } else {
            fieldsContainer.innerHTML = '';
        }
    },

    showEditProjectModal(projectId) {
        const project = Data.getProjectById(projectId);
        if (!project) return;

        const parents = Data.getParents();
        const children = Data.getChildren();

        const body = `
            <form id="editProjectForm">
                <input type="hidden" name="projectId" value="${projectId}">
                
                <div class="form-group" style="background: var(--neutral-50); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <label class="form-label" style="color: var(--neutral-600); font-weight: 700; margin-bottom: 8px; display: block;">Project Reference Data</label>
                    <div style="font-size: 0.9rem; line-height: 1.6;">
                        <div><strong>Type:</strong> ${project.type}</div>
                        ${project.tourDate ? `<div><strong>Tour Date:</strong> ${Utils.formatDate(project.tourDate, 'datetime')}</div>` : ''}
                        ${project.playdateDates && project.playdateDates.length
                ? `<div><strong>Playdate Dates:</strong> ${project.playdateDates.map(d => Utils.formatDate(d)).join(', ')}</div>`
                : (project.playdateDate ? `<div><strong>Playdate Date:</strong> ${Utils.formatDate(project.playdateDate)}</div>` : '')}
                        ${project.location ? `<div><strong>Location:</strong> ${project.location}</div>` : ''}
                        ${project.description ? `<div><strong>Description:</strong> ${project.description}</div>` : ''}
                        ${project.source ? `<div><strong>Source:</strong> ${project.source}</div>` : ''}
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Link to Parent *</label>
                    <select class="form-select" name="parentId" required>
                        <option value="">Select a parent...</option>
                        ${parents.map(p => `
                            <option value="${p.id}" ${project.parentIds && project.parentIds.includes(p.id) ? 'selected' : ''}>
                                ${p.firstName} ${p.lastName} (${p.email})
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Link to Child (Optional)</label>
                    <select class="form-select" name="childId">
                        <option value="">Select a child...</option>
                        ${children.map(c => `
                            <option value="${c.id}" ${project.childId === c.id ? 'selected' : ''}>
                                ${c.firstName} ${c.lastName}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Custom Display Names (Optional Fallback)</label>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Parent Name</label>
                            <input type="text" class="form-input" name="parentName" value="${project.parentName || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Child Name</label>
                            <input type="text" class="form-input" name="childName" value="${project.childName || ''}">
                        </div>
                    </div>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="Projects.updateProjectLinks('${projectId}')">Save Changes</button>
        `;

        App.openModal('Edit / Re-link Project', body, footer);
    },

    updateProjectLinks(projectId) {
        const form = document.getElementById('editProjectForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        const parent = Data.getParentById(data.parentId);
        const child = data.childId ? Data.getChildById(data.childId) : null;

        const updates = {
            parentIds: [data.parentId],
            childId: data.childId || null,
            parentName: data.parentName || (parent ? `${parent.firstName} ${parent.lastName}` : ''),
            childName: data.childName || (child ? `${child.firstName} ${child.lastName}` : '')
        };

        Data.updateProject(projectId, updates);
        Utils.showToast('Project updated successfully', 'success');
        App.closeModal();
        this.render();
    },

    updateProjectCategories(location) {
        const select = document.getElementById('projectCategorySelect');
        if (!select) return;

        if (!location) {
            select.innerHTML = '<option value="">Select Location First</option>';
            return;
        }

        const classrooms = Data.getClassroomsByLocation(location);

        if (classrooms.length === 0) {
            select.innerHTML = '<option value="">No classrooms found</option>';
            return;
        }

        select.innerHTML = '<option value="">Select Classroom</option>' +
            classrooms.map(c => `<option value="${c.name}">${c.name} (${c.ageCategory})</option>`).join('');
    },

    // ==========================================
    // Form Field Generators (CRM-Only Selection)
    // ==========================================

    updateEnrollmentChildDropdown(parentId) {
        const childSelect = document.getElementById('enrollmentChildSelect');
        if (!childSelect) return;

        const allChildren = Data.getChildren();

        // If no parent selected, reset to all children (or empty if preferred, but keeping all for flexibility)
        if (!parentId) {
            childSelect.innerHTML = '<option value="">Select a child...</option>' +
                allChildren.map(c => `<option value="${c.id}">${c.firstName} ${c.lastName}</option>`).join('');
            return;
        }

        const parent = Data.getParentById(parentId);
        if (!parent || !parent.childIds || parent.childIds.length === 0) {
            // Parent has no linked children, maybe clear or show all? 
            // Let's show "No linked children" or similar, or just keep all but unrelated?
            // User request: "populate the 'Select Child' dropdown". Implies showing linked ones.
            // If no linked children, maybe allow selecting any? 
            // Let's strictly filter to linked children as requested "automatically populate".
            // Actually, if they are enrolling a *new* child, they might not be linked yet.
            // But the dropdown is for "Select Child (Optional)".
            // So I will filter to linked children, but maybe add an option "Other / New"?
            // The prompt says: "that should automatically populate... Or if... more than one... only option... is the child that is link".
            // This strongly suggests strict filtering.

            childSelect.innerHTML = '<option value="">No linked children found</option>';
            // But wait, what if they want to link a NEW child or a different existing child?
            // The field is "Select Child (Optional)".
            // If I strict filter, they can't select an unlinked child.
            // However, "Enrollment Inquiry" might be for a new sibling.
            // If I strict filter, they might be blocked.
            // But the request is specific about "only option on the drop down is the child that is link".
            // I will follow the request for now: Filter to linked children.
            return;
        }

        // Filter children
        const linkedChildren = allChildren.filter(c => parent.childIds.includes(c.id));

        childSelect.innerHTML = '<option value="">Select a child...</option>' +
            linkedChildren.map(c => `<option value="${c.id}">${c.firstName} ${c.lastName}</option>`).join('');

        // Auto-select if only one
        if (linkedChildren.length === 1) {
            childSelect.value = linkedChildren[0].id;
        }
    },

    getEnrollmentInquiryFields() {
        const parents = Data.getParents();
        const children = Data.getChildren();
        return `
            <div class="form-group">
                <label class="form-label">Select Parent *</label>
                <select class="form-select" name="existingParentId" required onchange="Projects.updateEnrollmentChildDropdown(this.value)">
                    <option value="">Select a parent...</option>
                    ${parents.map(p => `<option value="${p.id}">${p.firstName} ${p.lastName} (${p.email || 'No email'})</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Select Child (Optional)</label>
                <select class="form-select" name="childId" id="enrollmentChildSelect">
                    <option value="">Select a child...</option>
                    ${children.map(c => `<option value="${c.id}">${c.firstName} ${c.lastName}</option>`).join('')}
                </select>
            </div>
            <div class="form-row form-row-3">
                <div class="form-group">
                    <label class="form-label">Preferred Location *</label>
                    <select class="form-select" name="location" required onchange="Projects.updateProjectCategories(this.value)">
                        <option value="">Select Location</option>
                        ${Data.getLocations().map(loc => `<option value="${loc}">${loc}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Classroom Preference</label>
                    <select class="form-select" name="category" id="projectCategorySelect">
                        <option value="">Select Location First</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Desired Start Date</label>
                    <input type="date" class="form-input" name="desiredStartDate">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Schedule Type</label>
                <select class="form-select" name="scheduleType" onchange="Projects.toggleEnrollmentSchedule()">
                    <option value="Full Time">Full Time</option>
                    <option value="Part Time">Part Time</option>
                    <option value="Drop-Ins">Drop-Ins</option>
                </select>
            </div>
            <div id="enrollmentDaysGroup" style="display: none;">
                <div class="form-group">
                    <label class="form-label">Select Days of the Week</label>
                    <div style="display: flex; gap: 15px; flex-wrap: wrap; padding: 10px 0;">
                        ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => `
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="checkbox" name="daysOfWeek" value="${day}"> ${day}
                            </label>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div id="enrollmentDropInGroup" style="display: none;">
                <div class="form-group">
                    <label class="form-label">Drop-In Dates</label>
                    <div id="dropInDatesContainer">
                        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
                            <input type="date" class="form-input" name="dropInDates" style="flex: 1;">
                        </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-secondary" onclick="Projects.addDropInDate()" style="margin-top: 4px;">
                        + Add Another Date
                    </button>
                </div>
            </div>
        `;
    },

    getScheduledTourFields() {
        const parents = Data.getParents();
        const sources = Data.TOUR_SOURCES;
        return `
            <div class="form-group">
                <label class="form-label">Select Parent *</label>
                <select class="form-select" name="existingParentId" required>
                    <option value="">Select a parent...</option>
                    ${parents.map(p => `<option value="${p.id}">${p.firstName} ${p.lastName} (${p.email || 'No email'})</option>`).join('')}
                </select>
            </div>
            <h4 style="margin: var(--spacing-4) 0;">Tour Details</h4>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Tour Date & Time *</label>
                    <input type="datetime-local" class="form-input" name="tourDate" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Location *</label>
                    <select class="form-select" name="location" required>
                        ${Data.getLocations().map(loc => `<option value="${loc}">${loc}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Source (Where did they hear about us?) *</label>
                <select class="form-select" name="source" required>
                    <option value="">Select Source</option>
                    ${sources.map(s => `<option value="${s}">${s}</option>`).join('')}
                </select>
            </div>
        `;
    },

    getPlaydateFields() {
        const children = Data.getChildren().filter(c => c.status === 'Enrolled');

        return `
            <div class="form-group">
                <label class="form-label">Select Child *</label>
                <select class="form-select" name="childId" required>
                    <option value="">Select a child...</option>
                    ${children.map(c => {
            const classroom = Data.getClassroomById(c.classroomId);
            return `<option value="${c.id}" data-location="${c.location}">
                                    ${c.firstName} ${c.lastName} - ${classroom ? classroom.name : 'No classroom'}
                                </option>`;
        }).join('')}
                </select>
            </div>
            <h4 style="margin: var(--spacing-4) 0;">Playdate Details</h4>
            
            <div class="form-group">
                <label class="form-label">Playdate Dates</label>
                <div id="playdateDatesContainer">
                    <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
                        <input type="date" class="form-input" name="playdateDate" style="flex: 1;" required>
                    </div>
                </div>
                <button type="button" class="btn btn-sm btn-secondary" onclick="Projects.addPlaydateDate()" style="margin-top: 4px;">
                    + Add Another Date
                </button>
            </div>

            <div class="form-group">
                <label class="form-label">Location *</label>
                <select class="form-select" name="location" required onchange="Projects.updateProjectCategories(this.value)">
                    <option value="">Select Location</option>
                    ${Data.getLocations().map(loc => `<option value="${loc}">${loc}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Category / Classroom</label>
                <select class="form-select" name="category" id="projectCategorySelect">
                    <option value="">Select Location First</option>
                </select>
            </div>
        `;
    },

    getTransitionFields() {
        const children = Data.getChildren().filter(c => c.status === 'Enrolled');

        return `
            <div class="form-group">
                <label class="form-label">Select Child *</label>
                <select class="form-select" name="childId" required onchange="Projects.detectTransitionCategory()">
                    <option value="">Select a child...</option>
                    ${children.map(c => {
            const classroom = Data.getClassroomById(c.classroomId);
            return `<option value="${c.id}" data-classroom="${c.classroomId}" data-location="${c.location}">
                            ${c.firstName} ${c.lastName} - ${classroom ? classroom.name : 'No classroom'}
                        </option>`;
        }).join('')}
                </select>
            </div>
            <div class="form-group" id="nextClassroomGroup" style="display: none;">
                <label class="form-label">Next Classroom *</label>
                <select class="form-select" name="nextClassroomId" id="nextClassroomSelect">
                    <option value="">Select next classroom...</option>
                </select>
            </div>
            <div id="transitionInfo"></div>
        `;
    },

    getOnboardingFields() {
        const parents = Data.getParents();

        return `
            <div class="form-group">
                <label class="form-label">Select Parent *</label>
                <select class="form-select" name="existingParentId" required>
                    <option value="">Select a parent...</option>
                    ${parents.map(p => `<option value="${p.id}">${p.firstName} ${p.lastName} (${p.email || 'No email'})</option>`).join('')}
                </select>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Onboarding Date *</label>
                    <input type="date" class="form-input" name="onboardingDate" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Location *</label>
                    <select class="form-select" name="location" required onchange="Projects.updateProjectCategories(this.value)">
                        <option value="">Select Location</option>
                        ${Data.getLocations().map(loc => `<option value="${loc}">${loc}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Category / Classroom</label>
                <select class="form-select" name="category" id="projectCategorySelect">
                     <option value="">Select Location First</option>
                </select>
            </div>
        `;
    },

    getOffboardingFields() {
        const parents = Data.getParents();

        return `
            <div class="form-group">
                <label class="form-label">Select Parent *</label>
                <select class="form-select" name="existingParentId" required>
                    <option value="">Select a parent...</option>
                    ${parents.map(p => `<option value="${p.id}">${p.firstName} ${p.lastName} (${p.email || 'No email'})</option>`).join('')}
                </select>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Offboarding Date *</label>
                    <input type="date" class="form-input" name="offboardingDate" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Location *</label>
                    <select class="form-select" name="location" required>
                        ${Data.getLocations().map(loc => `<option value="${loc}">${loc}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Reason</label>
                <select class="form-select" name="reason">
                    <option value="">Select Reason</option>
                    <option value="Aging Out">Aging Out</option>
                    <option value="Relocating">Relocating</option>
                    <option value="Switching Schools">Switching Schools</option>
                    <option value="Financial">Financial</option>
                    <option value="Other">Other</option>
                </select>
            </div>
        `;
    },

    getWaitlistedFields() {
        const parents = Data.getParents();

        return `
            <div class="form-group">
                <label class="form-label">Select Parent *</label>
                <select class="form-select" name="existingParentId" required>
                    <option value="">Select a parent...</option>
                    ${parents.map(p => `<option value="${p.id}">${p.firstName} ${p.lastName} (${p.email || 'No email'})</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Desired Start Date *</label>
                <input type="date" class="form-input" name="desiredStartDate" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Location *</label>
                    <select class="form-select" name="location" required>
                        ${Data.getLocations().map(loc => `<option value="${loc}">${loc}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Schedule Type *</label>
                    <select class="form-select" name="scheduleType" required onchange="Projects.toggleWaitlistDays()">
                        <option value="">Select Schedule</option>
                        <option value="FT">FT</option>
                        <option value="PT">PT</option>
                        <option value="ELFA FT">ELFA FT</option>
                        <option value="ELFA PT">ELFA PT</option>
                    </select>
                </div>
            </div>
            <div id="waitlistDaysGroup" style="display: none;">
                <div class="form-group">
                    <label class="form-label">Select Days of the Week</label>
                    <div style="display: flex; gap: 15px; flex-wrap: wrap; padding: 10px 0;">
                        ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => `
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="checkbox" name="daysOfWeek" value="${day}"> ${day}
                            </label>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    toggleWaitlistDays() {
        const scheduleType = document.querySelector('[name="scheduleType"]').value;
        const daysGroup = document.getElementById('waitlistDaysGroup');
        if (scheduleType === 'PT' || scheduleType === 'ELFA PT') {
            daysGroup.style.display = 'block';
        } else {
            daysGroup.style.display = 'none';
        }
    },

    toggleEnrollmentSchedule() {
        const scheduleType = document.querySelector('[name="scheduleType"]').value;
        const daysGroup = document.getElementById('enrollmentDaysGroup');
        const dropInGroup = document.getElementById('enrollmentDropInGroup');
        if (daysGroup) daysGroup.style.display = scheduleType === 'Part Time' ? 'block' : 'none';
        if (dropInGroup) dropInGroup.style.display = scheduleType === 'Drop-Ins' ? 'block' : 'none';
    },

    addDropInDate() {
        const container = document.getElementById('dropInDatesContainer');
        if (!container) return;
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; gap: 8px; align-items: center; margin-bottom: 8px;';
        row.innerHTML = `
            <input type="date" class="form-input" name="dropInDates" style="flex: 1;">
            <button type="button" class="btn-icon" onclick="this.parentElement.remove()" style="color: var(--error); font-size: 1.2rem;" title="Remove">&times;</button>
        `;
        container.appendChild(row);
    },

    addPlaydateDate() {
        const container = document.getElementById('playdateDatesContainer');
        if (!container) return;
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; gap: 8px; align-items: center; margin-bottom: 8px;';
        row.innerHTML = `
            <input type="date" class="form-input" name="playdateDate" style="flex: 1;">
            <button type="button" class="btn-icon" onclick="this.parentElement.remove()" style="color: var(--error); font-size: 1.2rem;" title="Remove">&times;</button>
        `;
        container.appendChild(row);
    },

    addPlaydateDate() {
        const container = document.getElementById('playdateDatesContainer');
        if (!container) return;
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; gap: 8px; align-items: center; margin-bottom: 8px;';
        row.innerHTML = `
            <input type="date" class="form-input" name="playdateDate" style="flex: 1;">
            <button type="button" class="btn-icon" onclick="this.parentElement.remove()" style="color: var(--error); font-size: 1.2rem;" title="Remove">&times;</button>
        `;
        container.appendChild(row);
    },

    // ==========================================
    // Transition Detection
    // ==========================================

    detectTransitionCategory() {
        const select = document.querySelector('[name="childId"]');
        const option = select.options[select.selectedIndex];
        const infoContainer = document.getElementById('transitionInfo');
        const classroomGroup = document.getElementById('nextClassroomGroup');
        const classroomSelect = document.getElementById('nextClassroomSelect');

        if (!option.value) {
            infoContainer.innerHTML = '';
            if (classroomGroup) classroomGroup.style.display = 'none';
            return;
        }

        const child = Data.getChildById(option.value);
        const currentClassroom = Data.getClassroomById(child.classroomId);

        if (!currentClassroom) {
            infoContainer.innerHTML = '<p style="color: var(--error);">Child is not assigned to a classroom</p>';
            if (classroomGroup) classroomGroup.style.display = 'none';
            return;
        }

        // Populate next-classroom dropdown with all classrooms from this location except current
        const classrooms = Data.getClassroomsByLocation(child.location);
        const currentIndex = classrooms.findIndex(c => c.id === currentClassroom.id);
        const autoNextClassroom = classrooms[currentIndex + 1];

        if (classroomGroup) classroomGroup.style.display = 'block';
        if (classroomSelect) {
            classroomSelect.innerHTML = '<option value="">Select next classroom...</option>' +
                classrooms
                    .filter(c => c.id !== currentClassroom.id)
                    .map(c => `<option value="${c.id}" ${autoNextClassroom && c.id === autoNextClassroom.id ? 'selected' : ''}>${c.name} (${c.ageCategory})</option>`)
                    .join('');
            classroomSelect.onchange = () => Projects.updateTransitionInfo(child, currentClassroom);
        }

        // Show info for auto-detected classroom
        this.updateTransitionInfo(child, currentClassroom);
    },

    updateTransitionInfo(child, currentClassroom) {
        const infoContainer = document.getElementById('transitionInfo');
        const classroomSelect = document.getElementById('nextClassroomSelect');
        const nextClassroomId = classroomSelect ? classroomSelect.value : null;

        if (!nextClassroomId) {
            infoContainer.innerHTML = `
                <div style="background: var(--info-bg); padding: var(--spacing-4); border-radius: var(--radius-md); margin-top: var(--spacing-4);">
                    <p><strong>Current:</strong> ${currentClassroom.name}</p>
                    <p style="color: var(--neutral-500); font-style: italic;">Select a next classroom above</p>
                </div>
            `;
            return;
        }

        const nextClassroom = Data.getClassroomById(nextClassroomId);
        const category = Utils.getTransitionCategory(currentClassroom.id, nextClassroom.id);
        const tasks = Utils.getTransitionTasks(category);

        infoContainer.innerHTML = `
            <div style="background: var(--info-bg); padding: var(--spacing-4); border-radius: var(--radius-md); margin-top: var(--spacing-4);">
                <p><strong>Current:</strong> ${currentClassroom.name}</p>
                <p><strong>Next:</strong> ${nextClassroom.name}</p>
                <p><strong>Category:</strong> ${category || 'Standard Transition'}</p>
                <p><strong>Tasks:</strong></p>
                <ul style="margin-left: var(--spacing-4);">
                    ${tasks.map(t => `<li>${t}</li>`).join('')}
                </ul>
            </div>
            <input type="hidden" name="transitionCategory" value="${category || ''}">
        `;
    },

    // ==========================================
    // Save Project (CRM-Only Flow)
    // ==========================================

    saveProject() {
        const form = document.getElementById('projectTypeForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        const type = data.type;

        // Collect daysOfWeek checkboxes (FormData only captures last value for same-name fields)
        const daysOfWeek = Array.from(form.querySelectorAll('input[name="daysOfWeek"]:checked')).map(cb => cb.value);

        let project;

        if (type === 'Enrollment Inquiry') {
            const parent = Data.getParentById(data.existingParentId);
            if (!parent) { Utils.showToast('Please select a parent', 'error'); return; }

            const child = data.childId ? Data.getChildById(data.childId) : null;

            // Collect drop-in dates
            const dropInDates = Array.from(form.querySelectorAll('input[name="dropInDates"]')).map(el => el.value).filter(v => v);

            const tasks = Utils.getEnrollmentTasks().map(name => ({
                id: Utils.generateId(),
                name,
                completed: false,
                completedAt: null
            }));

            project = Data.addProject({
                type: 'Enrollment Inquiry',
                parentIds: [parent.id],
                childId: child ? child.id : null,
                parentName: `${parent.firstName} ${parent.lastName}`,
                childName: child ? `${child.firstName} ${child.lastName}` : 'N/A',
                location: data.location,
                desiredStartDate: data.desiredStartDate || null,
                scheduleType: data.scheduleType || null,
                daysOfWeek: data.scheduleType === 'Part Time' ? daysOfWeek : [],
                dropInDates: data.scheduleType === 'Drop-Ins' ? dropInDates : [],
                transitionCategory: null,
                tasks,
                status: 'In Progress'
            });

        } else if (type === 'Scheduled Tour') {
            const parent = Data.getParentById(data.existingParentId);
            if (!parent) { Utils.showToast('Please select a parent', 'error'); return; }

            const tasks = [
                { id: Utils.generateId(), name: 'Send Confirmation Text Message', completed: false },
                { id: Utils.generateId(), name: 'Confirmed', completed: false },
                { id: Utils.generateId(), name: 'Toured', completed: false },
                { id: Utils.generateId(), name: 'Rescheduled', completed: false },
                { id: Utils.generateId(), name: 'Cancelled', completed: false }
            ];

            project = Data.addProject({
                type: 'Scheduled Tour',
                parentIds: [parent.id],
                parentName: `${parent.firstName} ${parent.lastName}`,
                location: data.location,
                description: `Tour Scheduled: ${Utils.formatDate(data.tourDate)}`,
                tourDate: data.tourDate,
                source: data.source,
                tasks,
                status: 'In Progress'
            });

        } else if (type === 'Playdate') {
            const child = Data.getChildById(data.childId);
            if (!child) { Utils.showToast('Please select a child', 'error'); return; }
            const parentIds = child.parentIds || [];

            const dates = formData.getAll('playdateDate').filter(d => d);
            const playdateIds = [];

            // Create a Playdate entry for each date
            dates.forEach(date => {
                const pd = Data.addPlaydate({
                    childId: child.id,
                    date: date,
                    location: data.location,
                    category: data.category || 'N/A',
                    status: 'Upcoming'
                });
                playdateIds.push(pd.id);
            });

            const tasks = [
                { id: Utils.generateId(), name: 'Schedule Playdate', completed: false },
                { id: Utils.generateId(), name: 'Confirm Attendance', completed: false },
                { id: Utils.generateId(), name: 'Complete Playdate', completed: false }
            ];

            project = Data.addProject({
                type: 'Playdate',
                parentIds: parentIds,
                childId: child.id,
                parentName: parentIds.map(pid => Data.getParentById(pid)).filter(p => p).map(p => `${p.firstName} ${p.lastName}`).join(', ') || 'Unknown',
                childName: `${child.firstName} ${child.lastName}`,
                location: data.location,
                description: `Playdate: ${dates.map(d => Utils.formatDate(d)).join(', ')}`,
                playdateDate: dates[0] || null,
                playdateDates: dates,
                playdateId: playdateIds[0] || null,
                playdateIds: playdateIds,
                category: data.category,
                tasks,
                status: 'In Progress'
            });

        } else if (type === 'Transition') {
            const child = Data.getChildById(data.childId);
            const category = data.transitionCategory;
            const tasks = Utils.getTransitionTasks(category).map(name => ({
                id: Utils.generateId(),
                name,
                completed: false,
                completedAt: null
            }));

            project = Data.addProject({
                type: 'Transition',
                parentIds: child.parentIds || [],
                childId: data.childId,
                parentName: child.parentIds ? child.parentIds.map(pid => Data.getParentById(pid)).filter(p => p).map(p => `${p.firstName} ${p.lastName}`).join(', ') : 'Unknown Parent',
                childName: `${child.firstName} ${child.lastName}`,
                location: child.location,
                transitionCategory: category,
                nextClassroomId: data.nextClassroomId,
                tasks,
                status: 'In Progress'
            });

        } else if (type === 'Onboarding Families') {
            const parent = Data.getParentById(data.existingParentId);
            if (!parent) { Utils.showToast('Please select a parent', 'error'); return; }

            // Add onboarding entry for reports AFTER project creation so we can link
            const onboardingTasks = [
                { id: Utils.generateId(), name: 'Complete enrollment paperwork', completed: false },
                { id: Utils.generateId(), name: 'Schedule orientation', completed: false },
                { id: Utils.generateId(), name: 'First day check-in', completed: false }
            ];

            project = Data.addProject({
                type: 'Onboarding Families',
                parentIds: [parent.id],
                parentName: `${parent.firstName} ${parent.lastName}`,
                location: data.location,
                description: `Onboarding: ${Utils.formatDate(data.onboardingDate)}`,
                category: data.category || null,
                tasks: onboardingTasks,
                status: 'In Progress'
            });

            Data.addOnboarding({
                type: 'Onboarding',
                parentId: parent.id,
                projectId: project.id,
                date: data.onboardingDate,
                location: data.location,
                category: data.category || null
            });

        } else if (type === 'Offboarding Families') {
            const parent = Data.getParentById(data.existingParentId);
            if (!parent) { Utils.showToast('Please select a parent', 'error'); return; }

            // Create project first, then link onboarding entry
            const offboardingTasks = [
                { id: Utils.generateId(), name: 'Notify classroom teachers', completed: false },
                { id: Utils.generateId(), name: 'Complete exit paperwork', completed: false },
                { id: Utils.generateId(), name: 'Final day farewell', completed: false }
            ];

            project = Data.addProject({
                type: 'Offboarding Families',
                parentIds: [parent.id],
                parentName: `${parent.firstName} ${parent.lastName}`,
                location: data.location,
                description: `Offboarding: ${Utils.formatDate(data.offboardingDate)}`,
                reason: data.reason || null,
                tasks: offboardingTasks,
                status: 'In Progress'
            });

            Data.addOnboarding({
                type: 'Offboarding',
                parentId: parent.id,
                projectId: project.id,
                date: data.offboardingDate,
                location: data.location,
                reason: data.reason || null
            });

        } else if (type === 'Waitlisted') {
            const parent = Data.getParentById(data.existingParentId);
            if (!parent) { Utils.showToast('Please select a parent', 'error'); return; }

            // Add waitlist entry
            const waitlistEntry = Data.addWaitlist ? Data.addWaitlist({
                parentId: parent.id,
                desiredStartDate: data.desiredStartDate,
                scheduleType: data.scheduleType,
                daysOfWeek: (data.scheduleType === 'PT' || data.scheduleType === 'ELFA PT') ? daysOfWeek : [],
                location: data.location,
                status: 'Active'
            }) : null;

            const tasks = [
                { id: Utils.generateId(), name: 'Follow up with family', completed: false },
                { id: Utils.generateId(), name: 'Confirm availability', completed: false },
                { id: Utils.generateId(), name: 'Begin enrollment process', completed: false }
            ];

            project = Data.addProject({
                type: 'Waitlisted',
                parentIds: [parent.id],
                parentName: `${parent.firstName} ${parent.lastName}`,
                location: data.location,
                description: `Waitlisted — Desired Start: ${Utils.formatDate(data.desiredStartDate)}, Schedule: ${data.scheduleType}`,
                desiredStartDate: data.desiredStartDate,
                scheduleType: data.scheduleType,
                daysOfWeek: daysOfWeek,
                waitlistId: waitlistEntry ? waitlistEntry.id : null,
                tasks,
                status: 'In Progress'
            });
        }

        Utils.showToast('Project created successfully', 'success');
        App.closeModal();
        this.render();
    },

    // ==========================================
    // Task Management & Project Lifecycle
    // ==========================================

    toggleTask(projectId, taskIndex) {
        const project = Data.getProjectById(projectId);
        if (!project) return;

        const task = project.tasks[taskIndex];
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;

        Data.updateProject(projectId, { tasks: project.tasks });

        // Check if all tasks are completed for Scheduled Tour
        if (project.type === 'Scheduled Tour') {
            const touredTask = project.tasks.find(t => t.name === 'Toured');
            const rescheduledTask = project.tasks.find(t => t.name === 'Rescheduled');
            const cancelledTask = project.tasks.find(t => t.name === 'Cancelled');

            // Status Priority: Cancelled > Rescheduled > Completed > In Progress
            if (cancelledTask && cancelledTask.completed) {
                Data.updateProject(projectId, { status: 'Cancelled' });
            } else if (rescheduledTask && rescheduledTask.completed) {
                Data.updateProject(projectId, { status: 'Rescheduled' });
            } else if (touredTask && touredTask.completed) {
                Data.updateProject(projectId, { status: 'Completed' });

                // Auto-create Enrollment Inquiry for the same parent (only if not already created/enrolled?)
                // Note: Original logic created it every time 'Toured' was checked. 
                // We should probably check if one exists, but adhering to existing logic for now.
                const child = Data.getChildById(project.childId);
                if (child && child.parentIds && child.parentIds.length > 0) {
                    const parent = Data.getParentById(child.parentIds[0]);

                    if (parent) {
                        // Check if Enrollment Inquiry already exists to avoid duplicates
                        const existingInquiry = Data.getProjects().find(p =>
                            p.type === 'Enrollment Inquiry' &&
                            p.childId === project.childId &&
                            p.status === 'In Progress'
                        );

                        if (!existingInquiry) {
                            const enrollmentTasks = Utils.getEnrollmentTasks().map(name => ({
                                id: Utils.generateId(),
                                name,
                                completed: false,
                                completedAt: null
                            }));

                            Data.addProject({
                                type: 'Enrollment Inquiry',
                                parentIds: [parent.id],
                                childId: child.id,
                                childName: `${child.firstName} ${child.lastName}`,
                                parentName: `${parent.firstName} ${parent.lastName}`,
                                location: project.location,
                                transitionCategory: null,
                                tasks: enrollmentTasks,
                                status: 'In Progress'
                            });

                            Utils.showToast('Enrollment Inquiry created automatically!', 'success');
                        }
                    }
                }
            } else {
                // Revert to In Progress if none of the terminal states are active
                Data.updateProject(projectId, { status: 'In Progress' });
            }
        }

        // Enrollment Inquiry Logic
        if (project.type === 'Enrollment Inquiry') {
            // 1. Handle Service Agreement Status
            if (task.name === 'Service Agreement Sent' && task.completed) {
                // Check if SA exists, if not create
                const child = Data.getChildById(project.childId);
                const existingSA = Data.getServiceAgreements().find(sa => sa.childId === project.childId);

                if (!existingSA) {
                    Data.addServiceAgreement({
                        childId: project.childId,
                        childName: child ? `${child.firstName} ${child.lastName}` : 'Unknown',
                        location: project.location,
                        sentDate: new Date().toISOString(),
                        status: 'Sent'
                    });
                } else {
                    Data.updateServiceAgreement(existingSA.id, {
                        status: 'Sent',
                        sentDate: new Date().toISOString()
                    });
                }
            } else if (task.name === 'Service Agreement Follow Up' && task.completed) {
                const existingSA = Data.getServiceAgreements().find(sa => sa.childId === project.childId);
                if (existingSA) {
                    Data.updateServiceAgreement(existingSA.id, { status: 'Followed-up' });
                }
            } else if (task.name === 'Service Agreement Signed' && task.completed) {
                const existingSA = Data.getServiceAgreements().find(sa => sa.childId === project.childId);
                if (existingSA) {
                    Data.updateServiceAgreement(existingSA.id, {
                        status: 'Signed',
                        signedDate: new Date().toISOString()
                    });
                }
            }

            // 2. Check for Auto-Completion (All tasks done)
            const allCompleted = project.tasks.every(t => t.completed);
            if (allCompleted) {
                this.completeProject(projectId);
            }
        }

        this.render();
    },

    completeProject(projectId) {
        const project = Data.getProjectById(projectId);
        if (!project) return;

        // If it's a transition, update the child's classroom
        if (project.type === 'Transition' && project.nextClassroomId) {
            const child = Data.getChildById(project.childId);
            if (child) {
                Data.updateChild(project.childId, {
                    classroomId: project.nextClassroomId,
                    lastTransitionDate: Utils.formatDateInput(new Date()),
                    nextTransitionDate: Utils.calculateNextTransitionDate(child.dateOfBirth, project.nextClassroomId)
                });
            }
        }

        // If it's enrollment, update status to Enrolled
        if (project.type === 'Enrollment Inquiry') {
            const child = Data.getChildById(project.childId);
            if (child) {
                Data.updateChild(project.childId, { status: 'Enrolled' });
                child.parentIds?.forEach(pid => {
                    Data.updateParent(pid, { status: 'Enrolled' });
                });
            }
        }

        // If it's a playdate, update the playdate status
        if (project.type === 'Playdate') {
            if (project.playdateIds && Array.isArray(project.playdateIds)) {
                project.playdateIds.forEach(id => Data.updatePlaydate(id, { status: 'Completed' }));
            } else if (project.playdateId) {
                Data.updatePlaydate(project.playdateId, { status: 'Completed' });
            }
        }

        Data.updateProject(projectId, { status: 'Completed' });
        Utils.showToast('Project completed!', 'success');
        App.refresh();
    },

    deleteProject(projectId) {
        if (confirm('Are you sure you want to delete this project?')) {
            const project = Data.getProjects().find(p => p.id === projectId);
            // Clean up linked onboarding/offboarding entry
            if (project && (project.type === 'Onboarding Families' || project.type === 'Offboarding Families')) {
                Data.deleteOnboardingByProjectId(projectId);
            }
            // Clean up linked playdates
            if (project && project.type === 'Playdate') {
                if (project.playdateIds && Array.isArray(project.playdateIds)) {
                    project.playdateIds.forEach(id => Data.deletePlaydate(id));
                } else if (project.playdateId) {
                    Data.deletePlaydate(project.playdateId);
                }
            }
            Data.deleteProject(projectId);
            Utils.showToast('Project deleted', 'success');
            this.render();
        }
    }
};
