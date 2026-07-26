import React, { useState } from 'react';
import { Activity, Cpu, Server, Database, Bug, Shield, Sparkles, CheckCircle2 } from 'lucide-react';
import { HealthProbeMonitor } from './HealthProbeMonitor';
import { SystemMetricsDashboard } from './SystemMetricsDashboard';
import { WorkersManagementPanel } from './WorkersManagementPanel';
import { BackupsManagementPanel } from './BackupsManagementPanel';
import { SystemErrorLogTracker } from './SystemErrorLogTracker';

export const MonitoringPlatformModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'health' | 'metrics' | 'workers' | 'backups' | 'errors'>('health');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Activity className="w-48 h-48 text-indigo-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Sprint 10 Module
              </span>
              <span className="text-xs text-slate-400">Platform Management & Observability</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Monitoring, Observability & Platform Management
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Liveness/readiness health probes, real-time Prometheus performance exporter, ephemeral Docker scan workers, backup snapshots & restore verification, and structured log tracking.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-right">
              <span className="text-[10px] text-slate-400 block font-medium">Platform Health</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All Services Operational
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-indigo-500/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab('health')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'health'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            System Health & Probes
          </button>

          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'metrics'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Metrics & Prometheus Exporter
          </button>

          <button
            onClick={() => setActiveTab('workers')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'workers'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <Server className="w-4 h-4" />
            Scan Worker Containers
          </button>

          <button
            onClick={() => setActiveTab('backups')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'backups'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            Backups & Restore
          </button>

          <button
            onClick={() => setActiveTab('errors')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'errors'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <Bug className="w-4 h-4" />
            Structured Log Tracker
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'health' && <HealthProbeMonitor />}
      {activeTab === 'metrics' && <SystemMetricsDashboard />}
      {activeTab === 'workers' && <WorkersManagementPanel />}
      {activeTab === 'backups' && <BackupsManagementPanel />}
      {activeTab === 'errors' && <SystemErrorLogTracker />}
    </div>
  );
};
