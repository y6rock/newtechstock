import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { formatPrice } from '../utils/currency';
import { FaArrowLeft, FaStar, FaTruck, FaShieldAlt, FaUndo, FaHeart, FaShare, FaEye, FaShoppingCart } from 'react-icons/fa';

// Helper to get currency symbol
const getCurrencySymbol = (currencyCode) => {
  const symbols = {
    'ILS': '₪',
    'USD': '$',
    'EUR': '€',
  };
  return symbols[currencyCode] || '$';
};

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user_id, username, currency } = useSettings();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cartMsg, setCartMsg] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
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
    <div style={{ 
      textAlign: 'center', 
      marginTop: 100, 
      fontSize: '1.2em',
      color: '#666'
    }}>
      <div style={{ 
        width: 50, 
        height: 50, 
        border: '3px solid #f3f3f3',
        borderTop: '3px solid #007bff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 20px'
      }}></div>
      Loading product details...
    </div>
  );
  
  if (!product) return (
    <div style={{ 
      textAlign: 'center', 
      marginTop: 100,
      color: '#dc3545',
      fontSize: '1.2em'
    }}>
      Product not found.
    </div>
  );

  // Enhanced inventory validation
  const hasValidStock = product.stock && product.stock >= 0;
  const isOutOfStock = !hasValidStock || product.stock === 0;
  const stockStatus = !hasValidStock ? 'Invalid Stock Data' : product.stock === 0 ? 'Out of Stock' : `In Stock (${product.stock} available)`;
  const stockColor = !hasValidStock ? '#ff6b35' : product.stock === 0 ? '#dc3545' : '#28a745';

  // Mock product images for demonstration (you can replace with actual product images)
  const productImages = [
    product.image && product.image.startsWith('/uploads') 
      ? `http://localhost:3001${product.image}` 
      : product.image || 'https://via.placeholder.com/500x500?text=Product+Image',
    'https://via.placeholder.com/500x500?text=Image+2',
    'https://via.placeholder.com/500x500?text=Image+3',
    'https://via.placeholder.com/500x500?text=Image+4'
  ];

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px 0'
    }}>
      {/* Header Navigation */}
      <div style={{
        position: 'sticky',
        top: 0,
        backgroundColor: 'white',
        borderBottom: '1px solid #e9ecef',
        padding: '15px 0',
        zIndex: 100,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#007bff', 
              cursor: 'pointer', 
              fontSize: '1em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '6px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <FaArrowLeft /> Back to Products
          </button>
        </div>
      </div>

      {/* Main Product Container */}
      <div style={{ 
        maxWidth: 1200, 
        margin: '0 auto', 
        padding: '40px 20px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '60px',
        alignItems: 'start'
      }}>
        
        {/* Left Column - Product Images */}
        <div style={{ position: 'sticky', top: 100 }}>
          {/* Main Image */}
          <div style={{
            width: '100%',
            height: '500px',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            marginBottom: '20px',
            backgroundColor: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img
              src={productImages[selectedImage]}
              alt={product.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                padding: '20px'
              }}
            />
          </div>

          {/* Thumbnail Images */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center'
          }}>
            {productImages.map((img, index) => (
              <div
                key={index}
                onClick={() => setSelectedImage(index)}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: selectedImage === index ? '3px solid #007bff' : '2px solid #e9ecef',
                  transition: 'all 0.2s',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                <img
                  src={img}
                  alt={`${product.name} ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    padding: '8px'
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Product Information */}
        <div style={{ paddingTop: '20px' }}>
          {/* Product Header */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              marginBottom: '15px'
            }}>
              <span style={{
                backgroundColor: '#e9f7ff',
                color: '#007bff',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '0.9em',
                fontWeight: '500'
              }}>
                {product.category_id || 'Electronics'}
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                color: '#ffc107'
              }}>
                <FaStar />
                <FaStar />
                <FaStar />
                <FaStar />
                <FaStar />
                <span style={{ color: '#666', marginLeft: '8px' }}>(4.8)</span>
              </div>
            </div>

            <h1 style={{
              fontSize: '2.5em',
              fontWeight: '700',
              color: '#1a1a1a',
              marginBottom: '15px',
              lineHeight: '1.2'
            }}>
              {product.name}
            </h1>

            <div style={{
              fontSize: '2.2em',
              fontWeight: '800',
              color: '#007bff',
              marginBottom: '20px'
            }}>
              {formatPrice(product.price, currency)}
            </div>
          </div>

          {/* Stock Status */}
          <div style={{
            backgroundColor: stockColor === '#28a745' ? '#d4edda' : stockColor === '#dc3545' ? '#f8d7da' : '#fff3cd',
            border: `1px solid ${stockColor === '#28a745' ? '#c3e6cb' : stockColor === '#dc3545' ? '#f5c6cb' : '#ffeaa7'}`,
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '25px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: stockColor
            }}></div>
            <span style={{ 
              color: stockColor === '#28a745' ? '#155724' : stockColor === '#dc3545' ? '#721c24' : '#856404',
              fontWeight: '600'
            }}>
              {stockStatus}
            </span>
          </div>

          {/* Product Description */}
          {product.description && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{
                fontSize: '1.3em',
                fontWeight: '600',
                marginBottom: '15px',
                color: '#333'
              }}>
                Description
              </h3>
              <p style={{
                color: '#666',
                lineHeight: '1.6',
                fontSize: '1.1em'
              }}>
                {product.description}
              </p>
            </div>
          )}

          {/* Quantity Selector */}
          {hasValidStock && product.stock > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{
                fontSize: '1.3em',
                fontWeight: '600',
                marginBottom: '15px',
                color: '#333'
              }}>
                Quantity
              </h3>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))} 
                  style={{ 
                    width: '40px',
                    height: '40px',
                    fontSize: '1.2em', 
                    borderRadius: '8px', 
                    border: '1px solid #dee2e6', 
                    background: 'white', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#e9ecef'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                >
                  -
                </button>
                <span style={{ 
                  minWidth: '50px', 
                  textAlign: 'center',
                  fontSize: '1.2em',
                  fontWeight: '600',
                  color: '#333'
                }}>
                  {quantity}
                </span>
                <button 
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} 
                  style={{ 
                    width: '40px',
                    height: '40px',
                    fontSize: '1.2em', 
                    borderRadius: '8px', 
                    border: '1px solid #dee2e6', 
                    background: 'white', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#e9ecef'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                >
                  +
                </button>
                <span style={{ color: '#666', fontSize: '0.9em' }}>
                  {product.stock} available
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{
              display: 'flex',
              gap: '15px',
              marginBottom: '15px'
            }}>
              <button
                style={{ 
                  flex: 1,
                  padding: '18px 0', 
                  background: isOutOfStock ? '#6c757d' : '#007bff', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '10px', 
                  fontWeight: '600', 
                  fontSize: '1.1em', 
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer', 
                  opacity: isOutOfStock ? 0.6 : 1,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                title={!hasValidStock ? 'Invalid stock data' : product.stock === 0 ? 'Out of stock' : 'Add to cart'}
                onMouseEnter={(e) => !isOutOfStock && (e.target.style.background = '#0056b3')}
                onMouseLeave={(e) => !isOutOfStock && (e.target.style.background = '#007bff')}
              >
                <FaShoppingCart />
                {!hasValidStock ? 'Invalid Stock' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>

              <button
                onClick={toggleWishlist}
                style={{
                  width: '60px',
                  padding: '18px 0',
                  background: isWishlisted ? '#dc3545' : '#f8f9fa',
                  color: isWishlisted ? 'white' : '#666',
                  border: '1px solid #dee2e6',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.target.style.background = isWishlisted ? '#c82333' : '#e9ecef'}
                onMouseLeave={(e) => e.target.style.background = isWishlisted ? '#dc3545' : '#f8f9fa'}
              >
                <FaHeart />
              </button>

              <button
                onClick={shareProduct}
                style={{
                  width: '60px',
                  padding: '18px 0',
                  background: '#f8f9fa',
                  color: '#666',
                  border: '1px solid #dee2e6',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.target.style.background = '#e9ecef'}
                onMouseLeave={(e) => e.target.style.background = '#f8f9fa'}
              >
                <FaShare />
              </button>
            </div>

            {cartMsg && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: cartMsg.includes('Added') ? '#d4edda' : '#f8d7da',
                color: cartMsg.includes('Added') ? '#155724' : '#721c24',
                border: `1px solid ${cartMsg.includes('Added') ? '#c3e6cb' : '#f5c6cb'}`,
                textAlign: 'center',
                fontWeight: '500'
              }}>
                {cartMsg}
              </div>
            )}
          </div>

          {/* Product Features */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '25px',
            border: '1px solid #e9ecef',
            marginBottom: '30px'
          }}>
            <h3 style={{
              fontSize: '1.3em',
              fontWeight: '600',
              marginBottom: '20px',
              color: '#333'
            }}>
              Product Features
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <FaTruck style={{ color: '#28a745', fontSize: '1.2em' }} />
                <span style={{ color: '#666' }}>Free Shipping</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <FaShieldAlt style={{ color: '#007bff', fontSize: '1.2em' }} />
                <span style={{ color: '#666' }}>1 Year Warranty</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <FaUndo style={{ color: '#ffc107', fontSize: '1.2em' }} />
                <span style={{ color: '#666' }}>30 Day Returns</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <FaEye style={{ color: '#6f42c1', fontSize: '1.2em' }} />
                <span style={{ color: '#666' }}>Premium Quality</span>
              </div>
            </div>
          </div>

          {/* Product Specifications */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '25px',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{
              fontSize: '1.3em',
              fontWeight: '600',
              marginBottom: '20px',
              color: '#333'
            }}>
              Specifications
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '15px'
            }}>
              <div>
                <span style={{ color: '#666', fontSize: '0.9em' }}>Category:</span>
                <div style={{ color: '#333', fontWeight: '500' }}>{product.category_id || 'Electronics'}</div>
              </div>
              <div>
                <span style={{ color: '#666', fontSize: '0.9em' }}>SKU:</span>
                <div style={{ color: '#333', fontWeight: '500' }}>#{product.product_id}</div>
              </div>
              <div>
                <span style={{ color: '#666', fontSize: '0.9em' }}>Availability:</span>
                <div style={{ color: stockColor, fontWeight: '500' }}>{stockStatus}</div>
              </div>
              <div>
                <span style={{ color: '#666', fontSize: '0.9em' }}>Condition:</span>
                <div style={{ color: '#333', fontWeight: '500' }}>New</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      <div style={{
        maxWidth: 1200,
        margin: '60px auto 0',
        padding: '0 20px'
      }}>
        <h2 style={{
          fontSize: '2em',
          fontWeight: '600',
          marginBottom: '30px',
          color: '#333',
          textAlign: 'center'
        }}>
          You Might Also Like
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '25px'
        }}>
          {/* Mock related products - you can replace with actual data */}
          {[1, 2, 3, 4].map((item) => (
            <div key={item} style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e9ecef',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <div style={{
                width: '100%',
                height: '200px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666'
              }}>
                Related Product {item}
              </div>
              <h4 style={{ marginBottom: '10px', color: '#333' }}>Related Product {item}</h4>
              <div style={{ color: '#007bff', fontWeight: '600' }}>₪{Math.floor(Math.random() * 1000) + 100}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CSS for loading animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 