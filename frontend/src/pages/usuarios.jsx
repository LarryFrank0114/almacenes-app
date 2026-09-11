'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { 
  FiUser, 
  FiShield, 
  FiEdit2, 
  FiSave, 
  FiX,
  FiCheck,
  FiXCircle,
  FiSearch,
  FiRefreshCw,
  FiAlertTriangle,
  FiEye,
  FiUserPlus
} from 'react-icons/fi';

export default function Usuarios() {
  const router = useRouter();
  const { user, isAdmin, canManageUsers, loading } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [search, setSearch] = useState('');
  const [editando, setEditando] = useState(null);
  const [editRol, setEditRol] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        toast.error('Debes iniciar sesión');
        return;
      }
      if (!canManageUsers()) {
        router.push('/');
        toast.error('No tienes permisos para gestionar usuarios');
        return;
      }
      cargarUsuarios();
    }
  }, [loading, user, canManageUsers]);

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      setError(null);

      console.log('🔍 Cargando usuarios desde tabla usuarios...');

      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error al cargar usuarios:', error);
        setError(error.message);
        
        if (error.message.includes('permission denied')) {
          toast.error('⚠️ Error de permisos. Ejecuta el SQL en Supabase para deshabilitar RLS.');
        } else if (error.message.includes('infinite recursion')) {
          toast.error('⚠️ Error de políticas RLS. Ejecuta el SQL en Supabase.');
        } else {
          toast.error('Error al cargar usuarios: ' + error.message);
        }
        setUsuarios([]);
      } else {
        console.log('✅ Usuarios cargados:', data);
        setUsuarios(data || []);
        toast.success(`✅ ${data?.length || 0} usuarios cargados`);
      }
    } catch (error) {
      console.error('❌ Error general:', error);
      setError(error.message);
      toast.error('Error al cargar usuarios');
    } finally {
      setCargando(false);
    }
  };

  const cambiarRol = async (id, nuevoRol) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ rol: nuevoRol, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast.success(`✅ Rol actualizado a: ${nuevoRol}`);
      setEditando(null);
      cargarUsuarios();
    } catch (error) {
      toast.error('❌ Error al actualizar rol: ' + error.message);
    }
  };

  const toggleActivo = async (id, estadoActual) => {
    try {
      const nuevoEstado = !estadoActual;
      const { error } = await supabase
        .from('usuarios')
        .update({ activo: nuevoEstado, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast.success(`✅ Usuario ${nuevoEstado ? 'activado' : 'desactivado'}`);
      cargarUsuarios();
    } catch (error) {
      toast.error('❌ Error al cambiar estado: ' + error.message);
    }
  };

  const usuariosFiltrados = usuarios.filter(u => 
    u.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  // ✅ Obtener badge según el rol
  const getRolBadge = (rol) => {
    const roles = {
      admin: { 
        label: '👑 Admin', 
        color: 'bg-neon-blue/20 text-neon-blue border-neon-blue/30',
        icon: FiShield
      },
      editor: { 
        label: '✏️ Editor', 
        color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        icon: FiEdit2
      },
      viewer: { 
        label: '👁️ Viewer', 
        color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        icon: FiEye
      }
    };
    const r = roles[rol] || roles.viewer;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${r.color}`}>
        {r.label}
      </span>
    );
  };

  if (loading || cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400 animate-pulse">Cargando usuarios...</p>
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
            👥 Gestión de Usuarios
          </h1>
          <p className="text-gray-400 mt-1">
            Administra los usuarios y sus roles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={cargarUsuarios}
            className="btn-glass text-white flex items-center gap-2 text-sm"
          >
            <FiRefreshCw className="w-4 h-4" />
            Actualizar
          </button>
          <span className="glass px-3 py-1.5 rounded-xl text-sm text-gray-300">
            Total: {usuarios.length} usuarios
          </span>
        </div>
      </div>

      {/* Error de RLS */}
      {error && (
        <div className="glass rounded-2xl p-4 border border-red-500/30 bg-red-500/10">
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <p className="text-red-400 font-semibold">⚠️ Error de políticas de seguridad (RLS)</p>
              <p className="text-gray-400 text-sm mt-1">
                Ejecuta este SQL en Supabase para solucionarlo:
              </p>
              <div className="bg-crystal-dark rounded-xl p-3 mt-2 text-xs text-gray-300 font-mono overflow-x-auto">
                <code>
                  ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;<br />
                  ALTER TABLE almacenes DISABLE ROW LEVEL SECURITY;<br />
                  ALTER TABLE items DISABLE ROW LEVEL SECURITY;
                </code>
              </div>
              <button
                onClick={cargarUsuarios}
                className="mt-2 btn-neon text-white text-sm px-4 py-1.5"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Buscador */}
      <div className="glass rounded-2xl p-4 border border-white/5">
        <div className="relative max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-glass pl-10"
          />
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="glass rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-4 py-3 text-left text-xs font-semibold text-neon-blue uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neon-blue uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neon-blue uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neon-blue uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neon-blue uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-400">
                    {search ? 'No hay usuarios que coincidan con la búsqueda' : 'No hay usuarios registrados'}
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((usuario) => {
                  const esAdmin = usuario.rol === 'admin';
                  const esUsuarioActual = user?.email === usuario.email;
                  const estaActivo = usuario.activo !== false;

                  return (
                    <tr key={usuario.id} className={`hover:bg-white/5 transition-colors ${!estaActivo ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-blue to-neon-pink flex items-center justify-center text-white font-bold text-sm">
                            {usuario.nombre?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <span className="text-sm text-white font-medium">
                            {usuario.nombre}
                          </span>
                          {esAdmin && (
                            <FiShield className="w-4 h-4 text-neon-blue" />
                          )}
                          {esUsuarioActual && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full glass text-neon-blue border border-neon-blue/30">
                              TÚ
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        {usuario.email}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {editando === usuario.id ? (
                          <div className="flex items-center gap-1">
                            <select
                              value={editRol}
                              onChange={(e) => setEditRol(e.target.value)}
                              className="input-glass text-sm py-1 px-2"
                            >
                              <option value="viewer">👁️ Viewer</option>
                              <option value="editor">✏️ Editor</option>
                              <option value="admin">👑 Admin</option>
                            </select>
                            <button
                              onClick={() => cambiarRol(usuario.id, editRol)}
                              className="p-1 rounded-lg bg-neon-green/20 text-neon-green hover:bg-neon-green/30 transition-colors"
                            >
                              <FiSave className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditando(null)}
                              className="p-1 rounded-lg bg-neon-pink/20 text-neon-pink hover:bg-neon-pink/30 transition-colors"
                            >
                              <FiX className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          getRolBadge(usuario.rol)
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${
                          estaActivo
                            ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                            : 'bg-neon-pink/20 text-neon-pink border border-neon-pink/30'
                        }`}>
                          {estaActivo ? (
                            <><FiCheck className="w-3 h-3" /> Activo</>
                          ) : (
                            <><FiXCircle className="w-3 h-3" /> Inactivo</>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex gap-1">
                          {!esUsuarioActual && (
                            <button
                              onClick={() => {
                                setEditando(usuario.id);
                                setEditRol(usuario.rol || 'viewer');
                              }}
                              className="p-1.5 rounded-lg glass text-neon-blue hover:border-neon-blue/60 transition-all"
                              title="Cambiar rol"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                          )}
                          {!esUsuarioActual && (
                            <button
                              onClick={() => toggleActivo(usuario.id, estaActivo)}
                              className={`p-1.5 rounded-lg glass transition-all ${
                                estaActivo
                                  ? 'text-yellow-400 hover:border-yellow-400/60'
                                  : 'text-neon-green hover:border-neon-green/60'
                              }`}
                              title={estaActivo ? 'Desactivar' : 'Activar'}
                            >
                              {estaActivo ? <FiXCircle className="w-4 h-4" /> : <FiCheck className="w-4 h-4" />}
                            </button>
                          )}
                          {esUsuarioActual && (
                            <span className="text-xs text-gray-400 px-2 py-1 glass rounded-lg">
                              No puedes modificar tu propio usuario
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pie de tabla */}
        <div className="px-4 py-3 border-t border-white/5 bg-white/5 flex justify-between items-center text-xs text-gray-400">
          <span>
            Mostrando {usuariosFiltrados.length} de {usuarios.length} usuarios
          </span>
          <span className="flex gap-3">
            <span>👑 {usuarios.filter(u => u.rol === 'admin').length} admin</span>
            <span>✏️ {usuarios.filter(u => u.rol === 'editor').length} editor</span>
            <span>👁️ {usuarios.filter(u => u.rol === 'viewer').length} viewer</span>
          </span>
        </div>
      </div>
    </div>
  );
}
