import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ChevronDown, Cpu, Settings, Wrench, FileText,
  Network, Calendar, AlertTriangle, CheckCircle, Clock,
  Sparkles, TrendingUp, Activity, MapPin, Zap, Shield,
  ExternalLink, BarChart2, BookOpen, RefreshCw, AlertCircle,
  ArrowUpRight
} from 'lucide-react';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_ASSETS: Record<string, any> = {
  'P-101': {
    tag: 'P-101', description: 'Crude Oil Charge Pump – Train A', equipmentClass: 'Pump',
    manufacturer: 'Flowserve Corporation', model: 'DVSH 125-400', serialNumber: 'FSV-2019-A1142',
    installedDate: '2019-03-15', location: 'Unit-1 / Pump Bay A', pidReference: 'PID-U1-001 Sh.3',
    criticality: 'Critical', operationalStatus: 'Operating', mtbf: 4380,
    ratedFlow: '320 m³/hr', ratedPressure: '12.5 kg/cm²', ratedPower: '185 kW',
    ratedTemperature: '85°C', fluidType: 'Crude Oil (API 32)', sealType: 'Mechanical Double Seal',
    bearingType: 'Angular Contact Ball', impellerDiameter: '385 mm', rpm: '2975',
    lastMaintenance: '2026-04-10', nextDueMaintenance: '2026-10-10',
    workOrders: [
      { id: 'WO-2024-0881', type: 'Corrective', title: 'Mechanical seal leak repair', status: 'Completed', date: '2024-06-12', priority: 'High' },
      { id: 'WO-2026-0112', type: 'Preventive', title: 'Q2 bearing inspection and lubrication', status: 'Completed', date: '2026-04-10', priority: 'Medium' },
      { id: 'WO-2026-0388', type: 'Preventive', title: 'Q4 vibration analysis and alignment check', status: 'Scheduled', date: '2026-10-10', priority: 'Medium' },
    ],
    documents: [
      { title: 'P-101 SOP – Startup & Shutdown', type: 'SOP', id: 'doc-001' },
      { title: 'Flowserve DVSH OEM Manual Vol.1', type: 'OEMManual', id: 'doc-003' },
      { title: 'P&ID Drawing Unit-1 Sheet 3', type: 'PID', id: 'doc-002' },
    ],
    kgNeighbors: [
      { id: 'n1', label: 'Crude Oil Charge Pump P-101 SOP', type: 'Document', relation: 'HAS_SOP' },
      { id: 'n2', label: 'Unit-1 Distillation Train', type: 'Unit', relation: 'BELONGS_TO' },
      { id: 'n3', label: 'Mechanical Seal Failure (2024)', type: 'IncidentPattern', relation: 'HAS_FAILURE_MODE' },
      { id: 'n4', label: 'FT-201 Flow Transmitter', type: 'Instrument', relation: 'MEASURED_BY' },
      { id: 'n5', label: 'V-101 Suction Drum', type: 'Equipment', relation: 'UPSTREAM_OF' },
    ],
    maintenanceSchedule: [
      { date: '2026-10-10', activity: 'Vibration Analysis & Shaft Alignment Check', type: 'Preventive' },
      { date: '2027-03-15', activity: 'Full Overhaul – Impeller & Seal Replacement', type: 'Overhaul' },
      { date: '2026-07-01', activity: 'Lube Oil Analysis', type: 'Predictive' },
    ],
  },
  'V-205': {
    tag: 'V-205', description: 'Reflux Accumulator – Column T-201', equipmentClass: 'Vessel',
    manufacturer: 'BHGE Process Systems', model: 'HZ-ACC-48-300', serialNumber: 'BHG-2017-V0205',
    installedDate: '2017-08-22', location: 'Unit-2 / Column Platform Lvl 3', pidReference: 'PID-U2-004 Sh.1',
    criticality: 'High', operationalStatus: 'Operating', mtbf: 8760,
    ratedFlow: 'N/A', ratedPressure: '8.0 kg/cm²g', ratedPower: 'N/A',
    ratedTemperature: '120°C', fluidType: 'Naphtha / LPG Mix', sealType: 'N/A',
    bearingType: 'N/A', impellerDiameter: 'N/A', rpm: 'N/A',
    lastMaintenance: '2026-01-20', nextDueMaintenance: '2027-01-20',
    workOrders: [
      { id: 'WO-2025-0445', type: 'Inspection', title: 'Internal corrosion inspection – UT thickness scan', status: 'Completed', date: '2026-01-20', priority: 'High' },
      { id: 'WO-2026-0510', type: 'Preventive', title: 'PSV-205A functional test', status: 'Scheduled', date: '2026-09-15', priority: 'Critical' },
    ],
    documents: [
      { title: 'P&ID Drawing Unit-2 Sh.1', type: 'PID', id: 'doc-002' },
      { title: 'V-205 HAZOP Study 2025', type: 'OEMManual', id: 'doc-006' },
    ],
    kgNeighbors: [
      { id: 'n1', label: 'Column T-201 Distillation Unit', type: 'Equipment', relation: 'REFLUX_FOR' },
      { id: 'n2', label: 'PSV-205A Pressure Relief Valve', type: 'SafetyDevice', relation: 'PROTECTED_BY' },
      { id: 'n3', label: 'V-205 HAZOP Study 2025', type: 'Document', relation: 'HAS_HAZOP' },
    ],
    maintenanceSchedule: [
      { date: '2026-09-15', activity: 'PSV-205A Functional Test & Recertification', type: 'Preventive' },
      { date: '2027-01-20', activity: 'Internal Inspection (UT Scan + Corrosion Survey)', type: 'Inspection' },
    ],
  },
  'K-202': {
    tag: 'K-202', description: 'Fuel Gas Compressor – Reformer Feed', equipmentClass: 'Compressor',
    manufacturer: 'Siemens Energy (Demag)', model: 'ZR-90 VSD', serialNumber: 'SIE-2020-K0202',
    installedDate: '2020-11-01', location: 'Unit-2 / Compressor House Bay 3', pidReference: 'PID-U2-007 Sh.2',
    criticality: 'Critical', operationalStatus: 'Maintenance', mtbf: 5256,
    ratedFlow: '12,000 Nm³/hr', ratedPressure: '6.2 kg/cm²', ratedPower: '450 kW',
    ratedTemperature: '105°C', fluidType: 'Fuel Gas (H₂ + CH₄)', sealType: 'Dry Gas Seal',
    bearingType: 'Tilting Pad', impellerDiameter: 'N/A', rpm: '9800',
    lastMaintenance: '2026-06-01', nextDueMaintenance: '2026-12-01',
    workOrders: [
      { id: 'WO-2026-0601', type: 'Corrective', title: 'Dry gas seal primary seal degradation', status: 'In Progress', date: '2026-06-01', priority: 'Critical' },
      { id: 'WO-2026-0234', type: 'Preventive', title: 'Vibration trim balance', status: 'Completed', date: '2026-03-01', priority: 'Medium' },
    ],
    documents: [
      { title: 'K-202 OEM Manual Vol.1', type: 'OEMManual', id: 'doc-003' },
      { title: 'P&ID Unit-2 Compressor Loop', type: 'PID', id: 'doc-002' },
    ],
    kgNeighbors: [
      { id: 'n1', label: 'K-202 OEM Manual Vol.1', type: 'Document', relation: 'HAS_MANUAL' },
      { id: 'n2', label: 'Dry Gas Seal Failure Pattern', type: 'IncidentPattern', relation: 'HAS_FAILURE_MODE' },
      { id: 'n3', label: 'Reformer Furnace F-201', type: 'Equipment', relation: 'FEEDS_INTO' },
    ],
    maintenanceSchedule: [
      { date: '2026-12-01', activity: 'Dry Gas Seal Annual Replacement', type: 'Overhaul' },
      { date: '2026-08-01', activity: 'Lube Oil Cooler Cleaning', type: 'Preventive' },
    ],
  },
  'FT-201': {
    tag: 'FT-201', description: 'Feed Flow Transmitter – Crude Unit Inlet', equipmentClass: 'Instrument',
    manufacturer: 'Emerson (Rosemount)', model: '3051SF Mass Flowmeter', serialNumber: 'EMR-2021-FT0201',
    installedDate: '2021-02-10', location: 'Unit-1 / Inlet Header', pidReference: 'PID-U1-001 Sh.1',
    criticality: 'Medium', operationalStatus: 'Operating', mtbf: 17520,
    ratedFlow: '400 m³/hr max', ratedPressure: '14.0 kg/cm²g', ratedPower: '24VDC (loop)',
    ratedTemperature: '120°C', fluidType: 'Crude Oil', sealType: 'N/A',
    bearingType: 'N/A', impellerDiameter: 'N/A', rpm: 'N/A',
    lastMaintenance: '2026-02-10', nextDueMaintenance: '2027-02-10',
    workOrders: [
      { id: 'WO-2026-0150', type: 'Calibration', title: 'Annual zero & span calibration', status: 'Completed', date: '2026-02-10', priority: 'Low' },
    ],
    documents: [
      { title: 'FT-201 Calibration Procedure SOP', type: 'SOP', id: 'doc-007' },
    ],
    kgNeighbors: [
      { id: 'n1', label: 'P-101 Crude Charge Pump', type: 'Equipment', relation: 'MEASURES_FLOW_OF' },
      { id: 'n2', label: 'FT-201 Calibration Procedure', type: 'Document', relation: 'HAS_PROCEDURE' },
      { id: 'n3', label: 'DCS Loop 101 – Feed Rate Control', type: 'ControlLoop', relation: 'INPUT_TO' },
    ],
    maintenanceSchedule: [
      { date: '2027-02-10', activity: 'Annual Zero/Span Calibration & Loop Check', type: 'Calibration' },
    ],
  },
};

