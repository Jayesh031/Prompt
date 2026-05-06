import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "PromPT | Advanced Diagnostic Analytics",
  description: "AI-powered PTINR and Warfarin Dosage analysis",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Header / Logo Area */}
            <div className="mb-10 text-center">
              <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 mb-2">
                Prom<span className="text-indigo-600">PT</span>
              </h1>
              <p className="text-slate-500 font-medium">Advanced Diagnostic Analytics Platform</p>
            </div>
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}