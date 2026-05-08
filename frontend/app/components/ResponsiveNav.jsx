"use client";
import { Home, Activity, ClipboardList, Pill } from "lucide-react";
import Image from "next/image";
import { useAppContext } from "../context/AppContext";

export default function ResponsiveNav() {
  const { activeTab, setActiveTab } = useAppContext();

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "test", label: "PT/INR Test", icon: Activity },
    { id: "history", label: "History", icon: ClipboardList },
    { id: "warfarin", label: "Warfarin", icon: Pill },
  ];

  return (
    <>
      {/* Desktop Sidebar (Premium Dark Theme) */}
      <nav className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 bg-slate-950 border-r border-slate-800 p-6 z-40">
        
        {/* Brand & Logo Area */}
        <div className="flex items-center gap-3 mb-12 mt-2">
          <div className="relative w-20 h-20">
            {/* Pulls the same logo you uploaded for the loading screen */}
            <Image src="/logo.png" alt="promPT Logo" fill className="object-contain" priority />
          </div>
          <div className="text-2xl tracking-tight">
            <span className="font-light text-slate-100">Prom</span>
            <span className="font-bold text-[#0763C4]">PT</span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col gap-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 font-medium ${
                activeTab === item.id 
                  ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.25)]" 
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
              }`}
            >
              <item.icon size={20} className={activeTab === item.id ? "text-white" : "text-slate-500"} />
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile Bottom Bar (Premium Dark Theme) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-950 border-t border-slate-800 px-6 py-3 flex justify-between items-center z-40 pb-safe">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1.5 p-2 transition-all duration-300 ${
              activeTab === item.id ? "text-blue-500 scale-110" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <item.icon size={22} />
            <span className="text-[10px] font-semibold tracking-wider">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}