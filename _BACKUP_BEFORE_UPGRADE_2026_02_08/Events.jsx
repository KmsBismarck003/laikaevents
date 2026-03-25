import React, { useState, useEffect } from 'react'
import { Card, Button, Table, Badge, Spinner } from '../../components'
import './admin.css'

const Events = () => {
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])

  useEffect(() => {
    // Simulate fetching
    setTimeout(() => {
      setEvents([
        { id: 1, name: 'Concierto Rock', date: '2023-12-01', status: 'active' },
        { id: 2, name: 'Festival Jazz', date: '2023-12-15', status: 'draft' }
      ])
      setLoading(false)
    }, 500)
  }, [])

  const columns = [
    { key: 'name', header: 'Evento' },
    { key: 'date', header: 'Fecha' },
    { key: 'status', header: 'Estado' },
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
      <Card>
        <Table columns={columns} data={events} />
      </Card>
    </div>
  )
}

export default Events
