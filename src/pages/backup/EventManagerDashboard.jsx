import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Table, Modal, Input, Alert, Spinner } from '../components';
import './EventManagerDashboard.css';

const EventManagerDashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [alert, setAlert] = useState(null);
  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    location: '',
    category: 'concert',
    price: '',
    totalTickets: '',
    image: ''
  });

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    setLoading(true);
    try {
      // TODO: Integrar con API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockEvents = [
        {
          id: 1,
          name: 'Festival de Música Electrónica',
          date: '2025-02-15',
          location: 'Arena CDMX',
          category: 'festival',
          status: 'published',
          soldTickets: 320,
          totalTickets: 500,
          revenue: 272000
        },
        {
          id: 2,
          name: 'Concierto: Café Tacvba',
          date: '2025-03-01',
          location: 'Foro Sol',
          category: 'concert',
          status: 'draft',
          soldTickets: 0,
          totalTickets: 850,
          revenue: 0
        }
      ];
      
      setEvents(mockEvents);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEventForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setEventForm({
      name: '',
      description: '',
      date: '',
      time: '',
      location: '',
      category: 'concert',
      price: '',
      totalTickets: '',
      image: ''
    });
    setShowEventModal(true);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setEventForm({
      name: event.name,
      description: event.description || '',
      date: event.date,
      time: event.time || '',
      location: event.location,
      category: event.category,
      price: event.price || '',
      totalTickets: event.totalTickets,
      image: event.image || ''
    });
    setShowEventModal(true);
  };

  const handleSaveEvent = async () => {
    try {
      // TODO: Integrar con API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAlert({
        type: 'success',
        message: selectedEvent ? 'Evento actualizado exitosamente' : 'Evento creado exitosamente'
      });
      
      setShowEventModal(false);
      fetchMyEvents();
    } catch (error) {
      setAlert({ type: 'error', message: 'Error al guardar el evento' });
    }
  };

  const handlePublishEvent = async (eventId) => {
    try {
      // TODO: Integrar con API
      await new Promise(resolve => setTimeout(resolve, 500));
      setAlert({ type: 'success', message: 'Evento publicado exitosamente' });
      fetchMyEvents();
    } catch (error) {
      setAlert({ type: 'error', message: 'Error al publicar el evento' });
    }
  };

  const eventColumns = [
    { key: 'name', header: 'Evento', sortable: true },
    { 
      key: 'date', 
      header: 'Fecha',
      render: (value) => new Date(value).toLocaleDateString('es-MX')
    },
    { key: 'location', header: 'Lugar' },
    {
      key: 'status',
      header: 'Estado',
      render: (value) => (
        <Badge variant={value === 'published' ? 'success' : 'warning'}>
          {value === 'published' ? 'Publicado' : 'Borrador'}
        </Badge>
      )
    },
    {
      key: 'soldTickets',
      header: 'Boletos',
      render: (value, row) => `${value} / ${row.totalTickets}`
    },
    {
      key: 'revenue',
      header: 'Ingresos',
      render: (value) => `$${value.toLocaleString('es-MX')}`
    }
  ];

  if (loading) {
    return <Spinner fullScreen text="Cargando tus eventos..." />;
  }

  return (
    <div className="event-manager-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Gestión de Eventos</h1>
          <p>Crea y administra tus eventos</p>
        </div>
        <Button variant="primary" size="large" onClick={handleCreateEvent}>
          + Crear Evento
        </Button>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          closable
          onClose={() => setAlert(null)}
        />
      )}

      <div className="stats-row">
        <Card className="stat-card-small">
          <div className="stat-content-small">
            <span className="stat-icon-small">🎫</span>
            <div>
              <p className="stat-label-small">Total Eventos</p>
              <h3 className="stat-value-small">{events.length}</h3>
            </div>
          </div>
        </Card>

        <Card className="stat-card-small">
          <div className="stat-content-small">
            <span className="stat-icon-small">✅</span>
            <div>
              <p className="stat-label-small">Publicados</p>
              <h3 className="stat-value-small">
                {events.filter(e => e.status === 'published').length}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="stat-card-small">
          <div className="stat-content-small">
            <span className="stat-icon-small">💰</span>
            <div>
              <p className="stat-label-small">Ingresos Totales</p>
              <h3 className="stat-value-small">
                ${events.reduce((sum, e) => sum + e.revenue, 0).toLocaleString('es-MX')}
              </h3>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Mis Eventos">
        <Table
          columns={eventColumns}
          data={events}
          sortable
          hoverable
          striped
          onRowClick={(row) => handleEditEvent(row)}
        />
      </Card>

      {/* Modal de Crear/Editar Evento */}
      <Modal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        title={selectedEvent ? 'Editar Evento' : 'Crear Nuevo Evento'}
        size="large"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEventModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSaveEvent}>
              {selectedEvent ? 'Actualizar' : 'Crear'} Evento
            </Button>
          </>
        }
      >
        <div className="event-form">
          <Input
            label="Nombre del Evento"
            name="name"
            value={eventForm.name}
            onChange={handleInputChange}
            placeholder="Ej: Festival de Música"
            required
            fullWidth
          />

          <Input
            label="Descripción"
            name="description"
            value={eventForm.description}
            onChange={handleInputChange}
            placeholder="Describe tu evento"
            fullWidth
          />

          <div className="form-row">
            <Input
              label="Fecha"
              type="date"
              name="date"
              value={eventForm.date}
              onChange={handleInputChange}
              required
              fullWidth
            />

            <Input
              label="Hora"
              type="time"
              name="time"
              value={eventForm.time}
              onChange={handleInputChange}
              required
              fullWidth
            />
          </div>

          <Input
            label="Ubicación"
            name="location"
            value={eventForm.location}
            onChange={handleInputChange}
            placeholder="Ej: Arena CDMX"
            required
            fullWidth
          />

          <div className="form-row">
            <div className="input-wrapper">
              <label className="input__label">Categoría</label>
              <select
                name="category"
                value={eventForm.category}
                onChange={handleInputChange}
                className="input"
              >
                <option value="concert">Concierto</option>
                <option value="sport">Deporte</option>
                <option value="theater">Teatro</option>
                <option value="festival">Festival</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <Input
              label="Precio"
              type="number"
              name="price"
              value={eventForm.price}
              onChange={handleInputChange}
              placeholder="0.00"
              required
              fullWidth
            />
          </div>

          <Input
            label="Total de Boletos"
            type="number"
            name="totalTickets"
            value={eventForm.totalTickets}
            onChange={handleInputChange}
            placeholder="100"
            required
            fullWidth
          />

          <Input
            label="URL de Imagen"
            name="image"
            value={eventForm.image}
            onChange={handleInputChange}
            placeholder="https://..."
            fullWidth
          />
        </div>
      </Modal>
    </div>
  );
};

export default EventManagerDashboard;
