import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { Container, Row, Col, Card, Button, Badge, Table, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Formik } from 'formik';
import * as Yup from 'yup';
import api from '../services/api';
import { WASTE_TYPES, getWasteTypeInfo } from '../utils/wasteTypes';
import '../components/Login.css'; // Import for new styles

const Dashboard = ({ auth }) => {
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const { user } = auth;
  const [nearbyCollectors, setNearbyCollectors] = useState([]);
  const [allCollectors, setAllCollectors] = useState([]);
  const [filteredCollectors, setFilteredCollectors] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [wasteRequests, setWasteRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [filteredPendingRequests, setFilteredPendingRequests] = useState([]);
  const [filteredWasteRequests, setFilteredWasteRequests] = useState([]);
  const [requestIdFilter, setRequestIdFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [error, setError] = useState(null);
  
  // Booking modal states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedCollector, setSelectedCollector] = useState(null);
  
  // Multiple waste types state
  const [selectedWasteItems, setSelectedWasteItems] = useState([]);
  const [tempQuantities, setTempQuantities] = useState({});

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

  // Effect to filter collectors when selectedCity changes
  useEffect(() => {
    if (selectedCity && allCollectors.length > 0) {
      const filtered = filterCollectorsByCity(selectedCity, allCollectors);
      setNearbyCollectors(filtered);
    } else if (!selectedCity) {
      setNearbyCollectors([]);
    }
  }, [selectedCity, allCollectors]);

  // Effect to filter requests based on request ID
  useEffect(() => {
    if (requestIdFilter.trim() === '') {
      setFilteredPendingRequests(pendingRequests);
      setFilteredWasteRequests(wasteRequests);
    } else {
      const filterValue = requestIdFilter.toLowerCase().trim();
      
      const filteredPending = pendingRequests.filter(request => 
        request.request_id && request.request_id.toLowerCase().includes(filterValue)
      );
      
      const filteredWaste = wasteRequests.filter(request => 
        request.request_id && request.request_id.toLowerCase().includes(filterValue)
      );
      
      setFilteredPendingRequests(filteredPending);
      setFilteredWasteRequests(filteredWaste);
    }
  }, [requestIdFilter, pendingRequests, wasteRequests]);

  // Helper function to load all collectors
  const loadAllCollectors = async () => {
    try {
      const collectorsResponse = await api.get('/auth/collectors');
      if (collectorsResponse.data && collectorsResponse.data.success) {
        const collectors = collectorsResponse.data.collectors || [];
        setAllCollectors(collectors);
        return collectors;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch all collectors:', error);
      setAllCollectors([]);
      return [];
    }
  };

  // Helper function to filter collectors by city (case insensitive)
  const filterCollectorsByCity = (city, collectors = allCollectors) => {
    if (!city || !city.trim()) {
      return [];
    }
    
    const cityLower = city.toLowerCase().trim();
    const filtered = collectors.filter(collector => 
      collector.city && collector.city.toLowerCase().trim() === cityLower
    );
    
    return filtered;
  };

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
        
        // Load all collectors
        const allCollectorsData = await loadAllCollectors();
        
        // Don't filter collectors initially - only show them after a new request is created
        // Note: Don't reset selectedCity here as it might be set from a recent request
        setNearbyCollectors([]);
        
        // Always set the state, even if arrays are empty
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
      
      // Use specific endpoints for different actions
      if (newStatus === 'assigned') {
        endpoint = `/waste/requests/${requestId}/accept`;
      } else if (newStatus === 'in_progress') {
        endpoint = `/waste/requests/${requestId}/start`;
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
    pickup_address: Yup.string()
      .min(10, 'Pickup address must be at least 10 characters')
      .max(500, 'Pickup address must not exceed 500 characters')
      .required('Pickup address is required'),
    pickup_city: Yup.string()
      .min(2, 'City must be at least 2 characters')
      .max(100, 'City must not exceed 100 characters')
      .required('Pickup city is required'),
    pickup_date: Yup.date()
      .min(new Date(), 'Pickup date must be today or later')
      .required('Pickup date is required'),
    pickup_time: Yup.string()
      .oneOf(['morning', 'afternoon', 'evening', 'flexible'], 'Please select a valid pickup time')
      .required('Pickup time preference is required'),
    special_instructions: Yup.string()
      .max(1000, 'Special instructions must not exceed 1000 characters')
  });

  // Handle booking a specific collector to the most recent request
  const handleBookCollector = async (collector) => {
    try {
      // Find all pending requests in the selected city that don't have a collector assigned
      const pendingRequestsInCity = wasteRequests.filter(req => {
        if (req.status !== 'pending') return false;
        if (req.collector_id && req.collector_id !== null) return false;
        if (!req.pickup_city) return false;
        
        const reqCity = req.pickup_city.trim().toLowerCase();
        const selCity = selectedCity ? selectedCity.trim().toLowerCase() : '';
        
        return reqCity === selCity;
      });

      if (pendingRequestsInCity.length === 0) {
        toast.error('No pending requests found in this city. Please create a new request first.');
        return;
      }

      console.log(`Assigning collector ${collector.id} to ${pendingRequestsInCity.length} request(s)`);

      // Assign the collector to all pending requests in the city
      const assignmentPromises = pendingRequestsInCity.map(request => 
        api.put(`/waste/requests/${request.id}/assign`, {
          collector_id: collector.id
        })
      );

      const responses = await Promise.all(assignmentPromises);
      
      // Check if all assignments were successful
      const successfulAssignments = responses.filter(response => response.data.success);
      
      if (successfulAssignments.length === pendingRequestsInCity.length) {
        const requestIds = pendingRequestsInCity.map(req => req.request_id).join(', ');
        toast.success(
          `Successfully booked ${collector.first_name} ${collector.last_name} for ${successfulAssignments.length} request(s)! ` +
          `Request ID(s): ${requestIds}`
        );
        
        // Clear the collectors list and reset city selection
        setFilteredCollectors([]);
        setNearbyCollectors([]);
        setSelectedCity('');
        
        // Refresh dashboard data to show the updated requests
        setRefreshTrigger(prev => prev + 1);
      } else {
        toast.warning(`Only ${successfulAssignments.length} out of ${pendingRequestsInCity.length} requests were assigned successfully.`);
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to book collector:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to book collector. Please try again.');
      }
    }
  };

  // Handle opening booking modal for new request
  const handleOpenNewRequestModal = () => {
    setSelectedCollector(null);
    setShowBookingModal(true);
  };

  // Handle booking submission
  const handleBookingSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      // Validate that at least one waste item is selected
      if (selectedWasteItems.length === 0) {
        toast.error('Please select at least one waste type');
        setSubmitting(false);
        return;
      }

      const bookingData = {
        pickup_address: values.pickup_address,
        pickup_city: values.pickup_city,
        pickup_date: values.pickup_date,
        pickup_time: values.pickup_time,
        special_instructions: values.special_instructions,
        collector_id: null, // Always create as general request
        status: 'pending',
        waste_items: selectedWasteItems // Send multiple waste items
      };

      const response = await api.post('/waste/requests', bookingData);
      
      if (response.data.success) {
        toast.success(`Booking request created with ${selectedWasteItems.length} waste type(s) for ${values.pickup_city}!`);
        
        // Close modal and reset form
        setShowBookingModal(false);
        setSelectedCollector(null);
        setSelectedWasteItems([]);
        setTempQuantities({});
        resetForm();
        
        // Ensure collectors are loaded before setting the city
        if (allCollectors.length === 0) {
          await loadAllCollectors();
        }
        
        // Update selected city - useEffect will handle filtering
        setSelectedCity(values.pickup_city);
        
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

  // Helper functions for waste item management
  const addWasteItem = (wasteType) => {
    const quantity = tempQuantities[wasteType] || 1;
    if (quantity > 0) {
      const wasteTypeInfo = getWasteTypeInfo(wasteType);
      const newItem = {
        waste_type: wasteType,
        quantity: parseFloat(quantity),
        label: wasteTypeInfo.label,
        emoji: wasteTypeInfo.emoji
      };
      
      // Check if item already exists
      const existingIndex = selectedWasteItems.findIndex(item => item.waste_type === wasteType);
      if (existingIndex >= 0) {
        // Update existing item
        const updatedItems = [...selectedWasteItems];
        updatedItems[existingIndex] = newItem;
        setSelectedWasteItems(updatedItems);
      } else {
        // Add new item
        setSelectedWasteItems([...selectedWasteItems, newItem]);
      }
      
      // Clear temp quantity
      setTempQuantities(prev => ({ ...prev, [wasteType]: '' }));
    }
  };

  const removeWasteItem = (wasteType) => {
    setSelectedWasteItems(selectedWasteItems.filter(item => item.waste_type !== wasteType));
  };

  const updateTempQuantity = (wasteType, quantity) => {
    setTempQuantities(prev => ({ ...prev, [wasteType]: quantity }));
  };

  const isWasteTypeSelected = (wasteType) => {
    return selectedWasteItems.some(item => item.waste_type === wasteType);
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

      {/* Create New Request Section */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-success">
            <Card.Body className="text-center py-4">
              <div className="mb-3">
                <i className="fas fa-plus-circle fa-3x text-success"></i>
              </div>
              <h4 className="text-success mb-2">Create a New Request for Booking</h4>
              <p className="text-muted mb-4">
                Start a new waste collection request by specifying your pickup details and city. 
                We'll show you available collectors in your specified area.
              </p>
              <Button 
                variant="success" 
                size="lg"
                onClick={handleOpenNewRequestModal}
                className="px-4"
              >
                <i className="fas fa-plus me-2"></i>
                Create New Request
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Status Information */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-success text-white">
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
            <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-tasks me-2"></i>
                Current Waste Requests
              </h5>
              <div className="d-flex gap-2">
                <Button 
                  variant="success" 
                  size="sm" 
                  onClick={handleOpenNewRequestModal}
                >
                  <i className="fas fa-plus me-1"></i>
                  New Request
                </Button>
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
              </div>
            </Card.Header>
            <Card.Body>
              {wasteRequests.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No active waste requests. Create a new request to get started!</p>
                  <Button 
                    variant="success" 
                    size="lg"
                    onClick={handleOpenNewRequestModal}
                    className="mt-2"
                  >
                    <i className="fas fa-plus-circle me-2"></i>
                    Create New Request
                  </Button>
                  <div className="mt-3">
                    <small className="text-muted">
                      You can specify any city when creating a request, and we'll show available collectors for that area.
                    </small>
                  </div>
                </div>
              ) : (
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Waste Types</th>
                      <th>Total Quantity</th>
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
                          <code className="text-primary">{request.request_id || 'N/A'}</code>
                        </td>
                        <td>
                          {(() => {
                            // Display multiple waste types if available
                            if (request.waste_items && request.waste_items.length > 0) {
                              return (
                                <div>
                                  {request.waste_items.map((item, index) => {
                                    const wasteTypeInfo = getWasteTypeInfo(item.waste_type);
                                    return (
                                      <div key={index} className="d-flex align-items-center mb-1">
                                        <span className="me-2" style={{ fontSize: '1.1em' }}>
                                          {wasteTypeInfo.emoji}
                                        </span>
                                        <span className="text-capitalize small">
                                          {wasteTypeInfo.label} ({item.quantity} kg)
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            } else {
                              // Fallback for single waste type (backward compatibility)
                              const wasteTypeInfo = getWasteTypeInfo(request.waste_type);
                              return (
                                <div className="d-flex align-items-center">
                                  <span className="me-2" style={{ fontSize: '1.2em' }}>{wasteTypeInfo.emoji}</span>
                                  <span className="text-capitalize">{wasteTypeInfo.label}</span>
                                </div>
                              );
                            }
                          })()}
                        </td>
                        <td>
                          {(() => {
                            if (request.waste_items && request.waste_items.length > 0) {
                              const totalQuantity = request.waste_items.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0);
                              return `${totalQuantity.toFixed(1)} kg`;
                            }
                            return `${request.quantity || 0} kg`;
                          })()}
                        </td>
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

      {/* Available Collectors */}
      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">
                <i className="fas fa-users me-2"></i>
                Available Waste Collectors
                {selectedCity && ` in ${selectedCity}`}
              </h5>
            </Card.Header>
            <Card.Body>
              {!selectedCity ? (
                <div className="text-center py-4">
                  <i className="fas fa-info-circle fa-3x text-muted mb-3"></i>
                  <p className="text-muted">
                    Create a new request to see available collectors for your specified city.
                  </p>
                  <Button 
                    variant="success" 
                    onClick={handleOpenNewRequestModal}
                  >
                    <i className="fas fa-plus me-2"></i>
                    Create Your First Request
                  </Button>
                </div>
              ) : nearbyCollectors.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-users fa-3x text-muted mb-3"></i>
                  <p className="text-muted">
                    {filteredCollectors.length === 0 ? 
                      `No collectors available in ${selectedCity}. Create a new request for a different city.` :
                      `All collectors have been booked. Create a new request for more options or try a different city.`
                    }
                  </p>
                  <Button 
                    variant="success" 
                    onClick={handleOpenNewRequestModal}
                  >
                    <i className="fas fa-plus me-2"></i>
                    Create New Request
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="mb-3 d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      Showing {nearbyCollectors.length} collector(s) available in {selectedCity}. 
                      These collectors can respond to your general requests.
                    </small>
                    <Button 
                      variant="outline-success" 
                      size="sm"
                      onClick={handleOpenNewRequestModal}
                    >
                      <i className="fas fa-plus me-1"></i>
                      New Request
                    </Button>
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

      {/* Search Filter */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Body>
              <h6 className="mb-3">
                <i className="fas fa-search me-2"></i>
                Filter by Request ID
              </h6>
              <Form.Group>
                <Form.Control
                  type="text"
                  placeholder="Enter Request ID (e.g., WR-2024-001)"
                  value={requestIdFilter}
                  onChange={(e) => setRequestIdFilter(e.target.value)}
                />
              </Form.Group>
              {requestIdFilter && (
                <div className="mt-2">
                  <small className="text-muted">
                    Showing results for: <strong>{requestIdFilter}</strong>
                  </small>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 ms-2"
                    onClick={() => setRequestIdFilter('')}
                  >
                    Clear
                  </Button>
                </div>
              )}
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
              {filteredPendingRequests.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                  <p className="text-muted">
                    {requestIdFilter 
                      ? `No pending requests found matching "${requestIdFilter}"`
                      : "No pending requests in your area."
                    }
                  </p>
                  <Button variant="warning" onClick={() => loadDashboardData()}>
                    Refresh
                  </Button>
                </div>
              ) : (
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Customer</th>
                      <th>Waste Types</th>
                      <th>Total Quantity</th>
                      <th>Address</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPendingRequests.map((request) => (
                      <tr key={request.id}>
                        <td>
                          <code className="text-primary">{request.request_id || 'N/A'}</code>
                        </td>
                        <td>
                          <strong>{request.customer_first_name} {request.customer_last_name}</strong>
                          <br />
                          <small className="text-muted">{request.customer_phone}</small>
                        </td>
                        <td>
                          {(() => {
                            // Display multiple waste types if available
                            if (request.waste_items && request.waste_items.length > 0) {
                              return (
                                <div>
                                  {request.waste_items.map((item, index) => {
                                    const wasteTypeInfo = getWasteTypeInfo(item.waste_type);
                                    return (
                                      <div key={index} className="d-flex align-items-center mb-1">
                                        <span className="me-2" style={{ fontSize: '1.1em' }}>
                                          {wasteTypeInfo.emoji}
                                        </span>
                                        <span className="text-capitalize small">
                                          {wasteTypeInfo.label} ({item.quantity} kg)
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            } else {
                              // Fallback for single waste type (backward compatibility)
                              const wasteTypeInfo = getWasteTypeInfo(request.waste_type);
                              return (
                                <div className="d-flex align-items-center">
                                  <span className="me-2" style={{ fontSize: '1.1em' }}>
                                    {wasteTypeInfo.emoji}
                                  </span>
                                  <span className="text-capitalize">{wasteTypeInfo.label}</span>
                                </div>
                              );
                            }
                          })()}
                        </td>
                        <td>
                          {(() => {
                            if (request.waste_items && request.waste_items.length > 0) {
                              const totalQuantity = request.waste_items.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0);
                              return `${totalQuantity.toFixed(1)} kg`;
                            }
                            return `${request.quantity || 0} kg`;
                          })()}
                        </td>
                        <td className="text-truncate" style={{ maxWidth: '200px' }}>
                          {request.pickup_address}
                        </td>
                        <td>
                          {new Date(request.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button 
                              size="sm" 
                              variant="success"
                              onClick={() => handleRequestStatusUpdate(request.id, 'assigned')}
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
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">
                <i className="fas fa-tasks me-2"></i>
                My Assigned Requests
              </h5>
            </Card.Header>
            <Card.Body>
              {filteredWasteRequests.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                  <p className="text-muted">
                    {requestIdFilter 
                      ? `No assigned requests found matching "${requestIdFilter}"`
                      : "No assigned requests. Accept some pending requests!"
                    }
                  </p>
                </div>
              ) : (
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Customer</th>
                      <th>Waste Types</th>
                      <th>Total Quantity</th>
                      <th>Address</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWasteRequests.map((request) => (
                      <tr key={request.id}>
                        <td>
                          <code className="text-primary">{request.request_id || 'N/A'}</code>
                        </td>
                        <td>
                          <strong>{request.customer_first_name} {request.customer_last_name}</strong>
                          <br />
                          <small className="text-muted">{request.customer_phone}</small>
                        </td>
                        <td>
                          {(() => {
                            // Display multiple waste types if available
                            if (request.waste_items && request.waste_items.length > 0) {
                              return (
                                <div>
                                  {request.waste_items.map((item, index) => {
                                    const wasteTypeInfo = getWasteTypeInfo(item.waste_type);
                                    return (
                                      <div key={index} className="d-flex align-items-center mb-1">
                                        <span className="me-2" style={{ fontSize: '1.1em' }}>
                                          {wasteTypeInfo.emoji}
                                        </span>
                                        <span className="text-capitalize small">
                                          {wasteTypeInfo.label} ({item.quantity} kg)
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            } else {
                              // Fallback for single waste type (backward compatibility)
                              const wasteTypeInfo = getWasteTypeInfo(request.waste_type);
                              return (
                                <div className="d-flex align-items-center">
                                  <span className="me-2" style={{ fontSize: '1.1em' }}>
                                    {wasteTypeInfo.emoji}
                                  </span>
                                  <span className="text-capitalize">{wasteTypeInfo.label}</span>
                                </div>
                              );
                            }
                          })()}
                        </td>
                        <td>
                          {(() => {
                            if (request.waste_items && request.waste_items.length > 0) {
                              const totalQuantity = request.waste_items.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0);
                              return `${totalQuantity.toFixed(1)} kg`;
                            }
                            return `${request.quantity || 0} kg`;
                          })()}
                        </td>
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
                              variant="success"
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
          <Spinner animation="border" variant="success" className="mb-3" />
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
      <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-plus-circle me-2"></i>
            Create New Waste Collection Request
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="waste-request-form">
          <Formik
            initialValues={{
              pickup_address: '',
              pickup_city: selectedCity || user?.city || '',
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
              errors,
              setFieldValue 
            }) => (
              <Form noValidate onSubmit={handleSubmit}>
                {/* Waste Type Selection */}
                <div className="waste-type-selector">
                  <h6>
                    <i className="fas fa-recycle"></i>
                    Select Waste Types
                  </h6>
                  <p className="text-muted mb-3">Choose the types of waste you want to dispose of and specify quantities</p>
                  
                  <div className="waste-type-grid">
                    {WASTE_TYPES.map(type => (
                      <div 
                        key={type.value} 
                        className={`waste-type-card ${isWasteTypeSelected(type.value) ? 'selected' : ''}`}
                      >
                        <span className="waste-type-emoji">{type.emoji}</span>
                        <div className="waste-type-label">{type.label}</div>
                        
                        {!isWasteTypeSelected(type.value) && (
                          <div className="waste-type-quantity">
                            <Form.Control
                              type="number"
                              placeholder="Quantity (kg)"
                              min="0.1"
                              step="0.1"
                              value={tempQuantities[type.value] || ''}
                              onChange={(e) => updateTempQuantity(type.value, e.target.value)}
                              size="sm"
                              className="mb-2"
                            />
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => addWasteItem(type.value)}
                              disabled={!tempQuantities[type.value] || tempQuantities[type.value] <= 0}
                            >
                              <i className="fas fa-plus me-1"></i>
                              Add
                            </Button>
                          </div>
                        )}
                        
                        {isWasteTypeSelected(type.value) && (
                          <div className="waste-type-quantity">
                            <Badge bg="success" className="mb-2">Added</Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Waste Items */}
                {selectedWasteItems.length > 0 && (
                  <div className="selected-waste-items">
                    <h6>
                      <i className="fas fa-check-circle"></i>
                      Selected Waste Items ({selectedWasteItems.length})
                    </h6>
                    
                    {selectedWasteItems.map((item, index) => (
                      <div key={item.waste_type} className="selected-waste-item">
                        <div>
                          <span className="me-2" style={{ fontSize: '1.2em' }}>{item.emoji}</span>
                          <strong>{item.label}</strong>
                          <span className="text-muted ms-2">- {item.quantity} kg</span>
                        </div>
                        <button
                          type="button"
                          className="remove-item-btn"
                          onClick={() => removeWasteItem(item.waste_type)}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pickup Details */}
                <div className="form-section">
                  <h6>
                    <i className="fas fa-map-marker-alt"></i>
                    Pickup Details
                  </h6>
                  
                  <Row>
                    <Col md={12} className="mb-3">
                      <Form.Label>Pickup Address *</Form.Label>
                      <Form.Control
                        type="text"
                        name="pickup_address"
                        value={values.pickup_address}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.pickup_address && !!errors.pickup_address}
                        placeholder="Enter your complete pickup address"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.pickup_address}
                      </Form.Control.Feedback>
                    </Col>
                    
                    <Col md={6} className="mb-3">
                      <Form.Label>Pickup City *</Form.Label>
                      <Form.Control
                        type="text"
                        name="pickup_city"
                        value={values.pickup_city}
                        onChange={(e) => {
                          const city = e.target.value;
                          setFieldValue('pickup_city', city);
                        }}
                        onBlur={handleBlur}
                        isInvalid={touched.pickup_city && !!errors.pickup_city}
                        placeholder="Enter the city for pickup"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.pickup_city}
                      </Form.Control.Feedback>
                    </Col>
                    
                    <Col md={6} className="mb-3">
                      <Form.Label>Pickup Date *</Form.Label>
                      <Form.Control
                        type="date"
                        name="pickup_date"
                        value={values.pickup_date}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.pickup_date && !!errors.pickup_date}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.pickup_date}
                      </Form.Control.Feedback>
                    </Col>
                  </Row>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Pickup Time Preference *</Form.Label>
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
                </div>

                {/* Additional Information */}
                <div className="form-section">
                  <h6>
                    <i className="fas fa-comment-alt"></i>
                    Additional Information
                  </h6>
                  
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
                      placeholder="Any special instructions for the collector..."
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.special_instructions}
                    </Form.Control.Feedback>
                  </Form.Group>
                </div>

                {/* Submit Buttons */}
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    {selectedWasteItems.length > 0 && (
                      <small className="text-muted">
                        <i className="fas fa-info-circle me-1"></i>
                        {selectedWasteItems.length} waste type(s) selected
                      </small>
                    )}
                  </div>
                  
                  <div>
                    <Button 
                      variant="secondary" 
                      onClick={() => {
                        setShowBookingModal(false);
                        setSelectedWasteItems([]);
                        setTempQuantities({});
                      }} 
                      className="me-2"
                    >
                      <i className="fas fa-times me-2"></i>
                      Cancel
                    </Button>
                    <Button 
                      variant="success" 
                      type="submit" 
                      disabled={isSubmitting || selectedWasteItems.length === 0}
                      className="submit-btn"
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Creating Request...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-paper-plane me-2"></i>
                          Create Request ({selectedWasteItems.length} items)
                        </>
                      )}
                    </Button>
                  </div>
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
