const database = require('./backend/config/database');

async function checkAndClearData() {
  try {
    console.log('Connecting to database...');
    const db = await database.getDb();
    
    if (!db) {
      throw new Error('Database not initialized');
    }

    // Check current data first
    console.log('\n=== CHECKING CURRENT DATA ===');
    
    // Check users table
    const checkUsers = db.prepare('SELECT COUNT(*) as count FROM users');
    checkUsers.step();
    const userCount = checkUsers.getAsObject().count;
    checkUsers.free();
    console.log(`Users table: ${userCount} records`);

    // Check waste_requests table
    const checkRequests = db.prepare('SELECT COUNT(*) as count FROM waste_requests');
    checkRequests.step();
    const requestCount = checkRequests.getAsObject().count;
    checkRequests.free();
    console.log(`Waste requests table: ${requestCount} records`);

    if (userCount === 0 && requestCount === 0) {
      console.log('✅ Database is already empty!');
      return;
    }

    console.log('\n=== CLEARING ALL DATA ===');

    // Force clear with VACUUM
    console.log('Force clearing waste_requests...');
    const clearRequests = db.prepare('DELETE FROM waste_requests');
    clearRequests.run();
    clearRequests.free();

    console.log('Force clearing users...');
    const clearUsers = db.prepare('DELETE FROM users');
    clearUsers.run();
    clearUsers.free();

    // Reset sequences
    console.log('Resetting sequences...');
    const resetSeq1 = db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('users', 'waste_requests')");
    resetSeq1.run();
    resetSeq1.free();

    // VACUUM to clean up
    console.log('Performing VACUUM...');
    db.exec('VACUUM');

    // Force save
    database.saveDatabase();

    // Verify clearing
    console.log('\n=== VERIFICATION ===');
    
    const verifyUsers = db.prepare('SELECT COUNT(*) as count FROM users');
    verifyUsers.step();
    const newUserCount = verifyUsers.getAsObject().count;
    verifyUsers.free();
    
    const verifyRequests = db.prepare('SELECT COUNT(*) as count FROM waste_requests');
    verifyRequests.step();
    const newRequestCount = verifyRequests.getAsObject().count;
    verifyRequests.free();

    console.log(`Users table: ${newUserCount} records (should be 0)`);
    console.log(`Waste requests table: ${newRequestCount} records (should be 0)`);

    if (newUserCount === 0 && newRequestCount === 0) {
      console.log('✅ Database successfully cleared!');
    } else {
      console.log('❌ Some data still remains');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    database.close();
    process.exit(0);
  }
}

checkAndClearData();
