import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../utils/config';

class Database {
  private db: sqlite3.Database | null = null;

  constructor() {
    this.connect();
  }

  private connect(): void {
    // Ensure database directory exists
    const dbPath = path.resolve(config.database.path);
    const dbDir = path.dirname(dbPath);
    
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log('Created database directory:', dbDir);
    }
    
    console.log('Connecting to database at:', dbPath);
    
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error connecting to database:', err.message);
        console.error('Database path:', dbPath);
        process.exit(1);
      } else {
        console.log('Connected to SQLite database');
        this.createTables();
      }
    });
  }

  private createTables(): void {
    if (!this.db) return;

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

    this.db.run(createUsersTable, (err) => {
      if (err) {
        console.error('Error creating users table:', err.message);
      } else {
        console.log('Users table ready');
        this.createIndexes();
      }
    });
  }

  private createIndexes(): void {
    if (!this.db) return;

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)'
    ];

    indexes.forEach((indexQuery, index) => {
      this.db!.run(indexQuery, (err) => {
        if (err) {
          console.error(`Error creating index ${index + 1}:`, err.message);
        } else {
          console.log(`Index ${index + 1} created successfully`);
        }
      });
    });
  }

  public getDatabase(): sqlite3.Database | null {
    return this.db;
  }

  public close(): void {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }
}

// Create and export database instance
const database = new Database();
export default database;