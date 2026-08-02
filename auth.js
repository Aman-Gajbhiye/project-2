// ============================================================
//  BookMyEvent — Frontend Auth Logic
// ============================================================
//
//  📚 WHAT THIS FILE DOES:
//
//  AUTHENTICATION = verifying WHO a user is.
//  AUTHORIZATION  = verifying WHAT they can do.
//
//  This file handles:
//  1. Login form → POST /api/login → save JWT token
//  2. Register form → POST /api/register → save JWT token
//  3. Token management (save/read/delete from localStorage)
//  4. Navbar updates (show Login vs User name + Logout)
//  5. Role-based UI (show organizer features only for organizers)
//  6. Protected page redirects (dashboard requires login)
//
//  📚 JWT TOKEN FLOW:
//  1. User logs in → server creates a JWT (encrypted string)
//  2. Frontend saves JWT in localStorage
//  3. Every API call includes: Authorization: Bearer <token>
//  4. Server decodes token to identify the user
//  5. Token expires after 7 days → user must log in again
//
// ============================================================


// ─── CONFIGURATION ──────────────────────────────────────────
const AUTH_API_BASE = '';  // Same origin


// ─── TOKEN MANAGEMENT ───────────────────────────────────────
// 📚 localStorage persists data even after browser is closed.
// It's a simple key-value store built into every browser.

function saveToken(token) {
  localStorage.setItem('bme_token', token);
}

function getToken() {
  return localStorage.getItem('bme_token');
}

function removeToken() {
  localStorage.removeItem('bme_token');
  localStorage.removeItem('bme_user');
}

function saveUser(user) {
  localStorage.setItem('bme_user', JSON.stringify(user));
}

function getUser() {
  const data = localStorage.getItem('bme_user');
  return data ? JSON.parse(data) : null;
}

function isLoggedIn() {
  return !!getToken();
}


// ─── LOGOUT ─────────────────────────────────────────────────
function logout() {
  removeToken();
  window.location.href = 'login.html';
}


// ─── REGISTER FORM HANDLER ─────────────────────────────────
const registerForm = document.getElementById('registerForm');

if (registerForm) {
  registerForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const role = document.getElementById('regRole').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    const errorEl = document.getElementById('authError');
    const successEl = document.getElementById('authSuccess');
    const submitBtn = registerForm.querySelector('button[type="submit"]');

    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    // Client-side validation
    if (!name || !email || !password || !confirmPassword) {
      errorEl.textContent = 'Please fill in all fields.';
      errorEl.style.display = 'block';
      return;
    }

    if (password.length < 6) {
      errorEl.textContent = 'Password must be at least 6 characters.';
      errorEl.style.display = 'block';
      return;
    }

    if (password !== confirmPassword) {
      errorEl.textContent = 'Passwords do not match.';
      errorEl.style.display = 'block';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';

    try {
      const response = await fetch(AUTH_API_BASE + '/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await response.json();

      if (data.success) {
        saveToken(data.token);
        saveUser(data.user);

        successEl.textContent = '🎉 Account created! Redirecting...';
        successEl.style.display = 'block';

        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
      } else {
        errorEl.textContent = data.message;
        errorEl.style.display = 'block';
      }

    } catch (error) {
      console.error('Register error:', error);
      errorEl.textContent = 'Could not connect to server. Make sure it\'s running.';
      errorEl.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
    }
  });
}


// ─── LOGIN FORM HANDLER ────────────────────────────────────
const loginForm = document.getElementById('loginForm');

if (loginForm) {
  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    const errorEl = document.getElementById('authError');
    const successEl = document.getElementById('authSuccess');
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    if (!email || !password) {
      errorEl.textContent = 'Please enter your email and password.';
      errorEl.style.display = 'block';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing In...';

    try {
      const response = await fetch(AUTH_API_BASE + '/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        saveToken(data.token);
        saveUser(data.user);

        successEl.textContent = '✅ Login successful! Redirecting...';
        successEl.style.display = 'block';

        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
      } else {
        errorEl.textContent = data.message;
        errorEl.style.display = 'block';
      }

    } catch (error) {
      console.error('Login error:', error);
      errorEl.textContent = 'Could not connect to server. Make sure it\'s running.';
      errorEl.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  });
}


