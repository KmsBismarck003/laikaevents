import React, { useState } from 'react';
import { Card, Button, Input, Icon, Alert, Badge } from '../../components';
import { useNotification } from '../../context/NotificationContext';
import './StaffDashboard.css';

const StaffIncidents = () => {
    const { success, error: showError } = useNotification();
    const [incidentType, setIncidentType] = useState('technical');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [history, setHistory] = useState([
        { id: 1, type: 'Boleto Dañado', status: 'resolved', time: '10 mins ago', user: 'Admin' },
        { id: 2, type: 'Escáner Lento', status: 'pending', time: 'Just now', user: 'Pendiente' }
    ]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!description.trim()) return;

        setSubmitting(true);
        // Simulación de envío a microservicio de soporte/admin
        setTimeout(() => {
            const newIncident = {
                id: Date.now(),
                type: incidentType === 'technical' ? 'Falla Técnica' : 'Problema de Acceso',
                status: 'pending',
                time: 'Hace un momento',
                user: 'Por revisar'
            };
            setHistory([newIncident, ...history]);
            setSubmitting(false);
            setDescription('');
            success('Incidencia reportada con éxito');
        }, 1000);
    };

    return (
        <div className="incidents-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <Card title="Reportar Incidencia">
                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Tipo de Problema</label>
                        <select
                            value={incidentType}
                            onChange={(e) => setIncidentType(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        >
                            <option value="technical">Falla Técnica (Escáner/Red)</option>
                            <option value="access">Problema de Acceso (Cliente/Boleto)</option>
                            <option value="security">Seguridad / Emergencia</option>
                        </select>
                    </div>

                    <Input
                        label="Descripción del problema"
                        placeholder="Describe brevemente lo que está ocurriendo..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        fullWidth
                        multiline
                        rows={4}
                    />

                    <div style={{ marginTop: '1.5rem' }}>
                        <Button type="submit" variant="primary" fullWidth loading={submitting} disabled={!description.trim()}>
                            <Icon name="alertTriangle" size={16} className="mr-2" />
                            Enviar Alerta a Supervisión
                        </Button>
                    </div>
                </form>
            </Card>

            <Card title="Historial de Reportes">
                {history.map(item => (
                    <div key={item.id} className="incident-item" style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{item.type}</div>
                            <small style={{ opacity: 0.6 }}>{item.time} • Asignado a: {item.user}</small>
                        </div>
                        <Badge variant={item.status === 'resolved' ? 'success' : 'warning'}>
                            {item.status.toUpperCase()}
                        </Badge>
                    </div>
                ))}
            </Card>
        </div>
    );
};

export default StaffIncidents;
