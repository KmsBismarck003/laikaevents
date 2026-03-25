import React, { useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import Icon from '../Icons';
import CartContent from './CartContent';

/* ── Centered 2-column Cart Modal ───────────────────────────── */
const CartModal = () => {
    const { isCartOpen, closeCart, cart, cartCount } = useCart();

    // Lock body scroll while open
    useEffect(() => {
        if (isCartOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isCartOpen]);

    if (!isCartOpen) return null;

    return (
        /* ── Backdrop ─────────────────────────────────────────── */
        <div
            onClick={closeCart}
            style={{
                position: 'fixed', inset: 0, zIndex: 9000,
                background: 'rgba(0,0,0,.5)',
                backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '2rem 1rem',
                overflowY: 'auto'
            }}
        >
            {/* ── Modal container ───────────────────────────────── */}
            <div
                onClick={e => e.stopPropagation()}
                className="glass-card"
                style={{
                    width: '100%',
                    maxWidth: '860px',
                    maxHeight: '90vh',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'cartModalIn .25s cubic-bezier(.4,0,.2,1)',
                }}
            >
                {/* ── Modal header ──────────────────────────────── */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1.25rem 1.75rem',
                    borderBottom: '1px solid rgba(255,255,255,.1)',
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                        <Icon name="shoppingCart" size={18} style={{ color: '#fff' }} />
                        <span style={{
                            fontSize: '.65rem', fontWeight: 900, textTransform: 'uppercase',
                            letterSpacing: '3px', color: '#fff'
                        }}>MI CARRITO</span>
                        {cartCount > 0 && (
                            <span style={{
                                width: '22px', height: '22px', borderRadius: '50%',
                                background: '#2563eb', color: '#fff',
                                fontSize: '.6rem', fontWeight: 900,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>{cartCount}</span>
                        )}
                    </div>

                    <button
                        onClick={closeCart}
                        title="Cerrar Carrito"
                        style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: 'rgba(255,255,255,.12)',
                            border: '1px solid rgba(255,255,255,.2)',
                            color: '#fff', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', cursor: 'pointer', transition: 'all .2s',
                            boxShadow: '0 0 15px rgba(255,255,255,0.1)'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.2)'}
                        onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,.12)'}
                    >
                        <Icon name="close" size={16} />
                    </button>
                </div>

                {/* ── Cart body — passes CartContent the two-col layout slot ─ */}
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
                    <CartContent isModal={true} onCheckoutComplete={closeCart} twoColumn={true} />
                </div>
            </div>

            {/* Keyframe injection */}
            <style>{`
                @keyframes cartModalIn {
                    from { opacity: 0; transform: scale(.96) translateY(12px); }
                    to   { opacity: 1; transform: scale(1)  translateY(0); }
                }
                .glass-card {
                    background: rgba(255, 255, 255, 0.05) !important;
                    backdrop-filter: blur(11px) !important;
                    -webkit-backdrop-filter: blur(11px) !important;
                    border: 1px solid rgba(255, 255, 255, 0.3) !important;
                    box-shadow: 
                        0 8px 32px rgba(0, 0, 0, 0.1),
                        inset 0 1px 0 rgba(255, 255, 255, 0.3),
                        inset 0 -1px 0 rgba(255, 255, 255, 0.08),
                        inset 0 0 8px 4px rgba(255, 255, 255, 0.15) !important;
                    position: relative;
                    overflow: hidden;
                }
                .glass-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.7), transparent);
                    z-index: 10;
                }
                .glass-card::after {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; width: 1px; height: 100%;
                    background: linear-gradient(180deg, rgba(255, 255, 255, 0.6), transparent, rgba(255, 255, 255, 0.2));
                    z-index: 10;
                }
            `}</style>
        </div>
    );
};

export default CartModal;
