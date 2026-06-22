import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../api/auth.api';
import toast from 'react-hot-toast';
import { Cpu, Lock, Mail, ArrowRight, Eye, EyeOff, ShieldCheck, User, Factory, Briefcase } from 'lucide-react';

interface PlantOption {
  _id: string;
  plantId: string;
  name: string;
  location: string;
}

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Viewer');
  const [plantId, setPlantId] = useState('');
  const [plants, setPlants] = useState<PlantOption[]>([]);
  
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingPlants, setFetchingPlants] = useState(true);

  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  // Load plants
  useEffect(() => {
    const loadPlants = async () => {
      try {
        const res = await authApi.listPlants();
        if (res.success && res.data) {
          setPlants(res.data);
          if (res.data.length > 0) {
            setPlantId(res.data[0]._id);
          }
        }
      } catch (err) {
        toast.error('Failed to load plant list. Using fallback values.');
        // Fallback mock plants in case API fails
        const mockPlants = [
          { _id: '6a39096d445ac3e587d2d4a2', plantId: 'unit3', name: 'Refinery Unit-3', location: 'Mumbai, MH' },
          { _id: '6a39096d445ac3e587d2d4a3', plantId: 'unit1', name: 'Petrochemical Unit-1', location: 'Vadodara, GJ' },
          { _id: '6a39096d445ac3e587d2d4a4', plantId: 'term2', name: 'Storage Terminal-2', location: 'Visakhapatnam, AP' }
        ];
        setPlants(mockPlants);
        setPlantId(mockPlants[0]._id);
      } finally {
        setFetchingPlants(false);
      }
    };
    loadPlants();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !role || !plantId) {
      toast.error('Please fill in all registration fields');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.register({ name, email, password, role, plantId });
      if (res.success && res.data) {
        login(res.data.user, res.data.token, res.data.refreshToken);
        toast.success(`Registration complete! Welcome, ${res.data.user.name}!`);
        navigate('/dashboard');
      } else {
        toast.error(res.error || 'Registration failed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to complete registration');
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

        {/* Info text */}
        <div className="space-y-6 max-w-sm">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <span style={{
                background: 'linear-gradient(135deg, #E2E8F0 0%, #94A3B8 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
              }}>
                Personnel Portal
              </span>
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
              }}>
                Self-Registration
              </span>
            </h1>
            <p className="text-sm text-[#64748B] leading-relaxed mt-4">
              Register your profile to gain role-based access. Connect with your plant unit to access SOPs, telemetry, work orders, and graph traversals.
            </p>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-outline-variant space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-secondary" />
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Security Notice</span>
            </div>
            <p className="text-[10px] text-[#475569] leading-relaxed">
              All registrations are audited. Ensure you choose the exact role and plant unit as assigned by your operations supervisor.
            </p>
          </div>
        </div>

        <div className="text-xs text-[#334155]">
          IKIP Platform Version 1.0.0
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md fade-in">
          
          <div className="glass-panel rounded-2xl p-8 border border-[rgba(56,80,140,0.3)] shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#E2E8F0]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Create Account
              </h2>
              <p className="text-xs text-[#475569] mt-1">
                Fill in your details to create an authorized profile
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="section-header block mb-1">Full Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#334155]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="glass-input w-full pl-9 py-2.5 text-xs"
                    placeholder="Enter your name"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="section-header block mb-1">Email Address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#334155]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass-input w-full pl-9 py-2.5 text-xs"
                    placeholder="name@plant.in"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="section-header block mb-1">Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#334155]" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glass-input w-full pl-9 pr-10 py-2.5 text-xs"
                    placeholder="••••••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#334155]"
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="section-header block mb-1">Operational Role</label>
                <div className="relative">
                  <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#334155]" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="glass-input w-full pl-9 py-2.5 text-xs appearance-none"
                  >
                    <option value="Operator">Operator</option>
                    <option value="Engineer">Engineer</option>
                    <option value="Technician">Technician</option>
                    <option value="Auditor">Auditor</option>
                    <option value="PlantAdmin">Plant Admin</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
              </div>

              {/* Plant Unit */}
              <div>
                <label className="section-header block mb-1">Assign Plant Unit</label>
                <div className="relative">
                  <Factory size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#334155]" />
                  {fetchingPlants ? (
                    <div className="glass-input w-full pl-9 py-2.5 text-xs text-slate-500">
                      Loading plant registry...
                    </div>
                  ) : (
                    <select
                      value={plantId}
                      onChange={(e) => setPlantId(e.target.value)}
                      className="glass-input w-full pl-9 py-2.5 text-xs appearance-none"
                    >
                      {plants.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} ({p.location})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || fetchingPlants}
                className="btn btn--primary w-full py-2.5 text-xs mt-2"
              >
                {loading ? 'Creating account...' : 'Create Account'}
                <ArrowRight size={14} className="ml-1" />
              </button>
            </form>

            <div className="mt-4 text-center text-xs">
              <span className="text-[#475569]">Already have an account? </span>
              <button
                onClick={() => navigate('/login')}
                className="text-secondary hover:underline font-bold"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
