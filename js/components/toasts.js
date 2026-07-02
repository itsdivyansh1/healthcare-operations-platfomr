window.AuraCare = window.AuraCare || {};

AuraCare.Toasts = (function() {
  let container = null;

  function getContainer() {
    if (!container) {
      container = document.querySelector('.toasts-container');
      if (!container) {
        container = document.createElement('div');
        container.className = 'toasts-container';
        document.body.appendChild(container);
      }
    }
    return container;
  }

  function show(message, type = 'info', duration = 5000) {
    const parent = getContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Choose appropriate icon
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'warning') iconName = 'alert-triangle';
    if (type === 'error') iconName = 'heart-pulse'; // critical icon

    toast.innerHTML = `
      <i data-lucide="${iconName}" style="width: 18px; height: 18px;"></i>
      <div class="toast-message">${message}</div>
      <div class="toast-close"><i data-lucide="x" style="width: 14px; height: 14px;"></i></div>
    `;

    parent.appendChild(toast);
    
    // Refresh lucide icons in the toast
    if (window.lucide) {
      window.lucide.createIcons({
        attrs: {
          class: 'lucide-icon'
        },
        nameAttr: 'data-lucide',
        node: toast
      });
    }

    const remove = () => {
      toast.style.animation = 'slideInRight 0.3s reverse forwards';
      setTimeout(() => {
        toast.remove();
      }, 300);
    };

    // Close button
    toast.querySelector('.toast-close').addEventListener('click', (e) => {
      e.stopPropagation();
      remove();
    });

    // Auto-remove timer
    const timer = setTimeout(remove, duration);

    // Cancel timer on click
    toast.addEventListener('click', () => {
      clearTimeout(timer);
      remove();
    });
  }

  return {
    success: (msg) => show(msg, 'success'),
    warning: (msg) => show(msg, 'warning'),
    error: (msg) => show(msg, 'error'),
    info: (msg) => show(msg, 'info')
  };
})();
