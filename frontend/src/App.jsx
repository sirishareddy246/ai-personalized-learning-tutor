import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Ask from './pages/Ask';
import Quiz from './pages/Quiz';
import Feedback from './pages/Feedback';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ask" element={<Ask />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/feedback/:id" element={<Feedback />} />
        <Route path="/feedback" element={<Feedback />} />
      </Routes>
    </BrowserRouter>
  );
}
