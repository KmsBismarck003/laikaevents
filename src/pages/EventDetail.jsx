import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Badge, Spinner } from '../components'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import api from '../services/api' // ✅ IMPORTAR API
import './EventDetail.css'

const EventDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { success, error: showError } = useNotification()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [purchasing, setPurchasing] = useState(false)

  useEffect(() => {
    fetchEventDetail()
  }, [id])

  const fetchEventDetail = async () => {
    setLoading(true)
    try {
      console.log(`📤 Obteniendo detalles del evento ID: ${id}`)

      // ✅ USAR API REAL
      const response = await api.event.getById(id)
      console.log('✅ Evento obtenido:', response)

      setEvent(response)
    } catch (error) {
      console.error('❌ Error al cargar evento:', error)
      showError('Error al cargar el evento')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async () => {
    if (!user) {
      showError('Debes iniciar sesión para comprar boletos')
      navigate('/login')
      return
    }

    if (!event || event.available_tickets < quantity) {
      showError('No hay suficientes boletos disponibles')
      return
    }

    setPurchasing(true)

    try {
      console.log('📤 Comprando boletos:', {
        eventId: event.id,
        quantity,
        paymentMethod: 'card' // Por ahora, método fijo
      })

      // ✅ INTEGRAR CON API REAL
      const response = await api.ticket.purchase({
        eventId: event.id,
        quantity,
        paymentMethod: 'card'
      })

      console.log('✅ Compra exitosa:', response)

      success(`¡Compra exitosa! ${quantity} boleto(s) para ${event.name}`)

      // Actualizar boletos disponibles localmente
      setEvent(prev => ({
        ...prev,
        available_tickets: prev.available_tickets - quantity
      }))

      // Redirigir a mis boletos después de 2 segundos
      setTimeout(() => {
        navigate('/profile') // O la ruta donde se muestren los boletos
      }, 2000)
    } catch (error) {
      console.error('❌ Error al comprar boletos:', error)
      showError(error.message || 'Error al procesar la compra')
    } finally {
      setPurchasing(false)
    }
  }

  const formatDate = dateString => {
    if (!dateString) return ''
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }
    return new Date(dateString).toLocaleDateString('es-MX', options)
  }

  if (loading) {
    return <Spinner fullScreen text='Cargando evento...' />
  }

  if (!event) {
    return (
      <div className='event-not-found'>
        <h2>Evento no encontrado</h2>
        <Button onClick={() => navigate('/')}>Volver al inicio</Button>
      </div>
    )
  }

  const categoryLabels = {
    concert: 'Concierto',
    sport: 'Deporte',
    theater: 'Teatro',
    festival: 'Festival',
    other: 'Otro'
  }

  // Normalizar campos (pueden venir como event_date o date)
  const eventDate = event.event_date || event.date
  const eventTime = event.event_time || event.time
  const availableTickets =
    event.available_tickets || event.availableTickets || 0
  const totalTickets = event.total_tickets || event.totalTickets || 0
  const imageUrl =
    event.image_url ||
    event.image ||
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800'

  return (
    <div className='event-detail-page'>
      <div className='event-detail-container'>
        <button className='back-button' onClick={() => navigate(-1)}>
          ← Volver
        </button>

        <div className='event-detail-content'>
          <div className='event-detail-image'>
            <img src={imageUrl} alt={event.name} />
            <Badge variant='primary' className='category-badge'>
              {categoryLabels[event.category] || 'Evento'}
            </Badge>
          </div>

          <div className='event-detail-info'>
            <h1>{event.name}</h1>

            <div className='event-meta'>
              <div className='meta-item'>
                <span className='meta-icon'>📅</span>
                <div>
                  <div className='meta-label'>Fecha</div>
                  <div className='meta-value'>{formatDate(eventDate)}</div>
                </div>
              </div>

              {eventTime && (
                <div className='meta-item'>
                  <span className='meta-icon'>🕐</span>
                  <div>
                    <div className='meta-label'>Hora</div>
                    <div className='meta-value'>{eventTime} hrs</div>
                  </div>
                </div>
              )}

              <div className='meta-item'>
                <span className='meta-icon'>📍</span>
                <div>
                  <div className='meta-label'>Lugar</div>
                  <div className='meta-value'>
                    {event.venue || event.location}
                  </div>
                  {event.venue &&
                    event.location &&
                    event.venue !== event.location && (
                      <div className='meta-sublabel'>{event.location}</div>
                    )}
                </div>
              </div>
            </div>

            <div className='event-description'>
              <h2>Descripción</h2>
              <p>{event.description || 'Sin descripción disponible'}</p>
            </div>

            <div className='event-tickets-info'>
              <div className='tickets-available'>
                <span className='tickets-label'>Boletos disponibles:</span>
                <span className='tickets-count'>
                  {availableTickets} {totalTickets > 0 && `de ${totalTickets}`}
                </span>
              </div>

              <div className='price-section'>
                <span className='price-label'>Precio por boleto:</span>
                <span className='price-amount'>
                  ${(event.price || 0).toLocaleString('es-MX')}
                </span>
              </div>
            </div>

            <div className='purchase-section'>
              <div className='quantity-selector'>
                <label>Cantidad de boletos:</label>
                <div className='quantity-controls'>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || purchasing}
                  >
                    -
                  </button>
                  <input
                    type='number'
                    value={quantity}
                    onChange={e =>
                      setQuantity(
                        Math.max(1, Math.min(10, parseInt(e.target.value) || 1))
                      )
                    }
                    min='1'
                    max='10'
                    disabled={purchasing}
                  />
                  <button
                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    disabled={quantity >= 10 || purchasing}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className='total-section'>
                <span className='total-label'>Total:</span>
                <span className='total-amount'>
                  ${((event.price || 0) * quantity).toLocaleString('es-MX')}
                </span>
              </div>

              <Button
                variant='primary'
                size='large'
                fullWidth
                onClick={handlePurchase}
                disabled={availableTickets === 0 || purchasing}
                loading={purchasing}
              >
                {availableTickets === 0
                  ? 'Agotado'
                  : purchasing
                    ? 'Procesando...'
                    : 'Comprar Boletos'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventDetail
