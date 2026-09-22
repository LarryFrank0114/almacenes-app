'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/router';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import {
  FiUpload, FiFile, FiLoader, FiDownload, FiClock,
  FiAlertTriangle, FiCheckCircle, FiX, FiFilter,
  FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight,
  FiRefreshCw
} from 'react-icons/fi';
import { itemService } from '../services/api';

const PAGE_SIZE = 50;

export default function CargarExcel() {
  const router = useRouter();
  const { isAdmin, loading } = useAuth();

  // Modo: 'create' (subir todos) o 'update' (actualizar stock)
  const [mode, setMode] = useState('update');

  // Estados para modo 'update'
  const [previewData, setPreviewData] = useState(null);
  const [selectedCambios, setSelectedCambios] = useState({});
  const [filterTipo, setFilterTipo] = useState('cambios');
  const [currentPage, setCurrentPage] = useState(1);
  const [applying, setApplying] = useState(false);
  const [resultado, setResultado] = useState(null);

  // Estados para modo 'create'
  const [file, setFile] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [preview, setPreview] = useState([]);
  const [result, setResult] = useState(null);
  const [fullData, setFullData] = useState([]);
  const [progress, setProgress] = useState(0);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);

  if (!loading && !isAdmin()) {
    router.push('/');
    return null;
  }

  // ============================================
  // MODO 'CREATE' - Subir productos nuevos
  // ============================================
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('❌ Por favor, selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }

    setFile(selectedFile);

    if (mode === 'create') {
      previewExcel(selectedFile);
    }
  };

  const previewExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        setFullData(jsonData);
        setPreview(jsonData.slice(0, 10));
        toast.success(`✅ ${jsonData.length} productos encontrados`);
      } catch (error) {
        console.error('Error al leer archivo:', error);
        toast.error('❌ Error al leer el archivo');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const uploadProducts = async () => {
    if (!file || fullData.length === 0) {
      toast.error('❌ No hay datos para subir');
      return;
    }

    setLoadingData(true);
    setResult(null);
    setProgress(0);

    try {
      const CHUNK_SIZE = 500;
      const chunks = [];
      for (let i = 0; i < fullData.length; i += CHUNK_SIZE) {
        chunks.push(fullData.slice(i, i + CHUNK_SIZE));
      }

      setTotalChunks(chunks.length);

      let totalInserted = 0;
      let allErrors = [];
      let allWarnings = [];

      for (let i = 0; i < chunks.length; i++) {
        setCurrentChunk(i + 1);
        const progressPercent = ((i + 1) / chunks.length) * 100;
        setProgress(progressPercent);

        const response = await fetch('/api/upload-products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ products: chunks[i] }),
        });

        const resultData = await response.json();

        if (!response.ok) {
          throw new Error(resultData.error || `Error en lote ${i + 1}`);
        }

        if (resultData.inserted) {
          totalInserted += resultData.inserted;
        }
        if (resultData.errors) {
          allErrors = [...allErrors, ...resultData.errors];
        }
        if (resultData.warnings) {
          allWarnings = [...allWarnings, ...resultData.warnings];
        }

        toast.success(`✅ Lote ${i + 1}/${chunks.length} completado (${resultData.inserted || 0} productos)`);
      }

      setResult({
        success: true,
        total: fullData.length,
        inserted: totalInserted,
        errors: allErrors,
        warnings: allWarnings,
        chunks: chunks.length,
        message: `${totalInserted} de ${fullData.length} productos insertados correctamente`
      });

      toast.success(`✅ ${totalInserted} productos subidos correctamente`);

    } catch (error) {
      console.error('Error:', error);
      toast.error('❌ Error al subir productos: ' + error.message);
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoadingData(false);
      setCurrentChunk(0);
      setTotalChunks(0);
    }
  };

  // ============================================
  // MODO 'UPDATE' - Actualizar stock desde Excel
  // ============================================
  const handlePreviewBulkUpdate = async () => {
    if (!file) {
      toast.error('Selecciona un archivo primero');
      return;
    }

    setLoadingData(true);
    setPreviewData(null);
    setResultado(null);

    try {
      const res = await itemService.previewBulkUpdate(file);
      setPreviewData(res.data);

      // Seleccionar todos los cambios por defecto
      const seleccion = {};
      (res.data.cambios || []).forEach(c => {
        seleccion[c.item_id] = true;
      });
      setSelectedCambios(seleccion);
      setCurrentPage(1);

      toast.success(`✅ Análisis completado: ${res.data.total_cambios} cambios detectados`);
    } catch (error) {
      console.error('Error al analizar:', error);
      toast.error(error.response?.data?.detail || 'Error al procesar el Excel');
    } finally {
      setLoadingData(false);
    }
  };

  const handleApplyBulkUpdate = async () => {
    if (!previewData) return;

    const cambiosAplicar = previewData.cambios
      .filter(c => selectedCambios[c.item_id])
      .map(c => ({ item_id: c.item_id, stock_nuevo: c.stock_nuevo }));

    if (cambiosAplicar.length === 0) {
      toast.error('No has seleccionado ningún cambio');
      return;
    }

    if (!confirm(`¿Aplicar ${cambiosAplicar.length} cambios? Esta acción modificará el stock.`)) {
      return;
    }

    setApplying(true);

    try {
      const res = await itemService.applyBulkUpdate(cambiosAplicar);
      setResultado(res.data);
      toast.success(`✅ ${res.data.actualizados} productos actualizados`);
    } catch (error) {
      console.error('Error al aplicar:', error);
      toast.error(error.response?.data?.detail || 'Error al aplicar cambios');
    } finally {
      setApplying(false);
    }
  };

  const toggleSeleccion = (itemId) => {
    setSelectedCambios(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const toggleTodos = (checked) => {
    if (!previewData) return;
    const nuevo = {};
    (previewData.cambios || []).forEach(c => {
      nuevo[c.item_id] = checked;
    });
    setSelectedCambios(nuevo);
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData(null);
    setResultado(null);
    setSelectedCambios({});
    setCurrentPage(1);
    setPreview([]);
    setFullData([]);
    setResult(null);
    setProgress(0);
  };

  // ============================================
  // Paginación para el modal de cambios
  // ============================================
  const cambiosPaginados = useMemo(() => {
    if (!previewData?.cambios) return [];
    return previewData.cambios.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE
    );
  }, [previewData, currentPage]);

  const totalPages = previewData?.cambios
    ? Math.ceil(previewData.cambios.length / PAGE_SIZE)
    : 1;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const totalSeleccionados = Object.values(selectedCambios).filter(Boolean).length;

  const downloadTemplate = () => {
    const template = [
      {
        nombre: 'Ejemplo Producto 1',
        codigo: 'PROD-001',
        categoria: 'Electrónica',
        descripcion: 'Descripción del producto',
        stock: 10,
        stock_minimo: 5,
        precio: 99.99,
        precio_costo: 70.00,
        unidad_medida: 'unidad',
        ubicacion: 'Estante A1',
        almacen_nombre: 'Almacén Norte'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    XLSX.writeFile(wb, 'plantilla_productos.xlsx');
    toast.success('📥 Plantilla descargada');
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold neon-text-blue">
            Cargar Excel
          </h1>
          <p className="text-gray-400 mt-1">
            {mode === 'update'
              ? 'Actualiza el stock desde un Excel comparando por código'
              : 'Sube un archivo Excel con productos nuevos'
            }
          </p>
        </div>
        {mode === 'create' && (
          <button
            onClick={downloadTemplate}
            className="btn-glass text-white flex items-center gap-2"
          >
            <FiDownload className="w-4 h-4" />
            Descargar Plantilla
          </button>
        )}
      </div>

      {/* Selector de modo */}
      <div className="glass rounded-2xl p-2 border border-white/5 flex gap-2">
        <button
          onClick={() => { setMode('update'); handleReset(); }}
          className={`flex-1 px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            mode === 'update'
              ? 'bg-neon-green text-white font-semibold'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FiRefreshCw className="w-5 h-5" />
          Actualizar Stock (por código)
        </button>
        <button
          onClick={() => { setMode('create'); handleReset(); }}
          className={`flex-1 px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            mode === 'create'
              ? 'bg-neon-blue text-white font-semibold'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FiUpload className="w-5 h-5" />
          Subir Productos Nuevos
        </button>
      </div>

      {/* Info según modo */}
      <div className="glass rounded-2xl p-4 border border-white/5">
        {mode === 'update' ? (
          <div className="text-sm text-gray-300">
            <p className="font-semibold text-neon-green mb-2">📋 Modo: Actualizar Stock</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>Solo se usan las columnas <code className="text-neon-blue">codigo</code> y <code className="text-neon-blue">stock</code>.</li>
              <li>Se compara cada código con la base de datos.</li>
              <li>Se muestran los cambios detectados para que los revises.</li>
              <li>Puedes seleccionar qué cambios aplicar.</li>
              <li>Cada cambio se registra en la auditoría.</li>
            </ul>
          </div>
        ) : (
          <div className="text-sm text-gray-300">
            <p className="font-semibold text-neon-blue mb-2">📋 Modo: Subir Productos Nuevos</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>Sube un Excel completo con todos los campos.</li>
              <li>Los productos se insertan en lotes de 500.</li>
              <li>Los códigos duplicados generarán errores (no se actualizan).</li>
            </ul>
          </div>
        )}
      </div>

      {/* Zona de carga */}
      <div className="glass rounded-2xl p-8 border border-white/10 text-center">
        <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 hover:border-neon-blue/50 transition-all">
          <div className="flex flex-col items-center gap-4">
            <FiUpload className="w-16 h-16 text-gray-500" />
            <div>
              <p className="text-white font-medium">Selecciona tu archivo Excel</p>
              <p className="text-gray-400 text-sm">.xlsx o .xls (Max 10MB)</p>
            </div>
            <label className="btn-neon text-white cursor-pointer px-6 py-2.5">
              <FiFile className="inline mr-2" />
              Seleccionar archivo
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {file && (
              <div className="space-y-1">
                <p className="text-neon-green text-sm">
                  ✅ {file.name} ({Math.round(file.size / 1024)} KB)
                </p>
                {mode === 'create' && fullData.length > 0 && (
                  <p className="text-gray-400 text-sm">
                    📊 {fullData.length} productos encontrados
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODO UPDATE: Botón Analizar */}
      {mode === 'update' && file && !previewData && !resultado && (
        <button
          onClick={handlePreviewBulkUpdate}
          disabled={loadingData}
          className={`w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-3 transition-all ${
            loadingData ? 'bg-gray-600 cursor-not-allowed' : 'btn-neon-green'
          }`}
        >
          {loadingData ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Analizando Excel...
            </>
          ) : (
            <>
              <FiRefreshCw className="w-5 h-5" />
              Analizar Excel (sin aplicar cambios)
            </>
          )}
        </button>
      )}

      {/* MODO UPDATE: Resultado del análisis */}
      {mode === 'update' && previewData && !resultado && (
        <div className="glass rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <FiCheckCircle className="w-8 h-8 text-green-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">Análisis completado</h2>
              <p className="text-gray-400 text-sm">Revisa los cambios antes de aplicarlos</p>
            </div>
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="glass rounded-xl p-4">
              <p className="text-gray-400 text-sm">Total filas</p>
              <p className="text-2xl font-bold text-white">{previewData.total_filas}</p>
            </div>
            <div className="glass rounded-xl p-4">
              <p className="text-gray-400 text-sm">Cambios detectados</p>
              <p className="text-2xl font-bold text-neon-green">{previewData.total_cambios}</p>
            </div>
            <div className="glass rounded-xl p-4">
              <p className="text-gray-400 text-sm">No encontrados</p>
              <p className="text-2xl font-bold text-yellow-400">{previewData.total_no_encontrados}</p>
            </div>
            <div className="glass rounded-xl p-4">
              <p className="text-gray-400 text-sm">Errores</p>
              <p className="text-2xl font-bold text-red-400">{previewData.total_errores}</p>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => { setFilterTipo('cambios'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm transition-all ${
                filterTipo === 'cambios'
                  ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                  : 'glass text-gray-400 hover:text-white'
              }`}
            >
              Cambios ({previewData.total_cambios})
            </button>
            <button
              onClick={() => { setFilterTipo('no_encontrados'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm transition-all ${
                filterTipo === 'no_encontrados'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'glass text-gray-400 hover:text-white'
              }`}
            >
              No encontrados ({previewData.total_no_encontrados})
            </button>
            <button
              onClick={() => { setFilterTipo('errores'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm transition-all ${
                filterTipo === 'errores'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'glass text-gray-400 hover:text-white'
              }`}
            >
              Errores ({previewData.total_errores})
            </button>
          </div>

          {/* Tabla de cambios */}
          {filterTipo === 'cambios' && previewData.cambios.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">
                  Cambios detectados
                </h3>
                <div className="flex items-center gap-2 text-sm">
                  <button
                    onClick={() => toggleTodos(true)}
                    className="px-3 py-1 rounded-lg bg-neon-green/20 text-neon-green hover:bg-neon-green/30"
                  >
                    Seleccionar todo
                  </button>
                  <button
                    onClick={() => toggleTodos(false)}
                    className="px-3 py-1 rounded-lg bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                  >
                    Deseleccionar todo
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/10 mb-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="px-3 py-2 text-xs text-gray-400 uppercase w-10">
                        <input
                          type="checkbox"
                          checked={totalSeleccionados === previewData.cambios.length && previewData.cambios.length > 0}
                          onChange={(e) => toggleTodos(e.target.checked)}
                          className="cursor-pointer"
                        />
                      </th>
                      <th className="px-3 py-2 text-xs text-gray-400 uppercase">Código</th>
                      <th className="px-3 py-2 text-xs text-gray-400 uppercase">Producto</th>
                      <th className="px-3 py-2 text-xs text-gray-400 uppercase hidden md:table-cell">Almacén</th>
                      <th className="px-3 py-2 text-xs text-gray-400 uppercase text-right">Stock Actual</th>
                      <th className="px-3 py-2 text-xs text-gray-400 uppercase text-right">Stock Nuevo</th>
                      <th className="px-3 py-2 text-xs text-gray-400 uppercase text-right">Diferencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cambiosPaginados.map((cambio) => (
                      <tr
                        key={cambio.item_id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={!!selectedCambios[cambio.item_id]}
                            onChange={() => toggleSeleccion(cambio.item_id)}
                            className="cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2 text-gray-400 font-mono text-xs">{cambio.codigo}</td>
                        <td className="px-3 py-2 text-white text-sm max-w-[250px] truncate">{cambio.nombre}</td>
                        <td className="px-3 py-2 text-gray-400 text-sm hidden md:table-cell">{cambio.almacen}</td>
                        <td className="px-3 py-2 text-right text-gray-300">{cambio.stock_anterior}</td>
                        <td className="px-3 py-2 text-right text-neon-green font-semibold">{cambio.stock_nuevo}</td>
                        <td className={`px-3 py-2 text-right text-sm font-semibold ${
                          cambio.diferencia > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {cambio.diferencia > 0 ? '+' : ''}{cambio.diferencia}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-400">
                    Mostrando {cambiosPaginados.length} de {previewData.cambios.length} cambios
                    {' '}(página {currentPage} de {totalPages})
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-2 py-1 rounded-lg glass text-gray-400 hover:text-white disabled:opacity-30"
                    >
                      <FiChevronsLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-1 rounded-lg glass text-gray-400 hover:text-white disabled:opacity-30"
                    >
                      <FiChevronLeft className="w-4 h-4" />
                    </button>
                    {getPageNumbers().map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-lg text-sm transition-all ${
                          page === currentPage
                            ? 'bg-neon-green text-white font-semibold'
                            : 'glass text-gray-400 hover:text-white'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 rounded-lg glass text-gray-400 hover:text-white disabled:opacity-30"
                    >
                      <FiChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 rounded-lg glass text-gray-400 hover:text-white disabled:opacity-30"
                    >
                      <FiChevronsRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Tabla de no encontrados */}
          {filterTipo === 'no_encontrados' && previewData.no_encontrados.length > 0 && (
            <div className="glass rounded-xl p-4 mb-4 max-h-96 overflow-y-auto">
              <p className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
                <FiAlertTriangle className="w-4 h-4" />
                Códigos no encontrados en la base de datos ({previewData.no_encontrados.length}):
              </p>
              <div className="flex flex-wrap gap-1">
                {previewData.no_encontrados.map((codigo, i) => (
                  <span key={i} className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded font-mono">
                    {codigo}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Lista de errores */}
          {filterTipo === 'errores' && previewData.errores.length > 0 && (
            <div className="glass rounded-xl p-4 mb-4 max-h-96 overflow-y-auto">
              <p className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                <FiAlertTriangle className="w-4 h-4" />
                Errores ({previewData.errores.length}):
              </p>
              {previewData.errores.map((err, i) => (
                <p key={i} className="text-xs text-red-400 mb-1 font-mono">{err}</p>
              ))}
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              onClick={handleApplyBulkUpdate}
              disabled={applying || totalSeleccionados === 0}
              className={`flex-1 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all ${
                applying || totalSeleccionados === 0
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'btn-neon-green'
              }`}
            >
              {applying ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Aplicando cambios...
                </>
              ) : (
                <>
                  <FiCheckCircle className="w-5 h-5" />
                  Aplicar {totalSeleccionados} cambios
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 rounded-xl glass text-gray-400 hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* MODO UPDATE: Resultado final */}
      {mode === 'update' && resultado && (
        <div className="glass rounded-2xl p-6 border border-neon-green/30">
          <div className="flex items-center gap-3 mb-4">
            <FiCheckCircle className="w-8 h-8 text-green-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">Actualización completada</h2>
              <p className="text-gray-400 text-sm">{resultado.message}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="glass rounded-xl p-4">
              <p className="text-gray-400 text-sm">Actualizados</p>
              <p className="text-2xl font-bold text-neon-green">{resultado.actualizados}</p>
            </div>
            <div className="glass rounded-xl p-4">
              <p className="text-gray-400 text-sm">Errores</p>
              <p className="text-2xl font-bold text-red-400">{resultado.errores}</p>
            </div>
          </div>

          {resultado.detalle_errores?.length > 0 && (
            <div className="glass rounded-xl p-3 mb-4 max-h-48 overflow-y-auto">
              {resultado.detalle_errores.map((err, i) => (
                <p key={i} className="text-xs text-red-400 mb-1">{err}</p>
              ))}
            </div>
          )}

          <button
            onClick={handleReset}
            className="w-full py-3 rounded-xl glass text-white hover:bg-white/10 transition-all"
          >
            Procesar otro archivo
          </button>
        </div>
      )}

      {/* MODO CREATE: Vista previa */}
      {mode === 'create' && preview.length > 0 && (
        <div className="glass rounded-2xl p-6 border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            📋 Vista previa
            <span className="text-sm text-gray-400">({fullData.length} productos)</span>
          </h2>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 glass">
                <tr className="border-b border-white/5">
                  {Object.keys(preview[0] || {}).map((key) => (
                    <th key={key} className="px-4 py-2 text-left text-xs font-semibold text-neon-blue uppercase whitespace-nowrap">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                    {Object.values(row).map((val, i) => (
                      <td key={i} className="px-4 py-2 text-gray-300 whitespace-nowrap">
                        {String(val).substring(0, 30)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {fullData.length > 10 && (
              <p className="text-xs text-gray-400 mt-2">
                Mostrando 10 de {fullData.length} productos
              </p>
            )}
          </div>
        </div>
      )}

      {/* MODO CREATE: Botón subir */}
      {mode === 'create' && fullData.length > 0 && (
        <button
          onClick={uploadProducts}
          disabled={loadingData}
          className="btn-neon text-white flex items-center justify-center gap-2 w-full py-3 disabled:opacity-50"
        >
          {loadingData ? (
            <>
              <FiLoader className="w-4 h-4 animate-spin" />
              Subiendo lotes... ({currentChunk}/{totalChunks})
            </>
          ) : (
            <>
              <FiUpload className="w-4 h-4" />
              Subir {fullData.length} productos en lotes de 500
            </>
          )}
        </button>
      )}

      {/* MODO CREATE: Progreso */}
      {mode === 'create' && loadingData && (
        <div className="glass rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <FiClock className="w-5 h-5 text-neon-blue animate-spin-slow" />
            <span className="text-white">
              Procesando lote {currentChunk} de {totalChunks}...
            </span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-neon-blue to-neon-pink rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {Math.round(progress)}% completado - {fullData.length} productos en total
          </p>
        </div>
      )}

      {/* MODO CREATE: Resultado */}
      {mode === 'create' && result && (
        <div className={`glass rounded-2xl p-6 border ${result.success !== false ? 'border-neon-green/30' : 'border-neon-pink/30'}`}>
          <h2 className="text-lg font-semibold text-white mb-4">
            {result.success !== false ? '✅ Resultado' : '❌ Error'}
          </h2>
          {result.success !== false ? (
            <div className="space-y-2">
              <p className="text-gray-300">
                <span className="text-neon-blue">Total en archivo:</span> {result.total} productos
              </p>
              <p className="text-gray-300">
                <span className="text-neon-green">Insertados:</span> {result.inserted} productos
              </p>

              {result.warnings && result.warnings.length > 0 && (
                <div className="mt-2 p-3 glass rounded-xl border border-yellow-500/20">
                  <p className="text-yellow-400 text-sm font-medium mb-2 flex items-center gap-2">
                    <FiAlertTriangle className="w-4 h-4" />
                    Advertencias ({result.warnings.length}):
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {result.warnings.slice(0, 10).map((warn, idx) => (
                      <p key={idx} className="text-gray-400 text-xs">{warn}</p>
                    ))}
                  </div>
                </div>
              )}

              {result.errors && result.errors.length > 0 && (
                <div className="mt-2 p-3 glass rounded-xl border border-neon-pink/20 max-h-64 overflow-y-auto">
                  <p className="text-neon-pink text-sm font-medium mb-2">
                    ❌ Errores ({result.errors.length}):
                  </p>
                  <div className="space-y-1">
                    {result.errors.slice(0, 20).map((err, idx) => (
                      <p key={idx} className="text-gray-400 text-xs font-mono border-b border-white/5 pb-1">
                        {err}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-neon-pink">{result.error || 'Error al subir productos'}</p>
          )}
        </div>
      )}

      {/* Instrucciones para modo CREATE */}
      {mode === 'create' && (
        <div className="glass rounded-2xl p-6 border border-white/5">
          <h2 className="text-lg font-semibold text-white mb-4">📝 Instrucciones</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="text-gray-400">📄 <span className="text-neon-blue">Columnas requeridas:</span></p>
              <ul className="list-disc list-inside text-gray-400 space-y-1 ml-2">
                <li><span className="text-neon-blue">nombre</span> - Nombre del producto</li>
                <li><span className="text-neon-blue">codigo</span> - Código único</li>
                <li><span className="text-neon-blue">stock</span> - Cantidad en inventario</li>
                <li><span className="text-neon-blue">precio</span> - Precio de venta</li>
                <li><span className="text-neon-blue">almacen_nombre</span> - Nombre del almacén (debe existir)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="text-gray-400">📊 <span className="text-neon-blue">Columnas opcionales:</span></p>
              <ul className="list-disc list-inside text-gray-400 space-y-1 ml-2">
                <li><span className="text-gray-300">categoria</span></li>
                <li><span className="text-gray-300">descripcion</span></li>
                <li><span className="text-gray-300">stock_minimo</span></li>
                <li><span className="text-gray-300">precio_costo</span></li>
                <li><span className="text-gray-300">unidad_medida</span></li>
                <li><span className="text-gray-300">ubicacion</span></li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}