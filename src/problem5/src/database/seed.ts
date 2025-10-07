import sqlite3 from 'sqlite3';
import path from 'path';

// Database seeding script
const seed = (): void => {
  const dbPath = path.resolve('./database/app.db');
  
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error connecting to database:', err.message);
      process.exit(1);
    } else {
      console.log('Connected to SQLite database for seeding');
    }
  });

  // Sample users data
  const sampleUsers = [
    {
      name: 'John Doe',
      email: 'john.doe@example.com',
      age: 30
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      age: 25
    },
    {
      name: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      age: 35
    },
    {
      name: 'Alice Brown',
      email: 'alice.brown@example.com',
      age: 28
    },
    {
      name: 'Charlie Wilson',
      email: 'charlie.wilson@example.com',
      age: 42
    }
  ];

  // Clear existing data (optional)
  db.run('DELETE FROM users', (err) => {
    if (err) {
      console.error('Error clearing users table:', err.message);
      return;
    }
    console.log('Cleared existing users data');

    // Insert sample users
    const insertUser = db.prepare(`
      INSERT INTO users (name, email, age)
      VALUES (?, ?, ?)
    `);

    let insertedCount = 0;
    const totalUsers = sampleUsers.length;

    sampleUsers.forEach((user, index) => {
      insertUser.run([user.name, user.email, user.age], function(err) {
        if (err) {
          console.error(`Error inserting user ${user.name}:`, err.message);
        } else {
          console.log(`✅ Inserted user: ${user.name} (ID: ${this.lastID})`);
        }

        insertedCount++;
        
        // Close database when all insertions are complete
        if (insertedCount === totalUsers) {
          insertUser.finalize();
          
          db.close((err) => {
            if (err) {
              console.error('Error closing database:', err.message);
            } else {
              console.log('✅ Database seeding completed successfully');
              console.log(`Inserted ${totalUsers} sample users`);
            }
          });
        }
      });
    });
  });
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seed();
}

export default seed;