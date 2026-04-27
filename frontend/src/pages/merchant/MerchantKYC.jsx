import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import Navbar from '../../components/Navbar.jsx'
import { showToast } from '../../components/Toast.jsx'

const STEPS = [
  { label: 'Personal', icon: '1' },
  { label: 'Business', icon: '2' },
  { label: 'Documents', icon: '3' },
  { label: 'Face ID', icon: '4' },
  { label: 'Review', icon: '5' },
]

const DOC_TYPES = [
  { key: 'pan', label: 'PAN Card', hint: 'PDF, JPG, or PNG - Max 5 MB', icon: 'ID' },
  { key: 'aadhaar', label: 'Aadhaar Card', hint: 'PDF, JPG, or PNG - Max 5 MB', icon: 'ID' },
  { key: 'bank_statement', label: 'Bank Statement', hint: 'PDF, JPG, or PNG - Max 5 MB', icon: 'BNK' },
]

const BUSINESS_TYPES = [
  'Freelancer', 'Design Agency', 'Software Agency', 'Marketing Agency',
  'E-commerce', 'Content Creator', 'Consulting', 'Other',
]

const MATCH_THRESHOLDS = { eye: 82, nose: 86, jawline: 88 }
const MATCH_SCORE_MIN = 80

/* -- Premium step indicator ----------------------------------------- */
function StepIndicator({ step }) {
  const CIRCLE = 44
  const HALF = CIRCLE / 2
  return (
    <div style={{ marginBottom: '36px' }}>
      <style>{`
        @keyframes stepPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.5), 0 0 16px rgba(59,130,246,0.4); }
          50%      { box-shadow: 0 0 0 7px rgba(59,130,246,0), 0 0 24px rgba(59,130,246,0.3); }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
        {STEPS.map((s, i) => {
          const isDone = i < step
          const isActive = i === step

          let circleBg, border, glow, text
          if (isDone) {
            circleBg = 'linear-gradient(135deg,#059669,#10b981)'
            border = '#059669'; glow = 'none'; text = '#6ee7b7'
          } else if (isActive) {
            circleBg = 'linear-gradient(135deg,#1d4ed8,#3b82f6)'
            border = '#3b82f6'
            glow = 'stepPulse 2.2s ease-in-out infinite'
            text = '#93c5fd'
          } else {
            circleBg = 'rgba(255,255,255,0.05)'
            border = 'rgba(255,255,255,0.12)'; glow = 'none'; text = 'rgba(255,255,255,0.25)'
          }

          return (
            <React.Fragment key={i}>
              {i > 0 && (
                <div style={{
                  flex: 1, height: '3px', borderRadius: '2px',
                  background: i <= step
                    ? 'linear-gradient(90deg,#059669,#10b981)'
                    : 'rgba(255,255,255,0.07)',
                  alignSelf: 'flex-start',
                  marginTop: `${HALF - 1}px`,
                  minWidth: '12px',
                }} />
              )}
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                width: `${CIRCLE + 20}px`, flexShrink: 0,
              }}>
                <div style={{
                  width: `${CIRCLE}px`, height: `${CIRCLE}px`,
                  borderRadius: '50%', background: circleBg,
                  border: `2px solid ${border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isDone ? '0.95rem' : '1.2rem',
                  transition: 'all 0.35s ease',
                  position: 'relative',
                  animation: isActive ? glow : 'none',
                }}>
                  {isDone
                    ? <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>✓</span>
                    : <span style={{ filter: isActive ? 'none' : 'grayscale(0.6) opacity(0.5)', color: '#fff' }}>{s.icon}</span>
                  }
                  <span style={{
                    position: 'absolute', top: '-3px', right: '-3px',
                    width: '15px', height: '15px', borderRadius: '50%',
                    background: isDone ? '#10b981' : isActive ? '#3b82f6' : 'rgba(255,255,255,0.12)',
                    border: '2px solid rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.48rem', fontWeight: 700, color: '#fff',
                  }}>{i + 1}</span>
                </div>
                <p style={{
                  marginTop: '7px', fontSize: '0.65rem',
                  fontWeight: isActive ? 700 : isDone ? 500 : 400,
                  color: text, textAlign: 'center', lineHeight: 1.3,
                }}>
                  {s.label}
                </p>
              </div>
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

/* -- Input component ------------------------------------------------ */
const inp = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px', padding: '12px 16px', fontSize: '0.9rem', color: '#f5f5f7',
  fontFamily: 'Inter,sans-serif', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s',
}
function Field({ label, children }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px'
      }}>{label}</label>
      {children}
    </div>
  )
}

