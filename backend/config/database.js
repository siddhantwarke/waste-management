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
        country VARCHAR(100),
        state VARCHAR(100),
        city VARCHAR(100),
        collector_group_name VARCHAR(100),
        e_waste_price DECIMAL(10,2),
        plastic_price DECIMAL(10,2),
        paper_price DECIMAL(10,2),
        metal_price DECIMAL(10,2),
        glass_price DECIMAL(10,2),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        service_radius DECIMAL(5,2) DEFAULT 10.0,
        is_available BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1
      )
    `;

    // Waste collection requests table (main request)
    const createWasteRequestsTable = `
      CREATE TABLE IF NOT EXISTS waste_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id VARCHAR(50) UNIQUE NOT NULL,
        customer_id INTEGER NOT NULL,
        collector_id INTEGER,
        pickup_address TEXT NOT NULL,
        pickup_city VARCHAR(100) NOT NULL,
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

    // Waste request items table (multiple waste types per request)
    const createWasteRequestItemsTable = `
      CREATE TABLE IF NOT EXISTS waste_request_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id INTEGER NOT NULL,
        waste_type VARCHAR(50) NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (request_id) REFERENCES waste_requests(id) ON DELETE CASCADE
      )
    `;

    try {
      this.db.run(createUsersTable);
      console.log('Users table ready');
      
      this.db.run(createWasteRequestsTable);
      console.log('Waste requests table ready');
      
      this.db.run(createWasteRequestItemsTable);
      console.log('Waste request items table ready');
      
      // Add new columns to existing users table if they don't exist
      this.addLocationColumns();
      
      this.saveDatabase();
    } catch (error) {
      console.error('Error creating tables:', error.message);
    }
  }

  addLocationColumns() {
    try {
      // Check if columns exist and add them if they don't
      const alterQueries = [
        'ALTER TABLE users ADD COLUMN country VARCHAR(100)',
        'ALTER TABLE users ADD COLUMN state VARCHAR(100)', 
        'ALTER TABLE users ADD COLUMN city VARCHAR(100)',
        'ALTER TABLE users ADD COLUMN collector_group_name VARCHAR(100)',
        // New waste type price columns
        'ALTER TABLE users ADD COLUMN e_waste_price DECIMAL(10,2)',
        'ALTER TABLE users ADD COLUMN plastic_price DECIMAL(10,2)',
        'ALTER TABLE users ADD COLUMN paper_price DECIMAL(10,2)',
        'ALTER TABLE users ADD COLUMN metal_price DECIMAL(10,2)',
        'ALTER TABLE users ADD COLUMN glass_price DECIMAL(10,2)'
      ];

      const columnNames = [
        'country', 'state', 'city', 'collector_group_name',
        'e_waste_price', 'plastic_price', 'paper_price',
        'metal_price', 'glass_price'
      ];

      alterQueries.forEach((query, index) => {
        try {
          this.db.run(query);
          console.log(`Added ${columnNames[index]} column to users table`);
        } catch (error) {
          // Column might already exist, ignore the error
          if (!error.message.includes('duplicate column name')) {
            console.error(`Error adding ${columnNames[index]} column:`, error.message);
          }
        }
      });
    } catch (error) {
      console.error('Error adding location columns:', error);
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
