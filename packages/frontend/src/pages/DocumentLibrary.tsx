import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { documentsApi } from '../api/documents.api';
import { useDocumentStore } from '../store/document.store';
import { useAuthStore } from '../store/auth.store';
import {
  Upload, FileText, Trash2, RefreshCw, Download, Search,
  Loader2, AlertCircle, CheckCircle, Clock, X, ChevronRight,
  Eye, Tag, Network, FileCheck, BookOpen, Cpu, ArrowUpDown,
  SlidersHorizontal, FilePlus, Database, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_DOCS = [
  {
    _id: 'doc-001', title: 'Centrifugal Pump P-101 SOP', docType: 'SOP',
    ingestionStatus: 'completed', fileSizeBytes: 1245184, createdAt: '2026-05-10T08:00:00Z',
    equipmentTags: ['P-101', 'P-102'], entityCount: 42,
    aiSummary: 'Standard operating procedure for centrifugal pump startup, normal operation, and shutdown covering seal flushing, alignment checks, and minimum flow bypass.',
    complianceRefs: ['ISO 13709', 'API 610'], kgSynced: true,
  },
  {
    _id: 'doc-002', title: 'P&ID Drawing Unit-3 Distillation', docType: 'PID',
    ingestionStatus: 'completed', fileSizeBytes: 8388608, createdAt: '2026-05-12T10:00:00Z',
    equipmentTags: ['T-301', 'HX-401', 'V-205'], entityCount: 118,
    aiSummary: 'P&ID sheet for distillation unit-3 showing all instrument loops, control valves, safety interlocks and process flows.',
    complianceRefs: ['ISA-5.1', 'ASME B31.3'], kgSynced: true,
  },
  {
    _id: 'doc-003', title: 'Compressor K-202 OEM Manual Vol.1', docType: 'OEMManual',
    ingestionStatus: 'processing', fileSizeBytes: 22020096, createdAt: '2026-06-01T14:00:00Z',
    equipmentTags: ['K-202'], entityCount: 0,
    aiSummary: null, complianceRefs: [], kgSynced: false,
  },
  {
    _id: 'doc-004', title: 'WO-2024-0881 Seal Replacement Report', docType: 'WorkOrder',
    ingestionStatus: 'completed', fileSizeBytes: 409600, createdAt: '2026-04-22T09:00:00Z',
    equipmentTags: ['P-101'], entityCount: 14,
    aiSummary: 'Corrective maintenance work order documenting mechanical seal failure on P-101, root cause identified as dry-run event, parts replaced.',
    complianceRefs: [], kgSynced: true,
  },
  {
    _id: 'doc-005', title: 'Heat Exchanger HX-401 Inspection Report Q2', docType: 'InspectionReport',
    ingestionStatus: 'completed', fileSizeBytes: 2097152, createdAt: '2026-05-30T11:00:00Z',
    equipmentTags: ['HX-401'], entityCount: 31,
    aiSummary: 'Quarterly inspection of shell-and-tube heat exchanger HX-401 showing 12% fouling on tube side, cleaning recommended within 30 days.',
    complianceRefs: ['ASME PCC-2'], kgSynced: true,
  },
  {
    _id: 'doc-006', title: 'Vessel V-205 HAZOP Study 2025', docType: 'OEMManual',
    ingestionStatus: 'failed', fileSizeBytes: 5242880, createdAt: '2026-06-10T16:00:00Z',
    equipmentTags: ['V-205'], entityCount: 0,
    aiSummary: null, complianceRefs: [], kgSynced: false,
  },
  {
    _id: 'doc-007', title: 'FT-201 Flow Transmitter Calibration Procedure', docType: 'SOP',
    ingestionStatus: 'queued', fileSizeBytes: 307200, createdAt: '2026-06-21T08:30:00Z',
    equipmentTags: ['FT-201'], entityCount: 0,
    aiSummary: null, complianceRefs: [], kgSynced: false,
  },
  {
    _id: 'doc-008', title: 'Cooling Tower CT-501 Performance Test', docType: 'InspectionReport',
    ingestionStatus: 'completed', fileSizeBytes: 1572864, createdAt: '2026-06-15T13:00:00Z',
    equipmentTags: ['CT-501'], entityCount: 27,
    aiSummary: 'Performance test results for cooling tower CT-501 showing approach temperature 3.2°C above design, fill pack efficiency reduced. Nozzle inspection recommended.',
    complianceRefs: ['CTI ATC-105'], kgSynced: true,
  },
];

const DOC_TYPES = ['SOP', 'PID', 'WorkOrder', 'InspectionReport', 'OEMManual', 'IncidentReport'];

const DOC_TYPE_COLORS: Record<string, string> = {
  SOP: 'badge badge--info',
  PID: 'badge badge--violet',
  WorkOrder: 'badge badge--warning',
  InspectionReport: 'badge badge--success',
  OEMManual: 'badge badge--neutral',
  IncidentReport: 'badge badge--danger',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatSize = (bytes: number) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'completed': return <CheckCircle size={12} className="text-emerald-400" />;
    case 'processing': return <Loader2 size={12} className="text-sky-400 animate-spin" />;
    case 'queued': return <Clock size={12} className="text-amber-400" />;
    case 'failed': return <AlertCircle size={12} className="text-rose-400" />;
    default: return null;
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    completed: 'badge badge--success',
    processing: 'badge badge--info',
    queued: 'badge badge--warning',
    failed: 'badge badge--danger',
  };
  return (
    <span className={`${map[status] || 'badge badge--neutral'} flex items-center gap-1`}>
      <StatusIcon status={status} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// ─── Side Panel ───────────────────────────────────────────────────────────────
const DocSidePanel: React.FC<{ doc: any; onClose: () => void; onReingest: (id: string) => void; onDelete: (id: string) => void; canModify: boolean; canDelete: boolean }> = ({
  doc, onClose, onReingest, onDelete, canModify, canDelete
}) => (
  <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
    <div
      className="relative w-full max-w-md h-full glass-panel border-l border-slate-700/50 overflow-y-auto slide-in-right"
      onClick={e => e.stopPropagation()}
    >
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className={DOC_TYPE_COLORS[doc.docType] || 'badge badge--neutral'}>{doc.docType}</span>
            <h3 className="text-base font-bold text-slate-100 mt-2 leading-snug">{doc.title}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Status + KG Sync */}
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
          <p className="section-header">File Metadata</p>
          <table className="spec-table w-full">
            <tbody>
              <tr><td>File Size</td><td>{formatSize(doc.fileSizeBytes)}</td></tr>
              <tr><td>Uploaded</td><td>{new Date(doc.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td></tr>
              <tr><td>Entities Found</td><td>{doc.entityCount > 0 ? `${doc.entityCount} entities` : '—'}</td></tr>
              <tr><td>Document ID</td><td className="font-mono text-[10px] text-slate-500">{doc._id}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Equipment Tags */}
        {doc.equipmentTags?.length > 0 && (
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
        {doc.complianceRefs?.length > 0 && (
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
const UploadProgressItem: React.FC<{ file: File; progress: number }> = ({ file, progress }) => (
  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
    <div className="flex items-center gap-2 overflow-hidden">
      <FileText size={14} className="text-sky-400 shrink-0" />
      <span className="text-xs text-slate-200 truncate flex-1">{file.name}</span>
      <span className="text-[10px] text-slate-500 shrink-0">{formatSize(file.size)}</span>
    </div>
    <div className="progress-bar">
      <div className="progress-bar__fill" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#0ea5e9,#6366f1)' }} />
    </div>
    <span className="text-[10px] text-slate-500">{progress < 100 ? `Uploading… ${progress}%` : 'Processing…'}</span>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const DocumentLibrary: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>(MOCK_DOCS);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [uploadFiles, setUploadFiles] = useState<Array<{ file: File; progress: number }>>([]);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('SOP');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const recentUploads = useDocumentStore((state) => state.recentUploads);
  const addRecentUpload = useDocumentStore((state) => state.addRecentUpload);
  const user = useAuthStore((state) => state.user);

  const canModify = !user || ['SuperAdmin', 'PlantAdmin', 'Engineer'].includes(user.role ?? '');
  const canDelete = !user || ['SuperAdmin', 'PlantAdmin'].includes(user.role ?? '');

  // KPI counts
  const kpiTotal = MOCK_DOCS.length;
  const kpiProcessing = MOCK_DOCS.filter(d => d.ingestionStatus === 'processing' || d.ingestionStatus === 'queued').length;
  const kpiCompleted = MOCK_DOCS.filter(d => d.ingestionStatus === 'completed').length;
  const kpiFailed = MOCK_DOCS.filter(d => d.ingestionStatus === 'failed').length;

  // Filtered list
  const filteredDocs = documents.filter(d => {
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || d.docType === filterType;
    const matchStatus = !filterStatus || d.ingestionStatus === filterStatus;
    return matchSearch && matchType && matchStatus;
  }).sort((a, b) => {
    if (sortBy === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'name') return a.title.localeCompare(b.title);
    if (sortBy === 'size') return b.fileSizeBytes - a.fileSizeBytes;
    return 0;
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({ file, progress: 0 }));
    setUploadFiles(prev => [...prev, ...newFiles]);
    if (acceptedFiles[0]) {
      setSelectedFile(acceptedFiles[0]);
      setTitle(acceptedFiles[0].name.replace(/\.[^/.]+$/, ''));
    }
    // Simulate progress animation
    newFiles.forEach((_, i) => {
      let p = 0;
      const interval = setInterval(() => {
        p += Math.random() * 15 + 5;
        if (p >= 95) { clearInterval(interval); p = 95; }
        setUploadFiles(prev => prev.map((f, idx) => idx === (prev.length - newFiles.length + i) ? { ...f, progress: Math.min(p, 95) } : f));
      }, 200);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, multiple: true,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'],
    }
  });

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !title || !docType) { toast.error('Please select a file and enter details'); return; }
    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', title);
    formData.append('docType', docType);
    try {
      const res = await documentsApi.upload(formData);
      if (res.success && res.data) {
        addRecentUpload({ id: res.data.documentId, title, docType, status: res.data.status || 'queued', timestamp: new Date() });
        setUploadFiles(prev => prev.map(f => ({ ...f, progress: 100 })));
        setTimeout(() => setUploadFiles([]), 1500);
        setSelectedFile(null); setTitle(''); setDocType('SOP');
        toast.success('Document ingestion queued!');
      }
    } catch {
      toast.error('Upload failed');
    } finally { setUploading(false); }
  };

  const handleReingest = async (id: string) => {
    try {
      const res = await documentsApi.reingest(id);
      if (res.success) { toast.success('Re-ingestion job queued'); }
    } catch { toast.error('Failed to trigger re-ingestion'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document and all associated KG relations?')) return;
    try {
      const res = await documentsApi.delete(id);
      if (res.success) { setDocuments(prev => prev.filter(d => d._id !== id)); setSelectedDoc(null); toast.success('Document deleted'); }
    } catch { toast.error('Failed to delete document'); }
  };

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Ambient glow */}
      <div className="absolute top-0 right-1/3 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-sky-500/4 rounded-full blur-3xl pointer-events-none" />

      {/* ─── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-header flex items-center gap-2"><Database size={10} /> Document Intelligence</p>
          <h1 className="page-title">Document Library</h1>
          <p className="page-subtitle">Ingest, track, and query your plant's operational document corpus</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 glass-card-static px-4 py-2 rounded-xl">
          <Layers size={14} className="text-sky-400" />
          <span>{kpiTotal} Documents</span>
        </div>
      </div>

      {/* ─── KPI Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="kpi-card kpi-card--sky">
          <span className="kpi-card__label">Total Documents</span>
          <span className="kpi-card__value">{kpiTotal}</span>
          <span className="kpi-card__sub">All file types</span>
        </div>
        <div className="kpi-card kpi-card--amber">
          <span className="kpi-card__label">Processing</span>
          <span className="kpi-card__value">{kpiProcessing}</span>
          <span className="kpi-card__sub">Queued + active</span>
        </div>
        <div className="kpi-card kpi-card--emerald">
          <span className="kpi-card__label">Completed</span>
          <span className="kpi-card__value">{kpiCompleted}</span>
          <span className="kpi-card__sub">KG indexed</span>
        </div>
        <div className="kpi-card kpi-card--rose">
          <span className="kpi-card__label">Failed</span>
          <span className="kpi-card__value">{kpiFailed}</span>
          <span className="kpi-card__sub">Needs attention</span>
        </div>
      </div>

      {/* ─── Active Ingestion Banner ─────────────────────────────────────── */}
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

      {/* ─── Main Grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ─── Upload Panel ──────────────────────────────────────────────── */}
        <div className="xl:col-span-1 space-y-4">
          <div className="glass-panel p-6 space-y-5 rounded-2xl">
            <div>
              <p className="section-header flex items-center gap-1"><FilePlus size={10} /> Ingest Document</p>
              <h3 className="text-sm font-bold text-slate-200 mt-1">Upload to Platform</h3>
              <p className="text-xs text-slate-500 mt-0.5">Add operating procedures, P&IDs, OEM manuals</p>
            </div>

            {canModify ? (
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                {/* Dropzone */}
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${isDragActive ? 'border-sky-500 bg-sky-500/8 scale-[1.01]' : selectedFile ? 'border-sky-600/50 bg-sky-500/4' : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/20'}`}
                >
                  <input {...getInputProps()} />
                  {selectedFile ? (
                    <div className="space-y-2">
                      <FileText size={32} className="mx-auto text-sky-400" />
                      <p className="text-xs font-semibold text-slate-200 truncate">{selectedFile.name}</p>
                      <p className="text-[10px] text-slate-500">{formatSize(selectedFile.size)}</p>
                      <button type="button" onClick={e => { e.stopPropagation(); setSelectedFile(null); setTitle(''); }} className="text-[10px] text-rose-400 hover:underline">Remove</button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto">
                        <Upload size={24} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-200">Drag & drop files here</p>
                        <p className="text-[10px] text-slate-500 mt-1">or click to browse your file system</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {['PDF', 'Excel', 'Word', 'Image'].map(t => (
                          <span key={t} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* File Progress List */}
                {uploadFiles.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {uploadFiles.map((f, i) => <UploadProgressItem key={i} file={f.file} progress={f.progress} />)}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Document Title</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Compressor K-202 startup checklist" className="w-full glass-input text-xs" required />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Document Type</label>
                  <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full glass-input text-xs">
                    {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <button type="submit" disabled={uploading || !selectedFile} className="btn btn--primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none">
                  {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : <><Upload size={14} /> Start Ingestion Job</>}
                </button>
              </form>
            ) : (
              <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/20 text-center">
                <AlertCircle size={24} className="mx-auto text-slate-500 mb-2" />
                <p className="text-xs text-slate-400">Engineer authorization required</p>
                <p className="text-[10px] text-slate-600 mt-1">Contact a PlantAdmin to upload files.</p>
              </div>
            )}
          </div>
        </div>

        {/* ─── Document Grid ─────────────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-4">
          {/* Filter Bar */}
          <div className="glass-card-static p-4 rounded-2xl">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-48">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search documents…"
                  className="w-full glass-input text-xs pl-8"
                />
              </div>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className="glass-input text-xs min-w-32">
                <option value="">All Types</option>
                {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
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
                  <option value="date">Sort: Date</option>
                  <option value="name">Sort: Name</option>
                  <option value="size">Sort: Size</option>
                </select>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-slate-500">
              Showing {filteredDocs.length} of {documents.length} documents
            </div>
          </div>

          {/* Document Cards Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
              <Loader2 size={28} className="animate-spin text-sky-400" />
              <span className="text-xs">Loading document index…</span>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500 glass-panel rounded-2xl">
              <FileText size={32} />
              <p className="text-sm font-semibold">No documents match filters</p>
              <p className="text-xs">Try clearing the search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredDocs.map(doc => (
                <button
                  key={doc._id}
                  onClick={() => setSelectedDoc(doc)}
                  className="glass-card p-5 rounded-2xl text-left space-y-3 group hover:border-sky-500/30 transition-all duration-200 fade-in"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={DOC_TYPE_COLORS[doc.docType] || 'badge badge--neutral'}>{doc.docType}</span>
                    <StatusBadge status={doc.ingestionStatus} />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-100 leading-snug group-hover:text-sky-300 transition-colors line-clamp-2">{doc.title}</h4>
                    {doc.aiSummary && (
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{doc.aiSummary}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/50">
                    <span>{formatSize(doc.fileSizeBytes)}</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</span>
                  </div>

                  {doc.equipmentTags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {doc.equipmentTags.slice(0, 3).map((t: string) => (
                        <span key={t} className="badge badge--info text-[9px] font-mono">{t}</span>
                      ))}
                      {doc.equipmentTags.length > 3 && (
                        <span className="badge badge--neutral text-[9px]">+{doc.equipmentTags.length - 3}</span>
                      )}
                    </div>
                  )}

                  {doc.entityCount > 0 && (
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
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Side Panel ──────────────────────────────────────────────────── */}
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
