import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  CheckCircle2, 
  CalendarDays, 
  TrendingUp, 
  Sparkles,
  HelpCircle
} from 'lucide-react';

const Reports = () => {
  const { user } = useAuth();
  
  // Selected month for PDF statement exports YYYY-MM
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const handleExportCSV = () => {
    // Direct stream download using authorization token in query or standard relative window navigation
    // Since our backend secures this route with protect, we can fetch it with axios or use window.open by providing authorization token.
    // To ensure standard authentication headers are validated, we can make an axios call with responseType: 'blob' and download it programmatically! This is incredibly robust, securely maintaining authorization tokens!
    const triggerCSVDownload = async () => {
      try {
        const api = (await import('../utils/api')).default;
        const res = await api.get('/api/reports/csv', { responseType: 'blob' });
        
        const blob = new Blob([res.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `transactions_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        alert(`CSV Export failed: ${err.message}`);
      }
    };
    triggerCSVDownload();
  };

  const handleExportPDF = () => {
    const triggerPDFDownload = async () => {
      try {
        const api = (await import('../utils/api')).default;
        const res = await api.get(`/api/reports/pdf?month=${month}`, { responseType: 'blob' });
        
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `financial_statement_${month}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        alert(`PDF Export failed: ${err.message}`);
      }
    };
    triggerPDFDownload();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Financial Statements & Exports</h2>
        <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Generate print-ready auditor statements and download raw spreadsheet histories</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CSV Spreadsheets Card */}
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-md">
              <FileSpreadsheet className="h-5.5 w-5.5 text-white" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-200">Raw Ledger Spreadsheet (CSV)</h3>
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                Download a complete chronological spreadsheet containing all recorded income, expense, and imported transactions. Perfect for importing into Microsoft Excel, Google Sheets, or tax auditing calculators.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-0.5">Export Inclusions:</h4>
              <div className="space-y-1.5 text-[11px] font-semibold text-slate-400">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Complete multi-month transaction titles</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Precise cash flow amounts & indicators</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Auto-categorized folder markers</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Date logs & manually versus imported tags</div>
              </div>
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            className="w-full py-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 hover:text-white text-slate-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 uppercase tracking-wider"
          >
            <Download className="h-4 w-4" /> Download Raw CSV File
          </button>
        </div>

        {/* PDF Audited Statements Card */}
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white shadow-md glow-cyan/10">
              <FileText className="h-5.5 w-5.5 text-white" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-200">Print-Ready Monthly Statement (PDF)</h3>
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                Generate a highly stylized, professional balance sheet statement. Includes your calculated Financial Health Score, consolidated income and expense balances, category budget compliance ratios, and detailed transactional ledgers.
              </p>
            </div>

            {/* Selector month */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-0.5">Select Target Month</label>
              <div className="relative max-w-xs">
                <CalendarDays className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500 animate-pulse" />
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950/80 text-xs font-bold text-slate-200 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleExportPDF}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-slate-950 font-bold text-xs hover:brightness-110 shadow-md glow-cyan/15 transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider"
          >
            <Download className="h-4 w-4" /> Synthesize PDF Statement
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
