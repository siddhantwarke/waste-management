const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const dbPath = path.join(__dirname, 'database', 'waste_management.db');

async function verifyDatabaseEmpty() {
  console.log('🔍 Verifying database is empty...');
  console.log('='.repeat(40));

  try {
    if (!fs.existsSync(dbPath)) {
      console.log('❌ Database file not found');
      return;
    }

    const SQL = await initSqlJs();
    const filebuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(filebuffer);

    // Check all tables
    const tables = ['users', 'waste_requests'];
    let totalRecords = 0;

    for (const table of tables) {
      try {
        const result = db.exec(`SELECT COUNT(*) as count FROM ${table}`);
        const count = result[0] ? result[0].values[0][0] : 0;
        totalRecords += count;
        console.log(`📋 ${table}: ${count} records`);
      } catch (error) {
        console.log(`📋 ${table}: Error checking - ${error.message}`);
      }
    }

    db.close();

    console.log('='.repeat(40));
    if (totalRecords === 0) {
      console.log('✅ Database is completely empty!');
      console.log('🎉 Ready for fresh data');
    } else {
      console.log(`⚠️ Database still contains ${totalRecords} records`);
    }

  } catch (error) {
    console.error('❌ Error verifying database:', error);
  }
}

verifyDatabaseEmpty();
