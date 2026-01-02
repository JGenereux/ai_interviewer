import { Routes, Route } from 'react-router-dom'
import Interview from './pages/interview';
import Home from './pages/home';
import Signup from './pages/signup';
import Login from './pages/login';
import Leaderboard from './pages/leaderboard';
import Profile from './pages/profile';
import Pricing from './pages/pricing';
import OAuth from './pages/oauth';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/interview" element={<Interview />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/oauth" element={<OAuth />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/pricing" element={<Pricing />} />
    </Routes>
  )
}

export default App
