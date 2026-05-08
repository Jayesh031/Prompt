"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle2, Download, Camera, UploadCloud, Loader2, Activity } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

export default function PTINRWizard() {
  const { addTestToHistory } = useAppContext();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  // State updated to match the exact values FastAPI expects ("M"/"F", "Y"/"N")
  const [formData, setFormData] = useState({
    gender: "M",
    on_warfarin: "N",
    mechanical_mitral_valve: "N",
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  
  // Two separate refs for upload vs device camera
  const fileUploadRef = useRef(null);
  const cameraCaptureRef = useRef(null);

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleImageChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setImageFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setPreview(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    const payload = new FormData();
    payload.append("file", imageFile);
    payload.append("gender", formData.gender);
    payload.append("on_warfarin", formData.on_warfarin);
    payload.append("mechanical_mitral_valve", formData.mechanical_mitral_valve);

    try {
      // Uses the env variable if available, otherwise fallbacks to local
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
      const response = await fetch(`${apiUrl}/diagnose`, {
        method: "POST",
        body: payload,
      });

      if (!response.ok) throw new Error("Diagnostic analysis failed");
      
      const data = await response.json();
      
      const finalResult = {
        testId: `TST-${Math.floor(Math.random() * 10000)}`,
        date: new Date().toLocaleDateString(),
        ...data
      };

      setResult(finalResult);
      addTestToHistory(finalResult);
      setStep(3); 
    } catch (error) {
      alert("Error analyzing test: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      const input = document.getElementById("pdf-content");
      if (!input) return alert("Could not find the report content to download.");

      const dataUrl = await toPng(input, { 
        backgroundColor: '#ffffff',
        pixelRatio: 2
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`PromPT_Diagnostic_Result_${result.testId}.pdf`);
      
    } catch (error) {
      console.error("PDF Generation Error: ", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-6 md:p-10 rounded-[2rem] shadow-[0_20px_60px_rgba(0,51,102,0.08)] border border-slate-100 relative overflow-hidden">
      {/* Decorative Brand Accent */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#003366] via-[#FFCC33] to-[#800000]"></div>

      <AnimatePresence mode="wait">
        
        {/* ================= STEP 1: PATIENT DATA ================= */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-2xl font-extrabold text-[#003366] mb-2">Patient Profile</h2>
            <p className="text-slate-500 mb-8 text-sm">Configure clinical parameters for accurate baseline analysis.</p>
            
            <div className="space-y-6 mb-10">
              
              {/* Custom Gender Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Biological Sex</label>
                <div className="flex bg-slate-100 p-1.5 rounded-xl">
                  <button 
                    onClick={() => setFormData({...formData, gender: "M"})} 
                    className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${formData.gender === "M" ? "bg-[#003366] text-white shadow-md" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    Male
                  </button>
                  <button 
                    onClick={() => setFormData({...formData, gender: "F"})} 
                    className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${formData.gender === "F" ? "bg-[#003366] text-white shadow-md" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    Female
                  </button>
                </div>
              </div>

              {/* iOS-Style Switches */}
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div>
                    <p className="font-bold text-sm text-[#003366]">Currently on Warfarin?</p>
                    <p className="text-xs text-slate-500 mt-1">Required for target baseline calculation.</p>
                  </div>
                  <button 
                    onClick={() => setFormData({...formData, on_warfarin: formData.on_warfarin === "Y" ? "N" : "Y"})} 
                    className={`w-14 h-8 rounded-full transition-colors relative shadow-inner ${formData.on_warfarin === "Y" ? "bg-[#FFCC33]" : "bg-slate-300"}`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-md absolute top-1 transition-transform ${formData.on_warfarin === "Y" ? "translate-x-7" : "translate-x-1"}`}></div>
                  </button>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="pr-4">
                    <p className="font-bold text-sm text-[#003366]">Mechanical Mitral Valve?</p>
                    <p className="text-xs text-slate-500 mt-1">Adjusts the therapeutic target range.</p>
                  </div>
                  <button 
                    onClick={() => setFormData({...formData, mechanical_mitral_valve: formData.mechanical_mitral_valve === "Y" ? "N" : "Y"})} 
                    className={`w-14 h-8 rounded-full transition-colors relative shadow-inner ${formData.mechanical_mitral_valve === "Y" ? "bg-[#FFCC33]" : "bg-slate-300"}`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-md absolute top-1 transition-transform ${formData.mechanical_mitral_valve === "Y" ? "translate-x-7" : "translate-x-1"}`}></div>
                  </button>
                </div>
              </div>
            </div>

            <button 
              onClick={handleNext} 
              className="w-full bg-[#003366] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#002244] transition-all shadow-lg active:scale-[0.98]">
              Continue to Capture <ArrowRight size={20} />
            </button>
          </motion.div>
        )}

        {/* ================= STEP 2: IMAGE UPLOAD ================= */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <button onClick={handleBack} className="text-slate-400 mb-4 flex items-center text-sm font-semibold hover:text-[#003366] transition-colors">
              <ArrowLeft size={16} className="mr-1" /> Back
            </button>
            <h2 className="text-2xl font-extrabold text-[#003366] mb-2">Assay Capture</h2>
            <p className="text-slate-500 mb-8 text-sm">Capture or upload the assay strip for AI analysis.</p>
            
            {/* Hidden Inputs for File/Camera */}
            <input type="file" ref={fileUploadRef} className="hidden" accept="image/*" onChange={handleImageChange} />
            <input type="file" ref={cameraCaptureRef} className="hidden" accept="image/*" capture="environment" onChange={handleImageChange} />

            {!preview ? (
              <div className="grid grid-cols-2 gap-4 mb-8">
                {/* Camera Button */}
                <button 
                  onClick={() => cameraCaptureRef.current?.click()}
                  className="col-span-2 sm:col-span-1 bg-[#003366]/5 border-2 border-[#003366]/20 hover:border-[#003366] text-[#003366] rounded-2xl p-8 flex flex-col items-center justify-center transition-all group"
                >
                  <Camera size={40} className="mb-4 text-[#003366]/70 group-hover:text-[#003366] group-hover:scale-110 transition-all" />
                  <span className="font-bold">Open Camera</span>
                  <span className="text-[10px] text-[#003366]/60 mt-2 uppercase tracking-wider">Take Photo</span>
                </button>

                {/* Upload Button */}
                <button 
                  onClick={() => fileUploadRef.current?.click()}
                  className="col-span-2 sm:col-span-1 bg-slate-50 border-2 border-slate-200 hover:border-slate-400 text-slate-600 rounded-2xl p-8 flex flex-col items-center justify-center transition-all group"
                >
                  <UploadCloud size={40} className="mb-4 text-slate-400 group-hover:text-slate-600 group-hover:scale-110 transition-all" />
                  <span className="font-bold">Upload File</span>
                  <span className="text-[10px] text-slate-400 mt-2 uppercase tracking-wider">From Gallery</span>
                </button>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border-2 border-[#003366] bg-slate-900 shadow-inner group mb-8">
                <img src={preview} alt="Assay Preview" className="w-full h-48 object-contain opacity-90 bg-black/50" />
                <div className="absolute inset-0 bg-[#003366]/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                  <p className="text-white font-bold mb-4">Ready for Analysis</p>
                  <button onClick={clearImage} className="bg-white text-[#003366] px-5 py-2 rounded-lg font-bold text-sm shadow-lg hover:scale-105 transition-transform">
                    Retake Image
                  </button>
                </div>
              </div>
            )}

            <button 
              onClick={handleSubmit} 
              disabled={!imageFile || loading} 
              className="w-full bg-[#FFCC33] text-[#003366] font-extrabold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#e6b800] transition-all disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 shadow-[0_10px_20px_rgba(255,204,51,0.2)] active:scale-[0.98]">
              {loading ? <><Loader2 size={20} className="animate-spin" /> Processing AI Analysis...</> : <>Run Diagnostics <Activity size={20} /></>}
            </button>
          </motion.div>
        )}

        {/* ================= STEP 3: RESULTS & PDF ================= */}
        {step === 3 && result && (
          <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            
            {/* The area to be exported as PDF */}
            <div id="pdf-content" className="p-6 md:p-8 bg-white border-2 border-[#003366]/10 rounded-2xl mb-6 relative overflow-hidden">
              {/* Watermark/Background decoration for PDF */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#003366]/5 rounded-full blur-2xl"></div>
              
              <div className="flex justify-between items-end mb-8 border-b-2 border-slate-100 pb-4 relative z-10">
                <div>
                  <h3 className="text-2xl font-black text-[#003366] mb-1">Assay Report</h3>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{result.date}</span>
                </div>
                <div className="text-right">
                  <span className="bg-[#FFCC33]/20 text-[#003366] px-3 py-1 rounded-md text-xs font-bold border border-[#FFCC33]/50 inline-block mb-1">
                    Verified
                  </span>
                  <p className="text-xs font-medium text-slate-500 font-mono">{result.testId}</p>
                </div>
              </div>
              
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Prothrombin Time</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-4xl font-black text-[#003366]">{result.ptinr_value}</p>
                    <p className="text-xs font-bold text-slate-400">INR</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Hematocrit</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-4xl font-black text-[#003366]">{result.hct_value}</p>
                    <p className="text-xl font-bold text-slate-400">%</p>
                  </div>
                </div>
              </div>

              {/* Diagnosis Blocks */}
              <div className="space-y-4 relative z-10">
                <div className={`p-4 rounded-xl border-l-4 ${result.ptinr_diagnosis === "Normal" ? "bg-emerald-50 border-emerald-500" : "bg-[#800000]/5 border-[#800000]"}`}>
                  <p className="font-bold mb-1 text-[10px] uppercase tracking-wider text-slate-500">PT/INR Indication</p>
                  <p className={`font-bold text-sm ${result.ptinr_diagnosis === "Normal" ? "text-emerald-700" : "text-[#800000]"}`}>
                    {result.ptinr_diagnosis}
                  </p>
                </div>
                <div className={`p-4 rounded-xl border-l-4 ${result.hct_diagnosis.includes("Normal") ? "bg-emerald-50 border-emerald-500" : "bg-amber-50 border-amber-500"}`}>
                  <p className="font-bold mb-1 text-[10px] uppercase tracking-wider text-slate-500">HCT Indication</p>
                  <p className={`font-bold text-sm ${result.hct_diagnosis.includes("Normal") ? "text-emerald-700" : "text-amber-700"}`}>
                    {result.hct_diagnosis}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => { setStep(1); clearImage(); setResult(null); }} className="flex-1 bg-white border-2 border-[#003366] text-[#003366] font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
                New Test
              </button>
              <button onClick={downloadPDF} className="flex-1 bg-[#003366] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#002244] transition-colors shadow-lg">
                Download PDF <Download size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}