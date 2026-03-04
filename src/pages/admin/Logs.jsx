import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import { Card, Table, Badge, Spinner } from '../../components'
import './admin.css'

const Logs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      try {
        const data = await api.monitoring.getLogs({ limit: 50, level: filter === 'ALL' ? undefined : filter })
        setLogs(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error fetching logs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
    const interval = setInterval(fetchLogs, 10000)
    return () => clearInterval(interval)
  }, [filter])

  const filteredLogs = filter === 'ALL' ? logs : logs.filter(l => l.level === filter)

  const columns = [
    {
      key: 'timestamp',
      header: 'Hora',
      render: (val) => (
        <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
          {new Date(val).toLocaleTimeString()}
        </span>
      )
    },
    {
      key: 'level',
      header: 'Nivel',
      render: (val) => {
        const variants = { INFO: 'info', WARN: 'warning', ERROR: 'danger', SUCCESS: 'success' }
        return <Badge variant={variants[val]}>{val}</Badge>
      }
    },
    {
      key: 'source',
      header: 'Origen',
      render: (val) => <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{val}</span>
    },
    {
      key: 'message',
      header: 'Detalle del Evento',
      render: (val) => <span style={{ color: 'var(--text-primary)' }}>{val}</span>
    }
  ]

  return (
    <div className="admin-logs-page">
      <div className="page-header">
        <div>
          <h1>Registros del Sistema</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '5px' }}>
            Auditoría y eventos en tiempo real
          </p>
        </div>
        <div className="filter-group glass-panel" style={{ padding: '5px', display: 'flex', gap: '5px' }}>
          {['ALL', 'INFO', 'WARN', 'ERROR', 'SUCCESS'].map(lvl => (
            <button
              key={lvl}
              onClick={() => setFilter(lvl)}
              style={{
                background: filter === lvl ? 'var(--primary)' : 'transparent',
                color: filter === lvl ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                transition: 'all 0.2s'
              }}
            >
              {lvl === 'ALL' ? 'Todos' : lvl}
            </button>
          ))}
        </div>
      </div>

      <Card className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem' }}><Spinner /></div>
        ) : (
          <Table columns={columns} data={filteredLogs} />
        )}
      </Card>
    </div>
  )
}

export default Logs
