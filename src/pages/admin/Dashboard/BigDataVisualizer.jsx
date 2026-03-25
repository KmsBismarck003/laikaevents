import React, { useState, useEffect, useMemo } from 'react';
import { analyticsAPI } from '../../../services/miscService';
import { Card } from '../../../components';
import Skeleton from '../../../components/Skeleton/Skeleton';
import Plot from 'react-plotly.js';
import { 
  Activity, 
  Settings, 
  Database, 
  Calendar, 
  Filter, 
  Layers,
  Search,
  Zap,
  ShieldAlert,
  BarChart3,
  Terminal,
  Database as DatabaseIcon,
  Palette,
  Eye,
  Maximize2,
  Box,
  Check,
  X
} from 'lucide-react';

const BigDataVisualizer = () => {
    const [errorDismissed, setErrorDismissed] = useState(false);
    const [zScale, setZScale] = useState(1.0);
    const [barWidth, setBarWidth] = useState(0.2);
    const [hMult, setHMult] = useState(1.5);
    const [opacity, setOpacity] = useState(1.0);
    const [buildingShape, setBuildingShape] = useState('cube'); 
    const [isWireframe, setIsWireframe] = useState(false);
    
    const [customColor, setCustomColor] = useState('#2563eb'); // 🌟 MOVIDO AQUÍ ARRIBA

    // PALETAS DE COLORES RESTAURADAS
    const [colorPalette, setColorPalette] = useState('monochrome'); // monochrome, thermal, industrial, cyber
    const palettes = {
        monochrome: [[0, '#000000'], [1, '#666666']],
        thermal: [[0, '#000033'], [0.5, '#ffff00'], [1, '#ff0000']],
        industrial: [[0, '#1a1a1a'], [1, '#cccccc']],
        cyber: [[0, '#000000'], [1, '#ffffff']],
        custom: [[0, '#000000'], [1, customColor]]
    };

    // 1.5 NUEVOS ESTADOS DE VISUALIZACIÓN AVANZADA
    const [chartType, setChartType] = useState('3D_BAR'); // 3D_BAR, 3D_SCATTER, 2D_PIE
    const [colorMode, setColorMode] = useState('palette'); // 'palette' (continuo), 'solid' (fijo por categoría)
    const [markerSize, setMarkerSize] = useState(12);

    const solidColors = [
        '#003f5c', '#2f4b7c', '#665191', '#a05195', '#d45087', 
        '#f95d6a', '#ff7c43', '#ffa600', '#488f31', '#de425b'
    ];

    // 2. FILTROS ESTRUCTURADOS + NUEVOS FILTROS TÁCTICOS
    const [selectedTable, setSelectedTable] = useState('tickets');
    const [filters, setFilters] = useState({
        date_from: '',
        date_to: '',
        category: '',
        role: '',
        payment_method: '',
        hour_range: '',
        status: '',
        min_price: '',
        max_price: ''
    });
    
    const [data3D, setData3D] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());
    const [engineStatus, setEngineStatus] = useState('IDLE'); // IDLE, STARTING, READY, ERROR

    // 2.5 NUEVOS ESTADOS PARA MACHINE LEARNING
    const [analysisMode, setAnalysisMode] = useState('3D_EXPLORATION'); // 3D_EXPLORATION, ML_REGRESSION, ML_DECISION_TREE
    const [mlData, setMlData] = useState(null);
    const [mlLoading, setMlLoading] = useState(false);

    const theme = {
        bg: '#FFFFFF',
        text: '#000000',
        border: '#000000',
        grid: '#F8F8F8',
        card: '#FFFFFF',
        shadow: '0 4px 30px rgba(0, 0, 0, 0.05)'
    };

    // 3. LÓGICA DE DATOS (PROTECCIÓN CONTRA NULOS / SIN CLASIFICAR)
    const canonicalData = useMemo(() => {
        if (!Array.isArray(data3D)) return [];
        return data3D
            .map(d => ({
                ...d,
                producto: d.producto || d.name || 'SIN_CLASIFICAR', 
                val_num: d.ingreso_total || d.z_ingreso || 0
            }))
            .sort((a, b) => b.val_num - a.val_num);
    }, [data3D]);

    const executeAnalysis = async (retries = 3) => {
        setLoading(true);
        setError(null);
        setEngineStatus('STARTING');
        try {
            const queryFilters = { ...filters };
            Object.keys(queryFilters).forEach(k => !queryFilters[k] && delete queryFilters[k]);
            
            const response = await analyticsAPI.getMapReduceStats3D(selectedTable, queryFilters);
            const finalData = response.data || response || [];
            setData3D(Array.isArray(finalData) ? finalData : []);
            setLastSync(new Date().toLocaleTimeString());
            setEngineStatus('READY');
        } catch (err) {
            const statusCode = err?.response?.status;
            if ((statusCode === 500) && retries > 0) {
                // Spark aún está calentando, reintentar
                setEngineStatus('STARTING');
                setError(`MOTOR DE SPARK INICIANDO... Reintentando (${4 - retries}/3)`);
                await new Promise(res => setTimeout(res, 800)); // REINTENTO MÁS RÁPIDO 🚀
                return executeAnalysis(retries - 1);
            }
            setEngineStatus('ERROR');
            setError('ERROR DE CONEXIÓN: MOTOR DE ANALÍTICA OFFLINE');
        } finally { setLoading(false); }
    };

    const executeMLAnalysis = async (mode) => {
        setMlLoading(true);
        try {
            let data;
            if (mode === 'ML_REGRESSION') {
                data = await analyticsAPI.getRegressionML();
            } else if (mode === 'ML_DECISION_TREE') {
                data = await analyticsAPI.getDecisionTreeML();
            }
            setMlData(data);
        } catch (err) {
            setError('FALLO EN EL MOTOR DE MACHINE LEARNING');
        } finally {
            setMlLoading(false);
        }
    };

    useEffect(() => {
        setErrorDismissed(false);
    }, [error]);
    useEffect(() => { 
        if (analysisMode === '3D_EXPLORATION') {
            executeAnalysis(); 
        } else {
            executeMLAnalysis(analysisMode);
        }
    }, [selectedTable, analysisMode]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleExportExcel = () => {
        if (!canonicalData || canonicalData.length === 0) return;
        const headers = ["Producto / Categoria", "Ingreso / Valor"];
        const rows = canonicalData.map(d => [`"${d.producto}"`, d.val_num]);
        const csvContent = "data:text/csv;charset=utf-8,\ufeff" + [headers, ...rows].map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Reporte_BigData_${selectedTable.toUpperCase()}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    // 4. RENDERIZADO 3D (INDUSTRIAL + TOOLS)
    const render3DPlot = () => {
        const plotData = [];
        const w = barWidth;
        const gridWidth = Math.ceil(Math.sqrt(canonicalData.length || 1));

        const meshCommon = (x, y, z, i, j, k, name, zVal, index) => ({
            type: 'mesh3d', x, y, z, i, j, k,
            intensity: z.map(v => v),
            colorscale: colorMode === 'solid' 
                ? [[0, solidColors[index % solidColors.length]], [1, solidColors[index % solidColors.length]]] 
                : palettes[colorPalette],
            showscale: false,
            opacity: isWireframe ? 0.3 : opacity,
            flatshading: true,
            name: name,
            hoverinfo: 'text',
            text: `<b>${name}</b><br>VALOR: \${zVal.toLocaleString()}`
        });

        const makeBox = (xPos, yPos, zVal, nz, name, index) => {
            const x = [xPos-w, xPos+w, xPos+w, xPos-w, xPos-w, xPos+w, xPos+w, xPos-w];
            const y = [yPos-w, yPos-w, yPos+w, yPos+w, yPos-w, yPos-w, yPos+w, yPos+w];
            const z = [0, 0, 0, 0, nz, nz, nz, nz];
            const i = [0, 0, 4, 4, 0, 0, 1, 1, 2, 2, 3, 3];
            const j = [1, 2, 5, 6, 1, 5, 2, 6, 3, 7, 0, 4];
            const k = [2, 3, 6, 7, 5, 4, 6, 5, 7, 6, 4, 7];
            return meshCommon(x, y, z, i, j, k, name, zVal, index);
        };

        const makePyramid = (xPos, yPos, zVal, nz, name, index) => {
            const x = [xPos-w, xPos+w, xPos+w, xPos-w, xPos];
            const y = [yPos-w, yPos-w, yPos+w, yPos+w, yPos];
            const z = [0, 0, 0, 0, nz];
            const i = [0, 0, 0, 1, 2, 3];
            const j = [1, 2, 1, 2, 3, 0];
            const k = [2, 3, 4, 4, 4, 4];
            return meshCommon(x, y, z, i, j, k, name, zVal, index);
        };

        const maxDataValue = Math.max(...canonicalData.map(d => d.val_num || 1), 1);
        const visualMaxH = 3.0;

        // 🟢 NUEVA LÓGICA DE ENRUTAMIENTO POR TIPO DE GRÁFICO
        if (chartType === '2D_PIE') {
            plotData.push({
                type: 'pie',
                labels: canonicalData.map(d => d.producto),
                values: canonicalData.map(d => d.val_num),
                textinfo: 'label+percent',
                hole: 0.4,
                marker: { 
                    colors: canonicalData.map((_, index) => solidColors[index % solidColors.length]) 
                }
            });
        } else if (chartType === '3D_SCATTER' || buildingShape === 'points') {
            const x = [], y = [], z = [], text = [], colors = [];
            canonicalData.forEach((d, i) => {
                const normalizedZ = (d.val_num / maxDataValue) * visualMaxH * zScale * hMult;
                x.push((i % gridWidth) * 0.7);
                y.push(Math.floor(i / gridWidth) * 0.7);
                z.push(normalizedZ);
                text.push(`<b>${d.producto}</b><br>VALOR: \${d.val_num.toLocaleString()}`);
                colors.push(colorMode === 'solid' ? solidColors[i % solidColors.length] : normalizedZ);
            });
            plotData.push({
                type: 'scatter3d',
                mode: 'markers',
                x, y, z,
                marker: {
                    size: markerSize,
                    color: colorMode === 'solid' ? null : z,
                    colors: colorMode === 'solid' ? colors : null,
                    colorscale: colorMode === 'solid' ? null : palettes[colorPalette],
                    color: colorMode === 'solid' ? colors : z,
                    opacity: opacity,
                    symbol: 'circle'
                },
                text: text,
                hoverinfo: 'text'
            });
        } else {
            // Predeterminado: 3D_BAR (Barras)
            canonicalData.forEach((d, i) => {
                const normalizedZ = (d.val_num / maxDataValue) * visualMaxH * zScale * hMult; 
                const gx = (i % gridWidth) * 0.7;
                const gy = Math.floor(i / gridWidth) * 0.7;
                const shapeFunc = buildingShape === 'pyramid' ? makePyramid : makeBox;
                plotData.push(shapeFunc(gx, gx, d.val_num, normalizedZ, d.producto, i));
            });
        }
        return plotData;
    }

    if (loading && (!canonicalData || canonicalData.length === 0)) {
        return (
            <div className="analytics-premium" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '1.5rem 2rem', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
                
                {/* CABECERA PREMIUM MOCK (Espejo de header real) */}
                <header style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0,0,0,0.04)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '1.2rem 2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Skeleton style={{ height: '48px', width: '48px', borderRadius: '16px' }} animate />
                        <div>
                            <Skeleton style={{ height: '22px', width: '180px', marginBottom: '6px' }} animate />
                            <Skeleton style={{ height: '12px', width: '250px' }} animate />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {/* Mock de los 3 botones de modo */}
                        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-primary)', padding: '6px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                            <Skeleton style={{ height: '30px', width: '120px', borderRadius: '12px' }} animate />
                            <Skeleton style={{ height: '30px', width: '100px', borderRadius: '12px' }} animate />
                            <Skeleton style={{ height: '30px', width: '140px', borderRadius: '12px' }} animate />
                        </div>
                        <div style={{ width: '1px', height: '40px', background: 'rgba(0,0,0,0.06)' }}></div>
                        <div>
                            <Skeleton style={{ height: '10px', width: '80px', marginBottom: '4px' }} animate />
                            <Skeleton style={{ height: '35px', width: '160px', borderRadius: '12px' }} animate />
                        </div>
                        <Skeleton style={{ height: '38px', width: '120px', borderRadius: '12px' }} animate />
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 300px) 1fr minmax(260px, 280px)', gap: '1.5rem' }}>
                    
                    {/* PANEL IZQUIERDO MOCK (Filtros exactos) */}
                    <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <Card style={{ padding: '1.5rem', borderRadius: '24px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', paddingBottom: '0.8rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                <Skeleton style={{ height: '16px', width: '16px', borderRadius: '3px' }} animate />
                                <Skeleton style={{ height: '14px', width: '120px' }} animate />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                {[2, 1, 1, 1, 1, 2, 1].map((items, i) => (
                                    <div key={i}>
                                        <Skeleton style={{ height: '8px', width: '40%', marginBottom: '6px' }} animate />
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            {[...Array(items)].map((_, j) => (
                                                <Skeleton key={j} style={{ height: '35px', flex: 1, borderRadius: '12px' }} animate />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <Skeleton style={{ height: '38px', width: '100%', borderRadius: '12px', marginTop: '0.5rem' }} animate />
                                <Skeleton style={{ height: '38px', width: '100%', borderRadius: '12px', background: '#e2f5e9' }} animate />
                            </div>
                        </Card>
                    </aside>

                    {/* PANEL CENTRAL MOCK (Gráfico 3D Simulado) */}
                    <main style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <Card style={{ padding: 0, overflow: 'hidden', borderRadius: '24px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', boxShadow: '0 12px 40px rgba(0,0,0,0.06)' }}>
                            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Skeleton style={{ height: '16px', width: '16px', borderRadius: '4px' }} animate />
                                    <Skeleton style={{ height: '14px', width: '180px' }} animate />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <Skeleton style={{ height: '12px', width: '100px' }} animate />
                                    <Skeleton style={{ height: '12px', width: '80px' }} animate />
                                </div>
                            </div>
                            <div style={{ height: '520px', background: '#f8fafc', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '12px', padding: '40px' }}>
                                {/* Simulación de barritas 3D con Skeleton */}
                                {[80, 140, 220, 180, 260, 190, 310, 240, 160, 110, 80].map((h, i) => (
                                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                        <Skeleton style={{ height: `${h}px`, width: '100%', borderRadius: '8px 8px 4px 4px', background: 'linear-gradient(to top, rgba(0,0,0,0.03), rgba(0,0,0,0.12))' }} animate />
                                        <Skeleton style={{ height: '6px', width: '60%', marginTop: '8px' }} animate />
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Métricas inferiores Mock */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)', gap: '1.5rem' }}>
                            <Card style={{ padding: '1.5rem', borderRadius: '24px', border: '1px solid var(--border-color)', height: '150px' }}>
                                <Skeleton style={{ height: '10px', width: '120px', marginBottom: '12px' }} animate />
                                <Skeleton style={{ height: '28px', width: '80%', marginBottom: '12px' }} animate />
                                <Skeleton style={{ height: '12px', width: '100%', marginBottom: '8px' }} animate />
                                <Skeleton style={{ height: '12px', width: '60%' }} animate />
                            </Card>
                            <Card style={{ padding: '1.5rem', borderRadius: '24px', border: '1px solid var(--border-color)', height: '150px' }}>
                                <Skeleton style={{ height: '10px', width: '140px', marginBottom: '12px' }} animate />
                                <Skeleton style={{ height: '42px', width: '60%', marginBottom: '16px' }} animate />
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f0f0f0', paddingTop: '10px' }}>
                                    <Skeleton style={{ height: '12px', width: '120px' }} animate />
                                    <Skeleton style={{ height: '14px', width: '60px', borderRadius: '6px' }} animate />
                                </div>
                            </Card>
                        </div>
                    </main>

                    {/* PANEL DERECHO MOCK (Slidres y log exactos) */}
                    <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <Card style={{ padding: '1.5rem', borderRadius: '24px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.2rem', paddingBottom: '0.8rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                <Skeleton style={{ height: '16px', width: '16px', borderRadius: '4px' }} animate />
                                <Skeleton style={{ height: '14px', width: '130px' }} animate />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                {[...Array(5)].map((_, i) => (
                                    <div key={i}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <Skeleton style={{ height: '8px', width: '50%' }} animate />
                                            <Skeleton style={{ height: '8px', width: '20px' }} animate />
                                        </div>
                                        <Skeleton style={{ height: '6px', width: '100%', borderRadius: '3px' }} animate />
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card style={{ padding: 0, borderRadius: '24px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div style={{ padding: '1.2rem', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Skeleton style={{ height: '14px', width: '14px', borderRadius: '3px' }} animate />
                                <Skeleton style={{ height: '12px', width: '150px' }} animate />
                            </div>
                            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <Skeleton style={{ height: '12px', width: '18px' }} animate />
                                        <Skeleton style={{ height: '12px', flex: 1 }} animate />
                                        <Skeleton style={{ height: '12px', width: '50px' }} animate />
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </aside>

                </div>
            </div>
        );
    }

    return (
        <div className="analytics-premium" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '1.5rem 2rem', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
            
            {/* CABECERA PREMIUM */}
            <header style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '1.2rem 2rem', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: '#000000', padding: '12px', borderRadius: '16px', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <DatabaseIcon size={24} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.02em', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            SALA DE ANÁLISIS 
                            <span style={{ fontSize: '0.65rem', background: '#e2e8f0', color: '#475569', padding: '4px 10px', borderRadius: '20px', fontWeight: 700 }}>v8.5_ML</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', opacity: 0.8, marginTop: '2px', fontWeight: 500 }}>Motor Distribuido: Spark ML • Modo: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{analysisMode.replace('_', ' ')}</span></div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ background: 'var(--bg-primary)', border: '1px solid #E5E7EB', padding: '6px', display: 'flex', gap: '4px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                        {[
                            { id: '3D_EXPLORATION', label: 'EXPLORACIÓN 3D', icon: <Layers size={14} /> },
                            { id: 'ML_REGRESSION', label: 'REGRESIÓN ML', icon: <Activity size={14} /> },
                            { id: 'ML_DECISION_TREE', label: 'ÁRBOL DE DECISIÓN', icon: <Terminal size={14} /> }
                        ].map(mode => (
                            <button 
                                key={mode.id}
                                onClick={() => setAnalysisMode(mode.id)} 
                                className={`mode-btn-premium ${analysisMode === mode.id ? 'active' : ''}`}
                            >
                                {mode.icon} {mode.label}
                            </button>
                        ))}
                    </div>
                    
                    <div style={{ width: '1px', height: '40px', background: 'rgba(0,0,0,0.06)', margin: '0 8px' }}></div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-primary)', opacity: 0.8 }}>FUENTE DE DATOS</label>
                        <select value={selectedTable} onChange={(e) => setSelectedTable(e.target.value)} className="select-premium">
                            <option value="tickets">Tickets Principales</option>
                            <option value="users">Logs de Usuarios</option>
                            <option value="payments">Bóveda de Pagos</option>
                            <option value="events">Distribución de Eventos</option>
                        </select>
                    </div>
                    <button onClick={() => analysisMode === '3D_EXPLORATION' ? executeAnalysis() : executeMLAnalysis(analysisMode)} className="btn-primary" style={{ background: "#000000", color: "#FFFFFF", border: "1px solid #000000" }}>
                        <Zap size={14} /> EJECUTAR
                    </button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 300px) 1fr minmax(260px, 280px)', gap: '1.5rem' }}>
                
                {/* PANEL IZQUIERDO: FILTROS */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Card style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backdropFilter: 'blur(20px)', border: '1px solid var(--border-color)', borderRadius: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', paddingBottom: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <Filter size={16} color="#000000" />
                            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>CENTRO DE FILTROS</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', maxHeight: 'calc(100vh - 250px)', overflowY: 'auto', paddingRight: '12px' }}>
                            <div className="filter-group">
                                <label>RANGO TEMPORAL</label>
                                <input type="date" name="date_from" value={filters.date_from} onChange={handleFilterChange} className="input-premium" />
                                <input type="date" name="date_to" value={filters.date_to} onChange={handleFilterChange} className="input-premium" style={{ marginTop: '6px' }} />
                            </div>
                            <div className="filter-group">
                                <label>RANGO HORARIO (HORAS PICO)</label>
                                <select name="hour_range" value={filters.hour_range} onChange={handleFilterChange} className="select-premium" style={{ width: '100%' }}>
                                    <option value="">Todo el día</option>
                                    <option value="morning">Mañana (06:00 - 12:00)</option>
                                    <option value="afternoon">Tarde (12:00 - 18:00)</option>
                                    <option value="night">Noche (18:00 - 00:00)</option>
                                    <option value="late_night">Madrugada (00:00 - 06:00)</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>TIPO DE GRÁFICO</label>
                                <select value={chartType} onChange={(e) => setChartType(e.target.value)} className="select-premium" style={{ width: '100%' }}>
                                    <option value="3D_BAR">3D Barras Extruidas</option>
                                    <option value="3D_SCATTER">3D Puntos de Dispersión</option>
                                    <option value="2D_PIE">2D Gráfica de Pastel</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>MODO DE COLOR</label>
                                <select value={colorMode} onChange={(e) => setColorMode(e.target.value)} className="select-premium" style={{ width: '100%' }}>
                                    <option value="palette">Continuo (Degradado Térmico)</option>
                                    <option value="solid">Sólido (Por Categoría)</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>MÉTODO DE PAGO</label>
                                <select name="payment_method" value={filters.payment_method} onChange={handleFilterChange} className="select-premium" style={{ width: '100%' }}>
                                    <option value="">Todos los métodos</option>
                                    <option value="Card">Tarjeta</option>
                                    <option value="Credits">Créditos</option>
                                    <option value="Cash">Efectivo</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>RANGO DE PRECIOS</label>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <input type="number" name="min_price" placeholder="Mínimo" value={filters.min_price} onChange={handleFilterChange} className="input-premium" />
                                    <input type="number" name="max_price" placeholder="Máximo" value={filters.max_price} onChange={handleFilterChange} className="input-premium" />
                                </div>
                            </div>
                            <div className="filter-group">
                                <label>ESTADO DEL TICKET</label>
                                <select name="status" value={filters.status} onChange={handleFilterChange} className="select-premium" style={{ width: '100%' }}>
                                    <option value="">Todos los estados</option>
                                    <option value="active">Activo</option>
                                    <option value="cancelled">Cancelado</option>
                                    <option value="pending">Pendiente</option>
                                </select>
                            </div>
                            <button onClick={executeAnalysis} className="btn-secondary" style={{ marginTop: '0.5rem' }}>
                                APLICAR FILTROS
                            </button>
                            <button onClick={handleExportExcel} className="btn-primary" style={{ marginTop: '0.5rem', background: '#27ae60', borderColor: '#27ae60' }}>
                                EXPORTAR A EXCEL
                            </button>
                        </div>
                    </Card>

                    <Card style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backdropFilter: 'blur(20px)', border: '1px solid var(--border-color)', borderRadius: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                            <Palette size={16} color="#000000" />
                            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', opacity: 0.8, margin: 0 }}>ESQUEMA DE COLOR</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                            {Object.keys(palettes).map(p => (
                                <button 
                                    key={p} 
                                    onClick={()=>setColorPalette(p)} 
                                    className={`palette-btn-premium ${colorPalette === p ? 'active' : ''}`}
                                >
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </button>
                            ))}
                        </div>
                    </Card>
                </aside>

                {/* PANEL CENTRAL: MONITOR 3D Y MÉTRICAS */}
                <main style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Card style={{ padding: 0, overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--border-color)', backdropFilter: 'blur(20px)', borderRadius: '24px', boxShadow: '0 12px 40px rgba(0,0,0,0.06)' }}>
                        <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', border: '1px solid #E5E7EB' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ background: '#000000', padding: '6px', borderRadius: '8px', color: '#FFFFFF' }}><BarChart3 size={16}/></div>
                                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>RENDER SKYLINE <span style={{ color: '#94a3b8', fontWeight: 500 }}>v8.2</span></span>
                            </div>
                            <div style={{ display: 'flex', gap: '1.2rem' }}>
                                <div className="tool-hint-premium"><Maximize2 size={12}/> Zoom Habilitado</div>
                                <div className="tool-hint-premium"><Box size={12}/> {buildingShape.charAt(0).toUpperCase() + buildingShape.slice(1)}</div>
                            </div>
                        </div>
                        
                        <div style={{ height: '520px', background: '#f8fafc', position: 'relative' }}>
                            {/* CAJA DE LEYENDA PARA LOS CUADRADITOS DE COLORES */}
                            {colorMode === 'solid' && (
                                <div style={{ 
                                    position: 'absolute', top: '15px', right: '15px', 
                                    background: 'rgba(255,255,255,0.95)', padding: '10px 15px', 
                                    borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', 
                                    border: '1px solid #E2E8F0', zIndex: 10,
                                    maxHeight: '250px', overflowY: 'auto'
                                }}>
                                    <h4 style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', color: '#475569', borderBottom: '1px solid #EDF2F7', paddingBottom: '4px' }}>Leyenda</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {canonicalData.slice(0, 15).map((d, index) => (
                                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 700 }}>
                                                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: solidColors[index % solidColors.length] }}></div>
                                                <span style={{ color: '#1E293B' }}>{d.producto}</span>
                                            </div>
                                        ))}
                                        {canonicalData.length > 15 && <div style={{ fontSize: '0.65rem', color: '#64748B', fontStyle: 'italic' }}>Y {canonicalData.length - 15} más...</div>}
                                    </div>
                                </div>
                            )}

                            {(loading || mlLoading) && (
                                <div className="loader-overlay-premium">
                                    <div className="spinner"></div>
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '1px' }}>PROCESANDO DATOS...</span>
                                </div>
                            )}
                            
                            {analysisMode === '3D_EXPLORATION' ? (
                                <Plot 
                                    data={render3DPlot()}
                                    layout={{
                                        autosize: true, height: 520, margin: { l: 0, r: 0, b: 0, t: 0 },
                                        paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                                        scene: {
                                            xaxis: { showgrid: true, gridcolor: '#D1D5DB', gridwidth: 1, zeroline: false, showticklabels: false, title: '' },
                                            yaxis: { showgrid: true, gridcolor: '#D1D5DB', gridwidth: 1, zeroline: false, showticklabels: false, title: '' },
                                            zaxis: { showgrid: true, gridcolor: '#D1D5DB', gridwidth: 1, zeroline: false, title: '' },
                                            camera: { eye: { x: 1.5, y: 1.5, z: 1.2 } },
                                            aspectratio: { x: 1, y: 1, z: 0.7 }
                                        },
                                        showlegend: false
                                    }}
                                    style={{ width: '100%', opacity: (loading || mlLoading) ? 0.3 : 1, transition: 'opacity 0.3s' }}
                                    config={{ responsive: true, displaylogo: false }}
                                />
                            ) : analysisMode === 'ML_REGRESSION' ? (
                                <div className="ml-panel-content">
                                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={18} color="#000000"/> COMPARATIVA DE MODELOS (R²)</h2>
                                    {mlData?.model_comparison ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.2rem' }}>
                                            {Object.entries(mlData.model_comparison).map(([name, r2]) => (
                                                <div key={name} style={{ background: name === mlData.best_model ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : '#fff', color: name === mlData.best_model ? '#fff' : '#1e293b', padding: '1.5rem', borderRadius: '20px', boxShadow: name === mlData.best_model ? '0 10px 25px rgba(124, 58, 237, 0.3)' : '0 4px 15px rgba(0,0,0,0.03)', border: name === mlData.best_model ? 'none' : '1px solid rgba(0,0,0,0.05)', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.8, marginBottom: '6px' }}>ALGORITMO</div>
                                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>{name}</div>
                                                    <div style={{ padding: '10px', background: name === mlData.best_model ? 'rgba(0,0,0,0.1)' : '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Score R²</span>
                                                        <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{r2}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            <div style={{ gridColumn: 'span 2', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', padding: '1.2rem', borderRadius: '16px', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                                <Check size={16} /> EL MEJOR MODELO PARA PREDICCIÓN ES <b>{mlData.best_model}</b>
                                            </div>
                                        </div>
                                    ) : <div className="ml-placeholder">Esperando datos del motor de inferencia...</div>}
                                </div>
                            ) : (
                                <div className="ml-panel-content">
                                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Terminal size={18} color="#000000"/> ÁRBOL DE DECISIÓN GENERADO</h2>
                                    <div style={{ background: '#0f172a', color: 'var(--text-primary)', padding: '1.5rem', borderRadius: '16px', fontFamily: '"Fira Code", monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap', border: '1px solid #1e293b', overflowY: 'auto', maxHeight: '300px', boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.5)' }}>
                                        {mlData?.tree_structure || 'Generando nodos, espere...'}
                                    </div>
                                    <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '1rem 1.5rem', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)' }}>
                                        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', opacity: 0.8 }}>Precisión del Modelo: <span style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.4rem', marginLeft: '8px' }}>{Math.round(mlData?.accuracy * 100) || 0}%</span></div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 500, color: '#94a3b8', background: '#f8fafc', padding: '6px 12px', borderRadius: '20px' }}>{mlData?.summary || 'N/A'}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* MÉTRICAS INFERIORES PREMIUM */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)', gap: '1.5rem' }}>
                        <Card style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', backdropFilter: 'blur(20px)', borderRadius: '24px', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', background: 'linear-gradient(to bottom, #000000, #000000)' }}></div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '1px' }}>INTELIGENCIA DE NEGOCIO</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.8rem' }}>Mapeo de Solidez Geográfica</div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', opacity: 0.8, lineHeight: '1.6', marginBottom: '1.5rem' }}>
                                Renderizado inmersivo de <b>{selectedTable}</b>. La altimetría refleja el volumen financiero captado y normalizado para los análisis tácticos que has filtrado.
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', background: '#f1f5f9', padding: '8px 12px', borderRadius: '12px', width: 'fit-content' }}>
                                <DatabaseIcon size={14} color="#000000" /> {canonicalData.length} Registros Activos
                            </div>
                        </Card>

                        <Card style={{ padding: '1.8rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', opacity: 0.8, marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Ingreso Consolidado (Filtro Actual)</div>
                            <div style={{ fontSize: '3.2rem', fontWeight: 800, letterSpacing: '-1px', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                                ${canonicalData.reduce((acc, d) => acc + d.val_num, 0).toLocaleString()} <span style={{ fontSize: '1.2rem', color: 'var(--text-primary)', opacity: 0.8, fontWeight: 500 }}>USD</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '1rem', marginTop: 'auto' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', opacity: 0.8 }}>
                                    Pico Máximo: <strong style={{ color: 'var(--text-primary)', marginLeft: '4px' }}>{canonicalData[0]?.producto?.substring(0, 20) || '---'}</strong>
                                </div>
                                <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '4px 10px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Check size={10} strokeWidth={3}/> VALIDADO
                                </div>
                            </div>
                        </Card>
                    </div>
                </main>

                {/* PANEL DERECHO: HERRAMIENTAS Y LOG */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Card style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', backdropFilter: 'blur(20px)', borderRadius: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.2rem', paddingBottom: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <Settings size={16} color="#475569" />
                            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>METRÍAS PROYECCIÓN</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div className="slider-group">
                                <div className="slider-header">
                                    <label>Multiplicador de Altura</label>
                                    <span className="slider-val">{hMult}x</span>
                                </div>
                                <input type="range" min="0.5" max="5" step="0.1" value={hMult} onChange={(e)=>setHMult(parseFloat(e.target.value))} className="slider-premium" />
                            </div>
                            <div className="slider-group">
                                <div className="slider-header">
                                    <label>Grosor de Celda</label>
                                    <span className="slider-val">{barWidth}</span>
                                </div>
                                <input type="range" min="0.05" max="0.5" step="0.01" value={barWidth} onChange={(e)=>setBarWidth(parseFloat(e.target.value))} className="slider-premium" />
                            </div>
                            <div className="slider-group">
                                <div className="slider-header">
                                    <label>Grosor de Puntos (Scatter)</label>
                                    <span className="slider-val">{markerSize}px</span>
                                </div>
                                <input type="range" min="4" max="24" step="1" value={markerSize} onChange={(e)=>setMarkerSize(parseInt(e.target.value))} className="slider-premium" />
                            </div>
                            <div className="slider-group">
                                <div className="slider-header">
                                    <label>Color Personalizado (Paleta Custom)</label>
                                    <input type="color" value={customColor} onChange={(e)=>setCustomColor(e.target.value)} style={{ padding: 0, border: 'none', width: '30px', height: '18px', cursor: 'pointer', background: 'transparent' }} />
                                </div>
                            </div>
                            <div className="slider-group">
                                <div className="slider-header">
                                    <label>Opacidad Base</label>
                                    <span className="slider-val">{Math.round(opacity*100)}%</span>
                                </div>
                                <input type="range" min="0.1" max="1" step="0.05" value={opacity} onChange={(e)=>setOpacity(parseFloat(e.target.value))} className="slider-premium" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '8px', marginTop: '0.5rem' }}>
                                <select 
                                    className="select-premium" 
                                    value={buildingShape} 
                                    onChange={(e) => setBuildingShape(e.target.value)}
                                    style={{ padding: '8px' }}
                                >
                                    <option value="cube">Cubos</option>
                                    <option value="pyramid">Pirámides</option>
                                    <option value="points">Puntos</option>
                                </select>
                                <button 
                                    onClick={()=>setIsWireframe(!isWireframe)} 
                                    className={`btn-wireframe ${isWireframe ? 'active' : ''}`}
                                >
                                    <Eye size={12}/> {isWireframe ? 'Boceto' : 'Sólido'}
                                </button>
                            </div>
                        </div>
                    </Card>

                    <Card style={{ padding: '0', background: 'var(--bg-card)', border: '1px solid var(--border-color)', backdropFilter: 'blur(20px)', borderRadius: '24px', display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
                        <div style={{ padding: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-primary)' }}>
                            <DatabaseIcon size={14} color="#64748b" />
                            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>LOG DE CAUDA TECTÓNICO</h3>
                        </div>
                        <div className="log-container-premium">
                            {canonicalData.slice(0, 20).map((d, i) => (
                                <div key={i} className="log-row-premium">
                                    <span className="log-rank">{(i+1).toString().padStart(2, '0')}</span>
                                    <span className="log-name" title={d.producto}>{d.producto}</span>
                                    <span className="log-val">${d.val_num.toLocaleString()}</span>
                                </div>
                            ))}
                            {canonicalData.length === 0 && (
                                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>Sin datos coincidentes</div>
                            )}
                        </div>
                    </Card>
                </aside>
            </div>

            {error && !errorDismissed && (
        <div className="error-banner-premium" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <ShieldAlert size={20} />
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>ALERTA DE SISTEMA</div>
                        <div style={{ opacity: 0.9, fontSize: '0.8rem' }}>{error}</div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .btn-primary { background: linear-gradient(135deg, #000000, #000000); color: white; border: none; padding: 0.7rem 1.4rem; border-radius: 12px; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: 0.2s; display: flex; alignItems: center; gap: 6px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); }
                .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 15px rgba(37, 99, 235, 0.3); }
                .btn-secondary { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 0.7rem; border-radius: 12px; font-weight: 600; font-size: 0.75rem; cursor: pointer; transition: 0.2s; width: 100%; display: flex; justify-content: center; gap: 6px; }
                .btn-secondary:hover { background: #e2e8f0; color: #0f172a; }
                .mode-btn-premium { background: transparent; border: none; padding: 0.6rem 1rem; border-radius: 12px; font-weight: 600; font-size: 0.7rem; color: #64748b; cursor: pointer; transition: 0.2s; display: flex; alignItems: center; gap: 6px; }
                .mode-btn-premium.active { background: #ffffff; color: #000000; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
                .mode-btn-premium:hover:not(.active) { color: #334155; background: rgba(255,255,255,0.3); }
                
                .filter-group { display: flex; flex-direction: column; gap: 6px; }
                .filter-group label { display: flex; align-items: center; gap: 4px; font-size: 0.65rem; font-weight: 700; color: #64748b; }
                .input-premium, .select-premium { width: 100%; background: #ffffff; border: 1px solid #e2e8f0; padding: 0.6rem 0.8rem; border-radius: 12px; font-family: inherit; font-size: 0.8rem; color: #334155; outline: none; transition: 0.2s; }
                .input-premium:focus, .select-premium:focus { border-color: #000000; box-shadow: 0 0 0 3px rgba(0,0,0,0.05); }
                
                .palette-btn-premium { background: #ffffff; border: 1px solid #e2e8f0; padding: 0.6rem; border-radius: 10px; font-weight: 600; font-size: 0.7rem; color: #64748b; cursor: pointer; transition: 0.2s; }
                .palette-btn-premium.active { background: #18181B; border-color: #000000; color: #000000; box-shadow: inset 0 0 0 1px #000000; }
                .palette-btn-premium:hover:not(.active) { background: #f1f5f9; }
                
                .slider-group { display: flex; flex-direction: column; gap: 8px; }
                .slider-header { display: flex; justify-content: space-between; align-items: center; }
                .slider-header label { font-size: 0.7rem; font-weight: 600; color: #475569; }
                .slider-val { font-size: 0.7rem; font-weight: 700; color: #000000; background: #000000; padding: 2px 8px; border-radius: 10px; }
                .slider-premium { width: 100%; accent-color: #000000; height: 6px; border-radius: 3px; background: #e2e8f0; appearance: none; outline: none; }
                .slider-premium::-webkit-slider-thumb { appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #000000; cursor: pointer; border: 2px solid #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
                
                .btn-wireframe { background: #f1f5f9; border: 1px solid #cbd5e1; color: #475569; border-radius: 12px; padding: 8px; font-size: 0.7rem; font-weight: 600; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 4px; }
                .btn-wireframe.active { background: #000000; color: #fff; border-color: #000000; }
                
                .tool-hint-premium { color: #64748b; font-size: 0.7rem; font-weight: 600; display: flex; align-items: center; gap: 6px; background: #f1f5f9; padding: 4px 10px; border-radius: 12px; }
                
                .log-container-premium { padding: 0.5rem 1.2rem 1.2rem; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; flex-grow: 1; }
                .log-row-premium { display: flex; align-items: center; padding: 0.6rem 0.5rem; border-bottom: 1px solid #f1f5f9; transition: background 0.2s; border-radius: 8px; }
                .log-row-premium:hover { background: #18181B; cursor: default; }
                .log-rank { font-size: 0.6rem; font-weight: 800; color: #cbd5e1; width: 20px; font-variant-numeric: tabular-nums; }
                .log-name { font-size: 0.75rem; font-weight: 600; color: #334155; flex-grow: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 10px; }
                .log-val { font-size: 0.75rem; font-weight: 800; color: #0f172a; }
                
                .ml-panel-content { padding: 2.5rem; height: 100%; box-sizing: border-box; overflow-y: auto; }
                .ml-placeholder { background: rgba(0,0,0,0.05); border: 2px dashed rgba(0,0,0,0.05); color: #000000; padding: 3rem; text-align: center; border-radius: 20px; font-weight: 600; font-size: 1rem; }
                
                .loader-overlay-premium { position: absolute; inset: 0; background: rgba(255,255,255,0.7); backdrop-filter: blur(4px); z-index: 10; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; }
                .spinner { width: 40px; height: 40px; border: 3px solid rgba(0,0,0,0.05); border-radius: 50%; border-top-color: #000000; animation: spin 1s infinite linear; }
                @keyframes spin { to { transform: rotate(360deg); } }
                
                .error-banner-premium { position: fixed; bottom: 2rem; right: 2rem; background: #ef4444; color: white; padding: 1.2rem 1.5rem; border-radius: 16px; box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3); z-index: 1000; display: flex; align-items: flex-start; gap: 1rem; max-width: 400px; animation: slideUp 0.3s ease-out; }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default BigDataVisualizer;
