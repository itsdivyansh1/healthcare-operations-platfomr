const App = {
  init: function() {
    // 1. Initialize local storage seed data
    Store.init();

    // 2. Auth Session Check: Redirect to login if session is active check fails
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
      return;
    }

    // 3. Update user details in sidebar footer
    this.updateSidebarUserData();

    // 4. Setup global layout events (mobile sidebars, logouts, drawers)
    this.setupGlobalEvents();

    // 5. Update global panel values (gauges, low stock alarms, drawer logs)
    this.updateGlobalPanels();

    // 6. Reactive Store subscriptions to redraw sidebars
    Store.subscribe('all', () => {
      if (this.isLoggedIn()) {
        this.updateGlobalPanels();
      }
    });
  },

  isLoggedIn: function() {
    return sessionStorage.getItem('opscare_active_user') !== null;
  },

  updateSidebarUserData: function() {
    const userJson = sessionStorage.getItem('opscare_active_user');
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
  },

  updateGlobalPanels: function() {
    const alerts = Store.getSystemLogs();
    
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

    // 2. Redraw Right Panel Telemetry Beds Gauge
    const beds = Store.getBeds();
    const occupied = beds.filter(b => b.status !== 'available').length;
    const totalBeds = beds.length;
    const occupancyRate = totalBeds > 0 ? Math.round((occupied / totalBeds) * 100) : 0;
    
    const gaugeEl = document.getElementById('telemetry-beds-gauge');
    if (gaugeEl && typeof Charts !== 'undefined') {
      Charts.renderGauge('telemetry-beds-gauge', occupancyRate, {
        color: occupancyRate > 80 ? 'var(--danger)' : 'var(--primary)',
        labelText: 'Occupied'
      });
    }

    // 3. Redraw Right Panel Low Stocks Alerts
    const inventory = Store.getInventory();
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
  },

  setupGlobalEvents: function() {
    // 1. Mobile off-canvas menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('app-sidebar');
    if (menuToggle && sidebar) {
      menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('open');
      });

      document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && e.target !== menuToggle) {
          sidebar.classList.remove('open');
        }
      });
    }

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

      document.addEventListener('click', (e) => {
        if (!alertsDrawer.contains(e.target) && e.target !== alertsToggle) {
          closeDrawer();
        }
      });
    }

    // 3. Logout trigger
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to securely logout from the operations console?')) {
          sessionStorage.removeItem('opscare_active_user');
          Toasts.warning('Securely logged out.');
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 600);
        }
      });
    }
  }
};

// Launch application checks on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
