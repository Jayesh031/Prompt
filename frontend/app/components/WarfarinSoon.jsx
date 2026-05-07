"use client";
import { Pill, Construction } from "lucide-react";
import { motion } from "framer-motion";

export default function WarfarinSoon() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto px-4">
      <motion.div 
        animate={{ y: [0, -10, 0] }} 
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="w-24 h-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6"
      >
        <Pill size={48} />
      </motion.div>
      <h2 className="text-3xl font-bold text-slate-900 mb-3">Dosage Calculator</h2>
      <p className="text-slate-500 mb-6">We are currently integrating the background calculation models for precise Warfarin dosage recommendations.</p>
      <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-full text-sm font-medium">
        <Construction size={18} /> Coming in the next update
      </div>
    </div>
  );
}