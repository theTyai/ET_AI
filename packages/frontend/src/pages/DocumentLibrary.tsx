import React, { useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { documentsApi } from '../api/documents.api';
import { useDocumentStore } from '../store/document.store';
import { useAuthStore } from '../store/auth.store';
import {
  Upload, FileText, Trash2, RefreshCw, Download, Search,
  Loader2, AlertCircle, CheckCircle, Clock, X, ChevronRight,
  Eye, Tag, Network, FileCheck, BookOpen, ArrowUpDown,
  Database, Layers, Shield, Zap,
  BarChart3, FileUp, HardDrive, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Document {
  _id: string;
  title: string;
  docType: string;
  ingestionStatus: string;
  fileSizeBytes: number;
  createdAt: string;
  equipmentTags?: string[];
  entityCount?: number;
  aiSummary?: string | null;
  complianceRefs?: string[];
  kgSynced?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DOC_TYPES = ['SOP', 'PID', 'WorkOrder', 'InspectionReport', 'OEMManual', 'IncidentReport'];

const DOC_TYPE_META: Record<string, { label: string; color: string; icon: string }> = {
  SOP:             { label: 'SOP',             color: 'badge--info',    icon: '📋' },
  PID:             { label: 'P&ID',            color: 'badge--violet',  icon: '🔧' },
  WorkOrder:       { label: 'Work Order',      color: 'badge--warning', icon: '🔩' },
  InspectionReport:{ label: 'Inspection',      color: 'badge--success', icon: '🔍' },
  OEMManual:       { label: 'OEM Manual',      color: 'badge--neutral', icon: '📖' },
  IncidentReport:  { label: 'Incident',        color: 'badge--danger',  icon: '⚠️' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatSize = (bytes: number) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

// ─── Status Components ────────────────────────────────────────────────────────
const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'completed': return <CheckCircle size={11} className="text-emerald-400" />;
    case 'processing': return <Loader2 size={11} className="text-sky-400 animate-spin" />;
    case 'queued':    return <Clock size={11} className="text-amber-400" />;
    case 'failed':    return <AlertCircle size={11} className="text-rose-400" />;
    default:          return null;
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    completed: 'badge badge--success',
    processing: 'badge badge--info',
    queued:    'badge badge--warning',
    failed:    'badge badge--danger',
  };
  return (
    <span className={`${map[status] || 'badge badge--neutral'} flex items-center gap-1`}>
      <StatusIcon status={status} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// ─── Side Panel ───────────────────────────────────────────────────────────────
const DocSidePanel: React.FC<{
  doc: Document;
  onClose: () => void;
  onReingest: (id: string) => void;
  onDelete: (id: string) => void;
  canModify: boolean;
  canDelete: boolean;
}> = ({ doc, onClose, onReingest, onDelete, canModify, canDelete }) => (
  <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
    <div
      className="relative w-full max-w-md h-full glass-panel border-l border-slate-700/50 overflow-y-auto slide-in-right flex flex-col"
      onClick={e => e.stopPropagation()}
    >
      {/* Top accent line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500" />

      <div className="p-6 space-y-5 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className={`badge ${DOC_TYPE_META[doc.docType]?.color || 'badge--neutral'}`}>
              {DOC_TYPE_META[doc.docType]?.label || doc.docType}
            </span>
            <h3 className="text-base font-bold text-slate-100 mt-2 leading-snug">{doc.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Status row */}
        <div className="flex gap-2 flex-wrap">
          <StatusBadge status={doc.ingestionStatus} />
          {doc.kgSynced ? (
            <span className="badge badge--success flex items-center gap-1"><Network size={10} /> KG Synced</span>
          ) : (
            <span className="badge badge--neutral flex items-center gap-1"><Network size={10} /> KG Pending</span>
          )}
        </div>

        {/* Metadata */}
        <div className="space-y-1">
          <p className="section-header flex items-center gap-1"><HardDrive size={10} /> File Metadata</p>
          <table className="spec-table w-full">
            <tbody>
              <tr><td>File Size</td><td>{formatSize(doc.fileSizeBytes)}</td></tr>
              <tr><td>Uploaded</td><td>{formatDate(doc.createdAt)}</td></tr>
              <tr><td>Entities Found</td><td>{doc.entityCount && doc.entityCount > 0 ? `${doc.entityCount} entities` : '—'}</td></tr>
              <tr><td>Document ID</td><td className="font-mono text-[10px] text-slate-500 break-all">{doc._id}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Equipment Tags */}
        {doc.equipmentTags && doc.equipmentTags.length > 0 && (
          <div className="space-y-2">
            <p className="section-header flex items-center gap-1"><Tag size={10} /> Equipment Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {doc.equipmentTags.map((t: string) => (
                <span key={t} className="badge badge--info font-mono">{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Compliance Refs */}
        {doc.complianceRefs && doc.complianceRefs.length > 0 && (
          <div className="space-y-2">
            <p className="section-header flex items-center gap-1"><FileCheck size={10} /> Compliance References</p>
            <div className="flex flex-wrap gap-1.5">
              {doc.complianceRefs.map((r: string) => (
                <span key={r} className="badge badge--violet">{r}</span>
              ))}
            </div>
          </div>
        )}

        {/* AI Summary */}
        {doc.aiSummary && (
          <div className="space-y-2">
            <p className="section-header flex items-center gap-1"><BookOpen size={10} /> AI Summary</p>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-sky-500/10 text-xs text-slate-300 leading-relaxed">
              {doc.aiSummary}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <a
            href={documentsApi.getDownloadUrl(doc._id)}
            target="_blank" rel="noreferrer"
            className="btn btn--secondary w-full flex items-center justify-center gap-2"
          >
            <Eye size={13} /> View PDF
          </a>
          <a
            href={documentsApi.getDownloadUrl(doc._id)}
            download
            className="btn btn--secondary w-full flex items-center justify-center gap-2"
          >
            <Download size={13} /> Download File
          </a>
          {canModify && (
            <button
              onClick={() => onReingest(doc._id)}
              className="btn btn--primary w-full flex items-center justify-center gap-2"
            >
              <RefreshCw size={13} /> Re-ingest Document
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(doc._id)}
              className="w-full py-2 rounded-lg border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={13} /> Delete Document
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);

// ─── Upload Progress Item ─────────────────────────────────────────────────────
const UploadProgressItem: React.FC<{ name: string; size: number; progress: number; error?: string }> = ({
  name, size, progress, error
}) => (
  <div className={`p-3 rounded-xl border space-y-2 transition-all ${
    error
      ? 'bg-rose-950/30 border-rose-500/30'
      : progress === 100
      ? 'bg-emerald-950/20 border-emerald-500/20'
      : 'bg-slate-950/60 border-slate-800'
  }`}>
    <div className="flex items-center gap-2 overflow-hidden">
      {error ? (
        <AlertCircle size={14} className="text-rose-400 shrink-0" />
      ) : progress === 100 ? (
        <CheckCircle size={14} className="text-emerald-400 shrink-0" />
      ) : (
        <FileText size={14} className="text-sky-400 shrink-0" />
      )}
      <span className="text-xs text-slate-200 truncate flex-1">{name}</span>
      <span className="text-[10px] text-slate-500 shrink-0">{formatSize(size)}</span>
    </div>
    {error ? (
      <p className="text-[10px] text-rose-400">{error}</p>
    ) : (
      <>
        <div className="progress-bar">
          <div
            className="progress-bar__fill"
            style={{
              width: `${progress}%`,
              background: progress === 100
                ? 'linear-gradient(90deg,#10b981,#06b6d4)'
                : 'linear-gradient(90deg,#0ea5e9,#6366f1)',
            }}
          />
        </div>
        <span className="text-[10px] text-slate-500">
          {progress < 100 ? `Uploading… ${Math.round(progress)}%` : '✓ Upload complete — ingestion queued'}
        </span>
      </>
    )}
  </div>
);

// ─── Document Card ────────────────────────────────────────────────────────────
const DocCard: React.FC<{ doc: Document; onClick: () => void }> = ({ doc, onClick }) => {
  const meta = DOC_TYPE_META[doc.docType];
  return (
    <button
      onClick={onClick}
      className="glass-card p-5 rounded-2xl text-left space-y-3 group hover:border-sky-500/30 transition-all duration-200 fade-in w-full"
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`badge ${meta?.color || 'badge--neutral'}`}>
          {meta?.label || doc.docType}
        </span>
        <StatusBadge status={doc.ingestionStatus} />
      </div>

      <div>
        <h4 className="text-sm font-bold text-slate-100 leading-snug group-hover:text-sky-300 transition-colors line-clamp-2">
          {doc.title}
        </h4>
        {doc.aiSummary && (
          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{doc.aiSummary}</p>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/50">
        <span>{formatSize(doc.fileSizeBytes)}</span>
        <span>{formatDate(doc.createdAt)}</span>
      </div>

      {doc.equipmentTags && doc.equipmentTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {doc.equipmentTags.slice(0, 3).map((t: string) => (
            <span key={t} className="badge badge--info text-[9px] font-mono">{t}</span>
          ))}
          {doc.equipmentTags.length > 3 && (
            <span className="badge badge--neutral text-[9px]">+{doc.equipmentTags.length - 3}</span>
          )}
        </div>
      )}

      {doc.entityCount && doc.entityCount > 0 && (
        <div className="flex items-center gap-1 text-[10px] text-emerald-400">
          <Network size={10} />
          <span>{doc.entityCount} KG entities extracted</span>
        </div>
      )}

      <div className="flex items-center gap-1 text-[10px] text-slate-400 group-hover:text-sky-400 transition-colors">
        <span>View details</span>
        <ChevronRight size={10} />
      </div>
    </button>
  );
};

// ─── Upload Panel ─────────────────────────────────────────────────────────────
interface UploadState {
  name: string;
  size: number;
  progress: number;
  error?: string;
}

const UploadPanel: React.FC<{
  onUploaded: (doc: Document) => void;
}> = ({ onUploaded }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('SOP');
  const [uploadState, setUploadState] = useState<UploadState | null>(null);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!acceptedFiles[0]) return;
    const file = acceptedFiles[0];
    setSelectedFile(file);
    setTitle(file.name.replace(/\.[^/.]+$/, ''));
    setUploadState(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setTitle('');
    setUploadState(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !title.trim() || !docType) {
      toast.error('Please select a file and fill in all fields');
      return;
    }

    setUploading(true);
    setUploadState({ name: selectedFile.name, size: selectedFile.size, progress: 0 });

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title.trim());
      formData.append('docType', docType);

      // Use real axios upload progress — no fake simulation needed
      const res = await documentsApi.upload(formData, (pct: number) => {
        setUploadState(prev => prev ? { ...prev, progress: pct } : prev);
      });

      setUploadState(prev => prev ? { ...prev, progress: 100 } : prev);

      if (res.success && res.data) {
        toast.success('Document uploaded! Ingestion job queued.');
        // Notify parent with minimal doc shape so list updates immediately
        const newDoc: Document = {
          _id: res.data.documentId,
          title: title.trim(),
          docType,
          ingestionStatus: res.data.status || 'queued',
          fileSizeBytes: selectedFile.size,
          createdAt: new Date().toISOString(),
          equipmentTags: [],
          entityCount: 0,
          aiSummary: null,
          complianceRefs: [],
          kgSynced: false,
        };
        onUploaded(newDoc);
        setTimeout(() => {
          setSelectedFile(null);
          setTitle('');
          setDocType('SOP');
          setUploadState(null);
        }, 2500);
      } else {
        throw new Error(res.error || 'Upload failed');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Upload failed';
      setUploadState(prev => prev ? { ...prev, error: msg } : prev);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-5">
      {/* Header */}
      <div>
        <p className="section-header flex items-center gap-1.5">
          <FileUp size={10} /> Ingest Document
        </p>
        <h3 className="text-sm font-bold text-slate-200 mt-1">Upload to Platform</h3>
        <p className="text-xs text-slate-500 mt-0.5">Add operating procedures, P&IDs, OEM manuals</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 ${
            isDragActive
              ? 'border-sky-400 bg-sky-500/10 scale-[1.01] shadow-lg shadow-sky-500/10'
              : selectedFile
              ? 'border-sky-600/50 bg-sky-500/5'
              : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/20'
          }`}
        >
          <input {...getInputProps()} />
          {selectedFile ? (
            <div className="space-y-2">
              {/* File type icon */}
              <div className="w-12 h-12 mx-auto rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                <FileText size={24} className="text-sky-400" />
              </div>
              <p className="text-xs font-semibold text-slate-200 truncate max-w-[180px] mx-auto">
                {selectedFile.name}
              </p>
              <p className="text-[10px] text-slate-500">{formatSize(selectedFile.size)}</p>
              <button
                type="button"
                onClick={handleRemove}
                className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline transition-colors"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto relative">
                <Upload size={22} className="text-slate-400" />
                {isDragActive && (
                  <span className="absolute inset-0 rounded-2xl border-2 border-sky-400 animate-ping opacity-30" />
                )}
              </div>
              <div>
                {isDragActive ? (
                  <p className="text-sm font-semibold text-sky-300">Drop your file here</p>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-200">Drag & drop or click to browse</p>
                    <p className="text-[10px] text-slate-500 mt-1">Max 100 MB per file</p>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {['PDF', 'Excel', 'Word', 'Image'].map(t => (
                  <span key={t} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Upload progress */}
        {uploadState && (
          <UploadProgressItem
            name={uploadState.name}
            size={uploadState.size}
            progress={uploadState.progress}
            error={uploadState.error}
          />
        )}

        {/* Title */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Document Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Compressor K-202 Startup Checklist"
            className="w-full glass-input text-xs"
            required
            disabled={uploading}
          />
        </div>

        {/* Doc Type */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Document Type <span className="text-rose-400">*</span>
          </label>
          <select
            value={docType}
            onChange={e => setDocType(e.target.value)}
            className="w-full glass-input text-xs"
            disabled={uploading}
          >
            {DOC_TYPES.map(t => (
              <option key={t} value={t}>{DOC_TYPE_META[t]?.label || t}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={uploading || !selectedFile}
          className="btn btn--primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none py-3"
        >
          {uploading ? (
            <><Loader2 size={14} className="animate-spin" /> Uploading…</>
          ) : (
            <><Upload size={14} /> Start Ingestion Job</>
          )}
        </button>
      </form>

      {/* Info footer */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
        <Zap size={12} className="text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Files are stored in GridFS and processed asynchronously. AI extraction runs as a background job — status updates in real-time.
        </p>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const DocumentLibrary: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const recentUploads = useDocumentStore(state => state.recentUploads);
  const addRecentUpload = useDocumentStore(state => state.addRecentUpload);
  const user = useAuthStore(state => state.user);

  const canModify = !user || ['SuperAdmin', 'PlantAdmin', 'Engineer'].includes(user.role ?? '');
  const canDelete = !user || ['SuperAdmin', 'PlantAdmin'].includes(user.role ?? '');

  // ── Fetch documents ──────────────────────────────────────────────────────
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await documentsApi.list({});
      if (res.success && Array.isArray(res.data)) {
        setDocuments(res.data);
      } else {
        throw new Error(res.error || 'Failed to load documents');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to load documents';
      setLoadError(msg);
      // Keep empty state on error — do NOT fall back to mock data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const kpiTotal      = documents.length;
  const kpiProcessing = documents.filter(d => d.ingestionStatus === 'processing' || d.ingestionStatus === 'queued').length;
  const kpiCompleted  = documents.filter(d => d.ingestionStatus === 'completed').length;
  const kpiFailed     = documents.filter(d => d.ingestionStatus === 'failed').length;

  // ── Filtered / sorted list ────────────────────────────────────────────────
  const filteredDocs = documents.filter(d => {
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase());
    const matchType   = !filterType  || d.docType === filterType;
    const matchStatus = !filterStatus || d.ingestionStatus === filterStatus;
    return matchSearch && matchType && matchStatus;
  }).sort((a, b) => {
    if (sortBy === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'name') return a.title.localeCompare(b.title);
    if (sortBy === 'size') return b.fileSizeBytes - a.fileSizeBytes;
    return 0;
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleUploaded = (newDoc: Document) => {
    setDocuments(prev => [newDoc, ...prev]);
    addRecentUpload({
      id: newDoc._id,
      title: newDoc.title,
      docType: newDoc.docType,
      status: newDoc.ingestionStatus,
      timestamp: new Date(),
    });
  };

  const handleReingest = async (id: string) => {
    try {
      const res = await documentsApi.reingest(id);
      if (res.success) {
        toast.success('Re-ingestion job queued');
        setDocuments(prev => prev.map(d => d._id === id ? { ...d, ingestionStatus: 'queued' } : d));
        setSelectedDoc(prev => prev && prev._id === id ? { ...prev, ingestionStatus: 'queued' } : prev);
      }
    } catch {
      toast.error('Failed to trigger re-ingestion');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document and all associated KG relations?')) return;
    try {
      const res = await documentsApi.delete(id);
      if (res.success) {
        setDocuments(prev => prev.filter(d => d._id !== id));
        setSelectedDoc(null);
        toast.success('Document deleted');
      }
    } catch {
      toast.error('Failed to delete document');
    }
  };

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Ambient glow */}
      <div className="absolute top-0 right-1/3 w-[600px] h-[600px] bg-indigo-500/4 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-sky-500/3 rounded-full blur-3xl pointer-events-none" />

      {/* ─── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-header flex items-center gap-2">
            <Database size={10} /> Document Intelligence
          </p>
          <h1 className="page-title">Document Library</h1>
          <p className="page-subtitle">Ingest, track, and query your plant's operational document corpus</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDocuments}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-sky-400 transition-colors glass-card-static px-3 py-2 rounded-xl border hover:border-sky-500/20"
            title="Refresh documents"
          >
            <RefreshCw size={13} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-400 glass-card-static px-4 py-2 rounded-xl">
            <Layers size={14} className="text-sky-400" />
            <span>{kpiTotal} Documents</span>
          </div>
        </div>
      </div>

      {/* ─── KPI Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="kpi-card kpi-card--sky flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="kpi-card__label">Total Documents</span>
            <BarChart3 size={14} className="text-sky-400/60" />
          </div>
          <span className="kpi-card__value">{kpiTotal}</span>
          <span className="kpi-card__sub">All file types</span>
        </div>
        <div className="kpi-card kpi-card--amber flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="kpi-card__label">Processing</span>
            <Activity size={14} className="text-amber-400/60" />
          </div>
          <span className="kpi-card__value">{kpiProcessing}</span>
          <span className="kpi-card__sub">Queued + active</span>
        </div>
        <div className="kpi-card kpi-card--emerald flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="kpi-card__label">Completed</span>
            <CheckCircle size={14} className="text-emerald-400/60" />
          </div>
          <span className="kpi-card__value">{kpiCompleted}</span>
          <span className="kpi-card__sub">KG indexed</span>
        </div>
        <div className="kpi-card kpi-card--rose flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="kpi-card__label">Failed</span>
            <AlertCircle size={14} className="text-rose-400/60" />
          </div>
          <span className="kpi-card__value">{kpiFailed}</span>
          <span className="kpi-card__sub">Needs attention</span>
        </div>
      </div>

      {/* ─── Active Ingestion Banner ───────────────────────────────────────── */}
      {recentUploads.some(u => u.status === 'processing' || u.status === 'queued') && (
        <div className="p-4 rounded-xl border border-sky-500/20 bg-sky-500/5 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <Loader2 size={14} className="text-sky-400 animate-spin" />
            <h4 className="text-xs font-bold text-sky-400 uppercase tracking-widest">Active Ingestion Pipelines</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentUploads.filter(u => u.status === 'processing' || u.status === 'queued').map(u => (
              <div key={u.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex justify-between items-center">
                <div className="overflow-hidden pr-2">
                  <p className="text-xs font-semibold text-slate-200 truncate">{u.title}</p>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider">{u.docType}</span>
                </div>
                <StatusBadge status={u.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Main Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ─── Upload Panel ────────────────────────────────────────────────── */}
        <div className="xl:col-span-1">
          {canModify ? (
            <UploadPanel onUploaded={handleUploaded} />
          ) : (
            <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center gap-3 text-center h-64">
              <Shield size={28} className="text-slate-500" />
              <div>
                <p className="text-xs font-semibold text-slate-300">Authorization Required</p>
                <p className="text-[10px] text-slate-500 mt-1">Engineer role or higher required to upload files.</p>
              </div>
            </div>
          )}
        </div>

        {/* ─── Document Grid ────────────────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-4">

          {/* Filter Bar */}
          <div className="glass-card-static p-4 rounded-2xl">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-44">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search documents…"
                  className="w-full glass-input text-xs pl-8"
                />
              </div>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className="glass-input text-xs min-w-32">
                <option value="">All Types</option>
                {DOC_TYPES.map(t => <option key={t} value={t}>{DOC_TYPE_META[t]?.label || t}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="glass-input text-xs min-w-32">
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="queued">Queued</option>
                <option value="failed">Failed</option>
              </select>
              <div className="flex items-center gap-2 ml-auto">
                <ArrowUpDown size={12} className="text-slate-500" />
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="glass-input text-xs">
                  <option value="date">Date</option>
                  <option value="name">Name</option>
                  <option value="size">Size</option>
                </select>
              </div>
            </div>
            <div className="mt-2.5 text-[10px] text-slate-500">
              Showing {filteredDocs.length} of {documents.length} documents
              {(search || filterType || filterStatus) && (
                <button
                  onClick={() => { setSearch(''); setFilterType(''); setFilterStatus(''); }}
                  className="ml-2 text-sky-400 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Document Cards Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
              <Loader2 size={28} className="animate-spin text-sky-400" />
              <span className="text-xs">Loading document index…</span>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500 glass-panel rounded-2xl border border-rose-500/20">
              <AlertCircle size={28} className="text-rose-400" />
              <p className="text-sm font-semibold text-rose-300">Failed to load documents</p>
              <p className="text-xs text-slate-500 max-w-xs text-center">{loadError}</p>
              <button onClick={fetchDocuments} className="btn btn--secondary flex items-center gap-2 mt-1">
                <RefreshCw size={13} /> Retry
              </button>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500 glass-panel rounded-2xl">
              <FileText size={32} />
              <p className="text-sm font-semibold">
                {documents.length === 0 ? 'No documents uploaded yet' : 'No documents match filters'}
              </p>
              <p className="text-xs">
                {documents.length === 0
                  ? 'Upload your first document using the panel on the left.'
                  : 'Try clearing the search or filter criteria.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredDocs.map(doc => (
                <DocCard key={doc._id} doc={doc} onClick={() => setSelectedDoc(doc)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Side Panel ───────────────────────────────────────────────────── */}
      {selectedDoc && (
        <DocSidePanel
          doc={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onReingest={handleReingest}
          onDelete={handleDelete}
          canModify={canModify}
          canDelete={canDelete}
        />
      )}
    </div>
  );
};

export default DocumentLibrary;
