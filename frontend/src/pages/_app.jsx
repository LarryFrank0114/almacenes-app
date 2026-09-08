import '../styles/globals.css';
import { ThemeProvider } from '../components/ThemeProvider';
import { AuthProvider } from '../hooks/useAuth';
import Navbar from '../components/ui/Navbar';
import { Toaster } from 'react-hot-toast';
import '../utils/i18n';

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
      <AuthProvider>
        <div className="min-h-screen bg-crystal-dark text-white">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 py-6">
            <Component {...pageProps} />
          </main>
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(10, 10, 15, 0.9)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
              },
            }}
          />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default MyApp;