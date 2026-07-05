window.AuraCare = window.AuraCare || {};
window.AuraCare.Views = window.AuraCare.Views || {};

AuraCare.Views.Dashboard = {
  init: function() {
    const patients = AuraCare.Store.getPatients();
    const beds = AuraCare.Store.getBeds();
    
    // Draw Admissions and Wards Maps
    this.afterRender(patients, beds);
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
      counts.push(admissionsOnDate + Math.round(Math.random() * 2 + 1));
    }

    const container = document.getElementById('dashboard-trend-container');
    if (container && window.AuraCare.Charts) {
      AuraCare.Charts.renderLineChart('dashboard-trend-container', counts, dates, {
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
        
        AuraCare.Store.addLog(msg, type);
        
        if (type === 'critical') {
          AuraCare.Toasts.error('CRITICAL ALARM DISPATCHED!');
        } else if (type === 'warning') {
          AuraCare.Toasts.warning('Warning log dispatched.');
        } else {
          AuraCare.Toasts.success('Information log dispatched.');
        }

        newForm.reset();
      });
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
};
