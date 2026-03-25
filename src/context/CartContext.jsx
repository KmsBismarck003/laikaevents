import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNotification } from './NotificationContext';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
    return useContext(CartContext);
};

// Service fee percentage (configurable)
const SERVICE_FEE_PERCENT = 10;

// Helper functions for user-scoped localStorage keys
const getCartKey = (user) => user ? `cart_${user.id}` : 'cart_guest';
const getCardsKey = (user) => user ? `savedCards_${user.id}` : 'savedCards_guest';

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [total, setTotal] = useState(0);
    const [savedCards, setSavedCards] = useState([]);
    const { success, info } = useNotification();
    const { user } = useAuth();

    // Coupon state
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [discount, setDiscount] = useState(0);
    const [serviceFee, setServiceFee] = useState(0);

    // Global Cart Visibility State
    const [isCartOpen, setIsCartOpen] = useState(false);

    const openCart = useCallback(() => setIsCartOpen(true), []);
    const closeCart = useCallback(() => setIsCartOpen(false), []);
    const toggleCart = useCallback(() => setIsCartOpen(prev => !prev), []);

    // Cargar carrito y tarjetas guardadas desde LocalStorage cuando el usuario cambia
    useEffect(() => {
        const cartKey = getCartKey(user);
        const cardsKey = getCardsKey(user);

        const storedCart = localStorage.getItem(cartKey);
        const storedCards = localStorage.getItem(cardsKey);

        if (storedCart) {
            try {
                setCart(JSON.parse(storedCart));
            } catch (e) {
                console.error("Error cargando carrito", e);
                setCart([]);
            }
        } else {
            setCart([]);
        }

        if (storedCards) {
            try {
                setSavedCards(JSON.parse(storedCards));
            } catch (e) {
                console.error("Error cargando tarjetas guardadas", e);
                setSavedCards([]);
            }
        } else {
            setSavedCards([]);
        }

        // Limpiar cupón al cambiar de usuario
        setAppliedCoupon(null);
        setDiscount(0);
    }, [user]);

    // Guardar carrito en LocalStorage cuando cambia y recalcular total
    useEffect(() => {
        const cartKey = getCartKey(user);
        localStorage.setItem(cartKey, JSON.stringify(cart));

        // Recalcular subtotal
        const newTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        setTotal(newTotal);

        // Recalcular service fee
        const fee = Math.round(newTotal * (SERVICE_FEE_PERCENT / 100) * 100) / 100;
        setServiceFee(fee);
    }, [cart, user]);

    // Guardar tarjetas en LocalStorage cuando cambien
    useEffect(() => {
        const cardsKey = getCardsKey(user);
        localStorage.setItem(cardsKey, JSON.stringify(savedCards));
    }, [savedCards, user]);

    // Load available coupons when user logs in
    useEffect(() => {
        if (user) {
            loadCoupons();
        } else {
            setAvailableCoupons([]);
            setAppliedCoupon(null);
            setDiscount(0);
        }
    }, [user]);

    const loadCoupons = useCallback(async () => {
        try {
            const { achievementsAPI } = await import('../services/api');
            const coupons = await achievementsAPI.getCoupons();
            setAvailableCoupons(Array.isArray(coupons) ? coupons : []);
        } catch (e) {
            // Fail silently - achievements module might not be available
            setAvailableCoupons([]);
        }
    }, []);

    const applyCoupon = useCallback(async (couponCode) => {
        if (total <= 0) return;

        try {
            const { achievementsAPI } = await import('../services/api');
            const result = await achievementsAPI.validateCoupon(couponCode, total, SERVICE_FEE_PERCENT);

            if (result.valid) {
                setAppliedCoupon({
                    code: couponCode,
                    ...result
                });
                setDiscount(result.discount);
                success('Cupon aplicado exitosamente');
            }
        } catch (e) {
            console.error('Error applying coupon:', e);
            setAppliedCoupon(null);
            setDiscount(0);
        }
    }, [total, success]);

    const removeCoupon = useCallback(() => {
        setAppliedCoupon(null);
        setDiscount(0);
    }, []);

    const consumeAppliedCoupon = useCallback(async () => {
        if (!appliedCoupon) return;
        try {
            const { achievementsAPI } = await import('../services/api');
            await achievementsAPI.consumeCoupon(appliedCoupon.code, total, SERVICE_FEE_PERCENT);
        } catch (e) {
            // Non-critical, log and continue
            console.error('Error consuming coupon:', e);
        }
    }, [appliedCoupon, total]);

    const addToCart = (event, quantity = 1, functionData = null, sectionData = null) => {
        setCart(prevCart => {
            const functionId = functionData ? functionData.id : null;
            const sectionId = sectionData ? sectionData.id : null;
            const existingItem = prevCart.find(item =>
                item.eventId === event.id && item.functionId === functionId && item.sectionId === sectionId
            );

            // Determinar si devolvemos el mapping o creamos nuevo
            if (existingItem) {
                info(`Se actualizó la cantidad de boletos para ${event.name}`);
                return prevCart.map(item =>
                    (item.eventId === event.id && item.functionId === functionId && item.sectionId === sectionId)
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                success(`Boletos para ${event.name} agregados al carrito`);
                return [...prevCart, {
                    eventId: event.id,
                    functionId: functionId,
                    sectionId: sectionId,
                    eventName: event.name,
                    sectionName: sectionData ? sectionData.name : null,
                    functionDate: functionData ? functionData.date : null,
                    functionTime: functionData ? functionData.time : null,
                    venueName: functionData ? functionData.venue_name : null, // Store venue for display
                    price: sectionData ? parseFloat(sectionData.price) : parseFloat(event.price),
                    quantity,
                    image: event.image_url || event.image
                }];
            }
        });
        // Clear coupon when cart changes
        removeCoupon();
    };

    const removeFromCart = (eventId, functionId = null, sectionId = null) => {
        setCart(prevCart => prevCart.filter(item => !(item.eventId === eventId && item.functionId === functionId && item.sectionId === sectionId)));
        removeCoupon();
    };

    const updateQuantity = (eventId, newQuantity, functionId = null, sectionId = null) => {
        if (newQuantity < 1) return;
        setCart(prevCart =>
            prevCart.map(item =>
                (item.eventId === eventId && item.functionId === functionId && item.sectionId === sectionId)
                    ? { ...item, quantity: newQuantity }
                    : item
            )
        );
        removeCoupon();
    };

    const clearCart = () => {
        setCart([]);
        removeCoupon();
    };

    const addCard = (card) => {
        const newCard = {
            id: Date.now(),
            number: `**** **** **** ${card.number.slice(-4)}`,
            holder: card.holder,
            expiry: card.expiry,
            type: 'visa'
        };
        setSavedCards(prev => [...prev, newCard]);
    };

    const removeCard = (cardId) => {
        setSavedCards(prev => prev.filter(c => c.id !== cardId));
    };

    const finalTotal = Math.max(0, total + serviceFee - discount);

    return (
        <CartContext.Provider value={{
            cart,
            total,
            savedCards,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            addCard,
            removeCard,
            cartCount: cart.reduce((acc, item) => acc + item.quantity, 0),

            // Coupon & fee state
            serviceFee,
            serviceFeePercent: SERVICE_FEE_PERCENT,
            availableCoupons,
            appliedCoupon,
            discount,
            finalTotal,
            applyCoupon,
            removeCoupon,
            consumeAppliedCoupon,
            loadCoupons,

            // Cart Visibility
            isCartOpen,
            openCart,
            closeCart,
            toggleCart
        }}>
            {children}
        </CartContext.Provider>
    );
};
