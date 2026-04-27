import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/client'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login/', form)
      const { user, tokens } = res.data
      localStorage.setItem('access_token', tokens.access)
      localStorage.setItem('refresh_token', tokens.refresh)
      localStorage.setItem('user_role', user.role)
      localStorage.setItem('username', user.username)
      localStorage.setItem('user_id', user.id)

      if (user.role === 'reviewer') navigate('/reviewer')
      else navigate('/kyc')
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        .login-root {
          min-height: 100vh;
          background: #000;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        /* ── Animated mesh gradient background ── */
        .login-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 10%, rgba(59,130,246,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 80%, rgba(99,102,241,0.15) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 50% 50%, rgba(14,165,233,0.08) 0%, transparent 50%),
            #000;
          z-index: 0;
        }

        /* ── Grid overlay ── */
        .login-root::after {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          z-index: 0;
        }

        /* ── Floating orbs ── */
        .orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.5;
          z-index: 0;
          animation: orbFloat 8s ease-in-out infinite;
        }
        .orb-1 {
          width: 420px; height: 420px;
          background: radial-gradient(circle, rgba(59,130,246,0.35), transparent 70%);
          top: -120px; left: -100px;
          animation-delay: 0s;
        }
        .orb-2 {
          width: 350px; height: 350px;
          background: radial-gradient(circle, rgba(99,102,241,0.3), transparent 70%);
          bottom: -80px; right: -80px;
          animation-delay: -3s;
        }
        .orb-3 {
          width: 250px; height: 250px;
          background: radial-gradient(circle, rgba(14,165,233,0.25), transparent 70%);
          top: 50%; right: 15%;
          animation-delay: -5s;
        }
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(20px, -30px) scale(1.05); }
          66%       { transform: translate(-15px, 20px) scale(0.97); }
        }

        /* ── Top bar with logo ── */
        .topbar {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          padding: 24px 40px;
        }
        .playto-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .playto-logo-icon {
          position: relative;
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(59,130,246,0.5), 0 0 40px rgba(59,130,246,0.2);
        }
        .playto-logo-dot {
          width: 10px;
          height: 10px;
          background: #fff;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(255,255,255,0.8);
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.2); opacity: 0.8; }
        }
        .playto-logo-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f5f5f7;
          letter-spacing: -0.3px;
        }
        .playto-logo-name span {
          background: linear-gradient(90deg, #3b82f6, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* ── Main content ── */
        .login-center {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          z-index: 10;
        }

        /* ── Glass card ── */
        .glass-card {
          width: 100%;
          max-width: 420px;
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 40px;
          box-shadow:
            0 0 0 1px rgba(59,130,246,0.1),
            0 32px 64px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.08);
        }

        .card-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .card-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #f5f5f7;
          letter-spacing: -0.5px;
          margin: 0 0 6px;
        }
        .card-header p {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.45);
          margin: 0;
        }

        /* ── Error box ── */
        .error-box {
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.3);
          color: #fca5a5;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 0.85rem;
          margin-bottom: 20px;
        }

        /* ── Form elements ── */
        .field { margin-bottom: 18px; }
        .field label {
          display: block;
          font-size: 0.8rem;
          font-weight: 500;
          color: rgba(255,255,255,0.55);
          margin-bottom: 8px;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }
        .field-wrap { position: relative; }
        .field input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 0.95rem;
          color: #f5f5f7;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .field input::placeholder { color: rgba(255,255,255,0.25); }
        .field input:focus {
          border-color: rgba(59,130,246,0.6);
          background: rgba(59,130,246,0.06);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
        }
        .pw-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.35);
          font-size: 0.8rem;
          font-family: 'Inter', sans-serif;
          padding: 0;
          transition: color 0.2s;
        }
        .pw-toggle:hover { color: rgba(255,255,255,0.7); }

        .forgot-row {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 22px;
          margin-top: -8px;
        }
        .forgot-link {
          font-size: 0.82rem;
          color: rgba(99,130,246,0.85);
          text-decoration: none;
          transition: color 0.2s;
        }
        .forgot-link:hover { color: #818cf8; text-decoration: underline; }

        /* ── Submit button ── */
        .btn-signin {
          width: 100%;
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 13px;
          font-size: 0.95rem;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.25s;
          box-shadow: 0 4px 20px rgba(59,130,246,0.35);
          position: relative;
          overflow: hidden;
        }
        .btn-signin::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .btn-signin:hover::before { opacity: 1; }
        .btn-signin:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(59,130,246,0.45);
        }
        .btn-signin:active { transform: translateY(0); }
        .btn-signin:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* ── Divider ── */
        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 24px 0;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.08);
        }
        .divider span { font-size: 0.75rem; color: rgba(255,255,255,0.3); }

        /* ── Register link ── */
        .register-row {
          text-align: center;
          font-size: 0.875rem;
          color: rgba(255,255,255,0.4);
        }
        .register-row a {
          color: #818cf8;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s;
        }
        .register-row a:hover { color: #a5b4fc; text-decoration: underline; }

        /* ── Demo box ── */
        .demo-box {
          margin-top: 24px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 16px 20px;
          font-size: 0.78rem;
          color: rgba(255,255,255,0.35);
        }
        .demo-box strong {
          display: block;
          color: rgba(255,255,255,0.55);
          margin-bottom: 6px;
          font-size: 0.8rem;
        }
        .demo-box p { margin: 3px 0; }

        /* Loading spinner */
        .spinner {
          display: inline-block;
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin-right: 8px;
          vertical-align: middle;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="login-root">
        {/* Floating orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        {/* ── Top bar: Playto logo ── */}
        <div className="topbar">
          <a href="https://www.playto.so" target="_blank" rel="noopener noreferrer" className="playto-logo">
            <div className="playto-logo-icon">
              <div className="playto-logo-dot" />
            </div>
            <span className="playto-logo-name">
              Play<span>to</span>
            </span>
          </a>
        </div>

        {/* ── Centered login card ── */}
        <div className="login-center">
          <div>
            <div className="card-header">
              <h1>Welcome back</h1>
              <p>Sign in to your Playto KYC account</p>
            </div>

            <div className="glass-card">
              {error && (
                <div className="error-box">
                  {typeof error === 'object' ? JSON.stringify(error) : error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label>Username</label>
                  <div className="field-wrap">
                    <input
                      value={form.username}
                      onChange={e => setForm({ ...form, username: e.target.value })}
                      placeholder="Enter your username"
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="field">
                  <label>Password</label>
                  <div className="field-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                      style={{ paddingRight: '56px' }}
                    />
                    <button
                      type="button"
                      className="pw-toggle"
                      onClick={() => setShowPassword(v => !v)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div className="forgot-row">
                  <Link to="/forgot-password" className="forgot-link">
                    Forgot Password?
                  </Link>
                </div>

                <button type="submit" className="btn-signin" disabled={loading}>
                  {loading && <span className="spinner" />}
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>

              <div className="divider"><span>OR</span></div>

              <div className="register-row">
                Don't have an account?{' '}
                <Link to="/register">Create one</Link>
              </div>
            </div>

            {/* Demo credentials */}
            <div className="demo-box">
              <strong>🔑 Demo accounts</strong>
              <p>merchant1 / Test@1234 &nbsp;—&nbsp; draft</p>
              <p>merchant2 / Test@1234 &nbsp;—&nbsp; under review</p>
              <p>reviewer1 / Test@1234 &nbsp;—&nbsp; reviewer</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
