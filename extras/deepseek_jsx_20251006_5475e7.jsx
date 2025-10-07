import React, { useState, useEffect, useMemo, useRef } from 'react';
// ... other imports remain the same

const ProductsPage = () => {
  // ... existing state and context declarations
  
  // Add a ref to track if user is actively dragging
  const isDraggingRef = useRef(false);
  
  // Remove the debounced effect and handle price changes directly
  const handleTempPriceChange = (e) => {
    const value = parseFloat(e.target.value);
    setTempMaxPrice(value);
    setSelectedMaxPrice(value); // Update both immediately for better UX
  };

  const handlePriceChange = (e) => {
    const value = parseFloat(e.target.value);
    setTempMaxPrice(value);
    setSelectedMaxPrice(value);
  };

  // Add mouse/touch event handlers for better drag experience
  const handleSliderMouseDown = () => {
    isDraggingRef.current = true;
  };

  const handleSliderMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Update the price range slider in your FilterSidebar component:
  const FilterSidebar = () => (
    <div className="filters-sidebar">
      <div className="filter-group">
        <h3>Price Range</h3>
        <div className="price-range-container">
          <div className="price-range-display">
            <span className="current-price">
              Up to {getCurrencySymbol(currency)}{formatNumberWithCommas(tempMaxPrice)}
            </span>
          </div>
          <input
            type="range"
            id="priceRange"
            min={priceRange.min}
            max={priceRange.max}
            step="0.01"
            value={tempMaxPrice}
            onChange={handlePriceChange}
            onInput={handleTempPriceChange}
            onMouseDown={handleSliderMouseDown}
            onMouseUp={handleSliderMouseUp}
            onTouchStart={handleSliderMouseDown}
            onTouchEnd={handleSliderMouseUp}
            className="price-range-slider"
          />
          <div className="price-range-labels">
            <span>{getCurrencySymbol(currency)}{formatNumberWithCommas(priceRange.min)}</span>
            <span>{getCurrencySymbol(currency)}{formatNumberWithCommas(priceRange.max)}</span>
          </div>
        </div>
      </div>
      {/* ... rest of FilterSidebar remains the same */}
    </div>
  );

  // ... rest of your component remains the same
};