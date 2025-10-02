# Cursor Task Breakdown (Selected)

### TB1. One-folder-per-component: co-locate JSX and CSS per page/component
**Priority:** Normal  
**Branch:** `feature/tb1-one-folder-per-component-co-locate-jsx-and-css-per-pagecompo`  

**Context:**  
Restructure project so each page/component has its own folder (e.g., /about/index.jsx and /about/about.css or CSS module).

**Subtasks:**
- [ ] Audit src/pages and src/components to list files needing relocation.
- [ ] For each page/component, create a dedicated folder with index.jsx/tsx and a co-located style (CSS module or Tailwind).
- [ ] Update import paths; fix relative asset references.
- [ ] Run build to catch broken imports; update tests/snapshots.

**Acceptance Criteria:**
- [ ] Minimal, scoped diff; no broad refactors unless necessary
- [ ] No UI regressions mobile & desktop
- [ ] ESLint/TypeScript pass; no console errors
- [ ] PR includes before/after screenshots (UI tasks) and test notes
- [ ] All moved components build without broken imports
- [ ] Project tree reflects folder-per-component convention

**Cursor Prompt:**
```
You are Cursor AI working on a Next.js/React/TypeScript e‑commerce app for gadgets & electronics.
Implement: "One-folder-per-component: co-locate JSX and CSS per page/component" on branch feature/tb1-one-folder-per-component-co-locate-jsx-and-css-per-pagecompo. Keep changes minimal and scoped.
If ambiguity arises, choose the smallest sensible default and proceed.
```

---
### TB2. Home page: show only active categories + add image/description fields to Categories
**Priority:** High  
**Branch:** `feature/tb2-home-page-show-only-active-categories-add-imagedescription-f`  

**Context:**  
Add image and description to DB table Categories; update Manage Categories 'Add Category' popup to include inputs; Home page should render only active categories using these fields.

**Subtasks:**
- [ ] DB: add columns `image_url VARCHAR(512) NULL`, `description TEXT NULL` to Categories.
- [ ] Backend: extend Category model/DTO + validation for new fields.
- [ ] Admin UI (Manage Categories): add inputs for image and description in Add Category modal; validate and persist.
- [ ] Home page: query only `active=true` categories; render name, image, description.
- [ ] Fallbacks: placeholder image/description when missing.

**Acceptance Criteria:**
- [ ] Minimal, scoped diff; no broad refactors unless necessary
- [ ] No UI regressions mobile & desktop
- [ ] ESLint/TypeScript pass; no console errors
- [ ] PR includes before/after screenshots (UI tasks) and test notes
- [ ] DB migration applied; new fields persisted
- [ ] Home shows only active categories with image + description

**Cursor Prompt:**
```
You are Cursor AI working on a Next.js/React/TypeScript e‑commerce app for gadgets & electronics.
Implement: "Home page: show only active categories + add image/description fields to Categories" on branch feature/tb2-home-page-show-only-active-categories-add-imagedescription-f. Keep changes minimal and scoped.
If ambiguity arises, choose the smallest sensible default and proceed.
```

---
### TB3. Manage Customers: add/restore search bar
**Priority:** High  
**Branch:** `feature/tb3-manage-customers-addrestore-search-bar`  

**Context:**  
Customers page needs a functional search (name, email, phone). If hidden, unhide; else implement.

**Subtasks:**
- [ ] Determine if search bar exists but hidden; if yes, unhide and wire up; if no, implement a search input.
- [ ] Backend: support query params (?q=...) for name/email/phone (case-insensitive, partial).
- [ ] Debounce input; show loading/empty states; preserve filters/sort with search.
- [ ] Add simple unit test for search function and an integration test stub.

**Acceptance Criteria:**
- [ ] Minimal, scoped diff; no broad refactors unless necessary
- [ ] No UI regressions mobile & desktop
- [ ] ESLint/TypeScript pass; no console errors
- [ ] PR includes before/after screenshots (UI tasks) and test notes
- [ ] Search returns expected results for partial matches
- [ ] Empty state and loading indicators implemented

