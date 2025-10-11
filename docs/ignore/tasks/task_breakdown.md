### 1. Link Promotion Table with Order

**Context:**  
Orders currently do not reference promotions. This prevents tracking which promotion was applied and complicates reporting.

**Subtasks:**
- Add a `promotion_id` field (nullable) to the `orders` table in the database.
- Update backend APIs to support linking orders with promotions.
- Adjust order creation logic to save the applied promotion ID when checkout occurs.
- Update order details UI to show the promotion code and discount information.

**Acceptance Criteria:**
- Orders correctly reference promotion IDs when applicable.
- Promotion details are displayed in the order details view.
- No errors occur when placing orders without promotions.
- Database migration works without data loss.


### 2. Remove `buy_x_gety` Promotion If Not Used

**Context:**  
The `buy_x_gety` promotion type seems unused and may cause confusion or dead code paths.

**Subtasks:**
- Check codebase for references to `buy_x_gety`.
- Remove fields, logic, or UI elements related to this promotion type if truly unused.
- Clean up database schema if necessary.
- Test other promotion types to ensure no breakage.

**Acceptance Criteria:**
- No code or UI references remain for `buy_x_gety`.
- Other promotions work normally.
- Code compiles and tests pass.


### 3. Category Image Saving and Display

**Context:**  
When adding a category, uploading an image does not currently save to DB or display in the categories section.

**Subtasks:**
- Modify the Add Category form to accept image upload.
- Save image URL/path to the database.
- Update Home and Manage Categories pages to display the category image.
- Implement fallback image when none is provided.

**Acceptance Criteria:**
- Images upload successfully and are stored in the DB.
- Category images appear in the UI consistently.
- Layout remains responsive and visually consistent.



### 4. “View Orders” in Customers Throws Error

**Context:**  
Clicking “View Orders” for a customer causes an error, likely due to backend response or routing issues.

**Subtasks:**
- Reproduce the issue and trace stack.
- Check API endpoint or frontend data handling.
- Fix the route or component logic.
- Test with different customer accounts.

**Acceptance Criteria:**
- “View Orders” works without errors for all customers.
- API calls return correct data.
- No regression on related pages.



### 5. Filtering Customers Active/Inactive Products

**Context:**  
The customers page lacks or has broken filtering by active/inactive products.

**Subtasks:**
- Add filter UI (buttons/dropdown) for active/inactive.
- Adjust backend query or frontend filtering logic.
- Test filtering with different states.

**Acceptance Criteria:**
- Filter correctly switches between active/inactive customers.
- No performance regressions.
- UI is intuitive and consistent.



### 6. Pagination Not Working Properly

**Context:**  
Pagination buttons (next page) don’t actually change the data view — they stay on the same page.

**Subtasks:**
- Investigate pagination logic on affected pages.
- Fix page state updates and API query parameters.
- Test on:
  - Products
  - Order History
  - Manage Products
  - Manage Promotions
  - Manage Customers
  - Manage Categories
  - Manage Suppliers
  - Manage Orders

**Acceptance Criteria:**
- Clicking next/previous correctly fetches the corresponding page data.
- No duplicated or stuck pages.
- Works consistently across all listed pages.




### 7. Product Filters Not Working

**Context:**  
Product filtering is broken — either UI doesn’t send correct queries or backend doesn’t return expected results.

**Subtasks:**
- Inspect filter UI event handlers.
- Verify query parameters sent to API.
- Check backend filter logic.
- Fix inconsistencies and retest.

**Acceptance Criteria:**
- Filters work for all supported fields (category, price, etc.).
- Results update instantly when filters are changed.
- No regressions on pagination.



### 8. Rename `index.jsx` Files to Match Component Names

**Context:**  
Many components and pages use `index.jsx` files, making file navigation confusing.

**Subtasks:**
- Rename `index.jsx` files to match their folder/component names.
- Do the same for CSS files.
- Update imports throughout the project accordingly.

**Acceptance Criteria:**
- All components/pages use descriptive filenames.
- App builds successfully with updated imports.
- No broken paths remain.



### 9. Overlap in Suppliers & Categories Search Fields

**Context:**  
The search bar icons/text overlap in Suppliers and Categories pages.

**Subtasks:**
- Inspect CSS layout of search input containers.
- Adjust padding/margins and positioning.
- Test responsiveness.

**Acceptance Criteria:**
- No overlap between icons and text in search inputs.
- Layout remains consistent on different screen sizes.





### 10. Cart Persistence Across Tabs/Sessions

**Context:**  
Cart should persist across tabs and refreshes using session/local storage, not be lost or isolated per tab.

**Subtasks:**
- Implement sessionStorage/localStorage sync for cart state.
- Load cart state on app init.
- Sync updates across tabs using `storage` event.

**Acceptance Criteria:**
- Cart persists across page reloads and tabs.
- Cart clears on logout or manual clear.
- No duplicate or conflicting items appear.


### 11. Input Validations

**Context:**  
Login, signup, and profile forms need proper validation to prevent bad data entry.

**Subtasks:**
- Implement frontend validation for required fields and formats.
- Add backend validation as a second layer.
- Display clear error messages to users.

**Acceptance Criteria:**
- All forms reject invalid input with proper messages.
- No invalid data is sent to backend.
- UX is smooth and responsive.


### 12. PayPal Checkout Returns as Cancelled

**Context:**  
After a PayPal checkout, the app treats the transaction as cancelled and no invoice is sent.

**Subtasks:**
- Investigate PayPal callback handling.
- Ensure successful payment updates order status and triggers invoice.
- Handle cancellation and error flows properly.

**Acceptance Criteria:**
- Successful PayPal payment leads to confirmation page, not cancellation.
- Invoice is sent properly.
- Cancellation/error are handled separately.
