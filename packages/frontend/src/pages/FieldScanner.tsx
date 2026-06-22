import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { plantApi } from '../api/plant.api';
import { offlineCache } from '../utils/offlineCache';
import {
  Camera, Wifi, WifiOff, Search, ShieldAlert, CheckCircle,
  Cpu, Sparkles, MapPin, Wrench, Clock,
  AlertTriangle, Activity, Thermometer, Gauge, Zap, Radio,
  ChevronRight, X, RotateCcw, AlertCircle, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Mock offline asset cache ─────────────────────────────────────────────────
const MOCK_CACHED_ASSETS: Record<string, any> = {
  'P-101': {
    equipment: {
      tag: 'P-101', equipmentClass: 'Pump', operationalStatus: 'Operating', criticality: 'Critical',
      description: 'Crude Oil Charge Pump – Train A', location: 'Unit-1 / Pump Bay A',
      mtbf: 4380, designCapacity: '320 m³/hr @ 12.5 kg/cm²',
      lastMaintenance: '2026-04-10', nextDueMaintenance: '2026-10-10',
    },
    operationalParams: {
      suctionPressure: '2.1 kg/cm²', dischargePressure: '11.8 kg/cm²',
      flowRate: '298 m³/hr', temperature: '82°C', vibrationLevel: '2.4 mm/s',
    },
    safetyRules: [
      'Verify ground connection is securely clamped before startup.',
      'Discharge pressure must not exceed 12.5 kg/cm² — trip if exceeded.',
      'Ensure minimum flow bypass valve is open (>15%) during startup.',
    ],
  },
  'K-202': {
    equipment: {
      tag: 'K-202', equipmentClass: 'Compressor', operationalStatus: 'Maintenance', criticality: 'Critical',
      description: 'Fuel Gas Compressor – Reformer Feed', location: 'Unit-2 / Compressor House',
      mtbf: 5256, designCapacity: '12,000 Nm³/hr @ 6.2 kg/cm²',
      lastMaintenance: '2026-06-01', nextDueMaintenance: '2026-12-01',
    },
    operationalParams: {
      suctionPressure: '—', dischargePressure: '—', flowRate: '—',
      temperature: '—', vibrationLevel: '—',
    },
    safetyRules: [
      'Isolate and depressurize system before any seal work. Tag-out required.',
      'H₂ content in fuel gas — ensure continuous gas detection active.',
      'Confirm dry gas seal buffer N₂ pressure (2.5–3.0 kg/cm²g) before startup.',
    ],
  },
  'V-205': {
    equipment: {
      tag: 'V-205', equipmentClass: 'Vessel', operationalStatus: 'Operating', criticality: 'High',
      description: 'Reflux Accumulator – Column T-201', location: 'Unit-2 / Column Platform Lvl 3',
      mtbf: 8760, designCapacity: '8.0 kg/cm²g MAWP',
      lastMaintenance: '2026-01-20', nextDueMaintenance: '2027-01-20',
    },
    operationalParams: {
      suctionPressure: 'N/A', dischargePressure: '5.2 kg/cm²g',
      flowRate: 'Reflux: 42 m³/hr', temperature: '98°C', vibrationLevel: 'N/A',
    },
    safetyRules: [
      'PSV-205A must be tested and certified before pressurizing.',
      'Maintain liquid level 30–70% NLL. High-level trip at 85%.',
      'Vent to flare header only — never open to atmosphere.',
    ],
  },
};

const RECENT_CACHED = ['P-101', 'K-202', 'V-205'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const StatusPill = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    Operating: 'badge badge--success', Standby: 'badge badge--info',
    Maintenance: 'badge badge--warning', Tripped: 'badge badge--danger',
  };
  const dotMap: Record<string, string> = {
    Operating: 'bg-emerald-400 animate-pulse', Standby: 'bg-sky-400',
    Maintenance: 'bg-amber-400 animate-pulse', Tripped: 'bg-rose-400 animate-pulse',
  };
  return (
    <span className={`${map[status] || 'badge badge--neutral'} flex items-center gap-1.5`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotMap[status] || 'bg-slate-400'}`} />
      {status}
    </span>
  );
};

const CriticalityPill = ({ level }: { level: string }) => {
  const map: Record<string, string> = {
    Critical: 'badge badge--danger', High: 'badge badge--warning',
    Medium: 'badge badge--info', Low: 'badge badge--neutral',
  };
  return <span className={map[level] || 'badge badge--neutral'}>{level}</span>;
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const FieldScanner: React.FC = () => {
  const navigate = useNavigate();
  const [tagInput, setTagInput] = useState('');
  const [assetData, setAssetData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [forceOffline, setForceOffline] = useState(false);
  const [isOfflineCached, setIsOfflineCached] = useState(false);

  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'detected'>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cachedTags, setCachedTags] = useState<string[]>(RECENT_CACHED);

  // Network state listeners
  useEffect(() => {
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);

  // Load cached tags from IDB
  useEffect(() => {
    (async () => {
      try {
        const { openDB } = await import('idb');
        const db = await openDB('ikip_offline_db', 1);
        const store = db.transaction('equipment_passport_cache').objectStore('equipment_passport_cache');
        const keys = await store.getAllKeys();
        if (keys.length > 0) setCachedTags(keys.map(String));
      } catch {
        // IDB not available, use mock data
      }
    })();
  }, [assetData]);

  const activeOnlineState = isOnline && !forceOffline;

  const handleLookupTag = async (tagToSearch: string) => {
    if (!tagToSearch.trim()) return;
    const cleanTag = tagToSearch.trim().toUpperCase();
    setLoading(true);
    setAssetData(null);
    setIsOfflineCached(false);

    if (activeOnlineState) {
      try {
        const res = await plantApi.getEquipmentPassport(cleanTag);
        if (res.success && res.data) {
          setAssetData(res.data);
          await offlineCache.cacheEquipment(cleanTag, res.data);
          toast.success(`Asset ${cleanTag} loaded & cached`);
        } else {
          // Fallback to mock
          if (MOCK_CACHED_ASSETS[cleanTag]) {
            setAssetData(MOCK_CACHED_ASSETS[cleanTag]);
            toast.success(`Asset ${cleanTag} loaded`);
          } else {
            toast.error('Asset not found in registry');
          }
        }
      } catch {
        // Fallback to mock/cache on network error
        if (MOCK_CACHED_ASSETS[cleanTag]) {
          setAssetData(MOCK_CACHED_ASSETS[cleanTag]);
          setIsOfflineCached(true);
          toast('Network unavailable. Showing local cache.', { icon: '📴' });
        } else {
          toast.error('Asset not found. Connect online to fetch.');
        }
      }
    } else {
      // Offline mode
      const cached = await offlineCache.getCachedEquipment(cleanTag).catch(() => null);
      const mockData = MOCK_CACHED_ASSETS[cleanTag];
      if (cached || mockData) {
        setAssetData(cached || mockData);
        setIsOfflineCached(true);
        toast.success(`Offline: loaded cached data for ${cleanTag}`);
      } else {
        toast.error(`${cleanTag} not in local cache. Go online to fetch.`);
      }
    }
    setLoading(false);
  };

  // Simulated scan
  const triggerCameraScan = () => {
    if (scanStatus === 'scanning') return;
    setScanStatus('scanning');
    setScanProgress(0);
    let p = 0;
    scanIntervalRef.current = setInterval(() => {
      p += Math.random() * 12 + 4;
      setScanProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(scanIntervalRef.current!);
        const mockTags = ['P-101', 'K-202', 'V-205'];
        const scannedTag = mockTags[Math.floor(Math.random() * mockTags.length)];
        setScanStatus('detected');
        setTagInput(scannedTag);
        toast.success(`QR Detected: ${scannedTag}`, { id: 'qr-scan', icon: '📷' });
        setTimeout(() => {
          setScanStatus('idle');
          setScanProgress(0);
          handleLookupTag(scannedTag);
        }, 800);
      }
    }, 120);
  };

  const cancelScan = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    setScanStatus('idle');
    setScanProgress(0);
  };

  const clearResult = () => {
    setAssetData(null);
    setTagInput('');
    setIsOfflineCached(false);
  };

  return (
    <div className="max-w-[480px] mx-auto px-4 py-6 space-y-5 pb-28 fade-in">
      {/* Ambient glow */}
      <div className="fixed top-0 inset-x-0 h-64 bg-gradient-to-b from-sky-500/6 to-transparent pointer-events-none" />

      {/* ─── Header Bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="section-header text-[9px]">Field Operations</p>
          <h1 className="text-lg font-black text-slate-100">Asset Scanner</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Online/Offline indicator */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold ${activeOnlineState ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'}`}>
            {activeOnlineState ? <Wifi size={12} /> : <WifiOff size={12} />}
            {activeOnlineState ? 'Online' : 'Offline'}
          </div>
          {/* Force offline toggle */}
          <button
            onClick={() => {
              setForceOffline(!forceOffline);
              toast(!forceOffline ? 'Offline mode active — using local cache only' : 'Online mode restored', { icon: !forceOffline ? '🔌' : '🌐' });
            }}
            className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wide transition-all ${forceOffline ? 'bg-rose-500/15 border-rose-500/30 text-rose-400 hover:bg-rose-500/20' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'}`}
          >
            {forceOffline ? 'Go Online' : 'Force Offline'}
          </button>
        </div>
      </div>

      {/* ─── Offline Banner ───────────────────────────────────────────────── */}
      {!activeOnlineState && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-xs text-rose-300 font-semibold">
          <WifiOff size={14} className="text-rose-400 shrink-0" />
          <div>
            <span className="font-bold text-rose-400">Offline Mode Active</span>
            <span className="text-rose-400/70"> — Serving data from IndexedDB local cache. Changes will sync on reconnect.</span>
          </div>
        </div>
      )}

      {/* ─── Scanner Viewfinder ───────────────────────────────────────────── */}
      <div className="glass-panel p-5 rounded-2xl space-y-4">
        {/* Viewfinder */}
        <div className="scanner-viewfinder relative" onClick={scanStatus === 'idle' ? triggerCameraScan : undefined}>
          {/* Corner brackets */}
          <div className="scanner-corner scanner-corner--tl" />
          <div className="scanner-corner scanner-corner--tr" />
          <div className="scanner-corner scanner-corner--bl" />
          <div className="scanner-corner scanner-corner--br" />

          {/* Scan content */}
          {scanStatus === 'idle' && (
            <div className="flex flex-col items-center gap-3 cursor-pointer select-none group">
              <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center group-hover:bg-sky-500/15 group-hover:scale-105 transition-all">
                <Camera size={28} className="text-sky-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-200">Tap to Scan QR Tag</p>
                <p className="text-[10px] text-slate-500 mt-1">Point at equipment barcode or QR label</p>
              </div>
              <div className="flex gap-2">
                <span className="badge badge--neutral text-[9px]">QR Code</span>
                <span className="badge badge--neutral text-[9px]">Barcode</span>
                <span className="badge badge--neutral text-[9px]">NFC Tag</span>
              </div>
            </div>
          )}

          {scanStatus === 'scanning' && (
            <div className="flex flex-col items-center gap-3 w-full">
              {/* Scan line animation */}
              <div className="scan-line" style={{ top: `${scanProgress}%` }} />

              <div className="text-center space-y-2 z-10 relative">
                <div className="flex items-center justify-center gap-2 text-sky-400">
                  <Radio size={16} className="animate-pulse" />
                  <span className="text-sm font-bold">Scanning…</span>
                </div>
                <p className="text-[10px] text-slate-400">Align asset tag within the guide brackets</p>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-48 z-10 relative">
                <div className="progress-bar" style={{ height: '4px' }}>
                  <div className="progress-bar__fill" style={{ width: `${scanProgress}%`, background: 'linear-gradient(90deg, #0ea5e9, #6366f1)' }} />
                </div>
              </div>

              <button onClick={e => { e.stopPropagation(); cancelScan(); }} className="text-[10px] text-rose-400 hover:underline z-10 flex items-center gap-1">
                <X size={10} /> Cancel Scan
              </button>
            </div>
          )}

          {scanStatus === 'detected' && (
            <div className="flex flex-col items-center gap-2 z-10 relative">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle size={28} className="text-emerald-400" />
              </div>
              <p className="text-sm font-bold text-emerald-400">Tag Detected!</p>
              <p className="text-xs font-mono font-black text-slate-100">{tagInput}</p>
            </div>
          )}
        </div>

        {/* Manual Tag Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text" value={tagInput}
              onChange={e => setTagInput(e.target.value.toUpperCase())}
              placeholder="Enter tag manually (e.g. P-101)…"
              className="w-full glass-input text-xs pl-8 font-mono uppercase"
              onKeyDown={e => e.key === 'Enter' && handleLookupTag(tagInput)}
            />
          </div>
          <button
            onClick={() => handleLookupTag(tagInput)}
            disabled={loading || !tagInput.trim()}
            className="btn btn--primary px-4 flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none shrink-0"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          </button>
        </div>
      </div>

      {/* ─── Loading State ────────────────────────────────────────────────── */}
      {loading && (
        <div className="glass-panel rounded-2xl p-8 flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={28} className="animate-spin text-sky-400" />
          <p className="text-xs font-semibold">Accessing passport registry…</p>
        </div>
      )}

      {/* ─── Asset Result Card ────────────────────────────────────────────── */}
      {!loading && assetData && (
        <div className="glass-panel rounded-2xl p-5 space-y-4 slide-in-right">
          {/* Offline cached banner */}
          {isOfflineCached && (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-[10px] text-amber-400 font-bold">
              <ShieldAlert size={12} className="shrink-0" />
              <span>Cached Offline — Data may be up to 24h old</span>
            </div>
          )}

          {/* Asset Identity */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="badge badge--info text-[9px]">{assetData.equipment?.equipmentClass}</span>
                <CriticalityPill level={assetData.equipment?.criticality} />
              </div>
              <h2 className="text-2xl font-black text-slate-100 font-mono">{assetData.equipment?.tag}</h2>
              <StatusPill status={assetData.equipment?.operationalStatus} />
            </div>
            <button onClick={clearResult} className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors shrink-0">
              <X size={14} />
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">{assetData.equipment?.description}</p>

          {/* Quick Specs */}
          <div className="space-y-1">
            <p className="section-header text-[9px]">Quick Specs</p>
            <table className="spec-table w-full">
              <tbody>
                <tr>
                  <td className="flex items-center gap-1.5"><MapPin size={10} className="text-slate-500 shrink-0" />Location</td>
                  <td>{assetData.equipment?.location}</td>
                </tr>
                <tr>
                  <td className="flex items-center gap-1.5"><History size={10} className="text-slate-500 shrink-0" />Last Maint.</td>
                  <td>{assetData.equipment?.lastMaintenance ? new Date(assetData.equipment.lastMaintenance).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</td>
                </tr>
                <tr>
                  <td className="flex items-center gap-1.5"><Clock size={10} className="text-amber-400 shrink-0" />Next Due</td>
                  <td className="text-amber-400 font-semibold">{assetData.equipment?.nextDueMaintenance ? new Date(assetData.equipment.nextDueMaintenance).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</td>
                </tr>
                <tr>
                  <td className="flex items-center gap-1.5"><Activity size={10} className="text-sky-400 shrink-0" />MTBF</td>
                  <td className="font-mono">{assetData.equipment?.mtbf ? `${assetData.equipment.mtbf} hrs` : 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Operational Parameters */}
          {assetData.operationalParams && (
            <div className="space-y-2">
              <p className="section-header text-[9px]">Live Operational Parameters</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Gauge, label: 'Suction Press.', value: assetData.operationalParams.suctionPressure, color: 'text-sky-400' },
                  { icon: Gauge, label: 'Discharge Press.', value: assetData.operationalParams.dischargePressure, color: 'text-indigo-400' },
                  { icon: Activity, label: 'Flow Rate', value: assetData.operationalParams.flowRate, color: 'text-emerald-400' },
                  { icon: Thermometer, label: 'Temperature', value: assetData.operationalParams.temperature, color: 'text-amber-400' },
                  { icon: Zap, label: 'Vibration Level', value: assetData.operationalParams.vibrationLevel, color: 'text-violet-400' },
                ].map((param, i) => {
                  const Icon = param.icon;
                  return (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center gap-2">
                      <Icon size={13} className={`${param.color} shrink-0`} />
                      <div className="min-w-0">
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider leading-none">{param.label}</p>
                        <p className="text-xs font-bold text-slate-200 mt-0.5 font-mono truncate">{param.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Safety Rules */}
          {assetData.safetyRules && assetData.safetyRules.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/15 space-y-3">
              <div className="flex items-center gap-2">
                <Shield size={13} className="text-rose-400" />
                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Safety Requirements</p>
              </div>
              <div className="space-y-2">
                {assetData.safetyRules.map((rule: string, i: number) => (
                  <div key={i} className="flex gap-2.5 text-xs text-slate-300 leading-relaxed">
                    <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => navigate(`/copilot`, { state: { prefilledQuery: `Safety procedures and operating limits for ${assetData.equipment?.tag}` } })}
              className="btn btn--primary flex items-center justify-center gap-2"
            >
              <Sparkles size={13} /> Ask AI Copilot
            </button>
            <button
              onClick={() => navigate(`/equipment?tag=${assetData.equipment?.tag}`)}
              className="btn btn--secondary flex items-center justify-center gap-2"
            >
              <Cpu size={13} /> Full Passport
            </button>
          </div>
        </div>
      )}

      {/* ─── Empty State + Recent Scans ───────────────────────────────────── */}
      {!loading && !assetData && (
        <div className="space-y-4">
          {/* Instruction Card */}
          <div className="glass-card-static p-5 rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto">
              <Camera size={22} className="text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-300">Ready to Scan</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Tap the scanner above or type an equipment tag<br />to access the asset passport instantly.
              </p>
            </div>
            <div className="flex justify-center gap-2 flex-wrap">
              {['P-101', 'K-202', 'V-205', 'FT-201'].map(tag => (
                <button
                  key={tag}
                  onClick={() => { setTagInput(tag); handleLookupTag(tag); }}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-mono font-bold text-slate-300 hover:text-sky-400 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Recently Cached */}
          {cachedTags.length > 0 && (
            <div className="glass-card-static p-5 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <History size={13} className="text-slate-400" />
                <p className="section-header text-[9px]">Recent Scans — Offline Cache ({cachedTags.length})</p>
              </div>
              <div className="space-y-2">
                {cachedTags.slice(0, 4).map(tag => {
                  const mockAsset = MOCK_CACHED_ASSETS[tag];
                  return (
                    <button
                      key={tag}
                      onClick={() => { setTagInput(tag); handleLookupTag(tag); }}
                      className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/50 hover:bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                          <Cpu size={14} className="text-sky-400" />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="text-sm font-black text-slate-200 font-mono group-hover:text-sky-400 transition-colors">{tag}</p>
                          {mockAsset && (
                            <p className="text-[10px] text-slate-500 truncate">{mockAsset.equipment.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {mockAsset && <StatusPill status={mockAsset.equipment.operationalStatus} />}
                        <ChevronRight size={13} className="text-slate-500 group-hover:text-sky-400 transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[9px] text-slate-600 text-center">Tap to load from local IndexedDB cache</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Tiny inline Loader2 (prevents import collision)
const Loader2 = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const History = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" />
  </svg>
);

export default FieldScanner;
