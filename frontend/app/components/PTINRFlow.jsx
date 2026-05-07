"use client";
import { useState, useRef, useEffect } from "react";

export default function PTINRFlow() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [gender, setGender] = useState("M");
  const [onWarfarin, setOnWarfarin] = useState("N");
  const [mechValve, setMechValve] = useState("N");
  const [results, setResults] = useState(null);
  
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setStep(2); // Auto-advance to details when image is selected
    }
  };

  const handleAnalyze = async () => {
    setStep(3); // Move to loading screen
    
    // Simulate API Call (Replace with your actual fetch code to FastAPI)
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
      setStep(4); // Move to results
    } catch (error) {
      console.error("Error diagnosing:", error);
      alert("Failed to connect to backend.");
      setStep(2); // Go back if failed
    }
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* STEP 1: CAPTURE IMAGE */}
      {step === 1 && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-indigo-950 mb-2">Diagnostic Capture</h2>
          <p className="text-sm text-slate-500 mb-6">Prepare your assay strip for high-precision optical analysis.</p>
          
          <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100">
            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Pre-Capture Checklist</h3>
            <p className="text-sm text-slate-600 flex items-start">
              <span className="w-2 h-2 bg-indigo-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
              Ensure the entire strip is visible (both rectangular and circular regions).
            </p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-indigo-900 hover:bg-indigo-800 text-white rounded-2xl p-6 flex flex-col items-center justify-center transition-colors shadow-md"
            >
               <svg className="w-8 h-8 mb-3 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
               <span className="font-bold text-lg">Capture Assay Image</span>
               <span className="text-xs text-indigo-300 mt-1">Use device camera for real-time analysis</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
          </div>
        </div>
      )}

      {/* STEP 2: PATIENT DETAILS */}
      {step === 2 && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <button onClick={() => setStep(1)} className="text-slate-400 mb-4 flex items-center text-sm font-semibold hover:text-indigo-600 transition-colors">
            &larr; Back to Capture
          </button>
          
          <h2 className="text-xl font-bold text-indigo-950 mb-2">Patient Details</h2>
          <p className="text-sm text-slate-500 mb-6">Ensure all parameters are accurate before proceeding to diagnostic analysis.</p>

          <div className="space-y-6">
            {/* Custom Gender Toggle */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Gender</label>
              <div className="flex bg-slate-200/50 rounded-xl p-1">
                <button onClick={() => setGender("M")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${gender === "M" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"}`}>Male</button>
                <button onClick={() => setGender("F")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${gender === "F" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"}`}>Female</button>
              </div>
            </div>

            {/* Custom Switches */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex justify-between items-center">
              <div>
                <p className="font-bold text-sm text-slate-800">Are you on Warfarin?</p>
                <p className="text-xs text-slate-500 mt-0.5">Required for baseline calculation.</p>
              </div>
              <button onClick={() => setOnWarfarin(onWarfarin === "Y" ? "N" : "Y")} className={`w-12 h-6 rounded-full transition-colors relative ${onWarfarin === "Y" ? "bg-indigo-600" : "bg-slate-300"}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${onWarfarin === "Y" ? "translate-x-7" : "translate-x-1"}`}></div>
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex justify-between items-center">
              <div className="pr-4">
                <p className="font-bold text-sm text-slate-800">Mechanical Mitral Valve?</p>
                <p className="text-xs text-slate-500 mt-0.5">Critical factor for target therapeutic range adjustments.</p>
              </div>
              <button onClick={() => setMechValve(mechValve === "Y" ? "N" : "Y")} className={`w-12 h-6 rounded-full transition-colors relative ${mechValve === "Y" ? "bg-indigo-600" : "bg-slate-300"}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${mechValve === "Y" ? "translate-x-7" : "translate-x-1"}`}></div>
              </button>
            </div>

            <button onClick={handleAnalyze} className="w-full bg-indigo-900 hover:bg-indigo-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98]">
              Proceed to Analysis &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PROCESSING (LOADING) */}
      {step === 3 && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center py-12">
           <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
           </div>
           <h2 className="text-xl font-bold text-indigo-950 mb-2">Image Processing</h2>
           <p className="text-sm text-slate-500">Applying computer vision masks to HCT and PT regions. Please wait...</p>
        </div>
      )}

      {/* STEP 4: DIAGNOSTIC RESULTS */}
      {step === 4 && results && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-indigo-950 mb-1">Diagnostic Results</h2>
            <p className="text-xs text-slate-400 mb-6 font-mono">Patient ID: #INR-{Math.floor(Math.random() * 90000) + 10000} | {new Date().toLocaleDateString()}</p>
            
            {/* The Visual Slider Card */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mb-4">
              <div className="flex justify-between items-start mb-4">
                 <div>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">International Normalized Ratio</p>
                   <div className="flex items-baseline space-x-1">
                     <span className="text-4xl font-black text-indigo-900">{results.ptinr_value}</span>
                     <span className="text-xs font-bold text-slate-400">INR</span>
                   </div>
                 </div>
                 <span className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider ${results.ptinr_diagnosis === "Normal" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                   {results.ptinr_diagnosis === "Normal" ? "Normal" : "Abnormal"}
                 </span>
              </div>
              
              {/* Fake visual bar for mockup accuracy */}
              <div className="w-full h-3 bg-gradient-to-r from-rose-400 via-emerald-400 to-rose-400 rounded-full relative mb-6">
                 {/* The marker pip */}
                 <div className="absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-slate-900 rounded-full" style={{ left: '40%' }}></div>
              </div>
            </div>

            {/* Minor Results Row */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">HCT</p>
                  <span className="text-xl font-black text-slate-800">{results.hct_value}%</span>
                  <p className="text-xs font-semibold text-emerald-600 mt-1">{results.hct_diagnosis}</p>
               </div>
               <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-xs font-semibold text-slate-600 leading-tight">Algorithm computation successful.</p>
               </div>
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            <button onClick={() => { setStep(1); setFile(null); setResults(null); }} className="w-full bg-indigo-900 text-white font-bold py-3.5 rounded-xl shadow-md active:scale-95 transition-transform">
              + New Test
            </button>
            <button className="w-full bg-white text-indigo-900 border border-indigo-200 font-bold py-3.5 rounded-xl shadow-sm active:scale-95 transition-transform">
              Export Lab Report (PDF)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}