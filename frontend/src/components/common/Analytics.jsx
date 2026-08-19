import React from 'react';
import { BarChart3, PieChart, AlertCircle } from 'lucide-react';

export default function Analytics({ hospitalRequests = [], stationCollections = [] }) {
  const hasRequests = hospitalRequests && hospitalRequests.length > 0;
  const hasCollections = stationCollections && stationCollections.length > 0;

  // Render Custom SVG Bar Chart for Hospital Requests
  const renderBarChart = () => {
    if (!hasRequests) {
      return (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
          No hospital requests data recorded yet.
        </div>
      );
    }

    const paddingLeft = 140;
    const paddingRight = 40;
    const paddingTop = 20;
    const paddingBottom = 20;
    const chartWidth = 480;
    const drawWidth = chartWidth - paddingLeft - paddingRight;

    // Find max value for scaling
    const maxVal = Math.max(...hospitalRequests.map(h => h.total_units), 5);

    // Dynamic Row layout calculations to prevent overlapping with high item counts
    const rowHeight = 36; 
    const chartHeight = paddingTop + paddingBottom + (hospitalRequests.length * rowHeight);

    return (
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height={chartHeight} style={{ overflow: 'visible' }}>
        {/* Y Axis Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const xPos = paddingLeft + drawWidth * ratio;
          const gridVal = Math.round(maxVal * ratio);
          return (
            <g key={idx}>
              <line 
                x1={xPos} y1={paddingTop - 5} 
                x2={xPos} y2={chartHeight - paddingBottom} 
                stroke="rgba(255,255,255,0.05)" 
                strokeDasharray="4,4" 
              />
              <text 
                x={xPos} y={chartHeight - paddingBottom + 14} 
                fill="var(--text-muted)" fontSize="9" textAnchor="middle" fontWeight="bold"
              >
                {gridVal}
              </text>
            </g>
          );
        })}

        {/* Render Bars */}
        {hospitalRequests.map((item, idx) => {
          const yPos = paddingTop + idx * rowHeight + (rowHeight - 16) / 2;
          const barWidth = (item.total_units / maxVal) * drawWidth;

          return (
            <g key={idx} className="chart-bar-group">
              {/* Hospital Name Label */}
              <text 
                x={paddingLeft - 10} y={yPos + 12} 
                fill="var(--text-secondary)" fontSize="10" fontWeight="600" textAnchor="end"
              >
                {item.hospital_name.length > 20 ? item.hospital_name.substring(0, 18) + '..' : item.hospital_name}
              </text>
              {/* Background trace bar */}
              <rect 
                x={paddingLeft} y={yPos} 
                width={drawWidth} height="16" 
                rx="4" fill="rgba(255,255,255,0.02)"
              />
              {/* Colored foreground bar */}
              <rect 
                x={paddingLeft} y={yPos} 
                width={barWidth || 2} height="16" 
                rx="4" fill="url(#crimsonGradient)" 
                style={{ transition: 'width 0.8s ease' }}
              />
              {/* Values label */}
              <text 
                x={paddingLeft + barWidth + 8} y={yPos + 12} 
                fill="var(--primary)" fontSize="10" fontWeight="bold"
              >
                {item.total_units} U
              </text>
            </g>
          );
        })}

        {/* Gradients */}
        <defs>
          <linearGradient id="crimsonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef233c" />
            <stop offset="100%" stopColor="#d90429" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
      <div className="glass-card">
        <h3>Hospital Request Load</h3>
        {renderBarChart()}
      </div>
    </div>
  );
}
