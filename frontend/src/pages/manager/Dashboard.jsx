import React, { useEffect, useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { Line, Bar, Pie } from 'react-chartjs-2';
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
    if (!loadingSettings && !isUserAdmin) {
      navigate('/');
    }
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/dashboard-stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      }
    };
    const fetchSales = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/sales-over-time', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          setSalesData(await response.json());
        }
      } catch (err) {
        console.error('Error fetching sales over time:', err);
      }
    };
    const fetchTopProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/top-products', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          setTopProducts(await response.json());
        }
      } catch (err) {
        console.error('Error fetching top products:', err);
      }
    };
    const fetchOrderStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/order-status-distribution', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          setOrderStatus(await response.json());
        }
      } catch (err) {
        console.error('Error fetching order status distribution:', err);
      }
    };
    const fetchSettingsAndCurrencies = async () => {
      try {
        const [settingsRes, currenciesRes] = await Promise.all([
          axios.get('/api/settings'),
          axios.get('/api/currencies')
        ]);
        setSettings(settingsRes.data);
        setCurrencies(currenciesRes.data);
      } catch (err) {
        // ignore
      }
    };
    if (isUserAdmin && !loadingSettings) {
      fetchStats();
      fetchSales();
      fetchTopProducts();
      fetchOrderStatus();
      fetchSettingsAndCurrencies();
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
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{ flex: 1, padding: '20px' }}>
        <h2>Dashboard</h2>
        <p style={{ color: '#666', marginTop: '5px' }}>Overview of your store's performance</p>

        <div style={{ display: 'flex', gap: '30px', marginBottom: '30px' }}>
          <div style={{ flex: 1, background: '#fff', borderRadius: '8px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ color: '#222', marginBottom: '10px' }}>Total Revenue</h3>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#222' }}>{formatPrice(stats.total_revenue)}</div>
          </div>
          <div style={{ flex: 1, background: '#fff', borderRadius: '8px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ color: '#222', marginBottom: '10px' }}>Total Orders</h3>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#222' }}>{stats.total_orders}</div>
          </div>
          <div style={{ flex: 1, background: '#fff', borderRadius: '8px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ color: '#222', marginBottom: '10px' }}>Products</h3>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#222' }}>{stats.total_products}</div>
          </div>
        </div>

        {/* Charts Section */}
        <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: '1fr', gap: '40px' }}>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3>Sales Over Time (Last 30 Days)</h3>
            <Line data={salesLineData} options={salesLineOptions} height={80} />
          </div>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3>Top Selling Products</h3>
            <Bar data={topProductsBarData} options={topProductsBarOptions} height={80} />
          </div>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', maxWidth: 500, margin: '0 auto' }}>
            <h3>Order Status Distribution</h3>
            <Pie data={orderStatusPieData} />
          </div>
        </div>
      </div>
    </div>
  );
}