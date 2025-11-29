import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Lock, User, ArrowRight, GraduationCap, School } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// --- PERSISTENT WARP ENGINE (Smooth Physics) ---
const WarpStarfield = ({ role, isWarping, isTyping }) => {
  const canvasRef = useRef(null);
  
  // REFS: Store state to persist between renders
  const starsRef = useRef([]);
  const speedRef = useRef(0.2); 
  const requestRef = useRef();
  const flagsRef = useRef({ isWarping, isTyping, role });

  useEffect(() => {
    flagsRef.current = { isWarping, isTyping, role };
  }, [isWarping, isTyping, role]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    const starCount = 400;

    // Initialize Stars once
    if (starsRef.current.length === 0) {
        for (let i = 0; i < starCount; i++) {
            starsRef.current.push({
                x: Math.random() * width - width / 2,
                y: Math.random() * height - height / 2,
                z: Math.random() * 1000
            });
        }
    }

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);

    // Animation Loop
    const render = () => {
      const currentRole = flagsRef.current.role;
      const starColor = currentRole === 'student' ? '200, 200, 255' : '100, 255, 218'; 
      const warpColor = currentRole === 'student' ? '124, 58, 237' : '20, 184, 166';

      // Target Speed Logic
      let targetSpeed = 0.2; // Idle
      if (flagsRef.current.isTyping) targetSpeed = 4.0; // Typing
      if (flagsRef.current.isWarping) targetSpeed = 60.0; // Warp

      // Smooth Acceleration
      speedRef.current += (targetSpeed - speedRef.current) * 0.05;

      // Draw Background
      ctx.fillStyle = flagsRef.current.isWarping ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      starsRef.current.forEach((star) => {
        star.z -= speedRef.current;

        if (star.z <= 0) {
          star.z = 1000;
          star.x = Math.random() * width - width / 2;
          star.y = Math.random() * height - height / 2;
        }

        const scale = 500 / star.z;
        const x2d = cx + star.x * scale;
        const y2d = cy + star.y * scale;
        const size = (1 - star.z / 1000) * 4;

        if (x2d >= 0 && x2d <= width && y2d >= 0 && y2d <= height) {
            ctx.beginPath();
            
            if (speedRef.current > 20 || flagsRef.current.isWarping) {
                const tailLen = size * (speedRef.current * 0.5);
                const angle = Math.atan2(y2d - cy, x2d - cx);
                ctx.strokeStyle = `rgba(${warpColor}, ${1 - star.z / 1000})`;
                ctx.lineWidth = size;
                ctx.moveTo(x2d, y2d);
                ctx.lineTo(x2d - Math.cos(angle) * tailLen, y2d - Math.sin(angle) * tailLen);
                ctx.stroke();
            } else {
                ctx.fillStyle = `rgba(${starColor}, ${1 - star.z / 1000})`;
                ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
      });

      requestRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 bg-black" />;
};

// --- Input Component ---
const InputField = ({ icon: Icon, type, placeholder, onTyping }) => (
  <div className="relative group">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/50 group-focus-within:text-white transition-colors">
      <Icon size={18} />
    </div>
    <input 
      type={type} 
      placeholder={placeholder}
      onKeyDown={onTyping}
      className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 focus:bg-white/10 transition-all backdrop-blur-md"
    />
  </div>
);

export default function AuthPage() {
  const [role, setRole] = useState('student');
  const [isLogin, setIsLogin] = useState(true);
  const [isWarping, setIsWarping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const navigate = useNavigate();

  const handleTyping = () => {
    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
    }, 500);
  };

  const handleAction = () => {
      setIsWarping(true);
      setTimeout(() => {
          setIsWarping(false);
          // Navigate to Dashboard
          navigate('/dashboard', { state: { role: role } });
      }, 2000);
  };

  const theme = {
    student: { text: 'text-violet-400', bg: 'bg-violet-600', border: 'border-violet-500/30' },
    teacher: { text: 'text-teal-400', bg: 'bg-teal-600', border: 'border-teal-500/30' }
  };
  const current = theme[role];

  return (
    <div className="min-h-screen flex items-center justify-center relative font-sans overflow-hidden bg-black">
      
      {/* 1. BACKGROUND ENGINE */}
      <WarpStarfield role={role} isWarping={isWarping} isTyping={isTyping} />
      
      <Link to="/" className="absolute top-8 left-8 text-white/50 hover:text-white flex items-center gap-2 transition-colors z-50 text-sm font-medium">
        <ArrowLeft size={16} /> Abort
      </Link>

      {/* 2. GLASS LOGIN PANEL */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className={`relative z-10 w-full max-w-[400px] mx-4 transition-all duration-700 ${isWarping ? 'scale-95 opacity-0 blur-md' : 'opacity-100 scale-100'}`}
      >
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          
          <div className="text-center mb-8">
             <div className={`w-14 h-14 rounded-xl mx-auto flex items-center justify-center mb-4 bg-white/5 border border-white/10 ${current.text} transition-colors duration-500`}>
                {role === 'student' ? <GraduationCap /> : <School />}
             </div>
             <h2 className="text-2xl font-bold text-white tracking-tight">
                {isLogin ? 'Identify Yourself' : 'New Recruit'}
             </h2>
             <p className="text-white/40 text-xs mt-1 uppercase tracking-widest">
                {role === 'student' ? 'Student Access Terminal' : 'Faculty Command Node'}
             </p>
          </div>

          <div className="flex p-1 bg-white/5 rounded-xl mb-6 relative">
             <motion.div 
               layoutId="pill"
               className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-white/10 border border-white/5 shadow-sm"
               initial={false}
               animate={{ x: role === 'student' ? 0 : "100%" }}
               transition={{ type: "spring", stiffness: 300, damping: 30 }}
             />
             <button onClick={() => setRole('student')} className="flex-1 relative z-10 py-2 text-xs font-bold text-white">Student</button>
             <button onClick={() => setRole('teacher')} className="flex-1 relative z-10 py-2 text-xs font-bold text-white">Teacher</button>
          </div>

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div 
                key="login"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                 <InputField icon={Mail} type="email" placeholder="ID / Email" onTyping={handleTyping} />
                 <InputField icon={Lock} type="password" placeholder="Passcode" onTyping={handleTyping} />
                 
                 <button 
                    onClick={handleAction}
                    className={`w-full py-3.5 rounded-xl font-bold text-white text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 ${current.bg}`}
                 >
                    Sign In <ArrowRight size={16} />
                 </button>
              </motion.div>
            ) : (
              <motion.div 
                key="signup"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                 <div className="grid grid-cols-2 gap-3">
                    <InputField icon={User} type="text" placeholder="First Name" onTyping={handleTyping} />
                    <InputField icon={User} type="text" placeholder="Last Name" onTyping={handleTyping} />
                 </div>
                 <InputField icon={Mail} type="email" placeholder="Email Address" onTyping={handleTyping} />
                 <InputField icon={Lock} type="password" placeholder="Create Passcode" onTyping={handleTyping} />
                 
                 <button 
                    onClick={handleAction}
                    className={`w-full py-3.5 rounded-xl font-bold text-white text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 ${current.bg}`}
                 >
                    Register <ArrowRight size={16} />
                 </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
             <button onClick={() => setIsLogin(!isLogin)} className={`text-xs font-bold hover:underline ${current.text} transition-colors duration-300`}>
                {isLogin ? 'Need an account?' : 'Have an account?'}
             </button>
          </div>
        </div>
      </motion.div>
      
      <div className={`absolute bottom-20 text-white/30 font-mono text-xs tracking-[0.5em] transition-opacity duration-300 ${isWarping ? 'opacity-100 animate-pulse' : 'opacity-0'}`}>
         ESTABLISHING NEURAL UPLINK...
      </div>

    </div>
  );
}