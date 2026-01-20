import React, { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Badge,
  Table,
  Modal,
  Input,
  Alert,
  Spinner
} from '../components'
import api from '../services/api' // ← IMPORTAR API
import { useNotification } from '../context/NotificationContext'
import './EventManagerDashboard.css'

const EventManagerDashboard = () => {
  const { success, error: showError } = useNotification()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [alert, setAlert] = useState(null)
  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    location: '',
    venue: '',
    category: 'concert',
    price: '',
    totalTickets: '',
    image: ''
  })

  useEffect(() => {
    fetchMyEvents()
  }, [])

  const fetchMyEvents = async () => {
    setLoading(true)
    try {
      // ✅ USAR API REAL
      const response = await api.event.getMyEvents()
      console.log('✅ Eventos obtenidos:', response)
      setEvents(response)
    } catch (error) {
      console.error('❌ Error al cargar eventos:', error)
      showError('Error al cargar eventos')
      setEvents([]) // Mostrar vacío si hay error
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = e => {
    const { name, value } = e.target
    setEventForm(prev => ({ ...prev, [name]: value }))
  }

  const handleCreateEvent = () => {
    setSelectedEvent(null)
    setEventForm({
      name: '',
      description: '',
      date: '',
      time: '',
      location: '',
      venue: '',
      category: 'concert',
      price: '',
      totalTickets: '',
      image: ''
    })
    setShowEventModal(true)
  }

  const handleEditEvent = event => {
    setSelectedEvent(event)
    setEventForm({
      name: event.name,
      description: event.description || '',
      date: event.date || event.event_date,
      time: event.time || event.event_time,
      location: event.location,
      venue: event.venue || '',
      category: event.category,
      price: event.price || '',
      totalTickets: event.totalTickets || event.total_tickets,
      image: event.image || event.image_url || ''
    })
    setShowEventModal(true)
  }

  const handleSaveEvent = async () => {
    try {
      console.log('📤 Guardando evento:', eventForm)

      // Validación básica
      if (!eventForm.name || !eventForm.date || !eventForm.location) {
        setAlert({ type: 'error', message: 'Completa los campos requeridos' })
        return
      }

      // Preparar datos para la API
      const eventData = {
        name: eventForm.name,
        description: eventForm.description,
        event_date: eventForm.date,
        event_time: eventForm.time,
        location: eventForm.location,
        venue: eventForm.venue || eventForm.location,
        category: eventForm.category,
        price: parseFloat(eventForm.price) || 0,
        total_tickets: parseInt(eventForm.totalTickets) || 0,
        available_tickets: parseInt(eventForm.totalTickets) || 0,
        image_url: eventForm.image,
        status: 'draft' // Crear como borrador
      }

      let response
      if (selectedEvent) {
        // ✅ ACTUALIZAR EVENTO
        response = await api.event.update(selectedEvent.id, eventData)
        console.log('✅ Evento actualizado:', response)
        success('Evento actualizado exitosamente')
      } else {
        // ✅ CREAR EVENTO
        response = await api.event.create(eventData)
        console.log('✅ Evento creado:', response)
        success('Evento creado exitosamente')
      }

      setShowEventModal(false)
      fetchMyEvents() // Recargar lista
    } catch (error) {
      console.error('❌ Error al guardar evento:', error)
      const errorMsg = error.message || 'Error al guardar el evento'
      setAlert({ type: 'error', message: errorMsg })
      showError(errorMsg)
    }
  }

  const handlePublishEvent = async eventId => {
    try {
      console.log('📤 Publicando evento:', eventId)

      // ✅ PUBLICAR EVENTO
      await api.event.publish(eventId)

      success('Evento publicado exitosamente')
      fetchMyEvents() // Recargar lista
    } catch (error) {
      console.error('❌ Error al publicar evento:', error)
      showError('Error al publicar el evento')
    }
  }

  const handleDeleteEvent = async eventId => {
    if (!window.confirm('¿Estás seguro de eliminar este evento?')) {
      return
    }

    try {
      console.log('📤 Eliminando evento:', eventId)

      // ✅ ELIMINAR EVENTO
      await api.event.delete(eventId)

      success('Evento eliminado exitosamente')
      fetchMyEvents() // Recargar lista
    } catch (error) {
      console.error('❌ Error al eliminar evento:', error)
      showError('Error al eliminar el evento')
    }
  }

  const eventColumns = [
    { key: 'name', header: 'Evento', sortable: true },
    {
      key: 'event_date',
      header: 'Fecha',
      render: value =>
        value ? new Date(value).toLocaleDateString('es-MX') : '-'
    },
    { key: 'location', header: 'Lugar' },
    {
      key: 'status',
      header: 'Estado',
      render: value => (
        <Badge variant={value === 'published' ? 'success' : 'warning'}>
          {value === 'published' ? 'Publicado' : 'Borrador'}
        </Badge>
      )
    },
    {
      key: 'available_tickets',
      header: 'Boletos',
      render: (value, row) => {
        const sold = (row.total_tickets || 0) - (value || 0)
        return `${sold} / ${row.total_tickets || 0}`
      }
    },
    {
      key: 'price',
      header: 'Precio',
      render: value => `$${(value || 0).toLocaleString('es-MX')}`
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (value, row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {row.status === 'draft' && (
            <Button
              size='small'
              variant='success'
              onClick={e => {
                e.stopPropagation()
                handlePublishEvent(row.id)
              }}
            >
              Publicar
            </Button>
          )}
          <Button
            size='small'
            variant='danger'
            onClick={e => {
              e.stopPropagation()
              handleDeleteEvent(row.id)
            }}
          >
            Eliminar
          </Button>
        </div>
      )
    }
  ]

  if (loading) {
    return <Spinner fullScreen text='Cargando tus eventos...' />
  }

  return (
    <div className='event-manager-dashboard'>
      <div className='dashboard-header'>
        <div>
          <h1>Gestión de Eventos</h1>
          <p>Crea y administra tus eventos</p>
        </div>
        <Button variant='primary' size='large' onClick={handleCreateEvent}>
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

      <div className='stats-row'>
        <Card className='stat-card-small'>
          <div className='stat-content-small'>
            <span className='stat-icon-small'>🎫</span>
            <div>
              <p className='stat-label-small'>Total Eventos</p>
              <h3 className='stat-value-small'>{events.length}</h3>
            </div>
          </div>
        </Card>

        <Card className='stat-card-small'>
          <div className='stat-content-small'>
            <span className='stat-icon-small'>✅</span>
            <div>
              <p className='stat-label-small'>Publicados</p>
              <h3 className='stat-value-small'>
                {events.filter(e => e.status === 'published').length}
              </h3>
            </div>
          </div>
        </Card>

        <Card className='stat-card-small'>
          <div className='stat-content-small'>
            <span className='stat-icon-small'>📝</span>
            <div>
              <p className='stat-label-small'>Borradores</p>
              <h3 className='stat-value-small'>
                {events.filter(e => e.status === 'draft').length}
              </h3>
            </div>
          </div>
        </Card>
      </div>

      <Card title='Mis Eventos'>
        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>No tienes eventos creados</p>
            <Button variant='primary' onClick={handleCreateEvent}>
              Crear tu primer evento
            </Button>
          </div>
        ) : (
          <Table
            columns={eventColumns}
            data={events}
            sortable
            hoverable
            striped
            onRowClick={row => handleEditEvent(row)}
          />
        )}
      </Card>

      {/* Modal de Crear/Editar Evento */}
      <Modal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        title={selectedEvent ? 'Editar Evento' : 'Crear Nuevo Evento'}
        size='large'
        footer={
          <>
            <Button
              variant='secondary'
              onClick={() => setShowEventModal(false)}
            >
              Cancelar
            </Button>
            <Button variant='primary' onClick={handleSaveEvent}>
              {selectedEvent ? 'Actualizar' : 'Crear'} Evento
            </Button>
          </>
        }
      >
        <div className='event-form'>
          <Input
            label='Nombre del Evento'
            name='name'
            value={eventForm.name}
            onChange={handleInputChange}
            placeholder='Ej: Festival de Música'
            required
            fullWidth
          />

          <Input
            label='Descripción'
            name='description'
            value={eventForm.description}
            onChange={handleInputChange}
            placeholder='Describe tu evento'
            fullWidth
          />

          <div className='form-row'>
            <Input
              label='Fecha'
              type='date'
              name='date'
              value={eventForm.date}
              onChange={handleInputChange}
              required
              fullWidth
            />

            <Input
              label='Hora'
              type='time'
              name='time'
              value={eventForm.time}
              onChange={handleInputChange}
              required
              fullWidth
            />
          </div>

          <Input
            label='Ubicación'
            name='location'
            value={eventForm.location}
            onChange={handleInputChange}
            placeholder='Ej: Arena CDMX'
            required
            fullWidth
          />

          <Input
            label='Venue'
            name='venue'
            value={eventForm.venue}
            onChange={handleInputChange}
            placeholder='Ej: Sala Principal'
            fullWidth
          />

          <div className='form-row'>
            <div className='input-wrapper'>
              <label className='input__label'>Categoría</label>
              <select
                name='category'
                value={eventForm.category}
                onChange={handleInputChange}
                className='input'
              >
                <option value='concert'>Concierto</option>
                <option value='sport'>Deporte</option>
                <option value='theater'>Teatro</option>
                <option value='festival'>Festival</option>
                <option value='other'>Otro</option>
              </select>
            </div>

            <Input
              label='Precio'
              type='number'
              name='price'
              value={eventForm.price}
              onChange={handleInputChange}
              placeholder='0.00'
              required
              fullWidth
            />
          </div>

          <Input
            label='Total de Boletos'
            type='number'
            name='totalTickets'
            value={eventForm.totalTickets}
            onChange={handleInputChange}
            placeholder='100'
            required
            fullWidth
          />

          <Input
            label='URL de Imagen'
            name='image'
            value={eventForm.image}
            onChange={handleInputChange}
            placeholder='https://...'
            fullWidth
          />
        </div>
      </Modal>
    </div>
  )
}

export default EventManagerDashboard
