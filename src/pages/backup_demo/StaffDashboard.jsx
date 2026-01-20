import React, { useState } from 'react';
import { Card, Button, Input, Alert, Badge } from '../components';
import './StaffDashboard.css';

const StaffDashboard = () => {
  const [ticketCode, setTicketCode] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);

  const handleVerifyTicket = async (e) => {
    e.preventDefault();
    
    if (!ticketCode.trim()) {
      setAlert({ type: 'error', message: 'Ingresa un código de boleto' });
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      // TODO: Integrar con API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulación de verificación
      const isValid = Math.random() > 0.3;
      const result = {
        valid: isValid,
        ticketCode: ticketCode,
        eventName: 'Festival de Música Electrónica',
        customerName: 'Juan Pérez',
        ticketType: 'General',
        purchaseDate: '2025-01-10',
        scannedAt: new Date().toISOString(),
        alreadyUsed: !isValid && Math.random() > 0.5
      };

      setVerificationResult(result);
      
      // Agregar al historial
      setScanHistory(prev => [result, ...prev.slice(0, 9)]);
      
      if (isValid) {
        setAlert({ type: 'success', message: '¡Boleto válido! Acceso permitido' });
      } else if (result.alreadyUsed) {
        setAlert({ type: 'error', message: 'Boleto ya utilizado anteriormente' });
      } else {
        setAlert({ type: 'error', message: 'Boleto inválido o expirado' });
      }
      
      setTicketCode('');
    } catch (error) {
      setAlert({ type: 'error', message: 'Error al verificar el boleto' });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickScan = () => {
    // Simular escaneo de QR
    const mockCode = `TKT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    setTicketCode(mockCode);
  };

  return (
    <div className="staff-dashboard">
      <div className="dashboard-header">
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

      <div className="verification-section">
        <Card className="scanner-card">
          <div className="scanner-container">
            <div className="qr-scanner-placeholder">
              <span className="scanner-icon">📷</span>
              <p>Coloca el código QR frente a la cámara</p>
              <Button variant="secondary" onClick={handleQuickScan}>
                Simular Escaneo
              </Button>
            </div>

            <div className="scanner-divider">
              <span>O</span>
            </div>

            <form onSubmit={handleVerifyTicket} className="manual-entry">
              <Input
                label="Código del Boleto"
                name="ticketCode"
                value={ticketCode}
                onChange={(e) => setTicketCode(e.target.value)}
                placeholder="TKT-XXXXXXXXX"
                icon={<span>🎫</span>}
                fullWidth
              />
              <Button
                type="submit"
                variant="primary"
                size="large"
                fullWidth
                loading={loading}
              >
                Verificar Boleto
              </Button>
            </form>
          </div>
        </Card>

        {verificationResult && (
          <Card className={`result-card ${verificationResult.valid ? 'valid' : 'invalid'}`}>
            <div className="result-header">
              <div className="result-icon">
                {verificationResult.valid ? '✅' : '❌'}
              </div>
              <h2 className="result-title">
                {verificationResult.valid ? 'Boleto Válido' : 'Boleto Inválido'}
              </h2>
            </div>

            <div className="result-details">
              <div className="detail-row">
                <span className="detail-label">Código:</span>
                <span className="detail-value">{verificationResult.ticketCode}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Evento:</span>
                <span className="detail-value">{verificationResult.eventName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Cliente:</span>
                <span className="detail-value">{verificationResult.customerName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Tipo:</span>
                <Badge variant="info">{verificationResult.ticketType}</Badge>
              </div>
              <div className="detail-row">
                <span className="detail-label">Compra:</span>
                <span className="detail-value">
                  {new Date(verificationResult.purchaseDate).toLocaleDateString('es-MX')}
                </span>
              </div>
            </div>

            {verificationResult.valid && (
              <div className="result-actions">
                <Button variant="success" fullWidth>
                  Registrar Entrada
                </Button>
              </div>
            )}

            {verificationResult.alreadyUsed && (
              <Alert type="warning" message="Este boleto ya fue canjeado anteriormente" />
            )}
          </Card>
        )}
      </div>

      <Card title="Historial de Verificaciones" className="history-card">
        {scanHistory.length === 0 ? (
          <div className="empty-history">
            <p>No hay verificaciones recientes</p>
          </div>
        ) : (
          <div className="history-list">
            {scanHistory.map((scan, index) => (
              <div key={index} className="history-item">
                <div className="history-icon">
                  {scan.valid ? '✅' : '❌'}
                </div>
                <div className="history-info">
                  <strong>{scan.ticketCode}</strong>
                  <p>{scan.eventName}</p>
                  <small>
                    {new Date(scan.scannedAt).toLocaleTimeString('es-MX')}
                  </small>
                </div>
                <Badge variant={scan.valid ? 'success' : 'danger'}>
                  {scan.valid ? 'Válido' : 'Inválido'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Estadísticas del Día" className="stats-card">
        <div className="daily-stats">
          <div className="stat-item">
            <span className="stat-number">{scanHistory.filter(s => s.valid).length}</span>
            <span className="stat-label">Válidos</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{scanHistory.filter(s => !s.valid).length}</span>
            <span className="stat-label">Rechazados</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{scanHistory.length}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StaffDashboard;
