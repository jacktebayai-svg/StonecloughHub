import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface DataPoint {
  label: string;
  value: number;
}

interface DataChartProps {
  data: DataPoint[];
  type?: 'line' | 'bar' | 'doughnut';
  title?: string;
  height?: number;
  colors?: string[];
}

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export function DataChart({ 
  data, 
  type = 'line', 
  title, 
  height = 200,
  colors = ['#254974', '#a2876f', '#587492', '#dd6b20', '#ecc94b']
}: DataChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy previous chart if it exists
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    chartRef.current = new Chart(ctx, {
      type,
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          label: title || 'Data',
          data: data.map(d => d.value),
          backgroundColor: type === 'doughnut' ? colors : hexToRgba(colors[0], 0.2),
          borderColor: colors[0],
          borderWidth: 2,
          tension: 0.4,
          fill: type === 'line'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: type === 'doughnut',
            position: 'bottom'
          },
          title: {
            display: !!title,
            text: title
          }
        },
        scales: type !== 'doughnut' ? {
          y: {
            beginAtZero: true,
            grid: {
              color: '#f7fafc'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        } : undefined
      }
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data, type, title, colors]);

  return (
    <div style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}