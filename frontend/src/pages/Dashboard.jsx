import React from 'react';
import { connect } from 'react-redux';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

const Dashboard = ({ auth }) => {
  const { user } = auth;

  const customerDashboard = () => (
    <>
      <Row className="mb-4">
        <Col>
          <h2 className="text-primary">Customer Dashboard</h2>
          <p className="text-muted">Manage your waste pickup requests</p>
        </Col>
      </Row>
      
      <Row className="g-4">
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="text-center">
              <div className="mb-3">
                <i className="fas fa-plus-circle fa-3x text-primary"></i>
              </div>
              <Card.Title>Request Pickup</Card.Title>
              <Card.Text>
                Schedule a new waste collection request for your location.
              </Card.Text>
              <LinkContainer to="/request-pickup">
                <Button variant="primary">New Request</Button>
              </LinkContainer>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="text-center">
              <div className="mb-3">
                <i className="fas fa-list-alt fa-3x text-success"></i>
              </div>
              <Card.Title>My Requests</Card.Title>
              <Card.Text>
                View and manage your existing pickup requests.
              </Card.Text>
              <LinkContainer to="/my-requests">
                <Button variant="success">View Requests</Button>
              </LinkContainer>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="text-center">
              <div className="mb-3">
                <i className="fas fa-history fa-3x text-info"></i>
              </div>
              <Card.Title>History</Card.Title>
              <Card.Text>
                Review your completed waste collection history.
              </Card.Text>
              <LinkContainer to="/history">
                <Button variant="info">View History</Button>
              </LinkContainer>
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
          <p className="text-muted">Manage waste collection requests</p>
        </Col>
      </Row>
      
      <Row className="g-4">
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="text-center">
              <div className="mb-3">
                <i className="fas fa-search fa-3x text-primary"></i>
              </div>
              <Card.Title>Available Requests</Card.Title>
              <Card.Text>
                Browse and accept new waste collection requests.
              </Card.Text>
              <LinkContainer to="/available-requests">
                <Button variant="primary">Browse Requests</Button>
              </LinkContainer>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="text-center">
              <div className="mb-3">
                <i className="fas fa-truck fa-3x text-warning"></i>
              </div>
              <Card.Title>My Collections</Card.Title>
              <Card.Text>
                Manage your assigned collection tasks.
              </Card.Text>
              <LinkContainer to="/my-collections">
                <Button variant="warning">View Collections</Button>
              </LinkContainer>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="text-center">
              <div className="mb-3">
                <i className="fas fa-chart-line fa-3x text-success"></i>
              </div>
              <Card.Title>Statistics</Card.Title>
              <Card.Text>
                View your collection performance and earnings.
              </Card.Text>
              <LinkContainer to="/statistics">
                <Button variant="success">View Stats</Button>
              </LinkContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );

  return (
    <Container className="py-5">
      {/* Welcome Section */}
      <Row className="mb-5">
        <Col>
          <Card className="bg-primary text-white">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={8}>
                  <h3 className="mb-2">
                    Welcome back, {user?.first_name} {user?.last_name}!
                  </h3>
                  <p className="mb-0">
                    <Badge bg="light" text="dark" className="me-2">
                      <i className="fas fa-user-tag me-1"></i>
                      {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                    </Badge>
                    {user?.email}
                  </p>
                </Col>
                <Col md={4} className="text-end">
                  <div className="display-4">
                    <i className={`fas ${user?.role === 'customer' ? 'fa-user' : 'fa-truck'}`}></i>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Role-specific Dashboard */}
      {user?.role === 'customer' ? customerDashboard() : collectorDashboard()}

      {/* Quick Stats */}
      <Row className="mt-5">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Quick Stats</h5>
            </Card.Header>
            <Card.Body>
              <Row className="text-center">
                <Col md={3}>
                  <div className="stat-item">
                    <h4 className="text-primary">0</h4>
                    <p className="text-muted mb-0">
                      {user?.role === 'customer' ? 'Total Requests' : 'Collections Completed'}
                    </p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="stat-item">
                    <h4 className="text-warning">0</h4>
                    <p className="text-muted mb-0">
                      {user?.role === 'customer' ? 'Pending Requests' : 'Active Collections'}
                    </p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="stat-item">
                    <h4 className="text-success">0</h4>
                    <p className="text-muted mb-0">
                      {user?.role === 'customer' ? 'Completed Pickups' : 'Total Earnings'}
                    </p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="stat-item">
                    <h4 className="text-info">0</h4>
                    <p className="text-muted mb-0">Rating</p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

const mapStateToProps = (state) => ({
  auth: state.auth
});

export default connect(mapStateToProps)(Dashboard);
