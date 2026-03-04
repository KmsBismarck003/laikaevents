import React from 'react';
import './Badge.css';

const Badge = ({
  children,
  variant = 'default',
  size = 'medium',
  dot = false,
  rounded = false,
  className = '',
  ...props
}) => {
  const classNames = [
    'badge',
    `badge--${variant}`,
    `badge--${size}`,
    rounded && 'badge--rounded',
    dot && 'badge--dot',
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classNames} {...props}>
      {dot && <span className="badge__dot"></span>}
      {children}
    </span>
  );
};

export default Badge;
