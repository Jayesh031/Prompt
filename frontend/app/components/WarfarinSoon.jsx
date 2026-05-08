"use client";
import { useState } from "react";
import { RotateCcw, Download } from "lucide-react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const defaultFormData = {
  age: 78,
  weight: 68,
  height: 156,
  albumin: 3.8,
  hct: 35,
  baseline_inr: 2.0,
  current_inr: 1.8,
  race: "Asian",
  indication: "AF",
  liver_disease: false,
  high_bleeding_risk: false,
  cyp2c9: "*1/*1",
  vkorc1: "GG",
  interacting_drugs: [],
  on_warfarin: false,
  last_week_dose: 0,
};

export default function WarfarinSoon() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(defaultFormData);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
  };

  const handleDrugChange = (e) => {
    const options = e.target.options;
    const selectedDrugs = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) selectedDrugs.push(options[i].value);
    }
    setFormData((prev) => ({ ...prev, interacting_drugs: selectedDrugs }));
  };

  const handleReset = () => {
    setFormData(defaultFormData);
    setResults(null);
    setError(null);
  };

  const handleComputeDose = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/warfarin-dose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to compute dosage");
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      // Targets the hidden print template instead of the responsive UI
      const input = document.getElementById("warfarin-pdf-template");
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
      pdf.save(`PromPT_Warfarin_Dosage_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error("PDF Generation Error: ", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const getTabletBreakdown = (dose) => {
    const strengths = [10, 7.5, 6, 5, 4, 3, 2.5, 2, 1];
    let remaining = Number(dose);
    let parts = [];
    
    for (let s of strengths) {
      const count = Math.floor((remaining + 0.001) / s);
      if (count > 0) {
        parts.push(`${count} × ${s}mg`);
        remaining -= count * s;
      }
    }
    return parts.length > 0 ? parts.join(" + ") : "0 mg";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12 w-full">
      
      {/* FORM SECTION (No changes here) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 w-full">
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-100 w-full overflow-hidden">
          <h2 className="text-base font-bold text-[#003366] mb-5 border-b border-slate-100 pb-3 flex items-center gap-2">
            <span className="bg-[#003366]/10 text-[#003366] px-2 py-0.5 rounded text-xs">1</span> 
            Patient & Clinical Data
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[
              { label: "Age", name: "age", type: "number" },
              { label: "Weight (kg)", name: "weight", type: "number" },
              { label: "Height (cm)", name: "height", type: "number" },
              { label: "Albumin (g/dL)", name: "albumin", type: "number", step: "0.1" },
              { label: "HCT %", name: "hct", type: "number" },
              { label: "Baseline INR", name: "baseline_inr", type: "number", step: "0.1" },
              { label: "Current INR", name: "current_inr", type: "number", step: "0.1" },
            ].map((input, idx) => (
              <div key={idx}>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{input.label}</label>
                <input type={input.type} name={input.name} value={formData[input.name]} onChange={handleChange} step={input.step} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-1.5 focus:bg-white focus:ring-1 focus:ring-[#003366] focus:border-[#003366] outline-none transition-all" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Race</label>
              <select name="race" value={formData.race} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-1.5 focus:bg-white focus:ring-1 focus:ring-[#003366] outline-none">
                <option>Asian</option><option>White</option><option>Black</option><option>Mixed</option><option>Unknown</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Indication</label>
              <select name="indication" value={formData.indication} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-1.5 focus:bg-white focus:ring-1 focus:ring-[#003366] outline-none">
                <option value="AF">AF</option><option value="DVT">DVT</option><option value="PE">PE</option><option value="VTE">VTE</option><option value="MechAortic">MechAortic</option><option value="MechMitral">MechMitral</option><option value="Other">Other</option>
              </select>
            </div>

            <div className="flex flex-col justify-center space-y-3 sm:space-y-2 pt-4 sm:pl-2">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input type="checkbox" name="liver_disease" checked={formData.liver_disease} onChange={handleChange} className="w-4 h-4 text-[#800000] rounded border-slate-300 focus:ring-[#800000]" />
                <span className="text-xs font-semibold text-slate-700 group-hover:text-[#800000] transition-colors">Liver Disease</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input type="checkbox" name="high_bleeding_risk" checked={formData.high_bleeding_risk} onChange={handleChange} className="w-4 h-4 text-[#800000] rounded border-slate-300 focus:ring-[#800000]" />
                <span className="text-xs font-semibold text-slate-700 group-hover:text-[#800000] transition-colors">High Bleeding Risk</span>
              </label>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-5 lg:space-y-6 w-full">
          <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-100">
            <h2 className="text-base font-bold text-[#003366] mb-4 border-b border-slate-100 pb-3 flex items-center gap-2">
              <span className="bg-[#003366]/10 text-[#003366] px-2 py-0.5 rounded text-xs">2</span> Genetics & Drugs
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">CYP2C9</label>
                <select name="cyp2c9" value={formData.cyp2c9} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:bg-white focus:ring-1 focus:ring-[#003366] outline-none"><option>*1/*1</option><option>*1/*2</option><option>*1/*3</option><option>*2/*2</option><option>*2/*3</option><option>*3/*3</option></select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">VKORC1</label>
                <select name="vkorc1" value={formData.vkorc1} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:bg-white focus:ring-1 focus:ring-[#003366] outline-none"><option>GG</option><option>GA</option><option>AA</option></select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between">
                <span>Interacting Drugs</span> <span className="hidden sm:inline text-slate-400 normal-case font-normal">(Cmd/Ctrl + Click)</span>
              </label>
              <select multiple value={formData.interacting_drugs} onChange={handleDrugChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 h-24 text-xs focus:bg-white focus:ring-1 focus:ring-[#003366] outline-none">
                <option value="Amiodarone">Amiodarone</option><option value="Fluconazole">Fluconazole</option><option value="Itraconazole">Itraconazole</option><option value="TMP-SMX">TMP-SMX</option><option value="Rifampin">Rifampin</option><option value="Metronidazole">Metronidazole</option>
              </select>
            </div>
          </div>

          <div className="bg-[#003366] rounded-2xl p-5 md:p-6 shadow-md text-white border border-[#002244]">
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" name="on_warfarin" checked={formData.on_warfarin} onChange={handleChange} className="w-5 h-5 sm:w-4 sm:h-4 text-[#FFCC33] rounded border-white/20 bg-white/10 focus:ring-[#FFCC33]" />
                <span className="text-sm font-semibold">Currently on Maintenance?</span>
              </label>
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${formData.on_warfarin ? 'text-blue-200' : 'text-blue-400/50'}`}>Last Week Total Dose (mg)</label>
                <input type="number" name="last_week_dose" value={formData.last_week_dose} onChange={handleChange} disabled={!formData.on_warfarin} className={`w-full bg-[#002244] border border-[#004488] text-white rounded-lg px-3 py-2 outline-none text-sm transition-all ${!formData.on_warfarin && 'opacity-50 cursor-not-allowed'}`} />
              </div>
              {error && <div className="text-xs text-[#FFCC33] bg-[#800000]/50 p-2 rounded border border-[#800000] mt-2">{error}</div>}

              <div className="flex flex-col-reverse sm:flex-row gap-3 mt-4">
                <button onClick={handleReset} className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white p-3 sm:p-2.5 rounded-xl sm:rounded-lg border border-white/20 transition-all flex items-center justify-center gap-2" title="Reset Form">
                  <RotateCcw size={18} />
                  <span className="sm:hidden text-sm font-bold">Reset Form</span>
                </button>
                <button onClick={handleComputeDose} disabled={loading} className="w-full flex-1 bg-[#FFCC33] hover:bg-[#e6b800] disabled:bg-slate-500 text-[#003366] font-bold py-3 sm:py-2.5 rounded-xl sm:rounded-lg shadow-sm transition-all transform active:scale-[0.98] text-sm flex items-center justify-center gap-2">
                  {loading ? "Computing Protocol..." : "Compute Dosing Protocol"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {results && (
        <>
          {/* VISIBLE DASHBOARD (Responsive) - Notice the ID is removed from here */}
          <div className="mt-6 bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 w-full">
            <div className="bg-[#003366] px-5 py-4 sm:px-6 sm:py-4 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="min-w-[8px] h-2 rounded-full bg-[#FFCC33]"></span>
                  Computed Dosing Regimen
                </h2>
                <p className="text-xs text-blue-200 font-medium ml-4">{results.dose_source_used}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="flex-1 sm:flex-none bg-[#002244] border border-[#004488] px-3 py-2 sm:py-1.5 rounded-md flex items-center justify-center gap-2">
                  <span className="text-xs text-blue-200 uppercase tracking-wider font-bold">Target INR:</span>
                  <span className="text-sm text-[#FFCC33] font-bold">{results.target_inr_range}</span>
                </div>
                <button onClick={downloadPDF} className="flex-1 sm:flex-none bg-[#FFCC33] hover:bg-[#e6b800] text-[#003366] px-3 py-2 sm:py-1.5 rounded-md flex items-center justify-center gap-2 text-xs font-bold transition-colors shadow-sm">
                  <Download size={14} /> Download PDF
                </button>
              </div>
            </div>

            <div className="p-5 md:p-6 w-full">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Daily Dose</p><div className="flex items-baseline gap-1"><span className="text-2xl font-black text-slate-800">{results.rounded_daily_dose}</span><span className="text-xs font-bold text-slate-400">mg</span></div></div>
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Weekly Dose</p><div className="flex items-baseline gap-1"><span className="text-2xl font-black text-slate-800">{results.adjusted_weekly_dose}</span><span className="text-xs font-bold text-slate-400">mg</span></div></div>
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 col-span-2 md:col-span-1"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Standard Tablet Suggestion</p><span className="text-sm font-bold text-[#003366] leading-tight">{results.tablet_suggestion}</span></div>
                 <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 col-span-2 md:col-span-1"><p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Next Recheck</p><div className="flex items-baseline gap-1"><span className="text-2xl font-black text-[#800000]">{results.recheck_days}</span><span className="text-xs font-bold text-amber-800">Days</span></div><p className="text-[10px] font-semibold text-amber-700 mt-0.5 leading-tight">{results.recheck_reason}</p></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full">
                <div className="md:col-span-7 w-full">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">Specific 7-Day Plan</h3>
                  <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto w-full">
                    <table className="w-full text-sm text-left min-w-[350px]">
                      <thead className="bg-slate-100 text-[10px] text-slate-500 uppercase"><tr><th className="px-4 py-2.5 font-bold">Day</th><th className="px-4 py-2.5 font-bold">Dose</th><th className="px-4 py-2.5 font-bold">Required Tablets</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {Object.entries(results.day_plan).map(([day, dose]) => (
                          <tr key={day} className="bg-white hover:bg-slate-50 transition-colors"><td className="px-4 py-2.5 font-semibold text-slate-700">{day}</td><td className="px-4 py-2.5 font-bold text-[#003366] whitespace-nowrap">{dose} mg</td><td className="px-4 py-2.5 font-medium text-slate-600 bg-slate-50/50">{getTabletBreakdown(dose)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="md:col-span-5 space-y-3 w-full">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Clinical Directives</h3>
                  {results.action_note && (<div className="bg-sky-50 p-3.5 rounded-lg border border-sky-100 flex items-start gap-2"><p className="text-xs text-sky-900 font-medium leading-relaxed">{results.action_note}</p></div>)}
                  {results.early_inr_note && (<div className="bg-amber-50 p-3.5 rounded-lg border border-amber-200 flex items-start gap-2"><p className="text-xs text-amber-900 font-medium leading-relaxed">{results.early_inr_note}</p></div>)}
                  {results.warnings?.map((warn, i) => (<div key={i} className="bg-red-50 p-3.5 rounded-lg border border-red-200 flex items-start gap-2"><p className="text-xs text-red-900 font-bold leading-relaxed">{warn}</p></div>))}
                </div>
              </div>
            </div>
          </div>

          {/* ================= HIDDEN DESKTOP PRINT TEMPLATE ================= */}
          <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none">
            {/* Hardcoded to 800px width. Strict flex/grid formatting (no sm: or md:) */}
            <div id="warfarin-pdf-template" className="w-[800px] bg-white relative">
              <div className="bg-[#003366] px-8 py-6 text-white flex flex-row justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">Computed Dosing Regimen</h2>
                  <p className="text-sm text-blue-200 font-medium mt-1">{results.dose_source_used}</p>
                </div>
                <div className="bg-[#002244] border border-[#004488] px-4 py-2 rounded-lg flex items-center gap-3">
                  <span className="text-sm text-blue-200 uppercase tracking-wider font-bold">Target INR:</span>
                  <span className="text-xl text-[#FFCC33] font-bold">{results.target_inr_range}</span>
                </div>
              </div>

              <div className="p-8 w-full">
                <div className="grid grid-cols-4 gap-4 mb-10 w-full">
                   <div className="bg-slate-50 p-5 rounded-xl border border-slate-100"><p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Daily Dose</p><div className="flex items-baseline gap-1"><span className="text-3xl font-black text-slate-800">{results.rounded_daily_dose}</span><span className="text-sm font-bold text-slate-400">mg</span></div></div>
                   <div className="bg-slate-50 p-5 rounded-xl border border-slate-100"><p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Weekly Dose</p><div className="flex items-baseline gap-1"><span className="text-3xl font-black text-slate-800">{results.adjusted_weekly_dose}</span><span className="text-sm font-bold text-slate-400">mg</span></div></div>
                   <div className="bg-slate-50 p-5 rounded-xl border border-slate-100"><p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tablet Suggestion</p><span className="text-lg font-bold text-[#003366] leading-tight">{results.tablet_suggestion}</span></div>
                   <div className="bg-amber-50 p-5 rounded-xl border border-amber-100"><p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-2">Next Recheck</p><div className="flex items-baseline gap-1"><span className="text-3xl font-black text-[#800000]">{results.recheck_days}</span><span className="text-sm font-bold text-amber-800">Days</span></div><p className="text-[10px] font-semibold text-amber-700 mt-1 leading-tight">{results.recheck_reason}</p></div>
                </div>

                <div className="grid grid-cols-12 gap-8 w-full">
                  <div className="col-span-7 w-full">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Specific 7-Day Plan</h3>
                    <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden w-full">
                      <table className="w-full text-base text-left">
                        <thead className="bg-slate-100 text-xs text-slate-500 uppercase"><tr><th className="px-5 py-3 font-bold">Day</th><th className="px-5 py-3 font-bold">Dose</th><th className="px-5 py-3 font-bold">Required Tablets</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                          {Object.entries(results.day_plan).map(([day, dose]) => (
                            <tr key={day} className="bg-white"><td className="px-5 py-3 font-semibold text-slate-700">{day}</td><td className="px-5 py-3 font-bold text-[#003366]">{dose} mg</td><td className="px-5 py-3 font-medium text-slate-600 bg-slate-50/50">{getTabletBreakdown(dose)}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="col-span-5 space-y-4 w-full">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Clinical Directives</h3>
                    {results.action_note && (<div className="bg-sky-50 p-4 rounded-lg border border-sky-100"><p className="text-sm text-sky-900 font-medium leading-relaxed">{results.action_note}</p></div>)}
                    {results.early_inr_note && (<div className="bg-amber-50 p-4 rounded-lg border border-amber-200"><p className="text-sm text-amber-900 font-medium leading-relaxed">{results.early_inr_note}</p></div>)}
                    {results.warnings?.map((warn, i) => (<div key={i} className="bg-red-50 p-4 rounded-lg border border-red-200"><p className="text-sm text-red-900 font-bold leading-relaxed">{warn}</p></div>))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}