const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const dbPath = path.join(__dirname, 'database', 'waste_management.db');

async function forceClearDatabase() {
  console.log('🗑️ FORCE CLEARING DATABASE - Ensuring all data is deleted');
  console.log('='.repeat(60));

  try {
    // Check if database file exists
    if (!fs.existsSync(dbPath)) {
      console.log('❌ Database file not found at:', dbPath);
      return;
    }

    console.log('📍 Database location:', dbPath);

    // Load the database
    const SQL = await initSqlJs();
    const filebuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(filebuffer);

    console.log('\n📊 CURRENT DATABASE STATE:');
    
    // Get current record counts with detailed info
    const tables = ['users', 'waste_requests'];
    const currentCounts = {};
    
    for (const table of tables) {
      try {
        const countResult = db.exec(`SELECT COUNT(*) as count FROM ${table}`);
        const count = countResult[0] ? countResult[0].values[0][0] : 0;
        currentCounts[table] = count;
        console.log(`  - ${table}: ${count} records`);
        
        // Show some sample data if exists
        if (count > 0) {
          const sampleResult = db.exec(`SELECT * FROM ${table} LIMIT 3`);
          if (sampleResult[0] && sampleResult[0].values.length > 0) {
            console.log(`    Sample data preview:`);
            sampleResult[0].values.forEach((row, index) => {
              console.log(`      Row ${index + 1}:`, row.slice(0, 3)); // Show first 3 columns
            });
          }
        }
      } catch (error) {
        console.log(`  - ${table}: Error checking - ${error.message}`);
        currentCounts[table] = 0;
      }
    }

    const totalRecords = Object.values(currentCounts).reduce((sum, count) => sum + count, 0);
    
    if (totalRecords === 0) {
      console.log('✅ Database is already empty!');
      db.close();
      return;
    }

    console.log(`\n🧹 FORCE DELETING ${totalRecords} total records...`);

    // Disable foreign key constraints temporarily
    db.run('PRAGMA foreign_keys = OFF');
    console.log('🔓 Disabled foreign key constraints');

    // Force delete all data from tables
    const deleteQueries = [
      'DELETE FROM waste_requests',
      'DELETE FROM users'
    ];

    for (const query of deleteQueries) {
      try {
        const result = db.run(query);
        const tableName = query.split(' ')[2];
        console.log(`✅ FORCE CLEARED all data from ${tableName} table`);
      } catch (error) {
        console.log(`❌ Error clearing ${query}:`, error.message);
      }
    }

    // Reset AUTO_INCREMENT counters forcefully
    console.log('\n🔄 FORCE RESETTING AUTO_INCREMENT counters...');
    try {
      db.run('DELETE FROM sqlite_sequence');
      console.log('✅ FORCE RESET all AUTO_INCREMENT counters');
    } catch (error) {
      console.log(`⚠️ Note: ${error.message}`);
    }

    // Re-enable foreign key constraints
    db.run('PRAGMA foreign_keys = ON');
    console.log('🔒 Re-enabled foreign key constraints');

    // FORCE VACUUM to ensure changes are committed
    console.log('\n🗜️ FORCE VACUUM database...');
    db.run('VACUUM');
    console.log('✅ Database vacuumed and optimized');

    // Save the database with explicit write
    console.log('\n💾 FORCE SAVING database...');
    const data = db.export();
    
    // Make sure we have write permissions and force write
    try {
      if (fs.existsSync(dbPath)) {
        fs.chmodSync(dbPath, 0o666); // Ensure write permissions
      }
      fs.writeFileSync(dbPath, data, { flag: 'w' });
      console.log('✅ Database FORCE SAVED successfully');
    } catch (writeError) {
      console.error('❌ Error writing database:', writeError);
      throw writeError;
    }

    db.close();

    console.log('\n' + '='.repeat(60));
    console.log('🎉 DATABASE FORCE CLEARED SUCCESSFULLY!');
    
    // FINAL VERIFICATION with fresh connection
    console.log('\n📊 FINAL VERIFICATION WITH FRESH CONNECTION...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

    const SQL2 = await initSqlJs();
    const filebuffer2 = fs.readFileSync(dbPath);
    const db2 = new SQL.Database(filebuffer2);

    let finalTotal = 0;
    for (const table of tables) {
      try {
        const result = db2.exec(`SELECT COUNT(*) as count FROM ${table}`);
        const count = result[0] ? result[0].values[0][0] : 0;
        finalTotal += count;
        console.log(`  - ${table}: ${count} records remaining`);
      } catch (error) {
        console.log(`  - ${table}: Table status unknown - ${error.message}`);
      }
    }

    db2.close();

    if (finalTotal === 0) {
      console.log('✅ SUCCESS: All data successfully deleted and verified!');
    } else {
      console.log(`❌ WARNING: ${finalTotal} records still remain in database`);
    }

  } catch (error) {
    console.error('❌ Critical error clearing database:', error);
    process.exit(1);
  }
}

// Run the force cleanup
forceClearDatabase();