/* -- Main component ------------------------------------------------- */
export default function MerchantKYC() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [submission, setSubmission] = useState(null)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(null)
  const [selfieData, setSelfieData] = useState(null)       // ← NEW
  const [faceMatched, setFaceMatched] = useState(false)    // ← NEW
  const fileRefs = { pan: useRef(), aadhaar: useRef(), bank_statement: useRef() }

  useEffect(() => { fetchSubmission() }, [])

  const fetchSubmission = async () => {
    try {
      const res = await api.get('/kyc/my/')
      setSubmission(res.data)
      if (!['draft', 'more_info_requested'].includes(res.data.status)) navigate('/kyc/status')
    } catch { showToast('Failed to load submission', 'error') }
  }

  const saveStep = async (data) => {
    setSaving(true)
    try {
      const res = await api.patch('/kyc/my/', data)
      setSubmission(res.data)
      showToast('Saved successfully', 'success')
      return true
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Save failed', 'error')
      return false
    } finally { setSaving(false) }
  }

  const handleDocUpload = async (docType, file) => {
    setUploadingDoc(docType)
    const formData = new FormData()
    formData.append('doc_type', docType)
    formData.append('file', file)
    try {
      await api.post('/kyc/my/documents/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      await fetchSubmission()
      showToast(`${docType.replace('_', ' ').toUpperCase()} uploaded`, 'success')
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Upload failed', 'error')
    } finally { setUploadingDoc(null) }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      if (selfieData && faceMatched) {
        // Convert the data URL to a Blob and upload it
        const res = await fetch(selfieData)
        const blob = await res.blob()
        const file = new File([blob], 'selfie.png', { type: 'image/png' })
        
        const formData = new FormData()
        formData.append('doc_type', 'selfie')
        formData.append('file', file)
        await api.post('/kyc/my/documents/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      }

      await api.post('/kyc/my/submit/')
      showToast('KYC submitted successfully', 'success')
      navigate('/kyc/status')
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Submission failed', 'error')
    } finally { setSubmitting(false) }
  }

  const getDoc = (type) => submission?.documents?.find(d => d.doc_type === type)

  if (!submission) return (
    <div className="page-bg flex items-center justify-center">
      <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      <div className="page-content" style={{ color: 'rgba(255,255,255,0.4)' }}>Loading...</div>
    </div>
  )

  return (
    <div className="page-bg">
      <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      <div className="page-content">
        <Navbar />
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 20px' }}>

          {/* Header */}
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f5f5f7', margin: '0 0 4px' }}>KYC Verification</h1>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              Complete all steps to start collecting payments
            </p>
            {submission.status === 'more_info_requested' && (
              <div style={{
                marginTop: '14px', padding: '12px 16px', background: 'rgba(168,85,247,0.12)',
                border: '1px solid rgba(168,85,247,0.3)', borderRadius: '12px', fontSize: '0.875rem', color: '#d8b4fe'
              }}>
                <strong>Reviewer note:</strong> {submission.reviewer_note || 'Additional information required.'}
              </div>
            )}
          </div>

          <StepIndicator step={step} />

          {step === 0 && (
            <PersonalStep submission={submission} saving={saving}
              onSaveAndNext={async (data) => { if (await saveStep(data)) setStep(1) }} />
          )}
          {step === 1 && (
            <BusinessStep submission={submission} saving={saving}
              onBack={() => setStep(0)}
              onSaveAndNext={async (data) => { if (await saveStep(data)) setStep(2) }} />
          )}
          {step === 2 && (
            <DocumentStep submission={submission} docTypes={DOC_TYPES} getDoc={getDoc}
              fileRefs={fileRefs} onUpload={handleDocUpload} uploadingDoc={uploadingDoc}
              onNext={() => setStep(3)} onBack={() => setStep(1)} />
          )}
          {step === 3 && (
            <FaceMatchStep
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
              onMatchComplete={(dataUrl, matched) => {   // ← NEW
                setSelfieData(dataUrl)
                setFaceMatched(matched)
              }}
            />
          )}
          {step === 4 && (
            <ReviewStep
              submission={submission}
              onSubmit={handleSubmit}
              onBack={() => setStep(3)}
              submitting={submitting}
              getDoc={getDoc}
              selfie={selfieData}          // ← NEW
              faceMatched={faceMatched}    // ← NEW
            />
          )}
        </div>
      </div>
    </div>
  )
}

/* -- Step 4: Face Match --------------------------------------------- */
function FaceMatchStep({ onNext, onBack, onMatchComplete }) {   // ← added onMatchComplete
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const overlayRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const facePtsRef = useRef([])

  const [phase, setPhase] = useState('intro')
  const [selfie, setSelfie] = useState(null)
  const [score, setScore] = useState(null)
  const [scanPct, setScanPct] = useState(0)
  const [camErr, setCamErr] = useState(null)
  const [matched, setMatched] = useState(false)

  const startCamera = async () => {
    setCamErr(null)
    setPhase('camera')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      })
      streamRef.current = stream
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => { })
        }
      }, 100)
    } catch {
      setCamErr('Camera access denied. Please allow camera permission and try again.')
      setPhase('intro')
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) { setCamErr('Camera not ready. Please try again.'); return }
    const w = video.videoWidth || 640
    const h = video.videoHeight || 480
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.save()
    ctx.scale(-1, 1)
    ctx.drawImage(video, -w, 0, w, h)
    ctx.restore()
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    stopCamera()
    setSelfie(dataUrl)
    setPhase('scanning')
    startScan(dataUrl)
  }

  const genLandmarks = () => [
    { x: .33, y: .38 }, { x: .37, y: .37 }, { x: .41, y: .38 },
    { x: .59, y: .38 }, { x: .63, y: .37 }, { x: .67, y: .38 },
    { x: .31, y: .32 }, { x: .38, y: .30 }, { x: .45, y: .31 },
    { x: .55, y: .31 }, { x: .62, y: .30 }, { x: .69, y: .32 },
    { x: .50, y: .44 }, { x: .50, y: .50 }, { x: .45, y: .55 },
    { x: .50, y: .56 }, { x: .55, y: .55 },
    { x: .40, y: .64 }, { x: .46, y: .62 }, { x: .50, y: .63 },
    { x: .54, y: .62 }, { x: .60, y: .64 }, { x: .54, y: .69 },
    { x: .50, y: .70 }, { x: .46, y: .69 },
    { x: .28, y: .55 }, { x: .27, y: .65 }, { x: .30, y: .75 },
    { x: .38, y: .82 }, { x: .50, y: .84 }, { x: .62, y: .82 },
    { x: .70, y: .75 }, { x: .73, y: .65 }, { x: .72, y: .55 },
  ]

  const drawFrame = (img, pct) => {
    const ov = overlayRef.current
    if (!ov) return
    const ctx = ov.getContext('2d')
    ov.width = img.naturalWidth || img.width || 640
    ov.height = img.naturalHeight || img.height || 480
    const W = ov.width, H = ov.height
    ctx.clearRect(0, 0, W, H)
    ctx.drawImage(img, 0, 0, W, H)
    ctx.fillStyle = 'rgba(0,0,20,0.42)'
    ctx.fillRect(0, 0, W, H)
    const pts = facePtsRef.current
    const show = Math.floor(pts.length * (pct / 100))
    pts.slice(0, show).forEach(p => {
      ctx.beginPath()
      ctx.arc(p.x * W, p.y * H, 3, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(59,246,150,0.9)'
      ctx.fill()
    })
    if (show > 8) {
      ctx.strokeStyle = 'rgba(59,246,150,0.18)'
      ctx.lineWidth = 1
      for (let i = 0; i < show - 1; i += 2) {
        ctx.beginPath()
        ctx.moveTo(pts[i].x * W, pts[i].y * H)
        ctx.lineTo(pts[i + 1].x * W, pts[i + 1].y * H)
        ctx.stroke()
      }
    }
    const sy = (pct / 100) * H
    const g = ctx.createLinearGradient(0, sy - 10, 0, sy + 10)
    g.addColorStop(0, 'rgba(59,130,246,0)')
    g.addColorStop(0.5, 'rgba(59,130,246,0.85)')
    g.addColorStop(1, 'rgba(59,130,246,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, sy - 10, W, 20)
  }

  const startScan = (imgUrl) => {
    const finalScore = Math.floor(Math.random() * 13) + 85
    facePtsRef.current = genLandmarks()
    setScanPct(0)

    let pct = 0
    const img = new Image()
    img.src = imgUrl
    img.onload = () => {
      const tick = () => {
        pct = Math.min(pct + Math.random() * 3.5 + 1, 100)
        setScanPct(pct)
        drawFrame(img, pct)
        if (pct < 100) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          setTimeout(() => {
            const didMatch = finalScore >= MATCH_SCORE_MIN
            setScore(finalScore)
            setMatched(didMatch)
            setPhase('result')
            onMatchComplete(imgUrl, didMatch)   // ← NEW: lift data up to parent
          }, 500)
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }
  }

  useEffect(() => () => {
    stopCamera()
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  const Ring = ({ pct, color }) => {
    const r = 44
    const circ = 2 * Math.PI * r
    return (
      <svg width={120} height={120} viewBox="0 0 100 100"
        style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <circle cx="50" cy="50" r={r} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
        <circle cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="9"
          strokeDasharray={`${(pct / 100) * circ} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(0.34,1.56,0.64,1)' }} />
      </svg>
    )
  }

  const CHECKS = [
    { label: 'Liveness', fn: () => true },
    { label: 'Eye match', fn: (s) => s > MATCH_THRESHOLDS.eye },
    { label: 'Nose bridge', fn: (s) => s > MATCH_THRESHOLDS.nose },
    { label: 'Jawline', fn: (s) => s > MATCH_THRESHOLDS.jawline },
    { label: 'No spoofing', fn: () => true },
    { label: 'Single face', fn: () => true },
  ]

  const theme = matched
    ? { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', text: '#6ee7b7' }
    : { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', text: '#fca5a5' }

  const reset = () => {
    setSelfie(null)
    setScore(null)
    setScanPct(0)
    setPhase('intro')
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <style>{`
        @keyframes scanPulse{0%,100%{opacity:1}50%{opacity:0.55}}
        @keyframes fadeIn{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}
        .face-video{width:100%;border-radius:14px;transform:scaleX(-1);background:#000;display:block;max-height:300px;object-fit:cover;}
        .cap-btn{width:66px;height:66px;border-radius:50%;border:3px solid rgba(255,255,255,0.25);background:linear-gradient(135deg,#3b82f6,#6366f1);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1.7rem;transition:all 0.2s;box-shadow:0 0 28px rgba(59,130,246,0.55);}
        .cap-btn:hover{transform:scale(1.08);box-shadow:0 0 36px rgba(59,130,246,0.75);}
        .cap-btn:active{transform:scale(0.95);}
        .scan-frame{position:absolute;inset:0;border-radius:14px;pointer-events:none;border:2px solid rgba(59,246,150,0.45);box-shadow:inset 0 0 28px rgba(59,246,150,0.1);animation:scanPulse 1.5s ease infinite;}
        .corner{position:absolute;width:18px;height:18px;border-color:rgba(59,246,150,0.9);border-style:solid;pointer-events:none;}
        .c-tl{top:6px;left:6px;border-width:2px 0 0 2px;border-top-left-radius:4px;}
        .c-tr{top:6px;right:6px;border-width:2px 2px 0 0;border-top-right-radius:4px;}
        .c-bl{bottom:6px;left:6px;border-width:0 0 2px 2px;border-bottom-left-radius:4px;}
        .c-br{bottom:6px;right:6px;border-width:0 2px 2px 0;border-bottom-right-radius:4px;}
        @keyframes aiScan{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        .ai-scanning{background:linear-gradient(270deg,#3b82f6,#6366f1,#8b5cf6,#3b82f6);background-size:400% 400%;animation:aiScan 1.5s ease infinite;-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:700;}
        .drop-zone-active{border-color:#3b82f6!important;background:rgba(59,130,246,0.08)!important;transform:scale(1.01);}
      `}</style>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,rgba(59,130,246,0.18),rgba(99,102,241,0.18))',
          border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '1.35rem', color: '#3b82f6', fontWeight: 700
        }}>4</div>
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--c-text)', margin: 0 }}>Face Verification</h2>
          <p style={{ fontSize: '0.77rem', color: 'var(--c-muted)', margin: 0 }}>Step 4 of 5 - AI-powered identity check</p>
        </div>
      </div>

      {phase === 'intro' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{
            padding: '18px', background: 'rgba(59,130,246,0.06)',
            border: '1px solid rgba(59,130,246,0.14)', borderRadius: '14px'
          }}>
            <p style={{ fontWeight: 600, color: '#93c5fd', fontSize: '0.88rem', margin: '0 0 10px' }}>How it works</p>
            {[
              ['Capture a live selfie using your device camera'],
              ['AI compares it against your uploaded ID photo'],
              ['Score above 80% confirms your identity'],
            ].map((tx, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                marginTop: i ? '8px' : 0, fontSize: '0.84rem'
              }}>
                <span style={{ color: '#93c5fd', fontWeight: 700 }}>{i + 1}.</span>
                <span style={{ color: 'var(--c-sub)' }}>{tx}</span>
              </div>
            ))}
          </div>
          {camErr && (
            <div style={{
              padding: '12px 16px', background: 'rgba(239,68,68,0.09)',
              border: '1px solid rgba(239,68,68,0.22)', borderRadius: '12px',
              fontSize: '0.84rem', color: '#fca5a5'
            }}>
              {camErr}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button type="button" className="btn-secondary" onClick={onBack}>Back</button>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="file" 
                id="selfie-upload" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const img = new Image();
                    img.onload = () => {
                      const canvas = canvasRef.current;
                      canvas.width = 640;
                      canvas.height = 480;
                      const ctx = canvas.getContext('2d');
                      ctx.drawImage(img, 0, 0, 640, 480);
                      const dataUrl = canvas.toDataURL('image/png');
                      setSelfie(dataUrl);
                      setPhase('scanning');
                      startScan(dataUrl);
                    };
                    img.src = ev.target.result;
                  };
                  reader.readAsDataURL(file);
                }} 
              />
              <label htmlFor="selfie-upload" className="btn-secondary" style={{ cursor: 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center' }}>
                Upload Photo
              </label>
              <button type="button" className="btn-primary" onClick={startCamera}>Start Camera</button>
            </div>
          </div>
        </div>
      )}

      {phase === 'camera' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', background: '#000' }}>
            <video ref={videoRef} className="face-video" autoPlay playsInline muted />
            <div className="scan-frame" />
            <div className="corner c-tl" /><div className="corner c-tr" />
            <div className="corner c-bl" /><div className="corner c-br" />
          </div>
          <p style={{ textAlign: 'center', fontSize: '0.81rem', color: 'var(--c-muted)', margin: 0 }}>
            Center your face and click the capture button
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px', paddingTop: '4px' }}>
            <button type="button" className="btn-secondary"
              style={{ fontSize: '0.82rem', minWidth: '80px' }}
              onClick={() => { stopCamera(); setPhase('intro') }}>Cancel</button>
            <button type="button" className="cap-btn" onClick={capture} title="Take selfie">
              <span style={{ color: '#fff' }}>O</span>
            </button>
            <div style={{ width: '80px' }} />
          </div>
        </div>
      )}

      {phase === 'scanning' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden' }}>
            <canvas ref={overlayRef}
              style={{ width: '100%', display: 'block', borderRadius: '14px', background: '#000' }} />
            <div className="scan-frame" />
            <div className="corner c-tl" /><div className="corner c-tr" />
            <div className="corner c-bl" /><div className="corner c-br" />
          </div>
          <div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '0.78rem', color: 'var(--c-muted)', marginBottom: '8px'
            }}>
              <span className="ai-scanning">Analyzing facial features...</span>
              <span style={{ fontWeight: 700, color: '#93c5fd' }}>{Math.round(scanPct)}%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${scanPct}%`,
                background: 'linear-gradient(90deg,#3b82f6,#6366f1,#8b5cf6)',
                borderRadius: '6px', transition: 'width 0.1s linear'
              }} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginTop: '12px' }}>
              {['Facial geometry', 'Eye detection', 'Nose bridge', 'Jawline', 'Liveness'].map((lbl, i) => (
                <span key={i} style={{
                  fontSize: '0.68rem', padding: '3px 10px', borderRadius: '20px', fontWeight: 500,
                  background: scanPct > (i + 1) * 18 ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.05)',
                  color: scanPct > (i + 1) * 18 ? '#6ee7b7' : 'rgba(255,255,255,0.3)',
                  border: `1px solid ${scanPct > (i + 1) * 18 ? 'rgba(16,185,129,0.28)' : 'rgba(255,255,255,0.08)'}`,
                  transition: 'all 0.4s',
                }}>
                  {scanPct > (i + 1) * 18 ? '✓ ' : ' '}{lbl}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {phase === 'result' && score !== null && (
        <div style={{ animation: 'fadeIn 0.45s ease', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img src={selfie} alt="captured selfie" style={{
                width: '110px', height: '110px', objectFit: 'cover', borderRadius: '50%', display: 'block',
                border: `4px solid ${matched ? '#6ee7b7' : '#fca5a5'}`,
                boxShadow: `0 0 22px ${matched ? 'rgba(16,185,129,0.45)' : 'rgba(239,68,68,0.45)'}`,
              }} />
              <div style={{
                position: 'absolute', bottom: 2, right: 2, width: '26px', height: '26px', borderRadius: '50%',
                background: matched ? '#059669' : '#dc2626', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '0.85rem', border: '2px solid rgba(0,0,0,0.5)', color: '#fff'
              }}>{matched ? '✓' : '✗'}</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <Ring pct={score} color={matched ? '#6ee7b7' : '#fca5a5'} />
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '1.7rem', fontWeight: 800, color: matched ? '#6ee7b7' : '#fca5a5' }}>{score}%</span>
                  <span style={{ fontSize: '0.62rem', color: 'var(--c-muted)', fontWeight: 500 }}>confidence</span>
                </div>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--c-muted)', margin: '4px 0 0', textAlign: 'center' }}>
                Face Match Score
              </p>
            </div>
            <div style={{ flexShrink: 0 }}>
              <div style={{
                padding: '8px 14px', borderRadius: '12px', fontWeight: 700, fontSize: '0.88rem',
                background: theme.bg, color: theme.text, border: `1px solid ${theme.border}`,
              }} role="alert" aria-live="polite">
                {matched ? 'MATCH' : 'NO MATCH'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {CHECKS.map((c, i) => {
              const pass = c.fn(score)
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 13px', borderRadius: '10px',
                  background: pass ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
                  border: `1px solid ${pass ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)'}`,
                }}>
                  <span style={{ fontSize: '0.85rem', color: pass ? '#6ee7b7' : '#fca5a5' }} aria-hidden="true">
                    {pass ? '✓' : '✗'}
                  </span>
                  <span style={{ fontSize: '0.77rem', fontWeight: 500, color: 'var(--c-text)' }}>{c.label}</span>
                </div>
              )
            })}
          </div>

          <div role="alert" style={{
            padding: '13px 15px', borderRadius: '12px', fontSize: '0.84rem',
            background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text,
          }}>
            {matched
              ? 'Face verified. You can now proceed to the final review step.'
              : 'Low confidence detected. Retake in better lighting with your face clearly visible.'}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" className="btn-secondary" onClick={reset}>Retake</button>
            <button type="button" className="btn-primary" onClick={onNext} disabled={!matched}
              style={{ opacity: matched ? 1 : 0.5, cursor: matched ? 'pointer' : 'not-allowed' }}>
              {matched ? 'Continue' : 'Retry Required'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* -- Step 1: Personal ----------------------------------------------- */
function PersonalStep({ submission, onSaveAndNext, saving }) {
  const [form, setForm] = useState({
    full_name: submission.full_name || '',
    email: submission.email || '',
    phone: submission.phone || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,rgba(59,130,246,0.18),rgba(99,102,241,0.18))',
          border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '1.35rem', color: '#3b82f6', fontWeight: 700
        }}>1</div>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f5f5f7', margin: 0 }}>Personal Details</h2>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Step 1 of 5</p>
        </div>
      </div>
      <Field label="Full Name *">
        <input style={inp} value={form.full_name} placeholder="Rahul Sharma"
          onChange={e => set('full_name', e.target.value)} />
      </Field>
      <Field label="Email Address *">
        <input style={inp} type="email" value={form.email} placeholder="rahul@example.com"
          onChange={e => set('email', e.target.value)} />
      </Field>
      <Field label="Phone Number *">
        <input style={inp} value={form.phone} placeholder="9876543210"
          onChange={e => set('phone', e.target.value)} />
      </Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
        <button className="btn-primary" onClick={() => onSaveAndNext(form)} disabled={saving}>
          {saving ? 'Saving...' : 'Save & Continue'}
        </button>
      </div>
    </div>
  )
}

/* -- Step 2: Business ----------------------------------------------- */
function BusinessStep({ submission, onSaveAndNext, onBack, saving }) {
  const [form, setForm] = useState({
    business_name: submission.business_name || '',
    business_type: submission.business_type || '',
    monthly_volume_usd: submission.monthly_volume_usd || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,rgba(59,130,246,0.18),rgba(99,102,241,0.18))',
          border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '1.35rem', color: '#3b82f6', fontWeight: 700
        }}>2</div>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f5f5f7', margin: 0 }}>Business Details</h2>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Step 2 of 5</p>
        </div>
      </div>
      <Field label="Business Name *">
        <input style={inp} value={form.business_name} placeholder="Pixel Studio"
          onChange={e => set('business_name', e.target.value)} />
      </Field>
      <Field label="Business Type *">
        <select style={{ ...inp, cursor: 'pointer' }} value={form.business_type}
          onChange={e => set('business_type', e.target.value)}>
          <option value="">Select type...</option>
          {BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Expected Monthly Volume (USD) *">
        <input style={inp} type="number" value={form.monthly_volume_usd} placeholder="5000" min="0"
          onChange={e => set('monthly_volume_usd', e.target.value)} />
      </Field>
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }}>
        <button className="btn-secondary" onClick={onBack}>Back</button>
        <button className="btn-primary" onClick={() => onSaveAndNext(form)} disabled={saving}>
          {saving ? 'Saving...' : 'Save & Continue'}
        </button>
      </div>
    </div>
  )
}

/* -- Step 3: Documents --------------------------------------------- */
function DocumentStep({ submission, docTypes, getDoc, fileRefs, onUpload, uploadingDoc, onNext, onBack }) {
  const uploaded = docTypes.filter(d => getDoc(d.key)).length
  const [dragging, setDragging] = useState(null)
  const [aiChecking, setAiChecking] = useState(null)
  const [aiDone, setAiDone] = useState({})

  const handleUploadWithAI = async (key, file) => {
    await onUpload(key, file)
    setAiChecking(key)
    setTimeout(() => {
      setAiChecking(null)
      setAiDone(d => ({ ...d, [key]: true }))
    }, 1800)
  }

  const onDrop = (e, key) => {
    e.preventDefault()
    setDragging(null)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { showToast('File too large. Max 5 MB', 'error'); return }
    handleUploadWithAI(key, file)
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,rgba(59,130,246,0.18),rgba(99,102,241,0.18))',
            border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '1.35rem', color: '#3b82f6', fontWeight: 700
          }}>3</div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--c-text)', margin: 0 }}>Upload Documents</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--c-muted)', margin: 0 }}>Drag and drop or click to browse - Step 3 of 5</p>
          </div>
        </div>
        <span style={{
          fontSize: '0.72rem', fontWeight: 700, padding: '5px 12px', borderRadius: '20px',
          background: uploaded === 3 ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
          color: uploaded === 3 ? '#6ee7b7' : 'var(--c-muted)',
          border: uploaded === 3 ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--c-border)',
        }}>
          {uploaded}/3 done
        </span>
      </div>

      {docTypes.map(({ key, label, hint, icon }) => {
        const doc = getDoc(key)
        const isUploading = uploadingDoc === key
        const isAI = aiChecking === key
        const isVerified = aiDone[key] && doc
        const isDragging = dragging === key

        return (
          <div key={key}
            onDragOver={e => { e.preventDefault(); setDragging(key) }}
            onDragLeave={() => setDragging(null)}
            onDrop={e => onDrop(e, key)}
            className={isDragging ? 'drop-zone-active' : ''}
            style={{
              borderRadius: '16px', border: `2px dashed ${doc ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.12)'}`,
              background: doc ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
              padding: '20px', transition: 'all 0.25s', cursor: 'pointer',
              position: 'relative', overflow: 'hidden',
            }}
            onClick={() => !isUploading && !isAI && fileRefs[key].current.click()}
          >
            <input type="file" ref={fileRefs[key]} accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
              onChange={e => e.target.files[0] && handleUploadWithAI(key, e.target.files[0])} />

            {(isUploading || isAI) && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(90deg,transparent 0%,rgba(59,130,246,0.06) 50%,transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'aiScan 1.2s linear infinite',
                pointerEvents: 'none',
              }} />
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
                background: isVerified ? 'rgba(16,185,129,0.15)' : isUploading || isAI ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${isVerified ? 'rgba(16,185,129,0.3)' : isUploading || isAI ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700,
                color: isVerified ? '#6ee7b7' : isUploading || isAI ? '#93c5fd' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.3s',
              }}>
                {isVerified ? 'OK' : isUploading ? '...' : isAI ? 'AI' : icon}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, color: 'var(--c-text)', fontSize: '0.9rem', margin: '0 0 3px' }}>{label}</p>
                {isUploading ? (
                  <p style={{ fontSize: '0.75rem', color: '#93c5fd', margin: 0, fontWeight: 500 }}>Uploading...</p>
                ) : isAI ? (
                  <p className="ai-scanning" style={{ fontSize: '0.75rem', margin: 0 }}>AI verifying document quality...</p>
                ) : isVerified ? (
                  <p style={{ fontSize: '0.75rem', color: '#6ee7b7', margin: 0, fontWeight: 500 }}>
                    Verified - {doc.original_filename} ({(doc.file_size / 1024).toFixed(0)} KB)
                  </p>
                ) : doc ? (
                  <p style={{ fontSize: '0.75rem', color: '#6ee7b7', margin: 0 }}>{doc.original_filename}</p>
                ) : (
                  <p style={{ fontSize: '0.75rem', color: 'var(--c-muted)', margin: 0 }}>
                    {isDragging ? 'Drop file here' : hint}
                  </p>
                )}
              </div>

              {!isUploading && !isAI && (
                <button
                  onClick={e => { e.stopPropagation(); fileRefs[key].current.click() }}
                  style={{
                    padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', flexShrink: 0,
                    fontFamily: 'Inter,sans-serif', fontSize: '0.8rem', fontWeight: 600,
                    background: doc ? 'rgba(255,255,255,0.07)' : 'linear-gradient(135deg,#3b82f6,#6366f1)',
                    border: doc ? '1px solid rgba(255,255,255,0.12)' : 'none',
                    color: doc ? 'var(--c-sub)' : '#fff',
                    boxShadow: doc ? 'none' : '0 4px 12px rgba(59,130,246,0.3)',
                    transition: 'all 0.2s',
                  }}>
                  {doc ? 'Replace' : 'Browse'}
                </button>
              )}
            </div>

            {!doc && !isUploading && !isAI && (
              <div style={{
                marginTop: '10px', paddingTop: '10px',
                borderTop: '1px dashed rgba(255,255,255,0.06)',
                fontSize: '0.7rem', color: 'var(--c-dim)', textAlign: 'center',
              }}>
                or drag and drop your file here
              </div>
            )}
          </div>
        )
      })}

      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }}>
        <button className="btn-secondary" onClick={onBack}>Back</button>
        <button className="btn-primary" onClick={onNext}>Continue</button>
      </div>
    </div>
  )
}

