const database = require('./backend/config/database');

async function checkDatabase() {
  try {
    const db = await database.getDb();
    
    // Check if users exist
    const userResult = db.exec("SELECT * FROM users");
    console.log('Users in database:');
    if (userResult.length > 0) {
      const columns = userResult[0].columns;
      const values = userResult[0].values;
      
      values.forEach(row => {
        const user = {};
        columns.forEach((col, index) => {
          user[col] = row[index];
        });
        console.log(user);
      });
    } else {
      console.log('No users found');
    }
    
    console.log('\n===================\n');
    
    // Check if waste requests exist
    const wasteResult = db.exec("SELECT * FROM waste_requests");
    console.log('Waste requests in database:');
    if (wasteResult.length > 0) {
      const columns = wasteResult[0].columns;
      const values = wasteResult[0].values;
      
      values.forEach(row => {
        const request = {};
        columns.forEach((col, index) => {
          request[col] = row[index];
        });
        console.log(request);
      });
    } else {
      console.log('No waste requests found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDatabase();