**Cursor Prompt:**
```
You are Cursor AI working on a Next.js/React/TypeScript e‑commerce app for gadgets & electronics.
Implement: "Manage Customers: add/restore search bar" on branch feature/tb3-manage-customers-addrestore-search-bar. Keep changes minimal and scoped.
If ambiguity arises, choose the smallest sensible default and proceed.
```

---
### TB4. Pagination or Load More on target pages
**Priority:** High  
**Branch:** `feature/tb4-pagination-or-load-more-on-target-pages`  

**Context:**  
Add pagination or 'Load More' on: Products, Order History, Manage Products, Manage Promotions, Manage Customers, Manage Categories, Manage Suppliers, Manage Orders.

**Subtasks:**
- [ ] Pick pattern: server-side offset/limit pagination OR client 'Load More' via cursor.
- [ ] Implement on each page: Products, Order History, Manage Products, Manage Promotions, Manage Customers, Manage Categories, Manage Suppliers, Manage Orders.
- [ ] Add shared Pagination component; ensure ARIA/keyboard support.
- [ ] Persist paging state in URL (e.g., ?page=2) on admin lists.

**Acceptance Criteria:**
- [ ] Minimal, scoped diff; no broad refactors unless necessary
- [ ] No UI regressions mobile & desktop
- [ ] ESLint/TypeScript pass; no console errors
- [ ] PR includes before/after screenshots (UI tasks) and test notes
- [ ] All listed pages support paging or Load More
- [ ] State preserved on navigation/back

**Cursor Prompt:**
```
You are Cursor AI working on a Next.js/React/TypeScript e‑commerce app for gadgets & electronics.
Implement: "Pagination or Load More on target pages" on branch feature/tb4-pagination-or-load-more-on-target-pages. Keep changes minimal and scoped.
If ambiguity arises, choose the smallest sensible default and proceed.
```

---
### TB5. Product list range slider drag issue
**Priority:** High  
**Branch:** `feature/tb5-product-list-range-slider-drag-issue`  

**Context:**  
Fix price (or attribute) range slider: dragging is not smooth and gets stuck.

**Subtasks:**
- [ ] Reproduce: identify events blocking drag (pointer/mouse/touch).
- [ ] If using a lib (noUiSlider/rc-slider), upgrade and align event handlers; otherwise normalize pointer events.
- [ ] Ensure the handle doesn't lose focus or collide with overlay elements (z-index).
- [ ] Write a unit test for the slider value function and manual QA steps.

**Acceptance Criteria:**
- [ ] Minimal, scoped diff; no broad refactors unless necessary
- [ ] No UI regressions mobile & desktop
- [ ] ESLint/TypeScript pass; no console errors
- [ ] PR includes before/after screenshots (UI tasks) and test notes
- [ ] Slider drag smooth on mouse, touch, and trackpad
- [ ] No pointer-capture conflicts; no stuck handle

**Cursor Prompt:**
```
You are Cursor AI working on a Next.js/React/TypeScript e‑commerce app for gadgets & electronics.
Implement: "Product list range slider drag issue" on branch feature/tb5-product-list-range-slider-drag-issue. Keep changes minimal and scoped.
If ambiguity arises, choose the smallest sensible default and proceed.
```

---
### TB6. Suppliers & Categories: search bar overlaps filters
**Priority:** Normal  
**Branch:** `feature/tb6-suppliers-categories-search-bar-overlaps-filters`  

**Context:**  
Fix layout spacing/overlap between search bar and filter controls.

**Subtasks:**
- [ ] Inspect layout container (Flex/Grid); fix gaps/margins between search and filters.
- [ ] Ensure responsive breakpoints; wrap to next line under small widths.
- [ ] Add min-widths to inputs; avoid absolute positioning for the search bar.
- [ ] Verify no overlap at 320px–1440px widths.

