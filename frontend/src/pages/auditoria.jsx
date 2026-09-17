'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { 
  FiSearch, FiFilter, FiX, FiRefreshCw, 
  FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight,
  FiEdit2, FiTrash2, FiPlus, FiActivity, FiPackage
} from 'react-icons/fi';
import { auditService } from '../services/api';

const PAGE_SIZE = 50;

export default function Auditoria() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, por_accion: [], por_usuario: [] });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccion, setSelectedAccion] = useState('');
  const [selectedTabla, setSelectedTabla] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [currentPage, searchTerm, selectedAccion, selectedTabla, fechaDesde, fechaHasta]);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        skip: (currentPage - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      };
      if (searchTerm) params.usuario_email = searchTerm;
      if (selectedAccion) params.accion = selectedAccion;
      if (selectedTabla) params.tabla = selectedTabla;
      if (fechaDesde) params.fecha_desde = fechaDesde;
      if (fechaHasta) params.fecha_hasta = fechaHasta;
      
      const res = await auditService.getAll(params);
      setLogs(res.data.data || []);
      setTotalItems(res.data.total || 0);
      setTotalPages(res.data.pages || 1);
    } catch (error) {
      console.error('Error al cargar auditoría:', error);
      toast.error('Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedAccion, selectedTabla, fechaDesde, fechaHasta]);

  const fetchStats = async () => {
    try {
      const res = await auditService.getStats();
      setStats(res.data || { total: 0, por_accion: [], por_usuario: [] });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedAccion('');
    setSelectedTabla('');
    setFechaDesde('');
    setFechaHasta('');
    setCurrentPage(1);
  };

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

  const getAccionBadge = (accion) => {
    const badges = {
      crear: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: FiPlus, label: 'Crear' },
      editar: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: FiEdit2, label: 'Editar' },
      eliminar: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: FiTrash2, label: 'Eliminar' },
      importar: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: FiActivity, label: 'Importar' }
    };
    return badges[accion] || { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: FiActivity, label: accion };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('es-PE', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    } catch { return dateStr; }
  };

  const renderValor = (valor) => {
    if (valor === null || valor === undefined || valor === '') 
      return <span className="text-gray-500 italic">—</span>;
    const str = String(valor);
    if (str.length > 50) return <span title={str}>{str.substring(0, 50)}...</span>;
    return str;
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400 animate-pulse">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold neon-text-blue">
            Historial de Auditoría
          </h1>
          <p className="text-gray-400 mt-1">
            Registro de cambios — <span className="text-neon-green font-semibold">{totalItems.toLocaleString()} eventos</span>
          </p>
        </div>
        <button onClick={() => { fetchLogs(); fetchStats(); }} className="btn-neon text-white flex items-center gap-2 px-4 py-2">
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {stats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <FiActivity className="w-5 h-5 text-neon-blue" />
              <p className="text-gray-400 text-sm">Total eventos</p>
            </div>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          {stats.por_accion.slice(0, 3).map((item) => {
            const badge = getAccionBadge(item.accion);
            const Icon = badge.icon;
            return (
              <div key={item.accion} className="glass rounded-2xl p-4 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-5 h-5 text-gray-400" />
                  <p className="text-gray-400 text-sm capitalize">{item.accion}</p>
                </div>
                <p className="text-2xl font-bold text-white">{item.count}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="glass rounded-2xl p-4 mb-6 border border-white/5">
        <div className="flex flex-col md:flex-row gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por email de usuario..."
              value={searchTerm}
              onChange={(e) => handleFilterChange(setSearchTerm)(e.target.value)}
              className="input-glass pl-10 pr-10 w-full"
            />
            {searchTerm && (
              <button onClick={() => handleFilterChange(setSearchTerm)('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          <select value={selectedAccion} onChange={(e) => handleFilterChange(setSelectedAccion)(e.target.value)} className="input-glass px-3 py-2 min-w-[140px]">
            <option value="">Todas las acciones</option>
            <option value="crear">Crear</option>
            <option value="editar">Editar</option>
            <option value="eliminar">Eliminar</option>
            <option value="importar">Importar</option>
          </select>

          <select value={selectedTabla} onChange={(e) => handleFilterChange(setSelectedTabla)(e.target.value)} className="input-glass px-3 py-2 min-w-[140px]">
            <option value="">Todas las tablas</option>
            <option value="items">Productos</option>
            <option value="almacenes">Almacenes</option>
            <option value="configuracion">Configuración</option>
          </select>

          <input type="date" value={fechaDesde} onChange={(e) => handleFilterChange(setFechaDesde)(e.target.value)} className="input-glass px-3 py-2" />
          <input type="date" value={fechaHasta} onChange={(e) => handleFilterChange(setFechaHasta)(e.target.value)} className="input-glass px-3 py-2" />

          <button onClick={handleClearFilters} className="px-4 py-2 rounded-xl glass text-gray-400 hover:text-white flex items-center gap-2">
            <FiFilter className="w-4 h-4" />
            Limpiar
          </button>
        </div>
      </div>

      <div className="overflow-x-auto glass rounded-2xl border border-white/5">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-4 py-3 text-xs text-gray-400 uppercase">Fecha</th>
              <th className="px-4 py-3 text-xs text-gray-400 uppercase">Usuario</th>
              <th className="px-4 py-3 text-xs text-gray-400 uppercase">Acción</th>
              <th className="px-4 py-3 text-xs text-gray-400 uppercase">Tabla</th>
              <th className="px-4 py-3 text-xs text-gray-400 uppercase">Registro</th>
              <th className="px-4 py-3 text-xs text-gray-400 uppercase">Campo</th>
              <th className="px-4 py-3 text-xs text-gray-400 uppercase">Valor Anterior</th>
              <th className="px-4 py-3 text-xs text-gray-400 uppercase">Valor Nuevo</th>
              <th className="px-4 py-3 text-xs text-gray-400 uppercase">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                  <FiPackage className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  No hay eventos de auditoría
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const badge = getAccionBadge(log.accion);
                const Icon = badge.icon;
                return (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">{formatDate(log.created_at)}</td>
                    <td className="px-4 py-3 text-white text-sm">{log.usuario_email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs border ${badge.color}`}>
                        <Icon className="w-3 h-3" />
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm capitalize">{log.tabla}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm">#{log.registro_id || '—'}</td>
                    <td className="px-4 py-3 text-neon-blue text-sm font-mono">{log.campo || '—'}</td>
                    <td className="px-4 py-3 text-red-400 text-sm">{renderValor(log.valor_anterior)}</td>
                    <td className="px-4 py-3 text-green-400 text-sm">{renderValor(log.valor_nuevo)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">{log.ip || '—'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between mt-6 gap-4">
        <div className="text-sm text-gray-400">
          Mostrando <span className="text-white font-semibold">{logs.length}</span> de{' '}
          <span className="text-white font-semibold">{totalItems.toLocaleString()}</span> eventos
          {' '}(página {currentPage} de {totalPages})
        </div>
        
        <div className="flex items-center gap-1">
          <button onClick={() => goToPage(1)} disabled={currentPage === 1} className="px-2 py-2 rounded-lg glass text-gray-400 hover:text-white disabled:opacity-30">
            <FiChevronsLeft className="w-4 h-4" />
          </button>
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-2 rounded-lg glass text-gray-400 hover:text-white disabled:opacity-30">
            <FiChevronLeft className="w-4 h-4" />
          </button>
          {getPageNumbers().map(page => (
            <button key={page} onClick={() => goToPage(page)} className={`px-3 py-2 rounded-lg transition-all ${page === currentPage ? 'bg-neon-blue text-white font-semibold' : 'glass text-gray-400 hover:text-white'}`}>
              {page}
            </button>
          ))}
          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-2 rounded-lg glass text-gray-400 hover:text-white disabled:opacity-30">
            <FiChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} className="px-2 py-2 rounded-lg glass text-gray-400 hover:text-white disabled:opacity-30">
            <FiChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}