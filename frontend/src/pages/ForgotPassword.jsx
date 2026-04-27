import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

const darkPageStyle = `
  .auth-root {
    min-height: 100vh;
    background: #000;
    font-family: 'Inter', sans-serif;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .auth-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 60% at 20% 10%, rgba(59,130,246,0.18) 0%, transparent 60%),
      radial-gradient(ellipse 60% 50% at 80% 80%, rgba(99,102,241,0.15) 0%, transparent 55%),
      #000;
    z-index: 0;
  }
  .auth-root::after {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 60px 60px;
    z-index: 0;
  }
  .auth-orb { position: fixed; border-radius: 50%; filter: blur(80px); opacity: 0.45; z-index: 0; animation: authOrbFloat 9s ease-in-out infinite; }
  .auth-orb-1 { width:420px;height:420px;background:radial-gradient(circle,rgba(59,130,246,0.35),transparent 70%);top:-130px;left:-110px; }
  .auth-orb-2 { width:350px;height:350px;background:radial-gradient(circle,rgba(99,102,241,0.28),transparent 70%);bottom:-90px;right:-90px;animation-delay:-3s; }
  @keyframes authOrbFloat {
    0%,100% { transform:translate(0,0) scale(1); }
    50%      { transform:translate(15px,-20px) scale(1.04); }
  }
  .auth-topbar { position:relative;z-index:10;display:flex;align-items:center;padding:24px 40px; }
  .auth-logo { display:flex;align-items:center;gap:10px;text-decoration:none; }
  .auth-logo-icon { width:36px;height:36px;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(59,130,246,0.5); }
  .auth-logo-dot { width:10px;height:10px;background:#fff;border-radius:50%;animation:authPulse 2s ease-in-out infinite; }
  @keyframes authPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
  .auth-logo-name { font-size:1.2rem;font-weight:700;color:#f5f5f7; }
  .auth-logo-name span { background:linear-gradient(90deg,#3b82f6,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent; }
  .auth-center { flex:1;display:flex;align-items:center;justify-content:center;padding:20px;position:relative;z-index:10; }
  .auth-card { width:100%;max-width:420px;background:rgba(255,255,255,0.04);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:36px;box-shadow:0 0 0 1px rgba(59,130,246,0.1),0 32px 64px rgba(0,0,0,0.5); }
  .auth-title { font-size:1.6rem;font-weight:700;color:#f5f5f7;margin:0 0 4px;text-align:center; }
  .auth-sub { font-size:0.875rem;color:rgba(255,255,255,0.4);text-align:center;margin:0 0 28px; }
  .auth-error { background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);color:#fca5a5;border-radius:12px;padding:12px 16px;font-size:0.85rem;margin-bottom:18px; }
  .auth-success-box { background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25);color:#6ee7b7;border-radius:12px;padding:12px 16px;font-size:0.85rem;margin-bottom:18px; }
  .auth-field { margin-bottom:16px; }
  .auth-label { display:block;font-size:0.78rem;font-weight:500;color:rgba(255,255,255,0.5);margin-bottom:7px;letter-spacing:0.3px;text-transform:uppercase; }
  .auth-input { width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:11px 14px;font-size:0.92rem;color:#f5f5f7;font-family:'Inter',sans-serif;outline:none;transition:all 0.2s;box-sizing:border-box; }
  .auth-input::placeholder { color:rgba(255,255,255,0.22); }
  .auth-input:focus { border-color:rgba(59,130,246,0.6);background:rgba(59,130,246,0.06);box-shadow:0 0 0 3px rgba(59,130,246,0.15); }
  .auth-btn { width:100%;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;border:none;border-radius:12px;padding:13px;font-size:0.95rem;font-weight:600;font-family:'Inter',sans-serif;cursor:pointer;transition:all 0.25s;box-shadow:0 4px 20px rgba(59,130,246,0.35);margin-top:6px; }
  .auth-btn:hover:not(:disabled) { transform:translateY(-1px);box-shadow:0 8px 28px rgba(59,130,246,0.45); }
  .auth-btn:disabled { opacity:0.6;cursor:not-allowed; }
  .auth-link-row { text-align:center;font-size:0.875rem;color:rgba(255,255,255,0.4);margin-top:20px; }
  .auth-link-row a { color:#818cf8;font-weight:600;text-decoration:none; }
  .auth-link-row a:hover { color:#a5b4fc;text-decoration:underline; }
  .auth-debug { margin-top:20px;padding:14px 16px;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.25);border-radius:12px;text-align:left; }
  .auth-debug p { font-size:0.75rem;color:rgba(251,191,36,0.85);margin:0 0 6px; }
  .auth-debug code { font-size:0.72rem;color:rgba(251,191,36,0.7);word-break:break-all; }
  .auth-debug a { display:inline-block;margin-top:10px;font-size:0.82rem;color:#818cf8;text-decoration:none; }
  .auth-debug a:hover { text-decoration:underline; }
`

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [debugToken, setDebugToken] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/forgot-password/', { email })
      setDebugToken(res.data.debug_token || '')
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{darkPageStyle}</style>
      <div className="auth-root">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />

        <div className="auth-topbar">
          <a href="https://www.playto.so" target="_blank" rel="noopener noreferrer" className="auth-logo">
            <div className="auth-logo-icon"><div className="auth-logo-dot" /></div>
            <span className="auth-logo-name">Play<span>to</span></span>
          </a>
        </div>

        <div className="auth-center">
          <div className="auth-card">
            {!submitted ? (
              <>
                <h1 className="auth-title">Forgot Password</h1>
                <p className="auth-sub">Enter your email to receive a reset link</p>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                  <div className="auth-field">
                    <label className="auth-label">Email Address</label>
                    <input
                      type="email"
                      className="auth-input"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <button type="submit" className="auth-btn" disabled={loading}>
                    {loading ? 'Sending…' : 'Send Reset Link'}
                  </button>
                </form>

                <div className="auth-link-row">
                  Remember your password? <Link to="/login">Sign in</Link>
                </div>
              </>
            ) : (
              <>
                <div style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '12px' }}>📬</div>
                <h1 className="auth-title">Check your email</h1>
                <p className="auth-sub">
                  If <strong style={{ color: '#f5f5f7' }}>{email}</strong> is registered,
                  a reset link has been sent.
                </p>

                {debugToken && (
                  <div className="auth-debug">
                    <p>🛠 Demo Mode — Token (would be emailed in production)</p>
                    <code>{debugToken}</code>
                    <br />
                    <Link to={`/reset-password?token=${debugToken}`}>
                      → Click here to reset password
                    </Link>
                  </div>
                )}

                <div className="auth-link-row">
                  <Link to="/login">← Back to Login</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
