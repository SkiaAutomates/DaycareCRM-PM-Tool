/**
 * Day Care CRM - Data Layer
 * Uses localStorage with Supabase cloud sync
 */

const Data = {
    STORAGE_KEYS: {
        PARENTS: 'dc_parents',
        CHILDREN: 'dc_children',
        WAITLIST: 'dc_waitlist',
        TOURS: 'dc_tours',
        PROJECTS: 'dc_projects',
        SERVICE_AGREEMENTS: 'dc_service_agreements',
        PLAYDATES: 'dc_playdates',
        ONBOARDING: 'dc_onboarding',
        NOTIFICATIONS: 'dc_notifications',
        SCHEDULES: 'dc_schedules',
        CAPACITY_OVERRIDES: 'dc_classroom_capacity_override'
    },

    // Map localStorage keys to Supabase table names
    SUPABASE_TABLES: {
        'dc_parents': 'parents',
        'dc_children': 'children',
        'dc_parent_child': 'parent_child',
        'dc_waitlist': 'waitlist',
        'dc_waitlist': 'waitlist',
        // 'dc_projects': 'projects', // LOCAL ONLY to prevent schema mismatch
        'dc_notifications': 'notifications',
        'dc_schedules': 'schedules'
    },

    supabaseEnabled: typeof Supabase !== 'undefined',
    isInitialized: false,
    _loadingPromise: null,

    // Classroom configuration (default)
    CLASSROOMS_DEFAULT: [
        // Day Care Location 1
        { id: 'dc01-rm01', name: 'Ruby Room', location: 'Day Care Location 1', ageCategory: 'Non Mobile Infant', ageRangeMonths: { min: 0, max: 12 }, maxCapacity: 8 },
        { id: 'dc01-rm02', name: 'Sapphire Room', location: 'Day Care Location 1', ageCategory: 'Mobile Infant', ageRangeMonths: { min: 12, max: 18 }, maxCapacity: 11 },
        { id: 'dc01-rm03', name: 'Emerald Room', location: 'Day Care Location 1', ageCategory: 'Toddler', ageRangeMonths: { min: 18, max: 30 }, maxCapacity: 12 },
        { id: 'dc01-rm04', name: 'Amethyst Room', location: 'Day Care Location 1', ageCategory: 'Lower Preschool', ageRangeMonths: { min: 30, max: 42 }, maxCapacity: 20 },
        { id: 'dc01-rm05', name: 'Diamond Room', location: 'Day Care Location 1', ageCategory: 'Upper Preschool', ageRangeMonths: { min: 42, max: 72 }, maxCapacity: 24 },
        // Day Care Location 2
        { id: 'dc02-rm01', name: 'Pearl Room', location: 'Day Care Location 2', ageCategory: 'Non Mobile Infant', ageRangeMonths: { min: 0, max: 18 }, maxCapacity: 16 },
        { id: 'dc02-rm02', name: 'Opal Room', location: 'Day Care Location 2', ageCategory: 'Toddler', ageRangeMonths: { min: 18, max: 36 }, maxCapacity: 12 }
    ],

    CLASSROOMS: [], // Will be loaded from storage or defaults
    LOCATIONS: [], // Will be loaded from storage or defaults

    TOUR_SOURCES: ['Google Search', 'Yelp', 'Word of Mouth', 'Website', 'Brighthorizon', 'Other'],

    // Initialize and sync with Supabase
    async init() {
        if (this._loadingPromise) return this._loadingPromise;

        this._loadingPromise = (async () => {
            // Determine if this is the admin account
            const session = JSON.parse(localStorage.getItem('dc_session') || '{}');
            const isAdmin = session.user?.email === ALLOWED_EMAIL;

            // Load Classrooms from local storage or use defaults
            const storedClassrooms = localStorage.getItem('dc_classrooms');
            if (storedClassrooms) {
                this.CLASSROOMS = JSON.parse(storedClassrooms);
            } else if (isAdmin) {
                // Only seed default classrooms for the admin account
                this.CLASSROOMS = JSON.parse(JSON.stringify(this.CLASSROOMS_DEFAULT));
            } else {
                // New client: start with empty classrooms
                this.CLASSROOMS = [];
            }

            // Load Locations
            const storedLocations = localStorage.getItem('dc_locations');
            if (storedLocations) {
                this.LOCATIONS = JSON.parse(storedLocations);
            } else if (isAdmin) {
                // Only seed default locations for the admin account
                this.LOCATIONS = [...new Set(this.CLASSROOMS.map(c => c.location))];
                if (!this.LOCATIONS.includes('Day Care Location 1')) this.LOCATIONS.push('Day Care Location 1');
                if (!this.LOCATIONS.includes('Day Care Location 2')) this.LOCATIONS.push('Day Care Location 2');
                this.saveLocations();
            } else {
                // New client: start with empty locations
                this.LOCATIONS = [];
            }

            // Initialize localStorage for other keys
            Object.values(this.STORAGE_KEYS).forEach(key => {
                if (!localStorage.getItem(key)) {
                    localStorage.setItem(key, JSON.stringify([]));
                }
            });

            // Ensure CRM Users key exists
            if (!localStorage.getItem('dc_users')) {
                localStorage.setItem('dc_users', JSON.stringify([]));
            }

            // Try to load from Supabase if available
            // Check if we should skip sync (e.g. after a fresh import)
            const skipSync = localStorage.getItem('dc_skip_sync');

            if (skipSync === 'true') {
                console.log('⏩ Skipping Supabase sync (Import detected)');
                localStorage.removeItem('dc_skip_sync');
            } else if (this.supabaseEnabled) {
                try {
                    await this.loadFromSupabase();
                    console.log('✅ Data loaded from Supabase');

                    // DATA CLEANUP: Remove duplicate notifications
                    this.cleanupDuplicateNotifications();

                } catch (err) {
                    console.log('⚠️ Using localStorage only:', err.message);
                }
            }

            // MIGRATION: Update old location names to new ones
            this.migrateLocations();

            // MIGRATION: Update old classroom IDs to dc01-rmX format
            this.migrateClassroomIds();

            this.isInitialized = true;
        })();

        return this._loadingPromise;
    },

    // Migration helper
    migrateLocations() {
        // 1. Unique locations check
        this.LOCATIONS = [...new Set(this.LOCATIONS)].sort();
        this.saveLocations();

        // 2. Migrate Classrooms (Update IDs if strictly necessary? No, keeping IDs same for now to avoid breaking refs)
        // Actually, just migrating usage of "Day Care Location 1" string in data.

        const migrateCollection = (key) => {
            const data = this._get(key);
            let changed = false;
            data.forEach(item => {
                if (item.location === 'Day Care Location 1') {
                    item.location = 'Day Care Location 1';
                    changed = true;
                } else if (item.location === 'Day Care Location 2') {
                    item.location = 'Day Care Location 2';
                    changed = true;
                }
            });
            if (changed) {
                localStorage.setItem(key, JSON.stringify(data));
                console.log(`Migrated locations in ${key}`);
            }
        };

        // Migrate all collections that might have location
        [
            this.STORAGE_KEYS.PARENTS,     // might have campus?
            this.STORAGE_KEYS.CHILDREN,    // children have location?
            this.STORAGE_KEYS.WAITLIST,    // waitlist has location
            this.STORAGE_KEYS.TOURS,       // tours have location
            this.STORAGE_KEYS.PROJECTS,    // projects have location
            this.STORAGE_KEYS.SERVICE_AGREEMENTS // SAs have location
        ].forEach(key => migrateCollection(key));

        // PHASE 2: Remap any remaining unknown location names to configured locations
        // This handles mock data that was generated with random city names (e.g., "Imus, Cavite - CALABARZON")
        const configuredLocations = this.getLocations();
        if (configuredLocations.length === 0) return;

        let locationIndex = 0;
        const remapCollection = (key) => {
            const data = this._get(key);
            let changed = false;
            data.forEach(item => {
                if (item.location && !configuredLocations.includes(item.location)) {
                    // Round-robin assign to configured locations
                    item.location = configuredLocations[locationIndex % configuredLocations.length];
                    locationIndex++;
                    changed = true;
                }
            });
            if (changed) {
                localStorage.setItem(key, JSON.stringify(data));
                console.log(`🔄 Remapped unknown locations in ${key}`);
            }
        };

        [
            this.STORAGE_KEYS.CHILDREN,
            this.STORAGE_KEYS.PARENTS,
            this.STORAGE_KEYS.WAITLIST,
            this.STORAGE_KEYS.TOURS,
            this.STORAGE_KEYS.PROJECTS,
            this.STORAGE_KEYS.SERVICE_AGREEMENTS
        ].forEach(key => remapCollection(key));
    },

    migrateClassroomIds() {
        // Map of old IDs to new IDs
        const idMap = {
            'lh-infant-nm': 'dc01-rm01',
            'lh-infant-m': 'dc01-rm02',
            'lh-toddler': 'dc01-rm03',
            'lh-lower-ps': 'dc01-rm04',
            'lh-upper-ps': 'dc01-rm05',
            'tv-infant': 'dc02-rm01',
            'tv-toddler': 'dc02-rm02'
        };

        let roomsChanged = false;
        this.CLASSROOMS.forEach(c => {
            if (idMap[c.id]) {
                c.id = idMap[c.id];
                roomsChanged = true;
            }
        });
        if (roomsChanged) this.saveClassrooms();

        // Helper to migrate collections referencing classroomId
        const migrateCollection = (key) => {
            const data = this._get(key);
            let changed = false;
            if (Array.isArray(data)) {
                data.forEach(item => {
                    if (item.classroomId && idMap[item.classroomId]) {
                        item.classroomId = idMap[item.classroomId];
                        changed = true;
                    }
                });
                if (changed) {
                    localStorage.setItem(key, JSON.stringify(data));
                    console.log(`Migrated classroom IDs in ${key}`);
                }
            }
        };

        // Collections that might reference classroomId
        [
            this.STORAGE_KEYS.CHILDREN,
            this.STORAGE_KEYS.WAITLIST,
            this.STORAGE_KEYS.PROJECTS
        ].forEach(key => migrateCollection(key));
    },

    /**
     * DANGER: Verify wipe of all data
     */
    async deleteAllData(suppressReload = false) {
        console.warn('⚠️ DELETING ALL DATA...');

        // Set skip_sync flag FIRST — before any await — so even if Supabase
        // delete fails mid-way, the reload will still start with a clean slate
        localStorage.setItem('dc_skip_sync', 'true');

        // 1. Clear Supabase if enabled
        if (this.supabaseEnabled) {
            const tablesToDelete = ['parents', 'children', 'projects', 'notifications', 'attendance'];
            for (const tableName of tablesToDelete) {
                try {
                    await this.request(tableName, 'DELETE', null, '?id=neq.00000000-0000-0000-0000-000000000000');
                    console.log(`✅ Cleared Supabase table: ${tableName}`);
                } catch (e) {
                    console.warn(`Could not clear ${tableName} from Supabase:`, e.message);
                }
            }
        }

        // 2. Clear all localStorage keys
        Object.values(this.STORAGE_KEYS).forEach(key => {
            localStorage.setItem(key, JSON.stringify([]));
        });

        // Also clear attendance & misc keys
        localStorage.removeItem('dc_attendance');

        console.log('✅ All data cleared');
        if (!suppressReload) location.reload();
    },

    /**
     * Import bulk data
     */
    async importData(data) {
        if (!data || !data.parents || !data.children) {
            console.error('Invalid import data format');
            return;
        }

        console.log('🚀 Starting Import...');

        // 0. Clear existing LocalStorage keys to ensure a clean slate
        Object.values(this.STORAGE_KEYS).forEach(key => {
            localStorage.setItem(key, JSON.stringify([]));
        });

        // 0. Clear Supabase Tables (if enabled) to prevent sync conflicts
        if (this.supabaseEnabled) {
            try {
                console.log('🧹 Clearing Supabase tables...');
                await Supabase.deleteAll(this.SUPABASE_TABLES[this.STORAGE_KEYS.SCHEDULES]);
                await Supabase.deleteAll(this.SUPABASE_TABLES[this.STORAGE_KEYS.PARENTS]); // Must be deleted before children if FK exists? No, children depend on parents?
                // Wait, FK constraints: Children usually depend on Parents? Or Parents on Children?
                // In my schema: Children have parentIds (array).
                // Relationship table? No, it's Many-to-Many via array or junction?
                // The schema is likely implicit in JSON.
                // But wait, if I delete Parents, do Children cascade?
                // Safest: Delete Schedules -> Children -> Parents.
                // Actually, let's just delete all 3.
                await Supabase.deleteAll(this.SUPABASE_TABLES[this.STORAGE_KEYS.CHILDREN]);
                await Supabase.deleteAll(this.SUPABASE_TABLES[this.STORAGE_KEYS.PARENTS]);
            } catch (e) {
                console.warn('⚠️ Failed to clear Supabase tables', e);
            }
        }

        // 1. Import Parents
        if (data.parents && data.parents.length) {
            console.log(`Importing ${data.parents.length} parents...`);
            localStorage.setItem(this.STORAGE_KEYS.PARENTS, JSON.stringify(data.parents));

            if (this.supabaseEnabled) {
                try {
                    const parentsSnake = data.parents.map(p => this._camelToSnake(p));
                    await Supabase.insert(this.SUPABASE_TABLES[this.STORAGE_KEYS.PARENTS], parentsSnake);
                } catch (e) { console.error('Supabase parent import failed', e); }
            }
        } else {
            console.warn('Import data missing parents array');
        }

        // 2. Import Children
        if (data.children && data.children.length) {
            console.log(`Importing ${data.children.length} children...`);
            localStorage.setItem(this.STORAGE_KEYS.CHILDREN, JSON.stringify(data.children));

            if (this.supabaseEnabled) {
                try {
                    const childrenSnake = data.children.map(c => this._camelToSnake(c));
                    await Supabase.insert(this.SUPABASE_TABLES[this.STORAGE_KEYS.CHILDREN], childrenSnake);
                } catch (e) { console.error('Supabase child import failed', e); }
            }
        } else {
            console.warn('Import data missing children array');
        }

        // 3. Import Schedules
        if (data.schedules && data.schedules.length) {
            console.log(`Importing ${data.schedules.length} schedules...`);
            localStorage.setItem(this.STORAGE_KEYS.SCHEDULES, JSON.stringify(data.schedules));

            if (this.supabaseEnabled) {
                try {
                    const schedulesSnake = data.schedules.map(s => this._camelToSnake(s));
                    await Supabase.insert(this.SUPABASE_TABLES[this.STORAGE_KEYS.SCHEDULES], schedulesSnake);
                } catch (e) { console.error('Supabase schedule import failed', e); }
            }
        }

        // 4. Import Projects (Local Only for now due to schema mismatch)
        if (data.projects && data.projects.length) {
            console.log(`Importing ${data.projects.length} projects...`);
            localStorage.setItem(this.STORAGE_KEYS.PROJECTS, JSON.stringify(data.projects));

            // Try Sync to Supabase (Best Effort)
            if (this.supabaseEnabled) {
                try {
                    // This might fail if columns are missing, but we try anyway
                    const projectsSnake = data.projects.map(p => this._camelToSnake(p));
                    await Supabase.insert(this.SUPABASE_TABLES[this.STORAGE_KEYS.PROJECTS], projectsSnake);
                } catch (e) { console.warn('Supabase project import partially failed (schema mismatch likely)', e); }
            }
        }

        const msg = `Import completed: ${data.parents.length} parents, ${data.children.length} children`;
        console.log('✅ ' + msg);
        Utils.showToast(msg, 'success');

        // Give time for Toast to be seen
        setTimeout(() => location.reload(), 2000);
    },

    // Remove duplicate notifications
    cleanupDuplicateNotifications() {
        const notifications = this.getNotifications();
        if (!notifications.length) return;

        const unique = {};
        const duplicates = [];

        notifications.forEach(n => {
            // Create a unique signature for the notification
            // Group by type, child/waitlist ID, and simplified date (YYYY-MM-DD)
            const dateStr = n.createdAt ? n.createdAt.split('T')[0] : 'unknown';
            const signature = `${n.type}-${n.childId || n.waitlistId}-${dateStr}`;

            if (unique[signature]) {
                // If we already have one, check which is newer or "better"
                // For now, valid one is kept, keep the one that is read if any?
                // Or just keep the first one found (simplest)

                // Actually, let's keep the one that is READ if the new one is UNREAD
                if (unique[signature].read && !n.read) {
                    duplicates.push(n.id); // Delete the unread duplicate
                } else if (!unique[signature].read && n.read) {
                    // Replace unread with read
                    duplicates.push(unique[signature].id);
                    unique[signature] = n;
                } else {
                    // Both same status, keep the one we have, delete current
                    duplicates.push(n.id);
                }
            } else {
                unique[signature] = n;
            }
        });

        if (duplicates.length > 0) {
            console.log(`🧹 Removing ${duplicates.length} duplicate notifications`);
            duplicates.forEach(id => {
                this._delete(this.STORAGE_KEYS.NOTIFICATIONS, id);
            });
        }
    },

    // Load data from Supabase to localStorage
    async loadFromSupabase() {
        for (const [localKey, tableName] of Object.entries(this.SUPABASE_TABLES)) {
            const data = await Supabase.getAll(tableName);
            // Sync if data is not null (which indicates an error)
            // This ensures empty tables in Supabase correctly clear localStorage
            if (data !== null) {
                // Convert Supabase snake_case to camelCase
                const converted = data.map(item => this._snakeToCamel(item));
                localStorage.setItem(localKey, JSON.stringify(converted));
            }
        }

        // Hydrate relationships (Parent <-> Child)
        this._hydrateRelationships();
    },

    // Reconstruct relationships from join table
    _hydrateRelationships() {
        const links = this._get('dc_parent_child');
        if (!links.length) return;

        let parents = this.getParents();
        let children = this.getChildren();
        let changed = false;

        // Reset arrays first to avoid duplicates if re-running
        parents.forEach(p => p.childIds = []);
        children.forEach(c => c.parentIds = []);

        links.forEach(link => {
            const parent = parents.find(p => p.id === link.parentId);
            const child = children.find(c => c.id === link.childId);

            if (parent && child) {
                if (!parent.childIds.includes(child.id)) {
                    parent.childIds.push(child.id);
                }
                if (!child.parentIds.includes(parent.id)) {
                    child.parentIds.push(parent.id);
                }
                changed = true;
            }
        });

        if (changed) {
            this._set(this.STORAGE_KEYS.PARENTS, parents);
            this._set(this.STORAGE_KEYS.CHILDREN, children);
            console.log('✅ Relationships hydrated');
        }
    },

    // Sync item to Supabase
    async _syncToSupabase(key, item, action = 'insert') {
        if (!this.supabaseEnabled) return;
        const tableName = this.SUPABASE_TABLES[key];
        if (!tableName) return;

        try {
            const data = this._camelToSnake(item);
            if (action === 'insert') {
                await Supabase.insert(tableName, data);
            } else if (action === 'update') {
                await Supabase.update(tableName, item.id, data);
            } else if (action === 'delete') {
                await Supabase.delete(tableName, item.id);
            }
        } catch (err) {
            console.warn('Supabase sync failed:', err);
        }
    },

    // Convert camelCase to snake_case for Supabase
    _camelToSnake(obj) {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            result[snakeKey] = value;
        }
        return result;
    },

    // Convert snake_case to camelCase from Supabase
    _snakeToCamel(obj) {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            result[camelKey] = value;
        }
        return result;
    },

    // Generic CRUD operations
    _get(key) {
        return JSON.parse(localStorage.getItem(key) || '[]');
    },

    _set(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    _add(key, item) {
        const session = JSON.parse(localStorage.getItem('dc_session') || '{}');
        const orgId = session.user?.organizationId;

        const items = this._get(key);
        item.id = item.id || Utils.generateId();

        // Inject organization context for multi-tenancy
        if (orgId && !item.organizationId) {
            item.organizationId = orgId;
        }

        item.createdAt = new Date().toISOString();
        item.updatedAt = new Date().toISOString();
        items.push(item);
        this._set(key, items);
        // Sync to Supabase in background
        this._syncToSupabase(key, item, 'insert');
        return item;
    },

    _update(key, id, updates) {
        const items = this._get(key);
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
            this._set(key, items);
            // Sync to Supabase in background
            this._syncToSupabase(key, items[index], 'update');
            return items[index];
        }
        return null;
    },

    _delete(key, id) {
        const items = this._get(key);
        const filtered = items.filter(item => item.id !== id);
        this._set(key, filtered);
        // Sync to Supabase in background
        this._syncToSupabase(key, { id }, 'delete');
        return filtered.length < items.length;
    },

    _getById(key, id) {
        return this._get(key).find(item => item.id === id);
    },

    // Classroom operations
    getClassrooms() {
        return this.CLASSROOMS;
    },

    getClassroomById(id) {
        return this.CLASSROOMS.find(c => c.id === id);
    },

    getClassroomsByLocation(location) {
        return this.CLASSROOMS.filter(c => c.location === location);
    },

    // Save locations to storage
    saveLocations() {
        localStorage.setItem('dc_locations', JSON.stringify(this.LOCATIONS));
    },

    getLocations() {
        // Natural Sort
        return this.LOCATIONS.sort((a, b) =>
            a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
        );
    },

    addLocation(name) {
        if (!this.LOCATIONS.includes(name)) {
            this.LOCATIONS.push(name);
            this.saveLocations();
            return true;
        }
        return false;
    },

    deleteLocation(name) {
        // Prevent deleting if classrooms exist
        const hasClassrooms = this.CLASSROOMS.some(c => c.location === name);
        if (hasClassrooms) return false;

        this.LOCATIONS = this.LOCATIONS.filter(l => l !== name);
        this.saveLocations();
        return true;
    },

    updateLocationName(oldName, newName) {
        // Update in LOCATIONS array
        const index = this.LOCATIONS.indexOf(oldName);
        if (index !== -1) {
            this.LOCATIONS[index] = newName;
            this.saveLocations();
        }

        // Update in CLASSROOMS
        let changed = false;
        this.CLASSROOMS.forEach(c => {
            if (c.location === oldName) {
                c.location = newName;
                changed = true;
            }
        });

        if (changed) {
            this.saveClassrooms();
            // Sync logic for other collections...
            const collections = [
                this.STORAGE_KEYS.PARENTS,
                this.STORAGE_KEYS.CHILDREN,
                this.STORAGE_KEYS.WAITLIST,
                this.STORAGE_KEYS.TOURS,
                this.STORAGE_KEYS.PROJECTS,
                this.STORAGE_KEYS.SERVICE_AGREEMENTS,
                this.STORAGE_KEYS.PLAYDATES,
                this.STORAGE_KEYS.ONBOARDING
            ];

            collections.forEach(key => {
                const data = this._get(key);
                let colChanged = false;
                data.forEach(item => {
                    // Check common location fields
                    if (item.location === oldName) {
                        item.location = newName;
                        colChanged = true;
                    }
                    if (item.preferred_location === oldName) {
                        item.preferred_location = newName;
                        colChanged = true;
                    }
                });

                if (colChanged) {
                    this._set(key, data);
                    localStorage.setItem(key, JSON.stringify(data));
                }
            });
            return true;
        }
        return true; // Return true if location name updated even if no records changed
    },

    // Save classrooms to storage
    saveClassrooms() {
        localStorage.setItem('dc_classrooms', JSON.stringify(this.CLASSROOMS));
        // Note: Classrooms are currently local-only config, not synced to Supabase as a table
        // To sync, we'd need a 'classrooms' table in Supabase.
        // For now, consistent with requirements, we keep it local or assume it's "settings".
    },

    // Update a classroom's name
    updateClassroomName(id, newName) {
        return this.updateClassroom(id, { name: newName });
    },

    // Add a new classroom
    addClassroom(classroom) {
        if (!classroom.id) classroom.id = Utils.generateId();
        this.CLASSROOMS.push(classroom);
        this.saveClassrooms();
        return classroom;
    },

    // Delete a classroom
    deleteClassroom(id) {
        const initialLength = this.CLASSROOMS.length;
        this.CLASSROOMS = this.CLASSROOMS.filter(c => c.id !== id);
        if (this.CLASSROOMS.length !== initialLength) {
            this.saveClassrooms();
            return true;
        }
        return false;
    },

    // Update classroom details
    updateClassroom(id, updates) {
        const index = this.CLASSROOMS.findIndex(c => c.id === id);
        if (index !== -1) {
            this.CLASSROOMS[index] = { ...this.CLASSROOMS[index], ...updates };
            this.saveClassrooms();
            return true;
        }
        return false;
    },

    getClassroomCapacityOverride(classroomId, monthLabel) {
        const classroom = this.getClassrooms().find(c => c.id === classroomId);
        if (classroom && classroom.capacityOverrides) {
            return classroom.capacityOverrides[monthLabel];
        }
        return undefined;
    },

    saveClassroomCapacityOverride(classroomId, monthLabel, capacity) {
        const classroom = this.getClassrooms().find(c => c.id === classroomId);
        if (classroom) {
            if (!classroom.capacityOverrides) classroom.capacityOverrides = {};

            if (capacity === null || capacity === undefined || capacity === '') {
                delete classroom.capacityOverrides[monthLabel];
            } else {
                classroom.capacityOverrides[monthLabel] = parseInt(capacity);
            }

            this.updateClassroom(classroomId, { capacityOverrides: classroom.capacityOverrides });
            return true;
        }
        return false;
    },

    // Child operations
    getChildren() {
        return this._get(this.STORAGE_KEYS.CHILDREN);
    },

    // Parent operations
    getParents() {
        return this._get(this.STORAGE_KEYS.PARENTS);
    },

    getParentById(id) {
        return this._getById(this.STORAGE_KEYS.PARENTS, id);
    },

    addParent(parent) {
        return this._add(this.STORAGE_KEYS.PARENTS, parent);
    },

    updateParent(id, updates) {
        const result = this._update(this.STORAGE_KEYS.PARENTS, id, updates);

        // Sync 'Enrolled' status to Children
        if (updates.status === 'Enrolled') {
            const parent = this.getParentById(id);
            if (parent && parent.childIds) {
                parent.childIds.forEach(childId => {
                    const child = this.getChildById(childId);
                    if (child && child.status !== 'Enrolled') {
                        this.updateChild(childId, { status: 'Enrolled' });
                    }
                });
            }
        }
        return result;
    },

    deleteParent(id) {
        return this._delete(this.STORAGE_KEYS.PARENTS, id);
    },

    searchParents(query) {
        const q = query.toLowerCase();
        return this.getParents().filter(p =>
            p.firstName.toLowerCase().includes(q) ||
            p.lastName.toLowerCase().includes(q)
        );
    },

    // Parent Note operations
    addParentNote(parentId, content, authorName) {
        const parent = this.getParentById(parentId);
        if (!parent) return null;

        if (!parent.notes) parent.notes = [];

        const note = {
            id: Utils.generateId(),
            content: content,
            author: authorName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        parent.notes.push(note);
        // Sort notes by date desc
        parent.notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        this.updateParent(parentId, { notes: parent.notes });
        return note;
    },

    updateParentNote(parentId, noteId, content) {
        const parent = this.getParentById(parentId);
        if (!parent || !parent.notes) return null;

        const noteIndex = parent.notes.findIndex(n => n.id === noteId);
        if (noteIndex === -1) return null;

        parent.notes[noteIndex].content = content;
        parent.notes[noteIndex].updatedAt = new Date().toISOString();

        this.updateParent(parentId, { notes: parent.notes });
        return parent.notes[noteIndex];
    },

    deleteParentNote(parentId, noteId) {
        const parent = this.getParentById(parentId);
        if (!parent || !parent.notes) return false;

        const initialLength = parent.notes.length;
        parent.notes = parent.notes.filter(n => n.id !== noteId);

        if (parent.notes.length !== initialLength) {
            this.updateParent(parentId, { notes: parent.notes });
            return true;
        }
        return false;
    },

    // Child Note operations
    addChildNote(childId, content, authorName) {
        const child = this.getChildById(childId);
        if (!child) return null;

        if (!child.notes) child.notes = [];

        const note = {
            id: Utils.generateId(),
            content: content,
            author: authorName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        child.notes.push(note);
        // Sort notes by date desc
        child.notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        this.updateChild(childId, { notes: child.notes });
        return note;
    },

    updateChildNote(childId, noteId, content) {
        const child = this.getChildById(childId);
        if (!child || !child.notes) return null;

        const noteIndex = child.notes.findIndex(n => n.id === noteId);
        if (noteIndex === -1) return null;

        child.notes[noteIndex].content = content;
        child.notes[noteIndex].updatedAt = new Date().toISOString();

        this.updateChild(childId, { notes: child.notes });
        return child.notes[noteIndex];
    },

    deleteChildNote(childId, noteId) {
        const child = this.getChildById(childId);
        if (!child || !child.notes) return false;

        const initialLength = child.notes.length;
        child.notes = child.notes.filter(n => n.id !== noteId);

        if (child.notes.length !== initialLength) {
            this.updateChild(childId, { notes: child.notes });
            return true;
        }
        return false;
    },

    // Schedule operations
    getSchedules() {
        return this._get(this.STORAGE_KEYS.SCHEDULES);
    },

    getSchedulesByChild(childId) {
        return this.getSchedules()
            .filter(s => s.childId === childId)
            .sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));
    },

    addSchedule(schedule) {
        return this._add(this.STORAGE_KEYS.SCHEDULES, schedule);
    },

    updateSchedule(id, updates) {
        return this._update(this.STORAGE_KEYS.SCHEDULES, id, updates);
    },

    deleteSchedule(id) {
        return this._delete(this.STORAGE_KEYS.SCHEDULES, id);
    },

    // Children operations
    getChildren() {
        return this._get(this.STORAGE_KEYS.CHILDREN);
    },

    getChildById(id) {
        return this._getById(this.STORAGE_KEYS.CHILDREN, id);
    },

    addChild(child) {
        return this._add(this.STORAGE_KEYS.CHILDREN, child);
    },

    updateChild(id, updates) {
        const result = this._update(this.STORAGE_KEYS.CHILDREN, id, updates);

        // Sync 'Enrolled' status to Parents
        if (updates.status === 'Enrolled') {
            const child = this.getChildById(id);
            if (child && child.parentIds) {
                child.parentIds.forEach(parentId => {
                    const parent = this.getParentById(parentId);
                    if (parent && parent.status !== 'Enrolled') {
                        this.updateParent(parentId, { status: 'Enrolled' });
                    }
                });
            }
        }
        return result;
    },

    deleteChild(id) {
        return this._delete(this.STORAGE_KEYS.CHILDREN, id);
    },

    searchChildren(query) {
        const q = query.toLowerCase();
        return this.getChildren().filter(c =>
            c.firstName.toLowerCase().includes(q) ||
            c.lastName.toLowerCase().includes(q)
        );
    },

    getChildrenByParent(parentId) {
        return this.getChildren().filter(c => c.parentIds && c.parentIds.includes(parentId));
    },

    getChildrenByClassroom(classroomId) {
        const children = this.getChildren().filter(c => c.classroomId === classroomId && c.status === 'Enrolled');
        const schedules = this.getSchedules();

        return children.map(child => {
            // Find active schedule for this child
            const activeSchedule = schedules.find(s => s.childId === child.id && s.status === 'Active');

            // Augment child with schedule data if missing (Supabase sync might lose columns)
            if (activeSchedule) {
                return {
                    ...child,
                    daysOfWeek: child.daysOfWeek || activeSchedule.daysOfWeek,
                    scheduleType: child.scheduleType || activeSchedule.type
                };
            }
            return child;
        });
    },

    getChildrenByLocation(location) {
        return this.getChildren().filter(c => c.location === location);
    },

    getChildrenByStatus(status) {
        return this.getChildren().filter(c => c.status === status);
    },

    // Waitlist operations
    getWaitlist() {
        return this._get(this.STORAGE_KEYS.WAITLIST);
    },

    addWaitlistEntry(entry) {
        return this._add(this.STORAGE_KEYS.WAITLIST, entry);
    },

    updateWaitlistEntry(id, updates) {
        return this._update(this.STORAGE_KEYS.WAITLIST, id, updates);
    },

    deleteWaitlistEntry(id) {
        return this._delete(this.STORAGE_KEYS.WAITLIST, id);
    },

    // Tour operations
    getTours() {
        const legacyTours = this._get(this.STORAGE_KEYS.TOURS);

        // Map "Scheduled Tour" projects to Tour format
        const projectTours = this.getProjects()
            .filter(p => p.type === 'Scheduled Tour')
            .map(p => ({
                id: p.id,
                scheduledDate: p.tourDate,
                // Status Mapping: 
                // Any status other than 'In Progress' should be reflected.
                // 'Cancelled' -> 'Cancelled'
                // 'Rescheduled' -> 'Rescheduled'
                // 'Completed' -> 'Completed'
                // 'In Progress' -> 'Scheduled' (Default for active tours)
                status: (p.status === 'Cancelled' || p.status === 'Rescheduled' || p.status === 'Completed') ? p.status : 'Scheduled',
                location: p.location,
                source: p.source,
                childId: p.childId,
                parentIds: p.parentIds, // Pass parentIds for tooltip
                parentName: p.parentName, // Pass parentName for tooltip
                type: 'project', // Marker to identify source
                createdAt: p.createdAt
            }));

        return [...legacyTours, ...projectTours];
    },

    getTourById(id) {
        return this._getById(this.STORAGE_KEYS.TOURS, id);
    },

    addTour(tour) {
        return this._add(this.STORAGE_KEYS.TOURS, tour);
    },

    updateTour(id, updates) {
        return this._update(this.STORAGE_KEYS.TOURS, id, updates);
    },

    deleteTour(id) {
        return this._delete(this.STORAGE_KEYS.TOURS, id);
    },

    getToursByStatus(status) {
        return this.getTours().filter(t => t.status === status);
    },

    getToursByLocation(location) {
        return this.getTours().filter(t => t.location === location);
    },

    getToursThisWeek() {
        const weekStart = Utils.getWeekStart();
        const weekEnd = Utils.getWeekEnd();
        return this.getTours().filter(t => {
            const tourDate = new Date(t.scheduledDate);
            return tourDate >= weekStart && tourDate <= weekEnd && t.status === 'Scheduled';
        });
    },

    // Project operations
    getProjects() {
        return this._get(this.STORAGE_KEYS.PROJECTS);
    },

    getProjectById(id) {
        return this._getById(this.STORAGE_KEYS.PROJECTS, id);
    },

    addProject(project) {
        return this._add(this.STORAGE_KEYS.PROJECTS, project);
    },

    updateProject(id, updates) {
        return this._update(this.STORAGE_KEYS.PROJECTS, id, updates);
    },

    deleteProject(id) {
        return this._delete(this.STORAGE_KEYS.PROJECTS, id);
    },

    getActiveProjects() {
        return this.getProjects().filter(p => p.status === 'In Progress');
    },

    // Service Agreement operations
    getServiceAgreements() {
        return this._get(this.STORAGE_KEYS.SERVICE_AGREEMENTS);
    },

    getServiceAgreementsByChild(childId) {
        return this.getServiceAgreements().filter(sa => sa.childId === childId);
    },

    // Toggle/Update specific status for a child's service agreement
    // If record doesn't exist, create it.
    updateServiceAgreementStatus(childId, statusType, isActive) {
        const agreements = this.getServiceAgreements();
        let agreement = agreements.find(sa => sa.childId === childId && sa.status === statusType);

        const child = this.getChildById(childId);
        if (!child) return null;

        if (isActive) {
            // If turning ON and doesn't exist, create it
            if (!agreement) {
                agreement = {
                    childId: childId,
                    location: child.location,
                    status: statusType,
                    dateSent: statusType === 'Sent' ? new Date().toISOString() : null,
                    dateSigned: statusType === 'Signed' ? new Date().toISOString() : null,
                    dateFollowedUp: statusType === 'Followed-up' ? new Date().toISOString() : null,
                    timestamp: new Date().toISOString()
                };
                this.addServiceAgreement(agreement);
            } else {
                // If exists, just update timestamp? Or leave as is? 
                // Requirement says "time stamp for this". Let's update timestamp.
                this.updateServiceAgreement(agreement.id, { timestamp: new Date().toISOString() });
            }
        } else {
            // If turning OFF and exists, delete it
            if (agreement) {
                this._delete(this.STORAGE_KEYS.SERVICE_AGREEMENTS, agreement.id);
            }
        }
        return true;
    },

    addServiceAgreement(sa) {
        return this._add(this.STORAGE_KEYS.SERVICE_AGREEMENTS, sa);
    },

    updateServiceAgreement(id, updates) {
        return this._update(this.STORAGE_KEYS.SERVICE_AGREEMENTS, id, updates);
    },

    // User operations
    getUsers() {
        return JSON.parse(localStorage.getItem('dc_users') || '[]');
    },

    addUser(user) {
        const users = this.getUsers();
        user.id = Utils.generateId();
        user.createdAt = new Date().toISOString();
        users.push(user);
        localStorage.setItem('dc_users', JSON.stringify(users));
        return user;
    },

    deleteUser(id) {
        let users = this.getUsers();
        users = users.filter(u => u.id !== id);
        localStorage.setItem('dc_users', JSON.stringify(users));
        return true;
    },

    // Playdate operations
    getPlaydates() {
        return this._get(this.STORAGE_KEYS.PLAYDATES);
    },

    addPlaydate(playdate) {
        return this._add(this.STORAGE_KEYS.PLAYDATES, playdate);
    },

    updatePlaydate(id, updates) {
        return this._update(this.STORAGE_KEYS.PLAYDATES, id, updates);
    },

    getUpcomingPlaydates() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return this.getPlaydates().filter(p => new Date(p.date) >= today && p.status === 'Upcoming');
    },

    getCompletedPlaydates() {
        return this.getPlaydates().filter(p => p.status === 'Completed');
    },

    // Onboarding/Offboarding operations
    getOnboarding() {
        return this._get(this.STORAGE_KEYS.ONBOARDING);
    },

    addOnboarding(entry) {
        return this._add(this.STORAGE_KEYS.ONBOARDING, entry);
    },

    deleteOnboardingByProjectId(projectId) {
        const entries = this.getOnboarding();
        const updated = entries.filter(e => e.projectId !== projectId);
        localStorage.setItem(this.STORAGE_KEYS.ONBOARDING, JSON.stringify(updated));
    },

    getOnboardingByType(type) {
        return this.getOnboarding().filter(o => o.type === type);
    },

    // Notification operations
    getNotifications() {
        return this._get(this.STORAGE_KEYS.NOTIFICATIONS);
    },

    addNotification(notification) {
        return this._add(this.STORAGE_KEYS.NOTIFICATIONS, notification);
    },

    markNotificationRead(id) {
        return this._update(this.STORAGE_KEYS.NOTIFICATIONS, id, { read: true });
    },

    markAllNotificationsRead() {
        const notifications = this.getNotifications();
        notifications.forEach(n => {
            if (!n.read) {
                this.markNotificationRead(n.id);
            }
        });
    },

    getUnreadNotifications() {
        return this.getNotifications().filter(n => !n.read);
    },

    // Dashboard statistics
    // Dashboard statistics
    getDashboardStats() {
        const children = this.getChildren().filter(c => c.status === 'Enrolled');
        const locations = this.getLocations();
        const locationCounts = {};

        locations.forEach(loc => {
            // Handle legacy mapping if needed, or strict match
            locationCounts[loc] = children.filter(c => c.location === loc ||
                (loc === 'Day Care Location 1' && c.location === 'Day Care Location 1') ||
                (loc === 'Day Care Location 2' && c.location === 'Day Care Location 2')
            ).length;
        });

        // Basic stats
        const waitlistCount = this.getChildren().filter(c => c.status === 'Waitlisted').length;
        const activeProjects = this.getActiveProjects().length;
        const toursThisWeek = this.getToursThisWeek().length;

        return {
            totalEnrolled: children.length,
            locationCounts,
            waitlistCount,
            activeProjects,
            toursThisWeek
        };
    },

    // Classroom capacity
    getClassroomCapacity(classroomId, date = new Date()) {
        const classroom = this.getClassroomById(classroomId);
        if (!classroom) return null;

        const enrolled = this.getChildrenByClassroom(classroomId).length;

        // Check for override
        const monthLabel = Utils.formatDate(date, 'monthYear');
        const override = this.getClassroomCapacityOverride(classroomId, monthLabel);
        const total = override !== undefined ? override : classroom.maxCapacity;

        return {
            filled: enrolled,
            total: total,
            available: total - enrolled,
            percentage: Math.round((enrolled / total) * 100)
        };
    },



    // Projected capacity for a future date
    getClassroomProjectedCapacity(classroomId, targetDate) {
        const classroom = this.getClassroomById(classroomId);
        if (!classroom) return null;

        const date = new Date(targetDate);
        /* 
           Logic:
           1. Start with all children who have a chance of being here (Enrolled, Preregistered).
           2. Filter by:
              - Enrollment Date <= targetDate
              - (Optional) Graduation Date >= targetDate
           3. Foreach child, calculate their Age at targetDate.
           4. Determine which classroom fits that age.
           5. If it matches this classroomId, count them.
        */

        let count = 0;
        const allChildren = this.getChildren();

        allChildren.forEach(child => {
            // 1. Must be Enrolled or Preregistered status (Waitlist doesn't count until enrolled)
            if (child.status !== 'Enrolled' && child.status !== 'Preregistered') return;

            // 2. Must be enrolled by that date
            const enrollDate = child.enrollmentDate ? new Date(child.enrollmentDate) : null;
            if (enrollDate && enrollDate > date) return; // Not started yet
            if (!enrollDate && child.status === 'Preregistered') return; // Preregistered but no date? Don't count.

            // 3. Manual Transition Logic:
            // Only count if they are currently assigned to this classroom.
            // Future transitions must be done manually by changing the classroom assignment.
            if (child.classroomId === classroomId) {
                count++;
            }
        });

        // Check for override
        const monthLabel = Utils.formatDate(date, 'monthYear');
        const override = this.getClassroomCapacityOverride(classroomId, monthLabel);
        const total = override !== undefined ? override : classroom.maxCapacity;

        return {
            filled: count,
            total: total,
            available: total - count,
            percentage: Math.round((count / total) * 100)
        };
    },

    // Generate transition notifications
    // Generate transition notifications
    checkTransitionAlerts() {
        const children = this.getChildren().filter(c => c.status === 'Enrolled');
        const alerts = [];

        children.forEach(child => {
            // 1. Manual Date Check
            if (child.nextTransitionDate) {
                const daysUntil = Utils.daysUntil(child.nextTransitionDate);
                if (daysUntil <= 30 && daysUntil >= -60) { // Warning up to 60 days overdue
                    const existing = this.getNotifications().find(n =>
                        n.childId === child.id &&
                        (n.type === 'transition' || n.type === 'transition-manual') &&
                        n.dueDate === child.nextTransitionDate
                    );

                    if (!existing) {
                        alerts.push({
                            type: 'transition-manual',
                            childId: child.id,
                            message: `${child.firstName} ${child.lastName} is due for transition (Manual Date: ${Utils.formatDate(child.nextTransitionDate)})`,
                            dueDate: child.nextTransitionDate,
                            read: false,
                            actionTaken: false
                        });
                    }
                }
            }

            // 2. Automated Age Check (Max Age Support)
            if (child.classroomId && child.birthDate) {
                const classroom = this.getClassroomById(child.classroomId);
                if (classroom && classroom.ageRangeMonths && classroom.ageRangeMonths.max) {
                    // Calculate max age date
                    const maxAgeDate = Utils.addMonths(child.birthDate, classroom.ageRangeMonths.max);
                    // Format as YYYY-MM-DD for consistency
                    const dateStr = maxAgeDate.toISOString().split('T')[0];
                    const daysUntil = Utils.daysUntil(dateStr);

                    // Alert if within 30 days OR overdue
                    if (daysUntil <= 30) {
                        const existing = this.getNotifications().find(n =>
                            n.childId === child.id &&
                            n.type === 'transition-age' &&
                            n.dueDate === dateStr
                        );

                        if (!existing) {
                            const isOverdue = daysUntil < 0;
                            const msg = isOverdue
                                ? `${child.firstName} ${child.lastName} has exceeded the max age for ${classroom.name} (Limit: ${classroom.ageRangeMonths.max}m)`
                                : `${child.firstName} ${child.lastName} is approaching the max age for ${classroom.name} (Limit: ${classroom.ageRangeMonths.max}m)`;

                            alerts.push({
                                type: 'transition-age',
                                childId: child.id,
                                message: msg,
                                dueDate: dateStr,
                                read: false,
                                actionTaken: false
                            });
                        }
                    }
                }
            }
        });

        alerts.forEach(alert => this.addNotification(alert));
        return alerts;
    },

    // Generate waitlist follow-up alerts
    checkWaitlistAlerts() {
        const waitlistChildren = this.getChildren().filter(c => c.status === 'Waitlisted');
        const waitlist = this.getWaitlist();
        const alerts = [];

        waitlist.forEach(entry => {
            const daysUntil = Utils.daysUntil(entry.desiredStartDate);
            if (daysUntil <= 30 && daysUntil > 0) {
                const existing = this.getNotifications().find(n =>
                    n.waitlistId === entry.id &&
                    n.type === 'waitlist' &&
                    n.dueDate === entry.desiredStartDate // Check if alert exists for this date
                );

                if (!existing) {
                    const child = this.getChildById(entry.childId);
                    alerts.push({
                        type: 'waitlist',
                        waitlistId: entry.id,
                        childId: entry.childId,
                        message: `Follow up with waitlisted family: ${child ? child.firstName + ' ' + child.lastName : 'Unknown'}`,
                        dueDate: entry.desiredStartDate,
                        read: false,
                        actionTaken: false
                    });
                }
            }
        });

        alerts.forEach(alert => this.addNotification(alert));
        return alerts;
    },

    // Generate waitlisted project alerts (for Waitlisted-type projects)
    checkWaitlistedProjectAlerts() {
        const projects = this.getProjects().filter(p => p.type === 'Waitlisted' && p.status === 'In Progress' && p.desiredStartDate);
        const alerts = [];

        projects.forEach(project => {
            const daysUntil = Utils.daysUntil(project.desiredStartDate);
            if (daysUntil <= 30 && daysUntil > 0) {
                const existing = this.getNotifications().find(n =>
                    n.projectId === project.id &&
                    n.type === 'waitlist-project' &&
                    n.dueDate === project.desiredStartDate
                );

                if (!existing) {
                    alerts.push({
                        type: 'waitlist-project',
                        projectId: project.id,
                        message: `Waitlisted family ${project.parentName || 'Unknown'} — desired start in ${daysUntil} days`,
                        dueDate: project.desiredStartDate,
                        read: false,
                        actionTaken: false
                    });
                }
            }
        });

        alerts.forEach(alert => this.addNotification(alert));
        return alerts;
    },

    // Auto-deactivate families when offboarding date passes
    checkOffboardingDates() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const offboardingEntries = this.getOnboarding().filter(o => o.type === 'Offboarding');

        offboardingEntries.forEach(entry => {
            const offDate = new Date(entry.date);
            offDate.setHours(0, 0, 0, 0);

            if (offDate > today) return; // Not yet past

            const parent = this.getParentById(entry.parentId);
            if (!parent || parent.status === 'Inactive') return; // Already processed

            // 1. Set the parent to Inactive
            this.updateParent(parent.id, { status: 'Inactive' });

            // 2. Find all children connected to this parent
            const children = this.getChildrenByParent(parent.id);
            children.forEach(child => {
                if (child.status === 'Inactive') return;

                // Set child to Inactive
                this.updateChild(child.id, { status: 'Inactive' });

                // 3. Find other parents connected to this child and set them Inactive
                if (child.parentIds && child.parentIds.length > 0) {
                    child.parentIds.forEach(pid => {
                        if (pid === parent.id) return; // Skip the original parent
                        const otherParent = this.getParentById(pid);
                        if (otherParent && otherParent.status !== 'Inactive') {
                            this.updateParent(pid, { status: 'Inactive' });
                        }
                    });
                }
            });
        });
    },

    // Agenda Operations
    getAgenda() {
        return this._get(this.STORAGE_KEYS.AGENDA).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    addAgendaItem(item) {
        return this._add(this.STORAGE_KEYS.AGENDA, item);
    },

    updateAgendaItem(id, updates) {
        return this._update(this.STORAGE_KEYS.AGENDA, id, updates);
    },

    deleteAgendaItem(id) {
        return this._delete(this.STORAGE_KEYS.AGENDA, id);
    }
};

// Initialize data on load
Data.init();
