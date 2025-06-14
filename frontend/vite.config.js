import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1', // Forza anche Vite su IPv4
      port: 3000,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://127.0.0.1:5001',
          changeOrigin: true,
          secure: false,
          timeout: 10000, // 10 secondi di timeout
          rewrite: (path) => path.replace(/^\/api/, ''),
          configure: (proxy, _options) => {
            proxy.on('error', (err, req, res) => {
              console.log('🔴 Proxy error:', err.message);
              console.log('🔍 Request URL:', req.url);
              
              // Risposta di errore personalizzata
              if (!res.headersSent) {
                res.writeHead(503, {
                  'Content-Type': 'application/json',
                });
                res.end(JSON.stringify({
                  error: 'Server Flask non disponibile',
                  message: 'Assicurati che il server Flask sia in esecuzione su http://127.0.0.1:5001',
                  suggestion: 'Esegui: python Audio.py'
                }));
              }
            });
            
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('📤 Proxy Request:', req.method, req.url, '→', proxyReq.getHeader('host'));
            });
            
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('📥 Proxy Response:', proxyRes.statusCode, req.url);
            });
          }
        }
      }
    }
  }
})
