import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getImageUrl } from '../../utils/imageUtils'
import { Card, Button, AdCarousel, Icon, Badge, Pagination } from '../../components'
import api from '../../services/api'
import { SkeletonAd, SkeletonEventCard, SkeletonHero } from '../../components/Skeleton/Skeleton'
import { useNotification } from '../../context/NotificationContext'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useSkeletonContext } from '../../context/SkeletonContext'
import './Home.css'

// Category configuration with icons
const CATEGORIES = [
  { id: 'all', name: 'Todos', icon: 'grid' },
  { id: 'concert', name: 'Conciertos', icon: 'music' },
  { id: 'sport', name: 'Deportes', icon: 'sport' },
  { id: 'theater', name: 'Teatro', icon: 'theater' },
  { id: 'festival', name: 'Festivales', icon: 'festival' },
  { id: 'family', name: 'Familiares', icon: 'heart' },
  { id: 'other', name: 'Otros', icon: 'sparkles' }
]

const BADGE_VARIANTS = {
  concert: 'primary',
  sport: 'success',
  theater: 'error',
  festival: 'warning',
  other: 'secondary'
}

const ITEMS_PER_PAGE = 4 // 2x2 Grid per page

const Home = () => {
  const navigate = useNavigate()
  const { error: showError } = useNotification()
  const { user, isGuestPreview } = useAuth()
  const { addToCart } = useCart()
  const { showSkeleton: loading, startLoading, stopLoading } = useSkeletonContext()
  const eventsSectionRef = useRef(null)

  const [searchParams] = useSearchParams()
  const [events, setEvents] = useState([])
  const [ads, setAds] = useState([])
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState(null)
  const [recentlyViewed, setRecentlyViewed] = useState([])

  // Sync with URL params
  useEffect(() => {
    const q = searchParams.get('q') || ''
    const category = searchParams.get('category') || 'all'
    setSearchTerm(q)
    setSelectedCategory(category)
  }, [searchParams])

  // Initial data fetch — removed, handled by the interval useEffect below

  // Fetch events & ads — limit 50 for performance, 120s polling interval
  const fetchInitialData = useCallback(async (background = false) => {
    if (!background) startLoading('home_data')
    try {
      // Parallel fetch for events and ads
      const [eventsResponse, adsResponse] = await Promise.all([
        api.event.getPublic({ limit: 50 }),
        api.ads.getPublic()
      ])
      
      setEvents(eventsResponse || [])
      setAds(adsResponse || [])
      setError(null)
    } catch (err) {
      console.error('Error al cargar datos de Inicio:', err)
      if (!background) {
        setError('No se pudieron cargar los datos. Verifica tu conexión.')
        setEvents([])
        setAds([])
      }
    } finally {
      if (!background) stopLoading('home_data')
    }
  }, [startLoading, stopLoading])

  useEffect(() => {
    fetchInitialData()
    const interval = setInterval(() => fetchInitialData(true), 120000)
    
    const loadRecentlyViewed = () => {
      const items = JSON.parse(localStorage.getItem('recently_viewed') || '[]')
      setRecentlyViewed(items)
    }

    loadRecentlyViewed()
    
    // Listen for storage changes
    window.addEventListener('storage', loadRecentlyViewed)
    // Custom event for same-tab updates
    window.addEventListener('recentlyViewedUpdated', loadRecentlyViewed)

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', loadRecentlyViewed)
      window.removeEventListener('recentlyViewedUpdated', loadRecentlyViewed)
    }
  }, [fetchInitialData])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategory])

  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = events.filter(event => event.status === 'published')

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(term) ||
        event.description?.toLowerCase().includes(term) ||
        event.location?.toLowerCase().includes(term)
      )
    }

    const cityParam = searchParams.get('city')
    if (cityParam && cityParam !== 'Todo México') {
      const city = cityParam.toLowerCase()
      filtered = filtered.filter(event =>
        event.location?.toLowerCase().includes(city) ||
        event.venue?.toLowerCase().includes(city)
      )
    }

    return filtered
  }, [events, selectedCategory, searchTerm, searchParams])

  // Paginated events
  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE)
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredEvents.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredEvents, currentPage])

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
    return str
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

  const handleGoBack = () => {
    navigate(-1)
  }

  return (
    <div className="home">
      {loading ? (
        <SkeletonHero />
      ) : (
        <section className="hero">
          <div className="hero-bg">
            <img src="/117.png" alt="" className="hero-bg-image" loading="eager" />
            <div className="hero-bg-overlay" />
          </div>
          <div className="hero-content">
            <h1 className="hero-title">
              Descubre Eventos <span className="hero-title-accent">Increíbles</span>
            </h1>
            <p className="hero-subtitle">Conciertos, deportes, teatro y festivales. Tu próxima experiencia inolvidable está aquí.</p>
          </div>
        </section>
      )}

      <div className="home-layout">
        <aside className={`home-sidebar home-sidebar--left ${loading ? 'loading' : ''}`}>
          <AdCarousel position="side_left" isLoading={loading} preloadedAds={ads} />
        </aside>

        <main className="home-main">
          <div className="home-banner">
            <AdCarousel position="main" isLoading={loading} preloadedAds={ads} />
          </div>

          {loading ? (
            <div className="events-sections">
              <header className="events-header">
                <div style={{ width: '200px', height: '24px', backgroundColor: '#f0f0f0', borderRadius: '4px' }} className="skeleton" />
                <div style={{ width: '80px', height: '16px', backgroundColor: '#f0f0f0', borderRadius: '4px' }} className="skeleton" />
              </header>
              <div className="events-grid">
                {[1, 2, 3, 4].map(i => <SkeletonEventCard key={i} />)}
              </div>
            </div>
          ) : error && events.length === 0 ? (
            <div className="home-error-view">
              <div className="error-code">ERROR</div>
              <Icon name="alertTriangle" size={80} className="error-icon" />
              <h2 className="error-title">UPS! ALGO SALIÓ MAL</h2>
              <p className="error-message">{error}</p>
              <div className="error-actions">
                <Button variant="primary" size="large" onClick={() => fetchInitialData()}>REINTENTAR</Button>
                <Button variant="secondary" size="large" onClick={handleGoBack}>REGRESAR</Button>
              </div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="events-empty">
              <Icon name="searchEmpty" size={64} className="events-empty-icon" />
              <h3 className="events-empty-title">NO SE ENCONTRARON EVENTOS</h3>
              <Button onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}>LIMPIAR FILTROS</Button>
            </div>
          ) : (
            <div className="events-sections" ref={eventsSectionRef}>
              <header className="events-header">
                <h2 className="events-title">{selectedCategory === 'all' ? 'TODOS LOS EVENTOS' : getCategoryInfo(selectedCategory).name.toUpperCase()}</h2>
                <span className="events-count">{filteredEvents.length} EVENTOS</span>
              </header>
              <div className="events-grid">
                {paginatedEvents.map(event => (
                  <Card
                    key={event.id}
                    className="event-card-container"
                    onClick={() => navigate(`/event/${event.id}`)}
                  >
                    <div className="event-primary-card">
                      <div className="event-card-image">
                        <img src={getImageUrl(event.image_url || event.image)} alt={event.name} loading="lazy" />
                        <div className="event-card-badge">
                          <Badge variant={BADGE_VARIANTS[event.category] || 'secondary'}>
                            {getCategoryInfo(event.category).name}
                          </Badge>
                        </div>
                      </div>
                      <div className="event-card-content">
                        <div className="event-card-venue">
                          <Icon name="mapPin" size={12} />
                          <span>{event.venue || event.location || 'RECINTO POR CONFIRMAR'}</span>
                        </div>
                        <h3 className="event-card-title">{event.name}</h3>
                        <div className="event-card-date">
                          <span>{formatDate(event.event_date || event.date)}</span>
                          <span className="date-separator">•</span>
                          <span>{formatTime(event.start_time || event.time)} HRS</span>
                        </div>
                        <div className="event-card-price-tm">
                          DESDE {formatPrice(event.min_price || 250)}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="events-pagination">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => {
                      setCurrentPage(page);
                      window.scrollTo({ top: eventsSectionRef.current?.offsetTop - 100, behavior: 'smooth' });
                    }}
                  />
                </div>
              )}

              {/* DISCOVERY SECTIONS - INSIDE HOME-MAIN TO PRESERVE SIDEBAR */}
              <section className="discovery-container">
                {/* 1. VISTOS RECIENTEMENTE */}
                {recentlyViewed.length > 0 && (
                  <div className="discovery-section recently-viewed">
                    <header className="section-header">
                      <h2 className="section-title">VISTOS RECIENTEMENTE</h2>
                      <div className="header-line"></div>
                    </header>
                    <div className="recent-pills">
                      {recentlyViewed.map(item => (
                        <div 
                          key={`recent-${item.id}`} 
                          className="recent-pill"
                          onClick={() => navigate(`/event/${item.id}`)}
                        >
                          <img src={getImageUrl(item.image)} alt={item.name} />
                          <span>{item.name}</span>
                          <Icon name="check" size={14} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <hr className="discovery-divider" />

                {/* 2. LO MÁS BUSCADO */}
                <div className="discovery-section most-searched">
                  <header className="section-header">
                    <h2 className="section-title">LO MÁS BUSCADO</h2>
                    <div className="header-line"></div>
                  </header>
                  <div className="most-searched-grid">
                    {events.slice(0, 4).map(event => (
                      <div key={`ms-${event.id}`} className="mini-event-card">
                        <div className="mini-card-image">
                          <img src={getImageUrl(event.image_url || event.image)} alt={event.name} />
                        </div>
                        <div className="mini-card-info">
                          <span className="mini-venue">{event.venue || 'ESTADIO GNP SEGUROS'}</span>
                          <span className="mini-name">{event.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <hr className="discovery-divider" />

                {/* 3. DESCUBRE */}
                <div className="discovery-section discover-grid">
                  <header className="section-header">
                    <h2 className="section-title">DESCUBRE</h2>
                    <div className="header-line"></div>
                  </header>
                  <div className="category-banners">
                    <div className="category-banner">
                      <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600" alt="Ayuda" loading="lazy" />
                      <div className="banner-overlay">
                        <span className="banner-subtitle">ESTAMOS AQUÍ PARA TI</span>
                        <h3 className="banner-title">BOTÓN DE AYUDA</h3>
                        <span className="banner-link">VER MÁS</span>
                      </div>
                    </div>
                    <div className="category-banner">
                      <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600" alt="VIP" loading="lazy" />
                      <div className="banner-overlay">
                        <span className="banner-subtitle">TU PLAN COMIENZA AQUÍ</span>
                        <h3 className="banner-title">PAQUETES VIP</h3>
                        <span className="banner-link">VER MÁS</span>
                      </div>
                    </div>
                    <div className="category-banner">
                      <img src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600" alt="Familiares" loading="lazy" />
                      <div className="banner-overlay">
                        <span className="banner-subtitle">DISFRUTA EN FAMILIA</span>
                        <h3 className="banner-title">FAMILIARES</h3>
                        <span className="banner-link">VER MÁS</span>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="discovery-divider" />

                {/* 4. CIUDADES MÁS BUSCADAS */}
                <div className="discovery-section searched-cities">
                  <header className="section-header">
                    <h2 className="section-title">CIUDADES MÁS BUSCADAS</h2>
                    <div className="header-line"></div>
                  </header>
                  <div className="cities-grid">
                    <div className="city-card">
                      <img src="https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=400" alt="CDMX" loading="lazy" />
                      <span className="city-name-link">Ciudad de México</span>
                    </div>
                    <div className="city-card">
                      <img src="https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400" alt="Guadalajara" loading="lazy" />
                      <span className="city-name-link">Guadalajara</span>
                    </div>
                    <div className="city-card">
                      <img src="https://images.unsplash.com/photo-1577017040065-650ee4d43339?w=400" alt="Monterrey" loading="lazy" />
                      <span className="city-name-link">Monterrey</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>

        <aside className={`home-sidebar home-sidebar--right ${loading ? 'loading' : ''}`}>
          <AdCarousel position="side_right" isLoading={loading} preloadedAds={ads} />
        </aside>
      </div>
    </div>
  )
}

export default Home
