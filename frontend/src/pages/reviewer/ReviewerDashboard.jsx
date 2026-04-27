import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import Navbar from '../../components/Navbar.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { showToast } from '../../components/Toast.jsx'

const metricColors = { blue:'#60a5fa', amber:'#fcd34d', emerald:'#6ee7b7', red:'#fca5a5' }

function MetricCard({ label, value, sub, color = 'blue', icon }) {
  return (
    <div className="card" style={{position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:12,right:14,fontSize:'1.4rem',opacity:0.15}}>{icon}</div>
      <p style={{fontSize:'0.72rem',color:'var(--c-muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px',margin:'0 0 6px'}}>{label}</p>
      <p style={{fontSize:'1.75rem',fontWeight:700,color:metricColors[color],margin:'0 0 4px'}}>{value}</p>
      {sub && <p style={{fontSize:'0.75rem',color:'var(--c-dim)',margin:0}}>{sub}</p>}
    </div>
  )
}

export default function ReviewerDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterRisk, setFilterRisk] = useState('all')

  const load = async (isManual = false) => {
    try {
      const res = await api.get('/reviewer/queue/')
      setData(res.data)
      if (isManual) showToast('Dashboard refreshed', 'success')
    } catch (err) {
      showToast('Failed to load dashboard', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(false) }, [])

  // ── Search + filter ──────────────────────────────────
  const filtered = useMemo(() => {
    if (!data) return []
    return data.submissions.filter(s => {
      const q = search.toLowerCase()
      const matchSearch = !q ||
        (s.full_name || s.merchant_username || '').toLowerCase().includes(q) ||
        (s.merchant_email || '').toLowerCase().includes(q) ||
        (s.business_name || '').toLowerCase().includes(q)
      const matchStatus = filterStatus === 'all' || s.status === filterStatus
      const matchRisk = filterRisk === 'all' ||
        (filterRisk === 'risk' && s.is_at_risk) ||
        (filterRisk === 'ok' && !s.is_at_risk)
      return matchSearch && matchStatus && matchRisk
    })
  }, [data, search, filterStatus, filterRisk])

  // ── Export CSV ───────────────────────────────────────
  const exportCSV = () => {
    const rows = [
      ['Name','Username','Email','Business','Type','Volume','Status','Submitted','At Risk'],
      ...filtered.map(s => [
        s.full_name || '', s.merchant_username || '', s.merchant_email || '',
        s.business_name || '', s.business_type || '',
        s.monthly_volume_usd || '',
        s.status, s.submitted_at ? new Date(s.submitted_at).toLocaleString('en-IN') : '',
        s.is_at_risk ? 'YES' : 'NO'
      ])
    ]
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `kyc-queue-${Date.now()}.csv`
    a.click(); URL.revokeObjectURL(url)
    showToast(`Exported ${filtered.length} rows to CSV`, 'success')
  }

  if (loading) return (
    <div className="page-bg flex items-center justify-center">
      <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      <div className="page-content" style={{color:'rgba(255,255,255,0.4)'}}>Loading dashboard...</div>
    </div>
  )

  const { metrics } = data

  const inputStyle = {
    background:'var(--c-input)', border:'1px solid var(--c-border)',
    borderRadius:'10px', padding:'8px 14px', color:'var(--c-text)', fontSize:'0.875rem',
    fontFamily:'Inter,sans-serif', outline:'none',
  }
  const selectStyle = { ...inputStyle, paddingRight:'32px', cursor:'pointer' }

  return (
    <div className="page-bg">
      <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      <div className="page-content">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-10">

          {/* Header */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'24px'}}>
            <div>
              <h1 style={{fontSize:'1.5rem',fontWeight:700,color:'var(--c-text)',margin:'0 0 4px'}}>Reviewer Dashboard</h1>
              <p style={{fontSize:'0.875rem',color:'var(--c-muted)',margin:0}}>KYC submission queue • {filtered.length} of {data.submissions.length} shown</p>
            </div>
            <div style={{display:'flex',gap:'10px'}}>
              <button onClick={exportCSV} style={{...inputStyle,cursor:'pointer',color:'#6ee7b7',border:'1px solid rgba(16,185,129,0.3)',background:'rgba(16,185,129,0.08)'}}>
                ⬇ Export CSV
              </button>
              <button onClick={load} style={{...inputStyle,cursor:'pointer'}}>↻ Refresh</button>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <MetricCard icon="📥" label="In Queue"          value={metrics.in_queue}                         sub="Active submissions"  color="blue" />
            <MetricCard icon="⏱" label="Avg Time"          value={`${metrics.avg_time_in_queue_hours}h`}    sub="Currently in queue"  color="amber" />
            <MetricCard icon="✅" label="Approval Rate (7d)" value={`${metrics.approval_rate_7d}%`}          sub="Last 7 days"          color="emerald" />
            <MetricCard icon="🔴" label="At Risk"           value={metrics.at_risk_count}                   sub=">24h in queue"        color="red" />
          </div>

          {/* Search + Filters */}
          <div style={{display:'flex',gap:'10px',marginBottom:'16px',flexWrap:'wrap'}}>
            <input
              style={{...inputStyle, flex:1, minWidth:'200px'}}
              placeholder="🔍  Search by name, email or business..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select style={selectStyle} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="more_info_requested">More Info Needed</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select style={selectStyle} value={filterRisk} onChange={e => setFilterRisk(e.target.value)}>
              <option value="all">All SLA</option>
              <option value="risk">🔴 At Risk</option>
              <option value="ok">✓ OK</option>
            </select>
            {(search || filterStatus !== 'all' || filterRisk !== 'all') && (
              <button onClick={() => { setSearch(''); setFilterStatus('all'); setFilterRisk('all') }}
                style={{...inputStyle, cursor:'pointer', color:'rgba(255,255,255,0.5)'}}>
                ✕ Clear
              </button>
            )}
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="card" style={{textAlign:'center',padding:'48px 24px'}}>
              <p style={{fontSize:'2.5rem',marginBottom:'12px'}}>🔍</p>
              <p style={{fontWeight:600,color:'rgba(255,255,255,0.7)'}}>No submissions found</p>
              <p style={{fontSize:'0.875rem',color:'rgba(255,255,255,0.35)',marginTop:'4px'}}>Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{background:'rgba(255,255,255,0.04)',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
                    {['Merchant','Business','Status','Submitted','SLA','Action'].map((h,i) => (
                      <th key={i} style={{textAlign:'left',padding:'12px 20px',fontSize:'0.7rem',fontWeight:600,color:'var(--c-muted)',textTransform:'uppercase',letterSpacing:'0.5px'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((sub, i) => (
                    <tr key={sub.id}
                      style={{borderBottom:'1px solid rgba(255,255,255,0.05)',cursor:'pointer',transition:'background 0.15s',
                        background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}}
                      onMouseEnter={e => e.currentTarget.style.background='rgba(59,130,246,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background= i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}
                      onClick={() => navigate(`/reviewer/submissions/${sub.id}`)}
                    >
                      <td style={{padding:'12px 20px'}}>
                        <p style={{fontWeight:600,color:'var(--c-text)',margin:'0 0 2px'}}>{sub.full_name || sub.merchant_username}</p>
                        <p style={{fontSize:'0.75rem',color:'var(--c-muted)',margin:0}}>{sub.merchant_email}</p>
                      </td>
                      <td style={{padding:'12px 20px'}}>
                        <p style={{color:'var(--c-sub)',margin:'0 0 2px'}}>{sub.business_name || '—'}</p>
                        {sub.monthly_volume_usd && (
                          <p style={{fontSize:'0.75rem',color:'var(--c-muted)',margin:0}}>${Number(sub.monthly_volume_usd).toLocaleString()}/mo</p>
                        )}
                      </td>
                      <td style={{padding:'12px 20px'}}><StatusBadge status={sub.status} /></td>
                      <td style={{padding:'12px 20px',color:'var(--c-muted)',fontSize:'0.85rem'}}>
                        {sub.submitted_at
                          ? new Date(sub.submitted_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })
                          : '—'}
                      </td>
                      <td style={{padding:'12px 20px'}}>
                        {sub.is_at_risk
                          ? <span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',borderRadius:'20px',fontSize:'0.72rem',fontWeight:600,background:'rgba(239,68,68,0.15)',color:'#fca5a5',border:'1px solid rgba(239,68,68,0.3)'}}>🔴 AT RISK</span>
                          : <span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',borderRadius:'20px',fontSize:'0.72rem',fontWeight:600,background:'rgba(16,185,129,0.15)',color:'#6ee7b7',border:'1px solid rgba(16,185,129,0.3)'}}>✓ OK</span>
                        }
                      </td>
                      <td style={{padding:'12px 20px',textAlign:'right'}}>
                        <button style={{background:'none',border:'none',cursor:'pointer',color:'#818cf8',fontSize:'0.8rem',fontWeight:600,fontFamily:'Inter,sans-serif'}}>Review →</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
