import Dashboard from './pages/dashboard';
import { Routes, Route } from 'react-router-dom'
import Resume from './pages/resume';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/resume" element={<Resume />} />
    </Routes>
  )
}

export default App
