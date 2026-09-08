import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiGlobe } from 'react-icons/fi';

export default function LanguageSelector({ currentLang, onLanguageChange }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary-50">
        <FiGlobe className="w-4 h-4 text-secondary-400" />
        <span className="text-sm font-medium text-secondary-400">Cargando...</span>
      </div>
    );
  }

  const languages = {
    es: { label: 'Español', flag: '🇪🇸' },
    en: { label: 'English', flag: '🇬🇧' },
    zh: { label: '中文', flag: '🇨🇳' }
  };

  const current = languages[currentLang] || languages.es;

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-secondary-50 transition-colors"
      >
        <FiGlobe className="w-4 h-4 text-secondary-600" />
        <span className="text-sm font-medium text-secondary-600 hidden sm:inline">
          {current.flag} {current.label}
        </span>
      </button>
      
      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-card-lg border border-secondary-100 py-1 z-50 animate-fade-in">
          {Object.entries(languages).map(([code, lang]) => (
            <button
              key={code}
              onClick={() => {
                onLanguageChange(code);
                setIsMenuOpen(false);
              }}
              className={`w-full px-4 py-2 text-left hover:bg-secondary-50 transition-colors flex items-center gap-2 ${
                code === currentLang ? 'bg-primary-50 text-primary-700' : 'text-secondary-700'
              }`}
            >
              {lang.flag} {lang.label}
              {code === currentLang && ' ✓'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}