import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icons';
import { PermissionWall } from '../../components';
import TicketPrinterOverlay from './UserCart/TicketPrinterOverlay';
import './UserCart.css';

const UserCart = () => {
    const {
        cart, total, removeFromCart, updateQuantity, clearCart,
        serviceFee, serviceFeePercent, availableCoupons,
        appliedCoupon, discount, finalTotal,
        applyCoupon, removeCoupon, consumeAppliedCoupon
    } = useCart();
    const { success, error } = useNotification();
    const navigate = useNavigate();
    const [processing, setProcessing] = useState(false);

    const [showCouponSelector, setShowCouponSelector] = useState(false);

    // Printer animation states
    const [showPrinter, setShowPrinter] = useState(false);
    const [printingData, setPrintingData] = useState(null);

    const handleCheckout = () => {
        if (cart.length === 0) return;
        navigate('/user/checkout');
    };

    const handlePrintingComplete = () => {
        setShowPrinter(false);
        navigate('/user/tickets');
    };

    if (cart.length === 0 && !showPrinter) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <Icon name="shoppingCart" size={64} className="opacity-10 mb-6" />
                <h3 className="text-xl font-black uppercase tracking-widest mb-2">Tu carrito está vacío</h3>
                <p className="opacity-40 mb-8 max-w-xs text-sm">Parece que aún no has seleccionado ninguna experiencia galáctica.</p>
                <button
                    onClick={() => navigate('/')}
                    className="user-card hover:bg-white hover:text-black hover:tracking-widest transition-all px-8 py-3 text-xs font-black uppercase tracking-widest"
                >
                    Explorar Eventos
                </button>
            </div>
        );
    }

    return (
        <PermissionWall permission="canAccessCart" label="Carrito de Compras">
        <div className="user-cart-page">
            {(cart.length > 0 || showPrinter) && (
                <>
                    <header className="user-cart-header">
                        <h2 className="font-black uppercase tracking-tighter">Mi Carrito</h2>
                        <div className="service-badge">
                            <Icon name="shield" size={12} />
                            Portal Transaccional Seguro
                        </div>
                    </header>

                    <div className="user-cart-grid">
                        <div className="space-y-8">
                            <div className="airy-card">
                                <h3 className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-6 underline decoration-blue-500/20 underline-offset-8">Experiencias Seleccionadas</h3>
                                <div className="divide-y divide-white/5">
                                    {(cart.length > 0 ? cart : [printingData]).filter(Boolean).map(item => (
                                        <div key={item.eventId || 'printing'} className="cart-item-row group">
                                            <div className="item-img-box group-hover:border-blue-500/30 transition-colors overflow-hidden">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.eventName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Icon name="ticket" size={24} />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-md font-black uppercase leading-tight mb-1 group-hover:text-blue-400 transition-colors">
                                                    {item.eventName}
                                                </h4>
                                                <span className="text-[9px] font-bold uppercase py-1 px-2 bg-white/5 border border-white/10 rounded tracking-widest opacity-60">
                                                    {item.sectionName || 'GENERAL'}
                                                </span>
                                            </div>

                                            {cart.length > 0 && (
                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center border border-white/5 rounded-lg overflow-hidden bg-black/40 p-1">
                                                        <button
                                                            onClick={() => updateQuantity(item.eventId, item.quantity - 1, item.functionId, item.sectionId)}
                                                            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 text-white/40 rounded-md transition-all"
                                                        >
                                                            <Icon name="minus" size={10} />
                                                        </button>
                                                        <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.eventId, item.quantity + 1, item.functionId, item.sectionId)}
                                                            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 text-white/40 rounded-md transition-all"
                                                        >
                                                            <Icon name="plus" size={10} />
                                                        </button>
                                                    </div>
                                                    <div className="text-right min-w-[80px]">
                                                        <div className="text-lg font-black tracking-tighter">${(item.price * item.quantity).toFixed(2)}</div>
                                                        <div className="text-[9px] font-bold opacity-30 uppercase">${item.price}/u</div>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFromCart(item.eventId, item.functionId, item.sectionId)}
                                                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-500/10 text-gray-700 hover:text-red-500 transition-all"
                                                    >
                                                        <Icon name="trash2" size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 lg:sticky lg:top-8">
                            <div className="airy-card">
                                <h3 className="text-[10px] font-black uppercase tracking-widest mb-8 opacity-30">Total de la Orden</h3>

                                <div className="space-y-4 text-[10px] font-bold uppercase tracking-wider">
                                    <div className="flex justify-between items-center">
                                        <span className="opacity-40">Tickets Subtotal</span>
                                        <span className="font-black">${total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-blue-400">
                                        <span className="opacity-60 flex items-center gap-2">
                                            <Icon name="shieldCheck" size={12} /> Comisión de Servicio ({serviceFeePercent}%)
                                        </span>
                                        <span className="font-black">+${serviceFee.toFixed(2)}</span>
                                    </div>

                                    {appliedCoupon && (
                                        <div className="flex justify-between text-green-500 bg-green-500/5 p-3 rounded-lg border border-green-500/10">
                                            <span className="flex items-center gap-2 font-black">
                                                <Icon name="tag" size={12} /> DESCUENTO ELITE
                                            </span>
                                            <span className="font-black">-${discount.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center">
                                    <span className="text-[9px] font-black uppercase opacity-30 mb-2 tracking-[3px]">Total Final</span>
                                    <span className="text-5xl font-black tracking-tighter text-white">${finalTotal.toFixed(2)}</span>
                                </div>

                                <div className="mt-8 space-y-4">
                                    {!appliedCoupon && (
                                        <button
                                            onClick={() => setShowCouponSelector(!showCouponSelector)}
                                            className="w-full p-3 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all flex items-center justify-center gap-3"
                                        >
                                            {showCouponSelector ? 'OCULTAR CÓDIGOS' : '¿TIENES UN CÓDIGO ELITE?'}
                                        </button>
                                    )}

                                    {showCouponSelector && (
                                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar animate-in slide-in-from-top-2">
                                            {availableCoupons.map(coupon => (
                                                <button
                                                    key={coupon.id}
                                                    onClick={() => applyCoupon(coupon.coupon_code)}
                                                    className="w-full flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-lg hover:border-blue-500/50 hover:bg-blue-500/10 transition-all"
                                                >
                                                    <div className="text-[9px] font-black tracking-widest uppercase">
                                                        {coupon.coupon_code}
                                                    </div>
                                                    <span className="text-[8px] font-black text-blue-500">APLICAR</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleCheckout}
                                        className="w-full py-5 checkout-btn-glow"
                                    >
                                        <span>CONTINUAR AL PAGO</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <TicketPrinterOverlay
                isOpen={showPrinter}
                isProcessing={processing}
                ticketData={printingData}
                onComplete={handlePrintingComplete}
            />
        </div>
        </PermissionWall>
    );
};

export default UserCart;
