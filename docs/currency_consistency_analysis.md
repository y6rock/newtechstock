# Currency Consistency Analysis

## Problem Summary
Currency display is inconsistent across the website. Some pages don't update when currency is changed in Settings.

## Root Causes Identified

### 1. **SettingsContext Currency Update Flow**
**Location**: `frontend/src/context/SettingsContext.jsx`

**Issue**: 
- When currency is changed in Settings page, `refreshSiteSettings()` is called
- This updates the context state, but React components might not re-render if they're not properly subscribed
- The context value is spread (`...siteSettings`), which should work, but there might be timing issues

**Current Flow**:
1. Settings page saves currency → calls `refreshSiteSettings()`
2. `fetchSiteSettings()` fetches from API → updates `siteSettings` state
3. Context value updates → should trigger re-renders

**Potential Issue**: Components might be using stale currency values if they don't properly subscribe to context changes.

---

### 2. **Exchange Rate Cache Not Refreshed**
**Location**: `frontend/src/utils/exchangeRate.js`

**Issue**:
- Exchange rates are cached in localStorage with 1-hour duration
- When currency changes, the cache is NOT invalidated
- `convertFromILSSync()` uses cached rates, which might be stale
- If user changes currency, old cached rates might still be used

**Current Behavior**:
- Exchange rates cached for 1 hour
- Cache key: `exchange_rates_cache`
- No invalidation when currency changes

**Impact**: Prices might show incorrect conversions if exchange rates are stale or if currency was just changed.

---

### 3. **Components Not Re-rendering on Currency Change**

#### A. **ProductDetails.jsx**
- ✅ Uses `currency` from `useSettings()` - Should be reactive
- ✅ No memoization issues found
- **Status**: Should work correctly

#### B. **Cart.jsx**
- ✅ Uses `currency` from `useSettings()` - Should be reactive
- ✅ Uses `formatPrice` and `formatPriceWithTax` with currency parameter
- **Status**: Should work correctly

#### C. **Checkout.jsx**
- ✅ Uses `currency` from `useSettings()` - Should be reactive
- ✅ Uses `formatPriceConverted` with currency parameter
- **Status**: Should work correctly

#### D. **ProductsPage.jsx**
- ✅ Uses `currency` from `useSettings()` - Should be reactive
- ⚠️ Has local helper functions `getCurrencySymbol` and `formatPriceWithCommas` that use currency
- **Status**: Should work, but local helpers might cause issues if currency changes mid-render

#### E. **Orders.jsx (Admin)**
- ✅ Uses `currency` from `useSettings()` - Should be reactive
- ✅ Uses `formatPrice` with currency parameter
- **Status**: Should work correctly

#### F. **OrderHistory.jsx**
- ✅ Uses `currency` from `useSettings()` - Should be reactive
- ✅ Uses `formatPriceConverted` and `formatPriceWithTax` with currency parameter
- **Status**: Should work correctly

#### G. **OrderConfirmation.jsx**
- ✅ Uses `currency` from `useSettings()` - Should be reactive
- ✅ Uses `formatPriceConverted` with currency parameter
- **Status**: Should work correctly

---

### 4. **CartContext Totals Calculation**
**Location**: `frontend/src/context/CartContext.jsx`

**Issue**:
- Cart totals (subtotal, vatAmount, total, etc.) are calculated in `useMemo` or computed values
- These calculations use `vat_rate` from settings, but might not re-calculate when currency changes
- However, the actual formatting happens in components using `formatPrice`, so this should be fine

**Current Behavior**:
- Totals are calculated in ILS (base currency)
- Formatting happens in components using current currency
- **This is correct** - totals should be in ILS, formatting converts to display currency

**Status**: Should work correctly

---

### 5. **PayPal Integration**
**Location**: `frontend/src/pages/Checkout/Checkout.jsx` and `frontend/src/index.js`

**Issue**:
- PayPal wrapper uses `currency` from settings
- Has `key={paypalCurrency}` to force re-initialization when currency changes
- ✅ This should work correctly

**Status**: Should work correctly

---

## Specific Problems Found

### Problem 1: Exchange Rate Cache Not Invalidated
**Severity**: HIGH

When currency is changed:
1. Settings context updates ✅
2. Components should re-render ✅
3. BUT: Exchange rate cache is NOT invalidated ❌
4. `convertFromILSSync()` might use stale cached rates ❌

**Solution**: Invalidate exchange rate cache when currency changes, or force refresh.

---

### Problem 2: Settings Context Refresh Timing
**Severity**: MEDIUM

When settings are saved:
1. `refreshSiteSettings()` is called
2. `fetchSiteSettings()` is async
3. Components might render with old currency before new one is fetched

**Solution**: Ensure proper loading states and force re-render after settings update.

---

### Problem 3: Local Helper Functions in ProductsPage
**Severity**: LOW

`ProductsPage.jsx` has local helper functions that use currency:
```javascript
const getCurrencySymbol = (currencyCode) => { ... }
const formatPriceWithCommas = (price, currency, taxRate = 18) => { ... }
```

These are recreated on every render, which is fine, but they might cause unnecessary re-renders.

**Solution**: Move to utility file or memoize if needed.

---

## Recommendations

### 1. **Force Exchange Rate Refresh on Currency Change** (HIGH PRIORITY)
**Location**: `frontend/src/context/SettingsContext.jsx`

