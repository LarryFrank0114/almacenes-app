import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getConfig, saveConfig, uploadLogo, deleteLogo } from '../services/configService';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { FiSave, FiUpload, FiLoader, FiTrash2, FiRefreshCw } from 'react-icons/fi';

const DEFAULT_CONFIG = {
  nombre: 'Mi Empresa S.A.C.',
  slogan: 'Gestiona tu inventario de forma inteligente',
  logo: null,
  primarycolor: '#00d4ff',
  secondarycolor: '#ff00e5',
  accentcolor: '#00ff87'
};

export default function Configuracion() {
  const router = useRouter();
  const { isAdmin, loading } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [previewLogo, setPreviewLogo] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    slogan: '',
    primarycolor: '#00d4ff',
    secondarycolor: '#ff00e5',
    accentcolor: '#00ff87'
  });

  useEffect(() => {
    if (!loading && !isAdmin()) {
      router.push('/');
      toast.error('❌ No tienes permisos de administrador');
      return;
    }
    cargarConfiguracion();
  }, [loading, isAdmin]);

  const cargarConfiguracion = async () => {
    try {
      setCargando(true);
      console.log('🔄 Cargando configuración...');
      
      const data = await getConfig();
      console.log('📋 Datos recibidos:', data);
      
      if (data) {
        setFormData({
          nombre: data.nombre || DEFAULT_CONFIG.nombre,
          slogan: data.slogan || DEFAULT_CONFIG.slogan,
          primarycolor: data.primarycolor || DEFAULT_CONFIG.primarycolor,
          secondarycolor: data.secondarycolor || DEFAULT_CONFIG.secondarycolor,
          accentcolor: data.accentcolor || DEFAULT_CONFIG.accentcolor
        });
        setPreviewLogo(data.logo || null);
      } else {
        setFormData(DEFAULT_CONFIG);
        setPreviewLogo(null);
      }
    } catch (error) {
      console.error('❌ Error al cargar configuración:', error);
      toast.error('Error al cargar configuración');
      setFormData(DEFAULT_CONFIG);
    } finally {
      setCargando(false);
    }
  };

  const handleLogoChange = (e) => {
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

      setLogoFile(file);
      setPreviewLogo(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      let logoUrl = null;

      if (logoFile) {
        setSubiendoLogo(true);
        try {
          logoUrl = await uploadLogo(logoFile);
          if (logoUrl) {
            toast.success('✅ Logo subido correctamente');
          } else {
            throw new Error('No se pudo subir el logo');
          }
        } catch (error) {
          toast.error('❌ Error al subir logo: ' + error.message);
          setGuardando(false);
          setSubiendoLogo(false);
          return;
        }
        setSubiendoLogo(false);
      }

      const dataToSave = {
        nombre: formData.nombre,
        slogan: formData.slogan || '',
        logo: logoUrl || previewLogo || null,
        primarycolor: formData.primarycolor,
        secondarycolor: formData.secondarycolor,
        accentcolor: formData.accentcolor
      };

      console.log('📦 Datos a guardar:', dataToSave);

      const saved = await saveConfig(dataToSave);
      
      if (saved) {
        toast.success('✅ Configuración guardada');
        
        if (logoUrl) {
          setPreviewLogo(logoUrl);
          setLogoFile(null);
        }

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error('❌ Error al guardar configuración');
      }

    } catch (error) {
      console.error('❌ Error al guardar:', error);
      toast.error('❌ Error al guardar configuración: ' + error.message);
    } finally {
      setGuardando(false);
      setSubiendoLogo(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm('¿Estás seguro de eliminar el logo?')) return;

    try {
      await deleteLogo();
      setPreviewLogo(null);
      setLogoFile(null);
      toast.success('✅ Logo eliminado');
      
      const data = await getConfig();
      if (data) {
        setPreviewLogo(data.logo || null);
      }
    } catch (error) {
      toast.error('❌ Error al eliminar logo');
    }
  };

  if (cargando || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400 animate-pulse">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold neon-text-blue">
            ⚙️ Configuración
          </h1>
          <p className="text-gray-400 mt-1">Configura los datos de tu empresa</p>
        </div>
        <button
          onClick={cargarConfiguracion}
          className="btn-glass text-white flex items-center gap-2 text-sm"
        >
          <FiRefreshCw className="w-4 h-4" />
          Recargar
        </button>
      </div>

      <div className="glass rounded-2xl p-6 border border-white/10">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Logo de la Empresa</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-xl glass border border-white/10 overflow-hidden flex items-center justify-center">
                {previewLogo ? (
                  <img src={previewLogo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">🏗️</span>
                )}
              </div>
              <div className="flex-1">
                <label className={`btn-glass text-white cursor-pointer inline-flex items-center gap-2 ${subiendoLogo ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {subiendoLogo ? (
                    <>
                      <FiLoader className="w-4 h-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <FiUpload className="w-4 h-4" />
                      {previewLogo ? 'Cambiar logo' : 'Subir logo'}
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleLogoChange}
                    className="hidden"
                    disabled={subiendoLogo}
                  />
                </label>
                {previewLogo && (
                  <button
                    type="button"
                    onClick={handleDeleteLogo}
                    className="mt-2 text-sm text-neon-pink hover:text-neon-pink/80 transition-colors flex items-center gap-1"
                  >
                    <FiTrash2 className="w-3 h-3" />
                    Eliminar logo
                  </button>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Formatos: JPG, PNG, WEBP (Max 5MB)
                </p>
              </div>
            </div>
          </div>

          {/* Datos de empresa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Nombre de la Empresa</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                className="input-glass"
                required
                disabled={guardando}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Slogan</label>
              <input
                type="text"
                value={formData.slogan}
                onChange={(e) => setFormData({...formData, slogan: e.target.value})}
                className="input-glass"
                disabled={guardando}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Color Principal</label>
              <input
                type="color"
                value={formData.primarycolor}
                onChange={(e) => setFormData({...formData, primarycolor: e.target.value})}
                className="w-full h-12 rounded-xl glass border border-white/10 cursor-pointer"
                disabled={guardando}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Color Secundario</label>
              <input
                type="color"
                value={formData.secondarycolor}
                onChange={(e) => setFormData({...formData, secondarycolor: e.target.value})}
                className="w-full h-12 rounded-xl glass border border-white/10 cursor-pointer"
                disabled={guardando}
              />
            </div>
          </div>

          {/* Vista previa */}
          <div className="glass rounded-xl p-4 border border-white/5">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Vista Previa</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center" style={{ backgroundColor: formData.primarycolor }}>
                {previewLogo ? (
                  <img src={previewLogo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-lg">🏗️</span>
                )}
              </div>
              <div>
                <p className="text-white font-semibold" style={{ color: formData.primarycolor }}>
                  {formData.nombre || 'Mi Empresa'}
                </p>
                <p className="text-xs text-gray-400">{formData.slogan || 'Slogan de la empresa'}</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={guardando}
            className={`btn-neon text-white flex items-center justify-center gap-2 w-full py-3 ${guardando ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {guardando ? (
              <>
                <FiLoader className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <FiSave className="w-4 h-4" />
                Guardar Cambios
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}