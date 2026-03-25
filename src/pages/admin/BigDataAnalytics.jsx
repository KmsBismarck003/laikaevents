import React from 'react'
import { Card, Icon } from '../../components'
import BigDataVisualizer from './Dashboard/BigDataVisualizer'
import './admin.css'

const BigDataAnalytics = () => {
  return (
    <div className="admin-big-data-page">
      <div className="page-header">
        <div className="header-title-group">
          <Icon name="database" size={28} className="text-primary" />
          <div>
            <h1>Big Data Analytics</h1>
            <p className="page-subtitle">Procesamiento distribuido con Apache Spark & MapReduce</p>
          </div>
        </div>
      </div>

      <div className="analytics-content">
        <BigDataVisualizer />
      </div>

      <style jsx>{`
        .admin-big-data-page {
          padding: 1rem 0;
        }
        .header-title-group {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .header-title-group h1 {
          margin: 0;
          font-size: 1.8rem;
          font-weight: 900;
          color: #000 !important;
        }
        .page-subtitle {
          margin: 0.25rem 0 0 0;
          font-size: 0.85rem;
          color: #000 !important;
          opacity: 0.7;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
      `}</style>
    </div>
  )
}

export default BigDataAnalytics
