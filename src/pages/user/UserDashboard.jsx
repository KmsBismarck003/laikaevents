import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ticketAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalTickets: 0,
        upcomingEvents: 0,
        completedEvents: 0
    });
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const tickets = await ticketAPI.getMyTickets();

                const now = new Date();
                const upcoming = tickets.filter(t => new Date(t.date) > now && t.status === 'active');
                const completed = tickets.filter(t => new Date(t.date) <= now || t.status === 'used');

                setStats({
                    totalTickets: tickets.length,
                    upcomingEvents: upcoming.length,
                    completedEvents: completed.length
                });

                // Calcular logros (lógica migrada de UserProfile)
                const newAchievements = [
                    {
                        id: 1,
                        name: 'Primer Evento',
                        description: 'Asististe a tu primer evento',
                        icon: '🎉',
                        unlocked: tickets.length > 0
                    },
                    {
                        id: 2,
                        name: 'Fan de la Música',
                        description: 'Asiste a 5 conciertos',
                        icon: '🎵',
                        unlocked: tickets.length >= 5
                    },
                    {
                        id: 4,
                        name: 'VIP',
                        description: 'Compra 10 boletos en total',
                        icon: '⭐',
                        unlocked: tickets.length >= 10
                    }
                ];
                setAchievements(newAchievements);

            } catch (error) {
                console.error("Error fetching dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="p-4">Cargando dashboard...</div>;

    return (
        <div className="user-dashboard">
            <h2 className="mb-4">Hola, {user?.firstName}! 👋</h2>

            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="user-card" style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)', color: 'white' }}>
                    <h3>{stats.totalTickets}</h3>
                    <p>Boletos Totales</p>
                </div>
                <div className="user-card" style={{ background: 'linear-gradient(135deg, #00b894, #55efc4)', color: 'white' }}>
                    <h3>{stats.upcomingEvents}</h3>
                    <p>Próximos Eventos</p>
                </div>
                <div className="user-card" style={{ background: 'linear-gradient(135deg, #fdcb6e, #ffeaa7)', color: '#2d3436' }}>
                    <h3>{stats.completedEvents}</h3>
                    <p>Eventos Asistidos</p>
                </div>
            </div>

            <h3 className="mb-3">Mis Logros 🏆</h3>
            <div className="achievements-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                {achievements.map(ach => (
                    <div
                        key={ach.id}
                        className={`user-card achievement ${ach.unlocked ? 'unlocked' : 'locked'}`}
                        style={{
                            opacity: ach.unlocked ? 1 : 0.6,
                            borderLeft: ach.unlocked ? '4px solid #00b894' : '4px solid #dfe6e9',
                            position: 'relative'
                        }}
                    >
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{ach.icon}</div>
                        <h4>{ach.name}</h4>
                        <p className="text-sm text-gray-600">{ach.description}</p>
                        {ach.unlocked ?
                            <span style={{ position: 'absolute', top: '10px', right: '10px', color: '#00b894' }}>✓</span> :
                            <span style={{ position: 'absolute', top: '10px', right: '10px' }}>🔒</span>
                        }
                    </div>
                ))}
            </div>

            <div className="mt-8 text-center">
                <button
                    onClick={() => navigate('/')}
                    className="btn-primary"
                    style={{ padding: '10px 20px', background: '#6c5ce7', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                >
                    Explorar Más Eventos
                </button>
            </div>
        </div>
    );
};

export default UserDashboard;
