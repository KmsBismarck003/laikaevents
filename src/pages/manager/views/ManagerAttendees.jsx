import React from 'react';
import { Card, Table, PermissionWall } from '../../../components';

const ManagerAttendees = () => {
  const columns = [
    { key: 'name', header: 'NOMBRE' },
    { key: 'email', header: 'EMAIL' },
    { key: 'event', header: 'EVENTO' },
    { key: 'ticket', header: 'TICKET' },
    { key: 'checkedIn', header: 'CHECK-IN' },
  ];

  return (
    <PermissionWall 
      permission="canViewUsers"
      title="DIRECTORIO RESTRINGIDO"
      description="No tienes permiso para ver la lista de asistentes. Esta información es privada."
    >
      <div className="manager-attendees">
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>
          Gestión de Asistentes
        </h2>
        <Card className="glass-card" style={{ padding: 0 }}>
          <Table columns={columns} data={[]} />
          <div style={{ padding: '2rem', textAlign: 'center', color: '#555' }}>
            No hay asistentes registrados para tus eventos activos.
          </div>
        </Card>
      </div>
    </PermissionWall>
  );
};

export default ManagerAttendees;
