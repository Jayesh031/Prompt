"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, X, Download } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

export default function HistoryTab() {
  const { history } = useAppContext();
  const [selectedTest, setSelectedTest] = useState(null);
  
const downloadPDF = async () => {
    try {
      const input = document.getElementById("history-pdf-content");
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
      pdf.save(`History_Report_${selectedTest.testId}.pdf`);
      
    } catch (error) {
      console.error("PDF Generation Error: ", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10">
      <h2 className="text-3xl font-bold text-slate-900 mb-6">Session History</h2>
      
      {history.length === 0 ? (
        <div className="p-10 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-500">
          No test history in current session. Run a diagnostic to see it here.
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((test, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
              key={test.testId} 
              onClick={() => setSelectedTest(test)}
              className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{test.testId}</h4>
                  <p className="text-sm text-slate-500">{test.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900">INR: {test.ptinr_value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pop-up Overlay for Test Details */}
      <AnimatePresence>
        {selectedTest && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl relative"
            >
              <button onClick={() => setSelectedTest(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900">
                <X size={24} />
              </button>
              
              <div id="history-pdf-content" className="mt-4 mb-6">
                 <h3 className="text-2xl font-bold text-slate-900 mb-4 border-b pb-4">Report: {selectedTest.testId}</h3>
                 <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-xs text-slate-500">PT/INR</p>
                      <p className="font-bold text-xl text-slate-900">{selectedTest.ptinr_value}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-xs text-slate-500">HCT</p>
                      <p className="font-bold text-xl text-slate-900">{selectedTest.hct_value}</p>
                    </div>
                 </div>
                 <div className="space-y-2 text-sm">
                    <p><strong>PT/INR Note:</strong> {selectedTest.ptinr_diagnosis}</p>
                    <p><strong>HCT Note:</strong> {selectedTest.hct_diagnosis}</p>
                 </div>
              </div>

              <button onClick={downloadPDF} className="w-full bg-blue-600 text-white py-3 rounded-xl flex justify-center gap-2 hover:bg-blue-700">
                Download PDF <Download size={18} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}