import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { register, clearAuthError } from '../redux/actions/authActions';
import { toast } from 'react-toastify';
import { WASTE_TYPES } from '../utils/wasteTypes';

const Register = ({ auth, register, clearAuthError }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const validationSchema = Yup.object({
    username: Yup.string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username must not exceed 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
      .required('Username is required'),
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Please confirm your password'),
    role: Yup.string()
      .oneOf(['customer', 'collector'], 'Please select a valid role')
      .required('Role is required'),
    first_name: Yup.string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must not exceed 50 characters')
      .matches(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces')
      .required('First name is required'),
    last_name: Yup.string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must not exceed 50 characters')
      .matches(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces')
      .required('Last name is required'),
    phone: Yup.string()
      .matches(/^[+]?[1-9][\d]{0,15}$/, 'Please provide a valid phone number')
      .required('Phone number is required'),
    address: Yup.string()
      .min(10, 'Address must be at least 10 characters')
      .max(500, 'Address must not exceed 500 characters')
      .required('Address is required'),
    country: Yup.string()
      .min(2, 'Country must be at least 2 characters')
      .max(100, 'Country must not exceed 100 characters')
      .matches(/^[a-zA-Z\s]+$/, 'Country can only contain letters and spaces')
      .required('Country is required'),
    state: Yup.string()
      .min(2, 'State must be at least 2 characters')
      .max(100, 'State must not exceed 100 characters')
      .matches(/^[a-zA-Z\s]+$/, 'State can only contain letters and spaces')
      .required('State is required'),
    city: Yup.string()
      .min(2, 'City must be at least 2 characters')
      .max(100, 'City must not exceed 100 characters')
      .matches(/^[a-zA-Z\s]+$/, 'City can only contain letters and spaces')
      .required('City is required'),
    // Collector-specific validations (conditional)
    collector_group_name: Yup.string().when('role', {
      is: 'collector',
      then: (schema) => schema
        .min(2, 'Collector group name must be at least 2 characters')
        .max(100, 'Collector group name must not exceed 100 characters')
        .required('Collector group name is required'),
      otherwise: (schema) => schema.notRequired()
    }),
    // Dynamic validation for waste price fields
    ...Object.fromEntries(
      WASTE_TYPES.map(type => [
        type.key,
        Yup.number().when('role', {
          is: 'collector',
          then: (schema) => schema
            .min(0, 'Price must be 0 or greater')
            .max(10000, 'Price must not exceed 10000')
            .required(`${type.label} price is required`),
          otherwise: (schema) => schema.notRequired()
        })
      ])
    )
  });

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      // Remove confirmPassword from the data sent to backend
      const { confirmPassword, ...userData } = values;
      
      const result = await register(userData);
      
      if (result.success) {
        toast.success(result.message);
        navigate('/dashboard');
      } else {
        if (result.errors && result.errors.length > 0) {
          // Handle validation errors from backend
          result.errors.forEach(error => {
            setFieldError(error.field, error.message);
          });
        } else {
          toast.error(result.message);
        }
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
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2 className="fw-bold text-primary">Create Account</h2>
                <p className="text-muted">Join our waste management community</p>
              </div>

              {auth.error && (
                <Alert variant="danger" className="mb-3">
                  {auth.error}
                </Alert>
              )}

              <Formik
                initialValues={{
                  username: '',
                  email: '',
                  password: '',
                  confirmPassword: '',
                  role: '',
                  first_name: '',
                  last_name: '',
                  phone: '',
                  address: '',
                  country: '',
                  state: '',
                  city: '',
                  // Collector-specific fields
                  collector_group_name: '',
                  // Dynamic price fields for each waste type
                  ...Object.fromEntries(WASTE_TYPES.map(type => [type.key, '']))
                }}
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
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>First Name <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="first_name"
                            value={values.first_name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.first_name && errors.first_name}
                            placeholder="Enter your first name"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.first_name}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Last Name <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="last_name"
                            value={values.last_name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.last_name && errors.last_name}
                            placeholder="Enter your last name"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.last_name}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Username <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="username"
                        value={values.username}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.username && errors.username}
                        placeholder="Choose a username"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.username}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Email Address <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.email && errors.email}
                        placeholder="Enter your email address"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.email}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Role <span className="text-danger">*</span></Form.Label>
                      <Form.Select
                        name="role"
                        value={values.role}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.role && errors.role}
                      >
                        <option value="">Select your role</option>
                        <option value="customer">Customer</option>
                        <option value="collector">Waste Collector</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.role}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Password <span className="text-danger">*</span></Form.Label>
                          <div className="position-relative">
                            <Form.Control
                              type={showPassword ? "text" : "password"}
                              name="password"
                              value={values.password}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              isInvalid={touched.password && errors.password}
                              placeholder="Create a password"
                            />
                            <Button
                              variant="outline-secondary"
                              className="position-absolute end-0 top-0 h-100 px-3 border-start-0"
                              style={{ borderRadius: '0 0.375rem 0.375rem 0' }}
                              onClick={() => setShowPassword(!showPassword)}
                              type="button"
                            >
                              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </Button>
                          </div>
                          <Form.Control.Feedback type="invalid">
                            {errors.password}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Confirm Password <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="password"
                            name="confirmPassword"
                            value={values.confirmPassword}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.confirmPassword && errors.confirmPassword}
                            placeholder="Confirm your password"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.confirmPassword}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={values.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.phone && errors.phone}
                        placeholder="Enter your phone number"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.phone}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Address <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="address"
                        value={values.address}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.address && errors.address}
                        placeholder="Enter your complete address"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.address}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Country <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="country"
                            value={values.country}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.country && errors.country}
                            placeholder="Enter your country"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.country}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>State <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="state"
                            value={values.state}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.state && errors.state}
                            placeholder="Enter your state"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.state}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-4">
                      <Form.Label>City <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="city"
                        value={values.city}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.city && errors.city}
                        placeholder="Enter your city"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.city}
                      </Form.Control.Feedback>
                    </Form.Group>

                    {/* Collector-specific fields */}
                    {values.role === 'collector' && (
                      <>
                        <div className="mt-4 mb-3">
                          <h6 className="text-primary border-bottom pb-2">
                            <i className="fas fa-truck me-2"></i>
                            Collector Information
                          </h6>
                        </div>
                        
                        <Form.Group className="mb-3">
                          <Form.Label>Collector Group Name <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="collector_group_name"
                            value={values.collector_group_name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.collector_group_name && errors.collector_group_name}
                            placeholder="Enter your collector group/company name"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.collector_group_name}
                          </Form.Control.Feedback>
                        </Form.Group>

                        <div className="mb-3">
                          <h6 className="text-secondary">
                            <i className="fas fa-tags me-2"></i>
                            Waste Collection Prices (per kg)
                          </h6>
                          <small className="text-muted">Enter your pricing for different types of waste collection</small>
                        </div>

                        <Row>
                          {WASTE_TYPES.map((wasteType, index) => (
                            <Col md={6} key={wasteType.value}>
                              <Form.Group className="mb-3">
                                <Form.Label>
                                  <span className="me-2" style={{ fontSize: '1.2em' }}>{wasteType.emoji}</span>
                                  {wasteType.label} <span className="text-danger">*</span>
                                </Form.Label>
                                <div className="input-group">
                                  <span className="input-group-text">
                                    <i className="fas fa-dollar-sign"></i>
                                  </span>
                                  <Form.Control
                                    type="number"
                                    step="0.01"
                                    name={wasteType.key}
                                    value={values[wasteType.key]}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    isInvalid={touched[wasteType.key] && errors[wasteType.key]}
                                    placeholder="0.00"
                                  />
                                  <span className="input-group-text">
                                    <i className="fas fa-weight-hanging me-1"></i>
                                    / kg
                                  </span>
                                </div>
                                <Form.Control.Feedback type="invalid">
                                  {errors[wasteType.key]}
                                </Form.Control.Feedback>
                              </Form.Group>
                            </Col>
                          ))}
                        </Row>
                      </>
                    )}

                    <div className="d-grid gap-2">
                      <Button
                        variant="primary"
                        type="submit"
                        size="lg"
                        disabled={isSubmitting}
                        className="fw-bold"
                      >
                        {isSubmitting ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-2"
                            />
                            Creating Account...
                          </>
                        ) : (
                          'Create Account'
                        )}
                      </Button>
                    </div>

                    <div className="text-center mt-3">
                      <p className="text-muted">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary text-decoration-none fw-bold">
                          Sign In
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
  );
};

const mapStateToProps = (state) => ({
  auth: state.auth
});

const mapDispatchToProps = {
  register,
  clearAuthError
};

export default connect(mapStateToProps, mapDispatchToProps)(Register);