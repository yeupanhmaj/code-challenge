import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

// Validation schemas
export const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 100 characters'
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address'
  }),
  age: Joi.number().integer().min(0).max(150).optional().messages({
    'number.base': 'Age must be a number',
    'number.integer': 'Age must be an integer',
    'number.min': 'Age must be at least 0',
    'number.max': 'Age must not exceed 150'
  })
});

export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 100 characters'
  }),
  email: Joi.string().email().optional().messages({
    'string.email': 'Please provide a valid email address'
  }),
  age: Joi.number().integer().min(0).max(150).optional().messages({
    'number.base': 'Age must be a number',
    'number.integer': 'Age must be an integer',
    'number.min': 'Age must be at least 0',
    'number.max': 'Age must not exceed 150'
  })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

export const querySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(50).optional().default(10),
  name: Joi.string().optional(),
  email: Joi.string().optional(),
  minAge: Joi.number().integer().min(0).optional(),
  maxAge: Joi.number().integer().min(0).optional()
});

export const idSchema = Joi.object({
  id: Joi.number().integer().min(1).required().messages({
    'number.base': 'ID must be a number',
    'number.integer': 'ID must be an integer',
    'number.min': 'ID must be greater than 0'
  })
});

// Validation middleware factory
export const validate = (schema: Joi.ObjectSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
    
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      const response: ApiResponse = {
        success: false,
        message: 'Validation failed',
        error: errorDetails.map(e => `${e.field}: ${e.message}`).join(', ')
      };

      res.status(400).json(response);
      return;
    }

    // Replace the original data with validated and sanitized data
    if (source === 'body') {
      req.body = value;
    } else if (source === 'query') {
      req.query = value;
    } else {
      req.params = value;
    }

    next();
  };
};

// Error handling middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error('Error:', err);

  let statusCode = 500;
  let message = 'Internal server error';

  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    statusCode = 409;
    message = 'Email already exists';
  } else if (err.code === 'SQLITE_CONSTRAINT') {
    statusCode = 400;
    message = 'Database constraint violation';
  } else if (err.message) {
    message = err.message;
  }

  const response: ApiResponse = {
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  };

  res.status(statusCode).json(response);
};

// Not found middleware
export const notFound = (req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    message: `Route ${req.originalUrl} not found`
  };

  res.status(404).json(response);
};