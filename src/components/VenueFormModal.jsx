import React, { useState, useEffect } from 'react'
import { Modal, Button, Input } from './index'
import { venueAPI } from '../services/api'
import { useNotification } from '../context/NotificationContext'

const VenueFormModal = ({ isOpen, onClose, onSubmit, venue = null }) => {
  const { error: showError } = useNotification()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    map_url: '',
    capacity: '',
    status: 'active'
  })

  useEffect(() => {
    if (venue) {
      setFormData({
        name: venue.name || '',
        address: venue.address || '',
        city: venue.city || '',
        map_url: venue.map_url || '',
        capacity: venue.capacity || '',
        status: venue.status || 'active'
      })
    } else {
      setFormData({
        name: '',
        address: '',
        city: '',
        map_url: '',
        capacity: '',
        status: 'active'
      })
    }
  }, [venue, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null
      }

      await onSubmit(payload)
      onClose()
    } catch (err) {
      console.error(err)
      showError(err.message || 'Error al guardar recinto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={venue ? 'Editar Recinto' : 'Nuevo Recinto'}
    >
      <form onSubmit={handleSubmit} className="venue-form">
        <Input
          label="Nombre del Recinto"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Ej: Estadio Nacional"
        />

        <Input
          label="Ciudad"
          name="city"
          value={formData.city}
          onChange={handleChange}
          required
          placeholder="Ej: Ciudad de México"
        />

        <Input
          label="Dirección"
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
          placeholder="Calle 123, Col. Centro"
        />

        <Input
          label="URL del Mapa (Google Maps)"
          name="map_url"
          value={formData.map_url}
          onChange={handleChange}
          placeholder="https://maps.google.com/..."
        />

        <Input
          label="Capacidad (Personas)"
          name="capacity"
          type="number"
          value={formData.capacity}
          onChange={handleChange}
          placeholder="Ej: 5000"
        />

        <div className="form-group">
          <label>Estado</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="input-field"
          >
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>

        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Guardando...' : (venue ? 'Actualizar' : 'Crear')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default VenueFormModal
