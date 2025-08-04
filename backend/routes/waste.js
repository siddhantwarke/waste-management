const express = require('express');
const router = express.Router();
const {
  getNearbyCollectors,
  getUserWasteRequests,
  createWasteRequest,
  updateWasteRequestStatus,
  acceptRequest,
  rejectRequest,
  completeRequest,
  getPendingRequests,
  getMyAssignedRequests,
  updateUserLocation
} = require('../controllers/wasteController');
const { protect, authorize } = require('../middleware/auth');
const { validateWasteRequest, handleValidationErrors } = require('../middleware/validation');

// @route   GET /api/waste/collectors/nearby
// @desc    Get nearby waste collectors
// @access  Private (Customer)
router.get('/collectors/nearby', protect, authorize('customer'), getNearbyCollectors);

// @route   GET /api/waste/requests
// @desc    Get user's waste requests
// @access  Private
router.get('/requests', protect, getUserWasteRequests);

// @route   POST /api/waste/requests
// @desc    Create new waste request
// @access  Private (Customer)
router.post('/requests', protect, authorize('customer'), validateWasteRequest, handleValidationErrors, createWasteRequest);

// @route   PUT /api/waste/requests/:id/status
// @desc    Update waste request status
// @access  Private
router.put('/requests/:id/status', protect, updateWasteRequestStatus);

// @route   GET /api/waste/requests/pending
// @desc    Get pending waste requests for collectors
// @access  Private (Collector)
router.get('/requests/pending', protect, authorize('collector'), getPendingRequests);

// @route   GET /api/waste/requests/assigned
// @desc    Get all assigned requests for collectors (pending + in-progress)
// @access  Private (Collector)
router.get('/requests/assigned', protect, authorize('collector'), getMyAssignedRequests);

// @route   PUT /api/waste/requests/:id/accept
// @desc    Accept a waste request
// @access  Private (Collector)
router.put('/requests/:id/accept', protect, authorize('collector'), acceptRequest);

// @route   PUT /api/waste/requests/:id/reject
// @desc    Reject a waste request and mark as cancelled
// @access  Private (Collector)
router.put('/requests/:id/reject', protect, authorize('collector'), rejectRequest);

// @route   PUT /api/waste/requests/:id/complete
// @desc    Complete a waste request
// @access  Private (Collector)
router.put('/requests/:id/complete', protect, authorize('collector'), completeRequest);

// @route   PUT /api/waste/location
// @desc    Update user location
// @access  Private
router.put('/location', protect, updateUserLocation);

module.exports = router;
