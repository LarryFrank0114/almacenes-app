'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getConfig } from '../../services/configService';
import { 
  FiLogOut, FiUser, FiHome,
  FiMap, FiBox, FiRefreshCw, FiBarChart2, 
  FiUpload, FiUsers, FiSettings, FiChevronDown, FiX
} from 'react-icons/fi';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user, userProfile, signOut, isAdmin } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [companyConfig, setCompanyConfig] = useState({
    nombre: 'Mi Empresa S.A.C.',
    slogan: 'Gestiona tu inventario de forma inteligente',
    logo: null,
    primarycolor: '#00d4ff'
  });

  // ✅ OBTENER CONFIGURACIÓN DESDE configService
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getConfig();
        if (config) {
          setCompanyConfig({
            nombre: config.nombre || 'Mi Empresa S.A.C.',
            slogan: config.slogan || '',
            logo: config.logo || null,
            primarycolor: config.primarycolor || '#00d4ff'
          });
        }
      } catch (error) {
        console.warn('⚠️ Error al cargar configuración:', error);
      }
    };
    loadConfig();
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // ✅ MENÚS PRINCIPALES (más compactos)
  const mainNavItems = [
    { href: '/', icon: FiHome, label: 'Dashboard' },
    { href: '/almacenes', icon: FiMap, label: 'Almacenes' },
    { href: '/productos', icon: FiBox, label: 'Productos' },
  ];

  // ✅ MENÚS SECUNDARIOS (con menos texto)
  const secondaryNavItems = [
    { href: '/movimientos', icon: FiRefreshCw, label: 'Movimientos' },
    { href: '/reportes', icon: FiBarChart2, label: 'Reportes' },
  ];

  // ✅ MENÚS DE ADMIN (ahora en menú desplegable)
  const adminNavItems = [
    { href: '/cargar-excel', icon: FiUpload, label: 'Carga' },
    { href: '/usuarios', icon: FiUsers, label: 'Usuarios' },
    { href: '/configuracion', icon: FiSettings, label: 'Config' },
  ];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const languages = {
    es: { flag: '🇪🇸' },
    en: { flag: '🇬🇧' },
    zh: { flag: '🇨🇳' }
  };

  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-14">
          {/* LOGO Y NOMBRE DE EMPRESA (desde configService) */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div 
                className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{ backgroundColor: companyConfig.primarycolor + '33' }}
              >
                {companyConfig.logo ? (
                  <img src={companyConfig.logo} alt={companyConfig.nombre} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl">🏗️</span>
                )}
              </div>
              <div className="flex flex-col">
                <span 
                  className="text-sm font-semibold leading-tight"
                  style={{ color: companyConfig.primarycolor }}
                >
                  {companyConfig.nombre}
                </span>
                <span className="text-[10px] text-gray-400">
                  {companyConfig.slogan || 'Sistema de Gestión'}
                </span>
              </div>
            </Link>
          </div>

          {/* ✅ NAV CENTRAL - MÁS LIMPIO */}
          <div className="hidden md:flex items-center gap-0.5">
            {mainNavItems.map((item) => {
              const isActive = router.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg transition-all text-sm ${
                    isActive
                      ? 'glass text-neon-blue border border-neon-blue/30'
                      : 'text-gray-400 hover:text-white hover:glass'
                  }`}
                >
                  <Icon className="w-4 h-4 inline mr-1.5" />
                  {item.label}
                </Link>
              );
            })}
            
            {/* Separador */}
            <span className="w-px h-6 bg-white/10 mx-1" />
            
            {secondaryNavItems.map((item) => {
              const isActive = router.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-2.5 py-1.5 rounded-lg transition-all text-sm ${
                    isActive
                      ? 'glass text-neon-blue border border-neon-blue/30'
                      : 'text-gray-400 hover:text-white hover:glass'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 inline mr-1" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* ✅ DERECHA - USUARIO + MENÚ ADMIN */}
          <div className="flex items-center gap-1.5">
            {/* Idioma */}
            <button
              onClick={() => changeLanguage(i18n.language === 'es' ? 'en' : i18n.language === 'en' ? 'zh' : 'es')}
              className="p-1.5 rounded-lg glass-hover text-gray-400 hover:text-white transition-colors text-sm"
            >
              {languages[i18n.language]?.flag}
            </button>

            {/* USUARIO */}
            {user ? (
              <div className="flex items-center gap-1.5 glass px-2 py-1 rounded-lg">
                <div className="w-7 h-7 rounded-full overflow-hidden border border-neon-blue/30 flex-shrink-0">
                  {userProfile?.avatar ? (
                    <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-neon-blue to-neon-pink flex items-center justify-center text-white font-bold text-xs">
                      {userProfile?.nombre?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                
                <span className="text-xs text-white font-medium hidden sm:block">
                  {userProfile?.nombre || 'Usuario'}
                </span>
                
                {isAdmin() && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-neon-blue/20 text-neon-blue border border-neon-blue/30 font-medium">
                    ADMIN
                  </span>
                )}
                
                <button
                  onClick={signOut}
                  className="p-1 rounded-lg glass-hover text-gray-400 hover:text-neon-pink transition-colors"
                >
                  <FiLogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link href="/login" className="btn-neon text-white text-sm px-3 py-1.5">
                <FiUser className="w-3.5 h-3.5 inline mr-1.5" />
                Login
              </Link>
            )}

            {/* ⚙️ MENÚ DE ADMIN (solo si es admin) */}
            {isAdmin() && (
              <div className="relative">
                <button
                  onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                  className="p-1.5 rounded-lg glass-hover text-gray-400 hover:text-white transition-colors"
                >
                  <FiSettings className="w-5 h-5" />
                </button>

                {adminMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-xl shadow-lg border border-white/10 py-2 z-50">
                    {adminNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = router.pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setAdminMenuOpen(false)}
                          className={`flex items-center gap-2 px-4 py-2 text-sm ${
                            isActive
                              ? 'text-neon-blue bg-neon-blue/10'
                              : 'text-gray-300 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </Link>
                      );
                    })}
                    <div className="border-t border-white/10 my-2"></div>
                    <button
                      onClick={signOut}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 w-full"
                    >
                      <FiLogOut className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ MOBILE - Más simple */}
      <div className="md:hidden glass border-t border-white/5">
        <div className="flex overflow-x-auto px-2 py-1.5 gap-1">
          {[...mainNavItems, ...secondaryNavItems, ...(isAdmin() ? adminNavItems : [])].map((item) => {
            const isActive = router.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2 py-1 rounded-lg text-[10px] whitespace-nowrap transition-all flex items-center gap-1 ${
                  isActive
                    ? 'glass text-neon-blue border border-neon-blue/30'
                    : 'text-gray-400 hover:text-white hover:glass'
                }`}
              >
                <Icon className="w-3 h-3" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}