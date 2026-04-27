import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/client'
import Navbar from '../../components/Navbar.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { showToast } from '../../components/Toast.jsx'

const TRANSITION_OPTIONS = {
  submitted:           [{ state: 'under_review', label: '🔍 Start Review', style: 'btn-secondary' }],
  under_review:        [
    { state: 'approved',             label: '✅ Approve',          style: 'btn-success', needsNote: false },
    { state: 'rejected',             label: '❌ Reject',           style: 'btn-danger',  needsNote: true },
    { state: 'more_info_requested',  label: '📋 Request More Info', style: 'btn-secondary', needsNote: true },
  ],
  // more_info_requested: merchant must resubmit (→ submitted) before reviewer can act.
  // No reviewer action available here — show informational message instead.
  more_info_requested: [],
}


// ── Document Preview Modal ──────────────────────────────────────────
function DocPreviewModal({ doc, onClose }) {
  const isImage = /\.(jpg|jpeg|png)$/i.test(doc.original_filename)
  const isPdf   = /\.pdf$/i.test(doc.original_filename)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(8px)',
      zIndex:1000, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px'
    }} onClick={onClose}>
      <div style={{
        background:'rgba(15,15,25,0.98)', border:'1px solid rgba(255,255,255,0.1)',
        borderRadius:'18px', width:'100%', maxWidth:'860px', maxHeight:'90vh',
        display:'flex', flexDirection:'column', overflow:'hidden',
        boxShadow:'0 32px 80px rgba(0,0,0,0.7)'
      }} onClick={e => e.stopPropagation()}>
        {/* Modal header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 24px',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
          <div>
            <p style={{fontWeight:600,color:'#f5f5f7',margin:'0 0 2px'}}>{doc.doc_type.replace('_',' ').toUpperCase()}</p>
            <p style={{fontSize:'0.75rem',color:'rgba(255,255,255,0.4)',margin:0}}>{doc.original_filename} · {(doc.file_size/1024).toFixed(0)} KB</p>
          </div>
          <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
            <a href={doc.file_url} target="_blank" rel="noreferrer"
              style={{background:'rgba(59,130,246,0.15)',border:'1px solid rgba(59,130,246,0.3)',color:'#93c5fd',
                borderRadius:'8px',padding:'6px 14px',fontSize:'0.8rem',fontWeight:600,textDecoration:'none'}}>
              ↗ Open Original
            </a>
            <button onClick={onClose} style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',
              color:'rgba(255,255,255,0.6)',borderRadius:'8px',padding:'6px 12px',cursor:'pointer',fontSize:'1rem',fontFamily:'Inter,sans-serif'}}>
              ✕
            </button>
          </div>
        </div>
        {/* Preview area */}
        <div style={{flex:1, overflow:'auto', padding:'24px', display:'flex', alignItems:'center', justifyContent:'center', minHeight:'400px'}}>
          {isImage && (
            <img src={doc.file_url} alt={doc.original_filename}
              style={{maxWidth:'100%', maxHeight:'65vh', borderRadius:'10px', boxShadow:'0 8px 32px rgba(0,0,0,0.5)'}} />
          )}
          {isPdf && (
            <iframe src={doc.file_url} title={doc.original_filename}
              style={{width:'100%', height:'65vh', border:'none', borderRadius:'10px'}} />
          )}
          {!isImage && !isPdf && (
            <div style={{textAlign:'center'}}>
              <p style={{fontSize:'3rem', marginBottom:'12px'}}>📄</p>
              <p style={{color:'rgba(255,255,255,0.5)'}}>Preview not available for this file type.</p>
              <a href={doc.file_url} target="_blank" rel="noreferrer"
                style={{color:'#818cf8',fontWeight:600}}>Download to view ↗</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Audit / Activity Log ──────────────────────────────────────────
function AuditLog({ submission }) {
  const events = []
  if (submission.submitted_at)
    events.push({ time: submission.submitted_at, label: 'KYC Submitted', color: '#60a5fa', icon: '📬' })
  if (submission.status === 'under_review' || submission.status === 'approved' || submission.status === 'rejected' || submission.status === 'more_info_requested')
    events.push({ time: null, label: 'Moved to Under Review', color: '#fcd34d', icon: '🔍' })
  if (submission.status === 'more_info_requested')
    events.push({ time: null, label: 'More Info Requested', color: '#d8b4fe', icon: '📋' })
  if (submission.status === 'approved')
    events.push({ time: null, label: 'KYC Approved ✅', color: '#6ee7b7', icon: '✅' })
  if (submission.status === 'rejected')
    events.push({ time: null, label: 'KYC Rejected', color: '#fca5a5', icon: '❌' })

  return (
    <div className="card">
      <h3 style={{fontSize:'0.72rem',fontWeight:600,color:'var(--c-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'16px'}}>Activity Log</h3>
      <div style={{position:'relative', paddingLeft:'24px'}}>
        <div style={{position:'absolute',left:'7px',top:'8px',bottom:'8px',width:'1px',background:'var(--c-faint)'}} />
        {events.map((e, i) => (
          <div key={i} style={{display:'flex',alignItems:'flex-start',gap:'10px',marginBottom:i < events.length-1?'16px':0,position:'relative'}}>
            <div style={{position:'absolute',left:'-21px',top:'2px',width:'10px',height:'10px',borderRadius:'50%',background:e.color,boxShadow:`0 0 6px ${e.color}`,flexShrink:0}} />
            <div>
              <p style={{fontWeight:500,color:'var(--c-text)',fontSize:'0.875rem',margin:'0 0 2px'}}>{e.icon} {e.label}</p>
              {e.time && <p style={{fontSize:'0.72rem',color:'var(--c-dim)',margin:0}}>{new Date(e.time).toLocaleString('en-IN')}</p>}
              {!e.time && <p style={{fontSize:'0.72rem',color:'var(--c-dim)',margin:0}}>Timestamp not available</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ReviewerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [submission, setSubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [transitioning, setTransitioning] = useState(false)
  const [note, setNote] = useState('')
  const [previewDoc, setPreviewDoc] = useState(null)

  useEffect(() => {
    api.get(`/reviewer/submissions/${id}/`)
      .then(res => { setSubmission(res.data); setLoading(false) })
      .catch(() => navigate('/reviewer'))
  }, [id])

  const handleTransition = async (newState) => {
    setTransitioning(true)
    try {
      const res = await api.post(`/reviewer/submissions/${id}/transition/`, { new_state: newState, note })
      setSubmission(res.data)
      setNote('')
      showToast(`Status updated to "${newState.replace(/_/g,' ')}"`, newState === 'approved' ? 'success' : newState === 'rejected' ? 'error' : 'info')
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Transition failed', 'error')
    } finally {
      setTransitioning(false)
    }
  }

  if (loading) return (
    <div className="page-bg flex items-center justify-center">
      <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      <div className="page-content" style={{color:'rgba(255,255,255,0.4)'}}>Loading...</div>
    </div>
  )

  const actions = TRANSITION_OPTIONS[submission.status] || []
  const docs = submission.documents || []
  const secH = {fontSize:'0.72rem',fontWeight:600,color:'var(--c-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'14px'}

  return (
    <div className="page-bg">
      {previewDoc && <DocPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}
      <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      <div className="page-content">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-10">
          {/* Back */}
          <button onClick={() => navigate('/reviewer')} style={{background:'none',border:'none',cursor:'pointer',color:'var(--c-muted)',fontSize:'0.875rem',marginBottom:'24px',display:'flex',alignItems:'center',gap:'4px',fontFamily:'Inter,sans-serif'}}>
            ← Back to Queue
          </button>

          {/* Header */}
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'24px'}}>
            <div>
              <h1 style={{fontSize:'1.5rem',fontWeight:700,color:'var(--c-text)',margin:'0 0 4px'}}>{submission.full_name || submission.merchant_username}</h1>
              <p style={{fontSize:'0.875rem',color:'var(--c-muted)',margin:0}}>{submission.merchant_username} · {submission.merchant_email}</p>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <StatusBadge status={submission.status} />
              {submission.is_at_risk && (
                <span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',borderRadius:'20px',fontSize:'0.72rem',fontWeight:600,background:'rgba(239,68,68,0.15)',color:'#fca5a5',border:'1px solid rgba(239,68,68,0.3)'}}>🔴 AT RISK</span>
              )}
            </div>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>

            {/* Personal */}
            <div className="card">
              <h3 style={secH}>Personal Details</h3>
              <dl style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',fontSize:'0.875rem'}}>
                <div><dt style={{color:'var(--c-muted)',marginBottom:'3px'}}>Full Name</dt><dd style={{color:'var(--c-text)',fontWeight:500,margin:0}}>{submission.full_name || '—'}</dd></div>
                <div><dt style={{color:'var(--c-muted)',marginBottom:'3px'}}>Email</dt><dd style={{color:'var(--c-text)',fontWeight:500,margin:0}}>{submission.email || '—'}</dd></div>
                <div><dt style={{color:'var(--c-muted)',marginBottom:'3px'}}>Phone</dt><dd style={{color:'var(--c-text)',fontWeight:500,margin:0}}>{submission.phone || '—'}</dd></div>
                <div><dt style={{color:'var(--c-muted)',marginBottom:'3px'}}>Submitted</dt>
                  <dd style={{color:'var(--c-text)',fontWeight:500,margin:0}}>
                    {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString('en-IN') : '—'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Business */}
            <div className="card">
              <h3 style={secH}>Business Details</h3>
              <dl style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',fontSize:'0.875rem'}}>
                <div><dt style={{color:'var(--c-muted)',marginBottom:'3px'}}>Business Name</dt><dd style={{color:'var(--c-text)',fontWeight:500,margin:0}}>{submission.business_name || '—'}</dd></div>
                <div><dt style={{color:'var(--c-muted)',marginBottom:'3px'}}>Type</dt><dd style={{color:'var(--c-text)',fontWeight:500,margin:0}}>{submission.business_type || '—'}</dd></div>
                <div><dt style={{color:'var(--c-muted)',marginBottom:'3px'}}>Monthly Volume</dt>
                  <dd style={{color:'var(--c-text)',fontWeight:500,margin:0}}>
                    {submission.monthly_volume_usd ? `$${Number(submission.monthly_volume_usd).toLocaleString()}` : '—'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Documents — with Preview */}
            <div className="card">
              <h3 style={secH}>Documents & Face ID</h3>
              {docs.length === 0 ? (
                <p style={{color:'var(--c-muted)',fontSize:'0.875rem'}}>No documents uploaded</p>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
                  {/* Selfie Spotlight */}
                  {docs.find(d => d.doc_type === 'selfie') && (() => {
                    const doc = docs.find(d => d.doc_type === 'selfie')
                    return (
                      <div style={{display:'flex',alignItems:'center',gap:'16px',padding:'16px',background:'rgba(16,185,129,0.06)',border:'1px solid rgba(16,185,129,0.2)',borderRadius:'12px'}}>
                        <img src={doc.file_url} alt="Selfie" style={{width:'80px',height:'80px',objectFit:'cover',borderRadius:'50%',border:'3px solid #6ee7b7',boxShadow:'0 0 12px rgba(16,185,129,0.3)'}} />
                        <div style={{flex:1}}>
                          <p style={{fontWeight:700,fontSize:'0.95rem',color:'#6ee7b7',margin:'0 0 4px'}}>Face ID Capture</p>
                          <p style={{fontSize:'0.8rem',color:'var(--c-muted)',margin:0}}>Used for verifying identity against ID documents.</p>
                        </div>
                        <div style={{display:'flex',gap:'8px'}}>
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            style={{background:'rgba(16,185,129,0.15)',border:'1px solid rgba(16,185,129,0.3)',color:'#6ee7b7',
                              borderRadius:'8px',padding:'6px 14px',fontSize:'0.85rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                            👁 Inspect Face
                          </button>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Other Documents */}
                  <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                    {docs.filter(d => d.doc_type !== 'selfie').map(doc => (
                      <div key={doc.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'10px'}}>
                        <div>
                          <p style={{fontWeight:600,fontSize:'0.875rem',color:'var(--c-text)',margin:'0 0 2px'}}>{doc.doc_type.replace('_',' ').toUpperCase()}</p>
                          <p style={{fontSize:'0.75rem',color:'var(--c-muted)',margin:0}}>{doc.original_filename} · {(doc.file_size/1024).toFixed(0)} KB</p>
                        </div>
                        <div style={{display:'flex',gap:'8px'}}>
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            style={{background:'rgba(59,130,246,0.12)',border:'1px solid rgba(59,130,246,0.25)',color:'#93c5fd',
                              borderRadius:'8px',padding:'5px 12px',fontSize:'0.8rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                            👁 Preview
                          </button>
                          <a href={doc.file_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                            style={{display:'inline-flex',alignItems:'center',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',
                              color:'rgba(255,255,255,0.65)',borderRadius:'8px',padding:'5px 12px',fontSize:'0.8rem',fontWeight:600,textDecoration:'none'}}>
                            ↗ Open
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Activity Log */}
            <AuditLog submission={submission} />

            {/* Reviewer note */}
            {submission.reviewer_note && (
              <div className="card" style={{borderLeft:'3px solid rgba(168,85,247,0.6)'}}>
                <p style={{fontSize:'0.875rem',fontWeight:600,color:'#d8b4fe',marginBottom:'6px'}}>Previous Reviewer Note</p>
                <p style={{fontSize:'0.875rem',color:'var(--c-sub)',margin:0}}>{submission.reviewer_note}</p>
              </div>
            )}

            {/* Actions */}
            {actions.length > 0 && (
              <div className="card">
                <h3 style={secH}>Actions</h3>
                {actions.some(a => a.needsNote) && (
                  <div style={{marginBottom:'16px'}}>
                    <label className="label">Note to merchant (required for reject / more info)</label>
                    <textarea className="input resize-none" rows={3} value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="Explain what needs to be corrected or why it was rejected..." />
                  </div>
                )}
                <div style={{display:'flex',flexWrap:'wrap',gap:'12px'}}>
                  {actions.map(action => (
                    <button key={action.state} className={action.style}
                      onClick={() => handleTransition(action.state)} disabled={transitioning}>
                      {transitioning ? 'Processing...' : action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Terminal state */}
            {['approved','rejected'].includes(submission.status) && (
              <div className="card" style={{borderLeft:`3px solid ${submission.status==='approved'?'rgba(16,185,129,0.6)':'rgba(239,68,68,0.6)'}`}}>
                <p style={{fontWeight:600,color:submission.status==='approved'?'#6ee7b7':'#fca5a5',margin:'0 0 6px'}}>
                  {submission.status==='approved' ? '✅ This submission has been approved.' : '❌ This submission has been rejected.'}
                </p>
                {submission.reviewer_note && (
                  <p style={{fontSize:'0.875rem',color:'var(--c-sub)',margin:0}}>Note: {submission.reviewer_note}</p>
                )}
              </div>
            )}

            {/* Waiting on merchant */}
            {submission.status === 'more_info_requested' && (
              <div className="card" style={{borderLeft:'3px solid rgba(168,85,247,0.6)'}}>
                <p style={{fontWeight:600,color:'#d8b4fe',margin:'0 0 6px'}}>⏳ Awaiting merchant response</p>
                <p style={{fontSize:'0.875rem',color:'var(--c-sub)',margin:0}}>
                  Additional information has been requested. The merchant must update and resubmit
                  their form before you can take further action.
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
