import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

// PayPal wrapper component that uses currency from settings
function PayPalWrapper({ children }) {
  const { currency, loadingSettings } = useSettings();
  
  // Don't render PayPal until settings are loaded
  if (loadingSettings) {
    return <>{children}</>;
  }
  
  // Use currency from settings, fallback to USD
  const paypalCurrency = currency || "USD";
  
  return (
    <PayPalScriptProvider 
      key={paypalCurrency} // Force re-initialization when currency changes
      options={{ 
        "client-id": "AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXlkA59kJXE7M6R",
        currency: paypalCurrency,
        intent: "capture"
      }}
    >
      {children}
    </PayPalScriptProvider>
  );
}

// New component to handle useLocation within Router context and pass down props
function RootWrapper() {
  const location = useLocation();
  const isManagerRoute = location.pathname.startsWith('/manager');

  // Removed console.logs to prevent excessive logging

  return (
    <SettingsProvider>
      <PayPalWrapper>
        <ToastProvider>
          <CartProvider>
            <App isManagerRoute={isManagerRoute} />
          </CartProvider>
        </ToastProvider>
      </PayPalWrapper>
    </SettingsProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      <RootWrapper />
    </Router>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
