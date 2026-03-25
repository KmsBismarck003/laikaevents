import React, { useState, useEffect } from 'react';
import VenueMapSVG from '../../../components/VenueMapSVG';
import { Badge, Button, AnimatedCounter, Icon } from '../../../components';
import Skeleton from '../../../components/Skeleton';
import './AdminVenueMap.css';

const INITIAL_ZONES = [
    { id: 'vip', name: 'PLATINO VIP', type: 'seating', price: '$2,500', rows: 4, count: 60, points: [ {x: 160, y: 140}, {x: 640, y: 140}, {x: 680, y: 250}, {x: 120, y: 250} ] },
    { id: 'platino', name: 'ZONA PLATINO', type: 'seating', price: '$1,500', rows: 5, count: 100, points: [ {x: 110, y: 260}, {x: 690, y: 260}, {x: 730, y: 370}, {x: 70, y: 370} ] },
    { id: 'plataIzq', name: 'ZONA PLATA IZQ', type: 'seating', price: '$800', rows: 7, count: 35, points: [ {x: 35, y: 140}, {x: 100, y: 140}, {x: 55, y: 370}, {x: -25, y: 370} ] },
    { id: 'plataDer', name: 'ZONA PLATA DER', type: 'seating', price: '$800', rows: 7, count: 35, points: [ {x: 700, y: 140}, {x: 765, y: 140}, {x: 825, y: 370}, {x: 745, y: 370} ] },
    { id: 'bronce', name: 'GENERAL BRONCE', type: 'seating', price: '$400', rows: 6, count: 150, points: [ {x: 70, y: 380}, {x: 730, y: 380}, {x: 785, y: 510}, {x: 15, y: 510} ] },
    { id: 'escenario', name: 'ESCENARIO', type: 'stage', points: [ {x: 150, y: 10}, {x: 650, y: 10}, {x: 680, y: 120}, {x: 120, y: 120} ] }
];

const STADIUM_ZONES = [
    { id: 'norte', name: 'GRADA NORTE', type: 'seating', price: '$600', rows: 8, count: 200, points: [ {x: 150, y: 110}, {x: 650, y: 110}, {x: 700, y: 50}, {x: 100, y: 50} ] },
    { id: 'sur', name: 'GRADA SUR', type: 'seating', price: '$600', rows: 8, count: 200, points: [ {x: 100, y: 450}, {x: 700, y: 450}, {x: 650, y: 390}, {x: 150, y: 390} ] },
    { id: 'oriente', name: 'GRADA ORIENTE', type: 'seating', price: '$1,200', rows: 10, count: 120, points: [ {x: 680, y: 120}, {x: 780, y: 80}, {x: 780, y: 420}, {x: 680, y: 380} ] },
    { id: 'poniente', name: 'GRADA PONIENTE', type: 'seating', price: '$1,200', rows: 10, count: 120, points: [ {x: 20, y: 80}, {x: 120, y: 120}, {x: 120, y: 380}, {x: 20, y: 420} ] },
    { id: 'cancha', name: 'CANCHA / FIELD', type: 'corridor', points: [ {x: 160, y: 140}, {x: 640, y: 140}, {x: 640, y: 360}, {x: 160, y: 360} ] },
    { id: 'escenario', name: 'ESCENARIO', type: 'stage', points: [ {x: 150, y: 10}, {x: 650, y: 10}, {x: 680, y: 120}, {x: 120, y: 120} ] }
];

