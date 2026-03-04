import React from 'react'
import '../StaffDashboard.css'

const TicketInfo = ({ ticket }) => {
  if (!ticket) return null

  return (
    <div className="ticket-info-card">
      <div className="info-row">
        <span className="info-label">Asistente:</span>
        <span className="info-value highlight">{ticket.customerName}</span>
      </div>

      <div className="info-row">
        <span className="info-label">Evento:</span>
        <span className="info-value">{ticket.eventName}</span>
      </div>

      <div className="info-row">
        <span className="info-label">Tipo Boleto:</span>
        <span className="info-tag">{ticket.ticketType}</span>
      </div>

      <div className="info-row">
        <span className="info-label">Código:</span>
        <span className="info-code">{ticket.ticketCode}</span>
      </div>

      {ticket.purchaseDate && (
        <div className="info-row">
          <span className="info-label">Compra:</span>
          <span className="info-value">
            {new Date(ticket.purchaseDate).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  )
}

export default TicketInfo
