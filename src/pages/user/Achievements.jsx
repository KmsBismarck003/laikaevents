import React, { useState, useEffect } from 'react'
import { achievementsAPI } from '../../services/api'
import Icon from '../../components/Icons'
import { PermissionWall } from '../../components'
import { useAuth } from '../../context/AuthContext'
import './Achievements.css'

/* ── Tier definitions — icons only, vivid colors ────────────── */
const TIER_DATA = [
  { tier: 1, label: 'Pasaporte Cósmico', icon: 'map', color: '#3b82f6', pts: 0, phase: 'GANCHO', reward: 'Sin cargos de servicio' },
  { tier: 2, label: 'Ignición: T-Minus 0', icon: 'zap', color: '#22c55e', pts: 100, phase: 'GANCHO', reward: '15% de Descuento' },
  { tier: 3, label: 'Órbita Baja', icon: 'wind', color: '#06b6d4', pts: 300, phase: 'GANCHO', reward: '25% de Descuento' },
  { tier: 4, label: 'Alunizaje VIP', icon: 'moon', color: '#8b5cf6', pts: 500, phase: 'RETENCIÓN', reward: 'Acceso Preferencial' },
  { tier: 5, label: 'Piloto Sputnik', icon: 'send', color: '#ec4899', pts: 1000, phase: 'RETENCIÓN', reward: 'Regalo Oficial' },
  { tier: 6, label: 'Viajero de Marte', icon: 'globe', color: '#f59e0b', pts: 2000, phase: 'RETENCIÓN', reward: 'Sorteo Conocer Artista' },
  { tier: 7, label: 'Comandante Interestelar', icon: 'shield', color: '#ef4444', pts: 5000, phase: 'FIDELIZACIÓN', reward: 'Preventa Exclusiva' },
  { tier: 8, label: 'Salto al Hiperespacio', icon: 'fast-forward', color: '#10b981', pts: 7500, phase: 'FIDELIZACIÓN', reward: 'Prueba de Sonido' },
  { tier: 9, label: 'Supernova', icon: 'sun', color: '#a855f7', pts: 9000, phase: 'FIDELIZACIÓN', reward: 'Paquete Hospitalidad' },
  { tier: 10, label: 'El Legado Laika', icon: 'crown', color: '#eab308', pts: 10000, phase: 'LEYENDA', reward: 'MEMBRESÍA VITALICIA' },
]

function getTier(pts)     { let t = TIER_DATA[0]; for (const td of TIER_DATA) { if (pts >= td.pts) t = td } return t }
function getNextTier(pts) { return TIER_DATA.find(td => td.pts > pts) || null }

