# Security Implementation Guide

## Overview
This document provides detailed security implementation guidelines for the real-time scoreboard API, focusing on fraud prevention, authentication, and data protection.

## Authentication & Authorization

### JWT Token Implementation

#### Token Structure
```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "key-id-1"
  },
  "payload": {
    "sub": "123e4567-e89b-12d3-a456-426614174000",
    "iat": 1704067200,
    "exp": 1704070800,
    "aud": "scoreboard-api",
    "iss": "auth.scoreboard.example.com",
    "scope": ["read:scores", "update:scores"],
    "session_id": "session_abc123",
    "user_role": "player"
  }
}
```

#### Token Validation Process
```javascript
const validateJWT = (token) => {
  try {
    // 1. Verify token signature
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      audience: 'scoreboard-api',
      issuer: 'auth.scoreboard.example.com'
    });

    // 2. Check token expiration
    if (Date.now() >= decoded.exp * 1000) {
      throw new Error('Token expired');
    }

    // 3. Verify session is still active
    const sessionActive = await redis.get(`session:${decoded.session_id}`);
    if (!sessionActive) {
      throw new Error('Session expired');
    }

    // 4. Check user permissions
    if (!decoded.scope.includes('update:scores')) {
      throw new Error('Insufficient permissions');
    }

    return decoded;
  } catch (error) {
    throw new SecurityError('Invalid token', 'INVALID_JWT');
  }
};
```

### Action Token Implementation

#### Token Generation (Client-side)
```javascript
const generateActionToken = (userId, actionType, scoreIncrement) => {
  const payload = {
    action_id: generateUUID(),
    user_id: userId,
    action_type: actionType,
    score_increment: scoreIncrement,
    timestamp: Date.now(),
    nonce: generateCryptoNonce(32)
  };

  // Create HMAC signature
  const signature = createHMAC('sha256', actionSecret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return {
    ...payload,
    signature
  };
};
```

#### Token Validation (Server-side)
```javascript
const validateActionToken = async (token) => {
  // 1. Parse token
  const { signature, ...payload } = token;

  // 2. Verify signature
  const expectedSignature = createHMAC('sha256', actionSecret)
    .update(JSON.stringify(payload))
    .digest('hex');

  if (!crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  )) {
    throw new SecurityError('Invalid signature', 'INVALID_SIGNATURE');
  }

  // 3. Check timestamp (5-minute window)
  const now = Date.now();
  const tokenAge = now - payload.timestamp;
  if (tokenAge > 5 * 60 * 1000) {
    throw new SecurityError('Token expired', 'TOKEN_EXPIRED');
  }

  // 4. Check nonce (prevent replay attacks)
  const nonceKey = `nonce:${payload.nonce}`;
  const nonceExists = await redis.get(nonceKey);
  if (nonceExists) {
    throw new SecurityError('Token already used', 'REPLAY_ATTACK');
  }

  // 5. Store nonce with TTL
  await redis.setex(nonceKey, 600, '1'); // 10-minute TTL

  return payload;
};
```

## Fraud Detection System

### Risk Assessment Engine

