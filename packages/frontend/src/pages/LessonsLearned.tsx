import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, AlertTriangle, TrendingUp, Zap, Filter, Search, ExternalLink,
  Clock, ChevronRight, Lightbulb, BarChart3, RefreshCw, GitBranch
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

/* ── Mock Data ───────────────────────────────────────────── */
const PATTERNS = [
  {
    id: 'P001',
    tag: 'Recurring Cavitation',
    urgency: 'Critical',
    type: 'Failure Pattern',
    detectedAt: '2026-06-22T14:12:00Z',
    description: 'Cavitation pattern detected in centrifugal pump class across Unit-3. Third occurrence this month, indicating systemic suction pressure deficit.',
    affectedEquipment: ['P-101', 'P-102', 'P-105'],
    sourceIncidents: ['INC-2023-089', 'INC-2024-012', 'INC-2024-031'],
    aiConfidence: 91,
    recommendation: 'Review suction line design and NPSH margins. Inspect impeller wear rings on P-101, P-102, P-105 immediately.',
    regulation: 'OISD-118 §6.2',
    frequency: 3,
  },
  {
    id: 'P002',
    tag: 'Bearing Failure Cluster',
    urgency: 'High',
    type: 'Failure Pattern',
    detectedAt: '2026-06-21T09:30:00Z',
    description: 'Premature bearing failures detected in rotating machinery across 6-month window. Lubrication intervals may be insufficient for current operating loads.',
    affectedEquipment: ['C-301', 'P-101'],
    sourceIncidents: ['INC-2024-007', 'INC-2024-019'],
    aiConfidence: 84,
    recommendation: 'Reduce lubrication interval from 2000h to 1500h. Consider synthetic lubricant upgrade for high-load compressor C-301.',
    regulation: null,
    frequency: 2,
  },
  {
    id: 'P003',
    tag: 'Gasket Degradation — High Temp',
    urgency: 'Medium',
    type: 'Material Pattern',
    detectedAt: '2026-06-20T16:00:00Z',
    description: 'Rapid gasket degradation identified in high-temperature piping joints above 250°C. Spiral wound gaskets showing premature failure in 4 incidents.',
    affectedEquipment: ['V-205', 'HE-401'],
    sourceIncidents: ['INC-2024-003', 'INC-2024-022', 'INC-2024-028', 'INC-2024-033'],
    aiConfidence: 79,
    recommendation: 'Upgrade to metallic ring-type joint (RTJ) gaskets for temperature >250°C service. ASME B16.20 compliant.',
    regulation: 'OISD-118 §8.4',
    frequency: 4,
  },
  {
    id: 'P004',
    tag: 'Instrument Loop Drift',
    urgency: 'Low',
    type: 'Instrument Pattern',
    detectedAt: '2026-06-18T11:00:00Z',
    description: 'Flow transmitter FT-201 and PT-301 showing calibration drift beyond ±0.5% over 90-day intervals. Pattern suggests humidity ingress affecting sensing elements.',
    affectedEquipment: ['FT-201', 'PT-301'],
    sourceIncidents: ['INC-2023-104', 'INC-2024-014'],
    aiConfidence: 72,
    recommendation: 'Implement IP67 transmitter housing upgrades. Reduce calibration cycle to 60 days for both instruments.',
    regulation: null,
    frequency: 2,
  },
];

const FREQUENCY_DATA = [
  { name: 'Cavitation', count: 3, fill: '#F43F5E' },
  { name: 'Bearing Fail', count: 2, fill: '#F59E0B' },
  { name: 'Gasket Degrade', count: 4, fill: '#F59E0B' },
  { name: 'Inst Drift', count: 2, fill: '#06B6D4' },
  { name: 'Corrosion', count: 1, fill: '#475569' },
  { name: 'Vibration', count: 1, fill: '#475569' },
];

