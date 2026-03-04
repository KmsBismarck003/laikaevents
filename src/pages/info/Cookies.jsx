import React from 'react'
import InfoLayout from './InfoLayout'

const Cookies = () => {
  return (
    <InfoLayout title="Política de Cookies">
      <div className="info-section">
        <p>
          En LaikaEvents, utilizamos cookies y tecnologías similares para mejorar tu experiencia en nuestro sitio web.
        </p>
      </div>

      <div className="info-section">
        <h2>¿Qué son las Cookies?</h2>
        <p>
          Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web.
          Se utilizan para recordar tus preferencias, mejorar la funcionalidad del sitio y analizar el tráfico.
        </p>
      </div>

      <div className="info-section">
        <h2>Tipos de Cookies que Usamos</h2>
        <ul>
          <li><strong>Cookies Esenciales:</strong> Necesarias para el funcionamiento básico del sitio.</li>
          <li><strong>Cookies de Rendimiento:</strong> Nos ayudan a entender cómo los usuarios interactúan con el sitio.</li>
          <li><strong>Cookies de Funcionalidad:</strong> Permiten recordar tus preferencias, como el idioma o la región.</li>
          <li><strong>Cookies de Publicidad:</strong> Se utilizan para mostrar anuncios relevantes para ti.</li>
        </ul>
      </div>

      <div className="info-section">
        <h2>Cómo Administrar las Cookies</h2>
        <p>
          Puedes controlar y administrar las cookies a través de la configuración de tu navegador.
          Ten en cuenta que desactivar ciertas cookies puede afectar la funcionalidad del sitio.
        </p>
      </div>
    </InfoLayout>
  )
}

export default Cookies
