import React, { useState, useEffect } from 'react'
import { Card, Button, Input, Alert, Badge } from '../../components'
import api from '../../services/api'
import { useNotification } from '../../context/NotificationContext'
import './StaffDashboard.css'
import QRScanner from './components/QRScanner'
import TicketInfo from './components/TicketInfo'
import StatusMessage from './components/StatusMessage'

const StaffDashboard = () => {
  const { success, error: showError } = useNotification()
  const [ticketCode, setTicketCode] = useState('')
  const [verificationResult, setVerificationResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)
  const [scanHistory, setScanHistory] = useState([])
  const [isScanning, setIsScanning] = useState(false)

  // Cargar historial del localStorage al iniciar
  useEffect(() => {
    const savedHistory = localStorage.getItem('staff_scan_history')
    if (savedHistory) {
      try {
        setScanHistory(JSON.parse(savedHistory))
      } catch (e) {
        console.error('Error parsing scan history', e)
      }
    }
  }, [])

  // Guardar historial en localStorage cuando cambia
  useEffect(() => {
    localStorage.setItem('staff_scan_history', JSON.stringify(scanHistory))
  }, [scanHistory])

  const handleVerifyTicket = async (code) => {
    const codeToVerify = code || ticketCode

    if (!codeToVerify || !codeToVerify.trim()) {
      setAlert({ type: 'error', message: 'Ingresa un código de boleto' })
      return
    }

    setLoading(true)
    setAlert(null)
    setIsScanning(false) // Detener escáner al procesar

    try {
      console.log('📤 Verificando boleto:', codeToVerify)

      const response = await api.ticket.verify(codeToVerify)
      console.log('✅ Respuesta de verificación:', response)

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
      setTicketCode('') // Limpiar input manual

      // Determinar estado para el historial
      let status = 'invalid'
      if (result.valid && !result.alreadyUsed) status = 'valid'
      else if (result.alreadyUsed) status = 'used'

      // Agregar al historial (evitar duplicados consecutivos)
      setScanHistory(prev => {
        const newHistory = [{ ...result, status }, ...prev.slice(0, 19)]
        return newHistory
      })

      // Generar alertas/notificaciones
      if (result.valid && !result.alreadyUsed) {
        success('Boleto válido y listo para ingreso')
        // Opcional: Auto-canjear si se desea flujo rápido
        // handleRedeemTicket(result.ticketCode)
      } else if (result.alreadyUsed) {
        showError('¡ALERTA! Boleto YA USADO / VENCIDO')
        const usedTime = result.usedAt ? new Date(result.usedAt).toLocaleTimeString() : 'anteriormente'
        setAlert({
            type: 'warning',
            message: `Este boleto ya fue canjeado a las ${usedTime} por ${result.customerName}. Acceso denegado.`
        })
      } else {
        showError('Boleto inválido o no encontrado')
        setAlert({ type: 'error', message: result.message || 'Boleto no válido' })
      }

    } catch (error) {
      console.error('❌ Error al verificar boleto:', error)
      const errorMsg = error.message || 'Error de conexión o boleto inexistente'
      setAlert({ type: 'error', message: errorMsg })
      showError(errorMsg)

      // Registrar error en historial
      const failedResult = {
        valid: false,
        ticketCode: codeToVerify,
        eventName: 'Error / No encontrado',
        scannedAt: new Date().toISOString(),
        status: 'invalid'
      }
      setScanHistory(prev => [failedResult, ...prev.slice(0, 19)])
    } finally {
      setLoading(false)
    }
  }

  const handleRedeemTicket = async () => {
    if (!verificationResult || !verificationResult.valid || verificationResult.alreadyUsed) {
        return
    }

    try {
      console.log('📤 Canjeando boleto:', verificationResult.ticketCode)
      const response = await api.ticket.redeem(verificationResult.ticketCode)
      console.log('✅ Respuesta canje:', response)

      success('Entrada registrada exitosamente')

      // Actualizar estado local INMEDIATAMENTE para bloquear botones
      setVerificationResult(prev => ({
        ...prev,
        alreadyUsed: true,
        status: 'used',
        usedAt: new Date().toISOString() // Simular timestamp para feedback inmediato
      }))

      // Actualizar historial
       setScanHistory(prev => prev.map((item, index) =>
         index === 0 ? { ...item, alreadyUsed: true, status: 'used', usedAt: new Date().toISOString() } : item
       ))

       // Forzar una re-verificación silenciosa para asegurar que el backend se actualizó
       // setTimeout(() => handleVerifyTicket(verificationResult.ticketCode), 500)

    } catch (error) {
      console.error('❌ Error al canjear boleto:', error)
      showError(error.message || 'Error al registrar entrada')
    }
  }

  // Debug helper
  const handleDebugRedeem = async () => {
       try {
           console.log("🐞 DEBUG: Intentando canje manual...")
           const res = await api.ticket.redeem(verificationResult.ticketCode)
           console.log("🐞 DEBUG Resultado:", res)
           alert("Canje exitoso (DEBUG): " + JSON.stringify(res))
           handleRedeemTicket() // Actualizar UI
       } catch (e) {
           console.error("🐞 DEBUG Error:", e)
           alert("Error canje (DEBUG): " + e.message)
       }
  }

  const handleScanSuccess = (decodedText) => {
    if (loading) return
    console.log("QR Escaneado:", decodedText)
    handleVerifyTicket(decodedText)
  }

  const resetScanner = () => {
    setVerificationResult(null)
    setAlert(null)
    setTicketCode('')
    setIsScanning(true)
  }

  // --- Render Helpers ---

  const renderVerificationResult = () => {
    if (!verificationResult) return null

    let status = 'invalid'
    if (verificationResult.valid && !verificationResult.alreadyUsed) status = 'valid'
    else if (verificationResult.alreadyUsed) status = 'used'

    return (
      <Card className={`result-card ${status}`}>
        <StatusMessage
            status={status}
            message={verificationResult.message}
        />

        <TicketInfo ticket={verificationResult} />

        {status === 'valid' && (
          <div className="result-actions">
            <Button variant="success" size="large" fullWidth onClick={handleRedeemTicket}>
              Registrar Entrada (Check-In)
            </Button>
            {/* Botón de Debug Temporal */}
            <Button variant="outline" size="small" onClick={handleDebugRedeem} style={{ marginTop: '10px', opacity: 0.7 }}>
                🐞 Forzar Canje (Debug)
            </Button>
          </div>
        )}

        <div className="result-actions" style={{ marginTop: '1rem' }}>
             <Button variant="secondary" fullWidth onClick={resetScanner}>
              Escanear Otro Boleto
            </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="staff-dashboard">
      <div className="dashboard-header">
        <h1>Control de Acceso</h1>
        <p>Sistema de Verificación de Boletos</p>
      </div>

      {alert && !verificationResult && (
        <Alert
          type={alert.type}
          message={alert.message}
          closable
          onClose={() => setAlert(null)}
          style={{ marginBottom: '2rem' }}
        />
      )}

      <div className="verification-section">
        {/* Panel Izquierdo: Escáner o Entrada Manual */}
        <div className="input-panel">
            {!verificationResult ? (
                <Card className="scanner-card">
                    {isScanning ? (
                        <>
                            <QRScanner
                                onScanSuccess={handleScanSuccess}
                                onScanFailure={(err) => console.debug(err)} // Ignore errors mostly
                            />
                            <div className="scanner-divider"><span>O</span></div>
                            <Button variant="outline" fullWidth onClick={() => setIsScanning(false)}>
                                Ingresar Código Manualmente
                            </Button>
                        </>
                    ) : (
                        <div className="scanner-container">
                            <div
                                className="qr-scanner-placeholder"
                                onClick={() => setIsScanning(true)}
                                style={{ cursor: 'pointer' }}
                            >
                                <span className="scanner-icon">📷</span>
                                <p>Tocar para activar cámara</p>
                            </div>

                            <div className="scanner-divider"><span>O</span></div>

                            <form onSubmit={(e) => { e.preventDefault(); handleVerifyTicket(); }} className="manual-entry">
                                <Input
                                    label="Código del Boleto"
                                    name="ticketCode"
                                    value={ticketCode}
                                    onChange={(e) => setTicketCode(e.target.value)}
                                    placeholder="Ej: TKT-12345678"
                                    icon={<span>🎫</span>}
                                    fullWidth
                                    autoFocus
                                />
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="large"
                                    fullWidth
                                    loading={loading}
                                    disabled={!ticketCode.trim()}
                                >
                                    Verificar Boleto
                                </Button>
                            </form>
                        </div>
                    )}
                </Card>
            ) : (
                renderVerificationResult()
            )}
        </div>

        {/* Panel Derecho: Estadísticas + Historial (Podría ser una columna lateral en desktop) */}
        {/* Por ahora lo mantenemos abajo para simpleza en móvil */}
      </div>

      <Card title="Estadísticas de la Sesión" className="stats-card">
        <div className="daily-stats">
          <div className="stat-item">
            <span className="stat-number">
              {scanHistory.filter(s => s.status === 'valid' || (s.valid && !s.alreadyUsed)).length}
            </span>
            <span className="stat-label">Válidos</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {scanHistory.filter(s => s.status === 'used' || s.alreadyUsed).length}
            </span>
            <span className="stat-label">Ya Usados</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
                {scanHistory.filter(s => s.status === 'invalid' || (!s.valid && !s.alreadyUsed)).length}
            </span>
            <span className="stat-label">Inválidos</span>
          </div>
        </div>
      </Card>

      <Card title="Historial Reciente" className="history-card">
        {scanHistory.length === 0 ? (
          <div className="empty-history">
            <p>No hay verificaciones recientes</p>
          </div>
        ) : (
          <div className="history-list">
            {scanHistory.map((scan, index) => (
              <div key={index} className="history-item">
                <div className="history-icon">
                  {scan.status === 'valid' ? '✅' : scan.status === 'used' ? '⚠️' : '❌'}
                </div>
                <div className="history-info">
                  <strong>{scan.ticketCode}</strong>
                  <p>{scan.eventName || 'Desconocido'}</p>
                  <small>{new Date(scan.scannedAt).toLocaleTimeString()}</small>
                </div>
                <Badge variant={
                    scan.status === 'valid' ? 'success' :
                    scan.status === 'used' ? 'warning' : 'danger'
                }>
                    {scan.status === 'valid' ? 'Válido' :
                     scan.status === 'used' ? 'Usado' : 'Inválido'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

export default StaffDashboard
