import React from 'react'
import { Card, Badge, Button } from '../../components'
import './admin.css'

const Monitoring = () => {
  return (
    <div className="admin-monitoring-page">
      <div className="page-header">
        <h1>Monitoreo del Sistema</h1>
        <Button>Actualizar</Button>
      </div>

      <Card title="Estado del Servidor">
        <div className="monitor-stats">
          <div className="monitor-item">
            <span>Estado:</span>
            <Badge variant="success">En línea</Badge>
          </div>
          <div className="monitor-item">
            <span>Uptime:</span>
            <span>24d 5h 30m</span>
          </div>
          <div className="monitor-item">
            <span>CPU:</span>
            <span>12%</span>
          </div>
          <div className="monitor-item">
            <span>Memoria:</span>
            <span>45%</span>
          </div>
        </div>
      </Card>

      <Card title="Servicios">
         <div className="services-list">
            <div className="service-item">
               <span>Base de Datos</span>
               <Badge variant="success">OK</Badge>
            </div>
            <div className="service-item">
               <span>API</span>
               <Badge variant="success">OK</Badge>
            </div>
            <div className="service-item">
               <span>Sistema de Archivos</span>
               <Badge variant="success">OK</Badge>
            </div>
         </div>
      </Card>
    </div>
  )
}

export default Monitoring
