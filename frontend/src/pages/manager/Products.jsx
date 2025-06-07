import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import ProductManager from '../../components/ProductManager';
import { useSettings } from '../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';

export default function Products() {
  const { isUserAdmin, loadingSettings } = useSettings();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!loadingSettings && !isUserAdmin) {
      navigate('/');
    }
  }, [isUserAdmin, loadingSettings, navigate]);

  if (loadingSettings) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <div style={{ flex: 1, padding: '20px', textAlign: 'center' }}>
          <p>Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  if (!isUserAdmin) {
    return null;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar is fixed, its width creates space */}
      <Sidebar />
      {/* Main content area - use flex: 1 and padding for responsiveness */}
      <div style={{ flex: 1, padding: '20px', paddingLeft: '240px' }}>
        <h2>Products</h2>
        <p style={{ color: '#666', marginTop: '5px' }}>Manage your store's products</p>
        <button
          style={{ padding: '8px 12px', marginBottom: '15px', backgroundColor: '#28a745', color: '#fff' }}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add New Product'}
        </button>
        {showForm && <ProductManager />}
        {/* You can remove the static product list below if ProductManager handles listing */}
        {/* <ul>
          <li>Product A – Stock: 10 <button>Edit</button> <button>Delete</button></li>
          <li>Product B – Stock: 5 <button>Edit</button> <button>Delete</button></li>
        </ul> */}
      </div>
    </div>
  );
}