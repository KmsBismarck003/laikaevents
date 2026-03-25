import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Badge, Icon, Dropdown, Pagination } from '../../../components';
import { Database, Clock, Calendar, Download, RefreshCw, Trash2, History, Zap, ShieldCheck } from 'lucide-react';
import Skeleton from '../../../components/Skeleton/Skeleton';
import { useNotification } from '../../../context';
import api from '../../../services/api';

const SqlVault = ({ backups, loading, onRefresh, onRestore, onDelete, onDownload, retentionDays, currentPage, totalPages, onPageChange }) => {
    const { success, error: showError } = useNotification();
    const [scheduled, setScheduled] = useState([]);
    const [loadingScheduled, setLoadingScheduled] = useState(false);

    const fetchScheduled = async () => {
        setLoadingScheduled(true);
        try {
            const res = await api.database.getScheduledBackups();
            setScheduled(res.scheduled || []);
        } catch (err) {
            console.error('Error fetching scheduled backups:', err);
        } finally {
            setLoadingScheduled(false);
        }
    };

    useEffect(() => {
        fetchScheduled();
    }, []);

    const calculateTimeRemaining = (createdAt) => {
        if (!createdAt) return { text: 'N/A', color: 'secondary' };
        const createdDate = new Date(createdAt);
        const expirationDate = new Date(createdDate.getTime() + retentionDays * 24 * 60 * 60 * 1000);
        const now = new Date();
        const diffTime = expirationDate - now;

        if (diffTime <= 0) return { text: 'Expirado', color: 'error' };

        const d = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const h = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return { text: `${d}d ${h}h`, color: d < 3 ? 'warning' : 'success' };
    };

    const columns = [
        {
            key: 'backup_id',
            header: 'Archivo / Snapshot',
            render: value => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Database size={14} style={{ color: '#666' }} />
                    <span style={{ fontWeight: 800 }}>{value}</span>
                </div>
            ),
            width: '30%'
        },
        {
            key: 'created_at',
            header: 'Fecha',
            render: value => new Date(value).toLocaleString(),
            width: '20%'
        },
        {
            key: 'type',
            header: 'Tipo',
            render: value => {
                const variants = { completo: 'info', incremental: 'warning', selectivo: 'primary' };
                return <Badge variant={variants[value] || 'default'} rounded>{value.toUpperCase()}</Badge>;
            },
            width: '10%'
        },
        {
            key: 'size_mb',
            header: 'Tamaño',
            render: value => <span style={{ fontWeight: 'bold' }}>{(parseFloat(value) || 0).toFixed(2)} MB</span>,
            width: '10%'
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
                    <Button size="small" variant="info" onClick={() => onDownload(row.backup_id)} style={{ padding: '2px 8px', height: '26px', fontSize: '0.8rem' }}>
                        <Download size={12} />
                    </Button>
                    <Button size="small" variant="warning" onClick={() => onRestore(row.backup_id)} style={{ padding: '2px 8px', height: '26px', color: '#ffffff', fontSize: '0.8rem' }}>
                        <History size={12} /> <span style={{ marginLeft: '4px' }}>RESTAURAR</span>
                    </Button>
                    <Button size="small" variant="danger" onClick={() => onDelete(row.backup_id)} style={{ padding: '2px 8px', height: '26px', fontSize: '0.8rem' }}>
                        <Trash2 size={12} />
                    </Button>
                </div>
            ),
            width: '20%'
        }
    ];

    const scheduledColumns = [
        {
            key: 'scheduled_time',
            header: 'Próxima Ejecución',
            render: value => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={14} style={{ color: '#f39c12' }} />
                    <span style={{ fontWeight: 700 }}>{new Date(value).toLocaleString()}</span>
                </div>
            )
        },
        {
            key: 'type',
            header: 'Tipo Programado',
            render: value => <Badge variant="warning">{value.toUpperCase()}</Badge>
        },
        {
            key: 'status',
            header: 'Estado',
            render: value => <Badge variant="info" dot>{value.toUpperCase()}</Badge>
        }
    ];

    if (loading) {
        return (
            <div className="sql-vault-container" style={{ fontFamily: 'Inter, sans-serif' }}>
                <Card style={{ padding: 0, overflow: 'hidden', border: '2px solid #000', marginBottom: '2rem' }}>
                    <div style={{ padding: '1rem', background: '#f8f9fa', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <Skeleton style={{ height: '18px', width: '240px', marginBottom: '4px', borderRadius: '4px' }} animate />
                            <Skeleton style={{ height: '12px', width: '320px', borderRadius: '4px' }} animate />
                        </div>
                        <Skeleton style={{ height: '28px', width: '120px', borderRadius: '4px' }} animate />
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                        <Skeleton style={{ height: '320px', width: '100%', borderRadius: '12px' }} animate />
                    </div>
                </Card>

                <Card style={{ padding: '1.5rem', border: '1px dashed #999', background: 'var(--bg-card)' }}>
                    <Skeleton style={{ height: '16px', width: '220px', marginBottom: '1rem', borderRadius: '4px' }} animate />
                    <Skeleton style={{ height: '120px', width: '100%', borderRadius: '12px' }} animate />
                </Card>
            </div>
        );
    }

    return (
        <div className="sql-vault-container">
            <Card style={{ padding: 0, overflow: 'hidden', border: '2px solid #000', marginBottom: '2rem' }}>
                <div style={{ padding: '1rem', background: '#f8f9fa', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ShieldCheck size={20} /> BÓVEDA LOCAL SQL <span style={{ color: '#888', fontWeight: 500 }}>SISTEMA DE ARCHIVOS</span>
                        </h2>
                        <p style={{ fontSize: '0.65rem', margin: '4px 0 0 0', fontWeight: 700, color: '#666' }}>ARCHIVOS SQL DISPONIBLES PARA RESTAURACIÓN INMEDIATA</p>
                    </div>
                    <Button size="small" variant="secondary" onClick={onRefresh} disabled={loading}>
                        <RefreshCw size={14} className={loading ? 'spin' : ''} /> <span style={{ marginLeft: '6px' }}>ACTUALIZAR</span>
                    </Button>
                </div>
                <div className="sql-vault-scoped-table">
                    <Table 
                        columns={columns} 
                        data={backups} 
                        loading={loading}
                        emptyMessage="No hay respaldos SQL disponibles en el servidor."
                        striped
                        bordered
                    />
                    {totalPages > 1 && (
                        <div style={{ padding: '0.75rem', display: 'flex', justifyContent: 'center', borderTop: '1px solid #333' }}>
                            <Pagination 
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={onPageChange}
                            />
                        </div>
                    )}
                </div>
            </Card>

            <Card style={{ border: '1px dashed #999', background: 'var(--bg-card)' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 900, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={18} /> PRÓXIMOS RESPALDOS AUTOMÁTICOS
                </h3>
                <Table 
                    columns={scheduledColumns} 
                    data={scheduled} 
                    loading={loadingScheduled}
                    emptyMessage="No hay respaldos automáticos programados actualmente."
                    showHeader={false}
                />
            </Card>

            <style>{`
                .sql-vault-scoped-table .table th {
                    background-color: #111111 !important;
                }
                .sql-vault-scoped-table .table th * {
                    color: #ffffff !important;
                }
            `}</style>
        </div>
    );
};

export default SqlVault;
