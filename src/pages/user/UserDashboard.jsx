import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { ticketAPI, eventAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icons';

/* ── Fallback concert images for events without photo ───────── */
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80',
  'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&q=80',
  'https://images.unsplash.com/photo-1501386761578-eaa54b618547?w=600&q=80',
  'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&q=80',
];

function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getTierInfo(ticketCount) {
  if (ticketCount >= 10) return { emoji: '💎', label: 'Elite',    color: '#ffd700' };
  if (ticketCount >= 5)  return { emoji: '🔥', label: 'Pro Fan',  color: '#f97316' };
  if (ticketCount >= 1)  return { emoji: '⭐', label: 'Fan',      color: '#3b82f6' };
  return                         { emoji: '🌱', label: 'Nuevo',   color: '#22c55e' };
}

export default function UserDashboard() {
  const { user }                    = useAuth();
  const { addToCart, cartCount, openCart } = useCart();
  const navigate                    = useNavigate();
  const [events,    setEvents]      = useState([]);
  const [myTickets, setMyTickets]   = useState([]);
  const [loading,   setLoading]     = useState(true);
  const [addingId,  setAddingId]    = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const ev = await eventAPI.getPublic();
        setEvents(Array.isArray(ev) ? ev : []);
      } catch { setEvents([]); }

      try {
        const t = await ticketAPI.getMyTickets();
        setMyTickets(Array.isArray(t) ? t : []);
      } catch {
        setMyTickets([]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleAdd = (event) => {
    setAddingId(event.id);
    addToCart(
      event, 1,
      { id: null, date: event.date || null, time: event.time || null, venue_name: event.venue_name || 'LAIKA ARENA' },
      { id: null, name: 'GENERAL', price: parseFloat(event.price) || 0 }
    );
    setTimeout(() => { setAddingId(null); openCart(); }, 800);
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {[200, 280, 180].map((h, i) => (
        <div key={i} style={{ height: `${h}px`, borderRadius: '20px',
          background: 'rgba(255,255,255,.04)', animation: 'pulse 1.5s infinite' }} />
      ))}
    </div>
  );

  const firstName   = user?.firstName || user?.first_name || 'Amigo';
  const tier        = getTierInfo(myTickets.length);
  const nextTicket  = myTickets
    .filter(t => t.event?.date || t.date)
    .sort((a, b) => new Date(a.event?.date || a.date) - new Date(b.event?.date || b.date))
    .find(t => getDaysUntil(t.event?.date || t.date) >= 0);
  const daysUntil   = nextTicket ? getDaysUntil(nextTicket.event?.date || nextTicket.date) : null;

  const discoverEvents = events.slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ── 1. GREETING BANNER ────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0d1b2a 0%, #0f0c29 50%, #24243e 100%)',
        border: '1px solid rgba(255,255,255,.07)',
        borderRadius: '22px',
        padding: '2.5rem 2.75rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,.5)',
      }}>
        {/* orbs */}
        <div style={{ position:'absolute', top:'-40px', right:'60px', width:'220px', height:'220px',
          background:'radial-gradient(circle, rgba(0,112,243,.2) 0%, transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:'-60px', left:'30px', width:'160px', height:'160px',
          background:'radial-gradient(circle, rgba(121,40,202,.15) 0%, transparent 70%)', pointerEvents:'none' }}/>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', position: 'relative' }}>
          <div>
            <p style={{ margin: '0 0 .35rem', fontSize: '.62rem', fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '3px', color: '#555' }}>Bienvenido de vuelta</p>
            <h1 style={{ margin: '0 0 .75rem', fontSize: '2.2rem', fontWeight: 900, color: '#fff' }}>
              ¡Hola, {firstName}! 👋
            </h1>
            <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '.35rem',
                background: `${tier.color}18`, border: `1px solid ${tier.color}40`,
                color: tier.color, fontSize: '.62rem', fontWeight: 900,
                letterSpacing: '2px', textTransform: 'uppercase',
                padding: '.3rem .85rem', borderRadius: '99px'
              }}>
                {tier.emoji} Nivel {tier.label}
              </span>
              {cartCount > 0 && (
                <button onClick={openCart} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '.4rem',
                  background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
                  color: '#fff', fontSize: '.62rem', fontWeight: 900,
                  letterSpacing: '1.5px', textTransform: 'uppercase',
                  padding: '.3rem .85rem', borderRadius: '99px', cursor: 'pointer',
                  transition: 'all .2s'
                }}>
                  <Icon name="shoppingCart" size={12} /> {cartCount} en carrito
                </button>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ display: 'flex', gap: '.6rem' }}>
            <button onClick={() => navigate('/user/tickets')} style={{
              background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
              color: '#fff', padding: '.6rem 1.25rem', borderRadius: '12px',
              fontSize: '.65rem', fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '1.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.4rem',
              transition: 'all .2s'
            }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,.06)'}
            >
              <Icon name="ticket" size={13} /> Mis Boletos
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. NEXT EVENT HERO ────────────────────────────────── */}
      {nextTicket ? (
        <div>
          <SectionLabel>Tu próximo evento</SectionLabel>
          <div style={{
            position: 'relative', borderRadius: '20px', overflow: 'hidden',
            height: '242px', cursor: 'pointer',
            boxShadow: '0 12px 40px rgba(0,0,0,.6)',
            border: '1px solid rgba(255,255,255,.08)',
          }} onClick={() => navigate('/user/tickets')}>
            {/* BG Image */}
            <img
              src={nextTicket.event?.image_url || nextTicket.imageUrl || FALLBACK_IMAGES[0]}
              alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {/* Gradient overlay */}
            <div style={{ position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, rgba(0,0,0,.85) 0%, rgba(0,0,0,.4) 60%, rgba(0,0,0,.1) 100%)' }}/>

            {/* Content */}
            <div style={{ position: 'relative', padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <p style={{ margin: '0 0 .3rem', fontSize: '.58rem', fontWeight: 900, textTransform: 'uppercase',
                    letterSpacing: '3px', color: 'rgba(255,255,255,.5)' }}>Tu próxima experiencia</p>
                  <h2 style={{ margin: '0 0 .4rem', fontSize: '1.65rem', fontWeight: 900, color: '#fff',
                    textShadow: '0 2px 8px rgba(0,0,0,.5)' }}>
                    {nextTicket.event?.name || nextTicket.eventName || 'Evento'}
                  </h2>
                  <p style={{ margin: 0, fontSize: '.75rem', color: 'rgba(255,255,255,.7)', fontWeight: 600 }}>
                    📅 {nextTicket.event?.date ? new Date(nextTicket.event.date).toLocaleDateString('es-MX', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) : '—'}
                    {nextTicket.event?.venue_name && ` · ${nextTicket.event.venue_name}`}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.75rem' }}>
                  {/* Countdown */}
                  {daysUntil !== null && (
                    <div style={{
                      background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(0,112,243,.4)', borderRadius: '14px',
                      padding: '.75rem 1.25rem', textAlign: 'center',
                      boxShadow: '0 0 20px rgba(0,112,243,.2)'
                    }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0070F3', lineHeight: 1 }}>
                        {daysUntil === 0 ? '¡HOY!' : daysUntil}
                      </div>
                      {daysUntil > 0 && <div style={{ fontSize: '.55rem', fontWeight: 900, textTransform: 'uppercase',
                        letterSpacing: '2px', color: 'rgba(255,255,255,.5)', marginTop: '.2rem' }}>DÍAS</div>}
                    </div>
                  )}
                  <button style={{
                    background: '#fff', color: '#000', border: 'none',
                    padding: '.65rem 1.4rem', borderRadius: '10px',
                    fontSize: '.65rem', fontWeight: 900, textTransform: 'uppercase',
                    letterSpacing: '1.5px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '.4rem'
                  }}>
                    <Icon name="ticket" size={13} /> Ver mi boleto →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* No tickets yet — CTA */
        <div style={{
          background: 'rgba(0,112,243,.06)', border: '1px dashed rgba(0,112,243,.25)',
          borderRadius: '20px', padding: '2.5rem', textAlign: 'center',
          boxShadow: '0 4px 24px rgba(0,0,0,.2)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '.75rem' }}>🎟</div>
          <h3 style={{ margin: '0 0 .5rem', fontSize: '1rem', fontWeight: 900, color: '#fff',
            textTransform: 'uppercase', letterSpacing: '2px' }}>
            ¡Tu primera aventura te espera!
          </h3>
          <p style={{ margin: '0 0 1.25rem', fontSize: '.78rem', color: '#555' }}>
            Descubre eventos increíbles y compra tu primer boleto LAIKA
          </p>
          <button onClick={() => navigate('/')} style={{
            background: '#fff', color: '#000', border: 'none',
            padding: '.7rem 2rem', borderRadius: '99px',
            fontSize: '.65rem', fontWeight: 900, textTransform: 'uppercase',
            letterSpacing: '2px', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(255,255,255,.1)'
          }}>Explorar Eventos</button>
        </div>
      )}

      {/* ── 3. DISCOVER EVENTS ────────────────────────────────── */}
      {discoverEvents.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <SectionLabel>Descubrir Eventos</SectionLabel>
            <button onClick={() => navigate('/')} style={{
              background: 'none', border: 'none', color: '#0070F3',
              fontSize: '.65rem', fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '1.5px', cursor: 'pointer'
            }}>Ver todos →</button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1rem'
          }}>
            {discoverEvents.map((event, idx) => (
              <EventCard
                key={event.id}
                event={event}
                image={event.image_url || FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length]}
                onAdd={() => handleAdd(event)}
                onView={() => navigate(`/event/${event.id}`)}
                adding={addingId === event.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── 4. ACTIVITY FEED ──────────────────────────────────── */}
      {myTickets.length > 0 && (
        <div>
          <SectionLabel>Actividad Reciente</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {myTickets.slice(0, 3).map((ticket, idx) => (
              <div key={ticket.id || idx} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                background: 'rgba(255,255,255,.03)',
                border: '1px solid rgba(255,255,255,.06)',
                borderRadius: '14px', padding: '1rem 1.25rem',
                transition: 'all .2s', cursor: 'pointer'
              }}
                onClick={() => navigate('/user/tickets')}
                onMouseOver={e => { e.currentTarget.style.background='rgba(255,255,255,.05)'; e.currentTarget.style.borderColor='rgba(255,255,255,.1)'; }}
                onMouseOut={e => { e.currentTarget.style.background='rgba(255,255,255,.03)'; e.currentTarget.style.borderColor='rgba(255,255,255,.06)'; }}
              >
                <img
                  src={ticket.event?.image_url || ticket.imageUrl || FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length]}
                  alt=""
                  style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: '0 0 .15rem', fontSize: '.85rem', fontWeight: 800, color: '#fff',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ticket.event?.name || ticket.eventName || 'Evento'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '.65rem', color: '#555', fontWeight: 600 }}>
                    🎫 {ticket.ticket_code || ticket.ticketCode || `TKT-${ticket.id || idx}`}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '.85rem', fontWeight: 900, color: '#fff' }}>
                    ${parseFloat(ticket.price || 0).toLocaleString('es-MX')}
                  </div>
                  <Icon name="chevronRight" size={14} style={{ color: '#333', marginTop: '.2rem' }} />
                </div>
              </div>
            ))}
            {myTickets.length > 3 && (
              <button onClick={() => navigate('/user/history')} style={{
                background: 'none', border: '1px solid rgba(255,255,255,.07)',
                color: '#555', borderRadius: '12px', padding: '.7rem',
                fontSize: '.62rem', fontWeight: 900, textTransform: 'uppercase',
                letterSpacing: '1.5px', cursor: 'pointer', transition: 'all .2s'
              }}
                onMouseOver={e => { e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='rgba(255,255,255,.15)'; }}
                onMouseOut={e => { e.currentTarget.style.color='#555'; e.currentTarget.style.borderColor='rgba(255,255,255,.07)'; }}
              >
                Ver todos ({myTickets.length}) →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Event Card ─────────────────────────────────────────────── */
function EventCard({ event, image, onAdd, onView, adding }) {
  const [hovered, setHovered] = useState(false);
  // pick a subtle glow color per genre or just random
  const glows = ['rgba(0,112,243,.35)','rgba(168,85,247,.35)','rgba(239,68,68,.3)','rgba(34,197,94,.3)','rgba(249,115,22,.3)','rgba(234,179,8,.3)'];
  const glow  = glows[Math.abs((event.id||0) % glows.length)];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', borderRadius: '18px', overflow: 'hidden',
        height: '242px', cursor: 'default',
        border: `1px solid ${hovered ? 'rgba(255,255,255,.15)' : 'rgba(255,255,255,.07)'}`,
        boxShadow: hovered ? `0 16px 40px ${glow}, 0 4px 12px rgba(0,0,0,.4)` : '0 4px 20px rgba(0,0,0,.35)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all .3s cubic-bezier(.4,0,.2,1)',
      }}
    >
      {/* Background image */}
      <img src={image} alt="" style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
        transform: hovered ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform .4s ease'
      }} />
      {/* Gradient */}
      <div style={{ position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,.92) 0%, rgba(0,0,0,.4) 55%, rgba(0,0,0,.1) 100%)' }}/>

      {/* Content */}
      <div style={{
        position: 'relative', inset: 0, padding: '1.25rem',
        height: '100%', display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-end', boxSizing: 'border-box'
      }}>
        {/* Price pill */}
        <div style={{
          position: 'absolute', top: '1rem', right: '1rem',
          background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,.1)', borderRadius: '99px',
          padding: '.25rem .7rem', fontSize: '.65rem', fontWeight: 900, color: '#fff'
        }}>
          ${parseFloat(event.price || 0).toFixed(0)}
        </div>

        <h3 style={{ margin: '0 0 .25rem', fontSize: '.95rem', fontWeight: 900, color: '#fff',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          textShadow: '0 2px 8px rgba(0,0,0,.6)' }}>
          {event.name}
        </h3>
        <p style={{ margin: '0 0 .85rem', fontSize: '.65rem', color: 'rgba(255,255,255,.6)', fontWeight: 600 }}>
          {event.date ? new Date(event.date).toLocaleDateString('es-MX', { day:'numeric', month:'short', year:'numeric' }) : ''}
          {event.venue_name ? ` · ${event.venue_name}` : ''}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button onClick={onAdd} style={{
            flex: 1, background: adding ? '#22c55e' : '#fff', color: '#000',
            border: 'none', padding: '.55rem', borderRadius: '10px',
            fontSize: '.62rem', fontWeight: 900, textTransform: 'uppercase',
            letterSpacing: '1.5px', cursor: 'pointer', transition: 'all .25s'
          }}>
            {adding ? '✓ AGREGADO' : 'AGREGAR AL CARRITO'}
          </button>
          <button onClick={onView} style={{
            background: 'rgba(255,255,255,.12)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,.15)', color: '#fff',
            padding: '.55rem .85rem', borderRadius: '10px',
            fontSize: '.62rem', fontWeight: 900, cursor: 'pointer', transition: 'all .25s'
          }}>
            VER
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Section label ──────────────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <p style={{ margin: '0 0 .75rem', fontSize: '.62rem', fontWeight: 900,
      textTransform: 'uppercase', letterSpacing: '3px', color: '#444' }}>
      {children}
    </p>
  );
}
