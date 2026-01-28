import React from 'react'
import './Maintenance.css'

const Maintenance = () => {
  return (
    <div className='maintenance-page'>
      <div className='maintenance-content'>
        <div className='maintenance-icon'>🔧</div>
        <h1>Sistema en Mantenimiento</h1>
        <p>
          Estamos realizando mejoras en el sistema. Por favor, intenta
          nuevamente en unos minutos.
        </p>
        <div className='maintenance-spinner'></div>
        <p className='maintenance-footer'>
          Si eres administrador, puedes acceder al sistema normalmente.
        </p>
      </div>
    </div>
  )
}

export default Maintenance
