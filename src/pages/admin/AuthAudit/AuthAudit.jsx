import React, { useState, useEffect, useCallback } from 'react'
import { Badge, Button, SkeletonRow } from '../../../components'
import Skeleton from '../../../components/Skeleton/Skeleton';
import { useNotification } from '../../../context/NotificationContext'
import api from '../../../services/api'
import './admin.css'

/* ── Colores de badges ── */
const EVENT_BADGE_VARIANT = {
    LOGIN_EXITOSO: 'success',
    INTENTO_FALLIDO: 'warning',
    CUENTA_BLOQUEADA: 'danger',
    REGISTRO_NUEVO: 'info',
    LOGOUT: 'neutral',
}
const EVENT_LABEL = {
    LOGIN_EXITOSO: 'LOGIN EXITOSO',
    INTENTO_FALLIDO: 'INTENTO FALLIDO',
    CUENTA_BLOQUEADA: 'CUENTA BLOQUEADA',
    REGISTRO_NUEVO: 'REGISTRO NUEVO',
    LOGOUT: 'LOGOUT',
}

/* ── Detección OS + browser desde user-agent ── */
function parseDevice(ua = '') {
    if (!ua || ua === 'N/A') return { os: '—', browser: '—', icon: null }
    const s = ua.toLowerCase()

    let os = 'Otro'
    let osIcon = null
    if (s.includes('windows')) {
        os = 'Windows'
        osIcon = (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#00adef' }}>
                <path d="M3 5.557L10.54 4.5v7.28H3zm0 12.886L10.54 19.5v-7.28H3zm8.46 1.174L21 21V12.22h-9.54zm0-15.234L21 3v8.78h-9.54z" />
            </svg>
        )
    } else if (s.includes('mac os') || s.includes('macintosh')) {
        os = 'MacOS'
        osIcon = (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#555' }}>
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
        )
    } else if (s.includes('android')) {
        os = 'Android'
        osIcon = (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#3ddc84' }}>
                <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48A5.84 5.84 0 0 0 12 1.75c-.96 0-1.86.23-2.66.63L7.85.9c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31A5.983 5.983 0 0 0 6 8h12a5.983 5.983 0 0 0-2.47-5.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z" />
            </svg>
        )
    } else if (s.includes('iphone') || s.includes('ipad') || s.includes('ios')) {
        os = 'iOS'
        osIcon = (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#555' }}>
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
        )
    } else if (s.includes('linux')) {
        os = 'Linux'
        osIcon = (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#333' }}>
                <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 0 0 .11.247c.01.017.044.04.08.088.128.197.296.538.507.938.403.767.931 1.682 1.785 2.647.86.967 1.739 1.576 2.567 1.706.418.065.822.005 1.167-.188.21-.116.404-.286.558-.506.29-.396.532-.876.74-1.36a8.22 8.22 0 0 0 .28-.75c.105-.344.186-.693.22-1.04.046-.455.254-.865.62-1.086.296-.178.638-.192.987-.032.3.14.532.396.686.73.143.318.204.682.2 1.046-.007.716-.196 1.457-.472 2.102-.267.63-.601 1.149-.944 1.482.11.147.214.293.337.434.378.432.876.772 1.458.969.608.203 1.258.258 1.898.15a4.78 4.78 0 0 0 1.793-.745 5.15 5.15 0 0 0 1.338-1.378c.304-.434.55-.914.738-1.41.183-.485.307-.994.353-1.52.053-.63-.017-1.244-.239-1.762-.3-.703-.84-1.164-1.5-1.347-.313-.088-.645-.116-.98-.112-.32.005-.636.045-.937.096-.59.101-1.14.27-1.556.465a.423.423 0 0 1-.126.029c-.047 0-.104-.007-.173-.024-.157-.038-.345-.11-.533-.22-.188-.107-.359-.238-.484-.368-.118-.124-.196-.248-.213-.357-.02-.127.03-.26.21-.422.362-.325 1.024-.65 1.8-.893.78-.243 1.666-.39 2.485-.408.408-.008.803.017 1.17.085.366.067.703.18.987.352.552.334.897.862.981 1.544.046.374-.004.79-.151 1.218l-.048.153-.004.014a.21.21 0 0 0 .021.13c.06.095.161.152.296.155h.005c.108 0 .189-.023.237-.05a.248.248 0 0 0 .074-.086c.046-.095.07-.244.076-.447.012-.459-.064-1.074-.267-1.697-.207-.633-.548-1.275-1.05-1.797-.504-.527-1.175-.912-2.004-1.065a7.87 7.87 0 0 0-1.477-.09c-1.016.027-2.121.222-3.082.563-.49.172-.947.392-1.35.672-.386.27-.712.6-.918.997-.19.366-.254.776-.158 1.188.099.419.332.788.665 1.094.171.156.36.3.568.43.204.131.426.247.663.346.47.198.99.34 1.5.419l.005.002c.025.003.05.005.076.007.198.014.41.005.592-.04.362-.09.653-.305.86-.622.22-.337.32-.773.284-1.233-.03-.388-.148-.748-.3-1.017-.11-.197-.235-.34-.352-.42-.053-.036-.1-.058-.14-.069a.304.304 0 0 0-.087-.012.36.36 0 0 0-.148.034zm.037.908a.44.44 0 0 1 .04.01c.024.007.057.01.103.01.01 0 .018.002.024.004.02.01.052.044.092.104.08.122.17.33.224.573.107.48.09 1.04-.08 1.487-.173.455-.504.767-.933.888-.43.12-.958.087-1.427-.098a3.36 3.36 0 0 1-.59-.302 3.05 3.05 0 0 1-.496-.374c-.283-.27-.455-.582-.527-.908-.073-.33-.03-.679.107-.973.136-.293.37-.541.67-.748.317-.215.72-.4 1.184-.554.82-.276 1.75-.43 2.584-.45.42-.01.826.012 1.189.076.368.064.7.174.97.344.52.315.834.807.912 1.464.042.346-.001.74-.135 1.126l-.05.156-.005.014c.001.018.009.038.024.056.034.042.099.073.187.074.065 0 .117-.015.145-.03.027-.016.04-.032.046-.055.04-.082.067-.22.073-.41.012-.43-.062-1.02-.255-1.617-.194-.596-.514-1.19-.968-1.658-.455-.468-1.067-.8-1.8-.933a6.959 6.959 0 0 0-1.29-.076c-.92.024-1.941.212-2.829.526-.44.155-.85.35-1.206.597-.342.238-.628.538-.8.889-.158.333-.208.698-.124 1.06.088.37.295.695.582.965.155.142.327.271.52.39.193.12.408.233.64.333.46.196.979.337 1.483.416l.003.001c.023.004.045.005.07.007.18.013.37.002.527-.038.32-.082.576-.264.755-.548.19-.305.277-.688.247-1.104-.027-.346-.13-.665-.264-.9-.094-.17-.2-.296-.297-.362z" />
            </svg>
        )
    }

    // Browser
    let browser = ''
    if (s.includes('chrome') && !s.includes('edg') && !s.includes('opr')) browser = 'Chrome'
    else if (s.includes('firefox')) browser = 'Firefox'
    else if (s.includes('safari') && !s.includes('chrome')) browser = 'Safari'
    else if (s.includes('edg')) browser = 'Edge'
    else if (s.includes('opr') || s.includes('opera')) browser = 'Opera'

    return { os, browser, icon: osIcon }
}

