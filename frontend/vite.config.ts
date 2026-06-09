import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// This is the one that actually runs your project (dev server, HMR, production build).
// Step 2 — The @/ → src/ alias

// Two places need to agree: Vite (for the actual bundling) and TypeScript (so the editor/type-checker resolves it). Miss either and you get red squiggles or a build error.

// https://vite.dev/config/
export default defineConfig({
  // react() teaches Vite to transform JSX/TSX and enables Fast Refresh. tailwindcss() wires up Tailwind.
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})

// I used fileURLToPath(new URL(...)) instead of path.resolve(__dirname, ...) because your project is ESM ("type": "module"), where __dirname doesn't exist. (@types/node is already installed, so node:url types resolve fine.)
