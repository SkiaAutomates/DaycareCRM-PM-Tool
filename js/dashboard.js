/**
 * Day Care CRM - Dashboard Module
 */

const Dashboard = {
    render() {
        const container = document.getElementById('dashboardContent');
        const stats = Data.getDashboardStats();
        const locations = Data.getLocations();

        // Helper to get icon/color based on index or name
        const getStatStyle = (index) => {
            const styles = [
                { icon: '🏔️', color: 'blue' },
                { icon: '🌊', color: 'green' },
                { icon: '🏰', color: 'purple' },
                { icon: '🏡', color: 'orange' },
                { icon: '⛺', color: 'yellow' }
            ];
            return styles[index % styles.length];
        };

        const locationStatsHtml = locations.map((loc, index) => {
            const count = stats.locationCounts[loc] || 0;
            const style = getStatStyle(index);
            return `
                <div class="stat-card">
                    <div class="stat-icon ${style.color}">${style.icon}</div>
                    <div class="stat-info">
                        <h3>${count}</h3>
                        <p>${loc}</p>
                    </div>
                </div>
            `;
        }).join('');

        const locationClassroomsHtml = locations.map(loc => {
            // Determine badge class
            const badgeClass = Utils.getLocationColor(loc);

            return `
                <div class="location-section">
                    <div class="location-header">
                        <span class="location-badge ${badgeClass}">${loc}</span>
                        <h2>Classrooms</h2>
                    </div>
                    <div class="classroom-grid">
                        ${this.renderClassroomCards(loc)}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <!-- Stats Cards -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon green">👶</div>
                    <div class="stat-info">
                        <h3>${stats.totalEnrolled}</h3>
                        <p>Total Enrolled</p>
                    </div>
                </div>
                ${locationStatsHtml}
                <div class="stat-card">
                    <div class="stat-icon yellow">⏳</div>
                    <div class="stat-info">
                        <h3>${stats.waitlistCount}</h3>
                        <p>Waitlisted</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple">📋</div>
                    <div class="stat-info">
                        <h3>${stats.activeProjects}</h3>
                        <p>Active Projects</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon blue">🚶</div>
                    <div class="stat-info">
                        <h3>${stats.toursThisWeek}</h3>
                        <p>Tours This Week</p>
                    </div>
                </div>
            </div>

            <!-- Classroom Breakdown -->
            ${locationClassroomsHtml}

            <!-- Quick Actions -->
            <div class="card" style="margin-top: var(--spacing-6);">
                <div class="card-header">
                    <span class="card-title">Quick Actions</span>
                </div>
                <div class="card-body">
                    <div style="display: flex; gap: var(--spacing-3); flex-wrap: wrap;">
                        <button class="btn btn-primary" onclick="App.switchTab('crm'); CRM.showAddParentModal();">+ Add Parent</button>
                        <button class="btn btn-primary" onclick="App.switchTab('crm'); CRM.showAddChildModal();">+ Add Child</button>
                        <button class="btn btn-secondary" onclick="App.switchTab('projects'); Projects.showAddProjectModal();">+ New Project</button>
                        <button class="btn btn-secondary" onclick="App.switchTab('reports');">View Reports</button>
                    </div>
                </div>
            </div>


        `;
    },

    renderClassroomCards(location) {
        const classrooms = Data.getClassroomsByLocation(location);

        return classrooms.map(classroom => {
            const capacity = Data.getClassroomCapacity(classroom.id);
            const fillClass = capacity.percentage >= 90 ? 'high' : capacity.percentage >= 70 ? 'medium' : 'low';

            // Extract just the dynamic class name, but we need to apply it to the card
            // The card usually has a border color. 
            // In index.css .location-color-X sets background and color. 
            // For the classroom card, we might want a border or similar.
            // But let's look at how it was done: 
            // .location-1 { border-left: 4px solid var(--primary-600); }
            // The new classes set background. 
            // We might need a utility to get the COLOR code itself if we want border, 
            // OR just apply the badge class to a specific element.
            // The existing code applied 'location-1' to the card itself.
            // Let's assume we want to keep the border-left style.

            // To support the new system, let's add a "border" style to our new classes?
            // actually, the new classes are .location-color-X.
            // Let's see if we can just apply that class to a marker or the whole card?
            // The old CSS:
            /* 
            .location-1 {
                border-left: 4px solid var(--primary-600);
            }
            */
            // The new CSS:
            /*
            .location-color-1 { background: ...; color: ... }
            */
            // They are different. We need to reconcile this.
            // Ideally, the classroom card should have a badge or a colored strip.
            // Let's change the card design slightly to use the badge inside, 
            // OR add border styles to the new classes.

            // For now, let's use the badge class on the card and ensure CSS handles it 
            // OR simply add a badge INSIDE the card and remove the border dependancy if possible,
            // or better: add border styling to the new classes in index.css?
            // I didn't add border styling there.

            // Let's just use the badge class on the card for now, allows background tint?
            // Or better, let's render a BADGE inside the card next to the name.

            const badgeClass = Utils.getLocationColor(location);

            let ageDisplay = `${classroom.ageRangeMonths.min}-${classroom.ageRangeMonths.max} months`;
            if (classroom.ageCategory === 'Non Mobile Infant') {
                const minWeeks = Math.round(classroom.ageRangeMonths.min * 4.33);
                ageDisplay = `${minWeeks} weeks - ${classroom.ageRangeMonths.max} months`;
            }

            return `
                <div class="classroom-card" style="border-left: 4px solid currentColor;">
                    <div class="classroom-name">
                        ${classroom.name} 
                        <span class="location-badge ${badgeClass}" style="font-size: 0.7em; vertical-align: middle; margin-left: 8px;">${location}</span>
                    </div>
                    <div class="classroom-info">${classroom.ageCategory} (${ageDisplay})</div>
                    <div class="capacity-bar">
                        <div class="capacity-fill ${fillClass}" style="width: ${capacity.percentage}%"></div>
                    </div>
                    <div class="capacity-text">
                        <span>${capacity.filled} / ${capacity.total} enrolled</span>
                        <span>${capacity.available} spots available</span>
                    </div>
                </div>
            `;
        }).join('');
    }
};
