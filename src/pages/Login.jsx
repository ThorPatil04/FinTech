import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login, verify2FA } from '../services/authService';

const DEMO_ACCOUNTS = [
  { label: '👑 Admin',  email: 'admin@fintech.io',  pass: 'admin123'  },
  { label: '📈 Trader', email: 'trader@fintech.io', pass: 'trader123' },
  { label: '👁 Viewer', email: 'viewer@fintech.io', pass: 'viewer123' },
];

export default function Login() {
  const { login: ctxLogin } = useAuth();
  const navigate = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [otp,      setOtp]      = useState('');
  const [step,     setStep]     = useState('credentials'); // 'credentials' | '2fa'
  const [pending,  setPending]  = useState(null);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const quickFill = (acc) => { setEmail(acc.email); setPassword(acc.pass); setError(''); };

  const handleCredentials = (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    setTimeout(() => {
      const res = login(email, password);
      setLoading(false);
      if (!res.success) { setError(res.reason); return; }
      setPending(res.user);
      setStep('2fa');
    }, 600);
  };

  const handle2FA = (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    setTimeout(() => {
      const res = verify2FA(pending, otp);
      setLoading(false);
      if (!res.success) { setError(res.reason); return; }
      ctxLogin(res.user);
      navigate('/');
    }, 500);
  };

  return (
    <div className="login-page">
      <div className="login-card fade-in">
        <div className="login-logo">
          <h1>⚡ FinTech HFT</h1>
          <p>High-Frequency Trading & Secure Banking Portal</p>
        </div>

        {step === 'credentials' ? (
          <>
            <p style={{ fontSize:'0.75rem', color:'var(--text-3)', marginBottom:12 }}>Quick fill demo account:</p>
            <div className="quick-fill">
              {DEMO_ACCOUNTS.map(a => (
                <button key={a.email} className="quick-btn" onClick={() => quickFill(a)}>{a.label}</button>
              ))}
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleCredentials}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@fintech.io" required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', marginTop:8 }} disabled={loading}>
                {loading ? 'Authenticating…' : 'Sign In →'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="alert alert-info" style={{ marginBottom:16 }}>
              ✅ Credentials verified for <strong>{pending?.name}</strong>. Enter 2FA code.
            </div>

            <div className="otp-display">
              <div style={{ fontSize:'0.72rem', color:'var(--text-3)', marginBottom:4 }}>🔑 Your 2FA code (simulation)</div>
              <div className="otp-code">{pending?.twoFASecret}</div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handle2FA}>
              <div className="form-group">
                <label className="form-label">Enter 6-digit OTP</label>
                <input className="form-input mono" type="text" value={otp} onChange={e=>setOtp(e.target.value)} placeholder="000000" maxLength={6} required style={{ letterSpacing:'0.3em', fontSize:'1.2rem', textAlign:'center' }} />
              </div>
              <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }} disabled={loading}>
                {loading ? 'Verifying…' : 'Verify & Enter Portal →'}
              </button>
            </form>
            <button className="btn btn-secondary btn-sm" style={{ marginTop:12, width:'100%', justifyContent:'center' }} onClick={() => { setStep('credentials'); setError(''); }}>
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
