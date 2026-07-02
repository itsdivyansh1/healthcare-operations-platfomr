window.AuraCare = window.AuraCare || {};

AuraCare.Modal = (function() {
  let overlay = null;
  let wrapper = null;
  let titleEl = null;
  let bodyEl = null;
  let footerEl = null;
  let initialized = false;

  function init() {
    if (initialized) return;

    overlay = document.querySelector('.modal-overlay');
    if (!overlay || !overlay.querySelector('.modal-wrapper')) {
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);
      }
      overlay.innerHTML = `
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

    wrapper = overlay.querySelector('.modal-wrapper');
    titleEl = overlay.querySelector('.modal-title');
    bodyEl = overlay.querySelector('.modal-body');
    footerEl = overlay.querySelector('.modal-footer');

    // Close events
    overlay.querySelector('.modal-close').addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) {
        close();
      }
    });

    initialized = true;
  }

  function open(title, contentHtml, buttons = []) {
    init();

    // Set title
    titleEl.textContent = title;

    // Set body content (string or HTML element)
    if (typeof contentHtml === 'string') {
      bodyEl.innerHTML = contentHtml;
    } else {
      bodyEl.innerHTML = '';
      bodyEl.appendChild(contentHtml);
    }

    // Set footer buttons
    footerEl.innerHTML = '';
    if (buttons.length === 0) {
      footerEl.style.display = 'none';
    } else {
      footerEl.style.display = 'flex';
      buttons.forEach(btnConfig => {
        const btn = document.createElement('button');
        btn.className = `btn ${btnConfig.className || 'btn-secondary'}`;
        btn.innerHTML = btnConfig.text;
        btn.addEventListener('click', (e) => {
          btnConfig.onClick(e, this);
        });
        footerEl.appendChild(btn);
      });
    }

    // Open transition
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Render Lucide icons inside modal
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  return {
    open,
    close
  };
})();
