import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"


export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('recharts')) return 'chart';
          if (id.includes('@codemirror')) return 'editor';
          if (id.includes('@mui') || id.includes('@shadcn') || id.includes('flowbite')) return 'ui';
          if (id.includes('three')) return 'three';
          if (id.includes('node_modules/react') || id.includes('node_modules/@tanstack')) return 'vendor';
        }
      }
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        // 127.0.0.1, not localhost: Node resolves localhost to ::1 first, and Docker
        // Desktop resets IPv6 connections to a published port.
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.setHeader("origin", "http://localhost:5173")
          })
        },
      },
    },
  },
})
