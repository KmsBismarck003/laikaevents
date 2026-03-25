import { Card, AnimatedCounter } from '../../../components';

const StaffStats = ({ history = [] }) => {
    const stats = {
        valid: history.filter(s => s.status === 'valid' || (s.valid && !s.alreadyUsed)).length,
        used: history.filter(s => s.status === 'used' || s.alreadyUsed).length,
        invalid: history.filter(s => s.status === 'invalid' || (!s.valid && !s.alreadyUsed)).length
    };

    return (
        <Card title="Estadísticas de la Sesión" className="stats-card">
            <div className="kpi-grid">
                <div className="kpi-item-staff">
                    <span className="kpi-label">Validados</span>
                    <div className="kpi-value" style={{ color: 'var(--success)' }}>
                        <AnimatedCounter value={stats.valid} />
                    </div>
                </div>
                <div className="kpi-item-staff">
                    <span className="kpi-label">Ya Canjeados</span>
                    <div className="kpi-value" style={{ color: 'var(--warning)' }}>
                        <AnimatedCounter value={stats.used} />
                    </div>
                </div>
                <div className="kpi-item-staff">
                    <span className="kpi-label">Inválidos</span>
                    <div className="kpi-value" style={{ color: 'var(--error)' }}>
                        <AnimatedCounter value={stats.invalid} />
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default StaffStats;
