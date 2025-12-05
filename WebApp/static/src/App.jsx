import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Import your Splash Component
import DataStreamSplash from './components/splash/DataStreamSplash';

// Import Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import StudDashboard from './pages/Stud_Dashboard';
import TeachDashboard from './pages/Teach_Dashboard';
import TeachEditP from './pages/TeachEditP';
import StudEditP from './pages/StudEditP';

export default function App() {
  // State to toggle splash screen
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {/* 1. THE SPLASH SCREEN */}
      
      

      {/* 2. THE MAIN APP (Only visible after splash) */}
      
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/studdashboard" element={<StudDashboard />} />
            <Route path="/teachdashboard" element={<TeachDashboard />} />
            <Route path="/loading" element={<DataStreamSplash onComplete={() => setShowSplash(false)} />} />
            <Route path="/TeachEditP" element={<TeachEditP />} />
            <Route path="/StudEditP" element={<StudEditP />} />
          </Routes>
        </Router>
      
    </>
  );
}