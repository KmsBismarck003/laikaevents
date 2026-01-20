import React, { useState } from 'react'
import { Card, Button, Input, Alert, Badge } from '../components'
import api from '../services/api' // ← IMPORTAR API
import { useNotification } from '../context/NotificationContext'
import './StaffDashboard.css'

const StaffDashboard = () => {
  const { success, error: showError } = useNotification()
  const [ticketCode, setTicketCode] = useState('')
  const [verificationResult, setVerificationResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)
  const [scanHistory, setScanHistory] = useState([])

  const handleVerifyTicket = async e => {
    e.preventDefault()

    if (!ticketCode.trim()) {
      setAlert({ type: 'error', message: 'Ingresa un código de boleto' })
      return
    }

    setLoading(true)
    setAlert(null)

    try {
      console.log('📤 Verificando boleto:', ticketCode)

      // ✅ VERIFICAR BOLETO CON API REAL
      const response = await api.ticket.verify(ticketCode)
      console.log('✅ Respuesta de verificación:', response)

      const result = {
        valid: response.valid || false,
        ticketCode: ticketCode,
        eventName:
          response.event?.name || response.eventName || 'Evento desconocido',
        customerName:
          response.customer?.name || response.customerName || 'Usuario',
        ticketType: response.ticketType || response.ticket_type || 'General',
        purchaseDate:
          response.purchaseDate ||
          response.purchase_date ||
          new Date().toISOString(),
        scannedAt: new Date().toISOString(),
        alreadyUsed: response.alreadyUsed || response.already_used || false,
        ticketId: response.id || response.ticketId
      }

      setVerificationResult(result)

      // Agregar al historial
      setScanHistory(prev => [result, ...prev.slice(0, 9)])

      if (result.valid && !result.alreadyUsed) {
        setAlert({
          type: 'success',
          message: '¡Boleto válido! Acceso permitido'
        })
        success('Boleto verificado correctamente')
      } else if (result.alreadyUsed) {
        setAlert({
          type: 'error',
          message: 'Boleto ya utilizado anteriormente'
        })
        showError('Este boleto ya fue usado')
      } else {
        setAlert({ type: 'error', message: 'Boleto inválido o expirado' })
        showError('Boleto no válido')
      }

      setTicketCode('')
    } catch (error) {
      console.error('❌ Error al verificar boleto:', error)

      const errorMsg = error.message || 'Error al verificar el boleto'
      setAlert({ type: 'error', message: errorMsg })
      showError(errorMsg)

      // Agregar resultado negativo al historial
      const failedResult = {
        valid: false,
        ticketCode: ticketCode,
        eventName: 'Error de verificación',
        customerName: '-',
        ticketType: '-',
        purchaseDate: new Date().toISOString(),
        scannedAt: new Date().toISOString(),
        alreadyUsed: false
      }

      setVerificationResult(failedResult)
      setScanHistory(prev => [failedResult, ...prev.slice(0, 9)])
      setTicketCode('')
    } finally {
      setLoading(false)
    }
  }

  const handleRedeemTicket = async () => {
    if (
      !verificationResult ||
      !verificationResult.valid ||
      verificationResult.alreadyUsed
    ) {
      showError('No se puede registrar entrada para este boleto')
      return
    }

    try {
      console.log('📤 Canjeando boleto:', verificationResult.ticketCode)

      // ✅ CANJEAR BOLETO CON API REAL
      await api.ticket.redeem(verificationResult.ticketCode)

      success('Entrada registrada exitosamente')

      // Actualizar estado para marcar como usado
      setVerificationResult(prev => ({
        ...prev,
        alreadyUsed: true
      }))

      setAlert({ type: 'success', message: 'Entrada registrada correctamente' })
    } catch (error) {
      console.error('❌ Error al canjear boleto:', error)
      const errorMsg = error.message || 'Error al registrar entrada'
      showError(errorMsg)
      setAlert({ type: 'error', message: errorMsg })
    }
  }

  const handleQuickScan = () => {
    // Simular escaneo de QR (generar código random para pruebas)
    const mockCode = `TKT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    setTicketCode(mockCode)

    showError(
      'Función de escaneo QR no implementada. Usa el código generado para probar la verificación manual.'
    )
  }

  return (
    <div className='staff-dashboard'>
      <div className='dashboard-header'>
        <h1>Verificación de Boletos</h1>
        <p>Escanea o ingresa el código del boleto</p>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          closable
          onClose={() => setAlert(null)}
        />
      )}

      <div className='verification-section'>
        <Card className='scanner-card'>
          <div className='scanner-container'>
            <div className='qr-scanner-placeholder'>
              <span className='scanner-icon'>📷</span>
              <p>Coloca el código QR frente a la cámara</p>
              <Button variant='secondary' onClick={handleQuickScan}>
                Generar Código de Prueba
              </Button>
            </div>

            <div className='scanner-divider'>
              <span>O</span>
            </div>

            <form onSubmit={handleVerifyTicket} className='manual-entry'>
              <Input
                label='Código del Boleto'
                name='ticketCode'
                value={ticketCode}
                onChange={e => setTicketCode(e.target.value)}
                placeholder='TKT-XXXXXXXXX'
                icon={<span>🎫</span>}
                fullWidth
              />
              <Button
                type='submit'
                variant='primary'
                size='large'
                fullWidth
                loading={loading}
              >
                Verificar Boleto
              </Button>
            </form>
          </div>
        </Card>

        {verificationResult && (
          <Card
            className={`result-card ${verificationResult.valid && !verificationResult.alreadyUsed ? 'valid' : 'invalid'}`}
          >
            <div className='result-header'>
              <div className='result-icon'>
                {verificationResult.valid && !verificationResult.alreadyUsed
                  ? '✅'
                  : '❌'}
              </div>
              <h2 className='result-title'>
                {verificationResult.valid && !verificationResult.alreadyUsed
                  ? 'Boleto Válido'
                  : verificationResult.alreadyUsed
                    ? 'Boleto Ya Usado'
                    : 'Boleto Inválido'}
              </h2>
            </div>

            <div className='result-details'>
              <div className='detail-row'>
                <span className='detail-label'>Código:</span>
                <span className='detail-value'>
                  {verificationResult.ticketCode}
                </span>
              </div>
              <div className='detail-row'>
                <span className='detail-label'>Evento:</span>
                <span className='detail-value'>
                  {verificationResult.eventName}
                </span>
              </div>
              <div className='detail-row'>
                <span className='detail-label'>Cliente:</span>
                <span className='detail-value'>
                  {verificationResult.customerName}
                </span>
              </div>
              <div className='detail-row'>
                <span className='detail-label'>Tipo:</span>
                <Badge variant='info'>{verificationResult.ticketType}</Badge>
              </div>
              <div className='detail-row'>
                <span className='detail-label'>Compra:</span>
                <span className='detail-value'>
                  {new Date(verificationResult.purchaseDate).toLocaleDateString(
                    'es-MX'
                  )}
                </span>
              </div>
            </div>

            {verificationResult.valid && !verificationResult.alreadyUsed && (
              <div className='result-actions'>
                <Button
                  variant='success'
                  fullWidth
                  onClick={handleRedeemTicket}
                >
                  Registrar Entrada
                </Button>
              </div>
            )}

            {verificationResult.alreadyUsed && (
              <Alert
                type='warning'
                message='Este boleto ya fue canjeado anteriormente'
              />
            )}
          </Card>
        )}
      </div>

      <Card title='Historial de Verificaciones' className='history-card'>
        {scanHistory.length === 0 ? (
          <div className='empty-history'>
            <p>No hay verificaciones recientes</p>
          </div>
        ) : (
          <div className='history-list'>
            {scanHistory.map((scan, index) => (
              <div key={index} className='history-item'>
                <div className='history-icon'>
                  {scan.valid && !scan.alreadyUsed ? '✅' : '❌'}
                </div>
                <div className='history-info'>
                  <strong>{scan.ticketCode}</strong>
                  <p>{scan.eventName}</p>
                  <small>
                    {new Date(scan.scannedAt).toLocaleTimeString('es-MX')}
                  </small>
                </div>
                <Badge
                  variant={
                    scan.valid && !scan.alreadyUsed ? 'success' : 'danger'
                  }
                >
                  {scan.valid && !scan.alreadyUsed
                    ? 'Válido'
                    : scan.alreadyUsed
                      ? 'Usado'
                      : 'Inválido'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title='Estadísticas del Día' className='stats-card'>
        <div className='daily-stats'>
          <div className='stat-item'>
            <span className='stat-number'>
              {scanHistory.filter(s => s.valid && !s.alreadyUsed).length}
            </span>
            <span className='stat-label'>Válidos</span>
          </div>
          <div className='stat-item'>
            <span className='stat-number'>
              {scanHistory.filter(s => !s.valid || s.alreadyUsed).length}
            </span>
            <span className='stat-label'>Rechazados</span>
          </div>
          <div className='stat-item'>
            <span className='stat-number'>{scanHistory.length}</span>
            <span className='stat-label'>Total</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default StaffDashboard
