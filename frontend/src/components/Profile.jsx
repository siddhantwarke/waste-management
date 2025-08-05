import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { getUserProfile, updateProfile } from '../redux/actions/authActions';
import api from '../services/api';
import { WASTE_TYPES } from '../utils/wasteTypes';

const Profile = ({ auth, getUserProfile, updateProfile }) => {
  const { user } = auth;
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);

  // Create validation schema as a function to access current profileData
  const getValidationSchema = () => Yup.object({
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
    // Dynamic validation for waste price fields
    ...Object.fromEntries(
      WASTE_TYPES.map(type => [
        type.key,
        Yup.number().when([], {
          is: () => profileData?.role === 'collector',
          then: (schema) => schema
            .min(0, 'Price must be 0 or greater')
            .max(10000, 'Price must not exceed 10000')
            .required(`${type.label} price is required`),
          otherwise: (schema) => schema.notRequired()
        })
      ])
    )
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
      
      console.log('Profile update - submitting values:', values);
      console.log('Profile update - current user:', user);
      
      // Filter data based on user role
      const baseData = {
        first_name: values.first_name,
        last_name: values.last_name,
        phone: values.phone,
        address: values.address,
        country: values.country,
        state: values.state,
        city: values.city
      };
      
      // Only include collector-specific fields if user is a collector and they have values
      let submitData = baseData;
      if (user && user.role === 'collector') {
        const collectorData = {};
        
        // Only include collector fields that have values
        if (values.collector_group_name && values.collector_group_name.trim()) {
          collectorData.collector_group_name = values.collector_group_name.trim();
        }
        
        // Only include price fields that have numeric values
        const priceFields = ['e_waste_price', 'plastic_price', 'organic_price', 'paper_price', 
                           'metal_price', 'glass_price', 'hazardous_price', 'mixed_price'];
        
        priceFields.forEach(field => {
          if (values[field] && values[field].toString().trim() && !isNaN(values[field])) {
            collectorData[field] = parseFloat(values[field]);
          }
        });
        
        submitData = {
          ...baseData,
          ...collectorData
        };
      }
      
      console.log('Profile update - filtered submit data:', submitData);
      
      const result = await updateProfile(submitData);
      
      console.log('Profile update - result:', result);
      
      if (result.success) {
        toast.success(result.message);
        setProfileData({ ...profileData, ...values });
        // Reload profile to get fresh data from server
        await loadProfile();
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
      console.error('Profile update error:', error);
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
                  // Dynamic price fields for each waste type
                  ...Object.fromEntries(WASTE_TYPES.map(type => [type.key, profileData[type.key] || '']))
                }}
                validationSchema={getValidationSchema()}
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
