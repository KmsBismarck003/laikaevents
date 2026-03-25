import React, { useState, useEffect } from 'react';
import { Lock, Bell, ShieldCheck, Zap, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/userService';

/**
 * PermissionGuard Component
 * Implementa el efecto Blur + Candado sugerido por el usuario.
 */
const PermissionGuard = ({ hasPermission, children, onPermissionRequest, permissionName }) => {
    const { user, checkAuth } = useAuth();
    const [status, setStatus] = useState('IDLE'); // IDLE, SENDING, PENDING
    const [timeLeft, setTimeLeft] = useState(30);

    // TEMPORIZADOR DE SEGURIDAD (Simula revalidación de credenciales)
    useEffect(() => {
        if (hasPermission || (user && user.role === 'admin')) return;

        // Si estamos en espera, el temporizador actúa como un "Heartbeat" de recheck
        const timer = setInterval(() => {
            if (status === 'PENDING') {
                checkAuth(); // Verifica si el admin ya dio permiso
            }
            setTimeLeft((prev) => (prev <= 1 ? 30 : prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [hasPermission, user, status, checkAuth]);

    const handleRequest = async () => {
        setStatus('SENDING');
        try {
            await userAPI.requestPermission(permissionName);
            setTimeout(() => {
                setStatus('PENDING');
            }, 1000);
        } catch (error) {
            console.error("Error al solicitar permiso:", error);
            setStatus('IDLE');
        }
    };

    // BYPASS DEL REY: El admin no ve bloqueos
    if (user && user.role === 'admin') {
        return <>{children}</>;
    }

    if (hasPermission) {
        return <>{children}</>;
    }

    return (
        <div style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '16px',
            minHeight: '200px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.8)'
        }}>
            {/* El contenido real borroso en el fondo */}
            <div style={{ filter: 'blur(10px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.5 }}>
                {children}
            </div>

            {/* La capa de bloqueo (Overlay Glassmorphism) */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(20,20,20,0.6) 100%)',
                backdropFilter: 'blur(12px) saturate(180%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                padding: '24px',
                textAlign: 'center',
                zIndex: 10
            }}>
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <div style={{
                        border: '2px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <Lock size={40} color="white" strokeWidth={1.5} />
                    </div>
                    <div style={{
                        position: 'absolute',
                        top: -5,
                        right: -5,
                        background: '#ff4d4f',
                        borderRadius: '10px',
                        padding: '2px 8px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        boxShadow: '0 0 10px #ff4d4f'
                    }}>
                        NIVEL 5
                    </div>
                </div>

                <h3 style={{
                    margin: '0 0 8px 0',
                    fontSize: '1.4rem',
                    fontWeight: '800',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    background: 'linear-gradient(to right, #fff, #888)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Zona Restringida
                </h3>

                <p style={{ margin: '0 0 20px 0', maxWidth: '280px', opacity: 0.7, fontSize: '0.95rem', fontWeight: '300' }}>
                    {status === 'PENDING'
                        ? "Tu solicitud está en revisión. El Administrador debe autorizar tu acceso."
                        : `Se requiere autorización para ${permissionName}.`
                    }
                </p>

                {/* Temporizador Regresivo / Estado */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '20px',
                    fontSize: '0.85rem',
                    color: status === 'PENDING' ? '#52c41a' : 'rgba(255,255,255,0.5)',
                    fontFamily: 'monospace',
                    fontWeight: 700
                }}>
                    {status === 'PENDING' ? (
                        <>
                            <Bell size={14} />
                            SOLICITUD ENVIADA AL ADMIN (REV: {timeLeft}s)
                        </>
                    ) : (
                        <>
                            <Zap size={14} color="#fadb14" fill="#fadb14" />
                            REVALIDANDO EN: {timeLeft}s
                        </>
                    )}
                </div>

                <button
                    onClick={handleRequest}
                    disabled={status !== 'IDLE'}
                    style={{
                        backgroundColor: status === 'PENDING' ? '#1f1f1f' : 'white',
                        color: status === 'PENDING' ? '#666' : 'black',
                        border: status === 'PENDING' ? '1px solid #444' : 'none',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontWeight: '900',
                        fontSize: '0.85rem',
                        cursor: status === 'IDLE' ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        boxShadow: status === 'PENDING' ? 'none' : '0 4px 20px rgba(255,255,255,0.2)',
                        textTransform: 'uppercase',
                        opacity: status === 'SENDING' ? 0.7 : 1
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 25px rgba(255,255,255,0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1) translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,255,255,0.2)';
                    }}
                >
                    {status === 'SENDING' ? (
                        <ShieldCheck size={18} />
                    ) : status === 'PENDING' ? (
                        <ShieldCheck size={18} />
                    ) : (
                        <ShieldCheck size={18} />
                    )}
                    {status === 'SENDING' ? 'ENVIANDO...' : status === 'PENDING' ? 'PETICIÓN EN TRÁMITE' : 'SOLICITAR CREDENCIALES'}
                </button>
            </div>

            <style>{`
/* Animations removed per user request (Instant UI) */
            `}</style>
        </div>
    );
};

export default PermissionGuard;
