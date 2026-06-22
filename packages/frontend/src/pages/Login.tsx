import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../api/auth.api';
import toast from 'react-hot-toast';
import { Cpu, Lock, Mail, ArrowRight, Eye, EyeOff, ShieldCheck, GitBranch, Layers, Database } from 'lucide-react';

const PLATFORM_FEATURES = [
  { icon: GitBranch, label: 'Knowledge Graph', desc: 'Neo4j industrial ontology with 13 entity types' },
  { icon: Layers, label: 'Hybrid RAG Engine', desc: 'Dense + BM25 + RRF fusion search over documents' },
  { icon: ShieldCheck, label: 'Compliance Radar', desc: 'OISD-118 · PESO · Factory Act gap detection' },
  { icon: Database, label: 'Multi-Agent AI', desc: 'LangGraph RCA · Lessons Engine · Copilot' },
];

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please enter all credentials'); return; }

    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      if (res.success && res.data) {
        login(res.data.user, res.data.token, res.data.refreshToken);
        toast.success(`Welcome back, ${res.data.user.name}!`);
        navigate('/');
      } else {
        toast.error(res.error || 'Authentication failed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex relative overflow-hidden"
      style={{ background: 'var(--color-bg-deep)' }}
    >
      {/* Ambient glows */}
      <div style={{
        position: 'fixed', top: '-20%', right: '-20%', width: '60vw', height: '60vw',
        borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(14,165,233,0.05) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'fixed', bottom: '-20%', left: '-20%', width: '70vw', height: '70vw',
        borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(99,102,241,0.04) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #0EA5E9, #6366F1)', boxShadow: '0 0 24px rgba(14,165,233,0.3)' }}>
            <Cpu size={20} className="text-white" />
          </div>
          <div>
            <div className="text-lg font-extrabold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>IKIP Platform</div>
            <div className="text-[9px] text-[#475569] font-semibold uppercase tracking-[0.12em]">Industrial Knowledge Intelligence</div>
          </div>
        </div>

        {/* Main Hero Text */}
        <div className="space-y-6 max-w-sm">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <span style={{
                background: 'linear-gradient(135deg, #E2E8F0 0%, #94A3B8 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
              }}>
                AI-Powered Brain
              </span>
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
              }}>
                for Heavy Industry
              </span>
            </h1>
            <p className="text-sm text-[#64748B] leading-relaxed mt-4">
              Connect document silos, monitor regulatory compliance, query asset knowledge graphs,
              and get grounded AI answers for plant operations — all in one platform.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-3">
            {PLATFORM_FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="glass-card rounded-xl p-3.5">
                  <div className="p-1.5 rounded-lg bg-[rgba(14,165,233,0.1)] w-fit mb-2">
                    <Icon size={14} className="text-[#0EA5E9]" />
                  </div>
                  <div className="text-xs font-bold text-[#E2E8F0]">{f.label}</div>
                  <div className="text-[9px] text-[#475569] mt-0.5 leading-relaxed">{f.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-8 text-center">
          {[
            { val: '13', label: 'Entity Types' },
            { val: '7', label: 'RBAC Roles' },
            { val: '35+', label: 'API Endpoints' },
            { val: '5', label: 'AI Agents' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-xl font-black" style={{
                background: 'linear-gradient(135deg, #38BDF8, #818CF8)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                fontFamily: 'JetBrains Mono, monospace'
              }}>{s.val}</div>
              <div className="text-[9px] text-[#334155] uppercase tracking-wider font-semibold">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md fade-in">

          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0EA5E9, #6366F1)', boxShadow: '0 0 32px rgba(14,165,233,0.3)' }}>
              <Cpu size={28} className="text-white" />
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-8 border border-[rgba(56,80,140,0.3)]"
            style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)' }}>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#E2E8F0]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Plant Console Access
              </h2>
              <p className="text-sm text-[#475569] mt-1">
                Sign in with your authorized plant personnel credentials
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="section-header block mb-2">Email Address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#334155]" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass-input w-full pl-9 py-3 text-sm"
                    placeholder="operator@plant.in"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="section-header block mb-2">Security Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#334155]" />
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glass-input w-full pl-9 pr-10 py-3 text-sm"
                    placeholder="••••••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#334155] hover:text-[#64748B] transition-colors"
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="btn btn--primary w-full py-3 text-sm mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In to Plant Console
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {/* RBAC Info */}
            <div className="mt-6 p-3.5 rounded-xl bg-[rgba(14,165,233,0.05)] border border-[rgba(14,165,233,0.12)]">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={12} className="text-[#0EA5E9]" />
                <span className="text-[10px] font-bold text-[#0EA5E9] uppercase tracking-wider">Role-Based Access Control</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {['SuperAdmin', 'PlantAdmin', 'Engineer', 'Technician', 'Operator', 'Auditor'].map((role) => (
                  <span key={role} className="text-[8px] text-[#334155] font-mono px-1.5 py-0.5 rounded bg-[rgba(30,41,59,0.5)] text-center">{role}</span>
                ))}
              </div>
            </div>

            <div className="text-center mt-4 text-xs">
              <span className="text-[#475569]">Need console access? </span>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-secondary hover:underline font-bold"
              >
                Register Account
              </button>
            </div>

            <div className="text-center mt-5 text-[9px] text-[#1E293B] font-semibold uppercase tracking-wider">
              AUTHORIZED PLANT PERSONNEL ONLY • IKIP v1.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
