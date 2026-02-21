/**
 * Day Care CRM - Supabase Client
 * Database integration for persistent storage
 */

const SUPABASE_URL = 'https://ehlaiimcjeyamhgfjudd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_aVOHN112ofbEt6SPtEcEbg_QY5SIqhi';

// Supabase client using REST API (no npm dependencies needed)
const Supabase = {
    // Dynamic headers to include Auth token
    getHeaders() {
        const session = JSON.parse(localStorage.getItem('dc_session') || '{}');
        const token = session.accessToken || SUPABASE_ANON_KEY;

        return {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };
    },

    async request(table, method = 'GET', body = null, query = '') {
        const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
        const options = {
            method,
            headers: this.getHeaders()
        };
        // ... rest of the method
        if (body) {
            options.body = JSON.stringify(body);
        }
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const error = await response.text();
                console.error(`Supabase error (${table}):`, error);
                return null;
            }
            const text = await response.text();
            return text ? JSON.parse(text) : [];
        } catch (error) {
            console.error(`Supabase request failed:`, error);
            return null;
        }
    },

    // Generic CRUD operations
    async getAll(table) {
        return await this.request(table, 'GET', null, '?select=*');
    },

    async getById(table, id) {
        const result = await this.request(table, 'GET', null, `?id=eq.${id}`);
        return result && result.length > 0 ? result[0] : null;
    },

    async insert(table, data) {
        const result = await this.request(table, 'POST', data);
        return result && result.length > 0 ? result[0] : null;
    },

    async update(table, id, data) {
        const result = await this.request(table, 'PATCH', data, `?id=eq.${id}`);
        return result && result.length > 0 ? result[0] : null;
    },

    async delete(table, id) {
        return await this.request(table, 'DELETE', null, `?id=eq.${id}`);
    },

    async deleteAll(table) {
        return await this.request(table, 'DELETE', null, '?id=neq.00000000-0000-0000-0000-000000000000');
    },

    // Check if Supabase is available
    async isAvailable() {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
                method: 'HEAD',
                headers: { 'apikey': SUPABASE_ANON_KEY }
            });
            return response.ok;
        } catch {
            return false;
        }
    }
};
