import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { Compass, Mail, Lock, AlertOctagon, Loader2, Sparkles, Building2 } from 'lucide-react';

export default function Login() {
  const { enterDemoMode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleDemoAccess = async () => {
    setLoading(true);
    setError(null);
    await enterDemoMode();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full border border-slate-100">
        <div className="bg-slate-900 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-500/20 p-3 rounded-xl border border-blue-400/30">
              <Compass className="w-10 h-10 text-blue-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Forrest Logistics CRM</h1>
          <p className="text-slate-400 text-sm font-medium">Customer Onboarding & Compliance Suite</p>
        </div>
        
        <div className="p-8 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Sign In</h2>
            <p className="text-xs text-slate-500 mt-1">Authenticate with your team credentials or enter as a specialist</p>
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3 border border-red-100">
              <AlertOctagon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm"
                  placeholder="tanya.wahl@forrestlogistics.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Access Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">or instant demo</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <button
            type="button"
            onClick={handleDemoAccess}
            disabled={loading}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-200 cursor-pointer text-sm"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            Launch Demo Workspace (Instant Access)
          </button>
        </div>
      </div>
    </div>
  );
}
