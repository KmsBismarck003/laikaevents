import React, { useState, useEffect } from 'react'
import { Card, Button, Badge, Table, Input, Icon, SkeletonRow, ConfirmationModal } from '../../../components'
import { useNotification } from '../../../context/NotificationContext'
import { venueAPI } from '../../../services/api'
import { useSkeletonContext } from '../../../context/SkeletonContext'
import VenueFormModal from '../../../components/VenueFormModal'
import './admin.css' // Reuse admin styles

const Venues = () => {
  const { success, error: showError } = useNotification()
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const { showSkeleton } = useSkeletonContext()
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

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [venueToDelete, setVenueToDelete] = useState(null)

  const handleDelete = (venue) => {
    setVenueToDelete(venue)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!venueToDelete) return
    try {
      await venueAPI.delete(venueToDelete.id)
      success('Recinto eliminado/desactivado')
      fetchVenues()
      setIsDeleteModalOpen(false)
      setVenueToDelete(null)
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
      render: (val) => <Badge variant={val === 'active' ? 'success' : 'danger'} rounded>{val === 'active' ? 'ACTIVO' : 'INACTIVO'}</Badge>
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button size="small" variant="warning" onClick={(e) => { e.stopPropagation(); openEditModal(row) }}>
            <Icon name="edit" size={12} className="mr-1" /> EDITAR
          </Button>
          <Button size="small" variant="danger" onClick={(e) => { e.stopPropagation(); handleDelete(row) }}>
            <Icon name="trash" size={12} className="mr-1" /> ELIMINAR
          </Button>
        </div>
      )
    }
  ]


  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Gestión de Recintos</h1>
        <Button variant="primary" onClick={openCreateModal}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="plus" size={18} /> Nuevo Recinto
          </div>
        </Button>
      </div>

      <Card className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
          <div style={{ width: '300px' }}>
            <Input
              placeholder="Buscar por nombre o ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Icon name="search" size={16} />}
            />
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            {filteredVenues.length} REGISTROS
          </div>
        </div>
        {showSkeleton ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
              {['NOMBRE', 'CIUDAD', 'DIRECCIÓN', 'CAPACIDAD', 'ESTADO', 'ACCIONES'].map(h => <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{h}</th>)}
            </tr></thead>
            <tbody>{Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} columns={6} />)}</tbody>
          </table>
        ) : filteredVenues.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <Icon name="map" size={48} style={{ opacity: 0.1 }} />
            <p style={{ fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
              No hay recintos registrados
            </p>
            <Button size="small" variant="secondary" onClick={() => setSearchTerm('')}>Ver todos</Button>
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

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setVenueToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Recinto"
        message={`¿Estás seguro de que deseas eliminar permanentemente el recinto "${venueToDelete?.name}"? Si tiene eventos asociados, se desactivará en su lugar.`}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  )
}

export default Venues
