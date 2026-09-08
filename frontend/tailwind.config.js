/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Colores neón
        neon: {
          blue: '#00d4ff',
          pink: '#ff00e5',
          green: '#00ff87',
          purple: '#9b59b6',
          cyan: '#00f0ff',
        },
        // Modo oscuro cristal
        crystal: {
          dark: '#0a0a0f',
          glass: 'rgba(255, 255, 255, 0.05)',
          glassLight: 'rgba(255, 255, 255, 0.1)',
          border: 'rgba(255, 255, 255, 0.08)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'Inter', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'neon-blue': '0 0 20px rgba(0, 212, 255, 0.3)',
        'neon-pink': '0 0 20px rgba(255, 0, 229, 0.3)',
        'neon-green': '0 0 20px rgba(0, 255, 135, 0.3)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 3s ease-in-out infinite',
      },
      keyframes: {
        pulseNeon: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { textShadow: '0 0 20px rgba(0, 212, 255, 0.5)' },
          '50%': { textShadow: '0 0 40px rgba(0, 212, 255, 0.8), 0 0 60px rgba(0, 212, 255, 0.3)' },
        },
      },
    },
  },
  plugins: [],
}