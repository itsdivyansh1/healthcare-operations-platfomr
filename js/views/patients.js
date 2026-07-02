window.AuraCare = window.AuraCare || {};
window.AuraCare.Views = window.AuraCare.Views || {};

AuraCare.Views.Patients = {
  currentSearch: '',
  currentSeverityFilter: 'all',
  currentWardFilter: 'all',

  render: function() {
    const viewport = document.getElementById('app-viewport');
    
    viewport.innerHTML = `
      <div class="fade-in">
        <!-- Header -->
        <div class="flex-between" style="margin-bottom: 24px;">
          <div>
            <h1 style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 700;">Electronic Health Records (EHR)</h1>
            <p style="color: var(--text-secondary); font-size: 0.8rem;">Manage hospital admissions, patient records, and clinical logs.</p>
          </div>
          <button class="btn btn-primary" id="btn-admit-patient">
            <i data-lucide="plus-circle"></i> Admit New Patient
          </button>
        </div>

        <!-- Filter Shell Card -->
        <div class="card" style="padding: 16px; margin-bottom: 24px;">
          <div style="display:flex; gap:16px; align-items:center; flex-wrap:wrap;">
            <!-- Search -->
            <div class="header-search" style="display:flex; width: 300px; background-color: var(--bg-app);">
              <i data-lucide="search" style="color:var(--text-muted); width:16px; height:16px;"></i>
              <input type="text" id="patient-search-input" placeholder="Search by name or EMR ID..." value="${this.currentSearch}">
            </div>

            <!-- Severity Filter -->
            <div class="form-group" style="margin-bottom:0; flex-direction:row; align-items:center; gap:8px;">
              <label class="form-label" style="white-space:nowrap; margin-bottom:0;">Severity:</label>
              <select id="filter-severity" class="form-control" style="width:130px; padding:6px 10px;">
                <option value="all" ${this.currentSeverityFilter === 'all' ? 'selected' : ''}>All</option>
                <option value="critical" ${this.currentSeverityFilter === 'critical' ? 'selected' : ''}>Critical</option>
                <option value="high" ${this.currentSeverityFilter === 'high' ? 'selected' : ''}>High</option>
                <option value="medium" ${this.currentSeverityFilter === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="low" ${this.currentSeverityFilter === 'low' ? 'selected' : ''}>Low</option>
              </select>
            </div>

            <!-- Ward Filter -->
            <div class="form-group" style="margin-bottom:0; flex-direction:row; align-items:center; gap:8px;">
              <label class="form-label" style="white-space:nowrap; margin-bottom:0;">Unit Ward:</label>
              <select id="filter-ward" class="form-control" style="width:150px; padding:6px 10px;">
                <option value="all" ${this.currentWardFilter === 'all' ? 'selected' : ''}>All Wards</option>
                <option value="ICU" ${this.currentWardFilter === 'ICU' ? 'selected' : ''}>ICU</option>
                <option value="Emergency" ${this.currentWardFilter === 'Emergency' ? 'selected' : ''}>Emergency</option>
                <option value="General Ward" ${this.currentWardFilter === 'General Ward' ? 'selected' : ''}>General Ward</option>
                <option value="Pediatrics" ${this.currentWardFilter === 'Pediatrics' ? 'selected' : ''}>Pediatrics</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Patients Data Table -->
        <div class="card" style="padding:0;">
          <div class="table-container" style="border:none; margin-top:0;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>EMR ID</th>
                  <th>Patient Name</th>
                  <th>Age / Sex</th>
                  <th>Severity</th>
                  <th>Location (Bed)</th>
                  <th>Assigned Physician</th>
                  <th>Status</th>
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody id="patients-table-body">
                <!-- Dynamic rows -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.renderPatientRows();
  },

  bindEvents: function() {
    // 1. Admit patient button
    document.getElementById('btn-admit-patient').addEventListener('click', () => {
      this.openAdmissionModal();
    });

    // 2. Search box input with debouncing
    const searchInput = document.getElementById('patient-search-input');
    searchInput.addEventListener('input', AuraCare.Utils.debounce((e) => {
      this.currentSearch = e.target.value.trim();
      this.renderPatientRows();
    }, 150));

    // 3. Filters dropdowns
    document.getElementById('filter-severity').addEventListener('change', (e) => {
      this.currentSeverityFilter = e.target.value;
      this.renderPatientRows();
    });

    document.getElementById('filter-ward').addEventListener('change', (e) => {
      this.currentWardFilter = e.target.value;
      this.renderPatientRows();
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  renderPatientRows: function() {
    const tableBody = document.getElementById('patients-table-body');
    if (!tableBody) return;

    let patients = AuraCare.Store.getPatients();

    // Filter discharged vs active patients
    patients = patients.filter(p => !p.dischargeDate);

    // Apply Search Filter
    if (this.currentSearch) {
      const q = this.currentSearch.toLowerCase();
      patients = patients.filter(p => 
        (p.id || '').toLowerCase().includes(q) || 
        (p.name || '').toLowerCase().includes(q) || 
        (p.diagnosis || '').toLowerCase().includes(q)
      );
    }

    // Apply Severity Filter
    if (this.currentSeverityFilter !== 'all') {
      patients = patients.filter(p => p.severity === this.currentSeverityFilter);
    }

    // Apply Ward Filter
    if (this.currentWardFilter !== 'all') {
      patients = patients.filter(p => p.ward === this.currentWardFilter);
    }

    if (patients.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding:32px; color:var(--text-muted);">
            <i data-lucide="folder-open" style="width:36px; height:36px; margin-bottom:8px; display:block; margin:0 auto 8px auto;"></i>
            No active patient records found matching filter criteria.
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons({ node: tableBody });
      return;
    }

    tableBody.innerHTML = patients.map(p => {
      // SAFE FALLBACK CHECKS - Prevents "Clinical Console Render Error" from undefined properties
      const age = p.dob ? AuraCare.Utils.calculateAge(p.dob) : 'N/A';
      const genderShort = p.gender ? p.gender.substring(0, 1) : 'U';
      const severity = p.severity || 'low';
      const doctorName = p.doctor || 'Unassigned';
      const diagnosisText = p.diagnosis || 'No Diagnosis';
      
      const location = p.bed ? `<span style="font-weight:600;"><i data-lucide="bed" style="width:14px;height:14px;margin-right:4px;vertical-align:middle;color:var(--primary);"></i>${p.bed} (${p.ward || 'General'})</span>` : '<span style="color:var(--text-muted);">Unallocated</span>';
      
      return `
        <tr>
          <td class="nowrap"><span style="font-family:monospace;font-weight:600;font-size:0.8rem;background-color:var(--bg-app);padding:4px 8px;border-radius:4px;border:1px solid var(--border-color);">${p.id}</span></td>
          <td>
            <div style="font-weight:600;">${p.name || 'Anonymous'}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${diagnosisText}</div>
          </td>
          <td class="nowrap">${age}y / ${genderShort}</td>
          <td class="nowrap">${AuraCare.Utils.getSeverityBadge(severity)}</td>
          <td class="nowrap">${location}</td>
          <td>${doctorName}</td>
          <td class="nowrap">
            <span class="badge ${p.bed ? 'bg-info-glow text-info' : 'bg-warning-glow text-warning'}">
              ${p.bed ? 'Admitted' : 'Awaiting Bed'}
            </span>
          </td>
          <td class="nowrap" style="text-align:right;">
            <div style="display:flex; gap:8px; justify-content:flex-end;">
              <button class="btn btn-secondary btn-sm flex-center btn-view-emr" data-id="${p.id}" title="View EMR Profile">
                <i data-lucide="file-text" style="width:14px;height:14px;"></i> EHR Profile
              </button>
              <button class="btn btn-danger btn-sm flex-center btn-discharge" data-id="${p.id}" title="Discharge Patient">
                <i data-lucide="log-out" style="width:14px;height:14px;"></i> Discharge
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Bind row actions
    tableBody.querySelectorAll('.btn-view-emr').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        this.openPatientProfileModal(id);
      });
    });

    tableBody.querySelectorAll('.btn-discharge').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        const patient = AuraCare.Store.getPatient(id);
        if (patient && confirm(`Are you sure you want to clinically discharge ${patient.name || 'this patient'}?`)) {
          AuraCare.Store.dischargePatient(id);
          AuraCare.Toasts.success(`Clinical discharge processed for ${patient.name}.`);
          this.render();
        }
      });
    });

    if (window.lucide) {
      window.lucide.createIcons({ node: tableBody });
    }
  },

  openAdmissionModal: function() {
    const availableBeds = AuraCare.Store.getBeds().filter(b => b.status === 'available');
    const doctors = AuraCare.Store.getStaff().filter(s => s.role === 'Doctor');
    const uniqueId = AuraCare.Utils.generateId('PAT', AuraCare.Store.getPatients());

    const bedOptions = availableBeds.map(b => `<option value="${b.id}">${b.id} (${b.ward})</option>`).join('');
    const docOptions = doctors.map(d => `<option value="${d.name}">${d.name} (${d.specialty})</option>`).join('');

    const modalBody = `
      <form id="patient-admission-form" class="form-grid">
        <div class="form-group">
          <label class="form-label" for="adm-id">EMR ID</label>
          <input type="text" id="adm-id" class="form-control" value="${uniqueId}" readonly>
        </div>
        <div class="form-group">
          <label class="form-label" for="adm-name">Full Name</label>
          <input type="text" id="adm-name" class="form-control" placeholder="John Doe" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="adm-dob">Date of Birth</label>
          <input type="date" id="adm-dob" class="form-control" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="adm-gender">Gender</label>
          <select id="adm-gender" class="form-control">
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="form-group full-width">
          <label class="form-label" for="adm-diagnosis">Primary Diagnosis</label>
          <input type="text" id="adm-diagnosis" class="form-control" placeholder="Acute respiratory infection..." required>
        </div>
        <div class="form-group">
          <label class="form-label" for="adm-severity">Initial Severity Status</label>
          <select id="adm-severity" class="form-control">
            <option value="low">Low (Routine)</option>
            <option value="medium" selected>Medium (Moderate)</option>
            <option value="high">High (Severe)</option>
            <option value="critical">Critical (Life Threatening)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="adm-doctor">Assigned Doctor</label>
          <select id="adm-doctor" class="form-control" required>
            ${docOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="adm-bed">Allocate Bed Location</label>
          <select id="adm-bed" class="form-control" required>
            <option value="">-- Select Bed --</option>
            ${bedOptions}
          </select>
        </div>
      </form>
    `;

    AuraCare.Modal.open('Admit New Patient', modalBody, [
      {
        text: 'Cancel',
        className: 'btn-secondary',
        onClick: () => AuraCare.Modal.close()
      },
      {
        text: '<i data-lucide="check-circle2"></i> Complete Admission',
        className: 'btn-primary',
        onClick: () => {
          const form = document.getElementById('patient-admission-form');
          if (form.reportValidity()) {
            const name = document.getElementById('adm-name').value;
            const dob = document.getElementById('adm-dob').value;
            const gender = document.getElementById('adm-gender').value;
            const diagnosis = document.getElementById('adm-diagnosis').value;
            const severity = document.getElementById('adm-severity').value;
            const doctor = document.getElementById('adm-doctor').value;
            const bedId = document.getElementById('adm-bed').value;

            const newPatient = {
              id: uniqueId,
              name,
              dob,
              gender,
              severity,
              admissionDate: new Date().toISOString().substring(0, 10),
              diagnosis,
              doctor,
              bed: bedId,
              vitals: { bp: '120/80', hr: 75, temp: '98.6°F', spo2: 98 },
              medications: [],
              billingStatus: 'unbilled',
              history: [
                {
                  date: new Date().toISOString().replace('T', ' ').substring(0, 16),
                  type: 'admission',
                  author: doctor,
                  text: `Intake records complete. Primary diagnosis: ${diagnosis}. Initial severity: ${severity}.`
                }
              ]
            };

            AuraCare.Store.addPatient(newPatient);
            AuraCare.Store.allocateBed(bedId, uniqueId);

            AuraCare.Toasts.success(`Patient ${name} admitted successfully.`);
            AuraCare.Modal.close();
            this.render();
          }
        }
      }
    ]);
  },

  openPatientProfileModal: function(patientId) {
    const drawProfile = () => {
      const p = AuraCare.Store.getPatient(patientId);
      if (!p) return;
      
      const age = p.dob ? AuraCare.Utils.calculateAge(p.dob) : 'N/A';
      
      // Safe array defaults
      const history = p.history || [];
      const medications = p.medications || [];
      const vitals = p.vitals || { bp: '120/80', hr: 75, temp: '98.6°F', spo2: 98 };

      const timelineHtml = history.map(h => {
        let borderClass = '';
        if (h.type === 'vital_check') { borderClass = 'success'; }
        if (h.type === 'critical_alert') { borderClass = 'danger'; }

        return `
          <div class="timeline-item">
            <span class="timeline-marker ${borderClass}"></span>
            <div class="timeline-content">
              <div class="timeline-meta">
                <span class="timeline-author">${h.author || 'System Operations'}</span>
                <span class="timeline-date">${h.date || ''}</span>
              </div>
              <p style="font-size:0.8125rem; color:var(--text-primary); margin-top:2px;">${h.text || ''}</p>
            </div>
          </div>
        `;
      }).reverse().join('');

      const medList = medications.length > 0 
        ? medications.map(m => `<li style="display:flex; justify-content:space-between; align-items:center; background-color:var(--bg-app); padding:6px 12px; border-radius:6px; margin-bottom:6px; font-size:0.8125rem; border:1px solid var(--border-color);">${m} <button class="btn-remove-med" data-med="${m}" style="color:var(--danger); cursor:pointer; font-weight:700; background:none; border:none; padding:0;">×</button></li>`).join('')
        : '<li style="color:var(--text-muted); font-size:0.8125rem; font-style:italic;">No active medications</li>';

      const content = document.createElement('div');
      content.className = 'grid-cols-2';
      content.style.gridTemplateColumns = '1.25fr 1.75fr';
      content.innerHTML = `
        <!-- Left Side: Basic EMR Vitals details -->
        <div style="display:flex; flex-direction:column; gap:16px; border-right: 1px solid var(--border-color); padding-right:16px;">
          <div>
            <h4 style="font-size:1.15rem; font-weight:700;">${p.name || 'Anonymous'}</h4>
            <div style="font-size:0.8125rem; color:var(--text-secondary); margin-top:4px;">
              <span>${p.gender || 'Unknown'}, ${age} Years</span> &bull; 
              <span style="font-family:monospace;">ID: ${p.id}</span>
            </div>
            <div style="margin-top:8px;">${AuraCare.Utils.getSeverityBadge(p.severity || 'low')}</div>
          </div>

          <!-- Vitals Panel Card -->
          <div class="card" style="padding:16px; background-color:var(--bg-app);">
            <div class="card-title" style="font-size:0.9rem; margin-bottom:12px;"><i data-lucide="heart" style="color:var(--danger);width:16px;"></i> Active Clinical Vitals</div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:0.75rem;">Blood Pressure</label>
                <input type="text" id="vit-bp" class="form-control" style="padding:6px 10px; font-size:0.8125rem;" value="${vitals.bp || ''}">
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:0.75rem;">Pulse (bpm)</label>
                <input type="number" id="vit-hr" class="form-control" style="padding:6px 10px; font-size:0.8125rem;" value="${vitals.hr || ''}">
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:0.75rem;">SpO2 (%)</label>
                <input type="number" id="vit-spo2" class="form-control" style="padding:6px 10px; font-size:0.8125rem;" value="${vitals.spo2 || ''}">
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:0.75rem;">Temperature (°F)</label>
                <input type="text" id="vit-temp" class="form-control" style="padding:6px 10px; font-size:0.8125rem;" value="${vitals.temp || ''}">
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" id="btn-save-vitals" style="margin-top:16px; width:100%; font-size:0.75rem;"><i data-lucide="save" style="width:12px;"></i> Save Clinical Vitals</button>
          </div>

          <!-- Active Medications Card -->
          <div class="card" style="padding:16px; background-color:var(--bg-app);">
            <div class="card-title" style="font-size:0.9rem; margin-bottom:12px;"><i data-lucide="pill" style="color:var(--secondary);width:16px;"></i> Prescribed Medications</div>
            <ul style="margin-bottom:12px; max-height:120px; overflow-y:auto; padding-right:2px;">
              ${medList}
            </ul>
            <div style="display:flex; gap:8px;">
              <input type="text" id="new-med-input" class="form-control" style="padding:6px 10px; font-size:0.8125rem;" placeholder="Add medication...">
              <button class="btn btn-primary btn-sm" id="btn-add-med" style="padding:6px 10px; font-size:0.75rem;"><i data-lucide="plus" style="width:12px;"></i> Add</button>
            </div>
          </div>
        </div>

        <!-- Right Side: Care Timeline & Logs -->
        <div style="display:flex; flex-direction:column; height: 100%;">
          <h4 style="font-size:1rem; font-weight:700; margin-bottom:12px; display:flex; align-items:center; gap:8px;"><i data-lucide="activity" style="color:var(--primary);width:18px;"></i> Patient Care History Log</h4>
          
          <!-- Timeline Display -->
          <div style="flex:1; max-height:280px; overflow-y:auto; padding-right:4px; margin-bottom:16px;">
            <div class="emr-timeline">
              ${timelineHtml}
            </div>
          </div>

          <!-- Add Timeline Event note form -->
          <div class="card" style="padding:12px; background-color:var(--bg-app);">
            <div class="form-group" style="margin-bottom:8px;">
              <label class="form-label" style="font-size:0.75rem;">Append Clinical Flow Note</label>
              <textarea id="timeline-note-text" class="form-control" style="font-size:0.8125rem; min-height:50px; padding:6px 10px;" placeholder="Add treatment, diagnostic note, or condition details..."></textarea>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div style="display:flex; align-items:center; gap:6px;">
                <label class="form-label" style="font-size:0.75rem; margin-bottom:0;">Physician Signature:</label>
                <input type="text" id="timeline-signature" class="form-control" style="padding:4px 8px; font-size:0.75rem; width:120px;" value="${p.doctor || ''}">
              </div>
              <button class="btn btn-primary btn-sm" id="btn-submit-note" style="font-size:0.75rem;"><i data-lucide="plus-circle" style="width:12px;"></i> Append Note</button>
            </div>
          </div>
        </div>
      `;

      // Attach Event Listeners internally
      content.querySelector('#btn-save-vitals').addEventListener('click', () => {
        const bp = content.querySelector('#vit-bp').value;
        const hr = parseInt(content.querySelector('#vit-hr').value, 10);
        const spo2 = parseInt(content.querySelector('#vit-spo2').value, 10);
        const temp = content.querySelector('#vit-temp').value;

        const updatedVitals = { bp, hr, temp, spo2 };
        AuraCare.Store.updatePatient(patientId, { vitals: updatedVitals });
        
        const patientData = AuraCare.Store.getPatient(patientId);
        if (!patientData.history) patientData.history = [];
        
        patientData.history.push({
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          type: 'vital_check',
          author: patientData.doctor || 'Clinical Staff',
          text: `Vitals recorded: BP: ${bp}, HR: ${hr} bpm, SpO2: ${spo2}%, Temp: ${temp}.`
        });
        
        const patients = AuraCare.Store.getPatients();
        const pIndex = patients.findIndex(pat => pat.id === patientId);
        patients[pIndex] = patientData;
        localStorage.setItem('auracare_patients', JSON.stringify(patients));
        
        AuraCare.Store.addLog(`Vitals checked for patient ${patientData.name || 'Anonymous'}: BP: ${bp}, HR: ${hr}, SpO2: ${spo2}%`, 'info');
        
        if (spo2 < 92) {
          AuraCare.Store.addLog(`CRITICAL SPO2 LEVEL: Patient ${patientData.name || 'Anonymous'} SpO2 dropped to ${spo2}%`, 'critical');
          AuraCare.Toasts.error(`SpO2 levels critically low (${spo2}%) for ${patientData.name || 'Anonymous'}!`);
        } else {
          AuraCare.Toasts.success('Vitals record updated.');
        }

        drawProfile();
        this.renderPatientRows();
      });

      content.querySelector('#btn-add-med').addEventListener('click', () => {
        const input = content.querySelector('#new-med-input');
        const medName = input.value.trim();
        if (medName) {
          const patientData = AuraCare.Store.getPatient(patientId);
          if (!patientData.medications) patientData.medications = [];
          if (!patientData.history) patientData.history = [];
          
          patientData.medications.push(medName);
          
          patientData.history.push({
            date: new Date().toISOString().replace('T', ' ').substring(0, 16),
            type: 'treatment',
            author: patientData.doctor || 'Clinical Staff',
            text: `Prescribed medication: ${medName}.`
          });

          const patients = AuraCare.Store.getPatients();
          const pIndex = patients.findIndex(pat => pat.id === patientId);
          patients[pIndex] = patientData;
          localStorage.setItem('auracare_patients', JSON.stringify(patients));

          AuraCare.Store.addLog(`Medication ${medName} prescribed to ${patientData.name || 'Anonymous'}`, 'info');
          AuraCare.Toasts.success('Medication prescribed.');
          
          input.value = '';
          drawProfile();
        }
      });

      content.querySelectorAll('.btn-remove-med').forEach(btn => {
        btn.addEventListener('click', () => {
          const medToRemove = btn.getAttribute('data-med');
          const patientData = AuraCare.Store.getPatient(patientId);
          if (!patientData.medications) patientData.medications = [];
          if (!patientData.history) patientData.history = [];
          
          patientData.medications = patientData.medications.filter(m => m !== medToRemove);
          
          patientData.history.push({
            date: new Date().toISOString().replace('T', ' ').substring(0, 16),
            type: 'treatment',
            author: patientData.doctor || 'Clinical Staff',
            text: `Removed medication: ${medToRemove}.`
          });

          const patients = AuraCare.Store.getPatients();
          const pIndex = patients.findIndex(pat => pat.id === patientId);
          patients[pIndex] = patientData;
          localStorage.setItem('auracare_patients', JSON.stringify(patients));

          AuraCare.Toasts.warning('Medication discontinued.');
          drawProfile();
        });
      });

      content.querySelector('#btn-submit-note').addEventListener('click', () => {
        const text = content.querySelector('#timeline-note-text').value.trim();
        const signature = content.querySelector('#timeline-signature').value.trim() || 'Clinical Staff';
        if (text) {
          const patientData = AuraCare.Store.getPatient(patientId);
          if (!patientData.history) patientData.history = [];
          
          patientData.history.push({
            date: new Date().toISOString().replace('T', ' ').substring(0, 16),
            type: 'treatment',
            author: signature,
            text: text
          });

          const patients = AuraCare.Store.getPatients();
          const pIndex = patients.findIndex(pat => pat.id === patientId);
          patients[pIndex] = patientData;
          localStorage.setItem('auracare_patients', JSON.stringify(patients));

          AuraCare.Toasts.success('Care note appended.');
          drawProfile();
        }
      });

      AuraCare.Modal.open(`Electronic Health Record (EMR) - #${p.id}`, content, [
        {
          text: 'Close EHR Profile',
          className: 'btn-secondary',
          onClick: () => AuraCare.Modal.close()
        }
      ]);
    };

    drawProfile();
  }
};
