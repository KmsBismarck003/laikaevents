import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useNotification } from '../../context/NotificationContext'
import './Achievements.css'

// SVG icons for each tier (space-themed)
const tierIcons = {
  1: (
    <svg viewBox="0 0 80 80" fill="none"><defs><linearGradient id="t1g" x1="0" y1="0" x2="80" y2="80"><stop offset="0%" stopColor="#667eea"/><stop offset="100%" stopColor="#764ba2"/></linearGradient></defs><circle cx="40" cy="40" r="36" fill="url(#t1g)" opacity="0.2"/><rect x="25" y="18" width="30" height="42" rx="4" fill="url(#t1g)"/><rect x="30" y="24" width="20" height="3" rx="1" fill="white" opacity="0.7"/><rect x="30" y="30" width="15" height="2" rx="1" fill="white" opacity="0.5"/><rect x="30" y="35" width="18" height="2" rx="1" fill="white" opacity="0.5"/><circle cx="40" cy="48" r="5" fill="white" opacity="0.8"/></svg>
  ),
  2: (
    <svg viewBox="0 0 80 80" fill="none"><defs><linearGradient id="t2g" x1="0" y1="80" x2="80" y2="0"><stop offset="0%" stopColor="#f7971e"/><stop offset="100%" stopColor="#ffd200"/></linearGradient></defs><circle cx="40" cy="40" r="36" fill="url(#t2g)" opacity="0.15"/><path d="M40 12L45 35H55L47 45L50 65L40 55L30 65L33 45L25 35H35L40 12Z" fill="url(#t2g)"/><circle cx="40" cy="60" r="8" fill="#f7971e" opacity="0.6"/><path d="M36 58L40 50L44 58" stroke="white" strokeWidth="2" fill="none"/></svg>
  ),
  3: (
    <svg viewBox="0 0 80 80" fill="none"><defs><linearGradient id="t3g" x1="0" y1="0" x2="80" y2="80"><stop offset="0%" stopColor="#00d2ff"/><stop offset="100%" stopColor="#3a7bd5"/></linearGradient></defs><circle cx="40" cy="40" r="36" fill="url(#t3g)" opacity="0.15"/><circle cx="40" cy="40" r="14" fill="none" stroke="url(#t3g)" strokeWidth="2" strokeDasharray="4 2"/><circle cx="40" cy="40" r="22" fill="none" stroke="url(#t3g)" strokeWidth="1.5" opacity="0.5"/><circle cx="40" cy="40" r="6" fill="url(#t3g)"/><circle cx="58" cy="28" r="4" fill="#00d2ff" opacity="0.8"/></svg>
  ),
  4: (
    <svg viewBox="0 0 80 80" fill="none"><defs><linearGradient id="t4g" x1="0" y1="0" x2="80" y2="80"><stop offset="0%" stopColor="#f9d423"/><stop offset="100%" stopColor="#ff4e50"/></linearGradient></defs><circle cx="40" cy="40" r="36" fill="url(#t4g)" opacity="0.15"/><path d="M40 55C50 55 55 50 55 40C55 32 50 25 40 25" stroke="url(#t4g)" strokeWidth="3" fill="none"/><circle cx="40" cy="50" r="3" fill="#f9d423"/><rect x="38" y="20" width="4" height="20" rx="2" fill="url(#t4g)"/><path d="M42 20L50 15" stroke="url(#t4g)" strokeWidth="2"/><polygon points="40,10 42,16 48,16 43,20 45,26 40,22 35,26 37,20 32,16 38,16" fill="#f9d423"/></svg>
  ),
  5: (
    <svg viewBox="0 0 80 80" fill="none"><defs><linearGradient id="t5g" x1="0" y1="0" x2="80" y2="80"><stop offset="0%" stopColor="#bdc3c7"/><stop offset="100%" stopColor="#2c3e50"/></linearGradient></defs><circle cx="40" cy="40" r="36" fill="url(#t5g)" opacity="0.15"/><circle cx="40" cy="40" r="10" fill="url(#t5g)"/><line x1="40" y1="30" x2="40" y2="15" stroke="#bdc3c7" strokeWidth="2"/><line x1="50" y1="40" x2="65" y2="40" stroke="#bdc3c7" strokeWidth="2"/><line x1="30" y1="40" x2="15" y2="40" stroke="#bdc3c7" strokeWidth="2"/><line x1="40" y1="50" x2="40" y2="65" stroke="#bdc3c7" strokeWidth="2"/><circle cx="40" cy="40" r="5" fill="#bdc3c7"/></svg>
  ),
  6: (
    <svg viewBox="0 0 80 80" fill="none"><defs><linearGradient id="t6g" x1="0" y1="0" x2="80" y2="80"><stop offset="0%" stopColor="#eb3349"/><stop offset="100%" stopColor="#f45c43"/></linearGradient></defs><circle cx="40" cy="40" r="36" fill="url(#t6g)" opacity="0.15"/><circle cx="40" cy="38" r="16" fill="url(#t6g)" opacity="0.3"/><path d="M30 50L40 25L50 50" stroke="url(#t6g)" strokeWidth="3" fill="none" strokeLinecap="round"/><line x1="33" y1="44" x2="47" y2="44" stroke="url(#t6g)" strokeWidth="2"/><circle cx="40" cy="30" r="4" fill="#eb3349"/></svg>
  ),
  7: (
    <svg viewBox="0 0 80 80" fill="none"><defs><linearGradient id="t7g" x1="0" y1="0" x2="80" y2="80"><stop offset="0%" stopColor="#6c5ce7"/><stop offset="100%" stopColor="#a29bfe"/></linearGradient></defs><circle cx="40" cy="40" r="36" fill="url(#t7g)" opacity="0.15"/><polygon points="40,12 48,30 68,30 52,42 58,60 40,48 22,60 28,42 12,30 32,30" fill="url(#t7g)"/><circle cx="40" cy="36" r="6" fill="white" opacity="0.3"/></svg>
  ),
  8: (
    <svg viewBox="0 0 80 80" fill="none"><defs><linearGradient id="t8g" x1="0" y1="0" x2="80" y2="80"><stop offset="0%" stopColor="#11998e"/><stop offset="100%" stopColor="#38ef7d"/></linearGradient></defs><circle cx="40" cy="40" r="36" fill="url(#t8g)" opacity="0.15"/><path d="M25 50 Q40 10 55 50" stroke="url(#t8g)" strokeWidth="3" fill="none"/><circle cx="40" cy="30" r="8" fill="url(#t8g)" opacity="0.5"/><path d="M35 55L40 45L45 55" fill="url(#t8g)"/><line x1="40" y1="55" x2="40" y2="65" stroke="url(#t8g)" strokeWidth="2"/></svg>
  ),
  9: (
    <svg viewBox="0 0 80 80" fill="none"><defs><radialGradient id="t9g" cx="40" cy="40" r="30" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#ffecd2"/><stop offset="50%" stopColor="#fcb69f"/><stop offset="100%" stopColor="#ff6b6b"/></radialGradient></defs><circle cx="40" cy="40" r="36" fill="url(#t9g)" opacity="0.15"/><circle cx="40" cy="40" r="12" fill="url(#t9g)"/><circle cx="40" cy="40" r="20" fill="none" stroke="url(#t9g)" strokeWidth="1.5" opacity="0.5"/><circle cx="40" cy="40" r="28" fill="none" stroke="url(#t9g)" strokeWidth="1" opacity="0.3"/><circle cx="40" cy="40" r="5" fill="white" opacity="0.6"/></svg>
  ),
  10: (
    <svg viewBox="0 0 80 80" fill="none"><defs><linearGradient id="t10g" x1="0" y1="0" x2="80" y2="80"><stop offset="0%" stopColor="#f9d423"/><stop offset="50%" stopColor="#ee4d5f"/><stop offset="100%" stopColor="#6c5ce7"/></linearGradient></defs><circle cx="40" cy="40" r="36" fill="url(#t10g)" opacity="0.2"/><polygon points="40,8 46,28 68,28 50,40 56,60 40,48 24,60 30,40 12,28 34,28" fill="url(#t10g)"/><circle cx="40" cy="35" r="8" fill="white" opacity="0.2"/><polygon points="40,22 43,30 51,30 45,35 47,43 40,38 33,43 35,35 29,30 37,30" fill="white" opacity="0.4"/></svg>
  )
}

