import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { useEffect } from 'react';

export default function Debug() {
  const { user, userRole, isAdmin, userProfile, loading } = useAuth();

  useEffect(() => {
    console.log('🔍 DEBUG - Estado de autenticación:');
    console.log('  loading:', loading);
    console.log('  user:', user?.email);
    console.log('  userRole:', userRole);
    console.log('  isAdmin:', isAdmin());
    console.log('  userProfile:', userProfile);
  }, [loading, user, userRole, isAdmin, userProfile]);

  const checkSupabase = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('📋 Session:', session);
      
      if (session?.user?.email) {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', session.user.email)
          .single();
        
        console.log('📋 Usuario en tabla:', data);
        console.log('📋 Error:', error);
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-display font-bold neon-text-blue">🔍 Debug</h1>
      
      <div className="glass rounded-2xl p-6 border border-white/10 space-y-3">
        <h2 className="text-xl font-semibold text-white">Estado de Autenticación</h2>
        
        <div className="space-y-2">
          <p className="text-gray-300">
            👤 <span className="text-gray-500">Email:</span> 
            <span className="text-white ml-2">{user?.email || 'No autenticado'}</span>
          </p>
          <p className="text-gray-300">
            👑 <span className="text-gray-500">Rol:</span> 
            <span className={`ml-2 font-bold ${userRole === 'admin' ? 'text-neon-blue' : 'text-gray-400'}`}>
              {userRole || 'Sin rol'}
            </span>
          </p>
          <p className="text-gray-300">
            🛡️ <span className="text-gray-500">Es Admin:</span> 
            <span className={`ml-2 font-bold ${isAdmin() ? 'text-neon-green' : 'text-neon-pink'}`}>
              {isAdmin() ? '✅ Sí' : '❌ No'}
            </span>
          </p>
          <p className="text-gray-300">
            📝 <span className="text-gray-500">Nombre:</span> 
            <span className="text-white ml-2">{userProfile?.nombre || 'N/A'}</span>
          </p>
          <p className="text-gray-300">
            📧 <span className="text-gray-500">Email en perfil:</span> 
            <span className="text-white ml-2">{userProfile?.email || 'N/A'}</span>
          </p>
        </div>
      </div>

      <button 
        onClick={checkSupabase} 
        className="btn-neon text-white px-6 py-3"
      >
        Verificar en Supabase (ver consola)
      </button>

      <div className="glass rounded-2xl p-6 border border-yellow-500/30 bg-yellow-500/5">
        <h3 className="text-yellow-400 font-semibold">📝 Instrucciones:</h3>
        <ol className="text-gray-300 text-sm mt-2 space-y-1 list-decimal list-inside">
          <li>Verifica que veas "✅ Sí" en "Es Admin"</li>
          <li>Abre la consola (F12) para ver los logs</li>
          <li>Si ves "❌ No", el rol no se está cargando correctamente</li>
          <li>El módulo "Usuarios" y "Configuración" solo aparecen si eres admin</li>
        </ol>
      </div>
    </div>
  );
}