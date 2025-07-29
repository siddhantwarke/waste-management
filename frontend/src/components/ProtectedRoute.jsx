import React from 'react';
import { Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { Spinner, Container, Row, Col } from 'react-bootstrap';

const ProtectedRoute = ({ children, auth, requiredRole = null }) => {
  // Show loading spinner while checking authentication
  if (auth.loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Loading...</p>
        </div>
      </Container>
    );
  }

  // Redirect to login if not authenticated
  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (requiredRole && auth.user?.role !== requiredRole) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6} className="text-center">
            <div className="alert alert-warning">
              <h4>Access Denied</h4>
              <p>You don't have permission to access this page.</p>
              <p>Required role: <strong>{requiredRole}</strong></p>
              <p>Your role: <strong>{auth.user?.role}</strong></p>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  return children;
};

const mapStateToProps = (state) => ({
  auth: state.auth
});

export default connect(mapStateToProps)(ProtectedRoute);
