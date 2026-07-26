import React, { useState, useEffect } from 'react';
import { Database, HardDrive, ShieldCheck, Download, Play, Plus, RefreshCw, CheckCircle2, AlertTriangle, FileArchive } from 'lucide-react';

interface Backup {
  id: string;
  filename: string;
  backup_type: string;
  size_mb: number;
  sha256_hash: string;
  status: string;
  created_at: string;
}

export const BackupsManagementPanel: React.FC = () => {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);
  const [backupType, setBackupType] = useState<string>('FULL');
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/system/backups');
      if (res.ok) {
        const json = await res.json();
        setBackups(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch system backups', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/v1/system/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backup_type: backupType, description: 'Manual Administrator Backup Snapshot' })
      });

      if (res.ok) {
        fetchBackups();
      }
    } catch (err) {
      console.error('Failed to create backup snapshot', err);
    } finally {
      setCreating(false);
    }
  };

  const handleRestoreSimulation = async (backupId: string) => {
    setRestoreStatus(`Testing restore readiness for backup ${backupId}...`);
    try {
      const res = await fetch(`/api/v1/system/backups/${backupId}/restore`, {
        method: 'POST'
      });
      if (res.ok) {
        const json = await res.json();
        setRestoreStatus(`Restore Verification PASSED: ${json.data.details}`);
      }
    } catch (err) {
      setRestoreStatus('Restore test failed due to an error.');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            Platform Backup & Disaster Recovery Center
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Snapshot database dumps and report volume archives with cryptographic SHA-256 non-repudiation verification.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <select
            value={backupType}
            onChange={e => setBackupType(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="FULL">FULL Snapshot (DB + Reports)</option>
            <option value="DATABASE">DATABASE Only</option>
            <option value="REPORTS">REPORTS Volume Only</option>
          </select>

          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            {creating ? 'Creating...' : 'Trigger Backup'}
          </button>
        </div>
      </div>

      {restoreStatus && (
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-xs text-indigo-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{restoreStatus}</span>
        </div>
      )}

      {/* Backups List */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          System Backup Repositories ({backups.length})
        </h4>

        {loading ? (
          <div className="text-center py-8 text-xs text-slate-500">Loading backup snapshots...</div>
        ) : backups.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 bg-slate-950 rounded-lg border border-slate-800">
            No backup snapshots found. Click 'Trigger Backup' above.
          </div>
        ) : (
          backups.map(b => (
            <div
              key={b.id}
              className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl shrink-0">
                  <FileArchive className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono">{b.filename}</span>
                    <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono px-2 py-0.5 rounded">
                      {b.backup_type}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    Size: {b.size_mb} MB • Created: {new Date(b.created_at).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    SHA256: {b.sha256_hash}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => handleRestoreSimulation(b.id)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
                >
                  <Play className="w-3.5 h-3.5 text-indigo-400" />
                  Test Restore
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
