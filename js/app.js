window.AuraCare = window.AuraCare || {};

AuraCare.App = (function() {
  // Routes mapping hash to View Renderers
  const ROUTES = {
    '#dashboard': AuraCare.Views.Dashboard,
    '#patients': AuraCare.Views.Patients,
    '#staff': AuraCare.Views.Staff,
    '#resources': AuraCare.Views.Resources,
    '#appointments': AuraCare.Views.Appointments,
    '#billing': AuraCare.Views.Billing
  };

  let currentHash = '#dashboard';

  function init() {
    // 1. Initialize local storage seed data
    AuraCare.Store.init();

    // 2. Setup route change listener
    window.addEventListener('hashchange', handleRouteChange);

    // 3. Setup authentication gateway checks
    checkAuth();

    // 4. Setup global layout events (Sidebar triggers, mobile overlay toggles, logouts, drawer toggles)
    setupGlobalEvents();

    // 5. Reactive Store subscriptions
    AuraCare.Store.subscribe('all', () => {
      if (isLoggedIn()) {
        renderActiveView();
        updateGlobalPanels();
      }
    });
  }

  function isLoggedIn() {
    return sessionStorage.getItem('auracare_active_user') !== null;
  }

  function checkAuth() {
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');

    if (isLoggedIn()) {
      authContainer.classList.add('hidden');
      appContainer.classList.remove('hidden');
      
      // Update user details in sidebar
      updateSidebarUserData();
      
      // Load current route
      handleRouteChange();
      
      // Draw global telemetry sidebars
      updateGlobalPanels();
    } else {
      authContainer.classList.remove('hidden');
      appContainer.classList.add('hidden');
      
      window.location.hash = '#dashboard';
      
      // Wire auth forms
      setupAuthForms();
    }
  }

  function updateSidebarUserData() {
    const userJson = sessionStorage.getItem('auracare_active_user');
    if (!userJson) return;

    const user = JSON.parse(userJson);
    const nameEl = document.getElementById('sidebar-user-name');
    const avatarEl = document.getElementById('sidebar-avatar');

    if (nameEl) nameEl.textContent = user.name;
    
    if (avatarEl) {
      const names = user.name.trim().split(' ');
      let initials = 'ST';
      if (names.length >= 2) {
        if (names[0].toLowerCase().includes('dr') && names.length > 2) {
          initials = (names[1].substring(0, 1) + names[2].substring(0, 1)).toUpperCase();
        } else {
          initials = (names[0].substring(0, 1) + names[1].substring(0, 1)).toUpperCase();
        }
      } else if (names.length === 1) {
        initials = names[0].substring(0, 2).toUpperCase();
      }
      avatarEl.textContent = initials;
    }
  }

  function clearErrors() {
    document.querySelectorAll('.error-text').forEach(el => {
      el.textContent = '';
      el.classList.add('hidden');
    });
  }

  function showFieldError(elementId, msg) {
    const el = document.getElementById(elementId);
    if (el) {
      el.textContent = msg;
      el.classList.remove('hidden');
    }
  }

  function setupAuthForms() {
    const loginSection = document.getElementById('login-form-section');
    const registerSection = document.getElementById('register-form-section');
    const toggleToReg = document.getElementById('toggle-to-register');
    const toggleToLogin = document.getElementById('toggle-to-login');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // Toggles
    toggleToReg.onclick = () => {
      loginSection.classList.add('hidden');
      registerSection.classList.remove('hidden');
      clearErrors();
      registerForm.reset();
    };

    toggleToLogin.onclick = () => {
      registerSection.classList.add('hidden');
      loginSection.classList.remove('hidden');
      clearErrors();
      loginForm.reset();
    };

    // Registration Form Validation & Submit
    registerForm.onsubmit = (e) => {
      e.preventDefault();
      clearErrors();

      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim().toLowerCase();
      const phone = document.getElementById('reg-phone').value.trim();
      const password = document.getElementById('reg-password').value;

      let hasError = false;

      // 1. Name Check
      if (!name) {
        showFieldError('err-reg-name', 'Full professional name is required.');
        hasError = true;
      }

      // 2. Email Check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        showFieldError('err-reg-email', 'Please enter a valid email address.');
        hasError = true;
      }

      // 3. Phone Check (exactly 10 digits)
      if (!phone) {
        showFieldError('err-reg-phone', 'Pager/phone line is required.');
        hasError = true;
      } else if (!/^[0-9]{10}$/.test(phone)) {
        showFieldError('err-reg-phone', 'Phone number must be exactly 10 digits.');
        hasError = true;
      }

      // 4. Password Checks
      if (!password) {
        showFieldError('err-reg-password', 'Password is required.');
        hasError = true;
      } else {
        let pwError = '';
        if (password.length < 6) {
          pwError = 'Password must be at least 6 characters. ';
        }
        if (!/[A-Z]/.test(password)) {
          pwError += 'Must contain at least 1 uppercase letter. ';
        }
        if (!/[0-9]/.test(password)) {
          pwError += 'Must contain at least 1 numerical digit. ';
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
          pwError += 'Must contain at least 1 special character.';
        }

        if (pwError) {
          showFieldError('err-reg-password', pwError);
          hasError = true;
        }
      }

      if (hasError) return;

      // Check duplicates
      const users = JSON.parse(localStorage.getItem('auracare_users')) || [];
      if (users.some(u => u.email === email)) {
        showFieldError('err-reg-email', 'This email is already registered.');
        return;
      }

      // Save user
      const newUser = { name, email, phone, password };
      users.push(newUser);
      localStorage.setItem('auracare_users', JSON.stringify(users));

      // Auto login
      sessionStorage.setItem('auracare_active_user', JSON.stringify(newUser));
      AuraCare.Toasts.success('Profile created and logged in.');

      checkAuth();
    };

    // Login Form Validation & Submit
    loginForm.onsubmit = (e) => {
      e.preventDefault();
      clearErrors();

      const email = document.getElementById('login-email').value.trim().toLowerCase();
      const password = document.getElementById('login-password').value;

      let hasError = false;

      // 1. Email check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        showFieldError('err-login-email', 'Please enter a valid email address.');
        hasError = true;
      }

      // 2. Password check
      if (!password) {
        showFieldError('err-login-password', 'Password is required.');
        hasError = true;
      }

      if (hasError) return;

      // Check match in database
      const users = JSON.parse(localStorage.getItem('auracare_users')) || [];
      
      // Auto seed default credentials if localDB is empty
      if (users.length === 0) {
        const seedUser = {
          name: 'Dr. Daniel Ross',
          email: 'd.ross@hospital.org',
          phone: '5550199000',
          password: 'Password1!'
        };
        users.push(seedUser);
        localStorage.setItem('auracare_users', JSON.stringify(users));
      }

      const matchUser = users.find(u => u.email === email && u.password === password);

      if (matchUser) {
        sessionStorage.setItem('auracare_active_user', JSON.stringify(matchUser));
        AuraCare.Toasts.success(`Logged in as ${matchUser.name}`);
        checkAuth();
      } else {
        showFieldError('err-login-password', 'Invalid clinical credentials.');
      }
    };
  }

  function handleRouteChange() {
    if (!isLoggedIn()) return;

    let hash = window.location.hash || '#dashboard';
    
    if (!ROUTES[hash]) {
      window.location.hash = '#dashboard';
      return;
    }

    currentHash = hash;

    // Update active nav class
    updateSidebarNav();

    // Close mobile menu
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) sidebar.classList.remove('open');

    // Close alerts drawer on route change
    const alertsDrawer = document.getElementById('alerts-drawer');
    const alertsOverlay = document.getElementById('alerts-drawer-overlay');
    if (alertsDrawer) alertsDrawer.classList.remove('open');
    if (alertsOverlay) alertsOverlay.classList.remove('open');

    AuraCare.Modal.close();

    // Render active workspace in center
    renderActiveView();
  }

  function renderActiveView() {
    const view = ROUTES[currentHash];
    if (view && typeof view.render === 'function') {
      try {
        view.render();
      } catch (e) {
        console.error(`Error rendering view ${currentHash}:`, e);
        document.getElementById('app-viewport').innerHTML = `
          <div class="card" style="border: 1px solid var(--danger);">
            <h4 class="text-danger">Clinical Console Render Error</h4>
            <p style="font-size:0.8rem; margin-top:4px; color:var(--text-secondary);">There was an issue loading the viewport. Please reload the console.</p>
          </div>
        `;
      }
    }
  }

  function updateSidebarNav() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      const href = item.getAttribute('href');
      if (href === currentHash) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  function updateGlobalPanels() {
    // Fetch logs
    const alerts = AuraCare.Store.getSystemLogs();
    
    // 1. Redraw Slide-out Alerts Drawer Feed
    const globalAlertsFeed = document.getElementById('global-alerts-feed');
    if (globalAlertsFeed) {
      if (alerts.length === 0) {
        globalAlertsFeed.innerHTML = `
          <div class="flex-center" style="height:160px; color:var(--text-muted); flex-direction:column; text-align:center; font-size:0.75rem;">
            <i data-lucide="shield-check" style="width:24px; height:24px; margin-bottom:6px; color:var(--success);"></i>
            <span>No alerts pending.</span>
          </div>
        `;
      } else {
        globalAlertsFeed.innerHTML = alerts.map(log => {
          let indicatorClass = 'bg-info-glow';
          let iconColor = 'var(--primary)';
          if (log.type === 'warning') {
            indicatorClass = 'bg-warning-glow';
            iconColor = 'var(--warning)';
          } else if (log.type === 'critical') {
            indicatorClass = 'bg-danger-glow';
            iconColor = 'var(--danger)';
          }

          return `
            <div class="alert-item" style="padding: 10px 12px; border-radius: 6px; margin-bottom: 6px;">
              <span class="alert-indicator ${indicatorClass}" style="background-color:${iconColor}; margin-top:4px;"></span>
              <div class="alert-content">
                <div style="font-weight:600; color:var(--text-primary); font-size:0.75rem; line-height:1.25;">${log.text}</div>
                <div class="alert-time" style="font-size:0.65rem; color:var(--text-muted); margin-top:2px;">${log.date.substring(11, 16)}</div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // 2. Redraw Right Panel Telemetry
    const beds = AuraCare.Store.getBeds();
    const occupied = beds.filter(b => b.status !== 'available').length;
    const totalBeds = beds.length;
    const occupancyRate = totalBeds > 0 ? Math.round((occupied / totalBeds) * 100) : 0;
    
    AuraCare.Charts.renderGauge('telemetry-beds-gauge', occupancyRate, {
      color: occupancyRate > 80 ? 'var(--danger)' : 'var(--primary)',
      labelText: 'Occupied'
    });

    // 3. Redraw Right Panel Low Stocks Alerts
    const inventory = AuraCare.Store.getInventory();
    const lowStockAlertsEl = document.getElementById('telemetry-stock-alerts');
    if (lowStockAlertsEl) {
      const lowStockItems = inventory.filter(item => item.stock < item.minStock);
      
      if (lowStockItems.length === 0) {
        lowStockAlertsEl.innerHTML = `
          <div class="flex-center" style="height:100%; color:var(--text-muted); text-align:center; font-size:0.75rem; padding: 20px 0;">
            <span>Stock levels normal.</span>
          </div>
        `;
      } else {
        lowStockAlertsEl.innerHTML = lowStockItems.map(item => `
          <div style="display:flex; justify-content:space-between; align-items:center; background-color:var(--danger-glow); border:1px solid hsla(354, 85%, 56%, 0.15); border-radius:var(--radius-md); padding:8px 12px; font-size:0.75rem; margin-bottom:6px;">
            <div>
              <span style="font-weight:600; color:var(--text-primary); display:block; line-height:1.2;">${item.name}</span>
              <span style="font-size:0.65rem; color:var(--text-muted);">Min: ${item.minStock} ${item.unit}</span>
            </div>
            <strong class="text-danger" style="font-family:monospace; margin-left:4px;">${item.stock}</strong>
          </div>
        `).join('');
      }
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function setupGlobalEvents() {
    // 1. Mobile off-canvas menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('app-sidebar');
    if (menuToggle && sidebar) {
      menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('open');
      });

      // Close sidebar if clicking outside
      document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && e.target !== menuToggle) {
          sidebar.classList.remove('open');
        }
      });
    }

    // Close sidebar when clicking links
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        if (sidebar) sidebar.classList.remove('open');
      });
    });

    // 2. Operations Alerts Slide-out Drawer Toggle
    const alertsToggle = document.getElementById('btn-alerts-toggle');
    const alertsDrawer = document.getElementById('alerts-drawer');
    const alertsOverlay = document.getElementById('alerts-drawer-overlay');
    const alertsClose = document.getElementById('btn-alerts-close');

    if (alertsToggle && alertsDrawer && alertsOverlay && alertsClose) {
      const openDrawer = (e) => {
        e.stopPropagation();
        alertsDrawer.classList.add('open');
        alertsOverlay.classList.add('open');
      };
      
      const closeDrawer = () => {
        alertsDrawer.classList.remove('open');
        alertsOverlay.classList.remove('open');
      };

      alertsToggle.addEventListener('click', openDrawer);
      alertsClose.addEventListener('click', closeDrawer);
      alertsOverlay.addEventListener('click', closeDrawer);

      // Close drawer if clicking outside
      document.addEventListener('click', (e) => {
        if (!alertsDrawer.contains(e.target) && e.target !== alertsToggle) {
          closeDrawer();
        }
      });
    }

    // 3. Logout trigger (Sidebar Badge footer)
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to securely logout from the operations console?')) {
          sessionStorage.removeItem('auracare_active_user');
          AuraCare.Toasts.warning('Securely logged out.');
          checkAuth();
        }
      });
    }

    // 4. Global Header Search delegation
    const globalSearch = document.getElementById('global-search-input');
    if (globalSearch) {
      globalSearch.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        if (currentHash === '#patients') {
          AuraCare.Views.Patients.currentSearch = query;
          AuraCare.Views.Patients.renderPatientRows();
          
          const viewSearchInput = document.getElementById('patient-search-input');
          if (viewSearchInput) viewSearchInput.value = query;
        }
      });
    }
  }

  return {
    init: init
  };
})();

// Launch SPA application
document.addEventListener('DOMContentLoaded', () => {
  AuraCare.App.init();
});