const ASSET_TAGS = Object.keys(MOCK_ASSETS);

// ─── Helpers ──────────────────────────────────────────────────────────────────
type TabId = 'specs' | 'workorders' | 'documents' | 'kg' | 'maintenance';

const CriticalityBadge = ({ level }: { level: string }) => {
  const map: Record<string, string> = {
    Critical: 'badge badge--danger', High: 'badge badge--warning',
    Medium: 'badge badge--info', Low: 'badge badge--neutral',
  };
  return <span className={map[level] || 'badge badge--neutral'}>{level}</span>;
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    Operating: 'badge badge--success', Standby: 'badge badge--info',
    Maintenance: 'badge badge--warning', Tripped: 'badge badge--danger',
  };
  const icons: Record<string, React.ReactNode> = {
    Operating: <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />,
    Standby: <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" />,
    Maintenance: <Wrench size={10} />,
    Tripped: <AlertTriangle size={10} />,
  };
  return (
    <span className={`${map[status] || 'badge badge--neutral'} flex items-center gap-1`}>
      {icons[status]}{status}
    </span>
  );
};

const WOStatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    Completed: 'badge badge--success', Scheduled: 'badge badge--info',
    'In Progress': 'badge badge--warning', Overdue: 'badge badge--danger',
  };
  return <span className={map[status] || 'badge badge--neutral'}>{status}</span>;
};

