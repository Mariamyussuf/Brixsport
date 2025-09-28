'use client';

import React, { useEffect, useRef } from 'react';

interface AreaChartProps {
  data: Array<{ [key: string]: any }>;
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
  className?: string;
}

const AreaChart: React.FC<AreaChartProps> = ({
  data,
  xKey,
  yKey,
  color = '#10b981',
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
    const xValues = data.map(d => d[xKey]);
    const yValues = data.map(d => d[yKey]);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    const padding = 40;

    // Scale functions
    const xScale = (index: number) => (index / (data.length - 1)) * (width - 2 * padding) + padding;
    const yScale = (value: number) => height - padding - ((value - minY) / (maxY - minY)) * (height - 2 * padding);

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, `${color}40`);
    gradient.addColorStop(1, `${color}05`);

    // Draw area
    ctx.fillStyle = gradient;
    ctx.beginPath();

    // Start from bottom-left
    ctx.moveTo(padding, height - padding);

    // Draw line to first point
    data.forEach((point, index) => {
      const x = xScale(index);
      const y = yScale(point[yKey]);

      if (index === 0) {
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    // Draw line to bottom-right
    ctx.lineTo(width - padding, height - padding);
    ctx.closePath();
    ctx.fill();

    // Draw line on top
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    data.forEach((point, index) => {
      const x = xScale(index);
      const y = yScale(point[yKey]);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw points
    ctx.fillStyle = color;
    data.forEach((point, index) => {
      const x = xScale(index);
      const y = yScale(point[yKey]);

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

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

    // Vertical grid lines
    for (let i = 0; i < data.length; i++) {
      const x = xScale(i);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // Draw axes labels
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';

    // X-axis labels
    data.forEach((point, index) => {
      if (index % Math.ceil(data.length / 5) === 0 || index === data.length - 1) {
        const x = xScale(index);
        ctx.fillText(point[xKey], x, height - 10);
      }
    });

    // Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = minY + (i / 5) * (maxY - minY);
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

export default AreaChart;
