import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { warehouseService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { uploadImage, deleteImage } from '../services/storage';
import toast from 'react-hot-toast';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiMapPin, 
  FiUser, 
  FiPhone, 
  FiImage,
  FiX,
  FiSave,
  FiUpload,
  FiHome,
  FiLoader
} from 'react-icons/fi';
import dynamic from 'next/dynamic';

const MapaAlmacen = dynamic(
  () => import('../components/MapaAlmacen'),
  { 
    ssr: false,
    loading: () => (
      <div className="glass rounded-2xl p-8 text-center border border-white/5 h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400 animate-pulse">Cargando mapa...</p>
        </div>
      </div>
    )
  }
);

// ✅ Función para abrir Google Maps
const openGoogleMaps = (lat, lng) => {
  if (lat && lng) {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  }
};

export default function Almacenes() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    distrito: '',
    direccion: '',
    encargado_nombre: '',
    encargado_telefono: '',
    latitud: -12.0464,
    longitud: -77.0428,
    imagen_url: '',
    imagen_file: null
  });

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const res = await warehouseService.getAll();
      setWarehouses(res.data || []);
    } catch (error) {
      toast.error('❌ Error al cargar almacenes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('❌ La imagen no puede superar los 5MB');
        return;
      }
      
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('❌ Formato no permitido. Usa JPG, PNG o WEBP');
        return;
      }

      setPreviewImage(file);
      setFormData({ ...formData, imagen_file: file });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAdmin()) {
      toast.error('❌ Solo administradores pueden gestionar almacenes');
      return;
    }

    setIsUploading(true);

    try {
      let imagen_url = formData.imagen_url || '';
      
      if (formData.imagen_file) {
        const loadingToast = toast.loading('📤 Subiendo imagen...');
        
        try {
          const uploadedUrl = await uploadImage(formData.imagen_file, 'imagenes');
          
          if (uploadedUrl) {
            imagen_url = uploadedUrl;
            if (editing && editing.imagen_url) {
              await deleteImage(editing.imagen_url);
            }
            toast.success('✅ Imagen subida correctamente', { id: loadingToast });
          } else {
            toast.error('❌ Error al subir la imagen', { id: loadingToast });
            setIsUploading(false);
            return;
          }
        } catch (error) {
          toast.error('❌ Error al subir imagen: ' + error.message, { id: loadingToast });
          setIsUploading(false);
          return;
        }
      }

      const dataToSave = {
        nombre: formData.nombre,
        distrito: formData.distrito,
        direccion: formData.direccion,
        encargado_nombre: formData.encargado_nombre,
        encargado_telefono: formData.encargado_telefono,
        latitud: formData.latitud || null,
        longitud: formData.longitud || null,
        imagen_url: imagen_url
      };

      if (editing) {
        await warehouseService.update(editing.id, dataToSave);
        toast.success('✅ Almacén actualizado');
      } else {
        await warehouseService.create(dataToSave);
        toast.success('✅ Almacén creado');
      }

      setShowForm(false);
      setEditing(null);
      setPreviewImage(null);
      resetForm();
      fetchWarehouses();
    } catch (error) {
      toast.error('❌ Error al guardar almacén');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin()) {
      toast.error('❌ Solo administradores pueden eliminar almacenes');
      return;
    }

    if (confirm('¿Estás seguro de eliminar este almacén?')) {
      try {
        const warehouse = warehouses.find(w => w.id === id);
        if (warehouse?.imagen_url) {
          await deleteImage(warehouse.imagen_url);
        }

        await warehouseService.delete(id);
        toast.success('✅ Almacén eliminado');
        fetchWarehouses();
      } catch (error) {
        toast.error('❌ Error al eliminar almacén');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      distrito: '',
      direccion: '',
      encargado_nombre: '',
      encargado_telefono: '',
      latitud: -12.0464,
      longitud: -77.0428,
      imagen_url: '',
      imagen_file: null
    });
    setPreviewImage(null);
  };

  const handleEdit = (warehouse) => {
    setEditing(warehouse);
    setFormData({
      nombre: warehouse.nombre || '',
      distrito: warehouse.distrito || '',
      direccion: warehouse.direccion || '',
      encargado_nombre: warehouse.encargado_nombre || '',
      encargado_telefono: warehouse.encargado_telefono || '',
      latitud: warehouse.latitud || -12.0464,
      longitud: warehouse.longitud || -77.0428,
      imagen_url: warehouse.imagen_url || '',
      imagen_file: null
    });
    setPreviewImage(warehouse.imagen_url || null);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400 animate-pulse">Cargando almacenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold neon-text-blue">
             {t('warehouses.title') || 'Almacenes'}
          </h1>
          <p className="text-gray-400 mt-1">
            {t('warehouses.subtitle') || 'Gestiona tus almacenes'}
          </p>
        </div>
        {isAdmin() && (
          <button
            onClick={() => {
              setEditing(null);
              resetForm();
              setShowForm(true);
            }}
            className="btn-neon text-white flex items-center gap-2 px-5 py-2.5"
          >
            <FiPlus className="w-4 h-4" />
            {t('warehouses.add') || 'Agregar Almacén'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="glass rounded-2xl p-6 border border-white/10 shadow-2xl animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              {editing ? <><FiEdit2 className="w-5 h-5 text-neon-blue" /> Editar Almacén</> : <><FiPlus className="w-5 h-5 text-neon-green" /> Nuevo Almacén</>}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setEditing(null);
                resetForm();
              }}
              className="p-2 rounded-xl glass-hover text-gray-400 hover:text-white transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                <FiImage className="w-4 h-4 text-neon-blue" />
                Imagen del Almacén
              </label>
              <div className="flex items-center gap-4">
                <div className="w-32 h-32 rounded-xl glass border border-white/10 overflow-hidden flex items-center justify-center">
                  {previewImage ? (
                    typeof previewImage === 'string' ? (
                      <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <img src={URL.createObjectURL(previewImage)} alt="Preview" className="w-full h-full object-cover" />
                    )
                  ) : (
                    <FiImage className="w-12 h-12 text-gray-500" />
                  )}
                </div>
                <div className="flex-1">
                  <label className={`btn-glass text-white cursor-pointer inline-flex items-center gap-2 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {isUploading ? <><FiLoader className="w-4 h-4 animate-spin" /> Subiendo...</> : <><FiUpload className="w-4 h-4" /> {previewImage ? 'Cambiar imagen' : 'Subir imagen'}</>}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" disabled={isUploading} />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Formatos: JPG, PNG, WEBP (Max 5MB)</p>
                </div>
              </div>
            </div>

            <input type="text" placeholder="Nombre" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} className="input-glass" required disabled={isUploading} />
            <input type="text" placeholder="Distrito" value={formData.distrito} onChange={(e) => setFormData({...formData, distrito: e.target.value})} className="input-glass" required disabled={isUploading} />
            <input type="text" placeholder="Dirección" value={formData.direccion} onChange={(e) => setFormData({...formData, direccion: e.target.value})} className="input-glass" required disabled={isUploading} />
            <input type="text" placeholder="Encargado" value={formData.encargado_nombre} onChange={(e) => setFormData({...formData, encargado_nombre: e.target.value})} className="input-glass" required disabled={isUploading} />
            <input type="text" placeholder="Teléfono" value={formData.encargado_telefono} onChange={(e) => setFormData({...formData, encargado_telefono: e.target.value})} className="input-glass" required disabled={isUploading} />
            
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                <FiMapPin className="w-4 h-4 text-neon-pink" />
                Ubicación (Latitud / Longitud)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" step="0.0001" placeholder="Latitud" value={formData.latitud} onChange={(e) => setFormData({...formData, latitud: parseFloat(e.target.value)})} className="input-glass" disabled={isUploading} />
                <input type="number" step="0.0001" placeholder="Longitud" value={formData.longitud} onChange={(e) => setFormData({...formData, longitud: parseFloat(e.target.value)})} className="input-glass" disabled={isUploading} />
              </div>
            </div>

            <div className="md:col-span-2 flex gap-4 pt-2">
              <button type="submit" disabled={isUploading} className={`btn-neon text-white font-medium flex-1 flex items-center justify-center gap-2 py-3 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isUploading ? <><FiLoader className="w-4 h-4 animate-spin" /> Guardando...</> : <><FiSave className="w-4 h-4" /> {editing ? 'Actualizar' : 'Guardar'}</>}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); resetForm(); }} className="btn-glass text-white flex-1 flex items-center justify-center gap-2 py-3" disabled={isUploading}>
                <FiX className="w-4 h-4" /> Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {warehouses.length === 0 ? (
          <div className="col-span-full glass rounded-2xl p-12 text-center border border-white/5">
            <FiHome className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">{t('warehouses.no_warehouses') || 'No hay almacenes registrados'}</p>
          </div>
        ) : (
          warehouses.map((warehouse) => (
            <div key={warehouse.id} className="glass rounded-2xl overflow-hidden border border-white/5 hover:border-neon-blue/30 transition-all duration-300 group">
              <div className="h-48 overflow-hidden relative">
                {warehouse.imagen_url ? (
                  <img src={warehouse.imagen_url} alt={warehouse.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-almacen.jpg'; }} />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-neon-blue/10 to-neon-pink/10 flex items-center justify-center">
                    <FiImage className="w-16 h-16 text-gray-600" />
                  </div>
                )}
                
                {/* ✅ CONTADOR DE ITEMS CON COLOR VISIBLE */}
                <div className="absolute top-3 right-3">
                  <span className="bg-black/70 text-white px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border border-white/20">
                    {warehouse.items_count || 0} items
                  </span>
                </div>
              </div>

              <div className="p-5">
                <h3 className="text-xl font-semibold neon-text-blue group-hover:neon-text-pink transition-all duration-300">{warehouse.nombre}</h3>
                
                <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                  <FiMapPin className="w-3 h-3 text-neon-blue" />
                  <span>{warehouse.distrito}</span>
                </div>
                
                <p className="text-gray-400 text-sm mt-1 line-clamp-2">{warehouse.direccion}</p>

                {warehouse.latitud && warehouse.longitud && (
                  <button
                    onClick={() => openGoogleMaps(warehouse.latitud, warehouse.longitud)}
                    className="mt-2 text-xs text-neon-blue hover:text-neon-pink transition-colors flex items-center gap-1"
                  >
                    <FiMapPin className="w-3 h-3" />
                    📍 Abrir en Google Maps
                  </button>
                )}

                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <FiUser className="w-4 h-4 text-neon-blue" />
                    <span>{warehouse.encargado_nombre}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300 text-sm mt-1">
                    <FiPhone className="w-4 h-4 text-neon-blue" />
                    <span>{warehouse.encargado_telefono}</span>
                  </div>
                </div>

                {isAdmin() && (
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => handleEdit(warehouse)} className="flex-1 px-3 py-2 rounded-xl glass text-neon-blue border border-neon-blue/30 hover:border-neon-blue/60 transition-all flex items-center justify-center gap-2 text-sm">
                      <FiEdit2 className="w-4 h-4" /> Editar
                    </button>
                    <button onClick={() => handleDelete(warehouse.id)} className="flex-1 px-3 py-2 rounded-xl glass text-neon-pink border border-neon-pink/30 hover:border-neon-pink/60 transition-all flex items-center justify-center gap-2 text-sm">
                      <FiTrash2 className="w-4 h-4" /> Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ✅ MAPA CON ESTRUCTURA CORRECTA */}
      {warehouses.some(w => w.latitud && w.longitud) && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            Ubicación de Almacenes
          </h2>
          <MapaAlmacen 
            almacenes={warehouses
              .filter(w => w.latitud && w.longitud)
              .map(w => ({
                ...w,
                lat: w.latitud,
                lng: w.longitud,
              }))
            } 
          />
        </div>
      )}
    </div>
  );
}
