import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { getUserProfile, updateProfile } from '../redux/actions/authActions';
import api from '../services/api';

const Profile = ({ auth, getUserProfile, updateProfile }) => {
  const { user } = auth;
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);

  const validationSchema = Yup.object({
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
    // Collector-specific validations (conditional based on user role)
    collector_group_name: Yup.string().when([], {
      is: () => profileData?.role === 'collector',
      then: (schema) => schema
        .min(2, 'Collector group name must be at least 2 characters')
        .max(100, 'Collector group name must not exceed 100 characters')
        .required('Collector group name is required'),
      otherwise: (schema) => schema.notRequired()
    }),
    organic_price: Yup.number().when([], {
      is: () => profileData?.role === 'collector',
      then: (schema) => schema
        .min(0, 'Price must be 0 or greater')
        .max(10000, 'Price must not exceed 10000')
        .required('Organic waste price is required'),
      otherwise: (schema) => schema.notRequired()
    }),
    recyclable_price: Yup.number().when([], {
      is: () => profileData?.role === 'collector',
      then: (schema) => schema
        .min(0, 'Price must be 0 or greater')
        .max(10000, 'Price must not exceed 10000')
        .required('Recyclable waste price is required'),
      otherwise: (schema) => schema.notRequired()
    }),
    electronic_price: Yup.number().when([], {
      is: () => profileData?.role === 'collector',
      then: (schema) => schema
        .min(0, 'Price must be 0 or greater')
        .max(10000, 'Price must not exceed 10000')
        .required('Electronic waste price is required'),
      otherwise: (schema) => schema.notRequired()
    }),
    hazardous_price: Yup.number().when([], {
      is: () => profileData?.role === 'collector',
      then: (schema) => schema
        .min(0, 'Price must be 0 or greater')
        .max(10000, 'Price must not exceed 10000')
        .required('Hazardous waste price is required'),
      otherwise: (schema) => schema.notRequired()
    }),
    general_price: Yup.number().when([], {
      is: () => profileData?.role === 'collector',
      then: (schema) => schema
        .min(0, 'Price must be 0 or greater')
        .max(10000, 'Price must not exceed 10000')
        .required('General waste price is required'),
      otherwise: (schema) => schema.notRequired()
    })
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/profile');
      if (response.data.success) {
        setProfileData(response.data.user);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      setSubmitting(true);
      
      const result = await updateProfile(values);
      
      if (result.success) {
        toast.success(result.message);
        setProfileData({ ...profileData, ...values });
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

  if (loading) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="shadow">
              <Card.Body className="text-center py-5">
                <Spinner animation="border" role="status" className="mb-3">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p>Loading profile...</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  if (!profileData) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="shadow">
              <Card.Body className="text-center py-5">
                <Alert variant="danger">
                  Failed to load profile data. Please try refreshing the page.
                </Alert>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <i className="fas fa-user me-2"></i>
                User Profile
              </h5>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="mb-4">
                <Row>
                  <Col md={6}>
                    <p><strong>Username:</strong> {profileData.username}</p>
                    <p><strong>Email:</strong> {profileData.email}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Role:</strong> <Badge bg={profileData.role === 'customer' ? 'primary' : 'success'}>{profileData.role}</Badge></p>
                    <p><strong>Member since:</strong> {new Date(profileData.created_at).toLocaleDateString()}</p>
                  </Col>
                </Row>
              </div>

              <h5 className="text-primary border-bottom pb-2 mb-3">
                <i className="fas fa-edit me-2"></i>
                Edit Profile
              </h5>

              <Formik
                initialValues={{
                  first_name: profileData.first_name || '',
                  last_name: profileData.last_name || '',
                  phone: profileData.phone || '',
                  address: profileData.address || '',
                  country: profileData.country || '',
                  state: profileData.state || '',
                  city: profileData.city || '',
                  // Collector-specific fields
                  collector_group_name: profileData.collector_group_name || '',
                  organic_price: profileData.organic_price || '',
                  recyclable_price: profileData.recyclable_price || '',
                  electronic_price: profileData.electronic_price || '',
                  hazardous_price: profileData.hazardous_price || '',
                  general_price: profileData.general_price || ''
                }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize={true}
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

                    <Form.Group className="mb-3">
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
                    {profileData.role === 'collector' && (
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
                          <small className="text-muted">Update your pricing for different types of waste collection</small>
                        </div>

                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Organic Waste <span className="text-danger">*</span></Form.Label>
                              <div className="input-group">
                                <span className="input-group-text">$</span>
                                <Form.Control
                                  type="number"
                                  step="0.01"
                                  name="organic_price"
                                  value={values.organic_price}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  isInvalid={touched.organic_price && errors.organic_price}
                                  placeholder="0.00"
                                />
                                <span className="input-group-text">/ kg</span>
                              </div>
                              <Form.Control.Feedback type="invalid">
                                {errors.organic_price}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Recyclable Waste <span className="text-danger">*</span></Form.Label>
                              <div className="input-group">
                                <span className="input-group-text">$</span>
                                <Form.Control
                                  type="number"
                                  step="0.01"
                                  name="recyclable_price"
                                  value={values.recyclable_price}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  isInvalid={touched.recyclable_price && errors.recyclable_price}
                                  placeholder="0.00"
                                />
                                <span className="input-group-text">/ kg</span>
                              </div>
                              <Form.Control.Feedback type="invalid">
                                {errors.recyclable_price}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                        </Row>

                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Electronic Waste <span className="text-danger">*</span></Form.Label>
                              <div className="input-group">
                                <span className="input-group-text">$</span>
                                <Form.Control
                                  type="number"
                                  step="0.01"
                                  name="electronic_price"
                                  value={values.electronic_price}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  isInvalid={touched.electronic_price && errors.electronic_price}
                                  placeholder="0.00"
                                />
                                <span className="input-group-text">/ kg</span>
                              </div>
                              <Form.Control.Feedback type="invalid">
                                {errors.electronic_price}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Hazardous Waste <span className="text-danger">*</span></Form.Label>
                              <div className="input-group">
                                <span className="input-group-text">$</span>
                                <Form.Control
                                  type="number"
                                  step="0.01"
                                  name="hazardous_price"
                                  value={values.hazardous_price}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  isInvalid={touched.hazardous_price && errors.hazardous_price}
                                  placeholder="0.00"
                                />
                                <span className="input-group-text">/ kg</span>
                              </div>
                              <Form.Control.Feedback type="invalid">
                                {errors.hazardous_price}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                        </Row>

                        <Form.Group className="mb-4">
                          <Form.Label>General Waste <span className="text-danger">*</span></Form.Label>
                          <div className="input-group">
                            <span className="input-group-text">$</span>
                            <Form.Control
                              type="number"
                              step="0.01"
                              name="general_price"
                              value={values.general_price}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              isInvalid={touched.general_price && errors.general_price}
                              placeholder="0.00"
                            />
                            <span className="input-group-text">/ kg</span>
                          </div>
                          <Form.Control.Feedback type="invalid">
                            {errors.general_price}
                          </Form.Control.Feedback>
                        </Form.Group>
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
                            Updating Profile...
                          </>
                        ) : (
                          'Update Profile'
                        )}
                      </Button>
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

export default connect(mapStateToProps, { getUserProfile, updateProfile })(Profile);
