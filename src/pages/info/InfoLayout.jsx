import React from 'react'
import { Card } from '../../components'
import './InfoLayout.css'

const InfoLayout = ({ title, children, lastUpdated }) => {
  return (
    <div className="info-page-container">
      <div className="info-header">
        <h1>{title}</h1>
        {lastUpdated && (
          <p className="last-updated">
            Última actualización: {lastUpdated}
          </p>
        )}
      </div>
      <div className="info-content-wrapper">
        <Card className="info-card">
          {children}
        </Card>
      </div>
    </div>
  )
}

export default InfoLayout
