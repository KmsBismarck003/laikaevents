import React from 'react'
import './Skeleton.css'

/**
 * Skeleton - Componente de carga premium estilo "shimmer plateado".
 */

const Skeleton = ({
    type = 'text',
    width,
    height,
    borderRadius,
    className = '',
    style = {}
}) => {
    const baseStyle = {
        width: width || '100%',
        height: height || (type === 'circle' ? '40px' : type === 'text' ? '14px' : '20px'),
        borderRadius: borderRadius || (type === 'circle' ? '50%' : type === 'text' ? '8px' : '10px'),
        ...style
    }
    return <div className={`skeleton ${className}`} style={baseStyle} />
}

// --- Fila de tabla skeleton ---
export const SkeletonRow = ({ columns = 4 }) => (
    <tr className="skeleton-table-row">
        {Array.from({ length: columns }).map((_, i) => (
            <td key={i} style={{ padding: '12px 16px' }}>
                <Skeleton type="text" width={i === 0 ? '80%' : i === columns - 1 ? '55%' : '70%'} />
            </td>
        ))}
    </tr>
)

// --- Sección de sidebar skeleton ---
export const SkeletonSidebarSection = ({ items = 3 }) => (
    <div className="sidebar-section skeleton-sidebar-section">
        <div style={{ padding: '0 1.5rem', marginBottom: '0.5rem' }}>
            <Skeleton type="text" width="55%" height="9px" />
        </div>
        {Array.from({ length: items }).map((_, i) => (
            <div key={i} className="sidebar-link" style={{ pointerEvents: 'none', gap: '12px' }}>
                <span className="sidebar-icon">
                    <Skeleton type="circle" width="20px" height="20px" />
                </span>
                <span className="sidebar-label">
                    <Skeleton type="text" width={`${55 + (i % 3) * 15}%`} />
                </span>
            </div>
        ))}
    </div>
)

export const SkeletonEventCard = () => (
    <div className="skeleton-event-card">
        <Skeleton className="skeleton-event-image" />
        <div className="skeleton-event-content">
            <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                <Skeleton type="text" width="60px" height="12px" />
                <Skeleton type="text" width="40px" height="12px" />
            </div>
            <Skeleton type="text" width="90%" height="20px" style={{ marginBottom: '8px' }} />
            <Skeleton type="text" width="70%" height="14px" />
            <div style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <Skeleton type="text" width="40%" height="12px" />
                <Skeleton type="text" width="30%" height="12px" />
            </div>
        </div>
    </div>
)

// --- Ad/Banner Skeleton ---
export const SkeletonAd = ({ position = 'main' }) => {
    const isVertical = position.startsWith('side')
    return (
        <Skeleton
            className={`skeleton-ad ${isVertical ? 'vertical' : 'horizontal'}`}
            width="100%"
            height={isVertical ? '600px' : '200px'}
        />
    )
}

// --- Tarjeta skeleton genérica ---
export const SkeletonCard = () => (
    <div className="skeleton-card" style={{ padding: '1.25rem', border: 'none', background: '#e5e5ea', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', animation: 'ad-glow-silver 2s infinite ease-in-out' }}>
            <Skeleton type="circle" width="44px" height="44px" />
            <div style={{ flex: 1 }}>
                <Skeleton type="text" width="50%" height="11px" style={{ marginBottom: '10px' }} />
                <Skeleton type="text" width="35%" height="24px" />
            </div>
        </div>
    </div>
)

// --- Navbar header skeleton ---
export const SkeletonNavbar = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <Skeleton type="text" width="200px" height="22px" />
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Skeleton type="circle" width="36px" height="36px" />
            <Skeleton type="circle" width="36px" height="36px" />
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Skeleton type="circle" width="36px" height="36px" />
                <div>
                    <Skeleton type="text" width="80px" height="11px" style={{ marginBottom: '5px' }} />
                    <Skeleton type="text" width="55px" height="10px" />
                </div>
            </div>
        </div>
    </div>
)

// --- Botón de Laika skeleton ---
export const SkeletonLaikaBtn = () => (
    <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1000
    }}>
        <Skeleton
            type="circle"
            width="56px"
            height="56px"
            style={{ boxShadow: '0 0 0 4px rgba(192,192,192,0.2)' }}
        />
    </div>
)

