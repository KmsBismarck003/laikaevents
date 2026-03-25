import React, { useState, useEffect, useRef, memo } from 'react';
import { Move, Crosshair, CornerUpRight, Type, Check, RotateCcw, X } from 'lucide-react';

const VenueMapSVG = memo(({ 
  selectedSeats = [], 
  onSeatToggle,
  isEditMode = false,
  zones = [],
  onUpdateGeometry,
  selectedZoneId,
  onZoneSelect,
  mapView = { zoom: 1.15, pan: { x: 0, y: 0 } },
  onZoneColorChange,
  busySeats = [],
  rouletteActive = false,
  winnerSeatId = null,
  activeScannerZoneId = null,
  activeScannerSeatId = null,
  showCrownTransition = false,
  onRouletteComplete
}) => {
  const [hoveredSeat, setHoveredSeat] = useState(null);
  const [persistentSeatInfo, setPersistentSeatInfo] = useState(null);
  const [draggingPoint, setDraggingPoint] = useState(null);
  const [draggingZone, setDraggingZone] = useState(null);
  const [rotatingZone, setRotatingZone] = useState(null);
  const [draggingText, setDraggingText] = useState(null);
  const [rotatingText, setRotatingText] = useState(null);
  const [draggingCurve, setDraggingCurve] = useState(null);
  const [alignmentGuides, setAlignmentGuides] = useState({ x: [], y: [] });
  const [editSubMode, setEditSubMode] = useState('move'); // 'points', 'curves', 'text', 'move'
  const [initialZoneState, setInitialZoneState] = useState(null);
  const [toolbarPos, setToolbarPos] = useState({ x: null, y: null });
  const [draggingToolbar, setDraggingToolbar] = useState(false);
  const svgRef = useRef(null);

  // Guardar copia de seguridad de la zona al seleccionarla
  useEffect(() => {
    if (selectedZoneId && zones.length > 0) {
       const z = zones.find(x => x.id === selectedZoneId);
       if (z && (!initialZoneState || initialZoneState.id !== selectedZoneId)) {
          setInitialZoneState(JSON.parse(JSON.stringify(z)));
       }
    } else if (!selectedZoneId) {
       setInitialZoneState(null);
    }
  }, [selectedZoneId, zones]);

  const handleMouseDownPoint = (zoneId, index) => (e) => {
    if (!isEditMode) return;
    e.stopPropagation();
    setDraggingPoint({ zoneId, index });
    if (onZoneSelect) onZoneSelect(zoneId);
  };

  const handleMouseDownZone = (zoneId) => (e) => {
    if (!isEditMode) return;
    e.stopPropagation();
    const pos = getMousePos(e);
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;

    setDraggingZone({
      zoneId,
      startMousePos: pos,
      originalPoints: [...zone.points.map(p => ({ ...p }))]
    });
    
    if (onZoneSelect) onZoneSelect(zoneId);
  };

  const handleMouseDownRotate = (zoneId) => (e) => {
    if (!isEditMode) return;
    e.stopPropagation();
    const pos = getMousePos(e);
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;

    const centerX = zone.points.reduce((sum, p) => sum + p.x, 0) / 4;
    const centerY = zone.points.reduce((sum, p) => sum + p.y, 0) / 4;

    setRotatingZone({
      zoneId,
      center: { x: centerX, y: centerY },
      startAngle: Math.atan2(pos.y - centerY, pos.x - centerX),
      originalPoints: [...zone.points.map(p => ({ ...p }))]
    });
  };

  const handleMouseDownText = (zoneId) => (e) => {
    if (!isEditMode) return;
    e.stopPropagation();
    const pos = getMousePos(e);
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;

    setDraggingText({
      zoneId,
      startMousePos: pos,
      originalPos: { x: zone.textPos?.x || 0, y: zone.textPos?.y || 0 }
    });
    if (onZoneSelect) onZoneSelect(zoneId);
  };

  const handleMouseDownTextRotate = (zoneId) => (e) => {
    if (!isEditMode) return;
    e.stopPropagation();
    const pos = getMousePos(e);
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;

    const centerX = zone.points.reduce((sum, p) => sum + p.x, 0) / 4;
    const centerY = zone.points.reduce((sum, p) => sum + p.y, 0) / 4;
    const tX = centerX + (zone.textPos?.x || 0);
    const tY = centerY + (zone.textPos?.y || 0);

    setRotatingText({
      zoneId,
      center: { x: tX, y: tY },
      startAngle: Math.atan2(pos.y - tY, pos.x - tX),
      originalAngle: zone.textAngle || 0
    });
  };

  const handleMouseDownCurve = (zoneId, index) => (e) => {
    if (!isEditMode) return;
    e.stopPropagation();
    const pos = getMousePos(e);
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;

    setDraggingCurve({
      zoneId,
      index,
      startMousePos: pos,
      originalAmount: (zone.curveAmounts || Array(zone.points.length).fill(0))[index]
    });
    if (onZoneSelect) onZoneSelect(zoneId);
  };

  const handleSplitEdge = (zoneId, index) => (e) => {
    if (!isEditMode) return;
    e.stopPropagation();
    const zone = zones.find(z => z.id === zoneId);
    if (!zone || !onUpdateGeometry) return;

    const p1 = zone.points[index];
    const p2 = zone.points[(index + 1) % zone.points.length];
    const midX = Math.round((p1.x + p2.x) / 2);
    const midY = Math.round((p1.y + p2.y) / 2);

    const newPoints = [...zone.points];
    newPoints.splice(index + 1, 0, { x: midX, y: midY });

    const curves = [...(zone.curveAmounts || Array(zone.points.length).fill(0))];
    curves.splice(index + 1, 0, 0);

    onUpdateGeometry(zoneId, newPoints, zone.textPos, zone.textAngle, curves);
  };

  const handleMouseMove = (e) => {
    if (!isEditMode) return;
    const pos = getMousePos(e);

    if (draggingToolbar) {
      const rect = e.currentTarget.getBoundingClientRect();
      setToolbarPos({
        x: e.clientX - rect.left - draggingToolbar.offsetX,
        y: e.clientY - rect.top - draggingToolbar.offsetY
      });
      return;
    }
    if (draggingPoint) {
      const guides = { x: [], y: [] };
      const snapThreshold = 5;
      let snappedX = pos.x;
      let snappedY = pos.y;
      const referencePoints = [{ x: 400, y: 300 }];
      zones.forEach(z => z.points.forEach((p, idx) => {
        if (z.id === draggingPoint.zoneId && idx === draggingPoint.index) return;
        referencePoints.push(p);
      }));
      referencePoints.forEach(ref => {
        if (Math.abs(pos.x - ref.x) < snapThreshold) { snappedX = ref.x; guides.x.push(ref.x); }
        if (Math.abs(pos.y - ref.y) < snapThreshold) { snappedY = ref.y; guides.y.push(ref.y); }
      });
      setAlignmentGuides(guides);
      if (onUpdateGeometry) {
        const zone = zones.find(z => z.id === draggingPoint.zoneId);
        if (zone) {
          const newPoints = [...zone.points];
          newPoints[draggingPoint.index] = { x: Math.round(snappedX), y: Math.round(snappedY) };
          onUpdateGeometry(draggingPoint.zoneId, newPoints);
        }
      }
      return;
    }

    if (draggingZone) {
      const deltaX = pos.x - draggingZone.startMousePos.x;
      const deltaY = pos.y - draggingZone.startMousePos.y;
      const guides = { x: [], y: [] };
      const snapThreshold = 6;
      let newPoints = draggingZone.originalPoints.map(p => ({ x: p.x + deltaX, y: p.y + deltaY }));
      let globalOffsetX = 0, globalOffsetY = 0;
      const referencePoints = [{ x: 400, y: 300 }];
      zones.forEach(z => { if (z.id !== draggingZone.zoneId) z.points.forEach(p => referencePoints.push(p)); });
      newPoints.forEach(p => {
        referencePoints.forEach(ref => {
          if (Math.abs(p.x - ref.x) < snapThreshold && globalOffsetX === 0) { globalOffsetX = ref.x - p.x; guides.x.push(ref.x); }
          if (Math.abs(p.y - ref.y) < snapThreshold && globalOffsetY === 0) { globalOffsetY = ref.y - p.y; guides.y.push(ref.y); }
        });
      });
      const finalPoints = newPoints.map(p => ({ x: Math.round(p.x + globalOffsetX), y: Math.round(p.y + globalOffsetY) }));
      setAlignmentGuides(guides);
      if (onUpdateGeometry) onUpdateGeometry(draggingZone.zoneId, finalPoints);
      return;
    }

    if (rotatingZone) {
      const currentMouseAngle = Math.atan2(pos.y - rotatingZone.center.y, pos.x - rotatingZone.center.x);
      let angleDelta = currentMouseAngle - rotatingZone.startAngle;
      const snapInterval = Math.PI / 12; // 15 grados
      angleDelta = Math.round(angleDelta / snapInterval) * snapInterval;

      const cos = Math.cos(angleDelta);
      const sin = Math.sin(angleDelta);

      const finalPoints = rotatingZone.originalPoints.map(p => {
        const dx = p.x - rotatingZone.center.x;
        const dy = p.y - rotatingZone.center.y;
        return {
          x: Math.round(rotatingZone.center.x + dx * cos - dy * sin),
          y: Math.round(rotatingZone.center.y + dx * sin + dy * cos)
        };
      });

      if (onUpdateGeometry) onUpdateGeometry(rotatingZone.zoneId, finalPoints);
      return;
    }

    if (draggingText) {
      const deltaX = pos.x - draggingText.startMousePos.x;
      const deltaY = pos.y - draggingText.startMousePos.y;
      const zone = zones.find(z => z.id === draggingText.zoneId);
      if (zone && onUpdateGeometry) {
        const cX = zone.points.reduce((sum, p) => sum + p.x, 0) / zone.points.length;
        const cY = zone.points.reduce((sum, p) => sum + p.y, 0) / zone.points.length;
        const absX = cX + draggingText.originalPos.x + deltaX;
        const absY = cY + draggingText.originalPos.y + deltaY;

        const guides = { x: [], y: [] };
        const snapThreshold = 5;
        let globalOffsetX = 0;
        let globalOffsetY = 0;

        const referencePoints = [];
        zones.forEach(z => {
          if (z.id !== draggingText.zoneId) {
            const zcX = z.points.reduce((sum, p) => sum + p.x, 0) / z.points.length;
            const zcY = z.points.reduce((sum, p) => sum + p.y, 0) / z.points.length;
            referencePoints.push({ x: zcX + (z.textPos?.x || 0), y: zcY + (z.textPos?.y || 0) });
          }
        });

        referencePoints.forEach(ref => {
          if (Math.abs(absX - ref.x) < snapThreshold && globalOffsetX === 0) { globalOffsetX = ref.x - absX; guides.x.push(ref.x); }
          if (Math.abs(absY - ref.y) < snapThreshold && globalOffsetY === 0) { globalOffsetY = ref.y - absY; guides.y.push(ref.y); }
        });

        setAlignmentGuides(guides);

        onUpdateGeometry(draggingText.zoneId, zone.points, {
          x: Math.round(draggingText.originalPos.x + deltaX + globalOffsetX),
          y: Math.round(draggingText.originalPos.y + deltaY + globalOffsetY)
        }, zone.textAngle);
      }
      return;
    }

    if (rotatingText) {
      const currentMouseAngle = Math.atan2(pos.y - rotatingText.center.y, pos.x - rotatingText.center.x);
      const angleDelta = currentMouseAngle - rotatingText.startAngle;
      const degDelta = (angleDelta * 180) / Math.PI;
      const finalAngle = Math.round((rotatingText.originalAngle + degDelta) / 5) * 5;

      const zone = zones.find(z => z.id === rotatingText.zoneId);
      if (zone && onUpdateGeometry) {
        onUpdateGeometry(rotatingText.zoneId, zone.points, zone.textPos, finalAngle);
      }
      return;
    }

    if (draggingCurve) {
      const deltaX = pos.x - draggingCurve.startMousePos.x;
      const deltaY = pos.y - draggingCurve.startMousePos.y;
      const zone = zones.find(z => z.id === draggingCurve.zoneId);
      
      if (zone && onUpdateGeometry) {
        const curves = [...(zone.curveAmounts || [0, 0, 0, 0])];
        const p1 = zone.points[draggingCurve.index];
        const p2 = zone.points[(draggingCurve.index + 1) % 4];
        
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.sqrt(dx*dx + dy*dy) || 1;
        const nx = -dy / len; 
        const ny = dx / len;
        
        const projection = deltaX * nx + deltaY * ny;
        curves[draggingCurve.index] = Math.round(draggingCurve.originalAmount + projection);

        onUpdateGeometry(draggingCurve.zoneId, zone.points, zone.textPos, zone.textAngle, curves);
      }
    }
  };

  const handlePathClick = (zoneId) => (e) => {
    if (!isEditMode) return;
    e.stopPropagation();
    const pos = getMousePos(e);
    const zone = zones.find(z => z.id === zoneId);
    if (!zone || !onUpdateGeometry) return;

    let minDist = Infinity;
    let bestIdx = 0;
    for (let i = 0; i < zone.points.length; i++) {
        const d = distToSegment(pos, zone.points[i], zone.points[(i + 1) % zone.points.length]);
        if (d < minDist) { minDist = d; bestIdx = i; }
    }

    const newPoints = [...zone.points];
    newPoints.splice(bestIdx + 1, 0, { x: Math.round(pos.x), y: Math.round(pos.y) });

    const curves = [...(zone.curveAmounts || Array(zone.points.length).fill(0))];
    curves.splice(bestIdx + 1, 0, 0);

    onUpdateGeometry(zoneId, newPoints, zone.textPos, zone.textAngle, curves);
  };

  const handleMouseUp = () => {
    setDraggingPoint(null);
    setDraggingZone(null);
    setRotatingZone(null);
    setDraggingText(null);
    setRotatingText(null);
    setDraggingCurve(null);
    setDraggingToolbar(false);
    setAlignmentGuides({ x: [], y: [] });
  };

  const getMousePos = (e) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    return { x: (e.clientX - CTM.e) / CTM.a, y: (e.clientY - CTM.f) / CTM.d };
  };

  const distToSegment = (p, p1, p2) => {
    const l2 = (p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y);
    if (l2 === 0) return Math.sqrt((p.x - p1.x) * (p.x - p1.x) + (p.y - p1.y) * (p.y - p1.y));
    let t = ((p.x - p1.x) * (p2.x - p1.x) + (p.y - p1.y) * (p2.y - p1.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const px = Math.round(p1.x + t * (p2.x - p1.x));
    const py = Math.round(p1.y + t * (p2.y - p1.y));
    return Math.sqrt((p.x - px) * (p.x - px) + (p.y - py) * (p.y - py));
  };

  const getBilinearPos = (points, u, v) => {
    const x = (1 - u) * (1 - v) * points[0].x + u * (1 - v) * points[1].x + u * v * points[2].x + (1 - u) * v * points[3].x;
    const y = (1 - u) * (1 - v) * points[0].y + u * (1 - v) * points[1].y + u * v * points[2].y + (1 - u) * v * points[3].y;
    return { x, y };
  };


  const renderSeat = (seatId, x, y, status, zone, isBusy) => {
    const isSelected = selectedSeats.includes(seatId);
    const isHovered = hoveredSeat?.id === seatId;
    const isScanning = activeScannerSeatId === seatId;
    const isWinner = winnerSeatId === seatId && !isScanning;
    
    // Seat colors: OCCUPIED -> RED, SELECTED -> GOLD, AVAILABLE -> WHITE
    let baseColor = '#ffffff';
    if (status === 'occupied') baseColor = '#ef4444';
    if (isSelected) baseColor = '#eab308';
    
    // THEMED SCANNING COLORS
    const getZoneColor = (z) => {
        const name = (z.name || '').toUpperCase();
        if (z.price >= 2500 || name.includes('PLATIN')) return '#E5E7EB'; // Platino (Gris muy claro/blanco brillante)
        if (z.price >= 1500 || name.includes('ORO') || name.includes('GOLD')) return '#EAB308'; // Oro
        if (z.price >= 500 || name.includes('PLATA') || name.includes('SILVER')) return '#94A3B8'; // Plata
        return '#CD7F32'; // Bronce/Default
    };

    if (isScanning || isWinner) {
        baseColor = getZoneColor(zone);
    }

    const scale = isHovered || isScanning || isWinner ? 6.5 : 4.5;
    
    return (
      <g 
        key={seatId} 
        transform={`translate(${x}, ${y}) scale(${scale})`}
        onMouseEnter={() => !rouletteActive && setHoveredSeat({ id: seatId, x, y, zoneName: zone.name, price: zone.price, status: status === 'occupied' ? 'VENDIDO' : 'DISPONIBLE' })}
        onMouseLeave={() => setHoveredSeat(null)} 
        onClick={() => {
          if (!rouletteActive && onSeatToggle) {
            onSeatToggle(seatId);
            const info = { id: seatId, x, y, zoneName: zone.name, price: zone.price, status: status === 'occupied' ? 'VENDIDO' : 'DISPONIBLE' };
            setPersistentSeatInfo(selectedSeats.includes(seatId) ? null : info);
          }
        }}
        style={{ cursor: rouletteActive ? 'default' : 'pointer', transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
      >
        {/* Button base / ring */}
        <circle 
          r="1.2" 
          fill="rgba(0,0,0,0.4)" 
          stroke="rgba(255,255,255,0.1)" 
          strokeWidth="0.1" 
        />
        
        {/* Main seat dot (The "Button") */}
        <circle 
          r="0.8" 
          fill={baseColor} 
          stroke={isSelected || isHovered || isScanning || isWinner ? '#fff' : 'rgba(0,0,0,0.2)'} 
          strokeWidth={isScanning || isWinner ? 0.3 : 0.15} 
          style={{ 
            filter: (isScanning || isWinner || isSelected || isHovered) ? `drop-shadow(0 0 4px ${baseColor})` : 'none',
            transition: 'all 0.2s ease'
          }} 
        />
        
        {/* Subtle inner highlight for 3D effect */}
        {!isBusy && (
          <circle 
            r="0.3" 
            cx="-0.2" 
            cy="-0.2" 
            fill="rgba(255,255,255,0.4)" 
            style={{ pointerEvents: 'none' }}
          />
        )}
      </g>
    );
  };

  return (
    <div className="venue-map-svg-container" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} style={{ width: '100%', height: '100%', cursor: (draggingPoint || draggingZone || rotatingZone || draggingToolbar) ? 'grabbing' : 'default', position: 'relative', background: '#0a0a0a' }}>
      {/* SUB EDIT MODES TOOLBAR */}
      {isEditMode && selectedZoneId && (
          <div className="edit-submode-toolbar" 
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                const rect = e.currentTarget.getBoundingClientRect();
                setDraggingToolbar({ offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top });
              }
            }}
            style={{
              position: 'absolute', 
              top: toolbarPos.y !== null ? `${toolbarPos.y}px` : '15px', 
              left: toolbarPos.x !== null ? `${toolbarPos.x}px` : '50%', 
              transform: toolbarPos.x !== null ? 'none' : 'translateX(-50%)',
              backgroundColor: 'rgba(20, 20, 20, 0.85)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
              padding: '4px', display: 'flex', gap: '4px', zIndex: 999,
              boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
          }}>
              {[
                { id: 'move', label: 'Mover', icon: <Move size={13} strokeWidth={2.5} />, color: '#fff' },
                { id: 'points', label: 'Puntos', icon: <Crosshair size={13} strokeWidth={2.5} />, color: '#ce2c2c' },
                { id: 'curves', label: 'Curvas', icon: <CornerUpRight size={13} strokeWidth={2.5} />, color: '#8b5cf6' },
                { id: 'text', label: 'Texto', icon: <Type size={13} strokeWidth={2.5} />, color: '#0ea5e9' }
              ].map(b => (
                 <button 
                   key={b.id}
                   title={b.label}
                   onClick={(e) => { e.stopPropagation(); setEditSubMode(b.id); }}
                   style={{
                      padding: '7px 9px', borderRadius: '8px', border: 'none',
                      backgroundColor: editSubMode === b.id ? b.color : 'transparent',
                      color: editSubMode === b.id ? '#000' : '#d4d4d8',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', justifyContent: 'center'
                   }}
                 >
                   <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: editSubMode === b.id ? '#000' : b.color }}>{b.icon}</span>
                 </button>
               ))}
               {/* DIVIDER */}
               <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.15)', marginLeft: '6px', marginRight: '6px', alignSelf: 'center' }} />
               {/* PRESET METALLIC COLORS */}
               <div style={{ display: 'flex', gap: '4px', alignSelf: 'center' }}>
                 {[
                   { id: 'platino', color: '#E5E4E2', gradient: 'linear-gradient(145deg, #FFFFFF 0%, #E5E4E2 45%, #A0A0A0 100%)', title: 'Platino Metálico' },
                   { id: 'oro', color: '#FFD700', gradient: 'linear-gradient(145deg, #FFEF96 0%, #FFD700 45%, #B8860B 100%)', title: 'Oro Metálico' },
                   { id: 'plata', color: '#C0C0C0', gradient: 'linear-gradient(145deg, #F5F5F5 0%, #C0C0C0 45%, #808080 100%)', title: 'Plata Metálica' },
                   { id: 'bronce', color: '#CD7F32', gradient: 'linear-gradient(145deg, #E2A76F 0%, #CD7F32 45%, #8B4513 100%)', title: 'Bronce Metálico' }
                 ].map(preset => (
                   <button
                     key={preset.id}
                     title={preset.title}
                     onClick={(e) => {
                       e.stopPropagation();
                       if (onZoneColorChange) onZoneColorChange(selectedZoneId, preset.color);
                     }}
                     style={{
                       width: '18px', height: '18px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.6)',
                       background: preset.gradient, cursor: 'pointer', flexShrink: 0,
                       boxShadow: '0 2px 4px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.8)',
                       transition: 'transform 0.1s'
                     }}
                     onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                     onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                     onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                     onMouseUp={e => e.currentTarget.style.transform = 'scale(1.2)'}
                   />
                 ))}
               </div>
               {/* COLOR PICKER (Solo RGB circulito visible) */}
               <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.15)', marginLeft: '6px', marginRight: '6px', alignSelf: 'center' }} />
               <div style={{ position: 'relative', width: '22px', height: '22px', borderRadius: '50%', overflow: 'hidden', border: '1.5px solid rgba(255,255,255,0.8)', cursor: 'pointer', flexShrink: 0, alignSelf: 'center', boxShadow: '0 0 8px rgba(0,0,0,0.4)', backgroundColor: (zones.find(z => z.id === selectedZoneId)?.color || '#eab308').toLowerCase() }} title="Color Libre de la Zona">
                 <input 
                   type="color" 
                   value={(zones.find(z => z.id === selectedZoneId)?.color || '#eab308').toLowerCase()}
                   onChange={(e) => {
                     if (onZoneColorChange) onZoneColorChange(selectedZoneId, e.target.value);
                   }}
                   style={{ position: 'absolute', top: -10, left: -10, width: '45px', height: '45px', cursor: 'pointer', border: 'none', padding: 0, opacity: 0 }}
                 />
               </div>
               {/* ACCIONES DIVIDER */}
               <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.15)', marginLeft: '6px', marginRight: '6px', alignSelf: 'center' }} />
               {initialZoneState && (
                 <button onClick={(e) => { e.stopPropagation(); if (onUpdateGeometry) onUpdateGeometry(initialZoneState.id, initialZoneState); }} style={{ padding: '7px 9px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Deshacer"><RotateCcw size={12} strokeWidth={2.5} /></button>
               )}
               <button onClick={(e) => { e.stopPropagation(); if (onUpdateGeometry && initialZoneState) onUpdateGeometry(initialZoneState.id, initialZoneState); if (onZoneSelect) onZoneSelect(null); }} style={{ padding: '7px 9px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Cancelar"><X size={12} strokeWidth={2.5} /></button>
               <button onClick={(e) => { e.stopPropagation(); if (onZoneSelect) onZoneSelect(null); }} style={{ padding: '7px 11px', borderRadius: '6px', border: 'none', backgroundColor: '#16a34a', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: '0 4px 10px rgba(22, 163, 74, 0.4)' }} title="Aceptar"><Check size={12} strokeWidth={3} /></button>
           </div>
      )}
      <style>{`
        @keyframes marchingAnts { from { stroke-dashoffset: 40; } to { stroke-dashoffset: 0; } }
        .marching-ants { stroke-dasharray: 6, 4; stroke-linecap: round; }
      `}</style>
      <svg ref={svgRef} viewBox="0 0 800 600" className="venue-map-svg" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <g transform={`translate(${mapView.pan.x}, ${mapView.pan.y}) scale(${mapView.zoom})`} style={{ transition: (draggingPoint || draggingZone || rotatingZone) ? 'none' : 'transform 0.3s' }}>
          <defs>
            <linearGradient id="stageGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#e0e0e0', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#999', stopOpacity: 1 }} />
            </linearGradient>
          </defs>

          {zones.map(zone => {
            if (!zone.points || !Array.isArray(zone.points) || zone.points.length === 0) return null;
            
            const isSelected = selectedZoneId === zone.id;
            const isStage = zone.type === 'stage';
            const isScanningSeat = activeScannerSeatId?.split('-')[0] === zone.id;
            const isScanningZone = activeScannerZoneId === zone.id;
            const isScanning = isScanningSeat || isScanningZone;
            const getControlPoint = (p1, p2, amount) => {
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const len = Math.sqrt(dx*dx + dy*dy) || 1;
                const nx = -dy / len; 
                const ny = dx / len;
                return { x: midX + nx * (amount || 0), y: midY + ny * (amount || 0) };
            };

            const curves = zone.curveAmounts || Array(zone.points.length).fill(0);
            const pathSegments = zone.points.map((p, idx) => {
                const nextIdx = (idx + 1) % zone.points.length;
                const nextP = zone.points[nextIdx];
                const c = getControlPoint(p, nextP, curves[idx]);
                return `Q ${c.x} ${c.y} ${nextP.x} ${nextP.y}`;
            });

            const pathData = `M ${zone.points[0].x} ${zone.points[0].y} ` + pathSegments.join(' ') + ' Z';
            
            const centerX = zone.points.reduce((sum, p) => sum + p.x, 0) / zone.points.length;
            const centerY = zone.points.reduce((sum, p) => sum + p.y, 0) / zone.points.length;
            const topY = Math.min(...zone.points.map(p => p.y));

            // THEMED COLORS FOR SCANNER
            const getThemedColor = (z) => {
                if (z.color) return z.color;
                if (z.tier === 'platino') return '#ffffff';
                if (z.tier === 'oro') return '#EAB308';
                if (z.tier === 'plata') return '#94A3B8';
                if (z.tier === 'bronce') return '#B45309';

                const name = (z.name || '').toUpperCase();
                if (z.price >= 2500 || name.includes('PLATIN')) return '#ffffff'; // Platino
                if (z.price >= 1500 || name.includes('ORO') || name.includes('GOLD')) return '#EAB308'; // Oro
                if (z.price >= 500 || name.includes('PLATA') || name.includes('SILVER')) return '#94A3B8'; // Plata
                return '#CD7F32'; // Bronce
            };

            const themedColor = getThemedColor(zone);
            const hasCustomColor = !!(zone.tier || zone.color);

            return (
              <g key={zone.id}>
                <path d={pathData}
                  fill={isStage ? 'url(#stageGradient)' : (zone.type === 'seating' ? (isSelected ? (hasCustomColor ? `${themedColor}40` : 'rgba(255, 255, 255, 0.1)') : (isScanning ? `${themedColor}66` : (hasCustomColor ? `${themedColor}33` : 'rgba(40, 40, 40, 0.9)'))) : 'rgba(30, 30, 30, 0.8)')}
                  stroke={isSelected ? (hasCustomColor ? themedColor : '#ffffff') : (isScanning ? themedColor : (isStage ? '#666' : (hasCustomColor ? themedColor : 'rgba(255, 255, 255, 0.2)')))}
                  strokeWidth={isSelected ? 3 : (isScanning || hasCustomColor ? 2 : (isStage ? 2 : 1))}
                  className={isSelected ? 'marching-ants' : ''}
                  onMouseDown={isEditMode && editSubMode === 'move' ? handleMouseDownZone(zone.id) : undefined}
                  onClick={(e) => {
                    if (isEditMode) {
                      if (onZoneSelect) onZoneSelect(zone.id);
                    } else if (!rouletteActive && zone.type === 'seating' && onZoneSelect) {
                      onZoneSelect(zone.id);
                    }
                  }}
                  style={{ 
                    cursor: zone.type === 'seating' ? (isEditMode ? 'crosshair' : 'pointer') : 'default', 
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    filter: (isSelected || isScanning) ? `drop-shadow(0 0 25px ${isScanning ? themedColor : 'rgba(255,255,255,0.3)'})` : 'none'
                  }} />

                {isStage && (
                  <text 
                    x={centerX + (zone.textPos?.x || 0)} 
                    y={centerY + (zone.textPos?.y || 0)} 
                    textAnchor="middle" 
                    alignmentBaseline="middle" 
                    fill="#000" 
                    transform={`rotate(${zone.textAngle !== undefined ? zone.textAngle : -90}, ${centerX + (zone.textPos?.x || 0)}, ${centerY + (zone.textPos?.y || 0)})`}
                    onMouseDown={isEditMode && editSubMode === 'text' ? handleMouseDownText(zone.id) : undefined}
                    style={{ 
                      fontSize: '22px', 
                      fontWeight: 900, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.5em', 
                      opacity: 0.5, 
                      pointerEvents: isEditMode && editSubMode === 'text' ? 'auto' : 'none',
                      cursor: isEditMode && editSubMode === 'text' ? 'move' : 'default'
                    }}
                  >
                    ESCENARIO
                  </text>
                )}

                {zone.type === 'seating' && (!isScanning && (!isSelected || isEditMode)) && (
                  <text 
                    x={centerX + (zone.textPos?.x || 0)} 
                    y={centerY + (zone.textPos?.y || 0)} 
                    textAnchor="middle" 
                    alignmentBaseline="middle" 
                    fill="#fff" 
                    transform={`rotate(${zone.textAngle || 0}, ${centerX + (zone.textPos?.x || 0)}, ${centerY + (zone.textPos?.y || 0)})`}
                    onMouseDown={isEditMode ? handleMouseDownText(zone.id) : undefined}
                    style={{ 
                      fontSize: '14px', 
                      fontWeight: 950, 
                      textTransform: 'uppercase', 
                      pointerEvents: isEditMode ? 'auto' : 'none',
                      cursor: isEditMode ? 'move' : 'none',
                      opacity: isSelected ? 1 : 0.8,
                      filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.5))'
                    }}
                  >
                    {zone.name}
                  </text>
                )}

                {zone.type === 'seating' && (isSelected || isScanning) && (
                  <g>
                    <defs>
                      <clipPath id={`mask-${zone.id}`}>
                        <path d={pathData} />
                      </clipPath>
                    </defs>
                    <g clipPath={`url(#mask-${zone.id})`} onMouseDown={isEditMode && editSubMode === 'move' ? handleMouseDownZone(zone.id) : undefined} style={{ cursor: isEditMode && editSubMode === 'move' ? 'move' : 'default' }}>
                    {(() => {
                        const minX = Math.min(...zone.points.map(p => p.x));
                        const maxX = Math.max(...zone.points.map(p => p.x));
                        const minY = Math.min(...zone.points.map(p => p.y));
                        const maxY = Math.max(...zone.points.map(p => p.y));

                      const width = Math.max(maxX - minX, 1);
                      const height = Math.max(maxY - minY, 1);

                      const totalSeats = zone.count || 100;
                      const aspect = width / height;
                      // Añadimos densidad para que cubra esquinas
                      const rows = Math.max(Math.floor(Math.sqrt(totalSeats / aspect) * 1.3), 1);
                      const cols = Math.ceil((totalSeats / rows) * 1.3);
                      
                      return Array.from({ length: rows }).map((_, row) => 
                        Array.from({ length: cols }).map((_, col) => {
                          const seatId = `${zone.id}-${row}-${col}`;
                          const isBusy = busySeats.includes(seatId);
                          
                          const x = minX + (col + 0.5) * (width / cols);
                          const y = minY + (row + 0.5) * (height / rows);
                          
                          return renderSeat(seatId, x, y, isBusy ? 'occupied' : 'available', zone, isBusy);
                        })
                      ).flat();
                    })()}
                    </g>
                  </g>
                )}

                {isEditMode && isSelected && editSubMode === 'points' && (
                  <g>
                    {zone.points.map((p, idx) => (
                      <circle 
                        key={`${zone.id}-p-${idx}`} 
                        cx={p.x} cy={p.y} r={5} 
                        fill="#ff0000" stroke="#fff" strokeWidth={1} 
                        onMouseDown={handleMouseDownPoint(zone.id, idx)} 
                        style={{ cursor: 'nwse-resize', transition: 'all 0.15s ease-out' }} 
                        onMouseEnter={(e) => e.target.setAttribute('r', '8')}
                        onMouseLeave={(e) => e.target.setAttribute('r', '5')}
                      />
                    ))}
                    <line x1={centerX} y1={topY} x2={centerX} y2={topY - 30} stroke="#ff0000" strokeWidth={2} />
                    <circle cx={centerX} cy={topY - 35} r={10} fill="#ff0000" stroke="#fff" strokeWidth={2} onMouseDown={handleMouseDownRotate(zone.id)} style={{ cursor: 'alias', filter: 'drop-shadow(0 0 10px rgba(255, 0, 0, 0.9))' }} />
                  </g>
                )}

                {isEditMode && isSelected && editSubMode === 'text' && (
                  <g>
                    {/* CONTROLES DE TEXTO (Fase 1) */}
                    {(() => {
                      const tX = centerX + (zone.textPos?.x || 0);
                      const tY = centerY + (zone.textPos?.y || 0);
                      return (
                        <g>
                          <line x1={tX} y1={tY} x2={tX} y2={tY - 25} stroke="#0ea5e9" strokeWidth={1.5} />
                          <circle cx={tX} cy={tY - 30} r={8} fill="#0ea5e9" stroke="#fff" strokeWidth={2} onMouseDown={handleMouseDownTextRotate(zone.id)} style={{ cursor: 'alias', filter: 'drop-shadow(0 0 8px rgba(14, 165, 233, 0.8))' }} />
                          <circle 
                            cx={tX} cy={tY} r={6} 
                            fill="#0ea5e9" stroke="#fff" strokeWidth={1.5} 
                            onMouseDown={handleMouseDownText(zone.id)} 
                            style={{ cursor: 'move', pointerEvents: 'all', filter: 'drop-shadow(0 0 6px rgba(14, 165, 233, 0.8))' }} 
                            title="Arrastra para Mover Texto"
                          />
                        </g>
                      );
                    })()}
                  </g>
                )}

                {isEditMode && isSelected && editSubMode === 'curves' && (
                  <g>
                    {/* CONTROLES DE CURVAS (Fase 2) */}
                    {(() => {
                      const curvs = zone.curveAmounts || Array(zone.points.length).fill(0);
                      return Array.from({ length: zone.points.length }).map((_, edgeIdx) => {
                        const p1 = zone.points[edgeIdx];
                        const p2 = zone.points[(edgeIdx + 1) % zone.points.length];
                        const c = getControlPoint(p1, p2, curvs[edgeIdx]);
                        return (
                          <g key={`edge-ctrl-${edgeIdx}`}>
                            <circle 
                              cx={c.x} cy={c.y} r={5} 
                              fill="#8b5cf6" stroke="#fff" strokeWidth={1} 
                              onMouseDown={handleMouseDownCurve(zone.id, edgeIdx)} 
                              style={{ cursor: 'pointer', transition: 'all 0.1s ease-out' }} 
                              onMouseEnter={(e) => e.target.setAttribute('r', '8')}
                              onMouseLeave={(e) => e.target.setAttribute('r', '5')}
                              title="Arrastra para Curvar Borde"
                            />
                            {/* BOTON DIVIDIR (+) */}
                            <circle 
                              cx={c.x + 10} cy={c.y - 10} r={4} 
                              fill="#22c55e" stroke="#fff" strokeWidth={1} 
                              onClick={handleSplitEdge(zone.id, edgeIdx)} 
                              style={{ cursor: 'pointer', filter: 'drop-shadow(0 0 4px rgba(34, 197, 94, 0.8))' }} 
                              title="Dividir Lado (Añadir corners)"
                            />
                            <text x={c.x + 10} y={c.y - 8} fill="#fff" style={{ fontSize: '6px', fontWeight: '900', pointerEvents: 'none' }} textAnchor="middle">+</text>
                          </g>
                        );
                      });
                    })()}
                  </g>
                )}
              </g>
            );
          })}
          
          {alignmentGuides.x.map((x, i) => <line key={`gx-${i}`} x1={x} y1="-2000" x2={x} y2="2000" stroke="#ff0000" strokeWidth="1" strokeDasharray="3,2" style={{ opacity: 0.9 }} />)}
          {alignmentGuides.y.map((y, i) => <line key={`gy-${i}`} x1="-2000" y1={y} x2="2000" y2={y} stroke="#ff0000" strokeWidth="1" strokeDasharray="3,2" style={{ opacity: 0.9 }} />)}

          {(() => {
            let displaySeat = hoveredSeat || (selectedSeats.length > 0 ? persistentSeatInfo : null);
            let isWinnerCrown = false;

            if (showCrownTransition && winnerSeatId) {
              const parts = winnerSeatId.split('-');
              if (parts.length === 3) {
                const zoneId = parts[0];
                const row = parseInt(parts[1]);
                const col = parseInt(parts[2]);
                const zone = zones.find(z => z.id === zoneId);
                
                if (zone) {
                  const totalSeats = zone.count || 100;
                  const width1 = Math.sqrt(Math.pow(zone.points[1].x - zone.points[0].x, 2) + Math.pow(zone.points[1].y - zone.points[0].y, 2));
                  const width2 = Math.sqrt(Math.pow(zone.points[2].x - zone.points[3].x, 2) + Math.pow(zone.points[2].y - zone.points[3].y, 2));
                  const height1 = Math.sqrt(Math.pow(zone.points[3].x - zone.points[0].x, 2) + Math.pow(zone.points[3].y - zone.points[0].y, 2));
                  const height2 = Math.sqrt(Math.pow(zone.points[2].x - zone.points[1].x, 2) + Math.pow(zone.points[2].y - zone.points[1].y, 2));
                  const avgWidth = (width1 + width2) / 2;
                  const avgHeight = (height1 + height2) / 2;
                  const aspect = avgWidth / avgHeight;
                  const rows = Math.max(Math.floor(Math.sqrt(totalSeats / aspect)), 1);
                  const cols = Math.ceil(totalSeats / rows);
                  const u = (col + 0.5) / cols;
                  const v = (row + 0.5) / rows;
                  const staggeredU = row % 2 === 0 ? u : Math.min(u + (0.3 / cols), 0.98);
                  const pos = getBilinearPos(zone.points, staggeredU, v);
                  
                  displaySeat = { x: pos.x, y: pos.y, id: winnerSeatId, zoneName: zone.name };
                  isWinnerCrown = true;
                }
              }
            }

            if (!displaySeat) return null;
            
            if (isWinnerCrown) {
              return (
                <g transform={`translate(${displaySeat.x}, ${displaySeat.y - 40})`} style={{ animation: 'float 2s ease-in-out infinite' }}>
                  <style>{`
                    @keyframes float { 0% { transform: translate(${displaySeat.x}px, ${displaySeat.y - 40}px); } 50% { transform: translate(${displaySeat.x}px, ${displaySeat.y - 46}px); } 100% { transform: translate(${displaySeat.x}px, ${displaySeat.y - 40}px); } }
                  `}</style>
                  {/* Glowing core */}
                  <circle r="25" fill="rgba(234, 179, 8, 0.25)" filter="blur(6px)" />
                  {/* Rotating/Animated Ring */}
                  <circle r="30" fill="none" stroke="#EAB308" strokeWidth="1.5" strokeDasharray="4,6" className="marching-ants" style={{ filter: 'drop-shadow(0 0 10px #EAB308)' }} />
                  {/* Crown Path vector */}
                  <path d="M-10,3 L-15,-10 L-7,-4 L0,-12 L7,-4 L15,-10 L10,3 Z" fill="#EAB308" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))' }} />
                  <circle cx="0" cy="-12" r="2" fill="#fff" />
                  <circle cx="-15" cy="-10" r="1.5" fill="#fff" />
                  <circle cx="15" cy="-10" r="1.5" fill="#fff" />
                  {/* Crown Base details */}
                  <path d="M-10,3 L10,3 L8,5 L-8,5 Z" fill="#b45309" />
                  
                  {/* Label Text box */}
                  <g transform="translate(0, 20)">
                    <rect x="-50" y="-12" width="100" height="22" rx="11" fill="rgba(0,0,0,0.9)" stroke="#EAB308" strokeWidth="1.2" style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.7))' }} />
                    <text y="3" textAnchor="middle" fill="#EAB308" style={{ fontSize: '9px', fontWeight: 950, letterSpacing: '1.5px', textTransform: 'uppercase' }}>¡GANADOR!</text>
                  </g>
                </g>
              );
            }
            return (
              <g transform={`translate(${displaySeat.x}, ${displaySeat.y - 30})`}>
                <rect x="-100" y="-75" width="200" height={displaySeat.status === 'VENDIDO' ? 100 : 70} rx="12" fill="rgba(20, 20, 20, 0.95)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" style={{ filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.8))' }} />
                <text y="-55" textAnchor="middle" fill="#fff" style={{ fontSize: '11px', fontWeight: 950 }}>{displaySeat.zoneName}</text>
                <text y="-35" textAnchor="middle" fill="#fff" style={{ fontSize: '13px', fontWeight: 950 }}>ASIENTO {displaySeat.id.split('-').slice(-2).join('-')}</text>
                <text y="-14" textAnchor="middle" fill={displaySeat.status === 'VENDIDO' ? '#ff4d4d' : '#10b981'} style={{ fontSize: '12px', fontWeight: 'bold' }}>{displaySeat.price || '$0'} • {displaySeat.status}</text>
                
                {displaySeat.status === 'VENDIDO' && (
                  <g>
                    <line x1="-80" y1="0" x2="80" y2="0" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                    <text y="14" textAnchor="middle" fill="#e4e4e7" style={{ fontSize: '10px', fontWeight: 'bold' }}>COMPRADOR: Juan Pérez</text>
                    <text y="24" textAnchor="middle" fill="#71717a" style={{ fontSize: '9px' }}>j.perez@example.com</text>
                  </g>
                )}
                
                <path d="M -10 -10 L 0 0 L 10 -10 Z" fill="rgba(20, 20, 20, 0.95)" transform={`translate(0, ${displaySeat.status === 'VENDIDO' ? 40 : 10})`}/>
              </g>
            );
          })()}
        </g>
      </svg>
    </div>
  );
});

export default VenueMapSVG;
