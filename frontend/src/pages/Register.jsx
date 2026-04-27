import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/client'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '', email: '', password: '',
    first_name: '', last_name: '', role: 'merchant'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/register/', form)
      const { user, tokens } = res.data
      localStorage.setItem('access_token', tokens.access)
      localStorage.setItem('refresh_token', tokens.refresh)
      localStorage.setItem('user_role', user.role)
      localStorage.setItem('username', user.username)
      localStorage.setItem('user_id', user.id)
      if (user.role === 'reviewer') navigate('/reviewer')
      else navigate('/kyc')
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        .reg-root {
          min-height: 100vh;
          background: #000;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .reg-root::before {
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
        .reg-root::after {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          z-index: 0;
        }
        .reg-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.45;
          z-index: 0;
          animation: regOrbFloat 9s ease-in-out infinite;
        }
        .reg-orb-1 {
          width: 420px; height: 420px;
          background: radial-gradient(circle, rgba(59,130,246,0.35), transparent 70%);
          top: -130px; left: -110px;
          animation-delay: 0s;
        }
        .reg-orb-2 {
          width: 350px; height: 350px;
          background: radial-gradient(circle, rgba(99,102,241,0.28), transparent 70%);
          bottom: -90px; right: -90px;
          animation-delay: -3s;
        }
        .reg-orb-3 {
          width: 260px; height: 260px;
          background: radial-gradient(circle, rgba(14,165,233,0.22), transparent 70%);
          top: 45%; right: 12%;
          animation-delay: -6s;
        }
        @keyframes regOrbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(18px, -28px) scale(1.04); }
          66%       { transform: translate(-14px, 18px) scale(0.97); }
        }

        /* Top bar */
        .reg-topbar {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          padding: 24px 40px;
        }
        .reg-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .reg-logo-icon {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(59,130,246,0.5);
        }
        .reg-logo-dot {
          width: 10px; height: 10px;
          background: #fff;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(255,255,255,0.8);
          animation: regPulse 2s ease-in-out infinite;
        }
        @keyframes regPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.2); opacity: 0.8; }
        }
        .reg-logo-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f5f5f7;
          letter-spacing: -0.3px;
        }
        .reg-logo-name span {
          background: linear-gradient(90deg, #3b82f6, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Center content */
        .reg-center {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          z-index: 10;
        }

        /* Header above card */
        .reg-header {
          text-align: center;
          margin-bottom: 28px;
        }
        .reg-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #f5f5f7;
          letter-spacing: -0.5px;
          margin: 0 0 6px;
        }
        .reg-header p {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.4);
          margin: 0;
        }

        /* Glass card */
        .reg-card {
          width: 100%;
          max-width: 460px;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 36px;
          box-shadow:
            0 0 0 1px rgba(59,130,246,0.1),
            0 32px 64px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.07);
        }

        /* Error */
        .reg-error {
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.3);
          color: #fca5a5;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 0.85rem;
          margin-bottom: 20px;
        }

        /* Fields */
        .reg-field { margin-bottom: 16px; }
        .reg-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }
        .reg-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 500;
          color: rgba(255,255,255,0.5);
          margin-bottom: 7px;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }
        .reg-wrap { position: relative; }
        .reg-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 11px 14px;
          font-size: 0.92rem;
          color: #f5f5f7;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .reg-input::placeholder { color: rgba(255,255,255,0.22); }
        .reg-input:focus {
          border-color: rgba(59,130,246,0.6);
          background: rgba(59,130,246,0.06);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
        }
        .reg-pw-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.35);
          font-size: 0.78rem;
          font-family: 'Inter', sans-serif;
          padding: 0;
          transition: color 0.2s;
        }
        .reg-pw-toggle:hover { color: rgba(255,255,255,0.7); }

        /* Submit */
        .reg-btn {
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
          margin-top: 6px;
        }
        .reg-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(59,130,246,0.45);
        }
        .reg-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Divider */
        .reg-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 22px 0;
        }
        .reg-divider::before, .reg-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.08);
        }
        .reg-divider span { font-size: 0.75rem; color: rgba(255,255,255,0.3); }

        /* Sign in link */
        .reg-signin-row {
          text-align: center;
          font-size: 0.875rem;
          color: rgba(255,255,255,0.4);
        }
        .reg-signin-row a {
          color: #818cf8;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s;
        }
        .reg-signin-row a:hover { color: #a5b4fc; text-decoration: underline; }

        /* Spinner */
        .reg-spinner {
          display: inline-block;
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: regSpin 0.7s linear infinite;
          margin-right: 8px;
          vertical-align: middle;
        }
        @keyframes regSpin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="reg-root">
        <div className="reg-orb reg-orb-1" />
        <div className="reg-orb reg-orb-2" />
        <div className="reg-orb reg-orb-3" />

        {/* Top bar: Playto logo */}
        <div className="reg-topbar">
          <a href="https://www.playto.so" target="_blank" rel="noopener noreferrer" className="reg-logo">
            <div className="reg-logo-icon">
              <div className="reg-logo-dot" />
            </div>
            <span className="reg-logo-name">Play<span>to</span></span>
          </a>
        </div>

        {/* Centered card */}
        <div className="reg-center">
          <div style={{ width: '100%', maxWidth: '460px' }}>
            <div className="reg-header">
              <h1>Create your account</h1>
              <p>Register as a merchant to get started</p>
            </div>

            <div className="reg-card">
              {error && (
                <div className="reg-error">
                  {typeof error === 'object' ? JSON.stringify(error) : error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* First + Last name side by side */}
                <div className="reg-grid">
                  <div>
                    <label className="reg-label"><span style={{ color: '#93c5fd', fontWeight: 700, marginRight: '4px' }}>1.</span> First Name</label>
                    <input
                      className="reg-input"
                      value={form.first_name}
                      onChange={e => setForm({ ...form, first_name: e.target.value })}
                      placeholder="Rahul"
                      required
                    />
                  </div>
                  <div>
                    <label className="reg-label"><span style={{ color: '#93c5fd', fontWeight: 700, marginRight: '4px' }}>2.</span> Last Name</label>
                    <input
                      className="reg-input"
                      value={form.last_name}
                      onChange={e => setForm({ ...form, last_name: e.target.value })}
                      placeholder="Sharma"
                      required
                    />
                  </div>
                </div>

                <div className="reg-field">
                  <label className="reg-label"><span style={{ color: '#93c5fd', fontWeight: 700, marginRight: '4px' }}>3.</span> Username</label>
                  <input
                    className="reg-input"
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    placeholder="rahulsharma"
                    required
                    autoComplete="username"
                  />
                </div>

                <div className="reg-field">
                  <label className="reg-label"><span style={{ color: '#93c5fd', fontWeight: 700, marginRight: '4px' }}>4.</span> Email Address</label>
                  <input
                    type="email"
                    className="reg-input"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="rahul@example.com"
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="reg-field">
                  <label className="reg-label"><span style={{ color: '#93c5fd', fontWeight: 700, marginRight: '4px' }}>5.</span> Password</label>
                  <div className="reg-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="reg-input"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="Min 8 chars, include uppercase & number"
                      required
                      autoComplete="new-password"
                      style={{ paddingRight: '56px' }}
                    />
                    <button
                      type="button"
                      className="reg-pw-toggle"
                      onClick={() => setShowPassword(v => !v)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <button type="submit" className="reg-btn" disabled={loading}>
                  {loading && <span className="reg-spinner" />}
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>
              </form>

              <div className="reg-divider"><span>OR</span></div>

              <div className="reg-signin-row">
                Already have an account?{' '}
                <Link to="/login">Sign in</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
