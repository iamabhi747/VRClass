import React, { useEffect, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import { motion } from "framer-motion";

import {
  Save,
  User,
  Briefcase,
  Hash,
  Building2,
  Camera,
  CheckCircle,
  X,
  Sparkles,
  Edit2,
} from "lucide-react";
import { run, resolveCallback } from '../bridge';

window.resolveCallback = resolveCallback;

// --- REUSABLE INPUT FIELD WITH GLOW EFFECT ---

const TechInput = ({
  label,
  icon: Icon,
  value,
  onChange,
  disabled = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative group">
      <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block ml-1">
        {label}
      </label>

      <div
        className={`

          relative flex items-center bg-black/40 border rounded-xl overflow-hidden transition-all duration-300

          ${
            isFocused
              ? "border-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.15)]"
              : "border-white/10 group-hover:border-white/20"
          }

          ${disabled ? "opacity-50 cursor-not-allowed" : ""}

        `}
      >
        {/* Icon Box */}

        <div
          className={`p-3 flex items-center justify-center border-r border-white/5 ${
            isFocused ? "text-teal-400" : "text-zinc-500"
          }`}
        >
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
          animate={{ width: isFocused ? "100%" : "0%" }}
          className="absolute bottom-0 left-0 h-[2px] bg-teal-500"
        />
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

export default function EditProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const authData = location.state?.authData || window.authData || null;
  const API_BASE = "http://localhost:8000/api";

  // Form Data loaded from API
  const [formData, setFormData] = useState({
    name: "",
    empId: "",
    designation: "",
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authToken: authData.authToken })
    })
      .then(async (res) => {
        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }
        // Map response to form fields for teacher mode
        setFormData({
          name: data.name || "",
          empId: data.employeeid || "",
          designation: data.designation || "",
          department: data.department || "",
          avatarUrl: data.avatarUrl || "",
          gender: data.gender || ""
        });
        setError("");
      })
      .catch((e) => setError(e.message || "Failed to load profile"))
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authToken: authData.authToken,
          name: formData.name,
          employeeid: formData.empId,
          designation: formData.designation,
          department: formData.department,
          avatarUrl: formData.avatarUrl,
          gender: formData.gender
        })
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      // If API returns new authToken, update global for consistency
      if (data.authToken) {
        window.authData = { clientId: data.clientId, authToken: data.authToken };
      }
      navigate("/teachdashboard");
    } catch (e) {
      setError(e.message || "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-white font-sans flex items-center justify-center p-4 relative overflow-hidden">
      {/* --- BACKGROUND AMBIENCE --- */}

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-teal-900/20 blur-[120px] rounded-full" />

        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-teal-600/10 blur-[150px] rounded-full" />

        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
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
          {/* Placeholder to preserve spacing where the Back button used to be */}

          <div className="flex items-center gap-2 text-sm font-medium opacity-0 pointer-events-none">
            <div className="p-2 rounded-full bg-white/5 border border-white/10 transition-all" />

            <span className="sr-only">Back to Command</span>
          </div>

          <div className="text-right">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Edit Identity
            </h2>

            <p className="text-xs text-zinc-500 uppercase tracking-widest">
              System Record Update
            </p>
          </div>
        </div>

        {/* THE EDIT CARD */}

        <div className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          {/* Decorative Grid Lines */}

          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500/0 via-teal-500/50 to-teal-500/0" />

          <div className="absolute top-0 right-8 w-px h-full bg-gradient-to-b from-white/5 to-transparent" />

          <div className="absolute bottom-0 left-8 w-px h-full bg-gradient-to-t from-white/5 to-transparent" />

          {/* 1. AVATAR SECTION */}

          <div className="flex flex-col items-center mb-12 relative">
            <div className="relative group">
              {/* Spinning Ring Animation */}

              <div className="absolute -inset-4 rounded-full border border-teal-500/20 border-dashed animate-[spin_10s_linear_infinite] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative w-40 h-40 rounded-full border-4 border-black shadow-2xl overflow-hidden">
                <img
                  src={`http://localhost:8000/static/images/${formData.avatarUrl}.png`}
                  alt="Avatar"
                  className="w-full h-full object-cover bg-zinc-900"
                />

                {/* Overlay on Hover */}

                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer backdrop-blur-sm">
                  <Camera size={32} className="text-teal-400 mb-2" />

                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Change Photo
                  </span>
                </div>
              </div>

              {/* Edit Badge */}

              <button className="absolute bottom-0 right-0 p-3 bg-teal-600 text-white rounded-full border-4 border-[#0a0a0a] shadow-lg hover:scale-110 hover:bg-teal-500 transition-all">
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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-bold uppercase tracking-widest">
                <Sparkles size={10} /> Your 3D Avatar
              </div>
            </div>
          </div>

          {/* 2. FORM GRID */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 relative z-10">
            {/* Full Width Name */}

            <div className="md:col-span-2">
              <TechInput
                label="Full Name"
                icon={User}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            {/* Details */}

            <TechInput
              label="Employee ID"
              icon={Hash}
              value={formData.empId}
              onChange={(e) =>
                setFormData({ ...formData, empId: e.target.value })
              }
            />

            <TechInput
              label="Designation"
              icon={Briefcase}
              value={formData.designation}
              onChange={(e) =>
                setFormData({ ...formData, designation: e.target.value })
              }
            />

            <div className="md:col-span-2">
              <TechInput
                label="Department"
                icon={Building2}
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
              />
            </div>

            {/* Gender */}
            <div className="md:col-span-2">
              <div className="relative group">
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block ml-1">Gender</label>
                <div className={`relative flex items-center bg-black/40 border rounded-xl overflow-hidden transition-all duration-300 border-white/10 group-hover:border-white/20`}>
                  <div className={`p-3 flex items-center justify-center border-r border-white/5 text-zinc-500`}>
                    <User size={18} />
                  </div>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-transparent px-4 py-3 text-sm text-white font-medium focus:outline-none appearance-none"
                  >
                    <option value="" className="bg-[#0a0a0a] text-white">Select…</option>
                    <option value="Male" className="bg-[#0a0a0a] text-white">Male</option>
                    <option value="Female" className="bg-[#0a0a0a] text-white">Female</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 3. ACTION BUTTONS */}

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-white/5">
            <button
              onClick={() => navigate("/teachdashboard")}
              className="px-6 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="relative overflow-hidden group px-8 py-3 rounded-xl bg-teal-600 text-white font-bold text-sm shadow-lg hover:shadow-[0_0_20px_rgba(20,184,166,0.4)] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />

              <span className="flex items-center gap-2">
                {isSaving ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Save size={16} /> Save Changes
                  </>
                )}
              </span>
            </button>
            {/* Status messages */}
            {loading && (
              <span className="text-xs text-zinc-500">Loading profile…</span>
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
