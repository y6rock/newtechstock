import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css'; // Import the CSS file

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
    const location = useLocation();

    const handleLinkClick = () => {
        // Close the sidebar when a link is clicked on mobile
        if (window.innerWidth <= 768) {
            setSidebarOpen(false);
        }
    };

    const linkClassName = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    return (
        <>
            {/* Overlay for closing the sidebar when clicking outside */}
            {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(0,0,0,0.4)', zIndex: 999
            }}></div>}
            
            <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <h3 className="sidebar-header">Admin Panel</h3>
                <nav className="sidebar-nav">
                    <Link to="/manager/dashboard" className={linkClassName('/manager/dashboard')} onClick={handleLinkClick}>Dashboard</Link>
                    <Link to="/manager/products" className={linkClassName('/manager/products')} onClick={handleLinkClick}>Products</Link>
                    <Link to="/manager/promotions" className={linkClassName('/manager/promotions')} onClick={handleLinkClick}>Promotions</Link>
                    <Link to="/manager/customers" className={linkClassName('/manager/customers')} onClick={handleLinkClick}>Customers</Link>
                    <Link to="/manager/categories" className={linkClassName('/manager/categories')} onClick={handleLinkClick}>Categories</Link>
                    <Link to="/manager/suppliers" className={linkClassName('/manager/suppliers')} onClick={handleLinkClick}>Suppliers</Link>
                    <Link to="/manager/orders" className={linkClassName('/manager/orders')} onClick={handleLinkClick}>Orders</Link>
                    <Link to="/manager/settings" className={linkClassName('/manager/settings')} onClick={handleLinkClick}>Settings</Link>
                </nav>
            </div>
        </>
    );
};

export default Sidebar; 