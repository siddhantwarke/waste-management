// Utility functions for generating unique request IDs

/**
 * Generates a unique alphanumeric request ID
 * Format: WR-YYYYMMDD-XXXXX (e.g., WR-20250806-A4B2C)
 * WR = Waste Request prefix
 * YYYYMMDD = Current date
 * XXXXX = Random alphanumeric string
 */
function generateRequestId() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // Generate random alphanumeric string (5 characters)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomStr = '';
  for (let i = 0; i < 5; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `WR-${dateStr}-${randomStr}`;
}

/**
 * Generates a unique request ID that's guaranteed to be unique in the database
 * @param {Object} db - Database instance
 * @returns {String} Unique request ID
 */
async function generateUniqueRequestId(db) {
  let requestId;
  let attempts = 0;
  const maxAttempts = 10;
  
  do {
    requestId = generateRequestId();
    attempts++;
    
    if (attempts >= maxAttempts) {
      // Fallback: use timestamp if we can't generate unique ID
      const timestamp = Date.now().toString().slice(-6);
      requestId = `WR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${timestamp}`;
      break;
    }
    
    // Check if this ID already exists in database
    try {
      const stmt = db.prepare('SELECT id FROM waste_requests WHERE request_id = ?');
      stmt.bind([requestId]);
      const exists = stmt.step();
      stmt.free();
      
      if (!exists) {
        break; // ID is unique
      }
    } catch (error) {
      console.error('Error checking request ID uniqueness:', error);
      // Continue with the generated ID anyway
      break;
    }
  } while (attempts < maxAttempts);
  
  return requestId;
}

module.exports = {
  generateRequestId,
  generateUniqueRequestId
};