// --- PRESET EXCLUSIVO PARA SUMMER EDITION (COMPLEJO) ---
const SUMMER_EDITION_PRESET = [
    { id: 'stage-main', name: 'STAGE', type: 'stage', points: [ {x: 600, y: 200}, {x: 750, y: 200}, {x: 750, y: 400}, {x: 600, y: 400} ] },
    { id: 'stage-runway', name: 'RUNWAY', type: 'stage', points: [ {x: 430, y: 280}, {x: 600, y: 280}, {x: 600, y: 320}, {x: 430, y: 320} ] },
    { id: 'stage-thrust', name: 'THRUST', type: 'stage', points: [ {x: 360, y: 240}, {x: 430, y: 240}, {x: 430, y: 360}, {x: 360, y: 360} ] },
    { id: 'ga-blue', name: 'GENERAL ADMISSION', type: 'corridor', points: [ {x: 60, y: 170}, {x: 340, y: 170}, {x: 340, y: 430}, {x: 60, y: 430} ] },
    { id: 'vip-red-top', name: 'VIP FRONT B', type: 'seating', price: '$2,500', rows: 6, count: 100, points: [ {x: 360, y: 140}, {x: 580, y: 140}, {x: 580, y: 230}, {x: 440, y: 230} ] },
    { id: 'vip-red-bottom', name: 'VIP FRONT B', type: 'seating', price: '$2,500', rows: 6, count: 100, points: [ {x: 360, y: 370}, {x: 580, y: 370}, {x: 580, y: 460}, {x: 440, y: 460} ] },
    { id: 'box-top-left', name: 'BOX 1', type: 'seating', price: '$1,500', rows: 2, count: 10, points: [ {x: 200, y: 90}, {x: 350, y: 90}, {x: 350, y: 130}, {x: 200, y: 130} ] },
    { id: 'box-top-right', name: 'BOX 2', type: 'seating', price: '$1,500', rows: 2, count: 10, points: [ {x: 370, y: 90}, {x: 520, y: 90}, {x: 520, y: 130}, {x: 370, y: 130} ] },
    { id: 'box-bottom-left', name: 'BOX 3', type: 'seating', price: '$1,500', rows: 2, count: 10, points: [ {x: 200, y: 470}, {x: 350, y: 470}, {x: 350, y: 510}, {x: 200, y: 510} ] },
    { id: 'box-bottom-right', name: 'BOX 4', type: 'seating', price: '$1,500', rows: 2, count: 10, points: [ {x: 370, y: 470}, {x: 520, y: 470}, {x: 520, y: 510}, {x: 370, y: 510} ] },
    { id: 'tier-inner-blue', name: 'TIER INNER BLUE', type: 'seating', price: '$1,200', rows: 10, count: 200, points: [ {x: 10, y: 120}, {x: 180, y: 80}, {x: 180, y: 520}, {x: 10, y: 480} ] },
    { id: 'tier-middle-red', name: 'TIER MIDDLE RED', type: 'seating', price: '$800', rows: 12, count: 300, points: [ {x: 190, y: 20}, {x: 550, y: 20}, {x: 550, y: 70}, {x: 190, y: 70} ] },
    { id: 'tier-outer-yellow', name: 'TIER OUTER YELLOW', type: 'seating', price: '$400', rows: 15, count: 500, points: [ {x: 570, y: 20}, {x: 780, y: 20}, {x: 780, y: 180}, {x: 570, y: 100} ] },
    { id: 'tier-outer-yellow-2', name: 'TIER OUTER YELLOW 2', type: 'seating', price: '$400', rows: 15, count: 500, points: [ {x: 570, y: 500}, {x: 780, y: 420}, {x: 780, y: 580}, {x: 570, y: 580} ] }
];

const THEATER_PRESET = [
    { id: 'stage', name: 'ESCENARIO PRAL', type: 'stage', points: [ {x: 250, y: 400}, {x: 550, y: 400}, {x: 550, y: 550}, {x: 250, y: 550} ] },
    { id: 'platea', name: 'PLATEA A', type: 'seating', price: '$1,200', rows: 8, count: 80, points: [ {x: 200, y: 250}, {x: 600, y: 250}, {x: 650, y: 380}, {x: 150, y: 380} ] },
    { id: 'mezzanine', name: 'MEZZANINE', type: 'seating', price: '$800', rows: 6, count: 120, points: [ {x: 100, y: 50}, {x: 700, y: 50}, {x: 750, y: 230}, {x: 50, y: 230} ] }
];

const CLUB_PRESET = [
    { id: 'dj-booth', name: 'DJ BOOTH', type: 'stage', points: [ {x: 350, y: 30}, {x: 450, y: 30}, {x: 450, y: 150}, {x: 350, y: 150} ] },
    { id: 'dancefloor', name: 'DANCE FLOOR', type: 'corridor', points: [ {x: 250, y: 200}, {x: 550, y: 200}, {x: 550, y: 500}, {x: 250, y: 500} ] },
    { id: 'vip-lounge-1', name: 'VIP LOUNGE LEFT', type: 'seating', price: '$3,000', rows: 4, count: 20, points: [ {x: 50, y: 150}, {x: 230, y: 150}, {x: 230, y: 550}, {x: 50, y: 550} ] },
    { id: 'vip-lounge-2', name: 'VIP LOUNGE RIGHT', type: 'seating', price: '$3,000', rows: 4, count: 20, points: [ {x: 570, y: 150}, {x: 750, y: 150}, {x: 750, y: 550}, {x: 570, y: 550} ] }
];

const AUDITORIUM_PRESET = [
    { id: 'podium', name: 'PODIUM / MODERADOR', type: 'stage', points: [ {x: 300, y: 50}, {x: 500, y: 50}, {x: 520, y: 150}, {x: 280, y: 150} ] },
    { id: 'front-seating', name: 'ZONA MAGNA', type: 'seating', price: '$500', rows: 10, count: 150, points: [ {x: 150, y: 170}, {x: 650, y: 170}, {x: 700, y: 350}, {x: 100, y: 350} ] },
    { id: 'back-seating', name: 'ZONA GENERAL', type: 'seating', price: '$300', rows: 12, count: 200, points: [ {x: 50, y: 370}, {x: 750, y: 370}, {x: 780, y: 550}, {x: 20, y: 550} ] }
];

