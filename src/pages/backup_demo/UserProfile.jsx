import React, { useState } from 'react';
import { Card, Button, Input, Badge, Table, Alert } from '../components';
import './UserProfile.css';

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [alert, setAlert] = useState(null);
  const [profileData, setProfileData] = useState({
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@example.com',
    phone: '55 1234 5678',
    birthDate: '1990-05-15'
  });

  const [purchases, setPurchases] = useState([
    {
      id: 1,
      eventName: 'Festival de Música Electrónica',
      date: '2025-02-15',
      tickets: 2,
      total: 1700,
      status: 'confirmed',
      ticketCode: 'TKT-ABC123'
    },
    {
      id: 2,
      eventName: 'Obra de Teatro: El Rey León',
      date: '2025-02-20',
      tickets: 1,
      total: 650,
      status: 'confirmed',
      ticketCode: 'TKT-DEF456'
    }
  ]);

  const [achievements, setAchievements] = useState([
    { id: 1, name: 'Primer Evento', description: 'Asististe a tu primer evento', icon: '🎉', unlocked: true },
    { id: 2, name: 'Fan de la Música', description: 'Asiste a 5 conciertos', icon: '🎵', unlocked: true },
    { id: 3, name: 'Explorador', description: 'Visita eventos de 3 categorías diferentes', icon: '🗺️', unlocked: false },
    { id: 4, name: 'VIP', description: 'Compra 10 boletos en total', icon: '⭐', unlocked: false }
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      // TODO: Integrar con API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAlert({ type: 'success', message: 'Perfil actualizado exitosamente' });
    } catch (error) {
      setAlert({ type: 'error', message: 'Error al actualizar el perfil' });
    }
  };

  const purchaseColumns = [
    { key: 'eventName', header: 'Evento', sortable: true },
    {
      key: 'date',
      header: 'Fecha',
      render: (value) => new Date(value).toLocaleDateString('es-MX')
    },
    { key: 'tickets', header: 'Boletos' },
    {
      key: 'total',
      header: 'Total',
      render: (value) => `$${value.toLocaleString('es-MX')}`
    },
    {
      key: 'status',
      header: 'Estado',
      render: (value) => (
        <Badge variant={value === 'confirmed' ? 'success' : 'warning'}>
          {value === 'confirmed' ? 'Confirmado' : 'Pendiente'}
        </Badge>
      )
    }
  ];

  return (
    <div className="user-profile">
      <div className="profile-header">
        <div className="profile-avatar">
          <span className="avatar-icon">👤</span>
        </div>
        <div className="profile-info">
          <h1>{profileData.firstName} {profileData.lastName}</h1>
          <p>{profileData.email}</p>
          <Badge variant="primary">Usuario</Badge>
        </div>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          closable
          onClose={() => setAlert(null)}
        />
      )}

      <div className="profile-tabs">
        <button
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Mi Perfil
        </button>
        <button
          className={`tab ${activeTab === 'purchases' ? 'active' : ''}`}
          onClick={() => setActiveTab('purchases')}
        >
          Mis Compras
        </button>
        <button
          className={`tab ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          Logros
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'profile' && (
          <Card title="Información Personal">
            <div className="profile-form">
              <div className="form-row">
                <Input
                  label="Nombre"
                  name="firstName"
                  value={profileData.firstName}
                  onChange={handleInputChange}
                  fullWidth
                />
                <Input
                  label="Apellido"
                  name="lastName"
                  value={profileData.lastName}
                  onChange={handleInputChange}
                  fullWidth
                />
              </div>

              <Input
                label="Email"
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleInputChange}
                fullWidth
              />

              <Input
                label="Teléfono"
                type="tel"
                name="phone"
                value={profileData.phone}
                onChange={handleInputChange}
                fullWidth
              />

              <Input
                label="Fecha de Nacimiento"
                type="date"
                name="birthDate"
                value={profileData.birthDate}
                onChange={handleInputChange}
                fullWidth
              />

              <div className="form-actions">
                <Button variant="primary" onClick={handleSaveProfile}>
                  Guardar Cambios
                </Button>
                <Button variant="secondary">
                  Cambiar Contraseña
                </Button>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'purchases' && (
          <Card title="Historial de Compras">
            <div className="purchases-stats">
              <div className="stat-box">
                <span className="stat-icon">🎫</span>
                <div>
                  <p className="stat-label">Total de Eventos</p>
                  <h3 className="stat-value">{purchases.length}</h3>
                </div>
              </div>
              <div className="stat-box">
                <span className="stat-icon">💰</span>
                <div>
                  <p className="stat-label">Gastado Total</p>
                  <h3 className="stat-value">
                    ${purchases.reduce((sum, p) => sum + p.total, 0).toLocaleString('es-MX')}
                  </h3>
                </div>
              </div>
            </div>

            <Table
              columns={purchaseColumns}
              data={purchases}
              sortable
              hoverable
              striped
            />
          </Card>
        )}

        {activeTab === 'achievements' && (
          <Card title="Mis Logros">
            <div className="achievements-grid">
              {achievements.map(achievement => (
                <div
                  key={achievement.id}
                  className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                >
                  <div className="achievement-icon">{achievement.icon}</div>
                  <h4 className="achievement-name">{achievement.name}</h4>
                  <p className="achievement-description">{achievement.description}</p>
                  {achievement.unlocked ? (
                    <Badge variant="success">Desbloqueado</Badge>
                  ) : (
                    <Badge variant="default">Bloqueado</Badge>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
