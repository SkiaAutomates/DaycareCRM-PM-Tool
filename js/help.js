/**
 * Day Care CRM - Help & Instructions Module
 * Includes Playbook-style per-tab instructions
 */

const Help = {

    currentPlaybookTab: 'dashboard',

    render() {
        const container = document.getElementById('helpContent');
        if (!container) return;

        const playbookTabs = [
            { id: 'dashboard', icon: 'fa-th-large', label: 'Dashboard' },
            { id: 'crm', icon: 'fa-users', label: 'CRM' },
            { id: 'attendance', icon: 'fa-check-circle', label: 'Attendance' },
            { id: 'projects', icon: 'fa-folder-open', label: 'Projects' },
            { id: 'availability', icon: 'fa-calendar-alt', label: 'Availability' },
            { id: 'notifications', icon: 'fa-bell', label: 'Notifications' },
            { id: 'reports', icon: 'fa-chart-bar', label: 'Reports' },
            { id: 'settings', icon: 'fa-cog', label: 'Settings' },
        ];

        const navBtns = playbookTabs.map(function (t) {
            return '<button id="pb-btn-' + t.id + '" onclick="Help.switchPlaybook(\'' + t.id + '\')" ' +
                'style="border:none;background:transparent;padding:8px 14px;border-radius:6px 6px 0 0;font-size:0.85em;font-weight:600;cursor:pointer;color:var(--neutral-600);border-bottom:3px solid transparent;transition:all 0.15s;font-family:inherit;display:flex;align-items:center;gap:6px;">' +
                '<i class="fas ' + t.icon + '" style="font-size:0.9em;"></i>' + t.label +
                '</button>';
        }).join('');

        const gettingStartedSteps = [
            { n: 1, title: 'User Management', body: 'Go to <strong>Settings &gt; User Management</strong> to add Directors, Coordinators, and Teachers. Assign appropriate roles so staff have the correct access level.' },
            { n: 2, title: 'Day Care Locations', body: 'Go to <strong>Settings &gt; Day Care Locations</strong> and add each of your physical facilities. This is the top-level grouping for all classrooms.' },
            { n: 3, title: 'Classrooms & Capacity', body: 'Under each location, click <strong>Add Classroom</strong>. Set the age category, base capacity, and any monthly overrides. This is critical — the entire availability system depends on it.' },
            { n: 4, title: 'Add Families & Enroll', body: 'Go to the <strong>CRM</strong> tab and click <strong>Add Family</strong>. Create the parent first, then link a child. Set status, classroom, and schedule type.' },
        ];

        const stepsHtml = gettingStartedSteps.map(function (s) {
            return '<div style="display:flex;gap:18px;align-items:flex-start;">' +
                '<div style="background:var(--primary-100);color:var(--primary-700);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.1em;flex-shrink:0;">' + s.n + '</div>' +
                '<div><h4 style="margin:0 0 6px 0;color:var(--secondary-800);">' + s.title + '</h4>' +
                '<p style="margin:0;color:var(--neutral-600);line-height:1.6;font-size:0.95em;">' + s.body + '</p></div>' +
                '</div>';
        }).join('');

        container.innerHTML =
            '<div style="display:flex;flex-direction:column;gap:30px;max-width:1000px;margin:0 auto;">' +

            // TAB PLAYBOOKS CARD
            '<div class="card">' +
            '<div class="card-header">' +
            '<span class="card-title"><i class="fas fa-book-open" style="margin-right:10px;color:var(--primary-600);"></i>Tab Playbooks</span>' +
            '<span style="font-size:0.82em;color:var(--neutral-500);">Step-by-step guides for every section of the CRM</span>' +
            '</div>' +
            '<div class="card-body" style="padding:0;">' +
            '<div id="playbookNav" style="display:flex;flex-wrap:wrap;gap:4px;padding:14px 16px 0;border-bottom:1px solid var(--neutral-200);background:var(--neutral-50);">' + navBtns + '</div>' +
            '<div id="playbookContent" style="padding:24px 28px;"></div>' +
            '</div>' +
            '</div>' +

            // GETTING STARTED CARD
            '<div class="card">' +
            '<div class="card-header"><span class="card-title"><i class="fas fa-rocket" style="margin-right:10px;color:var(--primary-600);"></i>Getting Started Guide</span></div>' +
            '<div class="card-body"><div style="display:flex;flex-direction:column;gap:24px;">' + stepsHtml + '</div></div>' +
            '</div>' +

            // DEMO ACCESS CARD
            '<div class="card" style="border-left:4px solid var(--secondary-500);">' +
            '<div class="card-header" style="background:transparent;border-bottom:1px solid rgba(45,125,70,0.15);">' +
            '<span class="card-title" style="color:var(--secondary-700);"><i class="fas fa-share-alt" style="margin-right:10px;"></i>Sharing Demo Access with Prospects</span>' +
            '</div>' +
            '<div class="card-body" style="display:flex;flex-direction:column;gap:14px;">' +
            '<p style="margin:0;color:var(--neutral-600);line-height:1.6;">Give prospective clients a <strong>5-day window</strong> to explore the CRM.</p>' +
            '<div style="background:var(--neutral-50);border-radius:8px;padding:14px 18px;">' +
            '<h4 style="margin:0 0 10px 0;color:var(--secondary-800);">How to share access:</h4>' +
            '<ol style="margin:0;padding-left:20px;color:var(--neutral-700);line-height:2.2;font-size:0.93em;">' +
            '<li>Go to <strong>Settings &gt; User Management</strong> → <strong>Add User</strong>.</li>' +
            '<li>Enter the prospect\'s name and email address.</li>' +
            '<li>Set role to <span style="background:var(--error);color:white;padding:1px 7px;border-radius:4px;font-size:0.82em;font-weight:bold;">Temporary Access</span>.</li>' +
            '<li>Send them your CRM URL — they log in with just their email. No password needed!</li>' +
            '</ol>' +
            '</div>' +
            '<div style="display:flex;gap:12px;flex-wrap:wrap;">' +
            '<div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 14px;">' +
            '<p style="margin:0 0 4px 0;font-weight:700;color:#166534;font-size:0.9em;"><i class="fas fa-check-circle"></i> No Password Needed</p>' +
            '<p style="margin:0;font-size:0.85em;color:#15803d;">They log in with their email address only.</p>' +
            '</div>' +
            '<div style="flex:1;background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:12px 14px;">' +
            '<p style="margin:0 0 4px 0;font-weight:700;color:#854d0e;font-size:0.9em;"><i class="fas fa-clock"></i> Auto-Expires in 5 Days</p>' +
            '<p style="margin:0;font-size:0.85em;color:#713f12;">No manual action needed from you.</p>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +

            // FAQ CARD
            '<div class="card">' +
            '<div class="card-header"><span class="card-title"><i class="fas fa-question-circle" style="margin-right:10px;color:var(--primary-600);"></i>Frequently Asked Questions</span></div>' +
            '<div class="card-body"><div id="faqContainer"></div></div>' +
            '</div>' +

            '</div>'; // end outer wrapper

        this.switchPlaybook(this.currentPlaybookTab);
        this.renderFAQList();
    },

    switchPlaybook(tabId) {
        this.currentPlaybookTab = tabId;

        document.querySelectorAll('#playbookNav button').forEach(function (btn) {
            btn.style.color = 'var(--neutral-500)';
            btn.style.background = 'transparent';
            btn.style.borderBottom = '3px solid transparent';
        });
        var active = document.getElementById('pb-btn-' + tabId);
        if (active) {
            active.style.color = 'var(--primary-700)';
            active.style.background = 'white';
            active.style.borderBottom = '3px solid var(--primary-500)';
        }

        var content = document.getElementById('playbookContent');
        if (content) content.innerHTML = this.getPlaybookContent(tabId);
    },

    getPlaybookContent(tabId) {
        var playbooks = {

            dashboard: {
                icon: 'fa-th-large', color: '#3b82f6', title: 'Dashboard',
                overview: 'Your command center. The Dashboard gives you a real-time snapshot of enrollment health, classroom capacity, and key metrics across all your locations.',
                sections: [
                    {
                        heading: '📊 Stat Cards (Top Row)', items: [
                            '<strong>Total Enrolled</strong> — Total children with "Enrolled" status across ALL locations.',
                            '<strong>Day Care Location X</strong> — Enrolled count per individual location. Shows 0 if location names in data don\'t match configured locations in Settings.',
                            '<strong>Waitlisted</strong> — Families in line waiting for an open spot.',
                            '<strong>Active Projects</strong> — Open tours, playdates, onboarding, or offboarding tasks.',
                            '<strong>Tours This Week</strong> — Scheduled tours happening this week.',
                        ]
                    },
                    {
                        heading: '🏫 Classroom Cards', items: [
                            'Each card shows <strong>enrolled / max capacity</strong> and a color-coded capacity bar.',
                            '<span style="color:#16a34a;font-weight:600;">Green</span> = healthy. <span style="color:#ca8a04;font-weight:600;">Yellow</span> = almost full. <span style="color:#dc2626;font-weight:600;">Red</span> = at or over capacity.',
                            'A negative available spots number (e.g., -1) means you are over-enrolled — action required.',
                            'Spot counts respect <strong>Monthly Capacity Overrides</strong> set in Settings.',
                        ]
                    },
                    {
                        heading: '⚡ Quick Actions', items: [
                            '<strong>+ Add Parent</strong> — Jump directly to the Add Parent form.',
                            '<strong>+ Add Child</strong> — Jump directly to the Add Child form.',
                            '<strong>+ New Project</strong> — Start a new enrollment inquiry, tour, or project.',
                            '<strong>View Reports</strong> — Navigate directly to the Reports tab.',
                        ]
                    },
                    {
                        heading: '💡 Pro Tips', items: [
                            'Check the Dashboard every morning as your daily briefing before interacting with families.',
                            'If a classroom shows red, consider starting a waitlist review project immediately.',
                            'If location stat cards show 0 despite enrolled children, refresh — the system will auto-migrate location names.',
                        ]
                    },
                ]
            },

            crm: {
                icon: 'fa-users', color: '#7c3aed', title: 'CRM',
                overview: 'Your family database. The CRM stores all parent and child records, tracks enrollment status, notes, service agreements, and the full journey of each family.',
                sections: [
                    {
                        heading: '👶 Children Tab', items: [
                            '<strong>View</strong> any child\'s profile: DOB, age, location, classroom, schedule, and enrollment date.',
                            '<strong>Edit</strong> to change status (On Process → Enrolled → Waitlisted), classroom assignment, or schedule type.',
                            '<strong>Notes</strong>: Add timestamped notes on any child record.',
                            '<strong>Next Transition</strong> shows when a child ages out of their current classroom category.',
                        ]
                    },
                    {
                        heading: '👨‍👩‍👧 Parents Tab', items: [
                            'Each parent record links to their child(ren). A family typically has 2 parents per child.',
                            '<strong>Service Agreement</strong>: Track whether it\'s been Sent, Signed, or needs Follow-Up.',
                            '<strong>Notes</strong>: Log conversation history, concerns, or important context here.',
                            'Parent status syncs with child status after enrollment.',
                        ]
                    },
                    {
                        heading: '🔍 Filtering & Search', items: [
                            'Use <strong>Search</strong> to find by parent or child name.',
                            'Filter by <strong>Status</strong>: On Process, Enrolled, Waitlisted, Graduated, Withdrawn.',
                            'Filter by <strong>Location</strong> and <strong>Classroom</strong> to see a specific room\'s families.',
                        ]
                    },
                    {
                        heading: '📋 Common Workflows', items: [
                            '<strong>New Family Inquiry</strong>: Click "+ Add Parent" → enter details → then "+ Add Child" → link to the parent.',
                            '<strong>Enrolling a Child</strong>: Open child → Edit → set Status to "Enrolled", assign Classroom → Save.',
                            '<strong>Signing Service Agreement</strong>: Open parent → click the checklist → tick "Signed".',
                            '<strong>Moving to Waitlist</strong>: Edit child → Status = "Waitlisted" → Save.',
                        ]
                    },
                    {
                        heading: '💡 Pro Tips', items: [
                            'Always create the parent record FIRST before adding a child — you need to link them.',
                            'Use Notes as a call log — add brief summaries after every family interaction.',
                            'The "Next Transition" date helps you proactively plan classroom moves months ahead.',
                        ]
                    },
                ]
            },

            attendance: {
                icon: 'fa-check-circle', color: '#16a34a', title: 'Attendance',
                overview: 'Track daily attendance for enrolled children. Mark each child as Present, Absent, or Excused, and log exact check-in and check-out times.',
                sections: [
                    {
                        heading: '📅 Setting Up the View', items: [
                            'Select the <strong>Date</strong> you want to take attendance for (defaults to today).',
                            'Choose the <strong>Day Care Location</strong> from the dropdown.',
                            'Choose the <strong>Classroom</strong> — automatically filters to that location\'s classrooms.',
                            'The student grid will load all enrolled children in that classroom.',
                        ]
                    },
                    {
                        heading: '✅ Marking Attendance', items: [
                            'Each child card shows three status buttons: <strong>Present</strong>, <strong>Absent</strong>, <strong>Excused</strong>.',
                            'Click a button to set the status — it highlights immediately.',
                            '<strong>Mark All Present</strong> sets every child in the grid to Present in one click.',
                            'Attendance records auto-save in the background.',
                        ]
                    },
                    {
                        heading: '⏰ Check-In / Check-Out', items: [
                            'When marked <strong>Present</strong>, a Check In timestamp is recorded automatically.',
                            'Click <strong>Check Out</strong> on the child\'s card when they leave to record departure time.',
                            'Timestamps are stored per record and useful for licensing and billing audits.',
                        ]
                    },
                    {
                        heading: '💡 Pro Tips', items: [
                            'Take attendance first thing in the morning — it becomes a daily habit quickly.',
                            'Use "Mark All Present" then individually flip absent children to save time.',
                            'If a child doesn\'t show in the list, check their CRM status — they must be "Enrolled" to appear.',
                        ]
                    },
                ]
            },

            projects: {
                icon: 'fa-folder-open', color: '#ea580c', title: 'Projects',
                overview: 'Manage every structured interaction with a family as a "Project" — Enrollment Inquiries, Tours, Playdates, Onboarding, and Offboarding — each with a task checklist and status tracking.',
                sections: [
                    {
                        heading: '📁 Project Types', items: [
                            '<strong>Enrollment Inquiry</strong>: New family expressing interest. Tracks contact info, target classroom, and follow-up tasks.',
                            '<strong>Tour</strong>: Scheduled visit to your facility. Includes date, time, and assigned staff.',
                            '<strong>Playdate</strong>: Trial day or informal visit for the child.',
                            '<strong>Onboarding</strong>: After sign-up — track paperwork, classroom intro, and setup tasks.',
                            '<strong>Offboarding</strong>: When a child is leaving — track all exit tasks.',
                        ]
                    },
                    {
                        heading: '✏️ Creating a Project', items: [
                            'Click <strong>+ New Project</strong> from the Dashboard or the Projects tab.',
                            'Select the <strong>Project Type</strong>, then the associated <strong>Location</strong>.',
                            'Fill in family details, date, and notes.',
                            'Assign a <strong>Status</strong>: Open, In Progress, Completed, Cancelled.',
                        ]
                    },
                    {
                        heading: '📋 Enrollment Inquiry Checklist', items: [
                            'Built-in tasks: <strong>Initial Contact</strong>, <strong>Tour Scheduled</strong>, <strong>Application Received</strong>, <strong>SA Sent/Signed</strong>, <strong>Enrolled</strong>.',
                            'Tick each step as you complete it — the project tracks progress automatically.',
                            'When SA is Signed and Status is Enrolled, this triggers the Onboarding report visibility.',
                        ]
                    },
                    {
                        heading: '💡 Pro Tips', items: [
                            'Treat every new inquiry as a project — it ensures nothing falls through the cracks.',
                            'Link the project to a specific parent and child in the CRM for full traceability.',
                            'Review open projects every Friday to ensure none have gone stale.',
                        ]
                    },
                ]
            },

            availability: {
                icon: 'fa-calendar-alt', color: '#0891b2', title: 'Availability',
                overview: 'See exactly how many open spots you have per classroom, per month, for any future date. Use this to make smart enrollment decisions and plan staffing changes months in advance.',
                sections: [
                    {
                        heading: '📊 Reading the Availability View', items: [
                            'Each classroom shows <strong>Enrolled / Capacity</strong> and <strong>Available Spots</strong> for the selected month.',
                            '<strong>Negative available spots</strong> = over-enrolled. This is allowed but flagged in red.',
                            'Toggle between locations using the sidebar tabs.',
                            'The <strong>Forecast Overview</strong> shows a month-by-month projection for all classrooms.',
                        ]
                    },
                    {
                        heading: '📅 Monthly Navigation', items: [
                            'Use the <strong>month selector</strong> to check availability for any future month.',
                            'The system automatically applies any <strong>Monthly Capacity Overrides</strong> for that month.',
                            'This allows accurate pre-enrollment — e.g., you can accept June enrollments in February.',
                        ]
                    },
                    {
                        heading: '⚙️ How Capacity Is Calculated', items: [
                            '<strong>Base Capacity</strong>: Set in Settings → Classrooms.',
                            '<strong>Override</strong>: If a Monthly Override is set for the selected month, it replaces the base.',
                            '<strong>Enrolled Count</strong>: Children with "Enrolled" status assigned to that classroom.',
                            '<strong>Available = Capacity − Enrolled</strong>.',
                        ]
                    },
                    {
                        heading: '💡 Pro Tips', items: [
                            'Before accepting a new enrollment, always check the Availability tab first.',
                            'If hiring a new teacher in March, set a March capacity override in Settings. You can start enrolling for March right away.',
                            'Use the Forecast view to identify months that will hit capacity early — start your waitlist strategy now.',
                        ]
                    },
                ]
            },

            notifications: {
                icon: 'fa-bell', color: '#d97706', title: 'Notifications',
                overview: 'The system automatically monitors your data and surfaces alerts that require your attention — upcoming transitions, waitlist follow-ups, service agreement reminders, and more.',
                sections: [
                    {
                        heading: '🔔 Notification Types', items: [
                            '<strong>Age Transition Alert</strong>: A child is approaching the max age for their current classroom category. Time to plan a room move.',
                            '<strong>Waitlist Follow-Up</strong>: A waitlisted family has not had a recent update. Time to reach out.',
                            '<strong>Service Agreement Reminder</strong>: An SA was sent but has not been marked Signed after several days.',
                            '<strong>Onboarding Prompt</strong>: A child is enrolled and SA is signed but no Onboarding project exists.',
                        ]
                    },
                    {
                        heading: '📋 Acting on Notifications', items: [
                            'Click any notification to jump directly to the relevant record in CRM or Projects.',
                            'Once the underlying issue is resolved (e.g., SA signed), the notification auto-clears on next reload.',
                            'You cannot dismiss notifications manually — they clear when the condition is resolved.',
                        ]
                    },
                    {
                        heading: '⚙️ How It Works', items: [
                            'Notifications are calculated fresh every time you load or navigate to the Notifications tab.',
                            'The system scans all enrolled children, service agreements, and projects to generate alerts.',
                            'No manual setup required — it runs automatically.',
                        ]
                    },
                    {
                        heading: '💡 Pro Tips', items: [
                            'Check Notifications every morning alongside the Dashboard — they are your daily action list.',
                            'Age transition alerts typically fire 60–90 days before a child ages out — giving you time to plan.',
                            'Too many SA reminders usually means the "Sent" step was not ticked in the parent\'s SA checklist.',
                        ]
                    },
                ]
            },

            reports: {
                icon: 'fa-chart-bar', color: '#be185d', title: 'Reports',
                overview: 'Generate structured views of your data for administrative and operational use — service agreement status, onboarding readiness, classroom occupancy, and more.',
                sections: [
                    {
                        heading: '📄 Available Reports', items: [
                            '<strong>Service Agreement Status</strong>: See which families have signed, which are pending, and which have not received their agreement.',
                            '<strong>Onboarding Report</strong>: Families who are enrolled + SA signed but not yet onboarded. Ready for the onboarding process.',
                            '<strong>Enrollment by Classroom</strong>: Breakdown of enrolled children per classroom and location.',
                            '<strong>Capacity Summary</strong>: Max capacity vs. enrolled count — useful for licensing audits.',
                        ]
                    },
                    {
                        heading: '✅ Onboarding Checklist', items: [
                            'The Onboarding Report has an <strong>"Onboarded" checkbox</strong> next to each family.',
                            'Tick it once you\'ve completed onboarding. The family stays in the report for the current week as confirmation.',
                            'After that week, they\'ll drop off automatically.',
                        ]
                    },
                    {
                        heading: '🔍 Filtering Reports', items: [
                            'Use the <strong>Location filter</strong> to view reports for a specific day care site.',
                            'Use the <strong>Week selector</strong> on the Onboarding report to view historical data.',
                        ]
                    },
                    {
                        heading: '💡 Pro Tips', items: [
                            'Run the Service Agreement report every Monday to identify families that need follow-up.',
                            'The Onboarding report is your weekly meeting document — share it with your director before Monday stand-up.',
                            'Capacity Summary is the report to print when preparing for a licensing inspection.',
                        ]
                    },
                ]
            },

            settings: {
                icon: 'fa-cog', color: '#6b7280', title: 'Settings',
                overview: 'Configure your CRM — users, locations, classrooms, and system tools. Settings is restricted to Admin and Director roles only.',
                sections: [
                    {
                        heading: '👥 User Management', items: [
                            '<strong>Add User</strong>: Enter name, email, and role. The user can log in immediately using their email — no password required.',
                            '<strong>Roles</strong>: Admin and Director have full access (including Settings). Coordinators and Teachers cannot access Settings or delete records.',
                            '<strong>Temporary Access</strong>: For marketing prospects. Auto-expires after 120 hours (5 days). Expiration countdown shown in the user table.',
                            '<strong>Delete User</strong>: Removes the user instantly. Their email can no longer log in.',
                        ]
                    },
                    {
                        heading: '🏠 Day Care Locations', items: [
                            '<strong>Add Location</strong>: Creates a new day care site. All classrooms and children must be assigned to a location.',
                            '<strong>Rename Location</strong>: Click the edit icon next to any location name. Changes propagate to all associated data.',
                            '<strong>Delete Location</strong>: Use with extreme caution. Deleting a location orphans its classrooms and children.',
                            'Each location gets an automatic color code used throughout the CRM.',
                        ]
                    },
                    {
                        heading: '🚪 Classroom Configuration', items: [
                            '<strong>Add Classroom</strong>: Set name, age category, and base max capacity.',
                            '<strong>Monthly Capacity Overrides</strong>: Override base capacity for specific months (e.g., after hiring a new teacher).',
                            '<strong>Edit Classroom</strong>: Update any field. Changes reflect immediately in Dashboard and Availability.',
                        ]
                    },
                    {
                        heading: '🛠️ System Tools', items: [
                            '<strong>Generate Demo Data</strong>: Creates 70 sample student records with parents and schedules. Useful for testing.',
                            '<strong>Clear All Data</strong> (Danger Zone): Permanently deletes ALL records. Cannot be undone.',
                        ]
                    },
                    {
                        heading: '💡 Pro Tips', items: [
                            'Always configure Locations first, then Classrooms, then Users — in that order.',
                            'Use "Generate Demo Data" when sharing Temporary Access with a prospect so they see a populated CRM.',
                            'Bookmark the Settings page for quick admin access.',
                        ]
                    },
                ]
            }

        }; // end playbooks

        var pb = playbooks[tabId];
        if (!pb) return '<p>No playbook found.</p>';

        var sectionsHtml = pb.sections.map(function (section) {
            var itemsHtml = section.items.map(function (item) {
                return '<li style="display:flex;gap:10px;align-items:flex-start;font-size:0.93em;color:var(--neutral-700);line-height:1.55;padding:10px 14px;background:var(--neutral-50);border-radius:7px;border-left:3px solid ' + pb.color + '40;">' +
                    '<i class="fas fa-arrow-right" style="color:' + pb.color + ';margin-top:3px;flex-shrink:0;font-size:0.8em;"></i>' +
                    '<span>' + item + '</span></li>';
            }).join('');

            return '<div>' +
                '<h4 style="margin:0 0 12px 0;color:var(--secondary-800);font-family:\'Quicksand\',sans-serif;font-weight:700;font-size:1em;">' + section.heading + '</h4>' +
                '<ul style="margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px;">' + itemsHtml + '</ul>' +
                '</div>';
        }).join('');

        return '<div style="display:flex;flex-direction:column;gap:24px;">' +
            '<div style="display:flex;align-items:center;gap:14px;padding-bottom:18px;border-bottom:1px solid var(--neutral-200);">' +
            '<div style="background:' + pb.color + '18;width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
            '<i class="fas ' + pb.icon + '" style="color:' + pb.color + ';font-size:1.3em;"></i>' +
            '</div>' +
            '<div>' +
            '<h3 style="margin:0 0 4px 0;font-family:\'Quicksand\',sans-serif;font-weight:800;color:var(--neutral-800);font-size:1.25em;">' + pb.title + ' Playbook</h3>' +
            '<p style="margin:0;color:var(--neutral-500);font-size:0.88em;line-height:1.5;">' + pb.overview + '</p>' +
            '</div>' +
            '</div>' +
            sectionsHtml +
            '</div>';
    },

    renderFAQList() {
        var container = document.getElementById('faqContainer');
        if (!container) return;

        var faqs = [
            { q: 'How is Classroom Availability calculated?', a: 'Capacity (or Monthly Override if set) minus the number of Enrolled children in that room.' },
            { q: 'What is the difference between "On Process" and "Enrolled"?', a: '<strong>On Process</strong> families are in the pipeline and do <em>not</em> count against capacity. <strong>Enrolled</strong> children hold a spot and <em>do</em> deduct from available capacity.' },
            { q: 'Do Temporary Access users need to create a password?', a: 'No. They log in using only their email address. No password setup required — just send them the CRM URL and their email.' },
            { q: 'What happens when a Temporary Access user\'s time expires?', a: 'After 120 hours (5 days), their login is automatically blocked with the message: "Your temporary access has expired." No action needed from you.' },
            { q: 'How do I plan for future capacity changes?', a: 'Go to Settings → Edit Classroom → Monthly Capacity Overrides → set the new total capacity for that month. The Availability tab will reflect it immediately.' },
            { q: 'Can I over-enroll a classroom?', a: 'Yes. The system allows it but flags it with a red negative number (e.g., <span style="color:red">-1 spots</span>) on the Dashboard and Availability tab.' },
            { q: 'How do I manage the Waitlist?', a: 'Filter the CRM by "Waitlisted". When a spot opens, edit the child and change status to "Enrolled".' },
            { q: 'Can I delete a location?', a: 'Yes, but with caution. Deleting a location orphans its classrooms and children. Reassign everything first.' },
        ];

        var html = '<div style="display:flex;flex-direction:column;gap:18px;">';
        faqs.forEach(function (item) {
            html += '<div style="border-bottom:1px solid var(--neutral-200);padding-bottom:14px;">' +
                '<h5 style="margin:0 0 6px 0;color:var(--secondary-700);font-size:1em;font-weight:700;">' + item.q + '</h5>' +
                '<p style="margin:0;color:var(--neutral-600);font-size:0.92em;line-height:1.6;">' + item.a + '</p>' +
                '</div>';
        });
        html += '</div>';
        container.innerHTML = html;
    }
};