const BOXING_PRESET = [
    { id: 'ring', name: 'THE RING (MAIN)', type: 'stage', points: [ {x: 320, y: 220}, {x: 480, y: 220}, {x: 480, y: 380}, {x: 320, y: 380} ] },
    { id: 'ringside-n', name: 'RINGSIDE NORTH', type: 'seating', price: '$5,000', rows: 3, count: 30, points: [ {x: 300, y: 100}, {x: 500, y: 100}, {x: 500, y: 200}, {x: 300, y: 200} ] },
    { id: 'ringside-s', name: 'RINGSIDE SOUTH', type: 'seating', price: '$5,000', rows: 3, count: 30, points: [ {x: 300, y: 400}, {x: 500, y: 400}, {x: 500, y: 500}, {x: 300, y: 500} ] },
    { id: 'ringside-e', name: 'RINGSIDE EAST', type: 'seating', price: '$5,000', rows: 3, count: 30, points: [ {x: 520, y: 220}, {x: 650, y: 220}, {x: 650, y: 380}, {x: 520, y: 380} ] },
    { id: 'ringside-w', name: 'RINGSIDE WEST', type: 'seating', price: '$5,000', rows: 3, count: 30, points: [ {x: 150, y: 220}, {x: 280, y: 220}, {x: 280, y: 380}, {x: 150, y: 380} ] }
];

const AMPHITHEATER_PRESET = [
    { id: 'lawn', name: 'LAWN (GENERAL)', type: 'corridor', points: [ {x: 20, y: 20}, {x: 780, y: 20}, {x: 750, y: 130}, {x: 50, y: 130} ] },
    { id: 'terrace', name: 'TERRACE B', type: 'seating', price: '$600', rows: 8, count: 200, points: [ {x: 100, y: 150}, {x: 700, y: 150}, {x: 750, y: 330}, {x: 50, y: 330} ] },
    { id: 'orchestra', name: 'ORCHESTRA A', type: 'seating', price: '$900', rows: 5, count: 100, points: [ {x: 200, y: 350}, {x: 600, y: 350}, {x: 650, y: 480}, {x: 150, y: 480} ] },
    { id: 'stage', name: 'STAGE OPEN AIR', type: 'stage', points: [ {x: 300, y: 500}, {x: 500, y: 500}, {x: 550, y: 580}, {x: 250, y: 580} ] }
];

const VENUE_TEMPLATES = [
    { id: 'arena', name: 'CONCERT ARENA', icon: 'music', preset: INITIAL_ZONES },
    { id: 'stadium', name: 'OLYMPIC STADIUM', icon: 'layout', preset: STADIUM_ZONES },
    { id: 'festival', name: 'SUMMER FESTIVAL', icon: 'sun', preset: SUMMER_EDITION_PRESET },
    { id: 'theater', name: 'INTIMATE THEATER', icon: 'theater', preset: THEATER_PRESET },
    { id: 'club', name: 'CLUB / LOUNGE', icon: 'zap', preset: CLUB_PRESET },
    { id: 'auditorium', name: 'AUDITORIUM EXPO', icon: 'users', preset: AUDITORIUM_PRESET },
    { id: 'boxing', name: 'BOXING / MMA RING', icon: 'shield', preset: BOXING_PRESET },
    { id: 'amphitheater', name: 'AMPHITHEATER', icon: 'image', preset: AMPHITHEATER_PRESET }
];

