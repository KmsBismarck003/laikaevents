import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Icon } from '../../../components';
import { useNotification } from '../../../context/NotificationContext';
import './LuckySeatConfig.css';

const LuckySeatConfig = () => {
  const { success, error: showError } = useNotification();
  const [loading, setLoading] = useState(false);
  
  // Configuración de Probabilidades
  const [probs, setProbs] = useState({
    platinum: 15,
    gold: 25,
    general: 60
  });

  // Configuración de Colores (Temas)
  const [themes, setThemes] = useState({
    bronze: '#cd7f32',
    silver: '#cbd5e1',
    gold: '#EAB308',
    platinum: '#ffffff'
  });

  // Configuración de Puntos Laika
  const [pointsRate, setPointsRate] = useState({
    earnPerDollar: 0.1, // 1 punto por cada $10
    luckySeatCost: 40,   // 40 puntos por ruleta
    attendanceBonus: 50 // 50 puntos por asistir
  });

  const handleSave = () => {
    setLoading(true);
    // Simulación de guardado en API/LocalStorage
    setTimeout(() => {
      localStorage.setItem('laika_lucky_config', JSON.stringify({ probs, themes, pointsRate }));
      success('Configuración de Lucky Seat guardada con éxito');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="lucky-config-container">
      <div className="config-header">
        <div className="header-info">
          <h1>Lucky Seat & Loyalty System</h1>
          <p>Controla la suerte, el diseño y la fidelización de tus usuarios.</p>
        </div>
        <Button variant="primary" onClick={handleSave} loading={loading}>
          GUARDAR CAMBIOS
        </Button>
      </div>

      <div className="config-main-grid">
        {/* PANEL DE CONTROL */}
        <div className="config-controls">
          <Card title="GESTIÓN DE PROBABILIDADES">
            <div className="prob-sliders">
              <div className="slider-group">
                <label>PLATINO / VIP: {probs.platinum}%</label>
                <input 
                  type="range" min="0" max="100" value={probs.platinum}
                  onChange={(e) => setProbs({...probs, platinum: parseInt(e.target.value)})}
                />
              </div>
              <div className="slider-group">
                <label>ZONA ORO: {probs.gold}%</label>
                <input 
                  type="range" min="0" max="100" value={probs.gold}
                  onChange={(e) => setProbs({...probs, gold: parseInt(e.target.value)})}
                />
              </div>
              <div className="slider-group">
                <label>GENERAL: {probs.general}%</label>
                <input 
                  type="range" min="0" max="100" value={probs.general}
                  onChange={(e) => setProbs({...probs, general: parseInt(e.target.value)})}
                />
              </div>
              <div className="total-check">
                TOTAL: {probs.platinum + probs.gold + probs.general}% 
                {probs.platinum + probs.gold + probs.general !== 100 && 
                  <span className="warning"> ! Debe sumar 100%</span>}
              </div>
            </div>
          </Card>

          <Card title="SISTEMA DE PUNTOS LAIKA">
            <div className="points-settings">
              <div className="input-row">
                <label>Puntos por cada $1 gastado</label>
                <Input 
                  type="number" value={pointsRate.earnPerDollar} step="0.01"
                  onChange={(e) => setPointsRate({...pointsRate, earnPerDollar: parseFloat(e.target.value)})}
                />
              </div>
              <div className="input-row">
                <label>Costo Ruleta (en Puntos)</label>
                <Input 
                  type="number" value={pointsRate.luckySeatCost}
                  onChange={(e) => setPointsRate({...pointsRate, luckySeatCost: parseInt(e.target.value)})}
                />
              </div>
              <div className="input-row">
                <label>Bonus por Asistencia (Check-in)</label>
                <Input 
                  type="number" value={pointsRate.attendanceBonus}
                  onChange={(e) => setPointsRate({...pointsRate, attendanceBonus: parseInt(e.target.value)})}
                />
              </div>
            </div>
          </Card>

          <Card title="COLORES METÁLICOS (TEMAS)">
            <div className="color-grid">
              <div className="color-item">
                <label>BRONCE</label>
                <input type="color" value={themes.bronze} onChange={(e) => setThemes({...themes, bronze: e.target.value})} />
              </div>
              <div className="color-item">
                <label>PLATA</label>
                <input type="color" value={themes.silver} onChange={(e) => setThemes({...themes, silver: e.target.value})} />
              </div>
              <div className="color-item">
                <label>ORO</label>
                <input type="color" value={themes.gold} onChange={(e) => setThemes({...themes, gold: e.target.value})} />
              </div>
              <div className="color-item">
                <label>PLATINO</label>
                <input type="color" value={themes.platinum} onChange={(e) => setThemes({...themes, platinum: e.target.value})} />
              </div>
            </div>
          </Card>
        </div>

        {/* LIVE PREVIEW SECCION */}
        <div className="config-preview">
          <div className="sticky-preview">
            <h2 className="preview-label">LIVE PREVIEW</h2>
            <div className="preview-ticket-wrapper">
              {/* Aquí simulamos el ticket con los colores dinámicos */}
              <div className="preview-ticket platinum-theme" style={{ borderColor: themes.platinum, '--theme-color': themes.platinum }}>
                <div className="ticket-header">
                  <div className="success-banner" style={{ backgroundColor: themes.platinum }}>PREVIEW TICKET</div>
                </div>
                <div className="ticket-body">
                   <div className="seat-circle" style={{ borderColor: themes.platinum }}>
                      <span className="seat-num">P-1</span>
                   </div>
                   <div className="zone-info">
                      <span className="label">ZONA PLATINO</span>
                   </div>
                </div>
              </div>
              
              <div className="preview-ticket gold-theme" style={{ borderColor: themes.gold, '--theme-color': themes.gold }}>
                <div className="ticket-header">
                  <div className="success-banner" style={{ backgroundColor: themes.gold }}>PREVIEW TICKET</div>
                </div>
                <div className="ticket-body">
                   <div className="seat-circle" style={{ borderColor: themes.gold }}>
                      <span className="seat-num">G-7</span>
                   </div>
                   <div className="zone-info">
                      <span className="label">ZONA ORO</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LuckySeatConfig;
