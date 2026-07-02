window.AuraCare = window.AuraCare || {};

AuraCare.Charts = (function() {
  
  // Render a responsive Line/Area SVG chart
  function renderLineChart(containerId, data, labels, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 200;
    
    const paddingLeft = 35;
    const paddingRight = 15;
    const paddingTop = 15;
    const paddingBottom = 30;
    
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    
    const maxVal = Math.max(...data, 5) * 1.1; // Add 10% buffer
    const minVal = 0;
    
    // Scale coordinate helper
    const getX = (index) => paddingLeft + (index / (data.length - 1)) * chartWidth;
    const getY = (value) => height - paddingBottom - ((value - minVal) / (maxVal - minVal)) * chartHeight;
    
    // Generate grid lines and axis labels
    let gridHtml = '';
    const gridCount = 4;
    for (let i = 0; i <= gridCount; i++) {
      const yVal = minVal + (i / gridCount) * (maxVal - minVal);
      const yPos = getY(yVal);
      gridHtml += `
        <line x1="${paddingLeft}" y1="${yPos}" x2="${width - paddingRight}" y2="${yPos}" stroke="var(--border-color)" stroke-dasharray="4,4" stroke-width="1" />
        <text x="${paddingLeft - 8}" y="${yPos + 4}" fill="var(--text-muted)" font-size="10" font-family="var(--font-body)" text-anchor="end">${Math.round(yVal)}</text>
      `;
    }
    
    // Generate dates on X axis
    let xAxisHtml = '';
    labels.forEach((label, idx) => {
      const xPos = getX(idx);
      xAxisHtml += `
        <text x="${xPos}" y="${height - 10}" fill="var(--text-muted)" font-size="10" font-family="var(--font-body)" text-anchor="middle">${label}</text>
      `;
    });
    
    // Build path coordinates
    let pathPoints = '';
    let areaPoints = `M ${getX(0)} ${height - paddingBottom} `;
    
    data.forEach((val, idx) => {
      const x = getX(idx);
      const y = getY(val);
      pathPoints += `${idx === 0 ? 'M' : 'L'} ${x} ${y} `;
      areaPoints += `L ${x} ${y} `;
    });
    
    areaPoints += `L ${getX(data.length - 1)} ${height - paddingBottom} Z`;
    
    // Interactive dots
    let dotsHtml = '';
    data.forEach((val, idx) => {
      const x = getX(idx);
      const y = getY(val);
      dotsHtml += `
        <circle cx="${x}" cy="${y}" r="4" fill="var(--bg-app)" stroke="${options.strokeColor || 'var(--primary)'}" stroke-width="2" class="chart-point" data-value="${val}" data-label="${labels[idx]}" style="cursor:pointer;transition: r 0.1s ease; outline:none;" />
      `;
    });
    
    // Put together SVG
    const svgId = `${containerId}-svg`;
    const gradId = `${containerId}-gradient`;
    
    const svgContent = `
      <svg id="${svgId}" width="100%" height="100%" viewBox="0 0 ${width} ${height}" style="overflow:visible;">
        <defs>
          <linearGradient id="${gradId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${options.strokeColor || 'var(--primary)'}" stop-opacity="0.3" />
            <stop offset="100%" stop-color="${options.strokeColor || 'var(--primary)'}" stop-opacity="0" />
          </linearGradient>
        </defs>
        ${gridHtml}
        ${xAxisHtml}
        <!-- Fill Area -->
        <path d="${areaPoints}" fill="url(#${gradId})" />
        <!-- Stroke Line -->
        <path d="${pathPoints}" fill="none" stroke="${options.strokeColor || 'var(--primary)'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        <!-- Dots -->
        ${dotsHtml}
      </svg>
      <div class="svg-chart-tooltip" id="${containerId}-tooltip"></div>
    `;
    
    container.innerHTML = svgContent;
    
    // Set up hover tooltips
    const svgEl = container.querySelector('svg');
    const tooltip = container.querySelector('.svg-chart-tooltip');
    
    const points = svgEl.querySelectorAll('.chart-point');
    points.forEach(point => {
      point.addEventListener('mouseenter', (e) => {
        point.setAttribute('r', '7');
        const val = point.getAttribute('data-value');
        const lbl = point.getAttribute('data-label');
        
        // Show tooltip
        tooltip.innerHTML = `<strong>${lbl}</strong>: ${val} ${options.unit || ''}`;
        tooltip.style.opacity = '1';
        
        // Position tooltip
        const rect = container.getBoundingClientRect();
        const ptRect = point.getBoundingClientRect();
        const xPos = ptRect.left - rect.left - tooltip.clientWidth / 2 + 5;
        const yPos = ptRect.top - rect.top - tooltip.clientHeight - 8;
        
        tooltip.style.left = `${xPos}px`;
        tooltip.style.top = `${yPos}px`;
      });
      
      point.addEventListener('mouseleave', () => {
        point.setAttribute('r', '4');
        tooltip.style.opacity = '0';
      });
    });
  }

  // Render a simple segment-based Donut SVG
  function renderDonutChart(containerId, dataset, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const width = 160;
    const height = 160;
    const radius = 60;
    const strokeWidth = 14;
    const cx = width / 2;
    const cy = height / 2;
    const circumference = 2 * Math.PI * radius;

    const total = Object.values(dataset).reduce((a, b) => a + b, 0);
    
    let segmentsHtml = '';
    let accumulatedAngle = -90; // Start at 12 o'clock

    const keys = Object.keys(dataset);
    const colors = options.colors || [
      'var(--primary)',
      'var(--secondary)',
      'var(--accent)',
      'var(--warning)',
      'var(--success)',
      'var(--danger)'
    ];

    keys.forEach((key, idx) => {
      const val = dataset[key];
      if (val === 0) return;
      
      const percentage = val / total;
      const strokeLength = percentage * circumference;
      const strokeOffset = circumference - strokeLength;
      
      const color = colors[idx % colors.length];
      
      // Calculate coordinates for legend list if needed, or inline segments
      segmentsHtml += `
        <circle cx="${cx}" cy="${cy}" r="${radius}" 
          fill="transparent" 
          stroke="${color}" 
          stroke-width="${strokeWidth}" 
          stroke-dasharray="${circumference}" 
          stroke-dashoffset="${strokeOffset}" 
          transform="rotate(${accumulatedAngle} ${cx} ${cy})"
          stroke-linecap="round"
          class="donut-segment"
          data-label="${key}"
          data-value="${val}"
          style="transition: stroke-width 0.1s ease; cursor:pointer;"
        />
      `;
      
      // Accumulate angle (convert percentage to degrees)
      accumulatedAngle += percentage * 360;
    });

    // Create Legend markup
    let legendHtml = '<div class="chart-legend" style="display:flex; flex-direction:column; gap:8px; justify-content:center; padding-left:16px;">';
    keys.forEach((key, idx) => {
      const color = colors[idx % colors.length];
      const val = dataset[key];
      const percent = total > 0 ? Math.round((val / total) * 100) : 0;
      legendHtml += `
        <div style="display:flex; align-items:center; gap:8px; font-size:0.8125rem;">
          <span style="width:10px; height:10px; background-color:${color}; border-radius:50%; display:inline-block;"></span>
          <span style="color:var(--text-secondary); font-weight:500;">${key}:</span>
          <strong style="color:var(--text-primary); margin-left:auto;">${val} (${percent}%)</strong>
        </div>
      `;
    });
    legendHtml += '</div>';

    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';

    container.innerHTML = `
      <div style="position:relative; width:${width}px; height:${height}px; flex-shrink:0;">
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
          <circle cx="${cx}" cy="${cy}" r="${radius}" fill="transparent" stroke="var(--border-color)" stroke-width="${strokeWidth}" />
          ${segmentsHtml}
        </svg>
        <div style="position:absolute; top:0; left:0; right:0; bottom:0; display:flex; flex-direction:column; align-items:center; justify-content:center; pointer-events:none;">
          <span style="font-size:1.5rem; font-weight:700; font-family:var(--font-heading); color:var(--text-primary); line-height:1;">${total}</span>
          <span style="font-size:0.6875rem; text-transform:uppercase; color:var(--text-muted); font-weight:600; margin-top:2px;">${options.centerText || 'Total'}</span>
        </div>
      </div>
      ${legendHtml}
      <div class="svg-chart-tooltip" id="${containerId}-tooltip"></div>
    `;

    // Tooltip logic for Donut Segments
    const tooltip = container.querySelector('.svg-chart-tooltip');
    const segments = container.querySelectorAll('.donut-segment');
    
    segments.forEach(seg => {
      seg.addEventListener('mouseenter', (e) => {
        seg.setAttribute('stroke-width', `${strokeWidth + 3}`);
        const label = seg.getAttribute('data-label');
        const val = seg.getAttribute('data-value');
        
        tooltip.innerHTML = `<strong>${label}</strong>: ${val}`;
        tooltip.style.opacity = '1';
        
        const rect = container.getBoundingClientRect();
        tooltip.style.left = `${width / 2 - tooltip.clientWidth / 2}px`;
        tooltip.style.top = `${height + 5}px`;
      });
      
      seg.addEventListener('mouseleave', () => {
        seg.setAttribute('stroke-width', `${strokeWidth}`);
        tooltip.style.opacity = '0';
      });
    });
  }

  // Circular gauge for key metrics (e.g. 78% Occupancy)
  function renderGauge(containerId, value, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const width = 120;
    const height = 120;
    const radius = 45;
    const strokeWidth = 10;
    const cx = width / 2;
    const cy = height / 2;
    const circumference = 2 * Math.PI * radius;

    const strokeOffset = circumference - (value / 100) * circumference;
    const color = options.color || 'var(--secondary)';

    container.innerHTML = `
      <div style="position:relative; width:${width}px; height:${height}px; margin: 0 auto;">
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
          <circle cx="${cx}" cy="${cy}" r="${radius}" fill="transparent" stroke="var(--border-color)" stroke-width="${strokeWidth}" />
          <circle cx="${cx}" cy="${cy}" r="${radius}" 
            fill="transparent" 
            stroke="${color}" 
            stroke-width="${strokeWidth}" 
            stroke-dasharray="${circumference}" 
            stroke-dashoffset="${strokeOffset}" 
            transform="rotate(-90 ${cx} ${cy})"
            stroke-linecap="round"
            style="filter: drop-shadow(0 0 4px ${color}55);"
          />
        </svg>
        <div style="position:absolute; top:0; left:0; right:0; bottom:0; display:flex; flex-direction:column; align-items:center; justify-content:center;">
          <span style="font-size:1.25rem; font-weight:700; font-family:var(--font-heading); color:var(--text-primary);">${value}%</span>
          <span style="font-size:0.625rem; text-transform:uppercase; color:var(--text-muted); font-weight:600; text-align:center; padding: 0 8px;">${options.labelText || 'Status'}</span>
        </div>
      </div>
    `;
  }

  return {
    renderLineChart,
    renderDonutChart,
    renderGauge
  };
})();
