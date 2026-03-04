import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import { Card, Button, Table, Badge, Spinner } from '../../components'
import './admin.css'

const Events = () => {
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      try {
        const data = await api.event.getAll()
        setEvents(data)
      } catch (error) {
        console.error('Error fetching events:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const columns = [
    { key: 'name', header: 'Evento' },
    {
      key: 'event_date',
      header: 'Fecha',
      render: (val) => new Date(val).toLocaleDateString()
    },
    {
      key: 'status',
      header: 'Estado',
      render: (val) => {
        const variants = { published: 'success', draft: 'warning', cancelled: 'danger' }
        return <Badge variant={variants[val] || 'default'}>{val}</Badge>
      }
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: () => <Button size="small">Editar</Button>
    }
  ]

  if (loading) return <Spinner fullScreen text="Cargando eventos..." />

  return (
    <div className="admin-events-page">
      <div className="page-header">
        <h1>Gestión de Eventos</h1>
        <Button>Crear Nuevo Evento</Button>
      </div>
      <Card className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <Table columns={columns} data={events} />
      </Card>
    </div>
  )
}

export default Events
