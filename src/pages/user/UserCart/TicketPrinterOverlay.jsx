import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Icon } from '../../../components';
import './TicketPrinter.css';

const TicketPrinterOverlay = ({ isOpen, ticketData, isProcessing, onComplete }) => {
    const [animationStage, setAnimationStage] = useState('hidden');
    const [uniqueCode, setUniqueCode] = useState('');

    useEffect(() => {
        if (isOpen && isProcessing && animationStage === 'hidden') {
            setAnimationStage('printing');
            // Generate a unique code
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let code = 'LK-' + new Date().getFullYear() + '-';
            for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
            code += '-';
            for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
            setUniqueCode(code);

            // Persistence: Handled by API during purchase
        } else if (isOpen && !isProcessing && animationStage === 'printing') {
            setAnimationStage('printed');

            // 20 seconds of cinematic construction (Ultra Slow & Premium - Restored)
            setTimeout(() => {
                setAnimationStage('shrinking');

                setTimeout(() => {
                    setAnimationStage('complete');
                    if (onComplete) onComplete();
                }, 1800); // Slower shrink
            }, 20000);
        }
    }, [isOpen, isProcessing, animationStage, onComplete, ticketData]);

    if (!isOpen || animationStage === 'hidden' || animationStage === 'complete') return null;

    return (
        <div className="ticket-printer-backdrop">
            {(animationStage === 'printed' || animationStage === 'shrinking') && (
                <div className={`success-message stage-${animationStage}`}>
                    <h3>¡COMPRA EXITOSA!</h3>
                    <p>Enviando boleto a tu Bóveda...</p>
                </div>
            )}
            <div className={`ticket-container stage-${animationStage}`}>

                {/* Printing Stage: Blank ticket with scanning laser and particles */}
                {animationStage === 'printing' && (
                    <div className="blank-ticket">
                        <div className="laser-scanner"></div>
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black tracking-[0.5em] text-white/20 uppercase mb-2">Construyendo Acceso</span>
                                <div className="flex gap-1">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="construction-particles">
                            {[...Array(80)].map((_, i) => {
                                const tx = (Math.random() - 0.5) * 250;
                                const ty = -100 - Math.random() * 250;
                                return (
                                    <div key={i} className="particle" style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${60 + Math.random() * 40}%`,
                                        animationDelay: `${Math.random() * 3}s`,
                                        '--tw-translateX': `${tx}px`,
                                        '--tw-translateY': `${ty}px`
                                    }}></div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Printed & Shrinking Stage: The actual generated ticket */}
                {(animationStage === 'printed' || animationStage === 'shrinking') && (
                    <div className="real-ticket">
                        <div className="ticket-main-section" style={{
                            backgroundImage: ticketData?.ticketBg ? `linear-gradient(to right, rgba(0, 0, 0, 0.8), transparent), url(${ticketData.ticketBg})` : undefined
                        }}>
                            <div className="ticket-content-info">
                                <span className="ticket-event-label anim-phase-2">
                                    <Icon name="sparkles" size={12} style={{ marginRight: '6px', color: '#EAB308', display: 'inline-block' }} /> 
                                    LAIKA CLUB EXCLUSIVE ACCESS
                                </span>
                                <h2 className="ticket-event-name anim-phase-2">{ticketData?.eventName || 'Boleto de Evento'}</h2>

                                <div className="ticket-details">
                                    <div className="detail-item anim-phase-2">
                                        <span className="detail-label">Fecha | Hora</span>
                                        <span className="detail-value">{ticketData?.date || '15 MAR 2026'} | {ticketData?.time || '21:00'}</span>
                                    </div>
                                    <div className="detail-item anim-phase-2">
                                        <span className="detail-label">Lugar</span>
                                        <span className="detail-value">{ticketData?.venueName || 'LAIKA ARENA'}</span>
                                    </div>
                                    <div className="detail-item anim-phase-3">
                                        <span className="detail-label">Zona / Asiento</span>
                                        <span className="detail-value !text-white font-black">
                                            {ticketData?.sectionName || 'GENERAL'} 
                                            {ticketData?.seat ? ` - S:${ticketData.seat}` : ''}
                                            {ticketData?.row ? ` R:${ticketData.row}` : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="ticket-stub anim-phase-4">
                            <div className="stub-qr-container">
                                <QRCodeSVG
                                    value={ticketData?.qrHash || uniqueCode}
                                    size={100}
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                    level="H"
                                    includeMargin={false}
                                />
                            </div>
                            <span className="stub-id font-mono font-bold text-black opacity-100">{uniqueCode}</span>
                            <span className="stub-section">{ticketData?.sectionName || 'GENERAL'}</span>
                        </div>
                    </div>
                )}
            </div>


        </div>
    );
};

export default TicketPrinterOverlay;
