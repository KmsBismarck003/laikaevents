import React from 'react'
import { Card, Table } from '../../components'
import './admin.css'

const Logs = () => {
  // Placeholder data
  const logs = [
    { id: 1, timestamp: '2023-10-27 10:00:00', level: 'INFO', message: 'Sistema iniciado' },
    { id: 2, timestamp: '2023-10-27 10:05:00', level: 'WARN', message: 'Intento de login fallido' }
  ]

  const columns = [
    { key: 'timestamp', header: 'Fecha/Hora' },
    { key: 'level', header: 'Nivel' },
    { key: 'message', header: 'Mensaje' }
  ]

  return (
    <div className="admin-logs-page">
      <div className="page-header">
        <h1>Logs del Sistema</h1>
      </div>
      <Card>
        <Table columns={columns} data={logs} />
      </Card>
    </div>
  )
}

export default Logs
