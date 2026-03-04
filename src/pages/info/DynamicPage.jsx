import React, { useState, useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import api from '../../services/api'
import { Spinner, Card } from '../../components'
import './DynamicPage.css'

const DynamicPage = () => {
  const { slug } = useParams()
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true)
      try {
        const data = await api.pages.getBySlug(slug)
        setPage(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching page:', err)
        setError(err.status === 404 ? '404' : 'Error al cargar la página')
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchPage()
    }
  }, [slug])

  if (loading) return <Spinner fullScreen text="Cargando contenido..." />

  if (error === '404') {
    return (
      <div className="dynamic-page-error">
        <h1>404</h1>
        <p>Página no encontrada</p>
        <a href="/" className="btn-home">Volver al Inicio</a>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dynamic-page-error">
        <h1>Error</h1>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    )
  }

  if (!page) return null

  return (
    <div className="dynamic-page-container">
      <div className="dynamic-page-header">
        <h1>{page.title}</h1>
      </div>

      <div className="dynamic-page-content">
        <div
          className="cms-content"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />

        <div className="dynamic-page-footer">
          <small>Última actualización: {new Date(page.last_updated).toLocaleDateString()}</small>
        </div>
      </div>
    </div>
  )
}

export default DynamicPage