const phaseNames = {
  gancho: { label: 'Fase 1: El Gancho', subtitle: 'Enganchar al usuario nuevo', color: '#667eea' },
  retencion: { label: 'Fase 2: La Retencion', subtitle: 'Crear habito', color: '#f7971e' },
  fidelizacion: { label: 'Fase 3: La Fidelizacion', subtitle: 'Clientes de alto valor', color: '#eb3349' },
  leyenda: { label: 'Fase 4: La Leyenda', subtitle: 'El objetivo final', color: '#f9d423' }
}

const couponTypeLabels = {
  fee_off_once: 'Service Fee OFF',
  priority_access: 'Preventa Exclusiva',
  discount_percent: 'Descuento %',
  premium_ticket: 'Boleto Premium',
  fee_half: '2x1 en Fees',
  fast_pass: 'Fila Rapida',
  merch_kit: 'Kit de Merch',
  birthday_ticket: 'Boleto de Cumpleanos',
  fee_discount_permanent: 'Descuento Permanente',
  legend_discount: 'Descuento Legendario'
}

const Achievements = () => {
  const { user } = useAuth()
  const { success } = useNotification()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newlyUnlocked, setNewlyUnlocked] = useState([])

  useEffect(() => {
    loadAchievements()
  }, [])

  const loadAchievements = async () => {
    try {
      // First check for new achievements
      try {
        const checkResult = await api.achievements.check()
        if (checkResult.newly_unlocked?.length > 0) {
          setNewlyUnlocked(checkResult.newly_unlocked)
          success(`Desbloqueaste ${checkResult.count} logro(s)!`)
        }
      } catch (e) {
        // Silently fail - achievements module might not be available
      }

      const result = await api.achievements.getAll()
      setData(result)
    } catch (error) {
      console.error('Error loading achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="ach-loading">
        <div className="ach-loading-spinner" />
        <p>Cargando tu progreso interestelar...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="ach-error">
        <p>No se pudieron cargar los logros. Intenta mas tarde.</p>
      </div>
    )
  }

  const { achievements, total_events, total_unlocked, overall_progress } = data

  // Group by phase
  const phases = {}
  achievements.forEach(ach => {
    const phase = ach.phase || 'otros'
    if (!phases[phase]) phases[phase] = []
    phases[phase].push(ach)
  })

  return (
    <div className="achievements-page">
      {/* Hero Section */}
      <div className="ach-hero">
        <div className="ach-hero-bg" />
        <div className="ach-hero-content">
          <h1 className="ach-hero-title">PROGRAMA DE LOGROS</h1>
          <p className="ach-hero-subtitle">LAIKA CLUB</p>

          {/* Overall progress */}
          <div className="ach-progress-wrap">
            <div className="ach-progress-stats">
              <span className="ach-progress-events">{total_events} eventos</span>
              <span className="ach-progress-unlocked">{total_unlocked}/10 logros</span>
            </div>
            <div className="ach-progress-bar">
              <div
                className="ach-progress-fill"
                style={{ width: `${overall_progress}%` }}
              />
            </div>
            <span className="ach-progress-label">{overall_progress}% hacia El Legado Laika</span>
          </div>
        </div>
      </div>

      {/* Newly Unlocked Toast */}
      {newlyUnlocked.length > 0 && (
        <div className="ach-new-unlock-banner">
          <div className="ach-new-unlock-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <div>
            <strong>Nuevo(s) logro(s) desbloqueado(s)!</strong>
            <p>{newlyUnlocked.map(a => a.name).join(', ')}</p>
          </div>
          <button className="ach-dismiss" onClick={() => setNewlyUnlocked([])}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}

      {/* Achievement Phases */}
      <div className="ach-phases">
        {Object.entries(phaseNames).map(([phaseKey, phaseInfo]) => {
          const phaseAchs = phases[phaseKey] || []
          if (phaseAchs.length === 0) return null

          return (
            <div key={phaseKey} className="ach-phase-section">
              <div className="ach-phase-header" style={{ '--phase-color': phaseInfo.color }}>
                <h2 className="ach-phase-title">{phaseInfo.label}</h2>
                <p className="ach-phase-subtitle">{phaseInfo.subtitle}</p>
              </div>

              <div className="ach-grid">
                {phaseAchs.map(ach => (
                  <div
                    key={ach.id}
                    className={`ach-card ${ach.unlocked ? 'unlocked' : 'locked'} ${
                      newlyUnlocked.some(n => n.tier === ach.tier) ? 'newly' : ''
                    }`}
                  >
                    {/* Tier badge */}
                    <div className="ach-tier-badge">Tier {ach.tier}</div>

                    {/* Icon */}
                    <div className="ach-icon-wrap">
                      {tierIcons[ach.tier] || tierIcons[1]}
                    </div>

                    {/* Info */}
                    <h3 className="ach-card-name">{ach.name}</h3>
                    <p className="ach-card-desc">{ach.description}</p>

                    {/* Requirement */}
                    <div className="ach-requirement">
                      {ach.requirement_type === 'register' ? (
                        <span className="ach-req-text">Registrate en LAIKA Club</span>
                      ) : (
                        <>
                          <span className="ach-req-text">
                            {ach.current_events}/{ach.requirement_value} eventos
                          </span>
                          <div className="ach-mini-progress">
                            <div
                              className="ach-mini-fill"
                              style={{ width: `${ach.progress}%` }}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Reward */}
                    <div className="ach-reward">
                      <div className="ach-reward-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5" rx="1"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                        </svg>
                      </div>
                      <span className="ach-reward-text">{ach.reward_description}</span>
                    </div>

                    {/* Status */}
                    {ach.unlocked ? (
                      <div className="ach-unlocked-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        DESBLOQUEADO
                      </div>
                    ) : (
                      <div className="ach-locked-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        BLOQUEADO
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Cupones activos section (if any) */}
      <CouponsList />
    </div>
  )
}

// Sub-component: Active coupons
const CouponsList = () => {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCoupons()
  }, [])

  const loadCoupons = async () => {
    try {
      const result = await api.achievements.getCoupons()
      setCoupons(result)
    } catch (e) {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }

  if (loading || coupons.length === 0) return null

  return (
    <div className="ach-coupons-section">
      <h2 className="ach-coupons-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
        </svg>
        Tus Cupones Activos
      </h2>
      <div className="ach-coupons-grid">
        {coupons.map(coupon => (
          <div key={coupon.id} className="ach-coupon-card">
            <div className="coupon-header">
              <span className="coupon-type">
                {couponTypeLabels[coupon.coupon_type] || coupon.coupon_type}
              </span>
              {coupon.remaining_uses !== -1 && (
                <span className="coupon-uses">{coupon.remaining_uses} uso(s)</span>
              )}
              {coupon.remaining_uses === -1 && (
                <span className="coupon-permanent">Permanente</span>
              )}
            </div>
            <div className="coupon-code">{coupon.coupon_code}</div>
            <div className="coupon-from">
              <span>De: {coupon.achievement_name || 'LAIKA Club'}</span>
            </div>
            {coupon.expires_at && (
              <div className="coupon-expires">
                Expira: {new Date(coupon.expires_at).toLocaleDateString('es-MX')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Achievements
