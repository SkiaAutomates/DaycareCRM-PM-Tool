
const SUPABASE_URL = 'https://ehlaiimcjeyamhgfjudd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_aVOHN112ofbEt6SPtEcEbg_QY5SIqhi';

async function testAuth() {
    console.log("Testing Supabase Auth endpoint...");
    try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test_auth_check@meaningfulbeginnings.org',
                password: 'password123'
            })
        });

        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

testAuth();
