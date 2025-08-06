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
    console.log('🔄 Creating waste request...');
    console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
    console.log('👤 User ID:', req.user?.id);
    
    const userId = req.user.id;
    const {
      collector_id,
      pickup_address,
      pickup_city,
      pickup_date,
      pickup_time,
      special_instructions,
      waste_items,  // Array of {waste_type, quantity}
      // Backward compatibility for old single waste type requests
      waste_type,
      quantity
    } = req.body;

    console.log('📋 Extracted data:');
    console.log('  - waste_items:', waste_items);
    console.log('  - waste_type:', waste_type);
    console.log('  - quantity:', quantity);

    // Prepare waste items array
    let wasteItemsArray = [];
    
    if (waste_items && Array.isArray(waste_items) && waste_items.length > 0) {
      // New multi-waste format
      wasteItemsArray = waste_items.map(item => ({
        waste_type: item.waste_type,
        quantity: parseFloat(item.quantity)
      }));
    } else if (waste_type && quantity) {
      // Backward compatibility for single waste type
      wasteItemsArray = [{
        waste_type,
        quantity: parseFloat(quantity)
      }];
    } else {
      console.log('❌ No valid waste data provided');
      return res.status(400).json({
        success: false,
        message: 'Please provide either waste_items array or waste_type and quantity'
      });
    }

    console.log('📦 Prepared waste items array:', wasteItemsArray);

    // Validate waste items
    if (wasteItemsArray.length === 0) {
      console.log('❌ Empty waste items array');
      return res.status(400).json({
        success: false,
        message: 'At least one waste item is required'
      });
    }

    console.log('✅ Waste items validation passed');

    // Create waste request data
    const wasteRequestData = {
      customer_id: userId,
      collector_id: collector_id || null,
      pickup_address,
      pickup_city,
      pickup_date,
      pickup_time,
      special_instructions: special_instructions || null,
      status: 'pending', // Always start as pending
      waste_items: wasteItemsArray
    };

    const newWasteRequest = await WasteRequest.create(wasteRequestData);

    const itemCount = wasteItemsArray.length;
    const totalQuantity = wasteItemsArray.reduce((sum, item) => sum + item.quantity, 0);

    res.status(201).json({
      success: true,
      data: newWasteRequest,
      message: collector_id 
        ? `Booking request sent to collector successfully for ${itemCount} waste type(s), total ${totalQuantity.toFixed(1)} kg` 
        : `Waste pickup request created successfully for ${itemCount} waste type(s), total ${totalQuantity.toFixed(1)} kg. Request ID: ${newWasteRequest.request_id}`
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

    // Update status to assigned (accepted)
    const updatedRequest = await WasteRequest.updateRequestStatus(requestId, 'assigned');

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

// Assign collector to request (for customers)
const assignCollectorToRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { collector_id } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Only customers can assign collectors to their own requests
    if (userRole !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only customers can assign collectors to requests'
      });
    }

    if (!collector_id) {
      return res.status(400).json({
        success: false,
        message: 'Collector ID is required'
      });
    }

    // Verify the request belongs to the customer
    const request = await WasteRequest.getById(id);
    if (!request || request.customer_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Request not found or unauthorized'
      });
    }

    // Verify the request is still pending (not yet assigned to any collector)
    if (request.status !== 'pending' || request.collector_id) {
      return res.status(400).json({
        success: false,
        message: 'Can only assign collectors to pending requests without collectors'
      });
    }

    // Assign the collector and update status
    await WasteRequest.assignCollector(id, collector_id);
    
    // Get the updated request to return
    const updatedRequest = await WasteRequest.getById(id);

    res.json({
      success: true,
      data: updatedRequest,
      message: 'Collector assigned successfully'
    });
  } catch (error) {
    console.error('Assign collector error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while assigning collector'
    });
  }
};

// Start collection (for collectors) - changes status from assigned to in_progress
const startCollection = async (req, res) => {
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

    if (request.status !== 'assigned') {
      return res.status(400).json({
        success: false,
        message: `Cannot start collection. Current status: ${request.status}`
      });
    }

    // Update status to in_progress
    const updatedRequest = await WasteRequest.updateRequestStatus(requestId, 'in_progress');

    res.json({
      success: true,
      data: updatedRequest,
      message: 'Collection started successfully'
    });
  } catch (error) {
    console.error('Start collection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start collection'
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
  rejectRequest,
  assignCollectorToRequest,
  startCollection
};
