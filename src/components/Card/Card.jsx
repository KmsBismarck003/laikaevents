import React from 'react'
import './Card.css'

const Card = ({
  children,
  title,
  subtitle,
  footer,
  image,
  imageAlt, // Destructure to avoid spreading to DOM
  hoverable = false,
  variant = 'default',
  onClick,
  className = '',
  ...props
}) => {
  const classNames = [
    'card',
    `card--${variant}`,
    hoverable && 'card--hoverable',
    onClick && 'card--clickable',
    className
  ]
    .filter(Boolean)
    .join(' ')

  const [imgSrc, setImgSrc] = React.useState(image)

  React.useEffect(() => {
    setImgSrc(image)
  }, [image])

  const handleImageError = () => {
    setImgSrc('https://placehold.co/400x200?text=No+Image')
  }

  return (
    <div className={classNames} onClick={onClick} {...props}>
      {image && (
        <div className='card__image'>
          <img
            src={imgSrc}
            alt={imageAlt || title || 'Card image'}
            loading='lazy'
            onError={handleImageError}
          />
        </div>
      )}

      <div className='card__content'>
        {(title || subtitle) && (
          <div className='card__header'>
            {title && <h3 className='card__title'>{title}</h3>}
            {subtitle && <p className='card__subtitle'>{subtitle}</p>}
          </div>
        )}

        <div className='card__body'>{children}</div>
      </div>

      {footer && <div className='card__footer'>{footer}</div>}
    </div>
  )
}

export default Card
