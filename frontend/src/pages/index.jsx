'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { itemService, warehouseService } from '../services/api';
import api from '../services/api';
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

      // ✅ Usar el endpoint de estadísticas del backend (calcula en la BD, no en el frontend)
      const statsRes = await itemService.getStats();
      const statsData = statsRes.data || {};

      // Obtener almacenes (no está paginado)
      const almacenesRes = await warehouseService.getAll();
      const almacenes = Array.isArray(almacenesRes.data) 
        ? almacenesRes.data 
        : (almacenesRes.data?.data || []);

      setStats({
        totalProductos: statsData.total_items || 0,
        stockTotal: statsData.stock_total || 0,
        totalAlmacenes: almacenes.length || 0,
        stockBajo: statsData.stock_bajo || 0,
        valorInventario: statsData.valor_inventario || 0
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
      const response = await api.post('/notificaciones/low-stock/');

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

          <button
            onClick={fetchStats}
            className="btn-neon text-white flex items-center gap-2 px-4 py-2"
          >
            <FiRefreshCw className="w-4 h-4" />
            {t('dashboard.refresh')}
          </button>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
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
          <p className="text-3xl font-bold text-white mt-1">{stats.totalProductos.toLocaleString()}</p>
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
          <p className="text-3xl font-bold text-neon-green mt-1">{stats.stockTotal.toLocaleString()}</p>
          <div className="mt-2 flex items-center gap-1 text-neon-green text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            <FiArrowRight className="w-3 h-3" />
            {t('dashboard.viewStock')}
          </div>
        </button>

        {/* Total Almacenes */}
        <button
          onClick={() => navigateTo('/almacenes')}
          className="glass rounded-2xl p-5 border border-white/5 hover:border-purple-500/30 transition-all text-left group"
        >
          <div className="flex justify-between items-center mb-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <FiMapPin className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              OK
            </span>
          </div>
          <p className="text-gray-400 text-sm">{t('dashboard.totalWarehouses')}</p>
          <p className="text-3xl font-bold text-purple-400 mt-1">{stats.totalAlmacenes}</p>
          <div className="mt-2 flex items-center gap-1 text-purple-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            <FiArrowRight className="w-3 h-3" />
            {t('dashboard.viewWarehouses')}
          </div>
        </button>

        {/* Stock Bajo */}
        <button
          onClick={() => navigateTo('/productos')}
          className="glass rounded-2xl p-5 border border-white/5 hover:border-yellow-500/30 transition-all text-left group"
        >
          <div className="flex justify-between items-center mb-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <FiAlertTriangle className="w-6 h-6 text-yellow-400" />
            </div>
            {stats.stockBajo > 0 ? (
              <span className="text-xs text-yellow-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                Alerta
              </span>
            ) : (
              <span className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                OK
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm">{t('dashboard.lowStock')}</p>
          <p className="text-3xl font-bold text-yellow-400 mt-1">{stats.stockBajo.toLocaleString()}</p>
          <div className="mt-2 flex items-center gap-1 text-yellow-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            <FiArrowRight className="w-3 h-3" />
            {t('dashboard.viewLowStock')}
          </div>
        </button>
      </div>

      {/* Valor del Inventario */}
      <div className="glass rounded-2xl p-6 border border-white/5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-gray-400 text-sm">{t('dashboard.inventoryValue')}</p>
            <p className="text-4xl font-bold text-white mt-1">
              S/ {stats.valorInventario.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">{t('dashboard.lastUpdate')}</p>
            <p className="text-white text-sm">{new Date().toLocaleString('es-PE')}</p>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => navigateTo('/productos')}
          className="glass rounded-2xl p-6 border border-white/5 hover:border-neon-blue/30 transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-neon-blue/10 flex items-center justify-center">
              <FiBox className="w-7 h-7 text-neon-blue" />
            </div>
            <div>
              <p className="text-white font-semibold">{t('dashboard.manageProducts')}</p>
              <p className="text-gray-400 text-sm">{t('dashboard.manageProductsDesc')}</p>
            </div>
            <FiArrowRight className="w-5 h-5 text-neon-blue ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>

        <button
          onClick={() => navigateTo('/almacenes')}
          className="glass rounded-2xl p-6 border border-white/5 hover:border-purple-500/30 transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <FiMapPin className="w-7 h-7 text-purple-400" />
            </div>
            <div>
              <p className="text-white font-semibold">{t('dashboard.manageWarehouses')}</p>
              <p className="text-gray-400 text-sm">{t('dashboard.manageWarehousesDesc')}</p>
            </div>
            <FiArrowRight className="w-5 h-5 text-purple-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>
      </div>
    </div>
  );
}