// ─── UPDATE NAVBAR BASED ON AUTH STATE ──────────────────────
// 📚 This runs on EVERY page to show the correct navigation.
// If logged in → show user name + Logout button
// If not logged in → show Login + Register buttons

function updateNavbar() {
  const navButtons = document.querySelector('.nav-buttons');
  const mobileMenu = document.getElementById('mobileMenu');

  if (!navButtons) return;

  if (isLoggedIn()) {
    const user = getUser();
    const firstName = user ? user.name.split(' ')[0] : 'User';
    const role = user ? user.role : 'attendee';

    // Desktop nav — show user name and role-specific links
    navButtons.innerHTML = `
      <a href="dashboard.html" class="btn-login">👤 ${firstName}</a>
      ${role === 'organizer' ? '<a href="create-event.html" class="btn-login">+ Create Event</a>' : ''}
      <a href="#" class="btn-signup" id="logoutBtn">Logout</a>
    `;

    // Mobile nav — add role-specific links
    if (mobileMenu) {
      const existingLogout = mobileMenu.querySelector('.mobile-logout');
      if (!existingLogout) {
        if (role === 'organizer') {
          const createLink = document.createElement('a');
          createLink.href = 'create-event.html';
          createLink.textContent = '📝 Create Event';
          mobileMenu.appendChild(createLink);

          const checkinLink = document.createElement('a');
          checkinLink.href = 'checkin.html';
          checkinLink.textContent = '📷 Check-in';
          mobileMenu.appendChild(checkinLink);
        }

        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.className = 'mobile-logout';
        logoutLink.textContent = '🚪 Logout';
        logoutLink.addEventListener('click', function (e) {
          e.preventDefault();
          logout();
        });
        mobileMenu.appendChild(logoutLink);
      }
    }

    // Attach logout handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function (e) {
        e.preventDefault();
        logout();
      });
    }

  } else {
    navButtons.innerHTML = `
      <a href="login.html" class="btn-login">Login</a>
      <a href="register.html" class="btn-signup">Register</a>
    `;
  }
}


// ─── PROTECT PAGES ──────────────────────────────────────────
// 📚 Some pages require login. If user isn't logged in,
// redirect them to the login page.

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}


// ─── REDIRECT IF ALREADY LOGGED IN ─────────────────────────
function redirectIfLoggedIn() {
  if (isLoggedIn()) {
    window.location.href = 'dashboard.html';
  }
}


// ─── LOAD USER PROFILE ─────────────────────────────────────
async function loadProfile() {
  const token = getToken();
  if (!token) return;

  try {
    const response = await fetch(AUTH_API_BASE + '/api/profile', {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    const data = await response.json();

    if (data.success) {
      // Update user data in localStorage
      saveUser({
        id: data.user._id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role
      });
    } else if (response.status === 401) {
      removeToken();
      window.location.href = 'login.html';
    }
  } catch (error) {
    console.error('Profile load error:', error);
  }
}


// ─── AUTO-SEED DATA ─────────────────────────────────────────
// 📚 When the app first loads, check if there are events.
// If not, seed sample data so the app has something to show.
async function autoSeed() {
  try {
    const res = await fetch('/api/events?status=active');
    const data = await res.json();
    if (data.success && data.events.length === 0) {
      // No events, try to seed
      await fetch('/api/seed', { method: 'POST' });
      // Reload to show new events
      if (document.getElementById('eventsGrid')) {
        window.location.reload();
      }
    }
  } catch (e) {
    // Server not running, ignore
  }
}


// ─── INIT ───────────────────────────────────────────────────
// 📚 DOMContentLoaded fires when the HTML is fully parsed.
// This is the ENTRY POINT — all initialization happens here.

document.addEventListener('DOMContentLoaded', function () {
  updateNavbar();

  // Login/Register pages: redirect if already logged in
  if (document.getElementById('loginForm') || document.getElementById('registerForm')) {
    redirectIfLoggedIn();
  }

  // Dashboard: require auth + load profile
  if (document.querySelector('.dashboard-section')) {
    if (requireAuth()) {
      loadProfile();
    }
  }

  // Booking page: require auth
  if (document.querySelector('.booking-section')) {
    requireAuth();
  }

  // Create event page: require auth
  if (document.getElementById('createEventForm')) {
    requireAuth();
  }

  // Auto-seed data
  autoSeed();
});
