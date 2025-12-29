(window as any).EXCALIDRAW_ASSET_PATH = "/"
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import "@excalidraw/excalidraw/index.css";


createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
