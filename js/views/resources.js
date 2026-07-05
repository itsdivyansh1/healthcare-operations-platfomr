const ResourcesView = {
  init: function() {
    this.renderWards();
    this.renderInventory();
  },

  renderWards: function() {
    const beds = Store.getBeds();
    const patients = Store.getPatients();

    const icuContainer = document.getElementById('ward-grid-icu');
    const erContainer = document.getElementById('ward-grid-emergency');
    const gwContainer = document.getElementById('ward-grid-gw');
    const pedContainer = document.getElementById('ward-grid-ped');

    if (!icuContainer || !erContainer || !gwContainer || !pedContainer) return;

    const generateBedHtml = (bed) => {
      let cssClass = 'available';
      let icon = 'circle-slash';
      let statusText = 'Vacant';
      let patientLabel = '';

      if (bed.status !== 'available') {
        const patient = patients.find(p => p.id === bed.patientId);
        if (patient) {
          cssClass = patient.severity === 'critical' ? 'critical' : 'occupied';
          icon = 'user';
          statusText = patient.severity === 'critical' ? 'CRITICAL' : 'Occupied';
          patientLabel = `<div style="font-size:0.7rem; font-weight:600; margin-top:3px; max-width:80px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; color:var(--text-primary);">${patient.name || 'Admitted'}</div>`;
        }
      }

      return `
        <div class="bed-card ${cssClass}" data-bed-id="${bed.id}">
          <i data-lucide="${icon}" class="bed-icon"></i>
          <span class="bed-number">${bed.id}</span>
          <span class="bed-status">${statusText}</span>
          ${patientLabel}
        </div>
      `;
    };

    icuContainer.innerHTML = beds.filter(b => b.ward === 'ICU').map(generateBedHtml).join('');
    erContainer.innerHTML = beds.filter(b => b.ward === 'Emergency').map(generateBedHtml).join('');
    gwContainer.innerHTML = beds.filter(b => b.ward === 'General Ward').map(generateBedHtml).join('');
    pedContainer.innerHTML = beds.filter(b => b.ward === 'Pediatrics').map(generateBedHtml).join('');

    document.querySelectorAll('.bed-card').forEach(card => {
      card.addEventListener('click', () => {
        const bedId = card.getAttribute('data-bed-id');
        this.handleBedClick(bedId);
      });
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  renderInventory: function() {
    const inv = Store.getInventory();
    const container = document.getElementById('inventory-list-container');
    if (!container) return;

    container.innerHTML = inv.map(item => {
      const percent = Math.min(Math.round((item.stock / (item.minStock * 2.5)) * 100), 100);
      const isLow = item.stock < item.minStock;
      
      let barColor = 'var(--secondary)';
      if (isLow) barColor = 'var(--danger)';

      return `
        <div style="background-color:var(--bg-app); padding:14px; border-radius:var(--radius-md); border:1px solid var(--border-color);">
          <div class="flex-between" style="font-size:0.8rem; font-weight:600; margin-bottom:8px;">
            <span style="color:var(--text-primary);">${item.name}</span>
            <span style="font-family:monospace; color:${isLow ? 'var(--danger)' : 'var(--text-primary)'}; font-size:0.85rem;">${item.stock} ${item.unit}</span>
          </div>
          <div style="width:100%; height:6px; background-color:var(--border-color); border-radius:3px; overflow:hidden; position:relative; margin-bottom:8px;">
            <div style="width:${percent}%; height:100%; background-color:${barColor}; border-radius:3px; transition: width 0.3s ease;"></div>
          </div>
          <div class="flex-between" style="font-size:0.7rem; color:var(--text-secondary);">
            <span>Min Alert: ${item.minStock} | Area: ${item.location}</span>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-secondary btn-sm btn-stock-adjust" data-id="${item.id}" data-val="-5" style="padding:1px 5px; font-size:0.6rem;">-5</button>
              <button class="btn btn-secondary btn-sm btn-stock-adjust" data-id="${item.id}" data-val="20" style="padding:1px 5px; font-size:0.6rem;">+20</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.btn-stock-adjust').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const adjustValue = parseInt(btn.getAttribute('data-val'), 10);
        
        Store.adjustStock(id, adjustValue);
        this.renderInventory();
      });
    });
  },

  handleBedClick: function(bedId) {
    const beds = Store.getBeds();
    const bed = beds.find(b => b.id === bedId);
    if (!bed) return;

    const patients = Store.getPatients();

    if (bed.status !== 'available') {
      const patient = patients.find(p => p.id === bed.patientId);
      if (!patient) return;

      const modalHtml = `
        <div style="padding:8px 0; font-family:var(--font-body);">
          <h4 style="font-size:1.2rem; font-weight:700; color:var(--text-primary);">${patient.name || 'Anonymous'}</h4>
          <span style="font-size:0.8rem; color:var(--text-secondary);">EMR ID: ${patient.id} | Severity Status: <strong style="color:var(--danger);">${(patient.severity || 'low').toUpperCase()}</strong></span>
          <div style="margin-top:16px; background-color:var(--bg-app); padding:16px; border-radius:8px; border:1px solid var(--border-color); font-size:0.85rem; line-height:1.6;">
            <p><strong>Primary Diagnosis:</strong> ${patient.diagnosis || 'No Diagnosis'}</p>
            <p style="margin-top:6px;"><strong>Admitting Physician:</strong> ${patient.doctor || 'Unassigned'}</p>
            <p style="margin-top:6px;"><strong>Bed Location Coordinates:</strong> Bed ${bed.number} (${bed.ward} Ward)</p>
          </div>
          <div style="margin-top:16px; border-top:1px solid var(--border-color); padding-top:12px; display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; color:var(--text-secondary);">
            <span>Blood Pressure: <strong>${patient.vitals?.bp || '120/80'}</strong> | Pulse: <strong>${patient.vitals?.hr || 75} bpm</strong></span>
            <span>SpO2 Level: <strong style="color:${(patient.vitals?.spo2 || 98) < 92 ? 'var(--danger)' : 'var(--success)'};">${patient.vitals?.spo2 || 98}%</strong></span>
          </div>
        </div>
      `;

      Modal.open(`Bed Mapping Status - ${bedId}`, modalHtml, [
        {
          text: 'Discharge Patient',
          className: 'btn-danger',
          onClick: () => {
            if (confirm(`Clinically discharge ${patient.name || 'admitted patient'} from Bed ${bedId}?`)) {
              Store.dischargePatient(patient.id);
              Toasts.success(`Patient ${patient.name} discharged successfully.`);
              Modal.close();
              this.renderWards();
            }
          }
        },
        {
          text: 'View EHR Profile',
          className: 'btn-primary',
          onClick: () => {
            Modal.close();
            setTimeout(() => {
              // Redirect to patients page with search parameter if desired, or open EMR modal there
              window.location.href = `patients.html?id=${patient.id}`;
            }, 250);
          }
        }
      ]);
    } else {
      const unassignedPatients = patients.filter(p => !p.bed && !p.dischargeDate);

      if (unassignedPatients.length === 0) {
        Modal.open(`Allocate Bed - ${bedId}`, `
          <div style="text-align:center; padding:16px; color:var(--text-muted); font-size:0.85rem;">
            <i data-lucide="check" style="width:32px; height:32px; margin-bottom:8px; color:var(--success); display:block; margin:0 auto 8px auto;"></i>
            <p>All active hospital admissions are currently mapped to beds.</p>
            <p style="margin-top:8px; color:var(--text-secondary);">You can admit a new patient directly into Bed <strong>${bedId}</strong>.</p>
          </div>
        `, [
          {
            text: 'Close',
            className: 'btn-secondary',
            onClick: () => Modal.close()
          },
          {
            text: 'Admit & Assign Patient',
            className: 'btn-primary',
            onClick: () => {
              Modal.close();
              setTimeout(() => {
                window.location.href = `patients.html?admit=true&bedId=${bedId}`;
              }, 250);
            }
          }
        ]);
        return;
      }

      const patientOptions = unassignedPatients.map(p => `<option value="${p.id}">${p.name || 'Anonymous'} (${p.id}) - ${(p.severity || 'low').toUpperCase()}</option>`).join('');

      const modalHtml = `
        <form id="bed-allocation-form">
          <p style="font-size:0.825rem; color:var(--text-secondary); margin-bottom:16px;">Map a currently unassigned patient from the registry into Bed <strong>${bedId}</strong>.</p>
          <div class="form-group">
            <label class="form-label" for="alloc-patient">Awaiting Patient Profile</label>
            <select id="alloc-patient" class="form-control" required>
              <option value="">-- Select Patient Profile --</option>
              ${patientOptions}
            </select>
          </div>
        </form>
      `;

      Modal.open(`Allocate Bed - ${bedId}`, modalHtml, [
        {
          text: 'Cancel',
          className: 'btn-secondary',
          onClick: () => Modal.close()
        },
        {
          text: 'Admit New Patient',
          className: 'btn-secondary',
          onClick: () => {
            Modal.close();
            setTimeout(() => {
              window.location.href = `patients.html?admit=true&bedId=${bedId}`;
            }, 250);
          }
        },
        {
          text: 'Map Bed Location',
          className: 'btn-primary',
          onClick: () => {
            const select = document.getElementById('alloc-patient');
            const patientId = select.value;
            if (patientId) {
              Store.allocateBed(bedId, patientId);
              Toasts.success('Bed allocated.');
              Modal.close();
              this.renderWards();
            }
          }
        }
      ]);
    }
  }
};
