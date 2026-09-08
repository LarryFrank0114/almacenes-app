import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function StockFilters({ warehouses, onApplyFilters }) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    search: '',
    almacen_id: '',
    categoria: '',
    stock_min: '',
    stock_max: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onApplyFilters(filters);
  };

  const handleReset = () => {
    const resetFilters = {
      search: '',
      almacen_id: '',
      categoria: '',
      stock_min: '',
      stock_max: ''
    };
    setFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <input
          type="text"
          placeholder={t('products.search')}
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        
        <select
          value={filters.almacen_id}
          onChange={(e) => setFilters({...filters, almacen_id: e.target.value})}
          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Todos los almacenes</option>
          {warehouses.map(w => (
            <option key={w.id} value={w.id}>{w.nombre}</option>
          ))}
        </select>
        
        <input
          type="text"
          placeholder="Categoría"
          value={filters.categoria}
          onChange={(e) => setFilters({...filters, categoria: e.target.value})}
          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Stock min"
            value={filters.stock_min}
            onChange={(e) => setFilters({...filters, stock_min: e.target.value})}
            className="border rounded-lg px-4 py-2 w-1/2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <input
            type="number"
            placeholder="Stock max"
            value={filters.stock_max}
            onChange={(e) => setFilters({...filters, stock_max: e.target.value})}
            className="border rounded-lg px-4 py-2 w-1/2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            🔍 {t('products.apply_filters')}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ↻
          </button>
        </div>
      </div>
    </form>
  );
}