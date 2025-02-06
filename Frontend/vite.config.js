import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import os from 'os';

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();

export default defineConfig({
  plugins: [react()],
  server: {
    host: localIP, // Gunakan IP lokal komputer
    port: 3000, // Sesuaikan dengan kebutuhan
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(`http://${localIP}:8080`),
  },
});