function formatDate(str) {
    if (!str) return '—'
    const d = new Date(str)
    return isNaN(d) ? str : d.toLocaleString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    })
}

const ROLE_OPTIONS = ['', 'admin', 'gestor', 'operador', 'usuario']
const EVENT_OPTIONS = ['', 'LOGIN_EXITOSO', 'INTENTO_FALLIDO', 'CUENTA_BLOQUEADA', 'REGISTRO_NUEVO', 'LOGOUT']

const AuthAudit = () => {
    const { error: notifyError } = useNotification()
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchText, setSearchText] = useState('')
    const [filterRole, setFilterRole] = useState('')
    const [filterEvent, setFilterEvent] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 15

    const fetchLogs = useCallback(async () => {
        setLoading(true)
        try {
            const params = { limit: 500 }
            if (filterRole) params.role = filterRole
            if (filterEvent) params.event_type = filterEvent
            const data = await api.auth.getAuditLogs(params)
            setLogs(Array.isArray(data) ? data : [])
            setCurrentPage(1)
        } catch (err) {
            console.error('[AuthAudit]', err)
            notifyError('No se pudieron cargar los registros de auditoría')
            setLogs([])
        } finally {
            setLoading(false)
        }
    }, [filterRole, filterEvent, notifyError])

    useEffect(() => { fetchLogs() }, [fetchLogs])

    const filtered = logs.filter(log => {
        if (!searchText) return true
        const q = searchText.toLowerCase()
        return ['email', 'user_name', 'role', 'event_type', 'ip_address', 'summary'].some(
            k => (log[k] || '').toLowerCase().includes(q)
        )
    })

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

    /* ── Estilos inline compactos ── */
    const selectStyle = {
        padding: '0.4rem 0.6rem',
        border: '1.5px solid var(--border-color, #e5e7eb)',
        borderRadius: '6px',
        fontSize: '0.78rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        background: '#fff',
        cursor: 'pointer',
        outline: 'none',
        height: '34px'
    }

    return (
        <div className='admin-section'>
            {/* Header */}
            <div className='admin-header'>
                <div>
                    <h1 className='admin-title' style={{ fontSize: '1.4rem' }}>AUDITORÍA DE ACCESOS</h1>
                    <p className='admin-subtitle' style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>
                        {loading ? <Skeleton style={{ height: '12px', width: '80px', borderRadius: '4px' }} animate /> : `${filtered.length} registro${filtered.length !== 1 ? 's' : ''}`}
                    </p>
                </div>
                <Button variant='outline' size='sm' onClick={fetchLogs} loading={loading}>
                    Actualizar
                </Button>
            </div>

            {/* ── Filtros compactos — una sola fila sin altura extra ── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 150px 180px',
                gap: '0.5rem',
                alignItems: 'center',
                marginBottom: '0.75rem',
                background: '#fff',
                border: '1px solid var(--border-color, #e5e7eb)',
                borderRadius: '8px',
                padding: '0.4rem 0.6rem'
            }}>
                <input
                    type='text'
                    placeholder='Buscar por email, usuario, IP...'
                    value={searchText}
                    onChange={e => { setSearchText(e.target.value); setCurrentPage(1) }}
                    style={{
                        ...selectStyle,
                        width: '100%',
                        fontWeight: 400,
                        textTransform: 'none',
                        letterSpacing: 0,
                        boxSizing: 'border-box'
                    }}
                />
                <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setCurrentPage(1) }} style={selectStyle}>
                    {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r ? r.toUpperCase() : 'Todos los roles'}</option>)}
                </select>
                <select value={filterEvent} onChange={e => { setFilterEvent(e.target.value); setCurrentPage(1) }} style={selectStyle}>
                    {EVENT_OPTIONS.map(e => <option key={e} value={e}>{e ? (EVENT_LABEL[e] || e) : 'Todos los eventos'}</option>)}
                </select>
            </div>

            {/* ── Tabla principal ── */}
            <div className='admin-card'>
                {loading ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
                                {['FECHA Y HORA', 'USUARIO', 'EVENTO', 'IP', 'DISPOSITIVO', 'INTENTOS', 'RESUMEN'].map(h => (
                                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} columns={7} />)}
                        </tbody>
                    </table>
                ) : filtered.length === 0 ? (
                    <div className='admin-empty'>
                        <p>No hay registros de auditoría todavía.</p>
                        <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.35rem' }}>
                            Los eventos aparecen aquí en cuanto alguien inicia sesión o se registra.
                        </p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className='admin-table'>
                            <thead>
                                <tr>
                                    <th>FECHA Y HORA</th>
                                    <th>USUARIO (IDENTIDAD)</th>
                                    <th>EVENTO</th>
                                    <th>DIRECCIÓN IP</th>
                                    <th>DISPOSITIVO</th>
                                    <th>INTENTOS</th>
                                    <th>RESUMEN</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((log, i) => {
                                    const device = parseDevice(log.user_agent)
                                    return (
                                        <tr key={log.id ?? i}>
                                            <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem', color: '#111' }}>
                                                {formatDate(log.created_at)}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{
                                                        width: 32, height: 32, borderRadius: '50%',
                                                        background: '#f3f4f6', display: 'flex',
                                                        alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.85rem', fontWeight: 700, color: '#6b7280',
                                                        flexShrink: 0
                                                    }}>
                                                        {(log.user_name || log.email || '?')[0].toUpperCase()}
                                                    </div>
                                                    <div style={{ lineHeight: 1.3 }}>
                                                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#000' }}>{log.user_name || '—'}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#555' }}>{log.email || '—'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <Badge variant={EVENT_BADGE_VARIANT[log.event_type] || 'neutral'} rounded>
                                                    {(EVENT_LABEL[log.event_type] || log.event_type || '—').toUpperCase()}
                                                </Badge>
                                            </td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#111' }}>
                                                {log.ip_address || '—'}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    {device.icon}
                                                    <div style={{ lineHeight: 1.2 }}>
                                                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#000' }}>{device.os}</div>
                                                        {device.browser && (
                                                            <div style={{ fontSize: '0.72rem', color: '#555' }}>{device.browser}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    width: 26, height: 26, borderRadius: '50%',
                                                    border: '1.5px solid var(--border-color, #e5e7eb)',
                                                    fontSize: '0.75rem', fontWeight: 700, color: '#374151'
                                                }}>
                                                    1
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.82rem', color: '#444', maxWidth: 220 }}>
                                                {log.summary || '—'}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Paginación */}
                {!loading && totalPages > 1 && (
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '1rem', padding: '0.75rem 1rem',
                        borderTop: '1px solid var(--border-color, #e5e7eb)'
                    }}>
                        <Button variant='outline' size='sm' disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>← Anterior</Button>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Pág. {currentPage} / {totalPages}</span>
                        <Button variant='outline' size='sm' disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Siguiente →</Button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AuthAudit
