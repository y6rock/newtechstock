import React, { useEffect, useState, useCallback } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { formatDate, formatDateShort } from '../../../utils/dateFormat';
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
import { formatPrice, formatPriceConverted, formatPriceWithTax } from '../../../utils/currency';
import { convertFromILSSync, convertToILS } from '../../../utils/exchangeRate';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Title);

export default function Dashboard() {
  const { isUserAdmin, loadingSettings, currency, vat_rate } = useSettings();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total_revenue: 0, total_orders: 0, total_products: 0 });
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [orderStatus, setOrderStatus] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [lowStockDisplayCount, setLowStockDisplayCount] = useState(6);
  
  // Helper function to get last 30 days date range
  const getLast30DaysRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    };
  };

  // Date range state - start with last 30 days by default
  const [dateRange, setDateRange] = useState(getLast30DaysRange());

  // Function to fetch dashboard data with date range
  const fetchDashboardData = useCallback(async () => {
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
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  }, [dateRange]);

  useEffect(() => {
    if (!loadingSettings) {
      if (!isUserAdmin) {
        navigate('/');
      } else {
        fetchDashboardData();
      }
    }
  }, [isUserAdmin, loadingSettings, navigate, fetchDashboardData]);

  // Effect to refresh data when date range changes
  useEffect(() => {
    if (!loadingSettings && isUserAdmin) {
      fetchDashboardData();
    }
  }, [dateRange, isUserAdmin, loadingSettings, fetchDashboardData]);

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
        data: salesData.length > 0 ? salesData.map(d => convertFromILSSync(d.total_revenue, currency)) : [0],
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
            // Data is already converted, just format it
            return formatPrice(value, currency);
          }
        }
      },
      y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Orders' }, ticks: { callback: (v) => v } }
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
              if (context.dataset.label === 'Order Count') {
                label += context.parsed.y;
              } else {
                // Data is already converted, just format it
              label += formatPrice(context.parsed.y, currency);
              }
            }
            return label;
          }
        }
      }
    }
  };

  const sortedTopProducts = topProducts && topProducts.length > 0 
    ? [...topProducts].sort((a, b) => (b.total_sold || 0) - (a.total_sold || 0))
    : [];

  const topProductsBarData = {
    labels: sortedTopProducts.length > 0 ? sortedTopProducts.map(p => p.name) : ['No Products'],
    datasets: [
      {
        label: 'Units Sold',
        data: sortedTopProducts.length > 0 ? sortedTopProducts.map(p => p.total_sold) : [0],
        backgroundColor: '#ffc107',
      },
      {
        label: 'Total Sales',
        data: sortedTopProducts.length > 0 ? sortedTopProducts.map(p => convertFromILSSync(p.total_revenue, currency)) : [0],
        backgroundColor: '#007bff',
      }
    ]
  };
  const topProductsBarOptions = {
    responsive: true,
    plugins: { 
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (context.dataset.label === 'Total Sales') {
                // Convert back to ILS, then format with tax
                const priceInILS = convertToILS(context.parsed.y, currency);
                label += formatPriceWithTax(priceInILS, currency, vat_rate);
              } else {
                label += context.parsed.y;
              }
            }
            return label;
          }
        }
      }
    },
    scales: { 
      y: { 
        beginAtZero: true,
        ticks: {
          callback: function(value, index, ticks) {
            // Check if this is the Total Sales dataset by checking the dataset index
            // For bar charts, we need to check which dataset this tick belongs to
            // Since we have two datasets, we'll convert for the second one (Total Sales)
            // Actually, we can't easily determine which dataset, so let's convert all y-axis values
            // But wait, "Units Sold" shouldn't be converted. Let's use a different approach.
            // We'll only convert in tooltips, not in axis labels for this chart
            return value;
          }
        }
      } 
    }
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

      {/* Low Stock Products - Moved to top */}
      <div className="chart-container low-stock-section">
        <h3>Low Stock Products (≤10 units)</h3>
        {lowStockProducts.length > 0 ? (
          <>
            <div className="low-stock-grid">
              {lowStockProducts.slice(0, lowStockDisplayCount).map(product => (
                <div key={product.id} className="low-stock-product-card">
                  <div className="low-stock-product-image">
                    {product.image ? (
                      <img 
                        src={product.image && product.image.startsWith('/uploads') ? `http://localhost:3001${product.image}` : product.image || 'https://via.placeholder.com/50'} 
                        alt={product.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`low-stock-product-placeholder ${product.image ? 'hidden' : ''}`}
                    >
                      📦
                    </div>
                  </div>
                  <div className="low-stock-product-info">
                    <h4 className="low-stock-product-name">
                      {product.name}
                    </h4>
                    <p className="low-stock-product-category">
                      {product.category}
                    </p>
                    <div className="low-stock-product-details">
                      <span className={`stock-badge ${product.stock <= 5 ? 'low' : 'medium'}`}>
                        {product.stock} left
                      </span>
                      {!product.is_active && (
                        <span className="inactive-badge">
                          INACTIVE
                        </span>
                      )}
                      <span className="product-price">
                        {formatPriceWithTax(product.price, currency, vat_rate)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {lowStockProducts.length > lowStockDisplayCount && (
              <div className="load-more-container">
                <button 
                  onClick={() => setLowStockDisplayCount(prev => prev + 6)}
                  className="load-more-button"
                >
                  Load More ({lowStockProducts.length - lowStockDisplayCount} remaining)
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="no-low-stock-message">
            <div className="no-low-stock-icon">✅</div>
            <h4 className="no-low-stock-title">All products are well stocked!</h4>
            <p className="no-low-stock-text">No products have stock levels ≤ 10 units.</p>
          </div>
        )}
      </div>

      {/* Date Range Picker */}
      <div className="date-range-picker">
        <div className="date-range-controls">
          <label className="date-range-label">Date Range:</label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            className="date-input"
          />
          <span className="date-separator">to</span>
          <input
            type="date"
            value={dateRange.endDate}
            min={dateRange.startDate || undefined}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            className="date-input"
          />
        </div>
        
        <button
          onClick={() => setDateRange(getLast30DaysRange())}
          className="date-range-button secondary"
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
          className="date-range-button primary"
        >
          Last 7 Days
        </button>

        <button
          onClick={() => setDateRange({ startDate: '', endDate: '' })}
          className="date-range-button secondary"
        >
          All Time
        </button>
      </div>

      {/* Date Range Summary */}
      <div className="date-range-summary">
        <p className="date-range-summary-text">
          <strong>Statistics for:</strong> {formatDate(dateRange.startDate)} to {formatDate(dateRange.endDate)}
        </p>
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p className="stat-number">{formatPriceConverted(stats.total_revenue, currency)}</p>
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


    </div>
  );
}
