const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const dbPath = path.join(__dirname, '..', 'database', 'waste_management.db');

class DatabaseManager {
  constructor() {
    this.db = null;
    this.initialized = false;
    this.initPromise = this.init();
  }

  async init() {
    try {
      const SQL = await initSqlJs();
      
      // Check if database file exists
      if (fs.existsSync(dbPath)) {
        const filebuffer = fs.readFileSync(dbPath);
        this.db = new SQL.Database(filebuffer);
        console.log('Loaded existing SQLite database');
      } else {
        this.db = new SQL.Database();
        console.log('Created new SQLite database');
      }
      
      this.initializeTables();
      this.initialized = true;
      console.log('Database initialization complete');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  async waitForInit() {
    if (!this.initialized) {
      await this.initPromise;
    }
    return this.db;
  }

  initializeTables() {
    if (!this.db) return;

    // Users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'collector')),
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1
      )
    `;

    // Waste collection requests table
    const createWasteRequestsTable = `
      CREATE TABLE IF NOT EXISTS waste_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        collector_id INTEGER,
        waste_type VARCHAR(50) NOT NULL,
        quantity DECIMAL(10,2),
        pickup_address TEXT NOT NULL,
        pickup_date DATE,
        pickup_time TIME,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
        special_instructions TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES users(id),
        FOREIGN KEY (collector_id) REFERENCES users(id)
      )
    `;

    try {
      this.db.run(createUsersTable);
      console.log('Users table ready');
      
      this.db.run(createWasteRequestsTable);
      console.log('Waste requests table ready');
      
      this.saveDatabase();
    } catch (error) {
      console.error('Error creating tables:', error.message);
    }
  }

  async getDb() {
    await this.waitForInit();
    return this.db;
  }

  saveDatabase() {
    if (!this.db) return;
    
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      
      // Ensure directory exists
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(dbPath, buffer);
    } catch (error) {
      console.error('Error saving database:', error);
    }
  }

  close() {
    if (this.db) {
      this.saveDatabase();
      this.db.close();
      console.log('Database connection closed');
    }
  }
}

module.exports = new DatabaseManager();
