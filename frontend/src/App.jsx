import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';

// Redux Store
import store from './redux/store';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import MyRequests from './components/MyRequests';
import Profile from './components/Profile';

// Pages
import Home from './pages/Home';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './pages/Dashboard';

// Redux Actions
import { loadUser } from './redux/actions/authActions';

// Styles
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './App.css';

function App() {
  useEffect(() => {
    // Load user from token when app starts
    store.dispatch(loadUser());
  }, []);

  return (
    <Provider store={store}>
      <Router>
        <div className="App">
          <Navbar />
          
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              
              {/* Customer-only Routes */}
              <Route
                path="/my-requests"
                element={
                  <ProtectedRoute requiredRole="customer">
                    <MyRequests />
                  </ProtectedRoute>
                }
              />
              
              {/* Collector-only Routes */}
              <Route
                path="/available-requests"
                element={
                  <ProtectedRoute requiredRole="collector">
                    <div className="container py-5">
                      <h2>Available Requests - Coming Soon</h2>
                      <p>This feature will show available pickup requests for collectors.</p>
                    </div>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/my-collections"
                element={
                  <ProtectedRoute requiredRole="collector">
                    <div className="container py-5">
                      <h2>My Collections - Coming Soon</h2>
                      <p>This feature will show collector's assigned collections.</p>
                    </div>
                  </ProtectedRoute>
                }
              />
              
              {/* Common Protected Routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              
              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          
          {/* Toast Notifications */}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </Provider>
  );
}

export default App;
