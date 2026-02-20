/**
 * Day Care CRM - Main Application Controller
 */

const App = {
    currentTab: 'dashboard',
    currentMonth: new Date(),

    async init() {
        document.title = "Day Care Operation | CRM";
        // Mobile Togglentication first
        if (!Auth.isAuthenticated()) {
            Auth.showLoginScreen();
            return;
        }

        // User is authenticated - show the app
        document.querySelector('.app-container').style.display = 'flex';

        try {
            this.addUserMenu();
            this.setupNavigation();
            this.setupModal();
            this.setupModal();
            // this.setupImportButton(); // Removed for production
            this.updateCurrentDate();
            // this.render();      // Removed as it is not a function in this version
            Data.init().then(() => {
                console.log('✅ Data initialized');
                Attendance.init(); // Initialize attendance filters
                this.loadTab('dashboard');
                this.checkNotifications();
            }).catch(err => {
                console.error('Data init error:', err);
                // Still load the tab with localStorage data
                this.loadTab('dashboard');
                this.checkNotifications();
            });
        } catch (error) {
            console.error('App init error:', error);
        }

        // Set up periodic notification check
        setInterval(() => this.checkNotifications(), 60000);
    },

    // Add user menu to sidebar
    addUserMenu() {
        // ... (unchanged)
        const user = Auth.getUser();
        console.log('Adding user menu for:', user);
        if (!user) return;

        const nav = document.querySelector('.sidebar-nav');
        console.log('Found sidebar-nav:', nav);
        if (!nav || !nav.parentElement) {
            console.error('Could not find .nav-menu element');
            return;
        }

        const userMenu = document.createElement('div');
        userMenu.className = 'user-menu';
        userMenu.innerHTML = `
            <div class="user-avatar" style="display: none;">${user.email[0].toUpperCase()}</div>
            <span class="user-email" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; color: rgba(255,255,255,0.9); font-size: 0.9em;" title="${user.email}">${user.email}</span>
            <button class="user-logout" onclick="Auth.signOut()" style="border: none; background: transparent; color: white; cursor: pointer; padding: 5px; font-size: 0.9em; text-decoration: underline;">Logout</button>
        `;
        nav.parentElement.appendChild(userMenu);
        console.log('User menu added');
    },

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        console.log('Found nav items:', navItems.length);
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                this.switchTab(tab);
            });
        });
    },

    switchTab(tabName) {
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });

        this.currentTab = tabName;
        this.loadTab(tabName);
    },

    loadTab(tabName) {
        switch (tabName) {
            case 'dashboard':
                Dashboard.render();
                break;
            case 'crm':
                CRM.render();
                break;
            case 'attendance':
                Attendance.render();
                break;
            case 'projects':
                Projects.render();
                break;
            case 'availability':
                Availability.render(this.currentMonth);
                break;
            case 'notifications':
                Notifications.render();
                break;
            case 'reports':
                Reports.render();
                break;
            case 'settings':
                Settings.render();
                break;
            case 'help':
                Help.render();
                break;
        }
    },

    setupModal() {
        const overlay = document.getElementById('modalOverlay');
        const closeBtn = document.getElementById('modalClose');

        closeBtn.addEventListener('click', () => this.closeModal());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeModal();
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    },

    openModal(title, bodyHtml, footerHtml = '') {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = bodyHtml;
        document.getElementById('modalFooter').innerHTML = footerHtml;
        document.getElementById('modalOverlay').classList.add('show');
    },

    closeModal() {
        document.getElementById('modalOverlay').classList.remove('show');
    },

    updateCurrentDate() {
        const update = () => {
            const now = new Date();
            const dateEl = document.getElementById('currentDate');
            if (dateEl) {
                const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
                dateEl.innerHTML = `<div style="font-weight: 500;">${dateStr}</div><div style="font-size: 0.9em; margin-top: 4px; opacity: 0.8; font-family: monospace;">${timeStr}</div>`;
            }
        };
        update();
        setInterval(update, 1000);
    },

    checkNotifications() {
        // Check for new alerts
        Data.checkTransitionAlerts();
        Data.checkWaitlistAlerts();
        Data.checkWaitlistedProjectAlerts();
        Data.checkOffboardingDates();

        // Update badge
        const unread = Data.getUnreadNotifications().length;
        const badge = document.getElementById('notificationBadge');
        if (unread > 0) {
            badge.textContent = unread > 99 ? '99+' : unread;
            badge.classList.add('show');
        } else {
            badge.classList.remove('show');
        }
    },

    // Form helpers
    getFormData(formId) {
        const form = document.getElementById(formId);
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });
        return data;
    },

    validateForm(formId) {
        const form = document.getElementById(formId);
        return form.checkValidity();
    },

    // Month navigation for Availability
    navigateMonth(direction) {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + direction);
        Availability.render(this.currentMonth);
    },

    // Import button removed for production

    // Refresh current tab
    refresh() {
        this.loadTab(this.currentTab);
        this.checkNotifications();
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();

    // Set up month navigation
    document.getElementById('prevMonth')?.addEventListener('click', () => App.navigateMonth(-1));
    document.getElementById('nextMonth')?.addEventListener('click', () => App.navigateMonth(1));

    // Set up export PDF
    document.getElementById('exportPdfBtn')?.addEventListener('click', () => Utils.exportToPDF());

    // Set up CRM buttons
    document.getElementById('addParentBtn')?.addEventListener('click', () => CRM.showAddParentModal());
    document.getElementById('addChildBtn')?.addEventListener('click', () => CRM.showAddChildModal());
    document.getElementById('addWaitlistBtn')?.addEventListener('click', () => CRM.showAddWaitlistModal());

    // Set up Projects button
    document.getElementById('addProjectBtn')?.addEventListener('click', () => Projects.showAddProjectModal());

    // Set up Notifications button
    document.getElementById('markAllReadBtn')?.addEventListener('click', () => {
        Data.markAllNotificationsRead();
        App.refresh();
        Utils.showToast('All notifications marked as read', 'success');
    });

    // Set up CRM search
    const searchInput = document.getElementById('crmSearch');
    if (searchInput) {
        searchInput.addEventListener('input', Utils.debounce(() => CRM.render(), 300));
    }

    // Set up filters
    // Set up filters
    document.getElementById('statusFilter')?.addEventListener('change', () => CRM.render());

    document.getElementById('locationFilter')?.addEventListener('change', () => {
        CRM.updateClassroomFilterOptions();
        CRM.render();
    });

    document.getElementById('classroomFilter')?.addEventListener('change', () => CRM.render());

    // Initialize classroom filter
    if (document.getElementById('classroomFilter')) {
        CRM.updateClassroomFilterOptions();
    }
});
