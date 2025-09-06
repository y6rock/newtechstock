import React, { useEffect, useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { formatDate, formatDateShort } from '../../utils/dateFormat';
import './Dashboard.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';
import axios from 'axios';
import { formatPrice } from '../../utils/currency';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Title);

export default function Dashboard() {
  const { isUserAdmin, loadingSettings, currency } = useSettings();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total_revenue: 0, total_orders: 0, total_products: 0 });
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [orderStatus, setOrderStatus] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [settings, setSettings] = useState({ currency: 'ILS' });
  const [currencies, setCurrencies] = useState({});
  
  // Date range state - start with all-time data
  const [dateRange, setDateRange] = useState({
    startDate: '', // Empty means no start date filter
    endDate: '' // Empty means no end date filter
  });

  // Function to fetch dashboard data with date range
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };
      
      const [
        statsRes,
        salesRes,
        topProductsRes,
        orderStatusRes,
        lowStockRes,
        settingsRes,
        currenciesRes
      ] = await Promise.all([
        axios.get('/api/admin/dashboard-stats', { headers, params }),
        axios.get('/api/admin/sales-over-time', { headers, params }),
        axios.get('/api/admin/top-products', { headers, params }),
        axios.get('/api/admin/order-status-distribution', { headers, params }),
        axios.get('/api/admin/low-stock-products', { headers }),
        axios.get('/api/settings'),
        axios.get('/api/settings/currencies')
      ]);

      console.log('Dashboard Data:', {
        stats: statsRes.data,
        sales: salesRes.data,
        topProducts: topProductsRes.data,
        orderStatus: orderStatusRes.data,
        lowStock: lowStockRes.data,
        settings: settingsRes.data,
        currencies: currenciesRes.data
      });
      
      setStats(statsRes.data);
      setSalesData(salesRes.data);
      setTopProducts(topProductsRes.data);
      setOrderStatus(orderStatusRes.data);
      setLowStockProducts(lowStockRes.data);
      setSettings(settingsRes.data);
      setCurrencies(currenciesRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  useEffect(() => {
    if (!loadingSettings) {
      if (!isUserAdmin) {
        navigate('/');
      } else {
        fetchDashboardData();
      }
    }
  }, [isUserAdmin, loadingSettings, navigate]);

  // Effect to refresh data when date range changes
  useEffect(() => {
    if (!loadingSettings && isUserAdmin) {
      fetchDashboardData();
    }
  }, [dateRange, isUserAdmin, loadingSettings]);

  if (loadingSettings) {
    return (
      <div className="dashboard-container">
        <p>Loading Admin Panel...</p>
      </div>
    );
  }

  if (!isUserAdmin) {
    return null;
  }

  // Prepare chart data
  const salesLineData = {
    labels: salesData.length > 0 ? salesData.map(d => formatDateShort(d.period)) : ['No Data'],
    datasets: [
      {
        label: 'Total Sales',
        data: salesData.length > 0 ? salesData.map(d => d.total_revenue) : [0],
        borderColor: '#007bff',
        backgroundColor: 'rgba(0,123,255,0.1)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Order Count',
        data: salesData.length > 0 ? salesData.map(d => d.orders_count) : [0],
        borderColor: '#28a745',
        backgroundColor: 'rgba(40,167,69,0.1)',
        tension: 0.3,
        fill: false,
        yAxisID: 'y1',
      }
    ]
  };
  const salesLineOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatPrice(value, currency);
          }
        }
      },
      y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Orders' } }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatPrice(context.parsed.y, currency);
            }
            return label;
          }
        }
      }
    }
  };

  const topProductsBarData = {
    labels: topProducts.length > 0 ? topProducts.map(p => p.name) : ['No Products'],
    datasets: [
      {
        label: 'Units Sold',
        data: topProducts.length > 0 ? topProducts.map(p => p.total_sold) : [0],
        backgroundColor: '#ffc107',
      },
      {
        label: 'Total Sales',
        data: topProducts.length > 0 ? topProducts.map(p => p.total_revenue) : [0],
        backgroundColor: '#007bff',
      }
    ]
  };
  const topProductsBarOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true } }
  };

  const orderStatusPieData = {
    labels: orderStatus.length > 0 ? orderStatus.map(s => s.status) : ['No Orders'],
    datasets: [
      {
        label: 'Orders',
        data: orderStatus.length > 0 ? orderStatus.map(s => s.count) : [0],
        backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6c757d'],
      }
    ]
  };

  return (
    <div className="dashboard-container">
      <h2>Dashboard</h2>
      <p className="subtitle">Overview of your store's performance</p>

      {/* Date Range Picker */}
      <div style={{
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontWeight: 'bold', color: '#333' }}>Date Range:</label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          <span style={{ color: '#666' }}>to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>
        
        <button
          onClick={() => {
            const today = new Date();
            const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            setDateRange({
              startDate: thirtyDaysAgo.toISOString().split('T')[0],
              endDate: today.toISOString().split('T')[0]
            });
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Last 30 Days
        </button>
        
        <button
          onClick={() => {
            const today = new Date();
            const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            setDateRange({
              startDate: sevenDaysAgo.toISOString().split('T')[0],
              endDate: today.toISOString().split('T')[0]
            });
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Last 7 Days
        </button>
      </div>

      {/* Date Range Summary */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <p style={{ margin: '0', color: '#495057', fontSize: '16px' }}>
          <strong>Statistics for:</strong> {formatDate(dateRange.startDate)} to {formatDate(dateRange.endDate)}
        </p>
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p className="stat-number">{formatPrice(stats.total_revenue, currency)}</p>
        </div>
        <div className="stat-card">
          <h3>Total Orders</h3>
          <p>{stats.total_orders}</p>
        </div>
        <div className="stat-card">
          <h3>Products</h3>
          <p>{stats.total_products}</p>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h3>Sales Over Time</h3>
          <Line data={salesLineData} options={salesLineOptions} />
        </div>
        <div className="chart-container">
          <h3>Order Status</h3>
          <Pie data={orderStatusPieData} />
        </div>
      </div>

      <div className="chart-container">
        <h3>Top Selling Products</h3>
        <Bar data={topProductsBarData} options={topProductsBarOptions} />
      </div>

      {/* Low Stock Products */}
      <div className="chart-container">
        <h3>Low Stock Products (≤10 units)</h3>
        {lowStockProducts.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '15px',
            marginTop: '20px'
          }}>
            {lowStockProducts.map(product => (
              <div key={product.id} style={{
                backgroundColor: '#fff',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                padding: '15px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{
                      color: '#6c757d',
                      fontSize: '24px'
                    }}>📦</div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ 
                    margin: '0 0 5px 0', 
                    fontSize: '16px',
                    color: '#333'
                  }}>
                    {product.name}
                  </h4>
                  <p style={{ 
                    margin: '0 0 5px 0', 
                    color: '#666',
                    fontSize: '14px'
                  }}>
                    {product.category}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{
                      backgroundColor: product.stock <= 5 ? '#dc3545' : '#ffc107',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {product.stock} units left
                    </span>
                    {!product.is_active && (
                      <span style={{
                        backgroundColor: '#6c757d',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        INACTIVE
                      </span>
                    )}
                    <span style={{
                      color: '#007bff',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>
                      {formatPrice(product.price, currency)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#6c757d',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            marginTop: '20px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>✅</div>
            <h4 style={{ margin: '0 0 10px 0' }}>All products are well stocked!</h4>
            <p style={{ margin: '0' }}>No products have stock levels ≤ 10 units.</p>
          </div>
        )}
      </div>

    </div>
  );
}