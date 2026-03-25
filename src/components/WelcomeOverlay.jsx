import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './index';
import './WelcomeOverlay.css';

const WelcomeOverlay = () => {
  const { showGlobalWelcome, setWelcomeVisibility, user } = useAuth();

  useEffect(() => {
    if (showGlobalWelcome) {
      // Auto-clerrar en 3 segundos
      const timer = setTimeout(() => {
        setWelcomeVisibility(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showGlobalWelcome, setWelcomeVisibility]);

  if (!showGlobalWelcome) return null;

  return (
    <div className="welcome-overlay-container">
      <div className="welcome-modal-global">
        <div className="success-icon-wrapper">
          <svg viewBox="0 0 52 52" className="checkmark-svg">
            <circle cx="26" cy="26" r="25" fill="none" className="checkmark-circle" />
            <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" className="checkmark-check" />
          </svg>
        </div>
        
        <h2 className="welcome-title">¡Bienvenido {user?.name || 'Usuario'}!</h2>
        
        <p className="welcome-message">
          Gracias por formar parte de LAIKA Club. Aquí podrás 
          gestionar tus boletos y recibir notificaciones importantes.
        </p>

        <Button 
          variant="primary" 
          fullWidth 
          size="large"
          className="welcome-continue-btn"
          onClick={() => setWelcomeVisibility(false)}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};

export default WelcomeOverlay;
