import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../../../services/miscService';
import api from '../../../services/api'; // Integración con Backend Admin
import { Card, Button, Icon, Badge, Table, Dropdown, Pagination } from '../../../components';
import Skeleton from '../../../components/Skeleton/Skeleton';
import { Cloud, RefreshCw, Trash2, Download, Zap, Database, Clock, Filter, FileText } from 'lucide-react';
import { useNotification } from '../../../context';

const extractDateFromId = (id) => {
    if (!id) return null;
    const parts = id.split('_');
    if (parts.length >= 4) {
        const dateStr = parts[2]; 
        const timeStr = parts[3]; 
        if (dateStr.length === 8 && timeStr.length === 6) {
            return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}T${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}:${timeStr.substring(4, 6)}`;
        }
    }
    return null;
};

const NoSqlVault = ({ retentionDays = 30, refreshTrigger, onLoadingChange }) => {
    const { success, error: showError } = useNotification();

    const calculateTimeRemaining = (createdAt) => {
        if (!createdAt) return { text: 'N/A', color: 'secondary' };
        const createdDate = new Date(createdAt);
        if (isNaN(createdDate.getTime())) return { text: 'N/A', color: 'secondary' };
        const expirationDate = new Date(createdDate.getTime() + retentionDays * 24 * 60 * 60 * 1000);
        const now = new Date();
        const diffTime = expirationDate - now;

        if (diffTime <= 0) return { text: 'Expirado', color: 'error' };

        const d = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const h = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return { text: `${d}d ${h}h`, color: d < 3 ? 'warning' : 'success' };
    };
    const [snapshots, setSnapshots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(8); // Updated to 8
    const [backupType, setBackupType] = useState('completo');
    const [status, setStatus] = useState({ provider: 'MongoDB Atlas', count: 0 });

    const fetchSnapshots = async () => {
        setLoading(true);
        try {
            // Traer snapshots de Spark (Atlas) y los archivos .json del Back-end Admin
            const [atlasData, diskResponse] = await Promise.all([
                analyticsAPI.listNoSqlVault().catch(() => []),
                api.database.listBackups().catch(() => ({ backups: [] }))
            ]);

            // Formatear los de disco para que encajen en la tabla
            const mongoDiskFiles = (diskResponse.backups || [])
                .filter(b => b && (b.type === 'mongodb' || (b.backup_id && b.backup_id.toLowerCase().includes('mongo'))))
                .filter(b => parseFloat(b.size_mb) > 0) // Quitar de relleno (0MB)
                .map(b => ({
                    id: b.backup_id,
                    type: 'JSON (Disco)',
                    size_docs: 0, 
                    size_mb: b.size_mb,
                    created_at: b.created_at,
                    status: b.status || 'completed',
                    is_disk_file: true
                }));

            const atlasSnapshots = (atlasData || []).map(s => {
                const sId = s.id || s.backup_id;
                const fallbackDate = extractDateFromId(sId);
                return {
                    ...s,
                    id: sId,
                    created_at: s.created_at || s.timestamp || s.createdAt || fallbackDate,
                    is_disk_file: false
                };
            });

            // Juntar ambas fuentes
            const combined = [...atlasSnapshots, ...mongoDiskFiles];
            setSnapshots(combined);
            
            const statusData = await analyticsAPI.getNoSqlVaultStatus().catch(() => ({ provider: 'MongoDB Atlas' }));
            setStatus({ provider: statusData.provider, count: combined.length });
        } catch (error) {
            console.error('❌ Error general fetching snapshots:', error);
            showError('Error al conectar con el servicio de Snapshots');
        } finally {
            setLoading(false);
        }
    };

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSnapshots = snapshots.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(snapshots.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    useEffect(() => {
        if (onLoadingChange) onLoadingChange(loading);
    }, [loading, onLoadingChange]);

    useEffect(() => {
        fetchSnapshots();
    }, [refreshTrigger]);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await analyticsAPI.syncNoSqlVault({ type: backupType });
            if (res.status === 'success') {
                success(`Sincronización NoSQL ${backupType.toUpperCase()} completada`);
                fetchSnapshots();
            } else {
                showError(res.message || 'Error en la sincronización NoSQL');
            }
        } catch (err) {
            console.error('Error syncing vault:', err);
            showError('Error de red al sincronizar con MongoDB');
        } finally {
            setSyncing(false);
        }
    };

    const handleDiskBackup = async () => {
        setSyncing(true);
        try {
            await api.database.createBackup('full', { engine: 'mongodb' });
            success('Respaldo a disco JSON iniciado correctamente');
            setTimeout(fetchSnapshots, 3000); // Darle unos segundos al background task
        } catch (err) {
            showError('Error al crear respaldo en disco');
        } finally {
            setSyncing(false);
        }
    };

    const handleDelete = async (id, isDiskFile) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el snapshot ${id}?`)) return;
        try {
            if (isDiskFile) {
                await api.database.deleteBackup(id);
            } else {
                await analyticsAPI.deleteNoSqlSnapshot(id);
            }
            success('Snapshot eliminado exitosamente');
            fetchSnapshots();
        } catch (err) {
            showError('No se pudo eliminar el snapshot');
        }
    };

    const handleDownload = (id, isDiskFile) => {
        const url = isDiskFile 
            ? api.database.downloadBackupUrl(id) 
            : analyticsAPI.downloadNoSqlSnapshotUrl(id);
            
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${id}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        success('Iniciando descarga de JSON...');
    };

    const handleRestore = async (id, isDiskFile) => {
        const warningText = isDiskFile
            ? `⚠️ ADVERTENCIA: La restauración de ${id} SOBREESCRIBIRÁ colecciones en MongoDB Atlas (Bóveda Cloud). ¿Deseas continuar?`
            : `⚠️ ADVERTENCIA CRÍTICA: Restaurar este snapshot sobreescribirá datos. ¿Deseas continuar?`;
            
        if (!window.confirm(warningText)) return;
        
        setSyncing(true);
        try {
            if (isDiskFile) {
                const res = await api.database.restore(id);
                if (res.success) {
                    success('¡Mongo Atlas restaurado exitosamente desde archivo JSON!');
                } else {
                    showError(res.message || 'Error al restaurar desde disco');
                }
            } else {
                const res = await analyticsAPI.restoreNoSqlSnapshot(id);
                if (res.status === 'success') {
                    success('¡Datos restaurados exitosamente!');
                } else {
                    showError(res.message || 'Error al restaurar');
                }
            }
        } catch (err) {
            console.error('Error in restore:', err);
            showError('Error de red al intentar restaurar');
        } finally {
            setSyncing(false);
        }
    };

    const columns = [
        {
            key: 'id',
            header: 'Identificador Snapshot',
            render: value => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Cloud size={14} style={{ color: '#666' }} />
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{value}</span>
                </div>
            ),
            width: '30%'
        },
        {
            key: 'type',
            header: 'Tipo',
            render: (value, row) => (
                <Badge variant={value === 'INCREMENTAL' ? 'warning' : row.is_disk_file ? 'success' : 'info'} rounded>
                    {value}
                </Badge>
            ),
            width: '15%'
        },
        {
            key: 'size_docs',
            header: 'Peso / Contenido',
            render: (value, row) => (
                <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {row.is_disk_file 
                        ? `${(row.size_mb || 0).toFixed(2)} MB` 
                        : `${(value || 0).toLocaleString()} docs`}
                </span>
            ),
            width: '15%'
        },
        {
            key: 'created_at',
            header: 'Sincronización',
            render: value => <span style={{ color: 'var(--text-primary)' }}>{value && !isNaN(new Date(value).getTime()) ? new Date(value).toLocaleString() : 'N/A'}</span>,
            width: '15%'
        },
        {
            key: 'time_remaining',
            header: 'Expiración',
            render: (_, row) => {
                const { text, color } = calculateTimeRemaining(row.created_at);
                return <Badge variant={color} rounded dot>{text}</Badge>;
            },
            width: '10%'
        },
        {
            key: 'actions',
            header: 'Acciones',
            render: (_, row) => (
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', minWidth: '160px' }}>
                    {row.status && row.status !== 'completed' ? (
                        <div style={{ padding: '4px', width: '100px', height: '24px', background: '#ccc', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)', animation: 'flow 1.5s infinite' }}></div>
                        </div>
                    ) : (
                        <>
                            <Button 
                                size="small" 
                                variant="info" 
                                onClick={() => handleDownload(row.id, row.is_disk_file)}
                                style={{ padding: '2px 8px', height: '26px', fontSize: '0.8rem' }}
                                title="Descargar como JSON"
                                disabled={syncing}
                            >
                                <Download size={12} /> <span style={{ marginLeft: '4px' }}>JSON</span>
                            </Button>
                            
                            <Button 
                                size="small" 
                                variant="warning" 
                                onClick={() => handleRestore(row.id, row.is_disk_file)}
                                style={{ padding: '2px 8px', height: '26px', color: '#ffffff', fontSize: '0.8rem' }}
                                title={row.is_disk_file ? "Restaurar a MongoDB Atlas" : "Restaurar a MySQL"}
                                disabled={syncing}
                            >
                                <RefreshCw size={12} className={syncing ? "spin" : ""} /> <span style={{ marginLeft: '4px' }}>{row.is_disk_file ? 'REST. MONGO' : 'RESTAURAR'}</span>
                            </Button>

                            <Button 
                                size="small" 
                                variant="danger" 
                                onClick={() => handleDelete(row.id, row.is_disk_file)}
                                style={{ padding: '2px 8px', height: '26px', fontSize: '0.8rem' }}
                                title="Eliminar de la Bóveda"
                                disabled={syncing}
                            >
                                <Trash2 size={12} />
                            </Button>
                        </>
                    )}
                </div>
            ),
            width: '15%'
        }
    ];

    if (loading) {
        return (
            <Card style={{ marginTop: '2rem', border: '2px solid #000', padding: 0, overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>
                <div style={{ padding: '1rem', background: '#f8f9fa', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <Skeleton style={{ height: '18px', width: '220px', marginBottom: '4px', borderRadius: '4px' }} animate />
                        <Skeleton style={{ height: '12px', width: '300px', borderRadius: '4px' }} animate />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Skeleton style={{ height: '28px', width: '120px', borderRadius: '4px' }} animate />
                    </div>
                </div>

                <div style={{ margin: '1rem', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', boxShadow: '-2px 2px 15px 1px rgba(0,0,0,0.49)' }}>
                    {/* Geolocated Nodes Skeleton */}
                    <div style={{ padding: '1.5rem', background: '#000', border: '1px solid #333' }}>
                        <Skeleton style={{ height: '10px', width: '120px', marginBottom: '1.5rem', borderRadius: '2px' }} animate />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Skeleton style={{ height: '24px', width: '40px', borderRadius: '12px' }} animate />
                                <div style={{ flex: 1 }}>
                                    <Skeleton style={{ height: '12px', width: '120px', marginBottom: '4px' }} animate />
                                    <Skeleton style={{ height: '10px', width: '80px' }} animate />
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Skeleton style={{ height: '24px', width: '40px', borderRadius: '12px' }} animate />
                                <div style={{ flex: 1 }}>
                                    <Skeleton style={{ height: '12px', width: '120px', marginBottom: '4px' }} animate />
                                    <Skeleton style={{ height: '10px', width: '80px' }} animate />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Data Flow Skeleton */}
                    <div style={{ padding: '1.5rem', background: '#f9f9f9', border: '1px solid #ddd', position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <Skeleton style={{ height: '40px', width: '40px', borderRadius: '50%' }} animate />
                         <div style={{ flex: 1, padding: '0 20px' }}>
                              <Skeleton style={{ height: '4px', width: '100%', borderRadius: '2px' }} animate />
                         </div>
                         <Skeleton style={{ height: '40px', width: '40px', borderRadius: '50%' }} animate />
                    </div>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    <Skeleton style={{ height: '320px', width: '100%', borderRadius: '12px' }} animate />
                </div>
            </Card>
        );
    }

    return (
        <Card style={{ marginTop: '2rem', border: '2px solid #000', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem', background: '#f8f9fa', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Database size={24} /> BÓVEDA NOSQL <span style={{ color: '#888' }}>ATLAS VAULT</span>
                    </h2>
                    <p style={{ fontSize: '0.65rem', color: '#666', fontWeight: 700, margin: '4px 0 0 0' }}>
                        GESTIÓN DE RÉPLICAS Y SNAPSHOTS EN LA NUBE (MONGODB)
                    </p>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right', marginRight: '1rem' }}>
                        <div style={{ fontSize: '0.6rem', color: '#888', fontWeight: 800 }}>ESTADO DEL NODO</div>
                        <Badge variant="success" dot rounded>{status.provider} - ACTIVE</Badge>
                    </div>

                </div>
            </div>

            <div style={{ margin: '1rem', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', boxShadow: '-2px 2px 15px 1px rgba(0,0,0,0.49)', WebkitBoxShadow: '-2px 2px 15px 1px rgba(0,0,0,0.49)' }}>
                {/* Geolocated Nodes */}
                <div style={{ padding: '1.5rem', background: '#000', border: '1px solid #333', color: '#fff' }}>
                    <div style={{ fontSize: '0.6rem', color: '#888', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem' }}>Despliegue Global Cloud</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Badge variant="info" rounded style={{ width: '40px', textAlign: 'center' }}>US</Badge>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>Virginia (us-east-1)</div>
                                <div style={{ fontSize: '0.6rem', color: '#666' }}>Active Gateway</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Badge variant="ghost" rounded style={{ width: '40px', textAlign: 'center', background: '#333' }}>EU</Badge>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#666' }}>Frankfurt (eu-central-1)</div>
                                <div style={{ fontSize: '0.6rem', color: '#444' }}>Passive Replica</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Flow Animation */}
                <div style={{ padding: '1.5rem', background: '#f9f9f9', border: '1px solid #ddd', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%', position: 'relative', zIndex: 2 }}>
                        <div style={{ textAlign: 'center' }}>
                            <Database size={32} style={{ color: '#000' }} />
                            <div style={{ fontSize: '0.6rem', fontWeight: 900, marginTop: '5px' }}>LOCAL NODE</div>
                        </div>

                        <div style={{ flex: 1, height: '2px', background: '#ddd', margin: '0 20px', position: 'relative' }}>
                            {syncing && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-2px',
                                    left: 0,
                                    width: '30px',
                                    height: '6px',
                                    background: '#f1c40f',
                                    borderRadius: '3px',
                                    boxShadow: '0 0 10px #f1c40f',
                                    animation: 'flow 1.5s infinite linear'
                                }} />
                            )}
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <Cloud size={32} style={{ color: syncing ? '#f1c40f' : '#3498db' }} />
                            <div style={{ fontSize: '0.6rem', fontWeight: 900, marginTop: '5px' }}>ATLAS CLOUD</div>
                        </div>
                    </div>
                    {syncing && (
                        <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 900, color: '#f39c12' }}>
                            TRANSMITIENDO ENCRIPTADO (AES-256)...
                        </div>
                    )}
                </div>
            </div>

            <div className="nosql-vault-scoped-table">
                <Table 
                    columns={columns} 
                    data={currentSnapshots} 
                    loading={loading}
                    emptyMessage="No hay snapshots de NoSQL registrados en Atlas."
                    striped
                    bordered
                />
                
                {totalPages > 1 && (
                    <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', borderTop: '1px solid #333' }}>
                        <Pagination 
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={paginate}
                        />
                    </div>
                )}
            </div>


            <style>{`
                @keyframes flow {
                    0% { left: -10%; }
                    100% { left: 110%; }
                }
                .nosql-vault-scoped-table .table th {
                    background-color: #111111 !important;
                }
                .nosql-vault-scoped-table .table th * {
                    color: #ffffff !important;
                }
            `}</style>
        </Card>
    );
};

export default NoSqlVault;
