import React, { useEffect, useState } from 'react';
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

  const [shouldShow, setShouldShow] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      console.log('ToastNotification: isOpen=true, setting shouldShow=true');
      // Small delay to ensure DOM is ready and CSS transition works
      const timer = setTimeout(() => {
        setShouldShow(true);
        console.log('ToastNotification: shouldShow set to true');
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setShouldShow(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    console.log('ToastNotification: isOpen=false, returning null');
    return null;
  }
  
  console.log('ToastNotification: Rendering toast', { isOpen, shouldShow, message, type, className: `toast-notification ${type} ${shouldShow ? 'show' : ''}` });

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

  // Always render, but control visibility with CSS classes
  return (
    <div 
      className={`toast-notification ${type} ${shouldShow ? 'show' : ''}`} 
      style={style}
      data-testid="toast-notification"
    >
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
