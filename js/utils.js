window.AuraCare = window.AuraCare || {};

AuraCare.Utils = {
  // Format currency
  formatCurrency: function(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  },

  // Format date string (YYYY-MM-DD -> Month DD, YYYY)
  formatDate: function(dateStr) {
    if (!dateStr) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  },

  // Calculate age from DOB
  calculateAge: function(dobStr) {
    if (!dobStr) return 0;
    const dob = new Date(dobStr);
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  },

  // Severity badge generator
  getSeverityBadge: function(severity) {
    let cssClass = '';
    let icon = '';
    switch (severity?.toLowerCase()) {
      case 'critical':
        cssClass = 'badge bg-danger-glow text-danger pulse-critical';
        icon = 'heart-pulse';
        break;
      case 'high':
        cssClass = 'badge bg-danger-glow text-danger';
        icon = 'alert-triangle';
        break;
      case 'medium':
        cssClass = 'badge bg-warning-glow text-warning';
        icon = 'alert-circle';
        break;
      case 'low':
      default:
        cssClass = 'badge bg-success-glow text-success';
        icon = 'check-circle';
        break;
    }
    return `<span class="${cssClass}"><i data-lucide="${icon}" style="width:12px;height:12px;margin-right:4px;"></i>${severity}</span>`;
  },

  // Ward display formatting
  getWardColorClass: function(ward) {
    switch (ward) {
      case 'ICU': return 'text-danger';
      case 'Emergency': return 'text-warning';
      case 'General Ward': return 'text-success';
      case 'Pediatrics': return 'text-info';
      default: return 'text-primary';
    }
  },

  // Unique ID generator
  generateId: function(prefix, list) {
    let max = 0;
    list.forEach(item => {
      const parts = item.id.split('-');
      if (parts.length > 1) {
        const num = parseInt(parts[1], 10);
        if (num > max) max = num;
      }
    });
    return `${prefix}-${String(max + 1).padStart(3, '0')}`;
  },

  // debounce for search boxes
  debounce: function(func, wait) {
    let timeout;
    return function(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};