**Acceptance Criteria:**
- [ ] Minimal, scoped diff; no broad refactors unless necessary
- [ ] No UI regressions mobile & desktop
- [ ] ESLint/TypeScript pass; no console errors
- [ ] PR includes before/after screenshots (UI tasks) and test notes
- [ ] No overlap at common breakpoints (360, 768, 1024, 1280px)
- [ ] Search and filters align per design

**Cursor Prompt:**
```
You are Cursor AI working on a Next.js/React/TypeScript e‑commerce app for gadgets & electronics.
Implement: "Suppliers & Categories: search bar overlaps filters" on branch feature/tb6-suppliers-categories-search-bar-overlaps-filters. Keep changes minimal and scoped.
If ambiguity arises, choose the smallest sensible default and proceed.
```

---
### TB7. Home page promo banner: click code opens promo details popup
**Priority:** High  
**Branch:** `feature/tb7-home-page-promo-banner-click-code-opens-promo-details-popup`  

**Context:**  
Clicking a promotion code on the Home page banner should open a modal with promotion details (applies to, quantity limit, discount type, expiry, etc.).

**Subtasks:**
- [ ] Create PromoDetailsModal component; props: code, appliesTo, limitQty, discountType, expiresAt, description.
- [ ] Wire Home banner: on code click, fetch promo details (if not already present) and open modal.
- [ ] Add close/escape handlers; block background scroll; focus trap for accessibility.
- [ ] Unit test open/close; snapshot modal rendering; manual QA checklist.

**Acceptance Criteria:**
- [ ] Minimal, scoped diff; no broad refactors unless necessary
- [ ] No UI regressions mobile & desktop
- [ ] ESLint/TypeScript pass; no console errors
- [ ] PR includes before/after screenshots (UI tasks) and test notes
- [ ] Modal shows correct promo details fields
- [ ] Accessible focus management and escape to close

**Cursor Prompt:**
```
You are Cursor AI working on a Next.js/React/TypeScript e‑commerce app for gadgets & electronics.
Implement: "Home page promo banner: click code opens promo details popup" on branch feature/tb7-home-page-promo-banner-click-code-opens-promo-details-popup. Keep changes minimal and scoped.
If ambiguity arises, choose the smallest sensible default and proceed.
```

---
### TB8. Cart stored only in session (no DB persistence)
**Priority:** High  
**Branch:** `feature/tb8-cart-stored-only-in-session-no-db-persistence`  

**Context:**  
Ensure when a user adds products to cart, items are stored locally in session (sessionStorage/localStorage or in-memory state) without any database write. Cart should reset on logout/clear session.

**Subtasks:**
- [ ] Implement cart context/provider with React Context API.
- [ ] Persist cart items in sessionStorage (or memory) only, not database.
- [ ] On add-to-cart: update context + sessionStorage.
- [ ] On logout or session clear: reset cart to empty.
- [ ] Ensure quantities update correctly, no duplicate entries.
- [ ] Add unit tests for add/remove/update cart logic.

**Acceptance Criteria:**
- [ ] Minimal, scoped diff; no broad refactors unless necessary
- [ ] No UI regressions mobile & desktop
- [ ] ESLint/TypeScript pass; no console errors
- [ ] PR includes before/after screenshots (UI tasks) and test notes
- [ ] Cart persists across reloads within same session
- [ ] Clearing session/logging out empties cart
- [ ] No API/DB writes occur for cart actions

**Cursor Prompt:**
```
You are Cursor AI working on a Next.js/React/TypeScript e‑commerce app for gadgets & electronics.
Implement: "Cart stored only in session (no DB persistence)" on branch feature/tb8-cart-stored-only-in-session-no-db-persistence. Keep changes minimal and scoped.
If ambiguity arises, choose the smallest sensible default and proceed.
```

---