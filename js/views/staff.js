const StaffView = {
  currentRoleFilter: 'all',

  init: function() {
    this.bindEvents();
    this.renderStaffRows();
  },

  bindEvents: function() {
    const btnAddStaff = document.getElementById('btn-add-staff');
    if (btnAddStaff) {
      const newBtnAdd = btnAddStaff.cloneNode(true);
      btnAddStaff.parentNode.replaceChild(newBtnAdd, btnAddStaff);
      newBtnAdd.addEventListener('click', () => {
        this.openAddStaffModal();
      });
    }

    const container = document.getElementById('app-viewport');
    if (container) {
      container.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.currentRoleFilter = btn.getAttribute('data-role');
          
          // Toggle active classes manually
          container.querySelectorAll('.filter-btn').forEach(b => {
            b.classList.remove('btn-primary');
          });
          btn.classList.add('btn-primary');

          this.renderStaffRows();
        });
      });
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  renderStaffRows: function() {
    const tableBody = document.getElementById('staff-table-body');
    if (!tableBody) return;

    let staff = Store.getStaff();

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
        Store.updateStaffStatus(id, newStatus);
        Toasts.info(`Duty status changed to: ${newStatus.toUpperCase()}`);
        this.renderStaffRows();
      });
    });

    // Page Staff button trigger
    tableBody.querySelectorAll('.btn-page-staff').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name');
        const phone = btn.getAttribute('data-phone');
        Store.addLog(`Clinical page broadcasted to: ${name} (${phone})`, 'info');
        Toasts.success(`Page dispatch sent to ${name}.`);
      });
    });

    if (window.lucide) {
      window.lucide.createIcons({ node: tableBody });
    }
  },

  openAddStaffModal: function() {
    const uniqueId = Utils.generateId('STF', Store.getStaff());

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

    Modal.open('Register Roster Member', modalBody, [
      {
        text: 'Cancel',
        className: 'btn-secondary',
        onClick: () => Modal.close()
      },
      {
        text: '<i data-lucide="check"></i> Register Roster',
        className: 'btn-primary',
        onClick: () => {
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
          } else if (!/^[6-9][0-9]{9}$/.test(phone)) {
            const err = document.getElementById('err-stf-phone');
            if (err) { err.textContent = 'Enter a valid 10-digit Indian phone number starting with 6, 7, 8, or 9.'; err.classList.remove('hidden'); }
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

          Store.addStaff(newStaff);
          Toasts.success(`${name} has been added to roster.`);
          Modal.close();
          this.renderStaffRows();
        }
      }
    ]);
  }
};
