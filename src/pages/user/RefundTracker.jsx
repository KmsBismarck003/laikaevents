import React, { useState, useEffect } from 'react'
import Icon from '../../components/Icons'
import api from '../../services/api'
import { useNotification } from '../../context/NotificationContext'

const FALLBACK_IMGS = [
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&q=80',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&q=80',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=120&q=80',
  'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=120&q=80',
]

const STATUS = {
  pending:  { label:'PENDIENTE',   color:'#ea580c', bg:'#ea580c20', border:'#ea580c' },
  approved: { label:'APROBADO',    color:'#16a34a', bg:'#16a34a20', border:'#16a34a' },
  rejected: { label:'RECHAZADO',   color:'#dc2626', bg:'#dc262620', border:'#dc2626' },
  processing:{ label:'EN PROCESO', color:'#2563eb', bg:'#2563eb20', border:'#2563eb' },
}

const REASONS = [
  'Evento cancelado por el organizador',
  'No puedo asistir por enfermedad',
  'Cambio de fecha o lugar del evento',
  'Error en la compra',
  'Otro motivo',
]

export default function RefundTracker() {
  const [requests,  setRequests]  = useState([])
  const [tickets,   setTickets]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ ticketId:'', reason:'', detail:'' })
  const { success, error: showError } = useNotification()

  useEffect(() => {
    ;(async () => {
      try {
        const [refs, ticks] = await Promise.all([
          api.refund?.getMyRefunds?.() || Promise.resolve([]),
          api.ticket?.getMyTickets?.() || Promise.resolve([])
        ])
        setRequests(Array.isArray(refs) ? refs : [])
        setTickets(Array.isArray(ticks) ? ticks : [])
      } catch {
        setRequests([])
        setTickets([])
      } finally { setLoading(false) }
    })()
  }, [])

  const pending   = requests.filter(r => r.status === 'pending' || r.status === 'processing')
  const totalInProcess = pending.reduce((s, r) => s + (parseFloat(r.amount || r.price || 0)), 0)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.reason) { showError('Selecciona un motivo'); return }
    setSubmitting(true)
    try {
      await api.refund?.requestRefund?.(form) || Promise.resolve()
      const fake = {
        id: Date.now(), status:'pending',
        ticket: tickets.find(t => String(t.id) === String(form.ticketId)) || null,
        amount: 0, reason: form.reason, detail: form.detail,
        created_at: new Date().toISOString()
      }
      setRequests(prev => [fake, ...prev])
      setForm({ ticketId:'', reason:'', detail:'' })
      setShowForm(false)
      success('Solicitud enviada correctamente')
    } catch (err) { showError(err?.message || 'Error al enviar solicitud') }
    finally { setSubmitting(false) }
  }

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      {[1,2,3].map(i => <div key={i} style={{ height:'80px', borderRadius:'16px', background:'rgba(255,255,255,.04)' }} />)}
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.75rem' }}>

      {/* ── HEADER + STATS ──────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
        <span style={{ fontSize:'.65rem', fontWeight:900, textTransform:'uppercase', letterSpacing:'4px', color:'#555' }}>
          REEMBOLSOS
        </span>

        <div style={{ display:'flex', gap:'.6rem', flexWrap:'wrap' }}>
          {[
            { icon:'clock',      label:'Pendientes', value: pending.length,          color:'#ea580c' },
            { icon:'dollarSign', label:'En proceso',  value:`$${totalInProcess.toLocaleString('es-MX')}`, color:'#2563eb' },
          ].map(s => (
            <div key={s.label} style={{
              display:'flex', alignItems:'center', gap:'.65rem',
              background:'#111', border:'1px solid #1e1e1e', borderRadius:'12px', padding:'.55rem 1rem'
            }}>
              <div style={{ width:'30px', height:'30px', borderRadius:'8px', flexShrink:0,
                background:`${s.color}20`, display:'flex', alignItems:'center', justifyContent:'center', color:s.color }}>
                <Icon name={s.icon} size={14} />
              </div>
              <div>
                <div style={{ fontSize:'.9rem', fontWeight:900, color:'#fff', lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:'.52rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'1.5px', color:'#555' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── INFO + ACTION CARDS ─────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>

        {/* Policy card */}
        <div style={{ background:'#0d0d0d', border:'1px solid #1e1e1e', borderLeft:'4px solid #2563eb',
          borderRadius:'16px', padding:'1.25rem 1.5rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'1rem' }}>
            <Icon name="info" size={16} style={{ color:'#2563eb' }} />
            <span style={{ fontSize:'.62rem', fontWeight:900, textTransform:'uppercase',
              letterSpacing:'2px', color:'#2563eb' }}>Política de Reembolsos</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'.55rem' }}>
            {[
              { icon:'check', text:'Solo para eventos cancelados por el organizador' },
              { icon:'clock', text:'Plazo máximo de 7 días desde la cancelación' },
              { icon:'dollarSign', text:'Reembolso del 100% del valor del boleto' },
              { icon:'creditCard', text:'El monto regresa al método de pago original' },
            ].map((item, i) => (
              <div key={i} style={{ display:'flex', gap:'.6rem', alignItems:'flex-start' }}>
                <Icon name={item.icon} size={12} style={{ color:'#2563eb', flexShrink:0, marginTop:'2px' }} />
                <span style={{ fontSize:'.68rem', color:'#666', fontWeight:600, lineHeight:1.4 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Request card */}
        <div style={{ background:'#0d0d0d', border:`1px solid ${showForm ? '#ea580c40' : '#1e1e1e'}`,
          borderRadius:'16px', padding:'1.5rem',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center',
          gap:'1rem', transition:'border-color .2s',
          boxShadow: showForm ? '0 4px 24px #ea580c15' : 'none' }}>

          {!showForm ? (
            <>
              <div style={{ width:'52px', height:'52px', borderRadius:'14px',
                background:'#ea580c20', border:'1px solid #ea580c40',
                display:'flex', alignItems:'center', justifyContent:'center', color:'#ea580c' }}>
                <Icon name="plus" size={26} />
              </div>
              <h3 style={{ margin:0, fontSize:'.9rem', fontWeight:900, color:'#fff', textTransform:'uppercase', letterSpacing:'1px' }}>
                Nueva Solicitud
              </h3>
              <p style={{ margin:0, fontSize:'.7rem', color:'#555', fontWeight:600 }}>
                Selecciona un boleto para iniciar el proceso
              </p>
              <button onClick={() => setShowForm(true)} style={{
                background:'#fff', color:'#000', border:'none',
                padding:'.65rem 1.75rem', borderRadius:'99px',
                fontSize:'.65rem', fontWeight:900, textTransform:'uppercase',
                letterSpacing:'2px', cursor:'pointer', transition:'all .2s'
              }}
                onMouseOver={e => e.currentTarget.style.transform='translateY(-2px)'}
                onMouseOut={e => e.currentTarget.style.transform='translateY(0)'}
              >Solicitar Reembolso</button>
            </>
          ) : (
            <form onSubmit={handleSubmit} style={{ width:'100%', textAlign:'left', display:'flex', flexDirection:'column', gap:'.85rem' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:'.62rem', fontWeight:900, textTransform:'uppercase', letterSpacing:'2px', color:'#ea580c' }}>
                  Nueva Solicitud
                </span>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  background:'none', border:'none', color:'#555', cursor:'pointer', fontSize:'1rem' }}>
                  <Icon name="x" size={16} />
                </button>
              </div>

              {/* Ticket select */}
              <div>
                <label style={{ fontSize:'.56rem', fontWeight:900, textTransform:'uppercase', letterSpacing:'2px', color:'#444', display:'block', marginBottom:'.35rem' }}>
                  Boleto
                </label>
                <select value={form.ticketId} onChange={e => setForm(p=>({...p,ticketId:e.target.value}))} required
                  style={{ width:'100%', background:'#111', border:'1px solid #2a2a2a', borderRadius:'10px',
                    color:'#fff', padding:'.6rem .9rem', fontSize:'.78rem', outline:'none', boxSizing:'border-box' }}>
                  <option value="">Selecciona un boleto…</option>
                  {tickets.map((t,i) => (
                    <option key={t.id||i} value={t.id||i}>
                      {t.event?.name || t.eventName || `Boleto ${t.ticket_code||i}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason select */}
              <div>
                <label style={{ fontSize:'.56rem', fontWeight:900, textTransform:'uppercase', letterSpacing:'2px', color:'#444', display:'block', marginBottom:'.35rem' }}>Motivo</label>
                <select value={form.reason} onChange={e => setForm(p=>({...p,reason:e.target.value}))} required
                  style={{ width:'100%', background:'#111', border:'1px solid #2a2a2a', borderRadius:'10px',
                    color: form.reason ? '#fff' : '#555', padding:'.6rem .9rem', fontSize:'.78rem', outline:'none', boxSizing:'border-box' }}>
                  <option value="">Selecciona un motivo…</option>
                  {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Detail */}
              <div>
                <label style={{ fontSize:'.56rem', fontWeight:900, textTransform:'uppercase', letterSpacing:'2px', color:'#444', display:'block', marginBottom:'.35rem' }}>Detalle (opcional)</label>
                <textarea value={form.detail} onChange={e => setForm(p=>({...p,detail:e.target.value}))}
                  placeholder="Describe brevemente tu situación…" rows={3}
                  style={{ width:'100%', background:'#111', border:'1px solid #2a2a2a', borderRadius:'10px',
                    color:'#fff', padding:'.6rem .9rem', fontSize:'.75rem', outline:'none',
                    resize:'none', fontFamily:'inherit', boxSizing:'border-box' }}/>
              </div>

              <button type="submit" disabled={submitting} style={{
                background: submitting ? '#333' : '#fff', color: submitting ? '#666' : '#000',
                border:'none', padding:'.65rem', borderRadius:'10px',
                fontSize:'.65rem', fontWeight:900, textTransform:'uppercase',
                letterSpacing:'2px', cursor: submitting ? 'wait' : 'pointer' }}>
                {submitting ? 'Enviando…' : 'Enviar Solicitud'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ── MY REQUESTS ─────────────────────────────────────────── */}
      <div>
        <p style={{ margin:'0 0 1rem', fontSize:'.6rem', fontWeight:900, textTransform:'uppercase',
          letterSpacing:'3.5px', color:'#444', paddingBottom:'.75rem', borderBottom:'1px solid #1a1a1a' }}>
          Mis Solicitudes
        </p>

        {requests.length === 0 ? (
          <div style={{ textAlign:'center', padding:'3rem 2rem',
            background:'#0a0a0a', border:'1px dashed #1a1a1a', borderRadius:'16px' }}>
            <Icon name="inbox" size={40} style={{ opacity:.1, display:'block', margin:'0 auto 1rem' }} />
            <p style={{ margin:0, fontSize:'.78rem', color:'#555' }}>Aún no tienes solicitudes de reembolso</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
            {requests.map((req, idx) => {
              const st      = STATUS[req.status] || STATUS.pending
              const ticket  = req.ticket
              const name    = ticket?.event?.name || ticket?.eventName || req.event_name || 'Evento'
              const imgUrl  = ticket?.event?.image_url || ticket?.imageUrl || FALLBACK_IMGS[idx % FALLBACK_IMGS.length]
              const amount  = parseFloat(req.amount || req.price || ticket?.price || 0)
              const created = req.created_at
                ? new Date(req.created_at).toLocaleDateString('es-MX', { day:'numeric', month:'short', year:'numeric' })
                : '—'
              return (
                <div key={req.id || idx} style={{
                  display:'flex', alignItems:'center', gap:'1rem',
                  background:'#111', border:'1px solid #1e1e1e',
                  borderLeft:`3px solid ${st.border}`,
                  borderRadius:'14px', padding:'1rem 1.1rem',
                  transition:'background .15s'
                }}
                  onMouseOver={e => e.currentTarget.style.background='#161616'}
                  onMouseOut={e => e.currentTarget.style.background='#111'}
                >
                  <img src={imgUrl} alt="" style={{ width:'52px', height:'52px',
                    borderRadius:'10px', objectFit:'cover', flexShrink:0, border:'1px solid #222' }} />

                  <div style={{ flex:1, minWidth:0 }}>
                    <h4 style={{ margin:'0 0 .25rem', fontSize:'.9rem', fontWeight:800, color:'#fff',
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</h4>
                    <div style={{ display:'flex', gap:'.75rem', flexWrap:'wrap' }}>
                      <span style={{ fontSize:'.63rem', color:'#555', fontWeight:600,
                        display:'flex', alignItems:'center', gap:'.3rem' }}>
                        <Icon name="calendar" size={11} /> Solicitado: {created}
                      </span>
                      {req.reason && (
                        <span style={{ fontSize:'.63rem', color:'#444', fontWeight:600,
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'200px' }}>
                          {req.reason}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign:'right', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'.4rem' }}>
                    {amount > 0 && (
                      <span style={{ fontSize:'.95rem', fontWeight:900, color:'#fff' }}>
                        ${amount.toLocaleString('es-MX')}
                      </span>
                    )}
                    <span style={{
                      fontSize:'.54rem', fontWeight:900, textTransform:'uppercase', letterSpacing:'1.5px',
                      color:st.color, background:st.bg, border:`1px solid ${st.border}40`,
                      padding:'.22rem .7rem', borderRadius:'99px'
                    }}>{st.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── FOOTER NOTE ─────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:'.5rem',
        padding:'1rem 1.25rem', background:'#0a0a0a',
        border:'1px solid #1a1a1a', borderRadius:'12px' }}>
        <Icon name="info" size={13} style={{ color:'#333', flexShrink:0 }} />
        <p style={{ margin:0, fontSize:'.68rem', color:'#444', fontWeight:600, fontStyle:'italic' }}>
          Los reembolsos aprobados se procesan en 3-5 días hábiles al método de pago original.
        </p>
      </div>
    </div>
  )
}
