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

export function DataChart({ 
  data, 
  type = 'line', 
  title, 
  height = 200,
  colors = ['#2563EB', '#059669', '#F59E0B', '#EF4444']
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
          backgroundColor: type === 'doughnut' ? colors : colors[0] + '20',
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
              color: '#f1f5f9'
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
