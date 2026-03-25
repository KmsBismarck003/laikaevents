import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, PermissionWall } from '../../components';
import { ticketAPI, achievementsAPI } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import './UserTickets.css';
import { QRCodeSVG } from 'qrcode.react';

const UserTickets = () => {
    const navigate = useNavigate();
    const { success, error: showError } = useNotification();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [hasPremium, setHasPremium] = useState(false);

    const fetchTickets = useCallback(async () => {
        try {
            const apiTickets = await ticketAPI.getMyTickets();
            // Solo boletos reales de la API
            const allTickets = apiTickets.map(t => ({
                id: t.id,
                eventName: t.eventName,
                sectionName: t.ticketType || 'GENERAL',
                date: t.date,
                qrHash: t.ticketCode || '',
                venueName: t.location || ''
            }));

            setTickets(allTickets);
        } catch (err) {
            console.error("Error fetching tickets", err);
        } finally {
            setLoading(false);
        }
    }, [setTickets, setLoading]);

    const checkPremium = useCallback(async () => {
        try {
            const result = await achievementsAPI.hasPremiumTicket();
            setHasPremium(result.has_premium);
        } catch (e) {
            // Fail silently
        }
    }, [setHasPremium]);

    useEffect(() => {
        fetchTickets();
        checkPremium();
    }, [fetchTickets, checkPremium]);

    if (loading) return null;

    return (
        <PermissionWall permission="canViewMyTickets" label="Mis Entradas">
        <div className="user-tickets-page elite-vault">
            <header className="page-header-elite mb-10">
                <div className="welcome-section">
                    <span className="welcome-label">BÓVEDA DE ACCESOS</span>
                    <h2 className="text-3xl font-black uppercase tracking-tighter">COLECCIÓN ELITE</h2>
                </div>
                <div className="elite-status-badge !rounded-full">
                    <Icon name="shield" size={16} />
                    ENCRIPTADO
                </div>
            </header>

            {tickets.length === 0 ? (
                <div className="user-card !bg-white/5 !border-dashed !border-white/10 text-center py-20">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Icon name="ticket" size={32} className="opacity-20" />
                    </div>
                    <p className="uppercase font-black tracking-[0.3em] text-[10px] text-gray-500">Tu bóveda está vacía</p>
                    <button onClick={() => navigate('/')} className="mt-8 text-[10px] font-black uppercase tracking-widest text-white underline decoration-white/20 underline-offset-8">ADQUIRIR PRIMER ACCESO</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {tickets.map(ticket => (
                        <div
                            key={ticket.id}
                            className="user-card !p-0 group cursor-pointer overflow-hidden"
                            onClick={() => setSelectedTicket(ticket)}
                        >
                            <div className="h-40 relative">
                                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{
                                    backgroundImage: ticket.ticketBg ? `url(${ticket.ticketBg})` : 'linear-gradient(45deg, #111, #333)'
                                }} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                <div className="absolute top-4 left-4">
                                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-white border border-white/20">
                                        {ticket.sectionName}
                                    </span>
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-lg font-black uppercase tracking-tight mb-4 group-hover:text-white transition-colors">{ticket.eventName}</h3>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 opacity-40">
                                        <Icon name="calendar" size={12} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{ticket.date}</span>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-40">
                                        <Icon name="mapPin" size={12} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{ticket.venueName}</span>
                                    </div>
                                </div>
                                <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                                    <div className="p-2 bg-white rounded-lg">
                                        <QRCodeSVG value={ticket.qrHash} size={30} bgColor="#fff" fgColor="#000" />
                                    </div>
                                    <button className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-all">
                                        MOSTRAR QR <Icon name="maximize" size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Detalle Estilo Mobile */}
            {selectedTicket && (
                <div className="qr-modal-overlay-elite !bg-black/90 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setSelectedTicket(null)}>
                    <div className="bg-[#111] w-full max-w-sm rounded-[40px] overflow-hidden border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 block mb-1">ACCESO ELITE</span>
                                    <h3 className="text-xl font-black uppercase tracking-tighter leading-none">{selectedTicket.eventName}</h3>
                                </div>
                                <button className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white" onClick={() => setSelectedTicket(null)}>&times;</button>
                            </div>

                            <div className="bg-white p-6 rounded-[30px] mb-8 shadow-[0_0_50px_rgba(255,255,255,0.1)] ticket-print-area">
                                <QRCodeSVG value={selectedTicket.qrHash} size={240} className="w-full h-auto" bgColor="#fff" fgColor="#000" level="H" includeMargin={true} />
                            </div>

                            <div className="text-center mb-8">
                                <span className="text-[10px] font-mono font-bold text-white/40 tracking-[0.5em]">{selectedTicket.qrHash}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-8 mb-8">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Zona</label>
                                    <p className="text-xs font-bold text-white uppercase">{selectedTicket.sectionName}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Asiento</label>
                                    <p className="text-xs font-bold text-white uppercase">{selectedTicket.seatId || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Fecha</label>
                                    <p className="text-xs font-bold text-white uppercase">{selectedTicket.date}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">ID</label>
                                    <p className="text-xs font-bold text-white uppercase">#{selectedTicket.id?.toString().slice(-6)}</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => window.print()}
                                    className="flex-1 bg-white text-black py-4 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2"
                                >
                                    <Icon name="printer" size={14} /> IMPRIMIR
                                </button>
                                <button 
                                    onClick={async () => {
                                        if (window.confirm('¿ESTÁS SEGURO DE SOLICITAR UN REEMBOLSO? El asiento será liberado inmediatamente.')) {
                                            try {
                                                await ticketAPI.refund({ ticket_id: selectedTicket.id });
                                                showError('Reembolso procesado con éxito');
                                                setSelectedTicket(null);
                                                fetchTickets();
                                            } catch (e) {
                                                showError(e.message || 'Error al procesar reembolso');
                                            }
                                        }
                                    }}
                                    className="px-6 border border-red-500/30 text-red-500 py-4 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500/10 transition-colors"
                                >
                                    REEMBOLSO
                                </button>
                            </div>
                        </div>
                        <button 
                            onClick={() => setSelectedTicket(null)}
                            className="w-full bg-white/5 text-white/40 py-6 text-[10px] font-black uppercase tracking-[0.3em] hover:text-white transition-colors"
                        >
                            CERRAR VISTA
                        </button>
                    </div>
                </div>
            )}
        </div>
        </PermissionWall>
    );
};

export default UserTickets;
