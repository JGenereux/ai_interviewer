import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path';
import fs from 'node:fs';

// https://vite.dev/config/
export default defineConfig({
  plugins: [ tailwindcss(),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    {
      name: 'copy-pdf-worker',
      closeBundle() {
        const pdfjsDistPath = path.dirname(require.resolve('pdfjs-dist/package.json'));
        const pdfWorkerPath = path.join(pdfjsDistPath, 'build', 'pdf.worker.mjs');
        fs.cpSync(pdfWorkerPath, './dist/pdf.worker.mjs');
      }
    },
  ],
})