const WOTypeBadge = ({ type }: { type: string }) => {
  const map: Record<string, string> = {
    Corrective: 'badge badge--danger', Preventive: 'badge badge--info',
    Inspection: 'badge badge--violet', Calibration: 'badge badge--neutral', Overhaul: 'badge badge--warning',
  };
  return <span className={map[type] || 'badge badge--neutral'}>{type}</span>;
};

const DocTypeBadge = ({ type }: { type: string }) => {
  const map: Record<string, string> = {
    SOP: 'badge badge--info', PID: 'badge badge--violet',
    OEMManual: 'badge badge--neutral', WorkOrder: 'badge badge--warning',
  };
  return <span className={map[type] || 'badge badge--neutral'}>{type}</span>;
};

const KGNodeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'Document': return <FileText size={14} className="text-sky-400" />;
    case 'Equipment': return <Cpu size={14} className="text-emerald-400" />;
    case 'Instrument': return <Activity size={14} className="text-amber-400" />;
    case 'SafetyDevice': return <Shield size={14} className="text-rose-400" />;
    case 'IncidentPattern': return <AlertCircle size={14} className="text-rose-400" />;
    case 'ControlLoop': return <RefreshCw size={14} className="text-violet-400" />;
    default: return <Network size={14} className="text-slate-400" />;
  }
};

