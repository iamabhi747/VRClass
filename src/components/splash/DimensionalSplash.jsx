import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DimensionalSplash({ onComplete }) {
  const canvasRef = useRef(null);
  const [showLogo, setShowLogo] = useState(false);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    let width = window.innerWidth;
    let height = window.innerHeight;
    let phase = 'explode'; // explode -> collapse -> done

    canvas.width = width;
    canvas.height = height;

    // Particle Class
    class Particle {
      constructor() {
        this.x = width / 2;
        this.y = height / 2;
        this.angle = Math.random() * Math.PI * 2;
        this.velocity = Math.random() * 15 + 5; // Fast explosion
        this.size = Math.random() * 2 + 1;
        this.color = Math.random() > 0.5 ? '#8b5cf6' : '#06b6d4'; // Violet or Cyan
        this.drag = 0.95; // Slow down over time
      }

      update() {
        if (phase === 'explode') {
            this.x += Math.cos(this.angle) * this.velocity;
            this.y += Math.sin(this.angle) * this.velocity;
            this.velocity *= this.drag; // Decelerate
        } else if (phase === 'collapse') {
            // Suck back to center
            let dx = (width / 2) - this.x;
            let dy = (height / 2) - this.y;
            this.x += dx * 0.15;
            this.y += dy * 0.15;
        }
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Initialize
    for (let i = 0; i < 150; i++) {
      particles.push(new Particle());
    }

    // Timeline
    setTimeout(() => { phase = 'collapse'; }, 1000); // Start collapsing after 1s
    setTimeout(() => { 
        setShowLogo(true); // Show Logo
    }, 1600);
    setTimeout(() => { 
        setZoom(true); // Fly through
    }, 2500);
    setTimeout(() => { 
        onComplete(); 
    }, 3200);

    const render = () => {
      // Motion Blur Effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, width, height);

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      if (!zoom) {
          animationFrameId = requestAnimationFrame(render);
      }
    };
    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [onComplete]);

  // Same Logo SVG as before
  const outerHex = "M 50 5 L 93 30 V 80 L 50 105 L 7 80 V 30 Z";
  const innerY = "M 50 55 V 105 M 50 55 L 93 30 M 50 55 L 7 30";

  return (
    <motion.div className="fixed inset-0 z-[999] bg-black flex items-center justify-center overflow-hidden">
      
      {/* The Particle Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* The Logo Layer (Appears after collapse) */}
      <AnimatePresence>
        {showLogo && (
            <motion.div
                initial={{ scale: 0, opacity: 0, rotate: 180 }}
                animate={zoom ? { scale: 50, opacity: 0 } : { scale: 1, opacity: 1, rotate: 0 }}
                transition={zoom ? { duration: 0.8, ease: "easeIn" } : { type: "spring", stiffness: 200, damping: 15 }}
                className="relative z-10"
            >
                 {/* The Glowing Cube */}
                 <svg viewBox="0 0 100 110" className="w-32 h-32 drop-shadow-[0_0_50px_rgba(139,92,246,1)]">
                    <path d={outerHex + " " + innerY} fill="black" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={outerHex} fill="white" opacity="0.1" />
                 </svg>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Flash Effect on Impact */}
      {showLogo && !zoom && (
        <motion.div 
            initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-white pointer-events-none mix-blend-overlay"
        />
      )}

    </motion.div>
  );
}