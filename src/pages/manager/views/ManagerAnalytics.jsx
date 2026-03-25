import React from 'react';
import { Card, Icon, PermissionWall } from '../../../components';

const ManagerAnalytics = () => {
  return (
    <PermissionWall 
      permission="canViewEventAnalytics"
      title="ANALÍTICA BLOQUEADA"
      description="Tu cuenta no tiene permisos para ver datos financieros y tendencias. Contacta al Administrador."
    >
      <div className="manager-analytics">
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>
          Analítica de Ventas y Tendencias
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <Card className="glass-card" style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="chartBar" size={48} style={{ color: '#555', marginBottom: '1rem' }} />
            <p style={{ color: '#555', fontWeight: 600 }}>Gráficos de Tendencia (Próximamente)</p>
          </Card>
          
          <Card className="glass-card" style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="users" size={48} style={{ color: '#555', marginBottom: '1rem' }} />
            <p style={{ color: '#555', fontWeight: 600 }}>Distribución de Demográficos (Próximamente)</p>
          </Card>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <Card className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>MÓDULO EN CONSTRUCCIÓN</h3>
            <p style={{ color: '#555', maxWidth: '600px', margin: '0.5rem auto' }}>
              Estamos integrando las APIs de analítica avanzada para proporcionarte métricas reales de tus eventos en tiempo real.
            </p>
          </Card>
        </div>
      </div>
    </PermissionWall>
  );
};

export default ManagerAnalytics;
