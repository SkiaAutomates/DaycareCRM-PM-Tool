/**
 * Day Care CRM - Notifications Module
 */

const Notifications = {
    render() {
        const container = document.getElementById('notificationsContent');
        const notifications = Data.getNotifications()
            .filter(n => !n.actionTaken) // Hide notifications that have been actioned/ignored
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const unread = notifications.filter(n => !n.read);
        const read = notifications.filter(n => n.read);

        container.innerHTML = `
            <div class="notification-list">
                ${unread.length ? `
                    <h3 style="margin-bottom: var(--spacing-4);">Unread (${unread.length})</h3>
                    ${unread.map(n => this.renderNotification(n)).join('')}
                ` : ''}

                ${read.length ? `
                    <h3 style="margin: var(--spacing-6) 0 var(--spacing-4);">Earlier</h3>
                    ${read.map(n => this.renderNotification(n)).join('')}
                ` : ''}

                ${!notifications.length ? `
                    <div class="empty-state">
                        <div class="empty-state-icon">🔔</div>
                        <h3>No notifications</h3>
                        <p>You're all caught up!</p>
                    </div>
                ` : ''}
            </div>
        `;
    },

    renderNotification(notification) {
        const child = notification.childId ? Data.getChildById(notification.childId) : null;
        const daysUntil = notification.dueDate ? Utils.daysUntil(notification.dueDate) : null;

        const isTransition = notification.type.startsWith('transition');
        const iconClass = isTransition ? 'transition' : 'waitlist';
        const icon = isTransition ? '🔄' : '📋';

        return `
            <div class="notification-item ${notification.read ? '' : 'unread'}">
                <div class="notification-icon ${iconClass}">${icon}</div>
                <div class="notification-content">
                    <div class="notification-title">
                        ${isTransition ? 'Transition Notification' : 'Waitlist Follow-up'}
                    </div>
                    <div class="notification-message">${notification.message}</div>
                    ${daysUntil !== null ? `
                        <div class="notification-time" style="margin-top: var(--spacing-2);">
                            ${daysUntil > 0 ? `Due in ${daysUntil} days` : daysUntil === 0 ? 'Due today!' : 'Overdue!'}
                            ${notification.dueDate ? ` (${Utils.formatDate(notification.dueDate)})` : ''}
                        </div>
                    ` : ''}
                </div>
                <div style="display: flex; gap: var(--spacing-2);">
                    ${!notification.read ? `
                        <button class="btn btn-sm btn-secondary" onclick="Notifications.markRead('${notification.id}')">
                            Mark Read
                        </button>
                    ` : ''}
                    ${!notification.actionTaken ? `
                        <button class="btn btn-sm btn-danger" style="background-color: #ef4444; color: white; border: none;" onclick="Notifications.ignoreNotification('${notification.id}')">
                            Ignore
                        </button>
                    ` : ''}
                    ${isTransition && child && !notification.actionTaken ? `
                        <button class="btn btn-sm btn-primary" onclick="Notifications.createTransitionProject('${notification.id}')">
                            Create Project
                        </button>
                    ` : ''}
                    ${notification.type === 'waitlist' && !notification.actionTaken ? `
                        <button class="btn btn-sm btn-primary" onclick="Notifications.viewWaitlistEntry('${notification.waitlistId}')">
                            View Details
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    },

    markRead(id) {
        Data.markNotificationRead(id);
        App.refresh();
    },

    ignoreNotification(id) {
        if (confirm('Are you sure you want to ignore this notification? It will be marked as read and no further action will be taken.')) {
            Data.markNotificationRead(id);
            Data._update(Data.STORAGE_KEYS.NOTIFICATIONS, id, { actionTaken: true });
            App.refresh();
            Utils.showToast('Notification ignored', 'info');
        }
    },

    createTransitionProject(notificationId) {
        const notification = Data.getNotifications().find(n => n.id === notificationId);
        if (!notification) return;

        // Mark as read and actioned
        Data.markNotificationRead(notificationId);
        Data._update(Data.STORAGE_KEYS.NOTIFICATIONS, notificationId, { actionTaken: true });

        // Switch to projects tab and pre-fill with this child
        App.switchTab('projects');

        // Create transition project directly
        const child = Data.getChildById(notification.childId);
        if (child) {
            const currentClassroom = Data.getClassroomById(child.classroomId);
            const classrooms = Data.getClassroomsByLocation(child.location);
            const currentIndex = classrooms.findIndex(c => c.id === currentClassroom.id);
            const nextClassroom = classrooms[currentIndex + 1];

            if (nextClassroom) {
                const category = Utils.getTransitionCategory(currentClassroom.id, nextClassroom.id);
                const tasks = Utils.getTransitionTasks(category).map(name => ({
                    id: Utils.generateId(),
                    name,
                    completed: false,
                    completedAt: null
                }));

                Data.addProject({
                    type: 'Transition',
                    parentIds: child.parentIds || [],
                    childId: child.id,
                    location: child.location,
                    transitionCategory: category,
                    nextClassroomId: nextClassroom.id,
                    tasks,
                    status: 'In Progress'
                });

                Utils.showToast('Transition project created', 'success');
                Projects.render();
            }
        }
    },

    viewWaitlistEntry(waitlistId) {
        const entry = Data.getWaitlist().find(w => w.id === waitlistId);
        if (!entry) return;

        const child = Data.getChildById(entry.childId);
        const parents = entry.parentIds.map(pid => Data.getParentById(pid)).filter(Boolean);

        const body = `
            <h3>Waitlist Entry Details</h3>
            <div style="margin-top: var(--spacing-4);">
                <p><strong>Child:</strong> ${child ? `${child.firstName} ${child.lastName}` : 'Unknown'}</p>
                <p><strong>Parents:</strong></p>
                <ul>
                    ${parents.map(p => `
                        <li>
                            ${p.firstName} ${p.lastName}<br>
                            📧 ${p.email} | 📞 ${p.phone}
                        </li>
                    `).join('')}
                </ul>
                <p><strong>Preferred Location:</strong> ${entry.preferredLocation}</p>
                <p><strong>Desired Start Date:</strong> ${Utils.formatDate(entry.desiredStartDate)}</p>
                <p><strong>Schedule Type:</strong> ${entry.scheduleType}</p>
                ${entry.expectedDeliveryDate ? `<p><strong>Expected Delivery:</strong> ${Utils.formatDate(entry.expectedDeliveryDate)}</p>` : ''}
            </div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
            <button class="btn btn-primary" onclick="Notifications.startEnrollment('${waitlistId}')">Start Enrollment</button>
        `;

        App.openModal('Waitlist Details', body, footer);
    },

    startEnrollment(waitlistId) {
        const entry = Data.getWaitlist().find(w => w.id === waitlistId);
        if (!entry) return;

        const child = Data.getChildById(entry.childId);
        const parents = entry.parentIds.map(pid => Data.getParentById(pid)).filter(Boolean);

        // Update statuses to On Process
        if (child) {
            Data.updateChild(child.id, { status: 'On Process' });
        }
        parents.forEach(p => {
            Data.updateParent(p.id, { status: 'On Process' });
        });

        // Create enrollment project
        const tasks = Utils.getEnrollmentTasks().map(name => ({
            id: Utils.generateId(),
            name,
            completed: false,
            completedAt: null
        }));

        Data.addProject({
            type: 'Enrollment Inquiry',
            parentIds: entry.parentIds,
            childId: entry.childId,
            location: entry.preferredLocation,
            transitionCategory: null,
            tasks,
            status: 'In Progress'
        });

        // Remove from waitlist
        Data.deleteWaitlistEntry(waitlistId);

        App.closeModal();
        Utils.showToast('Enrollment process started', 'success');
        App.switchTab('projects');
    }
};
