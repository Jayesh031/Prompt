"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Download, Camera, UploadCloud, Loader2, Activity } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

export default function PTINRWizard() {
  const { addTestToHistory } = useAppContext();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const [formData, setFormData] = useState({
    gender: "M",
    on_warfarin: "N",
    mechanical_mitral_valve: "N",
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  
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
      console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);
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
      const input = document.getElementById("ptinr-pdf-template");
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

  // UPDATED: Gradient colors adjusted for Light/Dark Yellow and Lighter Red
  const renderScale = (score, onWarfarin, hasMitralValve) => {
    const numScore = parseFloat(score);
    if (isNaN(numScore)) return null;

    // 1. Determine Target Range based on logic rules
    let targetMin = 0.8;
    let targetMax = 1.1;

    if (hasMitralValve === "Y") {
      targetMin = 2.5;
      targetMax = 3.5;
    } else if (onWarfarin === "Y") {
      targetMin = 2.0;
      targetMax = 3.0;
    }

    // 2. Calculate percentages for the visual bars relative to a 0-6.0 scale axis
    const scaleMax = 6.0;
    const lowPct = (targetMin / scaleMax) * 100;
    const targetPct = ((targetMax - targetMin) / scaleMax) * 100;
    
    // Anything above targetMax is abnormal high. We map a band of +1.5 as 'High' and the rest as 'Critical'
    const highLimit = Math.min(targetMax + 1.5, scaleMax);
    const highPct = ((highLimit - targetMax) / scaleMax) * 100;

    // Marker location
    const markerPct = Math.min(Math.max((numScore / scaleMax) * 100, 0), 100);

    // 3. Dynamic Gradient Logic for a modern, smooth look
    const targetStart = lowPct;
    const targetEnd = lowPct + targetPct;
    const dangerStart = targetEnd + highPct;

    const modernGradient = {
      background: `linear-gradient(to right,
        #f59e0b 0%, 
        #fef08a ${Math.max(0, targetStart - 3)}%,         
        #34d399 ${targetStart}%, 
        #10b981 ${targetStart + 2}%, 
        #10b981 ${targetEnd - 2}%, 
        #34d399 ${targetEnd}%, 
        #fb923c ${Math.min(100, targetEnd + 3)}%, 
        #f87171 ${dangerStart}%, 
        #ef4444 100%
      )`
    };

    return (
      <div className="w-full mt-4 mb-6">
        <div className="flex justify-between items-end mb-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Diagnostic Scale</p>
          <p className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 uppercase tracking-widest">
            Target: {targetMin} - {targetMax}
          </p>
        </div>
        
        {/* Modern Gradient Scale Container */}
        <div 
          className="relative w-full h-3 sm:h-4 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-slate-200/50"
          style={modernGradient}
        >
          {/* Dynamic Marker */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-slate-800 z-10 transition-all duration-1000 ease-out shadow-sm"
            style={{ left: `calc(${markerPct}% - 2px)` }}
          >
            <div className="absolute -top-2 -left-1.5 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-slate-800"></div>
            <div className="absolute -bottom-2 -left-1.5 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[6px] border-b-slate-800"></div>
          </div>
        </div>
        
        {/* Dynamic Scale Labels bound exactly to the colored zones */}
        <div className="relative w-full h-4 mt-2 text-[10px] sm:text-xs font-semibold text-slate-400">
          <span className="absolute left-0">0</span>
          <span className="absolute transition-all duration-500" style={{ left: `${lowPct}%`, transform: 'translateX(-50%)' }}>{targetMin}</span>
          <span className="absolute transition-all duration-500" style={{ left: `${lowPct + targetPct}%`, transform: 'translateX(-50%)' }}>{targetMax}</span>
          <span className="absolute right-0">6.0+</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-6 sm:mt-10 bg-white p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2rem] shadow-sm sm:shadow-[0_20px_60px_rgba(0,51,102,0.08)] border border-slate-100 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1.5 sm:h-2 bg-gradient-to-r from-[#003366] via-[#FFCC33] to-[#800000]"></div>

      <AnimatePresence mode="wait">
        
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#003366] mb-2">Patient Profile</h2>
            <p className="text-slate-500 mb-6 sm:mb-8 text-xs sm:text-sm">Configure clinical parameters for accurate baseline analysis.</p>
            
            <div className="space-y-6 mb-8 sm:mb-10 w-full">
              <div className="w-full">
                <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 sm:mb-3">Biological Sex</label>
                <div className="flex bg-slate-100 p-1.5 rounded-xl w-full">
                  <button onClick={() => setFormData({...formData, gender: "M"})} className={`flex-1 py-2.5 sm:py-3 text-sm font-bold rounded-lg transition-all ${formData.gender === "M" ? "bg-[#003366] text-white shadow-md" : "text-slate-500 hover:text-slate-700"}`}>Male</button>
                  <button onClick={() => setFormData({...formData, gender: "F"})} className={`flex-1 py-2.5 sm:py-3 text-sm font-bold rounded-lg transition-all ${formData.gender === "F" ? "bg-[#003366] text-white shadow-md" : "text-slate-500 hover:text-slate-700"}`}>Female</button>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4 pt-2 w-full">
                <div className="flex flex-row justify-between items-center bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100 w-full gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-sm text-[#003366] leading-tight">Currently on Warfarin?</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Required for target baseline calculation.</p>
                  </div>
                  <button onClick={() => setFormData({...formData, on_warfarin: formData.on_warfarin === "Y" ? "N" : "Y"})} className={`w-12 h-7 sm:w-14 sm:h-8 rounded-full transition-colors relative shadow-inner shrink-0 ${formData.on_warfarin === "Y" ? "bg-[#FFCC33]" : "bg-slate-300"}`}>
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-md absolute top-1 transition-transform ${formData.on_warfarin === "Y" ? "translate-x-6 sm:translate-x-7" : "translate-x-1"}`}></div>
                  </button>
                </div>

                <div className="flex flex-row justify-between items-center bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100 w-full gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-sm text-[#003366] leading-tight">Mechanical Mitral Valve?</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Adjusts the therapeutic target range.</p>
                  </div>
                  <button onClick={() => setFormData({...formData, mechanical_mitral_valve: formData.mechanical_mitral_valve === "Y" ? "N" : "Y"})} className={`w-12 h-7 sm:w-14 sm:h-8 rounded-full transition-colors relative shadow-inner shrink-0 ${formData.mechanical_mitral_valve === "Y" ? "bg-[#FFCC33]" : "bg-slate-300"}`}>
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-md absolute top-1 transition-transform ${formData.mechanical_mitral_valve === "Y" ? "translate-x-6 sm:translate-x-7" : "translate-x-1"}`}></div>
                  </button>
                </div>
              </div>
            </div>

            <button onClick={handleNext} className="w-full bg-[#003366] text-white font-bold py-3.5 sm:py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#002244] transition-all shadow-lg active:scale-[0.98] text-sm sm:text-base">
              Continue to Capture <ArrowRight size={18} />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full">
            <button onClick={handleBack} className="text-slate-400 mb-4 flex items-center text-xs sm:text-sm font-semibold hover:text-[#003366] transition-colors">
              <ArrowLeft size={16} className="mr-1" /> Back
            </button>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#003366] mb-2">Assay Capture</h2>
            <p className="text-slate-500 mb-6 sm:mb-8 text-xs sm:text-sm">Capture or upload the assay strip for AI analysis.</p>
            
            <input type="file" ref={fileUploadRef} className="hidden" accept="image/*" onChange={handleImageChange} />
            <input type="file" ref={cameraCaptureRef} className="hidden" accept="image/*" capture="environment" onChange={handleImageChange} />

            {!preview ? (
              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8 w-full">
                <button onClick={() => cameraCaptureRef.current?.click()} className="w-full bg-[#003366]/5 border-2 border-[#003366]/20 hover:border-[#003366] text-[#003366] rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center transition-all group">
                  <Camera size={36} className="mb-3 sm:mb-4 text-[#003366]/70 group-hover:text-[#003366] group-hover:scale-110 transition-all" />
                  <span className="font-bold text-sm sm:text-base">Open Camera</span>
                  <span className="text-[10px] text-[#003366]/60 mt-1 sm:mt-2 uppercase tracking-wider">Take Photo</span>
                </button>
                <button onClick={() => fileUploadRef.current?.click()} className="w-full bg-slate-50 border-2 border-slate-200 hover:border-slate-400 text-slate-600 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center transition-all group">
                  <UploadCloud size={36} className="mb-3 sm:mb-4 text-slate-400 group-hover:text-slate-600 group-hover:scale-110 transition-all" />
                  <span className="font-bold text-sm sm:text-base">Upload File</span>
                  <span className="text-[10px] text-slate-400 mt-1 sm:mt-2 uppercase tracking-wider">From Gallery</span>
                </button>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border-2 border-[#003366] bg-slate-900 shadow-inner group mb-6 sm:mb-8 w-full">
                <img src={preview} alt="Assay Preview" className="w-full h-40 sm:h-48 object-contain opacity-90 bg-black/50" />
                <div className="absolute inset-0 bg-[#003366]/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                  <p className="text-white font-bold mb-3 sm:mb-4 text-sm sm:text-base">Ready for Analysis</p>
                  <button onClick={clearImage} className="bg-white text-[#003366] px-4 py-2 sm:px-5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm shadow-lg hover:scale-105 transition-transform">Retake Image</button>
                </div>
              </div>
            )}

            <button onClick={handleSubmit} disabled={!imageFile || loading} className="w-full bg-[#FFCC33] text-[#003366] font-extrabold py-3.5 sm:py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#e6b800] transition-all disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 shadow-[0_10px_20px_rgba(255,204,51,0.2)] active:scale-[0.98] text-sm sm:text-base">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Processing AI Analysis...</> : <>Run Diagnostics <Activity size={18} /></>}
            </button>
          </motion.div>
        )}

        {step === 3 && result && (
          <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
            
            {/* VISIBLE DASHBOARD (Responsive) */}
            <div className="p-5 sm:p-6 md:p-8 bg-white border-2 border-[#003366]/10 rounded-2xl mb-5 sm:mb-6 relative overflow-hidden w-full">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-6 sm:mb-8 border-b-2 border-slate-100 pb-4 w-full">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#003366] mb-1">Assay Report</h3>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">{result.date}</span>
                </div>
                <div className="text-left sm:text-right">
                  <span className="bg-[#FFCC33]/20 text-[#003366] px-2 sm:px-3 py-1 rounded-md text-[10px] sm:text-xs font-bold border border-[#FFCC33]/50 inline-block mb-1">Verified</span>
                  <p className="text-[10px] sm:text-xs font-medium text-slate-500 font-mono block">{result.testId}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 w-full">
                <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-100 w-full">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Prothrombin Time</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-3xl sm:text-4xl font-black text-[#003366]">{result.ptinr_value}</p>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400">INR</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-100 w-full">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Hematocrit</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-3xl sm:text-4xl font-black text-[#003366]">{result.hct_value}</p>
                    <p className="text-lg sm:text-xl font-bold text-slate-400">%</p>
                  </div>
                </div>
              </div>

              {/* DYNAMIC INTEGRATED SCALE IN UI */}
              {renderScale(result.ptinr_value, formData.on_warfarin, formData.mechanical_mitral_valve)}

              <div className="space-y-3 sm:space-y-4 w-full">
                <div className={`p-3 sm:p-4 rounded-xl border-l-4 w-full ${result.ptinr_diagnosis === "Normal" ? "bg-emerald-50 border-emerald-500" : "bg-[#800000]/5 border-[#800000]"}`}>
                  <p className="font-bold mb-1 text-[10px] uppercase tracking-wider text-slate-500">PT/INR Indication</p>
                  <p className={`font-bold text-xs sm:text-sm ${result.ptinr_diagnosis === "Normal" ? "text-emerald-700" : "text-[#800000]"}`}>{result.ptinr_diagnosis}</p>
                </div>
                <div className={`p-3 sm:p-4 rounded-xl border-l-4 w-full ${result.hct_diagnosis?.includes("Normal") ? "bg-emerald-50 border-emerald-500" : "bg-amber-50 border-amber-500"}`}>
                  <p className="font-bold mb-1 text-[10px] uppercase tracking-wider text-slate-500">HCT Indication</p>
                  <p className={`font-bold text-xs sm:text-sm ${result.hct_diagnosis?.includes("Normal") ? "text-emerald-700" : "text-amber-700"}`}>{result.hct_diagnosis}</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button onClick={() => { setStep(1); clearImage(); setResult(null); }} className="w-full sm:flex-1 bg-white border-2 border-[#003366] text-[#003366] font-bold py-3 sm:py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors text-sm sm:text-base">
                New Test
              </button>
              <button onClick={downloadPDF} className="w-full sm:flex-1 bg-[#003366] text-white font-bold py-3 sm:py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#002244] transition-colors shadow-lg text-sm sm:text-base">
                Download PDF <Download size={16} />
              </button>
            </div>

            {/* ================= HIDDEN DESKTOP PRINT TEMPLATE ================= */}
            <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none">
              <div id="ptinr-pdf-template" className="w-[800px] p-12 bg-white relative">
                {/* Brand Graphic Background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#003366]/5 rounded-full blur-3xl -z-10 translate-x-1/4 -translate-y-1/4"></div>
                
                {/* Header (Strict Flex Row) */}
                <div className="flex flex-row justify-between items-end mb-10 border-b-2 border-slate-100 pb-6 w-full">
                  <div>
                    <h3 className="text-4xl font-black text-[#003366] mb-2">Assay Report</h3>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{result.date}</span>
                  </div>
                  <div className="text-right">
                    <span className="bg-[#FFCC33]/20 text-[#003366] px-4 py-2 rounded-lg text-sm font-bold border border-[#FFCC33]/50 inline-block mb-2">Verified Diagnosis</span>
                    <p className="text-sm font-medium text-slate-500 font-mono block">{result.testId}</p>
                  </div>
                </div>
                
                {/* Metrics (Strict Grid Cols 2) */}
                <div className="grid grid-cols-2 gap-6 mb-4 w-full">
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 w-full">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Prothrombin Time</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-5xl font-black text-[#003366]">{result.ptinr_value}</p>
                      <p className="text-sm font-bold text-slate-400">INR</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 w-full">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Hematocrit</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-5xl font-black text-[#003366]">{result.hct_value}</p>
                      <p className="text-xl font-bold text-slate-400">%</p>
                    </div>
                  </div>
                </div>

                {/* DYNAMIC INTEGRATED SCALE IN PDF TEMPLATE */}
                {renderScale(result.ptinr_value, formData.on_warfarin, formData.mechanical_mitral_valve)}

                {/* Diagnoses */}
                <div className="space-y-6 mt-6 w-full">
                  <div className={`p-6 rounded-xl border-l-4 w-full ${result.ptinr_diagnosis === "Normal" ? "bg-emerald-50 border-emerald-500" : "bg-[#800000]/5 border-[#800000]"}`}>
                    <p className="font-bold mb-2 text-xs uppercase tracking-wider text-slate-500">PT/INR Indication</p>
                    <p className={`font-bold text-lg ${result.ptinr_diagnosis === "Normal" ? "text-emerald-700" : "text-[#800000]"}`}>{result.ptinr_diagnosis}</p>
                  </div>
                  <div className={`p-6 rounded-xl border-l-4 w-full ${result.hct_diagnosis?.includes("Normal") ? "bg-emerald-50 border-emerald-500" : "bg-amber-50 border-amber-500"}`}>
                    <p className="font-bold mb-2 text-xs uppercase tracking-wider text-slate-500">HCT Indication</p>
                    <p className={`font-bold text-lg ${result.hct_diagnosis?.includes("Normal") ? "text-emerald-700" : "text-amber-700"}`}>{result.hct_diagnosis}</p>
                  </div>
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}