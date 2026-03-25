import React, { useState } from 'react';
import Icon from '../Icons';
import './Accordion.css';

const Accordion = ({ title, icon, children, defaultOpen = false, className = '' }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={`laika-accordion ${className} ${isOpen ? 'open' : ''}`}>
            <button
                className="laika-accordion-header"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <div className="laika-accordion-title">
                    {icon && <Icon name={icon} size={18} className="accordion-icon" />}
                    <span>{title}</span>
                </div>
                <Icon
                    name={isOpen ? "chevronUp" : "chevronDown"}
                    size={16}
                    className="accordion-toggle-icon"
                />
            </button>

            <div className="laika-accordion-content-wrapper">
                <div className="laika-accordion-content">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Accordion;
