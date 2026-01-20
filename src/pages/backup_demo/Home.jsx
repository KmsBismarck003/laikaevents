import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Badge, Input, Spinner } from '../components'
import api from '../services/api' // ← IMPORTAR API
import { useNotification } from '../context/NotificationContext'
import './Home.css'

const Home = () => {
  const navigate = useNavigate()
  const { error: showError } = useNotification()
  const [events, setEvents] = useState([])
  const [filteredEvents, setFilteredEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'concert', name: 'Conciertos' },
    { id: 'sport', name: 'Deportes' },
    { id: 'theater', name: 'Teatro' },
    { id: 'festival', name: 'Festivales' },
    { id: 'other', name: 'Otros' }
  ]

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    filterEvents()
  }, [searchTerm, selectedCategory, events])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      console.log('📤 Obteniendo eventos públicos...')

      // ✅ USAR API REAL
      const response = await api.event.getPublic()
      console.log('✅ Eventos obtenidos:', response)

      setEvents(response)
      setFilteredEvents(response)
    } catch (error) {
      console.error('❌ Error al cargar eventos:', error)
      showError('Error al cargar eventos')
      setEvents([])
      setFilteredEvents([])
    } finally {
      setLoading(false)
    }
  }

  const filterEvents = () => {
    let filtered = events

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory)
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        event =>
          event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (event.description &&
            event.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          event.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredEvents(filtered)
  }

  const handleEventClick = eventId => {
    navigate(`/event/${eventId}`)
  }

  const formatDate = dateString => {
    if (!dateString) return ''
    const options = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString('es-MX', options)
  }

  const getCategoryBadgeVariant = category => {
    const variants = {
      concert: 'primary',
      sport: 'success',
      theater: 'danger',
      festival: 'warning',
      other: 'default'
    }
    return variants[category] || 'default'
  }

  if (loading) {
    return <Spinner fullScreen text='Cargando eventos...' />
  }

  return (
    <div className='home-page'>
      <section className='hero-section'>
        <div className='hero-content'>
          <h1 className='hero-title'>Descubre Eventos Increíbles</h1>
          <p className='hero-subtitle'>
            Los mejores conciertos, deportes, teatro y festivales en un solo
            lugar
          </p>
        </div>
      </section>

      <div className='home-container'>
        <div className='filters-section'>
          <Input
            type='text'
            placeholder='Buscar eventos...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            icon={<span>🔍</span>}
            className='search-input'
          />

          <div className='category-filters'>
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className='events-section'>
          <div className='section-header'>
            <h2>Eventos Disponibles</h2>
            <span className='event-count'>
              {filteredEvents.length} evento
              {filteredEvents.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filteredEvents.length === 0 ? (
            <div className='no-events'>
              <p>
                No se encontraron eventos
                {searchTerm || selectedCategory !== 'all'
                  ? ' que coincidan con tu búsqueda'
                  : ' disponibles'}
              </p>
              {events.length === 0 && (
                <p className='no-events-hint'>
                  Vuelve pronto para ver nuevos eventos
                </p>
              )}
            </div>
          ) : (
            <div className='events-grid'>
              {filteredEvents.map(event => {
                // Normalizar nombres de campos (event_date vs date, event_time vs time, etc.)
                const eventDate = event.event_date || event.date
                const eventTime = event.event_time || event.time
                const availableTickets =
                  event.available_tickets || event.availableTickets || 0
                const imageUrl =
                  event.image_url ||
                  event.image ||
                  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800'

                return (
                  <Card
                    key={event.id}
                    image={imageUrl}
                    hoverable
                    onClick={() => handleEventClick(event.id)}
                    footer={
                      <div className='card-footer-content'>
                        <span className='event-price'>
                          ${(event.price || 0).toLocaleString('es-MX')}
                        </span>
                        <Button size='small' variant='primary'>
                          Ver Detalles
                        </Button>
                      </div>
                    }
                  >
                    <div className='event-card-content'>
                      <div className='event-header'>
                        <Badge
                          variant={getCategoryBadgeVariant(event.category)}
                          rounded
                        >
                          {categories.find(c => c.id === event.category)
                            ?.name || 'Evento'}
                        </Badge>
                        <Badge variant='default' dot>
                          {availableTickets} disponibles
                        </Badge>
                      </div>

                      <h3 className='event-name'>{event.name}</h3>
                      <p className='event-description'>
                        {event.description || 'Evento sin descripción'}
                      </p>

                      <div className='event-details'>
                        <div className='event-detail'>
                          <span className='detail-icon'>📅</span>
                          <span>{formatDate(eventDate)}</span>
                        </div>
                        {eventTime && (
                          <div className='event-detail'>
                            <span className='detail-icon'>🕐</span>
                            <span>{eventTime}</span>
                          </div>
                        )}
                        <div className='event-detail'>
                          <span className='detail-icon'>📍</span>
                          <span>{event.location}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home
