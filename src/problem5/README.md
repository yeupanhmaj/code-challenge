# Express CRUD API with TypeScript

A robust RESTful API built with Express.js, TypeScript, and SQLite for managing user resources with full CRUD operations.

## 🚀 Features

- **Full CRUD Operations**: Create, Read, Update, Delete users
- **Data Validation**: Input validation using Joi
- **Filtering & Pagination**: Advanced querying with filters and pagination
- **Database Integration**: SQLite database with proper schema
- **Type Safety**: Full TypeScript implementation
- **Error Handling**: Comprehensive error handling middleware
- **Security**: CORS, Helmet, and other security measures
- **Logging**: Morgan HTTP request logger
- **Environment Configuration**: Configurable via environment variables

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **TypeScript** (installed globally or via dev dependencies)

## 🛠️ Installation

1. **Clone the repository** (or navigate to the problem5 folder):
   ```bash
   cd src/problem5
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file with your configuration:
   ```env
   PORT=3000
   NODE_ENV=development
   DB_PATH=./database/app.db
   API_PREFIX=/api/v1
   MAX_ITEMS_PER_PAGE=50
   CORS_ORIGIN=http://localhost:3000
   ```

## 🚦 Running the Application

### Development Mode
```bash
npm run dev
```
This starts the server with hot reload using nodemon.

### Production Mode
```bash
# Build the TypeScript code
npm run build

# Start the production server
npm start
```

### Other Commands
```bash
# Run linting
npm run lint

# Run tests (when implemented)
npm test
```

## 📚 API Documentation

Base URL: `http://localhost:3000/api/v1`

### Health Check
```http
GET /api/v1/health
```

Response:
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2025-10-07T12:00:00.000Z",
  "version": "1.0.0"
}
```

### User Endpoints

#### 1. Create User
```http
POST /api/v1/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30,
    "createdAt": "2025-10-07T12:00:00.000Z",
    "updatedAt": "2025-10-07T12:00:00.000Z"
  }
}
```

#### 2. Get All Users (with filtering and pagination)
```http
GET /api/v1/users?page=1&limit=10&name=John&minAge=18&maxAge=65
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 50)
- `name` (string, optional): Filter by name (partial match)
- `email` (string, optional): Filter by email (partial match)
- `minAge` (number, optional): Minimum age filter
- `maxAge` (number, optional): Maximum age filter

**Response:**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "data": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "age": 30,
        "createdAt": "2025-10-07T12:00:00.000Z",
        "updatedAt": "2025-10-07T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

#### 3. Get User by ID
```http
GET /api/v1/users/1
```

**Response:**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30,
    "createdAt": "2025-10-07T12:00:00.000Z",
    "updatedAt": "2025-10-07T12:00:00.000Z"
  }
}
```

#### 4. Update User
```http
PUT /api/v1/users/1
Content-Type: application/json

{
  "name": "John Smith",
  "age": 31
}
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": 1,
    "name": "John Smith",
    "email": "john@example.com",
    "age": 31,
    "createdAt": "2025-10-07T12:00:00.000Z",
    "updatedAt": "2025-10-07T12:01:00.000Z"
  }
}
```

#### 5. Delete User
```http
DELETE /api/v1/users/1
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

## 🗃️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  age INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 📁 Project Structure

```
src/
├── controllers/           # Request handlers
│   └── UserController.ts
├── database/             # Database configuration
│   └── connection.ts
├── middleware/           # Express middleware
│   └── validation.ts
├── models/              # Data models
│   └── User.ts
├── routes/              # API routes
│   ├── index.ts
│   └── users.ts
├── types/               # TypeScript type definitions
│   └── index.ts
├── utils/               # Utility functions
│   └── config.ts
└── server.ts           # Main application file
```

## ⚙️ Configuration

The application can be configured through environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `DB_PATH` | SQLite database path | `./database/app.db` |
| `API_PREFIX` | API route prefix | `/api/v1` |
| `MAX_ITEMS_PER_PAGE` | Maximum items per page | `50` |
| `CORS_ORIGIN` | CORS origin | `http://localhost:3000` |

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Input Validation**: Joi schema validation
- **SQL Injection Protection**: Parameterized queries
- **Error Handling**: Safe error responses

## 📝 Validation Rules

### User Creation
- `name`: Required, 2-100 characters
- `email`: Required, valid email format, unique
- `age`: Optional, integer, 0-150

### User Update
- `name`: Optional, 2-100 characters
- `email`: Optional, valid email format, unique
- `age`: Optional, integer, 0-150
- At least one field required

## 🚨 Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information (development only)"
}
```

Common HTTP status codes:
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `409`: Conflict (duplicate email)
- `500`: Internal Server Error

## 🧪 Testing

### Manual Testing with curl

**Create a user:**
```bash
curl -X POST http://localhost:3000/api/v1/users \\
  -H "Content-Type: application/json" \\
  -d '{"name": "John Doe", "email": "john@example.com", "age": 30}'
```

**Get all users:**
```bash
curl http://localhost:3000/api/v1/users
```

**Get user by ID:**
```bash
curl http://localhost:3000/api/v1/users/1
```

**Update user:**
```bash
curl -X PUT http://localhost:3000/api/v1/users/1 \\
  -H "Content-Type: application/json" \\
  -d '{"name": "John Smith"}'
```

**Delete user:**
```bash
curl -X DELETE http://localhost:3000/api/v1/users/1
```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**:
   ```
   Error: Port 3000 is already in use
   ```
   Solution: Change the PORT in `.env` file or kill the process using port 3000.

2. **Database connection error**:
   ```
   Error connecting to database
   ```
   Solution: Check if the database directory exists and has write permissions.

3. **Module not found errors**:
   ```
   Cannot find module 'express'
   ```
   Solution: Run `npm install` to install dependencies.

## 🔄 Development Workflow

1. Make changes to TypeScript files in the `src/` directory
2. The development server will automatically restart (thanks to nodemon)
3. Test your changes using the API endpoints
4. Run `npm run lint` to check for code issues
5. Build for production with `npm run build`

## 📦 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables for Production
Make sure to set appropriate values for production:
```env
NODE_ENV=production
PORT=8080
DB_PATH=/app/data/app.db
CORS_ORIGIN=https://yourdomain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

## 📞 Support

If you encounter any issues or have questions, please check the troubleshooting section or create an issue in the repository.