import React from 'react';
import { Modal, Icon, Badge } from './';
import { getImageUrl } from '../utils/imageUtils';
import './UserPreviewModal.css';

const UserPreviewModal = ({ isOpen, onClose, user }) => {
  if (!user) return null;

  const userPhoto = user.avatar || user.photo_url || user.profile_photo;
  const photoUrl = getImageUrl(userPhoto);
  const fallbackPhoto = `https://ui-avatars.com/api/?name=${user.first_name || 'U'}&background=random&size=512`;

  const variants = { admin: 'danger', gestor: 'warning', operador: 'info', usuario: 'default' };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="large"
      className="user-preview-glass"
      showCloseButton={true}
    >
      <div className="user-preview-glass__container">
        {/* Fondo con Blur dinámico basado en la foto del usuario */}
        <div 
          className="user-preview-glass__bg" 
          style={{ backgroundImage: `url(${photoUrl || fallbackPhoto})` }}
        />
        <div className="user-preview-glass__overlay" />

        <div className="user-preview-glass__content">
          <div className="user-preview-glass__card">
            <div className="user-preview-glass__photo-section">
              <div className="user-preview-glass__photo-wrapper">
                <img 
                  src={photoUrl} 
                  alt={user.first_name} 
                  className="user-preview-glass__photo"
                  onError={(e) => { e.target.src = fallbackPhoto; }}
                />
              </div>
            </div>

            <div className="user-preview-glass__info-section">
              <div className="user-preview-glass__badge-row">
                <Badge variant={variants[user.role] || 'default'}>
                  {user.role?.toUpperCase() || 'USUARIO'}
                </Badge>
                {user.status === 'active' ? (
                  <span className="user-preview-glass__status active">● ACTIVO</span>
                ) : (
                  <span className="user-preview-glass__status inactive">● INACTIVO</span>
                )}
              </div>

              <h1 className="user-preview-glass__name">
                {user.first_name} {user.last_name}
              </h1>
              
              <div className="user-preview-glass__details">
                <div className="user-preview-glass__detail-item">
                  <Icon name="mail" size={16} />
                  <span>{user.email}</span>
                </div>
                {user.phone && (
                  <div className="user-preview-glass__detail-item">
                    <Icon name="phone" size={16} />
                    <span>{user.phone}</span>
                  </div>
                )}
                <div className="user-preview-glass__detail-item">
                  <Icon name="calendar" size={16} />
                  <span>Miembro desde: {new Date(user.createdAt || user.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="user-preview-glass__footer-brand">
                <div className="laika-badge-mini">
                  <span className="laika-badge-mini__text">LAIKA CLUB</span>
                  <span className="laika-badge-mini__stars">★★★★★</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default UserPreviewModal;
