import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { 
  Cpu, ArrowRight, ShieldCheck, GitBranch, Layers, Database, 
  Terminal, Activity, Wrench, CheckCircle, Zap 
} from 'lucide-react';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const stats = [
    { val: '99.4%', label: 'RCA Accuracy', desc: 'Iterative 5-Whys logic' },
    { val: '10x', label: 'Faster Retrieval', desc: 'Hybrid Qdrant RRF' },
    { val: '100%', label: 'Audit Ready', desc: 'Clause-level scans' },
    { val: 'Offline', label: 'Field First', desc: 'IndexedDB mobile cache' },
  ];

  const features = [
    {
      icon: Layers,
      title: 'Hybrid RAG Copilot',
      desc: 'Combines semantic embeddings with lexical keyword searches, resolved via Reciprocal Rank Fusion for perfect industrial vocabulary matching.',
    },
    {
      icon: GitBranch,
      title: 'Active Knowledge Graph',
      desc: 'A live Neo4j digital twin linking equipment, documents, incidents, and standards to visualize facility relationships in real-time.',
    },
    {
      icon: Database,
      title: 'LangGraph 5-Whys RCA',
      desc: 'Automate root cause diagnostics on corrective work orders through structured AI agent loops that drill down to systemic issues.',
    },
    {
      icon: ShieldCheck,
      title: 'Compliance Radar',
      desc: 'Scan plant SOPs against OISD-118, PESO, and the Factory Act. Pinpoint non-conformities and export audit evidence packages.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md overflow-x-hidden flex flex-col relative">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-fixed/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[600px] h-[600px] bg-secondary-container/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="h-header-height border-b border-outline-variant px-margin-desktop flex justify-between items-center bg-surface-container-lowest/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-container rounded-lg flex items-center justify-center border border-outline-variant">
            <Cpu className="text-secondary" size={18} />
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-on-surface">IKIP</h1>
            <p className="text-[9px] font-tag-xs text-on-surface-variant uppercase tracking-widest leading-none">Industrial Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-secondary-container hover:bg-secondary-fixed text-on-secondary-container font-bold rounded-lg flex items-center gap-2 transition-all"
            >
              Go to Console
              <ArrowRight size={14} />
            </button>
          ) : (
            <>
              <button 
                onClick={() => navigate('/login')}
                className="text-on-surface-variant hover:text-on-surface text-xs font-bold px-3 py-2 transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate('/register')}
                className="px-4 py-2 bg-primary-container hover:bg-surface-container-highest text-primary font-bold rounded-lg border border-outline-variant text-xs transition-all"
              >
                Register
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-7xl mx-auto px-margin-desktop py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 bg-tertiary-container border border-outline-variant px-3 py-1 rounded-full text-xs text-tertiary font-bold">
            <Terminal size={14} className="text-secondary" />
            <span>GenAI Command Center for Plant Operations</span>
          </div>

          <h2 className="text-4xl lg:text-5xl font-display-lg text-on-surface font-extrabold leading-tight">
            The Intelligent AI Brain <br />
            <span className="text-secondary">For Heavy Industry</span>
          </h2>

          <p className="text-sm lg:text-base text-on-surface-variant leading-relaxed max-w-2xl">
            IKIP unifies industrial document silos, monitors compliance limits, queries asset subgraphs,
            diagnoses machine failures, and empowers field technicians with a voice-activated RAG Copilot. 
            Built on a native Neo4j knowledge twin.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button 
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
              className="px-6 py-3 bg-secondary-container hover:bg-secondary-fixed text-on-secondary-container font-bold rounded-lg flex items-center gap-2 shadow-lg transition-all"
            >
              Launch Plant Console
              <ArrowRight size={16} />
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="px-6 py-3 bg-primary-container hover:bg-surface-container-highest text-primary font-bold rounded-lg border border-outline-variant transition-all"
            >
              Request Access
            </button>
          </div>
        </div>

        {/* Hero Interactive Terminal Panel */}
        <div className="lg:col-span-5 bg-surface-container-high border border-outline-variant rounded-xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-secondary"></div>
          
          <div className="flex items-center justify-between border-b border-outline-variant pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-error"></span>
              <span className="w-3 h-3 rounded-full bg-secondary"></span>
              <span className="w-3 h-3 rounded-full bg-primary"></span>
            </div>
            <span className="font-tag-xs text-tag-xs text-on-surface-variant uppercase">RAG COPILOT SHELL</span>
          </div>

          <div className="space-y-3 font-code-md text-code-md text-xs">
            <div className="text-on-surface-variant flex gap-2">
              <span className="text-secondary font-bold">&gt;</span>
              <span>ask "What is the startup flow for Pump P-101?"</span>
            </div>
            <div className="p-3 bg-surface-container-lowest border border-outline-variant rounded text-on-surface leading-relaxed text-[11px] space-y-2">
              <div className="flex items-center justify-between border-b border-outline-variant pb-1.5 mb-1.5">
                <span className="flex items-center gap-1 text-[10px] text-secondary font-bold">
                  <Zap size={10} /> Grounded Answer
                </span>
                <span className="text-[9px] bg-surface-container-highest text-on-surface-variant px-1 rounded font-bold">CONFIDENCE: 98%</span>
              </div>
              <p>
                1. Verify oil level in bearing housing is at center of sight glass.<br />
                2. Open suction valve completely; keep discharge valve closed.<br />
                3. Press START and check discharge pressure increases to 11.8 kg/cm².
              </p>
              <div className="pt-1.5 border-t border-outline-variant flex gap-2 text-[9px] text-on-surface-variant">
                <span>Citations:</span>
                <span className="text-primary underline">SOP-MAINT-007.pdf</span>
                <span className="text-primary underline">PMP-101_Spec.pdf</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-surface-container-low border-y border-outline-variant py-10">
        <div className="max-w-7xl mx-auto px-margin-desktop grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, idx) => (
            <div key={idx} className="text-center space-y-1">
              <div className="text-3xl lg:text-4xl font-extrabold text-secondary font-display-lg">{s.val}</div>
              <div className="text-xs font-bold text-on-surface">{s.label}</div>
              <div className="text-[10px] text-on-surface-variant">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-margin-desktop py-20 space-y-12">
        <div className="text-center space-y-3">
          <h3 className="text-3xl font-headline-lg text-on-surface font-bold">Advanced Features</h3>
          <p className="text-sm text-on-surface-variant max-w-xl mx-auto">
            Explore the multi-agent cognitive architecture purpose-built for heavy industrial plants.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div key={idx} className="bg-surface-container-high border border-outline-variant rounded-xl p-6 space-y-4 hover:border-secondary transition-all">
                <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center border border-outline-variant text-secondary">
                  <Icon size={20} />
                </div>
                <h4 className="text-lg font-bold text-on-surface">{f.title}</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-outline-variant bg-surface-container-lowest py-8">
        <div className="max-w-7xl mx-auto px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-on-surface-variant">
          <div>© {new Date().getFullYear()} IKIP Platform. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-on-surface transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-on-surface transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-on-surface transition-colors">Contact Engineering</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
