/**
 * Day Care CRM - CRM Module
 */

const CRM = {
    render() {
        const container = document.getElementById('crmContent');
        const searchQuery = document.getElementById('crmSearch')?.value || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';
        const locationFilter = document.getElementById('locationFilter')?.value || '';
        const classroomFilter = document.getElementById('classroomFilter')?.value || '';

        // Populate Location Filter if empty (only has default option)
        const locationFilterEl = document.getElementById('locationFilter');
        if (locationFilterEl && locationFilterEl.options.length <= 1) {
            const currentVal = locationFilterEl.value;
            const locations = Data.getLocations();
            locationFilterEl.innerHTML = '<option value="">All Locations</option>';
            locations.forEach(loc => {
                const option = document.createElement('option');
                option.value = loc;
                option.textContent = loc;
                if (loc === currentVal) option.selected = true;
                locationFilterEl.appendChild(option);
            });
            // Re-bind listener if needed, but assuming existing listeners persist or are delegated
        }

        // Get and filter data
        let children = Data.getChildren();
        let parents = Data.getParents();

        // Sort alphabetically by first name
        children.sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));
        parents.sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matchingParents = parents.filter(p =>
                `${p.firstName} ${p.lastName}`.toLowerCase().includes(q)
            );
            const matchingChildren = children.filter(c =>
                `${c.firstName} ${c.lastName}`.toLowerCase().includes(q)
            );

            // Get children of matching parents
            const parentChildIds = matchingParents.flatMap(p =>
                children.filter(c => c.parentIds?.includes(p.id)).map(c => c.id)
            );

            // Get parents of matching children
            const childParentIds = matchingChildren.flatMap(c => c.parentIds || []);

            children = children.filter(c =>
                matchingChildren.some(mc => mc.id === c.id) || parentChildIds.includes(c.id)
            );
            parents = parents.filter(p =>
                matchingParents.some(mp => mp.id === p.id) || childParentIds.includes(p.id)
            );
        }

        if (statusFilter) {
            children = children.filter(c => c.status === statusFilter);
            parents = parents.filter(p => p.status === statusFilter);
        }

        if (locationFilter) {
            children = children.filter(c => c.location === locationFilter);

            // Filter parents: valid if ANY child is in this location
            // We need to check all children for each parent
            const allChildren = Data.getChildren();
            parents = parents.filter(p => {
                const parentChildren = allChildren.filter(c => c.parentIds && c.parentIds.includes(p.id));
                return parentChildren.some(c => c.location === locationFilter);
            });
        }

        if (classroomFilter) {
            if (classroomFilter === 'status_Inactive' || classroomFilter === 'status_Waitlisted') {
                const statusValue = classroomFilter.replace('status_', '');
                children = children.filter(c => c.status === statusValue);
                // Also filter parents to only those connected to matching children
                const matchingChildParentIds = new Set(children.flatMap(c => c.parentIds || []));
                // Also include parents with this status directly
                parents = parents.filter(p => p.status === statusValue || matchingChildParentIds.has(p.id));
            } else {
                children = children.filter(c => c.classroomId === classroomFilter);
            }
        }

        container.innerHTML = `
            <div class="tabs" style="display: flex; gap: 15px; margin-bottom: 20px;">
                <button 
                    class="btn ${this.activeTab === 'children' ? 'btn-primary' : 'btn-outline-primary'}" 
                    onclick="CRM.switchTab('children')"
                    style="${this.activeTab === 'children' ? 'background-color: var(--primary-600); border-color: var(--primary-600); color: white;' : 'color: var(--primary-600); border-color: var(--primary-600);'} padding: 10px 20px; font-weight: 600; min-width: 120px;"
                >
                    Children (${children.length})
                </button>
                <button 
                    class="btn ${this.activeTab === 'parents' ? 'btn-success' : 'btn-outline-success'}" 
                    onclick="CRM.switchTab('parents')"
                    style="${this.activeTab === 'parents' ? 'background-color: var(--secondary-500); border-color: var(--secondary-500); color: white;' : 'color: var(--secondary-500); border-color: var(--secondary-500);'} padding: 10px 20px; font-weight: 600; min-width: 120px;"
                >
                    Parents (${parents.length})
                </button>
            </div>

            ${this.activeTab === 'children' ? `
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Children (${children.length})</span>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Age</th>
                                    <th>DOB</th>
                                    <th>Location</th>
                                    <th>Classroom</th>
                                    <th>Status</th>
                                    <th>Schedule</th>
                                    <th>Next Transition</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${children.length ? children.map(child => this.renderChildRow(child)).join('') :
                    '<tr><td colspan="9" class="empty-state">No children found</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : ''}

            ${this.activeTab === 'parents' ? `
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Parents (${parents.length})</span>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Children</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${parents.length ? parents.map(parent => this.renderParentRow(parent)).join('') :
                    '<tr><td colspan="6" class="empty-state">No parents found</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : ''}
        `;
    },

    activeTab: 'children', // Default tab

    switchTab(tabName) {
        this.activeTab = tabName;
        this.render();
    },

    renderChildRow(child) {
        const classroom = Data.getClassrooms().find(c => c.id === child.classroomId);
        const age = Utils.calculateAge(child.dateOfBirth);

        return `
            <tr>
                <td><strong>${child.firstName} ${child.lastName}</strong>${child.isElfa ? ' <span class="badge-elfa">ELFA</span>' : ''}</td>
                <td>${age.display}</td>
                <td>${Utils.formatDate(child.dateOfBirth)}</td>
                <td><span class="location-badge ${Utils.getLocationColor(child.location)}">${child.location}</span></td>
                <td>${classroom ? classroom.name : '-'}</td>
                <td><span class="badge ${Utils.getStatusBadgeClass(child.status)}">${child.status}</span></td>
                <td>${child.scheduleType || '-'}</td>
                <td>${(child.nextTransitionDate || Utils.calculateNextTransitionDate(child.dateOfBirth, child.classroomId)) ? Utils.formatDate(child.nextTransitionDate || Utils.calculateNextTransitionDate(child.dateOfBirth, child.classroomId)) : '-'}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="CRM.viewChild('${child.id}')">View</button>
                    <button class="btn btn-sm btn-secondary" onclick="CRM.editChild('${child.id}')">Edit</button>
                </td>
            </tr>
        `;
    },

    renderParentRow(parent) {
        const children = Data.getChildrenByParent(parent.id);
        const childNames = children.map(c => c.firstName).join(', ') || '-';
        const statusClass = Utils.getStatusBadgeClass(parent.status);

        return `
            <tr>
                <td><strong>${parent.firstName} ${parent.lastName}</strong></td>
                <td>${parent.email || ''}</td>
                <td>${parent.phone || ''}</td>
                <td>${childNames}</td>
                <td><span class="badge ${statusClass}">${parent.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="CRM.viewParent('${parent.id}')">View</button>
                    <button class="btn btn-sm btn-secondary" onclick="CRM.editParent('${parent.id}')">Edit</button>
                </td>
            </tr>
        `;
    },

    updateClassroomFilterOptions() {
        const locationFilter = document.getElementById('locationFilter');
        const classroomFilter = document.getElementById('classroomFilter');
        if (!locationFilter || !classroomFilter) return;

        const selectedLocation = locationFilter.value;
        const currentSelection = classroomFilter.value;

        let classrooms = Data.CLASSROOMS;
        if (selectedLocation) {
            classrooms = classrooms.filter(c => c.location === selectedLocation);
        }

        let html = '<option value="">All Classrooms</option>';
        html += '<option value="status_Inactive" style="font-style: italic; color: #888;">── Inactive ──</option>';
        html += '<option value="status_Waitlisted" style="font-style: italic; color: #888;">── Waitlisted ──</option>';
        classrooms.forEach(c => {
            const label = selectedLocation ? c.name : `${c.name} (${c.location})`;
            html += `<option value="${c.id}">${label}</option>`;
        });

        classroomFilter.innerHTML = html;

        if (currentSelection && (classrooms.some(c => c.id === currentSelection) || currentSelection.startsWith('status_'))) {
            classroomFilter.value = currentSelection;
        } else {
            classroomFilter.value = "";
        }
    },

    // Parent Modal
    showAddParentModal() {
        const body = this.getParentFormHtml();
        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="CRM.saveParent()">Save Parent</button>
        `;
        App.openModal('Add Parent', body, footer);
    },

    editParent(id) {
        const parent = Data.getParentById(id);
        if (!parent) return;

        const body = this.getParentFormHtml(parent);
        const footer = `
            <button class="btn btn-danger" onclick="CRM.deleteParent('${id}')">Delete</button>
            <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="CRM.saveParent('${id}')">Update Parent</button>
        `;
        App.openModal('Edit Parent', body, footer);
    },

    viewParent(id) {
        try {
            const parent = Data.getParentById(id);
            if (!parent) {
                console.error('Parent not found for ID:', id);
                alert('Error: Parent not found.');
                return;
            }

            const children = Data.getChildrenByParent(id) || [];

            const body = `
                <div class="view-details">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <h3 style="margin-top: 0;">${parent.firstName || 'Unknown'} ${parent.lastName || ''}</h3>
                        <span class="badge ${Utils.getStatusBadgeClass(parent.status)}">${parent.status || 'Unknown'}</span>
                    </div>
                    
                    <div style="background: var(--neutral-50); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <p><strong>Email:</strong> <a href="mailto:${parent.email}">${parent.email || '-'}</a></p>
                        <p><strong>Phone:</strong> <a href="tel:${parent.phone}">${parent.phone || '-'}</a></p>
                        <div style="margin-top: 10px; display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" id="cb-onboarded-${parent.id}" 
                                ${parent.onboarded ? 'checked' : ''} 
                                onchange="CRM.toggleParentOnboarded('${parent.id}', this.checked)">
                            <label for="cb-onboarded-${parent.id}" style="font-weight: 600; cursor: pointer;">Onboarded</label>
                        </div>
                    </div>
                    
                    <h4 style="margin-top: var(--spacing-6); border-bottom: 2px solid var(--primary-100); padding-bottom: 8px;">Children & Service Agreements</h4>
                    ${children.length ? `
                        <div style="display: flex; flex-direction: column; gap: 15px; margin-top: 15px;">
                            ${children.map(c => {
                const classroom = Data.getClassroomById(c.classroomId);
                const agreements = Data.getServiceAgreementsByChild(c.id) || [];
                const isSent = agreements.some(sa => sa.status === 'Sent');
                const isSigned = agreements.some(sa => sa.status === 'Signed');
                const isFollowedUp = agreements.some(sa => sa.status === 'Followed-up');

                // Get timestamps if available
                const sentDate = agreements.find(sa => sa.status === 'Sent')?.timestamp;
                const signedDate = agreements.find(sa => sa.status === 'Signed')?.timestamp;
                const followUpDate = agreements.find(sa => sa.status === 'Followed-up')?.timestamp;

                return `
                                <div style="border: 1px solid var(--neutral-200); border-radius: 8px; padding: 12px; background: white;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                        <strong>${c.firstName} ${c.lastName}</strong>
                                        <div style="display: flex; align-items: center; gap: 10px;">
                                            <span style="font-size: 0.85em; color: var(--neutral-500);">${classroom ? classroom.name : 'No Class'} @ ${c.location}</span>
                                            <button class="btn btn-sm btn-outline-primary" onclick="CRM.viewChild('${c.id}'); App.closeModal();" style="padding: 2px 8px; font-size: 0.8em;">View Child</button>
                                        </div>
                                    </div>
                                    
                                    <div class="sa-task-list">
                                        <div style="font-size: 0.9em; font-weight: 600; margin-bottom: 8px; color: var(--neutral-600);">Service Agreement Status used for Reports:</div>
                                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                            <label class="sa-checkbox-btn ${isSent ? 'active' : ''}" title="${sentDate ? 'Updated: ' + Utils.formatDate(sentDate) + ' ' + new Date(sentDate).toLocaleTimeString() : ''}">
                                                <input type="checkbox" onchange="CRM.toggleServiceAgreement('${c.id}', 'Sent', this.checked)" ${isSent ? 'checked' : ''}>
                                                <span>Sent</span>
                                            </label>
                                            <label class="sa-checkbox-btn ${isSigned ? 'active' : ''}" title="${signedDate ? 'Updated: ' + Utils.formatDate(signedDate) + ' ' + new Date(signedDate).toLocaleTimeString() : ''}">
                                                <input type="checkbox" onchange="CRM.toggleServiceAgreement('${c.id}', 'Signed', this.checked)" ${isSigned ? 'checked' : ''}>
                                                <span>Signed</span>
                                            </label>
                                            <label class="sa-checkbox-btn ${isFollowedUp ? 'active' : ''}" title="${followUpDate ? 'Updated: ' + Utils.formatDate(followUpDate) + ' ' + new Date(followUpDate).toLocaleTimeString() : ''}">
                                                <input type="checkbox" onchange="CRM.toggleServiceAgreement('${c.id}', 'Followed-up', this.checked)" ${isFollowedUp ? 'checked' : ''}>
                                                <span>Follow-Up</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            `;
            }).join('')}
                        </div>
                    ` : '<p style="color: var(--neutral-500); font-style: italic;">No children linked to this parent.</p>'
                }

                    <h4 style="margin-top: var(--spacing-8); border-bottom: 2px solid var(--primary-100); padding-bottom: 8px;">Notes</h4>
                    <div class="notes-section">
                        <div id="parentNotesList" style="max-height: 300px; overflow-y: auto; margin-bottom: 15px; display: flex; flex-direction: column; gap: 10px;">
                            ${this.renderParentNotes(parent.notes)}
                        </div>
                        
                        <div class="add-note-form" style="display: flex; gap: 10px;">
                            <textarea id="newNoteInput" class="form-input" placeholder="Add a note... (Shift+Enter for new line)" rows="2" style="flex: 1; resize: vertical;" onkeydown="CRM.handleNoteKeydown(event, 'parent', '${parent.id}')"></textarea>
                            <button class="btn btn-primary" onclick="CRM.addNote('${parent.id}')" style="height: fit-content;">Add</button>
                        </div>
                    </div>
                </div>
            `;
            const footer = `
                <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
                <button class="btn btn-primary" onclick="CRM.editParent('${id}')">Edit Details</button>
            `;
            App.openModal('Parent Details', body, footer);
        } catch (e) {
            console.error('Error viewing parent:', e);
            alert('Error viewing parent: ' + e.message);
        }
    },

    renderParentNotes(notes) {
        if (!notes || !Array.isArray(notes) || notes.length === 0) {
            return '<div style="text-align: center; color: var(--neutral-400); padding: 20px;">No notes added yet.</div>';
        }
        return notes.map(note => `
            <div id="note-item-${note.id}" class="note-item" style="background: var(--neutral-50); padding: 10px; border-radius: 6px; border-left: 3px solid var(--primary-400);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="font-weight: 600; font-size: 0.9em; color: var(--primary-800);">${note.author || 'Admin'}</span>
                    <span style="font-size: 0.8em; color: var(--neutral-500);">${Utils.formatDate(note.createdAt)} ${new Date(note.createdAt).toLocaleTimeString()}</span>
                </div>
                <div class="note-content" id="note-content-${note.id}" style="white-space: pre-wrap;">${note.content}</div>
                <div class="note-actions" style="margin-top: 5px; text-align: right;">
                    <button class="btn-text" onclick="CRM.editNote('${note.id}')" style="font-size: 0.8em; color: var(--secondary-600);">Edit</button>
                    <button class="btn-text" onclick="CRM.deleteParentNote('${note.id}')" style="font-size: 0.8em; color: var(--error); margin-left: 10px;">Delete</button>
                </div>
            </div>
        `).join('');
    },

    toggleServiceAgreement(childId, status, isChecked) {
        Data.updateServiceAgreementStatus(childId, status, isChecked);
        // Do NOT reload view to avoid wiping typed notes or disrupting UI state
        // The checkbox state is already updated by the browser interaction

        // Optional: Update the tooltip timestamp dynamically if needed, but it's a minor detail.
        // We can simply show a toast if we want confirmation.
        // Utils.showToast('Service Agreement updated');
    },

    toggleParentOnboarded(parentId, isChecked) {
        Data.updateParent(parentId, { onboarded: isChecked });
        Utils.showToast(`Parent marked as ${isChecked ? 'Onboarded' : 'Not Onboarded'}`);
    },

    handleNoteKeydown(event, type, id) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Prevent new line
            if (type === 'parent') {
                this.addNote(id);
            } else if (type === 'child') {
                this.addChildNote(id);
            }
        }
    },

    addNote(parentId) {
        const input = document.getElementById('newNoteInput');
        const content = input.value.trim();
        if (!content) return;

        // Get current user name - simplified for now
        const user = Auth.getUser();
        // Try to get name from email (e.g. ggskiawp -> ggskiawp)
        let authorName = "Admin";
        if (user && user.email) {
            authorName = user.email.split('@')[0];
            // Capitalize first letter
            authorName = authorName.charAt(0).toUpperCase() + authorName.slice(1);
        }

        Data.addParentNote(parentId, content, authorName);
        this.viewParent(parentId); // Refresh
    },

    editNote(noteId) {
        // Find parent and note
        const allParents = Data.getParents();
        let parent = null;
        let note = null;

        for (const p of allParents) {
            if (p.notes) {
                const found = p.notes.find(n => n.id === noteId);
                if (found) {
                    parent = p;
                    note = found;
                    break;
                }
            }
        }

        if (!parent || !note) return;

        // Inline Edit Logic
        const noteContainer = document.getElementById(`note-item-${noteId}`);
        if (!noteContainer) return;

        // Save original HTML content (optional, but easier to just re-view parent on cancel)
        // We will replace content with a textarea
        noteContainer.innerHTML = `
            <textarea id="edit-input-${noteId}" class="form-input" rows="3" style="width: 100%; box-sizing: border-box; margin-bottom: 5px; resize: vertical;">${note.content}</textarea>
            <div style="text-align: right; gap: 10px;">
                <button class="btn btn-sm btn-secondary" onclick="CRM.viewParent('${parent.id}')" style="padding: 2px 8px; font-size: 0.8em;">Cancel</button>
                <button class="btn btn-sm btn-primary" onclick="CRM.saveEditedNote('${parent.id}', '${noteId}')" style="padding: 2px 8px; font-size: 0.8em;">Save</button>
            </div>
        `;
    },

    saveEditedNote(parentId, noteId) {
        const input = document.getElementById(`edit-input-${noteId}`);
        if (!input) return;

        const newContent = input.value.trim();
        if (newContent !== "") {
            Data.updateParentNote(parentId, noteId, newContent);
            this.viewParent(parentId);
        }
    },

    deleteParentNote(noteId) {
        // Find parent
        const allParents = Data.getParents();
        const parent = allParents.find(p => p.notes && p.notes.some(n => n.id === noteId));

        if (parent && confirm('Are you sure you want to delete this note?')) {
            Data.deleteParentNote(parent.id, noteId);
            this.viewParent(parent.id);
        }
    },

    getParentFormHtml(parent = null) {
        return `
            <form id="parentForm">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">First Name *</label>
                        <input type="text" class="form-input" name="firstName" value="${parent?.firstName || ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Last Name *</label>
                        <input type="text" class="form-input" name="lastName" value="${parent?.lastName || ''}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Email *</label>
                    <input type="email" class="form-input" name="email" value="${parent?.email || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Phone</label>
                    <input type="tel" class="form-input" name="phone" value="${parent?.phone || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <select class="form-select" name="status">
                        <option value="Enrolled" ${parent?.status === 'Enrolled' ? 'selected' : ''}>Enrolled</option>
                        <option value="Waitlisted" ${parent?.status === 'Waitlisted' ? 'selected' : ''}>Waitlisted</option>
                        <option value="On Process" ${parent?.status === 'On Process' ? 'selected' : ''}>On Process</option>
                        <option value="Drop-In" ${parent?.status === 'Drop-In' ? 'selected' : ''}>Drop-In</option>
                        <option value="Inactive" ${parent?.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
            </form>
    `;
    },

    syncFamilyStatus(triggerId, type, newStatus) {
        // Collect all related IDs
        const relatedParents = new Set();
        const relatedChildren = new Set();

        const processChild = (childId) => {
            if (relatedChildren.has(childId)) return;
            relatedChildren.add(childId);
            const child = Data.getChildById(childId);
            if (child && child.parentIds) {
                child.parentIds.forEach(pid => processParent(pid));
            }
        };

        const processParent = (parentId) => {
            if (relatedParents.has(parentId)) return;
            relatedParents.add(parentId);
            const children = Data.getChildrenByParent(parentId);
            children.forEach(c => processChild(c.id));
        };

        // Start processing based on trigger
        if (type === 'parent') {
            processParent(triggerId);
        } else {
            processChild(triggerId);
        }

        // Apply Status Update
        relatedParents.forEach(pid => {
            if (pid !== triggerId || type !== 'parent') { // Don't double update the trigger if we handle it outside
                Data.updateParent(pid, { status: newStatus });
            }
        });

        relatedChildren.forEach(cid => {
            if (cid !== triggerId || type !== 'child') {
                Data.updateChild(cid, { status: newStatus });
            }
        });
    },

    saveParent(id = null) {
        const form = document.getElementById('parentForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        if (id) {
            // Check if status changed
            const oldParent = Data.getParentById(id);
            if (oldParent && oldParent.status !== data.status) {
                this.syncFamilyStatus(id, 'parent', data.status);
            }

            Data.updateParent(id, data);
            Utils.showToast('Parent updated successfully', 'success');
        } else {
            Data.addParent(data);
            Utils.showToast('Parent added successfully', 'success');
        }

        App.closeModal();
        this.render();
    },

    deleteParent(id) {
        if (confirm('Are you sure you want to delete this parent? This cannot be undone.')) {
            Data.deleteParent(id);
            Utils.showToast('Parent deleted', 'success');
            App.closeModal();
            this.render();
        }
    },

    // Child Modal
    showAddChildModal() {
        const body = this.getChildFormHtml();
        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="CRM.saveChild()">Save Child</button>
        `;
        App.openModal('Add Child', body, footer);
    },

    editChild(id) {
        const child = Data.getChildById(id);
        if (!child) return;

        const body = this.getChildFormHtml(child);
        const footer = `
            <button class="btn btn-danger" onclick="CRM.deleteChild('${id}')">Delete</button>
            <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="CRM.saveChild('${id}')">Update Child</button>
        `;
        App.openModal('Edit Child', body, footer);
    },

    viewChild(id) {
        const child = Data.getChildById(id);
        if (!child) return;

        const parents = child.parentIds ? child.parentIds.map(pid => Data.getParentById(pid)).filter(Boolean) : [];
        const classroom = Data.getClassroomById(child.classroomId);
        // Calculate next classroom dynamically if not set
        const nextClassroom = child.nextClassroomId
            ? Data.getClassroomById(child.nextClassroomId)
            : (child.classroomId ? Utils.getNextClassroom(child.classroomId) : null);

        // Calculate next transition date dynamically if not set
        const nextTransitionDate = child.nextTransitionDate ||
            (child.dateOfBirth && child.classroomId ? Utils.calculateNextTransitionDate(child.dateOfBirth, child.classroomId) : null);

        const age = Utils.calculateAge(child.dateOfBirth);

        // Schedule Logic
        const schedules = Data.getSchedulesByChild(id);

        const historyRows = schedules.length > 0 ? schedules.map(s => {
            let details = '-';
            if (s.type === 'Part Time') {
                try {
                    const days = typeof s.daysOfWeek === 'string' ? JSON.parse(s.daysOfWeek) : s.daysOfWeek;
                    details = Array.isArray(days) ? days.join(', ') : '-';
                } catch (e) { details = '-'; }
            } else if (s.type === 'Drop In') {
                details = s.startDate ? Utils.formatDate(s.startDate) : '-';
            }

            // Date Range
            let range = '-';
            if (s.type === 'Drop In') {
                range = s.startDate ? Utils.formatDate(s.startDate) : '-';
            } else {
                const start = s.startDate ? Utils.formatDate(s.startDate) : '?';
                const end = s.endDate ? Utils.formatDate(s.endDate) : 'Present';
                range = `${start} - ${end} `;
            }

            return `
                <tr>
                    <td>${s.type}</td>
                    <td>${details}</td>
                    <td>${range}</td>
                </tr>
            `;
        }).join('') : `<tr><td colspan="3" style="text-align: center; color: var(--neutral-500); padding: 10px;">No schedule history recorded</td></tr>`;

        const body = `
            <div class="view-details">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <h3 style="margin-top: 0;">${child.firstName} ${child.lastName}</h3>
                </div>
                
                <p><strong>Age:</strong> ${age.display} (${age.totalMonths} months)</p>
                <p><strong>Date of Birth:</strong> ${Utils.formatDate(child.dateOfBirth)}</p>
                <p><strong>Enrollment Date:</strong> ${child.enrollmentDate ? Utils.formatDate(child.enrollmentDate) : (schedules.length > 0 && schedules[schedules.length - 1].startDate ? Utils.formatDate(schedules[schedules.length - 1].startDate) : 'N/A')}</p>
                <p><strong>Status:</strong> <span class="badge ${Utils.getStatusBadgeClass(child.status)}">${child.status}</span></p>
                <p><strong>ELFA Recipient:</strong> ${child.isElfa ? 'Yes' : 'No'}</p>
                <p><strong>Location:</strong> <span class="location-badge ${Utils.getLocationColor(child.location)}">${child.location}</span></p>
                <p><strong>Classroom:</strong> ${classroom ? classroom.name : '-'}</p>
                
                <div style="background: var(--neutral-50); padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid var(--neutral-200);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h4 style="margin: 0;">Schedule History</h4>
                        <button class="btn btn-secondary btn-sm" onclick="CRM.showUpdateScheduleModal('${child.id}')" style="padding: 4px 10px; font-size: 0.8em;">
                            Update / Set Schedule
                        </button>
                    </div>
                    <p style="margin-bottom: 10px;"><strong>Current Status:</strong> ${child.scheduleType || 'Not Set'}</p>
                    
                    <table class="table" style="font-size: 0.9em; width: 100%;">
                        <thead>
                            <tr style="text-align: left; border-bottom: 1px solid var(--neutral-200);">
                                <th style="padding: 6px;">Type</th>
                                <th style="padding: 6px;">Days</th>
                                <th style="padding: 6px;">Date Range</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${schedules.length > 0 ? schedules.map(s => {
            // 1. Type Logic: FT/PT -> "Regular", Drop In -> "Drop In"
            let displayType = 'Regular';
            if (s.type === 'Drop In' || s.type === 'Drop-In') displayType = 'Drop In';

            // 2. Days Logic
            let displayDays = '-';
            if (s.type === 'Full Time') {
                displayDays = 'Mon-Fri';
            } else if (s.type === 'Part Time') {
                try {
                    const days = typeof s.daysOfWeek === 'string' ? JSON.parse(s.daysOfWeek) : s.daysOfWeek;
                    if (Array.isArray(days) && days.length > 0) {
                        // Sort days? Monday=0...
                        // Just join for now.
                        // Shorten? Mon, Tue...
                        displayDays = days.map(d => d.substring(0, 3)).join(', ');
                    }
                } catch (e) { displayDays = '-'; }
            } else if (s.type === 'Drop In') {
                displayDays = s.startDate ? Utils.formatDate(s.startDate) : '-';
            }

            // 3. Date Range Logic
            let range = '-';
            if (s.type === 'Drop In') {
                range = '-'; // Drop In date is in Days column or just start date
            } else {
                const start = s.startDate ? Utils.formatDate(s.startDate) : '?';
                const end = s.endDate ? Utils.formatDate(s.endDate) : 'Present';
                range = `${start} - ${end}`;
            }

            return `
                                    <tr>
                                        <td>${displayType}</td>
                                        <td>${displayDays}</td>
                                        <td>${range}</td>
                                    </tr>
                                `;
        }).join('') : `<tr><td colspan="3" style="text-align: center; color: var(--neutral-500); padding: 10px;">No schedule history recorded</td></tr>`}
                        </tbody>
                    </table>
                </div>
                
                <h4 style="margin-top: var(--spacing-4);">Transition Info</h4>
                <p><strong>Last Transition:</strong> ${child.lastTransitionDate ? Utils.formatDate(child.lastTransitionDate) : 'N/A'}</p>
                <p><strong>Next Transition:</strong> ${nextTransitionDate ? Utils.formatDate(nextTransitionDate) : 'N/A'}</p>
                <p><strong>Next Classroom:</strong> ${nextClassroom ? nextClassroom.name : 'N/A'}</p>
                
                <h4 style="margin-top: var(--spacing-4);">Parents (${parents.length})</h4>
                ${parents.length ? `
                    <ul>
                        ${parents.map(p => `<li>
                            <strong>${p.firstName} ${p.lastName}</strong><br>
                            📧 ${p.email} | 📞 ${p.phone}
                        </li>`).join('')}
                    </ul>
                ` : '<p>No parents linked</p>'
            }

                <h4 style="margin-top: var(--spacing-8); border-bottom: 2px solid var(--primary-100); padding-bottom: 8px;">Notes</h4>
                <div class="notes-section">
                    <div id="childNotesList" style="max-height: 300px; overflow-y: auto; margin-bottom: 15px; display: flex; flex-direction: column; gap: 10px;">
                        ${this.renderNotes(child.notes)}
                    </div>
                    
                    <div class="add-note-form" style="display: flex; gap: 10px;">
                        <textarea id="newChildNoteInput" class="form-input" placeholder="Add a note... (Shift+Enter for new line)" rows="2" style="flex: 1; resize: vertical;" onkeydown="CRM.handleNoteKeydown(event, 'child', '${child.id}')"></textarea>
                        <button class="btn btn-primary" onclick="CRM.addChildNote('${child.id}')" style="height: fit-content;">Add</button>
                    </div>
                </div>
            </div>
    `;
        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
            <button class="btn btn-primary" onclick="CRM.editChild('${id}')">Edit Details</button>
        `;
        App.openModal('Child Details', body, footer);
    },

    renderNotes(notes) {
        if (!notes || notes.length === 0) {
            return '<div style="text-align: center; color: var(--neutral-400); padding: 20px;">No notes added yet.</div>';
        }
        return notes.map(note => `
            <div id="note-item-${note.id}" class="note-item" style="background: var(--neutral-50); padding: 10px; border-radius: 6px; border-left: 3px solid var(--primary-400);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="font-weight: 600; font-size: 0.9em; color: var(--primary-800);">${note.author || 'Admin'}</span>
                    <span style="font-size: 0.8em; color: var(--neutral-500);">${Utils.formatDate(note.createdAt)} ${new Date(note.createdAt).toLocaleTimeString()}</span>
                </div>
                <div class="note-content" id="note-content-${note.id}" style="white-space: pre-wrap;">${note.content}</div>
                <div class="note-actions" style="margin-top: 5px; text-align: right;">
                    <button class="btn-text" onclick="CRM.editChildNote('${note.id}')" style="font-size: 0.8em; color: var(--secondary-600);">Edit</button>
                    <button class="btn-text" onclick="CRM.deleteChildNoteVal('${note.id}')" style="font-size: 0.8em; color: var(--error); margin-left: 10px;">Delete</button>
                </div>
            </div>
        `).join('');
    },

    addChildNote(childId) {
        const input = document.getElementById('newChildNoteInput');
        const content = input.value.trim();
        if (!content) return;

        // Get current user name
        const user = Auth.getUser();
        let authorName = "Admin";
        if (user && user.email) {
            authorName = user.email.split('@')[0];
            authorName = authorName.charAt(0).toUpperCase() + authorName.slice(1);
        }

        Data.addChildNote(childId, content, authorName);
        this.viewChild(childId); // Refresh
    },

    editChildNote(noteId) {
        // Find child and note safely
        const allChildren = Data.getChildren();
        let child = null;
        let note = null;

        for (const c of allChildren) {
            if (c.notes) {
                const found = c.notes.find(n => n.id === noteId);
                if (found) {
                    child = c;
                    note = found;
                    break;
                }
            }
        }

        if (!child || !note) return;

        // Inline Edit Logic
        const noteContainer = document.getElementById(`note-item-${noteId}`);
        if (!noteContainer) return;

        noteContainer.innerHTML = `
            <textarea id="edit-input-${noteId}" class="form-input" rows="3" style="width: 100%; box-sizing: border-box; margin-bottom: 5px; resize: vertical;">${note.content}</textarea>
            <div style="text-align: right; gap: 10px;">
                <button class="btn btn-sm btn-secondary" onclick="CRM.viewChild('${child.id}')" style="padding: 2px 8px; font-size: 0.8em;">Cancel</button>
                <button class="btn btn-sm btn-primary" onclick="CRM.saveEditedChildNote('${child.id}', '${noteId}')" style="padding: 2px 8px; font-size: 0.8em;">Save</button>
            </div>
        `;
    },

    saveEditedChildNote(childId, noteId) {
        const input = document.getElementById(`edit-input-${noteId}`);
        if (!input) return;

        const newContent = input.value.trim();
        if (newContent !== "") {
            Data.updateChildNote(childId, noteId, newContent);
            this.viewChild(childId);
        }
    },

    deleteChildNoteVal(noteId) {
        // Find child
        const allChildren = Data.getChildren();
        const child = allChildren.find(c => c.notes && c.notes.some(n => n.id === noteId));

        if (child && confirm('Are you sure you want to delete this note?')) {
            Data.deleteChildNote(child.id, noteId);
            this.viewChild(child.id);
        }
    },

    getChildFormHtml(child = null) {
        const parents = Data.getParents();
        const classrooms = Data.getClassrooms();

        return `
            <form id="childForm">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">First Name *</label>
                        <input type="text" class="form-input" name="firstName" value="${child?.firstName || ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Last Name *</label>
                        <input type="text" class="form-input" name="lastName" value="${child?.lastName || ''}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Date of Birth *</label>
                    <input type="date" class="form-input" name="dateOfBirth" value="${child?.dateOfBirth || ''}" required onchange="CRM.updateClassroomSuggestion()">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Location *</label>
                        <select class="form-select" name="location" required onchange="CRM.updateClassroomOptions()">
                            <option value="">Select Location</option>
                            ${Data.getLocations().map(loc => `<option value="${loc}" ${child?.location === loc ? 'selected' : ''}>${loc}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Classroom</label>
                        <select class="form-select" name="classroomId" id="classroomSelect">
                            <option value="">Select Classroom</option>
                            ${classrooms.map(c => `
                                <option value="${c.id}" data-location="${c.location}" ${child?.classroomId === c.id ? 'selected' : ''}>
                                    ${c.name} (${c.location})
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select class="form-select" name="status">
                            <option value="Enrolled" ${child?.status === 'Enrolled' ? 'selected' : ''}>Enrolled</option>
                            <option value="Waitlisted" ${child?.status === 'Waitlisted' ? 'selected' : ''}>Waitlisted</option>
                            <option value="On Process" ${child?.status === 'On Process' ? 'selected' : ''}>On Process</option>
                            <option value="Drop-In" ${child?.status === 'Drop-In' ? 'selected' : ''}>Drop-In</option>
                            <option value="Inactive" ${child?.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Schedule Type</label>
                        <select class="form-select" name="scheduleType">
                            <option value="Full Time" ${child?.scheduleType === 'Full Time' ? 'selected' : ''}>Full Time</option>
                            <option value="Part Time" ${child?.scheduleType === 'Part Time' ? 'selected' : ''}>Part Time</option>
                            <option value="Drop-Ins" ${child?.scheduleType === 'Drop-Ins' ? 'selected' : ''}>Drop-Ins</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Enrollment Date</label>
                        <input type="text" class="form-input" name="enrollmentDate" placeholder="MM/DD/YYYY" pattern="\\d{2}/\\d{2}/\\d{4}" value="${Utils.formatDate(child?.enrollmentDate, 'slashes') !== '-' ? Utils.formatDate(child?.enrollmentDate, 'slashes') : ''}">
                    </div>
                    <div class="form-group" style="display: flex; align-items: flex-end; padding-bottom: 10px;">
                        <label style="cursor: pointer; display: flex; align-items: center; font-weight: 500;">
                            <input type="checkbox" name="isElfa" ${child?.isElfa ? 'checked' : ''} style="width: 18px; height: 18px; margin-right: 8px;">
                            ELFA Recipient
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Parent(s)</label>
                    <div class="parent-selector" style="border: 1px solid var(--neutral-300); border-radius: var(--radius-md); padding: var(--spacing-2);">
                        <input type="text" class="form-input" placeholder="Search parents..." onkeyup="CRM.filterParents(this)" style="margin-bottom: var(--spacing-2); font-size: 0.9em;">
                        <div id="parentList" style="max-height: 150px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;">
                            ${parents.map(p => `
                                <div class="parent-item" style="display: flex; align-items: center;">
                                    <input type="checkbox" name="parentIds" value="${p.id}" id="p_${p.id}" ${child?.parentIds?.includes(p.id) ? 'checked' : ''} style="margin-right: 8px;">
                                    <label for="p_${p.id}" style="cursor: pointer; font-size: 0.9em; flex: 1; margin: 0;">
                                        <strong>${p.firstName} ${p.lastName}</strong>
                                        <span style="color: var(--neutral-500); font-size: 0.85em; display: block;">${p.email || p.phone}</span>
                                    </label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </form>
    `;
    },

    filterParents(input) {
        const filter = input.value.toLowerCase();
        const items = document.querySelectorAll('#parentList .parent-item');
        items.forEach(item => {
            const label = item.innerText.toLowerCase();
            item.style.display = label.includes(filter) ? 'flex' : 'none';
        });
    },

    updateClassroomOptions() {
        const location = document.querySelector('[name="location"]').value;
        const classroomSelect = document.getElementById('classroomSelect');
        const options = classroomSelect.querySelectorAll('option');

        options.forEach(opt => {
            if (opt.value && opt.dataset.location) {
                opt.style.display = opt.dataset.location === location ? '' : 'none';
            }
        });
    },

    updateClassroomSuggestion() {
        const dob = document.querySelector('[name="dateOfBirth"]').value;
        const location = document.querySelector('[name="location"]').value;

        if (dob && location) {
            const ageInMonths = Utils.getAgeInMonths(dob);
            const suggestedClassroom = Utils.getClassroomForAge(ageInMonths, location);
            if (suggestedClassroom) {
                document.getElementById('classroomSelect').value = suggestedClassroom.id;
            }
        }
    },

    saveChild(id = null) {
        const form = document.getElementById('childForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const data = {
            parentIds: [] // Ensure array exists even if no checkboxes checked
        };

        // Handle Checkbox
        data.isElfa = formData.get('isElfa') === 'on';

        formData.forEach((value, key) => {
            if (key === 'isElfa') return;
            if (key === 'parentIds') {
                if (!data.parentIds) data.parentIds = [];
                data.parentIds.push(value);
            } else if (key === 'enrollmentDate' && value.includes('/')) {
                // Convert MM/DD/YYYY to YYYY-MM-DD
                data[key] = Utils.parseDateFromSlash(value);
            } else {
                data[key] = value;
            }
        });

        // Calculate next transition date if classroom is set
        if (data.classroomId && data.dateOfBirth && !data.nextTransitionDate) {
            data.nextTransitionDate = Utils.calculateNextTransitionDate(data.dateOfBirth, data.classroomId);
        }

        if (id) {
            // Check if status changed
            const oldChild = Data.getChildById(id);
            if (oldChild && oldChild.status !== data.status) {
                this.syncFamilyStatus(id, 'child', data.status);
            }

            Data.updateChild(id, data);
            Utils.showToast('Child updated successfully', 'success');
        } else {
            Data.addChild(data);
            Utils.showToast('Child added successfully', 'success');
        }

        App.closeModal();
        App.refresh();
    },

    deleteChild(id) {
        if (confirm('Are you sure you want to delete this child? This cannot be undone.')) {
            Data.deleteChild(id);
            Utils.showToast('Child deleted', 'success');
            App.closeModal();
            App.refresh();
        }
    },

    // Waitlist Modal
    showAddWaitlistModal() {
        const body = this.getWaitlistFormHtml();
        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="CRM.saveWaitlistEntry()">Add to Waitlist</button>
        `;
        App.openModal('Add to Waitlist', body, footer);
    },

    getWaitlistFormHtml() {
        return `
            <form id="waitlistForm">
                <h4 style="margin-bottom: var(--spacing-4);">Parent Information</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Parent First Name *</label>
                        <input type="text" class="form-input" name="parentFirstName" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Parent Last Name *</label>
                        <input type="text" class="form-input" name="parentLastName" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Email *</label>
                        <input type="email" class="form-input" name="email" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Phone *</label>
                        <input type="tel" class="form-input" name="phone" required>
                    </div>
                </div>
                
                <h4 style="margin: var(--spacing-4) 0;">Child Information</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Child First Name *</label>
                        <input type="text" class="form-input" name="childFirstName" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Child Last Name *</label>
                        <input type="text" class="form-input" name="childLastName" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Date of Birth</label>
                        <input type="date" class="form-input" name="dateOfBirth">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Expected Delivery Date</label>
                        <input type="date" class="form-input" name="expectedDeliveryDate">
                    </div>
                </div>
                
                <h4 style="margin: var(--spacing-4) 0;">Preferences</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Preferred Location *</label>
                        <select class="form-select" name="preferredLocation" required>
                            ${Data.getLocations().map(loc => `<option value="${loc}">${loc}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Desired Start Date *</label>
                        <input type="date" class="form-input" name="desiredStartDate" required>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Schedule Type</label>
                    <select class="form-select" name="scheduleType">
                        <option value="Full Time">Full Time</option>
                        <option value="Part Time">Part Time</option>
                        <option value="Drop-Ins">Drop-Ins</option>
                    </select>
                </div>
            </form>
    `;
    },

    saveWaitlistEntry() {
        const form = document.getElementById('waitlistForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // Create parent
        const parent = Data.addParent({
            firstName: data.parentFirstName,
            lastName: data.parentLastName,
            email: data.email,
            phone: data.phone,
            status: 'Waitlisted'
        });

        // Create child
        const child = Data.addChild({
            firstName: data.childFirstName,
            lastName: data.childLastName,
            dateOfBirth: data.dateOfBirth || null,
            status: 'Waitlisted',
            location: data.preferredLocation,
            scheduleType: data.scheduleType,
            parentIds: [parent.id]
        });

        // Create waitlist entry
        Data.addWaitlistEntry({
            parentIds: [parent.id],
            childId: child.id,
            expectedDeliveryDate: data.expectedDeliveryDate || null,
            desiredStartDate: data.desiredStartDate,
            preferredLocation: data.preferredLocation,
            scheduleType: data.scheduleType
        });

        Utils.showToast('Added to waitlist successfully', 'success');
        App.closeModal();
        App.refresh();
    },

    // Schedule Management
    // Schedule Management
    showUpdateScheduleModal(childId) {
        const child = Data.getChildById(childId);
        if (!child) return;

        // Get current active schedule to pre-fill
        const schedules = Data.getSchedulesByChild(childId);
        // Find the schedule that is currently active (no end date, or end date in future)
        // For simplicity, we look for the open-ended one or the last one.
        const activeSchedule = schedules.find(s => !s.endDate) || schedules[0] || {};

        const currentType = activeSchedule.type || child.scheduleType || 'Full Time';

        let currentDays = [];
        if (activeSchedule.daysOfWeek) {
            try {
                currentDays = typeof activeSchedule.daysOfWeek === 'string' ? JSON.parse(activeSchedule.daysOfWeek) : activeSchedule.daysOfWeek;
                if (!Array.isArray(currentDays)) currentDays = [];
            } catch (e) { currentDays = []; }
        }

        const body = `
            <div style="background: var(--neutral-50); padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 0.9em;">
        <strong>Current Schedule:</strong> ${child.scheduleType || 'None'} <br>
                <span style="color: var(--neutral-600);">This will close the current schedule and start a new one.</span>
            </div>
            <form id="scheduleForm">
                <div class="form-group">
                    <label class="form-label">Schedule Type</label>
                    <select class="form-select" name="type" id="scheduleType" onchange="CRM.toggleScheduleFields()" required>
                        <option value="Full Time" ${currentType === 'Full Time' ? 'selected' : ''}>Full Time</option>
                        <option value="Part Time" ${currentType === 'Part Time' ? 'selected' : ''}>Part Time</option>
                        <option value="Drop In" ${currentType === 'Drop In' ? 'selected' : ''}>Drop In</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label" id="startDateLabel">Start Date</label>
                    <input type="date" class="form-input" name="startDate" required value="${Utils.formatDateInput(new Date())}">
                    <small style="color: var(--neutral-500); display: block; margin-top: 4px;" id="startDateHelp">The date this new schedule begins.</small>
                </div>

                <div class="form-group" id="daysGroup" style="display: none;">
                    <label class="form-label">Days of Week (for Part Time)</label>
                    <div class="checkbox-group" style="display: flex; gap: 15px; flex-wrap: wrap;">
                        ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => `
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="checkbox" name="days" value="${d}" ${currentDays.includes(d) ? 'checked' : ''}> ${d}
                            </label>
                        `).join('')}
                    </div>
                </div>
            </form>
`;

        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="CRM.saveScheduleUpdate('${childId}')">Save Schedule</button>
        `;

        App.openModal('Update Schedule', body, footer);
        // Initial toggle
        setTimeout(() => CRM.toggleScheduleFields(), 0);
    },

    toggleScheduleFields() {
        const typeSelect = document.getElementById('scheduleType');
        if (!typeSelect) return;

        const type = typeSelect.value;
        const daysGroup = document.getElementById('daysGroup');
        const startDateLabel = document.getElementById('startDateLabel');
        const startDateHelp = document.getElementById('startDateHelp');

        if (type === 'Part Time') {
            daysGroup.style.display = 'block';
        } else {
            daysGroup.style.display = 'none';
        }

        if (type === 'Drop In') {
            startDateLabel.innerText = 'Drop In Date';
            startDateHelp.innerText = 'The specific date for this drop-in.';
        } else {
            startDateLabel.innerText = 'Start Date';
            startDateHelp.innerText = 'The date this schedule begins.';
        }
    },

    saveScheduleUpdate(childId) {
        const form = document.getElementById('scheduleForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const type = formData.get('type');
        const startDate = formData.get('startDate');

        let days = [];
        if (type === 'Part Time') {
            document.querySelectorAll('input[name="days"]:checked').forEach(cb => {
                days.push(cb.value);
            });
            if (days.length === 0) {
                alert('Please select at least one day for Part Time.');
                return;
            }
        }

        // Logic to close previous schedule
        // 1. Get current active schedule (where endDate is null)
        const schedules = Data.getSchedulesByChild(childId);
        const activeSchedule = schedules.find(s => !s.endDate);

        // 2. If active schedule exists, update end date to day BEFORE new start date
        if (activeSchedule) {
            // Check if we are adding a Drop In while active schedule exists?
            // Assuming Drop In REPLACES status per user request ("switched to drop in")

            const newStart = new Date(startDate);
            const closeDate = new Date(newStart);
            closeDate.setDate(closeDate.getDate() - 1);

            // Only close if closeDate >= activeSchedule.startDate
            // If new schedule starts BEFORE active schedule, likely incorrect usage or correction?
            // Assuming simple forward progression

            Data.updateSchedule(activeSchedule.id, {
                endDate: Utils.formatDateInput(closeDate)
            });
        }

        // 3. Create new schedule
        const newSchedule = {
            childId,
            type,
            startDate,
            endDate: type === 'Drop In' ? startDate : null, // Drop In is single day event essentially, or explicit range? Single day for now per request.
            daysOfWeek: type === 'Part Time' ? days : null
        };

        Data.addSchedule(newSchedule);

        // 4. Update child's main 'scheduleType' field for convenience display
        Data.updateChild(childId, { scheduleType: type });

        Utils.showToast('Schedule updated successfully', 'success');
        App.closeModal();

        // Refresh detail view if open?
        // Detail view logic re-renders on refresh?
        // App.refresh() re-renders list.
        App.refresh();

        // To update details modal while staying open, we would need to re-call renderChildDetails(childId)
        // For now, modal closes, list refreshed.
    }
};
