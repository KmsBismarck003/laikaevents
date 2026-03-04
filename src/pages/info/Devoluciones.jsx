import React from 'react'
import InfoLayout from './InfoLayout'

const Devoluciones = () => {
  return (
    <InfoLayout title="Política de Devoluciones y Reembolsos">
      <div className="info-section">
        <p>
          En LaikaEvents, queremos asegurarnos de que estés satisfecho con tu compra.
          Sin embargo, debido a la naturaleza de los eventos en vivo, nuestras políticas de devolución son estrictas.
        </p>
      </div>

      <div className="info-section">
        <h2>Cancelación de Eventos</h2>
        <p>
          Si un evento es cancelado por el organizador, recibirás un reembolso completo automáticamente al método de pago original.
          No es necesario que realices ninguna acción.
        </p>
      </div>

      <div className="info-section">
        <h2>Reprogramación de Eventos</h2>
        <p>
          Si un evento es reprogramado, tus boletos serán válidos para la nueva fecha automatically.
          Si no puedes asistir en la nueva fecha, podrás solicitar un reembolso dentro del plazo establecido en el anuncio de reprogramación.
        </p>
      </div>

      <div className="info-section">
        <h2>Devoluciones por Arrepentimiento</h2>
        <p>
          Generalmente, no ofrecemos reembolsos si simplemente cambias de opinión o no puedes asistir al evento por razones personales.
          Te recomendamos revender tus boletos a través de nuestra plataforma oficial de reventa si está disponible para tu evento.
        </p>
      </div>

      <div className="info-section">
        <h2>Plazos de Reembolso</h2>
        <p>
          Los reembolsos suelen procesarse en un plazo de 5 a 10 días hábiles, dependiendo de tu banco o emisor de tarjeta.
        </p>
      </div>
    </InfoLayout>
  )
}

export default Devoluciones
