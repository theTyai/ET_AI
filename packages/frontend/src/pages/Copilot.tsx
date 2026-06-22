import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryStore } from '../store/query.store';
import { useRAGQuery } from '../hooks/useRAGQuery';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { marked } from 'marked';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  BookOpen,
  CheckCircle,
  Brain,
  FileText,
  Zap,
  Shield,
  Wrench,
  ChevronDown,
  ChevronRight,
  X,
  BarChart2,
  Network,
  Clock,
  AlertCircle,
  ArrowRight,
  Trash2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type QueryMode = 'general' | 'equipment' | 'compliance' | 'rca';

interface KGEntity {
  label: string;
  type: 'Equipment' | 'Document' | 'Regulation' | 'Incident' | 'WorkOrder';
  confidence: number;
}

// ─── Mock KG entities extracted from conversation ─────────────────────────────
const MOCK_ENTITIES: KGEntity[] = [
  { label: 'Pump P-101', type: 'Equipment', confidence: 0.97 },
  { label: 'SOP-MAINT-042', type: 'Document', confidence: 0.92 },
  { label: 'OISD-118', type: 'Regulation', confidence: 0.88 },
  { label: 'INC-2023-089', type: 'Incident', confidence: 0.84 },
  { label: 'WO-24-00512', type: 'WorkOrder', confidence: 0.79 },
];

// ─── Query Mode Config ─────────────────────────────────────────────────────────
const QUERY_MODES: { id: QueryMode; label: string; icon: React.ReactNode; color: string; placeholder: string }[] = [
  {
    id: 'general',
    label: 'General Query',
    icon: <Brain size={13} />,
    color: 'sky',
    placeholder: 'Ask anything about plant operations, maintenance, or safety...',
  },
  {
    id: 'equipment',
    label: 'Equipment Lookup',
    icon: <Wrench size={13} />,
    color: 'emerald',
    placeholder: 'Describe the equipment tag, class, or failure mode to look up...',
  },
  {
    id: 'compliance',
    label: 'Compliance Check',
    icon: <Shield size={13} />,
    color: 'amber',
    placeholder: 'Ask about OISD standards, safety codes, or regulatory gaps...',
  },
  {
    id: 'rca',
    label: 'RCA Analysis',
    icon: <Zap size={13} />,
    color: 'rose',
    placeholder: 'Describe an incident or failure for root cause analysis...',
  },
];

// ─── Suggestion chips per mode ────────────────────────────────────────────────
const SUGGESTIONS: Record<QueryMode, string[]> = {
  general: [
    'What is the startup procedure for Pump P-101?',
    'Summarize last 3 months of maintenance activity',
    'What are the critical safety distances in the refinery?',
    'List all equipment due for inspection this quarter',
    'What documentation exists for Compressor K-202?',
  ],
  equipment: [
    'Show all corrective WOs for pump class equipment',
    'What is the MTBF for Pump P-101?',
    'List all instruments on PID-101-A',
    'Which heat exchangers are in overhaul schedule?',
    'Failure modes for centrifugal pump internals',
  ],
  compliance: [
    'OISD compliance gaps for Unit-3',
    'Which equipment violates OISD-118 safety distances?',
    'List all open non-conformities for statutory inspection',
    'What are the PSV relief valve requirements per OISD-163?',
    'Show fire detection compliance status for Unit-5',
  ],
  rca: [
    'Root cause analysis for INC-2023-089',
    'Why did Pump P-101 fail in March 2024?',
    'Recurring failure pattern for centrifugal pump seals',
    'What corrective actions were taken after the last shutdown?',
    'Analyze bearing failure incidents across all units',
  ],
};

// ─── Entity type styling ──────────────────────────────────────────────────────
const ENTITY_STYLES: Record<string, { badge: string; color: string }> = {
  Equipment: { badge: 'badge badge--info', color: '#0ea5e9' },
  Document: { badge: 'badge badge--violet', color: '#8b5cf6' },
  Regulation: { badge: 'badge badge--warning', color: '#f59e0b' },
  Incident: { badge: 'badge badge--danger', color: '#ef4444' },
  WorkOrder: { badge: 'badge badge--success', color: '#10b981' },
};

