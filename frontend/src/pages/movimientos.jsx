import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { itemService, warehouseService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { FiPlus, FiMinus, FiPackage, FiMapPin, FiClock } from 'react-icons/fi';

export default function Movimientos() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movimientos, setMovimientos] = useState([]);
  const [formData, setFormData] = useState({
    item_id: '',
    cantidad: 1,
    tipo: 'entrada',
    observacion: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, warehousesRes] = await Promise.all([
        itemService.getAll({ limit: 1000 }),
        warehouseService.getAll()
      ]);
      setItems(itemsRes.data || []);
      setWarehouses(warehousesRes.data || []);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleMovimiento = async (e) => {
    e.preventDefault();
    if (!isAdmin()) {
      toast.error('❌ Solo administradores pueden realizar movimientos');
      return;
    }

    try {
      const cantidad = formData.tipo === 'entrada' 
        ? parseInt(formData.cantidad) 
        : -parseInt(formData.cantidad);
      
      await itemService.updateStock(formData.item_id, cantidad);
      toast.success(`✅ Movimiento registrado: ${formData.tipo}`);
      
      // Registrar en historial local
      const item = items.find(i => i.id === parseInt(formData.item_id));
      setMovimientos([
        {
          id: Date.now(),
          item: item?.nombre || 'Producto',
          cantidad: cantidad,
          tipo: formData.tipo,
          observacion: formData.observacion,
          fecha: new Date().toLocaleString()
        },
        ...movimientos
      ]);

      setFormData({
        item_id: '',
        cantidad: 1,
        tipo: 'entrada',
        observacion: ''
      });
      fetchData();
    } catch (error) {
      toast.error('❌ Error al registrar movimiento');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400 animate-pulse">Cargando...</p>
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
            Movimientos
          </h1>
          <p className="text-gray-400 mt-1">Registra y consulta movimientos de inventario</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario de movimiento */}
        <div className="glass rounded-2xl p-6 border border-white/5">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <FiClock className="w-5 h-5 text-neon-blue" />
            Registrar Movimiento
          </h2>
          <form onSubmit={handleMovimiento} className="space-y-4">
            <select
              value={formData.item_id}
              onChange={(e) => setFormData({...formData, item_id: e.target.value})}
              className="input-glass"
              required
            >
              <option value="">Seleccionar producto</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.codigo} - {item.nombre} (Stock: {item.stock})
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-4">
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                className="input-glass"
              >
                <option value="entrada">✅ Entrada</option>
                <option value="salida">❌ Salida</option>
              </select>

              <input
                type="number"
                placeholder="Cantidad"
                value={formData.cantidad}
                onChange={(e) => setFormData({...formData, cantidad: parseInt(e.target.value)})}
                className="input-glass"
                required
                min="1"
              />
            </div>

            <input
              type="text"
              placeholder="Observación (opcional)"
              value={formData.observacion}
              onChange={(e) => setFormData({...formData, observacion: e.target.value})}
              className="input-glass"
            />

            <button
              type="submit"
              className="w-full btn-neon text-white font-medium"
            >
              Registrar Movimiento
            </button>
          </form>
        </div>

        {/* Resumen y productos con bajo stock */}
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <FiPackage className="w-5 h-5 text-neon-pink" />
              Productos con Stock Bajo
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {items
                .filter(item => item.stock < (item.stock_minimo || 5))
                .slice(0, 10)
                .map(item => {
                  const warehouse = warehouses.find(w => w.id === item.almacen_id);
                  return (
                    <div key={item.id} className="glass-neon-pink rounded-xl p-3 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-white">{item.nombre}</p>
                        <p className="text-xs text-gray-400">{warehouse?.nombre || 'Sin almacén'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-neon-pink font-bold text-sm">Stock: {item.stock}</p>
                        <p className="text-xs text-gray-400">Mín: {item.stock_minimo || 5}</p>
                      </div>
                    </div>
                  );
                })}
              {items.filter(item => item.stock < (item.stock_minimo || 5)).length === 0 && (
                <p className="text-green-400 text-sm text-center py-4">
                  ✅ Todos los productos tienen stock suficiente
                </p>
              )}
            </div>
          </div>

          {/* Últimos movimientos */}
          {movimientos.length > 0 && (
            <div className="glass rounded-2xl p-6 border border-white/5">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <FiClock className="w-5 h-5 text-neon-green" />
                Últimos Movimientos
              </h2>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {movimientos.slice(0, 5).map((mov) => (
                  <div key={mov.id} className="glass rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-white">{mov.item}</p>
                      <p className="text-xs text-gray-400">{mov.fecha}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${mov.tipo === 'entrada' ? 'text-neon-green' : 'text-neon-pink'}`}>
                        {mov.tipo === 'entrada' ? '+' : '-'}{mov.cantidad}
                      </span>
                      {mov.observacion && (
                        <p className="text-xs text-gray-400">{mov.observacion}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}