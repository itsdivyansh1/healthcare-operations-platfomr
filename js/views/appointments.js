const AppointmentsView = {
  init: function() {
    this.bindEvents();
    this.renderAppointments();
  },

  bindEvents: function() {
    const btnBook = document.getElementById('btn-book-consult');
    if (btnBook) {
      const newBtnBook = btnBook.cloneNode(true);
      btnBook.parentNode.replaceChild(newBtnBook, btnBook);
      newBtnBook.addEventListener('click', () => {
        this.openBookConsultModal();
      });
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  renderAppointments: function() {
    const tableBody = document.getElementById('appointments-table-body');
    if (!tableBody) return;

    let apts = Store.getAppointments();

    const activeUserJson = sessionStorage.getItem('opscare_active_user');
    if (activeUserJson) {
      const activeUser = JSON.parse(activeUserJson);
      if (activeUser.role === 'doctor') {
        apts = apts.filter(a => a.doctorName && a.doctorName.toLowerCase().includes(activeUser.name.toLowerCase()));
      } else if (activeUser.role === 'nurse' || activeUser.role === 'technician') {
        const patients = Store.getPatients();
        let myPatients = [];
        if (activeUser.role === 'nurse') {
          myPatients = patients.filter(p => p.nurse && p.nurse.toLowerCase().includes(activeUser.name.toLowerCase()));
        } else {
          myPatients = patients.filter(p => p.technician && p.technician.toLowerCase().includes(activeUser.name.toLowerCase()));
        }
        const patientNames = myPatients.map(p => (p.name || '').toLowerCase());
        apts = apts.filter(a => a.patientName && patientNames.includes(a.patientName.toLowerCase()));
      }
    }

    if (apts.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">
            <i data-lucide="calendar" style="width:36px; height:36px; margin-bottom:8px; display:block; margin:0 auto 8px auto;"></i>
            No consultations scheduled.
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons({ node: tableBody });
      return;
    }

    tableBody.innerHTML = apts.map(a => {
      const statusBadge = a.status === 'scheduled' ? 'bg-primary-glow text-primary' : (a.status === 'completed' ? 'bg-success-glow text-success' : 'bg-danger-glow text-danger');
      let actionsCell = '';
      if (a.status === 'scheduled') {
        actionsCell = `
          <button class="btn btn-success btn-sm flex-center btn-complete-apt" data-id="${a.id}"><i data-lucide="check" style="width:12px;height:12px;"></i> Finish</button>
          <button class="btn btn-secondary btn-sm flex-center btn-cancel-apt" data-id="${a.id}"><i data-lucide="x" style="width:12px;height:12px;"></i> Cancel</button>
        `;
      } else if (a.status === 'completed') {
        actionsCell = `<span style="color: var(--success); font-size: 0.725rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; padding-right: 8px;"><i data-lucide="check-circle-2" style="width:12px; height:12px;"></i> Closed</span>`;
      } else {
        actionsCell = `<span style="color: var(--text-muted); font-size: 0.725rem; display: inline-flex; align-items: center; gap: 4px; padding-right: 8px;"><i data-lucide="minus-circle" style="width:12px; height:12px;"></i> Cancelled</span>`;
      }

      return `
        <tr>
          <td class="nowrap"><span style="font-family:monospace;font-weight:600;font-size:0.8rem;background-color:var(--bg-app);padding:4px 8px;border-radius:4px;border:1px solid var(--border-color);">${a.id}</span></td>
          <td>
            <div style="font-weight:600;">${a.patientName}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">ID: ${a.patientId}</div>
          </td>
          <td><strong>${a.doctorName}</strong></td>
          <td>${a.date}</td>
          <td><span style="font-family:monospace; font-weight:600;">${a.time}</span></td>
          <td><span class="badge ${statusBadge}">${a.status.toUpperCase()}</span></td>
          <td style="text-align:right;">
            <div style="display:flex; gap:6px; justify-content:flex-end;">
              ${actionsCell}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tableBody.querySelectorAll('.btn-complete-apt').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        Store.updateAppointmentStatus(id, 'completed');
        Toasts.success('Consultation marked completed.');
        this.renderAppointments();
      });
    });

    tableBody.querySelectorAll('.btn-cancel-apt').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Cancel this scheduled check-up?')) {
          Store.updateAppointmentStatus(id, 'cancelled');
          Toasts.warning('Consultation cancelled.');
          this.renderAppointments();
        }
      });
    });

    if (window.lucide) {
      window.lucide.createIcons({ node: tableBody });
    }
  },

  openBookConsultModal: function() {
    const patients = Store.getPatients().filter(p => !p.dischargeDate);
    const doctors = Store.getStaff().filter(s => s.role === 'Doctor' && s.status !== 'off-duty');
    const uniqueId = Utils.generateId('APT', Store.getAppointments());

    const patientOptions = patients.map(p => `<option value="${p.id}|${p.name}">${p.name} (${p.id})</option>`).join('');
    const doctorOptions = doctors.map(d => `<option value="${d.name}">${d.name} (${d.specialty})</option>`).join('');

    const modalBody = `
      <form id="book-consult-form" class="form-grid">
        <div class="form-group">
          <label class="form-label" for="apt-id">Consultation ID</label>
          <input type="text" id="apt-id" class="form-control" value="${uniqueId}" readonly>
        </div>
        <div class="form-group">
          <label class="form-label" for="apt-patient">Patient Profile</label>
          <select id="apt-patient" class="form-control" required>
            <option value="">-- Select Patient --</option>
            ${patientOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="apt-doctor">Specialist Physician</label>
          <select id="apt-doctor" class="form-control" required>
            <option value="">-- Select Doctor --</option>
            ${doctorOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="apt-date">Date Scheduled</label>
          <input type="date" id="apt-date" class="form-control" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="apt-time">Time Slot</label>
          <input type="time" id="apt-time" class="form-control" required>
        </div>
      </form>
    `;

    Modal.open('Book Outpatient Consult', modalBody, [
      {
        text: 'Cancel',
        className: 'btn-secondary',
        onClick: () => Modal.close()
      },
      {
        text: '<i data-lucide="check"></i> Confirm Appointment',
        className: 'btn-primary',
        onClick: () => {
          const form = document.getElementById('book-consult-form');
          if (form.reportValidity()) {
            const patVal = document.getElementById('apt-patient').value;
            const [patId, patName] = patVal.split('|');
            const doctorName = document.getElementById('apt-doctor').value;
            const date = document.getElementById('apt-date').value;
            const time = document.getElementById('apt-time').value;

            const newApt = {
              id: uniqueId,
              patientId: patId,
              patientName: patName,
              doctorName,
              date,
              time,
              status: 'scheduled'
            };

            Store.addAppointment(newApt);
            Toasts.success(`Consultation booked successfully.`);
            Modal.close();
            this.renderAppointments();
          }
        }
      }
    ]);
  }
};
