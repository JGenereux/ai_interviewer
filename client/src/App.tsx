import { Routes, Route } from 'react-router-dom'
import Interview from './pages/interview';
import Home from './pages/home';
import Login from './pages/login';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/interview" element={<Interview />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  )
}

export default App
