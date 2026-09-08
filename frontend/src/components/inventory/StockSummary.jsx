import { useTranslation } from 'react-i18next';

export default function StockSummary({ items, warehouses }) {
  const { t } = useTranslation();

  const totalItems = items.length;
  const totalStock = items.reduce((sum, i) => sum + i.stock, 0);
  const lowStockItems = items.filter(i => i.stock < (i.stock_minimo || 5));
  const totalValue = items.reduce((sum, i) => sum + (i.stock * i.precio), 0);

  const stats = [
    { label: t('dashboard.total_products'), value: totalItems, icon: '📦', color: 'blue' },
    { label: t('dashboard.total_stock'), value: totalStock, icon: '📊', color: 'green' },
    { label: t('dashboard.total_warehouses'), value: warehouses.length, icon: '🏭', color: 'purple' },
    { label: t('dashboard.low_stock'), value: lowStockItems.length, icon: '⚠️', color: 'red' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      {stats.map((stat) => (
        <div key={stat.label} className={`bg-white rounded-lg shadow p-6 border-l-4 border-${stat.color}-500`}>
          <div className="flex items-center">
            <div className={`p-3 bg-${stat.color}-100 rounded-full`}>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color === 'red' && stat.value > 0 ? 'text-red-600' : ''}`}>
                {stat.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}