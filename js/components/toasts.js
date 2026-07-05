const Toasts = {
  container: null,

  getContainer: function() {
    if (!this.container) {
      this.container = document.querySelector('.toasts-container');
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.className = 'toasts-container';
        document.body.appendChild(this.container);
      }
    }
    return this.container;
  },

  show: function(message, type = 'info', duration = 5000) {
    const parent = this.getContainer();
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
  },

  success: function(msg) { this.show(msg, 'success'); },
  warning: function(msg) { this.show(msg, 'warning'); },
  error: function(msg) { this.show(msg, 'error'); },
  info: function(msg) { this.show(msg, 'info'); }
};
