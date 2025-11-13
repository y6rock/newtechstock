import React, { createContext, useContext, useState, useCallback } from 'react';
import ToastNotification from '../components/ToastNotification/ToastNotification';

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

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    // For success toasts, allow duplicates to show (user might save multiple times)
    // Only prevent duplicates for error/info toasts
    if (type !== 'success') {
      const existingToast = toasts.find(toast => 
        toast.message === message && toast.type === type
      );
      
      if (existingToast) {
        // If duplicate exists, don't add a new one
        return existingToast.id;
      }
    }
    
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
  }, [toasts, removeToast]);

  const showSuccess = useCallback((message, duration) => {
    return showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message, duration) => {
    return showToast(message, 'error', duration);
  }, [showToast]);

  const showInfo = useCallback((message, duration) => {
    return showToast(message, 'info', duration);
  }, [showToast]);

  const showConfirm = useCallback((message, onConfirm, onCancel) => {
    // Check if a confirm toast with the same message already exists
    const existingToast = toasts.find(toast => 
      toast.message === message && toast.type === 'confirm'
    );
    
    if (existingToast) {
      // If duplicate exists, don't add a new one
      return existingToast.id;
    }
    
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      message,
      type: 'confirm',
      duration: 0, // Don't auto-remove confirmation toasts
      isOpen: true,
      onConfirm: () => {
        removeToast(id);
        if (onConfirm) onConfirm();
      },
      onCancel: () => {
        removeToast(id);
        if (onCancel) onCancel();
      }
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  }, [toasts, removeToast]);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value = {
    showToast,
    showSuccess,
    showError,
    showInfo,
    showConfirm,
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
            onConfirm={toast.onConfirm}
            onCancel={toast.onCancel}
            duration={0} // Duration is handled by the context
            style={{
              bottom: `${20 + (index * 80)}px`
            }}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastContext;
