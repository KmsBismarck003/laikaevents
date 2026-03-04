import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import { Card, Table, Button, Input, Modal, Spinner } from '../../components'
import { useNotification } from '../../context/NotificationContext'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import './admin.css'

const CMS = () => {
  const { success, error: showError } = useNotification()
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pages') // 'pages' | 'design'

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPage, setEditingPage] = useState(null)

  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    section: 'general',
    content: ''
  })

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    setLoading(true)
    try {
      const data = await api.pages.getAll()
      setPages(data)
    } catch (error) {
      console.error('Error fetching pages:', error)
      showError('Error al cargar páginas')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (page = null, forcedSection = null) => {
    if (page) {
      setEditingPage(page)
      setFormData({
        slug: page.slug,
        title: page.title,
        section: page.section,
        content: page.content || ''
      })
    } else {
      setEditingPage(null)
      setFormData({
        slug: '',
        title: '',
        section: forcedSection || 'general',
        content: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingPage) {
        await api.pages.update(formData.slug, formData)
        success('Contenido actualizado correctamente')
      } else {
        await api.pages.create(formData)
        success('Página creada correctamente')
      }
      setIsModalOpen(false)
      fetchPages()
    } catch (error) {
      console.error('Error saving page:', error)
      showError(error.message || 'Error al guardar contenido')
    }
  }

  const handleDelete = async (slug) => {
    if (window.confirm(`¿Estás seguro de eliminar la página /${slug}?`)) {
      try {
        await api.pages.delete(slug)
        success('Página eliminada')
        setPages(pages.filter(p => p.slug !== slug))
      } catch (error) {
        console.error('Error deleting page:', error)
        showError('Error al eliminar página')
      }
    }
  }

  // Columnas para la tabla de Páginas
  const columns = [
    { key: 'title', header: 'Título' },
    { key: 'slug', header: 'URL Term (Slug)' },
    { key: 'section', header: 'Sección' },
    {
      key: 'last_updated',
      header: 'Última Edición',
      render: (date) => new Date(date).toLocaleString()
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button size="small" variant="secondary" onClick={() => handleOpenModal(row)}>Editar</Button>
          <Button size="small" variant="info" onClick={() => window.open(row.section === 'footer' ? `/info/${row.slug}` : `/${row.slug}`, '_blank')}>Ver</Button>
          {!['layout-header', 'layout-footer'].includes(row.slug) && (
            <Button size="small" variant="danger" onClick={() => handleDelete(row.slug)}>Eliminar</Button>
          )}
        </div>
      )
    }
  ]

  // Configuración de ReactQuill
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      [{ 'color': [] }, { 'background': [] }],
      ['clean'],
      [{ 'align': [] }]
    ]
  }

  // Filtrar páginas según tab
  const contentPages = pages.filter(p => !p.slug.startsWith('layout-'))
  const designPages = pages.filter(p => p.slug.startsWith('layout-'))

  // Asegurar que existan los de diseño si no están en BD (mock visual hasta que se creen)
  const systemLayouts = [
    { slug: 'layout-header', title: 'Header del Sitio', section: 'layout', content: 'Contenido del Header...' },
    { slug: 'layout-footer', title: 'Footer del Sitio', section: 'layout', content: 'Contenido del Footer...' }
  ]

  // Merge real design pages with defaults if missing
  const mergedDesign = systemLayouts.map(sys =>
    designPages.find(p => p.slug === sys.slug) || sys
  )

  return (
    <div className="admin-cms-page">
      <div className="page-header">
        <div>
          <h1>Gestor de Contenidos (CMS)</h1>
          <p className="subtitle">Administra el contenido y diseño de tu sitio web</p>
        </div>
        {activeTab === 'pages' && (
            <Button onClick={() => handleOpenModal(null, 'info')} variant="primary">
            + Nueva Página
            </Button>
        )}
      </div>

      <div className="cms-tabs">
        <button
          className={`cms-tab ${activeTab === 'pages' ? 'active' : ''}`}
          onClick={() => setActiveTab('pages')}
        >
          📄 Páginas y Contenido
        </button>
        <button
          className={`cms-tab ${activeTab === 'design' ? 'active' : ''}`}
          onClick={() => setActiveTab('design')}
        >
          🎨 Diseño (Header/Footer)
        </button>
      </div>

      <Card className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem' }}><Spinner /></div>
        ) : (
          <>
            {activeTab === 'pages' && (
                <Table columns={columns} data={contentPages} />
            )}

            {activeTab === 'design' && (
                <div className="design-grid" style={{ padding: '2rem', display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                    {mergedDesign.map(layout => (
                        <div key={layout.slug} className="layout-card" style={{ border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '8px' }}>
                            <h3>{layout.title}</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                Edita el contenido visible en el {layout.title.toLowerCase()}.
                            </p>
                            <Button
                                variant="secondary"
                                onClick={() => handleOpenModal(layout)}
                                style={{ width: '100%' }}
                            >
                                Editar Diseño
                            </Button>
                        </div>
                    ))}

                    <div className="info-box" style={{ gridColumn: '1 / -1', marginTop: '1rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
                        <p>ℹ️ <strong>Nota:</strong> El diseño usa el contenido HTML para renderizar elementos dinámicos. Ten cuidado al borrar etiquetas estructurales.</p>
                    </div>
                </div>
            )}
          </>
        )}
      </Card>

      {isModalOpen && (
        <Modal
          isOpen={true}
          title={editingPage ? `Editar: ${editingPage.title}` : 'Nueva Página'}
          onClose={() => setIsModalOpen(false)}
          width="900px"
        >
          <form onSubmit={handleSubmit} className="cms-form">
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div className="form-group mb-4">
                <label className="input-label">Título</label>
                <Input
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>

              <div className="form-group mb-4">
                <label className="input-label">Slug (URL)</label>
                <Input
                  value={formData.slug}
                  onChange={e => setFormData({...formData, slug: e.target.value})}
                  required
                  disabled={!!editingPage}
                  placeholder="ej. mi-pagina"
                />
              </div>
            </div>

            <div className="form-group mb-4">
              <label className="input-label">Sección / Tipo</label>
              <select
                className="input"
                value={formData.section}
                onChange={e => setFormData({...formData, section: e.target.value})}
                disabled={formData.slug.startsWith('layout-')}
              >
                <option value="general">General</option>
                <option value="info">Información (Quiénes Somos, etc)</option>
                <option value="footer">Footer (Legal, Ayuda)</option>
                <option value="category">Categoría (Landing)</option>
                <option value="layout">Diseño del Sistema</option>
              </select>
            </div>

            <div className="form-group mb-4">
              <label className="input-label">
                Contenido
                {formData.slug.startsWith('layout-') && <span style={{fontSize:'0.8em', color:'var(--warning)'}}> (Edición Avanzada)</span>}
              </label>
              <div className="editor-container" style={{ background: 'white', color: 'black', borderRadius: '8px', overflow: 'hidden' }}>
                <ReactQuill
                  theme="snow"
                  value={formData.content}
                  onChange={content => setFormData({...formData, content})}
                  modules={quillModules}
                  style={{ height: '400px', marginBottom: '50px' }}
                />
              </div>
            </div>

            <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" variant="primary">Guardar Cambios</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default CMS
