import React from 'react';
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';
import './Modal.css';

const NotificationModal = ({ isOpen, message, type, onClose }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle style={{ color: '#28a745', fontSize: '2em' }} />;
      case 'error':
        return <FaExclamationCircle style={{ color: '#dc3545', fontSize: '2em' }} />;
      default:
        return <FaCheckCircle style={{ color: '#007bff', fontSize: '2em' }} />;
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

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#d4edda';
      case 'error':
        return '#f8d7da';
      default:
        return '#d1ecf1';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return '#c3e6cb';
      case 'error':
        return '#f5c6cb';
      default:
        return '#bee5eb';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '400px',
          textAlign: 'center',
          backgroundColor: getBackgroundColor(),
          border: `2px solid ${getBorderColor()}`
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '1.2em',
            cursor: 'pointer',
            color: '#666'
          }}
        >
          <FaTimes />
        </button>
        
        <div style={{ marginTop: '20px' }}>
          {getIcon()}
          <h2 style={{ 
            margin: '15px 0', 
            color: type === 'error' ? '#721c24' : '#155724',
            fontSize: '1.5em'
          }}>
            {getTitle()}
          </h2>
          <p style={{ 
            margin: '0 0 20px 0', 
            color: type === 'error' ? '#721c24' : '#155724',
            fontSize: '1.1em',
            lineHeight: '1.5'
          }}>
            {message}
          </p>
          <button
            onClick={onClose}
            style={{
              padding: '10px 25px',
              backgroundColor: type === 'error' ? '#dc3545' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '1em',
              cursor: 'pointer',
              transition: 'background-color 0.3s'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = type === 'error' ? '#c82333' : '#218838';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = type === 'error' ? '#dc3545' : '#28a745';
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
