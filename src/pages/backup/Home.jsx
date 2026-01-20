import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Input, Spinner } from '../components';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'concert', name: 'Conciertos' },
    { id: 'sport', name: 'Deportes' },
    { id: 'theater', name: 'Teatro' },
    { id: 'festival', name: 'Festivales' },
    { id: 'other', name: 'Otros' }
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [searchTerm, selectedCategory, events]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // TODO: Integrar con API de FastAPI
      // const response = await getPublicEvents();
      
      // Datos de ejemplo
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockEvents = [
        {
          id: 1,
          name: 'Festival de Música Electrónica',
          description: 'Los mejores DJs internacionales en un solo lugar',
          date: '2025-02-15',
          time: '20:00',
          location: 'Arena CDMX',
          category: 'festival',
          price: 850,
          availableTickets: 500,
          image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800'
        },
        {
          id: 2,
          name: 'Obra de Teatro: El Rey León',
          description: 'Musical premiado con efectos especiales',
          date: '2025-02-20',
          time: '19:00',
          location: 'Teatro Metropolitan',
          category: 'theater',
          price: 650,
          availableTickets: 120,
          image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800'
        },
        {
          id: 3,
          name: 'Partido: América vs Guadalajara',
          description: 'Clásico Nacional - Semifinal',
          date: '2025-02-18',
          time: '21:00',
          location: 'Estadio Azteca',
          category: 'sport',
          price: 450,
          availableTickets: 2000,
          image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800'
        },
        {
          id: 4,
          name: 'Concierto: Café Tacvba',
          description: 'Tour 30 años de carrera',
          date: '2025-03-01',
          time: '21:00',
          location: 'Foro Sol',
          category: 'concert',
          price: 950,
          availableTickets: 850,
          image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800'
        }
      ];
      
      setEvents(mockEvents);
      setFilteredEvents(mockEvents);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredEvents(filtered);
  };

  const handleEventClick = (eventId) => {
    navigate(`/event/${eventId}`);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-MX', options);
  };

  const getCategoryBadgeVariant = (category) => {
    const variants = {
      concert: 'primary',
      sport: 'success',
      theater: 'danger',
      festival: 'warning',
      other: 'default'
    };
    return variants[category] || 'default';
  };

  if (loading) {
    return <Spinner fullScreen text="Cargando eventos..." />;
  }

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Descubre Eventos Increíbles</h1>
          <p className="hero-subtitle">
            Los mejores conciertos, deportes, teatro y festivales en un solo lugar
          </p>
        </div>
      </section>

      <div className="home-container">
        <div className="filters-section">
          <Input
            type="text"
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<span>🔍</span>}
            className="search-input"
          />

          <div className="category-filters">
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

        <div className="events-section">
          <div className="section-header">
            <h2>Eventos Disponibles</h2>
            <span className="event-count">
              {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="no-events">
              <p>No se encontraron eventos que coincidan con tu búsqueda</p>
            </div>
          ) : (
            <div className="events-grid">
              {filteredEvents.map(event => (
                <Card
                  key={event.id}
                  image={event.image}
                  hoverable
                  onClick={() => handleEventClick(event.id)}
                  footer={
                    <div className="card-footer-content">
                      <span className="event-price">${event.price.toLocaleString('es-MX')}</span>
                      <Button size="small" variant="primary">
                        Ver Detalles
                      </Button>
                    </div>
                  }
                >
                  <div className="event-card-content">
                    <div className="event-header">
                      <Badge variant={getCategoryBadgeVariant(event.category)} rounded>
                        {categories.find(c => c.id === event.category)?.name}
                      </Badge>
                      <Badge variant="default" dot>
                        {event.availableTickets} disponibles
                      </Badge>
                    </div>
                    
                    <h3 className="event-name">{event.name}</h3>
                    <p className="event-description">{event.description}</p>
                    
                    <div className="event-details">
                      <div className="event-detail">
                        <span className="detail-icon">📅</span>
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="event-detail">
                        <span className="detail-icon">🕐</span>
                        <span>{event.time}</span>
                      </div>
                      <div className="event-detail">
                        <span className="detail-icon">📍</span>
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
