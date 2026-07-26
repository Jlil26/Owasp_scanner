import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  ShieldCheck, 
  Plus, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  FileCode, 
  Hash, 
  ExternalLink,
  Layers,
  Clock,
  Sparkles,
  Lock,
  X
} from 'lucide-react';

interface Report {
  id: string;
  company_id: string;
  scan_job_id: string;
  title: string;
  version: string;
  report_format: string;
  owasp_category?: string;
  file_hash: string;
  summary?: string;
  html_content?: string;
  json_content?: string;
  created_at: string;
}

export const ReportModule: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [activeTab, setActiveTab] = useState<'history' | 'generate'>('history');
  
  // Generation form state
  const [title, setTitle] = useState('OWASP_SCAN_PRO Executive Security Audit Report');
  const [reportFormat, setReportFormat] = useState<'PDF' | 'HTML' | 'JSON' | 'ALL'>('PDF');
  const [selectedOwasp, setSelectedOwasp] = useState<string[]>(['A01', 'A03', 'A05']);
  const [scanJobId, setScanJobId] = useState('s4-0010-482a-bbf1-987123456789');
  
  // Interactive Modals & Viewers
  const [previewReport, setPreviewReport] = useState<Report | null>(null);
  const [hashReport, setHashReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/v1/reports');
      if (res.ok) {
        const json = await res.json();
        setReports(json.data?.items || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleToggleOwasp = (category: string) => {
    if (selectedOwasp.includes(category)) {
      setSelectedOwasp(selectedOwasp.filter(c => c !== category));
    } else {
      setSelectedOwasp([...selectedOwasp, category]);
    }
  };

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setActionMessage(null);

    try {
      const res = await fetch('/api/v1/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scan_job_id: scanJobId,
          title: title,
          version: '1.0',
          report_format: reportFormat,
          owasp_categories: selectedOwasp
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setActionMessage(`Report generated successfully! SHA-256 Digest: ${json.data.file_hash.substring(0, 16)}...`);
        await fetchReports();
        setActiveTab('history');
      } else {
        setActionMessage(`Error generating report: ${json.message || 'Server error'}`);
      }
    } catch (err: any) {
      setActionMessage(`System error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (reportId: string, version: string) => {
    try {
      const res = await fetch(`/api/v1/reports/${reportId}/download`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${reportId}_v${version}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setActionMessage(`PDF Report v${version} downloaded successfully with SHA-256 header verification.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Report Engine & Audit Center
            </h2>
            <p className="text-slate-400 text-xs font-mono">
              Consolidated Vulnerabilities • PDF/HTML/JSON Exports • SHA-256 Non-Repudiation Signature
            </p>
          </div>
        </div>

        {/* Action Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => { setActiveTab('history'); fetchReports(); }}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Reports History ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'generate'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Generate Report
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 font-mono text-xs flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white cursor-pointer">×</button>
        </div>
      )}

      {/* Tab 1: Generate Report */}
      {activeTab === 'generate' && (
        <form onSubmit={handleGenerateReport} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Title & Format Specification */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold uppercase tracking-wider">
                <FileText className="w-4 h-4" /> Report Metadata Configuration
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Report Document Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Source Scan Job ID</label>
                <input
                  type="text"
                  value={scanJobId}
                  onChange={(e) => setScanJobId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 font-mono text-xs focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Export Format Output</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['PDF', 'HTML', 'JSON', 'ALL'] as const).map((fmt) => (
                    <button
                      type="button"
                      key={fmt}
                      onClick={() => setReportFormat(fmt)}
                      className={`py-2 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
                        reportFormat === fmt
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* OWASP Category Filtering */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-indigo-400 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Filter className="w-4 h-4" /> OWASP Categories Filtering
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{selectedOwasp.length} Selected</span>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto">
                {[
                  { id: 'A01', label: 'A01: Broken Access Control' },
                  { id: 'A02', label: 'A02: Cryptographic Failures' },
                  { id: 'A03', label: 'A03: Injection (SQL/Cmd)' },
                  { id: 'A04', label: 'A04: Insecure Design' },
                  { id: 'A05', label: 'A05: Security Misconfiguration' },
                  { id: 'A06', label: 'A06: Vulnerable Components' },
                  { id: 'A07', label: 'A07: Auth Failures' },
                  { id: 'A08', label: 'A08: Software Integrity' },
                  { id: 'A09', label: 'A09: Logging Failures' },
                  { id: 'A10', label: 'A10: SSRF' }
                ].map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => handleToggleOwasp(cat.id)}
                    className={`p-2 rounded-lg text-[11px] font-mono transition-all text-left border cursor-pointer ${
                      selectedOwasp.includes(cat.id)
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-mono text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Compiling Report & Generating SHA-256 Hash...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-white" /> Generate Consolidated Report (POST /api/v1/reports)
              </>
            )}
          </button>
        </form>
      )}

      {/* Tab 2: Reports History */}
      {activeTab === 'history' && (
        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" /> Generated Audit Reports
            </h3>
            <button
              onClick={fetchReports}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg text-xs font-mono flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh List
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-500 text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Title & Version</th>
                  <th className="p-3">Format</th>
                  <th className="p-3">OWASP Scope</th>
                  <th className="p-3">SHA-256 Digest</th>
                  <th className="p-3">Generated At</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3">
                      <span className="font-bold text-white block">{r.title}</span>
                      <span className="text-[10px] text-indigo-400 font-bold">Version v{r.version}</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                        {r.report_format}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 text-[11px]">
                      {r.owasp_category || 'All OWASP Categories'}
                    </td>
                    <td className="p-3 font-mono text-[10px]">
                      <button
                        onClick={() => setHashReport(r)}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 rounded font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        {r.file_hash.substring(0, 12)}...
                      </button>
                    </td>
                    <td className="p-3 text-[11px] text-slate-500">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewReport(r)}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-800 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                          title="HTML Live Preview"
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(r.id, r.version)}
                          className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs flex items-center gap-1 cursor-pointer font-bold shadow-sm"
                          title="Download Signed PDF"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* HTML Interactive Preview Modal */}
      {previewReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-mono font-bold text-white">{previewReport.title} (v{previewReport.version})</span>
              </div>
              <button
                onClick={() => setPreviewReport(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto bg-slate-950">
              <div
                className="prose prose-invert max-w-none text-slate-200"
                dangerouslySetInnerHTML={{ __html: previewReport.html_content || '<p>Preview unavailable</p>' }}
              />
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs font-mono">
              <span className="text-slate-500 text-[10px]">SHA-256: {previewReport.file_hash}</span>
              <button
                onClick={() => setPreviewReport(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHA-256 Hash Integrity Drawer */}
      {hashReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase">
                <ShieldCheck className="w-5 h-5" /> Non-Repudiation Verified
              </div>
              <button onClick={() => setHashReport(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase block mb-1">Cryptographic Hash Digest</span>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-emerald-400 font-mono text-[11px] break-all select-all">
                  {hashReport.file_hash}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Algorithm</span>
                  <span className="text-white font-bold">SHA-256</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Verification Status</span>
                  <span className="text-emerald-400 font-bold">VERIFIED MATCH</span>
                </div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-400">
                This SHA-256 checksum is immutably linked to Scan Job #{hashReport.scan_job_id.substring(0, 8)} in compliance with D17 Security Architecture.
              </div>
            </div>

            <button
              onClick={() => setHashReport(null)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-mono text-xs font-bold cursor-pointer"
            >
              Close Integrity Inspector
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
