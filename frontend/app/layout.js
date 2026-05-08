import { Inter } from "next/font/google";
import Image from "next/image";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "PromPT | Advanced Diagnostic Analytics",
  description: "AI-powered PTINR and Warfarin Dosage analysis",
};

export default function RootLayout({ children }) {
  return (
    // Added "scroll-smooth" here
    <html lang="en" className="overflow-x-hidden scroll-smooth">
      <body className={`${inter.className} relative min-h-screen bg-slate-50 overflow-x-hidden`}>
        
        {/* ========================================= */}
        {/* BACKGROUND ELEMENTS (MODERN UI)           */}
        {/* ========================================= */}
        
        {/* 1. Subtle Dot Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none"></div>

        {/* 2. Ambient Brand Glowing Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-[#003366] opacity-[0.07] blur-[100px] pointer-events-none"></div>
        <div className="absolute top-[20%] right-[-5%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-[#FFCC33] opacity-[0.08] blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] rounded-full bg-[#800000] opacity-[0.04] blur-[100px] pointer-events-none"></div>

        {/* ========================================= */}
        {/* MAIN LAYOUT CONTENT                       */}
        {/* ========================================= */}
        
        <main className="relative z-10 flex flex-col min-h-screen py-10 px-4 sm:px-6 lg:px-8">
          {/* Added flex layout to guarantee strict center alignment */}
          <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col items-center">
            
            {/* Header / Logo Area */}
            <div className="mb-12 flex flex-col items-center justify-center w-full text-center">
              
              {/* Logo and App Name Container */}
              <div className="flex items-center justify-center gap-4 mb-4">
                {/* Dynamically loads logo.png from the public folder */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 drop-shadow-2xl hover:scale-105 transition-transform duration-300">
                  <Image 
                    src="/logo.png" 
                    alt="PromPT Logo" 
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                
                {/* Brand Colored Text */}
                <h1 className="text-5xl sm:text-6xl font-black tracking-tighter text-[#00448C]">
                  Prom<span className="text-[#0763C4]">PT</span>
                </h1>
              </div>
              
              {/* Glassmorphism Subtitle Pill */}
              <div className="relative inline-block group">
                {/* Glowing border effect */}
                <span className="absolute -inset-1 bg-gradient-to-r from-[#003366]/20 via-[#FFCC33]/30 to-[#800000]/20 blur-md rounded-full opacity-70 group-hover:opacity-100 transition duration-500"></span>
                <p className="relative text-xs sm:text-sm text-[#003366] font-extrabold uppercase tracking-[0.2em] px-6 py-2 border border-white/40 bg-white/70 backdrop-blur-md rounded-full shadow-sm">
                  Advanced Diagnostic Analytics Platform
                </p>
              </div>

            </div>

            {/* Page Content (Children) */}
            <div className="w-full flex-1">
              {children}
            </div>

          </div>
        </main>

      </body>
    </html>
  );
}