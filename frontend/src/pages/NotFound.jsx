import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f8f9fa', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ textAlign: 'center', background: 'white', padding: '40px 30px', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
        <div style={{ fontSize: '5em', fontWeight: 'bold', color: '#d1d5db', marginBottom: 10 }}>404</div>
        <h2 style={{ fontSize: '2em', marginBottom: 10, color: '#222' }}>Page Not Found</h2>
        <p style={{ color: '#666', marginBottom: 30, maxWidth: 350 }}>
          Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
        </p>
        <div style={{ display: 'flex', gap: 15, justifyContent: 'center', marginBottom: 20 }}>
          <button onClick={() => navigate('/')} style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}>Go Home</button>
          <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', background: '#f3f4f6', color: '#222', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}>Go Back</button>
        </div>
        <div style={{ color: '#888', fontSize: '0.95em' }}>
          If you think this is an error, please contact support.
        </div>
      </div>
    </div>
  );
} 