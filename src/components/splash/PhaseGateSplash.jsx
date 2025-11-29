import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Component to generate the initial random shard positions
const Shard = ({ id }) => {
    // Generate random explosion coordinates
    const delay = Math.random() * 0.5;
    const finalX = (Math.random() - 0.5) * 2000;
    const finalY = (Math.random() - 0.5) * 2000;
    const rotate = (Math.random() - 0.5) * 720;

    return (
        <motion.div
            key={id}
            initial={{ opacity: 1, scale: 1 }}
            animate={{ 
                x: finalX, 
                y: finalY, 
                rotate: rotate, 
                scale: 0.1, 
                opacity: 0 
            }}
            transition={{ duration: 1.2, delay: 0.5 + delay, ease: "easeOut" }}
            className="absolute w-2 h-2 bg-white/70"
            style={{ 
                borderRadius: '50%',
                boxShadow: '0 0 10px #fff'
            }}
        />
    );
};

export default function PhaseGateSplash({ onComplete }) {
  const [isExploding, setIsExploding] = useState(false);
  const totalDuration = 2000;

  useEffect(() => {
    // 1. Trigger the visual explosion after a brief pause
    const explosionTimer = setTimeout(() => {
        setIsExploding(true);
    }, 500);

    // 2. Complete transition and hide splash screen
    const completionTimer = setTimeout(onComplete, totalDuration + 500);

    return () => {
        clearTimeout(explosionTimer);
        clearTimeout(completionTimer);
    };
  }, [onComplete]);

  // SVG Paths for the Cube Logo
  const outerHex = "M 50 5 L 93 30 V 80 L 50 105 L 7 80 V 30 Z";
  const innerY = "M 50 55 V 105 M 50 55 L 93 30 M 50 55 L 7 30";

  return (
    <motion.div
      className="fixed inset-0 z-[999] bg-black flex items-center justify-center overflow-hidden"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
        
        {/* 1. THE PHASE GATE (Massive Black Disc that Implodes/Shrinks) */}
        <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: isExploding ? 0 : 1 }}
            transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
            className="absolute w-[200vw] h-[200vh] bg-black"
        />

        {/* 2. THE LOGO (The Light Source) */}
        <motion.div
            initial={{ scale: 0.1, opacity: 0.5, rotateX: 90 }}
            animate={{ 
                scale: isExploding ? 2 : 1, // Logo scales up during explosion
                opacity: 1, 
                rotateX: isExploding ? 0 : 0,
                filter: isExploding ? 'blur(10px)' : 'blur(0px)'
            }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.17, 0.67, 0.83, 0.67] }} // Custom spring-like easing
            className="relative z-10"
        >
             <svg viewBox="0 0 100 110" className="w-40 h-40 drop-shadow-[0_0_80px_rgba(139,92,246,1)]">
                <path d={outerHex + " " + innerY} fill="black" stroke="#8b5cf6" strokeWidth="2" />
                <path d={outerHex} fill="#8b5cf6" opacity="0.3" />
             </svg>
        </motion.div>

        {/* 3. SHARD EXPLOSION (Visual Feedback) */}
        {isExploding && [...Array(50)].map((_, i) => <Shard key={i} id={i} />)}

        {/* Status Text */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="absolute bottom-10 text-violet-400 font-mono text-sm tracking-[0.3em] uppercase"
        >
           Initiating Neural UPLINK...
        </motion.p>
    </motion.div>
  );
}