'use client';

import React, { useEffect, useRef } from 'react';

interface PieChartProps {
  data: Array<{ [key: string]: any }>;
  labelKey: string;
  valueKey: string;
  colors?: string[];
  height?: number;
  className?: string;
}

const PieChart: React.FC<PieChartProps> = ({
  data,
  labelKey,
  valueKey,
  colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
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
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;

    // Calculate total value
    const total = data.reduce((sum, item) => sum + item[valueKey], 0);

    // Draw pie slices
    let startAngle = -Math.PI / 2; // Start from top

    data.forEach((item, index) => {
      const value = item[valueKey];
      const sliceAngle = (value / total) * 2 * Math.PI;

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();

      // Fill slice
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();

      // Draw slice border
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Calculate label position
      const labelAngle = startAngle + sliceAngle / 2;
      const labelRadius = radius * 0.7;
      const labelX = centerX + Math.cos(labelAngle) * labelRadius;
      const labelY = centerY + Math.sin(labelAngle) * labelRadius;

      // Draw percentage label
      const percentage = Math.round((value / total) * 100);
      if (percentage > 5) { // Only show labels for slices > 5%
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${percentage}%`, labelX, labelY);
      }

      startAngle += sliceAngle;
    });

    // Draw center circle (donut style)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.3, 0, 2 * Math.PI);
    ctx.fillStyle = '#1f2937';
    ctx.fill();

  }, [data, labelKey, valueKey, colors, height]);

  return (
    <div className={`w-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: `${height}px` }}
        width="400"
        height={height}
      />

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="text-sm text-gray-300">
              {item[labelKey]} ({item[valueKey]})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PieChart;
