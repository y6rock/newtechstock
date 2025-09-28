
# Cursor AI – Implementation Brief for Customer Fixes
**Project:** React-based online shop (Electronics & Gadgets)  
**Goal:** Implement all customer-requested fixes with clear acceptance criteria, tests, and DoD.  
**Author:** Generated brief for Cursor AI

## Global Engineering Guidelines (apply to all tasks)
- **File hygiene:** Keep JSX/TSX free of styling rules; move CSS to a colocated `.css`/`.scss` or to a styled-component file; keep data-fetching and side effects in hooks/services.
- **Naming & structure:** Components in `src/components/...`; pages in `src/pages/...`; shared UI in `src/ui/...`; constants in `src/constants/...`.
- **Theming:** Use a theme file for colors (add `--color-bg:#f8f8f8` etc.). Avoid hardcoding magic values.
- **Accessibility:** Semantic HTML, labels for inputs, alt text for images, keyboard navigable controls.
- **Testing:** Provide a quick manual test note per task; update unit tests if logic changed.
- **Git etiquette:** One PR per task (or cohesive group), descriptive commit messages: `fix(header): move search to header with redirect`. Link task IDs T1, T2, ...

---
### T1. Set the background color of all pages to #f8f8f8
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _Set the background color of all pages to #f8f8f8_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T2. Fix the styles of the About and Contact Us pages to improve layout, colors, spacing, and readability
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _Fix the styles of the About and Contact Us pages to improve layout, colors, spacing, and readability_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T3. Spreate jsx from css from file Suppliers.jsx
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _Spreate jsx from css from file Suppliers.jsx_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T4. In the frontend, for each component, place the JSX and CSS files together in the same folder and give them the same name
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _In the frontend, for each component, place the JSX and CSS files together in the same folder and give them the same name_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T5. Fix the Login, Signup, and Forgot Password pages by updating their styles, including colors, icons, and overall layout, and remove the small purple line at the top of the pages
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _Fix the Login, Signup, and Forgot Password pages by updating their styles, including colors, icons, and overall layout, and remove the small purple line at the top of the pages_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T6. In Home page fix the PromotionsBanner style
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _In Home page fix the PromotionsBanner style_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T7. On the Home page, display only active categories. To do this, add image and description fields to the Categories table in the database, and update the Add Category popup in Manage Categories to include inputs for these new fields
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _On the Home page, display only active categories. To do this, add image and description fields to the Categories table in the database, and update the Add Category popup in Manage Categories to include inputs for these new fields_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T8. Move the search bar to the header. When a search is performed, display a dropdown showing the product name, image and price for each result
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _Move the search bar to the header. When a search is performed, display a dropdown showing the product name, image and price for each result_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T9. Fix the styles of the Products and Product Details pages to enhance layout, colors, spacing, and overall readability
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _Fix the styles of the Products and Product Details pages to enhance layout, colors, spacing, and overall readability_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T10. On the Products page, when a user clicks on ‘Basket’ without being logged in, redirect them to the Login page
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _On the Products page, when a user clicks on ‘Basket’ without being logged in, redirect them to the Login page_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T11. In the banner for the promotion code, display what the discount applies to
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _In the banner for the promotion code, display what the discount applies to_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T12. Fix style for the cart icon and cart link in the header to display the number in correct dimensions
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _Fix style for the cart icon and cart link in the header to display the number in correct dimensions_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T13. Remove Order History link in the header
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _Remove Order History link in the header_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T14. On the Order History page, add a link to the Profile page. The page layout should be the same as the Profile page, but the content will display order-specific details instead of user info
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _On the Order History page, add a link to the Profile page. The page layout should be the same as the Profile page, but the content will display order-specific details instead of user info_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T15. Instead of showing a popup after updating the profile, display a toast notification at the bottom-left corner of the page
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _Instead of showing a popup after updating the profile, display a toast notification at the bottom-left corner of the page_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T16. On the Cart page, fix the layout, styling, and buttons to improve appearance and usability
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _On the Cart page, fix the layout, styling, and buttons to improve appearance and usability_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T17. Show a bottom-left toast error if cart quantity exceeds stock on Products, Product Details, or Cart pages
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _Show a bottom-left toast error if cart quantity exceeds stock on Products, Product Details, or Cart pages_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T18. If a product’s price or its category, supplier, or the product itself is updated, update the cart accordingly but keep past orders unchanged. If the product is deleted or out of stock, remove it from the cart
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _If a product’s price or its category, supplier, or the product itself is updated, update the cart accordingly but keep past orders unchanged. If the product is deleted or out of stock, remove it from the cart_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T19. On the Checkout page, clicking the PayPal button should open the PayPal sandbox for payment, but currently it does not
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _On the Checkout page, clicking the PayPal button should open the PayPal sandbox for payment, but currently it does not_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T20. On the Checkout page, after clicking ‘Place Order,’ display a toast notification at the bottom-left corner of the page
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _On the Checkout page, after clicking ‘Place Order,’ display a toast notification at the bottom-left corner of the page_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T21. When logging into the same account from another browser, the cart from the first browser doesn’t appear (likely stored in localStorage)
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _When logging into the same account from another browser, the cart from the first browser doesn’t appear (likely stored in localStorage)_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T22. In Manage Products, Promotions, Categories, Suppliers, and Customers → show a confirmation popup before delete/restore, then toast at bottom-left
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _In Manage Products, Promotions, Categories, Suppliers, and Customers → show a confirmation popup before delete/restore, then toast at bottom-left_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T23. If a promotion code was used in a purchase, display it in the Order History table, in Manage Orders for the admin, and in Manage Customers when viewing the order details
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _If a promotion code was used in a purchase, display it in the Order History table, in Manage Orders for the admin, and in Manage Customers when viewing the order details_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T24. When clicking ‘Logout,’ no matter which page the user is on, they should be redirected to the Home page
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _When clicking ‘Logout,’ no matter which page the user is on, they should be redirected to the Home page_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T25. When logging in as an admin, redirect to the Manage page by default
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _When logging in as an admin, redirect to the Manage page by default_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T26. On the Products and Product Details pages, if the user tries to add more items than the available stock, show a toast notification at the bottom-left corner of the page.
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _On the Products and Product Details pages, if the user tries to add more items than the available stock, show a toast notification at the bottom-left corner of the page._.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T27. If there is only one item left in stock and multiple users have it in their carts, the first user to place the order will reduce the stock to 0. For the other users, prevent adding more of this product to their carts, and when they attempt to place an order, show a toast notification at the bottom-left corner of the page indicating it’s out of stock.”
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _If there is only one item left in stock and multiple users have it in their carts, the first user to place the order will reduce the stock to 0. For the other users, prevent adding more of this product to their carts, and when they attempt to place an order, show a toast notification at the bottom-left corner of the page indicating it’s out of stock.”_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T28. If a product’s price is updated, it should be updated in the cart as well. However, for past orders, the price should remain as it was at the time of purchase
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _If a product’s price is updated, it should be updated in the cart as well. However, for past orders, the price should remain as it was at the time of purchase_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T29. Improve the layout of the invoice to make it clearer, better organized, and more readable.
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _Improve the layout of the invoice to make it clearer, better organized, and more readable._.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T30. On all admin pages, make the layout use the maximum available width of the page
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _On all admin pages, make the layout use the maximum available width of the page_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T31. On the Dashboard page, display statistics for the last 30 days by default
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _On the Dashboard page, display statistics for the last 30 days by default_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T32. In the Dashboard, the end date in the calendar should not allow selecting a date earlier than the start date
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _In the Dashboard, the end date in the calendar should not allow selecting a date earlier than the start date_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T33. On Dashboard for Low Stock Products (≤10 units), display the product image in the preview. Show this section as the first element on the Dashboard page, and place the graphs below it. Display up to 6 low stock products by default, and add a ‘Load More’ option if there are additional products
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _On Dashboard for Low Stock Products (≤10 units), display the product image in the preview. Show this section as the first element on the Dashboard page, and place the graphs below it. Display up to 6 low stock products by default, and add a ‘Load More’ option if there are additional products_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T34. In Manage Products, add filters for Supplier and Category
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _In Manage Products, add filters for Supplier and Category_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T35. In Manage Products, save the entered price as-is in the database (without tax). Display the Final Price (including tax) in the admin table and for customers. Example: 100 saved → shown as 118 with 18% tax
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _In Manage Products, save the entered price as-is in the database (without tax). Display the Final Price (including tax) in the admin table and for customers. Example: 100 saved → shown as 118 with 18% tax_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T36. In the Manage Products page, display the stock number next to the description (Low/Medium/High stock)
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _In the Manage Products page, display the stock number next to the description (Low/Medium/High stock)_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T37. In Manage Products, Manage Suppliers, Manage Categories, Manage Promotions, and Settings pages, after adding, editing, deleting, or saving changes, display a toast notification at the bottom-left corner of the page
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _In Manage Products, Manage Suppliers, Manage Categories, Manage Promotions, and Settings pages, after adding, editing, deleting, or saving changes, display a toast notification at the bottom-left corner of the page_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T38. In Manage Promotions, remove the red ‘Deactivate Expired’ button and add filters to show Pending, Active and Inactive promotions
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _In Manage Promotions, remove the red ‘Deactivate Expired’ button and add filters to show Pending, Active and Inactive promotions_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T39. When deleting a promotion, also remove it from the database
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _When deleting a promotion, also remove it from the database_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T40. After adding or editing a promotion, show a toast notification at the bottom-left corner of the page
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _After adding or editing a promotion, show a toast notification at the bottom-left corner of the page_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T41. In the Add/Edit Promotion popup, set the option to limit the promotion to one product (minimum 1, maximum 1)
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _In the Add/Edit Promotion popup, set the option to limit the promotion to one product (minimum 1, maximum 1)_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T42. In the Edit Promotion popup, display the start and end dates that were previously set for the promotion
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _In the Edit Promotion popup, display the start and end dates that were previously set for the promotion_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T43. In the Add or Edit Promotion popup, make the ‘Enable this Promotion’ checkbox functional and fix its styling
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _In the Add or Edit Promotion popup, make the ‘Enable this Promotion’ checkbox functional and fix its styling_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T44. When adding a promotion code with a name that already exists, show an error message
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _When adding a promotion code with a name that already exists, show an error message_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T45. In the Promotion popup, the start date in the calendar should not allow selecting a past date, and the end date should not allow selecting a date before the start date
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _In the Promotion popup, the start date in the calendar should not allow selecting a past date, and the end date should not allow selecting a date before the start date_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T46. In Manage Customers, fix the layout of the search input
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _In Manage Customers, fix the layout of the search input_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T47. In Manage Customers, fix the ‘View Orders’ feature so that order amounts display correctly instead of zero, and show the items in each order in a dropdown when clicking on it
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _In Manage Customers, fix the ‘View Orders’ feature so that order amounts display correctly instead of zero, and show the items in each order in a dropdown when clicking on it_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T48. In Manage Customers, make delete mark customers as Inactive and restore them, showing a toast at the bottom-left. Only allow deletion if the customer has no orders
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _In Manage Customers, make delete mark customers as Inactive and restore them, showing a toast at the bottom-left. Only allow deletion if the customer has no orders_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T49. In Manage Categories and Manage Suppliers, if a user tries to add an item that already exists in the database, show an error toast notification
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _In Manage Categories and Manage Suppliers, if a user tries to add an item that already exists in the database, show an error toast notification_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T50. In Manage Categories and Manage Suppliers, add a search input and filters to show Active and Inactive items
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _In Manage Categories and Manage Suppliers, add a search input and filters to show Active and Inactive items_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T51. In Manage Suppliers, fix the delete feature so that it correctly marks a supplier as inactive
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _In Manage Suppliers, fix the delete feature so that it correctly marks a supplier as inactive_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T52. In Manage Orders, align all the boxes in the same row, and place the filters, including the ‘Search by Name/Email’ input, in a separate row below
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _In Manage Orders, align all the boxes in the same row, and place the filters, including the ‘Search by Name/Email’ input, in a separate row below_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T53. In the tables of Manage Products, Manage Customers, Manage Categories, Manage Suppliers, and Manage Orders, add sorting arrows to the title of each column to allow sorting (up and down)
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _In the tables of Manage Products, Manage Customers, Manage Categories, Manage Suppliers, and Manage Orders, add sorting arrows to the title of each column to allow sorting (up and down)_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T54. For the following pages, use whether pagination or a ‘Load More’ button: Products page, Order History, Manage Products, Manage Promotions, Manage Customers, Manage Categories, Manage Suppliers, and Manage Orders
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _For the following pages, use whether pagination or a ‘Load More’ button: Products page, Order History, Manage Products, Manage Promotions, Manage Customers, Manage Categories, Manage Suppliers, and Manage Orders_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T55. In the database, the Promotion table must be linked to the Order table using the Order ID
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _In the database, the Promotion table must be linked to the Order table using the Order ID_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T56. In the Settings table in the database, keep only the following fields: ID, TaxRate, and Currency
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _In the Settings table in the database, keep only the following fields: ID, TaxRate, and Currency_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T57. In Settings, set the Store Currency to use the actual current currency value
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _In Settings, set the Store Currency to use the actual current currency value_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T58. What is the purpose of storing contact messages in the database? The contact messages are already being sent by email. If you want to implement this feature, you must add it to the Admin sidebar and fully implement it. Otherwise, delete controllers/contactController.js, routes/contact.js, and the CONTACT_MESSAGES table in the database
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _What is the purpose of storing contact messages in the database? The contact messages are already being sent by email. If you want to implement this feature, you must add it to the Admin sidebar and fully implement it. Otherwise, delete controllers/contactController.js, routes/contact.js, and the CONTACT_MESSAGES table in the database_.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.

### T59. provide an additional sql db file, but with empty content. keep the original with all contant.
**Severity:** Unspecified

**Context for Cursor**
- Stack: React (frontend). Assume modular CSS/SCSS or CSS-in-JS where applicable.
- Follow component responsibility: view markup in JSX, styles in dedicated stylesheet (or styled component), data fetching in services/hooks.

**Acceptance Criteria**
- The change implements: _provide an additional sql db file, but with empty content. keep the original with all contant._.
- No console errors or React warnings.
- Styling matches design system (consistent spacing, typography, colors).
- Works across desktop and common mobile widths (≥360px).

**Test Plan**
- Manual: validate on Chrome and Safari desktop; Chrome mobile emulation at 390×844 and 430×932.
- Accessibility: tab navigation works; interactive elements have visible focus; images have alt text.
- Performance: no layout shift during interaction; no network errors.

**Definition of Done**
- Code passes `npm run lint` and `npm run build`.
- Unit/smoke tests updated if components changed.
- PR includes before/after screenshots or short Loom/GIF.
