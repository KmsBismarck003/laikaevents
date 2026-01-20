import React from 'react';
import './Card.css';

const Card = ({ 
  children, 
  title, 
  subtitle,
  footer,
  image,
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
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames} onClick={onClick} {...props}>
      {image && (
        <div className="card__image">
          <img src={image} alt={title || 'Card image'} />
        </div>
      )}
      
      <div className="card__content">
        {(title || subtitle) && (
          <div className="card__header">
            {title && <h3 className="card__title">{title}</h3>}
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </div>
        )}
        
        <div className="card__body">
          {children}
        </div>
      </div>

      {footer && (
        <div className="card__footer">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
