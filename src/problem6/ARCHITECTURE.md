# System Architecture Diagrams

## High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WC1[Web Client 1]
        WC2[Web Client 2]
        WCN[Web Client N]
    end
    
    subgraph "Edge Layer"
        LB[Load Balancer<br/>Nginx/HAProxy]
        CDN[CDN<br/>Cloudflare/AWS]
    end
    
    subgraph "Application Layer"
        API1[API Server 1<br/>Node.js/Express]
        API2[API Server 2<br/>Node.js/Express]
        APIN[API Server N<br/>Node.js/Express]
        
        subgraph "Core Services"
            AUTH[Authentication<br/>Service]
            SCORE[Score<br/>Service]
            FRAUD[Fraud Detection<br/>Engine]
            REALTIME[Real-time<br/>Service]
        end
    end
    
    subgraph "Data Layer"
        REDIS[(Redis Cache<br/>Leaderboard)]
        POSTGRES[(PostgreSQL<br/>Persistent Data)]
        QUEUE[Message Queue<br/>Redis Pub/Sub]
    end
    
    subgraph "Monitoring"
        METRICS[Metrics<br/>Prometheus]
        LOGS[Logs<br/>ELK Stack]
        ALERTS[Alerts<br/>AlertManager]
    end
    
    WC1 -.->|WebSocket/HTTPS| CDN
    WC2 -.->|WebSocket/HTTPS| CDN
    WCN -.->|WebSocket/HTTPS| CDN
    
    CDN --> LB
    LB --> API1
    LB --> API2
    LB --> APIN
    
    API1 --> AUTH
    API1 --> SCORE
    API1 --> FRAUD
    API1 --> REALTIME
    
    API2 --> AUTH
    API2 --> SCORE
    API2 --> FRAUD
    API2 --> REALTIME
    
    APIN --> AUTH
    APIN --> SCORE
    APIN --> FRAUD
    APIN --> REALTIME
    
    SCORE --> REDIS
    SCORE --> POSTGRES
    REALTIME --> QUEUE
    FRAUD --> POSTGRES
    AUTH --> POSTGRES
    
    API1 --> METRICS
    API2 --> METRICS
    APIN --> METRICS
    
    METRICS --> ALERTS
    POSTGRES --> LOGS
    REDIS --> LOGS
```

## Data Flow Architecture

```mermaid
graph LR
    subgraph "User Action Flow"
        A[User Completes Action] --> B[Generate Action Token]
        B --> C[Send Score Update Request]
    end
    
    subgraph "API Processing"
        C --> D{Validate JWT}
        D -->|Invalid| E[Return 401]
        D -->|Valid| F{Validate Action Token}
        F -->|Invalid| G[Return 400]
        F -->|Valid| H[Check Fraud Rules]
    end
    
    subgraph "Fraud Detection"
        H --> I{Risk Assessment}
        I -->|High Risk| J[Block & Log]
        I -->|Low Risk| K[Process Update]
    end
    
    subgraph "Score Processing"
        K --> L[Update Redis Leaderboard]
        K --> M[Log to PostgreSQL]
        L --> N[Calculate New Rankings]
        N --> O[Publish Update Event]
    end
    
    subgraph "Real-time Broadcasting"
        O --> P[Message Queue]
        P --> Q[WebSocket Handlers]
        Q --> R[Connected Clients]
    end
    
    E --> S[Client Error Handler]
    G --> S
    J --> S
    R --> T[Update UI Leaderboard]
```

## Security Architecture

```mermaid
graph TB
    subgraph "Client Security"
        CT[Client Token<br/>JWT]
        AT[Action Token<br/>HMAC Signed]
    end
    
    subgraph "API Gateway Security"
        RL[Rate Limiting<br/>Redis-based]
        SSL[SSL Termination<br/>TLS 1.3]
        WAF[Web Application<br/>Firewall]
    end
    
    subgraph "Application Security"
        JV[JWT Validation<br/>RSA/HMAC]
        AV[Action Token<br/>Validation]
        NV[Nonce Verification<br/>Anti-replay]
    end
    
    subgraph "Fraud Detection"
        BDA[Behavioral<br/>Analysis]
        PDA[Pattern<br/>Detection]
        TSA[Time Series<br/>Analysis]
        RSA[Risk Scoring<br/>Algorithm]
    end
    
    subgraph "Data Security"
        EAR[Encryption<br/>at Rest]
        EIT[Encryption<br/>in Transit]
        AUD[Audit<br/>Logging]
    end
    
    CT --> SSL
    AT --> SSL
    SSL --> RL
    RL --> WAF
    WAF --> JV
    JV --> AV
    AV --> NV
    NV --> BDA
    BDA --> PDA
    PDA --> TSA
    TSA --> RSA
    RSA --> EAR
    EAR --> EIT
    EIT --> AUD
