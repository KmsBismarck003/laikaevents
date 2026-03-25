import React from 'react';
import Icon from '../Icons';

const PaymentVoucher = ({ cart, finalTotal, onDone }) => {
    const referenceCode = `LK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    return (
        <div style={{
            background: '#fff',
            color: '#000',
            padding: '2rem',
            borderRadius: '16px',
            maxWidth: '500px',
            margin: '0 auto',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* Header con Logo */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #f0f0f0', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ padding: '8px', background: '#000', borderRadius: '8px' }}>
                        <span style={{ color: '#fff', fontWeight: 900, fontSize: '1.2rem', letterSpacing: '2px' }}>LAIKA</span>
                    </div>
                </div>
                <h2 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Ficha de Pago / Depósito</h2>
            </div>

            {/* Detalles del Evento */}
            <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>Resumen de Compra</p>
                {cart.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{item.quantity}x {item.eventName}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
            </div>

            {/* Datos para Pago */}
            <div style={{ background: '#f9f9f9', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px dashed #ddd' }}>
                <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#666', textTransform: 'uppercase' }}>Referencia de Pago</p>
                    <p style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '2px', color: '#000' }}>{referenceCode}</p>
                </div>
                <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#666', textTransform: 'uppercase' }}>Cuenta Clabe (Transferencia)</p>
                    <p style={{ fontSize: '1rem', fontWeight: 700 }}>012 180 0044 5566 7788</p>
                </div>
                <div>
                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#666', textTransform: 'uppercase' }}>Convenio OXXO PAY</p>
                    <p style={{ fontSize: '1rem', fontWeight: 700 }}>LAIKA-EVENTS-2026</p>
                </div>
            </div>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 950 }}>TOTAL A PAGAR</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 950, color: '#000' }}>${finalTotal.toFixed(2)} MXN</span>
            </div>

            {/* Footer / Instrucciones */}
            <div style={{ fontSize: '0.7rem', color: '#666', lineHeight: '1.4', marginBottom: '2rem' }}>
                <p>• Tienes 24 horas para realizar tu pago, de lo contrario tu reservación será cancelada.</p>
                <p>• Una vez realizado el pago, envía tu comprobante a pagos@laika.com o espera de 2 a 4 horas para la validación automática.</p>
                <p>• Tu boleto digital se generará automáticamente tras la validación.</p>
            </div>

            <button 
                onClick={onDone}
                style={{
                    width: '100%',
                    padding: '1rem',
                    background: '#000',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 900,
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    cursor: 'pointer'
                }}
            >
                ENTENDIDO, VOLVER AL SITIO
            </button>
        </div>
    );
};

export default PaymentVoucher;
