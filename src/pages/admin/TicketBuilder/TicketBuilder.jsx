import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Icon } from '../../../components';
import './TicketBuilder.css';

// AGREGADO 'locked: true' PARA FONDOS INICIALES 🔒
const INITIAL_ELEMENTS = [
  { id: 'bg-left', type: 'rect', x: 0, y: 0, w: 520, h: 250, color: '#FFFFFF', locked: true }, 
  { id: 'bg-right', type: 'rect', x: 520, y: 0, w: 200, h: 250, color: '#FDFDFD', locked: true }, 
  { id: 'perforation', type: 'dashed-line', x: 520, y: 0, w: 1, h: 250, color: '#DDDDDD' },
  { id: 'title-main', type: 'text', text: 'TÍTULO DEL EVENTO', x: 40, y: 40, fontSize: 24, fontWeight: '900', color: '#000000', fontFamily: 'Outfit' },
  { id: 'subtitle', type: 'text', text: 'SUBTÍTULO / DESCRIPCIÓN DEL EVENTO', x: 40, y: 80, fontSize: 10, color: '#555555', fontWeight: '500' },
  { id: 'meta-fecha', type: 'text', text: 'FECHA: 00/00/0000', x: 40, y: 180, fontSize: 11, color: '#000000', fontWeight: '700' },
  { id: 'meta-hora', type: 'text', text: 'HORA: 00:00', x: 180, y: 180, fontSize: 11, color: '#000000', fontWeight: '700' },
  { id: 'meta-valor', type: 'text', text: '$0.00', x: 40, y: 210, fontSize: 16, color: '#000000', fontWeight: '900' },
  { id: 'stub-title', type: 'text', text: 'TALÓN DE CONTROL', x: 550, y: 40, fontSize: 11, color: '#000000', fontWeight: '800' },
  { id: 'stub-barcode', type: 'barcode', x: 550, y: 170, w: 120, h: 40, color: '#000000' }
];

const FONTS = ['Anonymous Pro', 'Outfit', 'Inter', 'monospace', 'Arial'];

