import React, { useState, useEffect } from 'react'
import { ticketAPI } from '../../services/api'
import { useNavigate } from 'react-router-dom'
import Icon from '../../components/Icons'
import { PermissionWall } from '../../components'

const FALLBACK_IMGS = [
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&q=80',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&q=80',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=120&q=80',
  'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=120&q=80',
  'https://images.unsplash.com/photo-1501386761578-eaa54b618547?w=120&q=80',
]

/* ── Vivid (non-pastel) status colors ───────────────────────── */
const STATUS_MAP = {
  active:    { label:'ACTIVO',      color:'#16a34a', bg:'#16a34a22', border:'#16a34a' },
  confirmed: { label:'CONFIRMADO',  color:'#2563eb', bg:'#2563eb22', border:'#2563eb' },
  used:      { label:'USADO',       color:'#64748b', bg:'#64748b18', border:'#64748b' },
  cancelled: { label:'CANCELADO',   color:'#dc2626', bg:'#dc262622', border:'#dc2626' },
  refunded:  { label:'REEMBOLSADO', color:'#ea580c', bg:'#ea580c22', border:'#ea580c' },
}

const FILTERS = [
  { id:'todos',     label:'TODOS'       },
  { id:'confirmed', label:'CONFIRMADO'  },
  { id:'active',    label:'ACTIVO'      },
  { id:'used',      label:'USADO'       },
  { id:'cancelled', label:'CANCELADO'   },
  { id:'refunded',  label:'REEMBOLSADO' },
]

function groupByMonth(tickets) {
  const groups = {}
  tickets.forEach(t => {
    const dateStr = t.event?.date || t.date
    let key = 'Sin fecha'
    if (dateStr) {
      const d = new Date(dateStr)
      const month = d.toLocaleDateString('es-MX', { month:'short' }).toUpperCase().replace('.','')
      const year  = d.getFullYear()
      key = `${month} ${year}`
    }
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  })
  return Object.entries(groups)
}

