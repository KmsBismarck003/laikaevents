import React from 'react'
import InfoLayout from './InfoLayout'

const Accesibilidad = () => {
  return (
    <InfoLayout title="Declaración de Accesibilidad">
      <div className="info-section">
        <p>
          En LaikaEvents, estamos comprometidos a garantizar que nuestro sitio web sea accesible para todas las personas, independientemente de sus capacidades.
        </p>
      </div>

      <div className="info-section">
        <h2>Estándares de Accesibilidad</h2>
        <p>
          Nos esforzamos por cumplir con las Pautas de Accesibilidad al Contenido en la Web (WCAG) 2.1 nivel AA.
          Realizamos pruebas periódicas para asegurar que nuestro sitio sea compatible con tecnologías de asistencia.
        </p>
      </div>

      <div className="info-section">
        <h2>Características de Accesibilidad</h2>
        <ul>
          <li>Texto alternativo para imágenes.</li>
          <li>Navegación por teclado.</li>
          <li>Contraste de colores adecuado.</li>
          <li>Estructura semántica clara en el código HTML.</li>
        </ul>
      </div>

      <div className="info-section">
        <h2>Comentarios y Sugerencias</h2>
        <p>
          Si tienes dificultades para acceder a alguna parte de nuestro sitio web o tienes sugerencias para mejorar la accesibilidad,
          por favor contáctanos en accesibilidad@laikaevents.com.
        </p>
      </div>
    </InfoLayout>
  )
}

export default Accesibilidad
