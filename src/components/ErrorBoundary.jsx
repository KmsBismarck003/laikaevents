import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error capturado por ErrorBoundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: '#0a0a0a',
            color: '#fff',
            padding: '20px',
            textAlign: 'center'
          }}
        >
          <div>
            <h1 style={{ color: '#ff4444', marginBottom: '20px' }}>
              ⚠️ Error en la Aplicación
            </h1>
            <p style={{ color: '#c0c0c0', marginBottom: '20px' }}>
              Ha ocurrido un error inesperado.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                background: '#00d4ff',
                color: '#0a0a0a',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔄 Recargar Página
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details style={{ marginTop: '20px', textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', color: '#00d4ff' }}>
                  Ver detalles del error
                </summary>
                <pre
                  style={{
                    background: '#1a1a1a',
                    padding: '16px',
                    borderRadius: '8px',
                    overflow: 'auto',
                    marginTop: '12px',
                    fontSize: '12px'
                  }}
                >
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
