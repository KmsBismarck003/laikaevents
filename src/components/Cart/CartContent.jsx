import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import Icon from '../Icons';
import TicketPrinterOverlay from '../../pages/user/UserCart/TicketPrinterOverlay';
import './Cart.css';

const CartContent = ({ onCheckoutComplete, isModal = false, twoColumn = false }) => {
    const {
        cart, total, removeFromCart, updateQuantity, clearCart,
        serviceFee, serviceFeePercent, availableCoupons,
        appliedCoupon, discount, finalTotal,
        applyCoupon, removeCoupon, consumeAppliedCoupon,
        closeCart
    } = useCart();

    const { success, error } = useNotification();
    const navigate = useNavigate();
    const [showCouponSelector, setShowCouponSelector] = useState(false);

    // Animation overlay state
    const [showPrinter, setShowPrinter] = useState(false);
    const [printingData, setPrintingData] = useState(null);

    const ticketItems = cart.filter(item => item.sectionId !== 'MERCH');
    const merchItems = cart.filter(item => item.sectionId === 'MERCH');

    const renderItem = (item) => {
        const nameMatch = item.eventName?.match(/^(.+?)\s*\((.+)\)$/);
        const displayName = nameMatch ? nameMatch[1] : (item.eventName || item.name || '');
        const displayVariant = nameMatch ? nameMatch[2] : null;

        return (
            <div key={`${item.eventId}-${item.sectionId}-${item.id || ''}`} className="cart-item-ticket">
                <div className="ticket-left-media">
                    <img src={item.image || item.imageUrl || item.ticket_image_url} alt="" />
                </div>
                
                <div className="ticket-center-info">
                    <h4 className="ticket-title">{displayName}</h4>
                    {displayVariant && <span style={{ fontSize:'.62rem', color:'#aaa', fontWeight:500 }}>{displayVariant}</span>}
                    {!displayVariant && item.sectionName && <span style={{ fontSize:'.65rem', color:'#EAB308', fontWeight: 700 }}>{item.sectionName}</span>}
                    {item.functionDate && <span style={{ fontSize:'.6rem', color:'#ccc' }}>📅 {item.functionDate}</span>}
                    
                    <div style={{ display:'flex', alignItems:'center', gap:'0', marginTop:'0.5rem', width:'fit-content', border:'1px solid rgba(255,255,255,0.2)', borderRadius: '4px' }}>
                        <button onClick={() => updateQuantity(item.eventId, item.quantity - 1, item.functionId, item.sectionId)}
                            style={{ width:'24px', height:'24px', background:'transparent', border:'none', color:'#fff', cursor:'pointer', fontSize:'.8rem', fontWeight:900 }}>−</button>
                        <span style={{ fontSize:'.75rem', color:'#fff', width:'24px', textAlign:'center', fontWeight:700 }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.eventId, item.quantity + 1, item.functionId, item.sectionId)}
                            style={{ width:'24px', height:'24px', background:'transparent', border:'none', color:'#fff', cursor:'pointer', fontSize:'.8rem', fontWeight:900 }}>+</button>
                    </div>
                    <button onClick={() => removeFromCart(item.eventId, item.functionId, item.sectionId)}
                        style={{ background:'none', border:'none', color:'#f87171', cursor:'pointer', fontSize:'.6rem', fontWeight:700, textAlign:'left', padding:0, marginTop:'0.25rem', width:'fit-content', textDecoration:'underline', textTransform:'uppercase', letterSpacing:'1px' }}>
                        ELIMINAR
                    </button>
                </div>
                
                <div className="ticket-right-status">
                    <div className="ticket-qr-icon">
                        {/* Mock QR placeholder to make it look cinematic inside list */}
                        <div style={{ width: '100%', height: '100%', background: 'repeating-linear-gradient(45deg, #000, #000 2px, #fff 2px, #fff 4px)' }}></div>
                    </div>
                    <span style={{ fontWeight:950, fontSize:'.85rem', color:'#fff' }}>
                        ${(item.price * item.quantity).toLocaleString('es-MX', {minimumFractionDigits:0})}
                    </span>
                    <span className="status-badge-blue">ACTIVO</span>
                </div>
            </div>
        );
    };

    const handleCheckout = () => {
        if (cart.length === 0) return;
        if (isModal && closeCart) closeCart();
        navigate('/checkout');
    };

    const handlePrintingComplete = () => {
        setShowPrinter(false);
        if (isModal && closeCart) closeCart();
        navigate('/user/tickets');
        if (onCheckoutComplete) onCheckoutComplete();
    };

    if (cart.length === 0 && !showPrinter) {
        return (
            <div className="cart-empty-state">
                <div className="empty-icon-box">
                    <Icon name="shoppingCart" size={42} className="opacity-20" />
                </div>
                <h3 className="empty-title-elite">EL CARRITO ESTÁ VACÍO</h3>
                <p className="empty-subtitle-elite">
                    NO HAS SELECCIONADO NINGUNA EXPERIENCIA AÚN.
                </p>
                <button
                    onClick={() => { if (isModal && closeCart) closeCart(); navigate('/'); }}
                    className="bg-white text-black px-10 py-4 text-[11px] font-black uppercase tracking-widest hover:opacity-80 transition-all rounded-full"
                >
                    EXPLORAR CARTELERA
                </button>
            </div>
        );
    }

    return (
        <>
            {/* ── TICKET PRINTER OVERLAY — full screen ─────────────────── */}
            <TicketPrinterOverlay
                isOpen={showPrinter}
                ticketData={printingData}
                isProcessing={false}
                onComplete={handlePrintingComplete}
            />

            <div className={`cart-content-wrapper ${isModal ? 'is-modal' : ''} ${twoColumn ? 'two-col' : ''}`}
                style={twoColumn ? { display:'flex', flexDirection:'row', width:'100%', overflow:'hidden', flex:1 } : {}}>

                {/* ── LEFT: Items ─────────────────────────────────────────── */}
                <div className="cart-items-section"
                    style={twoColumn ? { flex:1, overflowY:'auto', padding:'1.25rem 1.5rem', borderRight:'1px solid rgba(255,255,255,0.1)' } : {}}>
                    
                    {ticketItems.length > 0 && (
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 className="section-small-title"
                                style={{ fontSize:'.55rem', fontWeight:950, textTransform:'uppercase', letterSpacing:'4px', color:'#3b82f6', marginBottom:'1.5rem', borderBottom:'1px solid rgba(59,130,246,0.3)', paddingBottom:'0.5rem' }}>
                                <Icon name="ticket" size={12} style={{ marginRight: '8px' }} /> BOLETOS
                            </h3>
                            <div className="cart-items-list" style={{ background: 'transparent' }}>
                                {ticketItems.map(renderItem)}
                            </div>
                        </div>
                    )}

                    {merchItems.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                            <h3 className="section-small-title"
                                style={{ fontSize:'.55rem', fontWeight:950, textTransform:'uppercase', letterSpacing:'4px', color:'#fff', marginBottom:'1.5rem', borderBottom:'1px solid rgba(255,255,255,0.2)', paddingBottom:'0.5rem' }}>
                                <Icon name="shoppingBag" size={12} style={{ marginRight: '8px' }} /> ARTÍCULOS / MERCH
                            </h3>
                            <div className="cart-items-list" style={{ background: 'transparent' }}>
                                {merchItems.map(renderItem)}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── RIGHT: Summary ────────────────────────────── */}
                <div style={twoColumn ? { width:'320px', flexShrink:0, overflowY:'auto',
                    padding:'1.25rem 1.5rem', display:'flex', flexDirection:'column', gap:'1rem' } : {}}>

                {/* ── Summary + Checkout ─────────────────────────────────── */}
                <div className="cart-summary-section" style={{ background: 'transparent', padding: 0, borderTop: 'none' }}>
                    {/* Free shipping banner */}
                    {finalTotal < 1500 && (
                        <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', padding:'0.75rem 1rem', marginBottom:'1rem', fontSize:'.65rem', color:'#ccc', fontWeight:600 }}>
                            Agrega <strong style={{color:'#fff'}}>${(1500 - finalTotal).toLocaleString('es-MX', {minimumFractionDigits:2})}</strong> más para el <strong style={{color:'#fff'}}>ENVÍO GRATIS</strong>.
                            <div style={{ height:'4px', background:'rgba(255,255,255,0.1)', marginTop:'0.5rem', borderRadius:'2px' }}>
                                <div style={{ height:'100%', background:'#fff', width:`${Math.min(100, (finalTotal/1500)*100)}%`, borderRadius:'2px', transition:'width 0.3s' }} />
                            </div>
                        </div>
                    )}

                    {/* Coupon */}
                    {!appliedCoupon && (
                        <div style={{ marginBottom:'1rem' }}>
                            <div style={{ display:'flex', gap:'0' }}>
                                <input
                                    placeholder="Código promocional"
                                    style={{ flex:1, background:'transparent', border:'1px solid rgba(255,255,255,0.2)', borderRight:'none', color:'#fff', padding:'0.6rem 0.8rem', fontSize:'.65rem', outline:'none' }}
                                    onKeyDown={e => { if(e.key==='Enter' && e.target.value) applyCoupon(e.target.value); }}
                                />
                                <button
                                    style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.2)', color:'#ccc', padding:'0 1rem', fontSize:'.6rem', fontWeight:900, cursor:'pointer', textTransform:'uppercase', letterSpacing:'1px', transition: 'background 0.2s' }}
                                    onClick={e => { const inp = e.target.previousSibling; if(inp?.value) applyCoupon(inp.value); }}
                                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                                    onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ccc'; }}
                                >
                                    APLICAR
                                </button>
                            </div>
                        </div>
                    )}
                    {appliedCoupon && (
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.5rem 0.75rem', background:'rgba(34, 197, 94, 0.1)', border:'1px solid rgba(34, 197, 94, 0.3)', marginBottom:'1rem', fontSize:'.65rem' }}>
                            <span style={{color:'#4ade80', fontWeight:700}}>✓ CUPÓN: {appliedCoupon}</span>
                            <button onClick={removeCoupon} style={{ background:'none', border:'none', color:'#fff', cursor:'pointer', fontSize:'1rem' }}>×</button>
                        </div>
                    )}

                    {/* Resumen de compra (Floating Glass Boxes 📦) */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '16px',
                        padding: '1.25rem',
                        marginBottom: '1rem',
                        textAlign: 'center',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                    }}>
                        <span style={{ display: 'block', fontSize: '0.6rem', color: '#888', fontWeight: 800, letterSpacing: '2px' }}>TOTAL A PAGAR</span>
                        <h2 style={{ fontSize: '2.4rem', fontWeight: 950, color: '#fff', margin: '0.25rem 0', letterSpacing: '-1px' }}>
                            ${finalTotal.toLocaleString('es-MX', {minimumFractionDigits:2})}
                        </h2>
                        <span style={{ fontSize: '0.7rem', color: '#666', fontWeight: 900 }}>MXN</span>
                    </div>

                    <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        padding: '1rem',
                        borderRadius: '12px',
                        marginBottom: '1rem'
                    }}>
                        <h4 style={{ fontSize: '.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', color: '#ccc', margin: '0 0 0.75rem' }}>RESUMEN</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.7rem', color: '#eee', marginBottom: '0.4rem' }}>
                            <span>Total parcial</span><span>${total.toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.7rem', color: '#eee', marginBottom: '0.4rem' }}>
                            <span>Caro por servicio ({serviceFeePercent}%)</span><span>+${serviceFee.toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
                        </div>
                        {appliedCoupon && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.7rem', color: '#4ade80', marginBottom: '0.4rem' }}>
                                <span>Descuento</span><span>-${discount.toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
                            </div>
                        )}
                    </div>

                    <button
                        className="checkout-cta"
                        onClick={handleCheckout}
                        style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'.5rem', width:'100%', background:'#fff', border:'none', color:'#000', padding:'1rem', fontSize:'.75rem', fontWeight:900, textTransform:'uppercase', letterSpacing:'3px', cursor:'pointer', transition: 'opacity 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.opacity = '0.8'}
                        onMouseOut={e => e.currentTarget.style.opacity = '1'}
                    >
                        CONTINUAR AL PAGO
                    </button>
                </div>
                </div>{/* closes right column */}
            </div>
        </>
    );
};

export default CartContent;
