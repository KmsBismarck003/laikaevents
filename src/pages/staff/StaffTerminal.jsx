import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card, Button, Input, Alert, Icon, PermissionWall, Badge, AnimatedCounter } from '../../components'
import { Camera, Ticket, Search, ShoppingBag, BarChart2, Activity } from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useNotification } from '../../context/NotificationContext'
import QRScanner from './components/QRScanner'
import TicketInfo from './components/TicketInfo'
import StatusMessage from './components/StatusMessage'
import StaffStats from './components/StaffStats'
import StaffHelpDesk from './components/StaffHelpDesk'
import StaffBoxOffice from './components/StaffBoxOffice'
import './StaffDashboard.css'

const StaffTerminal = () => {
    const { user } = useAuth();
    const { success, error: showError, info: showInfo } = useNotification()
    const navigate = useNavigate()
    const location = useLocation()

    const [activeTab, setActiveTab] = useState('scanner')

    // Sync activeTab with URL query parameter
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab && ['scanner', 'helpdesk', 'boxoffice'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [location]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        navigate(`/staff?tab=${tab}`);
    }
    const [selectedEventId, setSelectedEventId] = useState('')
    const [events, setEvents] = useState([])
    
    const [ticketCode, setTicketCode] = useState('')
    const [verificationResult, setVerificationResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [alert, setAlert] = useState(null)
    const [scanHistory, setScanHistory] = useState([])
    const [isScanning, setIsScanning] = useState(false)
    const [accessPoint, setAccessPoint] = useState(() => localStorage.getItem('staff_access_point') || 'Puerta Principal')

    const sessionStats = {
        total: scanHistory.length,
        valids: scanHistory.filter(h => h.status === 'valid' || h.status === 'used').length,
        invalids: scanHistory.filter(h => h.status === 'invalid').length,
        startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    useEffect(() => {
        fetchEvents()
        const savedHistory = localStorage.getItem('staff_scan_history')
        if (savedHistory) {
            try {
                setScanHistory(JSON.parse(savedHistory))
            } catch (e) {
                console.error('Error parsing scan history', e)
            }
        }
    }, [])

    useEffect(() => {
        localStorage.setItem('staff_scan_history', JSON.stringify(scanHistory))
    }, [scanHistory])

    const fetchEvents = async () => {
        try {
            const data = await api.event.getAll({ status_filter: 'published' })
            setEvents(data)
            if (data.length > 0) setSelectedEventId(data[0].id)
        } catch (err) {
            console.error('Error fetching events:', err)
        }
    }

    const handleVerifyTicket = async (code) => {
        const codeToVerify = code || ticketCode
        if (!codeToVerify || !codeToVerify.trim()) {
            setAlert({ type: 'error', message: 'Ingresa un código de boleto' })
            return
        }

        setLoading(true)
        setAlert(null)
        setIsScanning(false)

        try {
            const response = await api.ticket.verify(codeToVerify)
            const result = {
                valid: response.valid || false,
                ticketCode: codeToVerify,
                eventName: response.event?.name || response.eventName || 'Evento desconocido',
                customerName: response.customer?.name || response.customerName || 'Usuario',
                ticketType: response.ticketType || response.ticket_type || 'General',
                purchaseDate: response.purchaseDate || response.purchase_date || new Date().toISOString(),
                scannedAt: new Date().toISOString(),
                alreadyUsed: response.alreadyUsed || response.already_used || false,
                ticketId: response.id || response.ticketId,
                message: response.message
            }

            setVerificationResult(result)
            setTicketCode('')

            let status = 'invalid'
            if (result.valid && !result.alreadyUsed) status = 'valid'
            else if (result.alreadyUsed) status = 'used'

            setScanHistory(prev => [{ ...result, status }, ...prev.slice(0, 19)])

            if (result.valid && !result.alreadyUsed) {
                success('Boleto válido y listo para ingreso')
            } else if (result.alreadyUsed) {
                showError('¡ALERTA! Boleto YA USADO')
            } else {
                showError('Boleto inválido')
            }
        } catch (error) {
            console.error('Error al verificar:', error)
            setAlert({ type: 'error', message: error.message || 'Error de conexión' })
        } finally {
            setLoading(false)
        }
    }

    const handleRedeemTicket = async () => {
        if (!verificationResult || !verificationResult.valid || verificationResult.alreadyUsed) return
        try {
            await api.ticket.redeem(verificationResult.ticketCode)
            success('Entrada registrada exitosamente')
            setVerificationResult(prev => ({ ...prev, alreadyUsed: true, status: 'used' }))
            setScanHistory(prev => prev.map((item, index) =>
                index === 0 ? { ...item, alreadyUsed: true, status: 'used' } : item
            ))
        } catch (error) {
            showError(error.message || 'Error al registrar entrada')
        }
    }

    const resetScanner = () => {
        setVerificationResult(null)
        setAlert(null)
        setTicketCode('')
        setIsScanning(true)
    }

    return (
        <PermissionWall permission="canValidateTickets" label="Terminal de Validación">
        <div className="staff-terminal-container">
            <div className="staff-terminal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Panel de Operación Staff</h1>
                    <div className="subtitle">Gestión de accesos y servicios en tiempo real</div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: '900', color: '#888', textTransform: 'uppercase' }}>Evento Seleccionado</span>
                        <select 
                            value={selectedEventId}
                            onChange={(e) => setSelectedEventId(e.target.value)}
                            className="input-select-mini"
                            style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px 16px', fontSize: '0.9rem', fontWeight: '700' }}
                        >
                            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="health-banner-staff">
                <div style={{ display: 'flex', gap: '2rem' }}>
                    <div>
                        <div className="status-label">Punto de Control</div>
                        <div className="status-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Activity size={16} color="var(--success)" />
                            {accessPoint}
                            <button onClick={() => {
                                const p = prompt('Cambiar Punto de Acceso:', accessPoint);
                                if(p) setAccessPoint(p);
                            }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center' }}>
                                <Icon name="edit" size={12} />
                            </button>
                        </div>
                    </div>
                    <div>
                        <div className="status-label">Estado de Red</div>
                        <div className="status-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div>
                            Sincronizado
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button 
                        size="small" 
                        variant={activeTab === 'scanner' ? 'primary' : 'secondary'}
                        onClick={() => handleTabChange('scanner')}
                    >
                        <Camera size={14} className="mr-2" /> Scanner
                    </Button>
                    <Button 
                        size="small" 
                        variant={activeTab === 'helpdesk' ? 'primary' : 'secondary'}
                        onClick={() => handleTabChange('helpdesk')}
                    >
                        <Search size={14} className="mr-2" /> Ayuda
                    </Button>
                    <Button 
                        size="small" 
                        variant={activeTab === 'boxoffice' ? 'primary' : 'secondary'}
                        onClick={() => handleTabChange('boxoffice')}
                    >
                        <ShoppingBag size={14} className="mr-2" /> Taquilla
                    </Button>
                </div>
            </div>

            <div className="staff-metrics-strip">
                <Card className="metric-mini">
                    <small>Escaneos Sesión</small>
                    <strong><AnimatedCounter value={sessionStats.total} /></strong>
                </Card>
                <Card className="metric-mini">
                    <small>Válidos Hoy</small>
                    <strong style={{ color: 'var(--success)' }}><AnimatedCounter value={sessionStats.valids} /></strong>
                </Card>
                <Card className="metric-mini">
                    <small>Incidencias</small>
                    <strong style={{ color: 'var(--error)' }}><AnimatedCounter value={sessionStats.invalids} /></strong>
                </Card>
                <Card className="metric-mini">
                    <small>Flujo (asist/min)</small>
                    <strong style={{ color: '#000' }}>
                        <AnimatedCounter value={Math.floor(sessionStats.total / Math.max(1, (new Date() - new Date(sessionStats.startTime)) / 60000)) || 0} />
                    </strong>
                </Card>
            </div>

            <div className="staff-tab-content">
                {activeTab === 'scanner' && (
                    <div className="verification-section">
                        {!verificationResult ? (
                            <Card className="scanner-card">
                                {isScanning ? (
                                    <>
                                        <QRScanner onScanSuccess={(text) => handleVerifyTicket(text)} />
                                        <Button variant="outline" fullWidth onClick={() => setIsScanning(false)} style={{ marginTop: '1rem' }}>
                                            Ingresar Código Manualmente
                                        </Button>
                                    </>
                                ) : (
                                    <div className="scanner-container">
                                        <div className="qr-scanner-placeholder" onClick={() => setIsScanning(true)}>
                                            <Camera size={64} className="scanner-icon" />
                                            <p>Tocar para activar cámara</p>
                                        </div>
                                        <div className="scanner-divider"><span>O</span></div>
                                        <form onSubmit={(e) => { e.preventDefault(); handleVerifyTicket(); }}>
                                            <Input
                                                label="Código del Boleto"
                                                value={ticketCode}
                                                onChange={(e) => setTicketCode(e.target.value)}
                                                placeholder="Ej: TKT-12345678"
                                                fullWidth
                                            />
                                            <Button type="submit" variant="primary" size="large" fullWidth loading={loading} disabled={!ticketCode.trim()} style={{ marginTop: '1rem' }}>
                                                Verificar Boleto
                                            </Button>
                                        </form>
                                    </div>
                                )}
                            </Card>
                        ) : (
                            <Card className={`result-card ${verificationResult.status}`}>
                                <StatusMessage status={verificationResult.status} message={verificationResult.message} />
                                <TicketInfo ticket={verificationResult} />
                                {verificationResult.status === 'valid' && (
                                    <Button variant="success" size="large" fullWidth onClick={handleRedeemTicket} style={{ marginTop: '1rem' }}>
                                        Registrar Entrada
                                    </Button>
                                )}
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                    <Button variant="outline" fullWidth onClick={() => {
                                        api.ticket.resendTicket(verificationResult.ticketCode);
                                        success('Boleto reenviado al correo');
                                    }}>
                                        Reenviar
                                    </Button>
                                    <Button variant="secondary" fullWidth onClick={resetScanner}>
                                        Siguiente
                                    </Button>
                                </div>
                            </Card>
                        )}
                        <StaffStats history={scanHistory} />
                    </div>
                )}

                {activeTab === 'helpdesk' && (
                    <StaffHelpDesk eventId={selectedEventId} />
                )}

                {activeTab === 'boxoffice' && (
                    <StaffBoxOffice eventId={selectedEventId} />
                )}
            </div>
        </div>
        </PermissionWall>
    )
}

export default StaffTerminal;
