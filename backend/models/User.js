const database = require('../config/database');

class User {
  static async create(userData) {
    const { username, email, password, role, first_name, last_name, phone, address } = userData;
    
    const query = `
      INSERT INTO users (username, email, password, role, first_name, last_name, phone, address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    try {
      const db = await database.getDb();
      if (!db) throw new Error('Database not initialized');
      
      const stmt = db.prepare(query);
      stmt.run([username, email, password, role, first_name, last_name, phone, address]);
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
    const query = 'SELECT id, username, email, role, first_name, last_name, phone, address, created_at FROM users WHERE id = ? AND is_active = 1';
    
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
    const query = 'SELECT id, username, email, first_name, last_name, phone, created_at FROM users WHERE role = ? AND is_active = 1';
    
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
}

module.exports = User;
