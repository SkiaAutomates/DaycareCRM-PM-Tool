/**
 * Day Care CRM - Settings Module
 * User Management, Locations, & Classrooms
 */

const Settings = {
    render() {
        // Enforce Access
        if (!Auth.isAdmin()) {
            document.getElementById('settingsContent').innerHTML = `
                <div class="empty-state">
                    <h3>Access Denied</h3>
                    <p>You do not have permission to view this page.</p>
                </div>
            `;
            return;
        }

        const container = document.getElementById('settingsContent');
        container.innerHTML = `
            <div class="settings-grid" style="display: flex; flex-direction: column; gap: 30px;">
                <!-- User Management Section -->
                <div id="userManagementSection"></div>

                <!-- Locations Section -->
                <div id="locationsSection"></div>

                <!-- Subscription / Plan Section -->
                <div class="card" style="border: 1px solid rgba(45,125,70,0.25); background: linear-gradient(135deg, #f0faf4 0%, #fff 100%);">
                    <div class="card-header" style="background: transparent; border-bottom: 1px solid rgba(45,125,70,0.15);">
                        <span class="card-title" style="color: var(--primary-700);">
                            <i class="fas fa-crown" style="margin-right: 8px; color: #f59e0b;"></i> Your Subscription
                        </span>
                        <a href="pricing.html" target="_blank" class="btn btn-sm btn-outline-secondary" style="font-size: 0.8em;">
                            <i class="fas fa-external-link-alt"></i> View Pricing Page
                        </a>
                    </div>
                    <div class="card-body" style="padding: 20px;">
                        <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
                            <!-- Plan Badge -->
                            <div style="background: linear-gradient(135deg, var(--primary-600), var(--primary-800)); color: white; border-radius: 12px; padding: 16px 24px; min-width: 180px; text-align: center;">
                                <div style="font-size: 0.78em; opacity: 0.85; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Current Plan</div>
                                <div style="font-family: 'Quicksand', sans-serif; font-size: 1.6em; font-weight: 800;">Developer</div>
                                <div style="font-size: 0.8em; opacity: 0.8; margin-top: 2px;">All features unlocked</div>
                            </div>
                            <!-- Info -->
                            <div style="flex: 1; min-width: 200px;">
                                <p style="margin: 0 0 10px 0; font-size: 0.95em; color: var(--neutral-700); line-height: 1.6;">
                                    You are using the <strong>Developer Edition</strong> with all features enabled. When ready to offer this CRM to paying clients, share the link below with prospects.
                                </p>
                                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                    <a href="pricing.html" target="_blank" class="btn btn-primary btn-sm">
                                        <i class="fas fa-tag"></i> Open Pricing Page
                                    </a>
                                    <button class="btn btn-sm btn-outline-secondary" onclick="navigator.clipboard.writeText(window.location.origin + '/pricing.html').then(() => Utils.showToast('Pricing page URL copied!', 'success'))">
                                        <i class="fas fa-copy"></i> Copy URL
                                    </button>
                                </div>
                            </div>
                            <!-- Plan Tiers Quick View -->
                            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                <div style="border: 1px solid var(--neutral-200); border-radius: 8px; padding: 10px 14px; text-align: center; min-width: 90px;">
                                    <div style="font-weight: 800; font-size: 1.15em; color: var(--neutral-700);">$59</div>
                                    <div style="font-size: 0.75em; color: var(--neutral-500);">Starter/mo</div>
                                </div>
                                <div style="border: 2px solid var(--primary-500); border-radius: 8px; padding: 10px 14px; text-align: center; min-width: 90px; background: var(--primary-50);">
                                    <div style="font-weight: 800; font-size: 1.15em; color: var(--primary-700);">$99</div>
                                    <div style="font-size: 0.75em; color: var(--primary-600); font-weight: 600;">Pro/mo ⭐</div>
                                </div>
                                <div style="border: 1px solid var(--neutral-200); border-radius: 8px; padding: 10px 14px; text-align: center; min-width: 90px;">
                                    <div style="font-weight: 800; font-size: 1.15em; color: var(--neutral-700);">$149</div>
                                    <div style="font-size: 0.75em; color: var(--neutral-500);">Growth/mo</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- System Tools (Admin Only) -->
                ${(Auth.isAdmin() || Auth.currentUser?.email === ALLOWED_EMAIL) ? `
                <div class="card">
                    <div class="card-header">
                        <span class="card-title"><i class="fas fa-tools" style="margin-right: 8px; color: var(--neutral-500);"></i>System Tools</span>
                    </div>
                    <div class="card-body" style="padding: 20px;">
                        <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap; background: linear-gradient(135deg, #fef9ec, #fff); border: 1px solid #fde68a; border-radius: 10px; padding: 16px 20px;">
                            <div style="background: #f59e0b; color: white; width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.3em; flex-shrink: 0;"><i class="fas fa-magic"></i></div>
                            <div style="flex: 1; min-width: 160px;">
                                <div style="font-weight: 700; color: var(--secondary-800); margin-bottom: 3px;">Generate Demo Data</div>
                                <div style="font-size: 0.85em; color: var(--neutral-600); line-height: 1.5;">Populate the CRM with 70 sample families across your classrooms. Use this before sharing Temporary Access with a prospect.</div>
                            </div>
                            <button class="btn btn-primary" onclick="Settings.generateMockData()" style="background: #f59e0b; border-color: #f59e0b; white-space: nowrap;">
                                <i class="fas fa-magic"></i> Generate Demo Data
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Danger Zone (Admin Only) -->
                <div class="card" style="border: 1px dashed var(--error);">
                    <div class="card-header" style="background: #fffafa;">
                        <span class="card-title" style="font-size: 0.9em; color: var(--error);">Danger Zone</span>
                    </div>
                    <div class="card-body" style="padding: 15px;">
                        <button class="btn btn-sm btn-danger" onclick="if(confirm('Are you ABSOLUTELY sure you want to clear EVERYTHING? This action cannot be undone.')) { Data.deleteAllData(); }">
                            <i class="fas fa-trash-alt"></i> Clear All Data
                        </button>
                    </div>
                </div>
                ` : `
                <!-- Data Import (Clients) -->
                <div class="card">
                    <div class="card-header">
                        <span class="card-title"><i class="fas fa-file-import" style="margin-right: 8px; color: var(--primary-500);"></i>Import Your Data</span>
                    </div>
                    <div class="card-body" style="padding: 20px;">
                        <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap; background: linear-gradient(135deg, #f0fdf4, #fff); border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px 20px;">
                            <div style="background: var(--primary-500); color: white; width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.3em; flex-shrink: 0;"><i class="fas fa-file-csv"></i></div>
                            <div style="flex: 1; min-width: 160px;">
                                <div style="font-weight: 700; color: var(--secondary-800); margin-bottom: 3px;">Import from CSV</div>
                                <div style="font-size: 0.85em; color: var(--neutral-600); line-height: 1.5;">Upload a CSV file with your existing parent and child data to get started quickly.</div>
                            </div>
                            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                <button class="btn btn-secondary" onclick="Settings.downloadCSVTemplate()" style="white-space: nowrap;">
                                    <i class="fas fa-download"></i> Download Template
                                </button>
                                <label class="btn btn-primary" style="white-space: nowrap; cursor: pointer; margin: 0;">
                                    <i class="fas fa-upload"></i> Upload CSV
                                    <input type="file" accept=".csv" onchange="Settings.importCSV(this.files[0])" style="display: none;">
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                `}
            </div>
        `;

        this.renderUsers();
        this.renderLocations();
    },

    // =========================================================================
    // USER MANAGEMENT
    // =========================================================================

    renderUsers() {
        const users = Data.getUsers();
        const container = document.getElementById('userManagementSection');
        container.innerHTML = `
            <div class="card">
                <div class="card-header" style="justify-content: space-between;">
                    <span class="card-title">User Management</span>
                    <button class="btn btn-primary" onclick="Settings.showAddUserModal()">
                        <i class="fas fa-plus"></i> Add User
                    </button>
                </div>
                
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.length ? users.map(user => {
            let expirationHTML = '';
            if (user.role === 'Temporary Access') {
                const created = new Date(user.createdAt);
                const expires = new Date(created.getTime() + 120 * 60 * 60 * 1000); // +120 hours
                const now = new Date();

                if (now > expires) {
                    expirationHTML = `<br><span style="font-size: 0.8em; color: var(--error); font-weight: bold;">Expired</span>`;
                } else {
                    const diffHours = Math.floor((expires - now) / (1000 * 60 * 60));
                    expirationHTML = `<br><span style="font-size: 0.8em; color: var(--warning);"><i class="fas fa-clock"></i> Expires in ${diffHours}h</span>`;
                }
            }

            return `
                                <tr>
                                    <td>${user.name}</td>
                                    <td>${user.email}</td>
                                    <td><span class="badge ${this.getRoleBadgeClass(user.role)}">${user.role}</span></td>
                                    <td>${Utils.formatDate(user.createdAt)} ${expirationHTML}</td>
                                    <td>
                                        ${user.email === 'ggskiawp@gmail.com' ? '<span class="text-muted">System Admin</span>' : `
                                            <button class="btn btn-danger btn-sm" onclick="Settings.deleteUser('${user.id}')">Delete</button>
                                        `}
                                    </td>
                                </tr>
                                `;
        }).join('') : '<tr><td colspan="5" class="empty-state">No users found</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    async generateMockData() {
        if (!confirm('This will generate 70 new students (each with 2 parents), assign them to random locations/classrooms, and create varied schedules (FT/PT). Continue?')) return;

        Utils.showToast('Generating mock data... Please wait and do not close the page.', 'info');

        const wasSupabaseEnabled = Data.supabaseEnabled;
        Data.supabaseEnabled = false; // Disable individual sync to prevent 200+ requests

        const newParents = [];
        const newChildren = [];
        const newSchedules = [];

        const firstNames = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley", "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle", "Kenneth", "Dorothy", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa", "Edward", "Deborah", "Ronald", "Stephanie", "Timothy", "Rebecca", "Jason", "Sharon", "Jeffrey", "Laura", "Ryan", "Cynthia", "Jacob", "Kathleen", "Gary", "Amy", "Nicholas", "Shirley", "Eric", "Angela", "Jonathan", "Helen", "Stephen", "Anna", "Larry", "Brenda", "Justin", "Pamela", "Scott", "Nicole", "Brandon", "Emma", "Benjamin", "Samantha", "Samuel", "Katherine", "Gregory", "Christine", "Frank", "Debra", "Alexander", "Rachel", "Raymond", "Catherine", "Patrick", "Carolyn", "Jack", "Janet", "Dennis", "Ruth", "Jerry", "Maria", "Tyler", "Heather", "Aaron", "Diane", "Jose", "Virginia", "Adam", "Julie", "Henry", "Joyce", "Nathan", "Victoria", "Douglas", "Olivia", "Zachary", "Kelly", "Peter", "Christina", "Kyle", "Lauren", "Walter", "Joan", "Ethan", "Evelyn", "Jeremy", "Judith", "Harold", "Megan", "Keith", "Cheryl", "Christian", "Andrea", "Roger", "Hannah", "Noah", "Martha", "Gerald", "Jacqueline", "Carl", "Frances", "Terry", "Gloria", "Sean", "Ann", "Austin", "Teresa", "Arthur", "Kathryn", "Lawrence", "Sara", "Jesse", "Janice", "Dylan", "Jean", "Bryan", "Alice", "Joe", "Madison", "Jordan", "Doris", "Billy", "Abigail", "Bruce", "Julia", "Albert", "Judy", "Willie", "Grace", "Gabriel", "Denise", "Logan", "Amber", "Alan", "Marilyn", "Juan", "Beverly", "Wayne", "Danielle", "Roy", "Theresa", "Ralph", "Sophia", "Randy", "Marie", "Eugene", "Diana", "Vincent", "Brittany", "Russell", "Natalie", "Elijah", "Isabella", "Louis", "Charlotte", "Bobby", "Rose", "Philip", "Alexis", "Johnny", "Kayla"];
        const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker", "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris", "Morales", "Murphy", "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper", "Peterson", "Bailey", "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson", "Watson", "Brooks", "Chavez", "Wood", "James", "Bennett", "Gray", "Mendoza", "Ruiz", "Hughes", "Price", "Alvarez", "Castillo", "Sanders", "Patel", "Myers", "Long", "Ross", "Foster", "Jimenez", "Powell", "Jenkins", "Perry", "Russell", "Sullivan", "Bell", "Coleman", "Butler", "Henderson", "Barnes", "Gonzales", "Fisher", "Vasquez", "Simmons", "Romero", "Jordan", "Patterson", "Alexander", "Hamilton", "Graham", "Reynolds", "Griffin", "Wallace", "Moreno", "West", "Cole", "Hayes", "Bryant", "Herrera", "Gibson", "Ellis", "Tran", "Medina", "Aguilar", "Stevens", "Murray", "Ford", "Castro", "Marshall", "Owens", "Harrison", "Fernandez", "Mcdonald", "Woods", "Washington", "Kennedy", "Wells", "Aly", "Love", "Howell", "Chapman", "Sandoval", "Webb", "Guzman", "Hayes", "Baldwin", "Boone"];

        const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const generateName = () => `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`;

        // Ensure uniqueness roughly
        const usedNames = new Set();
        const getUniqueName = () => {
            let name = generateName();
            let attempts = 0;
            while (usedNames.has(name) && attempts < 50) {
                name = generateName();
                attempts++;
            }
            usedNames.add(name);
            const [first, ...rest] = name.split(' ');
            const last = rest.join(' ');
            return { first, last };
        };

        const locations = Data.getLocations();
        const classrooms = Data.getClassrooms();

        let studentsAdded = 0;

        for (let i = 0; i < 70; i++) {
            // 1. Generate Parents (2)
            const p1Name = getUniqueName();
            const p2Name = getUniqueName();
            // Ensure same last name for 60% of couples
            if (Math.random() < 0.6) p2Name.last = p1Name.last;

            const parent1 = Data.addParent({
                firstName: p1Name.first,
                lastName: p1Name.last,
                email: `${p1Name.first.toLowerCase()}.${p1Name.last.toLowerCase()}.${Math.floor(Math.random() * 1000)}@example.com`,
                phone: `555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
                status: 'On Process'
            });
            newParents.push(parent1);

            const parent2 = Data.addParent({
                firstName: p2Name.first,
                lastName: p2Name.last,
                email: `${p2Name.first.toLowerCase()}.${p2Name.last.toLowerCase()}.${Math.floor(Math.random() * 1000)}@example.com`,
                phone: `555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
                status: 'On Process'
            });
            newParents.push(parent2);

            // 2. Generate Child
            const childName = getUniqueName();
            childName.last = p1Name.last; // Take parent 1's last name

            // Location & Classroom
            const location = getRandomElement(locations);
            const locClassrooms = classrooms.filter(c => c.location === location);
            const classroom = locClassrooms.length > 0 ? getRandomElement(locClassrooms) : null;

            // Random Age based on classroom category (approx)
            let ageMonths = 36; // default toddler
            if (classroom) {
                if (classroom.ageRangeMonths) {
                    ageMonths = classroom.ageRangeMonths.min + Math.random() * (classroom.ageRangeMonths.max - classroom.ageRangeMonths.min);
                }
            }
            const dob = new Date();
            dob.setMonth(dob.getMonth() - ageMonths);

            // Schedule
            const isFullTime = Math.random() > 0.4; // 60% Full Time
            let scheduleType = isFullTime ? 'Full Time' : 'Part Time';
            let daysOfWeek = null;

            if (!isFullTime) {
                // Pick 2 or 3 days
                const daysOptions = [['Monday', 'Wednesday', 'Friday'], ['Tuesday', 'Thursday']];
                daysOfWeek = getRandomElement(daysOptions);
            }

            // Enrollment Date (Past date for active status)
            const enrollmentDate = new Date();
            enrollmentDate.setMonth(enrollmentDate.getMonth() - (Math.floor(Math.random() * 6) + 1)); // 1-6 months ago

            const child = Data.addChild({
                firstName: childName.first,
                lastName: childName.last,
                dateOfBirth: Utils.formatDateInput(dob),
                status: 'Enrolled',
                location: location,
                classroomId: classroom ? classroom.id : null,
                scheduleType: scheduleType,
                enrollmentDate: Utils.formatDateInput(enrollmentDate),
                parentIds: [parent1.id, parent2.id]
            });
            newChildren.push(child);

            // Link parents back
            Data.updateParent(parent1.id, { childIds: [child.id] });
            const parent2ChildIds = parent2.childIds || [];
            parent2ChildIds.push(child.id);
            Data.updateParent(parent2.id, { childIds: parent2ChildIds });

            // 3. Add Schedule
            const schedule = Data.addSchedule({
                childId: child.id,
                type: scheduleType,
                startDate: Utils.formatDateInput(new Date()), // Starts today
                daysOfWeek: daysOfWeek
            });
            newSchedules.push(schedule);

            studentsAdded++;
        }

        Data.supabaseEnabled = wasSupabaseEnabled; // Restore sync

        if (Data.supabaseEnabled) {
            try {
                console.log('Bulk syncing generated data to Supabase...');

                // Only send columns that actually exist in the Supabase parents table
                // (no child_ids — that's a localStorage-only denormalized field)
                const parentsForSupabase = newParents.map(p => {
                    const updated = Data.getParentById(p.id);
                    return {
                        id: updated.id,
                        first_name: updated.firstName,
                        last_name: updated.lastName,
                        email: updated.email,
                        phone: updated.phone || null,
                        status: updated.status || 'On Process',
                        notes: updated.notes || null
                    };
                });

                // Only send columns that exist in the Supabase children table
                const childrenForSupabase = newChildren.map(c => ({
                    id: c.id,
                    first_name: c.firstName,
                    last_name: c.lastName,
                    date_of_birth: c.dateOfBirth || null,
                    status: c.status || 'Enrolled',
                    location: c.location || null,
                    classroom_id: c.classroomId || null,
                    schedule_type: c.scheduleType || 'Full Time',
                    enrollment_date: c.enrollmentDate || null
                }));

                if (parentsForSupabase.length) await Supabase.insert('parents', parentsForSupabase);
                if (childrenForSupabase.length) await Supabase.insert('children', childrenForSupabase);
                // Note: schedules table does not exist in Supabase schema — stored in localStorage only

            } catch (e) {
                console.error('Bulk sync failed:', e);
                // Data still exists locally — reload will show it
            }
        }

        // Set skip_sync so on reload Supabase data doesn't overwrite our fresh local copy
        localStorage.setItem('dc_skip_sync', 'true');

        Utils.showToast(`Successfully added ${studentsAdded} students and ${studentsAdded * 2} parents!`, 'success');
        setTimeout(() => location.reload(), 1500);
    },

    // =========================================================================
    // CSV IMPORT / EXPORT (For New Clients)
    // =========================================================================

    downloadCSVTemplate() {
        const headers = [
            'Child First Name',
            'Child Last Name',
            'Date of Birth (YYYY-MM-DD)',
            'Location',
            'Classroom',
            'Schedule (Full Time / Part Time)',
            'Days of Week (Mon,Tue,Wed,Thu,Fri)',
            'Enrollment Date (YYYY-MM-DD)',
            'Parent 1 First Name',
            'Parent 1 Last Name',
            'Parent 1 Email',
            'Parent 1 Phone',
            'Parent 2 First Name',
            'Parent 2 Last Name',
            'Parent 2 Email',
            'Parent 2 Phone'
        ];

        // Add 2 example rows
        const exampleRows = [
            ['Emma', 'Johnson', '2024-03-15', 'Main Location', 'Toddler Room', 'Full Time', 'Mon,Tue,Wed,Thu,Fri', '2025-09-01', 'Sarah', 'Johnson', 'sarah.j@email.com', '555-123-4567', 'Mike', 'Johnson', 'mike.j@email.com', '555-234-5678'],
            ['Liam', 'Smith', '2023-11-20', 'Main Location', 'Preschool Room', 'Part Time', 'Mon,Wed,Fri', '2025-08-15', 'Jessica', 'Smith', 'jess.s@email.com', '555-345-6789', '', '', '', '']
        ];

        const csv = [headers.join(','), ...exampleRows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'daycare_import_template.csv';
        a.click();
        URL.revokeObjectURL(url);
        Utils.showToast('Template downloaded! Fill it in and upload it back.', 'success');
    },

    async importCSV(file) {
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            Utils.showToast('Please upload a .csv file', 'error');
            return;
        }

        try {
            const text = await file.text();
            const lines = text.split(/\r?\n/).filter(l => l.trim());

            if (lines.length < 2) {
                Utils.showToast('CSV file is empty or has no data rows', 'error');
                return;
            }

            // Parse header
            const headers = lines[0].split(',').map(h => h.trim());
            const dataRows = lines.slice(1);

            if (!confirm(`Found ${dataRows.length} rows to import. Continue?`)) return;

            Utils.showToast(`Importing ${dataRows.length} records...`, 'info');

            let imported = 0;
            const locations = Data.getLocations();
            const classrooms = Data.getClassrooms();

            for (const row of dataRows) {
                // Simple CSV parsing (handles basic cases)
                const cols = row.split(',').map(c => c.trim());

                const childFirst = cols[0] || '';
                const childLast = cols[1] || '';
                const dob = cols[2] || '';
                const location = cols[3] || (locations[0] || 'Default Location');
                const classroomName = cols[4] || '';
                const scheduleType = cols[5] || 'Full Time';
                const daysOfWeek = cols[6] ? cols[6].split(',').map(d => d.trim()) : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
                const enrollmentDate = cols[7] || new Date().toISOString().split('T')[0];

                // Parent 1
                const p1First = cols[8] || '';
                const p1Last = cols[9] || '';
                const p1Email = cols[10] || '';
                const p1Phone = cols[11] || '';

                // Parent 2
                const p2First = cols[12] || '';
                const p2Last = cols[13] || '';
                const p2Email = cols[14] || '';
                const p2Phone = cols[15] || '';

                if (!childFirst || !childLast) continue; // Skip empty rows

                // Ensure location exists
                if (!locations.includes(location)) {
                    Data.addLocation(location);
                    locations.push(location);
                }

                // Find or create classroom
                let classroom = classrooms.find(c => c.name === classroomName && c.location === location);
                if (!classroom && classroomName) {
                    classroom = Data.addClassroom({
                        name: classroomName,
                        location: location,
                        ageCategory: 'General',
                        ageRangeMonths: { min: 0, max: 72 },
                        maxCapacity: 20
                    });
                    classrooms.push(classroom);
                }

                // Create parents
                const parentIds = [];
                if (p1First) {
                    const p1 = Data.addParent({
                        firstName: p1First,
                        lastName: p1Last,
                        email: p1Email,
                        phone: p1Phone,
                        status: 'On Process'
                    });
                    parentIds.push(p1.id);
                }
                if (p2First) {
                    const p2 = Data.addParent({
                        firstName: p2First,
                        lastName: p2Last,
                        email: p2Email,
                        phone: p2Phone,
                        status: 'On Process'
                    });
                    parentIds.push(p2.id);
                }

                // Create child
                const child = Data.addChild({
                    firstName: childFirst,
                    lastName: childLast,
                    birthDate: dob,
                    location: location,
                    classroomId: classroom ? classroom.id : null,
                    status: 'Enrolled',
                    scheduleType: scheduleType === 'Part Time' ? 'Part Time' : 'Full Time',
                    daysOfWeek: daysOfWeek,
                    enrollmentDate: enrollmentDate,
                    parentIds: parentIds,
                    isElfa: false
                });

                // Link parents to child
                parentIds.forEach(pid => {
                    const parent = Data.getParentById(pid);
                    if (parent) {
                        const childIds = parent.childIds || [];
                        childIds.push(child.id);
                        Data.updateParent(pid, { childIds, status: 'Enrolled' });
                    }
                });

                imported++;
            }

            Utils.showToast(`Successfully imported ${imported} children!`, 'success');
            setTimeout(() => location.reload(), 1500);

        } catch (err) {
            console.error('CSV Import error:', err);
            Utils.showToast(`Import failed: ${err.message}`, 'error');
        }
    },

    getRoleBadgeClass(role) {
        switch (role) {
            case 'Admin': return 'badge-success'; // Green
            case 'Director': return 'badge-success';
            case 'Coordinator': return 'badge-warning'; // Yellow
            case 'Teacher': return 'badge-info'; // Blue
            case 'Temporary Access': return 'badge-danger'; // Red/Pink
            default: return 'badge-secondary';
        }
    },

    showAddUserModal() {
        const body = `
            <form id="addUserForm">
                <div class="form-group">
                    <label class="form-label">Full Name *</label>
                    <input type="text" class="form-input" name="name" required placeholder="John Doe">
                </div>
                <div class="form-group">
                    <label class="form-label">Email Address *</label>
                    <input type="email" class="form-input" name="email" required placeholder="john@example.com">
                </div>
                <div class="form-group">
                    <label class="form-label">Role *</label>
                    <select class="form-select" name="role" required>
                        <option value="Admin">Admin (Full Access)</option>
                        <option value="Director">Director (Full Access)</option>
                        <option value="Coordinator">Coordinator (No Settings Access)</option>
                        <option value="Teacher">Teacher (No Settings Access)</option>
                        <option value="Temporary Access">Temporary Access (5 Days)</option>
                    </select>
                </div>
                <div class="form-notice" style="background: var(--primary-50); color: var(--primary-800); padding: 10px; border-radius: 4px; font-size: 0.9em; margin-top: 15px;">
                    <i class="fas fa-info-circle"></i> 
                    An email notification will be simulated for this user. They can login with their email.
                </div>
            </form>
        `;
        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="Settings.saveUser()">Add User</button>
        `;
        App.openModal('Add New User', body, footer);
    },

    saveUser() {
        // --- PLAN LIMIT CHECK --- //
        const currentUsers = Data.getUsers();
        // Don't count the owner/admin themselves
        const staffCount = currentUsers.filter(u => u.role !== 'Temporary Access').length;
        if (!PlanGate.canAddUser(staffCount)) {
            PlanGate.showLimitReached('Staff Users', PlanGate.getLimits().maxStaffUsers);
            return;
        }
        // --- END PLAN LIMIT CHECK --- //

        const form = document.getElementById('addUserForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const userData = Object.fromEntries(formData);

        // Check if email already exists
        const users = Data.getUsers();
        if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
            alert('A user with this email already exists.');
            return;
        }

        Data.addUser(userData);

        // Simulate Email
        Utils.showToast(`Invitation email sent to ${userData.email}`);

        App.closeModal();
        this.renderUsers();
    },

    deleteUser(id) {
        if (confirm('Are you sure you want to delete this user? They will no longer be able to login.')) {
            Data.deleteUser(id);
            Utils.showToast('User deleted', 'success');
            this.renderUsers();
        }
    },

    // =========================================================================
    // LOCATION MANAGEMENT
    // =========================================================================

    renderLocations() {
        const locations = Data.getLocations();
        const container = document.getElementById('locationsSection');

        // Helper to get classroom count safely
        const getClassroomCount = (loc) => {
            return Data.getClassrooms().filter(c => c.location === loc).length;
        };

        container.innerHTML = `
            <div class="card">
                <div class="card-header" style="justify-content: space-between;">
                    <span class="card-title">Day Care Locations</span>
                    <button class="btn btn-primary" onclick="Settings.showAddLocationModal()">
                        <i class="fas fa-plus"></i> Add Location
                    </button>
                </div>
                
                <div class="table-container">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th style="width: 40%">Location Name</th>
                                <th style="width: 30%">Classrooms</th>
                                <th style="width: 30%">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${locations.length ? locations.map((loc, index) => `
                                <!-- Location Row -->
                                <tr id="loc-row-${index}"
                                    onclick="Settings.toggleLocation('${loc.replace(/'/g, "\\'")}')"
                                    style="cursor: pointer; border-left: 4px solid var(--primary-400); transition: background 0.15s;"
                                    onmouseover="this.style.background='var(--primary-50)'"
                                    onmouseout="this.style.background=''"
                                >
                                    <td style="padding: 14px 16px;">
                                        <div style="display: flex; align-items: center; gap: 10px;">
                                            <span style="background: var(--primary-500); color: white; width: 26px; height: 26px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                                <i class="fas fa-chevron-right" id="icon-${index}" style="font-size: 0.75em; transition: transform 0.2s;"></i>
                                            </span>
                                            <div>
                                                <strong style="font-size: 1em; color: var(--secondary-800);">${loc}</strong>
                                                <div style="font-size: 0.78em; color: var(--primary-600); font-weight: 600; margin-top: 1px;"><i class="fas fa-mouse-pointer" style="font-size: 0.85em;"></i> Click to manage classrooms</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span style="background: var(--primary-100); color: var(--primary-700); padding: 4px 10px; border-radius: 12px; font-size: 0.85em; font-weight: 600;">
                                            <i class="fas fa-door-open" style="margin-right: 4px;"></i>${getClassroomCount(loc)} Classroom${getClassroomCount(loc) !== 1 ? 's' : ''}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); Settings.showEditLocationModal('${loc.replace(/'/g, "\\'")}')" style="margin-right: 5px;">Edit</button>
                                        <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); Settings.deleteLocation('${loc.replace(/'/g, "\\'")}')">Delete</button>
                                    </td>
                                </tr>
                                <!-- Accordion Content Form -->
                                <tr id="details-${index}" style="display: none; background-color: var(--neutral-50);">
                                    <td colspan="3" style="padding: 20px;">
                                        <div id="classrooms-container-${index}">
                                            <!-- Classrooms will be rendered here -->
                                        </div>
                                    </td>
                                </tr>
                            `).join('') : '<tr><td colspan="3" class="empty-state">No locations found</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    toggleLocation(locationName) {
        const locations = Data.getLocations();
        const index = locations.indexOf(locationName);
        if (index === -1) return;

        const detailsRow = document.getElementById(`details-${index}`);
        const icon = document.getElementById(`icon-${index}`);

        // If element not found (e.g. after delete/re-render), just return
        if (!detailsRow || !icon) return;

        const isHidden = detailsRow.style.display === 'none';

        if (isHidden) {
            detailsRow.style.display = 'table-row';
            icon.style.transform = 'rotate(90deg)';
            this.renderClassroomsForLocation(locationName, index);
        } else {
            detailsRow.style.display = 'none';
            icon.style.transform = 'rotate(0deg)';
        }
    },

    showAddLocationModal() {
        const body = `
            <form id="addLocationForm">
                <div class="form-group">
                    <label class="form-label">Location Name *</label>
                    <input type="text" class="form-input" name="name" required placeholder="e.g. Day Care Location 3">
                </div>
            </form>
        `;
        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="Settings.saveLocation()">Add Location</button>
        `;
        App.openModal('Add New Location', body, footer);
    },

    saveLocation() {
        // --- PLAN LIMIT CHECK --- //
        const currentLocationCount = Data.getLocations().length;
        if (!PlanGate.canAddLocation(currentLocationCount)) {
            PlanGate.showLimitReached('Locations', PlanGate.getLimits().maxLocations);
            return;
        }
        // --- END PLAN LIMIT CHECK --- //

        const form = document.getElementById('addLocationForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const name = formData.get('name').trim();

        if (Data.addLocation(name)) {
            Utils.showToast('Location added successfully');
            App.closeModal();
            this.renderLocations();
        } else {
            Utils.showToast('Location already exists', 'error');
        }
    },

    showEditLocationModal(oldName) {
        const body = `
            <form id="editLocationForm">
                <div class="form-group">
                    <label class="form-label">Location Name *</label>
                    <input type="text" class="form-input" name="name" required value="${oldName}">
                </div>
            </form>
        `;
        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="Settings.updateLocation('${oldName.replace(/'/g, "\\'")}')">Save Changes</button>
        `;
        App.openModal('Edit Location', body, footer);
    },

    updateLocation(oldName) {
        const form = document.getElementById('editLocationForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const newName = formData.get('name').trim();

        if (newName === oldName) {
            App.closeModal();
            return;
        }

        if (Data.getLocations().includes(newName)) {
            Utils.showToast('Location name already exists', 'error');
            return;
        }

        if (Data.updateLocationName(oldName, newName)) {
            Utils.showToast('Location updated successfully');
            App.closeModal();
            this.renderLocations();
        } else {
            Utils.showToast('Failed to update location', 'error');
        }
    },

    deleteLocation(name) {
        if (confirm(`Are you sure you want to delete "${name}"? This may affect existing records linked to this location.`)) {
            Data.deleteLocation(name);
            Utils.showToast('Location deleted', 'success');
            this.renderLocations();
        }
    },

    // =========================================================================
    // CLASSROOM MANAGEMENT (Nested)
    // =========================================================================

    renderClassroomsForLocation(locationName, index) {
        const classrooms = Data.getClassrooms().filter(c => c.location === locationName);
        const container = document.getElementById(`classrooms-container-${index}`);

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h5 style="margin: 0; color: var(--secondary-700);">Classrooms in ${locationName}</h5>
                <button class="btn btn-sm btn-secondary" onclick="Settings.showAddClassroomModal('${locationName.replace(/'/g, "\\'")}')">
                    <i class="fas fa-plus"></i> Add Classroom
                </button>
            </div>

            <table class="table table-sm" style="background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <thead>
                    <tr>
                        <th>Classroom Name</th>
                        <th>Age Group</th>
                        <th>Capacity</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${classrooms.length ? classrooms.map(c => {
            let ageDisplay = `${c.ageRangeMonths?.min || 0}-${c.ageRangeMonths?.max || 0}m`;
            if (c.ageCategory === 'Non Mobile Infant') {
                const minWeeks = Math.round((c.ageRangeMonths?.min || 0) * 4.33);
                ageDisplay = `${minWeeks}w-${c.ageRangeMonths?.max || 0}m`;
            }

            return `
                        <tr>
                            <td>
                                <span class="color-dot" style="background-color: ${Utils.getClassroomColor(c.id)}; display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 5px;"></span>
                                ${c.name}
                            </td>
                            <td>${c.ageCategory} (${ageDisplay})</td>
                            <td>${c.maxCapacity}</td>
                            <td>
                                <button class="btn btn-secondary btn-sm" onclick="Settings.showEditClassroomModal('${c.id}')" style="margin-right: 5px;">Edit</button>
                                <button class="btn btn-danger btn-sm" onclick="Settings.deleteClassroom('${c.id}', '${locationName.replace(/'/g, "\\'")}')">Delete</button>
                            </td>
                        </tr>`;
        }).join('') : '<tr><td colspan="4" class="text-center text-muted" style="padding: 20px;">No classrooms added yet.</td></tr>'}
                </tbody >
            </table >
    `;
    },

    showAddClassroomModal(preselectedLocation = null) {
        // If no location preselected (shouldn't happen with new UI), default to first
        const locationValue = preselectedLocation || Data.getLocations()[0];

        const body = `
            <form id="addClassroomForm">
                <div class="form-group">
                    <label class="form-label">Classroom Name *</label>
                    <input type="text" class="form-input" name="name" required placeholder="e.g. Emerald Room">
                </div>
                
                <!-- Hidden Location Field -->
                <input type="hidden" name="location" value="${locationValue}">

                <div class="form-group">
                    <label class="form-label">Age Category *</label>
                    <select class="form-select" name="ageCategory" required>
                        <option value="Non Mobile Infant">Non Mobile Infant</option>
                        <option value="Mobile Infant">Mobile Infant</option>
                        <option value="Toddler">Toddler</option>
                        <option value="Lower Preschool">Lower Preschool</option>
                        <option value="Upper Preschool">Upper Preschool</option>
                    </select>
                </div>
                <div class="row">
                    <div class="col-6">
                        <div class="form-group">
                            <label class="form-label" id="minAgeLabel">Min Age (Weeks) *</label>
                            <input type="number" class="form-input" name="minAge" required value="0">
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="form-group">
                            <label class="form-label">Max Age (Months)</label>
                            <input type="number" class="form-input" name="maxAge" required value="12">
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Max Capacity *</label>
                    <input type="number" class="form-input" name="maxCapacity" required value="8">
                </div>
            </form>
        `;
        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="Settings.saveClassroom()">Add Classroom</button>
        `;
        App.openModal('Add New Classroom', body, footer);

        // Add dynamic listener for Age Units
        this.setupAgeUnitListener('addClassroomForm');
    },

    saveClassroom() {
        // --- PLAN LIMIT CHECK --- //
        const allClassrooms = Data.getClassrooms ? Data.getClassrooms() : [];
        const totalClassrooms = Array.isArray(allClassrooms) ? allClassrooms.length :
            Data.getLocations().reduce((sum, loc) => {
                const classrooms = Data.getClassroomsForLocation ? Data.getClassroomsForLocation(loc) : [];
                return sum + classrooms.length;
            }, 0);
        if (!PlanGate.canAddClassroom(totalClassrooms)) {
            PlanGate.showLimitReached('Classrooms', PlanGate.getLimits().maxClassrooms);
            return;
        }
        // --- END PLAN LIMIT CHECK --- //

        const form = document.getElementById('addClassroomForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const ageCategory = formData.get('ageCategory');

        let minAge = parseFloat(formData.get('minAge'));

        // Convert Weeks to Months if Non Mobile Infant
        if (ageCategory === 'Non Mobile Infant') {
            minAge = minAge / 4.33;
        }

        const classroom = {
            name: formData.get('name'),
            location: formData.get('location'),
            ageCategory: ageCategory,
            ageRangeMonths: {
                min: minAge,
                max: parseFloat(formData.get('maxAge'))
            },
            maxCapacity: parseInt(formData.get('maxCapacity'))
        };

        Data.addClassroom(classroom);
        Utils.showToast('Classroom added successfully');
        App.closeModal();

        this.renderLocations();

        // Auto-expand the location to show the new classroom
        setTimeout(() => {
            Settings.toggleLocation(classroom.location);
        }, 100);
    },

    showEditClassroomModal(id) {
        const classroom = Data.getClassrooms().find(c => c.id === id);
        if (!classroom) return;

        // Determine if we should show Weeks or Months
        const isInfant = classroom.ageCategory === 'Non Mobile Infant';
        const minAgeValue = isInfant ? Math.round(classroom.ageRangeMonths?.min * 4.33 * 10) / 10 : (classroom.ageRangeMonths?.min || 0);
        const minAgeLabel = isInfant ? 'Min Age (Weeks)' : 'Min Age (Months)';

        const body = `
            <form id="editClassroomForm">
                <div class="form-group">
                    <label class="form-label">Classroom Name *</label>
                    <input type="text" class="form-input" name="name" required value="${classroom.name}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Age Category *</label>
                    <select class="form-select" name="ageCategory" required id="ageCategorySelect">
                        <option value="Non Mobile Infant" ${classroom.ageCategory === 'Non Mobile Infant' ? 'selected' : ''}>Non Mobile Infant</option>
                        <option value="Mobile Infant" ${classroom.ageCategory === 'Mobile Infant' ? 'selected' : ''}>Mobile Infant</option>
                        <option value="Toddler" ${classroom.ageCategory === 'Toddler' ? 'selected' : ''}>Toddler</option>
                        <option value="Lower Preschool" ${classroom.ageCategory === 'Lower Preschool' ? 'selected' : ''}>Lower Preschool</option>
                        <option value="Upper Preschool" ${classroom.ageCategory === 'Upper Preschool' ? 'selected' : ''}>Upper Preschool</option>
                    </select>
                </div>
                <div class="row">
                    <div class="col-6">
                        <div class="form-group">
                            <label class="form-label" id="minAgeLabel">${minAgeLabel} *</label>
                            <input type="number" step="0.1" class="form-input" name="minAge" required value="${minAgeValue}">
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="form-group">
                            <label class="form-label">Max Age (Months)</label>
                            <input type="number" step="0.1" class="form-input" name="maxAge" required value="${classroom.ageRangeMonths?.max || 0}">
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Max Capacity *</label>
                    <input type="number" class="form-input" name="maxCapacity" required value="${classroom.maxCapacity || 0}">
                    <small style="display: block; margin-top: 5px; color: var(--neutral-500);">Base capacity. You can set monthly overrides below.</small>
                </div>

                <hr style="margin: 20px 0; border: 0; border-top: 1px solid var(--neutral-200);">
                
                <div class="form-group">
                    <label class="form-label">Monthly Capacity Overrides</label>
                    <div id="monthlyCapacityContainer">
                        <!-- Will be populated dynamically -->
                        <div style="display: flex; gap: 15px; margin-bottom: 10px; align-items: flex-start;">
                            <div id="overrideMonthContainer" style="height: 150px; overflow-y: auto; border: 1px solid var(--neutral-200); padding: 10px; border-radius: 4px; flex-grow: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                                <!-- Checkboxes populated via JS -->
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 10px; width: 120px;">
                                <label class="form-label" style="font-size: 0.8em;">New Capacity</label>
                                <input type="number" id="overrideCapacityInput" class="form-input" placeholder="Capacity">
                                <button type="button" class="btn btn-secondary btn-sm" onclick="Settings.addCapacityOverride()">Apply</button>
                            </div>
                        </div>
                        <div id="activeOverridesList" style="max-height: 150px; overflow-y: auto;">
                            <!-- List of active overrides -->
                        </div>
                    </div>
                </div>
                <input type="hidden" name="capacityOverrides" id="capacityOverridesInput" value='${JSON.stringify(classroom.capacityOverrides || {})}'>

            </form>
        `;
        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="Settings.updateClassroom('${id}')">Save Changes</button>
        `;

        App.openModal('Edit Classroom', body, footer);

        // Populate months with checkboxes
        const monthContainer = document.getElementById('overrideMonthContainer');
        const months = Utils.getMonthsForForecast(new Date(), 12);
        months.forEach(m => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.innerHTML = `
                <input type="checkbox" id="month-${m.label}" value="${m.label}" style="margin-right: 8px;">
                <label for="month-${m.label}" style="font-size: 0.9em; cursor: pointer;">${m.label}</label>
            `;
            monthContainer.appendChild(div);
        });

        // Render current overrides
        this.renderCapacityOverrides(classroom.capacityOverrides || {});


        // Add dynamic listener
        this.setupAgeUnitListener('editClassroomForm');
    },

    setupAgeUnitListener(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        const select = form.querySelector('select[name="ageCategory"]');
        const minAgeLabel = form.querySelector('#minAgeLabel');
        const minAgeInput = form.querySelector('input[name="minAge"]');

        if (!select || !minAgeLabel || !minAgeInput) return;

        const updateLabel = () => {
            if (select.value === 'Non Mobile Infant') {
                minAgeLabel.textContent = 'Min Age (Weeks) *';
            } else {
                minAgeLabel.textContent = 'Min Age (Months) *';
            }
        };

        select.addEventListener('change', updateLabel);

        // Run once to match initial state
        updateLabel();
    },

    updateClassroom(id) {
        const form = document.getElementById('editClassroomForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const ageCategory = formData.get('ageCategory');

        let minAge = parseFloat(formData.get('minAge'));

        // Convert Weeks to Months if Non Mobile Infant
        if (ageCategory === 'Non Mobile Infant') {
            minAge = minAge / 4.33;
        }

        const updates = {
            name: formData.get('name'),
            ageCategory: ageCategory,
            ageRangeMonths: {
                min: minAge,
                max: parseFloat(formData.get('maxAge'))
            },
            maxCapacity: parseInt(formData.get('maxCapacity')),
            capacityOverrides: JSON.parse(formData.get('capacityOverrides') || '{}')
        };

        Data.updateClassroom(id, updates);

        // Find location to auto-expand
        const classroom = Data.getClassrooms().find(c => c.id === id);

        Utils.showToast('Classroom updated successfully');
        App.closeModal();

        this.renderLocations();

        if (classroom) {
            setTimeout(() => {
                Settings.toggleLocation(classroom.location);
            }, 100);
        }
    },

    deleteClassroom(id, locationName) {
        if (confirm('Are you sure you want to delete this classroom?')) {
            Data.deleteClassroom(id);
            Utils.showToast('Classroom deleted', 'success');

            // Re-render the specific location list
            const locations = Data.getLocations();
            const index = locations.indexOf(locationName);
            if (index !== -1) {
                this.renderClassroomsForLocation(locationName, index);
            }
        }
    },

    // Capacity Override Helpers
    // Capacity Override Helpers
    addCapacityOverride() {
        const monthContainer = document.getElementById('overrideMonthContainer');
        const capacityInput = document.getElementById('overrideCapacityInput');
        const overridesInput = document.getElementById('capacityOverridesInput');

        if (!monthContainer || !capacityInput || !overridesInput) return;

        const capacity = parseInt(capacityInput.value);
        if (isNaN(capacity) || capacity < 0) {
            alert("Please enter a valid capacity.");
            return;
        }

        const checkedBoxes = monthContainer.querySelectorAll('input[type="checkbox"]:checked');
        if (checkedBoxes.length === 0) {
            alert("Please select at least one month.");
            return;
        }

        let overrides = JSON.parse(overridesInput.value || '{}');

        checkedBoxes.forEach(checkbox => {
            overrides[checkbox.value] = capacity;
            checkbox.checked = false; // Reset checkbox
        });

        overridesInput.value = JSON.stringify(overrides);
        this.renderCapacityOverrides(overrides);

        // Reset input
        capacityInput.value = '';
    },

    removeCapacityOverride(monthLabel) {
        const overridesInput = document.getElementById('capacityOverridesInput');
        if (!overridesInput) return;

        let overrides = JSON.parse(overridesInput.value || '{}');
        delete overrides[monthLabel];

        overridesInput.value = JSON.stringify(overrides);
        this.renderCapacityOverrides(overrides);
    },

    renderCapacityOverrides(overrides) {
        const container = document.getElementById('activeOverridesList');
        if (!container) return;

        if (Object.keys(overrides).length === 0) {
            container.innerHTML = '<p style="color: var(--neutral-500); font-style: italic; font-size: 0.9em;">No overrides set.</p>';
            return;
        }

        const sortedMonths = Object.keys(overrides).sort((a, b) => {
            return a.localeCompare(b);
        });

        container.innerHTML = sortedMonths.map(month => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background: var(--neutral-50); border: 1px solid var(--neutral-200); border-radius: 4px; margin-bottom: 4px; font-size: 0.9em;">
                <span><strong>${month}</strong>: ${overrides[month]}</span>
                <button type="button" class="btn-icon" onclick="Settings.removeCapacityOverride('${month}')" style="color: var(--error); cursor: pointer; font-weight: bold;">&times;</button>
            </div>
        `).join('');
    },

    // =========================================================================
    // DATA MANAGEMENT
    // =========================================================================




};