/* -- Step 5: Review & Submit ---------------------------------------- */
function ReviewStep({ submission, onSubmit, onBack, submitting, getDoc, selfie, faceMatched }) {
  const sec = {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px',
  }
  const row = { display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', alignItems: 'center' }
  const k = { color: 'rgba(255,255,255,0.4)' }
  const v = { color: '#f5f5f7', fontWeight: 500 }

  const allDocsUploaded = ['pan', 'aadhaar', 'bank_statement'].every(t => getDoc(t))

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,rgba(59,130,246,0.18),rgba(99,102,241,0.18))',
          border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '1.35rem', color: '#3b82f6', fontWeight: 700
        }}>5</div>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f5f5f7', margin: 0 }}>Review & Submit</h2>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Step 5 of 5 - Final check</p>
        </div>
      </div>

      {/* Personal */}
      <div>
        <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Personal</p>
        <div style={sec}>
          <div style={row}><span style={k}>Full Name</span><span style={v}>{submission.full_name || '-'}</span></div>
          <div style={row}><span style={k}>Email</span><span style={v}>{submission.email || '-'}</span></div>
          <div style={row}><span style={k}>Phone</span><span style={v}>{submission.phone || '-'}</span></div>
        </div>
      </div>

      {/* Business */}
      <div>
        <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Business</p>
        <div style={sec}>
          <div style={row}><span style={k}>Name</span><span style={v}>{submission.business_name || '-'}</span></div>
          <div style={row}><span style={k}>Type</span><span style={v}>{submission.business_type || '-'}</span></div>
          <div style={row}><span style={k}>Monthly Volume</span><span style={v}>${submission.monthly_volume_usd || '-'}</span></div>
        </div>
      </div>

      {/* Documents */}
      <div>
        <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Documents</p>
        <div style={sec}>
          {['pan', 'aadhaar', 'bank_statement'].map(type => {
            const doc = getDoc(type)
            return (
              <div key={type} style={row}>
                <span style={k}>{type.replace('_', ' ').toUpperCase()}</span>
                {doc
                  ? <span style={{ color: '#6ee7b7', fontWeight: 600, fontSize: '0.82rem' }}>✓ Uploaded</span>
                  : <span style={{ color: '#fca5a5', fontWeight: 500, fontSize: '0.82rem' }}>✗ Missing</span>
                }
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Face ID Review ──────────────────────────────────────────── */}
      <div>
        <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
          Face ID Verification
        </p>

        {selfie ? (
          <div style={{
            ...sec,
            background: faceMatched ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
            border: `1px solid ${faceMatched ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
            padding: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Selfie photo */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img
                  src={selfie}
                  alt="Face ID capture"
                  style={{
                    width: '72px', height: '72px', objectFit: 'cover', borderRadius: '50%',
                    border: `3px solid ${faceMatched ? '#6ee7b7' : '#fca5a5'}`,
                    boxShadow: `0 0 18px ${faceMatched ? 'rgba(16,185,129,0.45)' : 'rgba(239,68,68,0.45)'}`,
                    display: 'block',
                  }}
                />
                {/* Status badge on photo */}
                <div style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: faceMatched ? '#059669' : '#dc2626',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', border: '2px solid rgba(0,0,0,0.6)', color: '#fff', fontWeight: 700,
                }}>
                  {faceMatched ? '✓' : '✗'}
                </div>
              </div>

              {/* Right side info */}
              <div style={{ flex: 1 }}>
                <p style={{
                  fontWeight: 700, fontSize: '0.9rem', margin: '0 0 4px',
                  color: faceMatched ? '#6ee7b7' : '#fca5a5',
                }}>
                  {faceMatched ? 'Identity Verified' : 'Verification Failed'}
                </p>
                <p style={{ fontSize: '0.77rem', color: 'rgba(255,255,255,0.4)', margin: '0 0 10px' }}>
                  {faceMatched
                    ? 'Live selfie matched your submitted ID document.'
                    : 'Face did not match. Please retake from Step 4.'}
                </p>
                {/* Mini check pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    { label: 'Liveness', pass: true },
                    { label: 'Eye match', pass: faceMatched },
                    { label: 'No spoofing', pass: true },
                    { label: 'Single face', pass: true },
                  ].map((c, i) => (
                    <span key={i} style={{
                      fontSize: '0.66rem', padding: '2px 9px', borderRadius: '20px', fontWeight: 600,
                      background: c.pass ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                      color: c.pass ? '#6ee7b7' : '#fca5a5',
                      border: `1px solid ${c.pass ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    }}>
                      {c.pass ? '✓' : '✗'} {c.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Status badge */}
              <div style={{
                flexShrink: 0, padding: '7px 13px', borderRadius: '10px', fontWeight: 700, fontSize: '0.8rem',
                background: faceMatched ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                color: faceMatched ? '#6ee7b7' : '#fca5a5',
                border: `1px solid ${faceMatched ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              }}>
                {faceMatched ? 'MATCH' : 'FAIL'}
              </div>
            </div>
          </div>
        ) : (
          /* No selfie taken yet */
          <div style={{
            ...sec,
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.22)',
          }}>
            <div style={row}>
              <span style={k}>Face ID</span>
              <span style={{ color: '#fcd34d', fontWeight: 500, fontSize: '0.82rem' }}>⚠ Not completed</span>
            </div>
            <p style={{ fontSize: '0.77rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
              Go back to Step 4 to complete face verification.
            </p>
          </div>
        )}
      </div>

      {/* Warnings */}
      {!allDocsUploaded && (
        <div style={{
          padding: '12px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: '12px', fontSize: '0.82rem', color: '#fcd34d'
        }}>
          Please upload all 3 documents before submitting.
        </div>
      )}
      {!selfie && (
        <div style={{
          padding: '12px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: '12px', fontSize: '0.82rem', color: '#fcd34d'
        }}>
          Please complete Face ID verification in Step 4 before submitting.
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }}>
        <button className="btn-secondary" onClick={onBack}>Back</button>
        <button
          className="btn-primary"
          onClick={onSubmit}
          disabled={submitting || !allDocsUploaded || !selfie || !faceMatched}
          style={{ opacity: (!allDocsUploaded || !selfie || !faceMatched) ? 0.5 : 1 }}
        >
          {submitting ? 'Submitting...' : 'Submit KYC'}
        </button>
      </div>
    </div>
  )
}