import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getImageUrl } from '../utils/imageUtils'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Input from '../components/Input'
import Spinner from '../components/Spinner'
import AdCarousel from '../components/AdCarousel'
import Icon from '../components/Icons'
import api from '../services/api'
import { useNotification } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'
import './Home.css'

// Category configuration with icons
const CATEGORIES = [
  { id: 'all', name: 'Todos', icon: 'grid' },
  { id: 'concert', name: 'Conciertos', icon: 'music' },
  { id: 'sport', name: 'Deportes', icon: 'sport' },
  { id: 'theater', name: 'Teatro', icon: 'theater' },
  { id: 'festival', name: 'Festivales', icon: 'festival' },
  { id: 'other', name: 'Otros', icon: 'sparkles' }
]

const BADGE_VARIANTS = {
  concert: 'primary',
  sport: 'success',
  theater: 'error',
  festival: 'warning',
  other: 'secondary'
}

const Home = () => {
  const navigate = useNavigate()
  const { error: showError } = useNotification()
  const { user, isGuestPreview } = useAuth()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Fetch events
  const fetchEvents = useCallback(async (background = false) => {
    if (!background) setLoading(true)
    try {
      const response = await api.event.getPublic()
      setEvents(response)
    } catch (error) {
      console.error('Error al cargar eventos:', error)
      if (!background) {
        showError('Error al cargar eventos')
        setEvents([])
      }
    } finally {
      if (!background) setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    fetchEvents()
    const interval = setInterval(() => fetchEvents(true), 30000) // 30s refresh
    return () => clearInterval(interval)
  }, [fetchEvents])

  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = events

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(term) ||
        event.description?.toLowerCase().includes(term) ||
        event.location.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [events, selectedCategory, searchTerm])

  // Formatters
  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  const formatTime = (time) => {
    if (!time) return ''
    const str = String(time)
    if (str.includes(':')) return str.substring(0, 5)
    if (!isNaN(time)) {
      const totalSec = parseInt(time, 10)
      const h = Math.floor(totalSec / 3600).toString().padStart(2, '0')
      const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0')
      return `${h}:${m}`
    }
    return ''
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(price || 0)
  }

  const getCategoryInfo = (categoryId) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[5]
  }

  if (loading) {
    return <Spinner fullScreen text="Cargando eventos..." />
  }

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <img
            src="/117.png"
            alt=""
            className="hero-bg-image"
            loading="eager"
          />
          <div className="hero-bg-overlay" />
        </div>

        <div className="hero-content">
          <h1 className="hero-title">
            Descubre Eventos
            <span className="hero-title-accent">Increíbles</span>
          </h1>
          <p className="hero-subtitle">
            Conciertos, deportes, teatro y festivales.
            Tu próxima experiencia inolvidable está aquí.
          </p>

          {(!user || isGuestPreview) && (
            <div className="hero-actions">
              <Button
                variant="primary"
                size="large"
                onClick={() => navigate('/register')}
              >
                Crear Cuenta
                <Icon name="arrowRight" size={18} />
              </Button>
              <Button
                variant="secondary"
                size="large"
                onClick={() => navigate('/login')}
              >
                Iniciar Sesión
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Main Layout */}
      <div className="home-layout">
        {/* Left Ad Column */}
        <aside className="home-sidebar home-sidebar--left">
          <AdCarousel position="side_left" />
        </aside>

        {/* Main Content */}
        <main className="home-main">
          {/* Ad Banner */}
          <div className="home-banner">
            <AdCarousel position="main" />
          </div>

          {/* Filters Section */}
          <section className="filters">
            <div className="filters-search">
              <Input
                type="text"
                placeholder="Buscar eventos por nombre, descripción o ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Icon name="search" />}
                size="large"
              />
            </div>

            <div className="filters-categories">
              {CATEGORIES.map(category => (
                <button
                  key={category.id}
                  className={`category-chip ${selectedCategory === category.id ? 'category-chip--active' : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                  aria-pressed={selectedCategory === category.id}
                >
                  <Icon name={category.icon} size={16} />
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Events Section */}
          <section className="events">
            <header className="events-header">
              <h2 className="events-title">
                {selectedCategory === 'all'
                  ? 'Todos los Eventos'
                  : getCategoryInfo(selectedCategory).name
                }
              </h2>
              <span className="events-count">
                {filteredEvents.length} {filteredEvents.length === 1 ? 'evento' : 'eventos'}
              </span>
            </header>

            {filteredEvents.length === 0 ? (
              <div className="events-empty">
                <Icon
                  name={searchTerm || selectedCategory !== 'all' ? 'searchEmpty' : 'empty'}
                  size={64}
                  className="events-empty-icon"
                />
                <h3 className="events-empty-title">
                  {searchTerm || selectedCategory !== 'all'
                    ? 'No se encontraron eventos'
                    : 'No hay eventos disponibles'
                  }
                </h3>
                <p className="events-empty-text">
                  {searchTerm || selectedCategory !== 'all'
                    ? 'Intenta con otros términos o categorías'
                    : 'Vuelve pronto para ver nuevos eventos'
                  }
                </p>
                {(searchTerm || selectedCategory !== 'all') && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedCategory('all')
                    }}
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
            ) : (
              <div className="events-grid">
                {filteredEvents.map(event => {
                  const eventDate = event.event_date || event.date
                  const eventTime = event.event_time || event.time
                  const availableTickets = event.available_tickets || event.availableTickets || 0
                  const imageUrl = getImageUrl(event.image_url || event.image)
                  const categoryInfo = getCategoryInfo(event.category)

                  return (
                    <Card
                      key={event.id}
                      image={imageUrl}
                      imageAlt={event.name}
                      hoverable
                      size="medium"
                      onClick={() => navigate(`/event/${event.id}`)}
                      footer={
                        <div className="event-footer">
                          <span className="event-price">
                            {formatPrice(event.price)}
                          </span>
                          <Button size="small" variant="primary">
                            Ver Detalles
                            <Icon name="chevronRight" size={14} />
                          </Button>
                        </div>
                      }
                    >
                      <div className="event-content">
                        {/* Badges */}
                        <div className="event-badges">
                          <Badge
                            variant={BADGE_VARIANTS[event.category] || 'secondary'}
                            rounded
                            size="small"
                          >
                            <Icon name={categoryInfo.icon} size={12} />
                            {categoryInfo.name}
                          </Badge>
                          <Badge
                            variant={availableTickets > 10 ? 'success' : 'warning'}
                            dot
                            size="small"
                          >
                            {availableTickets} disponibles
                          </Badge>
                        </div>

                        {/* Event Name */}
                        <h3 className="event-name">{event.name}</h3>

                        {/* Description */}
                        <p className="event-description">
                          {event.description || 'Un evento único e inolvidable.'}
                        </p>

                        {/* Details */}
                        <div className="event-details">
                          <div className="event-detail">
                            <Icon name="calendar" size={16} />
                            <span>{formatDate(eventDate)}</span>
                          </div>
                          {eventTime && (
                            <div className="event-detail">
                              <Icon name="clock" size={16} />
                              <span>{formatTime(eventTime)} hrs</span>
                            </div>
                          )}
                          <div className="event-detail">
                            <Icon name="mapPin" size={16} />
                            <span>{event.location}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </section>
        </main>

        {/* Right Ad Column */}
        <aside className="home-sidebar home-sidebar--right">
          <AdCarousel position="side_right" />
        </aside>
      </div>
    </div>
  )
}

export default Home
