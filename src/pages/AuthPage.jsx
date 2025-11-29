import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Lock, User, ArrowRight, GraduationCap, School } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { run, resolveCallback } from '../bridge';

window.resolveCallback = resolveCallback;

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
const InputField = ({ icon: Icon, type, placeholder, onTyping, value, onChange }) => (
  <div className="relative group">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/50 group-focus-within:text-white transition-colors">
      <Icon size={18} />
    </div>
    <input 
      type={type} 
      placeholder={placeholder}
      value={value}
      onChange={(e) => {
        if (onChange) onChange(e.target.value);
        if (onTyping) onTyping();
      }}
      className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 focus:bg-white/10 transition-all backdrop-blur-md"
    />
  </div>
);

export default function AuthPage() {
  const [role, setRole] = useState('student');
  const [isLogin, setIsLogin] = useState(true);
  const [isWarping, setIsWarping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isUnity, _] = useState(window.isUnity || false);
  const [error, setError] = useState(null); // { status, message }
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
      const action = isLogin ? 'login' : 'signup';
      // TODO: Validate inputs
      // TODO: set loading true

      if (isUnity) {
        run('Authenticate', { action, role, email, password },
          (response) => {
            // TODO: set loading false
            // Clear errors on success
            setError(null);
            setIsWarping(true);
            setTimeout(() => {
              run('AuthNextState', {}, (response) => {}, (error) => {});
            }, 1000);
          },
          (error) => {
            // error.status => error code
            // error.message => error message

            // Show popup with server error
            setError({ status: error?.status ?? 'ERR', message: error?.message ?? 'Authentication failed' });
            console.error(`Authentication failed: (${error?.status}) ${error?.message}`);
          }
        );
        return;
      }

      // TODO: API Call for Web
      // TODO: set loading false
        setIsWarping(true);
      setTimeout(() => {
          setIsWarping(false);
          // Navigate to Dashboard
          setError(null);
          if (role === 'student') {
            navigate('/studdashboard');
          } else if (role === 'teacher') {
            navigate('/teachdashboard');
          }
      }, 2000);
  };

  

  const theme = {
    student: { text: 'text-violet-400', bg: 'bg-violet-600', border: 'border-violet-500/30' },
    teacher: { text: 'text-teal-400', bg: 'bg-teal-600', border: 'border-teal-500/30' }
  };
  const current = theme[role];

  // Auto-dismiss popup after a short duration when error is set
  useEffect(() => {
    if (!error) return;
    const id = setTimeout(() => setError(null), 6000);
    return () => clearTimeout(id);
  }, [error]);

  const ErrorPopup = ({ error, onClose, role }) => {
    const theme = {
      student: { text: 'text-violet-400', bg: 'bg-violet-600/80', border: 'border-violet-500/30', rgb: '124,58,237' },
      teacher: { text: 'text-teal-400', bg: 'bg-teal-600/80', border: 'border-teal-500/30', rgb: '20,184,166' }
    };
    const current = theme[role];
    const glow = role === 'student' ? '124,58,237' : '20,184,166';

    const overlayVars = {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: 0.18 } },
      exit: { opacity: 0, transition: { duration: 0.14 } }
    };

    const cardVars = {
      initial: { opacity: 0, y: 20, scale: 0.96 },
      animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 420, damping: 28 } },
      exit: { opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.18 } }
    };

    return (
      <AnimatePresence>
        {error && (
          <motion.div
            key="auth-error"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={{ initial: {}, animate: {}, exit: {} }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-auto"
            aria-live="assertive"
          >
            <motion.div
              className="absolute inset-0"
              onClick={onClose}
              variants={overlayVars}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ background: 'rgba(0,0,0,0.58)', backdropFilter: 'blur(6px)' }}
            />

            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={cardVars}
              className={`relative z-10 max-w-2xl w-full mx-auto rounded-3xl p-6 ${current.border} border bg-black/70 backdrop-blur-xl shadow-2xl`}
              style={{ boxShadow: `0 12px 40px rgba(${glow}, 0.10)` }}
            >
              <div className="flex items-start gap-4 md:gap-6">
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 540, damping: 26 }}
                    className={`flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-lg ${current.bg} ${current.text}`}
                    style={{ boxShadow: `0 8px 30px rgba(${glow}, 0.14) inset` }}
                  >
                    <svg className="w-8 h-8 md:w-9 md:h-9" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 9v4" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 17h.01" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10.29 3.86L2 20.5h20L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="white" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-lg md:text-xl text-white font-bold">Authentication Error</div>
                      <div className="text-xs text-white/60 mt-1">{error?.status ? `Code: ${error.status}` : ''}</div>
                    </div>
                    <button
                      onClick={onClose}
                      className="text-white/50 hover:text-white p-1 rounded-full transition-colors"
                      aria-label="Close error"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="text-sm md:text-base text-white/70 mt-3 break-words">
                    {error?.message ?? 'An unknown error occurred.'}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative font-sans overflow-hidden bg-black">
      
      {/* 1. BACKGROUND ENGINE */}
      <ErrorPopup error={error} onClose={() => setError(null)} role={role} />
      <WarpStarfield role={role} isWarping={isWarping} isTyping={isTyping} />
      
      {isUnity ? null : (
      <Link to="/" className="absolute top-8 left-8 text-white/50 hover:text-white flex items-center gap-2 transition-colors z-50 text-sm font-medium">
        <ArrowLeft size={16} /> Abort
      </Link>
      )}

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
                <InputField 
                  icon={Mail} 
                  type="email" 
                  placeholder="ID / Email" 
                  value={email}
                  onChange={setEmail}
                  onTyping={handleTyping} 
                />
                <InputField 
                  icon={Lock} 
                  type="password" 
                  placeholder="Passcode" 
                  name="password"
                  value={password}
                  onChange={setPassword}
                  onTyping={handleTyping} 
                  
                />
                 
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
                  <InputField 
                    icon={User} 
                    type="text" 
                    placeholder="First Name" 
                    value={firstName}
                    onChange={setFirstName}
                    onTyping={handleTyping} 
                  />
                  <InputField 
                    icon={User} 
                    type="text" 
                    placeholder="Last Name" 
                    value={lastName}
                    onChange={setLastName}
                    onTyping={handleTyping} 
                  />
                 </div>
                <InputField 
                  icon={Mail} 
                  type="email" 
                  placeholder="Email Address" 
                  value={email}
                  onChange={setEmail}
                  onTyping={handleTyping} 
                />
                <InputField 
                  icon={Lock} 
                  type="password" 
                  placeholder="Create Passcode" 
                  name="password"
                  value={password}
                  onChange={setPassword}
                  onTyping={handleTyping} 
                  
                />
                 
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
            <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className={`text-xs font-bold hover:underline ${current.text} transition-colors duration-300`}>
                {isLogin ? 'Need an account?' : 'Have an account?'}
             </button>
          </div>
          {/* DEV ONLY: Simulate server error for testing form errors */}
          {import.meta?.env?.MODE === 'development' && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setError({ status: 'DEV', message: 'Test popup: invalid credentials' })}
                  className="mt-2 px-3 py-1 text-xs rounded-md bg-white/5 text-white/60 hover:bg-white/10"
                >
                  Simulate Error (Dev)
                </button>
              </div>
          )}
        </div>
      </motion.div>
      
      <div className={`absolute bottom-20 text-white/30 font-mono text-xs tracking-[0.5em] transition-opacity duration-300 ${isWarping ? 'opacity-100 animate-pulse' : 'opacity-0'}`}>
         ESTABLISHING NEURAL UPLINK...
      </div>

    </div>
  );
}