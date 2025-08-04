const User = require('../models/User');
const WasteRequest = require('../models/WasteRequest');

// Get nearby waste collectors based on user location
const getNearbyCollectors = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;
    const userId = req.user.id;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Simple distance calculation using Haversine formula
    const collectors = await User.getNearbyCollectors(
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(radius)
    );

    res.json({
      success: true,
      data: collectors,
      message: `Found ${collectors.length} collectors nearby`
    });
  } catch (error) {
    console.error('Get nearby collectors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby collectors'
    });
  }
};

// Get user's waste requests
const getUserWasteRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const wasteRequests = await WasteRequest.getByUserId(userId, status);

    res.json({
      success: true,
      data: wasteRequests,
      message: 'Waste requests retrieved successfully'
    });
  } catch (error) {
    console.error('Get user waste requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch waste requests'
    });
  }
};

// Create new waste request
const createWasteRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      collector_id,
      waste_type,
      quantity,
      pickup_address,
      pickup_date,
      pickup_time,
      special_instructions
    } = req.body;

    // Create waste request data
    const wasteRequestData = {
      customer_id: userId,
      collector_id: collector_id || null,
      waste_type,
      quantity: parseFloat(quantity),
      pickup_address,
      pickup_date,
      pickup_time,
      special_instructions: special_instructions || null,
      status: collector_id ? 'pending' : 'pending' // If collector specified, status is 'pending' for collector to accept/reject
    };

    const newWasteRequest = await WasteRequest.create(wasteRequestData);

    res.status(201).json({
      success: true,
      data: newWasteRequest,
      message: collector_id ? 'Booking request sent to collector successfully' : 'Waste pickup request created successfully'
    });
  } catch (error) {
    console.error('Create waste request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create waste request'
    });
  }
};

// Update waste request status (for collectors)
const updateWasteRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!['pending', 'assigned', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Only collectors can assign themselves to requests or update status
    if (userRole === 'collector' && status === 'assigned') {
      await WasteRequest.assignCollector(id, userId);
    }

    const updatedRequest = await WasteRequest.updateStatus(id, status, userId, userRole);

    if (!updatedRequest) {
      return res.status(404).json({
        success: false,
        message: 'Waste request not found or unauthorized'
      });
    }

    res.json({
      success: true,
      data: updatedRequest,
      message: 'Waste request updated successfully'
    });
  } catch (error) {
    console.error('Update waste request status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update waste request'
    });
  }
};

// Accept a waste request
const acceptRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const collectorId = req.user.id;

    // Check if request exists and is assigned to this collector
    const request = await WasteRequest.getById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.collector_id !== collectorId) {
      return res.status(403).json({
        success: false,
        message: 'Request is not assigned to you'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request cannot be accepted. Current status: ${request.status}`
      });
    }

    // Update status to in_progress
    const updatedRequest = await WasteRequest.updateRequestStatus(requestId, 'in_progress');

    res.json({
      success: true,
      data: updatedRequest,
      message: 'Request accepted successfully'
    });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept request'
    });
  }
};

// Reject a waste request
const rejectRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const collectorId = req.user.id;

    // Check if request exists and is assigned to this collector
    const request = await WasteRequest.getById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.collector_id !== collectorId) {
      return res.status(403).json({
        success: false,
        message: 'Request is not assigned to you'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request cannot be rejected. Current status: ${request.status}`
      });
    }

    // Update status to cancelled
    const updatedRequest = await WasteRequest.updateRequestStatus(requestId, 'cancelled');

    res.json({
      success: true,
      data: updatedRequest,
      message: 'Request rejected and cancelled successfully'
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject request'
    });
  }
};

// Complete a waste request
const completeRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const collectorId = req.user.id;

    // Check if request exists and is assigned to this collector
    const request = await WasteRequest.getById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.collector_id !== collectorId) {
      return res.status(403).json({
        success: false,
        message: 'Request is not assigned to you'
      });
    }

    if (request.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: `Request cannot be completed. Current status: ${request.status}`
      });
    }

    // Update status to completed
    const updatedRequest = await WasteRequest.updateRequestStatus(requestId, 'completed');

    res.json({
      success: true,
      data: updatedRequest,
      message: 'Request completed successfully'
    });
  } catch (error) {
    console.error('Complete request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete request'
    });
  }
};

// Get all pending waste requests (for collectors)
const getPendingRequests = async (req, res) => {
  try {
    const collectorId = req.user.id;

    // Get requests specifically assigned to this collector
    const assignedRequests = await WasteRequest.getPendingForCollector(collectorId);

    res.json({
      success: true,
      data: assignedRequests,
      count: assignedRequests.length,
      message: 'Pending requests retrieved successfully'
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending requests'
    });
  }
};

// Get all requests assigned to collector (pending + in-progress)
const getMyAssignedRequests = async (req, res) => {
  try {
    const collectorId = req.user.id;

    // Get all requests assigned to this collector (not just pending)
    const requests = await WasteRequest.getAssignedToCollector(collectorId);

    res.json({
      success: true,
      data: requests,
      count: requests.length,
      message: 'Assigned requests retrieved successfully'
    });
  } catch (error) {
    console.error('Get assigned requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned requests'
    });
  }
};

// Update user location
const updateUserLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude, address } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    await User.updateLocation(userId, latitude, longitude, address);

    res.json({
      success: true,
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Update user location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location'
    });
  }
};

module.exports = {
  getNearbyCollectors,
  getUserWasteRequests,
  createWasteRequest,
  updateWasteRequestStatus,
  acceptRequest,
  completeRequest,
  getPendingRequests,
  getMyAssignedRequests,
  updateUserLocation,
  rejectRequest
};
