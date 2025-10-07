# API Documentation

## OpenAPI Specification

```yaml
openapi: 3.0.3
info:
  title: Real-time Scoreboard API
  description: |
    A secure, high-performance API for managing real-time scoreboards with fraud prevention.
    
    ## Authentication
    All endpoints require JWT authentication via the `Authorization: Bearer <token>` header.
    
    ## Rate Limiting
    - Per User: 10 score updates per minute
    - Per IP: 100 requests per minute
    - Global: 10,000 requests per minute
    
    ## Security
    Action tokens are required for score updates to prevent fraud and ensure authenticity.
  version: 1.0.0
  contact:
    name: API Support
    url: https://support.scoreboard.example.com
    email: api-support@scoreboard.example.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.scoreboard.example.com/v1
    description: Production server
  - url: https://staging-api.scoreboard.example.com/v1
    description: Staging server
  - url: http://localhost:3000/v1
    description: Development server

paths:
  /auth/login:
    post:
      summary: Authenticate user and obtain JWT token
      tags:
        - Authentication
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - username
                - password
              properties:
                username:
                  type: string
                  minLength: 3
                  maxLength: 50
                  example: "player123"
                password:
                  type: string
                  minLength: 8
                  maxLength: 128
                  format: password
                  example: "securePassword123!"
      responses:
        '200':
          description: Authentication successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: object
                    properties:
                      token:
                        type: string
                        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      expires_in:
                        type: integer
                        example: 3600
                      user:
                        $ref: '#/components/schemas/User'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '429':
          $ref: '#/components/responses/TooManyRequests'

  /leaderboard:
    get:
      summary: Get current leaderboard
      tags:
        - Leaderboard
      security:
        - BearerAuth: []
      parameters:
        - name: limit
          in: query
          description: Number of top players to return
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 10
        - name: offset
          in: query
          description: Number of players to skip
          schema:
            type: integer
            minimum: 0
            default: 0
      responses:
        '200':
          description: Leaderboard retrieved successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: object
                    properties:
                      leaderboard:
                        type: array
                        items:
                          $ref: '#/components/schemas/LeaderboardEntry'
                      total_players:
                        type: integer
                        example: 1000
                      last_updated:
                        type: string
                        format: date-time
                        example: "2024-01-01T12:00:00Z"
        '401':
          $ref: '#/components/responses/Unauthorized'

  /scores/update:
    post:
      summary: Update user score
      tags:
        - Scores
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - action_token
              properties:
                action_token:
                  type: string
                  description: Cryptographically signed token proving action completion
                  example: "eyJhY3Rpb25faWQiOiJ1bmlxdWVfYWN0aW9uX2lkZW50aWZpZXIi..."
                metadata:
                  type: object
                  description: Additional context about the action
                  properties:
                    action_type:
                      type: string
                      enum: [LEVEL_COMPLETION, ACHIEVEMENT_UNLOCK, CHALLENGE_WIN, DAILY_BONUS]
                      example: "LEVEL_COMPLETION"
                    level_id:
                      type: string
                      maxLength: 50
                      example: "level_42"
                    difficulty:
                      type: string
                      enum: [EASY, MEDIUM, HARD, EXPERT]
                      example: "HARD"
      responses:
        '200':
          description: Score updated successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: object
                    properties:
                      user_id:
                        type: string
                        format: uuid
                        example: "123e4567-e89b-12d3-a456-426614174000"
                      old_score:
                        type: integer
                        example: 15320
                      new_score:
                        type: integer
                        example: 15420
                      increment:
                        type: integer
                        example: 100
                      new_rank:
                        type: integer
                        example: 1
                      old_rank:
                        type: integer
                        example: 2
                      leaderboard_updated:
                        type: boolean
                        example: true
        '400':
          description: Invalid action token or request data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
              example:
                success: false
                error: "INVALID_ACTION_TOKEN"
                message: "The provided action token is invalid or expired"
        '401':
          $ref: '#/components/responses/Unauthorized'
        '409':
          description: Action already processed (replay attack prevention)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
              example:
                success: false
                error: "ACTION_ALREADY_PROCESSED"
                message: "This action has already been processed"
        '429':
          $ref: '#/components/responses/TooManyRequests'

  /scores/history:
    get:
      summary: Get user's score history
      tags:
        - Scores
      security:
        - BearerAuth: []
      parameters:
        - name: user_id
          in: query
          description: User ID (defaults to authenticated user)
          schema:
            type: string
            format: uuid
        - name: limit
          in: query
          description: Number of history entries to return
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
        - name: offset
          in: query
          description: Number of entries to skip
          schema:
            type: integer
            minimum: 0
            default: 0
      responses:
        '200':
          description: Score history retrieved successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: object
                    properties:
                      history:
                        type: array
                        items:
                          $ref: '#/components/schemas/ScoreHistoryEntry'
                      total_entries:
                        type: integer
                        example: 150

  /realtime/connect:
    get:
      summary: WebSocket connection endpoint
      tags:
        - Real-time
      description: |
        Establish a WebSocket connection for real-time leaderboard updates.
        
        ## Connection Process
        1. Connect to the WebSocket endpoint
        2. Send authentication message with JWT token
        3. Receive confirmation and initial leaderboard data
        4. Listen for real-time updates
        
        ## Message Types
        - `auth` - Authentication message
        - `leaderboard_update` - Real-time leaderboard changes
        - `score_update` - Individual score changes
        - `heartbeat` - Connection keep-alive
      responses:
        '101':
          description: WebSocket connection established
        '401':
          description: Authentication failed
        '426':
          description: Upgrade required

  /health:
    get:
      summary: Health check endpoint
      tags:
        - System
      responses:
        '200':
          description: Service is healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: "healthy"
                  timestamp:
                    type: string
                    format: date-time
                  version:
                    type: string
                    example: "1.0.0"
                  dependencies:
                    type: object
                    properties:
                      database:
                        type: string
                        example: "healthy"
                      redis:
                        type: string
                        example: "healthy"

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
          example: "123e4567-e89b-12d3-a456-426614174000"
        username:
          type: string
          example: "player123"
        email:
          type: string
          format: email
          example: "player123@example.com"
        current_score:
          type: integer
          example: 15420
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    LeaderboardEntry:
      type: object
      properties:
        rank:
          type: integer
          example: 1
        user_id:
          type: string
          format: uuid
          example: "123e4567-e89b-12d3-a456-426614174000"
        username:
          type: string
          example: "player123"
        score:
          type: integer
          example: 15420
        last_updated:
          type: string
          format: date-time
          example: "2024-01-01T12:00:00Z"

    ScoreHistoryEntry:
      type: object
      properties:
        id:
          type: string
          format: uuid
        score_increment:
          type: integer
          example: 100
        old_score:
          type: integer
          example: 15320
        new_score:
          type: integer
          example: 15420
        action_type:
          type: string
          example: "LEVEL_COMPLETION"
        created_at:
          type: string
          format: date-time
        metadata:
          type: object

    Error:
      type: object
      required:
        - success
        - error
        - message
      properties:
        success:
          type: boolean
          example: false
        error:
          type: string
          example: "VALIDATION_ERROR"
        message:
          type: string
          example: "The request data is invalid"
        details:
          type: array
          items:
            type: object
            properties:
              field:
                type: string
              code:
                type: string
              message:
                type: string

  responses:
    Unauthorized:
      description: Authentication credentials are missing or invalid
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            success: false
            error: "UNAUTHORIZED"
            message: "Authentication credentials are required"

    TooManyRequests:
      description: Rate limit exceeded
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            success: false
            error: "RATE_LIMIT_EXCEEDED"
            message: "Too many requests. Please try again later."
      headers:
        X-RateLimit-Limit:
          description: Request limit per time window
          schema:
            type: integer
        X-RateLimit-Remaining:
          description: Requests remaining in current window
          schema:
            type: integer
        X-RateLimit-Reset:
          description: Time when rate limit resets
          schema:
            type: integer

tags:
  - name: Authentication
    description: User authentication and session management
  - name: Leaderboard
    description: Leaderboard retrieval and ranking operations
  - name: Scores
    description: Score management and history
  - name: Real-time
    description: WebSocket connections and live updates
  - name: System
    description: System health and monitoring endpoints
```