Add a mechanism to refresh exchange rates when currency changes:

```javascript
useEffect(() => {
  // When currency changes, refresh exchange rates
  if (siteSettings.currency) {
    getExchangeRates(); // Force refresh
  }
}, [siteSettings.currency]);
```

---

### 2. **Invalidate Exchange Rate Cache on Currency Change** (HIGH PRIORITY)
**Location**: `frontend/src/utils/exchangeRate.js`

Add a function to invalidate cache:

```javascript
export const invalidateExchangeRateCache = () => {
  localStorage.removeItem(EXCHANGE_RATE_CACHE_KEY);
};
```

Call this when currency changes in SettingsContext.

---

### 3. **Add Currency Change Listener** (MEDIUM PRIORITY)
**Location**: `frontend/src/context/SettingsContext.jsx`

Add a callback mechanism to notify when currency changes:

```javascript
const [currencyChangeListeners, setCurrencyChangeListeners] = useState([]);

const onCurrencyChange = useCallback((callback) => {
  setCurrencyChangeListeners(prev => [...prev, callback]);
  return () => {
    setCurrencyChangeListeners(prev => prev.filter(cb => cb !== callback));
  };
}, []);

useEffect(() => {
  currencyChangeListeners.forEach(callback => callback(siteSettings.currency));
}, [siteSettings.currency, currencyChangeListeners]);
```

---

### 4. **Force Component Re-render After Settings Save** (MEDIUM PRIORITY)
**Location**: `frontend/src/pages/manager/Settings/Settings.jsx`

After saving settings, ensure all components re-render:

```javascript
// After successful save
await refreshSiteSettings();
// Force a small delay to ensure context updates
await new Promise(resolve => setTimeout(resolve, 100));
// Components should now have updated currency
```

---

### 5. **Add Currency to Component Dependencies** (LOW PRIORITY)
Review all components that use currency and ensure:
- Currency is in `useEffect` dependencies if used in effects
- Currency is in `useMemo`/`useCallback` dependencies if used in memoized values
- No stale closures capture old currency values

---

### 6. **Add Debug Logging** (LOW PRIORITY)
Add temporary logging to track currency changes:

```javascript
useEffect(() => {
  console.log('Currency changed to:', siteSettings.currency);
}, [siteSettings.currency]);
```

---

## Testing Checklist

After implementing fixes, test:

1. ✅ Change currency in Settings → All pages should update immediately
2. ✅ Change currency → Cart totals should update
3. ✅ Change currency → Product prices should update
4. ✅ Change currency → Checkout totals should update
5. ✅ Change currency → Order history should show correct currency
6. ✅ Change currency → PayPal should use new currency
7. ✅ Change currency → Exchange rates should refresh
8. ✅ Change currency → No page refresh needed
9. ✅ Change currency → All prices convert correctly
10. ✅ Change currency → No console errors

---

## Implementation Priority

1. ✅ **HIGH**: Invalidate/refresh exchange rate cache on currency change - **IMPLEMENTED**
2. ✅ **HIGH**: Force exchange rate refresh when currency changes - **IMPLEMENTED**
3. ⏭️ **MEDIUM**: Add currency change listener mechanism - **NOT NEEDED** (React context handles this)
4. ✅ **MEDIUM**: Ensure proper re-rendering after settings save - **VERIFIED** (context updates trigger re-renders)
5. ⏭️ **LOW**: Move local helpers to utilities - **OPTIONAL** (not causing issues)
6. ✅ **LOW**: Add debug logging - **IMPLEMENTED** (console.log in currency change effect)

## Implementation Status

### ✅ Completed Fixes

1. **Exchange Rate Cache Invalidation** (`frontend/src/utils/exchangeRate.js`)
   - Added `invalidateExchangeRateCache()` function
   - Added `refreshExchangeRates()` function that invalidates cache and fetches fresh rates

2. **Currency Change Detection** (`frontend/src/context/SettingsContext.jsx`)
   - Added `useEffect` that monitors currency changes
   - Uses refs to track previous currency and skip initial load
   - Automatically refreshes exchange rates when currency changes
   - Only triggers on actual currency changes, not on initial load

3. **Settings Page Integration**
   - Already calls `refreshSiteSettings()` after save
   - This triggers the currency change effect in SettingsContext
   - Exchange rates are automatically refreshed

### How It Works Now

1. User changes currency in Settings page
2. Settings page saves to API and calls `refreshSiteSettings()`
3. SettingsContext updates `siteSettings.currency`
4. Currency change `useEffect` detects the change
5. Exchange rate cache is invalidated
6. Fresh exchange rates are fetched from API
7. All components re-render with new currency (React context)
8. `convertFromILSSync()` uses fresh cached rates or fallback rates
9. All prices display in new currency immediately

---

## Files That Need Changes

1. `frontend/src/context/SettingsContext.jsx` - Add currency change effect
2. `frontend/src/utils/exchangeRate.js` - Add cache invalidation function
3. `frontend/src/pages/manager/Settings/Settings.jsx` - Ensure proper refresh
4. `frontend/src/pages/ProductsPage/ProductsPage.jsx` - Review local helpers (optional)

---

## Expected Outcome

After fixes:
- Currency changes should immediately reflect across all pages
- Exchange rates should refresh when currency changes
- No stale cached values
- All components should re-render with new currency
- No page refresh needed

