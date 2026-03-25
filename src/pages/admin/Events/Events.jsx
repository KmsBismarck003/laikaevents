import React, { useState, useEffect } from 'react'
import api from '../../../services/api'
import { Card, Button, Table, Badge, SkeletonRow, Modal, ConfirmationModal, Input, Pagination, Icon } from '../../../components'
import Skeleton from '../../../components/Skeleton/Skeleton';
import { useSkeletonContext } from '../../../context/SkeletonContext'
import EventForm from './EventForm'
import PreviewMonitor from '../../../components/Admin/PreviewMonitor'
import { getImageUrl } from '../../../utils/imageUtils'
import './admin.css'

const Events = () => {
  const [loading, setLoading] = useState(true)
  const { showSkeleton } = useSkeletonContext()
  const [events, setEvents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const itemsPerPage = 8

  // State for Form Modal
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState(null)

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

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleEditClick = async (event) => {
    try {
      // Necesitamos hacer fetch del detalle exacto para traer las secciones y reglas
      const data = await api.event.getById(event.id)
      setSelectedEvent(data)
      setIsFormOpen(true)
    } catch (error) {
      console.error("Error al cargar detalles del evento:", error)
      alert("Error al intentar editar el evento. Revisa la conexión.")
    }
  }

  const handleDeleteClick = (event) => {
    setEventToDelete(event)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return
    try {
      await api.event.delete(eventToDelete.id)
      setIsDeleteModalOpen(false)
      setEventToDelete(null)
      fetchEvents() // Recargar la tabla
    } catch (error) {
      console.error("Error al eliminar evento:", error)
      alert("Hubo un error al eliminar el evento. Revisa la consola.")
    }
  }

  const filteredEvents = events.filter(event =>
    event.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage)
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePreviewClick = async (event) => {
    try {
      // Cargamos el detalle completo para el preview (secciones, reglas, etc)
      const data = await api.event.getById(event.id)
      setSelectedEvent(data)
      setIsPreviewOpen(true)
    } catch (error) {
      console.error("Error al cargar preview:", error)
    }
  }

  const columns = [
    {
      key: 'image_url',
      header: 'Poster',
      render: (val, row) => (
        <div 
          className="admin-table-thumbnail" 
          onClick={() => handlePreviewClick(row)}
          title="Clic para vista previa rápida"
        >
          <img src={getImageUrl(val || row.image)} alt="Poster" />
          <div className="thumbnail-hover-overlay">
            <Icon name="eye" size={14} />
          </div>
        </div>
      )
    },
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
        return <Badge variant={variants[val] || 'default'} rounded>{val?.toUpperCase()}</Badge>
      }
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="warning" size="small" onClick={() => handleEditClick(row)}>
            <Icon name="edit" size={12} className="mr-1" /> EDITAR
          </Button>
          <Button variant="danger" size="small" onClick={() => handleDeleteClick(row)}>
            <Icon name="trash" size={12} className="mr-1" /> ELIMINAR
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="admin-events-page">
      <div className="page-header">
        <h1>Gestión de Eventos</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button onClick={() => { setSelectedEvent(null); setIsFormOpen(true); }}>
            <Icon name="plus" size={14} className="mr-2" /> CREAR NUEVO EVENTO
          </Button>
        </div>
      </div>
      <Card className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
          <div style={{ width: '300px' }}>
            <Input
              placeholder="Buscar evento..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              icon={<Icon name="search" size={16} />}
            />
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            {loading ? <Skeleton type="text" width="60px" height="12px" /> : <>{filteredEvents.length} REGISTROS</>}
          </div>
        </div>
        {loading ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
              {['POSTER', 'EVENTO', 'FECHA', 'ESTADO', 'ACCIONES'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{h}</th>)}
            </tr></thead>
            <tbody>{Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} columns={5} />)}</tbody>
          </table>
        ) : (
          <>
            <Table columns={columns} data={paginatedEvents} />
            {totalPages > 1 && (
              <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </Card>

      {isFormOpen && (
        <EventForm
          event={selectedEvent}
          onClose={() => setIsFormOpen(false)}
          onSave={fetchEvents}
        />
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setEventToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Evento"
        message={`¿Estás seguro de que deseas eliminar permanentemente el evento "${eventToDelete?.name}"? Esta acción no se puede deshacer y eliminará las zonas y reglas asociadas.`}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />

      {isPreviewOpen && selectedEvent && (
        <Modal 
          isOpen={true} 
          onClose={() => setIsPreviewOpen(false)} 
          title={`Vista Previa: ${selectedEvent.name}`}
          size="large"
          className="admin-preview-modal"
        >
          <div className="fast-preview-container">
            <PreviewMonitor type="event" data={selectedEvent} />
          </div>
        </Modal>
      )}

    </div>
  )
}

export default Events
