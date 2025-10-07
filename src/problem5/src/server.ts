import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { config } from './utils/config';
import routes from './routes';
import { errorHandler, notFound } from './middleware/validation';
import database from './database/connection';

// Create Express application
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: config.corsOrigin,
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (config.nodeEnv !== 'test') {
    app.use(morgan('combined'));
}

// API routes
app.use(config.apiPrefix, routes);

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = (): void => {
    console.log('Received shutdown signal. Closing HTTP server...');

    database.close();

    process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const startServer = (): void => {
    const server = app.listen(config.port, () => {
        console.log(`🚀 Server is running on port ${config.port}`);
        console.log(`📚 API Documentation: http://localhost:${config.port}${config.apiPrefix}`);
        console.log(`🏥 Health Check: http://localhost:${config.port}${config.apiPrefix}/health`);
        console.log(`🌍 Environment: ${config.nodeEnv}`);
    });

    server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`❌ Port ${config.port} is already in use`);
        } else {
            console.error('❌ Server error:', error);
        }
        process.exit(1);
    });
};

// Start the server if this file is run directly
if (require.main === module) {
    startServer();
}

export default app;
