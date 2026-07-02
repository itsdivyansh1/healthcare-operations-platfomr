window.AuraCare = window.AuraCare || {};
window.AuraCare.Views = window.AuraCare.Views || {};

AuraCare.Views.Appointments = {
  render: function() {
    const viewport = document.getElementById('app-viewport');
    
    viewport.innerHTML = `
      <div class="fade-in">
        <!-- Header -->
        <div class="flex-between" style="margin-bottom: 24px;">
          <div>
            <h1 style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 700;">Consultations & Surgery Schedulers</h1>
            <p style="color: var(--text-secondary); font-size: 0.8rem;">Schedule clinic check-ups, review calendar slots, and assign physician consultants.</p>
          </div>
          <button class="btn btn-primary" id="btn-schedule-apt">
            <i data-lucide="calendar-plus"></i> Book Consultation
          </button>
        </div>

        <!-- Appointment Cards Grid -->
        <div class="grid-cols-3" id="appointments-cards-grid">
          <!-- Dynamic cards -->
        </div>
      </div>
    `;

    this.bindEvents();
    this.renderAppointments();
  },

  bindEvents: function() {
    document.getElementById('btn-schedule-apt').addEventListener('click', () => {
      this.openScheduleModal();
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  renderAppointments: function() {
    const grid = document.getElementById('appointments-cards-grid');
    if (!grid) return;

    const apts = AuraCare.Store.getAppointments().filter(a => a.status === 'scheduled');

    if (apts.length === 0) {
      grid.className = 'card';
      grid.style.gridTemplateColumns = '1fr';
      grid.innerHTML = `
        <div style="text-align:center; padding:40px; color:var(--text-muted); font-size:0.85rem;">
          <i data-lucide="calendar" style="width:36px; height:36px; margin-bottom:12px; display:block; margin:0 auto 12px auto; color:var(--text-muted);"></i>
          No upcoming consultations scheduled.
        </div>
      `;
      if (window.lucide) window.lucide.createIcons({ node: grid });
      return;
    }

    grid.className = 'grid-cols-3';
    grid.style.gridTemplateColumns = '';
    grid.innerHTML = apts.map(a => {
      // Split date to show clean clinical month / day card block
      const dateParts = a.date.split('-');
      let dayText = '';
      let monthText = '';
      if (dateParts.length === 3) {
        const d = new Date(a.date);
        dayText = dateParts[2];
        monthText = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      }

      return `
        <div class="apt-card-agenda">
          <div>
            <!-- Agenda Top Info Row -->
            <div class="apt-agenda-badge-row">
              <span style="font-family:monospace; font-size:0.75rem; font-weight:700; color:var(--text-muted); background-color:var(--bg-app); border:1px solid var(--border-color); padding:2px 6px; border-radius:4px;">${a.id}</span>
              <span class="badge bg-info-glow text-info">Awaiting Slot</span>
            </div>

            <!-- Date and Content split -->
            <div style="display:flex; gap:14px; align-items:start; margin-bottom:12px;">
              <!-- Calendar Page Block -->
              <div style="background-color:var(--bg-app); border:1px solid var(--border-color); border-radius:var(--radius-md); text-align:center; width:52px; height:52px; flex-shrink:0; display:flex; flex-direction:column; overflow:hidden;">
                <div style="background-color:var(--primary); color:white; font-size:0.55rem; font-weight:700; padding:2px 0;">${monthText}</div>
                <div style="font-family:var(--font-heading); font-size:1.15rem; font-weight:700; color:var(--text-primary); line-height:1.2; display:flex; align-items:center; justify-content:center; flex:1;">${dayText}</div>
              </div>
              
              <!-- Patient Info -->
              <div style="overflow:hidden;">
                <h4 style="font-size:1.05rem; font-weight:600; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; margin-bottom:2px;">${a.patientName}</h4>
                <div style="font-size:0.8rem; color:var(--text-secondary); display:flex; align-items:center; gap:4px;">
                  <i data-lucide="stethoscope" style="width:12px; height:12px; color:var(--primary);"></i>
                  <span style="text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${a.doctorName}</span>
                </div>
              </div>
            </div>

            <!-- Reason Description Block -->
            <p style="font-size:0.8rem; color:var(--text-secondary); background-color:var(--bg-app); border:1px solid var(--border-color); padding:10px 12px; border-radius:var(--radius-md); line-height:1.4;">
              ${a.reason}
            </p>
          </div>

          <!-- Bottom Schedule Details & Action Row -->
          <div style="margin-top:16px; border-top:1px solid var(--border-color); padding-top:12px; display:flex; justify-content:space-between; align-items:center;">
            <div class="apt-time-badge">
              <i data-lucide="clock" style="width:11px; height:11px;"></i> ${a.time}
            </div>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-secondary btn-sm btn-cancel-apt" data-id="${a.id}" style="padding:4px 10px; font-size:0.65rem;">Cancel</button>
              <button class="btn btn-success btn-sm btn-complete-apt" data-id="${a.id}" style="padding:4px 10px; font-size:0.65rem;"><i data-lucide="check" style="width:10px;height:10px;"></i> Done</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Bind action buttons
    grid.querySelectorAll('.btn-cancel-apt').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        AuraCare.Store.updateAppointmentStatus(id, 'cancelled');
        AuraCare.Toasts.warning('Consultation slot cancelled.');
        this.render();
      });
    });

    grid.querySelectorAll('.btn-complete-apt').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        AuraCare.Store.updateAppointmentStatus(id, 'completed');
        AuraCare.Toasts.success('Consultation marked completed.');
        this.render();
      });
    });

    if (window.lucide) {
      window.lucide.createIcons({ node: grid });
    }
  },

  openScheduleModal: function() {
    const patients = AuraCare.Store.getPatients().filter(p => !p.dischargeDate);
    const doctors = AuraCare.Store.getStaff().filter(s => s.role === 'Doctor' && s.status !== 'off-duty');
    const uniqueId = AuraCare.Utils.generateId('APT', AuraCare.Store.getAppointments());

    const patientOptions = patients.map(p => `<option value="${p.id}|${p.name || 'Anonymous'}">${p.name || 'Anonymous'} (${p.id})</option>`).join('');
    const doctorOptions = doctors.map(d => `<option value="${d.id}|${d.name}">${d.name} (${d.specialty})</option>`).join('');

    const modalBody = `
      <form id="schedule-consultation-form" class="form-grid">
        <div class="form-group">
          <label class="form-label" for="apt-id">Booking ID</label>
          <input type="text" id="apt-id" class="form-control" value="${uniqueId}" readonly>
        </div>
        <div class="form-group">
          <label class="form-label" for="apt-patient">Patient Profile</label>
          <select id="apt-patient" class="form-control" required>
            <option value="">-- Choose Patient --</option>
            ${patientOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="apt-doctor">Clinical Doctor</label>
          <select id="apt-doctor" class="form-control" required>
            <option value="">-- Choose Physician --</option>
            ${doctorOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="apt-date">Schedule Date</label>
          <input type="date" id="apt-date" class="form-control" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="apt-time">Schedule Time</label>
          <input type="time" id="apt-time" class="form-control" required>
        </div>
        <div class="form-group full-width">
          <label class="form-label" for="apt-reason">Consultation Clinical Reason</label>
          <input type="text" id="apt-reason" class="form-control" placeholder="E.g., Routine cardiac follow-up..." required>
        </div>
      </form>
    `;

    AuraCare.Modal.open('Book Outpatient Consult', modalBody, [
      {
        text: 'Cancel',
        className: 'btn-secondary',
        onClick: () => AuraCare.Modal.close()
      },
      {
        text: '<i data-lucide="check"></i> Confirm Booking',
        className: 'btn-primary',
        onClick: () => {
          const form = document.getElementById('schedule-consultation-form');
          if (form.reportValidity()) {
            const patVal = document.getElementById('apt-patient').value.split('|');
            const docVal = document.getElementById('apt-doctor').value.split('|');
            const date = document.getElementById('apt-date').value;
            const time = document.getElementById('apt-time').value;
            const reason = document.getElementById('apt-reason').value;

            const newApt = {
              id: uniqueId,
              patientId: patVal[0],
              patientName: patVal[1],
              doctorId: docVal[0],
              doctorName: docVal[1],
              date,
              time,
              reason,
              status: 'scheduled'
            };

            AuraCare.Store.addAppointment(newApt);
            AuraCare.Toasts.success('Consultation booked successfully.');
            AuraCare.Modal.close();
            this.render();
          }
        }
      }
    ]);
  }
};
