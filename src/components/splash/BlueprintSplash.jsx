import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function BlueprintSplash({ onComplete }) {
  const [isFilled, setIsFilled] = useState(false);

  useEffect(() => {
    // Sequence: Draw (1.2s) -> Fill (1s) -> Pause (0.8s) -> Exit
    const drawTimer = setTimeout(() => {
        setIsFilled(true);
    }, 1200);

    const completeTimer = setTimeout(() => {
        onComplete();
    }, 3500);

    return () => {
        clearTimeout(drawTimer);
        clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // SVG Paths for a perfect Isometric Cube
  const outerHex = "M 50 5 L 93 30 V 80 L 50 105 L 7 80 V 30 Z";
  const innerY = "M 50 55 V 105 M 50 55 L 93 30 M 50 55 L 7 30";

  return (
    <motion.div
      className="fixed inset-0 z-[999] bg-[#050505] flex items-center justify-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
       <div className="relative w-full h-full flex flex-col items-center justify-center">
          
          {/* BACKGROUND GRID (Subtle Engineering Vibe) */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.05)_1px,transparent_1px)] bg-[size:60px_60px] opacity-20" />

          {/* MAIN LOGO CONTAINER */}
          <div className="relative z-10 flex flex-col items-center">
            <svg viewBox="0 0 100 110" className="w-64 h-64 drop-shadow-[0_0_50px_rgba(139,92,246,0.5)]">
                
                {/* 1. THE LIQUID FILL (Rendered FIRST so it stays BEHIND the lines) */}
                <defs>
                  <clipPath id="cube-clip">
                      <path d={outerHex} />
                  </clipPath>
                  <linearGradient id="liquid-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#6d28d9" />
                  </linearGradient>
                </defs>

                <motion.rect
                  x="0" y="0" width="100" height="110"
                  fill="url(#liquid-gradient)"
                  clipPath="url(#cube-clip)"
                  initial={{ y: 110 }} // Start completely below
                  animate={isFilled ? { y: 0 } : { y: 110 }} // Rise up to fill
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="opacity-80" // Slight transparency for glass effect
                />

                {/* 2. THE WIREFRAME DRAWING (Rendered SECOND so it stays ON TOP) */}
                <motion.path
                  d={outerHex + " " + innerY}
                  fill="transparent"
                  stroke="#a78bfa" // Brighter Violet for the lines
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                />
            </svg>

            {/* TEXT STATUS */}
            <motion.div 
              className="mt-8 text-violet-300 font-mono text-lg tracking-[0.4em] uppercase font-bold"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              {isFilled ? "System Online" : "Initializing..."}
            </motion.div>
          </div>

       </div>
    </motion.div>
  );
}