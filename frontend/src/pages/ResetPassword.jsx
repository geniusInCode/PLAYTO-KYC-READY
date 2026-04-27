import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import api from '../api/client'

const darkPageStyle = `
  .auth-root{min-height:100vh;background:#000;font-family:'Inter',sans-serif;position:relative;overflow:hidden;display:flex;flex-direction:column;}
  .auth-root::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 80% 60% at 20% 10%,rgba(59,130,246,0.18) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 80% 80%,rgba(99,102,241,0.15) 0%,transparent 55%),#000;z-index:0;}
  .auth-root::after{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px);background-size:60px 60px;z-index:0;}
  .auth-orb{position:fixed;border-radius:50%;filter:blur(80px);opacity:0.45;z-index:0;animation:authOrb 9s ease-in-out infinite;}
  .auth-orb-1{width:420px;height:420px;background:radial-gradient(circle,rgba(59,130,246,0.35),transparent 70%);top:-130px;left:-110px;}
  .auth-orb-2{width:350px;height:350px;background:radial-gradient(circle,rgba(99,102,241,0.28),transparent 70%);bottom:-90px;right:-90px;animation-delay:-3s;}
  @keyframes authOrb{0%,100%{transform:translate(0,0)}50%{transform:translate(15px,-20px)}}
  .auth-topbar{position:relative;z-index:10;display:flex;align-items:center;padding:24px 40px;}
  .auth-logo{display:flex;align-items:center;gap:10px;text-decoration:none;}
  .auth-logo-icon{width:36px;height:36px;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(59,130,246,0.5);}
  .auth-logo-dot{width:10px;height:10px;background:#fff;border-radius:50%;animation:authPulse 2s ease-in-out infinite;}
  @keyframes authPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}
  .auth-logo-name{font-size:1.2rem;font-weight:700;color:#f5f5f7;}
  .auth-logo-name span{background:linear-gradient(90deg,#3b82f6,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
  .auth-center{flex:1;display:flex;align-items:center;justify-content:center;padding:20px;position:relative;z-index:10;}
  .auth-card{width:100%;max-width:420px;background:rgba(255,255,255,0.04);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:36px;box-shadow:0 0 0 1px rgba(59,130,246,0.1),0 32px 64px rgba(0,0,0,0.5);}
  .auth-title{font-size:1.6rem;font-weight:700;color:#f5f5f7;margin:0 0 4px;text-align:center;}
  .auth-sub{font-size:0.875rem;color:rgba(255,255,255,0.4);text-align:center;margin:0 0 28px;}
  .auth-error{background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);color:#fca5a5;border-radius:12px;padding:12px 16px;font-size:0.85rem;margin-bottom:18px;}
  .auth-field{margin-bottom:16px;}
  .auth-label{display:block;font-size:0.78rem;font-weight:500;color:rgba(255,255,255,0.5);margin-bottom:7px;letter-spacing:0.3px;text-transform:uppercase;}
  .auth-input{width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:11px 14px;font-size:0.92rem;color:#f5f5f7;font-family:'Inter',sans-serif;outline:none;transition:all 0.2s;box-sizing:border-box;}
  .auth-input::placeholder{color:rgba(255,255,255,0.22);}
  .auth-input:focus{border-color:rgba(59,130,246,0.6);background:rgba(59,130,246,0.06);box-shadow:0 0 0 3px rgba(59,130,246,0.15);}
  .auth-hint{font-size:0.75rem;color:rgba(255,255,255,0.3);margin-top:6px;}
  .auth-divider{height:1px;background:rgba(255,255,255,0.07);margin:20px 0;}
  .auth-btn{width:100%;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;border:none;border-radius:12px;padding:13px;font-size:0.95rem;font-weight:600;font-family:'Inter',sans-serif;cursor:pointer;transition:all 0.25s;box-shadow:0 4px 20px rgba(59,130,246,0.35);margin-top:6px;}
  .auth-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 28px rgba(59,130,246,0.45);}
  .auth-btn:disabled{opacity:0.6;cursor:not-allowed;}
  .auth-link-row{text-align:center;font-size:0.875rem;color:rgba(255,255,255,0.4);margin-top:20px;}
  .auth-link-row a{color:#818cf8;font-weight:600;text-decoration:none;}
  .auth-link-row a:hover{color:#a5b4fc;text-decoration:underline;}
  .match-ok{font-size:0.75rem;color:#6ee7b7;margin-top:5px;}
  .match-no{font-size:0.75rem;color:#fca5a5;margin-top:5px;}
`

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({ token: '', new_password: '', confirm_password: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token')
    if (tokenFromUrl) setForm(f => ({ ...f, token: tokenFromUrl }))
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.new_password !== form.confirm_password) { setError('Passwords do not match.'); return }
    if (form.new_password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      await api.post('/auth/reset-password/', { token: form.token.trim(), new_password: form.new_password })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      const msg = err.response?.data?.error?.message
      setError(Array.isArray(msg) ? msg.join(' ') : msg || 'Reset failed.')
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
            {success ? (
              <>
                <div style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '12px' }}>✅</div>
                <h1 className="auth-title">Password Reset!</h1>
                <p className="auth-sub">Your password has been updated. Redirecting to login…</p>
                <Link to="/login" className="auth-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                  Go to Login
                </Link>
              </>
            ) : (
              <>
                <h1 className="auth-title">Reset Password</h1>
                <p className="auth-sub">Enter your reset token and choose a new password</p>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                  <div className="auth-field">
                    <label className="auth-label">Reset Token</label>
                    <input
                      className="auth-input"
                      style={{ fontFamily: 'monospace' }}
                      value={form.token}
                      onChange={e => setForm({ ...form, token: e.target.value })}
                      placeholder="Paste your reset token here"
                      required
                    />
                    <p className="auth-hint">Token was shown on the forgot password page (or in your email)</p>
                  </div>

                  <div className="auth-divider" />

                  <div className="auth-field">
                    <label className="auth-label">New Password</label>
                    <input
                      type="password"
                      className="auth-input"
                      value={form.new_password}
                      onChange={e => setForm({ ...form, new_password: e.target.value })}
                      placeholder="Min 8 characters"
                      required
                    />
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="auth-input"
                      value={form.confirm_password}
                      onChange={e => setForm({ ...form, confirm_password: e.target.value })}
                      placeholder="Repeat your new password"
                      required
                    />
                    {form.confirm_password && (
                      <p className={form.new_password === form.confirm_password ? 'match-ok' : 'match-no'}>
                        {form.new_password === form.confirm_password ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </p>
                    )}
                  </div>

                  <button type="submit" className="auth-btn" disabled={loading}>
                    {loading ? 'Resetting…' : 'Reset Password'}
                  </button>
                </form>

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
