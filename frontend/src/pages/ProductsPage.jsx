import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const location = useLocation();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Initialize selectedCategory from URL query parameter
  const getInitialCategory = () => {
    const params = new URLSearchParams(location.search);
    const categoryName = params.get('category');
    if (categoryName) {
      // Find the corresponding category_id if it exists
      const foundCategory = categories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
      return foundCategory ? foundCategory.category_id : 'All Products';
    }
    return 'All Products';
  };

  const [selectedCategory, setSelectedCategory] = useState(getInitialCategory);
  const [priceRange, setPriceRange] = useState(100000);
  const [selectedManufacturers, setSelectedManufacturers] = useState([]);

  // Update selectedCategory if URL changes
  useEffect(() => {
    setSelectedCategory(getInitialCategory());
  }, [location.search, categories]); // Re-run when location.search or categories change

  useEffect(() => {
    // Fetch products
    axios.get('/api/products')
      .then(res => {
        console.log('ProductsPage: Products fetched from backend:', res.data);
        setProducts(res.data);
      })
      .catch(err => console.error('ProductsPage: Error fetching products:', err));

    // Fetch categories
    axios.get('/api/categories')
      .then(res => {
        console.log('ProductsPage: Categories fetched from backend:', res.data);
        setCategories([{ category_id: 'All Products', name: 'All Products' }, ...res.data]);
      })
      .catch(err => console.error('ProductsPage: Error fetching categories:', err));

    // Fetch manufacturers (assuming a /api/manufacturers endpoint exists or can be derived)
    // For now, let's use a placeholder if no dedicated API exists
    const dummyManufacturers = [
      { id: 'gaming_desktops', name: 'Gaming Desktops' },
      { id: 'apple', name: 'Apple' },
      { id: 'samsung', name: 'Samsung' },
      { id: 'dell', name: 'Dell' },
      { id: 'lenovo', name: 'Lenovo' },
      { id: 'asus', name: 'ASUS' },
      { id: 'hp', name: 'HP' },
    ];
    setManufacturers(dummyManufacturers);

  }, []);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    // Also update URL to reflect the selected category
    const params = new URLSearchParams(location.search);
    if (category === 'All Products') {
      params.delete('category');
    } else {
      // Find the category name to put in URL
      const catName = categories.find(cat => cat.category_id === category)?.name;
      if (catName) {
        params.set('category', catName);
      } else {
        params.delete('category'); // Fallback if category_id doesn't map to a name
      }
    }
    window.history.replaceState({}, '', `${location.pathname}?${params.toString()}`);
  };

  const handlePriceChange = (e) => {
    setPriceRange(e.target.value);
  };

  const handleManufacturerChange = (e) => {
    const { value, checked } = e.target;
    setSelectedManufacturers(prev =>
      checked ? [...prev, value] : prev.filter(m => m !== value)
    );
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All Products' || product.category_id === selectedCategory;
    const matchesPrice = parseFloat(product.price) <= parseFloat(priceRange);
    const matchesManufacturer = selectedManufacturers.length === 0 || selectedManufacturers.includes(product.manufacturer_id);
    // Assuming product has a manufacturer_id. For now, this will just filter by the dummy manufacturers.
    return matchesCategory && matchesPrice && matchesManufacturer;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 20px' }}>
      {/* Hero Section Placeholder */}
      <div style={{
        background: 'linear-gradient(to right, #4a90e2, #63b8ff)',
        color: 'white',
        padding: '60px 40px',
        borderRadius: '8px',
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <h1 style={{ fontSize: '2.5em', marginBottom: '10px' }}>Premium Computers for Work and Play</h1>
        <p style={{ fontSize: '1.2em', marginBottom: '20px' }}>Discover our extensive range of high-quality products and cutting-edge technology solutions</p>
        <button style={{
          padding: '12px 30px',
          backgroundColor: '#ff7043',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '1.1em'
        }}>Shop Now</button>
      </div>

      {/* Categories Filter */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px' }}>Categories</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat.category_id}
              onClick={() => handleCategoryChange(cat.category_id)}
              style={{
                padding: '8px 15px',
                borderRadius: '20px',
                border: `1px solid ${selectedCategory === cat.category_id ? '#007bff' : '#ddd'}`,
                backgroundColor: selectedCategory === cat.category_id ? '#e9f7ff' : '#f8f9fa',
                cursor: 'pointer',
                fontSize: '0.9em',
                transition: 'all 0.3s'
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '30px' }}>
        {/* Filters Sidebar */}
        <div style={{ flexBasis: '250px', flexShrink: 0 }}>
          {/* Price Range Filter */}
          <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: '0', marginBottom: '15px' }}>Price Range</h3>
            <input
              type="range"
              min="0"
              max="100000"
              value={priceRange}
              onChange={handlePriceChange}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
              <span>$0</span>
              <span>${priceRange}</span>
            </div>
          </div>

          {/* Manufacturer Filter */}
          <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: '0', marginBottom: '15px' }}>Manufacturer</h3>
            {manufacturers.map(manufacturer => (
              <div key={manufacturer.id} style={{ marginBottom: '10px' }}>
                <label>
                  <input
                    type="checkbox"
                    value={manufacturer.id}
                    checked={selectedManufacturers.includes(manufacturer.id)}
                    onChange={handleManufacturerChange}
                    style={{ marginRight: '8px' }}
                  />
                  {manufacturer.name}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {filteredProducts.map(product => (
            <div key={product.product_id} style={{
              border: '1px solid #eee',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              backgroundColor: 'white'
            }}>
              <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '15px' }}>
                {product.image ? (
                  <img src={product.image.startsWith('/uploads') ? `http://localhost:3001${product.image}` : product.image} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#aaa' }}>Product Image</div>
                )}
              </div>
              <p style={{ color: '#888', fontSize: '0.9em', marginBottom: '5px' }}>{categories.find(c => c.category_id === product.category_id)?.name || 'N/A'}</p>
              <h3 style={{ fontSize: '1.2em', marginBottom: '5px' }}>{product.name}</h3>
              <p style={{ fontSize: '1em', color: '#555', marginBottom: '15px' }}>Little Info (One Line)</p>
              <p style={{ fontSize: '1.4em', fontWeight: 'bold', color: '#333' }}>${parseFloat(product.price).toFixed(2)}</p>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '15px' }}>
                <button
                  style={{
                    padding: '10px 15px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    flex: 1,
                    marginRight: '5px'
                  }}
                  onClick={() => navigate(`/products/${product.product_id}`)}
                >For details</button>
                <button style={{
                  padding: '10px 15px',
                  backgroundColor: '#ff9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }} onClick={() => { console.log('Attempting to add product to cart:', product.name); addToCart(product); }}>
                  🛒
                </button>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: '#888' }}>
              No products found matching your criteria. Check console for fetch errors.
            </div>
          )}
        </div>
      </div>

      {/* Pagination Placeholder */}
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button style={{ padding: '8px 15px', border: '1px solid #ddd', borderRadius: '4px', background: 'none', cursor: 'pointer', marginRight: '5px' }}>← Previous</button>
        <button style={{ padding: '8px 15px', border: '1px solid #ddd', borderRadius: '4px', background: '#007bff', color: 'white', cursor: 'pointer', marginRight: '5px' }}>1</button>
        <button style={{ padding: '8px 15px', border: '1px solid #ddd', borderRadius: '4px', background: 'none', cursor: 'pointer', marginRight: '5px' }}>2</button>
        <button style={{ padding: '8px 15px', border: '1px solid #ddd', borderRadius: '4px', background: 'none', cursor: 'pointer' }}>3</button>
        <button style={{ padding: '8px 15px', border: '1px solid #ddd', borderRadius: '4px', background: 'none', cursor: 'pointer', marginLeft: '5px' }}>Next →</button>
      </div>
    </div>
  );
};

export default ProductsPage; 