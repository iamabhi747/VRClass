import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
   Save, User, Hash, Building2, 
   Camera, Sparkles, Edit2, GraduationCap, Users 
} from 'lucide-react';
import { run, resolveCallback } from '../bridge';

window.resolveCallback = resolveCallback;

// --- REUSABLE INPUT FIELD (Violet Theme) ---
const StudentInput = ({ label, icon: Icon, value, onChange, disabled = false }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative group">
      <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block ml-1">
        {label}
      </label>
      <div 
        className={`
          relative flex items-center bg-black/40 border rounded-xl overflow-hidden transition-all duration-300
          ${isFocused ? 'border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.15)]' : 'border-white/10 group-hover:border-white/20'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {/* Icon Box */}
        <div className={`p-3 flex items-center justify-center border-r border-white/5 ${isFocused ? 'text-violet-400' : 'text-zinc-500'}`}>
           <Icon size={18} />
        </div>
        
        {/* Input Area */}
        <input 
          type="text" 
          value={value}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full bg-transparent px-4 py-3 text-sm text-white font-medium focus:outline-none placeholder:text-zinc-600"
        />
        
        {/* Focus Indicator Line */}
        <motion.div 
          initial={{ width: 0 }} 
          animate={{ width: isFocused ? '100%' : '0%' }} 
          className="absolute bottom-0 left-0 h-[2px] bg-violet-500"
        />
      </div>
    </div>
  );
};

// --- REUSABLE SELECT FIELD (Violet Theme) ---
const StudentSelect = ({ label, icon: Icon, value, onChange, disabled = false, children }) => {
   const [isFocused, setIsFocused] = useState(false);

   return (
      <div className="relative group">
         <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block ml-1">
            {label}
         </label>
         <div
            className={`
               relative flex items-center bg-black/40 border rounded-xl overflow-hidden transition-all duration-300
               ${isFocused ? 'border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.15)]' : 'border-white/10 group-hover:border-white/20'}
               ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
         >
            <div className={`p-3 flex items-center justify-center border-r border-white/5 ${isFocused ? 'text-violet-400' : 'text-zinc-500'}`}>
                <Icon size={18} />
            </div>
            <select
               value={value}
               onChange={onChange}
               disabled={disabled}
               onFocus={() => setIsFocused(true)}
               onBlur={() => setIsFocused(false)}
               className="w-full bg-transparent px-4 py-3 text-sm text-white font-medium focus:outline-none appearance-none"
            >
               {children}
            </select>
            <motion.div
               initial={{ width: 0 }}
               animate={{ width: isFocused ? '100%' : '0%' }}
               className="absolute bottom-0 left-0 h-[2px] bg-violet-500"
            />
         </div>
      </div>
   );
};