const MaintenanceTypeBadge = ({ type }: { type: string }) => {
  const map: Record<string, string> = {
    Preventive: 'badge badge--info', Overhaul: 'badge badge--warning',
    Predictive: 'badge badge--violet', Inspection: 'badge badge--neutral', Calibration: 'badge badge--success',
  };
  return <span className={map[type] || 'badge badge--neutral'}>{type}</span>;
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const EquipmentPassport: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTag, setSelectedTag] = useState<string>('P-101');
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('specs');
  const [rcaLoading, setRcaLoading] = useState<Record<string, boolean>>({});

  const asset = MOCK_ASSETS[selectedTag];

  const filteredTags = useMemo(() =>
    ASSET_TAGS.filter(t => t.toLowerCase().includes(searchQuery.toLowerCase()) ||
      MOCK_ASSETS[t].description.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery]
  );

  const handleTagSelect = (tag: string) => {
    setSelectedTag(tag);
    setDropdownOpen(false);
    setSearchQuery('');
    setActiveTab('specs');
  };

  const handleRCA = (woId: string) => {
    setRcaLoading(p => ({ ...p, [woId]: true }));
    setTimeout(() => {
      setRcaLoading(p => ({ ...p, [woId]: false }));
    }, 2000);
  };

  const TABS: { id: TabId; label: string; icon: React.FC<any> }[] = [
    { id: 'specs', label: 'Specifications', icon: Settings },
    { id: 'workorders', label: 'Work Orders', icon: Wrench },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'kg', label: 'Knowledge Graph', icon: Network },
    { id: 'maintenance', label: 'Maintenance Schedule', icon: Calendar },
  ];

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Ambient glow */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-sky-500/4 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-emerald-500/4 rounded-full blur-3xl pointer-events-none" />

      {/* ─── Page Header ──────────────────────────────────────────────────── */}
      <div>
        <p className="section-header flex items-center gap-2"><Cpu size={10} /> Asset Intelligence</p>
        <h1 className="page-title">Equipment Passport</h1>
        <p className="page-subtitle">360° view of asset specifications, work orders, documents and knowledge graph context</p>
      </div>

      {/* ─── Asset Selector ───────────────────────────────────────────────── */}
      <div className="glass-card-static p-4 rounded-2xl relative">
        <label className="section-header block mb-3">Select Asset</label>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full glass-input text-sm flex items-center justify-between gap-2 cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-sky-400 text-base">{selectedTag}</span>
              <span className="text-slate-400 text-xs truncate">{asset?.description}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {asset && <StatusBadge status={asset.operationalStatus} />}
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 z-40 glass-panel rounded-xl border border-slate-700/50 overflow-hidden shadow-2xl">
              <div className="p-2 border-b border-slate-800">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search asset tag or description…"
                    className="w-full glass-input text-xs pl-8 py-2"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filteredTags.map(tag => {
                  const a = MOCK_ASSETS[tag];
                  return (
                    <button
                      key={tag}
                      onClick={() => handleTagSelect(tag)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-slate-800/60 transition-colors text-left ${selectedTag === tag ? 'bg-sky-500/10' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`font-mono font-bold text-sm ${selectedTag === tag ? 'text-sky-400' : 'text-slate-200'}`}>{tag}</span>
                        <div>
                          <p className="text-xs text-slate-300">{a.description}</p>
                          <p className="text-[10px] text-slate-500">{a.equipmentClass} • {a.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <CriticalityBadge level={a.criticality} />
                        <StatusBadge status={a.operationalStatus} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Status Header Card ───────────────────────────────────────────── */}
      {asset && (
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/4 rounded-full blur-2xl" />
          <div className="relative flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-3xl font-black text-slate-100 font-mono tracking-tight">{asset.tag}</h2>
                <span className="badge badge--info">{asset.equipmentClass}</span>
                <CriticalityBadge level={asset.criticality} />
                <StatusBadge status={asset.operationalStatus} />
              </div>
              <p className="text-sm font-semibold text-slate-300">{asset.description}</p>
              <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><MapPin size={11} />{asset.location}</span>
                <span className="flex items-center gap-1"><BookOpen size={11} />{asset.pidReference}</span>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <div className="kpi-card kpi-card--sky text-center min-w-28">
                <span className="kpi-card__label">MTBF</span>
                <span className="kpi-card__value font-mono">{asset.mtbf >= 8760 ? `${(asset.mtbf / 8760).toFixed(1)}yr` : `${asset.mtbf}h`}</span>
                <span className="kpi-card__sub">Mean Time Between Failures</span>
              </div>
              <div className="kpi-card kpi-card--emerald text-center min-w-28">
                <span className="kpi-card__label">Work Orders</span>
                <span className="kpi-card__value font-mono">{asset.workOrders.length}</span>
                <span className="kpi-card__sub">Linked WO records</span>
              </div>
              <div className="kpi-card kpi-card--violet text-center min-w-28">
                <span className="kpi-card__label">KG Nodes</span>
                <span className="kpi-card__value font-mono">{asset.kgNeighbors.length}</span>
                <span className="kpi-card__sub">Connected entities</span>
              </div>
            </div>
          </div>

          {/* Ask Copilot */}
          <div className="mt-5 pt-4 border-t border-slate-800/50 flex justify-end">
            <button
              onClick={() => navigate('/copilot', { state: { prefilledQuery: `Show me the operating manual and maintenance history for ${asset.tag}` } })}
              className="btn btn--primary flex items-center gap-2"
            >
              <Sparkles size={13} /> Ask AI Copilot about {asset.tag}
            </button>
          </div>
        </div>
      )}

      {/* ─── Tab Navigation ───────────────────────────────────────────────── */}
      {asset && (
        <div className="space-y-0">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${active
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/25 shadow-sm shadow-sky-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}`}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ─── Tab Content ───────────────────────────────────────────────── */}
          <div className="glass-panel rounded-2xl p-6 fade-in min-h-[400px]">

            {/* SPECIFICATIONS TAB */}
            {activeTab === 'specs' && (
              <div className="space-y-6">
                <p className="section-header flex items-center gap-2"><Settings size={10} /> Technical Specifications</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Identity & Location</p>
                    <table className="spec-table w-full">
                      <tbody>
                        <tr><td>Asset Tag</td><td className="font-mono font-bold text-sky-400">{asset.tag}</td></tr>
                        <tr><td>Equipment Class</td><td>{asset.equipmentClass}</td></tr>
                        <tr><td>Manufacturer</td><td>{asset.manufacturer}</td></tr>
                        <tr><td>Model</td><td className="font-mono">{asset.model}</td></tr>
                        <tr><td>Serial Number</td><td className="font-mono text-[10px]">{asset.serialNumber}</td></tr>
                        <tr><td>Installed Date</td><td>{new Date(asset.installedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td></tr>
                        <tr><td>Location</td><td>{asset.location}</td></tr>
                        <tr><td>P&ID Reference</td><td>{asset.pidReference}</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Performance & Design Parameters</p>
                    <table className="spec-table w-full">
                      <tbody>
                        <tr><td>Rated Flow</td><td className="font-mono">{asset.ratedFlow}</td></tr>
                        <tr><td>Rated Pressure</td><td className="font-mono">{asset.ratedPressure}</td></tr>
                        <tr><td>Rated Power</td><td className="font-mono">{asset.ratedPower}</td></tr>
                        <tr><td>Rated Temperature</td><td className="font-mono">{asset.ratedTemperature}</td></tr>
                        <tr><td>Fluid Type</td><td>{asset.fluidType}</td></tr>
                        <tr><td>Seal Type</td><td>{asset.sealType}</td></tr>
                        <tr><td>Bearing Type</td><td>{asset.bearingType}</td></tr>
                        {asset.rpm !== 'N/A' && <tr><td>Speed (RPM)</td><td className="font-mono">{asset.rpm}</td></tr>}
                        {asset.impellerDiameter !== 'N/A' && <tr><td>Impeller Dia.</td><td className="font-mono">{asset.impellerDiameter}</td></tr>}
                        <tr><td>MTBF</td><td className="font-mono">{asset.mtbf} hrs</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* WORK ORDERS TAB */}
            {activeTab === 'workorders' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="section-header flex items-center gap-2"><Wrench size={10} /> Linked Work Orders</p>
                  <span className="badge badge--neutral">{asset.workOrders.length} records</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="data-table w-full">
                    <thead>
                      <tr>
                        <th>WO Number</th>
                        <th>Type</th>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Priority</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asset.workOrders.map((wo: any) => (
                        <tr key={wo.id}>
                          <td className="font-mono font-bold text-sky-400">{wo.id}</td>
                          <td><WOTypeBadge type={wo.type} /></td>
                          <td className="max-w-48 truncate">{wo.title}</td>
                          <td><WOStatusBadge status={wo.status} /></td>
                          <td className="text-slate-400">{new Date(wo.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                          <td>
                            <span className={`badge ${wo.priority === 'Critical' ? 'badge--danger' : wo.priority === 'High' ? 'badge--warning' : wo.priority === 'Medium' ? 'badge--info' : 'badge--neutral'}`}>
                              {wo.priority}
                            </span>
                          </td>
                          <td className="text-right">
                            {wo.type === 'Corrective' && (
                              <button
                                onClick={() => handleRCA(wo.id)}
                                disabled={rcaLoading[wo.id]}
                                className="btn btn--primary text-[10px] py-1 px-2.5 flex items-center gap-1 ml-auto disabled:opacity-40"
                              >
                                {rcaLoading[wo.id] ? <><Loader2 size={10} className="animate-spin" />Running…</> : <><Sparkles size={10} />Run RCA</>}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* DOCUMENTS TAB */}
            {activeTab === 'documents' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="section-header flex items-center gap-2"><FileText size={10} /> Linked Documents</p>
                  <span className="badge badge--neutral">{asset.documents.length} files</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {asset.documents.map((doc: any, i: number) => (
                    <div key={i} className="glass-card p-4 rounded-xl space-y-3 hover:border-sky-500/30 transition-all group">
                      <div className="flex items-start justify-between gap-2">
                        <DocTypeBadge type={doc.type} />
                        <button
                          onClick={() => navigate('/documents')}
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-sky-400 transition-colors"
                          title="Open in Document Library"
                        >
                          <ExternalLink size={12} />
                        </button>
                      </div>
                      <div>
                        <FileText size={20} className="text-slate-600 mb-2" />
                        <h5 className="text-xs font-bold text-slate-200 leading-snug group-hover:text-sky-300 transition-colors">{doc.title}</h5>
                      </div>
                      <button
                        onClick={() => navigate('/documents')}
                        className="text-[10px] text-slate-500 hover:text-sky-400 flex items-center gap-1 transition-colors"
                      >
                        View in Library <ArrowUpRight size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* KNOWLEDGE GRAPH TAB */}
            {activeTab === 'kg' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <p className="section-header flex items-center gap-2"><Network size={10} /> Knowledge Graph Context</p>
                  <button
                    onClick={() => navigate('/kg')}
                    className="btn btn--primary flex items-center gap-2"
                  >
                    <Network size={12} /> Open in KG Explorer
                  </button>
                </div>

                <div className="p-5 rounded-xl bg-slate-950/40 border border-slate-800 text-center relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center opacity-5">
                    <div className="w-96 h-96 rounded-full border border-sky-400" />
                    <div className="absolute w-64 h-64 rounded-full border border-indigo-400" />
                    <div className="absolute w-32 h-32 rounded-full border border-emerald-400" />
                  </div>
                  <Network size={36} className="mx-auto text-slate-700 mb-3" />
                  <p className="text-sm font-bold text-slate-400">P&ID Topological Subgraph</p>
                  <p className="text-[11px] text-slate-600 mt-1">Launch KG Explorer for full interactive graph visualization with layout and filter controls.</p>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Connected Entities ({asset.kgNeighbors.length})</p>
                  <div className="space-y-2">
                    {asset.kgNeighbors.map((n: any) => (
                      <div key={n.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-slate-700 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                          <KGNodeIcon type={n.type} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate">{n.label}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider">{n.type}</span>
                            <span className="text-slate-700">•</span>
                            <span className="text-[9px] font-mono text-sky-500/70">{n.relation}</span>
                          </div>
                        </div>
                        <ExternalLink size={12} className="text-slate-600 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MAINTENANCE SCHEDULE TAB */}
            {activeTab === 'maintenance' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <p className="section-header flex items-center gap-2"><Calendar size={10} /> Maintenance Schedule</p>
                  <div className="flex gap-4 text-xs text-slate-400">
                    <span>Last Maintenance: <strong className="text-slate-200">{new Date(asset.lastMaintenance).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>
                    <span>Next Due: <strong className="text-amber-400">{new Date(asset.nextDueMaintenance).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>
                  </div>
                </div>

                <div className="space-y-3">
                  {asset.maintenanceSchedule.map((m: any, i: number) => {
                    const daysUntil = Math.ceil((new Date(m.date).getTime() - Date.now()) / 86400000);
                    const isPast = daysUntil < 0;
                    const isSoon = !isPast && daysUntil <= 30;
                    return (
                      <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${isPast ? 'bg-slate-950/40 border-slate-800' : isSoon ? 'bg-amber-500/5 border-amber-500/20' : 'bg-slate-950/40 border-slate-800'}`}>
                        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${isPast ? 'bg-slate-900' : isSoon ? 'bg-amber-500/10' : 'bg-slate-900'}`}>
                          <span className={`text-[9px] font-bold uppercase ${isPast ? 'text-slate-500' : isSoon ? 'text-amber-400' : 'text-slate-400'}`}>
                            {new Date(m.date).toLocaleString('en-GB', { month: 'short' })}
                          </span>
                          <span className={`text-lg font-black leading-none ${isPast ? 'text-slate-500' : isSoon ? 'text-amber-400' : 'text-slate-300'}`}>
                            {new Date(m.date).getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-200">{m.activity}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <MaintenanceTypeBadge type={m.type} />
                            <span className={`text-[10px] ${isPast ? 'text-slate-500' : isSoon ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>
                              {isPast ? `Completed ${Math.abs(daysUntil)} days ago` : isSoon ? `Due in ${daysUntil} days` : `In ${daysUntil} days`}
                            </span>
                          </div>
                        </div>
                        {isSoon && <Clock size={16} className="text-amber-400 shrink-0" />}
                        {isPast && <CheckCircle size={16} className="text-emerald-400 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

// Small Loader2 inline to avoid import issue
const Loader2 = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default EquipmentPassport;
