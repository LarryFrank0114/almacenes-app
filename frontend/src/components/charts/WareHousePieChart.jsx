import { Pie } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';

export default function WarehousePieChart({ items }) {
  const { t } = useTranslation();

  const categories = [...new Set(items.map(i => i.categoria).filter(Boolean))];
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
  ];

  const data = {
    labels: categories,
    datasets: [
      {
        data: categories.map(cat => 
          items.filter(i => i.categoria === cat).length
        ),
        backgroundColor: colors.slice(0, categories.length),
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: t('dashboard.category_distribution')
      }
    }
  };

  return <Pie data={data} options={options} />;
}