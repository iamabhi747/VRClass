import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, Edit2, Shield, BookOpen, 
  ChevronRight, Globe, Zap, Video, Plus, LogOut, Settings, 
  Hash, Mail, GraduationCap, Users, ArrowRight,
  Atom, Code2, Calculator
} from 'lucide-react';

// --- COMPONENTS ---

// 1. LEFT PANEL (Timeline)
const HistoryPanel = ({ theme, pastLectures = [], liveLectures = [] }) => (
  <div className="flex flex-col h-full gap-4">
    {/* Scheduled Section */}
    <div className={`flex-1 p-6 rounded-3xl border ${theme.border} bg-zinc-900/80 relative overflow-hidden`}>
      <div className={`absolute -top-4 -right-4 opacity-10 ${theme.text}`}>
        <Calendar size={100} />
      </div>
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 relative z-10">
        <Clock size={18} className={theme.text} /> Scheduled
      </h3>
      <div className="space-y-3 relative z-10">
        {liveLectures.length === 0 ? (
          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <p className="text-zinc-500 text-xs">No live sessions</p>
          </div>
        ) : (
          liveLectures.map((lec) => (
            <div key={lec.id} className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-white text-sm">{lec.title || 'Untitled Lecture'}</h4>
                <span className="flex h-2 w-2 relative mt-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
              </div>
              <p className="text-zinc-500 text-xs">
                {lec.startTime ? new Date(lec.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                {lec.teacher ? ` • ${lec.teacher}` : ''}
                {lec.classid ? ` • ${lec.classid}` : ''}
              </p>
            </div>
          ))
        )}
      </div>
    </div>

    {/* History Section */}
    <div className={`flex-1 p-6 rounded-3xl border ${theme.border} bg-zinc-900/80`}>
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <BookOpen size={18} className="text-zinc-500" /> History
      </h3>
      <div className="space-y-2">
        {pastLectures.length === 0 ? (
          <div className="p-3 rounded-lg bg-white/5 border border-white/5">
            <p className="text-zinc-500 text-xs">No past lectures found</p>
          </div>
        ) : (
          pastLectures.map((lec) => (
            <div key={lec.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
              <div>
                <p className="text-zinc-300 text-sm font-medium">{lec.title || 'Untitled Lecture'}</p>
                <p className="text-zinc-600 text-[10px]">
                  {lec.endTime ? new Date(lec.endTime).toLocaleDateString() : ''}
                  {lec.teacher ? ` • ${lec.teacher}` : ''}
                </p>
              </div>
              <ChevronRight size={14} className="text-zinc-600" />
            </div>
          ))
        )}
      </div>
    </div>
  </div>
);

// 2. MIDDLE PANEL (Action Center - Dynamic Calendar)
const ActionCenter = ({ role, theme, joinedClasses = [] }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Real-time Date Calculation
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.toLocaleString('default', { month: 'long' });
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, today.getMonth() + 1, 0).getDate();
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className={`h-full rounded-[32px] border ${theme.border} bg-gradient-to-b from-zinc-900 to-black relative overflow-hidden flex flex-col p-8`}>
      
      {/* Background Decor */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 ${theme.glow} blur-[120px] opacity-10`} />

      {/* Header */}
      <div className="text-center relative z-10 mb-6">
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">
          {role === 'teacher' ? 'COMMAND' : 'CLASSROOM'} <span className={theme.text}>GATEWAY</span>
        </h1>
        <p className="text-zinc-500 text-xs uppercase tracking-widest">
          {role === 'teacher' ? 'Manage & Schedule' : 'Secure Uplink Ready'}
        </p>
      </div>

      <div className="flex-1 flex flex-col w-full max-w-2xl mx-auto relative z-10 gap-6">
        
        {role === 'teacher' ? (
          /* ================= TEACHER VIEW ================= */
          <>
            <div className="grid grid-cols-2 gap-4">
               <div className="relative group">
                  <div className={`absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl opacity-20 group-hover:opacity-100 blur transition duration-500`} />
                  <button className="relative w-full h-full bg-black border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-zinc-900 transition-colors">
                     <Zap size={24} className="text-teal-400" />
                     <span className="text-white font-bold text-sm">Instant Meeting</span>
                  </button>
               </div>

               <div className="relative group">
                  <button className="relative w-full h-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-zinc-800 transition-colors">
                     <Hash size={24} className="text-zinc-500 group-hover:text-white transition-colors" />
                     <span className="text-zinc-400 group-hover:text-white font-bold text-sm transition-colors">Join via Code</span>
                  </button>
               </div>
            </div>

            {/* Dynamic Calendar */}
            <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-6 backdrop-blur-md flex flex-col min-h-[300px]">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-bold">{currentMonth} {currentYear}</h3>
                  <div className="flex gap-2">
                     <button className="p-1 hover:bg-white/10 rounded"><ChevronRight className="rotate-180" size={16} /></button>
                     <button className="p-1 hover:bg-white/10 rounded"><ChevronRight size={16} /></button>
                  </div>
               </div>
               
               <div className="grid grid-cols-7 gap-2 text-center text-xs text-zinc-500 font-bold mb-2">
                  <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
               </div>
               <div className="grid grid-cols-7 gap-2 flex-1 content-start overflow-y-auto pr-2 custom-scrollbar">
                  {dates.map((day) => (
                     <button 
                       key={day}
                       onClick={() => setSelectedDate(day)}
                       className={`rounded-lg flex items-center justify-center transition-all duration-300 relative group aspect-square text-xs font-medium 
                         ${selectedDate === day ? 'bg-teal-500 text-black shadow-[0_0_15px_rgba(20,184,166,0.6)]' : 'hover:bg-white/10 text-zinc-400 hover:text-white'}
                         ${day === currentDay && selectedDate !== day ? 'border border-teal-500/50 text-teal-400' : ''}
                       `}
                     >
                        {day}
                        {/* Highlight TODAY */}
                        {day === currentDay && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-teal-400" />}
                     </button>
                  ))}
               </div>

               <AnimatePresence>
                 {selectedDate && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 pt-4 border-t border-white/10"
                    >
                       <div className="flex gap-2 items-center">
                          <input type="time" className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-teal-500 w-24" defaultValue="10:00" />
                          <button className="flex-1 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg py-2 transition-colors truncate px-2">
                             Schedule: {selectedDate} {currentMonth}
                          </button>
                       </div>
                    </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </>
        ) : (
          /* ================= STUDENT VIEW ================= */
          <>
            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
               <label className="text-xs text-zinc-400 font-bold uppercase mb-2 block ml-1">
                  Enter Class Code
               </label>
               <div className="flex gap-2">
                  <div className="relative flex-1">
                     <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                     <input 
                       type="text" 
                       placeholder="ex: PHY-2024-X" 
                       className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white font-mono text-sm focus:outline-none focus:border-violet-500 transition-colors"
                     />
                  </div>
                  <button className={`px-6 rounded-xl font-bold text-sm text-white ${theme.bg} hover:brightness-110 transition-all flex items-center gap-2`}>
                     Join <ArrowRight size={16} />
                  </button>
               </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Classes</h3>
                    
                </div>
                
            <div className="grid grid-cols-3 gap-4">
              {([...(Array.isArray(joinedClasses) ? joinedClasses.slice(0,3) : [])]).length > 0 ? (
                ([...(Array.isArray(joinedClasses) ? joinedClasses.slice(0,3) : [])]).map((c, idx) => (
                  <motion.button key={c.classid}
                    whileHover={{ y: -5 }}
                    className={`group relative h-32 rounded-2xl bg-gradient-to-br ${idx===0 ? 'from-cyan-900/40 border-cyan-500/20 hover:border-cyan-400/60' : idx===1 ? 'from-violet-900/40 border-violet-500/20 hover:border-violet-400/60' : 'from-orange-900/40 border-orange-500/20 hover:border-orange-400/60'} to-black border p-4 text-left overflow-hidden transition-all`}
                  >
                    <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all">
                      {idx===0 ? <Atom className="text-cyan-400" size={40} /> : idx===1 ? <Code2 className="text-violet-400" size={40} /> : <Calculator className="text-orange-400" size={40} />}
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <p className={`text-xs font-mono mb-1 ${idx===0 ? 'text-cyan-200' : idx===1 ? 'text-violet-200' : 'text-orange-200'}`}>{c.classid}</p>
                      <h4 className="text-white font-bold">{c.classname}</h4>
                    </div>
                  </motion.button>
                ))
              ) : (
                <div className="col-span-3 p-4 rounded-2xl border border-white/10 bg-black/40 flex flex-col items-center justify-center h-32">
                  <p className="text-zinc-400 text-xs font-medium">No classes joined yet</p>
                  <p className="text-zinc-600 text-[10px] mt-1">Join a class with the code above.</p>
                </div>
              )}
            </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

// 3. RIGHT PANEL (Detailed Profile - Professional Avatars)
const ProfileSection = ({ role, theme, profile }) => {
  const navigate = useNavigate();

  // Updated Data
  const profileData = profile ? {
    name: profile.name || (role === 'teacher' ? 'Faculty Member' : 'Student'),
    roleLabel: role === 'teacher' ? 'Senior Faculty' : 'Student',
    field1_label: role === 'teacher' ? 'Employee ID' : 'Roll No',
    field1_value: profile.rollno || '—',
    field2_label: role === 'teacher' ? 'Designation' : 'Division',
    field2_value: role === 'teacher' ? profile.designation || 'Professor' : profile.division || '—',
    field3_label: 'Department',
    field3_value: profile.department || '—',
    email: profile.clientId ? profile.clientId : '—',
    avatarUrl: profile.avatarUrl || ''
  } : (role === 'teacher' ? {
    name: "Dr. Sarah Connors",
    roleLabel: "Senior Faculty",
    field1_label: "Employee ID",
    field1_value: "FAC-9920",
    field2_label: "Designation",
    field2_value: "Professor",
    email: "sarah.c@uni.edu",
    avatarUrl: ""
  } : {
    name: "Alex Carter",
    roleLabel: "Student • Year 3",
    field1_label: "Roll No",
    field1_value: "21-CSE-045",
    field2_label: "Division",
    field2_value: "Batch A2",
    email: "alex.c@uni.edu",
    avatarUrl: ""
  });

  return (
    <div className={`h-full p-6 rounded-[32px] border ${theme.border} bg-zinc-900/80 flex flex-col relative`}>
      
      {/* Top Bar */}
      <div className="flex justify-between items-start mb-6">
         <span className={`px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider ${theme.text}`}>
            {role === 'teacher' ? 'Faculty Portal' : 'Student Portal'}
         </span>
         <button 
            onClick={() => navigate('/')} 
            className="p-2 rounded-full bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
            title="Logout"
         >
            <LogOut size={16} />
         </button>
      </div>

      {/* Avatar & Name */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative group cursor-pointer">
           <div className={`absolute inset-0 rounded-full ${theme.bg} blur-2xl opacity-20 group-hover:opacity-40 transition-opacity`} />
           <img 
             src={profileData.avatarUrl} 
             alt="Avatar" 
             className="relative w-32 h-32 rounded-full border-4 border-zinc-800 bg-black object-cover shadow-2xl"
           />
           <div className={`absolute bottom-1 right-1 p-2 rounded-full ${theme.bg} text-white border-4 border-zinc-900 hover:scale-110 transition-transform shadow-lg`}>
              <Edit2 size={14} />
           </div>
        </div>
        <h2 className="text-xl font-bold text-white mt-4">{profileData.name}</h2>
        <p className="text-zinc-500 text-xs uppercase tracking-wide mt-1">{profileData.roleLabel}</p>
      </div>

      {/* Info Card (Dynamic Fields) */}
      <div className="flex-1">
         <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
            
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-white/5 text-zinc-400"><Hash size={12} /></div>
                    <span className="text-zinc-500 text-xs uppercase">{profileData.field1_label}</span>
                </div>
                <span className="text-white text-xs font-mono bg-white/5 px-2 py-1 rounded">{profileData.field1_value}</span>
            </div>
            <div className="w-full h-px bg-white/5" />
            
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-white/5 text-zinc-400"><GraduationCap size={12} /></div>
                    <span className="text-zinc-500 text-xs uppercase">{profileData.field2_label}</span>
                </div>
                <span className="text-white text-xs">{profileData.field2_value}</span>
            </div>
            <div className="w-full h-px bg-white/5" />
            
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-white/5 text-zinc-400"><Users size={12} /></div>
                    <span className="text-zinc-500 text-xs uppercase">{profileData.field3_label}</span>
                </div>
                <span className="text-white text-xs">{profileData.field3_value}</span>
            </div>
            <div className="w-full h-px bg-white/5" />
            
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-white/5 text-zinc-400"><Mail size={12} /></div>
                    <span className="text-zinc-500 text-xs uppercase">Email</span>
                </div>
                <span className="text-white text-xs truncate max-w-[120px]">{profileData.email}</span>
            </div>
         </div>
      </div>

      {/* Edit Profile Button */}
      <div className="mt-4">
         <button className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
            <Settings size={16} /> Edit Profile
         </button>
      </div>

    </div>
  );
};

// --- MAIN DASHBOARD LAYOUT ---
export default function StudDashboard() {
  const authData = window.authData || {
    "clientId":"s1@abc.edu",
    "authToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRJZCI6InMxQGFiYy5lZHUiLCJuYW1lIjoiU3R1ZGVudCAxIiwic2VydmVyTmFtZSI6IlZSQ2xhc3MgUzEiLCJhdmF0YXJVcmwiOiIiLCJtb2RlIjoxLCJwb3NpdGlvbkluZGV4IjotMSwiZXhwIjoxNzk1OTc0Mjc0fQ.wY1OsWSRXjN6mwhCJdn5rcXjNSmYeWpmO0iTh0ZPk8o"
  }; // { authToken, clientId }
  const isUnity = window.isUnity || false;

  const location = useLocation();
  const role = location.state?.role || 'student';

  const theme = role === 'teacher' ? {
    bg: 'bg-teal-600',
    text: 'text-teal-400',
    border: 'border-teal-500/20',
    glow: 'bg-teal-500',
  } : {
    bg: 'bg-violet-600',
    text: 'text-violet-400',
    border: 'border-violet-500/20',
    glow: 'bg-violet-500',
  };

  const API_BASE = 'http://localhost:8000/api';
  const [profile, setProfile] = useState(null);
  const [pastLectures, setPastLectures] = useState([]);
  const [liveLectures, setLiveLectures] = useState([]);
  const [joinedClasses, setJoinedClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!authData?.authToken || !authData?.clientId) return;
      setLoading(true);
      try {
        // Profile (GET to /generalprofile due to server expecting JSON body)
        const profRes = await fetch(`${API_BASE}/generalprofile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authToken: authData.authToken })
        });
        const profJson = await profRes.json();
        if (!profJson.error) setProfile(profJson);

        // Past lectures
        const pastRes = await fetch(`${API_BASE}/lectures/past`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authToken: authData.authToken, limit: 10 })
        });
        const pastJson = await pastRes.json();
        setPastLectures(Array.isArray(pastJson.lectures) ? pastJson.lectures : []);

        // Live lectures
        const liveRes = await fetch(`${API_BASE}/lectures/live`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authToken: authData.authToken })
        });
        const liveJson = await liveRes.json();
        setLiveLectures(Array.isArray(liveJson.lectures) ? liveJson.lectures : []);

        // Joined classes
        const classesRes = await fetch(`${API_BASE}/user/classes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authToken: authData.authToken })
        });
        const classesJson = await classesRes.json();
        setJoinedClasses(Array.isArray(classesJson.classes) ? classesJson.classes : []);
      } catch (err) {
        console.error('Dashboard data load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authData?.authToken, authData?.clientId]);

  return (
    <div className="min-h-screen w-full bg-black text-white p-4 lg:p-8 font-sans overflow-auto flex items-center justify-center">
      <div className="fixed inset-0 pointer-events-none">
         <div className={`absolute top-0 left-0 w-[500px] h-[500px] ${theme.glow} opacity-10 blur-[150px]`} />
         <div className={`absolute bottom-0 right-0 w-[500px] h-[500px] ${theme.glow} opacity-10 blur-[150px]`} />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-[1400px] h-[85vh] grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        <div className="lg:col-span-3 h-full">
          <HistoryPanel theme={theme} pastLectures={pastLectures} liveLectures={liveLectures} />
        </div>
        <div className="lg:col-span-6 h-full">
          <ActionCenter role={role} theme={theme} joinedClasses={joinedClasses} />
        </div>
        <div className="lg:col-span-3 h-full">
          <ProfileSection role={role} theme={theme} profile={profile} />
        </div>
      </motion.div>
      
    </div>
  );
}