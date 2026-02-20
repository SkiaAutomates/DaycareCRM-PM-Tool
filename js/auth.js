/**
 * Day Care CRM - Authentication Module
 * Restricts access to @yourdomain.com domain
 */

const ALLOWED_EMAIL = 'ggskiawp@gmail.com';

const Auth = {
    currentUser: null,

    // Check if user is authenticated
    isAuthenticated() {
        const session = localStorage.getItem('dc_session');
        if (session) {
            try {
                const parsed = JSON.parse(session);
                // Check if session is still valid (24 hour expiry)
                if (parsed.expiresAt && new Date(parsed.expiresAt) > new Date()) {
                    this.currentUser = parsed.user;
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
        // ggskiawp is always admin
        if (this.currentUser.email === ALLOWED_EMAIL) return true;

        return this.currentUser.role === 'Admin' || this.currentUser.role === 'Director';
    },

    // Sign in with Supabase
    async signIn(email, password) {
        // Validate email first
        if (!this.isAllowedEmail(email)) {
            throw new Error(`Access restricted to ${ALLOWED_EMAIL} only.`);
        }

        try {
            let isManaged = false;
            const users = JSON.parse(localStorage.getItem('dc_users') || '[]');
            const managedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

            // Default Supabase Auth for Main Admin
            let data = {};

            if (managedUser) {
                // Simulated login for managed users
                data = {
                    user: {
                        email: email,
                        id: managedUser.id
                    },
                    access_token: 'mock-token-' + Date.now(),
                    expires_in: 86400
                };
            } else {
                const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error_description || data.msg || 'Sign in failed');
                }
            }

            // Store session
            // Get Role
            let role = 'Admin';
            let name = 'Admin';
            let id = 'local-id';

            if (managedUser) {
                // EXPIRE CHECK FOR TEMPORARY ACCESS
                if (managedUser.role === 'Temporary Access' && managedUser.createdAt) {
                    const created = new Date(managedUser.createdAt);
                    const expires = new Date(created.getTime() + 120 * 60 * 60 * 1000); // 120 hours
                    if (new Date() > expires) {
                        throw new Error("Your temporary access has expired. Please contact us to subscribe.");
                    }
                }

                role = managedUser.role;
                name = managedUser.name;
                id = managedUser.id;
            } else {
                if (email.toLowerCase() === ALLOWED_EMAIL.toLowerCase()) {
                    role = 'Admin';
                    name = 'Admin';
                }
            }

            const session = {
                user: {
                    email: data.user.email || email,
                    id: data.user.id || id,
                    role: role,
                    name: name
                },
                accessToken: data.access_token || 'mock-token',
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
    async signUp(email, password) {
        // Validate email first
        if (!this.isAllowedEmail(email)) {
            throw new Error(`Access restricted to ${ALLOWED_EMAIL} only.`);
        }

        try {
            const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error_description || data.msg || 'Sign up failed');
            }

            return { success: true, message: 'Account created! You can now sign in.' };
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
                window.location.reload();
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
                            <label class="form-label">Email</label>
                            <input type="email" class="form-input" id="signupEmail" 
                                   placeholder="ggskiawp@gmail.com" required>
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

                const result = await Auth.signUp(email, password);
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
    }
};
