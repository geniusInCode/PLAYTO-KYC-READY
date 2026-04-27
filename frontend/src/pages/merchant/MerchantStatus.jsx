import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import Navbar from '../../components/Navbar.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { addNotification } from '../../utils/notifications.js'

/* ── KYC Certificate Generator ─────────────────────────────── */
function downloadCertificate(submission) {
  const dateStr = submission.submitted_at
    ? new Date(submission.submitted_at).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })
    : new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })
  const certId = `PLY-${submission.id || 'XXXX'}-${Date.now().toString(36).toUpperCase()}`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>KYC Certificate — ${submission.full_name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700&display=swap');
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:'Inter',sans-serif; background:#f0f4ff; display:flex; align-items:center; justify-content:center; min-height:100vh; padding:40px 20px; }
    .cert {
      width:760px; background:#fff; border-radius:24px; overflow:hidden;
      box-shadow:0 20px 80px rgba(0,0,0,0.15);
    }
    .cert-header {
      background:linear-gradient(135deg,#1e3a8a 0%,#3b82f6 50%,#6366f1 100%);
      padding:40px 48px; text-align:center; position:relative; overflow:hidden;
    }
    .cert-header::before {
      content:''; position:absolute; inset:0;
      background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    }
    .cert-logo { display:flex; align-items:center; justify-content:center; gap:12px; margin-bottom:16px; position:relative; }
    .cert-logo-icon { width:44px; height:44px; background:rgba(255,255,255,0.2); border-radius:12px; display:flex; align-items:center; justify-content:center; border:2px solid rgba(255,255,255,0.3); }
    .cert-logo-text { font-size:1.5rem; font-weight:800; color:#fff; letter-spacing:-0.5px; }
    .cert-title { font-family:'Playfair Display',serif; font-size:1.8rem; color:#fff; font-weight:700; position:relative; }
    .cert-subtitle { color:rgba(255,255,255,0.75); font-size:0.85rem; margin-top:6px; letter-spacing:1.5px; text-transform:uppercase; position:relative; }
    .cert-seal { position:absolute; right:40px; top:50%; transform:translateY(-50%); width:80px; height:80px; border-radius:50%; border:3px solid rgba(255,255,255,0.3); display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(255,255,255,0.1); }
    .cert-seal-inner { font-size:1.8rem; }
    .cert-seal-text { font-size:0.4rem; color:rgba(255,255,255,0.7); font-weight:600; letter-spacing:1px; text-transform:uppercase; margin-top:2px; }
    .cert-body { padding:40px 48px; }
    .cert-intro { text-align:center; color:#64748b; font-size:0.9rem; margin-bottom:32px; line-height:1.6; }
    .cert-name { font-family:'Playfair Display',serif; font-size:2.2rem; font-weight:700; color:#1e293b; text-align:center; margin-bottom:6px; }
    .cert-business { text-align:center; color:#3b82f6; font-weight:600; font-size:1rem; margin-bottom:32px; }
    .cert-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:32px; }
    .cert-field { background:#f8faff; border:1px solid #e2e8f0; border-radius:12px; padding:14px 18px; }
    .cert-field-label { font-size:0.7rem; font-weight:600; color:#94a3b8; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:4px; }
    .cert-field-value { font-size:0.9rem; font-weight:600; color:#1e293b; }
    .cert-approved-badge {
      text-align:center; background:linear-gradient(135deg,#dcfce7,#d1fae5); border:2px solid #86efac;
      border-radius:16px; padding:20px; margin-bottom:28px;
    }
    .cert-approved-icon { font-size:2.5rem; margin-bottom:8px; }
    .cert-approved-text { font-size:1.1rem; font-weight:700; color:#065f46; }
    .cert-approved-sub { font-size:0.8rem; color:#059669; margin-top:4px; }
    .cert-footer { display:flex; align-items:center; justify-content:space-between; padding:20px 48px; background:#f8faff; border-top:1px solid #e2e8f0; }
    .cert-footer-id { font-size:0.72rem; color:#94a3b8; font-family:monospace; }
    .cert-footer-note { font-size:0.72rem; color:#94a3b8; text-align:right; }
    .cert-signature { text-align:center; margin-bottom:24px; }
    .cert-signature-line { width:160px; height:2px; background:#cbd5e1; margin:0 auto 6px; }
    .cert-signature-text { font-size:0.78rem; color:#94a3b8; }
    @media print { body { background:#fff; padding:0; } .cert { box-shadow:none; border-radius:0; } }
  </style>
</head>
<body>
  <div class="cert">
    <div class="cert-header">
      <div class="cert-logo">
        <div class="cert-logo-icon"><div style="width:12px;height:12px;background:#fff;border-radius:50%;"></div></div>
        <span class="cert-logo-text">Playto</span>
      </div>
      <h1 class="cert-title">KYC Verification Certificate</h1>
      <p class="cert-subtitle">Know Your Customer • Verified & Approved</p>
      <div class="cert-seal">
        <div class="cert-seal-inner">✅</div>
        <div class="cert-seal-text">VERIFIED</div>
      </div>
    </div>
    <div class="cert-body">
      <p class="cert-intro">This is to certify that the following individual has successfully completed the KYC verification process on the Playto platform.</p>
      <div class="cert-approved-badge">
        <div class="cert-approved-icon">🏆</div>
        <div class="cert-approved-text">KYC Verification Successful</div>
        <div class="cert-approved-sub">Identity and business details have been verified</div>
      </div>
      <div class="cert-name">${submission.full_name || 'N/A'}</div>
      <div class="cert-business">${submission.business_name || ''} ${submission.business_type ? '• ' + submission.business_type : ''}</div>
      <div class="cert-grid">
        <div class="cert-field"><div class="cert-field-label">Email Address</div><div class="cert-field-value">${submission.email || '—'}</div></div>
        <div class="cert-field"><div class="cert-field-label">Phone Number</div><div class="cert-field-value">${submission.phone || '—'}</div></div>
        <div class="cert-field"><div class="cert-field-label">Business Type</div><div class="cert-field-value">${submission.business_type || '—'}</div></div>
        <div class="cert-field"><div class="cert-field-label">Monthly Volume</div><div class="cert-field-value">$${Number(submission.monthly_volume_usd||0).toLocaleString()}</div></div>
        <div class="cert-field"><div class="cert-field-label">Submission Date</div><div class="cert-field-value">${dateStr}</div></div>
        <div class="cert-field"><div class="cert-field-label">Verification Status</div><div class="cert-field-value" style="color:#059669">✅ Approved</div></div>
      </div>
      <div class="cert-signature">
        <div class="cert-signature-line"></div>
        <div class="cert-signature-text">Playto KYC Verification Team</div>
      </div>
    </div>
    <div class="cert-footer">
      <div class="cert-footer-id">Certificate ID: ${certId}</div>
      <div class="cert-footer-note">Generated on ${new Date().toLocaleDateString('en-IN')}<br/>Playto Financial Services</div>
    </div>
  </div>
  <script>setTimeout(()=>window.print(),600)<\/script>
</body>
</html>`

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
}

const STATUS_META = {
  submitted:           { icon:'📬', title:'Submission Received',     desc:'Your KYC is in the queue.',                                          glow:'rgba(59,130,246,0.4)'  },
  under_review:        { icon:'🔍', title:'Under Review',            desc:'A reviewer is currently looking at your submission.',                 glow:'rgba(245,158,11,0.4)'  },
  more_info_requested: { icon:'📋', title:'Additional Info Needed',  desc:'The reviewer needs more info. Please update your submission.',       glow:'rgba(168,85,247,0.4)'  },
  approved:            { icon:'✅', title:'Approved!',               desc:'Congratulations! Your KYC is approved. You can collect payments.',   glow:'rgba(16,185,129,0.4)'  },
  rejected:            { icon:'❌', title:'Rejected',                desc:'Unfortunately your KYC was not approved.',                           glow:'rgba(239,68,68,0.4)'   },
  draft:               { icon:'📝', title:'Draft',                   desc:'Your KYC is not submitted yet.',                                     glow:'rgba(255,255,255,0.1)' },
}

// Build the 4 timeline steps dynamically based on current status
function buildSteps(status) {
  const last = status === 'rejected'
    ? { label: 'Rejected', icon: '❌' }
    : { label: 'Approved',  icon: '✅' }
  return [
    { label: 'Form Filled',  icon: '📝' },
    { label: 'Submitted',    icon: '📬' },
    { label: status === 'more_info_requested' ? 'More Info' : 'Under Review',
      icon: status === 'more_info_requested' ? '📋' : '🔍' },
    last,
  ]
}

// How many steps come BEFORE the active step and are "done" (green ✓)
function getDoneCount(status) {
  if (status === 'approved' || status === 'rejected') return 3
  if (status === 'under_review' || status === 'more_info_requested') return 2
  if (status === 'submitted') return 1
  return 0
}

// Which step index is currently "active" (highlighted)
function getActiveIndex(status) {
  if (status === 'approved' || status === 'rejected') return 3
  if (status === 'under_review' || status === 'more_info_requested') return 2
  if (status === 'submitted') return 1
  return 0
}

function ProgressTimeline({ status, submittedAt }) {
  const steps       = buildSteps(status)
  const doneCount   = getDoneCount(status)
  const activeIndex = getActiveIndex(status)
  const isRejected  = status === 'rejected'
  const isMoreInfo  = status === 'more_info_requested'

  // Per-step visual config
  const getStyle = (i) => {
    const isDone   = i < doneCount
    const isActive = i === activeIndex
    if (isDone)               return { circleBg:'linear-gradient(135deg,#059669,#10b981)', border:'#059669', glow:'0 0 0 3px rgba(16,185,129,0.2),0 0 18px rgba(16,185,129,0.4)', text:'#6ee7b7',   lineGrad:'#10b981', pulse:false }
    if (isActive && isRejected) return { circleBg:'linear-gradient(135deg,#b91c1c,#ef4444)', border:'#ef4444', glow:'0 0 0 3px rgba(239,68,68,0.2),0 0 18px rgba(239,68,68,0.4)',  text:'#fca5a5',   lineGrad:'#ef4444', pulse:true  }
    if (isActive && i===3)    return { circleBg:'linear-gradient(135deg,#059669,#10b981)', border:'#10b981', glow:'0 0 0 3px rgba(16,185,129,0.2),0 0 18px rgba(16,185,129,0.4)', text:'#6ee7b7',   lineGrad:'#10b981', pulse:true  }
    if (isActive && isMoreInfo) return { circleBg:'linear-gradient(135deg,#7c3aed,#a855f7)', border:'#a855f7', glow:'0 0 0 3px rgba(168,85,247,0.2),0 0 18px rgba(168,85,247,0.4)', text:'#d8b4fe', lineGrad:'#a855f7', pulse:true  }
    if (isActive)             return { circleBg:'linear-gradient(135deg,#1d4ed8,#3b82f6)', border:'#3b82f6', glow:'0 0 0 3px rgba(59,130,246,0.2),0 0 18px rgba(59,130,246,0.4)',  text:'#93c5fd',   lineGrad:'#3b82f6', pulse:true  }
    /* future */              return { circleBg:'rgba(255,255,255,0.05)',                   border:'rgba(255,255,255,0.12)', glow:'none',                                              text:'rgba(255,255,255,0.25)', lineGrad:'rgba(255,255,255,0.08)', pulse:false }
  }

  // Line colour between step i and i+1
  const getLineColor = (i) => {
    if (i < doneCount - 1) return 'linear-gradient(90deg,#059669,#10b981)'   // fully done
    if (i === doneCount - 1) return `linear-gradient(90deg,#10b981,${getStyle(i+1).lineGrad})` // transitioning
    return 'rgba(255,255,255,0.07)'  // future
  }

  const CIRCLE = 48  // px
  const HALF   = CIRCLE / 2

  return (
    <div className="card">
      <style>{`
        @keyframes tlPulse {
          0%,100% { box-shadow: 0 0 0 0 currentColor, 0 0 18px currentColor; }
          50%      { box-shadow: 0 0 0 6px transparent, 0 0 24px currentColor; }
        }
        .tl-pulse { animation: tlPulse 2s ease-in-out infinite; }
      `}</style>

      <h3 style={{fontSize:'0.72rem',fontWeight:700,color:'rgba(255,255,255,0.45)',
        textTransform:'uppercase',letterSpacing:'1px',marginBottom:'32px'}}>
        ✦ KYC Progress
      </h3>

      {/*
        Layout: [step] [──line──] [step] [──line──] [step] [──line──] [step]
        Each "step" is a fixed-width column with circle + label stacked.
        Each "line" is flex:1 sitting at marginTop = HALF px (circle center height).
        This is the only approach that guarantees perfect circle↔line alignment.
      */}
      <div style={{display:'flex', alignItems:'flex-start', width:'100%'}}>
        {steps.map((step, i) => {
          const isDone   = i < doneCount
          const isActive = i === activeIndex
          const s = getStyle(i)

          return (
            <>
              {/* ── Connector line (between steps, before each step except first) ── */}
              {i > 0 && (
                <div style={{
                  flex: 1,
                  height: '3px',
                  borderRadius: '2px',
                  background: getLineColor(i - 1),
                  alignSelf: 'flex-start',
                  marginTop: `${HALF - 1}px`,   // vertically center on circle
                  minWidth: '16px',
                }} />
              )}

              {/* ── Step column ── */}
              <div key={i} style={{
                display:'flex', flexDirection:'column', alignItems:'center',
                width: `${CIRCLE + 24}px`, flexShrink: 0,
              }}>
                {/* Circle */}
                <div style={{
                  width: `${CIRCLE}px`, height: `${CIRCLE}px`,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: s.circleBg,
                  border: `2px solid ${s.border}`,
                  boxShadow: s.glow,
                  fontSize: isDone ? '1rem' : '1.25rem',
                  transition: 'all 0.4s ease',
                  position: 'relative',
                  color: s.border,  // used by tlPulse currentColor
                  ...(s.pulse ? { animation:'tlPulse 2.2s ease-in-out infinite' } : {}),
                }}>
                  {/* Done: show step number with checkmark */}
                  {isDone ? (
                    <span style={{
                      fontSize:'1rem', fontWeight:700, color:'#fff',
                      textShadow:'0 1px 4px rgba(0,0,0,0.3)',
                    }}>✓</span>
                  ) : (
                    <span style={{filter: isActive ? 'none' : 'grayscale(0.5) opacity(0.5)'}}>
                      {step.icon}
                    </span>
                  )}
                  {/* Step number badge */}
                  <span style={{
                    position:'absolute', top:'-4px', right:'-4px',
                    width:'16px', height:'16px', borderRadius:'50%',
                    background: isDone ? '#10b981' : isActive ? s.border : 'rgba(255,255,255,0.15)',
                    border: '2px solid rgba(0,0,0,0.6)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'0.5rem', fontWeight:700, color:'#fff',
                    lineHeight:1,
                  }}>
                    {i + 1}
                  </span>
                </div>

                {/* Label */}
                <p style={{
                  marginTop: '10px',
                  fontSize: '0.67rem',
                  fontWeight: isActive ? 700 : isDone ? 500 : 400,
                  color: s.text,
                  textAlign: 'center',
                  lineHeight: 1.4,
                  letterSpacing: isActive ? '0.2px' : 0,
                  width: '100%',
                  padding: 0,
                }}>
                  {step.label}
                </p>
              </div>
            </>
          )
        })}
      </div>

      {submittedAt && (
        <p style={{fontSize:'0.72rem',color:'rgba(255,255,255,0.28)',marginTop:'20px',textAlign:'center',letterSpacing:'0.3px'}}>
          📅 Submitted {new Date(submittedAt).toLocaleDateString('en-IN',
            { day:'numeric', month:'long', year:'numeric' })}
        </p>
      )}
    </div>
  )
}



export default function MerchantStatus() {
  const navigate = useNavigate()
  const [submission, setSubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await api.get('/kyc/my/')
      setSubmission(res.data)
      if (res.data.status === 'draft') navigate('/kyc')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Push notification when submission status loads
  const notifSentRef = useRef(false)
  useEffect(() => {
    if (!submission || notifSentRef.current) return
    notifSentRef.current = true
    const messages = {
      approved:            { msg: '🎉 Your KYC has been APPROVED! You can now collect payments.', type: 'success' },
      rejected:            { msg: '❌ Your KYC was rejected. Please review and resubmit.', type: 'error' },
      under_review:        { msg: '🔍 Your KYC is currently under review by our team.', type: 'info' },
      more_info_requested: { msg: '📋 Reviewer needs more info. Please update your submission.', type: 'warning' },
      submitted:           { msg: '📬 KYC submitted successfully! We will review it soon.', type: 'success' },
    }
    const entry = messages[submission.status]
    if (entry) addNotification(entry.msg, entry.type)
  }, [submission])

  if (loading) return (
    <div className="page-bg flex items-center justify-center">
      <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      <div className="page-content" style={{color:'rgba(255,255,255,0.4)'}}>Loading...</div>
    </div>
  )

  const cfg = STATUS_META[submission?.status] || STATUS_META.draft

  const rowStyle = {display:'flex',justifyContent:'space-between',alignItems:'center',paddingBottom:'10px',
    marginBottom:'10px',borderBottom:'1px solid var(--c-faint)',fontSize:'0.875rem'}

  return (
    <div className="page-bg">
      <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      <div className="page-content">
        <Navbar />
        <div style={{maxWidth:'560px',margin:'0 auto',padding:'40px 20px'}}>

          {/* Header */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'24px'}}>
            <h1 style={{fontSize:'1.5rem',fontWeight:700,color:'var(--c-text)',margin:0}}>KYC Status</h1>
            <button onClick={() => load(true)} style={{background:'var(--c-hover)',border:'1px solid var(--c-border)',
              color:'var(--c-sub)',borderRadius:'10px',padding:'7px 14px',cursor:'pointer',fontSize:'0.8rem',fontFamily:'Inter,sans-serif'}}>
              {refreshing ? '...' : '↻ Refresh'}
            </button>
          </div>

          {/* Status hero card */}
          <div className="card" style={{textAlign:'center',marginBottom:'16px',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',inset:0,background:`radial-gradient(ellipse at 50% 0%, ${cfg.glow} 0%, transparent 65%)`,pointerEvents:'none'}} />
            <div style={{fontSize:'3.5rem',marginBottom:'12px'}}>{cfg.icon}</div>
            <StatusBadge status={submission.status} />
            <h2 style={{fontSize:'1.3rem',fontWeight:700,color:'var(--c-text)',margin:'12px 0 6px'}}>{cfg.title}</h2>
            <p style={{fontSize:'0.875rem',color:'var(--c-muted)',margin:0}}>{cfg.desc}</p>

            {submission.reviewer_note && (
              <div style={{marginTop:'16px',padding:'12px 16px',background:'rgba(168,85,247,0.1)',border:'1px solid rgba(168,85,247,0.25)',borderRadius:'12px',textAlign:'left'}}>
                <p style={{fontSize:'0.8rem',fontWeight:600,color:'#d8b4fe',margin:'0 0 4px'}}>💬 Reviewer note:</p>
                <p style={{fontSize:'0.85rem',color:'var(--c-sub)',margin:0}}>{submission.reviewer_note}</p>
              </div>
            )}

            {submission.status === 'more_info_requested' && (
              <button className="btn-primary" style={{marginTop:'16px'}} onClick={() => navigate('/kyc')}>
                📝 Update Submission
              </button>
            )}

            {/* Certificate download for approved */}
            {submission.status === 'approved' && (
              <div style={{marginTop:'20px'}}>
                <div style={{padding:'16px',background:'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.08))',
                  border:'1px solid rgba(16,185,129,0.25)',borderRadius:'14px',marginBottom:'14px'}}>
                  <p style={{fontSize:'0.82rem',color:'#6ee7b7',fontWeight:600,margin:'0 0 4px'}}>🏆 Congratulations!</p>
                  <p style={{fontSize:'0.78rem',color:'rgba(255,255,255,0.55)',margin:0}}>
                    Your identity has been verified. Download your official KYC certificate.
                  </p>
                </div>
                <button
                  onClick={() => { downloadCertificate(submission); addNotification('📄 KYC Certificate downloaded successfully!', 'success') }}
                  style={{
                    width:'100%', padding:'13px', borderRadius:'12px', border:'none', cursor:'pointer',
                    background:'linear-gradient(135deg,#059669,#10b981)', color:'#fff',
                    fontFamily:'Inter,sans-serif', fontSize:'0.95rem', fontWeight:700,
                    boxShadow:'0 4px 20px rgba(16,185,129,0.4)',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                    transition:'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
                  onMouseLeave={e => e.currentTarget.style.transform='none'}
                >
                  📄 Download KYC Certificate
                </button>
              </div>
            )}
          </div>

          {/* Progress Timeline */}
          <div style={{marginBottom:'16px'}}>
            <ProgressTimeline status={submission.status} submittedAt={submission.submitted_at} />
          </div>

          {/* Submission details */}
          <div className="card">
            <h3 style={{fontSize:'0.72rem',fontWeight:600,color:'var(--c-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'14px'}}>Submission Details</h3>
            <div>
              <div style={rowStyle}>
                <span style={{color:'var(--c-muted)'}}>Full Name</span>
                <span style={{color:'var(--c-text)',fontWeight:500}}>{submission.full_name || '—'}</span>
              </div>
              <div style={rowStyle}>
                <span style={{color:'var(--c-muted)'}}>Business</span>
                <span style={{color:'var(--c-text)',fontWeight:500}}>{submission.business_name || '—'}</span>
              </div>
              <div style={rowStyle}>
                <span style={{color:'var(--c-muted)'}}>Submitted</span>
                <span style={{color:'var(--c-text)',fontWeight:500}}>
                  {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString('en-IN') : 'Not yet'}
                </span>
              </div>
              <div style={{...rowStyle, borderBottom:'none', marginBottom:0, paddingBottom:0}}>
                <span style={{color:'var(--c-muted)'}}>Documents</span>
                <span style={{color: submission.documents?.length >= 3 ? '#6ee7b7' : '#fcd34d', fontWeight:500}}>
                  {submission.documents?.length || 0} / 3 uploaded
                  {submission.documents?.length >= 3 ? ' ✓' : ''}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