const LESSONS = [
  {
    id: 'LL-001',
    title: 'Hydraulic overloading of centrifugal pumps in parallel operation',
    source: 'WO-2024-0289',
    category: 'Mechanical',
    severity: 'High',
    lesson: 'When operating pumps P-101 and P-102 in parallel, ensure combined flow does not exceed system curve limits. Auto-recirculation valves must be checked before manual override.',
    reviewedBy: 'Sr. Engineer Patel',
    date: '2026-05-15',
  },
  {
    id: 'LL-002',
    title: 'PESO permit-to-work compliance gap during hot work operations',
    source: 'INC-2024-007',
    category: 'Safety/Compliance',
    severity: 'Critical',
    lesson: 'Hot work permits under PESO 2016 require an additional witness sign-off for operations within 15m of hydrocarbon-bearing lines. Update PTW procedure SOP-SAFE-003 immediately.',
    reviewedBy: 'Safety Officer Mehta',
    date: '2026-05-08',
  },
  {
    id: 'LL-003',
    title: 'Vibration analysis frequency optimization for predictive maintenance',
    source: 'WO-2024-0201',
    category: 'Predictive Maintenance',
    severity: 'Medium',
    lesson: 'Quarterly vibration analysis missed early-stage bearing degradation on C-301. Moving to monthly analysis with ISO 10816-3 thresholds reduced unexpected failures by 40%.',
    reviewedBy: 'Reliability Eng. Sharma',
    date: '2026-04-22',
  },
];