#### Core Algorithm
```javascript
class FraudDetectionEngine {
  async assessRisk(userId, scoreIncrement, metadata) {
    const riskFactors = [];
    let totalRiskScore = 0;

    // 1. Frequency Analysis
    const frequencyRisk = await this.analyzeFrequency(userId);
    riskFactors.push({ type: 'FREQUENCY', score: frequencyRisk });
    totalRiskScore += frequencyRisk * 0.3;

    // 2. Score Pattern Analysis
    const patternRisk = await this.analyzeScorePattern(userId, scoreIncrement);
    riskFactors.push({ type: 'PATTERN', score: patternRisk });
    totalRiskScore += patternRisk * 0.25;

    // 3. Behavioral Analysis
    const behaviorRisk = await this.analyzeBehavior(userId, metadata);
    riskFactors.push({ type: 'BEHAVIOR', score: behaviorRisk });
    totalRiskScore += behaviorRisk * 0.2;

    // 4. Device/IP Analysis
    const deviceRisk = await this.analyzeDevice(userId, metadata);
    riskFactors.push({ type: 'DEVICE', score: deviceRisk });
    totalRiskScore += deviceRisk * 0.15;

    // 5. Time-based Analysis
    const timeRisk = await this.analyzeTimePatterns(userId);
    riskFactors.push({ type: 'TIME', score: timeRisk });
    totalRiskScore += timeRisk * 0.1;

    return {
      totalRiskScore: Math.min(totalRiskScore, 1.0),
      riskFactors,
      recommendation: this.getRecommendation(totalRiskScore)
    };
  }

  async analyzeFrequency(userId) {
    // Get recent score updates
    const recentUpdates = await db.query(`
      SELECT COUNT(*) as count, 
             AVG(EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (ORDER BY created_at)))) as avg_interval
      FROM score_history 
      WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 hour'
    `, [userId]);

    const { count, avg_interval } = recentUpdates.rows[0];

    // High frequency = higher risk
    if (count > 20) return 0.9; // Very high risk
    if (count > 10) return 0.7; // High risk
    if (count > 5) return 0.4;  // Medium risk

    // Very fast succession = higher risk
    if (avg_interval && avg_interval < 5) return 0.8; // < 5 seconds average
    if (avg_interval && avg_interval < 15) return 0.5; // < 15 seconds average

    return 0.1; // Low risk
  }

  async analyzeScorePattern(userId, scoreIncrement) {
    // Get user's score history
    const history = await db.query(`
      SELECT score_increment, action_type 
      FROM score_history 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 50
    `, [userId]);

    if (history.rows.length === 0) return 0.1;

    const increments = history.rows.map(r => r.score_increment);
    const avgIncrement = increments.reduce((a, b) => a + b, 0) / increments.length;
    const maxIncrement = Math.max(...increments);

    // Unusually large increment
    if (scoreIncrement > maxIncrement * 2) return 0.9;
    if (scoreIncrement > avgIncrement * 5) return 0.7;

    // Perfect patterns (suspicious)
    const uniqueIncrements = new Set(increments);
    if (uniqueIncrements.size === 1 && increments.length > 10) return 0.8;

    return 0.1;
  }

  async analyzeBehavior(userId, metadata) {
    // Get user's typical behavior
    const behavior = await redis.hgetall(`behavior:${userId}`);
    
    if (!behavior.action_types) return 0.2; // New user, medium risk

    const actionTypes = JSON.parse(behavior.action_types);
    const currentActionType = metadata.action_type;

    // Check if action type is unusual for this user
    const actionFrequency = actionTypes[currentActionType] || 0;
    const totalActions = Object.values(actionTypes).reduce((a, b) => a + b, 0);
    const actionProbability = actionFrequency / totalActions;

    if (actionProbability < 0.05) return 0.6; // Very unusual action
    if (actionProbability < 0.1) return 0.3;  // Somewhat unusual

    return 0.1;
  }

  getRecommendation(riskScore) {
    if (riskScore >= 0.8) return 'BLOCK';
    if (riskScore >= 0.6) return 'CHALLENGE';
    if (riskScore >= 0.4) return 'MONITOR';
    return 'ALLOW';
  }
}
```

### Fraud Rules Engine

#### Rule-based Detection
```javascript
const fraudRules = [
  {
    name: 'RAPID_SUCCESSION',
    description: 'Too many score updates in short time',
    check: async (userId) => {
      const count = await redis.get(`rate_limit:${userId}`);
      return count > 10; // More than 10 updates per minute
    },
    action: 'TEMPORARY_BLOCK',
    severity: 'HIGH'
  },
  
  {
    name: 'IMPOSSIBLE_SCORE_JUMP',
    description: 'Score increment too large',
    check: (scoreIncrement, userLevel) => {
      const maxPossible = userLevel * 100; // Example: max 100 points per level
      return scoreIncrement > maxPossible;
    },
    action: 'BLOCK',
    severity: 'CRITICAL'
  },
  
  {
    name: 'NIGHT_ACTIVITY',
    description: 'Suspicious activity during night hours',
    check: (timestamp, userTimezone) => {
      const hour = new Date(timestamp).getHours();
      const localHour = (hour + userTimezone) % 24;
      return localHour >= 2 && localHour <= 5; // 2 AM - 5 AM
    },
    action: 'MONITOR',
    severity: 'MEDIUM'
  },
  
  {
    name: 'REPEATED_PATTERNS',
    description: 'Identical score increments repeatedly',
    check: async (userId, scoreIncrement) => {
      const recent = await db.query(`
        SELECT COUNT(*) FROM score_history 
        WHERE user_id = $1 AND score_increment = $2 
        AND created_at > NOW() - INTERVAL '1 hour'
      `, [userId, scoreIncrement]);
      
      return recent.rows[0].count > 5;
    },
    action: 'CHALLENGE',
    severity: 'MEDIUM'
  }
];
```

## Rate Limiting Implementation

### Redis-based Rate Limiting
```javascript
class RateLimiter {
  constructor(redis) {
    this.redis = redis;
  }

  async checkRateLimit(key, limit, window) {
    const pipeline = this.redis.multi();
    const now = Date.now();
    const windowStart = now - window;

    // Remove expired entries
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    
    // Count requests in window
    pipeline.zcard(key);
    
    // Set expiration
    pipeline.expire(key, Math.ceil(window / 1000));
    
    const results = await pipeline.exec();
    const count = results[2][1];

    return {
      allowed: count <= limit,
      count,
      limit,
      resetTime: now + window
    };
  }

  async enforceRateLimit(req, res, next) {
    const userId = req.user?.id;
    const ip = req.ip;

    // Check per-user rate limit
    if (userId) {
      const userLimit = await this.checkRateLimit(
        `rate_limit:user:${userId}`,
        10, // 10 requests
        60 * 1000 // per minute
      );

      if (!userLimit.allowed) {
        return res.status(429).json({
          success: false,
          error: 'USER_RATE_LIMIT_EXCEEDED',
          message: 'Too many requests for this user',
          resetTime: userLimit.resetTime
        });
      }
    }

    // Check per-IP rate limit
    const ipLimit = await this.checkRateLimit(
      `rate_limit:ip:${ip}`,
      100, // 100 requests
      60 * 1000 // per minute
    );

    if (!ipLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: 'IP_RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP',
        resetTime: ipLimit.resetTime
      });
    }

    next();
  }
}
```

