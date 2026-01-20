import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Badge, Spinner } from '../components'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import './EventDetail.css'

const EventDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { success, error: showError } = useNotification()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    fetchEventDetail()
  }, [id])

  const fetchEventDetail = async () => {
    setLoading(true)
    try {
      // Simulación - eventos de prueba
      await new Promise(resolve => setTimeout(resolve, 800))

      const mockEvents = {
        1: {
          id: 1,
          name: 'Festival de Música Electrónica',
          description:
            'Los mejores DJs internacionales en un solo lugar. Una experiencia única con los mejores sets de música electrónica.',
          date: '2025-02-15',
          time: '20:00',
          location: 'Arena CDMX',
          venue: 'Arena CDMX - Sala Principal',
          category: 'festival',
          price: 850,
          totalTickets: 1000,
          availableTickets: 500,
          image:
            'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800'
        },
        2: {
          id: 2,
          name: 'Obra de Teatro: El Rey León',
          description: 'Musical premiado con efectos especiales',
          date: '2025-02-20',
          time: '19:00',
          location: 'Teatro Metropolitan',
          venue: 'Teatro Metropolitan',
          category: 'theater',
          price: 650,
          totalTickets: 300,
          availableTickets: 120,
          image:
            'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800'
        },
        3: {
          id: 3,
          name: 'Partido: América vs Guadalajara',
          description: 'Clásico Nacional - Semifinal',
          date: '2025-02-18',
          time: '21:00',
          location: 'Estadio Azteca',
          venue: 'Estadio Azteca',
          category: 'sport',
          price: 450,
          totalTickets: 5000,
          availableTickets: 2000,
          image:
            'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800'
        },
        4: {
          id: 4,
          name: 'Concierto: Café Tacvba',
          description: 'Tour 30 años de carrera',
          date: '2025-03-01',
          time: '21:00',
          location: 'Foro Sol',
          venue: 'Foro Sol',
          category: 'concert',
          price: 950,
          totalTickets: 2000,
          availableTickets: 850,
          image:
            'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800'
        }
      }

      const foundEvent = mockEvents[id]
      if (foundEvent) {
        setEvent(foundEvent)
      } else {
        showError('Evento no encontrado')
        navigate('/')
      }
    } catch (error) {
      console.error('Error al cargar evento:', error)
      showError('Error al cargar el evento')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = () => {
    if (!user) {
      showError('Debes iniciar sesión para comprar boletos')
      navigate('/login')
      return
    }

    // TODO: Integrar con API de compra
    success(`¡Compra exitosa! ${quantity} boleto(s) para ${event.name}`)

    // Simular reducción de boletos
    setEvent(prev => ({
      ...prev,
      availableTickets: prev.availableTickets - quantity
    }))
  }

  const formatDate = dateString => {
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

  return (
    <div className='event-detail-page'>
      <div className='event-detail-container'>
        <button className='back-button' onClick={() => navigate(-1)}>
          ← Volver
        </button>

        <div className='event-detail-content'>
          <div className='event-detail-image'>
            <img src={event.image} alt={event.name} />
            <Badge variant='primary' className='category-badge'>
              {categoryLabels[event.category]}
            </Badge>
          </div>

          <div className='event-detail-info'>
            <h1>{event.name}</h1>

            <div className='event-meta'>
              <div className='meta-item'>
                <span className='meta-icon'>📅</span>
                <div>
                  <div className='meta-label'>Fecha</div>
                  <div className='meta-value'>{formatDate(event.date)}</div>
                </div>
              </div>

              <div className='meta-item'>
                <span className='meta-icon'>🕐</span>
                <div>
                  <div className='meta-label'>Hora</div>
                  <div className='meta-value'>{event.time} hrs</div>
                </div>
              </div>

              <div className='meta-item'>
                <span className='meta-icon'>📍</span>
                <div>
                  <div className='meta-label'>Lugar</div>
                  <div className='meta-value'>{event.venue}</div>
                  <div className='meta-sublabel'>{event.location}</div>
                </div>
              </div>
            </div>

            <div className='event-description'>
              <h2>Descripción</h2>
              <p>{event.description}</p>
            </div>

            <div className='event-tickets-info'>
              <div className='tickets-available'>
                <span className='tickets-label'>Boletos disponibles:</span>
                <span className='tickets-count'>
                  {event.availableTickets} de {event.totalTickets}
                </span>
              </div>

              <div className='price-section'>
                <span className='price-label'>Precio por boleto:</span>
                <span className='price-amount'>
                  ${event.price.toLocaleString('es-MX')}
                </span>
              </div>
            </div>

            <div className='purchase-section'>
              <div className='quantity-selector'>
                <label>Cantidad de boletos:</label>
                <div className='quantity-controls'>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
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
                  />
                  <button
                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    disabled={quantity >= 10}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className='total-section'>
                <span className='total-label'>Total:</span>
                <span className='total-amount'>
                  ${(event.price * quantity).toLocaleString('es-MX')}
                </span>
              </div>

              <Button
                variant='primary'
                size='large'
                fullWidth
                onClick={handlePurchase}
                disabled={event.availableTickets === 0}
              >
                {event.availableTickets === 0 ? 'Agotado' : 'Comprar Boletos'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventDetail
