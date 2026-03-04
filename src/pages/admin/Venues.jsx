import React, { useState, useEffect } from 'react'
import { Card, Button, Badge, Table, Spinner, Input } from '../../components'
import { useNotification } from '../../context/NotificationContext'
import { venueAPI } from '../../services/api'
import VenueFormModal from '../../components/VenueFormModal'
import './admin.css' // Reuse admin styles

const Venues = () => {
  const { success, error: showError } = useNotification()
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchVenues = async () => {
    setLoading(true)
    try {
      const data = await venueAPI.getAll('all')
      setVenues(data)
    } catch (err) {
      console.error(err)
      showError('Error al cargar recintos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVenues()
  }, [])

  const handleCreate = async (data) => {
    await venueAPI.create(data)
    success('Recinto creado exitosamente')
    fetchVenues()
  }

  const handleUpdate = async (data) => {
    if (!selectedVenue) return
    await venueAPI.update(selectedVenue.id, data)
    success('Recinto actualizado exitosamente')
    fetchVenues()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este recinto? Si tiene eventos asociados, se desactivará en su lugar.')) return
    try {
      await venueAPI.delete(id)
      success('Recinto eliminado/desactivado')
      fetchVenues()
    } catch (err) {
      showError(err.message || 'Error al eliminar recinto')
    }
  }

  const openCreateModal = () => {
    setSelectedVenue(null)
    setShowModal(true)
  }

  const openEditModal = (venue) => {
    setSelectedVenue(venue)
    setShowModal(true)
  }

  const filteredVenues = venues.filter(v =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.city.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const columns = [
    { key: 'name', header: 'Nombre' },
    { key: 'city', header: 'Ciudad' },
    { key: 'address', header: 'Dirección' },
    { key: 'capacity', header: 'Capacidad', render: (val) => val ? val.toLocaleString() : '—' },
    {
      key: 'status',
      header: 'Estado',
      render: (val) => <Badge variant={val === 'active' ? 'success' : 'danger'}>{val === 'active' ? 'Activo' : 'Inactivo'}</Badge>
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (_, row) => (
        <div className="table-actions" style={{ display: 'flex', gap: '8px' }}>
          <Button size="small" variant="secondary" onClick={(e) => { e.stopPropagation(); openEditModal(row) }}>
            ✏️ Editar
          </Button>
          <Button size="small" variant="danger" onClick={(e) => { e.stopPropagation(); handleDelete(row.id) }}>
            🗑️ Eliminar
          </Button>
        </div>
      )
    }
  ]

  if (loading && venues.length === 0) return <Spinner fullScreen text="Cargando recintos..." />

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Gestión de Recintos</h1>
        <Button variant="primary" onClick={openCreateModal}>
          ➕ Nuevo Recinto
        </Button>
      </div>

      <Card>
        <div className="toolbar" style={{ marginBottom: '1rem' }}>
            <Input
                placeholder="Buscar recinto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon="🔍"
            />
        </div>

        {filteredVenues.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                No hay recintos registrados o no coinciden con la búsqueda.
            </div>
        ) : (
            <Table columns={columns} data={filteredVenues} />
        )}
      </Card>

      <VenueFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        venue={selectedVenue}
        onSubmit={selectedVenue ? handleUpdate : handleCreate}
      />
    </div>
  )
}

export default Venues
