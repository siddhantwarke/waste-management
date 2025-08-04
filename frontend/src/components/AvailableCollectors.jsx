import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { Container, Row, Col, Card, Alert, Spinner, Badge, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../services/api';

const AvailableCollectors = ({ auth }) => {
  const [collectors, setCollectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = auth;

  useEffect(() => {
    if (user && user.city && user.role === 'customer') {
      loadCollectors();
    }
  }, [user]);

  const loadCollectors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/auth/collectors/${encodeURIComponent(user.city)}`);
      
      if (response.data.success) {
        setCollectors(response.data.collectors);
      } else {
        setError(response.data.message || 'Failed to load collectors');
      }
    } catch (error) {
      console.error('Failed to load collectors:', error);
      setError('Failed to load available collectors');
      toast.error('Failed to load available collectors');
    } finally {
      setLoading(false);
    }
  };

  const handleContactCollector = (collector) => {
    // This could open a modal or navigate to a contact form
    toast.info(`Contact feature for ${collector.first_name} ${collector.last_name} will be implemented soon`);
  };

  if (!user || user.role !== 'customer') {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <i className="fas fa-exclamation-triangle me-2"></i>
          This feature is only available for customers.
        </Alert>
      </Container>
    );
  }

  if (!user.city) {
    return (
      <Container className="py-5">
        <Alert variant="info">
          <i className="fas fa-info-circle me-2"></i>
          Please update your profile with your city information to see available collectors.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-primary mb-1">
            <i className="fas fa-users me-2"></i>
            Available Collectors
          </h2>
          <p className="text-muted mb-0">
            Collectors available in {user.city}, {user.state}
          </p>
        </div>
        <Button variant="outline-primary" onClick={loadCollectors} disabled={loading}>
          <i className="fas fa-sync-alt me-2"></i>
          Refresh
        </Button>
      </div>

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" className="mb-3">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="text-muted">Loading available collectors...</p>
        </div>
      )}

      {error && (
        <Alert variant="danger" className="mb-4">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
        </Alert>
      )}

      {!loading && collectors.length === 0 && !error && (
        <Alert variant="info" className="text-center py-5">
          <i className="fas fa-info-circle mb-3" style={{ fontSize: '3rem' }}></i>
          <h4>No Collectors Available</h4>
          <p className="mb-0">
            Currently, there are no collectors available in {user.city}. 
            Please check back later or contact support for assistance.
          </p>
        </Alert>
      )}

      {!loading && collectors.length > 0 && (
        <Row>
          {collectors.map((collector) => (
            <Col md={6} lg={4} key={collector.id} className="mb-4">
              <Card className="h-100 shadow-sm border-0">
                <Card.Body className="d-flex flex-column">
                  <div className="text-center mb-3">
                    <div 
                      className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-2"
                      style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}
                    >
                      <i className="fas fa-user"></i>
                    </div>
                    <h5 className="fw-bold mb-1">
                      {collector.first_name} {collector.last_name}
                    </h5>
                    <Badge bg="success" className="mb-2">
                      <i className="fas fa-circle me-1" style={{ fontSize: '0.5rem' }}></i>
                      Available
                    </Badge>
                  </div>

                  <div className="mb-3 flex-grow-1">
                    <div className="d-flex align-items-center mb-2">
                      <i className="fas fa-phone text-muted me-2"></i>
                      <span className="text-muted">{collector.phone}</span>
                    </div>
                    <div className="d-flex align-items-center mb-2">
                      <i className="fas fa-map-marker-alt text-muted me-2"></i>
                      <span className="text-muted small">
                        {collector.city}, {collector.state}
                      </span>
                    </div>
                    {collector.service_radius && (
                      <div className="d-flex align-items-center mb-2">
                        <i className="fas fa-compass text-muted me-2"></i>
                        <span className="text-muted small">
                          Service radius: {collector.service_radius} km
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="d-grid">
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => handleContactCollector(collector)}
                    >
                      <i className="fas fa-envelope me-2"></i>
                      Contact Collector
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

const mapStateToProps = (state) => ({
  auth: state.auth
});

export default connect(mapStateToProps)(AvailableCollectors);
