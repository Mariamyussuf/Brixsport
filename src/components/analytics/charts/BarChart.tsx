'use client';

import React, { useEffect, useRef } from 'react';

interface BarChartProps {
  data: Array<{ [key: string]: any }>;
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
  className?: string;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  xKey,
  yKey,
  color = '#8b5cf6',
  height = 300,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Calculate data range
    const yValues = data.map(d => d[yKey]);
    const maxY = Math.max(...yValues);
    const padding = 40;
    const barWidth = Math.max(20, (width - 2 * padding) / data.length * 0.8);
    const barSpacing = (width - 2 * padding) / data.length;

    // Draw grid lines
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i / 5) * (height - 2 * padding);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // Draw bars
    data.forEach((point, index) => {
      const barHeight = ((point[yKey] / maxY) * (height - 2 * padding));
      const x = padding + index * barSpacing + (barSpacing - barWidth) / 2;
      const y = height - padding - barHeight;

      // Bar shadow
      ctx.fillStyle = `${color}20`;
      ctx.fillRect(x + 2, y + 2, barWidth, barHeight);

      // Main bar
      ctx.fillStyle = color;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Bar border
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, barWidth, barHeight);
    });

    // Draw value labels on bars
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';

    data.forEach((point, index) => {
      const barHeight = ((point[yKey] / maxY) * (height - 2 * padding));
      const x = padding + index * barSpacing + barSpacing / 2;
      const y = height - padding - barHeight;

      if (barHeight > 30) { // Only show label if bar is tall enough
        ctx.fillText(point[yKey].toString(), x, y + barHeight / 2 + 4);
      }
    });

    // Draw x-axis labels
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';

    data.forEach((point, index) => {
      const x = padding + index * barSpacing + barSpacing / 2;
      ctx.fillText(point[xKey], x, height - 10);
    });

    // Draw y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = (i / 5) * maxY;
      const y = height - padding - (i / 5) * (height - 2 * padding);
      ctx.fillText(Math.round(value).toString(), padding - 10, y + 4);
    }

  }, [data, xKey, yKey, color, height]);

  return (
    <div className={`w-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: `${height}px` }}
        width="400"
        height={height}
      />
    </div>
  );
};

export default BarChart;