// --- MainLayout Navbar Skeleton (Ticketmaster style) ---
export const SkeletonMainHeader = () => (
    <div className="skeleton-main-header">
        <div className="navbar-top-row">
            <div className="brand-nav-group">
                <Skeleton type="text" width="100px" height="32px" style={{ marginRight: '2rem' }} />
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <Skeleton type="text" width="120px" height="14px" />
                    <Skeleton type="text" width="100px" height="14px" />
                    <Skeleton type="text" width="80px" height="14px" />
                    <Skeleton type="text" width="90px" height="14px" />
                </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <Skeleton type="circle" width="32px" height="32px" />
                <Skeleton type="circle" width="32px" height="32px" />
                <Skeleton type="text" width="80px" height="32px" borderRadius="16px" />
            </div>
        </div>
    </div>
)

// --- Search Bar Row Skeleton ---
export const SkeletonSearchRow = () => (
    <div className="skeleton-search-row">
        <div className="tm-search-block" style={{ background: '#e5e5ea', border: 'none', pointerEvents: 'none' }}>
            <div className="search-section" style={{ flex: 1, padding: '0 1rem' }}>
                <Skeleton type="text" width="40%" height="10px" style={{ marginBottom: '8px' }} />
                <Skeleton type="text" width="80%" height="16px" />
            </div>
            <div className="search-divider" style={{ height: '30px', width: '1px', background: 'rgba(0,0,0,0.1)' }} />
            <div className="search-section" style={{ flex: 1, padding: '0 1rem' }}>
                <Skeleton type="text" width="40%" height="10px" style={{ marginBottom: '8px' }} />
                <Skeleton type="text" width="80%" height="16px" />
            </div>
            <div className="search-divider" style={{ height: '30px', width: '1px', background: 'rgba(0,0,0,0.1)' }} />
            <div className="search-section search-query" style={{ flex: 2, padding: '0 1rem' }}>
                <Skeleton type="text" width="20%" height="10px" style={{ marginBottom: '8px' }} />
                <Skeleton type="text" width="90%" height="16px" />
            </div>
            <div style={{ width: '100px', height: '100%', padding: '8px' }}>
                <Skeleton type="text" width="100%" height="100%" borderRadius="8px" />
            </div>
        </div>
    </div>
)

// --- Hero Banner Skeleton ---
export const SkeletonHero = () => (
    <div className="skeleton-hero">
        <Skeleton width="100%" height="100%" borderRadius="0" />
        <div className="skeleton-hero-content">
            <Skeleton type="text" width="60%" height="48px" style={{ marginBottom: '1.5rem' }} />
            <Skeleton type="text" width="40%" height="20px" />
        </div>
    </div>
)

// --- News Ticker Skeleton ---
export const SkeletonNewsTicker = () => (
    <div className="skeleton-news-ticker">
        <Skeleton width="100%" height="32px" borderRadius="0" />
    </div>
)

// --- Footer Skeleton ---
export const SkeletonFooter = () => (
    <footer className="footer skeleton-footer">
        <div className="footer-container">
            <div className="footer-section">
                <Skeleton width="120px" height="40px" style={{ marginBottom: '16px' }} />
                <Skeleton type="text" width="180px" height="14px" />
            </div>
            <div className="footer-section">
                <Skeleton type="text" width="80px" height="20px" style={{ marginBottom: '20px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Skeleton type="text" width="60%" height="14px" />
                    <Skeleton type="text" width="80%" height="14px" />
                    <Skeleton type="text" width="70%" height="14px" />
                    <Skeleton type="text" width="50%" height="14px" />
                    <Skeleton type="text" width="90%" height="14px" />
                </div>
            </div>
            <div className="footer-section">
                <Skeleton type="text" width="100px" height="20px" style={{ marginBottom: '20px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} type="text" width={`${60 + (i % 3) * 10}%`} height="14px" />
                    ))}
                </div>
            </div>
            <div className="footer-section">
                <Skeleton type="text" width="80px" height="20px" style={{ marginBottom: '20px' }} />
                <div style={{ display: 'flex', gap: '16px' }}>
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} type="circle" width="40px" height="40px" />
                    ))}
                </div>
            </div>
        </div>
        <div className="footer-bottom">
            <Skeleton type="text" width="200px" height="14px" style={{ margin: '0 auto' }} />
        </div>
    </footer>
)

export default Skeleton