const TicketBuilder = () => {
  const [elements, setElements] = useState(INITIAL_ELEMENTS);
  const [selectedId, setSelectedId] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ w: 720, h: 250 });
  const [batchQuantity, setBatchQuantity] = useState(100);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragInfo = useRef({ draggingId: null, resizingId: null, dragOffset: { x: 0, y: 0 } });

  const activeElement = elements.find(el => el.id === selectedId);

  const handleMouseDown = (e, id) => {
    e.preventDefault(); e.stopPropagation();
    setSelectedId(id);

    const el = elements.find(item => item.id === id);
    if (!el || el.locked) return; // 🌟 BLOQUEO DINÁMICO POR CANDADO

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      dragInfo.current = {
        draggingId: id,
        resizingId: null,
        dragOffset: { x: (e.clientX - rect.left) - el.x, y: (e.clientY - rect.top) - el.y }
      };
    }
  };

  const handleResizeStart = (e, id) => {
    e.preventDefault(); e.stopPropagation();
    const el = elements.find(item => item.id === id);
    if (!el || el.locked) return; // 🔒 También bloquea resize si está bloqueado
    dragInfo.current.resizingId = id;
  };

  useEffect(() => {
    const handleWindowMouseMove = (e) => {
      const { draggingId, resizingId, dragOffset } = dragInfo.current;
      if (!draggingId && !resizingId) return;

      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        let clickX = e.clientX - rect.left;
        let clickY = e.clientY - rect.top;

        if (resizingId) {
          setElements(prev => prev.map(item => {
            if (item.id === resizingId) {
              if (item.type === 'uploaded-image' || item.type === 'rect') {
                return { ...item, w: Math.max(20, clickX - item.x), h: Math.max(20, clickY - item.y) };
              }
              if (item.type === 'text') {
                const newW = Math.max(40, clickX - item.x);
                return { ...item, fontSize: Math.max(8, Math.round(newW / 8)) };
              }
            }
            return item;
          }));
        } else if (draggingId) {
          setElements(prev => prev.map(item => {
            if (item.id === draggingId) {
              return { ...item, x: clickX - dragOffset.x, y: clickY - dragOffset.y };
            }
            return item;
          }));
        }
      }
    };

    const handleWindowMouseUp = () => {
      dragInfo.current = { draggingId: null, resizingId: null, dragOffset: { x: 0, y: 0 } };
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, []);

  const updateElementProp = (prop, value) => {
    if (!selectedId) return;
    setElements(prev => prev.map(item => item.id === selectedId ? { ...item, [prop]: value } : item));
  };

  const handleDelete = () => {
    if (!selectedId || selectedId.startsWith('bg')) return;
    setElements(elements.filter(el => el.id !== selectedId));
    setSelectedId(null);
  };

  const handleAddText = () => {
    const newId = `text-${Date.now()}`;
    setElements([...elements, { id: newId, type: 'text', text: 'Nuevo Texto', x: 200, y: 100, fontSize: 16, color: '#000000', fontFamily: 'Outfit' }]);
    setSelectedId(newId);
  };

  const handleAddRect = () => {
    const newId = `rect-${Date.now()}`;
    setElements([...elements, { id: newId, type: 'rect', x: 150, y: 80, w: 120, h: 120, color: '#E0E0E0' }]);
    setSelectedId(newId);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newId = `img-${Date.now()}`;
      setElements([...elements, { id: newId, type: 'uploaded-image', src: url, x: 100, y: 40, w: 150, h: 150 }]);
      setSelectedId(newId);
    }
  };

  return (
    <div className="canva-builder-grid" onClick={() => setSelectedId(null)}>
      <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />

      {/* BARRA SUPERIOR */}
      {selectedId && activeElement && (
        <div className="canva-top-toolbar" onClick={e => e.stopPropagation()}>
          {activeElement.type === 'text' && (
            <div className="toolbar-section">
              <select value={activeElement.fontFamily || 'Outfit'} onChange={e => updateElementProp('fontFamily', e.target.value)} className="tb-select">
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          )}
          {activeElement.type === 'text' && (
            <div className="toolbar-section">
              <button onClick={() => updateElementProp('fontSize', Math.max(8, (activeElement.fontSize || 12) - 2))}> - </button>
              <span className="tb-size-value">{activeElement.fontSize || 12}</span>
              <button onClick={() => updateElementProp('fontSize', (activeElement.fontSize || 12) + 2)}> + </button>
            </div>
          )}
          
          <div className="toolbar-section">
            <input type="color" value={activeElement.color || '#000000'} onChange={e => updateElementProp('color', e.target.value)} className="tb-color-input" title="Cambiar Color" />
          </div>

          {activeElement.type === 'text' && (
            <div className="toolbar-section" style={{ flex: 1 }}>
              <input type="text" value={activeElement.text || ''} onChange={e => updateElementProp('text', e.target.value)} className="tb-text-input" placeholder="Editar texto..." />
            </div>
          )}

          {/* 🌟 NUEVO: CANDADO DE BLOQUEO / DESBLOQUEO */}
          <div className="toolbar-section">
            <button 
              className={`tb-btn ${activeElement.locked ? 'active' : ''}`} 
              onClick={() => updateElementProp('locked', !activeElement.locked)} 
              title={activeElement.locked ? "Desbloquear Elemento" : "Bloquear Elemento"}
              style={{ backgroundColor: activeElement.locked ? '#FFF3CD' : 'transparent', borderColor: activeElement.locked ? '#FFC107' : '#000' }}
            >
              <Icon name={activeElement.locked ? "lock" : "unlock"} size={14} color={activeElement.locked ? "#856404" : "#000000"} />
            </button>
          </div>

          {!activeElement.id.startsWith('bg') && <div className="toolbar-divider"></div>}
          
          {!activeElement.id.startsWith('bg') && (
            <div className="toolbar-section">
              <button className="tb-btn text-danger" onClick={handleDelete} title="Eliminar"><Icon name="trash" size={14} color="#EF4444" /></button>
            </div>
          )}
        </div>
      )}

      {/* PANEL IZQUIERDO */}
      <aside className="canva-sidebar" onClick={e => e.stopPropagation()}>
        <div className="sidebar-header"><Icon name="layers" size={18} color="#000000" /><h2>[ EDITOR CANVA ]</h2></div>
        
        <div className="actions-row">
          <Button variant="outline" size="small" onClick={handleAddText}><Icon name="plus" size={12} /> Texto</Button>
          <Button variant="outline" size="small" onClick={handleAddRect}><Icon name="square" size={12} /> Figura</Button>
          <Button variant="outline" size="small" onClick={() => fileInputRef.current.click()}><Icon name="image" size={12} /> Sticker</Button>
        </div>

        <div className="control-group element-editor">
          <span className="editor-title">TAMAÑO BOLETO (W / H)</span>
          <div className="control-row-grid">
            <div><label>W</label><input type="number" value={canvasSize.w} onChange={e => setCanvasSize({ ...canvasSize, w: parseInt(e.target.value) })} className="input-premium" /></div>
            <div><label>H</label><input type="number" value={canvasSize.h} onChange={e => setCanvasSize({ ...canvasSize, h: parseInt(e.target.value) })} className="input-premium" /></div>
          </div>
        </div>

        {activeElement && (
          <div className="element-editor">
            <span className="editor-title">Ajustes Capa {activeElement.locked ? "🔒 (Bloqueada)" : ""}</span>
            <div className="control-row-grid">
              <div><label>X</label><input type="number" value={Math.round(activeElement.x)} onChange={e => !activeElement.locked && updateElementProp('x', parseInt(e.target.value))} className="input-premium" disabled={activeElement.locked} /></div>
              <div><label>Y</label><input type="number" value={Math.round(activeElement.y)} onChange={e => !activeElement.locked && updateElementProp('y', parseInt(e.target.value))} className="input-premium" disabled={activeElement.locked} /></div>
            </div>
          </div>
        )}

        <Button variant="primary" fullWidth onClick={() => {
          localStorage.setItem('laika_ticket_design', JSON.stringify({ elements, canvasSize }));
          alert("✅ Diseño de Boleto Guardado con Éxito.");
        }} className="save-btn">GUARDAR DISEÑO</Button>
      </aside>

      {/* PANEL DERECHO: VISOR */}
      <main className="canva-viewport">
        <div className="canvas-workspace">
          <div className="ticket-canva-frame" ref={canvasRef} style={{ width: `${canvasSize.w}px`, height: `${canvasSize.h}px`, backgroundColor: '#FFFFFF', overflow: 'hidden', border: '1px solid #000000' }} onClick={e => e.stopPropagation()}>
            {elements.map(el => {
              const style = {
                position: 'absolute',
                left: `${el.x}px`, top: `${el.y}px`,
                zIndex: el.id === selectedId ? 50 : 10,
                cursor: el.locked ? 'default' : 'move', // 🔒 Cursor cambia si está bloqueado
                userSelect: 'none',
                fontFamily: el.fontFamily || 'inherit',
                fontWeight: el.fontWeight || 'normal',
                opacity: el.opacity !== undefined ? el.opacity : 1
              };

              if (el.type === 'rect') {
                return (
                  <div key={el.id} style={{ ...style, width: `${el.w}px`, height: `${el.h}px`, background: el.color }} onMouseDown={e => handleMouseDown(e, el.id)} className={`canvas-item ${selectedId === el.id ? 'selected' : ''}`}>
                    {selectedId === el.id && !el.locked && <div className="anchor-dot br" onMouseDown={e => handleResizeStart(e, el.id)}></div>}
                  </div>
                )
              }
              if (el.type === 'dashed-line') return <div key={el.id} style={{ ...style, width: `${el.w}px`, height: `${el.h}px`, borderLeft: `${el.w}px dashed ${el.color}` }} />

              if (el.type === 'text') {
                return (
                  <div key={el.id} style={{ ...style, fontSize: `${el.fontSize}px`, color: el.color, whiteSpace: 'pre-line' }} onMouseDown={e => handleMouseDown(e, el.id)} className={`canvas-item ${selectedId === el.id ? 'selected' : ''}`}>
                    {el.text}
                    {selectedId === el.id && !el.locked && <div className="anchor-dot br" onMouseDown={e => handleResizeStart(e, el.id)}></div>}
                  </div>
                )
              }

              if (el.type === 'uploaded-image') {
                return (
                  <div key={el.id} style={{ ...style }} onMouseDown={e => handleMouseDown(e, el.id)} className={`canvas-item ${selectedId === el.id ? 'selected' : ''}`}>
                    <img src={el.src} style={{ width: `${el.w}px`, height: `${el.h}px`, objectFit: 'cover', pointerEvents: 'none' }} alt="uploaded" />
                    {selectedId === el.id && !el.locked && <div className="anchor-dot br" onMouseDown={e => handleResizeStart(e, el.id)}></div>}
                  </div>
                )
              }

              if (el.type === 'barcode') {
                return (
                  <div key={el.id} style={{ ...style, width: `${el.w}px`, height: `${el.h}px`, background: 'linear-gradient(to right, #000 5%, #fff 5%, #000 15%)', backgroundSize: '8px 100%' }} onMouseDown={e => handleMouseDown(e, el.id)} className={`canvas-item ${selectedId === el.id ? 'selected' : ''}`}>
                    {selectedId === el.id && !el.locked && <div className="anchor-dot br" onMouseDown={e => handleResizeStart(e, el.id)}></div>}
                  </div>
                )
              }
              return null;
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TicketBuilder;
