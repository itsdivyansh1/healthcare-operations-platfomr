const DashboardView = {
  init: function() {
    let patients = Store.getPatients();
    const beds = Store.getBeds();
    
    // Filter by active user practitioner caseload
    const activeUserJson = sessionStorage.getItem('opscare_active_user');
    let user = null;
    if (activeUserJson) {
      user = JSON.parse(activeUserJson);
      if (user.role === 'doctor') {
        patients = patients.filter(p => p.doctor && p.doctor.toLowerCase().includes(user.name.toLowerCase()));
      } else if (user.role === 'nurse') {
        patients = patients.filter(p => p.nurse && p.nurse.toLowerCase().includes(user.name.toLowerCase()));
      } else if (user.role === 'technician') {
        patients = patients.filter(p => p.technician && p.technician.toLowerCase().includes(user.name.toLowerCase()));
      }
    }
    
    // Resolve role-specific titles, values, and descriptions dynamically
    const tPatients = document.getElementById('db-title-patients');
    const sPatients = document.getElementById('db-stat-patients');
    const dPatients = document.getElementById('db-sub-patients');

    const tBeds = document.getElementById('db-title-beds');
    const sBeds = document.getElementById('db-stat-beds');
    const dBeds = document.getElementById('db-sub-beds');

    const tStaff = document.getElementById('db-title-staff');
    const sStaff = document.getElementById('db-stat-staff');
    const dStaff = document.getElementById('db-sub-staff');

    const tConsults = document.getElementById('db-title-consults');
    const sConsults = document.getElementById('db-stat-consults');
    const dConsults = document.getElementById('db-sub-consults');

    const activePatientIds = patients.map(p => p.id);
    const allocatedBeds = beds.filter(b => b.status === 'occupied' && activePatientIds.includes(b.patientId)).length;

    const appointments = Store.getAppointments() || [];
    let consultsCount = 0;
    if (user) {
      if (user.role === 'doctor') {
        consultsCount = appointments.filter(app => app.doctorName && app.doctorName.toLowerCase().includes(user.name.toLowerCase())).length;
      } else if (user.role === 'nurse' || user.role === 'technician') {
        const patientNames = patients.map(p => (p.name || '').toLowerCase());
        consultsCount = appointments.filter(app => app.patientName && patientNames.includes(app.patientName.toLowerCase())).length;
      } else {
        consultsCount = appointments.length;
      }
    } else {
      consultsCount = appointments.length;
    }

    if (user && user.role === 'doctor') {
      if (tPatients) tPatients.textContent = 'My Active Caseload';
      if (sPatients) sPatients.textContent = patients.length;
      if (dPatients) dPatients.textContent = 'Patients currently under your care';

      if (tBeds) tBeds.textContent = 'Critical Cases';
      if (sBeds) sBeds.textContent = patients.filter(p => p.severity === 'critical' || p.severity === 'high').length;
      if (dBeds) dBeds.textContent = 'High-risk caseload patients';

      if (tStaff) tStaff.textContent = 'Caseload Beds';
      if (sStaff) sStaff.textContent = `${allocatedBeds} Beds`;
      if (dStaff) dStaff.textContent = 'Hospital beds holding your patients';

      if (tConsults) tConsults.textContent = 'My Consults';
      if (sConsults) sConsults.textContent = consultsCount;
      if (dConsults) dConsults.textContent = 'Booked consultations for today';
    } else if (user && user.role === 'nurse') {
      if (tPatients) tPatients.textContent = 'My Active Caseload';
      if (sPatients) sPatients.textContent = patients.length;
      if (dPatients) dPatients.textContent = 'Patients assigned for nursing care';

      if (tBeds) tBeds.textContent = 'Critical Cases';
      if (sBeds) sBeds.textContent = patients.filter(p => p.severity === 'critical' || p.severity === 'high').length;
      if (dBeds) dBeds.textContent = 'High-risk caseload patients';

      if (tStaff) tStaff.textContent = 'Caseload Beds';
      if (sStaff) sStaff.textContent = `${allocatedBeds} Beds`;
      if (dStaff) dStaff.textContent = 'Hospital beds holding your patients';

      if (tConsults) tConsults.textContent = 'My Patient Consults';
      if (sConsults) sConsults.textContent = consultsCount;
      if (dConsults) dConsults.textContent = 'Appointments for your patients';
    } else if (user && user.role === 'technician') {
      if (tPatients) tPatients.textContent = 'My Active Caseload';
      if (sPatients) sPatients.textContent = patients.length;
      if (dPatients) dPatients.textContent = 'Patients assigned for diagnostics';

      if (tBeds) tBeds.textContent = 'Critical Cases';
      if (sBeds) sBeds.textContent = patients.filter(p => p.severity === 'critical' || p.severity === 'high').length;
      if (dBeds) dBeds.textContent = 'High-risk caseload patients';

      if (tStaff) tStaff.textContent = 'Caseload Beds';
      if (sStaff) sStaff.textContent = `${allocatedBeds} Beds`;
      if (dStaff) dStaff.textContent = 'Hospital beds holding your patients';

      if (tConsults) tConsults.textContent = 'My Patient Consults';
      if (sConsults) sConsults.textContent = consultsCount;
      if (dConsults) dConsults.textContent = 'Appointments for your patients';
    } else {
      // Clinical Staff Allocator / Admin: Global Metrics view
      const totalOccupied = beds.filter(b => b.status === 'occupied').length;

      if (tPatients) tPatients.textContent = 'Active EHR Patients';
      if (sPatients) sPatients.textContent = patients.length;
      if (dPatients) dPatients.textContent = 'Patients admitted in directory';

      if (tBeds) tBeds.textContent = 'Beds Allocated';
      if (sBeds) sBeds.textContent = `${totalOccupied} / ${beds.length}`;
      if (dBeds) dBeds.textContent = 'Total ward occupancy capacity';

      if (tStaff) tStaff.textContent = 'Staff On-Duty';
      if (sStaff) sStaff.textContent = Store.getStaff().filter(s => s.status === 'on-duty').length;
      if (dStaff) dStaff.textContent = 'Physicians and nurses on roster';

      if (tConsults) tConsults.textContent = 'Consults Booked';
      if (sConsults) sConsults.textContent = appointments.length;
      if (dConsults) dConsults.textContent = 'Total hospital consults scheduled';
    }
    
    // Swap dashboard widgets to show clinical layout for practitioners
    if (user && user.role !== 'staff' && user.role !== 'admin') {
      this.renderClinicalDashboard(user, patients);
    } else {
      // Draw Admissions and Wards Maps for operations allocator
      this.afterRender(patients, beds);
    }
  },

  renderClinicalDashboard: function(user, patients) {
    const container = document.getElementById('dashboard-widgets-container');
    if (!container) return;

    // 1. Generate Caseload Table
    let caseloadRowsHtml = '';
    if (patients.length === 0) {
      caseloadRowsHtml = `
        <tr>
          <td colspan="5" style="text-align:center; padding:32px; color:var(--text-muted);">
            No active patients in your caseload directory.
          </td>
        </tr>
      `;
    } else {
      caseloadRowsHtml = patients.map(p => {
        let sevClass = 'bg-info-glow text-primary';
        if (p.severity === 'critical') sevClass = 'bg-danger-glow text-danger';
        else if (p.severity === 'high') sevClass = 'bg-warning-glow text-warning';
        else if (p.severity === 'medium') sevClass = 'bg-warning-glow text-warning';
        
        const vitals = p.vitals || { bp: '120/80', hr: 75, temp: '98.6°F', spo2: 98 };
        const spo2AlertStyle = (vitals.spo2 || 98) < 92 ? 'color:var(--danger); font-weight:700;' : '';

        return `
          <tr style="border-bottom:1px solid var(--border-color);">
            <td style="padding:10px 0;">
              <div style="font-weight:600; color:var(--text-primary);">${p.name}</div>
              <div style="font-size:0.7rem; color:var(--text-muted);">ID: ${p.id}</div>
            </td>
            <td style="padding:10px 0;"><span style="font-family:monospace; font-weight:600; font-size:0.75rem;">${p.bed || 'Awaiting Bed'}</span></td>
            <td style="padding:10px 0;"><span class="badge ${sevClass}" style="font-size:0.65rem; padding:2px 6px;">${p.severity.toUpperCase()}</span></td>
            <td style="padding:10px 0; font-size:0.725rem; line-height:1.35; color:var(--text-secondary);">
              BP: <strong>${vitals.bp || '120/80'}</strong> | Pulse: <strong>${vitals.hr || 75} bpm</strong><br>
              SpO2: <strong style="${spo2AlertStyle}">${vitals.spo2 || 98}%</strong> | Temp: <strong>${vitals.temp || '98.6°F'}</strong>
            </td>
            <td style="padding:10px 0; text-align:right;">
              <button class="btn btn-secondary btn-sm flex-center" onclick="window.location.href='patients.html?id=${p.id}'" style="padding:4px 8px; font-size:0.7rem; gap:4px; display:inline-flex;">
                <i data-lucide="folder-open" style="width:12px; height:12px;"></i> EMR File
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    // 2. Generate Consultations list
    const appointments = Store.getAppointments() || [];
    let myConsults = [];
    if (user.role === 'doctor') {
      myConsults = appointments.filter(app => app.doctorName && app.doctorName.toLowerCase().includes(user.name.toLowerCase()));
    } else {
      const patientNames = patients.map(p => (p.name || '').toLowerCase());
      myConsults = appointments.filter(app => app.patientName && patientNames.includes(app.patientName.toLowerCase()));
    }
    
    let consultsListHtml = '';
    if (myConsults.length === 0) {
      consultsListHtml = `
        <div class="flex-center" style="height:100%; min-height:180px; color:var(--text-muted); text-align:center; font-size:0.75rem; flex-direction:column;">
          <i data-lucide="calendar" style="width:28px; height:28px; margin-bottom:6px; color:var(--text-muted);"></i>
          <span>No consults scheduled.</span>
        </div>
      `;
    } else {
      consultsListHtml = `
        <div style="display:flex; flex-direction:column; gap:8px; height:240px; overflow-y:auto; padding-right:4px;">
          ${myConsults.map(c => {
            const isCompleted = c.status === 'completed';
            const statusClass = isCompleted ? 'bg-success-glow text-success' : 'bg-primary-glow text-primary';
            return `
              <div style="background-color:var(--bg-app); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:10px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="font-weight:600; font-size:0.775rem; color:var(--text-primary);">${c.patientName}</div>
                  <div style="font-size:0.675rem; color:var(--text-muted); display:flex; align-items:center; gap:4px; margin-top:2px;">
                    <i data-lucide="clock" style="width:10px; height:10px;"></i>
                    <span>${c.date} | ${c.time}</span>
                  </div>
                </div>
                <span class="badge ${statusClass}" style="font-size:0.6rem; padding:2px 5px;">
                  ${c.status.toUpperCase()}
                </span>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    container.innerHTML = `
      <!-- Left Card: Caseload Tracker -->
      <div class="card" style="padding:20px; height:330px; display:flex; flex-direction:column; overflow:hidden;">
        <div class="card-title" style="margin-bottom:12px;">
          <i data-lucide="heart" style="color:var(--primary); width:16px;"></i>
          My Caseload Patients Tracker
        </div>
        <div style="flex:1; overflow-y:auto; width:100%;">
          <table class="table" style="font-size:0.75rem; width:100%; border-collapse:collapse;">
            <thead>
              <tr style="border-bottom:1px solid var(--border-color); text-align:left; color:var(--text-muted); font-size:0.7rem; text-transform:uppercase;">
                <th style="padding-bottom:6px;">Patient</th>
                <th style="padding-bottom:6px;">Bed</th>
                <th style="padding-bottom:6px;">Severity</th>
                <th style="padding-bottom:6px;">Vitals Details</th>
                <th style="padding-bottom:6px; text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${caseloadRowsHtml}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Right Card: Consultation Schedule -->
      <div class="card" style="padding:20px; height:330px; display:flex; flex-direction:column; overflow:hidden;">
        <div class="card-title" style="margin-bottom:12px;">
          <i data-lucide="calendar" style="color:var(--secondary); width:16px;"></i>
          Clinical Schedule Timeline
        </div>
        <div style="flex:1; overflow:hidden; display:flex; flex-direction:column; justify-content:center;">
          ${consultsListHtml}
        </div>
      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons({ node: container });
    }
  },

  afterRender: function(patients, beds) {
    // 1. Draw admissions line chart
    const dates = [];
    const counts = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().substring(0, 10);
      dates.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }));
      
      const admissionsOnDate = patients.filter(p => p.admissionDate === dateStr).length;
      counts.push(admissionsOnDate);
    }

    const container = document.getElementById('dashboard-trend-container');
    if (container && typeof Charts !== 'undefined') {
      Charts.renderLineChart('dashboard-trend-container', counts, dates, {
        strokeColor: 'var(--primary)',
        unit: 'admissions'
      });
    }

    // 2. Interactive 2x2 Ward Occupancy Bed Status Maps
    const wardBeds = {};
    const wardCapacity = {};
    const wardBedDetails = {};

    beds.forEach(bed => {
      wardCapacity[bed.ward] = (wardCapacity[bed.ward] || 0) + 1;
      if (!wardBedDetails[bed.ward]) wardBedDetails[bed.ward] = [];
      
      const isOccupied = bed.status !== 'available';
      // Only recognize the bed as occupied on the user's dashboard if it belongs to their patient caseload
      const patient = isOccupied ? patients.find(p => p.id === bed.patientId) : null;
      
      wardBedDetails[bed.ward].push({
        id: bed.id,
        occupied: !!patient,
        severity: patient ? patient.severity : 'vacant'
      });

      if (patient) {
        wardBeds[bed.ward] = (wardBeds[bed.ward] || 0) + 1;
      } else {
        wardBeds[bed.ward] = wardBeds[bed.ward] || 0;
      }
    });

    const donutContainer = document.getElementById('dashboard-donut-container');
    if (donutContainer) {
      const wardsList = Object.keys(wardCapacity);
      if (wardsList.length === 0) {
        donutContainer.innerHTML = `<div style="color:var(--text-muted); font-size:0.8rem; text-align:center;">No active wards.</div>`;
      } else {
        donutContainer.innerHTML = `
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; width:100%;">
            ${wardsList.map(ward => {
              const occupied = wardBeds[ward] || 0;
              const total = wardCapacity[ward] || 1;
              const pct = Math.round((occupied / total) * 100);
              
              let statusLabel = 'SAFE';
              let statusClass = 'bg-success-glow text-success';
              if (pct >= 85) {
                statusLabel = 'FULL CAPACITY';
                statusClass = 'bg-danger-glow text-danger';
              } else if (pct >= 60) {
                statusLabel = 'BUSY';
                statusClass = 'bg-warning-glow text-warning';
              }

              const bedCellsHtml = (wardBedDetails[ward] || []).map(b => {
                let cellColor = '#e2e8f0';
                if (b.occupied) {
                  if (b.severity === 'critical') cellColor = 'var(--danger)';
                  else if (b.severity === 'high') cellColor = 'var(--warning)';
                  else cellColor = 'var(--primary)';
                }
                return `<span style="width:10px; height:10px; border-radius:2px; background-color:${cellColor}; display:inline-block;" title="Bed ${b.id}"></span>`;
              }).join('');

              return `
                <div style="background-color:var(--bg-app); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:10px; display:flex; flex-direction:column; gap:4px; text-align:left;">
                  <div class="flex-between">
                    <span style="font-weight:700; font-size:0.75rem; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width:90px;" title="${ward}">${ward}</span>
                    <span class="badge ${statusClass}" style="font-size:0.5rem; padding:1px 3px;">${statusLabel}</span>
                  </div>
                  <div style="font-family:monospace; font-size:0.7rem; color:var(--text-secondary); font-weight:600; margin-bottom:2px;">
                    ${occupied} / ${total} Beds (${pct}%)
                  </div>
                  <div style="display:flex; gap:3px; flex-wrap:wrap; background-color:var(--bg-panel); border:1px solid var(--border-color); border-radius:4px; padding:4px; min-height:22px; align-items:center;">
                    ${bedCellsHtml}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }
    }

    // 3. Dispatch Form submit
    const form = document.getElementById('ops-alert-dispatch-form');
    if (form) {
      // Clear old listeners by cloning
      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, form);
      
      newForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = document.getElementById('broadcast-msg-console').value;
        const type = document.getElementById('broadcast-type-console').value;
        
        Store.addLog(msg, type);
        
        if (type === 'critical') {
          Toasts.error('CRITICAL ALARM DISPATCHED!');
        } else if (type === 'warning') {
          Toasts.warning('Warning log dispatched.');
        } else {
          Toasts.success('Information log dispatched.');
        }

        newForm.reset();
      });
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
};
