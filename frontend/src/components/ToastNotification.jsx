import React, { useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes, FaQuestionCircle } from 'react-icons/fa';
import './ToastNotification.css';

const ToastNotification = ({ isOpen, message, type = 'success', onClose, duration = 4000, style = {}, onConfirm, onCancel }) => {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="toast-icon success" />;
      case 'error':
        return <FaExclamationCircle className="toast-icon error" />;
      case 'info':
        return <FaInfoCircle className="toast-icon info" />;
      case 'confirm':
        return <FaQuestionCircle className="toast-icon confirm" />;
      default:
        return <FaCheckCircle className="toast-icon success" />;
    }
  };

  return (
    <div className={`toast-notification ${type} ${isOpen ? 'show' : ''}`} style={style}>
      <div className="toast-content">
        {getIcon()}
        <span className="toast-message">{message}</span>
      </div>
      {type === 'confirm' ? (
        <div className="toast-actions">
          <button
            onClick={onConfirm}
            className="toast-action-button confirm-button"
          >
            Yes
          </button>
          <button
            onClick={onCancel}
            className="toast-action-button cancel-button"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={onClose}
          className="toast-close-button"
          aria-label="Close notification"
        >
          <FaTimes />
        </button>
      )}
    </div>
  );
};

export default ToastNotification;
