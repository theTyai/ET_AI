import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { plantApi } from '../api/plant.api';
import { useNotificationStore } from '../store/notification.store';
import {
  FileText, ClipboardList, Percent, TrendingDown, Upload, QrCode, Sparkles,
  ArrowRight, Flame, Activity, ShieldCheck, Zap, TrendingUp, Clock,
  AlertTriangle, CheckCircle2, RefreshCw, Database, GitBranch, Cpu,
  BarChart3, Layers, Eye, ChevronRight, Server, Radio
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

/* ── Tiny sparkline data ─────────────────────────────────── */
const sparklineBase = [3, 7, 5, 9, 4, 8, 6, 11, 8, 12, 9, 14];

const trendData6M = [
  { name: 'Jan', Downtime: 45, WOs: 12, Compliance: 82 },
  { name: 'Feb', Downtime: 38, WOs: 9,  Compliance: 84 },
  { name: 'Mar', Downtime: 65, WOs: 18, Compliance: 79 },
  { name: 'Apr', Downtime: 24, WOs: 7,  Compliance: 88 },
  { name: 'May', Downtime: 18, WOs: 5,  Compliance: 91 },
  { name: 'Jun', Downtime: 12, WOs: 4,  Compliance: 94 },
];

const complianceMatrix = [
  { code: 'OISD-118 §4.1', status: 'Compliant',    desc: 'Layout safety spacing',       regulation: 'OISD' },
  { code: 'OISD-118 §4.2', status: 'Partially',    desc: 'Piping clearance limits',     regulation: 'OISD' },
  { code: 'OISD-118 §4.3', status: 'Compliant',    desc: 'Safety isolation valves',     regulation: 'OISD' },
  { code: 'PESO R.7',      status: 'NonCompliant',  desc: 'Explosion barrier codes',     regulation: 'PESO' },
  { code: 'PESO R.8',      status: 'Compliant',     desc: 'Pressure testing certs',      regulation: 'PESO' },
  { code: 'Factory §7',    status: 'Compliant',     desc: 'Occupational hygiene',        regulation: 'Factory Act' },
  { code: 'Factory §12',   status: 'Partially',     desc: 'Ventilation exhausts',        regulation: 'Factory Act' },
  { code: 'MoEF GT-2',    status: 'Compliant',     desc: 'Emission telemetry',          regulation: 'MoEF' },
];

const systemActivity = [
  { time: '14:32', event: 'Document ingested into Knowledge Graph', type: 'success', detail: 'SOP-MAINT-007.pdf → 84 chunks, 23 entities' },
  { time: '14:18', event: 'Compliance scan completed for OISD-118', type: 'warning', detail: '2 new gaps detected in Unit-3 procedures' },
  { time: '13:55', event: 'RCA Agent completed analysis WO-2024-0342', type: 'success', detail: 'Root cause: Bearing lubrication failure (Confidence: 87%)' },
  { time: '13:40', event: 'Neo4j KG synced — 12 new relationships', type: 'info',    detail: 'Equipment P-101 → WorkOrder → FailureMode nodes linked' },
  { time: '13:12', event: 'Lessons engine pattern detected', type: 'danger',  detail: 'Recurring cavitation in pump class — 3rd occurrence this month' },
  { time: '12:58', event: 'Qdrant vector index updated', type: 'info',    detail: '340 new vectors inserted — ikip_chunks collection' },
];

const serviceHealth = [
  { name: 'MongoDB Atlas',   status: 'online',  latency: '8ms',  icon: Database },
  { name: 'Neo4j Aura',      status: 'online',  latency: '22ms', icon: GitBranch },
  { name: 'Qdrant Cloud',    status: 'online',  latency: '11ms', icon: Layers },
  { name: 'AI Services',     status: 'online',  latency: '145ms',icon: Cpu },
  { name: 'BullMQ Workers',  status: 'online',  latency: '—',    icon: Server },
  { name: 'Socket.IO Hub',   status: 'online',  latency: '14ms', icon: Radio },
];

/* ── Custom Tooltip ───────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel rounded-xl px-4 py-3 text-xs shadow-2xl border-[rgba(56,80,140,0.4)]">
      <div className="font-bold text-[#E2E8F0] mb-2">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-[#94A3B8]">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span>{p.name}:</span>
          <span className="text-[#E2E8F0] font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ── Sparkline mini chart ─────────────────────────────────── */
const Sparkline: React.FC<{ data: number[], color: string }> = ({ data, color }) => (
  <svg viewBox={`0 0 ${data.length * 8} 24`} className="w-16 h-6 opacity-60">
    <polyline
      points={data.map((v, i) => `${i * 8},${24 - (v / Math.max(...data)) * 22}`).join(' ')}
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ── Activity type styling ────────────────────────────────── */
const activityStyles: Record<string, { dot: string, bg: string, icon: React.FC<any> }> = {
  success: { dot: 'bg-emerald-400 border-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  warning: { dot: 'bg-amber-400 border-amber-400',    bg: 'bg-amber-500/10 border-amber-500/20',    icon: AlertTriangle },
  danger:  { dot: 'bg-rose-400 border-rose-400 animate-pulse', bg: 'bg-rose-500/10 border-rose-500/20', icon: AlertTriangle },
  info:    { dot: 'bg-sky-400 border-sky-400',        bg: 'bg-sky-500/10 border-sky-500/20',        icon: Activity },
};

/* ═══════════════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════════════ */
export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<any>({ downtime: 0, openWOs: 0, complianceScore: 94, docsIngested: 0 });
  const [loading, setLoading] = useState(true);
  const liveAlerts = useNotificationStore((state) => state.alerts);
  const dismissAlert = useNotificationStore((state) => state.dismissAlert);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const kpiRes = await plantApi.getKPIs();
        if (kpiRes.success) setKpis(kpiRes.data);
      } catch (_) {
        // use default demo values
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeAlerts = liveAlerts.filter((a) => !a.dismissed);

  /* KPI card definitions */
  const kpiCards = [
    {
      label: 'Documents Ingested',
      value: kpis.docsIngested || 142,
      unit: '',
      delta: '+18 this week',
      trend: 'up',
      color: 'sky',
      icon: FileText,
      subtext: 'Parsed into Neo4j',
      sparkColor: '#0EA5E9',
    },
    {
      label: 'Open Work Orders',
      value: kpis.openWOs || 23,
      unit: '',
      delta: '5 Emergency priority',
      trend: 'neutral',
      color: 'amber',
      icon: ClipboardList,
      subtext: 'Corrective & Preventive',
      sparkColor: '#F59E0B',
    },
    {
      label: 'Compliance Score',
      value: kpis.complianceScore || 94,
      unit: '%',
      delta: '+2% vs last month',
      trend: 'up',
      color: 'emerald',
      icon: ShieldCheck,
      subtext: 'OISD · PESO · Factory Act',
      sparkColor: '#10B981',
    },
    {
      label: 'Downtime Hours',
      value: kpis.downtime || 12,
      unit: 'h',
      delta: '−47% vs last month',
      trend: 'down_good',
      color: 'rose',
      icon: TrendingDown,
      subtext: 'Corrective failure impact',
      sparkColor: '#F43F5E',
    },
    {
      label: 'KG Entities Linked',
      value: 3847,
      unit: '',
      delta: '+234 from last upload',
      trend: 'up',
      color: 'violet',
      icon: GitBranch,
      subtext: 'Equipment · Docs · Clauses',
      sparkColor: '#8B5CF6',
    },
    {
      label: 'Vector Chunks',
      value: 18204,
      unit: '',
      delta: 'Qdrant ikip_chunks',
      trend: 'neutral',
      color: 'cyan',
      icon: Layers,
      subtext: 'Dense + BM25 indexed',
      sparkColor: '#06B6D4',
    },
  ];

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp size={10} className="text-emerald-400" />;
    if (trend === 'down_good') return <TrendingDown size={10} className="text-emerald-400" />;
    if (trend === 'down_bad') return <TrendingDown size={10} className="text-rose-400" />;
    return <Activity size={10} className="text-slate-400" />;
  };

  const getComplianceCellStyle = (status: string) => {
    if (status === 'Compliant')    return 'compliance-cell compliance-cell--compliant';
    if (status === 'Partially')   return 'compliance-cell compliance-cell--partial';
    if (status === 'NonCompliant') return 'compliance-cell compliance-cell--noncompliant';
    return 'compliance-cell compliance-cell--notassessed';
  };

  return (
    <div className="p-5 space-y-6 min-h-screen relative fade-in">

      {/* ── Page Header ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Command Center</h1>
          <p className="page-subtitle">Real-time intelligence feeds • Plant Unit-3 • {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/documents')} className="btn btn--secondary">
            <Upload size={13} />
            Upload SOP
          </button>
          <button onClick={() => navigate('/scanner')} className="btn btn--secondary">
            <QrCode size={13} />
            Scan Tag
          </button>
          <button
            onClick={() => navigate('/copilot')}
            className="btn btn--primary"
            style={{ boxShadow: '0 4px 16px rgba(14,165,233,0.25)' }}
          >
            <Sparkles size={13} />
            Ask AI Copilot
          </button>
        </div>
      </div>

      {/* ── KPI Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`kpi-card kpi-card--${card.color}`}>
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg bg-${card.color === 'sky' ? 'sky' : card.color === 'emerald' ? 'emerald' : card.color === 'amber' ? 'amber' : card.color === 'rose' ? 'rose' : card.color === 'violet' ? 'violet' : 'cyan'}-500/10 border border-${card.color === 'sky' ? 'sky' : card.color === 'emerald' ? 'emerald' : card.color === 'amber' ? 'amber' : card.color === 'rose' ? 'rose' : card.color === 'violet' ? 'violet' : 'cyan'}-500/20`}>
                  <Icon size={14} className={`text-${card.color === 'sky' ? 'sky' : card.color === 'emerald' ? 'emerald' : card.color === 'amber' ? 'amber' : card.color === 'rose' ? 'rose' : card.color === 'violet' ? 'violet' : 'cyan'}-400`} />
                </div>
                <Sparkline data={sparklineBase} color={card.sparkColor} />
              </div>

              <div>
                <div className="text-[9px] font-bold text-[#475569] uppercase tracking-[0.08em] leading-tight">{card.label}</div>
                <div className="text-2xl font-black text-[#E2E8F0] font-mono leading-tight mt-0.5">
                  {loading ? <span className="shimmer h-7 w-12 block rounded" /> : `${card.value}${card.unit}`}
                </div>
              </div>

              <div className="flex items-center gap-1 mt-2">
                {getTrendIcon(card.trend)}
                <span className="text-[9px] text-[#64748B]">{card.delta}</span>
              </div>
              <div className="text-[8px] text-[#334155] mt-0.5">{card.subtext}</div>
            </div>
          );
        })}
      </div>

      {/* ── Main Grid: Charts + Alerts ───────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Left: Charts Column */}
        <div className="xl:col-span-2 space-y-5">

          {/* Failure Impact Timeline */}
          <div className="glass-card-static rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 size={14} className="text-[#0EA5E9]" />
                  <h3 className="text-sm font-bold text-[#E2E8F0]">Failure Impact Timeline</h3>
                </div>
                <p className="text-[10px] text-[#475569] mt-0.5">Rolling 6-month downtime hours & corrective WO trend</p>
              </div>
              <span className="badge badge--info">6-Month View</span>
            </div>

            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData6M} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="gradDowntime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0EA5E9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradCompliance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10B981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,80,140,0.15)" vertical={false} />
                  <XAxis dataKey="name" stroke="#334155" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#334155" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Downtime" name="Downtime (hrs)" stroke="#0EA5E9" strokeWidth={2} fill="url(#gradDowntime)" dot={{ fill: '#0EA5E9', r: 3 }} />
                  <Area type="monotone" dataKey="Compliance" name="Compliance %" stroke="#10B981" strokeWidth={2} fill="url(#gradCompliance)" dot={{ fill: '#10B981', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Compliance Matrix Heatmap */}
          <div className="glass-card-static rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-[#0EA5E9]" />
                  <h3 className="text-sm font-bold text-[#E2E8F0]">Regulatory Compliance Matrix</h3>
                </div>
                <p className="text-[10px] text-[#475569] mt-0.5">OISD-118 · PESO · Factory Act · MoEF — click to view gap details</p>
              </div>
              <button onClick={() => navigate('/compliance')} className="btn btn--secondary text-[10px]">
                Full Radar <ArrowRight size={10} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {complianceMatrix.map((cell, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate('/compliance')}
                  className={`${getComplianceCellStyle(cell.status)} h-[72px] flex flex-col justify-between`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] font-bold font-mono truncate">{cell.code}</span>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      cell.status === 'Compliant' ? 'bg-emerald-400' :
                      cell.status === 'Partially' ? 'bg-amber-400' :
                      'bg-rose-400 animate-pulse'
                    }`} />
                  </div>
                  <div>
                    <div className="text-[8px] text-[#475569] truncate">{cell.desc}</div>
                    <div className="text-[8px] font-extrabold uppercase tracking-wider mt-0.5">
                      {cell.status === 'NonCompliant' ? 'Non-Compliant' : cell.status}
                    </div>
                  </div>
                  <div className="text-[7px] text-[#334155] font-medium">{cell.regulation}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Service Health Grid */}
          <div className="glass-card-static rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Server size={14} className="text-[#0EA5E9]" />
              <h3 className="text-sm font-bold text-[#E2E8F0]">Infrastructure Health</h3>
              <span className="badge badge--success ml-auto">All Systems Nominal</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {serviceHealth.map((svc) => {
                const SvcIcon = svc.icon;
                return (
                  <div key={svc.name} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[rgba(5,10,25,0.5)] border border-[rgba(56,80,140,0.2)]">
                    <div className="p-1.5 rounded-lg bg-[rgba(14,165,233,0.08)]">
                      <SvcIcon size={12} className="text-[#0EA5E9]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[9px] font-semibold text-[#CBD5E1] truncate">{svc.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-400" />
                        <span className="text-[8px] text-[#475569]">{svc.latency}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Alerts + Activity Column */}
        <div className="space-y-5">

          {/* AI Real-Time Alert Feed */}
          <div className="glass-card-static rounded-2xl p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Flame size={14} className="text-amber-400" style={{ filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.5))' }} />
              <h3 className="text-sm font-bold text-[#E2E8F0]">AI Alert Feed</h3>
              {activeAlerts.length > 0 && (
                <span className="badge badge--danger ml-auto">{activeAlerts.length} Active</span>
              )}
            </div>

            <div className="space-y-2.5 flex-1">
              {activeAlerts.length === 0 ? (
                <div className="py-10 text-center">
                  <CheckCircle2 size={28} className="text-emerald-400/30 mx-auto mb-2" />
                  <div className="text-xs text-[#334155]">All clear — no active alerts</div>
                  <div className="text-[10px] text-[#1E293B] mt-1">Plant operating within normal limits</div>
                </div>
              ) : (
                activeAlerts.slice(0, 4).map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-xl border ${
                      alert.urgency === 'Critical'
                        ? 'bg-rose-500/5 border-rose-500/20'
                        : 'bg-amber-500/5 border-amber-500/20'
                    } group relative`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className={`badge ${alert.urgency === 'Critical' ? 'badge--danger' : 'badge--warning'}`}>
                        {alert.urgency || 'High'}
                      </span>
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="text-[#334155] hover:text-[#64748B] opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                    <div className="text-xs font-semibold text-[#E2E8F0] flex items-center gap-1.5 mt-1">
                      <Zap size={10} className={alert.urgency === 'Critical' ? 'text-rose-400' : 'text-amber-400'} />
                      {alert.title}
                    </div>
                    <p className="text-[10px] text-[#64748B] mt-1 leading-relaxed line-clamp-2">{alert.message}</p>
                    <div className="text-[9px] text-[#334155] mt-1.5 font-mono flex items-center gap-1">
                      <Clock size={8} />
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button onClick={() => navigate('/compliance')} className="btn btn--secondary w-full mt-3 text-[10px]">
              <Eye size={11} />
              View Compliance Radar
              <ChevronRight size={10} />
            </button>
          </div>

          {/* System Activity Timeline */}
          <div className="glass-card-static rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={14} className="text-[#6366F1]" />
              <h3 className="text-sm font-bold text-[#E2E8F0]">System Activity</h3>
              <button
                onClick={() => window.location.reload()}
                className="ml-auto text-[#334155] hover:text-[#64748B] transition-colors"
                title="Refresh"
              >
                <RefreshCw size={12} />
              </button>
            </div>

            <div className="space-y-0">
              {systemActivity.map((item, idx) => {
                const style = activityStyles[item.type];
                const Icon = style.icon;
                return (
                  <div key={idx} className="timeline-item">
                    <div className={`timeline-dot ${style.dot}`} />
                    <div className={`p-2.5 rounded-lg border ${style.bg} text-[10px]`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-[#CBD5E1] flex items-center gap-1.5 flex-1 min-w-0">
                          <Icon size={9} className="flex-shrink-0" />
                          <span className="truncate">{item.event}</span>
                        </div>
                        <span className="text-[8px] text-[#334155] font-mono flex-shrink-0">{item.time}</span>
                      </div>
                      <p className="text-[9px] text-[#475569] mt-1 leading-relaxed">{item.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick navigate to AI services */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => navigate('/kg')} className="btn btn--secondary text-[10px]">
                <GitBranch size={10} />
                Knowledge Graph
              </button>
              <button onClick={() => navigate('/documents')} className="btn btn--secondary text-[10px]">
                <FileText size={10} />
                Document Library
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
