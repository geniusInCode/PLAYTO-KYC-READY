import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import Navbar from '../components/Navbar.jsx'

export default function ChangePassword() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm_password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.new_password !== form.confirm_password) { setError('New passwords do not match.'); return }
    if (form.new_password.length < 8) { setError('New password must be at least 8 characters.'); return }
    if (form.old_password === form.new_password) { setError('New password must be different from current password.'); return }
    setLoading(true)
    try {
      await api.post('/auth/change-password/', { old_password: form.old_password, new_password: form.new_password })
      setSuccess(true)
      setTimeout(() => { localStorage.clear(); navigate('/login') }, 2500)
    } catch (err) {
      const msg = err.response?.data?.error?.message
      setError(Array.isArray(msg) ? msg.join(' ') : msg || 'Failed to change password.')
    } finally {
      setLoading(false)
    }
  }

  const role = localStorage.getItem('user_role')
  const backPath = role === 'reviewer' ? '/reviewer' : '/kyc'

  const pw = form.new_password
  const checks = [
    { label: 'At least 8 characters', ok: pw.length >= 8 },
    { label: 'One uppercase letter', ok: /[A-Z]/.test(pw) },
    { label: 'One number', ok: /[0-9]/.test(pw) },
  ]

  return (
    <div className="page-bg">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="page-content">
        <Navbar />
        <div style={{ maxWidth: '460px', margin: '0 auto', padding: '40px 20px' }}>

          {/* Back */}
          <button
            onClick={() => navigate(backPath)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Inter, sans-serif' }}
          >
            ← Back
          </button>

          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f5f5f7', marginBottom: '4px' }}>Change Password</h1>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)', marginBottom: '28px' }}>Update your account password</p>

          {success ? (
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
              <h2 style={{ color: '#f5f5f7', margin: '0 0 8px' }}>Password Changed!</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>
                Your password has been updated. Logging you out for security…
              </p>
            </div>
          ) : (
            <div className="card">
              {error && (
                <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: '12px', padding: '12px 16px', fontSize: '0.85rem', marginBottom: '18px' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Current password */}
                <div style={{ marginBottom: '20px' }}>
                  <label className="label">Current Password</label>
                  <input
                    type="password"
                    className="input"
                    value={form.old_password}
                    onChange={e => setForm({ ...form, old_password: e.target.value })}
                    placeholder="Your current password"
                    required
                  />
                </div>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '20px 0' }} />

                {/* New password */}
                <div style={{ marginBottom: '16px' }}>
                  <label className="label">New Password</label>
                  <input
                    type="password"
                    className="input"
                    value={form.new_password}
                    onChange={e => setForm({ ...form, new_password: e.target.value })}
                    placeholder="Min 8 characters"
                    required
                  />
                </div>

                {/* Confirm */}
                <div style={{ marginBottom: '16px' }}>
                  <label className="label">Confirm New Password</label>
                  <input
                    type="password"
                    className="input"
                    value={form.confirm_password}
                    onChange={e => setForm({ ...form, confirm_password: e.target.value })}
                    placeholder="Repeat new password"
                    required
                  />
                  {form.confirm_password && (
                    <p style={{ fontSize: '0.75rem', marginTop: '5px', color: form.new_password === form.confirm_password ? '#6ee7b7' : '#fca5a5' }}>
                      {form.new_password === form.confirm_password ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>

                {/* Password strength hints */}
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px' }}>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Password requirements</p>
                  {checks.map(({ label, ok }) => (
                    <p key={label} style={{ fontSize: '0.8rem', color: ok ? '#6ee7b7' : 'rgba(255,255,255,0.35)', margin: '4px 0' }}>
                      {ok ? '✓' : '·'} {label}
                    </p>
                  ))}
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={loading || form.new_password !== form.confirm_password}
                >
                  {loading ? 'Changing…' : 'Change Password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
