import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Square, 
  Terminal, 
  Activity, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Search, 
  Cpu, 
  FileText, 
  Eye, 
  Layers, 
  Radio, 
  AlertTriangle,
  Server,
  Crosshair,
  Filter
} from 'lucide-react';

interface ToolExecution {
  id: string;
  tool_type: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  logs?: string;
}

interface ScanJob {
  id: string;
  target_id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  started_at: string;
  completed_at?: string | null;
  error_message?: string | null;
  tool_executions: ToolExecution[];
}

interface Finding {
  id: string;
  scan_job_id: string;
  scanner_name: string;
  title: string;
  severity: 'High' | 'Medium' | 'Low' | 'Info';
  description: string;
  http_request?: string;
  http_response?: string;
  evidence_notes?: string;
  raw_data?: any;
  created_at: string;
}

export const ScannerModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'launch' | 'history' | 'findings'>('launch');
  
  // Launch Form state
  const [targetUrl, setTargetUrl] = useState('https://app.victim-corp.com');
  const [selectedTools, setSelectedTools] = useState<string[]>(['zap', 'nmap', 'nikto']);
  const [selectedOwasp, setSelectedOwasp] = useState<string[]>(['A01', 'A03', 'A05']);
  
  // Scans & Findings state
  const [scans, setScans] = useState<ScanJob[]>([]);
  const [activeScan, setActiveScan] = useState<ScanJob | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchScans = async () => {
    try {
      const res = await fetch('/api/v1/scans');
      if (res.ok) {
        const json = await res.json();
        setScans(json.data?.items || []);
        if (json.data?.items?.length > 0 && !activeScan) {
          setActiveScan(json.data.items[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFindings = async () => {
    try {
      const res = await fetch('/api/v1/findings');
      if (res.ok) {
        const json = await res.json();
        setFindings(json.data?.items || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchScans();
    fetchFindings();
  }, []);

  const handleToggleTool = (tool: string) => {
    if (selectedTools.includes(tool)) {
      if (selectedTools.length > 1) {
        setSelectedTools(selectedTools.filter(t => t !== tool));
      }
    } else {
      setSelectedTools([...selectedTools, tool]);
    }
  };

  const handleToggleOwasp = (category: string) => {
    if (selectedOwasp.includes(category)) {
      setSelectedOwasp(selectedOwasp.filter(c => c !== category));
    } else {
      setSelectedOwasp([...selectedOwasp, category]);
    }
  };

  const handleLaunchScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setActionMessage(null);

    try {
      const res = await fetch('/api/v1/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_id: 't-001-uuid',
          tools: selectedTools,
          owasp: selectedOwasp
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setActionMessage('Scan Job initiated successfully! Tool execution workers spawned in parallel.');
        setActiveScan(json.data);
        await fetchScans();
        setActiveTab('history');
      } else {
        setActionMessage(`Error launching scan: ${json.message || 'Unauthorized'}`);
      }
    } catch (err: any) {
      setActionMessage(`System error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelScan = async (scanId: string) => {
    try {
      const res = await fetch(`/api/v1/scans/${scanId}/cancel`, { method: 'POST' });
      const json = await res.json();
      if (res.ok && json.success) {
        setActionMessage(`Scan #${scanId.substring(0, 8)} cancelled successfully.`);
        await fetchScans();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> COMPLETED
          </span>
        );
      case 'RUNNING':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3 text-sky-400 animate-spin" /> RUNNING
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
            <XCircle className="w-3 h-3 text-amber-400" /> CANCELLED
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-rose-400" /> FAILED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> PENDING
          </span>
        );
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'high':
      case 'critical':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">HIGH</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">MEDIUM</span>;
      case 'low':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">LOW</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">INFO</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Scanner Orchestration Engine
            </h2>
            <p className="text-slate-400 text-xs font-mono">
              OWASP ZAP • Nmap • Nikto Worker Management & Evidence Collection
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('launch')}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'launch'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" /> Launch Scan
          </button>
          <button
            onClick={() => { setActiveTab('history'); fetchScans(); }}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Scan History
          </button>
          <button
            onClick={() => { setActiveTab('findings'); fetchFindings(); }}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'findings'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Evidence Center ({findings.length})
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 font-mono text-xs flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">×</button>
        </div>
      )}

      {/* Tab 1: Launch Scan */}
      {activeTab === 'launch' && (
        <form onSubmit={handleLaunchScan} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Target Configuration */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold uppercase tracking-wider">
                <Crosshair className="w-4 h-4" /> Target Specification
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Target URL / Hostname</label>
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
                  placeholder="https://target-app.com"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">Only assigned Auditor roles can trigger scans against active target scope.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Target Asset Context</label>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Server className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-xs font-mono font-bold text-white block">Main SaaS Platform (Production)</span>
                      <span className="text-[10px] text-slate-500">Asset ID: asset-001 • Assigned Auditor: Current User</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">ACTIVE</span>
                </div>
              </div>
            </div>

            {/* Scanner Tools Selection */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold uppercase tracking-wider">
                <Cpu className="w-4 h-4" /> Tool Adapters Suite
              </div>

              <div className="space-y-2">
                {[
                  { id: 'zap', name: 'OWASP ZAP 2.14', desc: 'Active web vulnerability spidering & injection checks' },
                  { id: 'nmap', name: 'Nmap 7.94', desc: 'Port discovery, service versioning & NSE scripts' },
                  { id: 'nikto', name: 'Nikto 2.5.0', desc: 'Web server misconfig, obsolete software & dangerous files' }
                ].map((tool) => (
                  <div
                    key={tool.id}
                    onClick={() => handleToggleTool(tool.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      selectedTools.includes(tool.id)
                        ? 'bg-indigo-500/10 border-indigo-500/40 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-mono font-bold block">{tool.name}</span>
                      <span className="text-[10px] text-slate-400">{tool.desc}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedTools.includes(tool.id)}
                      onChange={() => {}}
                      className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* OWASP Top 10 Categories */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-indigo-400 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-4 h-4" /> OWASP Top 10 Target Categories
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{selectedOwasp.length} Selected</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {[
                { id: 'A01', label: 'A01: Broken Access Control' },
                { id: 'A02', label: 'A02: Cryptographic Failures' },
                { id: 'A03', label: 'A03: Injection (SQL/Command)' },
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
                  className={`p-2 rounded-lg text-[11px] font-mono transition-all text-left border ${
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

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-mono text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Orchestrating Workers...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" /> Execute Scan Job (POST /api/v1/scans)
              </>
            )}
          </button>
        </form>
      )}

      {/* Tab 2: Scan History & Real-Time Status */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          
          {/* Active / Recent Scan Detail View */}
          {activeScan && (
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono font-bold text-sm">Scan Job #{activeScan.id}</span>
                    {getStatusBadge(activeScan.status)}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block mt-1">
                    Started: {new Date(activeScan.started_at).toLocaleString()}
                  </span>
                </div>

                {activeScan.status === 'RUNNING' && (
                  <button
                    onClick={() => handleCancelScan(activeScan.id)}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-rose-400" /> Cancel Scan
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">Aggregated Orchestration Progress</span>
                  <span className="text-indigo-400 font-bold">{activeScan.progress}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-indigo-500 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${activeScan.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Tool Execution Workers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {activeScan.tool_executions.map((te) => (
                  <div key={te.id} className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex flex-col justify-between space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono font-bold text-indigo-300">{te.tool_type} Worker</span>
                      {getStatusBadge(te.status)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">
                      {te.logs || `[${te.tool_type}] Ready`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Scan History Table */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" /> Tenant Scan History
              </h3>
              <button
                onClick={fetchScans}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg text-xs font-mono flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-500 text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Scan ID</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Progress</th>
                    <th className="p-3">Tools Executed</th>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {scans.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3 font-bold text-indigo-400">#{s.id.substring(0, 8)}</td>
                      <td className="p-3">{getStatusBadge(s.status)}</td>
                      <td className="p-3 font-bold text-slate-200">{s.progress}%</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          {s.tool_executions?.map((t) => (
                            <span key={t.id} className="px-1.5 py-0.5 rounded text-[9px] bg-slate-900 border border-slate-800 font-bold text-slate-400">
                              {t.tool_type}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-[11px] text-slate-500">{new Date(s.started_at).toLocaleTimeString()}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setActiveScan(s)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-800 rounded-md text-[11px] font-semibold transition-all cursor-pointer"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Tab 3: Raw Findings & Evidence Center */}
      {activeTab === 'findings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Findings List */}
          <div className="lg:col-span-5 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col justify-between">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-400" /> Collected Raw Findings
              </span>
              <span className="text-[10px] font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-indigo-400">
                {findings.length} Items
              </span>
            </div>

            <div className="divide-y divide-slate-800/80 max-h-[450px] overflow-y-auto">
              {findings.map((f) => (
                <div
                  key={f.id}
                  onClick={() => setSelectedFinding(f)}
                  className={`p-3 transition-all cursor-pointer hover:bg-slate-900/80 ${
                    selectedFinding?.id === f.id ? 'bg-indigo-500/10 border-l-2 border-l-indigo-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800">
                      {f.scanner_name}
                    </span>
                    {getSeverityBadge(f.severity)}
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1 line-clamp-1">{f.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{f.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence Inspector */}
          <div className="lg:col-span-7 bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
            {selectedFinding ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
                        {selectedFinding.scanner_name} EVIDENCES
                      </span>
                      {getSeverityBadge(selectedFinding.severity)}
                    </div>
                    <h3 className="text-sm font-bold text-white">{selectedFinding.title}</h3>
                  </div>
                </div>

                <div>
                  <h5 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">Description</h5>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-800">
                    {selectedFinding.description}
                  </p>
                </div>

                {selectedFinding.http_request && (
                  <div>
                    <h5 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">HTTP Request Proof</h5>
                    <pre className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                      {selectedFinding.http_request}
                    </pre>
                  </div>
                )}

                {selectedFinding.http_response && (
                  <div>
                    <h5 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">HTTP Response Proof</h5>
                    <pre className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-sky-300 overflow-x-auto whitespace-pre-wrap">
                      {selectedFinding.http_response}
                    </pre>
                  </div>
                )}

                {selectedFinding.raw_data && (
                  <div>
                    <h5 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">Tool Metadata</h5>
                    <pre className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-[10px] text-purple-300 overflow-x-auto">
                      {JSON.stringify(selectedFinding.raw_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[350px] flex flex-col items-center justify-center text-center p-6 text-slate-500 font-mono text-xs">
                <Terminal className="w-8 h-8 text-slate-600 mb-2" />
                Select a raw finding from the left panel to inspect HTTP request/response evidence proofs.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
