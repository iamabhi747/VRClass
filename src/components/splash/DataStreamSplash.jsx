import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DataStreamSplash({ onComplete }) {
  const canvasRef = useRef(null);
  const [isAssembled, setIsAssembled] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    let particles = [];
    const numParticles = 400;
    const center = { x: width / 2, y: height / 2 };
    let frameId;
    let phase = 'scatter'; // scatter -> pull -> assemble

    class DataFragment {
      constructor() {
        this.x = center.x + (Math.random() - 0.5) * 10;
        this.y = center.y + (Math.random() - 0.5) * 10;
        this.velocity = Math.random() * 10 + 5; // Initial outward velocity
        this.angle = Math.random() * Math.PI * 2;
        this.size = Math.random() * 1.5 + 0.5;
        this.color = Math.random() > 0.5 ? '#8b5cf6' : '#a78bfa';
        this.mass = Math.random() * 0.5 + 0.5; // Resistance to pull
      }

      update() {
        if (phase === 'scatter') {
            this.x += Math.cos(this.angle) * this.velocity;
            this.y += Math.sin(this.angle) * this.velocity;
            this.velocity *= 0.98;
        } else if (phase === 'pull') {
            const dx = center.x - this.x;
            const dy = center.y - this.y;
            this.x += dx * 0.05 * this.mass;
            this.y += dy * 0.05 * this.mass;

            if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
                this.x = center.x;
                this.y = center.y;
            }
        }
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < numParticles; i++) {
      particles.push(new DataFragment());
    }

    const render = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // Motion blur trail
      ctx.fillRect(0, 0, width, height);

      particles.forEach(p => p.update());
      particles.forEach(p => p.draw());

      if (phase === 'wait') phase = 'pull';
      
      if (phase === 'pull' && particles.every(p => Math.abs(p.x - center.x) < 5)) {
          phase = 'assemble';
          setIsAssembled(true);
      }

      if (!isWiping) {
          frameId = requestAnimationFrame(render);
      }
    };
    render();

    // --- TIMELINE ---
    setTimeout(() => { if (phase === 'scatter') phase = 'pull'; }, 1000); 
    setTimeout(() => { setIsAssembled(true); }, 2500); 

    setTimeout(() => { setIsWiping(true); }, 3500);

    setTimeout(() => { 
        onComplete();
    }, 4500);

    return () => cancelAnimationFrame(frameId);
  }, [onComplete, isWiping]);

  // Logo SVG Path
  const outerHex = "M 50 5 L 93 30 V 80 L 50 105 L 7 80 V 30 Z";
  const innerY = "M 50 55 V 105 M 50 55 L 93 30 M 50 55 L 7 30";

  return (
    <motion.div className="fixed inset-0 z-[999] bg-black flex flex-col items-center justify-center overflow-hidden font-mono"
       exit={{ scale: 20, opacity: 0, transition: { duration: 0.8, ease: "easeOut" } }} // Logo flies off/wipes screen
    >
      
      {/* Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* THE LOGO LAYER (Appears on assembly) */}
      <AnimatePresence>
        {isAssembled && (
            <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10"
            >
                 <svg viewBox="0 0 100 110" className="w-32 h-32 drop-shadow-[0_0_80px_rgba(139,92,246,1)]">
                    <path d={outerHex + " " + innerY} fill="black" stroke="#8b5cf6" strokeWidth="3" />
                    <path d={outerHex} fill="#8b5cf6" opacity="0.4" />
                 </svg>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Status Text */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.5 }}
        className="absolute bottom-10 text-violet-400 font-mono text-sm tracking-[0.3em] uppercase z-10"
      >
         {isAssembled ? "System Integrity Verified" : "Data Fragments Stabilizing..."}
      </motion.p>
    </motion.div>
  );
}