import React from 'react';
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';
import './NotificationModal.css';

const NotificationModal = ({ isOpen, message, type, onClose }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="notification-icon success" />;
      case 'error':
        return <FaExclamationCircle className="notification-icon error" />;
      default:
        return <FaCheckCircle className="notification-icon info" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'success':
        return 'Success!';
      case 'error':
        return 'Error!';
      default:
        return 'Notification';
    }
  };

  const getModalClassName = () => {
    return `notification-modal-content ${type || 'info'}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={getModalClassName()}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="notification-close-button"
        >
          <FaTimes />
        </button>
        
        <div className="notification-content">
          {getIcon()}
          <h2 className={`notification-title ${type || 'info'}`}>
            {getTitle()}
          </h2>
          <p className={`notification-message ${type || 'info'}`}>
            {message}
          </p>
          <button
            onClick={onClose}
            className={`notification-ok-button ${type || 'info'}`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
