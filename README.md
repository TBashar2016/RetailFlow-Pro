# RETAILFLOW-PRO

A comprehensive supershop management system built with the MERN stack (MongoDB, Express.js, React, Node.js).

## Features

### User Features
- User registration and login with role-based access (User, Admin, Employee)
- Browse products with search functionality
- Add products to cart with quantity selection
- View product details with pricing and discounts
- Cart management (add, remove, update quantities)
- Place orders with cash on delivery
- User profile management
- Document submission for verification (CV upload)

### Admin Features
- All user features plus:
- Product management (add, delete, apply discounts)
- Branch management (create new branches)
- Employee management (assign to branches, send salary)
- Document verification system
- Branch comparison tool
- View branch profiles and sales data
- Handle product requests from branches

### Employee Features
- All user features plus:
- View salary information and history
- Submit product requests for their assigned branch
- Access to assigned branch information

## Project Structure

```
RETAILFLOW-PRO/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Auth and upload middleware
│   ├── uploads/         # File upload directory
│   ├── server.js        # Main server file
│   └── .env            # Environment variables
└── frontend/
    ├── src/
    │   ├── components/  # Reusable components
    │   ├── contexts/    # React contexts
    │   ├── pages/       # Page components
    │   ├── services/    # API services
    │   └── App.tsx      # Main App component
    └── public/          # Static files
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Git

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create/Update the `.env` file with your MongoDB connection string:
   ```
   MONGODB_URI=your_mongodb_connection_string_here
   JWT_SECRET=your_secret_key_here
   PORT=5000
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm start
   ```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products (with search/filter)
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id/discount` - Apply discount (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)

### Branches
- `GET /api/branches` - Get all branches
- `POST /api/branches` - Create branch (Admin only)
- `GET /api/branches/compare/:id1/:id2` - Compare branches (Admin only)
- `POST /api/branches/:id/product-request` - Submit product request (Employee only)

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update/:itemId` - Update cart item
- `DELETE /api/cart/remove/:itemId` - Remove cart item

### Documents
- `POST /api/documents/submit` - Submit document for verification
- `GET /api/documents/pending` - Get pending documents (Admin only)
- `PUT /api/documents/review/:id` - Review document (Admin only)

### Employees
- `GET /api/employees` - Get all employees (Admin only)
- `PUT /api/employees/:id/assign-branch` - Assign employee to branch (Admin only)
- `POST /api/employees/:id/send-salary` - Send salary (Admin only)
- `GET /api/employees/salary-info` - Get salary info (Employee only)

### Orders
- `POST /api/orders/create` - Create order from cart
- `GET /api/orders/my-orders` - Get user's orders

## Default Admin Account

To get started, you can create an admin account by registering a user and then manually updating their role in the database:

1. Register a new user through the frontend
2. Connect to your MongoDB database
3. Find the user in the `users` collection
4. Update the `role` field from `"user"` to `"admin"`

## Technologies Used

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Bcrypt for password hashing
- Multer for file uploads
- CORS for cross-origin requests

### Frontend
- React with TypeScript
- Material-UI for UI components
- React Router for navigation
- Axios for HTTP requests
- Context API for state management

## Development Notes

- The system uses role-based access control with three roles: user, admin, and employee
- File uploads are handled for product images and document verification
- The cart system calculates totals automatically and updates branch sales upon order completion
- All routes are protected with appropriate authentication and authorization middleware
- The frontend uses Material-UI for a consistent and professional interface

## Next Steps

After setting up the project:

1. Add your MongoDB connection string to the backend `.env` file
2. Create an admin account as described above
3. Start creating branches and products
4. Test the complete user flow from registration to order placement

## Support

If you encounter any issues during setup or have questions about the functionality, please refer to the code comments and API documentation.
