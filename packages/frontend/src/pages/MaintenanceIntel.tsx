import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import {
  Wrench, Activity, GitBranch, TrendingUp, ChevronDown, ChevronRight,
  X, Play, Clock, DollarSign, User, AlertTriangle, CheckCircle2,
  Loader2, Brain, RefreshCw, Zap, Calendar, Hash, Tag
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────────────────────────
   TYPES & MOCK DATA
───────────────────────────────────────────────────────────────── */
type WOStatus   = 'Open' | 'In Progress' | 'Completed' | 'On Hold';
type WOType     = 'Preventive' | 'Corrective' | 'Predictive' | 'Emergency';
type WOPriority = 'Critical' | 'High' | 'Medium' | 'Low';

interface WorkOrder {
  id: string;
  woNum: string;
  equipTag: string;
  type: WOType;
  priority: WOPriority;
  status: WOStatus;
  technician: string;
  downtime: number;
  cost: number;
  description: string;
  createdAt: string;
  completedAt?: string;
}

interface TimelineEvent {
  date: string;
  type: WOType | 'Inspection' | 'Failure';
  title: string;
  detail: string;
  badge: string;
}

const EQUIPMENT_OPTIONS = ['P-101 Centrifugal Pump', 'V-205 Separator Vessel', 'C-301 Compressor'];

const MOCK_WOs: WorkOrder[] = [
  { id:'wo1', woNum:'WO-2026-0841', equipTag:'P-101', type:'Corrective',  priority:'Critical', status:'In Progress', technician:'Rajesh Kumar',  downtime:6.5,  cost:28500, description:'Mechanical seal failure causing product leak at P-101. Seal replacement and alignment check required.',  createdAt:'2026-06-20', },
  { id:'wo2', woNum:'WO-2026-0839', equipTag:'C-301', type:'Emergency',   priority:'Critical', status:'Open',        technician:'Amir Shaikh',   downtime:12.0, cost:85000, description:'C-301 compressor discharge temperature exceeding 185°C trip setpoint. Emergency inspection of inter-cooler and valves.', createdAt:'2026-06-21', },
  { id:'wo3', woNum:'WO-2026-0835', equipTag:'V-205', type:'Preventive',  priority:'Medium',   status:'Completed',   technician:'Priya Nair',    downtime:4.0,  cost:12000, description:'Scheduled internal inspection of V-205 separator vessel. Nozzle inspection, thickness measurement.', createdAt:'2026-06-15', completedAt:'2026-06-17' },
  { id:'wo4', woNum:'WO-2026-0830', equipTag:'P-101', type:'Preventive',  priority:'Low',      status:'Completed',   technician:'Suresh Mehta',  downtime:2.0,  cost:4500,  description:'Quarterly lubrication service for P-101 pump bearings. Oil sample taken for analysis.', createdAt:'2026-06-10', completedAt:'2026-06-10' },
  { id:'wo5', woNum:'WO-2026-0822', equipTag:'P-101', type:'Predictive',  priority:'High',     status:'On Hold',     technician:'Rajesh Kumar',  downtime:0,    cost:9500,  description:'Vibration analysis flagged bearing defect frequency. Pending spare parts for bearing replacement.', createdAt:'2026-06-05', },
  { id:'wo6', woNum:'WO-2026-0815', equipTag:'C-301', type:'Preventive',  priority:'Medium',   status:'Completed',   technician:'Amir Shaikh',   downtime:8.0,  cost:32000, description:'Annual overhaul of C-301 compressor. Valve replacement, piston ring inspection, alignment.', createdAt:'2026-05-20', completedAt:'2026-05-24' },
  { id:'wo7', woNum:'WO-2026-0809', equipTag:'V-205', type:'Corrective',  priority:'High',     status:'Completed',   technician:'Priya Nair',    downtime:3.5,  cost:18000, description:'Pressure gauge on V-205 found faulty during rounds. Replaced with calibrated instrument.', createdAt:'2026-05-15', completedAt:'2026-05-15' },
  { id:'wo8', woNum:'WO-2026-0798', equipTag:'P-101', type:'Corrective',  priority:'High',     status:'Completed',   technician:'Suresh Mehta',  downtime:5.0,  cost:22000, description:'P-101 impeller wear detected via performance degradation analysis. Impeller replaced.', createdAt:'2026-04-28', completedAt:'2026-05-02' },
];

const TIMELINE_EVENTS: Record<string, TimelineEvent[]> = {
  'P-101 Centrifugal Pump': [
    { date:'2026-06-20', type:'Corrective',  badge:'badge badge--danger',  title:'Mechanical Seal Failure', detail:'Seal replacement in progress. Product leak isolated.' },
    { date:'2026-06-05', type:'Predictive',  badge:'badge badge--warning', title:'Vibration Anomaly Detected', detail:'CBM system flagged bearing outer-race defect frequency.' },
    { date:'2026-05-02', type:'Corrective',  badge:'badge badge--danger',  title:'Impeller Replacement', detail:'Worn impeller replaced. Efficiency restored to 87%.' },
    { date:'2026-04-10', type:'Preventive',  badge:'badge badge--success', title:'Quarterly Lube Service', detail:'Bearing lubrication and oil sample analysis completed.' },
    { date:'2026-02-15', type:'Inspection',  badge:'badge badge--info',    title:'Condition Monitoring Audit', detail:'Baseline vibration signature recorded. No anomalies.' },
    { date:'2025-12-01', type:'Preventive',  badge:'badge badge--success', title:'Annual Alignment Check', detail:'Shaft alignment corrected. Coupling replaced.' },
  ],
  'V-205 Separator Vessel': [
    { date:'2026-06-17', type:'Preventive',  badge:'badge badge--success', title:'Internal Inspection Completed', detail:'UT thickness checks done. All readings within limits.' },
    { date:'2026-05-15', type:'Corrective',  badge:'badge badge--danger',  title:'Pressure Gauge Replacement', detail:'Faulty gauge replaced with calibrated instrument.' },
    { date:'2026-03-01', type:'Inspection',  badge:'badge badge--info',    title:'External Visual Inspection', detail:'Corrosion mapping completed. No critical findings.' },
    { date:'2025-12-10', type:'Preventive',  badge:'badge badge--success', title:'Safety Relief Valve Test', detail:'SRV tested at 1.1x design pressure. Passed.' },
  ],
  'C-301 Compressor': [
    { date:'2026-06-21', type:'Failure',     badge:'badge badge--danger',  title:'High Temperature Trip', detail:'Discharge temp >185°C. Emergency inspection initiated.' },
    { date:'2026-05-24', type:'Preventive',  badge:'badge badge--success', title:'Annual Overhaul Completed', detail:'Valves, piston rings, alignment — all replaced/adjusted.' },
    { date:'2026-04-01', type:'Predictive',  badge:'badge badge--warning', title:'Oil Analysis Alarm', detail:'Metal particles in lube oil. Increased monitoring interval.' },
    { date:'2026-01-15', type:'Inspection',  badge:'badge badge--info',    title:'Performance Test', detail:'Capacity 94% of design. Intercooler efficiency nominal.' },
  ],
};

const FAILURE_PATTERNS_DATA = [
  { mode: 'Seal Failure',      freq: 7, color: '#FB7185' },
  { mode: 'Bearing Defect',    freq: 5, color: '#FCD34D' },
  { mode: 'Valve Wear',        freq: 4, color: '#F97316' },
  { mode: 'Corrosion',         freq: 3, color: '#A78BFA' },
  { mode: 'Misalignment',      freq: 3, color: '#38BDF8' },
  { mode: 'Instrumentation',   freq: 2, color: '#34D399' },
  { mode: 'Overheating',       freq: 2, color: '#F43F5E' },
];

const PATTERN_ALERTS = [
  {
    icon: AlertTriangle,
    color: '#FB7185',
    title: 'P-101 Seal Failure Pattern',
    desc: 'Mechanical seal failures recurring every ~45 days on P-101. Root cause linked to process fluid contamination. 3 WOs in 6 months.',
    action: 'Upgrade to double mechanical seal with API Plan 52 barrier fluid system.',
  },
  {
    icon: Activity,
    color: '#FCD34D',
    title: 'Bearing Defects — Lubrication Related',
    desc: 'Bearing failures on rotating equipment clustered in Q1. Oil analysis shows degraded lubricant viscosity index. Pattern: 5 WOs.',
    action: 'Switch to synthetic lubricant grade ISO VG 68 EP. Reduce lube interval from 90 to 60 days.',
  },
  {
    icon: TrendingUp,
    color: '#8B5CF6',
    title: 'C-301 Compressor Temperature Trend',
    desc: 'Discharge temperature trending upward by 2°C/month over past 4 months. Predictive model projects trip event in 18±5 days.',
    action: 'Inspect intercooler fouling immediately. Clean or replace tube bundle.',
  },
];

/* ─────────────────────────────────────────────────────────────────
   BADGE HELPERS
───────────────────────────────────────────────────────────────── */
const typeBadge: Record<WOType, string> = {
  Preventive: 'badge badge--success',
  Corrective: 'badge badge--danger',
  Predictive: 'badge badge--violet',
  Emergency:  'badge badge--danger',
};
const priorityBadge: Record<WOPriority, string> = {
  Critical: 'badge badge--danger',
  High:     'badge badge--warning',
  Medium:   'badge badge--info',
  Low:      'badge badge--neutral',
};
const statusBadge: Record<WOStatus, string> = {
  'Open':        'badge badge--warning',
  'In Progress': 'badge badge--info',
  'Completed':   'badge badge--success',
  'On Hold':     'badge badge--neutral',
};

/* ─────────────────────────────────────────────────────────────────
   FIVE-WHYS RCA DATA
───────────────────────────────────────────────────────────────── */
const FIVE_WHYS = {
  equipment: 'P-101 Centrifugal Pump',
  woRef: 'WO-2026-0841',
  whys: [
    { level: 1, question: 'Why did the pump fail?',                          answer: 'The mechanical seal ruptured causing a product leak and pump shutdown.' },
    { level: 2, question: 'Why did the mechanical seal rupture?',            answer: 'The seal faces were heavily worn due to particulate contamination in the process fluid.' },
    { level: 3, question: 'Why was there particulate contamination?',        answer: 'The upstream strainer basket was not cleaned during the last three PM cycles — it was clogged and bypassed.' },
    { level: 4, question: 'Why were PM cycles missed for strainer cleaning?', answer: 'The PM task for strainer basket inspection was accidentally excluded from the revised PM template during a CMMS migration in Q4 2025.' },
    { level: 5, question: 'Why was the CMMS migration not validated?',        answer: 'No formal MOC (Management of Change) review or task checklist comparison was performed after the CMMS template migration.' },
  ],
  rootCause: 'Absence of a formal MOC process for CMMS configuration changes allowed a critical PM task (upstream strainer cleaning) to be inadvertently deleted, leading to strainer clogging, process fluid contamination, and accelerated seal wear culminating in seal failure.',
  aiConfidence: 94,
  similarWOs: 3,
  actions: [
    'Immediately restore upstream strainer cleaning task to P-101 PM template in CMMS.',
    'Conduct full audit of all PM templates modified during CMMS migration to identify other missing tasks.',
    'Implement formal MOC procedure for all CMMS configuration changes with dual approval.',
    'Upgrade P-101 to double mechanical seal with barrier fluid system to reduce contamination sensitivity.',
    'Install inline strainer differential pressure indicator to provide real-time clogging alert.',
  ],
};

/* ─────────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────────── */
const TABS = ['Work Orders', 'RCA Analysis', 'Equipment Timeline', 'Failure Patterns'] as const;
type Tab = typeof TABS[number];

export const MaintenanceIntel: React.FC = () => {
  const [activeTab, setActiveTab]       = useState<Tab>('Work Orders');
  const [selectedWO, setSelectedWO]     = useState<WorkOrder | null>(null);
  const [selectedEquip, setSelectedEquip] = useState(EQUIPMENT_OPTIONS[0]);
  const [rcaRunning, setRcaRunning]     = useState(false);
  const [rcaDone, setRcaDone]           = useState(false);
  const [expandedWhy, setExpandedWhy]   = useState<number | null>(null);

  const runRCA = () => {
    setRcaRunning(true);
    toast.loading('LangGraph 5-Whys agent running…', { id: 'rca' });
    setTimeout(() => {
      setRcaRunning(false);
      setRcaDone(true);
      setActiveTab('RCA Analysis');
      toast.success('RCA analysis complete — root cause identified', { id: 'rca', duration: 4000 });
    }, 2500);
  };

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed top-0 right-0 w-[600px] h-[600px] bg-sky-500/3 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/3 rounded-full blur-3xl" />

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wrench size={22} className="text-sky-400" />
            <h1 className="page-title">Maintenance Intelligence</h1>
          </div>
          <p className="page-subtitle">RCA agent · Work orders · Equipment timeline · AI failure pattern recognition</p>
        </div>

        {/* Equipment Selector */}
        <div className="flex items-center gap-3">
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Equipment</label>
          <div className="relative">
            <select
              value={selectedEquip}
              onChange={(e) => setSelectedEquip(e.target.value)}
              className="glass-input text-xs pr-8 appearance-none"
            >
              {EQUIPMENT_OPTIONS.map((eq) => (
                <option key={eq} value={eq}>{eq}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── TAB NAV ── */}
      <div className="glass-panel rounded-2xl p-1.5 flex gap-1 flex-wrap">
        {TABS.map((tab) => {
          const icons: Record<Tab, React.ReactNode> = {
            'Work Orders':        <Wrench size={13} />,
            'RCA Analysis':       <GitBranch size={13} />,
            'Equipment Timeline': <Activity size={13} />,
            'Failure Patterns':   <TrendingUp size={13} />,
          };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
              }`}
            >
              {icons[tab]}
              {tab}
              {tab === 'RCA Analysis' && rcaDone && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB: WORK ORDERS
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'Work Orders' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 fade-in">
          {/* Work Orders Table */}
          <div className="xl:col-span-2 glass-panel rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Hash size={15} className="text-sky-400" />
                Work Orders
              </h3>
              <button className="btn btn--secondary text-[10px]">
                <RefreshCw size={11} /> Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>WO #</th>
                    <th>Equipment</th>
                    <th>Type</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Technician</th>
                    <th>Downtime</th>
                    <th>Cost (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_WOs.map((wo) => (
                    <tr
                      key={wo.id}
                      className={selectedWO?.id === wo.id ? 'selected' : ''}
                      onClick={() => setSelectedWO(selectedWO?.id === wo.id ? null : wo)}
                    >
                      <td>
                        <span className="font-mono text-xs text-sky-400 font-bold">{wo.woNum}</span>
                      </td>
                      <td>
                        <span className="font-mono text-xs font-bold text-slate-200">{wo.equipTag}</span>
                      </td>
                      <td><span className={typeBadge[wo.type]}>{wo.type}</span></td>
                      <td><span className={priorityBadge[wo.priority]}>{wo.priority}</span></td>
                      <td><span className={statusBadge[wo.status]}>{wo.status}</span></td>
                      <td className="text-xs text-slate-300">{wo.technician}</td>
                      <td>
                        <span className={`text-xs font-mono font-bold ${wo.downtime > 8 ? 'text-rose-400' : wo.downtime > 4 ? 'text-amber-400' : 'text-slate-300'}`}>
                          {wo.downtime}h
                        </span>
                      </td>
                      <td className="text-xs font-mono text-emerald-400">
                        ₹{wo.cost.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary row */}
            <div className="pt-4 border-t border-slate-800/40 grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total WOs</p>
                <p className="text-xl font-black text-slate-200 font-mono">{MOCK_WOs.length}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total Downtime</p>
                <p className="text-xl font-black text-rose-400 font-mono">
                  {MOCK_WOs.reduce((a, w) => a + w.downtime, 0)}h
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total Cost</p>
                <p className="text-xl font-black text-emerald-400 font-mono">
                  ₹{MOCK_WOs.reduce((a, w) => a + w.cost, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* WO Detail Panel */}
          <div className="xl:col-span-1">
            {selectedWO ? (
              <div className="glass-panel rounded-2xl p-5 space-y-5 slide-in-right">
                <div className="flex items-start justify-between border-b border-slate-800/50 pb-4">
                  <div>
                    <span className="font-mono text-[10px] text-sky-400 font-bold">{selectedWO.woNum}</span>
                    <h4 className="text-sm font-bold text-slate-100 mt-1">{selectedWO.equipTag}</h4>
                  </div>
                  <button onClick={() => setSelectedWO(null)} className="text-slate-500 hover:text-slate-300">
                    <X size={14} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={typeBadge[selectedWO.type]}>{selectedWO.type}</span>
                  <span className={priorityBadge[selectedWO.priority]}>{selectedWO.priority}</span>
                  <span className={statusBadge[selectedWO.status]}>{selectedWO.status}</span>
                </div>

                <div>
                  <p className="section-header">Description</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/30 p-3 rounded-xl border border-slate-800/40">
                    {selectedWO.description}
                  </p>
                </div>

                <table className="spec-table">
                  <tbody>
                    <tr><td>Technician</td><td>{selectedWO.technician}</td></tr>
                    <tr><td>Created</td><td>{selectedWO.createdAt}</td></tr>
                    {selectedWO.completedAt && <tr><td>Completed</td><td>{selectedWO.completedAt}</td></tr>}
                    <tr><td>Downtime</td><td>{selectedWO.downtime}h</td></tr>
                    <tr><td>Cost</td><td>₹{selectedWO.cost.toLocaleString()}</td></tr>
                  </tbody>
                </table>

                <button
                  className="btn btn--primary w-full"
                  onClick={runRCA}
                  disabled={rcaRunning}
                >
                  {rcaRunning ? (
                    <><Loader2 size={13} className="animate-spin" /> Running 5-Whys RCA…</>
                  ) : (
                    <><Play size={13} /> Run 5-Whys RCA</>
                  )}
                </button>
                {rcaDone && (
                  <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-xl">
                    <CheckCircle2 size={13} /> RCA complete — view in RCA Analysis tab
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-panel rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3 h-64">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/30 flex items-center justify-center">
                  <Wrench size={20} className="text-slate-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-300">Work Order Detail</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Click any row to view details and run RCA analysis</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: RCA ANALYSIS
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'RCA Analysis' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 fade-in">
          {/* 5-Whys Tree */}
          <div className="xl:col-span-2 glass-panel rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-header flex items-center gap-1.5"><Brain size={11} /> LangGraph 5-Whys Analysis</p>
                <h3 className="text-sm font-bold text-slate-100">{FIVE_WHYS.equipment}</h3>
                <p className="text-[10px] text-slate-500 font-mono">{FIVE_WHYS.woRef}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge--success">Analysis Complete</span>
                <span className="badge badge--violet">AI Confidence: {FIVE_WHYS.aiConfidence}%</span>
              </div>
            </div>

            {/* Why Steps */}
            <div className="space-y-3 relative">
              <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-sky-500/40 via-violet-500/30 to-transparent" />
              {FIVE_WHYS.whys.map((why) => (
                <div
                  key={why.level}
                  className="relative pl-12 cursor-pointer"
                  onClick={() => setExpandedWhy(expandedWhy === why.level ? null : why.level)}
                >
                  {/* Level dot */}
                  <div
                    className="absolute left-0 top-3 w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-black"
                    style={{
                      borderColor: `hsl(${200 + why.level * 15}, 80%, 60%)`,
                      background: `hsla(${200 + why.level * 15}, 80%, 60%, 0.1)`,
                      color: `hsl(${200 + why.level * 15}, 80%, 70%)`,
                    }}
                  >
                    {why.level}
                  </div>

                  <div className={`glass-card-static rounded-xl p-4 border transition-all ${
                    expandedWhy === why.level ? 'border-sky-500/30 bg-sky-500/5' : ''
                  }`}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-200">{why.question}</p>
                      <ChevronRight
                        size={14}
                        className={`text-slate-500 transition-transform ${expandedWhy === why.level ? 'rotate-90' : ''}`}
                      />
                    </div>
                    {expandedWhy === why.level && (
                      <div className="mt-3 pt-3 border-t border-slate-800/50 fade-in">
                        <div className="flex gap-2">
                          <ChevronRight size={13} className="text-sky-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-slate-300 leading-relaxed">{why.answer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Root Cause */}
              <div className="relative pl-12">
                <div className="absolute left-0 top-3 w-10 h-10 rounded-full border-2 border-rose-400 bg-rose-500/10 flex items-center justify-center">
                  <AlertTriangle size={14} className="text-rose-400" />
                </div>
                <div className="glass-card-static rounded-xl p-4 border border-rose-500/20 bg-rose-500/5">
                  <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest mb-1">Root Cause Identified</p>
                  <p className="text-xs text-slate-200 leading-relaxed">{FIVE_WHYS.rootCause}</p>
                </div>
              </div>
            </div>

            {/* Similar WOs */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/40">
              <Tag size={12} className="text-violet-400" />
              <span className="text-[11px] text-slate-400">
                Similar work orders found: <span className="text-violet-400 font-bold">{FIVE_WHYS.similarWOs} WOs</span> with matching failure pattern in past 12 months
              </span>
            </div>
          </div>

          {/* Corrective Actions + Confidence */}
          <div className="xl:col-span-1 space-y-4">
            {/* AI Confidence */}
            <div className="glass-panel rounded-2xl p-5 space-y-3">
              <p className="section-header flex items-center gap-1.5"><Brain size={11} /> AI Confidence</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-violet-400 font-mono">{FIVE_WHYS.aiConfidence}%</span>
                <span className="text-[10px] text-slate-500 mb-1">root cause certainty</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar__fill"
                  style={{ width: `${FIVE_WHYS.aiConfidence}%`, background: 'linear-gradient(90deg, #8B5CF6, #0EA5E9)' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="glass-card-static rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-500">Similar WOs</p>
                  <p className="text-2xl font-black text-sky-400 font-mono">{FIVE_WHYS.similarWOs}</p>
                </div>
                <div className="glass-card-static rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-500">Whys Traced</p>
                  <p className="text-2xl font-black text-emerald-400 font-mono">5</p>
                </div>
              </div>
            </div>

            {/* Corrective Actions */}
            <div className="glass-panel rounded-2xl p-5 space-y-3">
              <p className="section-header flex items-center gap-1.5"><Zap size={11} /> Recommended Corrective Actions</p>
              <div className="space-y-2">
                {FIVE_WHYS.actions.map((action, i) => (
                  <div key={i} className="flex gap-2.5 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[9px] font-black text-emerald-400 shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-[10px] text-slate-300 leading-relaxed">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: EQUIPMENT TIMELINE
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'Equipment Timeline' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 fade-in">
          <div className="xl:col-span-2 glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-header flex items-center gap-1.5"><Calendar size={11} /> Maintenance Timeline</p>
                <h3 className="text-sm font-bold text-slate-100">{selectedEquip}</h3>
              </div>
              <span className="badge badge--info">{(TIMELINE_EVENTS[selectedEquip] || []).length} Events</span>
            </div>

            <div className="relative space-y-0 pt-2">
              {(TIMELINE_EVENTS[selectedEquip] || []).map((ev, i) => {
                const isLast = i === (TIMELINE_EVENTS[selectedEquip] || []).length - 1;
                return (
                  <div key={i} className="timeline-item">
                    <div className={`timeline-dot ${
                      ev.type === 'Corrective' || ev.type === 'Failure' ? 'border-rose-400' :
                      ev.type === 'Preventive'  ? 'border-emerald-400' :
                      ev.type === 'Predictive'  ? 'border-violet-400'  : 'border-sky-400'
                    }`} />
                    <div className={`glass-card-static rounded-xl p-4 ml-2 border transition-all hover:border-slate-700`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] text-slate-500 font-mono">{ev.date}</span>
                            <span className={ev.badge}>{ev.type}</span>
                          </div>
                          <p className="text-xs font-bold text-slate-200">{ev.title}</p>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{ev.detail}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Equipment Summary */}
          <div className="xl:col-span-1 glass-panel rounded-2xl p-5 space-y-5">
            <p className="section-header">Equipment Health Summary</p>
            <div className="space-y-4">
              {[
                { label: 'Overall Health', value: 72, color: '#FCD34D', unit: '%' },
                { label: 'Availability',   value: 88, color: '#34D399', unit: '%' },
                { label: 'MTBF',           value: 45, color: '#38BDF8', unit: 'd' },
                { label: 'MTTR',           value: 6,  color: '#A78BFA', unit: 'h' },
              ].map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] text-slate-400">{m.label}</span>
                    <span className="text-xs font-bold font-mono" style={{ color: m.color }}>
                      {m.value}{m.unit}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar__fill" style={{ width: `${Math.min(m.value, 100)}%`, background: m.color }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800/40 space-y-2">
              <p className="section-header">Next Scheduled PM</p>
              <div className="glass-card-static rounded-xl p-3">
                <p className="text-xs text-slate-200 font-medium">Quarterly Lube Service</p>
                <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <Calendar size={10} /> 2026-09-10
                </p>
              </div>
              <div className="glass-card-static rounded-xl p-3">
                <p className="text-xs text-slate-200 font-medium">Annual Overhaul</p>
                <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <Calendar size={10} /> 2026-12-01
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: FAILURE PATTERNS
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'Failure Patterns' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 fade-in">
          {/* Bar Chart */}
          <div className="xl:col-span-2 glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-header">Top Failure Modes by Frequency</p>
                <p className="text-xs text-slate-400">Last 12 months · All equipment</p>
              </div>
              <span className="badge badge--violet">AI Pattern Engine</span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={FAILURE_PATTERNS_DATA}
                  layout="vertical"
                  margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,80,140,0.15)" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: '#475569', fontSize: 10 }}
                    axisLine={{ stroke: 'rgba(56,80,140,0.2)' }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="mode"
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={110}
                  />
                  <ReTooltip
                    contentStyle={{
                      background: '#0D1220',
                      border: '1px solid rgba(56,80,140,0.3)',
                      borderRadius: 10,
                      fontSize: 11,
                      color: '#E2E8F0',
                    }}
                    formatter={(v: any) => [`${v} occurrences`, 'Frequency']}
                  />
                  <Bar dataKey="freq" radius={[0, 6, 6, 0]}>
                    {FAILURE_PATTERNS_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Pattern Alerts */}
          <div className="xl:col-span-1 space-y-4">
            <p className="section-header flex items-center gap-1.5"><Brain size={11} /> AI Pattern Alerts</p>
            {PATTERN_ALERTS.map((alert, i) => {
              const Icon = alert.icon;
              return (
                <div key={i} className="glass-panel rounded-2xl p-4 space-y-3" style={{ borderColor: `${alert.color}20` }}>
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${alert.color}15`, border: `1px solid ${alert.color}25` }}
                    >
                      <Icon size={14} style={{ color: alert.color }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">{alert.title}</p>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{alert.desc}</p>
                    </div>
                  </div>
                  <div className="bg-slate-950/30 border border-slate-800/40 rounded-xl p-3 flex gap-2">
                    <Zap size={11} className="shrink-0 mt-0.5" style={{ color: alert.color }} />
                    <p className="text-[10px] text-slate-300 leading-relaxed">{alert.action}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceIntel;
