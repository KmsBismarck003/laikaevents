import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { ticketAPI } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const UserCart = () => {
    const {
        cart, total, removeFromCart, updateQuantity, clearCart,
        savedCards, addCard,
        // Coupon & fee
        serviceFee, serviceFeePercent, availableCoupons,
        appliedCoupon, discount, finalTotal,
        applyCoupon, removeCoupon, consumeAppliedCoupon
    } = useCart();
    const { success, error } = useNotification();
    const navigate = useNavigate();
    const [processing, setProcessing] = useState(false);

    // Payment method state
    const [paymentMethod, setPaymentMethod] = useState('new_card');
    const [newCard, setNewCard] = useState({ number: '', holder: '', expiry: '', cvv: '' });
    const [saveCard, setSaveCard] = useState(false);

    // Coupon input state
    const [showCouponSelector, setShowCouponSelector] = useState(false);

    const handleInputChange = (e) => {
        setNewCard({ ...newCard, [e.target.name]: e.target.value });
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        setProcessing(true);
        try {
            if (paymentMethod === 'new_card') {
                if (!newCard.number || !newCard.holder || !newCard.expiry || !newCard.cvv) {
                    throw new Error("Por favor completa los datos de la tarjeta");
                }
                if (saveCard) {
                    addCard(newCard);
                }
            }

            const purchaseData = {
                items: cart.map(item => ({
                    eventId: item.eventId,
                    quantity: item.quantity,
                    functionId: item.functionId
                })),
                paymentMethod: paymentMethod === 'new_card' ? 'credit_card' : 'saved_card'
            };

            await ticketAPI.purchase(purchaseData);

            // Consume coupon after successful purchase
            if (appliedCoupon) {
                await consumeAppliedCoupon();
            }

            success('Compra realizada con exito! Tus boletos han sido generados.');
            clearCart();
            navigate('/user/tickets');

        } catch (err) {
            console.error("Error en checkout", err);
            error(err.message || 'Error al procesar la compra. Intentalo de nuevo.');
        } finally {
            setProcessing(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="text-center p-8">
                <h3>Tu carrito esta vacio 🛒</h3>
                <p className="mb-4">Parece que aun no has agregado boletos.</p>
                <button onClick={() => navigate('/')} className="btn-primary" style={{ padding: '10px 20px', background: '#6c5ce7', color: 'white', borderRadius: '8px', border: 'none' }}>
                    Ver Eventos
                </button>
            </div>
        );
    }

    return (
        <div className="user-cart">
            <h2 className="mb-4">Mi Carrito 🛒</h2>

            <div className="cart-content" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div className="cart-left-column">
                    <div className="cart-items mb-4">
                        {cart.map(item => (
                            <div key={item.eventId} className="cart-item user-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: 60, height: 60, background: '#dfe6e9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎫</div>
                                    <div>
                                        <h4>{item.eventName}</h4>
                                        <p className="text-sm text-gray-500">${item.price} x boleto</p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div className="quantity-controls" style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 4 }}>
                                        <button onClick={() => updateQuantity(item.eventId, item.quantity - 1)} style={{ padding: '5px 10px', border: 'none', background: 'none', cursor: 'pointer' }}>-</button>
                                        <span style={{ padding: '0 10px' }}>{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.eventId, item.quantity + 1)} style={{ padding: '5px 10px', border: 'none', background: 'none', cursor: 'pointer' }}>+</button>
                                    </div>
                                    <span style={{ fontWeight: 'bold' }}>${(item.price * item.quantity).toFixed(2)}</span>
                                    <button onClick={() => removeFromCart(item.eventId)} style={{ color: '#d63031', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* PAYMENT SECTION */}
                    <div className="payment-section user-card" style={{ padding: '1.5rem' }}>
                        <h3 className="mb-3">Metodo de Pago 💳</h3>

                        {savedCards.length > 0 && (
                            <div className="saved-cards mb-4">
                                <h4>Tarjetas Guardadas</h4>
                                {savedCards.map(card => (
                                    <div key={card.id} className="payment-option" style={{ margin: '0.5rem 0' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name="payment"
                                                value={card.id}
                                                checked={paymentMethod === String(card.id)}
                                                onChange={() => setPaymentMethod(String(card.id))}
                                            />
                                            <span>💳 {card.type.toUpperCase()} terminada en {card.number.slice(-4)}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="new-card-option">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '1rem' }}>
                                <input
                                    type="radio"
                                    name="payment"
                                    value="new_card"
                                    checked={paymentMethod === 'new_card'}
                                    onChange={() => setPaymentMethod('new_card')}
                                />
                                <span style={{ fontWeight: 'bold' }}>➕ Usar nueva tarjeta</span>
                            </label>

                            {paymentMethod === 'new_card' && (
                                <div className="new-card-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Numero de Tarjeta</label>
                                        <input type="text" name="number" placeholder="0000 0000 0000 0000" value={newCard.number} onChange={handleInputChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Titular</label>
                                        <input type="text" name="holder" placeholder="Nombre como aparece" value={newCard.holder} onChange={handleInputChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Exp</label>
                                            <input type="text" name="expiry" placeholder="MM/YY" value={newCard.expiry} onChange={handleInputChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>CVV</label>
                                            <input type="text" name="cvv" placeholder="123" value={newCard.cvv} onChange={handleInputChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                                        </div>
                                    </div>

                                    <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                            <input type="checkbox" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} />
                                            Guardar esta tarjeta para futuras compras
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ORDER SUMMARY WITH FEE + COUPON */}
                <div className="cart-summary user-card" style={{ height: 'fit-content', padding: '1.5rem' }}>
                    <h3 className="mb-3">Resumen de Compra</h3>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span>Subtotal</span>
                        <span>${total.toFixed(2)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', color: '#636e72' }}>
                        <span>Cargo por servicio ({serviceFeePercent}%)</span>
                        <span>${serviceFee.toFixed(2)}</span>
                    </div>

                    {/* Applied Coupon */}
                    {appliedCoupon && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', color: '#00b894' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                🏷️ Cupon
                                <button onClick={removeCoupon} style={{ background: 'none', border: 'none', color: '#d63031', cursor: 'pointer', fontSize: '0.8rem', padding: '0 4px' }}>✕</button>
                            </span>
                            <span>-${discount.toFixed(2)}</span>
                        </div>
                    )}

                    <hr style={{ margin: '1rem 0', borderTop: '1px solid #eee' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 'bold', fontSize: '1.2rem' }}>
                        <span>Total</span>
                        <span>${finalTotal.toFixed(2)}</span>
                    </div>

                    {/* Coupon Selector */}
                    {!appliedCoupon && (
                        <div style={{ marginBottom: '1rem' }}>
                            <button
                                onClick={() => setShowCouponSelector(!showCouponSelector)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    background: 'none',
                                    border: '1px dashed #636e72',
                                    borderRadius: '6px',
                                    color: '#636e72',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                🏷️ {showCouponSelector ? 'Ocultar cupones' : 'Tengo un cupon'}
                            </button>

                            {showCouponSelector && (
                                <div style={{ marginTop: '0.75rem' }}>
                                    {availableCoupons.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {availableCoupons.map(coupon => (
                                                <button
                                                    key={coupon.id}
                                                    onClick={() => applyCoupon(coupon.coupon_code)}
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '8px 12px',
                                                        background: 'rgba(102, 126, 234, 0.08)',
                                                        border: '1px solid rgba(102, 126, 234, 0.2)',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        textAlign: 'left',
                                                        width: '100%'
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#667eea' }}>
                                                            {coupon.achievement_name || 'LAIKA Club'}
                                                        </div>
                                                        <div style={{ fontSize: '0.7rem', color: '#636e72', fontFamily: 'monospace' }}>
                                                            {coupon.coupon_code}
                                                        </div>
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem', color: '#00b894', fontWeight: '600' }}>Aplicar</span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={{ fontSize: '0.8rem', color: '#636e72', textAlign: 'center', margin: '0.5rem 0' }}>
                                            No tienes cupones disponibles. Desbloquea logros para obtenerlos. 🏆
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={handleCheckout}
                        disabled={processing}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#00b894',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            opacity: processing ? 0.7 : 1
                        }}
                    >
                        {processing ? 'Procesando...' : `Pagar $${finalTotal.toFixed(2)}`}
                    </button>
                    <p className="text-center text-sm text-gray-500 mt-2">Pagos seguros encriptados</p>
                </div>
            </div>
        </div>
    );
};

export default UserCart;
