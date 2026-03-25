import React from 'react'
import InfoLayout from './InfoLayout'

const PreguntasFrecuentes = () => {
  return (
    <InfoLayout title="Preguntas Frecuentes">
      <div className="info-section">
        <h3>¿Cómo puedo comprar boletos?</h3>
        <p>
          Puedes comprar boletos directamente en nuestro sitio web. Simplemente selecciona el evento al que deseas asistir,
          elige tus asientos y sigue el proceso de pago seguro.
        </p>
      </div>

      <div className="info-section">
        <h3>¿Qué métodos de pago aceptan?</h3>
        <p>
          Aceptamos las principales tarjetas de crédito y débito (Visa, Mastercard, American Express) y otros métodos de pago locales según tu ubicación.
        </p>
      </div>

      <div className="info-section">
        <h3>¿Recibiré boletos físicos?</h3>
        <p>
          En la mayoría de los casos, ofrecemos boletos digitales (e-tickets) que puedes mostrar desde tu dispositivo móvil.
          Si el evento requiere boletos físicos, se te informará durante el proceso de compra.
        </p>
      </div>

      <div className="info-section">
        <h3>¿Puedo cancelar mi compra?</h3>
        <p>
          Las políticas de cancelación varían según el evento y el organizador.
          Por favor, revisa nuestra <a href="/info/devoluciones">Política de Devoluciones</a> para más detalles.
        </p>
      </div>

      <div className="info-section">
        <h3>¿Es seguro comprar en LaikaEvents?</h3>
        <p>
          Sí, utilizamos tecnología de encriptación avanzada para proteger tu información personal y financiera.
        </p>
      </div>
    </InfoLayout>
  )
}

export default PreguntasFrecuentes
