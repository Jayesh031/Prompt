"use client";
import { useState } from "react";

export default function WarfarinFlow() {
  const [step, setStep] = useState(1);

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-8">
           <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">Step {step} of 3</span>
           <div className="flex space-x-1">
             <div className={`w-8 h-1.5 rounded-full ${step >= 1 ? "bg-indigo-600" : "bg-slate-100"}`}></div>
             <div className={`w-8 h-1.5 rounded-full ${step >= 2 ? "bg-indigo-600" : "bg-slate-100"}`}></div>
             <div className={`w-8 h-1.5 rounded-full ${step >= 3 ? "bg-indigo-600" : "bg-slate-100"}`}></div>
           </div>
        </div>

        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-indigo-950 mb-4">Clinical Profile</h2>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Age (Years)</label>
              <input type="number" placeholder="e.g. 65" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Weight (KG)</label>
                <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Height (CM)</label>
                <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none" />
              </div>
            </div>

            <button onClick={() => setStep(2)} className="w-full bg-indigo-900 text-white font-bold py-4 rounded-xl mt-4">Next &rarr;</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <button onClick={() => setStep(1)} className="text-slate-400 mb-2 text-sm font-semibold">&larr; Back</button>
            <h2 className="text-xl font-bold text-indigo-950 mb-4">Biometric & Lab Results</h2>
            {/* Add the biometrics inputs here (INR, HCT, Albumin) */}
            <p className="text-sm text-slate-500">Lab inputs go here...</p>
            <button onClick={() => setStep(3)} className="w-full bg-indigo-900 text-white font-bold py-4 rounded-xl mt-4">Next &rarr;</button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <button onClick={() => setStep(2)} className="text-slate-400 mb-2 text-sm font-semibold">&larr; Back</button>
            <h2 className="text-xl font-bold text-indigo-950 mb-4">Genetics & Pharmacology</h2>
            {/* Add Genetics inputs here */}
            <p className="text-sm text-slate-500">Genetic dropdowns go here...</p>
            <button onClick={() => alert("Compute Dose connected to backend!")} className="w-full bg-indigo-900 text-white font-bold py-4 rounded-xl mt-4">Calculate Dosage</button>
          </div>
        )}
      </div>
    </div>
  );
}