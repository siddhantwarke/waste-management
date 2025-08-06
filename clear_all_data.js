const database = require('./backend/config/database');

async function clearAllData() {
  try {
    console.log('Connecting to database...');
    const db = await database.getDb();
    
    if (!db) {
      throw new Error('Database not initialized');
    }

    console.log('Clearing all data from tables...');

    // Clear waste_requests table
    console.log('Clearing waste_requests table...');
    const clearWasteRequests = db.prepare('DELETE FROM waste_requests');
    const wasteRequestsResult = clearWasteRequests.run();
    clearWasteRequests.free();
    console.log(`Deleted ${wasteRequestsResult.changes} records from waste_requests table`);

    // Clear users table
    console.log('Clearing users table...');
    const clearUsers = db.prepare('DELETE FROM users');
    const usersResult = clearUsers.run();
    clearUsers.free();
    console.log(`Deleted ${usersResult.changes} records from users table`);

    // Reset auto-increment counters
    console.log('Resetting auto-increment counters...');
    const resetWasteRequestsSeq = db.prepare('DELETE FROM sqlite_sequence WHERE name = ?');
    resetWasteRequestsSeq.run(['waste_requests']);
    resetWasteRequestsSeq.free();

    const resetUsersSeq = db.prepare('DELETE FROM sqlite_sequence WHERE name = ?');
    resetUsersSeq.run(['users']);
    resetUsersSeq.free();

    // Save database
    database.saveDatabase();
    
    console.log('✅ All data cleared successfully!');
    console.log('Database has been reset to empty state.');
    
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  } finally {
    // Close database connection
    database.close();
    process.exit(0);
  }
}

// Run the clear function
clearAllData();
