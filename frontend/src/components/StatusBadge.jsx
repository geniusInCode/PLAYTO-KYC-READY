const STATUS_CONFIG = {
  draft:               { label: 'Draft',            color: 'rgba(255,255,255,0.08)',  text: 'rgba(255,255,255,0.5)',  border: 'rgba(255,255,255,0.12)' },
  submitted:           { label: 'Submitted',        color: 'rgba(59,130,246,0.15)',   text: '#93c5fd',                border: 'rgba(59,130,246,0.3)'  },
  under_review:        { label: 'Under Review',     color: 'rgba(245,158,11,0.15)',   text: '#fcd34d',                border: 'rgba(245,158,11,0.3)'  },
  approved:            { label: 'Approved',         color: 'rgba(16,185,129,0.15)',   text: '#6ee7b7',                border: 'rgba(16,185,129,0.3)'  },
  rejected:            { label: 'Rejected',         color: 'rgba(239,68,68,0.15)',    text: '#fca5a5',                border: 'rgba(239,68,68,0.3)'   },
  more_info_requested: { label: 'More Info Needed', color: 'rgba(168,85,247,0.15)',   text: '#d8b4fe',                border: 'rgba(168,85,247,0.3)'  },
}

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.5)', border: 'rgba(255,255,255,0.12)' }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '0.72rem',
      fontWeight: 600,
      background: cfg.color,
      color: cfg.text,
      border: `1px solid ${cfg.border}`,
      letterSpacing: '0.2px',
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}
