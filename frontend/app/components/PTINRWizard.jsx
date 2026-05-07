"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Download, UploadCloud, Loader2 } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";


export default function PTINRWizard() {
  const { addTestToHistory } = useAppContext();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  // State matching exactly what FastAPI expects
  const [formData, setFormData] = useState({
    gender: "",
    on_warfarin: "",
    mechanical_mitral_valve: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleNext = () => setStep(step + 1);

  const handleSubmit = async () => {
    setLoading(true);
    
    // 1. Prepare FormData exactly as FastAPI expects
    const payload = new FormData();
    payload.append("file", imageFile);
    payload.append("gender", formData.gender);
    payload.append("on_warfarin", formData.on_warfarin);
    payload.append("mechanical_mitral_valve", formData.mechanical_mitral_valve);

    try {
      // 2. Call your actual Python backend
      const response = await fetch("http://127.0.0.1:8000/api/diagnose", {
        method: "POST",
        body: payload,
      });

      if (!response.ok) throw new Error("Diagnostic analysis failed");
      
      const data = await response.json();
      
      // 3. Format result and save to history
      const finalResult = {
        testId: `TST-${Math.floor(Math.random() * 10000)}`,
        date: new Date().toLocaleDateString(),
        ...data // Spreads hct_value, hct_diagnosis, ptinr_value, ptinr_diagnosis
      };

      setResult(finalResult);
      addTestToHistory(finalResult);
      setStep(3); // Move to results view
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

      // Use html-to-image which natively supports Tailwind v4 colors
      const dataUrl = await toPng(input, { 
        backgroundColor: '#ffffff',
        pixelRatio: 2 // High resolution
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      // Calculate height to maintain aspect ratio
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Diagnostic_Result_${result.testId}.pdf`);
      
    } catch (error) {
      console.error("PDF Generation Error: ", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };
  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
      <AnimatePresence mode="wait">
        
        {/* STEP 1: Patient Data */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Patient Details</h2>
            <p className="text-slate-500 mb-6">Enter clinical context for accurate AI analysis.</p>
            
            <div className="space-y-4 mb-8">
              <select className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-blue-500 transition-colors"
                value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>

              <select className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-blue-500 transition-colors"
                value={formData.on_warfarin} onChange={(e) => setFormData({...formData, on_warfarin: e.target.value})}>
                <option value="">Currently on Warfarin?</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>

              <select className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-blue-500 transition-colors"
                value={formData.mechanical_mitral_valve} onChange={(e) => setFormData({...formData, mechanical_mitral_valve: e.target.value})}>
                <option value="">Mechanical Mitral Valve?</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <button 
              onClick={handleNext} 
              disabled={!formData.gender || !formData.on_warfarin || !formData.mechanical_mitral_valve} 
              className="w-full bg-slate-900 text-white py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors disabled:opacity-50">
              Continue <ArrowRight size={20} />
            </button>
          </motion.div>
        )}

        {/* STEP 2: Image Upload */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Upload Assay Image</h2>
            <p className="text-slate-500 mb-6">Upload the image for computer vision analysis.</p>
            
            <div 
              className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer mb-8 transition-colors ${imageFile ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:border-slate-400'}`}
              onClick={() => fileInputRef.current.click()}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
              <UploadCloud size={40} className={imageFile ? "text-blue-500 mb-4" : "text-slate-400 mb-4"} />
              <p className="text-slate-700 font-medium">{imageFile ? imageFile.name : "Click to select image file"}</p>
            </div>

            <button 
              onClick={handleSubmit} 
              disabled={!imageFile || loading} 
              className="w-full bg-blue-600 text-white py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg shadow-blue-500/30">
              {loading ? <><Loader2 size={20} className="animate-spin" /> Analyzing...</> : <>Run Diagnostics <CheckCircle2 size={20} /></>}
            </button>
          </motion.div>
        )}

        {/* STEP 3: Results & PDF */}
        {step === 3 && result && (
          <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div id="pdf-content" className="p-6 bg-slate-50 rounded-xl mb-6">
              <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
                <h3 className="text-xl font-bold text-slate-900">AI Diagnostic Report</h3>
                <span className="text-sm font-medium text-slate-500">{result.testId}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                  <p className="text-sm font-medium text-slate-500">PT/INR Value</p>
                  <p className="text-3xl font-bold text-slate-900">{result.ptinr_value}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                  <p className="text-sm font-medium text-slate-500">HCT Value</p>
                  <p className="text-3xl font-bold text-slate-900">{result.hct_value}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 text-blue-900">
                  <p className="font-bold mb-1 text-sm uppercase tracking-wider">PT/INR Diagnosis</p>
                  <p className="text-sm">{result.ptinr_diagnosis}</p>
                </div>
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-900">
                  <p className="font-bold mb-1 text-sm uppercase tracking-wider">HCT Diagnosis</p>
                  <p className="text-sm">{result.hct_diagnosis}</p>
                </div>
              </div>
            </div>
            
            <button onClick={downloadPDF} className="w-full bg-slate-900 text-white py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
              Download Full Report <Download size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}