```

## Real-time Communication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant LB as Load Balancer
    participant API as API Server
    participant R as Redis
    participant Q as Message Queue
    participant WS as WebSocket Handler
    participant DB as PostgreSQL

    Note over C,DB: Initial Connection Setup
    C->>LB: WebSocket Connection Request
    LB->>API: Route to Available Server
    API->>WS: Establish WebSocket
    WS->>R: Get Current Leaderboard
    R-->>WS: Top 10 Scores
    WS-->>C: Send Initial Data
    
    Note over C,DB: Score Update Process
    C->>LB: POST /scores/update
    LB->>API: Route Request
    API->>API: Validate & Process
    API->>R: Update Score (ZINCRBY)
    API->>DB: Log Score History
    API->>Q: Publish Update Event
    Q->>WS: Broadcast to All Servers
    WS->>R: Fetch Updated Rankings
    R-->>WS: New Top 10
    WS-->>C: Push Real-time Update
    
    Note over C,DB: Connection Management
    C->>WS: Heartbeat Ping
    WS-->>C: Heartbeat Pong
    
    alt Connection Lost
        WS->>WS: Detect Disconnection
        WS->>WS: Cleanup Resources
    end
```

## Database Schema Relationships

```mermaid
erDiagram
    USERS ||--o{ SCORE_HISTORY : has
    USERS ||--o{ FRAUD_LOGS : generates
    USERS ||--o{ USER_SESSIONS : maintains
    USERS ||--o{ USED_NONCES : creates
    
    USERS {
        uuid id PK
        varchar username UK
        varchar email UK
        bigint current_score
        timestamp created_at
        timestamp updated_at
    }
    
    SCORE_HISTORY {
        uuid id PK
        uuid user_id FK
        integer score_increment
        bigint old_score
        bigint new_score
        varchar action_type
        varchar action_token_hash
        inet ip_address
        text user_agent
        timestamp created_at
    }
    
    FRAUD_LOGS {
        uuid id PK
        uuid user_id FK
        varchar event_type
        decimal risk_score
        jsonb metadata
        timestamp created_at
    }
    
    USER_SESSIONS {
        varchar session_id PK
        uuid user_id FK
        timestamp created_at
        timestamp expires_at
        jsonb metadata
    }
    
    USED_NONCES {
        varchar nonce PK
        uuid user_id FK
        timestamp created_at
    }
```

## Fraud Detection Algorithm Flow

```mermaid
flowchart TD
    A[Score Update Request] --> B[Extract User & Action Data]
    B --> C[Load User History]
    C --> D[Calculate Time-based Metrics]
    D --> E[Analyze Score Patterns]
    E --> F[Check Action Validity]
    F --> G[Calculate Risk Score]
    
    G --> H{Risk Score > Threshold?}
    H -->|Yes| I[Block Request]
    H -->|No| J[Allow Request]
    
    I --> K[Log Fraud Event]
    I --> L[Update Risk Profile]
    I --> M[Alert Security Team]
    
    J --> N[Process Score Update]
    J --> O[Update User Profile]
    
    K --> P[Return Error Response]
    N --> Q[Return Success Response]
    
    subgraph "Risk Factors"
        R1[Request Frequency]
        R2[Score Increment Size]
        R3[Time Pattern Analysis]
        R4[IP/Device Tracking]
        R5[Behavioral Analysis]
    end
    
    D --> R1
    E --> R2
    E --> R3
    F --> R4
    F --> R5
```

## Scaling Strategy

```mermaid
graph TB
    subgraph "Load Distribution"
        LB1[Primary Load Balancer]
        LB2[Secondary Load Balancer]
        
        subgraph "Auto Scaling Groups"
            ASG1[API Servers Group 1<br/>Min: 2, Max: 10]
            ASG2[API Servers Group 2<br/>Min: 2, Max: 10]
        end
    end
    
    subgraph "Database Scaling"
        MASTER[(Primary PostgreSQL<br/>Write Operations)]
        REPLICA1[(Read Replica 1)]
        REPLICA2[(Read Replica 2)]
        
        subgraph "Redis Cluster"
            REDIS1[(Redis Master 1)]
            REDIS2[(Redis Master 2)]
            REDIS3[(Redis Master 3)]
            REDIS_SLAVE1[(Redis Slave 1)]
            REDIS_SLAVE2[(Redis Slave 2)]
            REDIS_SLAVE3[(Redis Slave 3)]
        end
    end
    
    subgraph "Geographic Distribution"
        US_EAST[US East Region]
        US_WEST[US West Region]
        EU_WEST[EU West Region]
        ASIA_PACIFIC[Asia Pacific Region]
    end
    
    LB1 -.->|Health Check| LB2
    LB1 --> ASG1
    LB2 --> ASG2
    
    ASG1 --> MASTER
    ASG1 --> REPLICA1
    ASG2 --> MASTER
    ASG2 --> REPLICA2
    
    MASTER -.->|Replication| REPLICA1
    MASTER -.->|Replication| REPLICA2
    
    REDIS1 -.->|Replication| REDIS_SLAVE1
    REDIS2 -.->|Replication| REDIS_SLAVE2
    REDIS3 -.->|Replication| REDIS_SLAVE3
    
    ASG1 --> REDIS1
    ASG1 --> REDIS2
    ASG2 --> REDIS2
    ASG2 --> REDIS3
    
    LB1 -.->|Cross-Region| US_EAST
    LB1 -.->|Cross-Region| US_WEST
    LB2 -.->|Cross-Region| EU_WEST
    LB2 -.->|Cross-Region| ASIA_PACIFIC
```