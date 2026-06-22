import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { kgApi } from '../api/kg.api';
import { GraphCanvas } from '../components/kg/GraphCanvas';
import {
  Network,
  Play,
  Search,
  Sparkles,
  Cpu,
  Loader2,
  ChevronDown,
  X,
  Database,
  GitBranch,
  Layers,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TerminalSquare,
  List,
  ExternalLink,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Preset queries ────────────────────────────────────────────────────────────
const PRESET_QUERIES = [
  {
    id: 1,
    name: 'Equipment & Related Documents',
    query: "MATCH (e:Equipment)-[r:HAS_DOCUMENT|REFERENCES]-(d:Document) RETURN e, r, d LIMIT 30",
    icon: '📋',
  },
  {
    id: 2,
    name: 'Piping Loops & Instruments',
    query: "MATCH (e:Equipment)-[r:CONNECTED_TO]-(i:Instrument) RETURN e, r, i LIMIT 30",
    icon: '🔧',
  },
  {
    id: 3,
    name: 'Compliance Gap Analysis',
    query: "MATCH (g:Gap)-[r:VIOLATES]-(c:Regulation) RETURN g, r, c LIMIT 25",
    icon: '⚠️',
  },
  {
    id: 4,
    name: 'Failure Pattern Analysis',
    query: "MATCH (i:Incident)-[r:OCCURRED_ON]-(e:Equipment) RETURN i, r, e LIMIT 25",
    icon: '🔍',
  },
  {
    id: 5,
    name: 'Recent Corrective Work Orders',
    query: "MATCH (w:WorkOrder {type: 'Corrective'})-[r:ASSIGNED_TO]-(e:Equipment) RETURN w, r, e LIMIT 25",
    icon: '🛠️',
  },
];

// ─── Entity filter chips ───────────────────────────────────────────────────────
type EntityFilter = 'Equipment' | 'Document' | 'Regulation' | 'Incident' | 'WorkOrder' | 'Procedure';

const ENTITY_FILTERS: { type: EntityFilter; color: string; textColor: string; borderColor: string }[] = [
  { type: 'Equipment',  color: '#0ea5e9', textColor: 'text-sky-300',     borderColor: 'border-sky-500/40'     },
  { type: 'Document',   color: '#8b5cf6', textColor: 'text-violet-300',  borderColor: 'border-violet-500/40'  },
  { type: 'Regulation', color: '#f59e0b', textColor: 'text-amber-300',   borderColor: 'border-amber-500/40'   },
  { type: 'Incident',   color: '#ef4444', textColor: 'text-rose-300',    borderColor: 'border-rose-500/40'    },
  { type: 'WorkOrder',  color: '#10b981', textColor: 'text-emerald-300', borderColor: 'border-emerald-500/40' },
  { type: 'Procedure',  color: '#06b6d4', textColor: 'text-cyan-300',    borderColor: 'border-cyan-500/40'    },
];

// ─── Legend config ─────────────────────────────────────────────────────────────
const LEGEND_ITEMS = [
  { label: 'Equipment',  color: '#0ea5e9', kpiClass: 'kpi-card--sky'     },
  { label: 'Document',   color: '#8b5cf6', kpiClass: 'kpi-card--violet'  },
  { label: 'Regulation', color: '#f59e0b', kpiClass: 'kpi-card--amber'   },
  { label: 'Incident',   color: '#ef4444', kpiClass: 'kpi-card--rose'    },
  { label: 'WorkOrder',  color: '#10b981', kpiClass: 'kpi-card--emerald' },
  { label: 'Procedure',  color: '#06b6d4', kpiClass: 'kpi-card--cyan'    },
];

// ─── Mock stats ────────────────────────────────────────────────────────────────
const MOCK_STATS = {
  nodes: 1842,
  edges: 3561,
  entityTypes: 8,
  plantConnections: 12,
};

// ─── Helper: parse Cypher results ─────────────────────────────────────────────
function parseRawCypherResults(records: any[]): { nodes: any[]; edges: any[] } {
  const nodesMap = new Map<string, any>();
  const edgesList: any[] = [];

  records.forEach((record) => {
    Object.values(record).forEach((val: any) => {
      if (!val) return;
      if (val.labels && val.identity && val.properties) {
        const id = val.identity?.low !== undefined ? val.identity.low.toString() : String(val.identity);
        nodesMap.set(id, {
          id,
          label:
            val.properties.tag ||
            val.properties.title ||
            val.properties.name ||
            val.properties.id ||
            val.labels[0] ||
            id,
          type: val.labels[0],
          properties: Object.entries(val.properties).reduce(
            (acc, [k, v]: [string, any]) => {
              acc[k] = typeof v === 'object' && v?.low !== undefined ? v.low : v;
              return acc;
            },
            { _identity: id, _label: val.labels[0] } as Record<string, any>
          ),
        });
      }
      if (val.start && val.end && val.type && val.identity) {
        const id = val.identity?.low !== undefined ? val.identity.low.toString() : String(val.identity);
        const source = val.start?.low !== undefined ? val.start.low.toString() : String(val.start);
        const target = val.end?.low !== undefined ? val.end.low.toString() : String(val.end);
        edgesList.push({ id, source, target, label: val.type });
      }
    });
  });

  return { nodes: Array.from(nodesMap.values()), edges: edgesList };
}

// ─── Query status types ────────────────────────────────────────────────────────
type QueryStatus = 'idle' | 'running' | 'success' | 'error';

// ─── Main Component ────────────────────────────────────────────────────────────
export const KnowledgeGraph: React.FC = () => {
  const navigate = useNavigate();

  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [queryStatus, setQueryStatus] = useState<QueryStatus>('idle');
  const [queryTime, setQueryTime] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Tab: 'cypher' | 'search'
  const [activeTab, setActiveTab] = useState<'cypher' | 'search'>('cypher');

  // Cypher console state
  const [cypherQuery, setCypherQuery] = useState(PRESET_QUERIES[0].query);
  const [showPresets, setShowPresets] = useState(false);
  const presetsRef = useRef<HTMLDivElement>(null);

  // Tag search state
  const [searchTag, setSearchTag] = useState('P-101');

  // Entity filters
  const [activeFilters, setActiveFilters] = useState<EntityFilter[]>([]);

  // Selected node
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  // Stats (live from loaded graph or mock)
  const [stats, setStats] = useState(MOCK_STATS);

  // Close presets on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (presetsRef.current && !presetsRef.current.contains(e.target as Node)) {
        setShowPresets(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Initial load
  useEffect(() => {
    handleExecuteCypher(PRESET_QUERIES[0].query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExecuteCypher = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? cypherQuery).trim();
    if (!q) return;
    setLoading(true);
    setQueryStatus('running');
    setErrorMsg('');
    setSelectedNode(null);
    const t0 = performance.now();
    try {
      const res = await kgApi.runCypher(q);
      const elapsed = Math.round(performance.now() - t0);
      setQueryTime(elapsed);
      if (res.success && res.data) {
        let parsedNodes: any[], parsedEdges: any[];
        if (res.data.nodes) {
          parsedNodes = res.data.nodes;
          parsedEdges = res.data.edges || [];
        } else if (Array.isArray(res.data)) {
          const parsed = parseRawCypherResults(res.data);
          parsedNodes = parsed.nodes;
          parsedEdges = parsed.edges;
        } else {
          parsedNodes = [];
          parsedEdges = [];
        }

        if (parsedNodes.length === 0) {
          // No live data — silently load demo graph (Neo4j offline is expected in dev)
          loadMockDemoData();
          setQueryStatus('success');
          toast('📊 Demo graph loaded — connect Neo4j for live data', { icon: '🔌', duration: 3000 });
        } else {
          setNodes(parsedNodes);
          setEdges(parsedEdges);
          setStats((prev) => ({ ...prev, nodes: parsedNodes.length || prev.nodes, edges: parsedEdges.length || prev.edges }));
          setQueryStatus('success');
          toast.success(`Loaded ${parsedNodes.length} nodes · ${parsedEdges.length} edges · ${elapsed}ms`);
        }
      } else {
        // Silently fall back to demo — no error toast for expected offline Neo4j
        loadMockDemoData();
        setQueryStatus('success');
        toast('📊 Demo graph loaded — connect Neo4j for live data', { icon: '🔌', duration: 3000 });
      }
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - t0);
      setQueryTime(elapsed);
      // Only show user-friendly error — never expose raw driver connection strings
      const rawMsg: string = err?.response?.data?.error || err?.message || 'Query failed';
      const isNeo4jOffline = rawMsg.toLowerCase().includes('neo4j') ||
        rawMsg.toLowerCase().includes('bolt') ||
        rawMsg.toLowerCase().includes('connection') ||
        rawMsg.toLowerCase().includes('connect to server');
      const displayMsg = isNeo4jOffline
        ? 'Graph database offline — showing demo data'
        : rawMsg;
      setErrorMsg(displayMsg);
      setQueryStatus('success'); // treat as success so the canvas loads
      // Fall back to mock demo data on error so the page is never blank
      loadMockDemoData();
      if (!isNeo4jOffline) {
        toast.error(displayMsg);
      } else {
        toast('📊 Demo graph loaded — connect Neo4j for live data', { icon: '🔌', duration: 3000 });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEquipmentSearch = async () => {
    if (!searchTag.trim()) return;
    setLoading(true);
    setQueryStatus('running');
    setErrorMsg('');
    setSelectedNode(null);
    const t0 = performance.now();
    try {
      const res = await kgApi.getEquipmentSubgraph(searchTag.toUpperCase());
      const elapsed = Math.round(performance.now() - t0);
      setQueryTime(elapsed);
      if (res.success && res.data?.nodes && res.data.nodes.length > 0) {
        setNodes(res.data.nodes);
        setEdges(res.data.edges || []);
        setQueryStatus('success');
        toast.success(`Loaded subgraph for ${searchTag} in ${elapsed}ms`);
      } else {
        // Neo4j offline or no data — show mock subgraph silently
        loadMockDemoData();
        setQueryStatus('success');
        toast(`📊 Showing demo subgraph for ${searchTag} — connect Neo4j for live data`, { icon: '🔌', duration: 3000 });
      }
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - t0);
      setQueryTime(elapsed);
      loadMockDemoData();
      setQueryStatus('success');
      toast(`📊 Showing demo subgraph — connect Neo4j for live data`, { icon: '🔌', duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  // Demo mock data so graph canvas never shows blank
  const loadMockDemoData = () => {
    const mockNodes = [
      { id: '1', label: 'P-101', type: 'Equipment',  properties: { tag: 'P-101', description: 'Centrifugal Pump', status: 'Operational', unit: 'Unit-3' } },
      { id: '2', label: 'P-102', type: 'Equipment',  properties: { tag: 'P-102', description: 'Backup Pump', status: 'Standby', unit: 'Unit-3' } },
      { id: '3', label: 'SOP-042', type: 'Document', properties: { title: 'Pump Startup SOP', docType: 'SOP', revision: 'R4' } },
      { id: '4', label: 'OISD-118', type: 'Regulation', properties: { name: 'OISD-118', authority: 'OISD', scope: 'Fire Safety' } },
      { id: '5', label: 'INC-089', type: 'Incident', properties: { id: 'INC-2023-089', severity: 'High', root_cause: 'Seal failure' } },
      { id: '6', label: 'WO-512', type: 'WorkOrder', properties: { id: 'WO-24-00512', type: 'Corrective', status: 'Closed' } },
      { id: '7', label: 'FT-101', type: 'Equipment', properties: { tag: 'FT-101', description: 'Flow Transmitter', status: 'Operational' } },
      { id: '8', label: 'PROC-P-101', type: 'Procedure', properties: { id: 'PROC-P-101', name: 'P-101 Maintenance', version: 'v2' } },
    ];
    const mockEdges = [
      { id: 'e1', source: '1', target: '3', label: 'HAS_DOCUMENT' },
      { id: 'e2', source: '1', target: '4', label: 'COMPLIES_WITH' },
      { id: 'e3', source: '5', target: '1', label: 'OCCURRED_ON' },
      { id: 'e4', source: '6', target: '1', label: 'ASSIGNED_TO' },
      { id: 'e5', source: '1', target: '2', label: 'CONNECTED_TO' },
      { id: 'e6', source: '1', target: '7', label: 'MONITORED_BY' },
      { id: 'e7', source: '8', target: '1', label: 'APPLIES_TO' },
    ];
    setNodes(mockNodes);
    setEdges(mockEdges);
  };

  // Filtered nodes for display (by active entity filters)
  const filteredNodes =
    activeFilters.length === 0
      ? nodes
      : nodes.filter((n) => activeFilters.includes(n.type as EntityFilter));

  const filteredEdges =
    activeFilters.length === 0
      ? edges
      : edges.filter(
          (e) =>
            filteredNodes.some((n) => n.id === e.source) &&
            filteredNodes.some((n) => n.id === e.target)
        );

  const toggleFilter = (type: EntityFilter) =>
    setActiveFilters((prev) =>
      prev.includes(type) ? prev.filter((f) => f !== type) : [...prev, type]
    );

  const nodeCounts = nodes.reduce((acc: Record<string, number>, n) => {
    acc[n.type] = (acc[n.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="fade-in flex flex-col h-[calc(100vh-4rem)] bg-[#06080E] overflow-hidden">

      {/* ═══════════════════ TOOLBAR ════════════════════════════════════════ */}
      <div className="shrink-0 glass-panel border-b border-slate-800/70 px-5 py-3 flex items-center gap-3 flex-wrap">

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 border border-slate-800/60 shrink-0">
          <button
            onClick={() => setActiveTab('cypher')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
              activeTab === 'cypher'
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-lg'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            <TerminalSquare size={12} />
            Cypher Console
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
              activeTab === 'search'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            <Search size={12} />
            Tag Search
          </button>
        </div>

        {/* Cypher input */}
        {activeTab === 'cypher' ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex-1 relative min-w-0">
              <TerminalSquare size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={cypherQuery}
                onChange={(e) => setCypherQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExecuteCypher()}
                placeholder="MATCH (n) RETURN n LIMIT 25"
                className="w-full glass-input py-2 pl-8 pr-3 text-xs font-mono bg-slate-950/60 text-slate-200"
              />
            </div>

            {/* Presets dropdown */}
            <div className="relative shrink-0" ref={presetsRef}>
              <button
                onClick={() => setShowPresets((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700/60 bg-slate-900/60 text-[11px] text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all"
              >
                <List size={12} />
                Presets
                <ChevronDown size={10} className={`transition-transform ${showPresets ? 'rotate-180' : ''}`} />
              </button>
              {showPresets && (
                <div className="absolute top-full mt-1 right-0 w-72 glass-card-static rounded-2xl border border-slate-700/50 shadow-2xl z-50 p-1.5 space-y-0.5">
                  {PRESET_QUERIES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setCypherQuery(p.query);
                        setShowPresets(false);
                        handleExecuteCypher(p.query);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-slate-700/40 transition-colors group"
                    >
                      <span className="text-base shrink-0">{p.icon}</span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-slate-200 group-hover:text-white">{p.name}</p>
                        <p className="text-[9px] text-slate-500 font-mono truncate">{p.query.slice(0, 50)}…</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => handleExecuteCypher()}
              disabled={loading}
              className="btn btn--primary flex items-center gap-1.5 py-2 px-4 shrink-0 disabled:opacity-40"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} fill="currentColor" />}
              <span className="text-[11px] font-bold">Execute</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEquipmentSearch()}
                placeholder="Equipment tag e.g. P-101, V-202…"
                className="w-full glass-input py-2 pl-8 pr-3 text-sm bg-slate-950/60 text-slate-200"
              />
            </div>
            <button
              onClick={handleEquipmentSearch}
              disabled={loading}
              className="btn btn--primary flex items-center gap-1.5 py-2 px-4 shrink-0 disabled:opacity-40"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
              <span className="text-[11px] font-bold">Search</span>
            </button>
          </div>
        )}

        {/* Entity filter chips */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <Filter size={11} className="text-slate-600" />
          {ENTITY_FILTERS.map((ef) => {
            const active = activeFilters.includes(ef.type);
            return (
              <button
                key={ef.type}
                onClick={() => toggleFilter(ef.type)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border transition-all ${
                  active
                    ? `${ef.textColor} ${ef.borderColor} bg-opacity-10`
                    : 'text-slate-600 border-slate-700/50 hover:text-slate-400 hover:border-slate-600'
                }`}
                style={active ? { backgroundColor: `${ef.color}18`, borderColor: ef.color + '66' } : {}}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: active ? ef.color : '#475569' }}
                />
                {ef.type}
                {nodeCounts[ef.type] ? (
                  <span className="ml-0.5 opacity-70">({nodeCounts[ef.type]})</span>
                ) : null}
              </button>
            );
          })}
          {activeFilters.length > 0 && (
            <button
              onClick={() => setActiveFilters([])}
              className="px-2 py-1 rounded-full text-[10px] text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 transition-all"
            >
              <X size={10} />
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════ STATS BAR ══════════════════════════════════════ */}
      <div className="shrink-0 px-5 py-2.5 border-b border-slate-800/50 flex items-center gap-6 bg-slate-900/20">
        {[
          { icon: <Database size={12} />, label: 'Total Nodes', value: filteredNodes.length || stats.nodes, color: 'text-sky-400' },
          { icon: <GitBranch size={12} />, label: 'Edges', value: filteredEdges.length || stats.edges, color: 'text-violet-400' },
          { icon: <Layers size={12} />, label: 'Entity Types', value: stats.entityTypes, color: 'text-amber-400' },
          { icon: <Network size={12} />, label: 'Plant Connections', value: stats.plantConnections, color: 'text-emerald-400' },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-2">
            <span className={stat.color}>{stat.icon}</span>
            <span className="text-[11px] text-slate-400">{stat.label}</span>
            <span className={`text-[13px] font-bold ${stat.color}`}>{stat.value.toLocaleString()}</span>
          </div>
        ))}

        {queryStatus !== 'idle' && (
          <div className="ml-auto flex items-center gap-2">
            {queryStatus === 'running' && (
              <span className="flex items-center gap-1.5 text-[10px] text-sky-400 animate-pulse">
                <Loader2 size={10} className="animate-spin" /> Traversing graph…
              </span>
            )}
            {queryStatus === 'success' && (
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                <CheckCircle2 size={10} /> Query OK
                {queryTime != null && <span className="text-slate-500">· {queryTime}ms</span>}
              </span>
            )}
            {queryStatus === 'error' && (
              <span className="flex items-center gap-1.5 text-[10px] text-rose-400">
                <AlertTriangle size={10} /> {errorMsg.slice(0, 50)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════ MAIN CONTENT (canvas + right panel) ════════════ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Graph Canvas ──────────────────────────────────────────────── */}
        <section className="flex-1 min-w-0 relative overflow-hidden bg-[#06080E]">

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#06080E]/80 z-20 gap-3">
              <div className="relative">
                <Loader2 size={40} className="animate-spin text-sky-400" />
                <div className="absolute inset-0 rounded-full bg-sky-500/10 blur-lg animate-pulse" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-slate-300">Traversing Neo4j Graph</p>
                <p className="text-[11px] text-slate-500">Building ontology topology…</p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && nodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-8 text-center">
              <div className="w-20 h-20 rounded-3xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center shadow-xl">
                <Network size={36} className="text-slate-600" />
              </div>
              <div className="max-w-sm space-y-2">
                <h4 className="text-base font-bold text-slate-300">No Graph Data Loaded</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Run a Cypher query or search an equipment tag like{' '}
                  <code className="text-sky-400 font-mono px-1 py-0.5 rounded bg-sky-500/10">P-101</code>{' '}
                  to visualize the plant ontology.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-sm">
                {PRESET_QUERIES.slice(0, 3).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setCypherQuery(p.query); handleExecuteCypher(p.query); }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl glass-card text-left hover:border-sky-500/30 transition-all group"
                  >
                    <span className="text-lg shrink-0">{p.icon}</span>
                    <span className="text-xs text-slate-300 group-hover:text-slate-100">{p.name}</span>
                    <Zap size={11} className="text-slate-600 group-hover:text-sky-400 ml-auto shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <GraphCanvas
            nodes={filteredNodes}
            edges={filteredEdges}
            onNodeClick={(node: any) => setSelectedNode(node)}
            layoutName="cola"
          />

          {/* Legend overlay (bottom-left of canvas) */}
          <div className="absolute bottom-4 left-4 glass-card-static rounded-2xl border border-slate-700/40 p-3 space-y-1.5 z-10">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Node Types</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {LEGEND_ITEMS.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ background: item.color, boxShadow: `0 0 6px ${item.color}60` }}
                  />
                  <span className="text-[10px] text-slate-400">{item.label}</span>
                  {nodeCounts[item.label] != null && (
                    <span className="text-[9px] text-slate-600">({nodeCounts[item.label]})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Right: Properties Panel ────────────────────────────────────── */}
        {selectedNode ? (
          <aside
            className="w-80 shrink-0 border-l border-slate-800/70 glass-panel flex flex-col overflow-hidden"
            style={{ scrollbarWidth: 'thin' }}
          >
            {/* Header */}
            <div className="shrink-0 px-5 py-4 border-b border-slate-800/50">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {(() => {
                    const ef = ENTITY_FILTERS.find((f) => f.type === selectedNode.type);
                    return (
                      <span
                        className="inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-lg border mb-2"
                        style={{
                          color: ef?.color || '#94a3b8',
                          borderColor: (ef?.color || '#94a3b8') + '55',
                          background: (ef?.color || '#94a3b8') + '15',
                        }}
                      >
                        {selectedNode.type || 'Node'}
                      </span>
                    );
                  })()}
                  <h3 className="text-sm font-bold text-slate-100 truncate" title={selectedNode.label}>
                    {selectedNode.label}
                  </h3>
                  {selectedNode.properties?.description && (
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{selectedNode.properties.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-all shrink-0"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Properties table */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent' }}>
              <div>
                <p className="section-header mb-3">Node Properties</p>
                <div className="rounded-xl border border-slate-800/60 overflow-hidden bg-slate-950/30">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <tbody>
                      {Object.entries(selectedNode.properties || {})
                        .filter(([key]) => !key.startsWith('_'))
                        .map(([key, val]) => (
                          <tr key={key} className="border-b border-slate-900/80 hover:bg-slate-900/20 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-slate-500 uppercase tracking-wider text-[9px] w-28 shrink-0 align-top pt-3">
                              {key}
                            </td>
                            <td className="py-2.5 px-3 text-slate-300 break-all font-mono leading-relaxed select-all">
                              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <p className="section-header mb-3">Quick Actions</p>
                <div className="space-y-2">
                  {selectedNode.type === 'Equipment' && (selectedNode.properties?.tag || selectedNode.label) && (
                    <button
                      onClick={() =>
                        navigate(`/maintenance?tag=${encodeURIComponent(selectedNode.properties?.tag || selectedNode.label)}`)
                      }
                      className="btn btn--primary w-full flex items-center justify-center gap-2 py-2.5 text-xs"
                    >
                      <Cpu size={13} />
                      View Asset Passport
                      <ExternalLink size={11} className="ml-auto opacity-60" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const tag = selectedNode.properties?.tag || selectedNode.label;
                      navigate('/copilot', {
                        state: { prefilledQuery: `What details are associated with asset ${tag}?` },
                      });
                    }}
                    className="btn btn--secondary w-full flex items-center justify-center gap-2 py-2.5 text-xs"
                  >
                    <Sparkles size={13} className="text-sky-400" />
                    Ask Copilot About This
                  </button>
                  {selectedNode.type !== 'Equipment' && (
                    <button
                      onClick={() => {
                        const neighborQuery = `MATCH (n)-[r]-(m) WHERE id(n) = ${selectedNode.id} RETURN n, r, m LIMIT 20`;
                        setCypherQuery(neighborQuery);
                        setActiveTab('cypher');
                        handleExecuteCypher(neighborQuery);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-400 border border-slate-700/50 hover:border-slate-600 hover:text-slate-200 hover:bg-slate-800/30 transition-all"
                    >
                      <Network size={13} />
                      Expand Neighbors
                    </button>
                  )}
                </div>
              </div>

              {/* Relationship hint */}
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/50">
                <div className="flex items-center gap-2">
                  <GitBranch size={11} className="text-slate-500 shrink-0" />
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Click neighboring nodes in the canvas to drill down. Use "Expand Neighbors" to load all connected nodes.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        ) : (
          /* Collapsed right panel hint */
          <div className="w-10 shrink-0 border-l border-slate-800/40 flex flex-col items-center justify-center gap-4 py-4">
            <div className="writing-mode-vertical text-[9px] text-slate-600 uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              Select a node
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════ BOTTOM STATUS BAR ═════════════════════════════ */}
      <div className="shrink-0 h-7 border-t border-slate-800/50 glass-panel px-5 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              queryStatus === 'running' ? 'bg-sky-400 animate-ping' :
              queryStatus === 'success' ? 'bg-emerald-400' :
              queryStatus === 'error' ? 'bg-rose-400' : 'bg-slate-600'
            }`}
          />
          <span className="text-[9px] text-slate-500">
            {queryStatus === 'running' ? 'Executing…' :
             queryStatus === 'success' ? 'Query complete' :
             queryStatus === 'error' ? 'Query error' : 'Idle'}
          </span>
        </div>

        {queryTime != null && (
          <div className="flex items-center gap-1 text-[9px] text-slate-600">
            <Clock size={9} />
            {queryTime}ms
          </div>
        )}

        <div className="ml-auto flex items-center gap-3 text-[9px] text-slate-600">
          <span>{filteredNodes.length} nodes displayed</span>
          <span>·</span>
          <span>{filteredEdges.length} edges</span>
          {activeFilters.length > 0 && (
            <>
              <span>·</span>
              <span className="text-amber-500">{activeFilters.length} filter{activeFilters.length > 1 ? 's' : ''} active</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraph;
