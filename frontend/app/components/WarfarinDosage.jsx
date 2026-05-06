"use client";

export default function WarfarinDosage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Patient & Clinical Inputs */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
            <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mr-3">1</span>
            Patient & Clinical Inputs
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {[
              { label: "Age", type: "number", defaultValue: 78 },
              { label: "Weight (kg)", type: "number", defaultValue: 68 },
              { label: "Height (cm)", type: "number", defaultValue: 156 },
              { label: "Albumin (g/dL)", type: "number", defaultValue: 3.8, step: "0.1" },
              { label: "Haematocrit %", type: "number", defaultValue: 35 },
              { label: "Baseline INR", type: "number", defaultValue: 2, step: "0.1" },
              { label: "Current INR", type: "number", defaultValue: 1.8, step: "0.1" },
            ].map((input, idx) => (
              <div key={idx}>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{input.label}</label>
                <input 
                  type={input.type} 
                  defaultValue={input.defaultValue} 
                  step={input.step}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                />
              </div>
            ))}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Race</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                <option>Asian</option>
                <option>White</option>
                <option>Black</option>
                <option>Mixed</option>
                <option>Unknown</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Indication</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                <option>AF</option>
                <option>DVT</option>
                <option>PE</option>
                <option>VTE</option>
                <option>MechAortic</option>
                <option>MechMitral</option>
                <option>Other</option>
              </select>
            </div>

            <div className="col-span-1 md:col-span-2 flex space-x-6 pt-2">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">Liver Disease</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">High Bleeding Risk</span>
              </label>
            </div>
          </div>
        </div>

        {/* Genetics, Drugs & Maintenance (Right Column) */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <span className="w-7 h-7 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center mr-3 text-sm">2</span>
              Genetics & Drugs
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">CYP2C9</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none">
                    <option>*1/*1</option>
                    <option>*1/*2</option>
                    <option>*1/*3</option>
                    <option>*2/*2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">VKORC1</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none">
                    <option>GG</option>
                    <option>GA</option>
                    <option>AA</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Interacting Drugs (Select multiple)</label>
                <select multiple className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 h-28 focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none text-sm">
                  <option>Amiodarone</option>
                  <option>Fluconazole</option>
                  <option>Itraconazole</option>
                  <option>TMP-SMX</option>
                  <option>Rifampin</option>
                  <option>Metronidazole</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 shadow-xl text-white">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center">
              <span className="w-7 h-7 bg-white/20 text-white rounded-lg flex items-center justify-center mr-3 text-sm">3</span>
              Maintenance
            </h2>
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 text-indigo-500 rounded border-slate-600 bg-slate-800 focus:ring-indigo-500 focus:ring-offset-slate-900" />
                <span className="text-sm font-medium text-slate-300">Currently on Warfarin?</span>
              </label>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Last Week Total Dose (mg)</label>
                <input type="number" disabled className="w-full bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-4 py-2 opacity-50 cursor-not-allowed outline-none" placeholder="0" />
              </div>
              <button className="w-full mt-2 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-bold py-3 rounded-xl shadow-lg transition-all transform active:scale-95">
                Compute Dose
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}