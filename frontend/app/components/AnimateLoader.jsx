"use client";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useAppContext } from "../context/AppContext";

export default function AnimateLoader() {
  const { loading } = useAppContext();

  // Variants for staggered text reveal (adjusted for 3 seconds)
  const container = { 
    hidden: { opacity: 0 }, 
    show: { 
      opacity: 1, 
      transition: { staggerChildren: 0.15, delayChildren: 0.5 } 
    }
  };
  
  const item = { 
    hidden: { opacity: 0, y: 20 }, 
    show: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } }
  };

  const logoVariant = {
    hidden: { opacity: 0, scale: 0.8, filter: "blur(10px)" },
    show: { 
      opacity: 1, 
      scale: 1, 
      filter: "blur(0px)", 
      transition: { duration: 1.5, ease: "easeOut" } 
    }
  };

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(10px)" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950"
        >
          <div className="flex flex-col items-center justify-center">
            
            <motion.div 
              variants={container} 
              initial="hidden" 
              animate="show" 
              // Changed to flex-col for mobile, md:flex-row for larger screens
              className="flex flex-col md:flex-row items-center gap-6"
            >
              {/* Logo Area with Circular Drawing Animation */}
              <div className="relative flex items-center justify-center w-24 h-24 md:w-28 md:h-28">
                
                {/* 3-Second Animated Outer Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Subtle background track */}
                  <circle cx="50" cy="50" r="48" fill="none" stroke="#1e293b" strokeWidth="2" />
                  {/* Glowing progress ring */}
                  <motion.circle
                    cx="50" cy="50" r="48" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 3, ease: "easeInOut" }}
                    style={{ filter: "drop-shadow(0 0 8px rgba(59,130,246,0.6))" }}
                  />
                </svg>

                {/* Logo Image Reveal */}
                <motion.div variants={logoVariant} className="relative w-16 h-16 md:w-20 md:h-20">
                  <Image 
                    src="/logo.png" 
                    alt="promPT Logo" 
                    fill 
                    className="object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                    priority
                  />
                </motion.div>
              </div>

              {/* Text Reveal: promPT */}
              <div className="flex text-5xl md:text-6xl tracking-tight">
                <div className="flex font-light text-slate-100 overflow-hidden">
                  {["p", "r", "o", "m"].map((letter, i) => (
                    <motion.span key={`prom-${i}`} variants={item} className="inline-block">
                      {letter}
                    </motion.span>
                  ))}
                </div>
                <div className="flex font-bold text-blue-500 overflow-hidden ml-1">
                  {["P", "T"].map((letter, i) => (
                    <motion.span key={`pt-${i}`} variants={item} className="inline-block">
                      {letter}
                    </motion.span>
                  ))}
                </div>
              </div>
            </motion.div>
            
            {/* Bottom EKG Pulse Animation Replacing the Loading Bar */}
            <motion.div 
              className="absolute bottom-16 flex flex-col items-center justify-center gap-2"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 1, duration: 1 }}
            >
              {/* EKG SVG Animation */}
              <div className="w-48 h-16 relative flex items-center justify-center">
                <svg viewBox="0 0 200 50" className="w-full h-full overflow-visible">
                  <motion.path
                    d="M 0 25 L 40 25 L 50 10 L 60 45 L 70 25 L 120 25 L 130 5 L 140 35 L 150 25 L 200 25"
                    fill="transparent"
                    strokeWidth="3"
                    stroke="#3b82f6" // Tailwind blue-500
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    style={{ filter: "drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))" }}
                  />
                </svg>
              </div>

              <span className="text-slate-400 font-medium tracking-[0.2em] text-xs uppercase">
                Monitoring Vitals...
              </span>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}