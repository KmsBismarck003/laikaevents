import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { statsAPI, monitoringAPI, databaseAPI, userAPI, eventAPI, ticketAPI, adsAPI, configAPI } from '../../services/api';
import Icon from '../Icons';
import './LaikaAgent.css';

const LaikaAgent = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [displayText, setDisplayText] = useState('');
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(true);
    const [isEnabled, setIsEnabled] = useState(() => {
        const saved = localStorage.getItem('laika_agent_enabled');
        return saved === null ? true : saved === 'true';
    });
    const [panelSize, setPanelSize] = useState(() => {
        const saved = localStorage.getItem('laika_panel_size');
        return saved ? JSON.parse(saved) : { width: 350, height: 500 };
    });
    const [isResizing, setIsResizing] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(() => {
        return localStorage.getItem('laika_sound_enabled') === 'true';
    });
    const [typingSpeed, setTypingSpeed] = useState(() => {
        return localStorage.getItem('laika_typing_speed') || 'normal';
    });
    const [laikaAvatar, setLaikaAvatar] = useState(() => {
        return localStorage.getItem('laika_avatar_url') || '/logob.png';
    });
    const [roleSettings, setRoleSettings] = useState(() => {
        const saved = localStorage.getItem('laika_role_settings');
        return saved ? JSON.parse(saved) : {
            admin: true,
            gestor: true,
            operador: true,
            usuario: true
        };
    });
    const [showSettings, setShowSettings] = useState(false);
    const [phrases, setPhrases] = useState(["Bienvenido a LAIKA Club"]);
    const { user } = useAuth();
    const location = useLocation();

    // Sincronización Global
    useEffect(() => {
        const syncSettings = () => {
            const enabled = localStorage.getItem('laika_agent_enabled');
            const sound = localStorage.getItem('laika_sound_enabled');
            const speed = localStorage.getItem('laika_typing_speed');
            const avatar = localStorage.getItem('laika_avatar_url');
            const roles = localStorage.getItem('laika_role_settings');

            setIsEnabled(enabled === null ? true : enabled === 'true');
            setSoundEnabled(sound === 'true');
            setTypingSpeed(speed || 'normal');
            if (avatar) setLaikaAvatar(avatar);
            if (roles) setRoleSettings(JSON.parse(roles));
        };

        window.addEventListener('storage', syncSettings);
        return () => window.removeEventListener('storage', syncSettings);
    }, []);

    // Escuchar evento para abrir desde el Sidebar/Navbar
    useEffect(() => {
        const handleOpenExternal = () => setIsOpen(true);
        window.addEventListener('openLaikaAgent', handleOpenExternal);
        return () => window.removeEventListener('openLaikaAgent', handleOpenExternal);
    }, []);

    // Verificar si el agente está habilitado para el rol actual
    const isRoleEnabled = () => {
        const role = user?.role || 'usuario'; // Por defecto usuario si no hay rol
        return roleSettings[role] !== false; // Habilitado si no es explícitamente falso
    };

    const isLaikaVisible = isEnabled && isRoleEnabled();

    // Cargar frases basadas en la ruta y el rol
    useEffect(() => {
        const loadContextPhrases = async () => {
            const role = user?.role || 'invitado';
            const path = location.pathname;

            let basePhrases = [
                "¿En qué puedo ayudarte hoy?",
                "Bienvenido a LAIKA Club",
                "Tengo sugerencias para ti"
            ];

            try {
                if (path.includes('/admin')) {
                    if (path.includes('/database')) {
                        const dbStats = await databaseAPI.getStats();
                        basePhrases.push(`BD: ${dbStats.size || 'Optimizada'}`);
                        basePhrases.push("Respaldo sugerido hoy");
                    } else if (path.includes('/monitoring')) {
                        const metrics = await monitoringAPI.getMetrics();
                        basePhrases.push(`CPU: ${metrics.cpu?.usage || 'Bajo'}`);
                        basePhrases.push("Sistema operativo normal");
                    } else {
                        const dashboard = await statsAPI.getAdminDashboard();
                        basePhrases.push(`Tienes ${dashboard.total_users || 0} usuarios`);
                        basePhrases.push(`Ventas mes: $${dashboard.monthly_sales || 0}`);
                    }
                } else if (path.includes('/staff')) {
                    const staffStats = await statsAPI.getStaffStats();
                    basePhrases.push(`${staffStats.verified_today || 0} boletos hoy`);
                    basePhrases.push("Escáner listo para usar");
                } else if (path === '/' || path === '/home') {
                    basePhrases.push("Explora los mejores eventos");
                    basePhrases.push("Ofertas exclusivas hoy");
                } else if (path.includes('/user')) {
                    basePhrases.push("Mira tus próximos eventos");
                    basePhrases.push("Tienes logros pendientes");
                }
            } catch (error) {
                console.error("Error fetching Laika context:", error);
            }

            setPhrases(basePhrases);
        };

        if (isLaikaVisible) {
            loadContextPhrases();
        }
    }, [location.pathname, user, isLaikaVisible]);

    useEffect(() => {
        if (!isLaikaVisible) return;

        let timeout;
        const currentPhrase = phrases[phraseIndex] || "¿En qué puedo ayudarte?";

        // Ajuste de velocidad
        const typingDelay = typingSpeed === 'instántaneo' ? 10 : (typingSpeed === 'lento' ? 200 : 100);
        const erasingDelay = typingSpeed === 'instántaneo' ? 5 : (typingSpeed === 'lento' ? 100 : 50);

        if (isTyping) {
            if (displayText.length < currentPhrase.length) {
                timeout = setTimeout(() => {
                    setDisplayText(currentPhrase.slice(0, displayText.length + 1));
                    // Opcional: Sonido de clic
                    if (soundEnabled && displayText.length % 3 === 0) {
                        // Aquí se podría disparar un sonido breve si hubiera un asset
                    }
                }, typingDelay);
            } else {
                timeout = setTimeout(() => setIsTyping(false), 3000); // Duración de 3 segundos
            }
        } else {
            if (displayText.length > 0) {
                timeout = setTimeout(() => {
                    setDisplayText(displayText.slice(0, displayText.length - 1));
                }, erasingDelay);
            } else {
                setPhraseIndex((prev) => (prev + 1) % phrases.length);
                setIsTyping(true);
            }
        }

        return () => clearTimeout(timeout);
    }, [displayText, isTyping, phraseIndex, phrases, isEnabled, typingSpeed, soundEnabled, isLaikaVisible]);

    const handleToggleLaika = () => {
        const newState = !isEnabled;
        setIsEnabled(newState);
        localStorage.setItem('laika_agent_enabled', newState.toString());
        window.dispatchEvent(new Event('storage'));
        if (!newState) setIsOpen(false);
    };

    const handleResizeStart = (e) => {
        e.preventDefault();
        setIsResizing(true);
    };

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e) => {
            // Como la ventana está abajo a la derecha:
            // El ancho aumenta cuando el mouse va a la izquierda (menor clientX)
            // El alto aumenta cuando el mouse va arriba (menor clientY)
            const rightEdge = window.innerWidth - 104; // aprox 6.5rem
            const bottomEdge = window.innerHeight - 32; // aprox 2rem

            const newWidth = Math.max(300, Math.min(800, rightEdge - e.clientX));
            const newHeight = Math.max(400, Math.min(800, bottomEdge - e.clientY));

            setPanelSize({ width: newWidth, height: newHeight });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            localStorage.setItem('laika_panel_size', JSON.stringify(panelSize));
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, panelSize]);

    const [messages, setMessages] = useState([
        { id: 1, role: 'laika', text: 'Hola! Soy Laika. Mi sistema ha sido actualizado con nuevas neuronas cognitivas. En qué puedo apoyarte hoy?' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [actionLoading, setActionLoading] = useState(false); // Estado para ejecuciones técnicas
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [pendingAction, setPendingAction] = useState(null); // Memoria contextual para "hazlo" o funciones
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    /**
     * Motor de Ejecución Funcional de Laika
     * @param {Object} actionDef - Definición de la acción { type: 'NAV' | 'FUNC', cmd: string, params: Object }
     */
    const executeAction = async (actionDef) => {
        if (!actionDef) return;

        if (actionDef.type === 'NAV') {
            navigate(actionDef.path);
            setIsOpen(false);
            return;
        }

        if (actionDef.type === 'FUNC') {
            setActionLoading(true);
            try {
                let resultMessage = "";
                switch (actionDef.cmd) {
                    case 'backup':
                        await databaseAPI.createBackup(actionDef.params?.type || 'completo');
                        resultMessage = "Respaldo de base de datos generado exitosamente. Mis sensores confirman la integridad de los datos.";
                        break;
                    case 'optimize':
                        await databaseAPI.optimize();
                        resultMessage = "Limpieza y optimización de circuitos (BD) completada. El sistema debería sentirse más ágil.";
                        break;
                    case 'clear_cache':
                        await databaseAPI.clearCache();
                        resultMessage = "Caché del sistema purgada. Los datos frescos ya están fluyendo.";
                        break;
                    case 'user_status':
                        // Ejemplo: { cmd: 'user_status', params: { userId: 123, status: 'inactive' } }
                        await userAPI.update(actionDef.params.userId, { status: actionDef.params.status });
                        resultMessage = `Usuario ID:${actionDef.params.userId} ha sido ${actionDef.params.status === 'active' ? 'reactivado' : 'desactivado'} conforme a tu orden.`;
                        break;
                    case 'delete_event':
                        await eventAPI.delete(actionDef.params.eventId);
                        resultMessage = `El evento #${actionDef.params.eventId} ha sido eliminado permanentemente de la base de datos.`;
                        break;
                    case 'cancel_ticket':
                        await ticketAPI.cancel(actionDef.params.ticketId);
                        resultMessage = `Boleto #${actionDef.params.ticketId} cancelado. El sistema ha liberado el cupo.`;
                        break;
                    case 'download_logs':
                        const logs = await monitoringAPI.getLogs({ limit: 100 });
                        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `laika_logs_${Date.now()}.json`;
                        a.click();
                        resultMessage = "Archivo de logs generado y descargado. Revisa tu carpeta de descargas.";
                        break;
                    default:
                        resultMessage = "Acción técnica completada, aunque no tengo un reporte detallado en este momento.";
                }

                setMessages(prev => [...prev, {
                    id: Date.now(),
                    role: 'laika',
                    text: resultMessage
                }]);
            } catch (error) {
                console.error("Laika Action Error:", error);
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    role: 'laika',
                    text: `Error en la ejecución técnica: ${error.message || 'Fallo en la conexión neuronal'}. Por favor, verifica tus permisos.`
                }]);
            } finally {
                setActionLoading(false);
                setPendingAction(null);
            }
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isThinking]);

    // Diccionario Maestro de Personalidad y Respuestas (Cientos de Situaciones)
    const personalityMap = {
        saludos: {
            keywords: ['hola', 'buen', 'que tal', 'hey', 'hi', 'aloha', 'onda', 'qué onda', 'buenas', 'saludos', 'ola'],
            responses: [
                'Hola. Sistemas operativos.',
                'Buen día. ¿En qué puedo apoyarte?',
                'Hola. ¿Qué necesitas del sistema?',
                'Hey. Aquí estoy.',
                'Saludos. ¿Qué traes en mente?'
            ]
        },
        estado_animo: {
            keywords: ['como estas', 'cómo estás', 'como va', 'todo bien', 'te sientes', 'como te sientes', 'estas bien', 'qué tal tú'],
            responses: [
                'Todo en orden. Sistemas estables.',
                'Excelente, optimizando procesos.',
                'Bien, gracias. ¿Y tú?',
                'Todo fluyendo correctamente.',
                'Estado óptimo. ¿Qué hay de nuevo?'
            ]
        },
        identidad: {
            keywords: ['quien eres', 'qué eres', 'quien es laika', 'que haces', 'tu funcion', 'explícate', 'quién eres'],
            responses: [
                'Soy Laika. Asistente operativo de LAIKA Club.',
                'Soy tu interfaz de gestión. Guía y soporte técnico.',
                'Soy Laika. Aquí para agilizar tus tareas en el sistema.',
                'Tu asistente para procesar acciones inmediatas.'
            ]
        },
        afirmacion: {
            keywords: ['hazlo', 'dale', 'procede', 'ok', 'está bien', 'entendido', 'claro', 'por supuesto', 'sí', 'si', 'hazlo ya', 'dale una', 'venga', 'simón', 'arriba'],
            responses: [
                'Entendido. Ejecutando.',
                'Perfecto, procedo.',
                'Confirmado. En marcha.',
                'Recibido. Trabajando en ello.'
            ]
        },
        negacion: {
            keywords: ['no', 'detente', 'para', 'cancela', 'mejor no', 'negativo', 'nelson', 'ni de broma'],
            responses: [
                'Entendido, abortando.',
                'Operación cancelada.',
                'Ok, borrando comando.',
                'Cancelado. ¿Algo más?'
            ]
        },
        agradecimiento: {
            keywords: ['gracias', 'gracias laika', 'ty', 'thanks', 'muchas gracias', 'te lo agradezco', 'buena esa', 'genial'],
            responses: [
                'De nada. Siempre a la orden.',
                'Para eso estoy.',
                'A ti. Disfruta el sistema.',
                'Un placer. Aquí sigo.'
            ]
        },
        club: {
            keywords: ['que es laika club', 'sobre el club', 'donde estamos', 'que hacen aquí', 'información del club', 'laika club'],
            responses: [
                'LAIKA Club: Gestión de eventos de alto nivel.',
                'Espacio exclusivo para música, arte y experiencias premium.',
                'Plataforma líder en gestión de eventos industriales.',
                'Concepto de entretenimiento industrial y minimalista.'
            ]
        },
        insulto_test: {
            keywords: ['tonta', 'estúpida', 'mala', 'no sirves', 'basura'],
            responses: [
                'Lamento que te sientas así. Sigo mejorando.',
                'Procesos en evolución. ¿Dime cómo mejorar?',
                'Entendido. Intentaré ser más eficiente.'
            ]
        },
        clima_contexto: {
            keywords: ['clima', 'tiempo', 'hace calor'],
            responses: [
                'Ambiente óptimo dentro del sistema.',
                'Sistemas internos estables.'
            ]
        }
    };

    // Base de Conocimiento Contextual (Aumentada)
    const viewKnowledge = {
        '/admin/database': {
            title: 'Base de Datos',
            tips: ['Haz un respaldo antes de cambios SQL.', 'Usa archivos .sql para migraciones.', 'Revisa el historial de cambios.'],
            help: 'Gestión de integridad, backups y comandos SQL avanzados.'
        },
        '/admin/users': {
            title: 'Control de Usuarios',
            tips: ['Usa el buscador para cambios rápidos.', 'Verifica roles antes de guardar.', 'Usuarios inactivos no tienen acceso.'],
            help: 'Gestión de perfiles, roles y estados de cuenta del club.'
        },
        '/admin/monitoring': {
            title: 'Monitor de Sistema',
            tips: ['CPU > 80% requiere revisión.', 'Estado de DB debe ser estable.', 'Refresca para métricas actuales.'],
            help: 'Estado de hardware y base de datos en tiempo real.'
        },
        '/user/tickets': {
            title: 'Tus Boletos',
            tips: ['Muestra el QR al entrar.', 'Boletos usados caducan.', 'Solicita reembolsos aquí.'],
            help: 'Pases activos para tus eventos.'
        },
        '/admin/sales': {
            title: 'Reporte de Ventas',
            tips: ['Filtra por fecha.', 'Exporta a Excel para análisis.', 'Compara ingresos semanales.'],
            help: 'Resumen financiero y rendimiento de funciones.'
        },
        '/events/manage': {
            title: 'Gestor de Eventos',
            tips: ['Publica para visibilidad.', 'Revisa el aforo máximo.', 'Usa imágenes de alta calidad.'],
            help: 'Creación y edición de la cartelera del club.'
        }
    };

    // Smart Tip Proactivo al cambiar de ruta
    useEffect(() => {
        if (!isOpen) return;

        const currentPath = location.pathname;
        const context = viewKnowledge[currentPath];

        if (context) {
            // Solo mandar tip si no hay mensajes recientes sobre este contexto
            const hasRecentContextTip = messages.some(m => m.text.includes(context.title));
            if (!hasRecentContextTip) {
                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        id: Date.now(),
                        role: 'laika',
                        text: `Sugerencia: Veo que estás en ${context.title}. ${context.tips[0]}`
                    }]);
                }, 2000);
            }
        }
    }, [location.pathname, isOpen]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isThinking) return;

        const userMsg = { id: Date.now(), role: 'user', text: inputValue };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsThinking(true);

        // LLM BRAIN UPGRADE: Comunicación con el Backend de IA
        let response = "";
        let actions = null;
        const lowMsg = userMsg.text.toLowerCase();
        const userRole = user?.role || ' usuario';
        const currentPath = location.pathname;

        try {
            const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:8000';

            // Timeout de 10 segundos para no quedar colgado
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const responseData = await fetch(`${apiBase}/api/laika-ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg.text,
                    role: userRole,
                    context: currentPath
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!responseData.ok) throw new Error("Backend AI no responde");

            const aiResult = await responseData.json();
            response = aiResult.response || "No tengo una respuesta clara en este momento.";
            actions = Array.isArray(aiResult.actions) ? aiResult.actions : null;

            // Si la IA devuelve una acción funcional específica, procesarla
            if (actions && actions.length > 0) {
                const functionalAction = actions.find(a => a.action);
                if (functionalAction) {
                    setPendingAction(functionalAction.action);
                }
            }

        } catch (error) {
            console.warn("Laika AI offline o lento. Usando protocolos de emergencia locales.", error);

            // Fallback Heurístico Local Robusto usando personalityMap
            let foundResponse = false;
            for (const category in personalityMap) {
                if (personalityMap[category].keywords.some(k => lowMsg.includes(k))) {
                    const possibleResponses = personalityMap[category].responses;
                    response = possibleResponses[Math.floor(Math.random() * possibleResponses.length)];
                    foundResponse = true;
                    break;
                }
            }

            if (!foundResponse) {
                if (/respal|backup/i.test(lowMsg)) {
                    response = "Protocolo de respaldo de emergencia activado. ¿Procede?";
                    actions = [{ id: 'b-1', text: 'Ejecutar', icon: 'database', func: true }];
                    setPendingAction({ type: 'FUNC', cmd: 'backup' });
                } else if (/ayu|help/i.test(lowMsg)) {
                    const context = viewKnowledge[currentPath];
                    response = `Estás en **${context?.title || 'Home'}**. Soporte operativo básico activo.`;
                    actions = [{ id: 'h-1', text: 'FAQ', icon: 'helpCircle', path: '/info/faq' }];
                } else {
                    response = "Cerebro en mantenimiento. Protocolo de respuesta básica activo. ¿En qué más puedo apoyarte?";
                }
            }
        } finally {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'laika',
                text: response || "Sistema en reinicio. Intenta de nuevo.",
                actions: actions
            }]);
            setIsThinking(false);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        if (suggestion.func && pendingAction) {
            executeAction(pendingAction);
        } else if (suggestion.path) {
            navigate(suggestion.path);
            setIsOpen(false);
        } else {
            setInputValue(suggestion.text);
        }
    };

    if (!isLaikaVisible && !showSettings && !isOpen) return null;

    return (
        <div className="laika-agent-container">
            {isOpen && (
                <div
                    className={`laika-agent-panel glass-panel ${isResizing ? 'resizing' : ''}`}
                    style={{ width: `${panelSize.width}px`, height: `${panelSize.height}px` }}
                >
                    <div className="laika-resize-handle" onMouseDown={handleResizeStart}>
                        <Icon name="chevronDown" size={14} style={{ transform: 'rotate(45deg)', opacity: 0.5 }} />
                    </div>
                    <header className="laika-agent-header">
                        <div className="laika-avatar">
                            <img src={laikaAvatar} alt="L" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        </div>
                        <div className="laika-info">
                            <div className="laika-title-row">
                                <Icon name="messageSquare" size={14} className="msg-icon-header" />
                                <span className="laika-title">Laika Agent</span>
                            </div>
                            <span className="laika-status">{isThinking ? 'PENSANDO...' : 'IA ASISTENTE • ONLINE'}</span>
                        </div>
                        <div className="laika-actions">
                            <button className="laika-action-btn" onClick={() => setShowSettings(!showSettings)}>
                                <Icon name="settings" size={16} />
                            </button>
                            <button className="laika-action-btn" onClick={() => setIsOpen(false)}>
                                <Icon name="chevronDown" size={16} />
                            </button>
                        </div>
                    </header>

                    <div className="laika-agent-body">
                        {showSettings ? (
                            <div className="laika-settings-view">
                                <h4>Configuración</h4>
                                <div className="laika-setting-item">
                                    <span>Activar Laika Agent</span>
                                    <label className="laika-switch">
                                        <input
                                            type="checkbox"
                                            checked={isEnabled}
                                            onChange={handleToggleLaika}
                                        />
                                        <span className="laika-slider"></span>
                                    </label>
                                </div>
                                <p className="laika-setting-desc">
                                    Si desactivas a Laika, desaparecerá de la interfaz. Puedes volver a activarla en tu perfil.
                                </p>
                                <button className="settings-back-btn" onClick={() => setShowSettings(false)}>
                                    Volver al Chat
                                </button>
                            </div>
                        ) : (
                            <div className="laika-chat-container">
                                <div className="laika-messages">
                                    {messages.map(m => (
                                        <div key={m.id} className={`chat-bubble-group ${m.role}`}>
                                            {(m.role === 'laika' || m.role === 'promo') && (
                                                <div className="laika-avatar-bubble">
                                                    <img
                                                        src={laikaAvatar}
                                                        alt="L"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = '/logob.png';
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            <div className="bubble-content-wrapper">
                                                <div className={`chat-bubble ${m.role}`}>
                                                    {m.text}
                                                </div>
                                                {m.actions && (m.role === 'laika' || m.role === 'promo') && (
                                                    <div className="chat-bubble-actions">
                                                        {m.actions.map(action => (
                                                            <button
                                                                key={action.id}
                                                                className="bubble-action-btn"
                                                                onClick={() => handleSuggestionClick(action)}
                                                            >
                                                                <Icon name={action.icon || 'star'} size={12} />
                                                                {action.text}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {m.role === 'user' && (
                                                <div className="user-avatar-bubble">
                                                    <img
                                                        src={user?.profilePicture || 'https://ui-avatars.com/api/?name=U&background=random'}
                                                        alt="U"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = 'https://ui-avatars.com/api/?name=U&background=000&color=fff';
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {isThinking && (
                                        <div className="chat-bubble-group laika">
                                            <div className="laika-avatar-bubble">
                                                <img
                                                    src={laikaAvatar}
                                                    alt="L"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = '/logob.png';
                                                    }}
                                                />
                                            </div>
                                            <div className="chat-bubble laika thinking">
                                                <span className="dot"></span>
                                                <span className="dot"></span>
                                                <span className="dot"></span>
                                            </div>
                                        </div>
                                    )}
                                    {actionLoading && (
                                        <div className="chat-bubble-group laika">
                                            <div className="laika-avatar-bubble">
                                                <img src={laikaAvatar} alt="L" />
                                            </div>
                                            <div className="chat-bubble laika active-action">
                                                <span>PROCESANDO NEURONA TÉCNICA...</span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>
                        )}
                    </div>

                    {!showSettings && (
                        <div className="laika-footer-actions">
                            <form className="laika-agent-footer" onSubmit={handleSendMessage}>
                                <input
                                    type="text"
                                    className="laika-input"
                                    placeholder="Escribe tu duda..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    disabled={isThinking}
                                />
                                <button className="laika-send-btn" type="submit" disabled={isThinking}>
                                    <Icon name="send" size={16} />
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {isLaikaVisible && !isOpen && (
                <div
                    className="laika-agent-pill-wrapper"
                    onClick={() => setIsOpen(true)}
                >
                    <div className="laika-pill-content">
                        <div className="laika-logo-box">
                            <img src={laikaAvatar} alt="L" className="laika-mini-logo" />
                        </div>
                        <div className="laika-typing-box">
                            <span className="typing-text">{displayText}</span>
                            <span className="terminal-cursor">|</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LaikaAgent;
