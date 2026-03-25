import React, { useState, useEffect } from 'react'
import api from '../../../services/api'
import { getImageUrl } from '../../../utils/imageUtils'
import { Card, Table, Button, Badge, Input, Modal, Alert, SkeletonRow, ConfirmationModal, Skeleton } from '../../../components'
import { useNotification } from '../../../context/NotificationContext'
import { useSkeletonContext } from '../../../context/SkeletonContext'
import PreviewMonitor from '../../../components/Admin/PreviewMonitor'
import '../Events/admin.css'
import './admin.css'

const Ads = () => {
  const { success, error: showError } = useNotification()
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)
  const { showSkeleton } = useSkeletonContext()
  const isLoading = loading || showSkeleton
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAd, setEditingAd] = useState(null)

  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    link_url: '',
    position: 'main',
    active: true
  })

  const [clicksData, setClicksData] = useState([])
  const [loadingClicks, setLoadingClicks] = useState(false)

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

  const fetchClicks = async (adId) => {
    setLoadingClicks(true)
    try {
      const data = await api.ads.getClicks(adId)
      setClicksData(data)
    } catch (err) {
      console.error('Error fetching clicks:', err)
    } finally {
      setLoadingClicks(false)
    }
  }

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [adToDelete, setAdToDelete] = useState(null)

  const handleOpenModal = (ad = null) => {
    if (ad) {
      setEditingAd(ad)
      setFormData({
        title: ad.title || '',
        image_url: ad.image_url || '',
        link_url: ad.link_url || '',
        position: ad.position || 'main',
        active: Boolean(ad.active)
      })
      fetchClicks(ad.id)
    } else {
      setEditingAd(null)
      setClicksData([])
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

  const handleDeleteClick = (ad) => {
    setAdToDelete(ad)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!adToDelete) return
    try {
      await api.ads.delete(adToDelete.id)
      success('Anuncio eliminado')
      setAds(ads.filter(a => a.id !== adToDelete.id))
      setIsDeleteModalOpen(false)
      setAdToDelete(null)
    } catch (error) {
      console.error('Error deleting ad:', error)
      showError('Error al eliminar anuncio')
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
        const labels = { 
          main: 'Principal (Carrusel)', 
          side_right: 'Lateral Der.',
          side_left: 'Lateral Izq.' 
        }
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
      key: 'click_count',
      header: 'Clics',
      render: (count) => (
        <Badge variant="primary" style={{ fontWeight: 800 }}>
          {count || 0}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button size="small" variant="secondary" onClick={() => handleOpenModal(row)}>Editar</Button>
          <Button size="small" variant="danger" onClick={() => handleDeleteClick(row)}>Eliminar</Button>
        </div>
      )
    }
  ]

  return (
    <div className="admin-ads-page">
      <div className="page-header">
        <div>
          <h1>{isLoading ? <Skeleton width="220px" height="24px" /> : 'Gestión de Publicidad'}</h1>
          {isLoading ? (
            <Skeleton width="280px" height="12px" style={{ marginTop: '8px' }} />
          ) : (
            <p className="subtitle">Administra los banners y anuncios del sitio</p>
          )}
        </div>
        {isLoading ? (
          <Skeleton width="130px" height="34px" style={{ borderRadius: '6px' }} />
        ) : (
          <Button onClick={() => handleOpenModal()} variant="primary">
            + Nuevo Anuncio
          </Button>
        )}
      </div>

      <Card className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
              {['IMAGEN', 'TÍTULO', 'POSICIÓN', 'ESTADO', 'CLICS', 'ACCIONES'].map(h => <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{h}</th>)}
            </tr></thead>
            <tbody>{Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} columns={6} />)}</tbody>
          </table>
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
          <div className="split-modal-container">
            <div className="split-modal-form">
              <form onSubmit={handleSubmit} className="ad-form">
                <div className="form-group mb-3">
                  <label className="input-label">Título</label>
                  <Input
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="Ej. Promo Verano"
                  />
                </div>

                <div className="form-group mb-3">
                  <label className="input-label">Posición</label>
                  <select
                    className="input"
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    value={formData.position}
                    onChange={e => setFormData({ ...formData, position: e.target.value })}
                  >
                    <option value="main">Principal (1098x342)</option>
                    <option value="side_left">Lateral Izquierdo (160x600)</option>
                    <option value="side_right">Lateral Derecho (160x600)</option>
                  </select>
                </div>

                <div className="form-group mb-3">
                  <label className="input-label">Enlace de Redirección (Opcional)</label>
                  <Input
                    value={formData.link_url}
                    onChange={e => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="https://ejemplo.com/evento"
                  />
                  <p className="help-text" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    URL a la que se dirigirá al usuario al hacer clic.
                  </p>
                </div>

                <div className="form-group mb-3">
                  <label className="input-label">Subir Imagen</label>
                  <div className="upload-container">
                    <Input
                      type="file"
                      onChange={async (e) => {
                        const file = e.target.files[0]
                        if (file) {
                          try {
                            const objectUrl = URL.createObjectURL(file)
                            setFormData({ ...formData, image_url: objectUrl })
                            const response = await api.ads.upload(file)
                            const finalUrl = response.url.startsWith('http')
                              ? response.url
                              : `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${response.url}`
                            setFormData(prev => ({ ...prev, image_url: finalUrl }))
                            success('Imagen subida correctamente')
                          } catch (error) {
                            console.error('Upload error:', error)
                            showError('Error al subir imagen')
                          }
                        }
                      }}
                      accept="image/*"
                    />
                    <p className="help-text" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                      O ingresa una URL manualmente:
                    </p>
                    <Input
                      value={formData.image_url}
                      onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                      required
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="image-preview-container mt-3" style={{ position: 'relative' }}>
                  <p className="help-text" style={{ fontSize: '0.7rem', marginBottom: '0.3rem', color: 'var(--accent-color)', fontWeight: 600 }}>
                    💡 Tip: Arrastra la imagen al monitor de la derecha para elegir posición.
                  </p>
                  <div className="preview-box" style={{ width: '100%', height: '140px', borderRadius: '12px', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #333' }}>
                    {formData.image_url ? (
                      <img
                        src={getImageUrl(formData.image_url)}
                        alt="Preview"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', 'ad-image')
                          e.currentTarget.style.opacity = '0.5'
                        }}
                        onDragEnd={(e) => {
                          e.currentTarget.style.opacity = '1'
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'grab' }}
                      />
                    ) : (
                      <span style={{ color: '#555', fontSize: '0.8rem' }}>Sin imagen</span>
                    )}
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={e => setFormData({ ...formData, active: e.target.checked })}
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
            </div>
            <div className="split-modal-preview">
              <PreviewMonitor
                type="ad"
                data={formData}
                title="AD PLACEMENT MONITOR"
                onPositionSelect={(pos) => setFormData({ ...formData, position: pos })}
              />

              {editingAd && (
                <div className="clicks-info-section" style={{ marginTop: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Usuarios que interactuaron</h3>
                    <Badge variant="primary">{clicksData.length} Clics</Badge>
                  </div>

                  <div className="whatsapp-style-list" style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {loadingClicks ? (
                      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem' }}>Cargando...</p>
                    ) : clicksData.length > 0 ? (
                      clicksData.map((click, idx) => (
                        <div key={idx} className="wa-user-item" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', marginBottom: '0.5rem', transition: 'background 0.2s' }}>
                          <div className="wa-avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#333', overflow: 'hidden', flexShrink: 0 }}>
                            <img
                              src={getImageUrl(click.profile_image) || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}
                              alt={click.full_name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                          <div className="wa-info" style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {click.full_name || 'Usuario Anónimo'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {click.email || 'Sin correo asociado'}
                            </div>
                          </div>
                          <div className="wa-time" style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontWeight: 500 }}>
                            {new Date(click.clicked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        Aún no hay clics registrados para este anuncio.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setAdToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Anuncio"
        message={`¿Estás seguro de que deseas eliminar permanentemente el anuncio "${adToDelete?.title}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  )
}

export default Ads
