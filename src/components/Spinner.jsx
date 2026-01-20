import React from 'react';
import './Spinner.css';

const Spinner = ({ 
  size = 'medium',
  color = 'primary',
  fullScreen = false,
  text,
  className = '',
  ...props 
}) => {
  const classNames = [
    'spinner',
    `spinner--${size}`,
    `spinner--${color}`,
    className
  ].filter(Boolean).join(' ');

  const spinner = (
    <div className={classNames} {...props}>
      <div className="spinner__circle"></div>
      {text && <p className="spinner__text">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="spinner__fullscreen">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default Spinner;
