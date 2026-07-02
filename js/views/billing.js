window.AuraCare = window.AuraCare || {};
window.AuraCare.Views = window.AuraCare.Views || {};

AuraCare.Views.Billing = {
  currentItems: [], // Temporary storage for invoice creation
  currentStatusFilter: 'all', // Active table filter state

  render: function() {
    const viewport = document.getElementById('app-viewport');
    
    // Calculate finance summary numbers
    const bills = AuraCare.Store.getBilling();
    const totalInvoiced = bills.reduce((sum, b) => sum + b.amount, 0);
    const paidBills = bills.filter(b => b.status === 'paid');
    const totalCollected = paidBills.reduce((sum, b) => sum + b.amount, 0);
    const pendingBills = bills.filter(b => b.status === 'pending' || b.status === 'overdue');
    const totalOutstanding = pendingBills.reduce((sum, b) => sum + b.amount, 0);
    const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

    viewport.innerHTML = `
      <div class="fade-in">
        <!-- Header -->
        <div class="flex-between" style="margin-bottom: 24px;">
          <div>
            <h1 style="font-family: var(--font-heading); font-size: 1.75rem; font-weight: 700;">Financial Operations & Invoicing</h1>
            <p style="color: var(--text-secondary); font-size: 0.875rem;">Manage hospital outpatient billing ledger, discharge fees, and ledger collection.</p>
          </div>
          <button class="btn btn-primary" id="btn-create-invoice">
            <i data-lucide="receipt"></i> Create New Invoice
          </button>
        </div>

        <!-- Financial Summary Cards (Click to Filter Table below) -->
        <div class="grid-cols-4" style="margin-bottom: 24px;">
          <div class="card metric-card" id="bill-card-all" style="cursor:pointer; border-color:${this.currentStatusFilter === 'all' ? 'var(--primary)' : 'var(--border-color)'}; box-shadow:${this.currentStatusFilter === 'all' ? '0 0 0 2px var(--primary-glow)' : 'var(--shadow-sm)'};" title="Reset filter (Show all invoices)">
            <div class="metric-header">
              <span class="metric-label">Total Invoiced Volume</span>
              <div class="metric-icon" style="background-color: var(--primary-glow); color: var(--primary);">
                <i data-lucide="bar-chart-3"></i>
              </div>
            </div>
            <div class="metric-value" style="font-size:2rem;">${AuraCare.Utils.formatCurrency(totalInvoiced)}</div>
            <div class="metric-footer">
              <span>Gross financial transactions</span>
            </div>
          </div>

          <div class="card metric-card" id="bill-card-paid" style="cursor:pointer; border-color:${this.currentStatusFilter === 'paid' ? 'var(--success)' : 'var(--border-color)'}; box-shadow:${this.currentStatusFilter === 'paid' ? '0 0 0 2px var(--success-glow)' : 'var(--shadow-sm)'};" title="Filter by: Paid Invoices">
            <div class="metric-header">
              <span class="metric-label">Revenue Collected</span>
              <div class="metric-icon" style="background-color: var(--success-glow); color: var(--success);">
                <i data-lucide="check-circle2"></i>
              </div>
            </div>
            <div class="metric-value" style="font-size:2rem; background:linear-gradient(135deg, var(--success), #a5ffd6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${AuraCare.Utils.formatCurrency(totalCollected)}</div>
            <div class="metric-footer">
              <span class="text-success" style="font-weight:600;">${collectionRate}% Collection Rate</span>
            </div>
          </div>

          <div class="card metric-card" id="bill-card-pending" style="cursor:pointer; border-color:${this.currentStatusFilter === 'pending' ? 'var(--warning)' : 'var(--border-color)'}; box-shadow:${this.currentStatusFilter === 'pending' ? '0 0 0 2px var(--warning-glow)' : 'var(--shadow-sm)'};" title="Filter by: Outstanding Invoices">
            <div class="metric-header">
              <span class="metric-label">Outstanding Balances</span>
              <div class="metric-icon" style="background-color: var(--warning-glow); color: var(--warning);">
                <i data-lucide="alert-circle"></i>
              </div>
            </div>
            <div class="metric-value" style="font-size:2rem; background:linear-gradient(135deg, var(--warning), #ffe7a5); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${AuraCare.Utils.formatCurrency(totalOutstanding)}</div>
            <div class="metric-footer">
              <span>Awaiting billing settlement</span>
            </div>
          </div>

          <div class="card metric-card" id="bill-card-count" style="cursor:pointer; border-color:${this.currentStatusFilter === 'all' ? 'var(--primary)' : 'var(--border-color)'}; box-shadow:${this.currentStatusFilter === 'all' ? '0 0 0 2px var(--primary-glow)' : 'var(--shadow-sm)'};" title="Reset filter (Show all invoices)">
            <div class="metric-header">
              <span class="metric-label">Billing Invoices Count</span>
              <div class="metric-icon" style="background-color: var(--info-glow); color: var(--info);">
                <i data-lucide="files"></i>
              </div>
            </div>
            <div class="metric-value" style="font-size:2rem;">${bills.length}</div>
            <div class="metric-footer">
              <span>Total invoices registered</span>
            </div>
          </div>
        </div>

        <!-- Invoices List Table -->
        <div class="card" style="padding:0;">
          <div class="table-container" style="border:none; margin-top:0;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Patient Name (EMR)</th>
                  <th>Total Amount</th>
                  <th>Date Issued</th>
                  <th>Payment Due Date</th>
                  <th>Status</th>
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody id="billing-table-body">
                <!-- Dynamic rows -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.renderInvoices();
  },

  bindEvents: function() {
    document.getElementById('btn-create-invoice').addEventListener('click', () => {
      this.openCreateInvoiceModal();
    });

    // Wire Card Clicks for Table Filters
    document.getElementById('bill-card-all').addEventListener('click', () => {
      this.currentStatusFilter = 'all';
      this.render();
    });

    document.getElementById('bill-card-count').addEventListener('click', () => {
      this.currentStatusFilter = 'all';
      this.render();
    });

    document.getElementById('bill-card-paid').addEventListener('click', () => {
      this.currentStatusFilter = 'paid';
      this.render();
    });

    document.getElementById('bill-card-pending').addEventListener('click', () => {
      this.currentStatusFilter = 'pending';
      this.render();
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  renderInvoices: function() {
    const tableBody = document.getElementById('billing-table-body');
    if (!tableBody) return;

    let bills = AuraCare.Store.getBilling();

    // Apply Status Filter
    if (this.currentStatusFilter === 'pending') {
      bills = bills.filter(b => b.status === 'pending' || b.status === 'overdue');
    } else if (this.currentStatusFilter !== 'all') {
      bills = bills.filter(b => b.status === this.currentStatusFilter);
    }

    if (bills.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">
            <i data-lucide="receipt" style="width:36px; height:36px; margin-bottom:8px; display:block; margin:0 auto 8px auto;"></i>
            No invoices registered.
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons({ node: tableBody });
      return;
    }

    tableBody.innerHTML = bills.map(b => {
      const statusBadge = b.status === 'paid' 
        ? '<span class="badge bg-success-glow text-success">Paid</span>'
        : '<span class="badge bg-warning-glow text-warning">Awaiting Settlement</span>';

      return `
        <tr>
          <td><span style="font-family:monospace;font-weight:600;font-size:0.8rem;background-color:hsla(224, 60%, 6%, 0.4);padding:4px 8px;border-radius:4px;border:1px solid var(--border-color);">${b.id}</span></td>
          <td>
            <div style="font-weight:600;">${b.patientName}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">ID: ${b.patientId}</div>
          </td>
          <td><strong style="color:var(--text-primary);">${AuraCare.Utils.formatCurrency(b.amount)}</strong></td>
          <td>${AuraCare.Utils.formatDate(b.date)}</td>
          <td>${AuraCare.Utils.formatDate(b.dueDate)}</td>
          <td>${statusBadge}</td>
          <td style="text-align:right;">
            <div style="display:flex; gap:8px; justify-content:flex-end;">
              <button class="btn btn-secondary btn-sm flex-center btn-view-invoice" data-id="${b.id}">
                <i data-lucide="eye" style="width:12px;height:12px;"></i> View Receipt
              </button>
              ${b.status !== 'paid' ? `
                <button class="btn btn-success btn-sm flex-center btn-pay-invoice" data-id="${b.id}">
                  <i data-lucide="dollar-sign" style="width:12px;height:12px;"></i> Process Payment
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Bind action events
    tableBody.querySelectorAll('.btn-view-invoice').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.openInvoiceDetailsModal(id);
      });
    });

    tableBody.querySelectorAll('.btn-pay-invoice').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const bill = bills.find(b => b.id === id);
        if (confirm(`Accept payment of ${AuraCare.Utils.formatCurrency(bill.amount)} for invoice ${id}?`)) {
          AuraCare.Store.payInvoice(id);
          AuraCare.Toasts.success(`Invoice ${id} marked paid. Revenue updated.`);
          this.render();
        }
      });
    });

    if (window.lucide) {
      window.lucide.createIcons({ node: tableBody });
    }
  },

  openInvoiceDetailsModal: function(invoiceId) {
    const bills = AuraCare.Store.getBilling();
    const b = bills.find(bill => bill.id === invoiceId);
    if (!b) return;

    const itemsHtml = b.items.map(item => `
      <tr style="border-bottom:1px solid var(--border-color);">
        <td style="padding:10px 0; color:var(--text-primary); font-size:0.875rem;">${item.description}</td>
        <td style="padding:10px 0; text-align:right; font-weight:600; color:var(--text-primary); font-size:0.875rem;">${AuraCare.Utils.formatCurrency(item.cost)}</td>
      </tr>
    `).join('');

    const modalBody = `
      <div style="padding: 8px 0; font-family:var(--font-body);">
        <div class="flex-between" style="border-bottom: 2px dashed var(--border-color); padding-bottom:16px; margin-bottom:16px;">
          <div>
            <h4 style="font-family:var(--font-heading); font-size:1.5rem; font-weight:700;">AuraCare Hospital OS</h4>
            <p style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">Institutional Billing Receipt</p>
          </div>
          <div style="text-align:right;">
            <span style="font-family:monospace; font-weight:700; background-color:var(--bg-app); border:1px solid var(--border-color); padding:4px 8px; border-radius:4px;">${b.id}</span>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">Date: ${b.date}</div>
          </div>
        </div>

        <div class="grid-cols-2" style="grid-template-columns: 1fr 1fr; margin-bottom:16px; gap:16px;">
          <div>
            <span style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:600; display:block;">Bill To Patient:</span>
            <strong style="color:var(--text-primary); font-size:0.95rem; margin-top:2px; display:block;">${b.patientName}</strong>
            <span style="font-size:0.75rem; color:var(--text-secondary);">EMR Account: ${b.patientId}</span>
          </div>
          <div style="text-align:right;">
            <span style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:600; display:block;">Payment Status:</span>
            <span class="badge ${b.status === 'paid' ? 'bg-success-glow text-success' : 'bg-warning-glow text-warning'}" style="margin-top:4px;">
              ${b.status.toUpperCase()}
            </span>
          </div>
        </div>

        <!-- Ledger Items Table -->
        <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
          <thead>
            <tr style="border-bottom:1px solid var(--text-muted);">
              <th style="padding:8px 0; text-align:left; font-size:0.75rem; text-transform:uppercase; color:var(--text-secondary);">Service Description</th>
              <th style="padding:8px 0; text-align:right; font-size:0.75rem; text-transform:uppercase; color:var(--text-secondary);">Cost Charges</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Totals Row -->
        <div class="flex-between" style="border-top:2px solid var(--border-color); padding-top:12px; margin-top:12px;">
          <strong style="color:var(--text-primary); font-size:1rem;">Total Settlement Charges:</strong>
          <span style="font-size:1.35rem; font-weight:700; color:var(--primary); font-family:var(--font-heading);">${AuraCare.Utils.formatCurrency(b.amount)}</span>
        </div>
      </div>
    `;

    const buttons = [
      {
        text: 'Close',
        className: 'btn-secondary',
        onClick: () => AuraCare.Modal.close()
      }
    ];

    if (b.status !== 'paid') {
      buttons.push({
        text: '<i data-lucide="check-circle2"></i> Mark As Settled',
        className: 'btn-primary',
        onClick: () => {
          AuraCare.Store.payInvoice(b.id);
          AuraCare.Toasts.success(`Invoice ${b.id} paid.`);
          AuraCare.Modal.close();
          this.render();
        }
      });
    }

    AuraCare.Modal.open('Receipt Ledger Breakdown', modalBody, buttons);
  },

  openCreateInvoiceModal: function() {
    const patients = AuraCare.Store.getPatients().filter(p => !p.dischargeDate);
    const uniqueId = AuraCare.Utils.generateId('INV', AuraCare.Store.getBilling());
    
    // Clear list
    this.currentItems = [];

    const patientOptions = patients.map(p => `<option value="${p.id}|${p.name}">${p.name} (${p.id})</option>`).join('');

    const modalBody = document.createElement('div');
    modalBody.innerHTML = `
      <form id="create-invoice-form" class="form-grid">
        <div class="form-group">
          <label class="form-label" for="inv-id">Invoice ID</label>
          <input type="text" id="inv-id" class="form-control" value="${uniqueId}" readonly>
        </div>
        <div class="form-group">
          <label class="form-label" for="inv-patient">Billing Patient</label>
          <select id="inv-patient" class="form-control" required>
            <option value="">-- Choose Patient --</option>
            ${patientOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="inv-date">Billing Date</label>
          <input type="date" id="inv-date" class="form-control" value="${new Date().toISOString().substring(0,10)}" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="inv-duedate">Due Date</label>
          <input type="date" id="inv-duedate" class="form-control" required>
        </div>
      </form>

      <!-- Dynamic Item Builder Section -->
      <div class="card" style="margin-top:20px; padding:16px; background-color:hsla(224, 60%, 6%, 0.2);">
        <div class="card-title" style="font-size:0.9rem; margin-bottom:12px;"><i data-lucide="plus-circle" style="width:16px;color:var(--primary);"></i> Add Service Charge Line-Items</div>
        
        <div style="display:flex; gap:12px; margin-bottom:12px;">
          <input type="text" id="item-desc" class="form-control" style="font-size:0.8125rem;" placeholder="E.g., Consultation, General Ward stay (2 days)...">
          <input type="number" id="item-cost" class="form-control" style="font-size:0.8125rem; width:120px;" placeholder="Cost ($)">
          <button class="btn btn-secondary btn-sm" id="btn-add-item-row" style="font-size:0.75rem;"><i data-lucide="plus" style="width:12px;"></i> Add</button>
        </div>

        <table style="width:100%; border-collapse:collapse; margin-top:8px;" id="temp-items-table">
          <thead>
            <tr style="border-bottom:1px solid var(--border-color); text-align:left; font-size:0.75rem; text-transform:uppercase; color:var(--text-secondary);">
              <th style="padding:6px 0;">Description</th>
              <th style="padding:6px 0; text-align:right; width:100px;">Price</th>
              <th style="padding:6px 0; text-align:right; width:50px;">Remove</th>
            </tr>
          </thead>
          <tbody id="temp-items-body">
            <!-- Rows dynamically added -->
            <tr>
              <td colspan="3" style="text-align:center; padding:16px; font-size:0.8125rem; color:var(--text-muted);">No items added yet.</td>
            </tr>
          </tbody>
        </table>

        <div class="flex-between" style="border-top:1px solid var(--border-color); padding-top:12px; margin-top:12px; font-weight:700; font-size:0.9rem;">
          <span>Subtotal Charges:</span>
          <span id="temp-invoice-subtotal">$0.00</span>
        </div>
      </div>
    `;

    const updateTempTable = () => {
      const tbody = modalBody.querySelector('#temp-items-body');
      const subtotalEl = modalBody.querySelector('#temp-invoice-subtotal');
      
      if (this.currentItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:16px; font-size:0.8125rem; color:var(--text-muted);">No items added yet.</td></tr>`;
        subtotalEl.textContent = '$0.00';
        return;
      }

      tbody.innerHTML = this.currentItems.map((item, idx) => `
        <tr style="border-bottom:1px solid var(--border-color);">
          <td style="padding:8px 0; font-size:0.8125rem; color:var(--text-primary);">${item.description}</td>
          <td style="padding:8px 0; font-size:0.8125rem; text-align:right; font-weight:600; color:var(--text-primary);">${AuraCare.Utils.formatCurrency(item.cost)}</td>
          <td style="padding:8px 0; text-align:right;"><button type="button" class="btn-remove-temp-row" data-index="${idx}" style="color:var(--danger); cursor:pointer; font-weight:700;">×</button></td>
        </tr>
      `).join('');

      const total = this.currentItems.reduce((sum, item) => sum + item.cost, 0);
      subtotalEl.textContent = AuraCare.Utils.formatCurrency(total);

      // Bind deletes
      tbody.querySelectorAll('.btn-remove-temp-row').forEach(delBtn => {
        delBtn.addEventListener('click', () => {
          const idx = parseInt(delBtn.getAttribute('data-index'), 10);
          this.currentItems.splice(idx, 1);
          updateTempTable();
        });
      });
    };

    // Add item click listener
    modalBody.querySelector('#btn-add-item-row').addEventListener('click', (e) => {
      e.preventDefault();
      const descInput = modalBody.querySelector('#item-desc');
      const costInput = modalBody.querySelector('#item-cost');

      const description = descInput.value.trim();
      const cost = parseFloat(costInput.value);

      if (description && !isNaN(cost) && cost > 0) {
        this.currentItems.push({ description, cost });
        updateTempTable();
        descInput.value = '';
        costInput.value = '';
      } else {
        AuraCare.Toasts.warning('Enter valid description and positive numerical price.');
      }
    });

    AuraCare.Modal.open('Generate Bill Invoice', modalBody, [
      {
        text: 'Cancel',
        className: 'btn-secondary',
        onClick: () => AuraCare.Modal.close()
      },
      {
        text: '<i data-lucide="check"></i> Finalize Invoice',
        className: 'btn-primary',
        onClick: () => {
          const form = modalBody.querySelector('#create-invoice-form');
          if (form.reportValidity()) {
            if (this.currentItems.length === 0) {
              AuraCare.Toasts.warning('Please add at least one billable item line to create invoice.');
              return;
            }

            const patVal = document.getElementById('inv-patient').value.split('|');
            const date = document.getElementById('inv-date').value;
            const dueDate = document.getElementById('inv-duedate').value;
            const totalCost = this.currentItems.reduce((sum, item) => sum + item.cost, 0);

            const newInvoice = {
              id: uniqueId,
              patientId: patVal[0],
              patientName: patVal[1],
              date,
              dueDate,
              amount: totalCost,
              items: [...this.currentItems],
              status: 'pending'
            };

            AuraCare.Store.addInvoice(newInvoice);
            AuraCare.Toasts.success(`Invoice created for ${patVal[1]}`);
            AuraCare.Modal.close();
            this.render();
          }
        }
      }
    ]);
  }
};
