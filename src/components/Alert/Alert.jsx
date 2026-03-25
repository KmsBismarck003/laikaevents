import React from 'react';
import Icon from '../Icons';
import './Alert.css';

const Alert = ({
  type = 'info',
  title,
  message,
  children,
  onClose,
  closable = false,
  icon,
  className = '',
  ...props
}) => {
  const defaultIcons = {
    success: <Icon name="checkCircle" size={18} />,
    error: <Icon name="xCircle" size={18} />,
    warning: <Icon name="alertTriangle" size={18} />,
    info: <Icon name="info" size={18} />
  };

  const displayIcon = icon || defaultIcons[type];

  const classNames = [
    'alert',
    `alert--${type}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames} role="alert" {...props}>
      {displayIcon && (
        <div className="alert__icon">
          {displayIcon}
        </div>
      )}

      <div className="alert__content">
        {title && <div className="alert__title">{title}</div>}
        {message && <div className="alert__message">{message}</div>}
        {children && <div className="alert__children">{children}</div>}
      </div>

      {closable && (
        <button
          className="alert__close"
          onClick={onClose}
          aria-label="Cerrar alerta"
        >
          <Icon name="x" size={16} />
        </button>
      )}
    </div>
  );
};

export default Alert;
