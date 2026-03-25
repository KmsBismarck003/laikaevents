import React, { useState } from 'react';
import { Card, Button, Input, Icon, PermissionWall } from '../../../components';
import { useNotification } from '../../../context/NotificationContext';

const StaffIncidents = () => {
  const { success, error } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'low',
    location: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      error('Por favor completa los campos obligatorios');
      return;
    }

    setLoading(true);
    // Simulación de envío
    setTimeout(() => {
      success('Incidencia reportada correctamente');
      setFormData({ title: '', description: '', severity: 'low', location: '' });
      setLoading(false);
    }, 1500);
  };

  return (
    <PermissionWall 
      permission="canValidateTickets"
      title="OPERACIÓN RESTRINGIDA"
      description="No tienes permisos para reportar incidencias. Contacta al Jefe de Campo."
    >
      <div className="staff-incidents">
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>
          Reportar Incidencia de Campo
        </h2>

        <Card className="glass-card" style={{ maxWidth: '800px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <Input
                label="TÍTULO DE LA INCIDENCIA *"
                placeholder="Ej. Error de escaneo en Puerta A"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value.toUpperCase() })}
                fullWidth
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#555' }}>SEVERIDAD</label>
                <select 
                  style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '12px', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                  value={formData.severity}
                  onChange={e => setFormData({ ...formData, severity: e.target.value })}
                >
                  <option value="low">BAJA - Informativa</option>
                  <option value="medium">MEDIA - Requiere atención</option>
                  <option value="high">ALTA - Crítica / Bloqueo</option>
                </select>
              </div>
            </div>

            <Input
              label="UBICACIÓN / ZONA"
              placeholder="Ej. Acceso Principal, V.I.P Section"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value.toUpperCase() })}
              fullWidth
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#555' }}>DESCRIPCIÓN DETALLADA *</label>
              <textarea 
                style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '12px', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', minHeight: '120px', resize: 'vertical' }}
                placeholder="Describe qué sucedió y cómo afecta la operación..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <Button type="submit" variant="primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
              <Icon name={loading ? 'loader' : 'send'} size={18} className="mr-2" />
              {loading ? 'ENVIANDO...' : 'ENVIAR REPORTE OFICIAL'}
            </Button>
          </form>
        </Card>
      </div>
    </PermissionWall>
  );
};

export default StaffIncidents;