// ─── Doc type badge color map ─────────────────────────────────────────────────
const DOC_TYPE_CLASS: Record<string, string> = {
  SOP: 'badge badge--info',
  PID: 'badge badge--violet',
  WorkOrder: 'badge badge--success',
  InspectionReport: 'badge badge--warning',
  OEMManual: 'badge badge--neutral',
  IncidentReport: 'badge badge--danger',
};

// ─── Confidence bar color ─────────────────────────────────────────────────────
function confidenceScore(level?: 'High' | 'Medium' | 'Low') {
  if (level === 'High') return { pct: 92, color: '#10b981', label: 'High' };
  if (level === 'Medium') return { pct: 65, color: '#f59e0b', label: 'Medium' };
  return { pct: 32, color: '#ef4444', label: 'Low' };
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
const TypingIndicator: React.FC = () => (
  <div className="flex items-center gap-1.5 px-3 py-2">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-2 h-2 rounded-full bg-sky-400/70"
        style={{ animation: `bounce 1.2s infinite ${i * 0.2}s` }}
      />
    ))}
  </div>
);

// ─── Source Citation Card ─────────────────────────────────────────────────────
interface SourceProps {
  source: any;
  index: number;
}
const SourceCard: React.FC<SourceProps> = ({ source, index }) => {
  const docType = source.docType || source.type || 'Document';
  const badgeClass = DOC_TYPE_CLASS[docType] || 'badge badge--neutral';
  const relevance = source.score != null ? Math.round(source.score * 100) : Math.round(85 - index * 7);

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-700/40 bg-slate-900/50 hover:border-slate-600/60 transition-all cursor-pointer group"
      style={{ backdropFilter: 'blur(6px)' }}
    >
      <span className={`${badgeClass} shrink-0 text-[9px] py-0.5 px-1.5`}>{docType}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-sky-300 truncate group-hover:text-sky-200">
          {source.title || source.documentTitle || `Source ${index + 1}`}
        </p>
        <p className="text-[9px] text-slate-500">
          {source.pageNumbers?.length ? `p. ${source.pageNumbers.join(', ')}` : 'Embedded chunk'}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <div className="w-10 h-1 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${relevance}%`,
              background: relevance > 80 ? '#10b981' : relevance > 60 ? '#f59e0b' : '#ef4444',
            }}
          />
        </div>
        <span className="text-[9px] text-slate-400">{relevance}%</span>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export const Copilot: React.FC = () => {
  const [input, setInput] = useState('');
  const [queryMode, setQueryMode] = useState<QueryMode>('general');
  const [expandedSources, setExpandedSources] = useState<Record<number, boolean>>({});
  const [entities, setEntities] = useState<KGEntity[]>([]);
  const [showEntities, setShowEntities] = useState(true);

  const chatHistory = useQueryStore((state) => state.chatHistory);
  const clearChat = useQueryStore((state) => state.clearChat);
  const { askQuestion, loading } = useRAGQuery();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { isListening, toggleListening, isSupported } = useVoiceInput(
    useCallback((transcript: string) => setInput(transcript), [])
  );

  // Keep doc type filters aligned per mode
  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>([]);
  const [equipmentFilter, setEquipmentFilter] = useState('');

  const currentMode = QUERY_MODES.find((m) => m.id === queryMode)!;

  // Extract mock KG entities whenever a new bot message arrives
  useEffect(() => {
    const botMsgs = chatHistory.filter((m) => m.sender === 'bot' && m.text);
    if (botMsgs.length > 0) {
      setEntities(MOCK_ENTITIES.slice(0, 3 + (botMsgs.length % 3)));
    }
  }, [chatHistory]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;
    const queryText = input;
    setInput('');
    const filters: any = { mode: queryMode };
    if (selectedDocTypes.length > 0) filters.docTypes = selectedDocTypes;
    if (equipmentFilter) filters.equipmentTags = [equipmentFilter];
    await askQuestion(queryText, filters);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => {
      document.getElementById('chat-send-btn')?.click();
    }, 80);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  const toggleSourceExpand = (idx: number) =>
    setExpandedSources((prev) => ({ ...prev, [idx]: !prev[idx] }));

  // Collect all sources from the most recent bot message
  const latestBotSources = (() => {
    const botMsgs = chatHistory.filter((m) => m.sender === 'bot');
    const last = botMsgs[botMsgs.length - 1];
    return last?.sources || [];
  })();

  // Confidence breakdown for chart
  const confBreakdown = [
    { label: 'Vector Match', pct: 88 },
    { label: 'Doc Coverage', pct: 74 },
    { label: 'KG Coherence', pct: 91 },
    { label: 'Regulatory Align.', pct: 66 },
  ];

  return (
    <div className="fade-in flex h-[calc(100vh-4rem)] bg-[#07090F] overflow-hidden">

      {/* ═══════════════════ LEFT: CHAT PANEL (2/3) ═══════════════════ */}
      <div className="flex flex-col flex-1 min-w-0 border-r border-slate-800/60" style={{ flex: '2 1 0%' }}>

        {/* ── Top: Mode Tabs ──────────────────────────────────────────── */}
        <div className="shrink-0 glass-panel border-b border-slate-800/70 px-5 py-3 flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 border border-slate-800/60">
            {QUERY_MODES.map((mode) => {
              const active = queryMode === mode.id;
              const colorMap: Record<string, string> = {
                sky: active ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'text-slate-500 hover:text-slate-300',
                emerald: active ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'text-slate-500 hover:text-slate-300',
                amber: active ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'text-slate-500 hover:text-slate-300',
                rose: active ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'text-slate-500 hover:text-slate-300',
              };
              return (
                <button
                  key={mode.id}
                  onClick={() => setQueryMode(mode.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
                    active ? `${colorMap[mode.color]} shadow-lg` : `border-transparent ${colorMap[mode.color]}`
                  }`}
                >
                  {mode.icon}
                  <span className="hidden sm:inline">{mode.label}</span>
                </button>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-slate-500 hidden md:block">
              <span className={`font-semibold text-${currentMode.color}-400`}>{currentMode.label}</span> mode active
            </span>
            <button
              onClick={() => { clearChat(); setEntities([]); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
              title="Clear conversation"
            >
              <Trash2 size={12} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        </div>

        {/* ── Chat Window ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent' }}>

          {chatHistory.length === 0 ? (
            /* ── Empty State ── */
            <div className="flex flex-col items-center justify-center h-full text-center max-w-xl mx-auto gap-7">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-500/20 to-violet-500/10 border border-sky-500/20 flex items-center justify-center shadow-2xl shadow-sky-500/10">
                  <Sparkles size={36} className="text-sky-400" />
                </div>
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#07090F] flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                </span>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold gradient-text-sky">IKIP Expert Copilot</h2>
                <p className="text-sm text-slate-400 leading-relaxed max-w-md">
                  Grounded AI answers from your plant's documents, equipment history, and regulatory codes. Ask in natural language.
                </p>
              </div>

              {/* Suggestion chips */}
              <div className="w-full space-y-2">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Try asking…</p>
                <div className="flex flex-col gap-2">
                  {SUGGESTIONS[queryMode].map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSuggestionClick(q)}
                      className="group flex items-center gap-3 px-4 py-3 rounded-xl glass-card text-left hover:border-sky-500/30 hover:bg-sky-500/5 transition-all"
                    >
                      <ArrowRight size={12} className="text-sky-500/50 group-hover:text-sky-400 shrink-0 transition-colors" />
                      <span className="text-xs text-slate-300 group-hover:text-slate-100">{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ── Message Feed ── */
            chatHistory.map((msg, index) => {
              const isBot = msg.sender === 'bot';
              const conf = isBot && msg.confidence ? confidenceScore(msg.confidence) : null;
              const isStreaming = isBot && !msg.text && loading && index === chatHistory.length - 1;
              const sourcesExpanded = expandedSources[index];

              return (
                <div
                  key={index}
                  className={`flex gap-3 slide-in-right ${isBot ? '' : 'flex-row-reverse'}`}
                  style={{ animationDelay: `${index * 20}ms` }}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-[11px] font-bold shadow-lg ${
                    isBot
                      ? 'bg-gradient-to-br from-sky-500/20 to-violet-500/20 border border-sky-500/20 text-sky-400'
                      : 'bg-slate-700/80 border border-slate-600/50 text-slate-300'
                  }`}>
                    {isBot ? <Brain size={15} /> : 'U'}
                  </div>

                  {/* Bubble */}
                  <div className={`flex-1 max-w-[88%] space-y-3 ${isBot ? '' : 'flex flex-col items-end'}`}>
                    {isStreaming ? (
                      <div className="chat-bubble-bot inline-flex">
                        <TypingIndicator />
                      </div>
                    ) : isBot ? (
                      <>
                        {/* Bot message bubble */}
                        <div className="chat-bubble-bot">
                          <div
                            className="prose prose-invert prose-sm text-sm text-slate-200 leading-relaxed max-w-none"
                            dangerouslySetInnerHTML={{ __html: marked.parse(msg.text || '…') as string }}
                          />
                        </div>

                        {/* Confidence bar */}
                        {conf && (
                          <div className="flex items-center gap-3 px-1">
                            <CheckCircle size={11} className="text-slate-500 shrink-0" />
                            <span className="text-[10px] text-slate-500">AI Confidence</span>
                            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${conf.pct}%`, background: conf.color }}
                              />
                            </div>
                            <span className="text-[10px] font-bold" style={{ color: conf.color }}>{conf.label} · {conf.pct}%</span>
                          </div>
                        )}

                        {/* Source citations */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="space-y-2">
                            <button
                              onClick={() => toggleSourceExpand(index)}
                              className="flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-slate-300 uppercase tracking-wider transition-colors"
                            >
                              <BookOpen size={11} />
                              {msg.sources.length} Source{msg.sources.length !== 1 ? 's' : ''} cited
                              {sourcesExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                            </button>
                            {sourcesExpanded && (
                              <div className="space-y-1.5 pl-1">
                                {msg.sources.map((src, sIdx) => (
                                  <SourceCard key={sIdx} source={src} index={sIdx} />
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Suggested follow-ups */}
                        {msg.suggestedQueries && msg.suggestedQueries.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {msg.suggestedQueries.map((q, qIdx) => (
                              <button
                                key={qIdx}
                                onClick={() => handleSuggestionClick(q)}
                                className="px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 hover:border-sky-500/40 hover:bg-sky-500/5 text-[10px] text-slate-400 hover:text-sky-300 transition-all"
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="chat-bubble-user">
                        <p className="text-sm text-slate-100">{msg.text}</p>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className={`flex items-center gap-1 text-[9px] text-slate-600 px-1 ${isBot ? '' : 'justify-end'}`}>
                      <Clock size={9} />
                      {msg.timestamp
                        ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Streaming indicator when loading and last msg is user */}
          {loading && chatHistory.length > 0 && chatHistory[chatHistory.length - 1]?.sender === 'user' && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-gradient-to-br from-sky-500/20 to-violet-500/20 border border-sky-500/20 text-sky-400">
                <Brain size={15} />
              </div>
              <div className="chat-bubble-bot inline-flex">
                <TypingIndicator />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* ── Input Bar ───────────────────────────────────────────────── */}
        <div className="shrink-0 p-4 border-t border-slate-800/60 glass-panel">
          <form onSubmit={handleSend} className="flex items-end gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={currentMode.placeholder}
                className="w-full glass-input py-3.5 pr-20 text-sm bg-slate-950/60 text-slate-100 placeholder:text-slate-600"
                disabled={loading}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {isSupported && (
                  <button
                    type="button"
                    onClick={toggleListening}
                    title="Voice input"
                    className={`p-2 rounded-lg transition-all ${
                      isListening
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                  </button>
                )}
              </div>
            </div>
            <button
              type="submit"
              id="chat-send-btn"
              disabled={loading || !input.trim()}
              className="btn btn--primary flex items-center gap-2 py-3.5 px-5 shrink-0 disabled:opacity-30 disabled:pointer-events-none"
            >
              <Send size={15} />
              <span className="hidden sm:inline text-sm font-semibold">Send</span>
            </button>
          </form>

          {/* Filter chips */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Scope:</span>
            {['SOP', 'PID', 'WorkOrder', 'IncidentReport'].map((type) => {
              const active = selectedDocTypes.includes(type);
              return (
                <button
                  key={type}
                  onClick={() =>
                    setSelectedDocTypes((prev) =>
                      active ? prev.filter((t) => t !== type) : [...prev, type]
                    )
                  }
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border transition-all ${
                    active
                      ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
                      : 'text-slate-600 border-slate-700/60 hover:text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {type}
                </button>
              );
            })}
            <div className="flex items-center gap-1 ml-auto">
              <input
                type="text"
                value={equipmentFilter}
                onChange={(e) => setEquipmentFilter(e.target.value)}
                placeholder="Asset tag…"
                className="h-5 px-2 rounded bg-slate-900/60 border border-slate-700/60 text-[10px] text-slate-400 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/40 w-20"
              />
              {equipmentFilter && (
                <button onClick={() => setEquipmentFilter('')} className="text-slate-600 hover:text-slate-400">
                  <X size={11} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════ RIGHT: SOURCE PANEL (1/3) ════════════════════ */}
      <div
        className="flex flex-col border-l border-slate-800/60 glass-panel overflow-y-auto"
        style={{ flex: '1 1 0%', minWidth: '280px', maxWidth: '380px', scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent' }}
      >

        {/* Panel header */}
        <div className="shrink-0 px-5 py-4 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-sky-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Knowledge Panel</h3>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Retrieved documents · Extracted entities</p>
        </div>

        {/* ── Source Documents ── */}
        <div className="px-5 py-4 border-b border-slate-800/40">
          <div className="section-header flex items-center gap-2 mb-3">
            <BookOpen size={11} />
            Source Documents
            {latestBotSources.length > 0 && (
              <span className="ml-auto badge badge--info text-[9px] py-0.5 px-1.5">{latestBotSources.length}</span>
            )}
          </div>

          {latestBotSources.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <BookOpen size={24} className="text-slate-700 mx-auto" />
              <p className="text-[10px] text-slate-600">Sources will appear here after your first query</p>
            </div>
          ) : (
            <div className="space-y-2">
              {latestBotSources.map((src: any, idx: number) => (
                <SourceCard key={idx} source={src} index={idx} />
              ))}
            </div>
          )}
        </div>

        {/* ── KG Entities ── */}
        <div className="px-5 py-4 border-b border-slate-800/40">
          <button
            onClick={() => setShowEntities((v) => !v)}
            className="section-header flex items-center gap-2 mb-3 w-full text-left"
          >
            <Network size={11} />
            KG Entities Extracted
            {entities.length > 0 && (
              <span className="ml-auto badge badge--violet text-[9px] py-0.5 px-1.5">{entities.length}</span>
            )}
            {showEntities ? <ChevronDown size={10} className="text-slate-500" /> : <ChevronRight size={10} className="text-slate-500" />}
          </button>

          {showEntities && (
            entities.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <Network size={24} className="text-slate-700 mx-auto" />
                <p className="text-[10px] text-slate-600">Graph entities identified during retrieval</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {entities.map((ent, idx) => {
                  const style = ENTITY_STYLES[ent.type] || { badge: 'badge badge--neutral', color: '#64748b' };
                  return (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-800/50 hover:border-slate-700/60 transition-all group cursor-pointer">
                      <span className={`${style.badge} text-[9px] py-0.5 px-1.5 shrink-0`}>{ent.type}</span>
                      <span className="text-[11px] text-slate-300 group-hover:text-slate-100 flex-1 truncate font-medium">{ent.label}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <div className="w-8 h-1 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.round(ent.confidence * 100)}%`, background: style.color }} />
                        </div>
                        <span className="text-[9px]" style={{ color: style.color }}>{Math.round(ent.confidence * 100)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* ── Confidence Breakdown Chart ── */}
        <div className="px-5 py-4">
          <div className="section-header flex items-center gap-2 mb-4">
            <BarChart2 size={11} />
            Confidence Breakdown
          </div>

          {chatHistory.some((m) => m.sender === 'bot' && m.text) ? (
            <div className="space-y-3">
              {confBreakdown.map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">{item.label}</span>
                    <span className="text-[10px] font-bold text-slate-300">{item.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${item.pct}%`,
                        background: item.pct > 80
                          ? 'linear-gradient(90deg, #10b981, #34d399)'
                          : item.pct > 60
                          ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                          : 'linear-gradient(90deg, #ef4444, #f87171)',
                      }}
                    />
                  </div>
                </div>
              ))}

              <div className="mt-4 p-3 rounded-xl bg-slate-900/40 border border-slate-800/50">
                <div className="flex items-center gap-2">
                  <AlertCircle size={12} className="text-amber-400 shrink-0" />
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Confidence scores reflect retrieval quality, not absolute factual certainty. Always verify critical decisions with source documents.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-2">
              <BarChart2 size={24} className="text-slate-700 mx-auto" />
              <p className="text-[10px] text-slate-600">Confidence metrics shown after first response</p>
            </div>
          )}
        </div>
      </div>

      {/* Inline keyframes for bounce */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.7; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Copilot;
