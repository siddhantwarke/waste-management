import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { login, clearAuthError } from '../redux/actions/authActions';
import { toast } from 'react-toastify';
import './Login.css';

const Login = ({ auth, login, clearAuthError }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .required('Password is required')
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const result = await login(values.email, values.password);
      
      if (result.success) {
        toast.success(result.message);
        navigate('/dashboard');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  React.useEffect(() => {
    if (auth.isAuthenticated) {
      navigate('/dashboard');
    }
    
    // Clear any existing errors when component mounts
    if (auth.error) {
      clearAuthError();
    }
  }, [auth.isAuthenticated, navigate, auth.error, clearAuthError]);

  return (
    <div className="login-page">
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <Card className="shadow-lg">
              <Card.Body>
                <div className="text-center mb-4">
                  <h2 className="fw-bold">🗂️ WasteHub Pro</h2>
                  <h3 className="fw-bold text-success mb-2">Welcome Back</h3>
                  <p className="text-muted">Sign in to manage your waste collection services</p>
                </div>

              {auth.error && (
                <Alert variant="danger" className="mb-3">
                  {auth.error}
                </Alert>
              )}

              <Formik
                initialValues={{ email: '', password: '' }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {({
                  values,
                  errors,
                  touched,
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  isSubmitting
                }) => (
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.email && errors.email}
                        placeholder="Enter your email"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.email}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Password</Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={values.password}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.password && errors.password}
                          placeholder="Enter your password"
                        />
                        <Button
                          variant="link"
                          className="position-absolute top-50 end-0 translate-middle-y border-0 text-muted"
                          style={{ background: 'none', fontSize: '0.875rem' }}
                          onClick={() => setShowPassword(!showPassword)}
                          type="button"
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </Button>
                      </div>
                      <Form.Control.Feedback type="invalid">
                        {errors.password}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Button
                      variant="success"
                      type="submit"
                      className="w-100 mb-3"
                      disabled={isSubmitting || auth.loading}
                    >
                      {(isSubmitting || auth.loading) ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Signing In...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>

                    <div className="text-center">
                      <p className="mb-0">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary fw-bold">
                          Sign Up
                        </Link>
                      </p>
                    </div>
                  </Form>
                )}
              </Formik>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
    </div>
  );
};

const mapStateToProps = (state) => ({
  auth: state.auth
});

const mapDispatchToProps = {
  login,
  clearAuthError
};

export default connect(mapStateToProps, mapDispatchToProps)(Login);
