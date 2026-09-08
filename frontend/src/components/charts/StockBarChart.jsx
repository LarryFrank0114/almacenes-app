import { Bar } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';

export default function StockBarChart({ warehouses, items }) {
  const { t } = useTranslation();

  const data = {
    labels: warehouses.map(w => w.nombre),
    datasets: [
      {
        label: 'Stock Total',
        data: warehouses.map(w => 
          items.filter(i => i.almacen_id === w.id).reduce((sum, i) => sum + i.stock, 0)
        ),
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        borderRadius: 8,
      },
      {
        label: 'Stock Mínimo',
        data: warehouses.map(w => 
          items.filter(i => i.almacen_id === w.id).reduce((sum, i) => sum + (i.stock_minimo || 5), 0)
        ),
        backgroundColor: '#e5e7eb',
        borderRadius: 8,
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: t('dashboard.stock_by_warehouse')
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 10
        }
      }
    }
  };

  return <Bar data={data} options={options} />;
}