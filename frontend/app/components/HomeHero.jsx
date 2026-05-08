"use client";
import { motion } from "framer-motion";
import Image from "next/image"; // For adding the toucan icon
import { Activity, ShieldCheck, ArrowRight, Droplet, ClipboardList, Target } from "lucide-react";
import { useAppContext } from "../context/AppContext";

export default function HomeHero() {
  const { setActiveTab } = useAppContext();

  // Custom Colors defined (Tailwind custom names suggested: brand-blue-deep, brand-gold, brand-maroon)
  const brandBlueDeep = "#003366"; // Toucan body blue
  const brandGold = "#FFCC33"; // Beak gold
  const brandMaroon = "#800000"; // Beak detail maroon

  return (
    // Replaced standard slate background with custom lighter blue tint for freshness
    <div className="relative min-h-[85vh] flex items-center justify-center w-full bg-white overflow-hidden rounded-3xl border border-slate-100 shadow-sm mt-4">
      
      {/* Subtle Clinical Grid Background, now using brand-blue color */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e0f2fe_1px,transparent_1px),linear-gradient(to_bottom,#e0f2fe_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)] opacity-30"></div>

      <div className="relative max-w-7xl mx-auto px-8 md:px-12 py-16 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center z-10 w-full text-center lg:text-left">
        
        {/* LEFT & CENTER COLUMN: Copy & Main Header (Span 7 to allow a centered-feel with visuals) */}
        <div className="flex flex-col items-center lg:items-start lg:col-span-7">
          
          {/* Mobile-only Website Logo (Visible below md screens) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex md:hidden items-center justify-center"
          >
            <Image src="/logo.png" alt="Toucan Logo" width={128} height={128} className="object-contain" />
          </motion.div>

          {/* Desktop-only Capsule (Visible from md screens and up) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
            className="mb-8 hidden md:inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-blue-100 text-blue-700 text-sm font-semibold tracking-wide shadow-inner"
            style={{ backgroundColor: `${brandBlueDeep}10` }} // 10% opacity blue
          >
            <ShieldCheck size={18} style={{ color: brandBlueDeep }} /> Clinical-Grade Assay Precision
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} 
            className="text-2xl md:text-3xl lg:text-7xl font-extrabold text-slate-950 tracking-tighter mb-8 leading-[1.05]"
          >
            Rapid <span className="text-sky-900">Point-of-Care</span>
            {/* Added a text element using the brand gold color for emphasis */}
            <span style={{ color: brandGold }}> Coagulation</span> Tracking
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} 
            className="text-lg md:text-xl text-slate-600 mb-12 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal"
          >
            Modern, secure analysis workspace for instant Prothrombin Time (PT/INR) and Hematocrit (HCT) assay data. Evaluates and generates diagnostic reports in seconds.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto"
          >
            <button 
              onClick={() => setActiveTab("test")}
              className="px-10 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all text-white shadow-[0_12px_30px_rgba(59,130,246,0.3)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.5)] hover:-translate-y-1"
              style={{ backgroundColor: brandBlueDeep }}
            >
              <Activity size={24} /> Run Diagnostic Assay
            </button>
            <button 
              onClick={() => setActiveTab("history")}
              className="bg-white text-slate-800 border-2 border-slate-200 px-10 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:border-slate-300 hover:bg-slate-50 transition-all"
            >
              <ClipboardList size={24} className="text-slate-500" /> View Past Records
            </button>
          </motion.div>
        </div>

        {/* RIGHT COLUMN: Re-imagined Integrated Console Visual Panel (Span 5) */}
        <div className="hidden lg:flex relative h-full w-full items-center justify-center lg:col-span-5">
          {/* Enhanced dual-tone background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] blur-[150px] rounded-full opacity-15"
            style={{ background: `radial-gradient(ellipse at center, ${brandBlueDeep} 0%, ${brandGold} 100%)` }}
          ></div>

          {/* SINGLE INTEGRATED CONSOLE PANEL */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 1 }}
            className="relative z-20 bg-white/70 backdrop-blur-3xl border border-slate-100 p-8 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.06)] w-full max-w-lg"
          >
            {/* Console Header */}
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
              <h3 className="font-extrabold text-slate-900 text-2xl flex items-center gap-3">
                <Target size={28} style={{ color: brandBlueDeep }} /> Assay Analysis Console
              </h3>
              <Image src="/logo.png" alt="Toucan Logo" width={32} height={32} className="object-contain" />
            </div>

            {/* Metric Panel 1: PT/INR Reading */}
            <div className="mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3.5 bg-sky-100/60 rounded-xl">
                  <Droplet size={28} style={{ color: brandBlueDeep }} />
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full shadow-sm">Target: Normal</span>
              </div>
              <div className="flex items-end gap-1.5 mb-2">
                <p className="text-6xl font-extrabold text-slate-950">2.4</p>
                <p className="text-xl font-medium text-slate-500 mb-2">/ PT/INR</p>
              </div>
              
              {/* Gold-to-Maroon Gradient Progress Bar */}
              <div className="mt-4 w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${brandBlueDeep}15` }}>
                <div className="h-full rounded-full w-[70%] transition-all"
                    style={{ background: `linear-gradient(to right, ${brandMaroon}, ${brandGold})` }}>
                </div>
              </div>
            </div>

            {/* Metric Panel 2: HCT Reading */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-semibold text-slate-700">Hematocrit (HCT) Level</h4>
                <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${brandBlueDeep}10` }}>
                    <Activity size={20} style={{ color: brandBlueDeep }} />
                </div>
              </div>
              <div className="flex items-end gap-3 mb-2">
                <p className="text-7xl font-extrabold text-slate-950">42</p>
                <p className="text-4xl text-slate-400 font-bold mb-2">%</p>
              </div>
              {/* Deep Blue Progress Bar */}
              <div className="mt-4 w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${brandBlueDeep}15` }}>
                  <div className="h-full rounded-full w-[60%]" style={{ backgroundColor: brandBlueDeep }}></div>
              </div>
            </div>

            {/* Subtle Diagnostic Icon/Detail in bottom corner */}
            <div className="absolute -bottom-10 -right-10 p-5 bg-white rounded-full border-2 border-slate-100 shadow-xl">
                <ClipboardList size={32} className="text-slate-300"/>
            </div>
          </motion.div>

          {/* Abstract EKG visual connector path - Now Toucan Deep Blue */}
          <svg className="absolute w-full h-full z-0 opacity-15" viewBox="0 0 400 400">
            <path d="M 50 300 C 100 300, 150 100, 250 100 S 300 300, 350 300" fill="none" stroke={brandBlueDeep} strokeWidth="3" strokeDasharray="8 8" strokeLinecap="round"/>
          </svg>
        </div>
        
      </div>
    </div>
  );
}