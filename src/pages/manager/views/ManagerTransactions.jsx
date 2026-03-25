import React from 'react';
import { Card, Table, PermissionWall } from '../../../components';

const ManagerTransactions = () => {
  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'date', header: 'FECHA' },
    { key: 'event', header: 'EVENTO' },
    { key: 'amount', header: 'MONTO' },
    { key: 'status', header: 'ESTADO' },
  ];

  return (
    <PermissionWall 
      permission="canViewEventAnalytics"
      title="FINANZAS RESTRINGIDAS"
      description="No tienes permiso para ver el historial de transacciones. Solicita acceso al Administrador."
    >
      <div className="manager-transactions">
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>
          Historial de Transacciones
        </h2>
        <Card className="glass-card" style={{ padding: 0 }}>
          <Table columns={columns} data={[]} />
          <div style={{ padding: '2rem', textAlign: 'center', color: '#555' }}>
            No hay transacciones registradas para tus eventos.
          </div>
        </Card>
      </div>
    </PermissionWall>
  );
};

export default ManagerTransactions;
