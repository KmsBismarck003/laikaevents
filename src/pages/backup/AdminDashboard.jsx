import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Table, Modal, Alert, Spinner } from '../components';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalSales: 0,
    activeUsers: 0
  });
  const [users, setUsers] = useState([]);
  const [systemConfig, setSystemConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // TODO: Integrar con API de FastAPI
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalUsers: 1245,
        totalEvents: 48,
        totalSales: 325680,
        activeUsers: 89
      });

      setUsers([
        { id: 1, name: 'Juan Pérez', email: 'juan@example.com', role: 'admin', status: 'active' },
        { id: 2, name: 'María García', email: 'maria@example.com', role: 'gestor', status: 'active' },
        { id: 3, name: 'Carlos López', email: 'carlos@example.com', role: 'operador', status: 'inactive' }
      ]);

      setSystemConfig({
        maintenanceMode: false,
        registrationEnabled: true,
        sessionTimeout: 30,
        maxTicketsPerUser: 10
      });
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async (type) => {
    setAlert({ type: 'info', message: `Iniciando respaldo ${type}...` });
    try {
      // TODO: Integrar con API
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAlert({ type: 'success', message: 'Respaldo completado exitosamente' });
      setShowBackupModal(false);
    } catch (error) {
      setAlert({ type: 'error', message: 'Error al realizar el respaldo' });
    }
  };

  const handleConfigChange = async (key, value) => {
    try {
      setSystemConfig(prev => ({ ...prev, [key]: value }));
      // TODO: Integrar con API
      setAlert({ type: 'success', message: 'Configuración actualizada' });
    } catch (error) {
      setAlert({ type: 'error', message: 'Error al actualizar configuración' });
    }
  };

  const userColumns = [
    { key: 'name', header: 'Nombre', sortable: true },
    { key: 'email', header: 'Email' },
    { 
      key: 'role', 
      header: 'Rol',
      render: (value) => {
        const variants = {
          admin: 'danger',
          gestor: 'warning',
          operador: 'info',
          usuario: 'default'
        };
        return <Badge variant={variants[value]}>{value}</Badge>;
      }
    },
    {
      key: 'status',
      header: 'Estado',
      render: (value) => (
        <Badge variant={value === 'active' ? 'success' : 'default'} dot>
          {value === 'active' ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    }
  ];

  if (loading) {
    return <Spinner fullScreen text="Cargando dashboard..." />;
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Panel de Administración</h1>
        <p>Control total del sistema LAIKA Club</p>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          closable
          onClose={() => setAlert(null)}
        />
      )}

      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-icon" style={{ backgroundColor: '#dbeafe' }}>
              👥
            </div>
            <div className="stat-info">
              <p className="stat-label">Total Usuarios</p>
              <h2 className="stat-value">{stats.totalUsers.toLocaleString()}</h2>
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-icon" style={{ backgroundColor: '#fef3c7' }}>
              🎫
            </div>
            <div className="stat-info">
              <p className="stat-label">Eventos Activos</p>
              <h2 className="stat-value">{stats.totalEvents}</h2>
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-icon" style={{ backgroundColor: '#d1fae5' }}>
              💰
            </div>
            <div className="stat-info">
              <p className="stat-label">Ventas Totales</p>
              <h2 className="stat-value">${stats.totalSales.toLocaleString()}</h2>
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-icon" style={{ backgroundColor: '#ddd6fe' }}>
              🟢
            </div>
            <div className="stat-info">
              <p className="stat-label">Usuarios Activos</p>
              <h2 className="stat-value">{stats.activeUsers}</h2>
            </div>
          </div>
        </Card>
      </div>

      <div className="admin-sections">
        <Card title="Gestión de Usuarios">
          <div className="section-actions">
            <Button variant="primary" onClick={() => setShowUsersModal(true)}>
              Ver Todos los Usuarios
            </Button>
            <Button variant="success">Crear Usuario</Button>
            <Button variant="secondary">Exportar Lista</Button>
          </div>
          <Table
            columns={userColumns}
            data={users.slice(0, 5)}
            hoverable
            striped
          />
        </Card>

        <Card title="Configuración del Sistema">
          <div className="config-options">
            <div className="config-item">
              <div className="config-info">
                <strong>Modo Mantenimiento</strong>
                <p>Deshabilita el acceso de usuarios al sistema</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={systemConfig.maintenanceMode}
                  onChange={(e) => handleConfigChange('maintenanceMode', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="config-item">
              <div className="config-info">
                <strong>Registro de Usuarios</strong>
                <p>Permite que nuevos usuarios se registren</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={systemConfig.registrationEnabled}
                  onChange={(e) => handleConfigChange('registrationEnabled', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="config-item">
              <div className="config-info">
                <strong>Tiempo de Sesión</strong>
                <p>Minutos antes de cerrar sesión automáticamente</p>
              </div>
              <input
                type="number"
                className="config-input"
                value={systemConfig.sessionTimeout}
                onChange={(e) => handleConfigChange('sessionTimeout', parseInt(e.target.value))}
                min="5"
                max="120"
              />
            </div>

            <div className="config-item">
              <div className="config-info">
                <strong>Boletos Máximos por Usuario</strong>
                <p>Límite de boletos por compra</p>
              </div>
              <input
                type="number"
                className="config-input"
                value={systemConfig.maxTicketsPerUser}
                onChange={(e) => handleConfigChange('maxTicketsPerUser', parseInt(e.target.value))}
                min="1"
                max="20"
              />
            </div>
          </div>
        </Card>

        <Card title="Gestión de Base de Datos">
          <div className="section-actions">
            <Button variant="primary" onClick={() => setShowBackupModal(true)}>
              Crear Respaldo
            </Button>
            <Button variant="secondary">Restaurar BD</Button>
            <Button variant="warning">Ver Estadísticas</Button>
            <Button variant="danger">Limpiar Cache</Button>
          </div>
        </Card>

        <Card title="Monitoreo del Sistema">
          <div className="monitoring-info">
            <div className="monitor-item">
              <span className="monitor-label">Estado del Servidor:</span>
              <Badge variant="success" dot>En línea</Badge>
            </div>
            <div className="monitor-item">
              <span className="monitor-label">Uso de CPU:</span>
              <span className="monitor-value">23%</span>
            </div>
            <div className="monitor-item">
              <span className="monitor-label">Uso de Memoria:</span>
              <span className="monitor-value">1.2 GB / 4 GB</span>
            </div>
            <div className="monitor-item">
              <span className="monitor-label">Último Respaldo:</span>
              <span className="monitor-value">Hace 2 horas</span>
            </div>
          </div>
          <Button variant="secondary" fullWidth>Ver Logs del Sistema</Button>
        </Card>
      </div>

      {/* Modal de Respaldo */}
      <Modal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        title="Crear Respaldo de Base de Datos"
        size="medium"
      >
        <div className="backup-options">
          <p>Selecciona el tipo de respaldo que deseas realizar:</p>
          <div className="backup-buttons">
            <Button variant="primary" fullWidth onClick={() => handleBackup('completo')}>
              Respaldo Completo
            </Button>
            <Button variant="secondary" fullWidth onClick={() => handleBackup('incremental')}>
              Respaldo Incremental
            </Button>
            <Button variant="secondary" fullWidth onClick={() => handleBackup('selectivo')}>
              Respaldo Selectivo
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Usuarios */}
      <Modal
        isOpen={showUsersModal}
        onClose={() => setShowUsersModal(false)}
        title="Gestión de Usuarios"
        size="large"
      >
        <Table
          columns={userColumns}
          data={users}
          sortable
          hoverable
          striped
        />
      </Modal>
    </div>
  );
};

export default AdminDashboard;
