import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getImageUrl } from '../utils/imageUtils'
import { Button, Badge, Spinner } from '../components'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { useCart } from '../context/CartContext'
import api from '../services/api'
import './EventDetail.css'

const EventDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { success, error: showError } = useNotification()

  const { addToCart } = useCart()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  // State for selected function (date/time/venue)
  const [selectedFunction, setSelectedFunction] = useState(null)

  useEffect(() => {
    fetchEventDetail()
    const interval = setInterval(() => fetchEventDetail(true), 10000)
    return () => clearInterval(interval)
  }, [id])

  const fetchEventDetail = async (background = false) => {
    if (!background) setLoading(true)
    try {
      const response = await api.event.getById(id)
      setEvent(response)

      // Auto-select first function if not selected and available
      if (!selectedFunction && response.functions && response.functions.length > 0) {
          // Find first active/future function ideally, but for now just first
          setSelectedFunction(response.functions[0])
      }
    } catch (error) {
      console.error('❌ Error al cargar evento:', error)
      if (!background) {
        showError('Error al cargar el evento')
        navigate('/')
      }
    } finally {
      if (!background) setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!user) {
      showError('Debes iniciar sesión para comprar boletos')
      navigate('/login')
      return
    }

    if (!event || event.available_tickets < quantity) {
      showError('No hay suficientes boletos disponibles')
      return
    }

    // Logic for function selection
    let functionData = null;
    if (event.functions && event.functions.length > 0) {
        if (!selectedFunction) {
            showError('Por favor selecciona una fecha')
            return
        }
        functionData = selectedFunction
    }

    // Pass event, quantity, and functionData (contains functionId, date, venue)
    addToCart(event, quantity, functionData)

    // Opcional: Redirigir al carrito
    navigate('/user/cart')
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

  const formatTime = time => {
    if (!time) return ''
    const str = String(time)
    if (str.includes(':')) return str.substring(0, 5)
    return str
  }

  if (loading) return <Spinner fullScreen text='Cargando evento...' />

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

  const imageUrl = getImageUrl(event.image_url || event.image)
  const hasFunctions = event.functions && event.functions.length > 0

  // Determine display values based on selection or main event
  const displayDate = selectedFunction ? selectedFunction.date : (event.event_date || event.date)
  const displayTime = selectedFunction ? selectedFunction.time : (event.event_time || event.time)
  const displayVenue = selectedFunction ? (selectedFunction.venue_name || event.venue) : (event.venue_name || event.venue || event.location)
  const displayCity = selectedFunction ? (selectedFunction.venue_city || event.location) : (event.venue_city || event.location)
  const displayMapUrl = selectedFunction ? selectedFunction.map_url : event.map_url

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

            {/* Function Selector */}
            {hasFunctions && (
                <div className="function-selector mb-6 p-4 bg-gray-50 rounded border" style={{ marginBottom: '1.5rem', background: '#f8f9fa', padding: '1rem', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                    <h3 className="text-sm font-bold text-gray-700 mb-2">Selecciona una fecha:</h3>
                    <div className="flex flex-wrap gap-2" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {event.functions.map((fn) => (
                            <button
                                key={fn.id}
                                onClick={() => setSelectedFunction(fn)}
                                className={`px-3 py-2 rounded text-sm border transition-colors ${selectedFunction?.id === fn.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: selectedFunction?.id === fn.id ? '2px solid #6c5ce7' : '1px solid #ced4da',
                                    background: selectedFunction?.id === fn.id ? '#6c5ce7' : 'white',
                                    color: selectedFunction?.id === fn.id ? 'white' : '#495057',
                                    cursor: 'pointer',
                                    fontWeight: selectedFunction?.id === fn.id ? 'bold' : 'normal'
                                }}
                            >
                                {new Date(fn.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} - {String(fn.time).substring(0,5)}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className='event-meta'>
              <div className='meta-item'>
                <span className='meta-icon'>📅</span>
                <div>
                  <div className='meta-label'>Fecha</div>
                  <div className='meta-value'>{formatDate(displayDate)}</div>
                </div>
              </div>

              {displayTime && (
                <div className='meta-item'>
                  <span className='meta-icon'>🕐</span>
                  <div>
                    <div className='meta-label'>Hora</div>
                    <div className='meta-value'>{formatTime(displayTime)} hrs</div>
                  </div>
                </div>
              )}

              <div className='meta-item'>
                <span className='meta-icon'>📍</span>
                <div>
                  <div className='meta-label'>Lugar</div>
                  <div className='meta-value'>{displayVenue}</div>
                  {displayCity && displayCity !== displayVenue && (
                      <div className='meta-sublabel'>{displayCity}</div>
                  )}
                  {displayCity && displayCity !== displayVenue && (
                      <div className='meta-sublabel'>{displayCity}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Minimap Section */}
            {(displayMapUrl || displayVenue || displayCity) && (
                <div className="event-map mt-6" style={{ marginTop: '1.5rem' }}>
                    <h3 className="text-sm font-bold text-gray-700 mb-2">Ubicación</h3>
                    <div className="map-container" style={{ width: '100%', height: '250px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        <iframe
                            title="Evento Location"
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            style={{ border: 0 }}
                            src={displayMapUrl?.includes('embed')
                                ? displayMapUrl
                                : `https://maps.google.com/maps?q=${encodeURIComponent((displayVenue || '') + ' ' + (displayCity || ''))}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                            allowFullScreen
                        ></iframe>
                    </div>
                    {displayMapUrl && !displayMapUrl.includes('embed') && (
                        <a href={displayMapUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 mt-1 block hover:underline">
                            Ver en Google Maps ↗
                        </a>
                    )}
                </div>
            )}

            <div className='event-description'>
              <h2>Descripción</h2>
              <p>{event.description || 'Sin descripción disponible'}</p>
            </div>

            <div className='event-tickets-info'>
              <div className='tickets-available'>
                <span className='tickets-label'>Boletos disponibles:</span>
                <span className='tickets-count'>
                  {event.available_tickets} {event.total_tickets > 0 && `de ${event.total_tickets}`}
                </span>
                {/* Note: Per-function availability tracking would require DB update. Using global for now. */}
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
                  ${((event.price || 0) * quantity).toLocaleString('es-MX')}
                </span>
              </div>

              <Button
                variant='primary'
                size='large'
                fullWidth
                onClick={handleAddToCart}
                disabled={event.available_tickets === 0}
                loading={false}
              >
                {event.available_tickets === 0
                  ? 'Agotado'
                  : 'Agregar al Carrito 🛒'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventDetail
