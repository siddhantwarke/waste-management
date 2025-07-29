# Waste Management App

A comprehensive waste management application that connects customers who need waste pickup with reliable waste collectors. Built with React (Frontend) and Node.js (Backend) with JWT authentication and role-based access control.

## Features

### Authentication & Security
- ✅ Secure user registration and login
- ✅ JWT token-based authentication
- ✅ Password hashing with bcrypt
- ✅ Input validation and sanitization
- ✅ Role-based access control (Customer/Collector)
- ✅ Protected routes and middleware
- ✅ Rate limiting and security headers

### User Roles

#### Customer Features
- Request waste pickup services
- View and manage pickup requests
- Track pickup status
- Rate and review collectors
- View pickup history

#### Collector Features
- Browse available pickup requests
- Accept and manage collection jobs
- Update job status
- View earnings and statistics
- Build reputation through ratings

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database (with SQLite Viewer extension support)
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **helmet** - Security middleware
- **cors** - Cross-origin resource sharing
- **express-rate-limit** - Rate limiting

### Frontend
- **React 18** - UI library
- **Redux** - State management (with mapStateToProps and mapDispatchToProps)
- **React Router** - Client-side routing
- **Bootstrap 5** - CSS framework
- **React Bootstrap** - Bootstrap components for React
- **Formik & Yup** - Form handling and validation
- **Axios** - HTTP client
- **React Toastify** - Notifications
- **FontAwesome** - Icons

## Project Structure

```
waste-management-app/
├── backend/
│   ├── config/
│   │   └── database.js          # SQLite database configuration
│   ├── controllers/
│   │   └── authController.js    # Authentication logic
│   ├── database/
│   │   └── waste_management.db  # SQLite database file
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication middleware
│   │   └── validation.js       # Input validation middleware
│   ├── models/
│   │   └── User.js             # User model
│   ├── routes/
│   │   └── auth.js             # Authentication routes
│   ├── .env                    # Environment variables
│   ├── package.json
│   └── server.js               # Main server file
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Login.jsx        # Login component
    │   │   ├── Register.jsx     # Registration component
    │   │   ├── Navbar.jsx       # Navigation component
    │   │   └── ProtectedRoute.jsx # Route protection
    │   ├── pages/
    │   │   ├── Home.jsx         # Landing page
    │   │   └── Dashboard.jsx    # User dashboard
    │   ├── redux/
    │   │   ├── actions/
    │   │   │   ├── types.js     # Action type constants
    │   │   │   └── authActions.js # Authentication actions
    │   │   ├── reducers/
    │   │   │   ├── index.js     # Root reducer
    │   │   │   └── authReducer.js # Auth state reducer
    │   │   └── store.js         # Redux store configuration
    │   ├── services/
    │   │   └── api.js           # API service layer
    │   ├── utils/
    │   │   └── helpers.js       # Utility functions
    │   ├── App.jsx              # Main App component
    │   ├── App.css              # Custom styles
    │   └── index.js             # React entry point
    ├── .env                     # Environment variables
    └── package.json
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- VS Code with SQLite Viewer extension (recommended)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment variables:
   ```bash
   # .env file is already created with default values
   # Update JWT_SECRET for production use
   ```

4. Start the server:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The frontend will run on `http://localhost:3000`

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'collector')),
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1
);
```

### Waste Requests Table
```sql
CREATE TABLE waste_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  collector_id INTEGER,
  waste_type VARCHAR(50) NOT NULL,
  quantity DECIMAL(10,2),
  pickup_address TEXT NOT NULL,
  pickup_date DATE,
  pickup_time TIME,
  status VARCHAR(20) DEFAULT 'pending',
  special_instructions TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (collector_id) REFERENCES users(id)
);
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)
- `GET /api/auth/verify` - Verify JWT token (protected)

### Health Check
- `GET /api/health` - API health status

## Security Features

1. **Password Security**: Passwords are hashed using bcrypt with salt rounds
2. **JWT Authentication**: Secure token-based authentication
3. **Input Validation**: Comprehensive validation using express-validator
4. **Rate Limiting**: Protection against brute force attacks
5. **CORS Protection**: Configured CORS for cross-origin requests
6. **Security Headers**: Helmet.js for security headers
7. **Role-based Access**: Different access levels for customers and collectors

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRE=30d
DB_PATH=./database/waste_management.db
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_APP_NAME=Waste Management App
```

## Redux State Management

The application uses Redux with the classic pattern including:
- **mapStateToProps**: Maps Redux state to component props
- **mapDispatchToProps**: Maps action dispatchers to component props
- **Actions**: Authentication actions for login, register, logout
- **Reducers**: Authentication reducer managing user state
- **Store**: Centralized state store with Redux DevTools support

## Testing the Application

1. **Registration**:
   - Visit `http://localhost:3000/register`
   - Create accounts for both customer and collector roles
   - Test form validation with invalid inputs

2. **Login**:
   - Use the registered credentials to login
   - Verify JWT token storage and authentication state

3. **Dashboard Access**:
   - Check role-based dashboard content
   - Test protected route access

4. **Database Viewing**:
   - Use VS Code SQLite Viewer extension
   - Open `backend/database/waste_management.db`
   - View user data and table structures

## Future Enhancements

- [ ] Waste pickup request management
- [ ] Real-time tracking and notifications
- [ ] Payment integration
- [ ] Rating and review system
- [ ] Admin dashboard
- [ ] Mobile app support
- [ ] Push notifications
- [ ] Advanced search and filtering

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the ISC License.
