import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Import your Splash Component
import DataStreamSplash from './components/splash/DataStreamSplash';

// Import Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';

export default function App() {
  // State to toggle splash screen
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {/* 1. THE SPLASH SCREEN */}
      <AnimatePresence mode="wait">
        {showSplash && (
        <DataStreamSplash onComplete={() => setShowSplash(false)} />
        )}
      </AnimatePresence>

      {/* 2. THE MAIN APP (Only visible after splash) */}
      {!showSplash && (
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </Router>
      )}
    </>
  );
}