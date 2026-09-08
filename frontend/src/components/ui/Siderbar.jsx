import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Sidebar() {
  const { t } = useTranslation();
  const router = useRouter();

  const menuItems = [
    { href: '/', icon: '📊', label: 'nav.dashboard' },
    { href: '/almacenes', icon: '🏭', label: 'nav.warehouses' },
    { href: '/productos', icon: '📦', label: 'nav.products' },
    { href: '/movimientos', icon: '🔄', label: 'Movimientos' },
    { href: '/reportes', icon: '📈', label: 'Reportes' },
  ];

  return (
    <aside className="w-64 bg-white shadow-lg h-screen sticky top-0">
      <div className="p-4">
        <h2 className="text-xl font-bold text-primary-600 mb-6">🏗️ Almacenes</h2>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                router.pathname === item.href
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{t(item.label)}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}