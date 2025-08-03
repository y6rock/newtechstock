import React, { useEffect, useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { Line, Bar, Pie } from 'react-chartjs-2';
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
  const [settings, setSettings] = useState({ currency: 'ILS' });
  const [currencies, setCurrencies] = useState({});

  useEffect(() => {
    if (!loadingSettings) {
      if (!isUserAdmin) {
        navigate('/');
      } else {
        const fetchAllDashboardData = async () => {
          try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };
            
            const [
              statsRes,
              salesRes,
              topProductsRes,
              orderStatusRes,
              settingsRes,
              currenciesRes
            ] = await Promise.all([
              axios.get('/api/admin/dashboard-stats', { headers }),
              axios.get('/api/admin/sales-over-time', { headers }),
              axios.get('/api/admin/top-products', { headers }),
              axios.get('/api/admin/order-status-distribution', { headers }),
              axios.get('/api/settings'),
              axios.get('/api/settings/currencies')
            ]);

            console.log('Dashboard Data:', {
              stats: statsRes.data,
              sales: salesRes.data,
              topProducts: topProductsRes.data,
              orderStatus: orderStatusRes.data,
              settings: settingsRes.data,
              currencies: currenciesRes.data
            });
            
            setStats(statsRes.data);
            setSalesData(salesRes.data);
            setTopProducts(topProductsRes.data);
            setOrderStatus(orderStatusRes.data);
            setSettings(settingsRes.data);
            setCurrencies(currenciesRes.data);
          } catch (err) {
            console.error('Error fetching dashboard data:', err);
          }
        };
        fetchAllDashboardData();
      }
    }
  }, [isUserAdmin, loadingSettings, navigate]);

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
    labels: salesData.length > 0 ? salesData.map(d => new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) : ['No Data'],
    datasets: [
      {
        label: 'Total Sales',
        data: salesData.length > 0 ? salesData.map(d => d.total_sales) : [0],
        borderColor: '#007bff',
        backgroundColor: 'rgba(0,123,255,0.1)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Order Count',
        data: salesData.length > 0 ? salesData.map(d => d.order_count) : [0],
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
        data: topProducts.length > 0 ? topProducts.map(p => p.total_quantity) : [0],
        backgroundColor: '#ffc107',
      },
      {
        label: 'Total Sales',
        data: topProducts.length > 0 ? topProducts.map(p => p.total_sales) : [0],
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

      <div className="product-list-container">
        <h3>Top Selling Products</h3>
        <ul className="product-list">
          {topProducts.map((product, index) => (
            <li key={index}>
              <span>{product.name}</span>
              <span className="product-sales">{formatPrice(product.total_sales, currency)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}