import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { itemService, warehouseService } from '../services/api';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiBox, 
  FiPackage, 
  FiMapPin, 
  FiAlertTriangle, 
  FiRefreshCw,
  FiArrowRight,
  FiMail
} from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:8000';

export default function Dashboard() {
  const router = useRouter();
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalProductos: 0,
    stockTotal: 0,
    totalAlmacenes: 0,
    stockBajo: 0,
    valorInventario: 0
  });
  const [loading, setLoading] = useState(true);
  const [sendingNotifications, setSendingNotifications] = useState(false);

  const navigateTo = (path) => {
    router.push(path);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const itemsRes = await itemService.getAll();
      const items = itemsRes.data || [];
      
      const almacenesRes = await warehouseService.getAll();
      const almacenes = almacenesRes.data || [];
      
      const stockTotal = items.reduce((acc, item) => acc + (item.stock || 0), 0);
      const stockBajo = items.filter(item => item.stock <= (item.stock_minimo || 0)).length;
      const valorInventario = items.reduce((acc, item) => acc + (item.stock || 0) * (item.precio || 0), 0);
      
      setStats({
        totalProductos: items.length,
        stockTotal,
        totalAlmacenes: almacenes.length,
        stockBajo,
        valorInventario
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      toast.error(t('dashboard.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  // ✅ Enviar notificaciones de stock bajo por email
  const sendLowStockNotifications = async () => {
    try {
      setSendingNotifications(true);
      const response = await axios.post(`${API_URL}/notificaciones/low-stock/`);
      
      if (response.data.count === 0) {
        toast.success('✅ ' + (t('dashboard.noLowStock') || 'No hay productos con stock bajo'));
      } else {
        toast.success(`✅ ${response.data.message || `Se enviaron ${response.data.count} notificaciones`}`);
      }
    } catch (error) {
      console.error('Error al enviar notificaciones:', error);
      toast.error('❌ ' + (t('dashboard.notificationError') || 'Error al enviar notificaciones'));
    } finally {
      setSendingNotifications(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400 animate-pulse">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold neon-text-blue">
            {t('dashboard.welcome')}
          </h1>
          <p className="text-gray-400 mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          {/* ✅ Botón de notificaciones */}
          <button
            onClick={sendLowStockNotifications}
            disabled={sendingNotifications}
            className={`btn-glass text-white flex items-center gap-2 px-4 py-2 ${sendingNotifications ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {sendingNotifications ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t('dashboard.sending') || 'Enviando...'}
              </>
            ) : (
              <>
                <FiMail className="w-4 h-4" />
                {t('dashboard.sendAlerts') || 'Enviar alertas'}
              </>
            )}
          </button>

          {/* ✅ Botón de actualizar */}
          <button
            onClick={fetchStats}
            className="btn-neon text-white flex items-center gap-2 px-4 py-2"
          >
            <FiRefreshCw className="w-4 h-4" />
            {t('dashboard.refresh')}
          </button>
        </div>
      </div>

      {/* Tarjetas de estadísticas - CLICABLES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Productos */}
        <button
          onClick={() => navigateTo('/productos')}
          className="glass rounded-2xl p-5 border border-white/5 hover:border-neon-blue/30 transition-all text-left group"
        >
          <div className="flex justify-between items-center mb-3">
            <div className="w-12 h-12 rounded-xl bg-neon-blue/10 flex items-center justify-center">
              <FiBox className="w-6 h-6 text-neon-blue" />
            </div>
            <span className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              OK
            </span>
          </div>
          <p className="text-gray-400 text-sm">{t('dashboard.totalProducts')}</p>
          <p className="text-3xl font-bold text-white mt-1">{stats.totalProductos}</p>
          <div className="mt-2 flex items-center gap-1 text-neon-blue text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            <FiArrowRight className="w-3 h-3" />
            {t('dashboard.viewProducts')}
          </div>
        </button>

        {/* Stock Total */}
        <button
          onClick={() => navigateTo('/productos')}
          className="glass rounded-2xl p-5 border border-white/5 hover:border-neon-green/30 transition-all text-left group"
        >
          <div className="flex justify-between items-center mb-3">
            <div className="w-12 h-12 rounded-xl bg-neon-green/10 flex items-center justify-center">
              <FiPackage className="w-6 h-6 text-neon-green" />
            </div>
            <span className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              OK
            </span>
          </div>
          <p className="text-gray-400 text-sm">{t('dashboard.totalStock')}</p>
          <p className="text-3xl font-bold text-neon-green mt-1">{stats.stockTotal}</p>
          <div className="mt-2 flex items-center gap-1 text-neon-green text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            <FiArrowRight className="w-3 h-3" />
            {t('dashboard.viewStock')}
          </div>
        </button>

        {/* Total Almacenes */}
        <button
          onClick={() => navigateTo('/almacenes')}
          className="glass rounded-2xl p-5 border border-white/5 hover:border-neon-pink/30 transition-all text-left group"
        >
          <div className="flex justify-between items-center mb-3">
            <div className="w-12 h-12 rounded-xl bg-neon-pink/10 flex items-center justify-center">
              <FiMapPin className="w-6 h-6 text-neon-pink" />
            </div>
            <span className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              OK
            </span>
          </div>
          <p className="text-gray-400 text-sm">{t('dashboard.totalWarehouses')}</p>
          <p className="text-3xl font-bold text-white mt-1">{stats.totalAlmacenes}</p>
          <div className="mt-2 flex items-center gap-1 text-neon-pink text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            <FiArrowRight className="w-3 h-3" />
            {t('dashboard.viewWarehouses')}
          </div>
        </button>

        {/* Stock Bajo */}
        <button
          onClick={() => navigateTo('/productos?stock=low')}
          className="glass rounded-2xl p-5 border border-white/5 hover:border-neon-pink/30 transition-all text-left group"
        >
          <div className="flex justify-between items-center mb-3">
            <div className="w-12 h-12 rounded-xl bg-neon-pink/10 flex items-center justify-center">
              <FiAlertTriangle className="w-6 h-6 text-neon-pink" />
            </div>
            <span className="text-xs text-neon-pink">{stats.stockBajo}</span>
          </div>
          <p className="text-gray-400 text-sm">{t('dashboard.lowStock')}</p>
          <p className="text-3xl font-bold text-neon-pink mt-1">{stats.stockBajo}</p>
          <div className="mt-2 flex items-center gap-1 text-neon-pink text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            <FiArrowRight className="w-3 h-3" />
            {t('dashboard.viewAlerts')}
          </div>
        </button>
      </div>

      {/* Valor total del inventario */}
      <div className="glass rounded-2xl p-6 border border-white/5">
        <div className="flex flex-col md:flex-row md:justify-between gap-4">
          <div>
            <p className="text-gray-400 text-sm">{t('dashboard.inventoryValue')}</p>
            <p className="text-4xl font-bold text-neon-blue mt-2">
              S/. {stats.valorInventario.toFixed(2)}
            </p>
          </div>
          <div className="flex items-center gap-2 text-green-400">
            <span className="text-sm bg-green-500/10 px-3 py-1 rounded-full">
              +12.5% {t('dashboard.thisMonth')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