export default function Achievements() {
  const { user } = useAuth()
  const [data,    setData]    = useState(null)
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const [ach, coup] = await Promise.all([
          achievementsAPI.getAll(),
          achievementsAPI.getCoupons()
        ])
        setData(ach)
        setCoupons(Array.isArray(coup) ? coup : [])
      } catch (err) {
        console.error("Error fetching achievements:", err);
      } finally { 
        setLoading(false) 
      }
    })()
  }, [])

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem', padding:'2rem' }}>
      {[1,2,3].map(i => <div key={i} style={{ height:'60px', borderRadius:'12px', background:'rgba(255,255,255,.04)' }} />)}
    </div>
  )

  const points    = data?.total_points || 0
  const tier      = getTier(points)
  const nextTier  = getNextTier(points)
  const ptsToNext = nextTier ? nextTier.pts - points : 0

  return (
    <PermissionWall 
      permission="canViewAchievements" 
      title="SISTEMA DE LOGROS BLOQUEADO"
      description="Para ver tus beneficios necesitas nivel de acceso premium."
    >
      <div className="achievements-container" style={{ padding: '1.5rem', background: '#ffffff' }}>
        
        {/* ── COMPACT HERO ────────────────────────────────────────── */}
        <div style={{ 
          background: '#000000', border: '2px solid rgba(255,255,255,0.1)', 
          borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
          color: '#ffffff'
        }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 900, letterSpacing: '2px' }}>LAIKA CLUB</h1>
            <p style={{ fontSize: '.75rem', opacity: 0.8, margin: 0 }}>Estatus actual: <strong style={{ color: tier.color }}>{tier.label}</strong></p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '.8rem', fontWeight: 900 }}>{points} XP</div>
              {nextTier && <div style={{ fontSize: '.6rem', color: '#ffffff', opacity: 0.6 }}>-{ptsToNext} XP para el siguiente</div>}
            </div>
            <div style={{ width: '40px', height: '40px', background: `${tier.color}30`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tier.color, border: `2px solid ${tier.color}` }}>
              <Icon name={tier.icon} size={20} />
            </div>
          </div>
        </div>

        {/* ── PHASES SECTION ──────────────────────────────────────── */}
        <div className="phases-container">
          {['GANCHO', 'RETENCIÓN', 'FIDELIZACIÓN', 'LEYENDA'].map((phaseName, phaseIdx) => {
            const phaseTiers = TIER_DATA.filter(t => t.phase === phaseName);
            const phaseProgress = phaseTiers.filter(t => points >= t.pts).length;
            const totalInPhase = phaseTiers.length;
            
            return (
              <section key={phaseName} className="ach-phase-section" style={{ marginBottom: '1.5rem' }}>
                <div className="phase-header" style={{ marginBottom: '.75rem', paddingBottom: '.5rem', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 900, opacity: 0.2, color: '#000000' }}>0{phaseIdx + 1}</span>
                    <h2 style={{ fontSize: '1.2rem', margin: 0, letterSpacing: '1px', color: '#000000', fontWeight: 900 }}>{phaseName}</h2>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                     <span style={{ fontSize: '.7rem', fontWeight: 950, color: '#000000' }}>{phaseProgress}/{totalInPhase}</span>
                     <div style={{ width: '80px', height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(phaseProgress/totalInPhase)*100}%`, background: '#000000', borderRadius: '10px' }} />
                     </div>
                  </div>
                </div>

                <div className="achievements-grid" style={{ gap: '.75rem' }}>
                  {phaseTiers.map(t => {
                    const isUnlocked = points >= t.pts;
                    const phaseClass = `phase-${phaseName.toLowerCase()}`;
                    
                    // Progress for THIS specific tier - always show it, can be zero
                    const tierProgress = t.pts === 0 ? 100 : Math.min(100, (points / t.pts) * 100);
                    
                    return (
                      <div 
                        key={t.tier} 
                        className={`achievement-card ${phaseClass}`}
                        style={{ 
                          padding: '.75rem 1.25rem', 
                          minHeight: '90px', 
                          display: 'flex', 
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: '1.5rem',
                          background: '#ffffff',
                          border: `1px solid ${isUnlocked ? `${t.color}40` : 'rgba(0,0,0,0.05)'}`,
                          borderRadius: '16px'
                        }}
                      >
                        {!isUnlocked && (
                          <div className="lock-status" style={{ top: '.6rem', right: '.6rem', opacity: 0.2, color: '#000000' }}>
                            <Icon name="lock" size={14} />
                          </div>
                        )}
                        
                        {/* LEFT: Icon & Badge */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.4rem', minWidth: '85px' }}>
                          <div className="ach-card-icon" style={{ 
                            width: '44px', height: '44px', 
                            background: `${t.color}15`, 
                            color: t.color,
                            border: `1px solid ${t.color}25`,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Icon name={t.icon} size={24} />
                          </div>
                          <span style={{ fontSize: '.6rem', fontWeight: 950, color: t.color, letterSpacing: '1.5px', marginTop: '.2rem' }}>
                            NIVEL {t.tier}
                          </span>
                        </div>

                        {/* MIDDLE: Info & Progress Bar */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 950, color: '#000000' }}>{t.label}</h3>
                            <span style={{ fontSize: '.65rem', fontWeight: 950, color: t.color }}>
                              {Math.floor(tierProgress)}%
                            </span>
                          </div>
                          
                          {/* Progress Bar - Stretched horizontal */}
                          <div style={{ height: '8px', background: 'rgba(0,0,0,0.03)', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{ 
                              height: '100%', 
                              width: `${tierProgress}%`, 
                              background: tierProgress > 0 ? t.color : 'transparent',
                              boxShadow: tierProgress > 0 ? `0 0 15px ${t.color}40` : 'none',
                              transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                              borderRadius: '10px'
                            }} />
                          </div>

                          <p style={{ fontSize: '.8rem', margin: 0, fontWeight: 700, color: '#000000', opacity: 0.7, lineHeight: '1.4' }}>
                            {t.pts === 0 
                              ? 'Para desbloquear este nivel solo necesitas registrarte en LAIKA.' 
                              : `Para desbloquear este nivel necesitas ir o asistir a ${t.pts / 100} eventos.`}
                          </p>
                        </div>

                        {/* RIGHT: Status Only */}
                        <div style={{ minWidth: '120px', display: 'flex', justifyContent: 'flex-end' }}>
                          {isUnlocked ? (
                            <div style={{ color: t.color, fontSize: '.7rem', fontWeight: 950, display: 'flex', alignItems: 'center', gap: '.4rem', background: `${t.color}10`, padding: '.5rem 1rem', borderRadius: '10px', border: `1px solid ${t.color}20` }}>
                              <Icon name="check-circle" size={16} /> LOGRADO
                            </div>
                          ) : (
                            <div style={{ color: '#000000', fontSize: '.65rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '.4rem', opacity: 0.15 }}>
                              <Icon name="lock" size={14} /> BLOQUEADO
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* ── BENEFITS & COUPONS SECTION ───────────────────────────── */}
        <section className="coupons-section" style={{ marginTop: '2rem', padding: '1.5rem', background: '#ffffff', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'left', fontWeight: 950, color: '#000000', letterSpacing: '1px' }}>Tus Beneficios</h2>
          
          <div className="coupons-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {/* 1. Mapped Tier Rewards (Unlocked) */}
            {TIER_DATA.filter(t => points >= t.pts && t.reward).map((t, i) => (
              <div key={`tier-reward-${i}`} className="coupon-card" style={{ border: `2px solid ${t.color}`, background: '#ffffff', boxShadow: `0 8px 20px ${t.color}15` }}>
                <div className="coupon-main" style={{ padding: '1.25rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.75rem' }}>
                    <div style={{ background: `${t.color}20`, color: t.color, padding: '.4rem', borderRadius: '8px', display: 'flex' }}>
                      <Icon name={t.icon} size={20} />
                    </div>
                    <span style={{ fontSize: '.6rem', fontWeight: 950, color: t.color, letterSpacing: '1px' }}>RECOMPENSA DE NIVEL {t.tier}</span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 950, color: '#000', margin: 0 }}>{t.reward}</h3>
                  <p style={{ fontSize: '.7rem', color: '#000', opacity: 0.6, margin: '.4rem 0 0 0', fontWeight: 600 }}>Obtenido por alcanzar el rango {t.label}</p>
                </div>
                <div style={{ padding: '.6rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '.65rem', fontWeight: 950, color: t.color }}>✓ BENEFICIO ACTIVO</span>
                  <div style={{ background: '#000000', color: '#ffffff', padding: '.3rem .6rem', borderRadius: '6px', fontSize: '.55rem', fontWeight: 950 }}>PERMANENTE</div>
                </div>
              </div>
            ))}

            {/* 2. Mapped Coupons (API) */}
            {coupons.length > 0 && coupons.map((c, i) => (
              <div key={`coupon-${i}`} className="coupon-card" style={{ border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 8px 20px rgba(0,0,0,0.05)' }}>
                <div className="coupon-main" style={{ padding: '1.25rem' }}>
                  <div className="coupon-info">
                    <h3 style={{ fontSize: '.75rem', fontWeight: 900, marginBottom: '.5rem', color: '#000' }}>{c.description || 'CUPÓN ESPECIAL'}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span className="coupon-code" style={{ fontSize: '1.6rem', fontWeight: 950, color: '#000', letterSpacing: '2px' }}>{c.code}</span>
                      <button className="copy-btn" onClick={() => {
                        navigator.clipboard.writeText(c.code)
                        alert('¡Código copiado!')
                      }} style={{ width: '40px', height: '40px', background: '#000', color: '#FFF', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="copy" size={18} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="coupon-footer" style={{ padding: '.6rem 1.25rem', borderTop: '1px dotted rgba(0,0,0,0.1)' }}>
                  <span className="expiry-text" style={{ fontSize: '.6rem', fontWeight: 800, color: '#000', opacity: 0.5 }}>
                    {c.expires_at ? `EXPIRA: ${new Date(c.expires_at).toLocaleDateString()}` : 'CUPÓN PERMANENTE'}
                  </span>
                  <div className="status-tag available" style={{ fontSize: '.6rem', fontWeight: 950, background: '#000', color: '#FFF' }}>DISPONIBLE</div>
                </div>
              </div>
            ))}

            {TIER_DATA.filter(t => points >= t.pts && t.reward).length === 0 && coupons.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#000', background: 'rgba(0,0,0,0.02)', borderRadius: '16px', border: '2px dashed rgba(0,0,0,0.05)' }}>
                <Icon name="gift" size={40} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                <p style={{ fontSize: '.85rem', fontWeight: 700 }}>Aún no tienes beneficios o cupones activos.</p>
                <p style={{ fontSize: '.7rem', opacity: 0.5 }}>¡Sigue asistiendo a eventos para desbloquear recompensas cósmicas!</p>
              </div>
            )}
          </div>
        </section>

      </div>
    </PermissionWall>
  )
}
