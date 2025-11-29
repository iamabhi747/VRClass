import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function VelocitySplash({ onComplete }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    let stars = [];
    const numStars = 300;
    let speed = 0.5; // Start slow
    let frameId;

    // Init stars (Random Z depth)
    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: (Math.random() - 0.5) * width,
            y: (Math.random() - 0.5) * height,
            z: Math.random() * width
        });
    }

    const render = () => {
        // Create trails by fading background slightly instead of clearing
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, width, height);
        
        // Accelerate logic
        if (speed < 40) speed *= 1.04; // Exponential speed up

        const cx = width / 2;
        const cy = height / 2;

        stars.forEach(star => {
            // Move star closer
            star.z -= speed;

            // Reset if it passes camera
            if (star.z <= 0) {
                star.z = width;
                star.x = (Math.random() - 0.5) * width;
                star.y = (Math.random() - 0.5) * height;
            }

            // Project 3D to 2D
            const x = (star.x / star.z) * 100 + cx;
            const y = (star.y / star.z) * 100 + cy;
            const size = (1 - star.z / width) * 4;

            // Draw Star
            if (x > 0 && x < width && y > 0 && y < height) {
                const alpha = (1 - star.z / width);
                ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`; // Violet Stars
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        frameId = requestAnimationFrame(render);
    };
    
    render();

    // TIMELINE:
    // 3.5s Total Duration
    setTimeout(() => {
        onComplete();
    }, 3500);

    const handleResize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    return () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener('resize', handleResize);
    };
  }, [onComplete]);

  return (
    <motion.div 
        className="fixed inset-0 z-[999] bg-black flex items-center justify-center overflow-hidden"
        exit={{ opacity: 0, transition: { duration: 1.5, ease: "easeOut" } }} // Long fade out for smooth transition
    >
        <canvas ref={canvasRef} className="absolute inset-0" />
        
        {/* THE LOGO ANIMATION */}
        <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -180 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 20, opacity: 0 }} // Fly THROUGH the logo on exit
            transition={{ 
                duration: 2, 
                type: "spring", 
                stiffness: 100,
                damping: 20
            }}
            className="relative z-10"
        >
            {/* SVG Cube Logo */}
            <svg width="140" height="140" viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_60px_rgba(139,92,246,1)]">
                <path d="M50 5L93 30V80L50 105L7 80V30L50 5Z" stroke="#a78bfa" strokeWidth="3" fill="rgba(0,0,0,0.8)"/>
                <path d="M50 55L93 30M50 55L7 30M50 55V105" stroke="#a78bfa" strokeWidth="3"/>
                {/* Glowing Core */}
                <circle cx="50" cy="55" r="10" fill="#8b5cf6" className="animate-pulse" />
            </svg>
        </motion.div>
    </motion.div>
  );
}