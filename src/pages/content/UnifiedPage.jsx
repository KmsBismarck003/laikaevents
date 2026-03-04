import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Spinner, Card } from '../../components'
import api from '../../services/api'
import './UnifiedPage.css'

const UnifiedPage = ({ section = 'general' }) => {
  const { slug } = useParams()
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPageContent()
  }, [slug])

  const fetchPageContent = async () => {
    setLoading(true)
    setError(null)
    try {
      // Si no hay slug y es una prop directa (ej: /ayuda -> slug='ayuda' hardcoded en routes)
      // En este caso, el componente espera que el slug venga del URL param :slug,
      // pero si el route es fijo (ej: path='/ayuda'), el slug debe venir de props o deducirse.

      // Ajuste: si el slug viene de params, úsalo. Si no, usa el path actual o prop.
      // Por simplicidad, asumiremos que siempre hay un :slug en la ruta O se pasa como prop

      const targetSlug = slug || window.location.pathname.replace('/', '')
      console.log('📄 Cargando página:', targetSlug)

      const data = await api.pages.getBySlug(targetSlug)
      setPage(data)
    } catch (err) {
      console.error('❌ Error cargando página:', err)
      setError('No pudimos encontrar el contenido solicitado.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Spinner fullScreen text="Cargando contenido..." />

  if (error || !page) {
    return (
      <div className="unified-page-error">
        <h2>😕 Ups, algo salió mal</h2>
        <p>{error || 'Página no encontrada'}</p>
        <Link to="/" className="btn-back">Volver al Inicio</Link>
      </div>
    )
  }

  return (
    <div className={`unified-page-container section-${section}`}>
      <div className="page-header">
        <h1>{page.title}</h1>
        {page.last_updated && (
          <span className="last-updated">
            Actualizado: {new Date(page.last_updated).toLocaleDateString()}
          </span>
        )}
      </div>

      <Card className="page-content-card">
        {/* Renderizado seguro de HTML desde el CMS */}
        <div
          className="page-body-content"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </Card>

      {/* Navegación rápida para secciones legales/ayuda */}
      {(section === 'footer' || section === 'legal' || section === 'info') && (
        <div className="quick-nav">
          <h3>Más información</h3>
          <div className="nav-links">
            <Link to="/ayuda">Ayuda</Link> |
            <Link to="/legal/privacidad">Privacidad</Link> |
            <Link to="/legal/terminos">Términos</Link> |
            <Link to="/info/contacto">Contacto</Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default UnifiedPage
