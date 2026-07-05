const Modal = {
  overlay: null,
  wrapper: null,
  titleEl: null,
  bodyEl: null,
  footerEl: null,
  initialized: false,

  init: function() {
    if (this.initialized) return;

    this.overlay = document.querySelector('.modal-overlay');
    if (!this.overlay || !this.overlay.querySelector('.modal-wrapper')) {
      if (!this.overlay) {
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';
        document.body.appendChild(this.overlay);
      }
      this.overlay.innerHTML = `
        <div class="modal-wrapper">
          <div class="modal-header flex-between">
            <h3 class="modal-title">Modal Title</h3>
            <button class="modal-close flex-center" style="cursor:pointer;color:var(--text-secondary);"><i data-lucide="x" style="width:20px;height:20px;"></i></button>
          </div>
          <div class="modal-body"></div>
          <div class="modal-footer"></div>
        </div>
      `;
    }

    this.wrapper = this.overlay.querySelector('.modal-wrapper');
    this.titleEl = this.overlay.querySelector('.modal-title');
    this.bodyEl = this.overlay.querySelector('.modal-body');
    this.footerEl = this.overlay.querySelector('.modal-footer');

    // Close events
    this.overlay.querySelector('.modal-close').addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay.classList.contains('open')) {
        this.close();
      }
    });

    this.initialized = true;
  },

  open: function(title, contentHtml, buttons = []) {
    this.init();

    // Set title
    this.titleEl.textContent = title;

    // Set body content (string or HTML element)
    if (typeof contentHtml === 'string') {
      this.bodyEl.innerHTML = contentHtml;
    } else {
      this.bodyEl.innerHTML = '';
      this.bodyEl.appendChild(contentHtml);
    }

    // Set footer buttons
    this.footerEl.innerHTML = '';
    if (buttons.length === 0) {
      this.footerEl.style.display = 'none';
    } else {
      this.footerEl.style.display = 'flex';
      buttons.forEach(btnConfig => {
        const btn = document.createElement('button');
        btn.className = `btn ${btnConfig.className || 'btn-secondary'}`;
        btn.innerHTML = btnConfig.text;
        btn.addEventListener('click', (e) => {
          btnConfig.onClick(e, this);
        });
        this.footerEl.appendChild(btn);
      });
    }

    // Open transition
    this.overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Render Lucide icons inside modal
    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  close: function() {
    if (!this.overlay) return;
    this.overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
};
