import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getImageUrl } from '../utils/imageUtils' // Added
import api from '../services/api'
import './AdCarousel.css'

const AdCarousel = ({ position }) => {
  const navigate = useNavigate() // Added
  const [ads, setAds] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  // Responsive check for side banners
  useEffect(() => {
    if (position.startsWith('side')) {
      const checkVisibility = () => {
        // Show side banners only on large screens (> 1200px)
        setVisible(window.innerWidth >= 1200)
      }

      checkVisibility()
      window.addEventListener('resize', checkVisibility)
      return () => window.removeEventListener('resize', checkVisibility)
    }
  }, [position])

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const allAds = await api.ads.getPublic()
        // Filter by position
        const filtered = allAds.filter(ad => ad.position === position)
        setAds(filtered)
      } catch (error) {
        console.error(`Error loading ads for ${position}:`, error)
      }
    }

    if (visible) {
      fetchAds()
    }
  }, [position, visible])

  // Auto-play
  useEffect(() => {
    if (ads.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % ads.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [ads])

  if (!visible || ads.length === 0) return null

  const currentAd = ads[currentIndex]

  const handleAdClick = () => {
    if (currentAd && currentAd.link_url) {
      if (currentAd.link_url.startsWith('/')) {
        navigate(currentAd.link_url)
      } else {
        window.open(currentAd.link_url, '_blank', 'noopener,noreferrer')
      }
    }
  }

  const isVertical = position.startsWith('side')

  return (
    <div className={`ad-carousel ${position} ${isVertical ? 'vertical' : 'horizontal'}`}>
      <div
        className="ad-slide"
        onClick={handleAdClick}
        style={{ cursor: currentAd.link_url ? 'pointer' : 'default' }}
      >
        <img src={getImageUrl(currentAd.image_url)} alt={currentAd.title} />
        {/* Optional: Add indicators or controls if needed */}
      </div>

      {ads.length > 1 && (
        <div className="ad-indicators">
          {ads.map((_, idx) => (
            <span
              key={idx}
              className={`indicator ${idx === currentIndex ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentIndex(idx)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default AdCarousel
