import React, { useState, useRef, useEffect } from 'react';
import './Dropdown.css';

const Dropdown = ({ 
  trigger,
  children,
  align = 'left',
  className = '',
  ...props 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const classNames = [
    'dropdown',
    className
  ].filter(Boolean).join(' ');

  const menuClassNames = [
    'dropdown__menu',
    `dropdown__menu--${align}`,
    isOpen && 'dropdown__menu--open'
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames} ref={dropdownRef} {...props}>
      <div className="dropdown__trigger" onClick={toggleDropdown}>
        {trigger}
      </div>
      
      {isOpen && (
        <div className={menuClassNames} onClick={closeDropdown}>
          {children}
        </div>
      )}
    </div>
  );
};

const DropdownItem = ({ 
  children, 
  onClick, 
  icon,
  danger = false,
  disabled = false,
  className = '',
  ...props 
}) => {
  const handleClick = (e) => {
    if (disabled) return;
    onClick && onClick(e);
  };

  const classNames = [
    'dropdown__item',
    danger && 'dropdown__item--danger',
    disabled && 'dropdown__item--disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames} onClick={handleClick} {...props}>
      {icon && <span className="dropdown__item-icon">{icon}</span>}
      <span className="dropdown__item-text">{children}</span>
    </div>
  );
};

const DropdownDivider = () => {
  return <div className="dropdown__divider" />;
};

Dropdown.Item = DropdownItem;
Dropdown.Divider = DropdownDivider;

export default Dropdown;
