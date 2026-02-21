/**
 * Day Care CRM - Authentication Module
 * Restricts access to @yourdomain.com domain
 */

const ALLOWED_EMAIL = 'ggskiawp@gmail.com';

const Auth = {
    currentUser: null,

    // Check if user is authenticated
    isAuthenticated() {
        // Handle checkout success message
        if (window.location.search.includes('checkout=success')) {
            setTimeout(() => {
                Utils.showToast('Checkout successful! Your subscription is being processed.', 'success');
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }, 1000);
        }

        const session = localStorage.getItem('dc_session');
        if (session) {
            try {
                const parsed = JSON.parse(session);
                // Check if session is still valid (24 hour expiry)
                if (parsed.expiresAt && new Date(parsed.expiresAt) > new Date()) {
                    this.currentUser = parsed.user;

                    // --- TRIAL ORG CHECK --- //
                    if (this.currentUser && this.currentUser.organizationId && this.currentUser.role !== 'Temporary Access') {
                        if (this.currentUser.subscriptionStatus !== 'active' && this.currentUser.orgCreatedAt) {
                            const created = new Date(this.currentUser.orgCreatedAt);
                            const now = new Date();
                            const diffHours = (now - created) / (1000 * 60 * 60);

                            if (diffHours >= 120) {
                                // 5 days (120 hours) expired
                                this.showTrialExpiredScreen();
                                return false; // Block access to main app
                            }
                        }
                    }
                    // --- END TRIAL ORG CHECK --- //

                    return true;
                }
            } catch (e) {
                console.error('Invalid session:', e);
            }
        }
        return false;
    },

    // Validate email
    isAllowedEmail(email) {
        if (email.toLowerCase() === ALLOWED_EMAIL.toLowerCase()) return true;

        // Check managed users
        const users = JSON.parse(localStorage.getItem('dc_users') || '[]');
        return users.some(u => u.email.toLowerCase() === email.toLowerCase());
    },

    // Check if current user is Admin or Director
    isAdmin() {
        if (!this.currentUser) return false;
        return this.currentUser.role === 'Admin' || this.currentUser.role === 'Director' || this.currentUser.role === 'owner';
    },

    // Sign in with Supabase
    async signIn(email, password) {
        try {
            const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error_description || data.msg || 'Sign in failed');
            }

            // Fetch Organization details
            const orgResponse = await fetch(`${SUPABASE_URL}/rest/v1/organization_members?user_id=eq.${data.user.id}&select=*,organizations(*)`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${data.access_token}`
                }
            });
            const orgs = await orgResponse.json();

            let organizationId = null;
            let role = 'Admin'; // Default fallback
            let orgName = 'My Day Care';
            let orgCreatedAt = null;
            let subStatus = null;

            if (orgs && orgs.length > 0) {
                organizationId = orgs[0].organization_id;
                role = orgs[0].role;
                orgName = orgs[0].organizations.name;
                orgCreatedAt = orgs[0].organizations.created_at;

                // Fetch Subscription
                try {
                    const subRes = await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?organization_id=eq.${organizationId}&select=*`, {
                        headers: {
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${data.access_token}`
                        }
                    });
                    const subs = await subRes.json();
                    if (subs && subs.length > 0) {
                        subStatus = subs[0].status;
                    }
                } catch (e) { console.error("Error fetching sub:", e); }
            }

            const session = {
                user: {
                    email: data.user.email,
                    id: data.user.id,
                    role: role,
                    name: data.user.user_metadata?.full_name || email.split('@')[0],
                    organizationId: organizationId,
                    orgName: orgName,
                    orgCreatedAt: orgCreatedAt,
                    subscriptionStatus: subStatus
                },
                accessToken: data.access_token,
                expiresAt: new Date(Date.now() + (data.expires_in || 86400) * 1000).toISOString()
            };

            localStorage.setItem('dc_session', JSON.stringify(session));
            this.currentUser = session.user;

            return session.user;
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    },

    // Sign up with Supabase
    async signUp(email, password, fullName = '') {
        try {
            const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                    data: { full_name: fullName }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error_description || data.msg || 'Sign up failed');
            }

            return { success: true, message: 'Account created! Please check your email for a verification link, then sign in.' };
        } catch (error) {
            console.error('Sign up error:', error);
            throw error;
        }
    },

    // Sign out
    signOut() {
        localStorage.removeItem('dc_session');
        this.currentUser = null;
        window.location.reload();
    },

    // Get current user
    getUser() {
        return this.currentUser;
    },

    // Show login UI
    showLoginScreen() {
        document.body.innerHTML = `
            <div class="login-container">
                <div class="login-card">
                    <div class="login-logo" style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                        <img src="Daycare Logo.png" alt="Logo" class="logo-image-large" style="width: 80px; height: 80px; object-fit: cover; border-radius: 50%;">
                        <h1 style="font-family: 'Quicksand', sans-serif; font-weight: 700; color: var(--primary-700); margin: 0; font-size: 1.8rem;">Day Care Operation</h1>
                        <p class="login-subtitle" style="font-family: 'Quicksand', sans-serif; font-weight: 500; font-size: 1.2rem; color: var(--neutral-600); margin-top: 0;">CRM & Account Management Portal</p>
                    </div>
                    
                    <form id="loginForm" class="login-form">
                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input type="email" class="form-input" id="loginEmail" 
                                   placeholder="ggskiawp@gmail.com" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Password</label>
                            <input type="password" class="form-input" id="loginPassword" 
                                   placeholder="Enter your password" required minlength="6">
                        </div>
                        <div id="loginError" class="login-error"></div>
                        <button type="submit" class="btn btn-primary btn-block" id="loginBtn">
                            Sign In
                        </button>
                    </form>

                    <div class="login-divider">
                        <span>New user?</span>
                    </div>

                    <button class="btn btn-secondary btn-block" id="showSignupBtn">
                        Create Account
                    </button>

                    <p class="login-notice">
                        🔒 Authorized personnel only
                    </p>
                </div>
            </div>
        `;

        // Add login form handler
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const errorDiv = document.getElementById('loginError');
            const btn = document.getElementById('loginBtn');

            try {
                btn.disabled = true;
                btn.textContent = 'Signing in...';
                errorDiv.textContent = '';

                await Auth.signIn(email, password);

                // If user has no organization, show setup
                if (!Auth.currentUser.organizationId) {
                    Auth.showOrgSetupScreen();
                } else {
                    window.location.reload();
                }
            } catch (error) {
                errorDiv.textContent = error.message;
                btn.disabled = false;
                btn.textContent = 'Sign In';
            }
        });

        // Add signup button handler
        document.getElementById('showSignupBtn').addEventListener('click', () => {
            Auth.showSignupScreen();
        });
    },

    // Show signup UI
    showSignupScreen() {
        document.body.innerHTML = `
            <div class="login-container">
                <div class="login-card">
                    <div class="login-logo" style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                        <img src="Daycare Logo.png" alt="Logo" class="logo-image-large" style="width: 80px; height: 80px; object-fit: cover; border-radius: 50%;">
                        <h1 style="font-family: 'Quicksand', sans-serif; font-weight: 700; color: var(--primary-700); margin: 0; font-size: 1.8rem;">Create Account</h1>
                        <p class="login-subtitle" style="font-family: 'Quicksand', sans-serif; font-weight: 500; font-size: 1.2rem; color: var(--neutral-600); margin-top: 0;">Day Care Operation CRM</p>
                    </div>
                    
                    <form id="signupForm" class="login-form">
                        <div class="form-group">
                            <label class="form-label">Full Name</label>
                            <input type="text" class="form-input" id="signupName" 
                                   placeholder="Your Name" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input type="email" class="form-input" id="signupEmail" 
                                   placeholder="email@example.com" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Password</label>
                            <input type="password" class="form-input" id="signupPassword" 
                                   placeholder="At least 6 characters" required minlength="6">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Confirm Password</label>
                            <input type="password" class="form-input" id="signupPasswordConfirm" 
                                   placeholder="Confirm password" required minlength="6">
                        </div>
                        <div id="signupError" class="login-error"></div>
                        <div id="signupSuccess" class="login-success"></div>
                        <button type="submit" class="btn btn-primary btn-block" id="signupBtn">
                            Create Account
                        </button>
                    </form>

                    <div class="login-divider">
                        <span>Already have an account?</span>
                    </div>

                    <button class="btn btn-secondary btn-block" id="showLoginBtn">
                        Sign In
                    </button>

                    <p class="login-notice">
                        🔒 Authorized personnel only
                    </p>
                </div>
            </div>
        `;

        // Add signup form handler
        document.getElementById('signupForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
            const errorDiv = document.getElementById('signupError');
            const successDiv = document.getElementById('signupSuccess');
            const btn = document.getElementById('signupBtn');

            errorDiv.textContent = '';
            successDiv.textContent = '';

            if (password !== passwordConfirm) {
                errorDiv.textContent = 'Passwords do not match';
                return;
            }

            try {
                btn.disabled = true;
                btn.textContent = 'Creating account...';

                const fullName = document.getElementById('signupName').value;
                const result = await Auth.signUp(email, password, fullName);
                successDiv.textContent = result.message;
                btn.textContent = 'Account Created';

                // Auto-switch to login after 2 seconds
                setTimeout(() => Auth.showLoginScreen(), 2000);
            } catch (error) {
                errorDiv.textContent = error.message;
                btn.disabled = false;
                btn.textContent = 'Create Account';
            }
        });

        // Add back to login button handler
        document.getElementById('showLoginBtn').addEventListener('click', () => {
            Auth.showLoginScreen();
        });
    },

    // Show Organization Setup UI
    showOrgSetupScreen() {
        document.body.innerHTML = `
            <div class="login-container">
                <div class="login-card">
                    <div class="login-logo" style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                        <img src="Daycare Logo.png" alt="Logo" class="logo-image-large" style="width: 80px; height: 80px; object-fit: cover; border-radius: 50%;">
                        <h1 style="font-family: 'Quicksand', sans-serif; font-weight: 700; color: var(--primary-700); margin: 0; font-size: 1.8rem;">Setup Your Day Care</h1>
                        <p class="login-subtitle" style="font-family: 'Quicksand', sans-serif; font-weight: 500; font-size: 1.1rem; color: var(--neutral-600); margin-top: 0;">Tell us about your organization</p>
                    </div>
                    
                    <form id="orgForm" class="login-form">
                        <div class="form-group">
                            <label class="form-label">Organization Name</label>
                            <input type="text" class="form-input" id="orgName" 
                                   placeholder="e.g. Sunshine Academy" required>
                        </div>
                        <div id="orgError" class="login-error"></div>
                        <button type="submit" class="btn btn-primary btn-block" id="orgBtn">
                            Finish Setup
                        </button>
                    </form>
                    
                    <div class="login-divider">
                        <span>Or</span>
                    </div>

                    <button class="btn btn-secondary btn-block" id="logoutFromSetupBtn">
                        Log Out
                    </button>

                    <p class="login-notice">
                        🔒 Secure global access enabled
                    </p>
                </div>
            </div>
        `;

        // Org Form Handler
        document.getElementById('orgForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('orgName').value;
            const btn = document.getElementById('orgBtn');
            const errorDiv = document.getElementById('orgError');

            try {
                btn.disabled = true;
                btn.textContent = 'Creating organization...';

                // 1. Create Organization
                const org = await Supabase.insert('organizations', {
                    name: name,
                    owner_id: this.currentUser.id
                });

                if (!org) throw new Error("Failed to create organization");

                // 2. Add User as Owner
                await Supabase.insert('organization_members', {
                    organization_id: org.id,
                    user_id: this.currentUser.id,
                    role: 'owner'
                });

                // Update session
                const session = JSON.parse(localStorage.getItem('dc_session'));
                session.user.organizationId = org.id;
                session.user.orgName = org.name;
                session.user.role = 'owner';
                session.user.orgCreatedAt = org.created_at || new Date().toISOString();
                localStorage.setItem('dc_session', JSON.stringify(session));

                this.currentUser = session.user;

                // Done!
                window.location.reload();
            } catch (error) {
                errorDiv.textContent = error.message;
                btn.disabled = false;
                btn.textContent = 'Finish Setup';
            }
        });

        // Logout from setup handler
        document.getElementById('logoutFromSetupBtn').addEventListener('click', () => {
            this.signOut();
        });
    },

    // Show Trial Expired UI
    showTrialExpiredScreen() {
        document.body.innerHTML = `
            <div class="login-container">
                <div class="login-card" style="max-width: 500px; text-align: center;">
                    <div class="login-logo" style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                        <div style="font-size: 4rem; color: #ef4444; margin-bottom: 10px;">
                            <i class="fas fa-lock"></i>
                        </div>
                        <h1 style="font-family: 'Quicksand', sans-serif; font-weight: 800; color: var(--text-dark); margin: 0; font-size: 2rem;">Trial Expired</h1>
                        <p style="font-family: 'Nunito', sans-serif; font-size: 1.1rem; color: var(--text-mid); margin-top: 10px; line-height: 1.6;">
                            Your 5-day free trial for <strong>${this.currentUser.orgName || 'your organization'}</strong> has ended. We hope you enjoyed exploring the Day Care CRM platform!
                        </p>
                        <p style="font-family: 'Nunito', sans-serif; font-size: 1rem; color: var(--text-mid); margin-top: 5px;">
                            To regain complete access to your data, locations, and tools, please select a subscription plan.
                        </p>
                    </div>
                    
                    <div style="margin-top: 30px; display: flex; flex-direction: column; gap: 12px;">
                        <button onclick="window.location.href='pricing.html'" class="btn btn-primary btn-block" style="padding: 14px; font-size: 1.1rem;">
                            View Pricing & Subscribe
                        </button>
                        <button onclick="Auth.signOut()" class="btn btn-secondary btn-block">
                            Log Out
                        </button>
                    </div>

                    <p class="login-notice" style="margin-top: 20px;">
                        🔒 All your data is safely saved and will be restored instantly upon subscription.
                    </p>
                </div>
            </div>
        `;
    }
};
