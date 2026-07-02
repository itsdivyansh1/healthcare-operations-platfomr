window.AuraCare = window.AuraCare || {};
window.AuraCare.Views = window.AuraCare.Views || {};

AuraCare.Views.Staff = {
  currentRoleFilter: 'all',

  render: function() {
    const viewport = document.getElementById('app-viewport');
    
    viewport.innerHTML = `
      <div class="fade-in">
        <!-- Header -->
        <div class="flex-between" style="margin-bottom: 24px;">
          <div>
            <h1 style="font-family: var(--font-heading); font-size: 1.75rem; font-weight: 700;">Clinical Staff Roster</h1>
            <p style="color: var(--text-secondary); font-size: 0.875rem;">Monitor shift statuses, page on-duty doctors, and schedule staff.</p>
          </div>
          <button class="btn btn-primary" id="btn-add-staff">
            <i data-lucide="user-plus"></i> Register Staff Member
          </button>
        </div>

        <!-- Filter Bar -->
        <div class="card" style="padding: 16px; margin-bottom: 24px;">
          <div style="display:flex; gap:16px; align-items:center;">
            <span class="form-label" style="margin-bottom:0;">Filter by Role:</span>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-secondary btn-sm filter-btn ${this.currentRoleFilter === 'all' ? 'btn-primary' : ''}" data-role="all">All Roles</button>
              <button class="btn btn-secondary btn-sm filter-btn ${this.currentRoleFilter === 'Doctor' ? 'btn-primary' : ''}" data-role="Doctor">Physicians</button>
              <button class="btn btn-secondary btn-sm filter-btn ${this.currentRoleFilter === 'Nurse' ? 'btn-primary' : ''}" data-role="Nurse">Nursing</button>
              <button class="btn btn-secondary btn-sm filter-btn ${this.currentRoleFilter === 'Technician' ? 'btn-primary' : ''}" data-role="Technician">Lab & Tech</button>
            </div>
          </div>
        </div>

        <!-- Roster Data Grid -->
        <div class="card" style="padding:0;">
          <div class="table-container" style="border:none; margin-top:0;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Full Name</th>
                  <th>Designation</th>
                  <th>Clinical Area / Specialty</th>
                  <th>Shift Schedule</th>
                  <th>Duty Status</th>
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody id="staff-table-body">
                <!-- Dynamic rows -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.renderStaffRows();
  },

  bindEvents: function() {
    // 1. Add staff button
    document.getElementById('btn-add-staff').addEventListener('click', () => {
      this.openAddStaffModal();
    });

    // 2. Filter buttons
    const container = document.getElementById('app-viewport');
    container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.currentRoleFilter = btn.getAttribute('data-role');
        this.render(); // Rerender full view to redraw active state
      });
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  renderStaffRows: function() {
    const tableBody = document.getElementById('staff-table-body');
    if (!tableBody) return;

    let staff = AuraCare.Store.getStaff();

    // Filter by role
    if (this.currentRoleFilter !== 'all') {
      staff = staff.filter(s => s.role === this.currentRoleFilter);
    }

    if (staff.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">
            <i data-lucide="users" style="width:36px; height:36px; margin-bottom:8px; display:block; margin:0 auto 8px auto;"></i>
            No staff records matching selection.
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons({ node: tableBody });
      return;
    }

    tableBody.innerHTML = staff.map(s => {
      let roleBadgeColor = 'bg-info-glow text-info';
      if (s.role === 'Doctor') roleBadgeColor = 'bg-primary-glow text-primary';
      if (s.role === 'Technician') roleBadgeColor = 'bg-warning-glow text-warning';

      return `
        <tr>
          <td class="nowrap"><span style="font-family:monospace;font-weight:600;font-size:0.8rem;background-color:var(--bg-app);padding:4px 8px;border-radius:4px;border:1px solid var(--border-color);">${s.id}</span></td>
          <td>
            <div style="font-weight:600;">${s.name}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${s.email} | ${s.phone}</div>
          </td>
          <td><span class="badge ${roleBadgeColor}">${s.role}</span></td>
          <td><strong>${s.specialty}</strong></td>
          <td><span style="font-size:0.8125rem;">${s.shift}</span></td>
          <td>
            <select class="form-control staff-status-select" data-id="${s.id}" style="width:110px; padding:4px 8px; font-size:0.75rem; font-weight:600; background-color:var(--bg-card); border-color:var(--border-color);">
              <option value="on-duty" ${s.status === 'on-duty' ? 'selected' : ''}>On-Duty</option>
              <option value="on-call" ${s.status === 'on-call' ? 'selected' : ''}>On-Call</option>
              <option value="off-duty" ${s.status === 'off-duty' ? 'selected' : ''}>Off-Duty</option>
            </select>
          </td>
          <td style="text-align:right;">
            <button class="btn btn-secondary btn-sm flex-center btn-page-staff" data-name="${s.name}" data-phone="${s.phone}" ${s.status === 'off-duty' ? 'disabled' : ''}>
              <i data-lucide="bell-ring" style="width:12px;height:12px;"></i> Page Staff
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Bind dropdown change triggers
    tableBody.querySelectorAll('.staff-status-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const id = select.getAttribute('data-id');
        const newStatus = e.target.value;
        AuraCare.Store.updateStaffStatus(id, newStatus);
        AuraCare.Toasts.info(`Duty status changed to: ${newStatus.toUpperCase()}`);
        this.renderStaffRows(); // Reload rows to apply changes (and keep bindings intact)
      });
    });

    // Page Staff button trigger
    tableBody.querySelectorAll('.btn-page-staff').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name');
        const phone = btn.getAttribute('data-phone');
        AuraCare.Store.addLog(`Clinical page broadcasted to: ${name} (${phone})`, 'info');
        AuraCare.Toasts.success(`Page dispatch sent to ${name}.`);
      });
    });

    if (window.lucide) {
      window.lucide.createIcons({ node: tableBody });
    }
  },

  openAddStaffModal: function() {
    const uniqueId = AuraCare.Utils.generateId('STF', AuraCare.Store.getStaff());

    const modalBody = `
      <form id="staff-registration-form" class="form-grid" novalidate>
        <div class="form-group">
          <label class="form-label" for="stf-id">Staff ID</label>
          <input type="text" id="stf-id" class="form-control" value="${uniqueId}" readonly>
        </div>
        <div class="form-group">
          <label class="form-label" for="stf-name">Full Name</label>
          <input type="text" id="stf-name" class="form-control" placeholder="Dr. Karen Vance" required>
          <span class="error-text hidden" id="err-stf-name" style="color:var(--danger); font-size:0.7rem; margin-top:2px;"></span>
        </div>
        <div class="form-group">
          <label class="form-label" for="stf-role">Role Designator</label>
          <select id="stf-role" class="form-control">
            <option value="Doctor">Physician (Doctor)</option>
            <option value="Nurse">Nursing Care Staff</option>
            <option value="Technician">Lab/Technical Operator</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="stf-spec">Clinical Specialty / Department</label>
          <input type="text" id="stf-spec" class="form-control" placeholder="ICU Care / Cardiology" required>
          <span class="error-text hidden" id="err-stf-spec" style="color:var(--danger); font-size:0.7rem; margin-top:2px;"></span>
        </div>
        <div class="form-group">
          <label class="form-label" for="stf-shift">Shift Assignment</label>
          <select id="stf-shift" class="form-control">
            <option value="Day (08:00 - 16:00)">Day Shift (08:00 - 16:00)</option>
            <option value="Night (16:00 - 24:00)">Night Shift (16:00 - 24:00)</option>
            <option value="Graveyard (24:00 - 08:00)">Graveyard Shift (24:00 - 08:00)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="stf-phone">Pager / Phone Line (10 Digits)</label>
          <input type="tel" id="stf-phone" class="form-control" placeholder="10-digit pager line" required>
          <span class="error-text hidden" id="err-stf-phone" style="color:var(--danger); font-size:0.7rem; margin-top:2px;"></span>
        </div>
        <div class="form-group full-width" style="margin-bottom: 0;">
          <label class="form-label" for="stf-email">Secure Institutional Email</label>
          <input type="email" id="stf-email" class="form-control" placeholder="k.vance@hospital.org" required>
          <span class="error-text hidden" id="err-stf-email" style="color:var(--danger); font-size:0.7rem; margin-top:2px;"></span>
        </div>
      </form>
    `;

    AuraCare.Modal.open('Register Roster Member', modalBody, [
      {
        text: 'Cancel',
        className: 'btn-secondary',
        onClick: () => AuraCare.Modal.close()
      },
      {
        text: '<i data-lucide="check"></i> Register Roster',
        className: 'btn-primary',
        onClick: () => {
          // Clear previous errors
          document.querySelectorAll('.error-text').forEach(el => {
            el.textContent = '';
            el.classList.add('hidden');
          });

          const name = document.getElementById('stf-name').value.trim();
          const role = document.getElementById('stf-role').value;
          const specialty = document.getElementById('stf-spec').value.trim();
          const shift = document.getElementById('stf-shift').value;
          const phone = document.getElementById('stf-phone').value.trim();
          const email = document.getElementById('stf-email').value.trim().toLowerCase();

          let hasError = false;

          if (!name) {
            const err = document.getElementById('err-stf-name');
            if (err) { err.textContent = 'Name is required.'; err.classList.remove('hidden'); }
            hasError = true;
          }

          if (!specialty) {
            const err = document.getElementById('err-stf-spec');
            if (err) { err.textContent = 'Specialty is required.'; err.classList.remove('hidden'); }
            hasError = true;
          }

          if (!phone) {
            const err = document.getElementById('err-stf-phone');
            if (err) { err.textContent = 'Phone number is required.'; err.classList.remove('hidden'); }
            hasError = true;
          } else if (!/^[0-9]{10}$/.test(phone)) {
            const err = document.getElementById('err-stf-phone');
            if (err) { err.textContent = 'Phone number must be exactly 10 digits.'; err.classList.remove('hidden'); }
            hasError = true;
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!email || !emailRegex.test(email)) {
            const err = document.getElementById('err-stf-email');
            if (err) { err.textContent = 'Please enter a valid institutional email.'; err.classList.remove('hidden'); }
            hasError = true;
          }

          if (hasError) return;

          const newStaff = {
            id: uniqueId,
            name,
            role,
            specialty,
            shift,
            phone,
            email,
            status: 'on-duty'
          };

          AuraCare.Store.addStaff(newStaff);
          AuraCare.Toasts.success(`${name} has been added to roster.`);
          AuraCare.Modal.close();
          this.render();
        }
      }
    ]);
  }
};
