import React, { useState, useEffect } from 'react';
import { Paperclip, Upload, FileText, Download, Trash2, ShieldCheck, HardDrive, CheckCircle2 } from 'lucide-react';

interface Attachment {
  id: string;
  company_id: string;
  uploader_id: string;
  uploader_name: string;
  resource_type: string;
  resource_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  file_path: string;
  sha256_hash: string;
  created_at: string;
}

export const AttachmentManager: React.FC = () => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fetchAttachments = async () => {
    try {
      const res = await fetch('/api/v1/attachments?resource_type=vulnerability&resource_id=v-001');
      if (res.ok) {
        const data = await res.json();
        setAttachments(data);
      }
    } catch (err) {
      console.error('Failed to fetch attachments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, []);

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/v1/attachments/upload?resource_type=vulnerability&resource_id=v-001', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        fetchAttachments();
      }
    } catch (err) {
      console.error('Failed to upload file attachment', err);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/attachments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAttachments();
      }
    } catch (err) {
      console.error('Failed to delete attachment', err);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-indigo-400" />
            Dépôt Sécurisé de Preuves & Pièces Jointes
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Stockez vos PoC, captures PCAP, journaux d'erreurs et correctifs avec empreinte SHA-256 infalsifiable.
          </p>
        </div>
        <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4" /> Empreinte SHA-256 Vérifiée
        </span>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition flex flex-col items-center justify-center gap-2 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
        }`}
      >
        <Upload className="w-8 h-8 text-indigo-400 opacity-80 mb-1" />
        <p className="text-xs font-semibold text-white">
          Glissez & Déposez vos fichiers de preuve ou <span className="text-indigo-400 underline cursor-pointer">Parcourir</span>
        </p>
        <p className="text-[11px] text-slate-500">
          Formats supportés : PCAP, LOG, PDF, PNG, JPG, JSON, CSV (Taille max : 10 Mo)
        </p>
        <input
          type="file"
          onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          className="hidden"
          id="file-attachment-input"
        />
        <label
          htmlFor="file-attachment-input"
          className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition shadow"
        >
          Sélectionner un fichier
        </label>
      </div>

      {/* Attachments List */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Fichiers de Preuve Joints ({attachments.length})
        </h4>

        {loading ? (
          <div className="text-center py-6 text-xs text-slate-500">Chargement des pièces jointes...</div>
        ) : attachments.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500 bg-slate-950 rounded-lg border border-slate-800">
            Aucune pièce jointe téléversée. Glissez-déposez des fichiers ci-dessus.
          </div>
        ) : (
          attachments.map(att => (
            <div
              key={att.id}
              className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-white">{att.filename}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    MIME : {att.file_type} • Taille : {(att.file_size / 1024).toFixed(1)} Ko • Par {att.uploader_name}
                  </p>
                  <p className="text-[10px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    SHA256 : {att.sha256_hash}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.open(att.file_path, '_blank')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-lg transition"
                  title="Télécharger le fichier"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(att.id)}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg border border-red-500/20 transition"
                  title="Supprimer le fichier"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
