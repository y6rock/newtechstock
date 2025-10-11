import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { formatPrice } from '../../utils/currency';
import { FaArrowLeft, FaHeart, FaShare, FaShoppingCart } from 'react-icons/fa';
import './ProductDetails.css';


export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user_id, currency } = useSettings();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cartMsg, setCartMsg] = useState('');
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    setCartMsg('');
    if (!user_id) {
      setCartMsg('Please log in to add items to your cart.');
      setTimeout(() => navigate('/login'), 1200);
      return;
    }
    addToCart(product, quantity);
    setCartMsg('Added to cart!');
  };

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };

  const shareProduct = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out this amazing product: ${product.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCartMsg('Link copied to clipboard!');
    }
  };

  if (loading) return (
    <div className="product-details-loading">
      <div className="spinner"></div>
      Loading product details...
    </div>
  );
  
  if (!product) return (
    <div className="product-details-error">
      <h2 className="error-title">Product not found</h2>
      <p className="error-message">The product you're looking for doesn't exist.</p>
      <button onClick={() => navigate('/products')} className="back-button">
        <FaArrowLeft /> Back to Products
      </button>
    </div>
  );

  // Enhanced inventory validation
  const hasValidStock = product.stock && product.stock >= 0;
  const isOutOfStock = !hasValidStock || product.stock === 0;
  const stockStatus = !hasValidStock ? 'Invalid Stock Data' : product.stock === 0 ? 'Out of Stock' : `In Stock (${product.stock} available)`;
  const stockColor = !hasValidStock ? '#ff6b35' : product.stock === 0 ? '#dc3545' : '#28a745';

  // Product image handling
  const productImage = product.image && product.image.startsWith('/uploads') 
    ? `http://localhost:3001${product.image}` 
    : product.image || 'https://via.placeholder.com/500x500?text=Product+Image';

  return (
    <div className="product-details-container">
      {/* Header Navigation */}
      <div className="product-header-nav">
        <div className="header-nav-content">
          <button 
            onClick={() => navigate(-1)} 
            className="back-button-nav"
          >
            <FaArrowLeft /> Back to Products
          </button>
        </div>
      </div>

      {/* Main Product Container */}
      <div className="product-main-container">
        
        {/* Left Column - Product Images */}
        <div className="product-images-column">
          {/* Main Image */}
          <div className="main-image-container">
            <img
              src={productImage}
              alt={product.name}
              className="main-product-image"
            />
          </div>

        </div>

        {/* Right Column - Product Information */}
        <div className="product-info-column">
          {/* Product Header */}
          <div className="product-header-section">
            <div className="product-meta">
              {product.category_name && (
                <span className="category-badge">
                  {product.category_name}
                </span>
              )}
            </div>

            <h1 className="product-title-main">
              {product.name}
            </h1>

            <div className="product-price-main">
              {formatPrice(product.price, currency)}
            </div>
          </div>

          {/* Stock Status */}
          <div className={`stock-status-container ${
            stockColor === '#28a745' ? 'stock-status-in-stock' : 
            stockColor === '#dc3545' ? 'stock-status-out-of-stock' : 
            'stock-status-invalid'
          }`}>
            <div className={`stock-indicator-dot ${
              stockColor === '#28a745' ? 'stock-indicator-in-stock' : 
              stockColor === '#dc3545' ? 'stock-indicator-out-of-stock' : 
              'stock-indicator-invalid'
            }`}></div>
            <span className={`stock-status-text ${
              stockColor === '#28a745' ? 'stock-text-in-stock' : 
              stockColor === '#dc3545' ? 'stock-text-out-of-stock' : 
              'stock-text-invalid'
            }`}>
              {stockStatus}
            </span>
          </div>

          {/* Product Description */}
          {product.description && (
            <div className="description-section">
              <h3 className="description-title">
                Description
              </h3>
              <p className="description-text">
                {product.description}
              </p>
            </div>
          )}

          {/* Quantity Selector */}
          {hasValidStock && product.stock > 0 && (
            <div className="quantity-section">
              <h3 className="quantity-title">
                Quantity
              </h3>
              <div className="quantity-controls-container">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))} 
                  className="quantity-button"
                >
                  -
                </button>
                <span className="quantity-display">
                  {quantity}
                </span>
                <button 
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} 
                  className="quantity-button"
                >
                  +
                </button>
                <span className="quantity-available">
                  {product.stock} available
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons-section">
            <div className="action-buttons-row">
              <button
                className="add-to-cart-button"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                title={!hasValidStock ? 'Invalid stock data' : product.stock === 0 ? 'Out of stock' : 'Add to cart'}
              >
                <FaShoppingCart />
                {!hasValidStock ? 'Invalid Stock' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>

              <button
                onClick={toggleWishlist}
                className={`wishlist-button ${isWishlisted ? 'active' : ''}`}
              >
                <FaHeart />
              </button>

              <button
                onClick={shareProduct}
                className="share-button"
              >
                <FaShare />
              </button>
            </div>

            {cartMsg && (
              <div className={`cart-message ${cartMsg.includes('Added') ? 'success' : 'error'}`}>
                {cartMsg}
              </div>
            )}
          </div>


          {/* Product Specifications */}
          <div className="specifications-section">
            <h3 className="specifications-title">
              Product Information
            </h3>
            <div className="specifications-grid">
              {product.category_name && (
                <div className="spec-item">
                  <span className="spec-label">Category:</span>
                  <div className="spec-value">{product.category_name}</div>
                </div>
              )}
              <div className="spec-item">
                <span className="spec-label">Product ID:</span>
                <div className="spec-value">#{product.product_id}</div>
              </div>
              <div className="spec-item">
                <span className="spec-label">Availability:</span>
                <div className={`spec-value ${
                  !hasValidStock ? 'stock-invalid' : 
                  product.stock === 0 ? 'stock-out-of-stock' : 
                  'stock-in-stock'
                }`}>{stockStatus}</div>
              </div>
              {product.supplier_name && (
                <div className="spec-item">
                  <span className="spec-label">Supplier:</span>
                  <div className="spec-value">{product.supplier_name}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


    </div>
  );
} 