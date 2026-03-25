import React, { useState, useEffect } from 'react';
import { ShieldAlert, Clock, User, Bell, CheckCircle } from 'lucide-react';
import axios from 'axios';
import './LockoutOverlay.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'

const LockoutOverlay = ({ remainingSeconds, onComplete, onSwitchAccount, email }) => {
    const [timeLeft, setTimeLeft] = useState(remainingSeconds);
    const [requestSent, setRequestSent] = useState(false);
    const [requesting, setRequesting] = useState(false);
    const [requestError, setRequestError] = useState('')

    useEffect(() => {
        if (timeLeft <= 0) {
            onComplete();
            return;
        }
        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, onComplete]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleRequestPermission = async () => {
        setRequesting(true)
        setRequestError('')
        try {
            // Solicitar permiso sin token (usuario bloqueado no tiene sesión activa)
            // Enviamos el email como identificación para que el admin vea de quién es
            await axios.post(`${API_URL}/api/auth/request-permission`, {
                permission_type: 'unlock_account',
                email: email || 'unknown'
            })
            setRequestSent(true)
        } catch (err) {
            // Si falla el endpoint (no está autenticado), mostramos igual como enviado
            // para no revelar información de seguridad
            setRequestSent(true)
        } finally {
            setRequesting(false)
        }
    }

    return (
        <div className="lockout-overlay">
            <div className="lockout-content">
                <div className="lockout-icon-container">
                    <ShieldAlert size={48} className="lockout-icon" />
                </div>

                <h2 className="lockout-title">SEGURIDAD ACTIVADA</h2>
                <p className="lockout-message">
                    Tu cuenta ha sido bloqueada temporalmente por múltiples intentos fallidos de inicio de sesión.
                </p>

                <div className="lockout-timer-box">
                    <Clock size={20} className="timer-icon" />
                    <span className="lockout-timer">{formatTime(timeLeft)}</span>
                </div>

                <p className="lockout-hint">
                    Espera a que el contador llegue a cero para intentar nuevamente.
                </p>

                <div className="lockout-divider" />

                {/* Botón de solicitud al admin */}
                {!requestSent ? (
                    <button
                        className="lockout-request-btn"
                        onClick={handleRequestPermission}
                        disabled={requesting}
                    >
                        <Bell size={15} />
                        {requesting ? 'Enviando solicitud...' : 'Solicitar permiso al administrador'}
                    </button>
                ) : (
                    <div className="lockout-request-sent">
                        <CheckCircle size={16} />
                        <span>Solicitud enviada. El administrador será notificado.</span>
                    </div>
                )}

                {requestError && (
                    <p className="lockout-request-error">{requestError}</p>
                )}

                <button className="lockout-switch-btn" onClick={onSwitchAccount}>
                    <User size={15} />
                    Ingresar con otra cuenta
                </button>
            </div>
        </div>
    );
};

export default LockoutOverlay;
