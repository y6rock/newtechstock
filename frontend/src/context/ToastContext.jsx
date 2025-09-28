import React, { createContext, useContext, useState, useCallback } from 'react';
import ToastNotification from '../components/ToastNotification';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      message,
      type,
      duration,
      isOpen: true
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message, duration) => {
    return showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message, duration) => {
    return showToast(message, 'error', duration);
  }, [showToast]);

  const showInfo = useCallback((message, duration) => {
    return showToast(message, 'info', duration);
  }, [showToast]);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value = {
    showToast,
    showSuccess,
    showError,
    showInfo,
    removeToast,
    clearAllToasts,
    toasts
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Render all active toasts */}
      <div className="toast-container">
        {toasts.map((toast, index) => (
          <ToastNotification
            key={toast.id}
            isOpen={toast.isOpen}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
            duration={0} // Duration is handled by the context
            style={{
              bottom: `${20 + (index * 80)}px` // Stack toasts vertically
            }}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastContext;
