import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';

export default function FixRole() {
  const router = useRouter();
  const { user, userRole, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const fixRole = async () => {
    if (!user) {
      toast.error('❌ Debes iniciar sesión primero');
      router.push('/login');
      return;
    }

    setLoading(true);
    setStatus('⏳ Iniciando corrección...');
    
    try {
      console.log('🔧 Corrigiendo rol para:', user.email);

      // ✅ 1. Actualizar en la tabla usuarios
      setStatus('🔄 Actualizando tabla usuarios...');
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ 
          rol: 'admin', 
          updated_at: new Date().toISOString() 
        })
        .eq('email', user.email);

      if (updateError) {
        console.error('Error al actualizar tabla:', updateError);
        
        // Si no existe, insertar
        if (updateError.code === 'PGRST116') {
          setStatus('📝 Creando usuario en tabla...');
          const { error: insertError } = await supabase
            .from('usuarios')
            .insert([{
              email: user.email,
              nombre: user.user_metadata?.nombre || user.email?.split('@')[0] || 'Usuario',
              rol: 'admin',
              activo: true
            }]);
          
          if (insertError) {
            throw new Error('Error al crear usuario: ' + insertError.message);
          }
          setStatus('✅ Usuario creado en tabla');
        } else {
          throw new Error('Error al actualizar: ' + updateError.message);
        }
      } else {
        setStatus('✅ Tabla usuarios actualizada');
      }

      // ✅ 2. Actualizar metadata de Auth
      setStatus('🔄 Actualizando autenticación...');
      const { data: authData, error: authError } = await supabase.auth.updateUser({
        data: { 
          rol: 'admin',
          nombre: user.user_metadata?.nombre || user.email?.split('@')[0] || 'Usuario'
        }
      });

      if (authError) {
        console.warn('Error en Auth:', authError);
        setStatus('⚠️ Auth no actualizado, pero tabla sí');
      } else {
        console.log('✅ Auth actualizado:', authData);
        setStatus('✅ Auth actualizado correctamente');
      }

      setStatus('✅ ¡Corrección completada!');
      toast.success('✅ ¡Ahora eres ADMIN!');
      
      // ✅ 3. Recargar la página después de 2 segundos
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('❌ Error general:', error);
      setStatus(`❌ Error: ${error.message}`);
      toast.error('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-8 max-w-md w-full border border-white/10">
        <h1 className="text-2xl font-display font-bold neon-text-blue text-center mb-6">
          🔧 Corregir Rol de Usuario
        </h1>
        
        <div className="space-y-4">
          <div className="glass rounded-xl p-4 border border-white/5">
            <p className="text-gray-300">
              👤 <span className="text-gray-500">Email:</span>
              <span className="text-white ml-2">{user?.email || 'No autenticado'}</span>
            </p>
            <p className="text-gray-300">
              👑 <span className="text-gray-500">Rol actual:</span>
              <span className={`ml-2 font-bold ${isAdmin() ? 'text-neon-green' : 'text-neon-pink'}`}>
                {userRole || 'Sin rol'}
              </span>
            </p>
            {status && (
              <p className="text-gray-400 text-sm mt-2 border-t border-white/5 pt-2">
                📌 {status}
              </p>
            )}
          </div>

          <button
            onClick={fixRole}
            disabled={loading || !user}
            className="btn-neon text-white w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '🔄 Procesando...' : '🔧 Corregir a ADMIN'}
          </button>

          <div className="glass rounded-xl p-4 border border-yellow-500/30 bg-yellow-500/5">
            <p className="text-yellow-400 text-sm">
              Esta herramienta:
              <br />1️⃣ Actualiza tu rol en la tabla <strong>usuarios</strong>
              <br />2️⃣ Actualiza tu metadata en <strong>Autenticación</strong>
              <br />3️⃣ Recarga la página automáticamente
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}