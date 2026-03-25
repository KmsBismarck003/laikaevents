import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import { ticketAPI, paymentAPI } from '../../services/api';
import Icon from '../../components/Icons';
import './Checkout.css';

const Checkout = () => {
    const { 
        cart, total, serviceFee, discount, finalTotal, 
        appliedCoupon, clearCart, consumeAppliedCoupon 
    } = useCart();

    const ticketItems = React.useMemo(() => cart.filter(item => item.sectionId !== 'MERCH'), [cart]);
    const merchItems = React.useMemo(() => cart.filter(item => item.sectionId === 'MERCH'), [cart]);

    const { user } = useAuth();
    const navigate = useNavigate();
    const { success, error, info } = useNotification();

    const [processing, setProcessing] = useState(false);
    const [formData, setFormData] = useState(() => {
        const saved = localStorage.getItem('checkout_form');
        if (saved) return JSON.parse(saved);
        return {
            nombre: user?.name || '',
            apellidos: '',
            calle: '',
            numeroExterior: '',
            codigoPostal: '',
            colonia: '',
            ciudad: '',
            region: 'México',
            email: user?.email || '',
            telefono: '',
            observaciones: '',
            newsletter: false
        };
    });

    const [step, setStep] = useState(() => {
        const saved = localStorage.getItem('checkout_step');
        return saved ? parseInt(saved) : 1;
    });

    const [shippingMethod, setShippingMethod] = useState('tienda');
    const [shippingCost, setShippingCost] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [cardData, setCardData] = useState({
        number: '',
        name: '',
        expiry: '',
        cvv: ''
    });

    useEffect(() => {
        if (cart.length === 0 && step !== 4) {
            navigate('/cart');
        }
    }, [cart, step, navigate]);

    useEffect(() => {
        if (step < 4) {
            localStorage.setItem('checkout_form', JSON.stringify(formData));
            localStorage.setItem('checkout_step', step.toString());
        }
    }, [formData, step]);

    useEffect(() => {
        const costs = {
            tienda: 0,
            standard: 99,
            recoleccion: 99,
            express: 129
        };
        setShippingCost(costs[shippingMethod] || 0);
    }, [shippingMethod]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleCardChange = (e) => {
        const { name, value } = e.target;
        setCardData(prev => ({ ...prev, [name]: value }));
    };

    const nextStep = () => {
        if (step === 1) {
            if (!formData.nombre || !formData.calle || !formData.codigoPostal || !formData.email) {
                error('Por favor completa los campos obligatorios (*)');
                return;
            }
        }
        setStep(prev => prev + 1);
        window.scrollTo(0, 0);
    };

    const prevStep = () => {
        setStep(prev => prev - 1);
        window.scrollTo(0, 0);
    };

    const handleFinalPayment = async () => {
        if (paymentMethod === 'card' && (!cardData.number || !cardData.cvv)) {
            error('Por favor ingresa los datos de tu tarjeta');
            return;
        }

        setProcessing(true);
        info('Iniciando transacción segura...');

        try {
            // 1. Crear intención de pago en el backend
            const amount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0) + shippingCost;
            const intentResp = await paymentAPI.createIntent({
                amount: amount,
                method: paymentMethod,
                eventId: cart[0]?.eventId // Simplificamos usando el primer evento
            });

            const paymentId = intentResp.payment_id || intentResp.reference;
            
            // 2. Si es tarjeta, simulamos la confirmación del gateway
            if (paymentMethod === 'card') {
                info('Validando con el banco...');
                await new Promise(resolve => setTimeout(resolve, 1500));
                await paymentAPI.confirm(paymentId);
            }

            // 3. Procesar la compra de los tickets
            const purchaseData = {
                items: cart.map(item => ({
                    eventId: item.eventId,
                    quantity: item.quantity,
                    functionId: item.functionId,
                    sectionId: item.sectionId,
                    sectionName: item.sectionName,
                    price: item.price,
                    seatId: item.seatId // Para asegurar que se guarden los asientos
                })),
                paymentMethod: paymentMethod,
                paymentId: paymentId,
                shippingInfo: formData,
                shippingMethod: shippingMethod
            };

            const result = await ticketAPI.purchase(purchaseData);
            
            if (appliedCoupon) await consumeAppliedCoupon();
            
            // Guardamos la referencia de Oxxo si existe para mostrarla en el éxito
            if (paymentMethod === 'oxxo') {
                setCardData(prev => ({ ...prev, lastReference: paymentId }));
            }

            success('¡Transacción completada con éxito!');
            clearCart();
            localStorage.removeItem('checkout_form');
            localStorage.removeItem('checkout_step');
            setStep(4);
        } catch (err) {
            console.error('Error en Checkout:', err);
            error(err.response?.data?.detail || 'Error en el procesamiento del pago.');
        } finally {
            setProcessing(false);
        }
    };

    const grandTotal = finalTotal + shippingCost;

    const renderStep1 = () => (
        <div className="checkout-step animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="step-title" style={{ color: '#ffffff', opacity: 1 }}>1. ¿PARA QUIÉN ES EL PEDIDO?</h2>
            <div className="checkout-form">
                <div className="form-row">
                    <div className="form-group">
                        <label style={{ color: '#ffffff', opacity: 1 }}>Nombre *</label>
                        <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} placeholder="Nombre" />
                    </div>
                    <div className="form-group">
                        <label style={{ color: '#ffffff', opacity: 1 }}>Apellidos *</label>
                        <input type="text" name="apellidos" value={formData.apellidos} onChange={handleInputChange} placeholder="Apellidos" />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group flex-[2]">
                        <label style={{ color: '#ffffff', opacity: 1 }}>Calle o cerrada *</label>
                        <input type="text" name="calle" value={formData.calle} onChange={handleInputChange} placeholder="Calle o cerrada" />
                    </div>
                    <div className="form-group flex-1">
                        <label style={{ color: '#ffffff', opacity: 1 }}>Número exterior *</label>
                        <input type="text" name="numeroExterior" value={formData.numeroExterior} onChange={handleInputChange} placeholder="Número exterior" />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label style={{ color: '#ffffff', opacity: 1 }}>Código Postal *</label>
                        <input type="text" name="codigoPostal" value={formData.codigoPostal} onChange={handleInputChange} placeholder="Código Postal" />
                    </div>
                    <div className="form-group">
                        <label style={{ color: '#ffffff', opacity: 1 }}>Colonia *</label>
                        <input type="text" name="colonia" value={formData.colonia} onChange={handleInputChange} placeholder="Colonia" />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label style={{ color: '#ffffff', opacity: 1 }}>Ciudad *</label>
                        <input type="text" name="ciudad" value={formData.ciudad} onChange={handleInputChange} placeholder="Ciudad" />
                    </div>
                    <div className="form-group">
                        <label style={{ color: '#ffffff', opacity: 1 }}>Región *</label>
                        <select name="region" value={formData.region} onChange={handleInputChange}>
                            <option value="México">México</option>
                            {/* More regions if needed */}
                        </select>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group flex-1">
                        <label style={{ color: '#ffffff', opacity: 1 }}>Correo electrónico *</label>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Correo electrónico" />
                    </div>
                    <div className="form-group flex-1">
                        <label style={{ color: '#ffffff', opacity: 1 }}>Número de teléfono *</label>
                        <div className="phone-input">
                            <span className="prefix">+52</span>
                            <input type="tel" name="telefono" value={formData.telefono} onChange={handleInputChange} placeholder="Número de teléfono" />
                        </div>
                    </div>
                </div>
                <div className="form-group">
                    <label style={{ color: '#ffffff', opacity: 1 }}>Observaciones para la entrega (opcional)</label>
                    <textarea name="observaciones" value={formData.observaciones} onChange={handleInputChange} placeholder="Observaciones para la entrega"></textarea>
                </div>
                <div className="form-checkbox">
                    <input type="checkbox" id="newsletter" name="newsletter" checked={formData.newsletter} onChange={handleInputChange} />
                    <label htmlFor="newsletter" style={{ color: '#ffffff', opacity: 1 }}>Quiero suscribirme al Newsletter</label>
                </div>
                <button className="primary-btn mt-8" onClick={nextStep}>GUARDAR Y CONTINUAR</button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="checkout-step animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="step-header">
                <h2 className="step-title" style={{ color: '#ffffff', opacity: 1 }}>1. DATOS DE FACTURACIÓN</h2>
                <button className="text-blue-500 text-xs font-bold uppercase" onClick={() => setStep(1)}>CAMBIAR</button>
            </div>
            <div className="summary-data mb-12">
                <p className="font-bold">{formData.nombre} {formData.apellidos}</p>
                <p className="uppercase text-xs">{formData.calle}, {formData.numeroExterior}, {formData.colonia}, {formData.codigoPostal}</p>
                <p className="uppercase text-xs">{formData.ciudad}, {formData.region}</p>
                <p className="text-xs">{formData.email}</p>
                <p className="text-xs">{formData.telefono}</p>
            </div>

            <h2 className="step-title" style={{ color: '#ffffff', opacity: 1 }}>2. ¿CÓMO QUIERES RECIBIR EL PEDIDO?</h2>
            <div className="method-list">
                {[
                    { id: 'tienda', title: 'Entrega a tienda', icon: 'home', cost: 0, costLabel: 'GRATIS' },
                    { id: 'standard', title: 'Envío estándar', icon: 'truck', cost: 99, costLabel: '$99.00' },
                    { id: 'recoleccion', title: 'Punto de recolección', icon: 'mapPin', cost: 99, costLabel: '$99.00' },
                    { id: 'express', title: 'Envío express', icon: 'zap', cost: 129, costLabel: '$129.00' }
                ].map(method => (
                    <div 
                        key={method.id} 
                        className={`method-card ${shippingMethod === method.id ? 'active' : ''}`}
                        onClick={() => setShippingMethod(method.id)}
                    >
                        <div className="radio-circle"></div>
                        <Icon name={method.icon} size={20} />
                        <span className="flex-1 font-bold">{method.title}</span>
                        <span className={`cost ${method.cost === 0 ? 'text-success' : ''}`}>{method.costLabel}</span>
                    </div>
                ))}
            </div>
            <div className="checkout-actions">
                <button className="secondary-btn" style={{ color: '#ffffff', opacity: 1 }} onClick={prevStep}>VOLVER</button>
                <button className="primary-btn" onClick={nextStep}>CONTINUAR AL PAGO</button>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="checkout-step animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="step-header">
                <h2 className="step-title" style={{ color: '#ffffff', opacity: 1 }}>1. DATOS DE FACTURACIÓN</h2>
                <button className="text-blue-500 text-xs font-bold uppercase" onClick={() => setStep(1)}>CAMBIAR</button>
            </div>
            <div className="summary-data mb-6" style={{ background: '#0c0c0e', borderColor: '#27272a' }}>
                <p className="text-xs uppercase font-bold" style={{ color: '#ffffff' }}>{formData.nombre} {formData.apellidos}</p>
            </div>

            <div className="step-header">
                <h2 className="step-title" style={{ color: '#ffffff', opacity: 1 }}>2. MÉTODO DE ENVÍO</h2>
                <button className="text-blue-500 text-xs font-bold uppercase" onClick={() => setStep(2)}>CAMBIAR</button>
            </div>
            <div className="summary-data mb-12" style={{ background: '#0c0c0e', borderColor: '#27272a' }}>
                <p className="text-xs uppercase font-bold" style={{ color: '#ffffff' }}>{shippingMethod === 'tienda' ? 'Entrega a tienda' : shippingMethod === 'express' ? 'Envío Express' : 'Envío Estándar'}</p>
            </div>

            <h2 className="step-title" style={{ color: '#ffffff', opacity: 1 }}>3. ¿CÓMO QUIERES PAGAR?</h2>
            <div className="method-list">
                <div 
                    className={`method-card h-auto py-6 ${paymentMethod === 'card' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('card')}
                >
                    <div className="radio-circle"></div>
                    <div className="flex-1">
                        <span className="font-bold block mb-1">Con tarjeta de crédito o débito</span>
                        <div className="flex gap-2 items-center">
                             {/* SVGs Inline para máxima fidelidad */}
                             <svg width="30" height="20" viewBox="0 0 30 20"><rect width="30" height="20" rx="3" fill="#1A1F71"/><path d="M11 13l1-5h2l-1 5h-2zm7-5c-.6 0-1 .2-1.3.6l-.2-.5h-1.6l1.2 5h1.8l.2-1.3h2l.1 1.3h1.8l-.8-5h-1.3zm.2 1.3h-.7l.2 1.3h.6l-.1-1.3z" fill="white"/></svg>
                             <svg width="30" height="20" viewBox="0 0 30 20"><rect width="30" height="20" rx="3" fill="#EB001B"/><circle cx="12" cy="10" r="7" fill="#EB001B"/><circle cx="18" cy="10" r="7" fill="#F79E1B" fillOpacity="0.8"/></svg>
                        </div>
                    </div>
                </div>

                {paymentMethod === 'card' && (
                    <div className="card-form animate-in fade-in slide-in-from-top-2 duration-300 p-6 bg-secondary/5 border border-white/10 rounded-lg mt-2 mb-4">
                        <div className="form-group mb-4">
                            <label>Número de Tarjeta</label>
                            <input type="text" name="number" value={cardData.number} onChange={handleCardChange} placeholder="0000 0000 0000 0000" maxLength="16" />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Vencimiento</label>
                                <input type="text" name="expiry" value={cardData.expiry} onChange={handleCardChange} placeholder="MM/YY" maxLength="5" />
                            </div>
                            <div className="form-group">
                                <label>CVV</label>
                                <input type="password" name="cvv" value={cardData.cvv} onChange={handleCardChange} placeholder="123" maxLength="3" />
                            </div>
                        </div>
                    </div>
                )}

                <div 
                    className={`method-card h-auto py-6 ${paymentMethod === 'aplazo' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('aplazo')}
                >
                    <div className="radio-circle"></div>
                    <div className="flex-1">
                        <span className="font-bold block mb-1">A meses con Aplazo</span>
                        <p className="text-[10px]">Compra ahora y paga en 5 plazos quincenales. Sin tarjeta.</p>
                    </div>
                    <div className="text-right">
                        <div className="font-black text-sm">aplazo</div>
                        <div className="text-[8px] flex items-center justify-end gap-1">Más info <Icon name="info" size={10} /></div>
                    </div>
                </div>

                <div 
                    className={`method-card h-auto py-6 ${paymentMethod === 'oxxo' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('oxxo')}
                >
                    <div className="radio-circle"></div>
                    <div className="flex-1">
                        <span className="font-bold block mb-1">En efectivo con Oxxo</span>
                        <p className="text-[10px]">Recuerda que tienes 24 horas para realizar el pago.</p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <div className="px-2 py-1 bg-red-600 rounded text-white font-black text-[10px]">OXXO</div>
                        <span className="px-2 py-0.5 bg-blue-600 text-[10px] font-black italic rounded text-white">PAY</span>
                    </div>
                </div>

                <div 
                    className={`method-card h-auto py-6 ${paymentMethod === 'cash' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('cash')}
                >
                    <div className="radio-circle"></div>
                    <div className="flex-1">
                        <span className="font-bold block mb-1">En efectivo</span>
                        <p className="text-[10px]">Recuerda que tienes 24 horas para realizar el pago.</p>
                    </div>
                    <div className="flex gap-3 items-center">
                         <img src="https://iconape.com/wp-content/png_logo_vector/farmacias-del-ahorro-logo.png" alt="FA" className="h-5 brightness-0 invert" />
                         <img src="https://www.vectorlogo.zone/logos/walmart/walmart-ar21.svg" alt="Walmart" className="h-4" />
                    </div>
                </div>
            </div>
            <div className="checkout-actions">
                <button 
                    className="secondary-btn disabled:opacity-30" 
                    style={{ color: '#ffffff', opacity: 1 }}
                    onClick={prevStep}
                    disabled={processing}
                >
                    VOLVER
                </button>
                <button 
                    className={`primary-btn ${processing ? 'opacity-50 cursor-not-allowed' : ''}`} 
                    onClick={handleFinalPayment}
                    disabled={processing}
                >
                    {processing ? 'PROCESANDO...' : 'CONTINUAR CON EL PAGO'}
                </button>
            </div>
        </div>
    );

    const renderSuccess = () => (
        <div className="success-step py-20 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/30">
                <Icon name="check" size={40} />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4" style={{ color: '#ffffff' }}>¡GRACIAS POR TU COMPRA!</h2>
            <div className="max-w-sm mx-auto mb-12 space-y-4">
                <p>Tu orden ha sido procesada exitosamente.</p>
                {paymentMethod === 'oxxo' && (
                    <div className="p-6 bg-orange-500/10 border border-orange-500/30 rounded-lg text-left animate-in fade-in zoom-in duration-500">
                        <p className="text-[10px] font-black text-orange-500 uppercase mb-2 tracking-widest">Instrucciones de Pago Oxxo Pay</p>
                        <p className="text-xl font-black font-mono tracking-tighter text-white">REF: {cardData.lastReference || 'Generando...'}</p>
                        <div className="mt-4 border-t border-orange-500/20 pt-4">
                            <p className="text-[10px] opacity-80 leading-relaxed">
                                1. Acude a cualquier OXXO.<br/>
                                2. Indica que vas a realizar un pago de **OXXO Pay**.<br/>
                                3. Dicta la referencia de arriba y paga en efectivo.<br/>
                                4. Tu reserva se confirmará automáticamente.
                            </p>
                        </div>
                    </div>
                )}
                <p className="text-xs opacity-50">Recibirás un correo con la confirmación de tu pedido y los detalles para el acceso.</p>
            </div>
            <button className="primary-btn max-w-xs mx-auto" onClick={() => navigate('/')}>VOLVER AL INICIO</button>
        </div>
    );

    return (
        <div className="checkout-page-container">
            <header className="checkout-main-header">
                <div className="steps-indicator">
                    <span className={step >= 1 ? 'active' : ''} style={{ color: '#ffffff', opacity: 1 }}>DATOS</span>
                    <Icon name="chevronRight" size={14} />
                    <span className={step >= 2 ? 'active' : ''} style={{ color: '#ffffff', opacity: 1 }}>ENVÍO</span>
                    <Icon name="chevronRight" size={14} />
                    <span className={step >= 3 ? 'active' : ''} style={{ color: '#ffffff', opacity: 1 }}>PAGO</span>
                </div>
            </header>

            <div className="checkout-layout">
                <main className="checkout-main-content">
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    {step === 4 && renderSuccess()}
                </main>

                {step < 4 && (
                    <aside className="checkout-summary-sidebar">
                        <div className="order-summary-card">
                            <header className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-black uppercase">Pedido</h3>
                                <span className="text-[10px] uppercase">{cart.length} productos</span>
                            </header>

                            <div className="summary-items scrollbar-hide">
                                {ticketItems.length > 0 && (
                                    <div className="summary-group-section">
                                        <h4 className="flex items-center gap-2 text-[9px] font-black text-blue-500 uppercase tracking-widest mb-3 border-b border-blue-500/20 pb-1">
                                            <Icon name="ticket" size={10} /> Boletos
                                        </h4>
                                        {ticketItems.map(item => (
                                            <div key={`${item.eventId}-${item.sectionId}-${item.functionId}`} className="summary-item">
                                                <div className="item-img">
                                                    <img src={item.image} alt={item.eventName} />
                                                </div>
                                                <div className="item-details">
                                                    <h4 className="text-[11px] font-black uppercase leading-none mb-2">{item.eventName}</h4>
                                                    <div className="item-meta text-[9px] uppercase space-y-1">
                                                        <p>Sección: {item.sectionName || 'GENERAL'}</p>
                                                        {item.functionDate && <p>Fecha: {item.functionDate}</p>}
                                                        <p>Cant: {item.quantity}</p>
                                                    </div>
                                                </div>
                                                <div className="item-price text-[11px] font-black">
                                                    ${(item.price * item.quantity).toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {merchItems.length > 0 && (
                                    <div className="summary-group-section mt-4">
                                        <h4 className="flex items-center gap-2 text-[9px] font-black text-white uppercase tracking-widest mb-3 border-b border-white/10 pb-1">
                                            <Icon name="shoppingBag" size={10} /> Artículos
                                        </h4>
                                        {merchItems.map(item => (
                                            <div key={`${item.eventId}-${item.sectionId}-${item.functionId}`} className="summary-item">
                                                <div className="item-img">
                                                    <img src={item.image} alt={item.eventName} />
                                                </div>
                                                <div className="item-details">
                                                    <h4 className="text-[11px] font-black uppercase leading-none mb-2">{item.eventName}</h4>
                                                    <div className="item-meta text-[9px] uppercase space-y-1">
                                                        <p>Detalle: {item.sectionName?.replace('MERCH: ', '') || 'PRODUCTO'}</p>
                                                        <p>Cant: {item.quantity}</p>
                                                    </div>
                                                </div>
                                                <div className="item-price text-[11px] font-black">
                                                    ${(item.price * item.quantity).toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="summary-totals">
                                <div className="total-row">
                                    <span>Subtotal</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                                <div className="total-row">
                                    <span>Comisión de Servicio</span>
                                    <span>${serviceFee.toFixed(2)}</span>
                                </div>
                                <div className="total-row">
                                    <span>Envío</span>
                                    <span>${shippingCost.toFixed(2)}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="total-row text-green-500 font-bold">
                                        <span>Descuento aplicado</span>
                                        <span>-${discount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="grand-total-row">
                                    <span>TOTAL</span>
                                    <div className="text-right">
                                        <div className="price">${grandTotal.toFixed(2)}</div>
                                        <div className="iva">IVA incluido</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
};

export default Checkout;
