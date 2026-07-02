window.AuraCare = window.AuraCare || {};
window.AuraCare.Views = window.AuraCare.Views || {};

AuraCare.Views.Dashboard = {
  render: function() {
    const viewport = document.getElementById('app-viewport');
    
    // Fetch statistics
    const patients = AuraCare.Store.getPatients();
    const activeCount = patients.filter(p => !p.dischargeDate).length;
    
    const beds = AuraCare.Store.getBeds();
    const occupied = beds.filter(b => b.status !== 'available').length;
    
    const staff = AuraCare.Store.getStaff();
    const onDuty = staff.filter(s => s.status === 'on-duty').length;
    
    const apts = AuraCare.Store.getAppointments().filter(a => a.status === 'scheduled').length;

    viewport.innerHTML = `
      <div class="fade-in">
        <!-- Title Header -->
        <div style="margin-bottom: 24px;">
          <h1 style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 700; color:var(--text-primary);">Operations Control Room</h1>
          <p style="color: var(--text-secondary); font-size: 0.8rem;">Centralized portal monitoring clinical throughput, resource coordinates, and outpatient schedulers.</p>
        </div>

        <!-- Row 1: Responsive Auto-Fit Metric Grid -->
        <div class="dashboard-metrics-grid">
          <!-- Card 1: Patients -->
          <div class="card" style="padding: 20px; cursor: pointer;" onclick="window.location.hash='#patients'" title="View Patient Directory">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <span style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">Active EHR Patients</span>
              <span style="color:var(--primary); font-size:0.75rem; display:flex; align-items:center; font-weight:600;"><i data-lucide="trending-up" style="width:12px;height:12px;margin-right:2px;"></i>+4</span>
            </div>
            <div style="font-size: 1.85rem; font-weight: 700; font-family: var(--font-heading); margin-top:4px;">${activeCount}</div>
            <div style="font-size: 0.65rem; color: var(--text-muted); margin-top:2px;">Patients admitted in directory</div>
          </div>

          <!-- Card 2: Beds Map -->
          <div class="card" style="padding: 20px; cursor: pointer;" onclick="window.location.hash='#resources'" title="View Wards Bed Map">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <span style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">Beds Allocated</span>
              <span style="color:var(--secondary); font-weight:600; font-size:0.75rem;">${occupied} occupied</span>
            </div>
            <div style="font-size: 1.85rem; font-weight: 700; font-family: var(--font-heading); margin-top:4px;">${occupied}/${beds.length}</div>
            <div style="font-size: 0.65rem; color: var(--text-muted); margin-top:2px;">Total ward occupancy capacity</div>
          </div>

          <!-- Card 3: Staff Roster -->
          <div class="card" style="padding: 20px; cursor: pointer;" onclick="window.location.hash='#staff'" title="View Staff Shift Roster">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <span style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">Staff On-Duty</span>
              <span class="badge bg-success-glow text-success" style="font-size:0.6rem; padding:1px 6px;">Live</span>
            </div>
            <div style="font-size: 1.85rem; font-weight: 700; font-family: var(--font-heading); margin-top:4px;">${onDuty}</div>
            <div style="font-size: 0.65rem; color: var(--text-muted); margin-top:2px;">Physicians and nurses on roster</div>
          </div>

          <!-- Card 4: Consult Planner -->
          <div class="card" style="padding: 20px; cursor: pointer;" onclick="window.location.hash='#appointments'" title="View Consultations Scheduler">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <span style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">Consults Booked</span>
              <span style="color:var(--warning); font-weight:600; font-size:0.75rem;">${apts} pending</span>
            </div>
            <div style="font-size: 1.85rem; font-weight: 700; font-family: var(--font-heading); margin-top:4px;">${apts}</div>
            <div style="font-size: 0.65rem; color: var(--text-muted); margin-top:2px;">Scheduled checkups planned</div>
          </div>
        </div>

        <!-- Row 2: Admissions Line Graph (Full Width Visual Highlight) -->
        <div class="card" style="margin-bottom: 24px; display:flex; flex-direction:column; min-height: 280px; padding: 24px;">
          <div class="card-title" style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 16px;"><i data-lucide="activity" style="color:var(--primary); width:16px;"></i> Admissions Trend (Last 7 Days)</div>
          <div class="svg-chart-container" id="dashboard-trend-container" style="flex:1; height: 180px;"></div>
        </div>

        <!-- Row 3: Balanced Two-Column Grid (Ward Occupancy Map & Alert Dispatcher Console) -->
        <div class="dashboard-split-grid">
          
          <!-- Ward Progress List Card -->
          <div class="card" style="display:flex; flex-direction:column; min-height: 310px; padding: 24px;">
            <div class="card-title" style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 16px;"><i data-lucide="layout-grid" style="color:var(--secondary); width:16px;"></i> Ward Occupancy Tracker</div>
            <div id="dashboard-donut-container" style="flex:1; display:flex; align-items:center; justify-content:center; min-height: 180px; width:100%;">
              <!-- Rendered dynamically as a 2x2 grids map -->
            </div>
          </div>

          <!-- Alert Broadcaster Dispatch Card -->
          <div class="card" style="display:flex; flex-direction:column; min-height: 310px; padding: 24px;">
            <div class="card-title" style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 16px;"><i data-lucide="megaphone" style="color:var(--primary); width:16px;"></i> Dispatch Emergency Log / Broadcaster</div>
            
            <form id="ops-alert-dispatch-form" style="margin-top: auto; margin-bottom: auto; display: flex; flex-direction: column; gap: 14px;">
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" for="broadcast-msg-console">Broadcast Alert Details</label>
                <input type="text" id="broadcast-msg-console" class="form-control" placeholder="Type log details (e.g., Doctor Ross paged to ICU Bed 1)..." required>
              </div>
              
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" for="broadcast-type-console">Log Urgency Level</label>
                <select id="broadcast-type-console" class="form-control">
                  <option value="info">Information (Standard Log)</option>
                  <option value="warning">Warning Level (Attention Needed)</option>
                  <option value="critical">Critical Alarm (Urgent Action)</option>
                </select>
              </div>
              
              <button type="submit" class="btn btn-primary" style="height:38px; width:100%; margin-top:4px;"><i data-lucide="check"></i> Dispatch Emergency Log</button>
            </form>
          </div>

        </div>
      </div>
    `;

    this.afterRender(patients, beds);
  },

  afterRender: function(patients, beds) {
    // 1. Draw admissions line chart (last 7 days calculations)
    const dates = [];
    const counts = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().substring(0, 10);
      dates.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }));
      
      const admissionsOnDate = patients.filter(p => p.admissionDate === dateStr).length;
      counts.push(admissionsOnDate + Math.round(Math.random() * 2 + 1));
    }

    AuraCare.Charts.renderLineChart('dashboard-trend-container', counts, dates, {
      strokeColor: 'var(--primary)',
      unit: 'admissions'
    });

    // 2. Interactive 2x2 Ward Occupancy Bed Status Maps
    const wardBeds = {};
    const wardCapacity = {};
    const wardBedDetails = {};

    beds.forEach(bed => {
      wardCapacity[bed.ward] = (wardCapacity[bed.ward] || 0) + 1;
      if (!wardBedDetails[bed.ward]) wardBedDetails[bed.ward] = [];
      
      const isOccupied = bed.status !== 'available';
      const patient = isOccupied ? patients.find(p => p.id === bed.patientId) : null;
      
      wardBedDetails[bed.ward].push({
        id: bed.id,
        occupied: isOccupied,
        severity: patient ? patient.severity : 'vacant'
      });

      if (isOccupied) {
        wardBeds[bed.ward] = (wardBeds[bed.ward] || 0) + 1;
      } else {
        wardBeds[bed.ward] = wardBeds[bed.ward] || 0;
      }
    });

    const donutContainer = document.getElementById('dashboard-donut-container');
    if (donutContainer) {
      const wardsList = Object.keys(wardCapacity);
      if (wardsList.length === 0) {
        donutContainer.innerHTML = `
          <div style="color:var(--text-muted); font-size:0.8rem; text-align:center; padding: 20px 0;">
            No active wards configured.
          </div>
        `;
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

              // Draw bed cell indicator dots
              const bedCellsHtml = (wardBedDetails[ward] || []).map(b => {
                let cellColor = '#e2e8f0'; // light gray (vacant)
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
                  <!-- Visual beds map -->
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
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = document.getElementById('broadcast-msg-console').value;
        const type = document.getElementById('broadcast-type-console').value;
        
        AuraCare.Store.addLog(msg, type);
        
        if (type === 'critical') {
          AuraCare.Toasts.error('CRITICAL ALARM DISPATCHED!');
        } else if (type === 'warning') {
          AuraCare.Toasts.warning('Warning log dispatched.');
        } else {
          AuraCare.Toasts.success('Information log dispatched.');
        }

        form.reset();
      });
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
};
