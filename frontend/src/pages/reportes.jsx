import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { itemService, warehouseService } from '../services/api';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { FiDownload, FiPrinter, FiTrendingUp, FiFilter } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Reportes() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [reportType, setReportType] = useState('stock');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, warehousesRes] = await Promise.all([
        itemService.getAll({ limit: 5000 }),
        warehouseService.getAll()
      ]);
      setItems(itemsRes.data || []);
      setWarehouses(warehousesRes.data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar items por almacén seleccionado
  const getFilteredItems = () => {
    if (selectedWarehouse === 'all') return items;
    return items.filter(item => item.almacen_id === parseInt(selectedWarehouse));
  };

  const filteredItems = getFilteredItems();

  // Exportar a Excel con filtro
  const exportToExcel = () => {
    try {
      const warehouseName = selectedWarehouse === 'all' 
        ? 'Todos los almacenes' 
        : warehouses.find(w => w.id === parseInt(selectedWarehouse))?.nombre || 'Seleccionado';

      const exportData = filteredItems.map(item => ({
        'Código': item.codigo,
        'Nombre': item.nombre,
        'Categoría': item.categoria || 'Sin categoría',
        'Stock': item.stock,
        'Stock Mínimo': item.stock_minimo || 5,
        'Precio': item.precio,
        'Almacén': warehouses.find(w => w.id === item.almacen_id)?.nombre || 'N/A'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Productos');
      XLSX.writeFile(wb, `reporte_${warehouseName}_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success(`✅ Reporte exportado a Excel (${warehouseName})`);
    } catch (error) {
      toast.error('❌ Error al exportar');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400 animate-pulse">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  // Datos para gráficos
  const stockByWarehouse = warehouses.map(w => ({
    label: w.nombre,
    value: filteredItems.filter(i => i.almacen_id === w.id).reduce((sum, i) => sum + i.stock, 0)
  }));

  const categories = [...new Set(filteredItems.map(i => i.categoria).filter(Boolean))];
  const categoryData = categories.map(cat => ({
    label: cat,
    value: filteredItems.filter(i => i.categoria === cat).length
  }));

  const barData = {
    labels: stockByWarehouse.map(d => d.label),
    datasets: [{
      label: 'Stock',
      data: stockByWarehouse.map(d => d.value),
      backgroundColor: ['#00d4ff', '#00ff87', '#ff00e5', '#9b59b6', '#f59e0b'],
      borderRadius: 8,
    }]
  };

  const doughnutData = {
    labels: categoryData.map(d => d.label),
    datasets: [{
      data: categoryData.map(d => d.value),
      backgroundColor: ['#00d4ff', '#00ff87', '#ff00e5', '#9b59b6', '#f59e0b', '#ef4444'],
      borderWidth: 2,
      borderColor: '#0a0a0f',
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#9ca3af', font: { size: 12 } } }
    },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
      x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold neon-text-blue">
            Reportes
          </h1>
          <p className="text-gray-400 mt-1">Análisis detallado de tu inventario</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={exportToExcel}
            className="btn-neon text-white flex items-center gap-2"
          >
            <FiDownload className="w-4 h-4" />
            Exportar Excel
          </button>
          <button
            onClick={() => window.print()}
            className="btn-glass text-white flex items-center gap-2"
          >
            <FiPrinter className="w-4 h-4" />
            Imprimir
          </button>
        </div>
      </div>

      {/* Filtro por almacén */}
      <div className="glass rounded-2xl p-4 border border-white/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <FiFilter className="w-4 h-4 text-neon-blue" />
            <span className="text-sm text-gray-400">Filtrar por almacén:</span>
          </div>
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="input-glass text-sm"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.1)',
              minWidth: '180px'
            }}
          >
            <option value="all" className="bg-crystal-dark text-white">Todos los almacenes</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id} className="bg-crystal-dark text-white">
                {w.nombre}
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-400 ml-auto">
            {filteredItems.length} productos encontrados
          </span>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-semibold text-white mb-4">Stock por Almacén</h3>
          <div className="h-64">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>
        <div className="glass rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-semibold text-white mb-4">Distribución por Categoría</h3>
          <div className="h-64">
            <Doughnut data={doughnutData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="glass rounded-2xl p-6 border border-white/5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FiTrendingUp className="w-5 h-5 text-neon-green" />
          Resumen General
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass rounded-xl p-4">
            <p className="text-sm text-gray-400">Total Productos</p>
            <p className="text-2xl font-bold text-neon-blue">{filteredItems.length}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-sm text-gray-400">Stock Total</p>
            <p className="text-2xl font-bold text-neon-green">
              {filteredItems.reduce((sum, i) => sum + i.stock, 0)}
            </p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-sm text-gray-400">Valor Total</p>
            <p className="text-2xl font-bold text-neon-pink">
              S/. {filteredItems.reduce((sum, i) => sum + (i.stock * i.precio), 0).toFixed(2)}
            </p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-sm text-gray-400">Almacenes</p>
            <p className="text-2xl font-bold text-neon-cyan">
              {selectedWarehouse === 'all' ? warehouses.length : 1}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}