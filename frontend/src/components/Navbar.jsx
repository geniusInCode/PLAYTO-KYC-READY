import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { showToast } from './Toast.jsx'
import {
  getNotifications, markAllRead, clearNotifications, unreadCount
} from '../utils/notifications.js'

export default function Navbar() {
  const navigate  = useNavigate()
  const username  = localStorage.getItem('username')
  const role      = localStorage.getItem('user_role')

  const [menuOpen,   setMenuOpen]   = useState(false)
  const [bellOpen,   setBellOpen]   = useState(false)
  const [darkMode,   setDarkMode]   = useState(() => localStorage.getItem('theme') !== 'light')
  const [notifs,     setNotifs]     = useState(getNotifications)
  const [unread,     setUnread]     = useState(unreadCount)

  const menuRef = useRef()
  const bellRef = useRef()

  /* ── Theme ───────────────────────────────────────────────── */
  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', !darkMode)
  }, [darkMode])

  /* ── Close dropdowns on outside click ───────────────────── */
  useEffect(() => {
    const h = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  /* ── Live notification updates ───────────────────────────── */
  useEffect(() => {
    const h = () => { setNotifs(getNotifications()); setUnread(unreadCount()) }
    window.addEventListener('kyc_notifications_updated', h)
    return () => window.removeEventListener('kyc_notifications_updated', h)
  }, [])

  const toggleTheme = () => {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    showToast(`${next ? '🌙 Dark' : '☀️ Light'} mode activated`, 'info')
  }

  const openBell = () => {
    const isOpening = !bellOpen
    setBellOpen(isOpening)
    setMenuOpen(false)
    if (isOpening) { markAllRead(); setUnread(0) }
  }

  const logout = () => { localStorage.clear(); navigate('/login') }

  /* ── Notification icon by type ───────────────────────────── */
  const nIcon = (type) =>
    ({ success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' })[type] || 'ℹ️'

  const nColor = (type) =>
    ({ success:'#6ee7b7', error:'#fca5a5', warning:'#fcd34d', info:'#93c5fd' })[type] || '#93c5fd'

  const timeAgo = (ts) => {
    const diff = (Date.now() - new Date(ts)) / 1000
    if (diff < 60)   return 'just now'
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`
    if (diff < 86400)return `${Math.floor(diff/3600)}h ago`
    return `${Math.floor(diff/86400)}d ago`
  }

  return (
    <>
      <style>{`
        .navbar {
          position: relative; z-index: 50;
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 32px;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .nav-logo { display:flex; align-items:center; gap:10px; text-decoration:none; }
        .nav-logo-icon {
          width:34px; height:34px;
          background: linear-gradient(135deg,#3b82f6 0%,#6366f1 100%);
          border-radius:9px; display:flex; align-items:center; justify-content:center;
          box-shadow: 0 0 16px rgba(59,130,246,0.45); flex-shrink:0;
        }
        .nav-logo-dot {
          width:9px; height:9px; background:#fff; border-radius:50%;
          box-shadow: 0 0 6px rgba(255,255,255,0.8);
          animation: navPulse 2s ease-in-out infinite;
        }
        @keyframes navPulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.2);opacity:.8} }
        .nav-logo-text { font-size:1.05rem; font-weight:700; color:#f5f5f7; letter-spacing:-0.2px; line-height:1; }
        .nav-logo-text span { background:linear-gradient(90deg,#3b82f6,#818cf8); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
        .nav-logo-sub { font-size:.65rem; color:rgba(255,255,255,.35); font-weight:400; letter-spacing:.5px; text-transform:uppercase; margin-top:1px; display:block; }
        .nav-icon-btn {
          background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);
          border-radius:10px; padding:7px 10px; cursor:pointer; font-size:1rem;
          line-height:1; transition:all .2s; position:relative;
        }
        .nav-icon-btn:hover { background:rgba(255,255,255,0.11); }
        .nav-user-btn {
          display:flex; align-items:center; gap:10px;
          background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);
          border-radius:40px; padding:6px 14px 6px 6px;
          cursor:pointer; transition:all .2s; color:rgba(255,255,255,.75);
          font-family:'Inter',sans-serif; font-size:.875rem;
        }
        .nav-user-btn:hover { background:rgba(255,255,255,0.1); color:#fff; }
        .nav-avatar {
          width:28px; height:28px; background:linear-gradient(135deg,#3b82f6,#6366f1);
          border-radius:50%; display:flex; align-items:center; justify-content:center;
          font-weight:700; font-size:.75rem; color:#fff; flex-shrink:0;
        }
        .nav-role-badge {
          font-size:.7rem; background:rgba(99,102,241,.2); color:#a5b4fc;
          border:1px solid rgba(99,102,241,.3); border-radius:20px; padding:2px 8px; font-weight:500;
        }
        .nav-chevron { font-size:.65rem; color:rgba(255,255,255,.4); margin-left:2px; }
        .nav-dropdown {
          position:absolute; right:0; top:calc(100% + 10px); width:200px;
          background:rgba(15,15,25,.97); backdrop-filter:blur(20px);
          border:1px solid rgba(255,255,255,.1); border-radius:14px;
          box-shadow:0 16px 48px rgba(0,0,0,.6); padding:6px; z-index:200;
        }
        .nav-dropdown a, .nav-dropdown button {
          display:flex; align-items:center; gap:8px; width:100%;
          padding:9px 12px; font-size:.85rem; border-radius:9px;
          text-decoration:none; background:none; border:none; cursor:pointer;
          font-family:'Inter',sans-serif; transition:background .15s; text-align:left;
          color:rgba(255,255,255,.7);
        }
        .nav-dropdown a:hover, .nav-dropdown button:hover { background:rgba(255,255,255,.07); color:#fff; }
        .nav-dropdown .logout-btn { color:#fca5a5; }
        .nav-dropdown .logout-btn:hover { background:rgba(239,68,68,.12); color:#f87171; }
        .nav-divider { height:1px; background:rgba(255,255,255,.07); margin:4px 0; }

        /* Notification panel */
        .notif-panel {
          position:absolute; right:0; top:calc(100% + 10px); width:340px; max-height:440px;
          background:rgba(12,12,22,.97); backdrop-filter:blur(24px);
          border:1px solid rgba(255,255,255,.1); border-radius:16px;
          box-shadow:0 20px 60px rgba(0,0,0,.7); z-index:200; overflow:hidden;
          display:flex; flex-direction:column;
        }
        .notif-header {
          display:flex; align-items:center; justify-content:space-between;
          padding:14px 16px; border-bottom:1px solid rgba(255,255,255,.06);
        }
        .notif-header-title { font-weight:700; font-size:0.9rem; color:#f5f5f7; }
        .notif-header-count { color:rgba(255,255,255,0.4); font-weight:400; font-size:0.8rem; }
        .notif-list { overflow-y:auto; flex:1; }
        .notif-item {
          display:flex; gap:10px; padding:12px 16px;
          border-bottom:1px solid rgba(255,255,255,.04);
          transition:background .15s; cursor:default;
        }
        .notif-item:hover { background:rgba(255,255,255,.03); }
        .notif-item.unread { background:rgba(59,130,246,.04); }
        .notif-msg { font-size:0.82rem; color:#f5f5f7; margin:0 0 3px; line-height:1.4; }
        .notif-msg.unread { font-weight:600; }
        .notif-time { font-size:0.7rem; color:rgba(255,255,255,0.35); margin:0; }
        .notif-empty {
          text-align:center; padding:40px 20px;
          color:rgba(255,255,255,.3); font-size:.85rem;
        }
        .notif-empty-title { margin:0; font-weight:500; color:rgba(255,255,255,0.5); }
        .notif-empty-sub { margin:4px 0 0; font-size:0.78rem; opacity:0.6; color:rgba(255,255,255,0.4); }
        .notif-footer {
          padding:10px 16px; border-top:1px solid rgba(255,255,255,.06);
          display:flex; justify-content:center;
        }
        .notif-footer-text { font-size:0.75rem; color:rgba(255,255,255,0.25); }
        .notif-clear-btn {
          background:none; border:none; cursor:pointer;
          color:rgba(255,255,255,0.35); font-size:0.75rem; font-family:Inter,sans-serif;
          padding:2px 6px; border-radius:6px; transition:all 0.15s;
        }
        .notif-clear-btn:hover { color:#fca5a5; }
        @keyframes bellShake {
          0%,100%{transform:rotate(0)} 20%{transform:rotate(-15deg)} 40%{transform:rotate(15deg)} 60%{transform:rotate(-10deg)} 80%{transform:rotate(10deg)}
        }
        .bell-shake { animation: bellShake 0.5s ease; }
      `}</style>

      <nav className="navbar">
        {/* Logo */}
        <a href="https://www.playto.so" target="_blank" rel="noopener noreferrer" className="nav-logo">
          <div className="nav-logo-icon"><div className="nav-logo-dot" /></div>
          <div>
            <div className="nav-logo-text">Play<span>to</span></div>
            <span className="nav-logo-sub">KYC Portal</span>
          </div>
        </a>

        {/* Right controls */}
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>

          {/* Theme toggle */}
          <button className="nav-icon-btn" onClick={toggleTheme} title="Toggle theme">
            {darkMode ? '☀️' : '🌙'}
          </button>

          {/* Notification bell */}
          <div style={{position:'relative'}} ref={bellRef}>
            <button className="nav-icon-btn" onClick={openBell} title="Notifications">
              🔔
              {unread > 0 && (
                <span style={{
                  position:'absolute', top:'3px', right:'3px',
                  minWidth:'16px', height:'16px', borderRadius:'20px',
                  background:'#ef4444', color:'#fff', fontSize:'0.6rem',
                  fontWeight:700, display:'flex', alignItems:'center',
                  justifyContent:'center', padding:'0 3px', lineHeight:1,
                  border:'2px solid rgba(0,0,0,0.5)',
                }}>{unread > 9 ? '9+' : unread}</span>
              )}
            </button>

            {/* Notification Panel */}
            {bellOpen && (
              <div className="notif-panel">
                <div className="notif-header">
                  <span className="notif-header-title">
                    🔔 Notifications{' '}
                    {notifs.length > 0 && (
                      <span className="notif-header-count">({notifs.length})</span>
                    )}
                  </span>
                  {notifs.length > 0 && (
                    <button className="notif-clear-btn"
                      onClick={() => { clearNotifications(); setNotifs([]); setUnread(0) }}>
                      Clear all
                    </button>
                  )}
                </div>

                <div className="notif-list">
                  {notifs.length === 0 ? (
                    <div className="notif-empty">
                      <div style={{fontSize:'2rem',marginBottom:'8px'}}>🔕</div>
                      <p className="notif-empty-title">No notifications yet</p>
                      <p className="notif-empty-sub">Status changes will appear here</p>
                    </div>
                  ) : (
                    notifs.map(n => (
                      <div key={n.id} className={`notif-item${n.read ? '' : ' unread'}`}>
                        <div className={`notif-icon notif-icon-${n.type}`}>
                          {nIcon(n.type)}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <p className={`notif-msg${n.read ? '' : ' unread'}`}>{n.message}</p>
                          <p className="notif-time">{timeAgo(n.timestamp)}</p>
                        </div>
                        {!n.read && <div className="notif-dot" />}
                      </div>
                    ))
                  )}
                </div>

                {notifs.length > 0 && (
                  <div className="notif-footer">
                    <span className="notif-footer-text">
                      Showing last {notifs.length} notification{notifs.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User menu */}
          <div style={{position:'relative'}} ref={menuRef}>
            <button className="nav-user-btn" onClick={() => { setMenuOpen(o => !o); setBellOpen(false) }}>
              <div className="nav-avatar">{username?.[0]?.toUpperCase()}</div>
              <span>{username}</span>
              <span className="nav-role-badge">{role}</span>
              <span className="nav-chevron">{menuOpen ? '▲' : '▼'}</span>
            </button>

            {menuOpen && (
              <div className="nav-dropdown">
                <Link to="/change-password" onClick={() => setMenuOpen(false)}>
                  🔑 Change Password
                </Link>
                <div className="nav-divider" />
                <button className="logout-btn" onClick={logout}>↩ Logout</button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}