## WebSocket API Documentation

### Connection
```javascript
const ws = new WebSocket('wss://api.scoreboard.example.com/v1/realtime/connect');
```

### Authentication Message
```json
{
  "type": "auth",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Authentication Response
```json
{
  "type": "auth_response",
  "success": true,
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "session_id": "session_abc123"
}
```

### Initial Leaderboard Data
```json
{
  "type": "initial_leaderboard",
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "user_id": "123e4567-e89b-12d3-a456-426614174000",
        "username": "player123",
        "score": 15420,
        "last_updated": "2024-01-01T12:00:00Z"
      }
    ],
    "total_players": 1000,
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

### Real-time Leaderboard Update
```json
{
  "type": "leaderboard_update",
  "data": {
    "updated_entries": [
      {
        "rank": 1,
        "user_id": "123e4567-e89b-12d3-a456-426614174000",
        "username": "player123",
        "score": 15520,
        "previous_rank": 2,
        "score_change": 100
      }
    ],
    "timestamp": "2024-01-01T12:01:00Z"
  }
}
```

### Individual Score Update
```json
{
  "type": "score_update",
  "data": {
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "old_score": 15420,
    "new_score": 15520,
    "increment": 100,
    "action_type": "LEVEL_COMPLETION",
    "timestamp": "2024-01-01T12:01:00Z"
  }
}
```

### Heartbeat Messages
```json
// Client to Server
{
  "type": "ping",
  "timestamp": 1704067200000
}

// Server to Client
{
  "type": "pong",
  "timestamp": 1704067200000
}
```

### Error Messages
```json
{
  "type": "error",
  "error": "AUTHENTICATION_FAILED",
  "message": "Invalid or expired token",
  "timestamp": "2024-01-01T12:00:00Z"
}
```