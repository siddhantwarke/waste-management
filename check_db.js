const database = require('./backend/config/database');

async function checkDatabase() {
  try {
    const db = await database.getDb();
    
    // Check if users exist
    const result = db.exec("SELECT * FROM users");
    console.log('Users in database:');
    if (result.length > 0) {
      const columns = result[0].columns;
      const values = result[0].values;
      
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
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDatabase();
