import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

const MyRequests = ({ auth }) => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/waste/requests');
      if (response.data.success) {
        setRequests(response.data.data);
      } else {
        setError('Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError('Failed to fetch requests');
      toast.error('Failed to load your requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'warning', text: 'Pending' },
      assigned: { variant: 'info', text: 'Assigned' },
      in_progress: { variant: 'primary', text: 'In Progress' },
      completed: { variant: 'success', text: 'Completed' },
      cancelled: { variant: 'danger', text: 'Cancelled' }
    };

    const config = statusConfig[status] || { variant: 'secondary', text: status };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPickupTime = (timePreference) => {
    const timeLabels = {
      morning: 'Morning (8AM - 12PM)',
      afternoon: 'Afternoon (12PM - 5PM)',
      evening: 'Evening (5PM - 8PM)',
      flexible: 'Flexible'
    };
    return timeLabels[timePreference] || timePreference;
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading your requests...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>
              <i className="fas fa-history me-2 text-primary"></i>
              My Waste Pickup Requests
            </h2>
            <Button variant="outline-primary" onClick={() => navigate('/dashboard')}>
              <i className="fas fa-calendar-check me-2"></i>
              Book New Request
            </Button>
          </div>

          {error && (
            <Alert variant="danger" className="mb-4">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          <Card className="shadow-sm">
            <Card.Body>
              {requests.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">No requests found</h5>
                  <p className="text-muted">You haven't made any waste pickup requests yet.</p>
                  <Button variant="primary" onClick={() => navigate('/dashboard')}>
                    <i className="fas fa-calendar-check me-2"></i>
                    Go to Dashboard to Book
                  </Button>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>Request ID</th>
                        <th>Waste Type</th>
                        <th>Quantity</th>
                        <th>Pickup Date</th>
                        <th>Time Preference</th>
                        <th>Status</th>
                        <th>Collector</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((request) => (
                        <tr key={request.id}>
                          <td>
                            <strong>#{request.id}</strong>
                          </td>
                          <td>
                            <Badge bg="secondary" className="text-capitalize">
                              {request.waste_type.replace('-', ' ')}
                            </Badge>
                          </td>
                          <td>{request.quantity} kg</td>
                          <td>{formatDate(request.pickup_date)}</td>
                          <td>{formatPickupTime(request.pickup_time)}</td>
                          <td>{getStatusBadge(request.status)}</td>
                          <td>
                            {request.collector_first_name ? (
                              <div>
                                <strong>
                                  {request.collector_first_name} {request.collector_last_name}
                                </strong>
                                <br />
                                <small className="text-muted">
                                  {request.collector_phone}
                                </small>
                              </div>
                            ) : (
                              <span className="text-muted">Not assigned</span>
                            )}
                          </td>
                          <td>{formatDate(request.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>

          {requests.length > 0 && (
            <div className="mt-4">
              <Card className="bg-light">
                <Card.Body>
                  <h6 className="mb-3">Request Status Guide:</h6>
                  <div className="d-flex flex-wrap gap-3">
                    <div><Badge bg="warning">Pending</Badge> - Waiting for collector assignment</div>
                    <div><Badge bg="info">Assigned</Badge> - Collector assigned, pickup scheduled</div>
                    <div><Badge bg="primary">In Progress</Badge> - Collector is on the way</div>
                    <div><Badge bg="success">Completed</Badge> - Waste successfully collected</div>
                    <div><Badge bg="danger">Cancelled</Badge> - Request was cancelled</div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

const mapStateToProps = (state) => ({
  auth: state.auth
});

export default connect(mapStateToProps)(MyRequests);
