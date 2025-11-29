import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

export default function EnergySplash({ onComplete }) {
  const canvasRef = useRef(null);
  const [isExploding, setIsExploding] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    let particles = [];
    const particleCount = 100;
    let frameId;
    let active = true;

    // Particle: Starts at edge, moves to center
    class Spark {
      constructor() {
        this.reset();
      }

      reset() {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.max(width, height) / 1.5; // Start outside
        this.x = width / 2 + Math.cos(angle) * dist;
        this.y = height / 2 + Math.sin(angle) * dist;
        this.speed = Math.random() * 15 + 10; // Fast incoming
        this.size = Math.random() * 2 + 1;
        this.color = Math.random() > 0.5 ? '#8b5cf6' : '#06b6d4'; // Violet/Cyan
      }

      update() {
        const dx = width / 2 - this.x;
        const dy = height / 2 - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        // Move towards center
        const angle = Math.atan2(dy, dx);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;

        // Accelerate as it gets closer
        this.speed *= 1.05;

        // If hit center, reset
        if (dist < 10) {
          this.reset();
        }
      }

      draw() {
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.size;
        // Draw a trail
        const dx = width / 2 - this.x;
        const dy = height / 2 - this.y;
        const angle = Math.atan2(dy, dx);
        
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - Math.cos(angle) * 40, this.y - Math.sin(angle) * 40);
        ctx.stroke();
      }
    }

    // Init
    for(let i=0; i<particleCount; i++) particles.push(new Spark());

    // Render Loop
    const render = () => {
      if (!active) return;
      
      // Clear with fade for trails
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, width, height);

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      frameId = requestAnimationFrame(render);
    };
    render();

    // --- TIMELINE ---
    // 1. Start Shaking Logo at 1.5s
    setTimeout(() => {
        controls.start({
            x: [0, -5, 5, -5, 5, 0],
            transition: { duration: 0.2, repeat: Infinity }
        });
    }, 1500);

    // 2. EXPLODE at 2.5s
    setTimeout(() => {
        active = false; // Stop particles
        setIsExploding(true); // Trigger Shockwave
        controls.stop(); // Stop shaking
    }, 2500);

    // 3. FINISH at 3.2s
    setTimeout(() => {
        onComplete();
    }, 3200);

    return () => cancelAnimationFrame(frameId);
  }, [controls, onComplete]);

  // Logo SVG Path
  const outerHex = "M 50 5 L 93 30 V 80 L 50 105 L 7 80 V 30 Z";
  const innerY = "M 50 55 V 105 M 50 55 L 93 30 M 50 55 L 7 30";

  return (
    <motion.div className="fixed inset-0 z-[999] bg-black flex items-center justify-center overflow-hidden">
      
      {/* Particle Canvas */}
      {!isExploding && <canvas ref={canvasRef} className="absolute inset-0 z-0" />}

      {/* THE SHOCKWAVE RING (The Transition) */}
      <AnimatePresence>
        {isExploding && (
            <motion.div 
                initial={{ scale: 0, opacity: 1, borderWidth: "100px" }}
                animate={{ scale: 20, opacity: 0, borderWidth: "0px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute z-20 rounded-full border-violet-500 bg-transparent"
                style={{ width: '100px', height: '100px', borderColor: '#8b5cf6' }}
            />
        )}
      </AnimatePresence>

      {/* THE LOGO */}
      <motion.div 
        animate={controls}
        className="relative z-30"
      >
         <svg width="120" height="120" viewBox="0 0 100 110" className={`drop-shadow-[0_0_60px_rgba(139,92,246,${isExploding ? 1 : 0.5})] transition-all duration-300`}>
            <path d={outerHex + " " + innerY} fill="black" stroke="#8b5cf6" strokeWidth={isExploding ? 6 : 3} strokeLinecap="round" strokeLinejoin="round" />
            <path d={outerHex} fill="#8b5cf6" opacity={isExploding ? 1 : 0.1} />
         </svg>
      </motion.div>

      {/* Flash White on Explode */}
      {isExploding && (
        <motion.div 
            initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-violet-200 mix-blend-overlay pointer-events-none z-40"
        />
      )}

    </motion.div>
  );
}