export default function UserHistory() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('todos')
  const [visible, setVisible] = useState(5)
  const navigate = useNavigate()

  useEffect(() => {
    ;(async () => {
      try {
        const t = await ticketAPI.getMyTickets()
        setTickets(Array.isArray(t) ? t : [])
      } catch {
        setTickets([])
      } finally { setLoading(false) }
    })()
  }, [])

  const filtered       = filter === 'todos' ? tickets : tickets.filter(t => t.status === filter)
  const visibleList    = filtered.slice(0, visible)
  const groups         = groupByMonth(visibleList)
  const totalSpent     = tickets.reduce((s, t) => s + (parseFloat(t.price) || 0), 0)
  const uniqueVenues   = [...new Set(tickets.map(t => t.event?.venue_name || t.venue).filter(Boolean))].length
  const hasMore        = visible < filtered.length

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ height:'80px', borderRadius:'16px', background:'rgba(255,255,255,.04)' }} />
      ))}
    </div>
  )

  return (
    <PermissionWall permission="canViewMyHistory" label="Historial de Compras">
    <div style={{ display:'flex', flexDirection:'column', gap:'1.75rem' }}>

      {/* ── HEADER + 3 STAT PILLS ───────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
        <span style={{ fontSize:'.65rem', fontWeight:900, textTransform:'uppercase', letterSpacing:'4px', color:'#555' }}>
          HISTORIAL
        </span>

        <div style={{ display:'flex', gap:'.6rem', flexWrap:'wrap' }}>
          {[
            { icon:'ticket',     label:'Eventos',  value: tickets.length,               color:'#2563eb' },
            { icon:'dollarSign', label:'Gastado',  value:`$${totalSpent.toLocaleString('es-MX')}`, color:'#16a34a' },
            { icon:'map',        label:'Recintos', value: uniqueVenues || 0,            color:'#ea580c' },
          ].map(s => (
            <div key={s.label} style={{
              display:'flex', alignItems:'center', gap:'.65rem',
              background:'#111', border:'1px solid #222',
              borderRadius:'12px', padding:'.55rem 1rem'
            }}>
              <div style={{
                width:'30px', height:'30px', borderRadius:'8px', flexShrink:0,
                background:`${s.color}20`,
                display:'flex', alignItems:'center', justifyContent:'center', color: s.color
              }}>
                <Icon name={s.icon} size={15} />
              </div>
              <div>
                <div style={{ fontSize:'.92rem', fontWeight:900, color:'#fff', lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:'.52rem', fontWeight:700, textTransform:'uppercase',
                  letterSpacing:'1.5px', color:'#555', marginTop:'2px' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FILTER CHIPS ────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:'.45rem', flexWrap:'wrap' }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => { setFilter(f.id); setVisible(5) }} style={{
            background: filter === f.id ? '#fff'                      : 'transparent',
            color:      filter === f.id ? '#000'                      : '#555',
            border:     filter === f.id ? '1px solid #fff'            : '1px solid #222',
            padding:'.38rem .9rem', borderRadius:'99px',
            fontSize:'.6rem', fontWeight:900, textTransform:'uppercase',
            letterSpacing:'1.5px', cursor:'pointer', transition:'all .15s'
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* ── TIMELINE ────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'4rem 2rem',
          background:'#0d0d0d', border:'1px dashed #1a1a1a', borderRadius:'20px' }}>
          <Icon name="history" size={44} style={{ opacity:.1, display:'block', margin:'0 auto 1rem' }} />
          <p style={{ margin:'0 0 1.25rem', fontSize:'.8rem', color:'#555' }}>
            No hay registros con ese filtro
          </p>
          <button onClick={() => navigate('/')} style={{
            background:'#fff', color:'#000', border:'none',
            padding:'.65rem 1.75rem', borderRadius:'99px',
            fontSize:'.65rem', fontWeight:900, textTransform:'uppercase',
            letterSpacing:'2px', cursor:'pointer'
          }}>Explorar Eventos</button>
        </div>
      ) : (
        <div>
          {groups.map(([month, items]) => (
            <div key={month} style={{ display:'flex', marginBottom:'1.5rem' }}>

              {/* MONTH LABEL column */}
              <div style={{ width:'72px', flexShrink:0, paddingTop:'.6rem', paddingRight:'.75rem', textAlign:'right' }}>
                {month.split(' ').map((w, i) => (
                  <div key={i} style={{
                    fontSize: i === 0 ? '.65rem' : '.58rem',
                    fontWeight: 900, color: i === 0 ? '#666' : '#444',
                    textTransform:'uppercase', letterSpacing:'1.5px',
                    lineHeight: 1.3
                  }}>{w}</div>
                ))}
              </div>

              {/* AXIS + CARDS */}
              <div style={{ flex:1, position:'relative', paddingLeft:'1.5rem' }}>
                {/* Vertical dashed line */}
                <div style={{
                  position:'absolute', left:0, top:'6px', bottom:0,
                  borderLeft:'2px dashed #1e1e1e'
                }} />

                <div style={{ display:'flex', flexDirection:'column', gap:'.65rem' }}>
                  {items.map((ticket, idx) => {
                    const st      = STATUS_MAP[ticket.status] || STATUS_MAP.confirmed
                    const name    = ticket.event?.name || ticket.eventName || 'Evento LAIKA'
                    const dateRaw = ticket.event?.date || ticket.date
                    const venue   = ticket.event?.venue_name || ticket.venue || 'LAIKA ARENA'
                    const imgUrl  = ticket.event?.image_url || ticket.imageUrl || FALLBACK_IMGS[idx % FALLBACK_IMGS.length]
                    const price   = parseFloat(ticket.price || 0)
                    const fmtDate = dateRaw
                      ? new Date(dateRaw).toLocaleDateString('es-MX', { day:'numeric', month:'short', year:'numeric' })
                      : '—'

                    return (
                      <div key={ticket.id || idx} style={{ position:'relative' }}>
                        {/* Timeline dot */}
                        <div style={{
                          position:'absolute', left:'-1.875rem', top:'50%',
                          transform:'translateY(-50%)',
                          width:'13px', height:'13px', borderRadius:'50%',
                          background: st.color,
                          border:'2px solid #060606',
                          zIndex:2,
                          boxShadow:`0 0 0 3px ${st.color}25`
                        }} />

                        {/* Card */}
                        <div style={{
                          display:'flex', alignItems:'center', gap:'1rem',
                          background:'#111', border:'1px solid #1e1e1e',
                          borderLeft:`3px solid ${st.border}`,
                          borderRadius:'14px', padding:'1rem 1.1rem',
                          transition:'background .15s, border-color .15s'
                        }}
                          onMouseOver={e => {
                            e.currentTarget.style.background = '#161616'
                            e.currentTarget.style.borderColor = '#2a2a2a'
                          }}
                          onMouseOut={e => {
                            e.currentTarget.style.background = '#111'
                            e.currentTarget.style.borderColor = '#1e1e1e'
                          }}
                        >
                          {/* Event photo */}
                          <img src={imgUrl} alt="" style={{
                            width:'52px', height:'52px', borderRadius:'10px',
                            objectFit:'cover', flexShrink:0, border:'1px solid #222'
                          }} />

                          {/* Info */}
                          <div style={{ flex:1, minWidth:0 }}>
                            <h4 style={{ margin:'0 0 .3rem', fontSize:'.9rem', fontWeight:800, color:'#fff',
                              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {name}
                            </h4>
                            <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap' }}>
                              <span style={{ display:'flex', alignItems:'center', gap:'.3rem',
                                fontSize:'.64rem', color:'#555', fontWeight:600 }}>
                                <Icon name="map" size={11} /> {venue}
                              </span>
                              <span style={{ display:'flex', alignItems:'center', gap:'.3rem',
                                fontSize:'.64rem', color:'#555', fontWeight:600 }}>
                                <Icon name="calendar" size={11} /> {fmtDate}
                              </span>
                            </div>
                          </div>

                          {/* Price + Status */}
                          <div style={{ textAlign:'right', flexShrink:0,
                            display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'.4rem' }}>
                            {price > 0 && (
                              <span style={{ fontSize:'.95rem', fontWeight:900, color:'#fff' }}>
                                ${price.toLocaleString('es-MX')}
                              </span>
                            )}
                            <span style={{
                              fontSize:'.54rem', fontWeight:900, textTransform:'uppercase',
                              letterSpacing:'1.5px', color: st.color,
                              background: st.bg, border:`1px solid ${st.border}40`,
                              padding:'.22rem .7rem', borderRadius:'99px'
                            }}>{st.label}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* LOAD MORE */}
          {hasMore && (
            <div style={{ paddingLeft:'72px' }}>
              <button onClick={() => setVisible(v => v + 5)} style={{
                width:'100%', background:'transparent',
                border:'1px solid #1e1e1e', color:'#555',
                padding:'.65rem', borderRadius:'12px',
                fontSize:'.62rem', fontWeight:900, textTransform:'uppercase',
                letterSpacing:'2px', cursor:'pointer', transition:'all .15s',
                display:'flex', alignItems:'center', justifyContent:'center', gap:'.5rem'
              }}
                onMouseOver={e => { e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='#333' }}
                onMouseOut={e => { e.currentTarget.style.color='#555'; e.currentTarget.style.borderColor='#1e1e1e' }}
              >
                <Icon name="chevronDown" size={14} />
                Cargar más ({filtered.length - visible} restantes)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
    </PermissionWall>
  )
}
