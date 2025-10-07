import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

// Database migration script
const migrate = (): void => {
  const dbDir = path.dirname('./database/app.db');
  
  // Create database directory if it doesn't exist
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('Created database directory');
  }

  const dbPath = path.resolve('./database/app.db');
  console.log('Database path:', dbPath);

  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error connecting to database:', err.message);
      process.exit(1);
    } else {
      console.log('Connected to SQLite database for migration');
    }
  });

  // Create users table
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      age INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.run(createUsersTable, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
      process.exit(1);
    } else {
      console.log('✅ Users table created successfully');
    }
  });

  // Add indexes for better performance
  const createIndexes = [
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
    'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)'
  ];

  createIndexes.forEach((indexQuery, index) => {
    db.run(indexQuery, (err) => {
      if (err) {
        console.error(`Error creating index ${index + 1}:`, err.message);
      } else {
        console.log(`✅ Index ${index + 1} created successfully`);
      }
    });
  });

  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('✅ Database migration completed successfully');
      console.log('Database file created at:', dbPath);
    }
  });
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrate();
}

export default migrate;