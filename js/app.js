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
    this.applyRoleRestrictions();

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
    const userJson = sessionStorage.getItem('opscare_active_user');
    if (!userJson) return false;
    try {
      const user = JSON.parse(userJson);
      const pathLower = window.location.pathname.toLowerCase();
      
      // If Admin
      if (user.email === 'admin@opscare.com') {
        if (user.role !== 'admin') {
          sessionStorage.removeItem('opscare_active_user');
          window.location.href = 'login.html';
          return false;
        }
        // Redirect to admin.html if on doctor page
        if (!pathLower.includes('admin.html')) {
          window.location.href = 'admin.html';
          return false;
        }
        return true;
      }

      // Check database to make sure they exist and are verified
      const users = JSON.parse(localStorage.getItem('opscare_users')) || [];
      const match = users.find(u => u.email === user.email);
      if (!match || match.verified === false) {
        sessionStorage.removeItem('opscare_active_user');
        window.location.href = 'login.html';
        return false;
      }
      
      // Doctors/Staff/Nurses/Techs should not access admin.html
      if (pathLower.includes('admin.html')) {
        window.location.href = 'dashboard.html';
        return false;
      }

      // Doctor role path checking: restricted from resources.html, staff.html, and billing.html
      if (user.role === 'doctor') {
        if (pathLower.includes('resources.html') || pathLower.includes('staff.html') || pathLower.includes('billing.html')) {
          window.location.href = 'dashboard.html';
          return false;
        }
      }

      // Nurse and Technician path checking: restricted from resources.html, staff.html, and billing.html
      if (user.role === 'nurse' || user.role === 'technician') {
        if (pathLower.includes('resources.html') || pathLower.includes('staff.html') || pathLower.includes('billing.html')) {
          window.location.href = 'dashboard.html';
          return false;
        }
      }
      
    } catch (e) {
      console.error(e);
      return false;
    }
    return true;
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

  applyRoleRestrictions: function() {
    const userJson = sessionStorage.getItem('opscare_active_user');
    if (!userJson) return;
    try {
      const user = JSON.parse(userJson);
      
      // Centralize roster additions: hide manual roster addition for all console views
      const styleGlobal = document.createElement('style');
      styleGlobal.innerHTML = `
        #btn-add-staff {
          display: none !important;
        }
      `;
      document.head.appendChild(styleGlobal);
      
      // Update sidebar user role badge designation correctly
      const roleEl = document.querySelector('.user-role');
      if (roleEl) {
        if (user.role === 'doctor') roleEl.textContent = 'Physician';
        else if (user.role === 'nurse') roleEl.textContent = 'Nurse';
        else if (user.role === 'technician') roleEl.textContent = 'Technician';
        else if (user.role === 'staff') roleEl.textContent = 'Support Staff';
      }

      // Role-specific action hiding to implement precise clinical scopes
      const style = document.createElement('style');
      if (user.role === 'staff') {
        // Clinical Staff (Allocator): Can Admit and Discharge, but cannot record vitals or write prescriptions
        style.innerHTML = `
          #btn-save-vitals,
          #btn-add-med,
          .btn-remove-med,
          #new-med-input,
          #btn-submit-note,
          #timeline-note-text,
          #timeline-signature,
          #btn-create-invoice,
          .btn-pay-bill {
            display: none !important;
          }
        `;
        document.head.appendChild(style);
      } else if (user.role === 'doctor') {
        // Doctor: Full clinical access, but hides admissions/discharge, operations dispatchers, right-side telemetry panel, and operations/billing pages
        style.innerHTML = `
          #btn-admit-patient,
          .btn-discharge,
          #ops-dispatch-card,
          .workspace-right,
          a[href="resources.html"],
          a[href="staff.html"],
          a[href="billing.html"] {
            display: none !important;
          }
          .clinical-workspace {
            grid-template-columns: 1fr !important;
          }
        `;
        document.head.appendChild(style);
      } else if (user.role === 'nurse') {
        // Nurse: Can record vitals, but hides Admissions, prescriptions, billing, dispatchers, telemetry, and operations/billing pages
        style.innerHTML = `
          #btn-admit-patient,
          .btn-discharge,
          #btn-add-med,
          .btn-remove-med,
          #new-med-input,
          #btn-submit-note,
          #timeline-note-text,
          #timeline-signature,
          #btn-create-invoice,
          .btn-pay-bill,
          #ops-dispatch-card,
          .workspace-right,
          a[href="resources.html"],
          a[href="staff.html"],
          a[href="billing.html"] {
            display: none !important;
          }
          .clinical-workspace {
            grid-template-columns: 1fr !important;
          }
        `;
        document.head.appendChild(style);
      } else if (user.role === 'technician') {
        // Technician: Read-only EMR viewer, hides write actions, dispatchers, telemetry, and operations/billing pages
        style.innerHTML = `
          #btn-admit-patient,
          .btn-discharge,
          #btn-save-vitals,
          #btn-add-med,
          .btn-remove-med,
          #new-med-input,
          #btn-submit-note,
          #timeline-note-text,
          #timeline-signature,
          #btn-create-invoice,
          .btn-pay-bill,
          #ops-dispatch-card,
          .workspace-right,
          a[href="resources.html"],
          a[href="staff.html"],
          a[href="billing.html"] {
            display: none !important;
          }
          .clinical-workspace {
            grid-template-columns: 1fr !important;
          }
        `;
        document.head.appendChild(style);
      }
    } catch (e) {
      console.error(e);
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
    const activeUserJson = sessionStorage.getItem('opscare_active_user');
    const user = activeUserJson ? JSON.parse(activeUserJson) : null;
    const specialty = user && user.specialty ? user.specialty.toLowerCase() : '';

    let gaugeLabel = 'Bed Occupancy';
    let gaugeValue = 0;
    let alarmTitle = 'Medical Stock Alarms';
    let lowStockItems = [];

    // Base inventory
    const inventory = Store.getInventory() || [];
    const baseLowStocks = inventory.filter(item => item.stock < item.minStock);

    if (user && user.role === 'doctor') {
      if (specialty.includes('cardio')) {
        gaugeLabel = 'ICU Cardiac Bed Occupancy';
        const icuBeds = beds.filter(b => b.ward === 'ICU');
        const icuOccupied = icuBeds.filter(b => b.status !== 'available').length;
        gaugeValue = icuBeds.length > 0 ? Math.round((icuOccupied / icuBeds.length) * 100) : 0;
        alarmTitle = 'Cardiology Supplies Alerts';
        
        lowStockItems = [
          { name: 'Pacemaker Transvenous Leads', minStock: 10, stock: 3, unit: 'kits' },
          { name: 'Portable Defibrillators', minStock: 6, stock: 2, unit: 'units' },
          { name: 'Heparin Sodium Vials', minStock: 50, stock: 12, unit: 'vials' }
        ];
      } else if (specialty.includes('pediatr')) {
        gaugeLabel = 'NICU/Pediatric Bed Occupancy';
        const pedsBeds = beds.filter(b => b.ward === 'Pediatrics');
        const pedsOccupied = pedsBeds.filter(b => b.status !== 'available').length;
        gaugeValue = pedsBeds.length > 0 ? Math.round((pedsOccupied / pedsBeds.length) * 100) : 0;
        alarmTitle = 'Pediatric Stock Alerts';
        
        lowStockItems = [
          { name: 'Neonatal Incubator Units', minStock: 4, stock: 1, unit: 'units' },
          { name: 'Pediatric Amoxicillin Susp.', minStock: 30, stock: 8, unit: 'vials' },
          { name: 'Infant SpO2 Sensors', minStock: 15, stock: 4, unit: 'pieces' }
        ];
      } else if (specialty.includes('endo') || specialty.includes('diabet')) {
        gaugeLabel = 'Endocrine Ward Occupancy';
        const endocrineBeds = beds.filter(b => b.ward === 'General Ward');
        const endocrineOccupied = endocrineBeds.filter(b => b.status !== 'available').length;
        gaugeValue = endocrineBeds.length > 0 ? Math.round((endocrineOccupied / endocrineBeds.length) * 100) : 0;
        alarmTitle = 'Endocrine Stock Alerts';

        lowStockItems = [
          { name: 'Insulin Aspart Quick-Pens', minStock: 25, stock: 6, unit: 'pens' },
          { name: 'Continuous Glucose Sensors', minStock: 40, stock: 11, unit: 'sensors' },
          { name: 'Glucagon Emergency Kits', minStock: 10, stock: 2, unit: 'kits' }
        ];
      } else if (specialty.includes('emerg') || specialty.includes('trauma')) {
        gaugeLabel = 'Emergency Room Occupancy';
        const erBeds = beds.filter(b => b.ward === 'Emergency');
        const erOccupied = erBeds.filter(b => b.status !== 'available').length;
        gaugeValue = erBeds.length > 0 ? Math.round((erOccupied / erBeds.length) * 100) : 0;
        alarmTitle = 'Emergency Room Alerts';

        lowStockItems = [
          { name: 'Epinephrine Vials (1mg/mL)', minStock: 30, stock: 8, unit: 'vials' },
          { name: 'Trauma Gauze Dressings', minStock: 200, stock: 45, unit: 'boxes' },
          { name: 'Rapid Intubation Packs', minStock: 8, stock: 2, unit: 'packs' }
        ];
      } else {
        // General / Internal Medicine
        gaugeLabel = 'Ward Allocation Occupancy';
        const occupied = beds.filter(b => b.status !== 'available').length;
        gaugeValue = beds.length > 0 ? Math.round((occupied / beds.length) * 100) : 0;
        alarmTitle = 'Internal Medicine Stock';
        
        lowStockItems = baseLowStocks;
      }
    } else {
      // Default / Clinical Allocator / Admin
      gaugeLabel = 'Bed Allocation Capacity';
      const occupied = beds.filter(b => b.status !== 'available').length;
      gaugeValue = beds.length > 0 ? Math.round((occupied / beds.length) * 100) : 0;
      alarmTitle = 'Medical Stock Alarms';
      
      lowStockItems = baseLowStocks;
    }

    // Safely update labels in right panel header if elements exist
    const panelTitleEl = document.getElementById('telemetry-panel-title') || document.querySelector('.workspace-right-header span');
    if (panelTitleEl) {
      if (user && user.role === 'doctor') {
        panelTitleEl.textContent = `${user.specialty || 'Clinical'} Specialty Telemetry`;
      } else {
        panelTitleEl.textContent = 'Real-time Clinical Telemetry';
      }
    }

    const gaugeTitleEl = document.getElementById('telemetry-gauge-title') || document.querySelector('.telemetry-card .flex-between span');
    if (gaugeTitleEl) {
      gaugeTitleEl.textContent = gaugeLabel;
    }

    const stockTitleEl = document.getElementById('telemetry-stock-title') || document.querySelector('.workspace-right-content > div:nth-child(2) > span');
    if (stockTitleEl) {
      stockTitleEl.textContent = alarmTitle;
    }
    
    const gaugeEl = document.getElementById('telemetry-beds-gauge');
    if (gaugeEl && typeof Charts !== 'undefined') {
      Charts.renderGauge('telemetry-beds-gauge', gaugeValue, {
        color: gaugeValue > 80 ? 'var(--danger)' : 'var(--primary)',
        labelText: 'Occupied'
      });
    }

    // 3. Redraw Right Panel Low Stocks Alerts
    const lowStockAlertsEl = document.getElementById('telemetry-stock-alerts');
    if (lowStockAlertsEl) {
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
