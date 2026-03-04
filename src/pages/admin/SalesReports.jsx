import React, { useState, useEffect } from 'react'
import { Card, Button, Spinner, Alert, Icon } from '../../components'
import api from '../../services/api'
import './admin.css'

const SalesReports = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [salesData, setSalesData] = useState([])
  const [totalRevenue, setTotalRevenue] = useState(0)

  useEffect(() => {
    fetchSalesData()
  }, [])

  const fetchSalesData = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('📤 Obteniendo reporte de ventas...')
      const response = await api.stats.getSalesByEvent()
      console.log('✅ Datos recibidos:', response)
      setSalesData(response)

      // Calcular total general
      const total = response.reduce((sum, item) => sum + (item.revenue || 0), 0)
      setTotalRevenue(total)

    } catch (err) {
      console.error('❌ Error al obtener ventas:', err)
      setError('No se pudo cargar el reporte de ventas. Intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  if (loading) return <Spinner fullScreen text="Generando reporte de ventas..." />

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1>Reporte de Ventas por Evento</h1>
          <p>Desglose financiero y de ocupación</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" onClick={fetchSalesData}>
            <Icon name="refresh" className="mr-2" /> Actualizar
          </Button>
          <Button variant="primary" onClick={() => window.print()}>
            <Icon name="printer" className="mr-2" /> Imprimir
          </Button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Resumen General */}
      <div className="stats-grid mb-4">
        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-icon bg-green">
              <Icon name="dollarSign" size={28} />
            </div>
            <div className="stat-info">
              <p className="stat-label">Ingresos Totales (Global)</p>
              <h2 className="stat-value">{formatCurrency(totalRevenue)}</h2>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Evento</th>
                <th>Fecha</th>
                <th>Capacidad</th>
                <th>Vendidos</th>
                <th>Restantes</th>
                <th>Ocupación</th>
                <th className="text-right">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {salesData.length > 0 ? (
                salesData.map((item) => (
                  <tr key={item.eventId}>
                    <td className="font-medium">{item.eventName}</td>
                    <td>{new Date(item.eventDate).toLocaleDateString()}</td>
                    <td>{item.totalTickets}</td>
                    <td>{item.ticketsSold}</td>
                    <td>
                      <span className={`badge ${item.remainingTickets < 20 ? 'badge-warning' : 'badge-success'}`}>
                        {item.remainingTickets}
                      </span>
                    </td>
                    <td>
                      <div className="progress-bar-container" style={{ width: '100px', height: '8px', background: '#eee', borderRadius: '4px' }}>
                        <div
                          style={{
                            width: `${Math.min(item.occupancy, 100)}%`,
                            height: '100%',
                            background: item.occupancy > 90 ? '#ef4444' : '#10b981',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                      <span className="text-sm ml-2">{item.occupancy}%</span>
                    </td>
                    <td className="text-right font-bold text-green-600">
                      {formatCurrency(item.revenue)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">
                    No hay datos de ventas disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default SalesReports
