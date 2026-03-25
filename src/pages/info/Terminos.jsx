import React from 'react'
import InfoLayout from './InfoLayout'

const Terminos = () => {
  return (
    <InfoLayout title="Términos y Condiciones de Uso">
      <div className="info-section">
        <p>
          Bienvenido a LaikaEvents. Al acceder y utilizar nuestro sitio web, aceptas cumplir con los siguientes términos y condiciones.
        </p>
      </div>

      <div className="info-section">
        <h2>Uso del Sitio</h2>
        <p>
          Este sitio web está destinado únicamente para uso personal y no comercial.
          No puedes utilizar nuestro sitio para ningún propósito ilegal o no autorizado.
        </p>
      </div>

      <div className="info-section">
        <h2>Propiedad Intelectual</h2>
        <p>
          Todo el contenido de este sitio, incluyendo texto, gráficos, logotipos, imágenes y software, es propiedad de LaikaEvents o de sus proveedores de contenido
          y está protegido por las leyes de derechos de autor.
        </p>
      </div>

      <div className="info-section">
        <h2>Renuncia de Responsabilidad</h2>
        <p>
          LaikaEvents no garantiza que el sitio web esté libre de errores o que su acceso sea ininterrumpido.
          El sitio se proporciona "tal cual" y "según disponibilidad".
        </p>
      </div>

      <div className="info-section">
        <h2>Modificaciones</h2>
        <p>
          Nos reservamos el derecho de modificar estos términos y condiciones en cualquier momento.
          Cualquier cambio entrará en vigor inmediatamente después de su publicación en el sitio.
        </p>
      </div>
    </InfoLayout>
  )
}

export default Terminos
