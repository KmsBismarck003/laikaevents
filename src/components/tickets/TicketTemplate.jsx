import React, { useEffect } from 'react'
import './Ticket.css'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const TicketTemplate = ({ ticket }) => {
  useEffect(() => {
    console.log('📋 Ticket Data:', ticket)
  }, [ticket])

  if (!ticket) {
    console.error('❌ No ticket data received')
    return null
  }

  const handleDownloadPDF = async () => {
    const ticketElement = document.querySelector('.compact-ticket')
    if (!ticketElement) return

    try {
      // Ocultar botones temporalmente
      const actions = document.querySelector('.ticket-actions')
      const note = document.querySelector('.ticket-note')
      if (actions) actions.style.display = 'none'
      if (note) note.style.display = 'none'

      // Capturar como imagen
      const canvas = await html2canvas(ticketElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      // Crear PDF
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [100, 260] // Tamaño personalizado para el ticket
      })

      pdf.addImage(imgData, 'PNG', 0, 0, 260, 100)
      pdf.save(`ticket-${ticketCode}.pdf`)

      // Mostrar botones de nuevo
      if (actions) actions.style.display = 'flex'
      if (note) note.style.display = 'block'
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error al generar PDF. Intenta usar el botón de imprimir.')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Invalid Date') {
      return 'FECHA POR CONFIRMAR · HORA POR CONFIRMAR'
    }

    try {
      const date = new Date(dateString)

      if (isNaN(date.getTime())) {
        return 'FECHA POR CONFIRMAR · HORA POR CONFIRMAR'
      }

      const day = date.getDate()
      const month = date.toLocaleDateString('es-MX', { month: 'long' }).toUpperCase()
      const time = date.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).toUpperCase()

      return `${day} DE ${month} · ${time}`
    } catch (error) {
      return 'FECHA POR CONFIRMAR · HORA POR CONFIRMAR'
    }
  }

  // Extraer datos
  const eventName = ticket.event_name || ticket.eventName || ticket.name || 'NOMBRE DEL EVENTO'
  const location = ticket.event_location || ticket.location || ticket.venue || 'LAIKA CLUB'
  const userName = ticket.user_name || ticket.userName || ticket.attendee || 'NOMBRE DEL PORTADOR'
  const ticketType = ticket.ticket_type || ticket.ticketType || ticket.type || 'GENERAL'
  const price = ticket.ticket_price || ticket.price || ticket.cost || 0
  const ticketCode = ticket.ticket_code || ticket.ticketCode || ticket.code || `TICKET-${ticket.id}`
  const eventDate = ticket.event_date || ticket.eventDate || ticket.date
  const bgImage = ticket.event_image || ticket.eventImage || ticket.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200'
  const status = ticket.ticket_status || ticket.status || 'active'

  return (
    <div className="ticket-wrapper">
      {/* PREMIUM MODERN TICKET */}
      <div className="compact-ticket">

        {/* LEFT: Image - More visible */}
        <div className="ticket-image">
          <img
            src={bgImage}
            alt={eventName}
            className="event-img"
            crossOrigin="anonymous"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200'
            }}
          />
          <div className="image-gradient"></div>
        </div>

        {/* CENTER: Event Info */}
        <div className="ticket-info">

          {/* Event Title */}
          <div className="info-title">
            <h1 className="event-name">({eventName})</h1>
            <p className="event-type">(EVENTO ESPECIAL)</p>
          </div>

          {/* Date/Time Badge */}
          <div className="info-datetime">
            {formatDate(eventDate)}
          </div>

          {/* Location */}
          <div className="info-location">
            {location}
          </div>

          {/* Details Grid */}
          <div className="info-grid">
            <div className="info-row">
              <span className="info-key">ASISTENTE:</span>
              <span className="info-val">{userName}</span>
            </div>
            <div className="info-row">
              <span className="info-key">ACCESO:</span>
              <span className="info-val">{ticketType.toUpperCase()} / VIP</span>
            </div>
            <div className="info-row">
              <span className="info-key">PRECIO:</span>
              <span className="info-val">${Number(price).toLocaleString('es-MX')} MXN</span>
            </div>
          </div>

          {/* Footer */}
          <div className="info-footer">
            <span className="footer-brand">🎭 LAIKA CLUB</span>
          </div>
        </div>

        {/* RIGHT: QR Code */}
        <div className="ticket-qr">
          <div className="qr-box">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(ticketCode)}&margin=0`}
              alt="QR"
              className="qr-img"
              crossOrigin="anonymous"
            />
          </div>

          <div className="qr-code">{ticketCode}</div>

          <div className={`qr-badge badge-${status.toLowerCase()}`}>
            <span className="badge-dot"></span>
            <span className="badge-text">{status.toUpperCase()}</span>
          </div>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="ticket-actions">
        <button className="btn-action btn-pdf" onClick={handleDownloadPDF}>
          <span className="btn-ico">💾</span>
          <span>Descargar PDF</span>
        </button>
        <button className="btn-action btn-print" onClick={handlePrint}>
          <span className="btn-ico">🖨️</span>
          <span>Imprimir Boleto</span>
        </button>
      </div>

      <p className="ticket-note">
        Presenta este boleto en formato digital o impreso en la entrada del evento
      </p>
    </div>
  )
}

export default TicketTemplate
