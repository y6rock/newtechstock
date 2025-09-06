
# Backend Code Refactoring Instructions for Cursor AI

## Goal
Improve backend code structure by making routes shorter (max ~20 lines) and moving business logic into dedicated controller files.

---

## 1. Keep Routes Short (Max 20 Lines)
- Each route handler should only:
  - Handle request/response basics
  - Perform light validation
  - Call a controller function
  - Return a response

**Bad Example (too long in route):**
```js
router.post('/products', async (req, res) => {
   const { name, price } = req.body;
   const product = new Product({ name, price });
   await product.save();
   res.json(product);
});
```

**Good Example (short route):**
```js
import { createProduct } from '../controllers/productController.js';
router.post('/products', createProduct);
```

---

## 2. Move Functions into Controllers
- Create a `controllers/` folder inside `backend/`.
- Place all logic functions in relevant controller files (`productController.js`, `orderController.js`, etc.).

**Example: controllers/productController.js**
```js
export const createProduct = async (req, res) => {
   try {
      const { name, price } = req.body;
      const product = new Product({ name, price });
      await product.save();
      res.json(product);
   } catch (err) {
      res.status(500).json({ error: err.message });
   }
};
```

---

## 3. Recommended Project Structure
```
backend/
 ├── routes/
 │    ├── productRoutes.js
 │    └── orderRoutes.js
 ├── controllers/
 │    ├── productController.js
 │    └── orderController.js
 ├── models/
 │    ├── productModel.js
 │    └── orderModel.js
```

---

## 4. Benefits
- Clean, readable routes
- Reusable, testable controllers
- Easier to maintain and expand in the future

---

## Summary
- Limit each route to ~20 lines.
- Keep business logic out of routes.
- Create a `controllers/` folder and move functions there.
- Import controller functions into routes and call them directly.
