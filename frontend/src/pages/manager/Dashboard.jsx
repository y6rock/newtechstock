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
  Legend
} from 'chart.js';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const { isUserAdmin, loadingSettings } = useSettings();
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
              axios.get('/api/currencies')
            ]);

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

  const formatPrice = (price) => {
    const currency = currencies[settings.currency];
    if (!currency) return `₪${parseFloat(price).toFixed(2)}`;
    const convertedPrice = price * currency.rate;
    return `${currency.symbol}${convertedPrice.toFixed(2)}`;
  };

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
    labels: salesData.map(d => d.day),
    datasets: [
      {
        label: 'Total Sales',
        data: salesData.map(d => d.total_sales),
        borderColor: '#007bff',
        backgroundColor: 'rgba(0,123,255,0.1)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Order Count',
        data: salesData.map(d => d.order_count),
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
      y: { beginAtZero: true, title: { display: true, text: 'Sales ($)' } },
      y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Orders' } }
    }
  };

  const topProductsBarData = {
    labels: topProducts.map(p => p.name),
    datasets: [
      {
        label: 'Units Sold',
        data: topProducts.map(p => p.total_quantity),
        backgroundColor: '#ffc107',
      },
      {
        label: 'Total Sales',
        data: topProducts.map(p => p.total_sales),
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
    labels: orderStatus.map(s => s.status),
    datasets: [
      {
        label: 'Orders',
        data: orderStatus.map(s => s.count),
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
          <p>{formatPrice(stats.total_revenue)}</p>
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