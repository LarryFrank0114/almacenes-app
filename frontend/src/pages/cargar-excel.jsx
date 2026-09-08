import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/router';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { FiUpload, FiFile, FiLoader, FiDownload, FiClock, FiAlertTriangle } from 'react-icons/fi';

export default function CargarExcel() {
  const router = useRouter();
  const { isAdmin, loading } = useAuth();
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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls)$/)) {
      toast.error('❌ Por favor, selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }

    setFile(selectedFile);
    previewExcel(selectedFile);
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold neon-text-blue">
            Cargar Productos desde Excel
          </h1>
          <p className="text-gray-400 mt-1">
            Sube un archivo Excel con tus productos para importarlos a la base de datos
          </p>
        </div>
        <button
          onClick={downloadTemplate}
          className="btn-glass text-white flex items-center gap-2"
        >
          <FiDownload className="w-4 h-4" />
          Descargar Plantilla
        </button>
      </div>

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
                <p className="text-gray-400 text-sm">
                  📊 {fullData.length} productos encontrados
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {preview.length > 0 && (
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

      {fullData.length > 0 && (
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

      {loadingData && (
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

      {result && (
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
                    {result.warnings.length > 10 && (
                      <p className="text-gray-400 text-xs">... y {result.warnings.length - 10} advertencias más</p>
                    )}
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
                    {result.errors.length > 20 && (
                      <p className="text-gray-400 text-xs mt-2 text-center">
                        ... y {result.errors.length - 20} errores más
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-neon-pink">{result.error || 'Error al subir productos'}</p>
          )}
        </div>
      )}

      <div className="glass rounded-2xl p-6 border border-white/5">
        <h2 className="text-lg font-semibold text-white mb-4">📝 Instrucciones</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <p className="text-gray-400">📄 <span className="text-neon-blue">Columnas requeridas:</span></p>
            <ul className="list-disc list-inside text-gray-400 space-y-1 ml-2">
              <li><span className="text-neon-blue">nombre</span> - Nombre del producto (hasta 500 caracteres)</li>
              <li><span className="text-neon-blue">codigo</span> - Código único (hasta 100 caracteres)</li>
              <li><span className="text-neon-blue">stock</span> - Cantidad en inventario (número)</li>
              <li><span className="text-neon-blue">precio</span> - Precio de venta (número)</li>
              <li><span className="text-neon-blue">almacen_nombre</span> - Nombre del almacén (debe existir)</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-gray-400">📊 <span className="text-neon-blue">Columnas opcionales:</span></p>
            <ul className="list-disc list-inside text-gray-400 space-y-1 ml-2">
              <li><span className="text-gray-300">categoria</span> - Categoría (hasta 100 caracteres)</li>
              <li><span className="text-gray-300">descripcion</span> - Descripción (hasta 2000 caracteres)</li>
              <li><span className="text-gray-300">stock_minimo</span> - Stock mínimo (default: 5)</li>
              <li><span className="text-gray-300">precio_costo</span> - Precio de costo</li>
              <li><span className="text-gray-300">unidad_medida</span> - Unidad (hasta 50 caracteres)</li>
              <li><span className="text-gray-300">ubicacion</span> - Ubicación (hasta 200 caracteres)</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 glass rounded-xl border border-yellow-500/20">
          <p className="text-yellow-400 text-sm">
            💡 <span className="font-medium">Consejo:</span> Los campos largos se truncarán automáticamente 
            a los límites permitidos. Revisa las advertencias para ver qué campos fueron truncados.
          </p>
        </div>
      </div>
    </div>
  );
}