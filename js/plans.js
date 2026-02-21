/**
 * Day Care CRM - Plan Limits & Feature Gating
 * Central configuration for subscription tier restrictions.
 * 
 * Plan tiers: 'starter', 'professional', 'growth'
 * During trial (no subscription yet), users get 'starter' level access.
 */

const PLAN_LIMITS = {
    starter: {
        label: 'Starter',
        maxLocations: 1,
        maxClassrooms: 3,
        maxStaffUsers: 2,
        features: {
            parentProfiles: true,
            childProfiles: true,
            dailyAttendance: true,
            enrollmentDashboard: true,
            classroomAvailability: true,
            projects: true,
            serviceAgreementTracking: false,
            waitlistManagement: false,
            availabilityForecasting: false,
            onboardingPipelines: false,
            reportsSuite: false,
            smartNotifications: false,
            dataExport: false,
            monthlyCapacityOverrides: false,
            prioritySupport: false,
            dedicatedOnboarding: false,
            customBranding: false
        }
    },
    professional: {
        label: 'Professional',
        maxLocations: 3,
        maxClassrooms: 15,
        maxStaffUsers: 5,
        features: {
            parentProfiles: true,
            childProfiles: true,
            dailyAttendance: true,
            enrollmentDashboard: true,
            classroomAvailability: true,
            projects: true,
            serviceAgreementTracking: true,
            waitlistManagement: true,
            availabilityForecasting: true,
            onboardingPipelines: true,
            reportsSuite: true,
            smartNotifications: true,
            dataExport: false,
            monthlyCapacityOverrides: true,
            prioritySupport: false,
            dedicatedOnboarding: false,
            customBranding: false
        }
    },
    growth: {
        label: 'Growth',
        maxLocations: 10,
        maxClassrooms: 50,
        maxStaffUsers: Infinity,
        features: {
            parentProfiles: true,
            childProfiles: true,
            dailyAttendance: true,
            enrollmentDashboard: true,
            classroomAvailability: true,
            projects: true,
            serviceAgreementTracking: true,
            waitlistManagement: true,
            availabilityForecasting: true,
            onboardingPipelines: true,
            reportsSuite: true,
            smartNotifications: true,
            dataExport: true,
            monthlyCapacityOverrides: true,
            prioritySupport: true,
            dedicatedOnboarding: true,
            customBranding: true
        }
    }
};

/**
 * PlanGate - Utility for checking feature access
 */
const PlanGate = {
    /**
     * Get the current user's plan tier. Defaults to 'starter' if unknown.
     */
    getCurrentTier() {
        const user = Auth?.currentUser;
        return (user && user.planTier) ? user.planTier : 'starter';
    },

    /**
     * Get limits object for the current tier.
     */
    getLimits() {
        return PLAN_LIMITS[this.getCurrentTier()] || PLAN_LIMITS.starter;
    },

    /**
     * Check if a specific feature is enabled for the current tier.
     * @param {string} featureName - Key from the features object
     * @returns {boolean}
     */
    hasFeature(featureName) {
        const limits = this.getLimits();
        return limits.features[featureName] === true;
    },

    /**
     * Check if the user can add more locations.
     * @param {number} currentCount - Current number of locations
     * @returns {boolean}
     */
    canAddLocation(currentCount) {
        return currentCount < this.getLimits().maxLocations;
    },

    /**
     * Check if the user can add more classrooms across all locations.
     * @param {number} currentCount - Current total classroom count
     * @returns {boolean}
     */
    canAddClassroom(currentCount) {
        return currentCount < this.getLimits().maxClassrooms;
    },

    /**
     * Check if the user can add more staff users.
     * @param {number} currentCount - Current number of staff users
     * @returns {boolean}
     */
    canAddUser(currentCount) {
        return currentCount < this.getLimits().maxStaffUsers;
    },

    /**
     * Get the upgrade tier name (one step above current).
     */
    getUpgradeTier() {
        const tier = this.getCurrentTier();
        if (tier === 'starter') return 'Professional';
        if (tier === 'professional') return 'Growth';
        return null; // Already at max
    },

    /**
     * Show upgrade prompt modal.
     * @param {string} featureName - Human-readable feature name
     */
    showUpgradePrompt(featureName) {
        const upgradeTo = this.getUpgradeTier();
        const currentLabel = this.getLimits().label;

        const body = `
            <div style="text-align: center; padding: 20px 0;">
                <div style="font-size: 3rem; margin-bottom: 15px;">🔒</div>
                <h3 style="font-family: 'Quicksand', sans-serif; font-weight: 700; color: var(--text-dark, #1a2e1e); margin-bottom: 10px;">
                    Upgrade Required
                </h3>
                <p style="color: var(--neutral-600, #4a5568); font-size: 1rem; line-height: 1.6; margin-bottom: 20px;">
                    <strong>${featureName}</strong> is not available on the <strong>${currentLabel}</strong> plan.
                    ${upgradeTo ? `Upgrade to <strong>${upgradeTo}</strong> to unlock this feature.` : ''}
                </p>
                <a href="pricing.html" class="btn btn-primary" style="display: inline-block; padding: 12px 30px; text-decoration: none; font-size: 1rem;">
                    View Plans & Upgrade
                </a>
            </div>
        `;
        App.openModal('Feature Locked', body);
    },

    /**
     * Show limit reached modal.
     * @param {string} resourceName - e.g. "Locations", "Classrooms", "Staff Users"
     * @param {number} maxCount - The limit for this tier
     */
    showLimitReached(resourceName, maxCount) {
        const upgradeTo = this.getUpgradeTier();
        const currentLabel = this.getLimits().label;

        const body = `
            <div style="text-align: center; padding: 20px 0;">
                <div style="font-size: 3rem; margin-bottom: 15px;">⚠️</div>
                <h3 style="font-family: 'Quicksand', sans-serif; font-weight: 700; color: var(--text-dark, #1a2e1e); margin-bottom: 10px;">
                    Limit Reached
                </h3>
                <p style="color: var(--neutral-600, #4a5568); font-size: 1rem; line-height: 1.6; margin-bottom: 20px;">
                    Your <strong>${currentLabel}</strong> plan allows up to <strong>${maxCount} ${resourceName}</strong>.
                    ${upgradeTo ? `Upgrade to <strong>${upgradeTo}</strong> to increase your limit.` : 'You have reached the maximum limit for your plan.'}
                </p>
                <a href="pricing.html" class="btn btn-primary" style="display: inline-block; padding: 12px 30px; text-decoration: none; font-size: 1rem;">
                    View Plans & Upgrade
                </a>
            </div>
        `;
        App.openModal('Limit Reached', body);
    }
};