const AdminVenueMap = () => {
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 900);
        return () => clearTimeout(timer);
    }, []);

    const [selectedSeats, setSelectedSeats] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('1');
    const [isEditMode, setIsEditMode] = useState(false);

    // Estado para la geometría de las zonas (Permite manipulación tipo Canva) con persistencia
    const [zones, setZones] = useState(() => {
        const saved = localStorage.getItem('venue_zones_edited');
        return saved ? JSON.parse(saved) : INITIAL_ZONES;
    });

    useEffect(() => {
        localStorage.setItem('venue_zones_edited', JSON.stringify(zones));
    }, [zones]);

    const [selectedZoneId, setSelectedZoneId] = useState(null);
    
    // Función para aumentar/disminuir precio
    const handleAdjustPrice = (zoneId, delta) => {
        setZones(prevZones => prevZones.map(z => {
            if (z.id === zoneId) {
                const currentVal = parseFloat(z.price?.replace('$', '').replace(',', '') || 0);
                const newVal = Math.max(0, currentVal + delta);
                return { ...z, price: `$${newVal.toLocaleString('en-US')}` };
            }
            return z;
        }));
    };

    const restoreOriginal = () => {
        if (window.confirm('¿Estás seguro de que quieres restaurar el mapa original? Se perderán todos los cambios.')) {
            localStorage.removeItem('venue_zones_edited');
            setZones(INITIAL_ZONES);
            setSelectedZoneId(null);
            resetView();
        }
    };

    const loadStadiumPreset = () => {
        if (window.confirm('¿Quieres cargar el diseño de ESTADIO? Esto borrará el diseño actual.')) {
            setZones(STADIUM_ZONES);
            setSelectedZoneId(null);
            resetView();
        }
    };

    const [availableEvents, setAvailableEvents] = useState([]);

    const [isCreatingEvent, setIsCreatingEvent] = useState(false);
    const [newEventData, setNewEventData] = useState({ name: '', price: '1000', templateId: 'arena' });

    // --- NUEVA LÓGICA DE PERSISTENCIA (LOCALSTORAGE REAL) ---
    useEffect(() => {
        const savedEvents = localStorage.getItem('laika_custom_events');
        if (savedEvents) {
            setAvailableEvents(JSON.parse(savedEvents));
        }
    }, []);

    const saveChanges = () => {
        const storageKey = `laika_map_zones_event_${selectedEventId}`;
        localStorage.setItem(storageKey, JSON.stringify(zones));
        // También guardamos la lista de eventos por si se añadió uno nuevo
        localStorage.setItem('laika_custom_events', JSON.stringify(availableEvents));
        alert('¡CAMBIOS GUARDADOS REALMENTE! 💾✨ El diseño se mantendrá incluso si recargas la página.');
    };

    const handleCreateEvent = () => {
        if (!newEventData.name) return alert('Por favor ingresa un nombre para el evento');
        
        const newId = `event-${Date.now()}`;
        const selectedTemplate = VENUE_TEMPLATES.find(t => t.id === newEventData.templateId);
        
        // Ajustar precios en el preset basado en el precio base ingresado
        const finalizedPreset = selectedTemplate.preset.map(z => ({
            ...z,
            price: z.type === 'seating' ? `$${newEventData.price}` : z.price
        }));

        const newEvent = {
            id: newId,
            name: newEventData.name.toUpperCase(),
            total: 10000,
            sold: 0,
            revenue: 0,
            available: 10000,
            isCustom: true
        };

        const updatedEvents = [...availableEvents, newEvent];
        setAvailableEvents(updatedEvents);
        localStorage.setItem('laika_custom_events', JSON.stringify(updatedEvents));
        localStorage.setItem(`laika_map_zones_event_${newId}`, JSON.stringify(finalizedPreset));

        setSelectedEventId(newId);
        setIsCreatingEvent(false);
        setNewEventData({ name: '', price: '1000', templateId: 'arena' });
        alert(`¡Evento "${newEventData.name.toUpperCase()}" creado con éxito usando la plantilla ${selectedTemplate.name}!`);
    };

    useEffect(() => {
        const storageKey = `laika_map_zones_event_${selectedEventId}`;
        const savedZones = localStorage.getItem(storageKey);
        if (savedZones) {
            try {
                setZones(JSON.parse(savedZones));
            } catch (e) {
                console.error("Error al cargar zonas guardadas", e);
                setZones(INITIAL_ZONES);
            }
        } else {
            // Si no hay nada guardado para este evento, cargamos el preset inicial
            if (selectedEventId === '2') {
                setZones(SUMMER_EDITION_PRESET);
            } else if (selectedEventId === '3' || selectedEventId === '4') {
                setZones(STADIUM_ZONES);
            } else {
                setZones(INITIAL_ZONES);
            }
        }
    }, [selectedEventId]);
    // -------------------------------------------------------

    const duplicateZone = () => {
        if (!selectedZoneId) return;
        const zoneToClone = zones.find(z => z.id === selectedZoneId);
        if (!zoneToClone) return;

        const newId = `${zoneToClone.id}_copy_${Date.now()}`;
        const newZone = {
            ...zoneToClone,
            id: newId,
            name: `${zoneToClone.name} (Copia)`,
            points: zoneToClone.points.map(p => ({ x: p.x + 20, y: p.y + 20 })) // Offset
        };

        setZones([...zones, newZone]);
        setSelectedZoneId(newId);
    };

    const removeZone = () => {
        if (!selectedZoneId) return;
        const zoneToDelete = zones.find(z => z.id === selectedZoneId);
        if (!zoneToDelete) return;

        if (window.confirm(`¿Estás seguro de que quieres eliminar la zona "${zoneToDelete.name.toUpperCase()}"? No se puede deshacer.`)) {
            setZones(zones.filter(z => z.id !== selectedZoneId));
            setSelectedZoneId(null);
        }
    };

    // Estado para zoom y navegación del mapa
    const [mapView, setMapView] = useState({ zoom: 1, pan: { x: 0, y: 0 } });

    const handleZoom = (delta) => {
        setMapView(prev => ({
            ...prev,
            zoom: Math.min(Math.max(prev.zoom + delta, 0.5), 3)
        }));
    };

    const handlePan = (dx, dy) => {
        setMapView(prev => ({
            ...prev,
            pan: { x: prev.pan.x + dx, y: prev.pan.y + dy }
        }));
    };

    const resetView = () => setMapView({ zoom: 1, pan: { x: 0, y: 0 } });

    const addZone = (type) => {
        const id = `zone-${Date.now()}`;
        const newZone = {
            id,
            name: `NUEVA ZONA ${type.toUpperCase()}`,
            type,
            points: [ {x: 350, y: 200}, {x: 450, y: 200}, {x: 450, y: 300}, {x: 350, y: 300} ],
            price: type === 'seating' ? '$500' : 'N/A',
            rows: type === 'seating' ? 5 : 0,
            count: type === 'seating' ? 50 : 0
        };
        setZones([...zones, newZone]);
        setSelectedZoneId(id);
    };

    const handleZoomIn = () => handleZoom(0.1);
    const handleZoomOut = () => handleZoom(-0.1);

    const updateZoneGeometry = (zoneId, newPoints, textPos, textAngle, curveAmounts) => {
        if (!isEditMode) return;
        setZones(zones.map(z => z.id === zoneId ? { 
            ...z, 
            points: newPoints,
            textPos: textPos !== undefined ? textPos : z.textPos,
            textAngle: textAngle !== undefined ? textAngle : z.textAngle,
            curveAmounts: curveAmounts !== undefined ? curveAmounts : z.curveAmounts
        } : z));
    };

    const currentEvent = availableEvents.find(e => e.id === selectedEventId) || availableEvents[0];

    // Estado para las estadísticas dinámicas
    const [stats, setStats] = useState(currentEvent);

    useEffect(() => {
        setStats(currentEvent);
        setSelectedSeats([]);
        // Al cambiar de evento, NO reseteamos las zonas aquí, 
        // ya lo hace el useEffect de persistencia arriba.
    }, [selectedEventId]);

    const adjustPosition = (dx, dy) => {
        if (!selectedZoneId) return;
        const zone = zones.find(z => z.id === selectedZoneId);
        if (!zone) return;
        
        const newPoints = zone.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
        updateZoneGeometry(selectedZoneId, newPoints);
    };

    // Simulación de actualizaciones en vivo (Eliminada a petición del usuario)
    useEffect(() => {
        // No realizar acciones de simulación ficticia
    }, [selectedEventId]);

    // EFECTO DE RESCATE: Asegurar que el Escenario esté presente en el estado actual
    useEffect(() => {
        setZones(prev => {
            const hasEscenario = prev.some(z => z.id === 'escenario');
            if (!hasEscenario) {
                const stageZone = INITIAL_ZONES.find(z => z.id === 'escenario');
                return [...prev, stageZone];
            }
            return prev;
        });
    }, []);

    const counterDuration = 1591; // 3% más lento que 1545ms

    return (
        <div className="admin-venue-map-page">
            {/* Banner del Concierto */}
            <div className="event-hero-banner">
                {loading ? <Skeleton style={{ height: '100%', width: '100%', minHeight: '160px' }} animate /> : <img src="/assets/events/banner_bad_bunny.png" alt="Event Banner" className="banner-img" />}
                <div className="banner-overlay">
                    <div className="banner-content">
                        {loading ? <Skeleton width="100px" height="18px" /> : <Badge variant="primary" className="mb-2">EVENTO ACTIVO</Badge>}
                        <h2 className="banner-title">{loading ? <Skeleton width="220px" height="28px" style={{ marginTop: '8px' }} /> : (currentEvent?.name || 'SIN EVENTO SELECCIONADO')}</h2>
                        <p className="banner-subtitle">{loading ? <Skeleton width="340px" height="14px" style={{ marginTop: '4px' }} /> : 'Monitoreo de Taquilla en Tiempo Real • Estadio Laika'}</p>
                    </div>
                </div>
            </div>

            <header className="admin-page-header">
                <div className="header-left">
                    <div className="event-selector-box">
                        {loading ? <Skeleton width="140px" height="34px" /> : (
                            <select 
                                value={selectedEventId} 
                                onChange={(e) => setSelectedEventId(e.target.value)}
                                className="dynamic-event-selector"
                            >
                                {availableEvents.length > 0 ? (
                                    availableEvents.map(event => (
                                        <option key={event.id} value={event.id}>{event.name}</option>
                                    ))
                                ) : (
                                    <option value="1">CONCIERTO BASE</option>
                                )}
                            </select>
                        )}
                        {!loading && (
                            <button 
                                className="create-event-btn-mini" 
                                onClick={() => setIsCreatingEvent(true)}
                                title="Crear Nuevo Evento"
                            >
                                <Icon name="plus" size={16} />
                            </button>
                        )}
                    </div>
                    <h1>{loading ? <Skeleton width="200px" height="28px" /> : 'Panel de Control de Mapa'}</h1>
                </div>
                <div className="header-actions">
                    {loading ? <Skeleton width="150px" height="32px" /> : (
                        <>
                            {isEditMode && (
                                <Button 
                                    variant="primary" 
                                    size="small" 
                                    onClick={saveChanges}
                                    className="save-changes-btn-premium"
                                >
                                    <Icon name="save" size={14} /> <span>GUARDAR CAMBIOS</span>
                                </Button>
                            )}
                            {isEditMode && (
                                <div className="edit-actions-group">
                                    <div className="add-zone-dropdown premium">
                                        <Button variant="primary" size="small" className="btn-add-main">
                                            <Icon name="plus" size={14} /> <span>AÑADIR...</span>
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <Button 
                                variant={isEditMode ? 'primary' : 'outline'} 
                                size="small" 
                                onClick={() => {
                                    setIsEditMode(!isEditMode);
                                    if (isEditMode) setSelectedZoneId(null);
                                }}
                                className="edit-mode-btn"
                            >
                                <Icon name={isEditMode ? 'check' : 'edit'} size={14} />
                                <span>{isEditMode ? 'GUARDAR MAPA' : 'EDITAR DIBUJO'}</span>
                            </Button>
                            <Badge variant="success">LIVE: UPDATING EVERY 15S</Badge>
                        </>
                    )}
                </div>
            </header>

            <div className="sales-stats-grid premium">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="stat-card-premium">
                        <div className="stat-icon-box">
                            {loading ? <Skeleton width="16px" height="16px" /> : <Icon name={['users', 'ticket', 'activity', 'dollar-sign'][i]} size={20} />}
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">
                                {loading ? <Skeleton width="60px" height="10px" /> : ['TOTAL ASIENTOS', 'VENDIDOS', 'DISPONIBLES', 'INGRESOS EST.'][i]}
                            </span>
                            <span className="stat-value">
                                {loading ? <Skeleton width="40px" height="20px" style={{ marginTop: '4px' }} /> : (
                                    <AnimatedCounter 
                                        value={i === 0 ? (stats?.total || 0) : i === 1 ? (stats?.sold || 0) : i === 2 ? (stats?.available || 0) : (stats?.revenue || 0)} 
                                        duration={counterDuration} 
                                    />
                                )}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="admin-map-container-main">
                <div className="admin-map-main-layout">
                    <div className="zone-management-sidebar premium">
                        <div className="sidebar-header">
                            <h3>GESTIÓN DE ZONAS</h3>
                            <Badge variant="outline" size="small">{zones.length} TOTAL</Badge>
                        </div>
                        <div className="zones-list">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <div key={i} className="zone-item-premium" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                                            <Skeleton width="18px" height="18px" borderRadius="4px" />
                                            <Skeleton width="130px" height="14px" />
                                            <Skeleton width="45px" height="14px" style={{ marginLeft: 'auto' }} />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                zones.map(zone => (
                                    <div 
                                        key={zone.id} 
                                        className={`zone-item-premium ${selectedZoneId === zone.id ? 'active' : ''}`}
                                        onClick={() => setSelectedZoneId(zone.id)}
                                    >
                                    <div className="zone-info">
                                        <div className="zone-type-icon-box">
                                            {zone.type === 'seating' ? <Icon name="armchair" size={14} /> : 
                                             zone.type === 'corridor' ? <Icon name="move" size={14} /> : 
                                             zone.type === 'wc' ? <Icon name="info" size={14} /> : <Icon name="door-open" size={14} />}
                                        </div>
                                        <input 
                                            className="zone-name-input"
                                            value={zone.name}
                                            readOnly={!isEditMode}
                                            onChange={(e) => {
                                                const newZones = zones.map(z => 
                                                    z.id === zone.id ? { ...z, name: e.target.value } : z
                                                );
                                                setZones(newZones);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        {zone.type === 'seating' && (
                                            <div className="zone-price-edit-box" style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '2px 4px' }}>
                                                 {isEditMode && (
                                                     <button 
                                                         onClick={(e) => { e.stopPropagation(); handleAdjustPrice(zone.id, -100); }}
                                                         style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', color: '#666' }}
                                                         title="Restar 100"
                                                     >
                                                         <Icon name="minus" size={10} />
                                                     </button>
                                                 )}
                                                 <Icon name="dollar-sign" size={10} />
                                                 <input 
                                                     className="zone-price-input"
                                                     value={zone.price?.replace('$', '')}
                                                     readOnly={!isEditMode}
                                                     onChange={(e) => {
                                                         const newZones = zones.map(z => 
                                                             z.id === zone.id ? { ...z, price: `$${e.target.value}` } : z
                                                         );
                                                         setZones(newZones);
                                                     }}
                                                     onClick={(e) => e.stopPropagation()}
                                                     style={{ width: '40px', padding: '0 2px' }}
                                                 />
                                                 {isEditMode && (
                                                     <button 
                                                         onClick={(e) => { e.stopPropagation(); handleAdjustPrice(zone.id, 100); }}
                                                         style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', color: '#666' }}
                                                         title="Sumar 100"
                                                     >
                                                         <Icon name="plus" size={10} />
                                                     </button>
                                                 )}
                                             </div>
                                        )}
                                    </div>
                                    {isEditMode && (
                                        <button 
                                            className="ghost-delete-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedZoneId(zone.id);
                                                removeZone();
                                            }}
                                            title="Eliminar Zona"
                                        >
                                            <Icon name="trash-2" size={12} />
                                        </button>
                                    )}
                                </div>
                            ))
                            )}
                        </div>
                        {isEditMode && selectedZoneId && (() => {
                            const zoneObj = zones.find(z => z.id === selectedZoneId);
                            if (!zoneObj) return null;
                            return (
                                <div className="fine-tuning-panel" style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                                    <span className="fine-tuning-label">AJUSTE POSICIÓN PRECISA (PX)</span>
                                    <div className="fine-tuning-controls">
                                        <Button variant="outline" size="small" onClick={() => adjustPosition(-1, 0)} className="fine-tune-btn">
                                            <Icon name="chevron-left" size={14} />
                                        </Button>
                                        <Button variant="outline" size="small" onClick={() => adjustPosition(1, 0)} className="fine-tune-btn">
                                            <Icon name="chevron-right" size={14} />
                                        </Button>
                                    </div>
                                    {isEditMode && (
                                        <button 
                                            className="ghost-delete-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedZoneId(zoneObj.id);
                                                removeZone();
                                            }}
                                            title="Eliminar Zona"
                                            style={{ marginTop: '10px', width: '100%', display: 'flex', justifyContent: 'center', backgroundColor: 'transparent', border: '1px solid rgba(255,0,0,0.3)', color: '#ff4444', padding: '6px', cursor: 'pointer', borderRadius: '4px' }}
                                        >
                                            <Icon name="trash-2" size={14} style={{ marginRight: '6px' }}/> ELIMINAR ZONA ABSOLUTO
                                        </button>
                                    )}
                                </div>
                            );
                        })()}
                        <div className="sidebar-footer">
                            <p>{isEditMode ? 'Haz clic en una zona para editar sus puntos' : 'Vista de inventario de zonas'}</p>
                        </div>
                    </div>
                    <div className="admin-map-wrapper">
                        {/* Nuevo Control de Zoom: Pastilla Blanca Premium */}
                        <div className="premium-zoom-pill">
                            <button className="zoom-pill-btn plus" onClick={handleZoomIn}>
                                <Icon name="plus" size={16} />
                            </button>
                            <div className="zoom-pill-divider" />
                            <div className="zoom-pill-value">{Math.round(mapView.zoom * 100)}%</div>
                            <div className="zoom-pill-divider" />
                            <button className="zoom-pill-btn minus active" onClick={handleZoomOut}>
                                <Icon name="minus" size={16} />
                            </button>
                        </div>

                        {/* Controles de Navegación Premium - Joystick mas discreto con flechas negras */}
                        <div className="minimal-pan-joystick persistent premium-joystick compact">
                            <div className="joystick-wrapper">
                                <button className="joystick-btn up" onClick={() => handlePan(0, -50)} title="Arriba">
                                    <Icon name="chevronUp" size={16} />
                                </button>
                                <div className="joystick-middle-row">
                                    <button className="joystick-btn left" onClick={() => handlePan(-50, 0)} title="Izquierda">
                                        <Icon name="chevronLeft" size={16} />
                                    </button>
                                    <button className="joystick-btn center" onClick={resetView} title="Re-centrar Mapa">
                                        <Icon name="maximize" size={14} />
                                    </button>
                                    <button className="joystick-btn right" onClick={() => handlePan(50, 0)} title="Derecha">
                                        <Icon name="chevronRight" size={16} />
                                    </button>
                                </div>
                                <button className="joystick-btn down" onClick={() => handlePan(0, 50)} title="Abajo">
                                    <Icon name="chevronDown" size={16} />
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div style={{ width: '100%', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Skeleton style={{ width: '100%', height: '100%', borderRadius: '12px' }} animate />
                            </div>
                        ) : (
                            <VenueMapSVG 
                                selectedSeats={selectedSeats}
                                onSeatToggle={(id) => setSelectedSeats(prev => 
                                    prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
                                )}
                                isEditMode={isEditMode}
                                zones={zones}
                                onUpdateGeometry={updateZoneGeometry}
                                onZoneColorChange={(zoneId, color) => {
                                    setZones(zones.map(z => z.id === zoneId ? { ...z, color: color, tier: null } : z));
                                }}
                                selectedZoneId={selectedZoneId}
                                onZoneSelect={setSelectedZoneId}
                                mapView={mapView}
                            />
                        )}
                    </div>
                </div>
                
                <div className="admin-map-legend">
                    <h3>LEYENDA</h3>
                    <div className="legend-item">
                        <span className="dot dot-occupied"></span>
                        <span>Vendido (Ocupado)</span>
                    </div>
                    <div className="legend-item">
                        <span className="dot dot-available"></span>
                        <span>Disponible</span>
                    </div>
                    <div className="legend-item">
                        <span className="dot dot-selected"></span>
                        <span>Selección Admin</span>
                    </div>
                    {isEditMode && (
                        <div className="legend-item edit-hint">
                            <span className="dot dot-edit"></span>
                            <span>Mueve los puntos rojos para inclinar</span>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL DE CREACIÓN DE EVENTO Y GALERÍA DE PLANTILLAS */}
            {isCreatingEvent && (
                <div className="new-event-modal-overlay">
                    <div className="new-event-modal-content">
                        <div className="modal-header-premium">
                            <Icon name="layout" size={24} />
                            <div>
                                <h2>CREAR NUEVO EVENTO</h2>
                                <p>Configura tu recinto en segundos con nuestras plantillas pro.</p>
                            </div>
                            <button className="close-modal-btn" onClick={() => setIsCreatingEvent(false)}>
                                <Icon name="x" size={20} />
                            </button>
                        </div>

                        <div className="modal-body-layout">
                            <div className="form-section">
                                <h3 className="section-title">DATOS DEL EVENTO</h3>
                                <div className="input-group-premium">
                                    <label>NOMBRE DEL EVENTO</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej: LAIKA DANCE NIGHT 2026" 
                                        value={newEventData.name}
                                        onChange={(e) => setNewEventData({...newEventData, name: e.target.value})}
                                    />
                                </div>
                                <div className="input-row">
                                    <div className="input-group-premium">
                                        <label>PRECIO BASE BOLETO</label>
                                        <div className="price-input-wrapper">
                                            <span>$</span>
                                            <input 
                                                type="number" 
                                                value={newEventData.price}
                                                onChange={(e) => setNewEventData({...newEventData, price: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="input-group-premium">
                                        <label>BANNER (SIMULADO)</label>
                                        <select disabled>
                                            <option>Banner Estándar Laika</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="template-gallery-section">
                                <h3 className="section-title">ELIGE TU BOCETO DE MAPA (8 DISPONIBLES)</h3>
                                <div className="templates-grid">
                                    {VENUE_TEMPLATES.map(template => (
                                        <div 
                                            key={template.id} 
                                            className={`template-card ${newEventData.templateId === template.id ? 'active' : ''}`}
                                            onClick={() => setNewEventData({...newEventData, templateId: template.id})}
                                        >
                                            <div className="template-icon">
                                                <Icon name={template.icon} size={24} />
                                            </div>
                                            <span className="template-name">{template.name}</span>
                                            {newEventData.templateId === template.id && (
                                                <div className="selected-badge"><Icon name="check" size={12} /></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer-premium">
                            <Button variant="outline" onClick={() => setIsCreatingEvent(false)}>CANCELAR</Button>
                            <Button variant="primary" onClick={handleCreateEvent} className="create-final-btn">
                                <Icon name="check" size={16} /> <span>LANZAR EVENTO Y MAPA</span>
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Vista Previa de Usuario (Siempre estática, pero usa la geometría editada) */}
            <div className="user-preview-section">
                <div className="preview-header">
                    <h3>VISTA PREVIA DEL USUARIO</h3>
                    <p>Así es como se visualiza en la pantalla de detalles del evento</p>
                </div>
                <div className="preview-content-box">
                    <div className="mock-user-view">
                        <div className="mock-map-header">
                            <Icon name="map" size={14} /> <span>SELECCIONA TUS ASIENTOS</span>
                        </div>
                        <div className="compact-map-preview">
                            <VenueMapSVG 
                                selectedSeats={selectedSeats} 
                                onSeatToggle={() => {}} 
                                zones={zones}
                                isEditMode={false}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminVenueMap;
