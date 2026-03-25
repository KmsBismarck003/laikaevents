import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ label = "INICIANDO SISTEMA LAIKA", status = "ESTABLECIENDO CONEXIÓN SEGURA..." }) => {
  return (
    <div className="laika-loading-screen">
      <div className="loading-content">
        <div className="loading-logo-wrapper">
          <div className="loading-orbit"></div>
          <div className="loading-orbit-outer"></div>
          <img src="/logob.png" alt="LAIKA Club" className="loading-logo" />
        </div>
        
        <div className="loading-text-group">
          <div className="loading-label">{label}</div>
          <div className="loading-status">{status}</div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