## Data Encryption

### Encryption at Rest
```javascript
const crypto = require('crypto');

class DataEncryption {
  constructor(encryptionKey) {
    this.algorithm = 'aes-256-gcm';
    this.key = Buffer.from(encryptionKey, 'hex');
  }

  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from('scoreboard-api', 'utf8'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encryptedData) {
    const { encrypted, iv, authTag } = encryptedData;
    const decipher = crypto.createDecipher(this.algorithm, this.key);
    
    decipher.setAAD(Buffer.from('scoreboard-api', 'utf8'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

### Encryption in Transit
```javascript
// TLS Configuration
const tlsOptions = {
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem'),
  ca: fs.readFileSync('ca-certificate.pem'),
  ciphers: [
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES128-SHA256',
    'ECDHE-RSA-AES256-SHA384'
  ].join(':'),
  honorCipherOrder: true,
  secureProtocol: 'TLSv1_2_method'
};
```

## Audit Logging

### Security Event Logging
```javascript
class SecurityAuditLogger {
  constructor(db) {
    this.db = db;
  }

  async logSecurityEvent(event) {
    const logEntry = {
      event_id: generateUUID(),
      event_type: event.type,
      severity: event.severity,
      user_id: event.userId,
      ip_address: event.ipAddress,
      user_agent: event.userAgent,
      event_data: JSON.stringify(event.data),
      timestamp: new Date(),
      source: 'scoreboard-api'
    };

    await this.db.query(`
      INSERT INTO security_audit_log 
      (event_id, event_type, severity, user_id, ip_address, user_agent, event_data, timestamp, source)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, Object.values(logEntry));

    // Send to SIEM if critical
    if (event.severity === 'CRITICAL') {
      await this.sendToSIEM(logEntry);
    }
  }

  async sendToSIEM(logEntry) {
    // Integration with SIEM system
    // Implementation depends on specific SIEM solution
  }
}

// Usage examples
const auditLogger = new SecurityAuditLogger(db);

// Log authentication failure
await auditLogger.logSecurityEvent({
  type: 'AUTHENTICATION_FAILED',
  severity: 'MEDIUM',
  userId: null,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  data: { attempted_username: req.body.username }
});

// Log fraud detection
await auditLogger.logSecurityEvent({
  type: 'FRAUD_DETECTED',
  severity: 'HIGH',
  userId: req.user.id,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  data: { 
    risk_score: riskAssessment.totalRiskScore,
    triggered_rules: riskAssessment.triggeredRules
  }
});
```

## Security Headers

### HTTP Security Headers
```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "same-origin" },
  frameguard: { action: 'deny' }
}));

// Custom security headers
app.use((req, res, next) => {
  res.setHeader('X-API-Version', '1.0.0');
  res.setHeader('X-Request-ID', req.id);
  res.removeHeader('X-Powered-By');
  next();
});
```

## Incident Response

### Automated Response System
```javascript
class SecurityIncidentResponse {
  constructor(auditLogger, redis) {
    this.auditLogger = auditLogger;
    this.redis = redis;
  }

  async handleFraudAlert(userId, riskScore, evidence) {
    if (riskScore >= 0.9) {
      // Immediate account suspension
      await this.suspendUser(userId, 'FRAUD_SUSPECTED');
      await this.alertSecurityTeam('CRITICAL', {
        userId,
        riskScore,
        evidence,
        action: 'USER_SUSPENDED'
      });
    } else if (riskScore >= 0.7) {
      // Temporary restrictions
      await this.applyTemporaryRestrictions(userId);
      await this.alertSecurityTeam('HIGH', {
        userId,
        riskScore,
        evidence,
        action: 'RESTRICTIONS_APPLIED'
      });
    } else if (riskScore >= 0.5) {
      // Enhanced monitoring
      await this.enableEnhancedMonitoring(userId);
    }
  }

  async suspendUser(userId, reason) {
    await this.redis.setex(`suspended:${userId}`, 24 * 60 * 60, reason);
    
    await this.auditLogger.logSecurityEvent({
      type: 'USER_SUSPENDED',
      severity: 'CRITICAL',
      userId,
      data: { reason, automated: true }
    });
  }

  async alertSecurityTeam(severity, data) {
    // Send to alerting system (Slack, PagerDuty, etc.)
    const alert = {
      severity,
      timestamp: new Date(),
      service: 'scoreboard-api',
      data
    };

    // Implementation depends on alerting system
    await this.sendAlert(alert);
  }
}
```

This comprehensive security implementation guide provides the foundation for building a secure and fraud-resistant real-time scoreboard API service.