const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const dbPath = path.join(__dirname, 'database', 'waste_management.db');

async function verifyEmptyDatabase() {
  console.log('🔍 FINAL VERIFICATION - Checking if database is truly empty');
  console.log('='.repeat(55));

  try {
    if (!fs.existsSync(dbPath)) {
      console.log('❌ Database file not found');
      return;
    }

    const SQL = await initSqlJs();
    const filebuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(filebuffer);

    // Check all tables thoroughly
    const tables = ['users', 'waste_requests'];
    let totalRecords = 0;
    let allEmpty = true;

    console.log('📋 Checking each table:');
    
    for (const table of tables) {
      try {
        const result = db.exec(`SELECT COUNT(*) as count FROM ${table}`);
        const count = result[0] ? result[0].values[0][0] : 0;
        totalRecords += count;
        
        const status = count === 0 ? '✅' : '❌';
        console.log(`  ${status} ${table}: ${count} records`);
        
        if (count > 0) {
          allEmpty = false;
          // Show the remaining data
          const dataResult = db.exec(`SELECT * FROM ${table} LIMIT 5`);
          if (dataResult[0]) {
            console.log(`    Remaining data:`);
            dataResult[0].values.forEach((row, index) => {
              console.log(`      ${index + 1}: ${row.slice(0, 4).join(', ')}`);
            });
          }
        }
      } catch (error) {
        console.log(`  ❓ ${table}: Error checking - ${error.message}`);
      }
    }

    // Check sqlite_sequence table
    try {
      const seqResult = db.exec(`SELECT * FROM sqlite_sequence`);
      if (seqResult[0] && seqResult[0].values.length > 0) {
        console.log('  ⚠️ sqlite_sequence still has entries:');
        seqResult[0].values.forEach(row => {
          console.log(`    ${row[0]}: ${row[1]}`);
        });
      } else {
        console.log('  ✅ sqlite_sequence: empty');
      }
    } catch (error) {
      console.log('  ✅ sqlite_sequence: table not found (expected)');
    }

    db.close();

    console.log('='.repeat(55));
    console.log(`📊 Total records across all tables: ${totalRecords}`);
    
    if (allEmpty && totalRecords === 0) {
      console.log('🎉 SUCCESS: Database is completely empty!');
      console.log('✅ Ready for fresh data');
    } else {
      console.log('❌ WARNING: Database still contains data!');
      console.log('💡 You may need to restart the backend server to see changes');
    }

  } catch (error) {
    console.error('❌ Error verifying database:', error);
  }
}

verifyEmptyDatabase();
