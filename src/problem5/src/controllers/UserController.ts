import { Request, Response, NextFunction } from 'express';
import UserModel from '../models/User';
import { ApiResponse, CreateUserRequest, UpdateUserRequest, QueryFilters } from '../types';

export class UserController {
  // Create a new user
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData: CreateUserRequest = req.body;

      // Check if email already exists
      const emailExists = await UserModel.exists(userData.email);
      if (emailExists) {
        const response: ApiResponse = {
          success: false,
          message: 'Email already exists'
        };
        res.status(409).json(response);
        return;
      }

      const user = await UserModel.create(userData);
      
      const response: ApiResponse = {
        success: true,
        message: 'User created successfully',
        data: user
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get all users with filters and pagination
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: QueryFilters = req.query;
      const result = await UserModel.findAll(filters);

      const response: ApiResponse = {
        success: true,
        message: 'Users retrieved successfully',
        data: result
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get user by ID
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await UserModel.findById(parseInt(id));

      if (!user) {
        const response: ApiResponse = {
          success: false,
          message: 'User not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'User retrieved successfully',
        data: user
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Update user
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userData: UpdateUserRequest = req.body;
      const userId = parseInt(id);

      // Check if user exists
      const existingUser = await UserModel.findById(userId);
      if (!existingUser) {
        const response: ApiResponse = {
          success: false,
          message: 'User not found'
        };
        res.status(404).json(response);
        return;
      }

      // Check if email already exists (for different user)
      if (userData.email) {
        const emailExists = await UserModel.exists(userData.email, userId);
        if (emailExists) {
          const response: ApiResponse = {
            success: false,
            message: 'Email already exists'
          };
          res.status(409).json(response);
          return;
        }
      }

      const updatedUser = await UserModel.update(userId, userData);

      const response: ApiResponse = {
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Delete user
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      const deleted = await UserModel.delete(userId);

      if (!deleted) {
        const response: ApiResponse = {
          success: false,
          message: 'User not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'User deleted successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();