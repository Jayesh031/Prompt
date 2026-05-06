"use client";
import { useState, useEffect } from "react";
import PTINRFlow from "./components/PTINRFlow";
import WarfarinFlow from "./components/WarfarinFlow";

export default function AppShell() {
  const [activeTab, setActiveTab] = useState("ptinr");
  const [isInitializing, setIsInitializing] = useState(true);

  // Simulate the elegant splash screen loading
  useEffect(() => {
    const timer = setTimeout(() => setIsInitializing(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-2xl animate-pulse">
          {/* Placeholder for your Toucan Logo */}
          <span className="text-white text-3xl font-black">PT</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Prom<span className="text-indigo-600">PT</span></h1>
        <p className="text-sm text-slate-500 mt-2 mb-10">Precision Medical Patient Terminal</p>
        
        <div className="w-64 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-600 rounded-full animate-[loading_2s_ease-in-out_forwards]"></div>
        </div>
        <p className="text-xs font-bold text-slate-400 mt-4 tracking-widest uppercase">Initializing System...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20"> {/* pb-20 gives room for the bottom nav */}
      
      {/* Top Header */}
      <header className="bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-2">
           <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">PT</div>
           <span className="font-bold text-indigo-900 text-lg tracking-tight">PromPT</span>
        </div>
        <div className="w-8 h-8 bg-slate-200 rounded-full overflow-hidden border-2 border-indigo-100">
           {/* Doctor/User Avatar Placeholder */}
           <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4 max-w-lg mx-auto">
        {activeTab === "history" && <div className="text-center p-10 text-slate-500">Patient History Module (Coming Soon)</div>}
        {activeTab === "ptinr" && <PTINRFlow />}
        {activeTab === "warfarin" && <WarfarinFlow />}
      </main>

      {/* Modern Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-slate-200 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-4">
          <NavItem icon="Clock" label="History" isActive={activeTab === "history"} onClick={() => setActiveTab("history")} />
          <NavItem icon="Droplet" label="PT/INR" isActive={activeTab === "ptinr"} onClick={() => setActiveTab("ptinr")} />
          <NavItem icon="Pills" label="Warfarin" isActive={activeTab === "warfarin"} onClick={() => setActiveTab("warfarin")} />
        </div>
      </nav>
    </div>
  );
}

// Simple Nav Item Component
function NavItem({ icon, label, isActive, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}>
      <div className={`p-1.5 rounded-xl ${isActive ? "bg-indigo-50" : "bg-transparent"}`}>
        {/* Simple placeholder icons - in a real app, use heroicons or lucide-react */}
        {icon === "Clock" && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
        {icon === "Droplet" && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>}
        {icon === "Pills" && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>}
      </div>
      <span className="text-[10px] font-bold tracking-wide">{label}</span>
    </button>
  );
}