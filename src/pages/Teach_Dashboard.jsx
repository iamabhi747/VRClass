import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, Edit2, Shield, BookOpen, 
  ChevronRight, Globe, Zap, Video, Plus, LogOut, Settings, 
  Hash, Mail, GraduationCap, Users, ArrowRight,
  Atom, Code2, Calculator
} from 'lucide-react';
import { run, resolveCallback } from '../bridge';

window.resolveCallback = resolveCallback;

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
          liveLectures.map((lec) => {
            const start = lec.startTime ? new Date(lec.startTime) : null;
            const end = lec.endTime ? new Date(lec.endTime) : null;
            const now = new Date();
            const isToday = start && start.toDateString() === now.toDateString();
            const timeStr = start ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--';
            const dateStr = start ? start.toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
            const started = start && start.getTime() <= now.getTime();
            const notEnded = !end || end.getTime() >= now.getTime();
            const isLive = !!lec.isLive || !!lec.live || lec.status === 'live' || lec.started || (started && notEnded);

            return (
              <div key={lec.id} className={`p-3 rounded-xl bg-white/5 border ${theme.border} hover:bg-white/10 transition-colors flex items-center justify-between gap-3`}> 
                <div className="flex items-start gap-3">
                  {/* Live indicator - red dot for live meetings */}
                  <div className="flex items-center">
                    {isLive ? (
                      <span className="flex h-3 w-3 relative mt-1 mr-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-50"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <div className="text-sm text-zinc-300 font-medium">
                      {isToday ? (
                        <>{timeStr}</>
                      ) : (
                        <>{dateStr} • {timeStr}</>
                      )}
                    </div>
                    <div className={`text-xs mt-1 ${theme.text} font-bold`}>{lec.title || lec.classname || 'Untitled Class'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isLive ? (
                    <button
                      onClick={() => {
                        if (window.isUnity) {
                          run('StartLecture', { lectureId: lec.id }, () => {}, () => {});
                          return;
                        }
                      }}
                      className={`p-2 rounded-full ${theme.bg} text-white hover:brightness-110 transition-all shadow-sm transform hover:scale-105 hover:translate-x-1`} 
                      title="Join class"
                    >
                      <ArrowRight size={14} />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })
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
          pastLectures.map((lec) => {
            const start = lec.startTime ? new Date(lec.startTime) : null;
            const now = new Date();
            const isToday = start && start.toDateString() === now.toDateString();
            const timeStr = start ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--';
            const dateStr = start ? start.toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';

            return (
              <div key={lec.id} className={`p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer border ${theme.border} bg-white/5`}> 
                <div>
                  <div className="text-sm text-zinc-300 font-medium">
                    {isToday ? (
                      <>{timeStr}</>
                    ) : (
                      <>{dateStr} • {timeStr}</>
                    )}
                  </div>
                  <div className={`text-xs mt-1 ${theme.text} font-bold`}>{lec.title || lec.classname || 'Untitled Lecture'}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  </div>
);

// 2. MIDDLE PANEL (Action Center - Dynamic Calendar)
const ActionCenter = ({ role, theme, joinedClasses = [], authToken, API_BASE, onClassCreated, onLectureScheduled }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  // Teacher specific state
  const [teacherClasses, setTeacherClasses] = useState(joinedClasses || []);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassCode, setNewClassCode] = useState('');
  const [showSchedulePanel, setShowSchedulePanel] = useState(false);
  const [scheduleClass, setScheduleClass] = useState(null);
  const [scheduleDate, setScheduleDate] = useState(null);
  const [scheduleTime, setScheduleTime] = useState('10:00');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [scheduleCreating, setScheduleCreating] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  // Instant meeting modal state
  const [showInstantModal, setShowInstantModal] = useState(false);
  const [instantClass, setInstantClass] = useState(null);
  const [instantCreating, setInstantCreating] = useState(false);
  const [instantError, setInstantError] = useState('');
  useEffect(() => {
    setTeacherClasses(joinedClasses || []);
  }, [joinedClasses]);
  
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
                  <button
                    onClick={() => {
                      if (teacherClasses.length === 0) return;
                      setInstantClass(teacherClasses[0]);
                      setInstantError('');
                      setShowInstantModal(true);
                    }}
                    className="relative w-full h-full bg-black border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-zinc-900 transition-colors"
                  >
                     <Zap size={24} className="text-teal-400" />
                     <span className="text-white font-bold text-sm">Instant Meeting</span>
                  </button>
               </div>

              <div className="relative group">
                <button onClick={() => setShowCreateModal(true)} className="relative w-full h-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-zinc-800 transition-colors">
                  <Plus size={24} className="text-zinc-500 group-hover:text-white transition-colors" />
                  <span className="text-zinc-400 group-hover:text-white font-bold text-sm transition-colors">Create Class</span>
                </button>
              </div>
            </div>

            {/* Classes List */}
            <motion.div animate={{ y: showSchedulePanel ? -20 : 0, opacity: showSchedulePanel ? 0.85 : 1 }} transition={{ duration: 0.18 }} className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-6 backdrop-blur-md flex flex-col min-h-[300px] relative">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-bold">Classes</h3>
                  <button onClick={() => setShowCreateModal(true)} className="px-3 py-1 text-xs rounded-md border border-white/10 text-white/60 hover:bg-white/5">Create</button>
               </div>
               <div className="grid grid-cols-2 gap-3">
                 {teacherClasses.length === 0 ? (
                   <div className="col-span-2 p-4 rounded-2xl border border-white/5 bg-black/30 text-zinc-400">No classes yet — create one to schedule meetings</div>
                 ) : (
                   teacherClasses.map((c) => (
                     <motion.div key={c.classid || c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 350, damping: 26 }} className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex flex-col justify-between">
                       <div>
                         <p className="text-xs font-mono text-zinc-400 mb-1">{c.classid}</p>
                         <h4 className="text-white font-bold">{c.classname}</h4>
                       </div>
                       <div className="mt-4 flex items-center gap-2 justify-between">
                         <span className="text-xs text-zinc-400">{c.students ? `${c.students.length} students` : ''}</span>
                         <button onClick={() => { setScheduleClass(c); setShowSchedulePanel(true); setScheduleDate(new Date().toISOString().slice(0,10)); setScheduleTime('10:00'); }} className={`px-3 py-1 rounded-md text-xs font-bold ${theme.bg} text-white`}>Schedule Meet</button>
                       </div>
                     </motion.div>
                   ))
                 )}
               </div>
               
               <AnimatePresence>
                 {showSchedulePanel && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 flex items-end justify-center p-6"> 
                     <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSchedulePanel(false)} />
                     <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} className="relative z-30 w-full max-w-2xl bg-black/80 border border-white/10 rounded-t-3xl p-6">
                       <div className="flex items-center justify-between mb-3">
                         <h4 className="text-lg font-bold text-white">Schedule Meet</h4>
                         <button onClick={() => setShowSchedulePanel(false)} className="text-white/60 hover:text-white">✕</button>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         <div>
                           <label className="text-xs text-zinc-400">Class</label>
                           <select value={scheduleClass?.classid || ''} onChange={(e) => setScheduleClass(teacherClasses.find(t => t.classid === e.target.value))} className="w-full bg-black/60 border border-white/10 rounded-md p-2 text-white mt-1">
                             <option value="">Select class</option>
                             {teacherClasses.map((tc) => (<option key={tc.classid} value={tc.classid}>{tc.classname}</option>))}
                           </select>
                         </div>
                         <div>
                           <label className="text-xs text-zinc-400">Date</label>
                           <input type="date" value={scheduleDate || ''} onChange={(e) => setScheduleDate(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-md p-2 text-white mt-1" />
                         </div>
                         <div>
                           <label className="text-xs text-zinc-400">Time</label>
                           <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-md p-2 text-white mt-1" />
                         </div>
                         <div className="flex items-end justify-end">
                           <button
                             disabled={scheduleCreating || !scheduleClass || !scheduleDate || !scheduleTime}
                             onClick={async () => {
                               if (!scheduleClass || !scheduleDate || !scheduleTime || scheduleCreating) return;
                               setScheduleCreating(true);
                               setScheduleError('');
                               try {
                                 const [hours, minutes] = scheduleTime.split(':').map(Number);
                                 const [y,m,d] = scheduleDate.split('-').map(Number);
                                 // Build naive local ISO string (no timezone) to preserve chosen hour
                                 const iso = `${y.toString().padStart(4,'0')}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}T${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:00`;
                                 const res = await fetch(`${API_BASE}/lecture/schedule`, {
                                   method: 'POST',
                                   headers: { 'Content-Type': 'application/json' },
                                   body: JSON.stringify({ authToken, classid: scheduleClass.classid, title: scheduleClass.classname, startTime: iso })
                                 });
                                 const json = await res.json();
                                 if (json.success && json.lecture) {
                                   if (onLectureScheduled) await onLectureScheduled();
                                   setShowSchedulePanel(false);
                                   setScheduleDate(null);
                                   setScheduleTime('10:00');
                                   setScheduleClass(null);
                                 } else {
                                   setScheduleError(json.error || 'Failed to schedule lecture');
                                 }
                               } catch (e) {
                                 setScheduleError('Network error scheduling lecture');
                               } finally {
                                 setScheduleCreating(false);
                               }
                             }}
                             className={`px-4 py-2 rounded-md ${theme.bg} text-white disabled:opacity-50`}
                           >{scheduleCreating ? 'Scheduling...' : 'Schedule'}</button>
                         </div>
                         {scheduleError && <p className="col-span-2 text-xs text-red-400 mt-2">{scheduleError}</p>}
                       </div>
                     </motion.div>
                   </motion.div>
                 )}
               </AnimatePresence>
            </motion.div>

            {/* Create Class Modal */}
            <AnimatePresence>
              {showCreateModal && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-30 flex items-center justify-center p-6">
                  <div className="absolute inset-0 bg-black/60" onClick={() => setShowCreateModal(false)} />
                  <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }} className={`relative z-40 max-w-md w-full p-6 bg-black/80 border ${theme.border} rounded-2xl`}> 
                    <h4 className="text-lg font-bold text-white mb-2">Create Class</h4>
                    <p className="text-xs text-zinc-400 mb-4">Create a new class that you can schedule meetings for.</p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-zinc-400">Class name</label>
                        <input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-md p-2 text-white mt-1" placeholder="e.g. Physics 2024" />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400">Class code</label>
                        <input value={newClassCode} onChange={(e) => setNewClassCode(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-md p-2 text-white mt-1" placeholder="e.g. PHY-2024-X" />
                      </div>
                      <div className="flex items-center justify-end gap-2 mt-4">
                        <button onClick={() => setShowCreateModal(false)} className="px-3 py-1 text-xs rounded-md border border-white/10 text-white/60 hover:bg-white/5">Cancel</button>
                        <button
                          disabled={creating}
                          onClick={async () => {
                            if (!newClassName.trim() || !newClassCode.trim() || creating) return;
                            setCreating(true);
                            setCreateError('');
                            try {
                              const res = await fetch(`${API_BASE}/class/create`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ authToken: authToken, classname: newClassName.trim(), classid: newClassCode.trim() })
                              });
                              const json = await res.json();
                              if (json.success && !json.error) {
                                // Refresh classes from parent
                                if (onClassCreated) await onClassCreated();
                                setShowCreateModal(false);
                                setNewClassName('');
                                setNewClassCode('');
                              } else {
                                setCreateError(json.error || 'Failed to create class');
                              }
                            } catch (e) {
                              setCreateError('Network error creating class');
                            } finally {
                              setCreating(false);
                            }
                          }}
                          className={`px-4 py-2 rounded-md ${theme.bg} text-white text-sm font-bold disabled:opacity-50`}
                        >{creating ? 'Creating...' : 'Create'}</button>
                      </div>
                      {createError && <p className="text-xs text-red-400 mt-2">{createError}</p>}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Instant Meeting Modal */}
            <AnimatePresence>
              {showInstantModal && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-30 flex items-center justify-center p-6">
                  <div className="absolute inset-0 bg-black/70" onClick={() => { if(!instantCreating) setShowInstantModal(false); }} />
                  <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 30 }} className={`relative z-40 max-w-sm w-full p-5 bg-black/85 border ${theme.border} rounded-2xl`}> 
                    <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><Zap size={18} className="text-teal-400" /> Start Instant Meeting</h4>
                    {teacherClasses.length === 0 ? (
                      <p className="text-xs text-zinc-500">You have no classes yet. Create a class first.</p>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Class</label>
                          <select
                            disabled={instantCreating}
                            value={instantClass?.classid || ''}
                            onChange={(e) => setInstantClass(teacherClasses.find(t => t.classid === e.target.value))}
                            className="mt-1 w-full bg-black/60 border border-white/10 rounded-md p-2 text-white text-sm"
                          >
                            {teacherClasses.map(tc => <option key={tc.classid} value={tc.classid}>{tc.classname}</option>)}
                          </select>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={instantCreating}
                            onClick={() => { if(!instantCreating) setShowInstantModal(false); }}
                            className="px-3 py-1 text-xs rounded-md border border-white/10 text-white/60 hover:bg-white/5"
                          >Cancel</button>
                          <button
                            disabled={instantCreating || !instantClass}
                            onClick={async () => {
                              if (!instantClass || instantCreating) return;
                              setInstantCreating(true);
                              setInstantError('');
                              try {
                                const now = new Date();
                                const y = now.getFullYear();
                                const m = now.getMonth() + 1;
                                const d = now.getDate();
                                const hh = now.getHours();
                                const mm = now.getMinutes();
                                const iso = `${y.toString().padStart(4,'0')}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}T${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:00`;
                                const res = await fetch(`${API_BASE}/lecture/schedule`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ authToken, classid: instantClass.classid, title: instantClass.classname, startTime: iso })
                                });
                                const json = await res.json();
                                if (json.success && json.lecture) {
                                  if (onLectureScheduled) await onLectureScheduled();
                                  setShowInstantModal(false);
                                  setInstantClass(null);
                                } else {
                                  setInstantError(json.error || 'Failed to start meeting');
                                }
                              } catch (e) {
                                setInstantError('Network error starting meeting');
                              } finally {
                                setInstantCreating(false);
                              }
                            }}
                            className={`px-4 py-2 rounded-md ${theme.bg} text-white text-xs font-bold disabled:opacity-50`}
                          >{instantCreating ? 'Starting...' : 'Start Now'}</button>
                        </div>
                        {instantError && <p className="text-xs text-red-400">{instantError}</p>}
                        <p className="text-[10px] text-zinc-500 mt-1">Starts immediately with current local time.</p>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
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
            onClick={() => {
              if (window.isUnity) {
                run('Logout', {}, () => {}, () => {});
                return;
              }
              navigate('/auth');
            }} 
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
        <button
        onClick={() => navigate('/TeachEditP', { state: { authData: window.authData || {
          "clientId":"t1@abc.edu",
          "authToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRJZCI6InQxQGFiYy5lZHUiLCJuYW1lIjoiVGVhY2hlciAxIiwic2VydmVyTmFtZSI6IlZSQ2xhc3MgUzEiLCJhdmF0YXJVcmwiOiIiLCJtb2RlIjoyLCJwb3NpdGlvbkluZGV4IjotMSwiZXhwIjozMzMwMDQzODQ0N30.z77u-3mkRCrzvm-aL05UtB68MWiSaM_DdnmboFoSIXw"
        } } })}
        className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
          <Settings size={16} /> Edit Profile
        </button>
      </div>

    </div>
  );
};

