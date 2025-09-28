
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import InterestsPage from './pages/InterestsPage';
import SkillsPage from './pages/SkillsPage';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <HashRouter>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/interests" element={<InterestsPage />} />
          <Route path="/skills" element={<SkillsPage />} />
        </Routes>
      </HashRouter>
    </div>
  );
}

export default App;