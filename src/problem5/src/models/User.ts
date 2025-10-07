import database from '../database/connection';
import { User, CreateUserRequest, UpdateUserRequest, QueryFilters, PaginatedResponse } from '../types';

export class UserModel {
  private db = database.getDatabase();

  async create(userData: CreateUserRequest): Promise<User> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const query = `
        INSERT INTO users (name, email, age)
        VALUES (?, ?, ?)
      `;

      this.db.run(query, [userData.name, userData.email, userData.age || null], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            name: userData.name,
            email: userData.email,
            age: userData.age,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      });
    });
  }

  async findById(id: number): Promise<User | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const query = `
        SELECT id, name, email, age, created_at as createdAt, updated_at as updatedAt
        FROM users
        WHERE id = ?
      `;

      this.db.get(query, [id], (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  async findAll(filters: QueryFilters): Promise<PaginatedResponse<User>> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 10, 50);
      const offset = (page - 1) * limit;

      let whereClause = '';
      const params: any[] = [];

      // Build WHERE clause based on filters
      const conditions: string[] = [];

      if (filters.name) {
        conditions.push('name LIKE ?');
        params.push(`%${filters.name}%`);
      }

      if (filters.email) {
        conditions.push('email LIKE ?');
        params.push(`%${filters.email}%`);
      }

      if (filters.minAge !== undefined) {
        conditions.push('age >= ?');
        params.push(filters.minAge);
      }

      if (filters.maxAge !== undefined) {
        conditions.push('age <= ?');
        params.push(filters.maxAge);
      }

      if (conditions.length > 0) {
        whereClause = 'WHERE ' + conditions.join(' AND ');
      }

      // Count total records
      const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
      
      this.db!.get(countQuery, params, (err, countRow: any) => {
        if (err) {
          reject(err);
          return;
        }

        const total = countRow.total;
        const totalPages = Math.ceil(total / limit);

        // Get paginated data
        const dataQuery = `
          SELECT id, name, email, age, created_at as createdAt, updated_at as updatedAt
          FROM users ${whereClause}
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?
        `;

        const dataParams = [...params, limit, offset];

        this.db!.all(dataQuery, dataParams, (err, rows: User[]) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              data: rows,
              pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
              }
            });
          }
        });
      });
    });
  }

  async update(id: number, userData: UpdateUserRequest): Promise<User | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const fields: string[] = [];
      const params: any[] = [];

      if (userData.name !== undefined) {
        fields.push('name = ?');
        params.push(userData.name);
      }

      if (userData.email !== undefined) {
        fields.push('email = ?');
        params.push(userData.email);
      }

      if (userData.age !== undefined) {
        fields.push('age = ?');
        params.push(userData.age);
      }

      if (fields.length === 0) {
        reject(new Error('No fields to update'));
        return;
      }

      fields.push('updated_at = ?');
      params.push(new Date().toISOString());
      params.push(id);

      const query = `
        UPDATE users
        SET ${fields.join(', ')}
        WHERE id = ?
      `;

      this.db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          resolve(null);
        } else {
          // Return updated user
          resolve(new UserModel().findById(id));
        }
      });
    });
  }

  async delete(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const query = 'DELETE FROM users WHERE id = ?';

      this.db.run(query, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  async exists(email: string, excludeId?: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      let query = 'SELECT 1 FROM users WHERE email = ?';
      const params: any[] = [email];

      if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
      }

      this.db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(!!row);
        }
      });
    });
  }
}

export default new UserModel();