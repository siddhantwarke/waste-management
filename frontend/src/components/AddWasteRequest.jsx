import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import api from '../services/api';
import { WASTE_TYPES } from '../utils/wasteTypes';

const AddWasteRequest = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timePreferences = [
    { value: 'morning', label: 'Morning (8AM - 12PM)' },
    { value: 'afternoon', label: 'Afternoon (12PM - 5PM)' },
    { value: 'evening', label: 'Evening (5PM - 8PM)' },
    { value: 'flexible', label: 'Flexible (Any time)' }
  ];

  const validationSchema = Yup.object({
    waste_type: Yup.string()
      .oneOf(WASTE_TYPES.map(type => type.value), 'Please select a valid waste type')
      .required('Waste type is required'),
    quantity: Yup.number()
      .min(0.1, 'Quantity must be at least 0.1 kg')
      .max(1000, 'Quantity cannot exceed 1000 kg')
      .required('Quantity is required'),
    pickup_address: Yup.string()
      .min(10, 'Pickup address must be at least 10 characters')
      .max(500, 'Pickup address cannot exceed 500 characters')
      .required('Pickup address is required'),
    pickup_date: Yup.date()
      .min(new Date(), 'Pickup date cannot be in the past')
      .required('Pickup date is required'),
    pickup_time: Yup.string()
      .oneOf(timePreferences.map(time => time.value), 'Please select a valid time preference')
      .required('Pickup time preference is required'),
    special_instructions: Yup.string()
      .max(1000, 'Special instructions cannot exceed 1000 characters')
      .optional()
  });

  const handleSubmit = async (values, { setSubmitting, resetForm, setFieldError }) => {
    try {
      setIsSubmitting(true);
      
      // Format the date to YYYY-MM-DD
      const formattedValues = {
        ...values,
        pickup_date: new Date(values.pickup_date).toISOString().split('T')[0]
      };

      const response = await api.post('/waste/requests', formattedValues);
      
      console.log('Waste request submission response:', response.data);
      
      if (response.data.success) {
        toast.success('Waste pickup request submitted successfully!');
        resetForm();
        // Navigate with a slight delay to ensure the request is processed
        setTimeout(() => {
          navigate('/dashboard', { state: { refreshRequests: true } });
        }, 500);
      } else {
        toast.error(response.data.message || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting waste request:', error);
      
      if (error.response?.data?.errors) {
        // Handle validation errors from backend
        error.response.data.errors.forEach(err => {
          setFieldError(err.field, err.message);
        });
      } else {
        toast.error(error.response?.data?.message || 'Failed to submit waste request');
      }
    } finally {
      setIsSubmitting(false);
      setSubmitting(false);
    }
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow">
            <Card.Header className="bg-success text-white">
              <h4 className="mb-0">
                <i className="fas fa-plus-circle me-2"></i>
                Request Waste Pickup
              </h4>
            </Card.Header>
            <Card.Body className="p-4">
              <p className="text-muted mb-4">
                Fill out the form below to schedule a waste pickup service.
              </p>

              <Formik
                initialValues={{
                  waste_type: '',
                  quantity: '',
                  pickup_address: '',
                  pickup_date: '',
                  pickup_time: '',
                  special_instructions: ''
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
                  handleSubmit
                }) => (
                  <Form onSubmit={handleSubmit}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <i className="fas fa-recycle me-2 text-success"></i>
                            Waste Type <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Select
                            name="waste_type"
                            value={values.waste_type}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.waste_type && errors.waste_type}
                          >
                            <option value="">
                              <i className="fas fa-hand-pointer"></i> Select waste type
                            </option>
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
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Quantity (kg) <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="number"
                            step="0.1"
                            min="0.1"
                            max="1000"
                            name="quantity"
                            value={values.quantity}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.quantity && errors.quantity}
                            placeholder="Enter quantity in kg"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.quantity}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Pickup Address <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="pickup_address"
                        value={values.pickup_address}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.pickup_address && errors.pickup_address}
                        placeholder="Enter the full address where waste should be picked up"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.pickup_address}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Pickup Date <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="date"
                            name="pickup_date"
                            value={values.pickup_date}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.pickup_date && errors.pickup_date}
                            min={new Date().toISOString().split('T')[0]}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.pickup_date}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Time Preference <span className="text-danger">*</span></Form.Label>
                          <Form.Select
                            name="pickup_time"
                            value={values.pickup_time}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.pickup_time && errors.pickup_time}
                          >
                            <option value="">Select time preference</option>
                            {timePreferences.map(time => (
                              <option key={time.value} value={time.value}>
                                {time.label}
                              </option>
                            ))}
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">
                            {errors.pickup_time}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-4">
                      <Form.Label>Special Instructions (Optional)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="special_instructions"
                        value={values.special_instructions}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.special_instructions && errors.special_instructions}
                        placeholder="Any special instructions for the collector (e.g., location details, access instructions)"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.special_instructions}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <div className="d-grid">
                      <Button
                        variant="success"
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
                            Submitting Request...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane me-2"></i>
                            Submit Pickup Request
                          </>
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

export default AddWasteRequest;
