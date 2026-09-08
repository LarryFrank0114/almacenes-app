import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { 
  FiSearch, FiFilter, FiX, FiEdit2, FiTrash2, 
  FiChevronLeft, FiChevronRight, FiRefreshCw, FiBox,
  FiMoreVertical
} from 'react-icons/fi';
import { itemService, warehouseService } from '../services/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const PAGE_SIZE = 20;

export default function Productos() {
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showActionsModal, setShowActionsModal] = useState(false);
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Datos del formulario de edición
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    categoria: '',
    stock: '',
    stock_minimo: '',
    precio: '',
    precio_costo: '',
    unidad_medida: '',
    ubicacion: '',
    almacen_id: ''
  });

  useEffect(() => {
    fetchData();
    fetchWarehouses();
  }, []);

  const fetchData = async () => {
    try {
      const res = await itemService.getAll();
      setItems(res.data || []);
      setTotalItems(res.data?.length || 0);
      setTotalPages(Math.ceil((res.data?.length || 0) / PAGE_SIZE));
    } catch (error) {
      toast.error('❌ Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await warehouseService.getAll();
      setWarehouses(res.data || []);
    } catch (error) {
      console.error('Error al cargar almacenes:', error);
    }
  };

  // ✅ Filtrado en memoria
  const filteredItems = useMemo(() => {
    let result = items;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        (item.nombre?.toLowerCase().includes(term)) ||
        (item.codigo?.toLowerCase().includes(term)) ||
        (item.proveedor?.toLowerCase().includes(term)) ||
        (item.categoria?.toLowerCase().includes(term))
      );
    }
    
    if (selectedWarehouse) {
      result = result.filter(item => item.almacen_id === parseInt(selectedWarehouse));
    }
    
    if (selectedProvider) {
      result = result.filter(item => (item.categoria || item.proveedor) === selectedProvider);
    }
    
    if (selectedCategory) {
      result = result.filter(item => item.categoria === selectedCategory);
    }
    
    return result;
  }, [items, searchTerm, selectedWarehouse, selectedProvider, selectedCategory]);

  // ✅ Proveedores y categorías únicos
  const uniqueProviders = useMemo(() => {
    const providers = items.map(item => item.proveedor || item.categoria).filter(Boolean);
    return [...new Set(providers)];
  }, [items]);

  const uniqueCategories = useMemo(() => {
    const categories = items.map(item => item.categoria).filter(Boolean);
    return [...new Set(categories)];
  }, [items]);

  // ✅ Limpiar filtros
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedWarehouse('');
    setSelectedProvider('');
    setSelectedCategory('');
    setCurrentPage(1);
  };

  // ✅ Abrir modal de opciones al hacer clic en la fila
  const handleRowClick = (item) => {
    setSelectedItem(item);
    setShowActionsModal(true);
  };

  // ✅ Abrir modal de edición
  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      nombre: item.nombre || '',
      codigo: item.codigo || '',
      descripcion: item.descripcion || '',
      categoria: item.categoria || '',
      stock: item.stock || '',
      stock_minimo: item.stock_minimo || '',
      precio: item.precio || '',
      precio_costo: item.precio_costo || '',
      unidad_medida: item.unidad_medida || '',
      ubicacion: item.ubicacion || '',
      almacen_id: item.almacen_id || ''
    });
    setShowActionsModal(false);
    setShowEditModal(true);
  };

  // ✅ Guardar cambios
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const dataToSave = {
        ...formData,
        stock: parseFloat(formData.stock) || 0,
        stock_minimo: parseFloat(formData.stock_minimo) || 0,
        precio: parseFloat(formData.precio) || 0,
        precio_costo: parseFloat(formData.precio_costo) || 0,
        almacen_id: formData.almacen_id ? parseInt(formData.almacen_id) : null
      };
      
      const response = await itemService.update(selectedItem.id, dataToSave);
      toast.success('✅ Producto actualizado');
      setShowEditModal(false);
      fetchData();
    } catch (error) {
      toast.error('❌ Error al actualizar producto');
    }
  };

  // ✅ Eliminar producto
  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await itemService.delete(id);
        toast.success('✅ Producto eliminado');
        setShowActionsModal(false);
        fetchData();
      } catch (error) {
        toast.error('❌ Error al eliminar producto');
      }
    }
  };

  // ✅ Paginación
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400 animate-pulse">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold neon-text-blue">
            Productos
          </h1>
          <p className="text-gray-400 mt-1">Gestiona tu inventario</p>
        </div>
        <button
          onClick={fetchData}
          className="btn-neon text-white flex items-center gap-2 px-4 py-2"
        >
          <FiRefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* ===== FILTROS ===== */}
      <div className="glass rounded-2xl p-4 mb-6 border border-white/5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nombre, código o proveedor..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="input-glass pl-10 pr-10 w-full"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          <select
            value={selectedWarehouse}
            onChange={(e) => {
              setSelectedWarehouse(e.target.value);
              setCurrentPage(1);
            }}
            className="input-glass px-3 py-2"
          >
            <option value="">Todos los almacenes</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.nombre}</option>
            ))}
          </select>

          <select
            value={selectedProvider}
            onChange={(e) => {
              setSelectedProvider(e.target.value);
              setCurrentPage(1);
            }}
            className="input-glass px-3 py-2"
          >
            <option value="">Todos los proveedores</option>
            {uniqueProviders.map(provider => (
              <option key={provider} value={provider}>{provider}</option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="input-glass px-3 py-2"
          >
            <option value="">Todas las categorías</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <button
            onClick={handleClearFilters}
            className="px-4 py-2 rounded-xl glass text-gray-400 hover:text-white flex items-center gap-2"
          >
            <FiFilter className="w-4 h-4" />
            Limpiar
          </button>
        </div>
      </div>

      {/* ===== TABLA ===== */}
      <div className="overflow-x-auto glass rounded-2xl border border-white/5">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-4 py-3 text-xs text-gray-400 uppercase">Código</th>
              <th className="px-4 py-3 text-xs text-gray-400 uppercase">Nombre</th>
              <th className="px-4 py-3 text-xs text-gray-400 uppercase hidden lg:table-cell">Descripción</th>
              <th className="px-4 py-3 text-xs text-gray-400 uppercase hidden md:table-cell">Categoría</th>
              <th className="px-4 py-3 text-xs text-gray-400 uppercase">Stock</th>
              <th className="px-4 py-3 text-xs text-gray-400 uppercase hidden sm:table-cell">Precio</th>
              <th className="px-4 py-3 text-xs text-gray-400 uppercase">Almacén</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  <FiBox className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  No hay productos encontrados
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr 
                  key={item.id} 
                  className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => handleRowClick(item)}
                >
                  <td className="px-4 py-3 text-gray-400 font-mono text-sm">{item.codigo}</td>
                  <td className="px-4 py-3 text-white font-medium">{item.nombre}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm hidden lg:table-cell line-clamp-1">{item.descripcion}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm hidden md:table-cell">{item.categoria}</td>
                  <td className="px-4 py-3 text-white">{item.stock}</td>
                  <td className="px-4 py-3 text-neon-green hidden sm:table-cell">S/ {Number(item.precio || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{item.almacen_nombre || item.almacen?.nombre || 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ===== PAGINACIÓN ===== */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-400">
          Mostrando {filteredItems.length} de {totalItems} productos
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg glass text-gray-400 hover:text-white disabled:opacity-50"
          >
            <FiChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-4 py-2 rounded-lg glass text-white">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-lg glass text-gray-400 hover:text-white disabled:opacity-50"
          >
            <FiChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ===== MODAL DE OPCIONES (clic en fila) ===== */}
      {showActionsModal && selectedItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl w-full max-w-sm p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FiBox className="w-5 h-5 text-neon-blue" />
                {selectedItem.nombre}
              </h2>
              <button
                onClick={() => setShowActionsModal(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-white"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => handleEdit(selectedItem)}
                className="w-full px-4 py-3 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 transition-colors flex items-center gap-2"
              >
                <FiEdit2 className="w-5 h-5" />
                Editar Producto
              </button>
              
              <button
                onClick={() => handleDelete(selectedItem.id)}
                className="w-full px-4 py-3 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-colors flex items-center gap-2"
              >
                <FiTrash2 className="w-5 h-5" />
                Eliminar Producto
              </button>
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              Código: {selectedItem.codigo}
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL DE EDICIÓN ===== */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl w-full max-w-2xl p-6 border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Editar Producto</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-white"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="input-glass w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Código</label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  className="input-glass w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Categoría</label>
                <input
                  type="text"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="input-glass w-full"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Descripción</label>
                <input
                  type="text"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="input-glass w-full"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Stock</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="input-glass w-full"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Stock Mínimo</label>
                <input
                  type="number"
                  value={formData.stock_minimo}
                  onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
                  className="input-glass w-full"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Precio</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                  className="input-glass w-full"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Precio Costo</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.precio_costo}
                  onChange={(e) => setFormData({ ...formData, precio_costo: e.target.value })}
                  className="input-glass w-full"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Unidad de Medida</label>
                <input
                  type="text"
                  value={formData.unidad_medida}
                  onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })}
                  className="input-glass w-full"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Ubicación</label>
                <input
                  type="text"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                  className="input-glass w-full"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Almacén</label>
                <select
                  value={formData.almacen_id}
                  onChange={(e) => setFormData({ ...formData, almacen_id: e.target.value })}
                  className="input-glass w-full"
                >
                  <option value="">Sin almacén</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 flex gap-3 pt-4">
                <button
                  type="submit"
                  className="btn-neon text-white flex-1 py-2 flex items-center justify-center gap-2"
                >
                  <FiRefreshCw className="w-4 h-4" />
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-glass text-white flex-1 py-2 flex items-center justify-center gap-2"
                >
                  <FiX className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}