const BillingView = {
  currentItems: [], // Temporary storage for invoice creation
  currentStatusFilter: 'all', // Active table filter state

  init: function() {
    this.updateFinancialSummary();
    this.bindEvents();
    this.renderInvoices();
  },

  updateFinancialSummary: function() {
    const bills = Store.getBilling();
    const totalInvoiced = bills.reduce((sum, b) => sum + b.amount, 0);
    const paidBills = bills.filter(b => b.status === 'paid');
    const totalCollected = paidBills.reduce((sum, b) => sum + b.amount, 0);
    const pendingBills = bills.filter(b => b.status === 'pending' || b.status === 'overdue');
    const totalOutstanding = pendingBills.reduce((sum, b) => sum + b.amount, 0);
    const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

    // Update static DOM elements
    const valTotalEl = document.getElementById('val-total-invoiced');
    const valCollectedEl = document.getElementById('val-collected');
    const valOutstandingEl = document.getElementById('val-outstanding');
    const valCountEl = document.getElementById('val-invoices-count');
    const rateEl = document.getElementById('val-collection-rate');

    if (valTotalEl) valTotalEl.textContent = Utils.formatCurrency(totalInvoiced);
    if (valCollectedEl) valCollectedEl.textContent = Utils.formatCurrency(totalCollected);
    if (valOutstandingEl) valOutstandingEl.textContent = Utils.formatCurrency(totalOutstanding);
    if (valCountEl) valCountEl.textContent = bills.length;
    if (rateEl) rateEl.textContent = `${collectionRate}% Collection Rate`;

    // Apply active card highlights
    const cardAll = document.getElementById('bill-card-all');
    const cardPaid = document.getElementById('bill-card-paid');
    const cardPending = document.getElementById('bill-card-pending');
    const cardCount = document.getElementById('bill-card-count');

    if (cardAll && cardPaid && cardPending && cardCount) {
      // Clear borders
      [cardAll, cardPaid, cardPending, cardCount].forEach(c => {
        c.style.borderColor = 'var(--border-color)';
        c.style.boxShadow = 'var(--shadow-sm)';
      });

      if (this.currentStatusFilter === 'all') {
        cardAll.style.borderColor = 'var(--primary)';
        cardAll.style.boxShadow = '0 0 0 2px var(--primary-glow)';
        cardCount.style.borderColor = 'var(--primary)';
        cardCount.style.boxShadow = '0 0 0 2px var(--primary-glow)';
      } else if (this.currentStatusFilter === 'paid') {
        cardPaid.style.borderColor = 'var(--success)';
        cardPaid.style.boxShadow = '0 0 0 2px var(--success-glow)';
      } else if (this.currentStatusFilter === 'pending') {
        cardPending.style.borderColor = 'var(--warning)';
        cardPending.style.boxShadow = '0 0 0 2px var(--warning-glow)';
      }
    }
  },

  bindEvents: function() {
    const btnCreate = document.getElementById('btn-create-invoice');
    if (btnCreate) {
      const newBtnCreate = btnCreate.cloneNode(true);
      btnCreate.parentNode.replaceChild(newBtnCreate, btnCreate);
      newBtnCreate.addEventListener('click', () => {
        this.openCreateInvoiceModal();
      });
    }

    // Wire Card Click Filters
    const cardAll = document.getElementById('bill-card-all');
    const cardPaid = document.getElementById('bill-card-paid');
    const cardPending = document.getElementById('bill-card-pending');
    const cardCount = document.getElementById('bill-card-count');

    if (cardAll) {
      cardAll.onclick = () => {
        this.currentStatusFilter = 'all';
        this.updateFinancialSummary();
        this.renderInvoices();
      };
    }
    if (cardCount) {
      cardCount.onclick = () => {
        this.currentStatusFilter = 'all';
        this.updateFinancialSummary();
        this.renderInvoices();
      };
    }
    if (cardPaid) {
      cardPaid.onclick = () => {
        this.currentStatusFilter = 'paid';
        this.updateFinancialSummary();
        this.renderInvoices();
      };
    }
    if (cardPending) {
      cardPending.onclick = () => {
        this.currentStatusFilter = 'pending';
        this.updateFinancialSummary();
        this.renderInvoices();
      };
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  renderInvoices: function() {
    const tableBody = document.getElementById('billing-table-body');
    if (!tableBody) return;

    let bills = Store.getBilling();

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
            No invoices registered under this status.
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons({ node: tableBody });
      return;
    }

    tableBody.innerHTML = bills.map(b => {
      let statusBadge = 'bg-warning-glow text-warning';
      if (b.status === 'paid') statusBadge = 'bg-success-glow text-success';
      if (b.status === 'overdue') statusBadge = 'bg-danger-glow text-danger';

      const actionBtn = b.status !== 'paid' 
        ? `<button class="btn btn-primary btn-sm flex-center btn-pay-bill" data-id="${b.id}"><i data-lucide="credit-card" style="width:12px;height:12px;"></i> Process Payment</button>`
        : `<button class="btn btn-secondary btn-sm flex-center btn-view-receipt" data-id="${b.id}"><i data-lucide="printer" style="width:12px;height:12px;"></i> View Receipt</button>`;

      return `
        <tr>
          <td class="nowrap"><span style="font-family:monospace;font-weight:600;font-size:0.8rem;background-color:var(--bg-app);padding:4px 8px;border-radius:4px;border:1px solid var(--border-color);">${b.id}</span></td>
          <td>
            <div style="font-weight:600;">${b.patientName}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">ID: ${b.patientId}</div>
          </td>
          <td><strong>${Utils.formatCurrency(b.amount)}</strong></td>
          <td>${b.date}</td>
          <td>${b.dueDate}</td>
          <td><span class="badge ${statusBadge}">${b.status.toUpperCase()}</span></td>
          <td style="text-align:right;">
            <div style="display:flex; gap:6px; justify-content:flex-end;">
              ${actionBtn}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tableBody.querySelectorAll('.btn-pay-bill').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm(`Authorize financial settlement for Invoice ${id}?`)) {
          Store.payInvoice(id);
          Toasts.success('Payment successfully processed.');
          this.init(); // Refresh summaries & list
        }
      });
    });

    tableBody.querySelectorAll('.btn-view-receipt').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.openReceiptModal(id);
      });
    });

    if (window.lucide) {
      window.lucide.createIcons({ node: tableBody });
    }
  },

  openCreateInvoiceModal: function() {
    const patients = Store.getPatients().filter(p => !p.dischargeDate && p.billingStatus === 'unbilled');
    const uniqueId = Utils.generateId('INV', Store.getBilling());

    if (patients.length === 0) {
      Modal.open('Create Invoice', `
        <div style="text-align:center; padding:16px; color:var(--text-muted); font-size:0.85rem;">
          <i data-lucide="check" style="width:32px; height:32px; margin-bottom:8px; color:var(--success); display:block; margin:0 auto 8px auto;"></i>
          <p>No active unbilled patients waiting in the directory.</p>
        </div>
      `, [
        {
          text: 'Close',
          className: 'btn-secondary',
          onClick: () => Modal.close()
        }
      ]);
      return;
    }

    const patientOptions = patients.map(p => `<option value="${p.id}|${p.name}">${p.name} (${p.id})</option>`).join('');

    const modalBody = `
      <form id="create-invoice-form" class="form-grid">
        <div class="form-group">
          <label class="form-label" for="inv-id">Invoice ID</label>
          <input type="text" id="inv-id" class="form-control" value="${uniqueId}" readonly>
        </div>
        <div class="form-group">
          <label class="form-label" for="inv-patient">Awaiting Patient Profile</label>
          <select id="inv-patient" class="form-control" required>
            <option value="">-- Select Patient Profile --</option>
            ${patientOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="inv-dueDate">Payment Due Date</label>
          <input type="date" id="inv-dueDate" class="form-control" required>
        </div>
        
        <div class="form-group full-width" style="border-top:1px solid var(--border-color); padding-top:12px; margin-bottom: 0;">
          <label class="form-label">Ledger Bill Items</label>
          <div style="display:flex; gap:8px; margin-bottom:12px;">
            <input type="text" id="inv-item-desc" class="form-control" style="flex:2;" placeholder="Routine ICU Bed Charges...">
            <input type="number" id="inv-item-cost" class="form-control" style="flex:1;" placeholder="Amount ($)...">
            <button type="button" class="btn btn-secondary btn-sm" id="btn-add-inv-item"><i data-lucide="plus"></i> Add Item</button>
          </div>
          <table class="data-table" style="font-size:0.75rem;">
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align:right;">Cost</th>
                <th style="text-align:right; width:40px;">Remove</th>
              </tr>
            </thead>
            <tbody id="invoice-items-tbody">
              <tr>
                <td colspan="3" style="text-align:center; color:var(--text-muted); font-style:italic;">No billing items added yet.</td>
              </tr>
            </tbody>
          </table>
          <div style="text-align:right; font-weight:700; margin-top:8px; font-size:0.85rem;" id="invoice-items-total">Total Bill: $0.00</div>
        </div>
      </form>
    `;

    this.currentItems = [];

    Modal.open('Create New Invoice', modalBody, [
      {
        text: 'Cancel',
        className: 'btn-secondary',
        onClick: () => Modal.close()
      },
      {
        text: '<i data-lucide="check"></i> Finalize Invoice',
        className: 'btn-primary',
        onClick: () => {
          const form = document.getElementById('create-invoice-form');
          if (form.reportValidity()) {
            if (this.currentItems.length === 0) {
              alert('Please add at least one ledger billing item before finalization.');
              return;
            }

            const patVal = document.getElementById('inv-patient').value;
            const [patId, patName] = patVal.split('|');
            const dueDate = document.getElementById('inv-dueDate').value;
            const totalAmount = this.currentItems.reduce((sum, item) => sum + item.cost, 0);

            const newInvoice = {
              id: uniqueId,
              patientId: patId,
              patientName: patName,
              amount: totalAmount,
              date: new Date().toISOString().substring(0, 10),
              dueDate,
              status: 'pending',
              items: this.currentItems
            };

            Store.addInvoice(newInvoice);
            Toasts.success(`Invoice ${uniqueId} generated successfully.`);
            Modal.close();
            this.init(); // RefreshSummaries & list
          }
        }
      }
    ]);

    // Bind inside add-item triggers
    const addBtn = document.getElementById('btn-add-inv-item');
    const descInput = document.getElementById('inv-item-desc');
    const costInput = document.getElementById('inv-item-cost');
    const itemsTbody = document.getElementById('invoice-items-tbody');
    const totalEl = document.getElementById('invoice-items-total');

    if (addBtn) {
      addBtn.onclick = () => {
        const desc = descInput.value.trim();
        const cost = parseFloat(costInput.value);

        if (desc && !isNaN(cost) && cost > 0) {
          this.currentItems.push({ desc, cost });
          
          // Re-render items
          itemsTbody.innerHTML = this.currentItems.map((item, idx) => `
            <tr>
              <td>${item.desc}</td>
              <td style="text-align:right;">${Utils.formatCurrency(item.cost)}</td>
              <td style="text-align:right;"><button type="button" class="btn-del-item" data-idx="${idx}" style="color:var(--danger); cursor:pointer; background:none; border:none; font-weight:700;">×</button></td>
            </tr>
          `).join('');

          // Update total
          const sum = this.currentItems.reduce((s, i) => s + i.cost, 0);
          totalEl.textContent = `Total Bill: ${Utils.formatCurrency(sum)}`;

          // Clear inputs
          descInput.value = '';
          costInput.value = '';

          // Bind inside item delete clicks
          itemsTbody.querySelectorAll('.btn-del-item').forEach(btn => {
            btn.onclick = () => {
              const idx = parseInt(btn.getAttribute('data-idx'), 10);
              this.currentItems.splice(idx, 1);
              
              if (this.currentItems.length === 0) {
                itemsTbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted); font-style:italic;">No billing items added yet.</td></tr>`;
                totalEl.textContent = `Total Bill: $0.00`;
              } else {
                btn.click(); // Re-trigger mapping
              }
            };
          });
        }
      };
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  openReceiptModal: function(invoiceId) {
    const bills = Store.getBilling();
    const bill = bills.find(b => b.id === invoiceId);
    if (!bill) return;

    const itemsHtml = (bill.items || []).map(item => `
      <div class="flex-between" style="font-size:0.8rem; border-bottom:1px dashed var(--border-color); padding:4px 0;">
        <span>${item.desc}</span>
        <span style="font-family:monospace;">${Utils.formatCurrency(item.cost)}</span>
      </div>
    `).join('');

    const modalBody = `
      <div style="font-family:var(--font-body); padding:8px 0;">
        <div style="text-align:center; border-bottom:2px solid var(--border-color); padding-bottom:16px; margin-bottom:16px;">
          <h4 style="font-size:1.15rem; font-weight:700; color:var(--text-primary);">OpsCare General Hospital</h4>
          <span style="font-size:0.75rem; color:var(--text-secondary);">100 Operations Blvd, Sector 4 &bull; Billing Receipt</span>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; font-size:0.785rem; margin-bottom:16px;">
          <div>
            <span style="color:var(--text-secondary); display:block;">PATIENT NAME:</span>
            <strong>${bill.patientName} (ID: ${bill.patientId})</strong>
          </div>
          <div style="text-align:right;">
            <span style="color:var(--text-secondary); display:block;">INVOICE REFERENCE:</span>
            <strong>${bill.id}</strong>
          </div>
          <div>
            <span style="color:var(--text-secondary); display:block;">DATE ISSUED:</span>
            <span>${bill.date}</span>
          </div>
          <div style="text-align:right;">
            <span style="color:var(--text-secondary); display:block;">SETTLEMENT DATE:</span>
            <span>${new Date().toISOString().substring(0, 10)}</span>
          </div>
        </div>

        <div class="card" style="padding:12px; background-color:var(--bg-app); margin-bottom:16px;">
          <span style="font-size:0.75rem; font-weight:600; text-transform:uppercase; color:var(--text-secondary); display:block; margin-bottom:8px; border-bottom:1px solid var(--border-color); padding-bottom:4px;">Billing Breakdown</span>
          ${itemsHtml}
          <div class="flex-between" style="font-size:0.95rem; font-weight:700; margin-top:12px; border-top:1px solid var(--border-color); padding-top:8px;">
            <span>Grand Total Settled:</span>
            <span style="color:var(--success); font-family:monospace;">${Utils.formatCurrency(bill.amount)}</span>
          </div>
        </div>

        <div style="text-align:center; color:var(--text-muted); font-size:0.7rem; margin-top:20px; border-top:1px dashed var(--border-color); padding-top:12px;">
          <p><i data-lucide="shield-check" style="width:12px; vertical-align:middle; color:var(--success); margin-right:4px;"></i> Transaction officially finalized under ledger ID: ${bill.id}.</p>
          <p style="margin-top:2px;">OpsCare Financial Security Protocol Secured.</p>
        </div>
      </div>
    `;

    Modal.open('Billing Receipt', modalBody, [
      {
        text: 'Print Receipt',
        className: 'btn-primary',
        onClick: () => {
          window.print();
        }
      },
      {
        text: 'Close',
        className: 'btn-secondary',
        onClick: () => Modal.close()
      }
    ]);
  }
};