const urgencyConfig: Record<string, { dot: string, badge: string }> = {
  Critical: { dot: 'bg-rose-400 animate-pulse', badge: 'badge badge--danger' },
  High:     { dot: 'bg-amber-400',              badge: 'badge badge--warning' },
  Medium:   { dot: 'bg-sky-400',                badge: 'badge badge--info' },
  Low:      { dot: 'bg-slate-400',              badge: 'badge badge--neutral' },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel rounded-xl px-4 py-3 text-xs shadow-2xl border-[rgba(56,80,140,0.4)]">
      <div className="font-bold text-[#E2E8F0] mb-1">{label}</div>
      <div className="text-[#94A3B8]">Incidents: <span className="text-[#E2E8F0] font-bold">{payload[0].value}</span></div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   LESSONS LEARNED PAGE
   ═══════════════════════════════════════════════════════════ */
export const LessonsLearned: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedPattern, setSelectedPattern] = useState(PATTERNS[0]);
  const [activeTab, setActiveTab] = useState<'patterns' | 'lessons'>('patterns');
  const [filterUrgency, setFilterUrgency] = useState<string>('All');

  const filteredPatterns = PATTERNS.filter((p) => {
    const matchSearch = p.tag.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterUrgency === 'All' || p.urgency === filterUrgency;
    return matchSearch && matchFilter;
  });

  return (
    <div className="p-5 space-y-5 min-h-screen fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Lessons Learned Engine</h1>
          <p className="page-subtitle">AI-powered failure pattern mining & institutional knowledge capture</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn--secondary">
            <RefreshCw size={12} />
            Rerun Analysis
          </button>
          <button className="btn btn--primary">
            <BookOpen size={12} />
            Export Library
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active Patterns', value: 4, color: 'rose', icon: AlertTriangle },
          { label: 'Lessons Captured', value: 23, color: 'violet', icon: BookOpen },
          { label: 'Equipment Affected', value: 8, color: 'amber', icon: Zap },
          { label: 'AI Confidence Avg', value: '81%', color: 'emerald', icon: TrendingUp },
        ].map((kpi) => {
          const Icon = kpi.icon;
          const colorMap: any = {
            rose: { icon: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
            violet: { icon: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
            amber: { icon: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
            emerald: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          };
          return (
            <div key={kpi.label} className="glass-card-static rounded-2xl p-4">
              <div className={`p-1.5 rounded-lg w-fit ${colorMap[kpi.color].bg} mb-2`}>
                <Icon size={14} className={colorMap[kpi.color].icon} />
              </div>
              <div className="text-2xl font-black text-[#E2E8F0] font-mono">{kpi.value}</div>
              <div className="text-[9px] text-[#475569] uppercase tracking-wider font-bold mt-0.5">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-[rgba(5,10,25,0.6)] rounded-xl border border-[rgba(56,80,140,0.2)] w-fit">
        {(['patterns', 'lessons'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all capitalize ${
              activeTab === tab
                ? 'bg-[rgba(14,165,233,0.12)] text-[#38BDF8] border border-[rgba(14,165,233,0.25)]'
                : 'text-[#475569] hover:text-[#94A3B8]'
            }`}
          >
            {tab === 'patterns' ? 'AI Pattern Alerts' : 'Lessons Library'}
          </button>
        ))}
      </div>

      {activeTab === 'patterns' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* Left: Pattern list + frequency chart */}
          <div className="space-y-5">
            {/* Frequency Bar Chart */}
            <div className="glass-card-static rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={14} className="text-[#0EA5E9]" />
                <h3 className="text-sm font-bold text-[#E2E8F0]">Failure Mode Frequency</h3>
              </div>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={FREQUENCY_DATA} margin={{ top: 0, right: 0, bottom: 0, left: -28 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,80,140,0.12)" vertical={false} />
                    <XAxis dataKey="name" stroke="#334155" fontSize={8} tickLine={false} axisLine={false} />
                    <YAxis stroke="#334155" fontSize={8} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                      {FREQUENCY_DATA.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} opacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pattern filter + list */}
            <div className="glass-card-static rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#334155]" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search patterns..."
                    className="glass-input w-full text-xs pl-8 py-1.5"
                  />
                </div>
                <select
                  value={filterUrgency}
                  onChange={(e) => setFilterUrgency(e.target.value)}
                  className="glass-input text-xs py-1.5 pr-6 text-[#94A3B8]"
                  style={{ minWidth: 90 }}
                >
                  {['All', 'Critical', 'High', 'Medium', 'Low'].map((u) => (
                    <option key={u} value={u} style={{ background: '#080C16' }}>{u}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                {filteredPatterns.map((p) => {
                  const cfg = urgencyConfig[p.urgency];
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPattern(p)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        selectedPattern.id === p.id
                          ? 'bg-[rgba(14,165,233,0.08)] border-[rgba(14,165,233,0.3)]'
                          : 'glass-card border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                          <span className="text-xs font-bold text-[#E2E8F0] truncate">{p.tag}</span>
                        </div>
                        <span className={cfg.badge}>{p.urgency}</span>
                      </div>
                      <div className="text-[10px] text-[#475569] mt-1.5 line-clamp-2 pl-3.5">{p.description}</div>
                      <div className="flex items-center gap-3 mt-2 pl-3.5">
                        <span className="text-[9px] text-[#334155] font-mono">{p.id}</span>
                        <span className="text-[9px] text-[#475569]">{p.affectedEquipment.length} assets</span>
                        <span className="text-[9px] text-[#334155]">{new Date(p.detectedAt).toLocaleDateString()}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Pattern Detail */}
          <div className="xl:col-span-2">
            {selectedPattern && (
              <div className="glass-card-static rounded-2xl p-6 space-y-5 slide-in-right">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={urgencyConfig[selectedPattern.urgency].badge}>{selectedPattern.urgency}</span>
                      <span className="badge badge--neutral">{selectedPattern.type}</span>
                      <span className="text-[9px] text-[#334155] font-mono">{selectedPattern.id}</span>
                    </div>
                    <h2 className="text-lg font-bold text-[#E2E8F0]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {selectedPattern.tag}
                    </h2>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-[#475569]">
                      <Clock size={9} />
                      <span>Detected: {new Date(selectedPattern.detectedAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Confidence gauge */}
                  <div className="text-center flex-shrink-0">
                    <div className="text-2xl font-black font-mono gradient-text-sky">{selectedPattern.aiConfidence}%</div>
                    <div className="text-[9px] text-[#475569] uppercase tracking-wider">AI Confidence</div>
                  </div>
                </div>

                {/* AI Confidence bar */}
                <div>
                  <div className="flex justify-between text-[9px] text-[#475569] mb-1.5">
                    <span>Pattern Confidence Score</span>
                    <span>{selectedPattern.aiConfidence}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar__fill"
                      style={{
                        width: `${selectedPattern.aiConfidence}%`,
                        background: selectedPattern.aiConfidence > 85 ? '#10B981' : '#F59E0B'
                      }}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="p-4 rounded-xl bg-[rgba(5,10,25,0.5)] border border-[rgba(56,80,140,0.2)]">
                  <div className="section-header mb-2">Pattern Description</div>
                  <p className="text-sm text-[#94A3B8] leading-relaxed">{selectedPattern.description}</p>
                </div>

                {/* Affected Equipment + Source Incidents */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="section-header mb-2">Affected Equipment</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPattern.affectedEquipment.map((eq) => (
                        <button
                          key={eq}
                          onClick={() => navigate('/maintenance')}
                          className="badge badge--info gap-1"
                        >
                          <Zap size={8} />
                          {eq}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="section-header mb-2">Source Incidents</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPattern.sourceIncidents.map((inc) => (
                        <span key={inc} className="badge badge--neutral font-mono text-[8px]">{inc}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="p-4 rounded-xl bg-[rgba(16,185,129,0.05)] border border-[rgba(16,185,129,0.2)]">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb size={14} className="text-emerald-400" />
                    <div className="section-header text-emerald-400/70">AI Recommendation</div>
                  </div>
                  <p className="text-sm text-[#94A3B8] leading-relaxed">{selectedPattern.recommendation}</p>
                  {selectedPattern.regulation && (
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <span className="badge badge--violet">{selectedPattern.regulation}</span>
                      <span className="text-[9px] text-[#475569]">regulatory reference</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => navigate('/maintenance')} className="btn btn--primary">
                    <Zap size={12} />
                    Trigger Corrective WO
                  </button>
                  <button onClick={() => navigate('/kg')} className="btn btn--secondary">
                    <GitBranch size={12} />
                    View in KG
                  </button>
                  <button className="btn btn--secondary">
                    <BookOpen size={12} />
                    Add to Lessons Library
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'lessons' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#334155]" />
              <input
                type="text"
                placeholder="Search lessons..."
                className="glass-input text-xs pl-8 py-2 w-64"
              />
            </div>
            <select className="glass-input text-xs py-2 text-[#94A3B8]" style={{ background: '#080C16' }}>
              <option value="">All Categories</option>
              <option>Mechanical</option>
              <option>Safety/Compliance</option>
              <option>Predictive Maintenance</option>
            </select>
          </div>

          <div className="space-y-3">
            {LESSONS.map((lesson) => (
              <div key={lesson.id} className="glass-card rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`badge ${
                        lesson.severity === 'Critical' ? 'badge--danger' :
                        lesson.severity === 'High' ? 'badge--warning' : 'badge--info'
                      }`}>{lesson.severity}</span>
                      <span className="badge badge--neutral">{lesson.category}</span>
                      <span className="text-[9px] text-[#334155] font-mono">{lesson.id}</span>
                    </div>
                    <h3 className="text-sm font-bold text-[#E2E8F0] mb-2">{lesson.title}</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed">{lesson.lesson}</p>
                    <div className="flex items-center gap-4 mt-3 text-[9px] text-[#334155]">
                      <span className="flex items-center gap-1"><Clock size={8} /> {lesson.date}</span>
                      <span>Source: <span className="font-mono text-[#475569]">{lesson.source}</span></span>
                      <span>Reviewed by: <span className="text-[#475569]">{lesson.reviewedBy}</span></span>
                    </div>
                  </div>
                  <button className="btn btn--secondary text-[10px] flex-shrink-0">
                    <ExternalLink size={10} />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonsLearned;
