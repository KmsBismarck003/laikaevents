import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import { getImageUrl } from '../../utils/imageUtils'
import { Card, Table, Button, Badge, Input, Modal, Alert, Spinner } from '../../components'
import { useNotification } from '../../context/NotificationContext'
import './admin.css'

const Ads = () => {
  const { success, error: showError } = useNotification()
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAd, setEditingAd] = useState(null)

  // Form State
  const [linkMode, setLinkMode] = useState('external') // 'external' | 'internal'
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    link_url: '',
    position: 'main',
    active: true
  })

  const [eventsList, setEventsList] = useState([])

  useEffect(() => {
    fetchAds()
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const data = await api.event.getAll()
      setEventsList(data)
    } catch (error) {
      console.error('Error fetching events for dropdown:', error)
    }
  }

  const fetchAds = async () => {
    setLoading(true)
    try {
      const data = await api.ads.getAll()
      setAds(data)
    } catch (error) {
      console.error('Error fetching ads:', error)
      showError('Error al cargar anuncios')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (ad = null) => {
    if (ad) {
      setEditingAd(ad)
      // Determinar modo basado en URL
      const isInternal = ad.link_url && ad.link_url.startsWith('/event/')
      setLinkMode(isInternal ? 'internal' : 'external')

      setFormData({
        title: ad.title,
        image_url: ad.image_url,
        link_url: ad.link_url || '',
        position: ad.position,
        active: Boolean(ad.active) // Asegurar booleano
      })
    } else {
      setEditingAd(null)
      setLinkMode('external')
      setFormData({
        title: '',
        image_url: '',
        link_url: '',
        position: 'main',
        active: true
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingAd) {
        await api.ads.update(editingAd.id, formData)
        success('Anuncio actualizado correctamente')
      } else {
        await api.ads.create(formData)
        success('Anuncio creado correctamente')
      }
      setIsModalOpen(false)
      fetchAds()
    } catch (error) {
      console.error('Error saving ad:', error)
      showError('Error al guardar el anuncio')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este anuncio?')) {
      try {
        await api.ads.delete(id)
        success('Anuncio eliminado')
        setAds(ads.filter(a => a.id !== id))
      } catch (error) {
        console.error('Error deleting ad:', error)
        showError('Error al eliminar anuncio')
      }
    }
  }

  const handleToggleActive = async (ad) => {
    try {
      await api.ads.update(ad.id, { active: !ad.active })
      // Actualización optimista local
      setAds(ads.map(a => a.id === ad.id ? { ...a, active: !a.active } : a))
      success(`Anuncio ${!ad.active ? 'activado' : 'desactivado'}`)
    } catch (error) {
      showError('Error al cambiar estado')
    }
  }

  const columns = [
    {
      key: 'image_url',
      header: 'Imagen',
      render: (url) => (
        <div style={{ width: '100px', height: '60px', borderRadius: '8px', overflow: 'hidden', bg: '#000' }}>
          <img src={getImageUrl(url)} alt="Ad" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )
    },
    { key: 'title', header: 'Título' },
    {
      key: 'position',
      header: 'Posición',
      render: (pos) => {
        const labels = { main: 'Principal (Carrusel)', side_left: 'Lateral Izq.', side_right: 'Lateral Der.' }
        return <Badge variant="info">{labels[pos] || pos}</Badge>
      }
    },
    {
      key: 'active',
      header: 'Estado',
      render: (active, row) => (
        <div style={{ cursor: 'pointer' }} onClick={() => handleToggleActive(row)}>
          <Badge variant={active ? 'success' : 'secondary'}>
            {active ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button size="small" variant="secondary" onClick={() => handleOpenModal(row)}>Editar</Button>
          <Button size="small" variant="danger" onClick={() => handleDelete(row.id)}>Eliminar</Button>
        </div>
      )
    }
  ]

  return (
    <div className="admin-ads-page">
      <div className="page-header">
        <div>
          <h1>Gestión de Publicidad</h1>
          <p className="subtitle">Administra los banners y anuncios del sitio</p>
        </div>
        <Button onClick={() => handleOpenModal()} variant="primary">
          + Nuevo Anuncio
        </Button>
      </div>

      <Card className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem' }}><Spinner /></div>
        ) : (
          <Table columns={columns} data={ads} />
        )}
      </Card>

      {isModalOpen && (
        <Modal
          isOpen={true}
          title={editingAd ? 'Editar Anuncio' : 'Nuevo Anuncio'}
          onClose={() => setIsModalOpen(false)}
        >
          <form onSubmit={handleSubmit} className="ad-form">
            <div className="form-group mb-4">
              <label className="input-label">Título</label>
              <Input
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                required
                placeholder="Ej. Promo Verano"
              />
            </div>

            <div className="form-group mb-4">
              <label className="input-label">Posición</label>
              <select
                className="input"
                value={formData.position}
                onChange={e => setFormData({...formData, position: e.target.value})}
              >
                <option value="main">Principal (1098x342)</option>
                <option value="side_left">Lateral Izquierdo (160x600)</option>
                <option value="side_right">Lateral Derecho (160x600)</option>
              </select>
            </div>

            <div className="form-group mb-4">
              <label className="input-label">URL de Imagen</label>
              <div className="upload-container">
                <Input
                  type="file"
                  onChange={async (e) => {
                    const file = e.target.files[0]
                    if (file) {
                      try {
                        // Mostrar preview inmediato
                        const objectUrl = URL.createObjectURL(file)
                        setFormData({...formData, image_url: objectUrl}) // Preview temporal

                        // Subir al servidor
                        const response = await api.ads.upload(file)
                        // Asegurar URL absoluta si es relativa
                        const finalUrl = response.url.startsWith('http')
                          ? response.url
                          : `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${response.url}`

                        setFormData(prev => ({...prev, image_url: finalUrl}))
                        success('Imagen subida correctamente')
                      } catch (error) {
                        console.error('Upload error:', error)
                        showError('Error al subir imagen')
                      }
                    }
                  }}
                  accept="image/*"
                />
                <p className="help-text" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  O ingresa una URL manualmente:
                </p>
                <Input
                  value={formData.image_url}
                  onChange={e => setFormData({...formData, image_url: e.target.value})}
                  required
                  placeholder="https://..."
                />
                {formData.image_url && (
                  <div className="img-preview mt-2" style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', maxHeight: '200px' }}>
                    <img src={getImageUrl(formData.image_url)} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', display: 'block' }} />
                  </div>
                )}
              </div>
            </div>

            <div className="form-group mb-4">
              <label className="input-label">Enlace de Redirección (Opcional)</label>

              <div className="link-options" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="radio"
                    name="linkType"
                    checked={linkMode === 'external'}
                    onChange={() => {
                        setLinkMode('external')
                        setFormData(prev => ({...prev, link_url: ''}))
                    }}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Enlace Externo
                </label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="radio"
                    name="linkType"
                    checked={linkMode === 'internal'}
                    onChange={() => {
                        setLinkMode('internal')
                        setFormData(prev => ({...prev, link_url: ''}))
                    }}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Vincular a Evento
                </label>
              </div>

              {linkMode === 'internal' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <select
                      className="input"
                      value={formData.link_url.replace('/event/', '')}
                      onChange={e => {
                          const val = e.target.value
                          setFormData(prev => ({...prev, link_url: val ? `/event/${val}` : ''}))
                      }}
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    >
                      <option value="">-- Seleccionar Evento --</option>
                      {eventsList.map(evt => (
                        <option key={evt.id} value={evt.id}>
                          {evt.name} ({new Date(evt.event_date || evt.date).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                    <small style={{ color: 'var(--text-secondary)' }}>
                        Se redirigirá internamente a la página de detalles del evento.
                    </small>
                </div>
              ) : (
                <Input
                  value={formData.link_url}
                  onChange={e => setFormData({...formData, link_url: e.target.value})}
                  placeholder="https://sitio.com/promo"
                />
              )}
            </div>

            <div className="form-group mb-4">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={e => setFormData({...formData, active: e.target.checked})}
                  style={{ width: '1.2rem', height: '1.2rem' }}
                />
                Activo
              </label>
            </div>

            <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" variant="primary">Guardar</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default Ads
