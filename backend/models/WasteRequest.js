const database = require('../config/database');
const { generateUniqueRequestId } = require('../utils/requestIdGenerator');

class WasteRequest {
  static async create(wasteRequestData) {
    const {
      customer_id,
      collector_id,
      pickup_address,
      pickup_city,
      pickup_date,
      pickup_time,
      special_instructions,
      status,
      waste_items // Array of {waste_type, quantity}
    } = wasteRequestData;
    
    try {
      const db = await database.getDb();
      if (!db) throw new Error('Database not initialized');
      
      // Generate unique request ID
      const request_id = await generateUniqueRequestId(db);
      
      // Insert main request
      const requestQuery = `
        INSERT INTO waste_requests 
        (request_id, customer_id, collector_id, pickup_address, pickup_city, pickup_date, pickup_time, special_instructions, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const requestStmt = db.prepare(requestQuery);
      requestStmt.run([
        request_id,
        customer_id,
        collector_id || null,
        pickup_address,
        pickup_city,
        pickup_date,
        pickup_time,
        special_instructions,
        status || 'pending'
      ]);
      requestStmt.free();
      
      // Get the last inserted row ID
      const lastIdStmt = db.prepare("SELECT last_insert_rowid() as id");
      lastIdStmt.step();
      const lastId = lastIdStmt.getAsObject().id;
      lastIdStmt.free();
      
      // Insert waste items
      if (waste_items && waste_items.length > 0) {
        const itemQuery = `
          INSERT INTO waste_request_items (request_id, waste_type, quantity)
          VALUES (?, ?, ?)
        `;
        
        const itemStmt = db.prepare(itemQuery);
        for (const item of waste_items) {
          itemStmt.run([lastId, item.waste_type, item.quantity]);
        }
        itemStmt.free();
      }
      
      // Save database after insert
      database.saveDatabase();
      
      return { 
        id: lastId, 
        request_id,
        ...wasteRequestData,
        waste_items
      };
    } catch (error) {
      console.error('WasteRequest.create error:', error);
      throw error;
    }
  }

  static async getByUserId(userId, status = null) {
    let query = `
      SELECT wr.*, 
             u.first_name as collector_first_name,
             u.last_name as collector_last_name,
             u.phone as collector_phone
      FROM waste_requests wr
      LEFT JOIN users u ON wr.collector_id = u.id
      WHERE wr.customer_id = ?
    `;
    
    const params = [userId];
    
    if (status) {
      query += ' AND wr.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY wr.created_at DESC';
    
    console.log('WasteRequest.getByUserId query:', query);
    console.log('WasteRequest.getByUserId params:', params);
    
    try {
      const db = await database.getDb();
      if (!db) throw new Error('Database not initialized');
      
      const stmt = db.prepare(query);
      stmt.bind(params);
      
      const results = [];
      let stepCount = 0;
      while (stmt.step()) {
        stepCount++;
        const row = stmt.getAsObject();
        
        // Get waste items for this request
        const itemsQuery = `
          SELECT waste_type, quantity 
          FROM waste_request_items 
          WHERE request_id = ?
        `;
        const itemsStmt = db.prepare(itemsQuery);
        itemsStmt.bind([row.id]);
        
        const wasteItems = [];
        while (itemsStmt.step()) {
          wasteItems.push(itemsStmt.getAsObject());
        }
        itemsStmt.free();
        
        // Add waste items to the row
        row.waste_items = wasteItems;
        
        // For backward compatibility, set waste_type and quantity from first item
        if (wasteItems.length > 0) {
          row.waste_type = wasteItems[0].waste_type;
          row.quantity = wasteItems[0].quantity;
        }
        
        console.log(`Row ${stepCount}:`, row);
        results.push(row);
      }
      stmt.free();
      
      console.log(`Total rows processed: ${stepCount}, Results length: ${results.length}`);
      
      return results;
    } catch (error) {
      console.error('WasteRequest.getByUserId error:', error);
      throw error;
    }
  }

  static async getPending() {
    const query = `
      SELECT wr.*, 
             u.first_name as customer_first_name,
             u.last_name as customer_last_name,
             u.phone as customer_phone,
             u.email as customer_email
      FROM waste_requests wr
      JOIN users u ON wr.customer_id = u.id
      WHERE wr.status = 'pending' AND (wr.collector_id IS NULL OR wr.collector_id = '')
      ORDER BY wr.created_at ASC
    `;
    
    try {
      const db = await database.getDb();
      if (!db) throw new Error('Database not initialized');
      
      const stmt = db.prepare(query);
      
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      
      return results;
    } catch (error) {
      console.error('WasteRequest.getPending error:', error);
      throw error;
    }
  }

  static async getPendingForCollector(collectorId) {
    const query = `
      SELECT wr.*, 
             c.username as customer_username, c.first_name as customer_first_name, 
             c.last_name as customer_last_name, c.phone as customer_phone,
             c.email as customer_email
      FROM waste_requests wr
      LEFT JOIN users c ON wr.customer_id = c.id
      WHERE wr.collector_id = ? AND wr.status = 'pending'
      ORDER BY wr.created_at DESC
    `;
    
    try {
      const db = await database.getDb();
      if (!db) throw new Error('Database not initialized');
      
      console.log('getPendingForCollector - Looking for collector_id:', collectorId);
      
      const stmt = db.prepare(query);
      stmt.bind([collectorId]);
      
      const results = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        console.log('Found request:', { id: row.id, collector_id: row.collector_id, status: row.status });
        
        // Get waste items for this request
        const itemsQuery = `
          SELECT waste_type, quantity 
          FROM waste_request_items 
          WHERE request_id = ?
        `;
        const itemsStmt = db.prepare(itemsQuery);
        itemsStmt.bind([row.id]);
        
        const wasteItems = [];
        while (itemsStmt.step()) {
          wasteItems.push(itemsStmt.getAsObject());
        }
        itemsStmt.free();
        
        // Add waste items to the row
        row.waste_items = wasteItems;
        
        // For backward compatibility, set waste_type and quantity from first item
        if (wasteItems.length > 0) {
          row.waste_type = wasteItems[0].waste_type;
          row.quantity = wasteItems[0].quantity;
        }
        
        results.push(row);
      }
      stmt.free();
      
      console.log(`getPendingForCollector - Returning ${results.length} results for collector ${collectorId}`);
      return results;
    } catch (error) {
      console.error('WasteRequest.getPendingForCollector error:', error);
      throw error;
    }
  }

  static async getPendingNearLocation(latitude, longitude, radius) {
    const query = `
      SELECT wr.*, 
             u.first_name as customer_first_name,
             u.last_name as customer_last_name,
             u.phone as customer_phone,
             u.latitude as customer_latitude,
             u.longitude as customer_longitude,
             (6371 * acos(cos(radians(?)) * cos(radians(u.latitude)) * 
              cos(radians(u.longitude) - radians(?)) + 
              sin(radians(?)) * sin(radians(u.latitude)))) as distance
      FROM waste_requests wr
      JOIN users u ON wr.customer_id = u.id
      WHERE wr.status = 'pending'
        AND u.latitude IS NOT NULL 
        AND u.longitude IS NOT NULL
      HAVING distance <= ?
      ORDER BY distance ASC, wr.created_at ASC
    `;
    
    try {
      const db = await database.getDb();
      if (!db) throw new Error('Database not initialized');
      
      const stmt = db.prepare(query);
      stmt.bind([latitude, longitude, latitude, radius]);
      
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      
      return results;
    } catch (error) {
      console.error('WasteRequest.getPendingNearLocation error:', error);
      throw error;
    }
  }

  static async assignCollector(requestId, collectorId) {
    const query = 'UPDATE waste_requests SET collector_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = ? AND collector_id IS NULL';
    
    try {
      const db = await database.getDb();
      if (!db) throw new Error('Database not initialized');
      
      const stmt = db.prepare(query);
      const changes = stmt.run([collectorId, requestId, 'pending']);
      stmt.free();
      
      database.saveDatabase();
      
      return changes;
    } catch (error) {
      console.error('WasteRequest.assignCollector error:', error);
      throw error;
    }
  }

  // Simple status update method for accept/complete actions
  static async updateRequestStatus(requestId, status) {
    const query = 'UPDATE waste_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    
    try {
      const db = await database.getDb();
      if (!db) throw new Error('Database not initialized');
      
      const stmt = db.prepare(query);
      const changes = stmt.run([status, requestId]);
      stmt.free();
      
      database.saveDatabase();
      
      if (changes.changes === 0) {
        return null;
      }
      
      // Return updated request
      return await this.getById(requestId);
    } catch (error) {
      console.error('WasteRequest.updateRequestStatus error:', error);
      throw error;
    }
  }

  static async getById(id) {
    const query = `
      SELECT wr.*, 
             c.first_name as customer_first_name,
             c.last_name as customer_last_name,
             c.phone as customer_phone,
             col.first_name as collector_first_name,
             col.last_name as collector_last_name,
             col.phone as collector_phone
      FROM waste_requests wr
      JOIN users c ON wr.customer_id = c.id
      LEFT JOIN users col ON wr.collector_id = col.id
      WHERE wr.id = ?
    `;
    
    try {
      const db = await database.getDb();
      if (!db) throw new Error('Database not initialized');
      
      const stmt = db.prepare(query);
      stmt.bind([id]);
      
      if (stmt.step()) {
        const result = stmt.getAsObject();
        stmt.free();
        return result;
      } else {
        stmt.free();
        return null;
      }
    } catch (error) {
      console.error('WasteRequest.getById error:', error);
      throw error;
    }
  }

  static async getCollectorRequests(collectorId, status = null) {
    let query = `
      SELECT wr.*, 
             u.first_name as customer_first_name,
             u.last_name as customer_last_name,
             u.phone as customer_phone,
             u.address as customer_address
      FROM waste_requests wr
      JOIN users u ON wr.customer_id = u.id
      WHERE wr.collector_id = ?
    `;
    
    const params = [collectorId];
    
    if (status) {
      query += ' AND wr.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY wr.created_at DESC';
    
    try {
      const db = await database.getDb();
      if (!db) throw new Error('Database not initialized');
      
      const stmt = db.prepare(query);
      stmt.bind(params);
      
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      
      return results;
    } catch (error) {
      console.error('WasteRequest.getCollectorRequests error:', error);
      throw error;
    }
  }

  // Get all requests assigned to a collector (all statuses)
  static async getAssignedToCollector(collectorId) {
    const query = `
      SELECT wr.*, 
             c.username as customer_username, c.first_name as customer_first_name, 
             c.last_name as customer_last_name, c.phone as customer_phone,
             c.email as customer_email
      FROM waste_requests wr
      LEFT JOIN users c ON wr.customer_id = c.id
      WHERE wr.collector_id = ?
      ORDER BY 
        CASE 
          WHEN wr.status = 'pending' THEN 1
          WHEN wr.status = 'in_progress' THEN 2
          WHEN wr.status = 'completed' THEN 3
          ELSE 4
        END,
        wr.created_at DESC
    `;
    
    try {
      const db = await database.getDb();
      if (!db) throw new Error('Database not initialized');
      
      const stmt = db.prepare(query);
      stmt.bind([collectorId]);
      
      const results = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        
        // Get waste items for this request
        const itemsQuery = `
          SELECT waste_type, quantity 
          FROM waste_request_items 
          WHERE request_id = ?
        `;
        const itemsStmt = db.prepare(itemsQuery);
        itemsStmt.bind([row.id]);
        
        const wasteItems = [];
        while (itemsStmt.step()) {
          wasteItems.push(itemsStmt.getAsObject());
        }
        itemsStmt.free();
        
        // Add waste items to the row
        row.waste_items = wasteItems;
        
        // For backward compatibility, set waste_type and quantity from first item
        if (wasteItems.length > 0) {
          row.waste_type = wasteItems[0].waste_type;
          row.quantity = wasteItems[0].quantity;
        }
        
        results.push(row);
      }
      stmt.free();
      
      return results;
    } catch (error) {
      console.error('WasteRequest.getAssignedToCollector error:', error);
      throw error;
    }
  }
}

module.exports = WasteRequest;
