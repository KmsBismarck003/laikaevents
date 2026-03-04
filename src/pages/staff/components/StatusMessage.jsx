import React from 'react'
import '../StaffDashboard.css' // Reutilizar estilos existentes por ahora o crear nuevos

const StatusMessage = ({ status, message }) => {
  let icon = ''
  let statusClass = ''
  let title = ''

  switch (status) {
    case 'valid':
      icon = '✅'
      statusClass = 'valid'
      title = 'Acceso Permitido'
      break
    case 'used':
      icon = '⚠️'
      statusClass = 'warning'
      title = 'Boleto Ya Usado'
      break
    case 'invalid':
      icon = '❌'
      statusClass = 'invalid'
      title = 'Boleto Inválido'
      break
    default:
      return null
  }

  return (
    <div className={`status-message-container ${statusClass}`}>
      <div className="status-icon">{icon}</div>
      <h2 className="status-title">{title}</h2>
      {message && <p className="status-text">{message}</p>}
    </div>
  )
}

export default StatusMessage
