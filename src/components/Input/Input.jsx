import React, { useState } from 'react';
import Icon from '../Icons';
import './Input.css';

const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  helperText,
  icon,
  disabled = false,
  required = false,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  const classNames = [
    'input-wrapper',
    fullWidth && 'input-wrapper--full-width',
    error && 'input-wrapper--error',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames}>
      {label && (
        <label className="input__label" htmlFor={name}>
          {label}
          {required && <span className="input__required">*</span>}
        </label>
      )}

      <div className="input__container">
        {icon && <span className="input__icon">{icon}</span>}

        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={[
            'input',
            icon && 'input--with-icon',
            type === 'password' && 'input--password',
            value && 'input--has-content'
          ].filter(Boolean).join(' ')}
          {...props}
        />

        {type === 'password' && (
          <button
            type="button"
            className="input__toggle-password"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <Icon name="eye" size={18} /> : <Icon name="eyeOff" size={18} />}
          </button>
        )}
      </div>

      {error && <span className="input__error">{error}</span>}
      {helperText && !error && <span className="input__helper">{helperText}</span>}
    </div>
  );
};

export default Input;
