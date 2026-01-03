(window as any).EXCALIDRAW_ASSET_PATH = "/"
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import "@excalidraw/excalidraw/index.css";
import { AuthProvider } from './contexts/authContext.tsx'
import { AccessGateProvider } from './contexts/accessGateContext.tsx'
import AccessGate from './components/accessGate.tsx'


createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AccessGateProvider>
      <AccessGate>
        <AuthProvider>
          <App />
        </AuthProvider>
      </AccessGate>
    </AccessGateProvider>
  </BrowserRouter>
)
