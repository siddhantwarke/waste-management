import React from 'react';
import { connect } from 'react-redux';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

const Home = ({ auth }) => {
  return (
    <>
      {/* Hero Section */}
      <div className="bg-primary text-white py-5">
        <Container>
          <Row className="align-items-center min-vh-75">
            <Col lg={6}>
              <h1 className="display-4 fw-bold mb-4">
                Smart Waste Management Solution
              </h1>
              <p className="lead mb-4">
                Connect customers who need waste pickup with reliable collectors. 
                Make waste management efficient, sustainable, and convenient for everyone.
              </p>
              {!auth.isAuthenticated ? (
                <div className="d-flex gap-3">
                  <LinkContainer to="/register">
                    <Button variant="light" size="lg">
                      Get Started
                    </Button>
                  </LinkContainer>
                  <LinkContainer to="/login">
                    <Button variant="outline-light" size="lg">
                      Sign In
                    </Button>
                  </LinkContainer>
                </div>
              ) : (
                <LinkContainer to="/dashboard">
                  <Button variant="light" size="lg">
                    Go to Dashboard
                  </Button>
                </LinkContainer>
              )}
            </Col>
            <Col lg={6} className="text-center">
              <div className="display-1">
                <i className="fas fa-recycle"></i>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Features Section */}
      <Container className="py-5">
        <Row className="text-center mb-5">
          <Col>
            <h2 className="display-5 fw-bold mb-3">How It Works</h2>
            <p className="lead text-muted">
              Simple steps to connect waste generators with collectors
            </p>
          </Col>
        </Row>

        <Row className="g-4">
          <Col md={4}>
            <Card className="h-100 text-center shadow-sm">
              <Card.Body className="p-4">
                <div className="mb-3">
                  <i className="fas fa-user-plus fa-3x text-primary"></i>
                </div>
                <Card.Title>1. Sign Up</Card.Title>
                <Card.Text>
                  Register as a customer needing waste pickup or as a collector 
                  offering waste collection services.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="h-100 text-center shadow-sm">
              <Card.Body className="p-4">
                <div className="mb-3">
                  <i className="fas fa-handshake fa-3x text-success"></i>
                </div>
                <Card.Title>2. Connect</Card.Title>
                <Card.Text>
                  Customers post requests, collectors browse and accept jobs. 
                  Smart matching based on location and requirements.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="h-100 text-center shadow-sm">
              <Card.Body className="p-4">
                <div className="mb-3">
                  <i className="fas fa-check-circle fa-3x text-warning"></i>
                </div>
                <Card.Title>3. Complete</Card.Title>
                <Card.Text>
                  Track pickup progress, confirm completion, and rate the service. 
                  Build trust through our rating system.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Benefits Section */}
      <div className="bg-light py-5">
        <Container>
          <Row>
            <Col lg={6}>
              <h2 className="display-6 fw-bold mb-4">For Customers</h2>
              <ul className="list-unstyled">
                <li className="mb-3">
                  <i className="fas fa-check text-success me-3"></i>
                  Schedule convenient pickup times
                </li>
                <li className="mb-3">
                  <i className="fas fa-check text-success me-3"></i>
                  Choose from verified collectors
                </li>
                <li className="mb-3">
                  <i className="fas fa-check text-success me-3"></i>
                  Track pickup status in real-time
                </li>
                <li className="mb-3">
                  <i className="fas fa-check text-success me-3"></i>
                  Competitive pricing
                </li>
              </ul>
            </Col>
            
            <Col lg={6}>
              <h2 className="display-6 fw-bold mb-4">For Collectors</h2>
              <ul className="list-unstyled">
                <li className="mb-3">
                  <i className="fas fa-check text-primary me-3"></i>
                  Flexible work schedule
                </li>
                <li className="mb-3">
                  <i className="fas fa-check text-primary me-3"></i>
                  Find jobs in your area
                </li>
                <li className="mb-3">
                  <i className="fas fa-check text-primary me-3"></i>
                  Build your reputation
                </li>
                <li className="mb-3">
                  <i className="fas fa-check text-primary me-3"></i>
                  Earn extra income
                </li>
              </ul>
            </Col>
          </Row>
        </Container>
      </div>

      {/* CTA Section */}
      {!auth.isAuthenticated && (
        <Container className="py-5">
          <Row className="text-center">
            <Col>
              <h2 className="display-6 fw-bold mb-4">Ready to Get Started?</h2>
              <p className="lead mb-4">
                Join our community and make waste management more efficient
              </p>
              <div className="d-flex justify-content-center gap-3">
                <LinkContainer to="/register">
                  <Button variant="primary" size="lg">
                    Join as Customer
                  </Button>
                </LinkContainer>
                <LinkContainer to="/register">
                  <Button variant="success" size="lg">
                    Join as Collector
                  </Button>
                </LinkContainer>
              </div>
            </Col>
          </Row>
        </Container>
      )}
    </>
  );
};

const mapStateToProps = (state) => ({
  auth: state.auth
});

export default connect(mapStateToProps)(Home);
