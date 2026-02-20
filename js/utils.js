/**
 * Day Care CRM - Utility Functions
 */

const Utils = {
    /**
     * Generate a UUID v4
     */
    generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    /**
     * Get initials from name
     */
    getInitials(firstName, lastName) {
        return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    },

    /**
     * Calculate age from date of birth
     * @param {string} dob - Date of birth in YYYY-MM-DD format
     * @returns {object} - { years, months, totalMonths, display }
     */
    calculateAge(dob) {
        const birthDate = new Date(dob);
        const today = new Date();

        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();

        if (months < 0) {
            years--;
            months += 12;
        }

        if (today.getDate() < birthDate.getDate()) {
            months--;
            if (months < 0) {
                years--;
                months += 12;
            }
        }

        const totalMonths = years * 12 + months;

        let display;
        if (years >= 1) {
            display = `${years}y ${months}m`;
        } else {
            display = `${months}m`;
        }

        return { years, months, totalMonths, display };
    },

    /**
     * Get age in months from DOB
     */
    getAgeInMonths(dob) {
        return this.calculateAge(dob).totalMonths;
    },

    /**
     * Add months to a date
     */
    addMonths(date, months) {
        const d = new Date(date);
        d.setMonth(d.getMonth() + months);
        return d;
    },

    /**
     * Get age in months at a specific date
     */
    getAgeInMonthsAtDate(dob, targetDate) {
        const birthDate = new Date(dob);
        const target = new Date(targetDate);

        let years = target.getFullYear() - birthDate.getFullYear();
        let months = target.getMonth() - birthDate.getMonth();

        if (months < 0) {
            years--;
            months += 12;
        }

        // Adjust for day of month
        if (target.getDate() < birthDate.getDate()) {
            months--;
            if (months < 0) { // Fix negative month if day wrap causes it
                years--;
                months += 12;
            }
        }

        return years * 12 + months;
    },

    /**
     * Get a consistent badge class for a location
     */
    /**
     * Get a consistent badge class for a location
     */
    getLocationColor(location) {
        if (!location) return 'location-generic';

        // Use Data.getLocations() to find index for deterministic coloring
        // This relies on Data being loaded. If not available, hash it.
        if (typeof Data !== 'undefined' && Data.getLocations) {
            const locations = Data.getLocations();
            const index = locations.indexOf(location);
            if (index !== -1) {
                // Map index 0-9 to location-color-1 to location-color-10
                const colorIndex = (index % 10) + 1;
                return `location-color-${colorIndex}`;
            }
        }

        // Fallback: Simple hash if Data not ready or location not found
        let hash = 0;
        for (let i = 0; i < location.length; i++) {
            hash = location.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % 10 + 1;
        return `location-color-${index}`;
    },

    /**
     * Get a consistent color for a classroom (hex code)
     */
    getClassroomColor(id) {
        if (!id) return '#ccc';
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
            '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'
        ];
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    },

    /**
     * Get the Monday of the current week
     */
    getWeekStart(date = new Date()) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    },

    /**
     * Get the Sunday of the current week
     */
    getWeekEnd(date = new Date()) {
        const start = this.getWeekStart(date);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return end;
    },

    /**
     * Get the Friday of the current week (for Reports)
     */
    getWeekEndFriday(date = new Date()) {
        const start = this.getWeekStart(date);
        const end = new Date(start);
        end.setDate(end.getDate() + 4);
        return end;
    },

    /**
     * Format date for display (MM-DD-YYYY format)
     */
    formatDate(date, format = 'short') {
        if (!date) return '-';

        let d;
        // Handle YYYY-MM-DD strings explicitly to treat them as local date (prevent timezone shift)
        // Handle string dates (YYYY-MM-DD or ISO) by explicitly parsing year/month/day
        // This prevents timezone shifts by treating the date as "local" regardless of input format
        if (typeof date === 'string') {
            const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (match) {
                const y = parseInt(match[1], 10);
                const m = parseInt(match[2], 10);
                const day = parseInt(match[3], 10);
                d = new Date(y, m - 1, day);
            } else {
                d = new Date(date);
            }
        } else {
            d = new Date(date);
        }

        if (isNaN(d.getTime())) return '-';

        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const year = d.getFullYear();

        const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        switch (format) {
            case 'short':
                return `${month}-${day}-${year}`;
            case 'slashes':
                return `${month}/${day}/${year}`;
            case 'long':
                return `${weekdays[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${year}`;
            case 'monthYear':
                return `${months[d.getMonth()]} ${year}`;
            case 'weekday':
                return weekdays[d.getDay()];
            case 'datetime':
                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
                const formattedHours = d.getHours() % 12 || 12;
                return `${month}-${day}-${year} ${formattedHours}:${minutes} ${ampm}`;
            case 'time':
                const tMinutes = String(d.getMinutes()).padStart(2, '0');
                const tAmpm = d.getHours() >= 12 ? 'PM' : 'AM';
                const tHours = d.getHours() % 12 || 12;
                return `${tHours}:${tMinutes} ${tAmpm}`;
            default:
                return `${month}-${day}-${year}`;
        }
    },

    /**
     * Parse MM/DD/YYYY to YYYY-MM-DD
     */
    parseDateFromSlash(dateString) {
        if (!dateString) return null;
        const match = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (!match) return dateString; // Return original if not matching (fallback)

        const m = match[1];
        const d = match[2];
        const y = match[3];
        return `${y}-${m}-${d}`;
    },

    /**
     * Format date for input fields (YYYY-MM-DD)
     */
    formatDateInput(date) {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    },

    /**
     * Get days until a date
     */
    daysUntil(date) {
        const target = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        target.setHours(0, 0, 0, 0);
        const diff = target - today;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    },

    /**
     * Get classroom for age at specific location
     */
    getClassroomForAge(ageInMonths, location) {
        const classrooms = Data.getClassrooms().filter(c => c.location === location);
        for (const classroom of classrooms) {
            if (ageInMonths >= classroom.ageRangeMonths.min && ageInMonths < classroom.ageRangeMonths.max) {
                return classroom;
            }
        }
        // Return last classroom if over max age
        return classrooms[classrooms.length - 1];
    },

    /**
     * Detect transition category based on current and next classroom
     */
    getTransitionCategory(currentClassroomId, nextClassroomId) {
        const transitions = {
            'dc01-rm01_dc01-rm02': 'Infant Non-Mobile to Infant Mobile',
            'dc01-rm02_dc01-rm03': 'Infant Mobile to Toddler',
            'dc01-rm03_dc01-rm04': 'Toddler to Lower Preschool',
            'dc01-rm04_dc01-rm05': 'Lower Preschool to Upper Preschool',
            'dc02-rm01_dc02-rm02': 'Infant to Toddler'
        };
        return transitions[`${currentClassroomId}_${nextClassroomId}`] || null;
    },

    /**
     * Get tasks for transition category
     */
    getTransitionTasks(category) {
        const taskLists = {
            'Infant Non-Mobile to Infant Mobile': [
                'Schedule a 15-min virtual meeting with head teacher'
            ],
            'Infant Mobile to Toddler': [
                'Schedule a 15-min virtual meeting with head teacher',
                'Attach Service Agreement',
                'Attach Transition form'
            ],
            'Toddler to Lower Preschool': [
                'Schedule a 15-min virtual meeting with head teacher',
                'Attach Service Agreement',
                'Attach Transition form',
                'Attach Field trip form'
            ],
            'Lower Preschool to Upper Preschool': [
                'Schedule a 15-min virtual meeting with head teacher',
                'Verify Field Trip Form',
                'Attach Service Agreement'
            ],
            'Infant to Toddler': [
                'Schedule a 15-min virtual meeting with head teacher',
                'Attach Service Agreement',
                'Attach Transition form'
            ]
        };
        return taskLists[category] || [];
    },

    /**
     * Get next classroom based on current
     */
    getNextClassroom(classroomId) {
        const classrooms = Data.getClassrooms();
        const current = classrooms.find(c => c.id === classroomId);
        if (!current) return null;

        // Logic: Find classroom with minAge == current.maxAge (approx) in same location
        // Or simply find the next one in the list for that location?
        // Assuming classrooms are ordered by age.
        const locationClassrooms = classrooms.filter(c => c.location === current.location);
        const currentIndex = locationClassrooms.findIndex(c => c.id === classroomId);

        if (currentIndex >= 0 && currentIndex < locationClassrooms.length - 1) {
            return locationClassrooms[currentIndex + 1];
        }
        return null; // No next classroom (e.g. graduated)
    },

    /**
     * Get enrollment inquiry tasks
     */
    getEnrollmentTasks() {
        return [
            'Service Agreement Sent',
            'Service Agreement Follow Up',
            'Service Agreement Signed',
            'Enrollment Docs Sent',
            'Invoice Sent',
            'Brightwheel Access Sent',
            'Brightwheel Access Active'
        ];
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}</span>
            <span class="toast-message">${message}</span>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Get status badge class
     */
    getStatusBadgeClass(status) {
        const map = {
            'Enrolled': 'badge-enrolled',
            'Waitlisted': 'badge-waitlisted',
            'On Process': 'badge-on-process',
            'Drop-In': 'badge-drop-in'
        };
        return map[status] || 'badge-enrolled';
    },



    /**
     * Calculate next transition date based on age and classroom
     */
    calculateNextTransitionDate(dob, classroomId) {
        const classroom = Data.getClassrooms().find(c => c.id === classroomId);
        if (!classroom) return null;

        const birthDate = new Date(dob);
        const maxAgeMonths = classroom.ageRangeMonths.max;

        // Calculate when child will reach max age for this classroom
        const transitionDate = new Date(birthDate);
        transitionDate.setMonth(transitionDate.getMonth() + maxAgeMonths);

        return this.formatDateInput(transitionDate);
    },

    /**
     * Get month data for availability forecast
     */
    getMonthsForForecast(startMonth = new Date(), count = 6) {
        const months = [];
        const current = new Date(startMonth);
        current.setDate(1);

        for (let i = 0; i < count; i++) {
            months.push({
                date: new Date(current),
                label: this.formatDate(current, 'monthYear')
            });
            current.setMonth(current.getMonth() + 1);
        }

        return months;
    },

    /**
     * Export report to PDF (using browser print)
     */
    exportToPDF() {
        window.print();
    }
};
