import React, { useState, useMemo } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip as ReTooltip, Legend
} from 'recharts';
import {
  ShieldCheck, AlertTriangle, CheckCircle2, Circle, XCircle,
  Download, RefreshCw, ClipboardCheck, FileText, ChevronRight,
  X, Zap, User, CalendarClock, Brain, FileStack
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────────────────────────── */
type ComplianceStatus = 'compliant' | 'partial' | 'noncompliant' | 'notassessed';

interface ClauseEntry {
  id: string;
  reg: string;
  clauseCode: string;
  clauseTitle: string;
  clauseText: string;
  status: ComplianceStatus;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  gapDescription: string;
  correctiveAction: string;
  responsible: string;
  targetDate: string;
  aiConfidence: number;
  evidenceDocs: string[];
}

const MOCK_CLAUSES: ClauseEntry[] = [
  {
    id: 'c1', reg: 'OISD-118', clauseCode: '§4.1', clauseTitle: 'Layout Safety Distances',
    clauseText: 'Minimum safe distances between storage vessels, process units, utilities, and site boundaries shall be maintained as per Table-1 of OISD-118.',
    status: 'compliant', severity: 'High',
    gapDescription: 'All layout distances verified against Table-1. No deviation found.',
    correctiveAction: 'Continue periodic layout audits annually.',
    responsible: 'Plant Layout Engineer', targetDate: '2026-12-31', aiConfidence: 97,
    evidenceDocs: ['Layout_Drawing_Rev4.pdf', 'Site_Survey_2025.pdf'],
  },
  {
    id: 'c2', reg: 'OISD-118', clauseCode: '§4.2', clauseTitle: 'Piping Clearance & Routing',
    clauseText: 'Overhead piping must maintain minimum 3m clearance over vehicle access roads and 2.5m over pedestrian walkways.',
    status: 'partial', severity: 'Medium',
    gapDescription: 'Section B piping runs at 2.2m over pedestrian walkway near Tank Farm T-3 — below the 2.5m minimum.',
    correctiveAction: 'Reroute piping section B-12 to achieve minimum 2.5m clearance or install protective barrier.',
    responsible: 'Piping Engineer', targetDate: '2026-08-15', aiConfidence: 88,
    evidenceDocs: ['Piping_ISO_B12.pdf', 'Field_Inspection_May26.pdf'],
  },
  {
    id: 'c3', reg: 'OISD-118', clauseCode: '§4.3', clauseTitle: 'Safety Relief Valves',
    clauseText: 'All pressure vessels must be protected by dual safety relief valves set to open at 110% of MAWP with documented relief device register.',
    status: 'noncompliant', severity: 'Critical',
    gapDescription: 'Vessel V-205 has single SRV only. No redundant SRV installed. Relief device register entry missing for V-205 and V-208.',
    correctiveAction: 'Install second SRV on V-205, V-208 before next operating cycle. Update relief device register immediately.',
    responsible: 'Pressure Vessel Inspector', targetDate: '2026-07-30', aiConfidence: 99,
    evidenceDocs: ['RDR_Current.pdf', 'V205_Datasheet.pdf'],
  },
  {
    id: 'c4', reg: 'OISD-118', clauseCode: '§7.1', clauseTitle: 'Vessel Periodic Inspection',
    clauseText: 'Pressure vessels and storage tanks shall undergo internal inspection every 10 years and external inspection every 2 years.',
    status: 'partial', severity: 'High',
    gapDescription: 'V-301 external inspection overdue by 4 months. Internal records present for all other vessels.',
    correctiveAction: 'Schedule external inspection for V-301 within 30 days. Engage certified inspection agency.',
    responsible: 'Inspection Engineer', targetDate: '2026-07-20', aiConfidence: 95,
    evidenceDocs: ['Vessel_Inspection_Log.pdf'],
  },
  {
    id: 'c5', reg: 'OISD-118', clauseCode: '§9.2', clauseTitle: 'Firewater System Adequacy',
    clauseText: 'Firewater system shall provide minimum 500 LPM for 4 hours. Hydrant spacing not to exceed 45m.',
    status: 'compliant', severity: 'High',
    gapDescription: 'Firewater flow test passed: 650 LPM for 4h tested Feb 2026. Hydrant spacing within limits.',
    correctiveAction: 'No action required. Repeat flow test per schedule.',
    responsible: 'Fire Safety Officer', targetDate: '2027-02-01', aiConfidence: 98,
    evidenceDocs: ['Firewater_Test_Feb26.pdf', 'Hydrant_Map_Rev3.pdf'],
  },
  {
    id: 'c6', reg: 'PESO-2016', clauseCode: 'R.7', clauseTitle: 'Explosion Barrier Requirements',
    clauseText: 'Blast walls or explosion barriers must be installed between ignition sources and hazardous area zones per PESO Rule 7.',
    status: 'noncompliant', severity: 'Critical',
    gapDescription: 'No blast wall installed between compressor shed (Zone-1 ignition source) and LPG storage bullet B-3.',
    correctiveAction: 'Install minimum 200mm RCC blast wall, height 3m, between C-301 compressor and B-3 bullet within 60 days.',
    responsible: 'Civil Safety Engineer', targetDate: '2026-08-30', aiConfidence: 96,
    evidenceDocs: ['PESO_Zoning_Map.pdf', 'Hazardous_Area_Classification_Rev2.pdf'],
  },
  {
    id: 'c7', reg: 'PESO-2016', clauseCode: 'R.8', clauseTitle: 'Pressure Testing Compliance',
    clauseText: 'All new piping and vessels commissioned after 2015 must undergo hydrostatic pressure testing at 1.5x design pressure with test reports retained for 15 years.',
    status: 'compliant', severity: 'Medium',
    gapDescription: 'Hydrostatic test records available for all post-2015 equipment. Test agency certified.',
    correctiveAction: 'Ensure test records archived per 15-year retention policy.',
    responsible: 'QA Manager', targetDate: '2026-12-31', aiConfidence: 94,
    evidenceDocs: ['Hydro_Test_Archive_2015-2026.pdf'],
  },
  {
    id: 'c8', reg: 'PESO-2016', clauseCode: 'R.12', clauseTitle: 'Electrical Area Classification',
    clauseText: 'Electrical installations in hazardous areas shall conform to IS:5572 Zone classification with certified Ex-d or Ex-e equipment.',
    status: 'partial', severity: 'High',
    gapDescription: 'Two lighting fixtures in Zone-2 area not rated for hazardous area use. Installed during emergency replacement without proper certification.',
    correctiveAction: 'Replace non-certified fixtures with Ex-e rated equivalents. Update electrical area classification register.',
    responsible: 'Electrical Inspector', targetDate: '2026-07-25', aiConfidence: 91,
    evidenceDocs: ['EA_Classification_Register.pdf', 'Electrical_Inspection_May26.pdf'],
  },
  {
    id: 'c9', reg: 'Factory Act', clauseCode: '§7', clauseTitle: 'Occupational Hygiene',
    clauseText: 'Factory workers must be provided with clean drinking water, adequate sanitation, and occupational health monitoring per Factory Act Section 7.',
    status: 'compliant', severity: 'Low',
    gapDescription: 'Occupational health records current. Sanitation facilities inspected and compliant.',
    correctiveAction: 'Continue half-yearly medical surveillance.',
    responsible: 'HSE Manager', targetDate: '2026-12-31', aiConfidence: 99,
    evidenceDocs: ['OHS_Annual_Report_2025.pdf'],
  },
  {
    id: 'c10', reg: 'Factory Act', clauseCode: '§12', clauseTitle: 'Ventilation Standards',
    clauseText: 'Every factory shall be kept ventilated to maintain CO₂ below 1000 ppm. Confined spaces require forced ventilation with continuous gas monitoring.',
    status: 'partial', severity: 'Medium',
    gapDescription: 'CO₂ levels in confined space CS-7 measured at 1250 ppm during last quarterly check. Ventilation fan was found inoperative.',
    correctiveAction: 'Repair ventilation fan in CS-7 immediately. Re-survey air quality post-repair. Add fan to preventive maintenance schedule.',
    responsible: 'Safety Officer', targetDate: '2026-07-10', aiConfidence: 93,
    evidenceDocs: ['CS_Air_Quality_Q1_2026.pdf', 'Ventilation_Fan_Maint_Log.pdf'],
  },
  {
    id: 'c11', reg: 'Factory Act', clauseCode: '§21', clauseTitle: 'Machine Guarding',
    clauseText: 'All moving parts of prime movers, transmission machinery, and driven machinery shall be securely fenced.',
    status: 'noncompliant', severity: 'High',
    gapDescription: 'Coupling guard missing on pump P-102 drive. Belt guard on conveyor CV-05 found damaged and non-functional.',
    correctiveAction: 'Fit new coupling guard on P-102 within 48 hours. Replace conveyor CV-05 belt guard within 7 days.',
    responsible: 'Mechanical Supervisor', targetDate: '2026-07-05', aiConfidence: 99,
    evidenceDocs: ['Machine_Guard_Inspection_June26.pdf'],
  },
  {
    id: 'c12', reg: 'Factory Act', clauseCode: '§36', clauseTitle: 'Fire Prevention',
    clauseText: 'Adequate number of fire extinguishers shall be placed within 15m reach of any work area with annual servicing records.',
    status: 'compliant', severity: 'Medium',
    gapDescription: 'Fire extinguishers placed per layout. All service tags current. Annual inspection by certified agency done March 2026.',
    correctiveAction: 'No action required.',
    responsible: 'Fire Safety Officer', targetDate: '2027-03-01', aiConfidence: 99,
    evidenceDocs: ['Fire_Extinguisher_Service_Mar26.pdf'],
  },
  {
    id: 'c13', reg: 'MoEF GT-2', clauseCode: 'GT2.1', clauseTitle: 'Stack Emission Standards',
    clauseText: 'Stack emissions shall comply with MoEF standards: SPM <150 mg/Nm³, SO₂ <200 mg/Nm³, NOₓ <300 mg/Nm³.',
    status: 'partial', severity: 'High',
    gapDescription: 'Recent stack emission test shows NOₓ at 340 mg/Nm³ — 13% above permissible limit in Boiler-2.',
    correctiveAction: 'Tune Boiler-2 burner settings, check air-fuel ratio. Engage emission consultant for Low-NOₓ burner upgrade assessment.',
    responsible: 'Environment Officer', targetDate: '2026-09-30', aiConfidence: 92,
    evidenceDocs: ['Stack_Emission_Test_Apr26.pdf', 'MoEF_Compliance_Return.pdf'],
  },
  {
    id: 'c14', reg: 'MoEF GT-2', clauseCode: 'GT2.3', clauseTitle: 'Effluent Treatment Plant',
    clauseText: 'Industrial effluent must be treated to achieve pH 6.5–8.5, BOD <30 mg/L, COD <250 mg/L before discharge.',
    status: 'compliant', severity: 'Medium',
    gapDescription: 'ETP output tests: pH 7.1, BOD 18 mg/L, COD 185 mg/L — all within limits per June 2026 test.',
    correctiveAction: 'Continue monthly ETP monitoring.',
    responsible: 'Environment Officer', targetDate: '2026-12-31', aiConfidence: 98,
    evidenceDocs: ['ETP_Test_June26.pdf', 'CPCB_Consent_To_Operate.pdf'],
  },
  {
    id: 'c15', reg: 'MoEF GT-2', clauseCode: 'GT2.5', clauseTitle: 'Hazardous Waste Manifests',
    clauseText: 'All hazardous waste disposal must be accompanied by Form-13 manifests with licensed recycler/disposal agency.',
    status: 'notassessed', severity: 'Medium',
    gapDescription: 'Hazardous waste manifest records for FY 2025-26 not yet compiled for this audit cycle.',
    correctiveAction: 'Compile Form-13 manifests for all HW disposals in FY 2025-26 and submit to PCB.',
    responsible: 'Environment Manager', targetDate: '2026-08-15', aiConfidence: 78,
    evidenceDocs: [],
  },
  {
    id: 'c16', reg: 'MoEF GT-2', clauseCode: 'GT2.8', clauseTitle: 'Groundwater Monitoring',
    clauseText: 'Quarterly groundwater quality monitoring mandatory at minimum 4 bore wells as per Consent conditions.',
    status: 'notassessed', severity: 'Low',
    gapDescription: 'Q2 2026 groundwater monitoring results pending. Sampling done but lab analysis not yet received.',
    correctiveAction: 'Receive lab analysis report by July 15. Upload to State PCB portal.',
    responsible: 'Environment Officer', targetDate: '2026-07-15', aiConfidence: 82,
    evidenceDocs: ['Groundwater_Sampling_Jun26.pdf'],
  },
];

const REGULATIONS = ['ALL', 'OISD-118', 'PESO-2016', 'Factory Act', 'MoEF GT-2'];

const REG_COLORS: Record<string, string> = {
  'OISD-118': '#0EA5E9',
  'PESO-2016': '#8B5CF6',
  'Factory Act': '#10B981',
  'MoEF GT-2': '#F59E0B',
};

const statusConfig = {
  compliant:    { label: 'Compliant',    icon: CheckCircle2, color: '#34D399', cls: 'compliance-cell--compliant' },
  partial:      { label: 'Partial',      icon: AlertTriangle, color: '#FCD34D', cls: 'compliance-cell--partial' },
  noncompliant: { label: 'Non-Compliant', icon: XCircle,      color: '#FB7185', cls: 'compliance-cell--noncompliant' },
  notassessed:  { label: 'Not Assessed', icon: Circle,        color: '#64748B', cls: 'compliance-cell--notassessed' },
};

const severityBadge: Record<string, string> = {
  Critical: 'badge badge--danger',
  High:     'badge badge--warning',
  Medium:   'badge badge--info',
  Low:      'badge badge--neutral',
};

/* ─────────────────────────────────────────────────────────────────
   RADAR CHART DATA
───────────────────────────────────────────────────────────────── */
const buildRadarData = (clauses: ClauseEntry[]) => {
  const regs = ['OISD-118', 'PESO-2016', 'Factory Act', 'MoEF GT-2'];
  return regs.map((reg) => {
    const group = clauses.filter((c) => c.reg === reg);
    const compliant = group.filter((c) => c.status === 'compliant').length;
    const score = group.length ? Math.round((compliant / group.length) * 100) : 0;
    return { reg: reg.replace('-', '\u2011'), score };
  });
};

/* ─────────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────────── */
export const ComplianceRadar: React.FC = () => {
  const [activeReg, setActiveReg] = useState('ALL');
  const [selectedClause, setSelectedClause] = useState<ClauseEntry | null>(null);

  const filtered = useMemo(
    () => (activeReg === 'ALL' ? MOCK_CLAUSES : MOCK_CLAUSES.filter((c) => c.reg === activeReg)),
    [activeReg],
  );

  /* KPI stats */
  const totalClauses    = MOCK_CLAUSES.length;
  const compliantCount  = MOCK_CLAUSES.filter((c) => c.status === 'compliant').length;
  const partialCount    = MOCK_CLAUSES.filter((c) => c.status === 'partial').length;
  const nonCompliant    = MOCK_CLAUSES.filter((c) => c.status === 'noncompliant').length;
  const overallScore    = Math.round((compliantCount / totalClauses) * 100);
  const radarData       = buildRadarData(MOCK_CLAUSES);

  const handleExportPDF = () => toast.success('Generating audit PDF package…', { duration: 3000 });
  const handleRescan    = () => toast.loading('AI compliance scan queued…', { id: 'scan', duration: 3000 });
  const handleReview    = () => {
    if (!selectedClause) { toast.error('Select a clause first'); return; }
    toast.success(`Clause ${selectedClause.clauseCode} marked as reviewed`);
  };

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed top-0 right-0 w-[600px] h-[600px] bg-emerald-500/4 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/4 rounded-full blur-3xl" />

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={22} className="text-emerald-400" />
            <h1 className="page-title">Compliance Radar</h1>
          </div>
          <p className="page-subtitle">OISD / PESO / Factory Act / MoEF gap scanner — AI-powered regulatory audit engine</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn--secondary" onClick={handleRescan}>
            <RefreshCw size={13} /> Schedule Rescan
          </button>
          <button className="btn btn--secondary" onClick={handleReview}>
            <ClipboardCheck size={13} /> Mark as Reviewed
          </button>
          <button className="btn btn--primary" onClick={handleExportPDF}>
            <Download size={13} /> Export Audit PDF
          </button>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card kpi-card--emerald">
          <p className="section-header">Overall Score</p>
          <p className="text-4xl font-black text-emerald-400 font-mono mt-1">{overallScore}%</p>
          <p className="text-[11px] text-slate-500 mt-2">{totalClauses} clauses evaluated</p>
          <div className="progress-bar mt-3">
            <div className="progress-bar__fill bg-emerald-400" style={{ width: `${overallScore}%` }} />
          </div>
        </div>
        <div className="kpi-card kpi-card--rose">
          <p className="section-header">Critical Gaps</p>
          <p className="text-4xl font-black text-rose-400 font-mono mt-1">{nonCompliant}</p>
          <p className="text-[11px] text-slate-500 mt-2">Non-compliant clauses</p>
          <div className="progress-bar mt-3">
            <div className="progress-bar__fill bg-rose-400" style={{ width: `${(nonCompliant / totalClauses) * 100}%` }} />
          </div>
        </div>
        <div className="kpi-card kpi-card--amber">
          <p className="section-header">Partially Compliant</p>
          <p className="text-4xl font-black text-amber-400 font-mono mt-1">{partialCount}</p>
          <p className="text-[11px] text-slate-500 mt-2">Partial conformance found</p>
          <div className="progress-bar mt-3">
            <div className="progress-bar__fill bg-amber-400" style={{ width: `${(partialCount / totalClauses) * 100}%` }} />
          </div>
        </div>
        <div className="kpi-card kpi-card--sky">
          <p className="section-header">Regulations Covered</p>
          <p className="text-4xl font-black text-sky-400 font-mono mt-1">4</p>
          <p className="text-[11px] text-slate-500 mt-2">OISD · PESO · Factory Act · MoEF</p>
          <div className="progress-bar mt-3">
            <div className="progress-bar__fill bg-sky-400" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* ── REGULATION TABS ── */}
      <div className="glass-panel rounded-2xl p-1.5 flex flex-wrap gap-1">
        {REGULATIONS.map((reg) => (
          <button
            key={reg}
            onClick={() => setActiveReg(reg)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeReg === reg
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
            }`}
          >
            {reg}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3 pr-2">
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <span key={key} className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.color }} />
              {cfg.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── MAIN BODY ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── LEFT: Compliance Matrix ── */}
        <div className="xl:col-span-2 space-y-4">
          <div className="glass-panel rounded-2xl p-5">
            <h3 className="section-header mb-4">Compliance Matrix — {activeReg === 'ALL' ? 'All Regulations' : activeReg}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map((clause) => {
                const cfg = statusConfig[clause.status];
                const Icon = cfg.icon;
                const isSelected = selectedClause?.id === clause.id;
                return (
                  <div
                    key={clause.id}
                    onClick={() => setSelectedClause(isSelected ? null : clause)}
                    className={`compliance-cell ${cfg.cls} ${isSelected ? 'ring-2 ring-sky-400/50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                            style={{ background: `${REG_COLORS[clause.reg]}18`, color: REG_COLORS[clause.reg], border: `1px solid ${REG_COLORS[clause.reg]}30` }}
                          >
                            {clause.reg}
                          </span>
                          <span className="text-[10px] font-bold font-mono text-slate-200">{clause.clauseCode}</span>
                          <span className={severityBadge[clause.severity]}>{clause.severity}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-200 truncate">{clause.clauseTitle}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{clause.gapDescription}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Icon size={18} style={{ color: cfg.color }} />
                        <ChevronRight size={12} className="text-slate-600" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Status summary */}
            <div className="mt-5 pt-4 border-t border-slate-800/40 flex flex-wrap gap-4">
              {Object.entries(statusConfig).map(([key, cfg]) => {
                const count = filtered.filter((c) => c.status === key).length;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.color }} />
                    <span className="text-[11px] text-slate-400">{cfg.label}:</span>
                    <span className="text-[11px] font-bold text-slate-200">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Radar Chart ── */}
          <div className="glass-panel rounded-2xl p-5">
            <h3 className="section-header mb-4">Compliance Score by Regulation Body</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="rgba(56,80,140,0.3)" />
                  <PolarAngleAxis
                    dataKey="reg"
                    tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'Inter' }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fill: '#475569', fontSize: 9 }}
                    axisLine={false}
                  />
                  <Radar
                    name="Compliance %"
                    dataKey="score"
                    stroke="#0EA5E9"
                    fill="#0EA5E9"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                  <ReTooltip
                    contentStyle={{
                      background: '#0D1220',
                      border: '1px solid rgba(56,80,140,0.3)',
                      borderRadius: 10,
                      fontSize: 11,
                      color: '#E2E8F0',
                    }}
                    formatter={(value: any) => [`${value}%`, 'Score']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Detail Panel ── */}
        <div className="xl:col-span-1">
          {selectedClause ? (
            <div className="glass-panel rounded-2xl p-5 space-y-5 slide-in-right sticky top-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-800/50 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                      style={{ background: `${REG_COLORS[selectedClause.reg]}18`, color: REG_COLORS[selectedClause.reg], border: `1px solid ${REG_COLORS[selectedClause.reg]}30` }}
                    >
                      {selectedClause.reg}
                    </span>
                    <span className="text-xs font-bold font-mono text-slate-200">{selectedClause.clauseCode}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100">{selectedClause.clauseTitle}</h4>
                </div>
                <button onClick={() => setSelectedClause(null)} className="text-slate-500 hover:text-slate-300 p-1">
                  <X size={14} />
                </button>
              </div>

              {/* Status + Severity */}
              <div className="flex items-center gap-2">
                {(() => {
                  const cfg = statusConfig[selectedClause.status];
                  const Icon = cfg.icon;
                  return (
                    <span className={`compliance-cell ${cfg.cls} !py-1 !px-3 flex items-center gap-1.5`}>
                      <Icon size={12} /> {cfg.label}
                    </span>
                  );
                })()}
                <span className={severityBadge[selectedClause.severity]}>{selectedClause.severity}</span>
              </div>

              {/* Clause Text */}
              <div>
                <p className="section-header">Clause Text</p>
                <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/30 p-3 rounded-xl border border-slate-800/40">
                  {selectedClause.clauseText}
                </p>
              </div>

              {/* Gap Description */}
              <div>
                <p className="section-header">Gap Description</p>
                <p className="text-[11px] text-slate-300 leading-relaxed bg-rose-500/5 p-3 rounded-xl border border-rose-500/10">
                  {selectedClause.gapDescription}
                </p>
              </div>

              {/* Corrective Action */}
              <div>
                <p className="section-header">Corrective Action</p>
                <div className="flex gap-2 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
                  <Zap size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-300 leading-relaxed">{selectedClause.correctiveAction}</p>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <User size={12} className="text-slate-500" />
                  <span className="text-slate-500">Responsible:</span>
                  <span className="text-slate-200 font-medium">{selectedClause.responsible}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <CalendarClock size={12} className="text-slate-500" />
                  <span className="text-slate-500">Target Date:</span>
                  <span className="text-slate-200 font-medium">{selectedClause.targetDate}</span>
                </div>
              </div>

              {/* Evidence Documents */}
              {selectedClause.evidenceDocs.length > 0 && (
                <div>
                  <p className="section-header">Evidence Documents</p>
                  <div className="space-y-1.5">
                    {selectedClause.evidenceDocs.map((doc) => (
                      <div key={doc} className="flex items-center gap-2 text-[11px] text-sky-400 hover:text-sky-300 cursor-pointer">
                        <FileStack size={11} className="shrink-0" />
                        {doc}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Confidence */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="section-header !mb-0 flex items-center gap-1.5">
                    <Brain size={11} /> AI Confidence Score
                  </p>
                  <span className="text-xs font-bold text-violet-400">{selectedClause.aiConfidence}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar__fill"
                    style={{
                      width: `${selectedClause.aiConfidence}%`,
                      background: selectedClause.aiConfidence > 90
                        ? 'linear-gradient(90deg, #10B981, #06B6D4)'
                        : selectedClause.aiConfidence > 75
                        ? 'linear-gradient(90deg, #F59E0B, #EF4444)'
                        : '#EF4444',
                    }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-800/40 flex flex-col gap-2">
                <button className="btn btn--primary w-full" onClick={handleExportPDF}>
                  <Download size={13} /> Export Audit PDF
                </button>
                <button className="btn btn--secondary w-full" onClick={handleReview}>
                  <ClipboardCheck size={13} /> Mark as Reviewed
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3 h-80">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/30 flex items-center justify-center">
                <FileText size={24} className="text-slate-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-300">Clause Detail Panel</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed max-w-[200px]">
                  Select any compliance cell from the matrix to view gap details and corrective actions
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplianceRadar;
