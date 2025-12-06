import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {motion,useScroll,useTransform,useSpring,useMotionTemplate,useMotionValue,AnimatePresence,} from "framer-motion";
import {ArrowRight,Download,Command,Zap,Box,Mic,Hand,Layers,Cpu,Globe,Lock,Play,Sparkles,Monitor,Terminal,X,User,Radio,Shield,MousePointer2,Calendar,FileText,Laptop,} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- 1. SPOTLIGHT CARD (The New "Clean & Cool" Feature) ---
const SpotlightCard = ({ title, desc, icon: Icon, color, mouseX, mouseY }) => {
  return (
    <div className="group relative h-full rounded-3xl border border-white/10 bg-white/5 px-8 py-10 overflow-hidden">
      {/* 1. The Mouse Spotlight (Reveals border & glow) */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              ${color.glow},
              transparent 80%
            )
          `,
        }}
      />

      {/* 2. Content */}
      <div className="relative flex flex-col h-full">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border bg-black/20 ${color.border} ${color.text} group-hover:scale-110 transition-transform duration-500`}
        >
          <Icon size={32} strokeWidth={1.5} />
        </div>

        <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
          {title}
        </h3>

        <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>

        {/* Bottom Decor Line */}
        <div
          className={`mt-auto pt-6 border-t border-white/5 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest ${color.text} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
        >
          <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
          System Active
        </div>
      </div>
    </div>
  );
};

// --- 2. FEATURE GRID SECTION ---
const FeatureGrid = () => {
  const containerRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const features = [
    {
      title: "Avatar Engine",
      desc: "Construct your digital identity. Ready Player Me integration allows for infinite customization.",
      icon: User,
      color: {
        text: "text-violet-400",
        border: "border-violet-500/30",
        glow: "rgba(139, 92, 246, 0.15)",
      },
    },
    {
      title: "Spatial Campus",
      desc: "Replicate physical learning. Teachers share slides on virtual walls that sync in real-time.",
      icon: Box,
      color: {
        text: "text-blue-400",
        border: "border-blue-500/30",
        glow: "rgba(59, 130, 246, 0.15)",
      },
    },
    {
      title: "Live Protocol",
      desc: "Crystal clear spatial audio powered by Vivox. Proximity chat mimics real-world acoustics.",
      icon: Mic,
      color: {
        text: "text-orange-400",
        border: "border-orange-500/30",
        glow: "rgba(249, 115, 22, 0.15)",
      },
    },
    {
      title: "Interactive Assets",
      desc: "Don't just look. Interact. Manipulate 3D study objects using hand gestures.",
      icon: Hand,
      color: {
        text: "text-emerald-400",
        border: "border-emerald-500/30",
        glow: "rgba(16, 185, 129, 0.15)",
      },
    },
    {
      title: "Study Sync",
      desc: "Real-time slide control. Never miss a slide with synchronized instructor view.",
      icon: FileText,
      color: {
        text: "text-pink-400",
        border: "border-pink-500/30",
        glow: "rgba(236, 72, 153, 0.15)",
      },
    },
    {
      title: "Admin Command",
      desc: "Complete moderation suite. Mute class, kick disruptors, or lock the room.",
      icon: Shield,
      color: {
        text: "text-red-400",
        border: "border-red-500/30",
        glow: "rgba(239, 68, 68, 0.15)",
      },
    },
  ];

  return (
    <section className="py-32 px-6 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tighter">
            System{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-blue-500">
              Capabilities.
            </span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Hover over the grid to inspect the core modules of the engine.
          </p>
        </div>

        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 group"
        >
          {features.map((f, i) => (
            <SpotlightCard key={i} {...f} mouseX={mouseX} mouseY={mouseY} />
          ))}
        </div>
      </div>
    </section>
  );
};

// --- [PRESERVED COMPONENTS] ---

const DrawnIcon = ({ icon: Icon, color, delay }) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div
        className={`absolute inset-0 blur-[60px] opacity-20 ${color.glow}`}
      />
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`w-32 h-32 ${color.text} drop-shadow-2xl`}
      >
        {Icon === Monitor && (
          <>
            <motion.rect
              x="2"
              y="3"
              width="20"
              height="14"
              rx="2"
              ry="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: delay, ease: "easeOut" }}
            />
            <motion.line
              x1="8"
              y1="21"
              x2="16"
              y2="21"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                duration: 0.3,
                delay: delay + 0.4,
                ease: "easeOut",
              }}
            />
            <motion.line
              x1="12"
              y1="17"
              x2="12"
              y2="21"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                duration: 0.3,
                delay: delay + 0.3,
                ease: "easeOut",
              }}
            />
          </>
        )}
        {Icon === Command && (
          <motion.path
            d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: delay, ease: "easeOut" }}
          />
        )}
        {Icon === Terminal && (
          <>
            <motion.polyline
              points="4 17 10 11 4 5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: delay, ease: "easeOut" }}
            />
            <motion.line
              x1="12"
              y1="19"
              x2="20"
              y2="19"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                duration: 0.4,
                delay: delay + 0.3,
                ease: "easeOut",
              }}
            />
          </>
        )}
      </svg>
    </div>
  );
};

const DownloadOverlay = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl"
          />
          <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center pointer-events-none p-4">
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={onClose}
              className="pointer-events-auto fixed top-8 right-8 md:top-10 md:right-10 group flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-110 transition-all duration-300 backdrop-blur-md z-[80]"
            >
              <X
                size={20}
                className="text-zinc-400 group-hover:text-white transition-colors"
              />
            </motion.button>
            <div className="relative w-full max-w-6xl flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                className="text-center mb-16"
              >
                <h2 className="text-4xl font-bold text-white tracking-tight">
                  Initialize Engine
                </h2>
                <p className="text-zinc-500 text-sm mt-2">
                  Select your local environment.
                </p>
              </motion.div>
              <div className="flex flex-col md:flex-row gap-8 pointer-events-auto">
                {[
                  {
                    icon: Monitor,
                    name: "Windows",
                    sub: "x64 / ARM64",
                    color: "blue",
                    downloadUrl: "https://drive.google.com/file/d/1dGjtaEPJzao-39ro4_x5L-rndrBSTorf/view?usp=drive_link",
                  },
                  {
                    icon: Command,
                    name: "macOS",
                    sub: "Apple Silicon / Intel",
                    color: "white",
                    downloadUrl: "https://drive.google.com/file/d/1dGjtaEPJzao-39ro4_x5L-rndrBSTorf/view?usp=drive_link",
                  },
                  {
                    icon: Terminal,
                    name: "Linux",
                    sub: "Debian / Arch",
                    color: "orange",
                    downloadUrl: "https://drive.google.com/file/d/1TsbZ_bQjSXlMzuiPtbw9zOx7_gAvrocC/view?usp=drive_link",
                  },
                ].map((os, i) => (
                  <a key={os.name} href={os.downloadUrl} download className="no-underline">
                    <motion.button
                    key={os.name}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.05, y: -10 }}
                    className={`group relative w-72 h-96 rounded-[32px] overflow-hidden bg-white/5 border border-white/10 flex flex-col items-center justify-between p-8 backdrop-blur-sm hover:border-${os.color}-500/50 transition-colors duration-500`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-b from-${os.color}-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                    />
                    <div className="flex-1 flex items-center justify-center w-full">
                      <DrawnIcon
                        icon={os.icon}
                        color={{
                          text: `text-${os.color}-400`,
                          glow: `bg-${os.color}-500`,
                        }}
                        delay={0.1 + i * 0.1}
                      />
                    </div>
                    <div className="text-center relative z-10 w-full border-t border-white/5 pt-6">
                      <h3
                        className={`text-2xl font-bold text-white group-hover:text-${os.color}-200 transition-colors`}
                      >
                        {os.name}
                      </h3>
                      <p className="text-zinc-500 text-xs mt-1">{os.sub}</p>
                    </div>
                  </motion.button>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

const ShinyButton = ({ children, onClick, className = "" }) => {
  return (
    <button
      onClick={onClick}
      className={`relative inline-flex h-9 overflow-hidden rounded-full p-[1px] transition-transform hover:scale-105 active:scale-95 ${className}`}
    >
      <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
      <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-black px-4 py-1 text-xs font-bold text-white backdrop-blur-3xl gap-2">
        {children}
      </span>
    </button>
  );
};

const HeroParticles = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const handleMouseMove = (e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      mousePos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
  };
  const handleMouseLeave = () => {
    mousePos.current = { x: -9999, y: -9999 };
  };
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let particles = [];
    const resizeCanvas = () => {
      canvas.width = containerRef.current.offsetWidth;
      canvas.height = containerRef.current.offsetHeight;
      initParticles();
    };
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2.5 + 0.5;
        this.baseX = this.x;
        this.baseY = this.y;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
      }
      update() {
        let dx = mousePos.current.x - this.x;
        let dy = mousePos.current.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 180) {
          this.x += (mousePos.current.x - this.x) * 0.06;
          this.y += (mousePos.current.y - this.y) * 0.06;
        } else {
          this.baseX += this.speedX;
          this.baseY += this.speedY;
          let dxHome = this.baseX - this.x;
          let dyHome = this.baseY - this.y;
          this.x += dxHome * 0.03;
          this.y += dyHome * 0.03;
        }
        if (this.baseX > canvas.width) {
          this.baseX = 0;
          this.x = 0;
        }
        if (this.baseX < 0) {
          this.baseX = canvas.width;
          this.x = canvas.width;
        }
        if (this.baseY > canvas.height) {
          this.baseY = 0;
          this.y = 0;
        }
        if (this.baseY < 0) {
          this.baseY = canvas.height;
          this.y = canvas.height;
        }
      }
      draw() {
        const opacity = this.size > 2 ? 0.8 : 0.4;
        ctx.fillStyle = `rgba(139, 92, 246, ${opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    function initParticles() {
      particles = [];
      const count = (canvas.width * canvas.height) / 5000;
      for (let i = 0; i < count; i++) particles.push(new Particle());
    }
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    animate();
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

const DynamicBackground = () => {
  const { scrollYProgress } = useScroll();
  const color1 = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    ["#8b5cf6", "#3b82f6", "#10b981"]
  );
  const yPos = useTransform(scrollYProgress, [0, 1], ["0%", "80%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.5, 0.3, 0.1]);
  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-[#030014]">
      <motion.div
        style={{
          top: yPos,
          background: useMotionTemplate`radial-gradient(circle at center, ${color1}, transparent 70%)`,
          opacity,
        }}
        className="absolute left-1/2 -translate-x-1/2 w-[70vw] h-[70vh] blur-[120px] mix-blend-screen rounded-full"
      />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
    </div>
  );
};

const Navbar = ({ onOpenDownload }) => {
  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#030014]/60 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-lg text-white tracking-tight">
          <Box className="text-violet-500 fill-violet-500/20" size={20} />
          VIRTUAL<span className="text-zinc-500">CLASS</span>
        </div>
        <div className="flex items-center gap-4">
          <ShinyButton onClick={onOpenDownload}>
            Get App <Download size={12} className="ml-2" />
          </ShinyButton>
        </div>
      </div>
    </nav>
  );
};

const Hero = ({ onOpenDownload }) => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center z-10 overflow-hidden">
      <HeroParticles />
      <div className="relative z-20 flex flex-col items-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[10px] font-bold text-violet-300 mb-8 uppercase tracking-widest shadow-[0_0_20px_rgba(139,92,246,0.15)]"
        >
          <Sparkles size={10} className="text-violet-400" /> v2.0 Education
          Engine Live
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-6xl md:text-9xl font-extrabold tracking-tighter text-white mb-8"
        >
          Your Classroom. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/10">
            Locally Rendered.
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12"
        >
          A 3D virtual classroom engine that runs natively in your browser.{" "}
          <br /> Zero latency. Infinite scale. Pure learning.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-4 pointer-events-auto"
        >
          <button onClick={onOpenDownload} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-4 rounded-full font-bold text-sm hover:scale-105 hover:shadow-[0_0_40px_rgba(139,92,246,0.4)] transition-all flex items-center gap-2">
            Enter Class <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>
      <div className="absolute bottom-10 text-zinc-600 text-xs uppercase tracking-widest z-20 animate-pulse">
        Scroll to Explore
      </div>
    </section>
  );
};

const DemoSection = () => {
  return (
    <section className="relative z-10 py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-white">Engine Demo</h2>
          <div className="flex gap-2 text-xs text-zinc-500 font-mono">
            <span>60 FPS</span>
            <span>•</span>
            <span className="text-blue-400">ONLINE</span>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="relative rounded-2xl border border-white/10 bg-black/50 shadow-2xl overflow-hidden group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 opacity-20 blur-xl group-hover:opacity-40 transition-duration-500" />
          <div className="relative aspect-[16/9] bg-zinc-900 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-[#050510]" />
            <div className="absolute top-6 left-6 right-6 flex justify-between">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
              </div>
              <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-zinc-400 backdrop-blur font-mono border border-white/5">
                uwb://virtual-class/room-101
              </div>
            </div>
            <div className="group/play w-24 h-24 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10 cursor-pointer hover:scale-110 hover:bg-white/10 transition-all z-20">
              <Play className="w-8 h-8 text-white fill-white ml-1 group-hover/play:scale-110 transition-transform" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="relative z-10 py-20 border-t border-white/5 bg-[#030014] text-center overflow-hidden">
    <div className="flex flex-col items-center gap-6">
      <div className="p-4 bg-white/5 rounded-full mb-4">
        <Box className="text-zinc-500" />
      </div>
      <p className="text-zinc-700 text-xs">
        © 2024 VirtualClass. Built with React & Unity.
      </p>
    </div>
  </footer>
);

// --- MAIN LANDING PAGE ---
export default function LandingPage() {
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  return (
    <div className="bg-[#030014] min-h-screen text-white font-sans selection:bg-violet-500/30 overflow-x-hidden">
      <DynamicBackground />
      <Navbar onOpenDownload={() => setIsDownloadOpen(true)} />
      <DownloadOverlay
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
      />

      <Hero onOpenDownload={() => setIsDownloadOpen(true)} />
      <DemoSection />

      {/* REPLACED WITH SPOTLIGHT GRID */}
      <FeatureGrid />

      <Footer />
    </div>
  );
}
