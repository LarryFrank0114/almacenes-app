'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { itemService, warehouseService, movimientoService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import {
  FiPlus, FiMinus, FiPackage, FiClock, FiTrash2, FiX,
  FiCalendar, FiFileText, FiTruck, FiUser, FiChevronLeft,
  FiChevronRight, FiRefreshCw, FiSearch, FiEye
} from 'react-icons/fi';

const PAGE_SIZE = 20;

export default function Movimientos() {
  const { t } = useTranslation();
  const { isAdmin, user } = useAuth();

  // Estado del formulario
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Formulario principal
  const [formData, setFormData] = useState({
    tipo: 'entrada',
    fecha: new Date().toISOString().split('T')[0],
    numero_documento: '',
    proveedor: '',
    destino: '',
    observacion: '',
  });

  // Lista de detalles (productos del movimiento)
  const [detalles, setDetalles] = useState([]);

  // Producto actual que se está agregando
  const [currentItem, setCurrentItem] = useState({
    item_id: '',
    cantidad: 1,
    search: '',
  });

  // Filtros para el historial
  const [filtros, setFiltros] = useState({
    tipo: '',
    fecha_desde: '',
    fecha_hasta: '',
    search: '',
  });

  // Historial paginado
  const [movimientos, setMovimientos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal de detalle
  const [selectedMovimiento, setSelectedMovimiento] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Cargar items y almacenes al inicio
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Cargar movimientos cuando cambia la página o los filtros
  useEffect(() => {
    fetchMovimientos();
  }, [currentPage, filtros]);

  const fetchInitialData = async () => {
    try {
      const [itemsRes, warehousesRes] = await Promise.all([
        itemService.getAll({ limit: 5000 }),
        warehouseService.getAll()
      ]);

      const itemsData = Array.isArray(itemsRes.data)
        ? itemsRes.data
        : (itemsRes.data?.data || []);

      const warehousesData = Array.isArray(warehousesRes.data)
        ? warehousesRes.data
        : (warehousesRes.data?.data || []);

      setItems(itemsData);
      setWarehouses(warehousesData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchMovimientos = useCallback(async () => {
    try {
      const params = {
        skip: (currentPage - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      };
      if (filtros.tipo) params.tipo = filtros.tipo;
      if (filtros.fecha_desde) params.fecha_desde = filtros.fecha_desde;
      if (filtros.fecha_hasta) params.fecha_hasta = filtros.fecha_hasta;
      if (filtros.search) params.search = filtros.search;

      const res = await movimientoService.getAll(params);
      setMovimientos(res.data.data || []);
      setTotalItems(res.data.total || 0);
      setTotalPages(res.data.pages || 1);
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
    }
  }, [currentPage, filtros]);

  // ============================================
  // AGREGAR PRODUCTO AL MOVIMIENTO
  // ============================================
  const handleAddDetalle = () => {
    if (!currentItem.item_id) {
      toast.error('Selecciona un producto');
      return;
    }
    if (!currentItem.cantidad || currentItem.cantidad <= 0) {
      toast.error('Cantidad debe ser mayor a 0');
      return;
    }

    // Verificar que no esté ya agregado
    if (detalles.some(d => d.item_id === parseInt(currentItem.item_id))) {
      toast.error('Este producto ya está agregado');
      return;
    }

    const item = items.find(i => i.id === parseInt(currentItem.item_id));
    if (!item) return;

    // Validar stock si es salida
    if (formData.tipo === 'salida' && item.stock < currentItem.cantidad) {
      toast.error(`Stock insuficiente. Disponible: ${item.stock}`);
      return;
    }

    setDetalles([
      ...detalles,
      {
        item_id: parseInt(currentItem.item_id),
        item_nombre: item.nombre,
        item_codigo: item.codigo,
        cantidad: parseFloat(currentItem.cantidad),
        stock_actual: item.stock,
        unidad_medida: item.unidad_medida || 'und'
      }
    ]);

    setCurrentItem({ item_id: '', cantidad: 1, search: '' });
  };

  const handleRemoveDetalle = (itemId) => {
    setDetalles(detalles.filter(d => d.item_id !== itemId));
  };

  // ============================================
  // REGISTRAR MOVIMIENTO
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAdmin()) {
      toast.error('❌ Solo administradores pueden registrar movimientos');
      return;
    }
    if (detalles.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }

    // Validar campos según tipo
    if (formData.tipo === 'salida' && !formData.destino) {
      toast.error('El destino es obligatorio para salidas');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        tipo: formData.tipo,
        fecha: formData.fecha,
        numero_documento: formData.numero_documento || null,
        proveedor: formData.tipo === 'entrada' ? (formData.proveedor || null) : null,
        destino: formData.tipo === 'salida' ? (formData.destino || null) : null,
        observacion: formData.observacion || null,
        usuario_email: user?.email || null,
        detalles: detalles.map(d => ({
          item_id: d.item_id,
          cantidad: d.cantidad,
        })),
      };

      await movimientoService.create(payload);
      toast.success(`✅ Movimiento de ${formData.tipo} registrado (${detalles.length} productos)`);

      // Limpiar formulario
      setFormData({
        tipo: 'entrada',
        fecha: new Date().toISOString().split('T')[0],
        numero_documento: '',
        proveedor: '',
        destino: '',
        observacion: '',
      });
      setDetalles([]);
      setCurrentItem({ item_id: '', cantidad: 1, search: '' });

      // Recargar datos
      fetchInitialData();
      fetchMovimientos();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.detail || '❌ Error al registrar movimiento');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // UTILIDADES
  // ============================================
  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  // Filtro dinámico del buscador
  const filteredItems = items.filter(i => {
    if (!currentItem.search) return false; // No mostrar nada si no hay búsqueda
    const s = currentItem.search.toLowerCase();
    return i.nombre?.toLowerCase().includes(s) || i.codigo?.toLowerCase().includes(s);
  }).slice(0, 50);

  // Producto actualmente seleccionado (para mostrar en la tarjeta)
  const selectedItemData = currentItem.item_id
    ? items.find(i => i.id === parseInt(currentItem.item_id))
    : null;

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
      <div>
        <h1 className="text-3xl font-display font-bold neon-text-blue">Movimientos</h1>
        <p className="text-gray-400 mt-1">Registra entradas y salidas con documentos y múltiples productos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ============================================ */}
        {/* FORMULARIO */}
        {/* ============================================ */}
        <div className="glass rounded-2xl p-6 border border-white/5">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <FiClock className="w-5 h-5 text-neon-blue" />
            Registrar Movimiento
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo: 'entrada' })}
                className={`py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-all ${
                  formData.tipo === 'entrada'
                    ? 'bg-neon-green/20 text-neon-green border-2 border-neon-green'
                    : 'glass text-gray-400 border-2 border-transparent'
                }`}
              >
                <FiPlus className="w-4 h-4" /> Entrada
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo: 'salida' })}
                className={`py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-all ${
                  formData.tipo === 'salida'
                    ? 'bg-neon-pink/20 text-neon-pink border-2 border-neon-pink'
                    : 'glass text-gray-400 border-2 border-transparent'
                }`}
              >
                <FiMinus className="w-4 h-4" /> Salida
              </button>
            </div>

            {/* Fecha + N° Documento */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <FiCalendar className="w-3 h-3" /> Fecha
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  className="input-glass w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <FiFileText className="w-3 h-3" /> N° Documento
                </label>
                <input
                  type="text"
                  placeholder="Guía / Vale / Factura"
                  value={formData.numero_documento}
                  onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                  className="input-glass w-full"
                />
              </div>
            </div>

            {/* Proveedor (solo entrada) */}
            {formData.tipo === 'entrada' && (
              <div>
                <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <FiTruck className="w-3 h-3" /> Proveedor
                </label>
                <input
                  type="text"
                  placeholder="Nombre del proveedor"
                  value={formData.proveedor}
                  onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                  className="input-glass w-full"
                />
              </div>
            )}

            {/* Destino (solo salida) */}
            {formData.tipo === 'salida' && (
              <div>
                <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <FiTruck className="w-3 h-3" /> Destino *
                </label>
                <input
                  type="text"
                  placeholder="Obra / Área / Cliente"
                  value={formData.destino}
                  onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                  className="input-glass w-full"
                  required
                />
              </div>
            )}

            {/* Observación */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Observación</label>
              <input
                type="text"
                placeholder="Opcional"
                value={formData.observacion}
                onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
                className="input-glass w-full"
              />
            </div>

            {/* ============================================ */}
            {/* AGREGAR PRODUCTOS */}
            {/* ============================================ */}
            <div className="border-t border-white/10 pt-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <FiPackage className="w-4 h-4 text-neon-blue" />
                Productos del Movimiento ({detalles.length})
              </h3>

              {/* Buscador */}
              <div className="relative mb-3">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar producto por nombre o código..."
                  value={currentItem.search}
                  onChange={(e) => {
                    setCurrentItem({ ...currentItem, search: e.target.value, item_id: '' });
                  }}
                  className="input-glass w-full pl-10 pr-10 text-sm"
                />
                {currentItem.search && (
                  <button
                    type="button"
                    onClick={() => setCurrentItem({ ...currentItem, search: '', item_id: '' })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Dropdown personalizado con resultados */}
              {currentItem.search && !currentItem.item_id && (
                <div className="glass rounded-xl border border-white/10 max-h-56 overflow-y-auto mb-3">
                  {filteredItems.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm py-4">
                      No se encontraron productos
                    </p>
                  ) : (
                    filteredItems.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setCurrentItem({ ...currentItem, item_id: item.id.toString(), search: '' });
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0"
                      >
                        <p className="text-sm text-white font-medium truncate">{item.nombre}</p>
                        <p className="text-xs text-gray-400">
                          {item.codigo} · Stock:{' '}
                          <span className={item.stock <= (item.stock_minimo || 5) ? 'text-neon-pink' : 'text-neon-green'}>
                            {item.stock}
                          </span>{' '}
                          {item.unidad_medida || 'und'}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Producto seleccionado */}
              {selectedItemData && (
                <div className="glass rounded-xl p-3 flex items-center gap-2 mb-3 border border-neon-blue/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{selectedItemData.nombre}</p>
                    <p className="text-xs text-gray-400">
                      {selectedItemData.codigo} · Stock: {selectedItemData.stock} {selectedItemData.unidad_medida || 'und'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentItem({ ...currentItem, item_id: '', search: '' })}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Cantidad + Botón Agregar */}
              <div className="grid grid-cols-12 gap-2 mb-3">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={currentItem.cantidad}
                  onChange={(e) => setCurrentItem({ ...currentItem, cantidad: e.target.value })}
                  className="input-glass col-span-8 text-sm"
                  placeholder="Cantidad"
                  disabled={!currentItem.item_id}
                />
                <button
                  type="button"
                  onClick={handleAddDetalle}
                  disabled={!currentItem.item_id}
                  className={`col-span-4 rounded-xl flex items-center justify-center gap-1 font-medium transition-all text-sm ${
                    currentItem.item_id
                      ? 'btn-neon text-white'
                      : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <FiPlus className="w-4 h-4" />
                  Agregar
                </button>
              </div>

              {/* Lista de productos agregados */}
              {detalles.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {detalles.map((d) => (
                    <div key={d.item_id} className="glass rounded-xl p-3 flex justify-between items-center">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{d.item_nombre}</p>
                        <p className="text-xs text-gray-400">{d.item_codigo} · Stock actual: {d.stock_actual}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${
                          formData.tipo === 'entrada' ? 'text-neon-green' : 'text-neon-pink'
                        }`}>
                          {formData.tipo === 'entrada' ? '+' : '-'}{d.cantidad} {d.unidad_medida}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDetalle(d.item_id)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {detalles.length === 0 && (
                <p className="text-center text-gray-500 text-sm py-4">
                  No hay productos agregados. Usa el buscador de arriba.
                </p>
              )}
            </div>

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={submitting || detalles.length === 0}
              className={`w-full py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2 ${
                submitting || detalles.length === 0
                  ? 'bg-gray-700 cursor-not-allowed opacity-50'
                  : formData.tipo === 'entrada'
                    ? 'bg-gradient-to-r from-neon-green/80 to-neon-blue/80 hover:from-neon-green hover:to-neon-blue'
                    : 'bg-gradient-to-r from-neon-pink/80 to-neon-blue/80 hover:from-neon-pink hover:to-neon-blue'
              } transition-all`}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Registrando...
                </>
              ) : (
                <>
                  <FiClock className="w-4 h-4" />
                  Registrar Movimiento ({detalles.length} productos)
                </>
              )}
            </button>
          </form>
        </div>

        {/* ============================================ */}
        {/* HISTORIAL DE MOVIMIENTOS */}
        {/* ============================================ */}
        <div className="glass rounded-2xl p-6 border border-white/5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <FiClock className="w-5 h-5 text-neon-green" />
              Historial ({totalItems})
            </h2>
            <button
              onClick={fetchMovimientos}
              className="p-2 rounded-lg glass text-gray-400 hover:text-white"
            >
              <FiRefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Filtros */}
          <div className="space-y-2 mb-4">
            <div className="grid grid-cols-3 gap-2">
              <select
                value={filtros.tipo}
                onChange={(e) => { setFiltros({ ...filtros, tipo: e.target.value }); setCurrentPage(1); }}
                className="input-glass text-xs"
              >
                <option value="">Todos</option>
                <option value="entrada">Entradas</option>
                <option value="salida">Salidas</option>
              </select>
              <input
                type="date"
                value={filtros.fecha_desde}
                onChange={(e) => { setFiltros({ ...filtros, fecha_desde: e.target.value }); setCurrentPage(1); }}
                className="input-glass text-xs"
                placeholder="Desde"
              />
              <input
                type="date"
                value={filtros.fecha_hasta}
                onChange={(e) => { setFiltros({ ...filtros, fecha_hasta: e.target.value }); setCurrentPage(1); }}
                className="input-glass text-xs"
                placeholder="Hasta"
              />
            </div>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar por documento, proveedor, destino..."
                value={filtros.search}
                onChange={(e) => { setFiltros({ ...filtros, search: e.target.value }); setCurrentPage(1); }}
                className="input-glass w-full pl-10 text-sm"
              />
            </div>
          </div>

          {/* Lista de movimientos */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {movimientos.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-8">
                No hay movimientos registrados
              </p>
            ) : (
              movimientos.map((mov) => (
                <div
                  key={mov.id}
                  onClick={() => { setSelectedMovimiento(mov); setShowDetailModal(true); }}
                  className="glass rounded-xl p-3 hover:bg-white/5 cursor-pointer transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        mov.tipo === 'entrada'
                          ? 'bg-neon-green/20 text-neon-green'
                          : 'bg-neon-pink/20 text-neon-pink'
                      }`}>
                        {mov.tipo === 'entrada' ? '+ Entrada' : '- Salida'}
                      </span>
                      <span className="text-xs text-gray-400">{mov.fecha}</span>
                    </div>
                    <span className="text-xs text-gray-500">#{mov.id}</span>
                  </div>

                  <div className="text-xs text-gray-400 space-y-1">
                    {mov.numero_documento && (
                      <p className="flex items-center gap-1">
                        <FiFileText className="w-3 h-3" /> {mov.numero_documento}
                      </p>
                    )}
                    {mov.proveedor && (
                      <p className="flex items-center gap-1">
                        <FiTruck className="w-3 h-3" /> {mov.proveedor}
                      </p>
                    )}
                    {mov.destino && (
                      <p className="flex items-center gap-1">
                        <FiTruck className="w-3 h-3" /> {mov.destino}
                      </p>
                    )}
                    <p className="flex items-center gap-1 text-neon-blue">
                      <FiPackage className="w-3 h-3" /> {mov.detalles?.length || 0} producto(s)
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
              <span className="text-xs text-gray-400">
                Página {currentPage} de {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg glass text-gray-400 hover:text-white disabled:opacity-30"
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                {getPageNumbers().map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-2.5 py-1 rounded-lg text-xs ${
                      page === currentPage
                        ? 'bg-neon-blue text-white font-semibold'
                        : 'glass text-gray-400 hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg glass text-gray-400 hover:text-white disabled:opacity-30"
                >
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* MODAL DE DETALLE */}
      {/* ============================================ */}
      {showDetailModal && selectedMovimiento && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl w-full max-w-2xl p-6 border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <FiEye className="w-5 h-5 text-neon-blue" />
                Movimiento #{selectedMovimiento.id}
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-white"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div className="glass rounded-lg p-3">
                <p className="text-xs text-gray-400">Tipo</p>
                <p className={`font-medium ${selectedMovimiento.tipo === 'entrada' ? 'text-neon-green' : 'text-neon-pink'}`}>
                  {selectedMovimiento.tipo === 'entrada' ? '+ Entrada' : '- Salida'}
                </p>
              </div>
              <div className="glass rounded-lg p-3">
                <p className="text-xs text-gray-400">Fecha</p>
                <p className="text-white font-medium">{selectedMovimiento.fecha}</p>
              </div>
              {selectedMovimiento.numero_documento && (
                <div className="glass rounded-lg p-3">
                  <p className="text-xs text-gray-400">N° Documento</p>
                  <p className="text-white font-medium">{selectedMovimiento.numero_documento}</p>
                </div>
              )}
              {selectedMovimiento.proveedor && (
                <div className="glass rounded-lg p-3">
                  <p className="text-xs text-gray-400">Proveedor</p>
                  <p className="text-white font-medium">{selectedMovimiento.proveedor}</p>
                </div>
              )}
              {selectedMovimiento.destino && (
                <div className="glass rounded-lg p-3">
                  <p className="text-xs text-gray-400">Destino</p>
                  <p className="text-white font-medium">{selectedMovimiento.destino}</p>
                </div>
              )}
              {selectedMovimiento.usuario_email && (
                <div className="glass rounded-lg p-3 col-span-2">
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <FiUser className="w-3 h-3" /> Registrado por
                  </p>
                  <p className="text-white font-medium text-sm">{selectedMovimiento.usuario_email}</p>
                </div>
              )}
              {selectedMovimiento.observacion && (
                <div className="glass rounded-lg p-3 col-span-2">
                  <p className="text-xs text-gray-400">Observación</p>
                  <p className="text-white text-sm">{selectedMovimiento.observacion}</p>
                </div>
              )}
            </div>

            <h3 className="text-md font-semibold text-white mb-2 flex items-center gap-2">
              <FiPackage className="w-4 h-4 text-neon-blue" />
              Productos ({selectedMovimiento.detalles?.length || 0})
            </h3>
            <div className="space-y-2">
              {selectedMovimiento.detalles?.map((det) => (
                <div key={det.id} className="glass rounded-lg p-3 flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{det.item_nombre || `Item #${det.item_id}`}</p>
                    <p className="text-xs text-gray-400">{det.item_codigo}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${selectedMovimiento.tipo === 'entrada' ? 'text-neon-green' : 'text-neon-pink'}`}>
                      {selectedMovimiento.tipo === 'entrada' ? '+' : '-'}{det.cantidad}
                    </p>
                    <p className="text-xs text-gray-500">
                      {det.stock_anterior} → {det.stock_nuevo}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
