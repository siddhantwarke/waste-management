const database = require('../config/database');

class User {
  static async create(userData) {
    const { 
      username, email, password, role, first_name, last_name, phone, address, 
      country, state, city, collector_group_name, e_waste_price, 
      plastic_price, organic_price, paper_price, metal_price, glass_price,
      hazardous_price, mixed_price 
    } = userData;
    
    const query = `
      INSERT INTO users (
        username, email, password, role, first_name, last_name, phone, address, 
        country, state, city, collector_group_name, e_waste_price,
        plastic_price, organic_price, paper_price, metal_price, glass_price,
        hazardous_price, mixed_price
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    try {
      const db = await database.getDb();
      if (!db) throw new Error('Database not initialized');
      
      const stmt = db.prepare(query);
      stmt.run([
        username, email, password, role, first_name, last_name, phone, address,
        country, state, city, 
        // Handle undefined values for collector fields
        collector_group_name || null,
        e_waste_price || null,
        plastic_price || null,
        organic_price || null,
        paper_price || null,
        metal_price || null,
        glass_price || null,
        hazardous_price || null,
        mixed_price || null
      ]);
      stmt.free();
      
      // Get the last inserted row ID
      const lastIdStmt = db.prepare("SELECT last_insert_rowid() as id");
      lastIdStmt.step();
      const lastId = lastIdStmt.getAsObject().id;
      lastIdStmt.free();
      
      // Save database after insert
      database.saveDatabase();
      
      return { id: lastId, ...userData };
    } catch (error) {
      console.error('User.create error:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ? AND is_active = 1';
    
    try {
      const db = await database.getDb();
      if (!db) throw new Error('Database not initialized');
      
      const stmt = db.prepare(query);
      stmt.bind([email]);
      
      if (stmt.step()) {
        const result = stmt.getAsObject();
        stmt.free();
        return result;
      } else {
        stmt.free();
        return null;
      }
    } catch (error) {
      console.error('User.findByEmail error:', error);
      throw error;
    }
  }

  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = ? AND is_active = 1';
    
    try {
      const db = await database.getDb();
      if (!db) throw new Error('Database not initialized');
      
      const stmt = db.prepare(query);
      stmt.bind([username]);
      
      if (stmt.step()) {
        const result = stmt.getAsObject();
        stmt.free();
        return result;
      } else {
        stmt.free();
        return null;
      }
    } catch (error) {
      console.error('User.findByUsername error:', error);
      throw error;
    }
  }

  static async findById(id) {
    const query = `
      SELECT id, username, email, role, first_name, last_name, phone, address, 
             country, state, city, collector_group_name, e_waste_price, 
             plastic_price, organic_price, paper_price, metal_price, glass_price,
             hazardous_price, mixed_price, created_at 
      FROM users 
      WHERE id = ? AND is_active = 1
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
      console.error('User.findById error:', error);
      throw error;
    }
  }

  static async updateLastLogin(id) {
    const query = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    
    try {
      const db = await database.getDb();
      if (!db) throw new Error('Database not initialized');
      
      const stmt = db.prepare(query);
      stmt.run([id]);
      stmt.free();
      database.saveDatabase();
      
      return { changes: 1 };
    } catch (error) {
      console.error('User.updateLastLogin error:', error);
      throw error;
    }
  }

  static async getAllByRole(role) {
    const query = 'SELECT id, username, email, first_name, last_name, phone, city, created_at FROM users WHERE role = ? AND is_active = 1';
    
    try {
      const db = await database.getDb();
      if (!db) throw new Error('Database not initialized');
      
      const stmt = db.prepare(query);
      stmt.bind([role]);
      
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      
      return results;
    } catch (error) {
      console.error('User.getAllByRole error:', error);
      throw error;
    }
  }

  static async getNearbyCollectors(latitude, longitude, radius = 10) {
    // First, let's try a simpler query to see if there are any collectors at all
    const simpleQuery = `
      SELECT id, username, first_name, last_name, phone, address, 
             latitude, longitude, service_radius, is_available
      FROM users 
      WHERE role = 'collector' 
        AND is_active = 1
      LIMIT 20
    `;
    
    try {
      const db = await database.getDb();
      if (!db) throw new Error('Database not initialized');
      
      // First check if there are any collectors at all
      const simpleStmt = db.prepare(simpleQuery);
      const allCollectors = [];
      while (simpleStmt.step()) {
        allCollectors.push(simpleStmt.getAsObject());
      }
      simpleStmt.free();
      
      // If no collectors have location data, return the collectors without distance calculation
      const collectorsWithLocation = allCollectors.filter(c => c.latitude && c.longitude);
      
      if (collectorsWithLocation.length === 0) {
        return allCollectors.map(collector => ({
          ...collector,
          distance: null
        }));
      }
      
      // If we have collectors with location, calculate distances
      const distanceQuery = `
        SELECT id, username, first_name, last_name, phone, address, 
               latitude, longitude, service_radius, is_available,
               (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
                cos(radians(longitude) - radians(?)) + 
                sin(radians(?)) * sin(radians(latitude)))) as distance
        FROM users 
        WHERE role = 'collector' 
          AND is_active = 1 
          AND latitude IS NOT NULL 
          AND longitude IS NOT NULL
        HAVING distance <= ?
        ORDER BY distance ASC
        LIMIT 20
      `;
      
      const stmt = db.prepare(distanceQuery);
      stmt.bind([latitude, longitude, latitude, radius]);
      
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      
      return results;
      
    } catch (error) {
      console.error('User.getNearbyCollectors error:', error);
      throw error;
    }
  }

  static async updateProfile(userId, profileData) {
    const { 
      first_name, last_name, phone, address, country, state, city,
      collector_group_name, e_waste_price, plastic_price, organic_price,
      paper_price, metal_price, glass_price, hazardous_price, mixed_price
    } = profileData;
    
    const query = `
      UPDATE users 
      SET first_name = ?, last_name = ?, phone = ?, address = ?, country = ?, state = ?, city = ?,
          collector_group_name = ?, e_waste_price = ?, plastic_price = ?, organic_price = ?,
          paper_price = ?, metal_price = ?, glass_price = ?, hazardous_price = ?, mixed_price = ?,
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND is_active = 1
    `;
    
    try {
      const db = await database.getDb();
      if (!db) throw new Error('Database not initialized');
      
      // Update the user
      const stmt = db.prepare(query);
      stmt.run([
        first_name, last_name, phone, address, country, state, city,
        // Handle undefined values for collector fields
        collector_group_name || null,
        e_waste_price || null,
        plastic_price || null, 
        organic_price || null,
        paper_price || null,
        metal_price || null,
        glass_price || null,
        hazardous_price || null,
        mixed_price || null,
        userId
      ]);
      stmt.free();
      database.saveDatabase();
      
      // Return updated user data
      return await this.findById(userId);
    } catch (error) {
      console.error('User.updateProfile error:', error);
      throw error;
    }
  }

  static async updateLocation(userId, latitude, longitude, address = null) {
    const query = 'UPDATE users SET latitude = ?, longitude = ?, address = COALESCE(?, address), updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    
    try {
      const db = await database.getDb();
      if (!db) throw new Error('Database not initialized');
      
      const stmt = db.prepare(query);
      stmt.run([latitude, longitude, address, userId]);
      stmt.free();
      database.saveDatabase();
      
      return { changes: 1 };
    } catch (error) {
      console.error('User.updateLocation error:', error);
      throw error;
    }
  }

  static async updateAvailability(userId, isAvailable) {
    const query = 'UPDATE users SET is_available = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND role = ?';
    
    try {
      const db = await database.getDb();
      if (!db) throw new Error('Database not initialized');
      
      const stmt = db.prepare(query);
      stmt.run([isAvailable ? 1 : 0, userId, 'collector']);
      stmt.free();
      database.saveDatabase();
      
      return { changes: 1 };
    } catch (error) {
      console.error('User.updateAvailability error:', error);
      throw error;
    }
  }

  static async findCollectorsByCity(city) {
    const query = `
      SELECT id, username, first_name, last_name, phone, address, country, state, city,
             collector_group_name, e_waste_price, plastic_price, organic_price,
             paper_price, metal_price, glass_price, hazardous_price, mixed_price
      FROM users 
      WHERE role = 'collector' AND city = ? COLLATE NOCASE AND is_active = 1
      ORDER BY first_name, last_name
    `;
    
    try {
      const db = await database.getDb();
      if (!db) throw new Error('Database not initialized');
      
      const stmt = db.prepare(query);
      stmt.bind([city]);
      
      const collectors = [];
      while (stmt.step()) {
        collectors.push(stmt.getAsObject());
      }
      stmt.free();
      
      return collectors;
    } catch (error) {
      console.error('User.findCollectorsByCity error:', error);
      throw error;
    }
  }
}

module.exports = User;
