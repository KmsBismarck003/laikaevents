import React from 'react'
import InfoLayout from './InfoLayout'

const Nosotros = () => {
  return (
    <InfoLayout title="Sobre Nosotros">
      <div className="info-section">
        <h2>Nuestra Misión</h2>
        <p>
          En LaikaEvents, nuestra misión es conectar a las personas con experiencias inolvidables.
          Nos dedicamos a facilitar el acceso a los mejores eventos culturales, deportivos y de entretenimiento,
          proporcionando una plataforma segura, confiable y fácil de usar.
        </p>
      </div>

      <div className="info-section">
        <h2>¿Quiénes Somos?</h2>
        <p>
          Somos un equipo apasionado por la tecnología y el entretenimiento. Fundada en 2024,
          LaikaEvents nació con la visión de revolucionar la forma en que las personas descubren y asisten a eventos.
        </p>
        <p>
          Trabajamos incansablemente para ofrecer:
        </p>
        <ul>
          <li>Una experiencia de compra fluida y segura.</li>
          <li>Atención al cliente excepcional.</li>
          <li>Innovación constante en nuestras herramientas tecnológicas.</li>
        </ul>
      </div>

      <div className="info-section">
        <h2>Nuestros Valores</h2>
        <h3>Innovación</h3>
        <p>Buscamos constantemente nuevas formas de mejorar la experiencia de nuestros usuarios.</p>

        <h3>Transparencia</h3>
        <p>Creemos en la honestidad y claridad en todas nuestras transacciones y comunicaciones.</p>

        <h3>Pasión</h3>
        <p>Amamos lo que hacemos y eso se refleja en la calidad de nuestro servicio.</p>
      </div>
    </InfoLayout>
  )
}

export default Nosotros