// --- MAIN COMPONENT ---
export default function StudentEditProfile() {
   const navigate = useNavigate();
   const location = useLocation();
   const authData = location.state?.authData || window.authData || null;
   const API_BASE = "http://localhost:8000/api";
  
   // Student Data from API
   const [formData, setFormData] = useState({
      name: "",
      rollNo: "",
      division: "",
      department: "",
      avatarUrl: "",
      gender: ""
   });

   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");
   const [isSaving, setIsSaving] = useState(false);

   // Fetch current profile details
   useEffect(() => {
      if (!authData?.authToken) {
         setError("Missing authentication. Please login again.");
         return;
      }
      setLoading(true);
      fetch(`${API_BASE}/generalprofile`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ authToken: authData.authToken })
      })
         .then(async (res) => {
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setFormData({
               name: data.name || "",
               rollNo: data.rollno || "",
               division: data.division || "",
               department: data.department || "",
               avatarUrl: data.avatarUrl || "",
               gender: data.gender || ""
            });
            setError("");
         })
         .catch((e) => setError(e.message || 'Failed to load profile'))
         .finally(() => setLoading(false));
   }, [authData, API_BASE]);

   const handleSave = async () => {
      if (!authData?.authToken) {
         setError("Missing authentication. Please login again.");
         return;
      }
      setIsSaving(true);
      setError("");
      try {
         const res = await fetch(`${API_BASE}/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               authToken: authData.authToken,
               name: formData.name,
               // Server updates name and avatarUrl; adding gender for future support
               avatarUrl: formData.avatarUrl,
               rollno: formData.rollNo,
               division: formData.division,
               department: formData.department,
               gender: formData.gender
            })
         });
         const data = await res.json();
         if (data.error) throw new Error(data.error);
         if (data.authToken) {
            window.authData = { clientId: data.clientId, authToken: data.authToken };
         }
         navigate('/studdashboard');
      } catch (e) {
         setError(e.message || 'Failed to save changes');
      } finally {
         setIsSaving(false);
      }
   };

  return (
    <div className="min-h-screen w-full bg-[#030014] text-white font-sans flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* --- BACKGROUND AMBIENCE (Student Violet Theme) --- */}
      <div className="fixed inset-0 pointer-events-none">
         {/* 1. Rotating Cosmic Nebulas */}
         <motion.div 
            animate={{ 
               scale: [1, 1.1, 1],
               rotate: [0, -45, 0],
               opacity: [0.2, 0.3, 0.2]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[20%] -right-[10%] w-[80vw] h-[80vw] bg-gradient-to-br from-violet-900/40 to-indigo-900/20 blur-[120px] rounded-full mix-blend-screen"
         />
         <motion.div 
            animate={{ 
               scale: [1, 1.2, 1],
               x: [0, 50, 0],
               opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-[20%] -left-[10%] w-[70vw] h-[70vw] bg-gradient-to-tr from-purple-900/30 to-violet-800/10 blur-[100px] rounded-full mix-blend-screen"
         />

         {/* 2. Technical Grid Overlay */}
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#8b5cf61a_1px,transparent_1px),linear-gradient(to_bottom,#8b5cf61a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
         
         {/* 3. Film Noise */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
      </div>

      {/* --- MAIN CONTENT CONTAINER --- */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "backOut" }}
        className="relative z-10 w-full max-w-2xl"
      >
        {/* Header Bar */}
            <div className="flex items-center justify-between mb-8 px-2">
                {/* Placeholder to preserve spacing where Back to Campus used to be */}
                <div className="flex items-center gap-2 text-sm font-medium opacity-0 pointer-events-none">
                   <div className="p-2 rounded-full bg-white/5 border border-white/10 transition-all" />
                   <span className="sr-only">Back to Campus</span>
                </div>
           
                <div className="text-right">
             <h2 className="text-xl font-bold text-white tracking-tight">Student Profile</h2>
             <p className="text-xs text-zinc-500 uppercase tracking-widest">Update Records</p>
           </div>
        </div>

        {/* THE EDIT CARD */}
        <div className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
           
           {/* Decorative Grid Lines (Violet) */}
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500/0 via-violet-500/50 to-violet-500/0" />
           <div className="absolute top-0 right-8 w-px h-full bg-gradient-to-b from-white/5 to-transparent" />
           <div className="absolute bottom-0 left-8 w-px h-full bg-gradient-to-t from-white/5 to-transparent" />

           {/* 1. AVATAR SECTION */}
           <div className="flex flex-col items-center mb-12 relative">
              <div className="relative group">
                 {/* Spinning Ring Animation */}
                 <div className="absolute -inset-4 rounded-full border border-violet-500/20 border-dashed animate-[spin_10s_linear_infinite] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                 
                 <div className="relative w-40 h-40 rounded-full border-4 border-black shadow-2xl overflow-hidden">
                              <img 
                                 src={`http://localhost:8000/static/images/${profileData.avatarUrl}.png`} 
                                 alt="Student Avatar" 
                                 className="w-full h-full object-cover bg-zinc-900"
                              />
                    {/* Overlay on Hover */}
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer backdrop-blur-sm">
                       <Camera size={32} className="text-violet-400 mb-2" />
                       <span className="text-xs font-bold text-white uppercase tracking-wider">Change Avatar</span>
                    </div>
                 </div>

                 {/* Edit Badge */}
                 <button className="absolute bottom-0 right-0 p-3 bg-violet-600 text-white rounded-full border-4 border-[#0a0a0a] shadow-lg hover:scale-110 hover:bg-violet-500 transition-all">
                    <Edit2
                    onClick={() => {
                        run('EditAvatar', {
                           avatarUrl: formData.avatarUrl,
                           gender: formData.gender
                        }, () => {}, () => {});
                     }}
                    size={16} />
                 </button>
              </div>
              
              <div className="mt-6 text-center">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold uppercase tracking-widest">
                    <Sparkles size={10} /> Your 3D Avatar
                 </div>
              </div>
           </div>

           {/* 2. FORM GRID */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 relative z-10">
              
              {/* Full Width Name */}
              <div className="md:col-span-2">
                 <StudentInput 
                    label="Full Name" 
                    icon={User} 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                 />
              </div>

              {/* Roll No */}
              <StudentInput 
                 label="Roll Number" 
                 icon={Hash} 
                 value={formData.rollNo} 
                 onChange={(e) => setFormData({...formData, rollNo: e.target.value})} 
              />
              
              {/* Division */}
              <StudentInput 
                 label="Division / Batch" 
                 icon={Users} 
                 value={formData.division} 
                 onChange={(e) => setFormData({...formData, division: e.target.value})} 
              />

              {/* Department */}
              <div className="md:col-span-2">
                 <StudentInput 
                    label="Department" 
                    icon={Building2} 
                    value={formData.department} 
                    onChange={(e) => setFormData({...formData, department: e.target.value})} 
                 />
              </div>

                  {/* Gender */}
                  <div className="md:col-span-2">
                     <StudentSelect
                        label="Gender"
                        icon={User}
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                     >
                        <option value="" className="bg-[#0a0a0a] text-white">Select…</option>
                        <option value="Male" className="bg-[#0a0a0a] text-white">Male</option>
                        <option value="Female" className="bg-[#0a0a0a] text-white">Female</option>
                     </StudentSelect>
                  </div>
           </div>

           {/* 3. ACTION BUTTONS */}
           <div className="flex items-center justify-end gap-4 pt-6 border-t border-white/5">
                     <button 
                        onClick={() => navigate('/studdashboard')}
                className="px-6 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="relative overflow-hidden group px-8 py-3 rounded-xl bg-violet-600 text-white font-bold text-sm shadow-lg hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                 <span className="flex items-center gap-2">
                    {isSaving ? (
                       <>Updating...</> 
                    ) : (
                       <><Save size={16} /> Save Records</>
                    )}
                 </span>
              </button>
              {loading && (
                <span className="text-xs text-zinc-400">Loading profile…</span>
              )}
              {error && (
                <span className="text-xs text-red-400">{error}</span>
              )}
           </div>

        </div>
      </motion.div>

    </div>
  );
}