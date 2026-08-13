import React, { useState } from 'react';
// Mock auth client removed
import { useAuth } from '../hooks/useAuth';
import { Compass, Mail, Lock, AlertOctagon, Loader2, Sparkles } from 'lucide-react';

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
    
    // Mock login for now
    if (email && password) {
      await enterDemoMode();
    } else {
      setError('Invalid credentials');
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
    <div className="vh-100 d-flex align-items-center justify-content-center p-4 bg-light">
      <div className="bg-white rounded shadow w-100 border border-secondary border-opacity-25" style={{maxWidth: '400px'}}>
        <div className="bg-dark p-4 text-center border-bottom border-secondary">
          <div className="d-flex justify-content-center mb-3">
            <div className="bg-primary bg-opacity-25 p-3 rounded border border-primary border-opacity-50 shadow-sm">
              <Compass className="text-primary" style={{width: '40px', height: '40px'}} />
            </div>
          </div>
          <h1 className="h4 fw-bolder text-white mb-2">Forrest Logistics CRM</h1>
          <p className="text-light small fw-medium mb-0">Customer Onboarding & Compliance Suite</p>
        </div>
        
        <div className="p-4">
          <div className="mb-4">
            <h2 className="h5 fw-bold text-dark">Sign In</h2>
            <p className="small text-secondary mt-1 mb-0">
              Authenticate with your team credentials or enter as a specialist.
            </p>
          </div>
          
          {error && (
            <div className="p-3 mb-4 bg-danger bg-opacity-10 text-danger rounded d-flex align-items-start gap-3 border border-danger border-opacity-25 shadow-sm">
              <AlertOctagon className="flex-shrink-0 mt-1" style={{width: '20px', height: '20px'}} />
              <p className="small fw-semibold mb-0">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleLogin} className="d-flex flex-column gap-3">
            <div>
              <label className="form-label small fw-bold text-dark mb-1" htmlFor="email">Email Address</label>
              <div className="position-relative">
                <Mail className="text-secondary position-absolute top-50 translate-middle-y ms-3" style={{width: '20px', height: '20px'}} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-control ps-5 py-2 small shadow-sm"
                  placeholder="name@forrestlogistics.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label small fw-bold text-dark mb-0" htmlFor="password">Password</label>
                <a href="#" className="small fw-semibold text-primary text-decoration-none">Forgot Password?</a>
              </div>
              <div className="position-relative">
                <Lock className="text-secondary position-absolute top-50 translate-middle-y ms-3" style={{width: '20px', height: '20px'}} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-control ps-5 py-2 small shadow-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-100 fw-bold py-2 shadow-sm d-flex align-items-center justify-content-center gap-2 mt-2"
            >
              {loading ? <Loader2 className="spinner-border spinner-border-sm" /> : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Access Divider */}
          <div className="position-relative d-flex py-4 align-items-center">
            <div className="flex-grow-1 border-top border-secondary border-opacity-25"></div>
            <span className="mx-3 small fw-bold text-secondary text-uppercase" style={{letterSpacing: '1px'}}>Developer Access</span>
            <div className="flex-grow-1 border-top border-secondary border-opacity-25"></div>
          </div>

          <button
            type="button"
            onClick={handleDemoAccess}
            disabled={loading}
            className="btn btn-light w-100 fw-semibold py-2 d-flex align-items-center justify-content-center gap-2 border border-secondary border-opacity-25 shadow-sm small"
          >
            <Sparkles className="text-primary" style={{width: '16px', height: '16px'}} />
            Launch Demo Workspace
          </button>
        </div>
      </div>
    </div>
  );
}

