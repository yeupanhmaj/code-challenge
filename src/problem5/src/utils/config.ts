import dotenv from 'dotenv';
import { AppConfig } from '../types';

// Load environment variables
dotenv.config();

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    path: process.env.DB_PATH || './database/app.db'
  },
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  maxItemsPerPage: parseInt(process.env.MAX_ITEMS_PER_PAGE || '50'),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
};

export default config;