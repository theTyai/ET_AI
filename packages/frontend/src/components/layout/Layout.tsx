import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { useNotificationStore } from '../../store/notification.store';
import { useSocket } from '../../hooks/useSocket';
import {
  LayoutDashboard,
  MessageSquare,
  Library,
  Network,
  ShieldCheck,
  Wrench,
  ScanLine,
  LogOut,
  Bell,
  User,
  ChevronDown,
  Factory,
  X,
  AlertTriangle,
  Info,
  CheckCircle2,
  Menu,
  Cpu,
  BookOpen
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const PLANT_UNITS = [
  { id: 'unit3', name: 'Refinery Unit-3', status: 'active', location: 'Mumbai, MH' },
  { id: 'unit1', name: 'Petrochemical Unit-1', status: 'maintenance', location: 'Vadodara, GJ' },
  { id: 'term2', name: 'Storage Terminal-2', status: 'standby', location: 'Visakhapatnam, AP' },
];

const menuItems = [
  { name: 'Command Center', path: '/dashboard', icon: LayoutDashboard, description: 'KPIs & Live Telemetry' },
  { name: 'AI Copilot', path: '/copilot', icon: MessageSquare, description: 'Expert RAG Assistant' },
  { name: 'Document Library', path: '/documents', icon: Library, description: 'SOPs & P&IDs' },
  { name: 'Knowledge Graph', path: '/kg', icon: Network, description: 'Neo4j Ontology Explorer' },
  { name: 'Compliance Radar', path: '/compliance', icon: ShieldCheck, description: 'OISD/PESO/Factory Act' },
  { name: 'Maintenance Intel', path: '/maintenance', icon: Wrench, description: 'RCA & Work Orders' },
  { name: 'Lessons Learned', path: '/lessons', icon: BookOpen, description: 'AI Pattern Mining' },
  { name: 'Field Tag Scanner', path: '/scanner', icon: ScanLine, description: 'Offline Asset Lookup' },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [selectedUnit, setSelectedUnit] = useState(PLANT_UNITS[0]);
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useSocket();

  const alerts = useNotificationStore((state) => state.alerts);
  const dismissAlert = useNotificationStore((state) => state.dismissAlert);
  const unreadCount = alerts.filter((a) => !a.dismissed).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentPage = menuItems.find((m) => m.path === location.pathname);

  const getUnitStatusColor = (status: string) => {
    if (status === 'active') return 'text-emerald-400';
    if (status === 'maintenance') return 'text-amber-400';
    return 'text-slate-400';
  };

  const getUnitStatusDot = (status: string) => {
    if (status === 'active') return 'bg-emerald-400';
    if (status === 'maintenance') return 'bg-amber-400 animate-pulse';
    return 'bg-slate-500';
  };

  const getAlertIcon = (type: string) => {
    if (type === 'compliance') return <AlertTriangle size={14} className="text-rose-400 shrink-0" />;
    if (type === 'success') return <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />;
    return <Info size={14} className="text-amber-400 shrink-0" />;
  };

  const Sidebar = () => (
    <aside className="flex flex-col w-64 glass-panel border-r border-[rgba(56,80,140,0.2)] h-full">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-[rgba(56,80,140,0.2)]">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #0EA5E9, #6366F1)', boxShadow: '0 0 16px rgba(14,165,233,0.3)' }}>
            <Cpu size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-sm text-white tracking-tight leading-tight"
              style={{ fontFamily: 'Outfit, sans-serif' }}>
              IKIP Platform
            </div>
            <div className="text-[9px] text-[#475569] font-semibold uppercase tracking-[0.12em]">
              Industrial Intelligence
            </div>
          </div>
        </div>
      </div>

      {/* Unit Switcher */}
      <div className="px-4 py-3 border-b border-[rgba(56,80,140,0.15)]">
        <div className="text-[9px] font-bold text-[#475569] uppercase tracking-[0.1em] mb-1.5 flex items-center gap-1.5">
          <Factory size={9} />
          Active Plant Unit
        </div>
        <button
          onClick={() => setUnitDropdownOpen(!unitDropdownOpen)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-[rgba(56,80,140,0.25)] bg-[rgba(5,10,25,0.5)] hover:border-[rgba(14,165,233,0.3)] transition-all text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getUnitStatusDot(selectedUnit.status)}`} />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#E2E8F0] truncate">{selectedUnit.name}</div>
              <div className="text-[9px] text-[#475569] truncate">{selectedUnit.location}</div>
            </div>
          </div>
          <ChevronDown size={12} className={`text-[#475569] transition-transform flex-shrink-0 ml-1 ${unitDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {unitDropdownOpen && (
          <div className="mt-1.5 rounded-lg border border-[rgba(56,80,140,0.25)] overflow-hidden bg-[#080C16] shadow-xl">
            {PLANT_UNITS.map((unit) => (
              <button
                key={unit.id}
                onClick={() => { setSelectedUnit(unit); setUnitDropdownOpen(false); }}
                className={`w-full px-3 py-2.5 text-left hover:bg-[rgba(14,165,233,0.06)] transition-colors flex items-center gap-2 ${
                  unit.id === selectedUnit.id ? 'bg-[rgba(14,165,233,0.08)]' : ''
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getUnitStatusDot(unit.status)}`} />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#CBD5E1] truncate">{unit.name}</div>
                  <div className="text-[9px] text-[#475569]">{unit.location}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <div className="text-[9px] font-bold text-[#334155] uppercase tracking-[0.1em] px-1 mb-2">
          Navigation
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileSidebarOpen(false)}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={15} className="flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[0.8rem] leading-tight truncate">{item.name}</div>
                {isActive && (
                  <div className="text-[9px] text-[rgba(14,165,233,0.7)] mt-0.5 leading-tight truncate">
                    {item.description}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="px-3 py-3 border-t border-[rgba(56,80,140,0.2)] space-y-2">
        {user && (
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-[rgba(14,21,42,0.6)]">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0EA5E9] to-[#6366F1] flex items-center justify-center flex-shrink-0">
              <User size={14} className="text-white" />
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <div className="text-xs font-semibold text-[#E2E8F0] truncate">{user.name}</div>
              <div className="text-[9px] text-[#475569] font-medium truncate">{user.role}</div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="btn btn--danger w-full text-xs"
        >
          <LogOut size={12} />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Ambient background glows */}
      <div className="ambient-glow-sky" />
      <div className="ambient-glow-indigo" />

      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div className={`fixed left-0 top-0 bottom-0 z-50 md:hidden transition-transform duration-300 ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 flex-shrink-0 h-full relative z-10">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">

        {/* Topbar */}
        <header className="h-14 flex items-center justify-between px-5 border-b border-[rgba(56,80,140,0.2)] glass-panel flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-[#64748B] hover:text-[#E2E8F0] hover:bg-[rgba(30,41,59,0.5)] transition-colors"
            >
              <Menu size={18} />
            </button>

            {/* Page Title */}
            <div>
              <div className="text-sm font-bold text-[#E2E8F0]">
                {currentPage?.name || 'Asset View'}
              </div>
              {currentPage?.description && (
                <div className="text-[10px] text-[#475569]">{currentPage.description}</div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Connection Status */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.06)]">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" style={{ animation: 'pulseRing 2s ease-out infinite' }} />
              <span className="text-[10px] text-emerald-400 font-semibold">
                {selectedUnit.name}
              </span>
              <span className="text-[10px] text-[#475569]">• 14ms</span>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifPanelOpen(!notifPanelOpen)}
                className="relative p-2 rounded-lg border border-[rgba(56,80,140,0.25)] bg-[rgba(5,10,25,0.5)] hover:border-[rgba(14,165,233,0.3)] transition-all text-[#64748B] hover:text-[#E2E8F0]"
              >
                <Bell size={15} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center"
                    style={{ boxShadow: '0 0 8px rgba(244,63,94,0.5)' }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Panel */}
              {notifPanelOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 glass-panel rounded-xl border border-[rgba(56,80,140,0.3)] shadow-2xl z-50 slide-in-right">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(56,80,140,0.2)]">
                    <div className="text-xs font-bold text-[#E2E8F0]">AI Real-Time Alerts</div>
                    <button onClick={() => setNotifPanelOpen(false)} className="text-[#475569] hover:text-[#E2E8F0]">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[rgba(30,41,59,0.4)]">
                    {alerts.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <CheckCircle2 size={24} className="mx-auto text-emerald-400 mb-2 opacity-50" />
                        <div className="text-xs text-[#475569]">All clear — no active alerts</div>
                      </div>
                    ) : (
                      alerts.slice(0, 5).map((alert) => (
                        <div key={alert.id} className={`px-4 py-3 flex gap-2.5 ${alert.dismissed ? 'opacity-40' : ''}`}>
                          {getAlertIcon(alert.type)}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-[#E2E8F0] truncate">{alert.title}</div>
                            <div className="text-[10px] text-[#64748B] leading-relaxed mt-0.5 line-clamp-2">{alert.message}</div>
                          </div>
                          <button
                            onClick={() => dismissAlert(alert.id)}
                            className="text-[#334155] hover:text-[#64748B] flex-shrink-0"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--color-bg-deep)' }}>
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <footer className="md:hidden glass-panel border-t border-[rgba(56,80,140,0.2)] flex-shrink-0">
          <div className="flex items-center justify-around px-2 py-2">
            {menuItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center gap-0.5 p-2 rounded-lg transition-all ${
                    isActive
                      ? 'text-[#0EA5E9]'
                      : 'text-[#475569]'
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-[8px] font-semibold leading-tight">
                    {item.name.split(' ')[0]}
                  </span>
                </Link>
              );
            })}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
