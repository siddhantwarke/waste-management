import React from 'react';
import { connect } from 'react-redux';
import { Navbar, Nav, Container, NavDropdown, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { logout } from '../redux/actions/authActions';
import { toast } from 'react-toastify';

const Navigation = ({ auth, logout }) => {
  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  return (
    <Navbar bg="success" variant="dark" expand="lg" sticky="top">
      <Container>
        <LinkContainer to="/">
          <Navbar.Brand className="fw-bold">
            <i className="fas fa-recycle me-2"></i>
            🗂️ WasteHub Pro
          </Navbar.Brand>
        </LinkContainer>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {auth.isAuthenticated && (
              <>
                <LinkContainer to="/dashboard">
                  <Nav.Link>Dashboard</Nav.Link>
                </LinkContainer>
                
                {auth.user?.role === 'customer' && (
                  <>
                    <LinkContainer to="/my-requests">
                      <Nav.Link>My Requests</Nav.Link>
                    </LinkContainer>
                  </>
                )}
                
                {auth.user?.role === 'collector' && (
                  <>
                    <LinkContainer to="/available-requests">
                      <Nav.Link>Available Requests</Nav.Link>
                    </LinkContainer>
                    <LinkContainer to="/my-collections">
                      <Nav.Link>My Collections</Nav.Link>
                    </LinkContainer>
                  </>
                )}
              </>
            )}
          </Nav>
          
          <Nav>
            {auth.isAuthenticated ? (
              <NavDropdown 
                title={
                  <span>
                    <i className="fas fa-user-circle me-1"></i>
                    {auth.user?.first_name} {auth.user?.last_name}
                  </span>
                } 
                id="user-dropdown"
                align="end"
              >
                <LinkContainer to="/profile">
                  <NavDropdown.Item>
                    <i className="fas fa-user me-2"></i>
                    Profile
                  </NavDropdown.Item>
                </LinkContainer>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt me-2"></i>
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <LinkContainer to="/login">
                  <Nav.Link>
                    <Button variant="outline-light" size="sm">
                      Login
                    </Button>
                  </Nav.Link>
                </LinkContainer>
                <LinkContainer to="/register">
                  <Nav.Link>
                    <Button variant="light" size="sm" className="ms-2">
                      Register
                    </Button>
                  </Nav.Link>
                </LinkContainer>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

const mapStateToProps = (state) => ({
  auth: state.auth
});

const mapDispatchToProps = {
  logout
};

export default connect(mapStateToProps, mapDispatchToProps)(Navigation);
