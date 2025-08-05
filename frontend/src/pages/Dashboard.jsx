import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { Container, Row, Col, Card, Button, Badge, Table, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Formik } from 'formik';
import * as Yup from 'yup';
import api from '../services/api';
import { WASTE_TYPES, getWasteTypeInfo } from '../utils/wasteTypes';

const Dashboard = ({ auth }) => {
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const { user } = auth;
  const [nearbyCollectors, setNearbyCollectors] = useState([]);
  const [wasteRequests, setWasteRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [error, setError] = useState(null);
  
  // Booking modal states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedCollector, setSelectedCollector] = useState(null);

  useEffect(() => {
    if (user) {
      initializeDashboard();
    }
  }, [user]);

  // Refresh data when user navigates to dashboard (route change)
  useEffect(() => {
    if (user && routeLocation.pathname === '/dashboard' && routeLocation.state?.refreshRequests) {
      // Clear the state immediately to prevent repeated refreshes
      navigate('/dashboard', { replace: true, state: null });
      // Force a data refresh
      setRefreshTrigger(prev => prev + 1);
    }
  }, [routeLocation.state, navigate, user]);

  // Trigger refresh when refreshTrigger changes
  useEffect(() => {
    if (user && refreshTrigger > 0) {
      setLoading(true);
      loadDashboardData()
        .finally(() => setLoading(false));
    }
  }, [refreshTrigger, user]);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load dashboard data based on user role
      await loadDashboardData();
      setLoading(false);
    } catch (error) {
      console.error('Dashboard initialization error:', error);
      toast.error('Failed to load dashboard');
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    // Prevent concurrent API calls
    if (isLoadingData) {
      return;
    }
    
    try {
      setIsLoadingData(true);
      setError(null); // Clear any previous errors
      
      if (user.role === 'customer') {
        // Load customer data - handle each API call separately to prevent one failure from affecting the other
        
        // First, always get the user's waste requests (this is the critical data)
        let wasteRequestsData = [];
        try {
          const requestsResponse = await api.get('/waste/requests');
          if (requestsResponse.data && requestsResponse.data.success) {
            wasteRequestsData = requestsResponse.data.data || [];
          } else {
            throw new Error('Invalid response format');
          }
        } catch (error) {
          console.error('Failed to fetch waste requests:', error);
          const errorMsg = error.response?.data?.message || 'Failed to load your waste requests';
          
          // Check if it's an authentication error
          if (error.response?.status === 401) {
            setError('Please log in again to access your waste requests');
            // The api interceptor should already redirect to login
          } else if (error.response?.status === 429) {
            setError('Too many requests. Please wait a moment and try again.');
          } else {
            setError(errorMsg);
          }
          
          // Set empty array to prevent UI issues
          wasteRequestsData = [];
        }
        
        // Then, try to get nearby collectors by city (for customers)
        let collectorsData = [];
        if (user.city) {
          try {
            const collectorsResponse = await api.get(`/auth/collectors/${encodeURIComponent(user.city)}`);
            if (collectorsResponse.data && collectorsResponse.data.success) {
              collectorsData = collectorsResponse.data.collectors || [];
            }
          } catch (error) {
            console.error('Failed to fetch collectors by city:', error);
            // Don't show error toast for collectors as it's not critical data
            collectorsData = [];
          }
        }
        
        // Always set the state, even if arrays are empty
        setNearbyCollectors(collectorsData);
        setWasteRequests(wasteRequestsData);
        
      } else if (user.role === 'collector') {
        // Load collector data
        try {
          const [pendingResponse, assignedResponse] = await Promise.all([
            api.get('/waste/requests/pending'),
            api.get('/waste/requests/assigned')
          ]);
          
          setPendingRequests(pendingResponse.data?.data || []);
          setWasteRequests(assignedResponse.data?.data || []);
        } catch (error) {
          console.error('Failed to load collector data:', error);
          if (error.response?.status === 401) {
            setError('Please log in again to access collector data');
          } else if (error.response?.status === 429) {
            setError('Too many requests. Please wait a moment and try again.');
          } else {
            setError('Failed to load collector data');
          }
          setPendingRequests([]);
          setWasteRequests([]);
        }
      }
    } catch (error) {
      console.error('Critical error in loadDashboardData:', error);
      setError('Failed to load dashboard data: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleRequestStatusUpdate = async (requestId, newStatus) => {
    try {
      let endpoint;
      let data = {};
      
      // Use specific endpoints for accept, reject, and complete actions
      if (newStatus === 'assigned' || newStatus === 'in_progress') {
        endpoint = `/waste/requests/${requestId}/accept`;
      } else if (newStatus === 'cancelled') {
        endpoint = `/waste/requests/${requestId}/reject`;
      } else if (newStatus === 'completed') {
        endpoint = `/waste/requests/${requestId}/complete`;
      } else {
        // For other status updates, use the old endpoint
        endpoint = `/waste/requests/${requestId}/status`;
        data = { status: newStatus };
      }
      
      await api.put(endpoint, data);
      
      // Reload dashboard data
      await loadDashboardData();
      toast.success('Request status updated successfully');
    } catch (error) {
      console.error('Failed to update request status:', error);
      toast.error('Failed to update request status: ' + (error.response?.data?.message || error.message));
    }
  };

  // Booking validation schema
  const bookingValidationSchema = Yup.object({
    waste_type: Yup.string()
      .oneOf(WASTE_TYPES.map(type => type.value), 'Please select a valid waste type')
      .required('Waste type is required'),
    quantity: Yup.number()
      .min(0.1, 'Quantity must be at least 0.1 kg')
      .max(10000, 'Quantity must not exceed 10000 kg')
      .required('Quantity is required'),
    pickup_address: Yup.string()
      .min(10, 'Pickup address must be at least 10 characters')
      .max(500, 'Pickup address must not exceed 500 characters')
      .required('Pickup address is required'),
    pickup_date: Yup.date()
      .min(new Date(), 'Pickup date must be today or later')
      .required('Pickup date is required'),
    pickup_time: Yup.string()
      .oneOf(['morning', 'afternoon', 'evening', 'flexible'], 'Please select a valid pickup time')
      .required('Pickup time preference is required'),
    special_instructions: Yup.string()
      .max(1000, 'Special instructions must not exceed 1000 characters')
  });

  // Handle opening booking modal
  const handleBookCollector = (collector) => {
    setSelectedCollector(collector);
    setShowBookingModal(true);
  };

  // Handle booking submission
  const handleBookingSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const bookingData = {
        ...values,
        collector_id: selectedCollector.id,
        status: 'pending'
      };

      const response = await api.post('/waste/requests', bookingData);
      
      if (response.data.success) {
        toast.success(`Booking request sent to ${selectedCollector.first_name} ${selectedCollector.last_name}!`);
        
        // Close modal and reset form
        setShowBookingModal(false);
        setSelectedCollector(null);
        resetForm();
        
        // Refresh dashboard data
        setRefreshTrigger(prev => prev + 1);
      } else {
        toast.error(response.data.message || 'Failed to create booking request');
      }
    } catch (error) {
      console.error('Booking submission error:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to submit booking request. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'assigned': return 'info';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${(distance * 1000).toFixed(0)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const customerDashboard = () => (
    <>
      <Row className="mb-4">
        <Col>
          <h2 className="text-primary">Customer Dashboard</h2>
          <p className="text-muted">Welcome back, {user.first_name}! Manage your waste pickup requests</p>
        </Col>
      </Row>
      
      {/* Error Alert */}
      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger" className="d-flex justify-content-between align-items-center">
              <div>
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
              </div>
              <Button 
                variant="outline-danger" 
                size="sm"
                onClick={() => {
                  setError(null);
                  setRefreshTrigger(prev => prev + 1);
                }}
                disabled={loading || isLoadingData}
              >
                {loading || isLoadingData ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-1" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <i className="fas fa-redo me-1"></i>
                    Retry
                  </>
                )}
              </Button>
            </Alert>
          </Col>
        </Row>
      )}
      
      {/* Status Information */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Request Status Meanings
              </h5>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={6} lg={4}>
                  <div className="d-flex align-items-center p-2 rounded" style={{backgroundColor: '#fff3cd', border: '1px solid #ffeaa7'}}>
                    <Badge bg="warning" className="me-2">PENDING</Badge>
                    <small>Awaiting collector assignment</small>
                  </div>
                </Col>
                <Col md={6} lg={4}>
                  <div className="d-flex align-items-center p-2 rounded" style={{backgroundColor: '#d1ecf1', border: '1px solid #bee5eb'}}>
                    <Badge bg="info" className="me-2">ASSIGNED</Badge>
                    <small>Collector assigned, will contact you</small>
                  </div>
                </Col>
                <Col md={6} lg={4}>
                  <div className="d-flex align-items-center p-2 rounded" style={{backgroundColor: '#cce5ff', border: '1px solid #99d6ff'}}>
                    <Badge bg="primary" className="me-2">IN PROGRESS</Badge>
                    <small>Collection in progress</small>
                  </div>
                </Col>
                <Col md={6} lg={4}>
                  <div className="d-flex align-items-center p-2 rounded" style={{backgroundColor: '#d4edda', border: '1px solid #c3e6cb'}}>
                    <Badge bg="success" className="me-2">COMPLETED</Badge>
                    <small>Successfully collected</small>
                  </div>
                </Col>
                <Col md={6} lg={4}>
                  <div className="d-flex align-items-center p-2 rounded" style={{backgroundColor: '#f8d7da', border: '1px solid #f5c6cb'}}>
                    <Badge bg="danger" className="me-2">CANCELLED</Badge>
                    <small>Request cancelled</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Current Waste Requests */}
      <Row className="mb-5">
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-tasks me-2"></i>
                Current Waste Requests
              </h5>
              <Button 
                variant="light" 
                size="sm" 
                onClick={() => setRefreshTrigger(prev => prev + 1)}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-1" />
                    Loading...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sync-alt me-1"></i>
                    Refresh
                  </>
                )}
              </Button>
            </Card.Header>
            <Card.Body>
              {wasteRequests.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No active waste requests. Book a collector below to create your first request!</p>
                  <small className="text-muted">
                    Scroll down to see available collectors in your area and book directly with them.
                  </small>
                </div>
              ) : (
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Waste Type</th>
                      <th>Quantity</th>
                      <th>Pickup Address</th>
                      <th>Status</th>
                      <th>Collector</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wasteRequests.map((request) => (
                      <tr key={request.id}>
                        <td>
                          {(() => {
                            const wasteTypeInfo = getWasteTypeInfo(request.waste_type);
                            return (
                              <div className="d-flex align-items-center">
                                <span className="me-2" style={{ fontSize: '1.2em' }}>{wasteTypeInfo.emoji}</span>
                                <span className="text-capitalize">{wasteTypeInfo.label}</span>
                              </div>
                            );
                          })()}
                        </td>
                        <td>{request.quantity || 'N/A'}</td>
                        <td className="text-truncate" style={{ maxWidth: '200px' }}>
                          {request.pickup_address}
                        </td>
                        <td>
                          <Badge bg={getStatusBadgeVariant(request.status)}>
                            {request.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </td>
                        <td>
                          {request.collector_first_name ? (
                            <div>
                              <strong>{request.collector_first_name} {request.collector_last_name}</strong>
                              <br />
                              <small className="text-muted">{request.collector_phone}</small>
                            </div>
                          ) : (
                            <span className="text-muted">Not assigned</span>
                          )}
                        </td>
                        <td>
                          {new Date(request.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          {request.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="outline-danger"
                              onClick={() => handleRequestStatusUpdate(request.id, 'cancelled')}
                            >
                              Cancel
                            </Button>
                          )}
                          {request.status === 'completed' && (
                            <Badge bg="success">Completed</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Nearby Collectors */}
      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">
                <i className="fas fa-users me-2"></i>
                Available Waste Collectors Nearby
              </h5>
            </Card.Header>
            <Card.Body>
              {nearbyCollectors.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-users fa-3x text-muted mb-3"></i>
                  <p className="text-muted">
                    {user && user.city ? 
                      `No collectors found in ${user.city}. Check back later or contact support.` :
                      'Please update your profile with your city information to see available collectors.'
                    }
                  </p>
                  {!user?.city && (
                    <Button variant="success" onClick={() => navigate('/profile')}>
                      Update Profile
                    </Button>
                  )}
                </div>
              ) : (
                <div>
                  <div className="mb-3">
                    <small className="text-muted">
                      Showing collectors available in {user.city}, {user.state}
                    </small>
                  </div>
                  <Table responsive striped hover>
                    <thead>
                      <tr>
                        <th>Collector Info</th>
                        <th>Contact & Location</th>
                        <th>Waste Prices (per kg)</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nearbyCollectors.map((collector) => (
                        <tr key={collector.id}>
                          <td>
                            <div>
                              <strong>{collector.first_name} {collector.last_name}</strong>
                              <br />
                              <small className="text-muted">@{collector.username}</small>
                              {collector.collector_group_name && (
                                <>
                                  <br />
                                  <Badge bg="secondary" className="mt-1">
                                    <i className="fas fa-building me-1"></i>
                                    {collector.collector_group_name}
                                  </Badge>
                                </>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="mb-1">
                              <i className="fas fa-phone me-1"></i>
                              {collector.phone}
                            </div>
                            <small className="text-muted">
                              <i className="fas fa-map-marker-alt me-1"></i>
                              {collector.city}, {collector.state}
                            </small>
                          </td>
                          <td>
                            <div className="small">
                              {WASTE_TYPES.map((wasteType, index) => {
                                const priceValue = collector[wasteType.key];
                                if (!priceValue || parseFloat(priceValue) <= 0) return null;
                                
                                return (
                                  <div className="mb-1 d-flex align-items-center" key={wasteType.value}>
                                    <span className="me-2 d-flex align-items-center" style={{ fontSize: '1.2em' }}>
                                      {wasteType.emoji}
                                      <span className="ms-1 small fw-semibold">
                                        {wasteType.label.split(' ')[0]}
                                      </span>
                                    </span>
                                    <span className="fw-bold text-success">
                                      <i className="fas fa-dollar-sign me-1"></i>
                                      {parseFloat(priceValue).toFixed(2)}/kg
                                    </span>
                                  </div>
                                );
                              })}
                              {/* Show message if no prices are set */}
                              {!WASTE_TYPES.some(wasteType => collector[wasteType.key] && parseFloat(collector[wasteType.key]) > 0) && (
                                <div className="text-muted small">
                                  <i className="fas fa-info-circle me-1"></i>
                                  No pricing information available
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <Button 
                              size="sm" 
                              variant="success" 
                              onClick={() => handleBookCollector(collector)}
                            >
                              <i className="fas fa-calendar-check me-1"></i>
                              Book
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );

  const collectorDashboard = () => (
    <>
      <Row className="mb-4">
        <Col>
          <h2 className="text-primary">Collector Dashboard</h2>
          <p className="text-muted">Welcome back, {user.first_name}! Manage waste collection requests</p>
        </Col>
      </Row>
      
      {/* Quick Actions */}
      <Row className="g-4 mb-5">
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="text-center">
              <div className="mb-3">
                <i className="fas fa-search fa-3x text-primary"></i>
              </div>
              <Card.Title>Find Requests</Card.Title>
              <Card.Text>
                Find nearby waste collection requests in your area.
              </Card.Text>
              <Button variant="primary" onClick={() => toast.info('Auto-refreshing...')}>
                Refresh
              </Button>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="text-center">
              <div className="mb-3">
                <i className="fas fa-toggle-on fa-3x text-success"></i>
              </div>
              <Card.Title>Availability</Card.Title>
              <Card.Text>
                Toggle your availability for new requests.
              </Card.Text>
              <Button variant="success" onClick={() => toast.info('Feature coming soon!')}>
                Available
              </Button>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="text-center">
              <div className="mb-3">
                <i className="fas fa-chart-line fa-3x text-info"></i>
              </div>
              <Card.Title>Statistics</Card.Title>
              <Card.Text>
                View your collection statistics and earnings.
              </Card.Text>
              <Button variant="info" onClick={() => toast.info('Feature coming soon!')}>
                View Stats
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Pending Requests */}
      <Row className="mb-5">
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-warning text-dark">
              <h5 className="mb-0">
                <i className="fas fa-clock me-2"></i>
                Pending Collection Requests
              </h5>
            </Card.Header>
            <Card.Body>
              {pendingRequests.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No pending requests in your area.</p>
                  <Button variant="warning" onClick={() => loadDashboardData()}>
                    Refresh
                  </Button>
                </div>
              ) : (
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Waste Type</th>
                      <th>Quantity</th>
                      <th>Address</th>
                      <th>Distance</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRequests.map((request) => (
                      <tr key={request.id}>
                        <td>
                          <strong>{request.customer_first_name} {request.customer_last_name}</strong>
                          <br />
                          <small className="text-muted">{request.customer_phone}</small>
                        </td>
                        <td>
                          <span className="text-capitalize">{request.waste_type}</span>
                        </td>
                        <td>{request.quantity || 'N/A'}</td>
                        <td className="text-truncate" style={{ maxWidth: '200px' }}>
                          {request.pickup_address}
                        </td>
                        <td>
                          {request.distance ? (
                            <Badge bg="info">{formatDistance(request.distance)}</Badge>
                          ) : (
                            <span className="text-muted">N/A</span>
                          )}
                        </td>
                        <td>
                          {new Date(request.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button 
                              size="sm" 
                              variant="success"
                              onClick={() => handleRequestStatusUpdate(request.id, 'in_progress')}
                            >
                              Accept
                            </Button>
                            <Button 
                              size="sm" 
                              variant="danger"
                              onClick={() => handleRequestStatusUpdate(request.id, 'cancelled')}
                            >
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* My Assigned Requests */}
      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">
                <i className="fas fa-tasks me-2"></i>
                My Assigned Requests
              </h5>
            </Card.Header>
            <Card.Body>
              {wasteRequests.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No assigned requests. Accept some pending requests!</p>
                </div>
              ) : (
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Waste Type</th>
                      <th>Quantity</th>
                      <th>Address</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wasteRequests.map((request) => (
                      <tr key={request.id}>
                        <td>
                          <strong>{request.customer_first_name} {request.customer_last_name}</strong>
                          <br />
                          <small className="text-muted">{request.customer_phone}</small>
                        </td>
                        <td>
                          <span className="text-capitalize">{request.waste_type}</span>
                        </td>
                        <td>{request.quantity || 'N/A'}</td>
                        <td className="text-truncate" style={{ maxWidth: '200px' }}>
                          {request.pickup_address}
                        </td>
                        <td>
                          <Badge bg={getStatusBadgeVariant(request.status)}>
                            {request.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </td>
                        <td>
                          {request.status === 'assigned' && (
                            <Button 
                              size="sm" 
                              variant="primary"
                              onClick={() => handleRequestStatusUpdate(request.id, 'in_progress')}
                            >
                              Start Collection
                            </Button>
                          )}
                          {request.status === 'in_progress' && (
                            <Button 
                              size="sm" 
                              variant="success"
                              onClick={() => handleRequestStatusUpdate(request.id, 'completed')}
                            >
                              Mark Complete
                            </Button>
                          )}
                          {request.status === 'completed' && (
                            <Badge bg="success">Completed</Badge>
                          )}
                          {request.status === 'cancelled' && (
                            <Badge bg="danger">Cancelled</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <p>Loading dashboard...</p>
        </div>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          Please log in to access the dashboard.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {user.role === 'customer' ? customerDashboard() : collectorDashboard()}
      
      {/* Booking Modal */}
      <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Request Booking with {selectedCollector?.first_name} {selectedCollector?.last_name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Formik
            initialValues={{
              waste_type: '',
              quantity: '',
              pickup_address: '',
              pickup_date: '',
              pickup_time: '',
              special_instructions: ''
            }}
            validationSchema={bookingValidationSchema}
            onSubmit={handleBookingSubmit}
          >
            {({ 
              values, 
              handleChange, 
              handleBlur, 
              handleSubmit, 
              isSubmitting, 
              touched, 
              errors 
            }) => (
              <Form noValidate onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Waste Type</Form.Label>
                  <Form.Select
                    name="waste_type"
                    value={values.waste_type}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.waste_type && !!errors.waste_type}
                  >
                    <option value="">Select waste type</option>
                    {WASTE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.emoji} {type.label}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.waste_type}
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Quantity (kg)</Form.Label>
                  <Form.Control
                    type="number"
                    name="quantity"
                    value={values.quantity}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.quantity && !!errors.quantity}
                    min={0.1}
                    step={0.1}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.quantity}
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Pickup Address</Form.Label>
                  <Form.Control
                    type="text"
                    name="pickup_address"
                    value={values.pickup_address}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.pickup_address && !!errors.pickup_address}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.pickup_address}
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    value={user?.city || ''}
                    readOnly
                    className="bg-light"
                    placeholder="City not specified in profile"
                  />
                  <Form.Text className="text-muted">
                    Your registered city (readonly). Update your profile to change this.
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Pickup Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="pickup_date"
                    value={values.pickup_date}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.pickup_date && !!errors.pickup_date}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.pickup_date}
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Pickup Time Preference</Form.Label>
                  <Form.Select
                    name="pickup_time"
                    value={values.pickup_time}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.pickup_time && !!errors.pickup_time}
                  >
                    <option value="">Select preferred time</option>
                    <option value="morning">🌅 Morning (8:00 AM - 12:00 PM)</option>
                    <option value="afternoon">☀️ Afternoon (12:00 PM - 5:00 PM)</option>
                    <option value="evening">🌆 Evening (5:00 PM - 8:00 PM)</option>
                    <option value="flexible">🕐 Flexible (Any time)</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.pickup_time}
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Special Instructions</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="special_instructions"
                    value={values.special_instructions}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.special_instructions && !!errors.special_instructions}
                    rows={3}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.special_instructions}
                  </Form.Control.Feedback>
                </Form.Group>
                
                <div className="d-flex justify-content-end">
                  <Button variant="secondary" onClick={() => setShowBookingModal(false)} className="me-2">
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane me-2"></i>
                        Send Booking Request
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

const mapStateToProps = (state) => ({
  auth: state.auth
});

export default connect(mapStateToProps)(Dashboard);
