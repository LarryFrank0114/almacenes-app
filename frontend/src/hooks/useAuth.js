'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Evento de autenticación:', event);
        
        if (session) {
          setUser(session.user);
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
          setUserRole(null);
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        await fetchUserProfile(session.user);
      }
    } catch (error) {
      console.error('❌ Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (user) => {
    try {
      if (!user?.email) {
        console.warn('⚠️ No hay email en user');
        return;
      }

      console.log('🔍 Buscando usuario:', user.email);
      console.log('📋 Metadata de Auth:', user?.user_metadata);

      // ✅ EXTRAER FOTO DE GOOGLE (CRÍTICO)
      const metadata = user?.user_metadata || {};
      let avatar = 
        metadata?.avatar_url || 
        metadata?.picture || 
        metadata?.photo_url || 
        metadata?.avatar ||
        null;

      // ✅ SI NO HAY FOTO EN METADATA, INTENTAR OBTENERLA DIRECTAMENTE DESDE GOOGLE API
      if (!avatar && user?.app_metadata?.provider === 'google') {
        try {
          console.log('🖼️ Intentando obtener foto desde Google API...');
          
          const { data: { session } } = await supabase.auth.getSession();
          const accessToken = session?.access_token;
          
          const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          
          const userInfo = await response.json();
          avatar = userInfo?.picture || null;
          
          console.log('🖼️ Foto obtenida desde Google API:', avatar);
        } catch (e) {
          console.warn('⚠️ No se pudo obtener foto de Google:', e);
        }
      }

      // ✅ EXTRAER NOMBRE DE GOOGLE
      let rol = metadata?.rol || 'viewer'; // ✅ CAMBIO: rol por defecto es 'viewer'
      let nombre = 
        metadata?.nombre || 
        metadata?.full_name || 
        metadata?.name || 
        user.email?.split('@')[0] || 'Usuario';

      console.log('👤 Nombre desde metadata:', nombre);
      console.log('🖼️ Avatar desde metadata:', avatar);

      // ✅ VERIFICAR ROL EN LA TABLA USUARIOS (FUENTE DE VERDAD)
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', user.email)
          .single();

        if (error) {
          console.warn('⚠️ Error en tabla usuarios:', error.message);
          
          // Si no existe en la tabla, crearlo con rol 'viewer' por defecto
          if (error.code === 'PGRST116') {
            console.log('📝 Creando usuario en tabla con rol viewer...');
            const newUser = {
              email: user.email,
              nombre: nombre,
              rol: 'viewer', // ✅ CAMBIO: rol por defecto es 'viewer'
              activo: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            const { error: insertError } = await supabase
              .from('usuarios')
              .insert([newUser]);
              
            if (insertError) {
              console.warn('⚠️ Error al crear usuario:', insertError);
            } else {
              console.log('✅ Usuario creado en tabla con rol: viewer');
              rol = 'viewer';
            }
          }
        } else if (data) {
          console.log('✅ Datos desde tabla usuarios:', data);
          
          // ✅ EL ROL DE LA TABLA ES LA FUENTE DE VERDAD
          rol = data.rol || rol;
          nombre = data.nombre || nombre;
          
          console.log('📋 Rol desde tabla (fuente de verdad):', rol);
          console.log('👑 Es ADMIN?', rol === 'admin');
          
          // Si el rol en tabla es diferente al de Auth, actualizar Auth
          if (data.rol && data.rol !== user?.user_metadata?.rol) {
            console.log('🔄 Actualizando rol en Auth metadata a:', data.rol);
            try {
              await supabase.auth.updateUser({
                data: { 
                  rol: data.rol,
                  nombre: data.nombre || nombre
                }
              });
              console.log('✅ Auth metadata actualizada');
            } catch (authError) {
              console.warn('⚠️ No se pudo actualizar Auth:', authError);
            }
          }
        }
      } catch (tableError) {
        console.warn('⚠️ Error al consultar tabla:', tableError);
      }

      // ✅ GUARDAR EN ESTADO (con rol de la tabla)
      console.log('🎯 Rol FINAL:', rol);
      console.log('👑 Es ADMIN?', rol === 'admin');

      setUserProfile({
        email: user.email,
        nombre: nombre,
        avatar: avatar,
        rol: rol,
        activo: true
      });
      setUserRole(rol);

    } catch (error) {
      console.error('❌ Error en fetchUserProfile:', error);
      const email = user?.email || '';
      setUserProfile({
        email: email,
        nombre: email?.split('@')[0] || 'Usuario',
        avatar: null,
        rol: 'viewer' // ✅ CAMBIO: rol por defecto es 'viewer'
      });
      setUserRole('viewer');
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('🔐 Iniciando sesión con Google...');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          scopes: 'https://www.googleapis.com/auth/userinfo.profile'
        }
      });

      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      console.error('❌ Error al iniciar sesión con Google:', error);
      return { error: error.message };
    }
  };

  const signIn = async (email, password) => {
    try {
      console.log('🔐 Intentando login:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      if (data.user) {
        console.log('✅ Login exitoso:', data.user.email);
        setUser(data.user);
        await fetchUserProfile(data.user);
      }
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error('❌ Error en login:', error);
      return { user: null, error: error.message };
    }
  };

  const signUp = async (email, password, userData) => {
    try {
      console.log('📝 Intentando registrar:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre: userData?.nombre || email,
            rol: 'viewer', // ✅ CAMBIO: rol por defecto es 'viewer'
            full_name: userData?.nombre || email
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        console.log('✅ Registro exitoso:', data.user.email);
        
        try {
          await supabase
            .from('usuarios')
            .insert([
              {
                email: email,
                nombre: userData?.nombre || email,
                rol: 'viewer', // ✅ CAMBIO: rol por defecto es 'viewer'
                activo: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ]);
          console.log('✅ Usuario creado en tabla con rol viewer');
          await fetchUserProfile(data.user);
        } catch (dbError) {
          console.error('❌ Error al crear usuario en tabla:', dbError);
        }
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error('❌ Error en registro:', error);
      return { user: null, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Cerrando sesión...');
      await supabase.auth.signOut();
      setUser(null);
      setUserRole(null);
      setUserProfile(null);
      localStorage.removeItem('supabase.auth.token');
      console.log('✅ Sesión cerrada');
    } catch (error) {
      console.error('❌ Error signing out:', error);
    }
  };

  // ============================================
  // ✅ FUNCIONES DE PERMISOS
  // ============================================
  
  const isAdmin = () => {
    const result = userRole === 'admin';
    console.log('🔍 Verificando isAdmin - userRole:', userRole, 'result:', result);
    return result;
  };

  const isEditor = () => {
    return userRole === 'editor' || userRole === 'admin';
  };

  const isViewer = () => {
    return userRole === 'viewer';
  };

  /**
   * canCreate: Puede crear nuevos registros.
   * - Admin: ✅
   * - Editor: ✅
   * - Viewer: ❌
   */
  const canCreate = () => {
    return userRole === 'admin' || userRole === 'editor';
  };

  /**
   * canEdit: Puede editar registros existentes.
   * - Admin: ✅
   * - Editor: ✅
   * - Viewer: ❌
   */
  const canEdit = () => {
    return userRole === 'admin' || userRole === 'editor';
  };

  /**
   * canDelete: Puede eliminar registros.
   * - Admin: ✅
   * - Editor: ❌
   * - Viewer: ❌
   */
  const canDelete = () => {
    return userRole === 'admin';
  };

  /**
   * canManageUsers: Puede gestionar usuarios (crear, editar, eliminar).
   * - Admin: ✅
   * - Editor: ❌
   * - Viewer: ❌
   */
  const canManageUsers = () => {
    return userRole === 'admin';
  };

  /**
   * canManageWarehouses: Puede gestionar almacenes.
   * - Admin: ✅
   * - Editor: ❌
   * - Viewer: ❌
   */
  const canManageWarehouses = () => {
    return userRole === 'admin';
  };

  /**
   * getRoleLabel: Devuelve el nombre legible del rol.
   */
  const getRoleLabel = () => {
    const labels = {
      admin: 'Administrador',
      editor: 'Editor',
      viewer: 'Visualizador'
    };
    return labels[userRole] || 'Usuario';
  };

  const value = {
    user,
    userRole,
    userProfile,
    loading,
    // Funciones existentes
    isAdmin,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    supabase,
    // ✅ Nuevas funciones de permisos
    isEditor,
    isViewer,
    canCreate,
    canEdit,
    canDelete,
    canManageUsers,
    canManageWarehouses,
    getRoleLabel,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
