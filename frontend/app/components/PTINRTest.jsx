"use client";
import { useState, useRef } from "react";

export default function PTINRTest() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [gender, setGender] = useState("M");
  const [onWarfarin, setOnWarfarin] = useState("N");
  const [mechValve, setMechValve] = useState("N");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleDiagnose = async () => {
    if (!file) {
      alert("Please upload an assay image first.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("gender", gender);
    formData.append("on_warfarin", onWarfarin);
    formData.append("mechanical_mitral_valve", mechValve);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/diagnose`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error diagnosing:", error);
      alert("Failed to connect to the backend. Is FastAPI running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column: Inputs */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">Clinical Details</h2>
        
        {/* Form Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <label className="block text-sm font-semibold text-slate-600 mb-2">Gender</label>
            <select 
              value={gender} onChange={(e) => setGender(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <label className="block text-sm font-semibold text-slate-600 mb-2">On Warfarin?</label>
            <select 
              value={onWarfarin} onChange={(e) => setOnWarfarin(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="Y">Yes</option>
              <option value="N">No</option>
            </select>
          </div>
          <div className="col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <label className="block text-sm font-semibold text-slate-600 mb-2">Mechanical Mitral Valve Replacement?</label>
            <select 
              value={mechValve} onChange={(e) => setMechValve(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="Y">Yes</option>
              <option value="N">No</option>
            </select>
          </div>
        </div>

        {/* Image Upload Zone */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/50 rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 group"
        >
          <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
          {preview ? (
            <img src={preview} alt="Preview" className="mx-auto max-h-48 rounded-xl shadow-md" />
          ) : (
            <div className="py-6">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
              </div>
              <p className="text-indigo-900 font-semibold text-lg">Click to Upload Assay Image</p>
              <p className="text-indigo-500/70 text-sm mt-1">PNG, JPG, JPEG</p>
            </div>
          )}
        </div>

        <button 
          onClick={handleDiagnose}
          disabled={loading || !file}
          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
        >
          {loading ? "Analyzing Image..." : "Run Diagnosis"}
        </button>
      </div>

      {/* Right Column: Results */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
        
        <h2 className="text-2xl font-bold text-white mb-8 relative z-10">Test Results</h2>
        
        {results ? (
          <div className="space-y-6 relative z-10">
            {/* HCT Result Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-indigo-200 font-medium tracking-wider uppercase text-sm">HCT Level</span>
                <span className="text-3xl font-extrabold">{results.hct_value}%</span>
              </div>
              <p className={`text-sm font-semibold px-3 py-1 rounded-full inline-block ${results.hct_diagnosis.includes("Normal") ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                {results.hct_diagnosis}
              </p>
            </div>

            {/* PTINR Result Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-indigo-200 font-medium tracking-wider uppercase text-sm">PT/INR Ratio</span>
                <span className="text-3xl font-extrabold">{results.ptinr_value}</span>
              </div>
              <p className={`text-sm font-semibold px-3 py-1 rounded-full inline-block ${results.ptinr_diagnosis === "Normal" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                {results.ptinr_diagnosis}
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 min-h-[300px]">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <p className="text-lg">Upload an image and run diagnosis to view results here.</p>
          </div>
        )}
      </div>
    </div>
  );
}