// --- MAIN DASHBOARD LAYOUT ---
export default function TeachDashboard() {
  const authData = window.authData || {
    "clientId":"t1@abc.edu",
    "authToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRJZCI6InQxQGFiYy5lZHUiLCJuYW1lIjoiVGVhY2hlciAxIiwic2VydmVyTmFtZSI6IlZSQ2xhc3MgUzEiLCJhdmF0YXJVcmwiOiIiLCJtb2RlIjoyLCJwb3NpdGlvbkluZGV4IjotMSwiZXhwIjozMzMwMDQzODQ0N30.z77u-3mkRCrzvm-aL05UtB68MWiSaM_DdnmboFoSIXw"
  }; // { authToken, clientId }
  const isUnity = window.isUnity || false;

  const location = useLocation();
  const role ='teacher';

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

  // Refresh classes list from API (used after creating a class)
  const refreshClasses = async () => {
    if (!authData?.authToken) return;
    try {
      const classesRes = await fetch(`${API_BASE}/user/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authToken: authData.authToken })
      });
      const classesJson = await classesRes.json();
      setJoinedClasses(Array.isArray(classesJson.classes) ? classesJson.classes : []);
    } catch (e) {
      console.error('Refresh classes failed:', e);
    }
  };

  // Refresh live lectures list (used after scheduling)
  const refreshLiveLectures = async () => {
    if (!authData?.authToken) return;
    try {
      const liveRes = await fetch(`${API_BASE}/lectures/live`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authToken: authData.authToken })
      });
      const liveJson = await liveRes.json();
      setLiveLectures(Array.isArray(liveJson.lectures) ? liveJson.lectures : []);
    } catch (e) {
      console.error('Refresh live lectures failed:', e);
    }
  };

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

  // Listen for scheduled lectures posted from ActionCenter and append to live lectures
  useEffect(() => {
    const handler = (ev) => {
      if (!ev?.data) return;
      if (ev.data.type === 'scheduleLecture' && ev.data.lecture) {
        setLiveLectures(prev => [ev.data.lecture, ...prev]);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

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
          <ActionCenter
            role={role}
            theme={theme}
            joinedClasses={joinedClasses}
            authToken={authData.authToken}
            API_BASE={API_BASE}
            onClassCreated={refreshClasses}
            onLectureScheduled={refreshLiveLectures}
          />
        </div>
        <div className="lg:col-span-3 h-full">
          <ProfileSection role={role} theme={theme} profile={profile} />
        </div>
      </motion.div>
      
    </div>
  );
}