import React from 'react';
import { Card, Icon } from '../../../components';

const AssignedEvents = () => {
    return (
        <div className="admin-dashboard-page">
            <header className="dashboard-header">
                <div>
                    <h1 className="welcome-greeting">Mis Asignaciones</h1>
                    <p className="welcome-date">Eventos donde estás asignado como Staff de acceso</p>
                </div>
            </header>
            
            <div className="stats-grid">
                <Card className="stat-card" style={{ gridColumn: 'span 4', padding: '3rem', textAlign: 'center' }}>
                    <Icon name="calendar" size={48} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
                    <h2 style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Próximos Turnos</h2>
                    <p style={{ color: '#888', maxWidth: '600px', margin: '1rem auto' }}>
                        Actualmente no tienes eventos asignados para las próximas 48 horas. Recibirás una notificación cuando se te asigne un recinto.
                    </p>
                </Card>
            </div>
        </div>
    );
};

export default AssignedEvents;
