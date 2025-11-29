import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function QuantumSplash({ onComplete }) {
  const [scanProgress, setScanProgress] = useState(0); // 0 to 100
  const [bootText, setBootText] = useState("");
  const canvasRef = useRef(null);

  // --- PHASE 1: THE MATRIX GLITCH ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const columns = Math.floor(width / 20);
    const drops = Array(columns).fill(1);
    const chars = "0101010101XYZEQA";

    let frameId;
    let active = true;

    const draw = () => {
      if (!active) return;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Fade effect
      ctx.fillRect(0, 0, width, height);
      
      ctx.fillStyle = '#0f0'; // Hacker Green
      ctx.font = '14px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * 20, drops[i] * 20);
        
        if (drops[i] * 20 > height && Math.random() > 0.975) {
           drops[i] = 0;
        }
        drops[i]++;
      }
      frameId = requestAnimationFrame(draw);
    };

    draw();

    // --- TIMELINE ---
    // 1. Stop Glitch & Start Scan at 0.8s
    setTimeout(() => {
        active = false;
        ctx.clearRect(0, 0, width, height); // Clear canvas
        startScanning();
    }, 800);

    return () => cancelAnimationFrame(frameId);
  }, []);

  // --- PHASE 2: THE LASER SCAN ---
  const startScanning = () => {
      let progress = 0;
      const interval = setInterval(() => {
          progress += 2;
          setScanProgress(progress);
          if (progress >= 100) {
              clearInterval(interval);
              startBootSequence();
          }
      }, 20); // Scan duration approx 1s
  };

  // --- PHASE 3: TEXT BOOT ---
  const startBootSequence = () => {
      const messages = ["INITIALIZING CORE...", "LOADING_ASSETS...", "SYSTEM_ONLINE"];
      let i = 0;
      
      const typeNext = () => {
          if (i >= messages.length) {
              setTimeout(onComplete, 800); // Finish
              return;
          }
          setBootText(messages[i]);
          i++;
          setTimeout(typeNext, 400); // Speed of text change
      };
      typeNext();
  };

  // Logo SVG Path
  const outerHex = "M 50 5 L 93 30 V 80 L 50 105 L 7 80 V 30 Z";
  const innerY = "M 50 55 V 105 M 50 55 L 93 30 M 50 55 L 7 30";

  return (
    <motion.div 
       className="fixed inset-0 z-[999] bg-black flex flex-col items-center justify-center overflow-hidden font-mono"
       exit={{ opacity: 0, y: -100, transition: { duration: 0.5 } }} // Slide up exit
    >
      
      {/* Background Glitch Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-20" />

      <div className="relative z-20 w-40 h-48">
         
         {/* THE SCANNER CONTAINER */}
         <div className="absolute inset-0 overflow-hidden" style={{ height: `${scanProgress}%` }}>
             {/* The Solid Logo (Revealed by height) */}
             <svg viewBox="0 0 100 110" className="w-40 h-40 drop-shadow-[0_0_30px_rgba(16,185,129,0.8)]">
                <path d={outerHex + " " + innerY} fill="#000" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <path d={outerHex} fill="#10b981" opacity="0.2" />
             </svg>
         </div>

         {/* THE LASER BEAM */}
         {scanProgress < 100 && (
             <motion.div 
                className="absolute left-0 w-full h-[2px] bg-white shadow-[0_0_20px_#fff,0_0_40px_#10b981]"
                style={{ top: `${scanProgress}%` }}
             />
         )}

      </div>

      {/* Boot Text */}
      <div className="h-8 mt-8 z-20">
         {bootText && (
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
               className="text-emerald-500 text-xs tracking-[0.2em] flex items-center gap-2"
             >
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                {bootText}
             </motion.div>
         )}
      </div>

    </motion.div>
  );
}