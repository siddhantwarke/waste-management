const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const dbPath = path.join(__dirname, 'backend', 'database', 'waste_management.db');

async function clearDatabase() {
  console.log('🗑️ Clearing all data from database tables...');
  console.log('='.repeat(50));

  try {
    // Check if database file exists
    if (!fs.existsSync(dbPath)) {
      console.log('❌ Database file not found at:', dbPath);
      return;
    }

    // Load the database
    const SQL = await initSqlJs();
    const filebuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(filebuffer);

    console.log('📊 Checking current data count...');
    
    // Get current record counts
    const tables = ['users', 'waste_requests'];
    const currentCounts = {};
    
    for (const table of tables) {
      try {
        const result = db.exec(`SELECT COUNT(*) as count FROM ${table}`);
        currentCounts[table] = result[0] ? result[0].values[0][0] : 0;
        console.log(`  - ${table}: ${currentCounts[table]} records`);
      } catch (error) {
        console.log(`  - ${table}: Table doesn't exist or error occurred`);
        currentCounts[table] = 0;
      }
    }

    const totalRecords = Object.values(currentCounts).reduce((sum, count) => sum + count, 0);
    
    if (totalRecords === 0) {
      console.log('✅ Database is already empty!');
      return;
    }

    console.log(`\n🧹 Deleting ${totalRecords} total records...`);

    // Delete all data from tables (in order to handle foreign key constraints)
    const deleteQueries = [
      'DELETE FROM waste_requests',
      'DELETE FROM users'
    ];

    for (const query of deleteQueries) {
      try {
        db.run(query);
        const tableName = query.split(' ')[2];
        console.log(`✅ Cleared data from ${tableName} table`);
      } catch (error) {
        console.log(`❌ Error clearing ${query}:`, error.message);
      }
    }

    // Reset AUTO_INCREMENT counters
    console.log('\n🔄 Resetting AUTO_INCREMENT counters...');
    const resetQueries = [
      'DELETE FROM sqlite_sequence WHERE name="users"',
      'DELETE FROM sqlite_sequence WHERE name="waste_requests"'
    ];

    for (const query of resetQueries) {
      try {
        db.run(query);
        const tableName = query.split('"')[1];
        console.log(`✅ Reset counter for ${tableName} table`);
      } catch (error) {
        console.log(`⚠️ Note: ${error.message}`);
      }
    }

    // Save the database
    const data = db.export();
    fs.writeFileSync(dbPath, data);
    db.close();

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Database cleared successfully!');
    console.log('📊 Final verification...');

    // Verify deletion
    const SQL2 = await initSqlJs();
    const filebuffer2 = fs.readFileSync(dbPath);
    const db2 = new SQL.Database(filebuffer2);

    for (const table of tables) {
      try {
        const result = db2.exec(`SELECT COUNT(*) as count FROM ${table}`);
        const count = result[0] ? result[0].values[0][0] : 0;
        console.log(`  - ${table}: ${count} records remaining`);
      } catch (error) {
        console.log(`  - ${table}: Table status unknown`);
      }
    }

    db2.close();
    console.log('✅ All data successfully deleted!');

  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
}

// Run the cleanup
clearDatabase();
