# 📚 Foto Video Creative Suite - API Documentation

## 🌐 Base URLs

| Environment | URL |
|-------------|-----|
| **Production** | `https://foto-video-creative-suite-backend.vercel.app` |
| **Development** | `http://localhost:3001` |

## 🔐 Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

## 📋 Response Format

All API responses follow this structure:

```json
{
  "success": true|false,
  "message": "Response message",
  "data": { ... },
  "error": "Error message (if applicable)",
  "timestamp": "2025-11-06T10:30:00.000Z",
  "errorId": "err_1234567890_abc123" // For errors only
}
```

---

## 🚀 Endpoints

### 🏥 Health & Monitoring

#### GET /api/health
Simple health check endpoint.

**Response:**
```json
{
  "success": true,
  "message": "Foto Video Creative Suite Backend is running",
  "timestamp": "2025-11-06T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0"
}
```

#### GET /api/health/detailed
Comprehensive health check with service status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy|degraded|unhealthy",
    "timestamp": "2025-11-06T10:30:00.000Z",
    "environment": "production",
    "uptime": 3600,
    "responseTime": 45,
    "services": [
      {
        "name": "Gemini API",
        "status": "healthy",
        "message": "API key configured",
        "responseTime": 12,
        "details": {
          "keyConfigured": true,
          "keyLength": 39
        }
      }
    ],
    "summary": {
      "healthy": 3,
      "degraded": 0,
      "unhealthy": 0,
      "total": 3
    }
  }
}
```

#### GET /api/health/metrics
System metrics and error statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2025-11-06T10:30:00.000Z",
    "uptime": 3600,
    "errors": {
      "total": 5,
      "byStatus": { "404": 3, "500": 2 },
      "byType": { "ValidationError": 2, "UnknownError": 3 }
    },
    "cache": {
      "totalEntries": 25,
      "hitRate": 0.85,
      "memoryUsage": { ... }
    },
    "system": {
      "memory": { ... },
      "cpu": { ... },
      "platform": "linux",
      "version": "v18.17.0"
    }
  }
}
```

#### GET /api/health/ready
Readiness probe for container orchestration.

#### GET /api/health/live  
Liveness probe for container orchestration.

#### POST /api/health/cache/clear
Clear application cache.

**Body:**
```json
{
  "pattern": "optional_regex_pattern"
}
```

---

### 🔐 Authentication

#### POST /api/auth/register
Register a new user account.

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### POST /api/auth/login
Authenticate user and get access token.

**Body:**
```json
{
  "email": "john@example.com", 
  "password": "securePassword123"
}
```

**Response:** Same as register response.

#### POST /api/auth/refresh
Refresh access token using refresh token.

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### GET /api/auth/me
Get current user information. **Requires authentication.**

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2025-11-06T10:30:00.000Z"
  }
}
```

#### POST /api/auth/logout
Logout and invalidate tokens. **Requires authentication.**

---

### 🤖 AI Generation Services

All AI endpoints require authentication.

#### POST /api/ai/generate/text
Generate text using Gemini AI.

**Body:**
```json
{
  "prompt": "Write a creative story about space exploration",
  "maxTokens": 1000,
  "temperature": 0.7,
  "model": "gemini-pro" // optional, defaults to gemini-pro
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "generatedText": "In the year 2157, Captain Maya Chen stood...",
    "model": "gemini-pro",
    "tokenCount": 245,
    "finishReason": "stop"
  }
}
```

#### POST /api/ai/generate/image  
Generate images using Gemini AI.

**Body:**
```json
{
  "prompt": "A futuristic city with flying cars at sunset",
  "size": "1024x1024", // optional: "256x256", "512x512", "1024x1024"
  "style": "realistic", // optional: "realistic", "artistic", "cartoon"
  "model": "gemini-pro-vision" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "imageUrl": "https://generated-image-url.com/image.jpg",
    "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
    "prompt": "A futuristic city with flying cars at sunset",
    "model": "gemini-pro-vision",
    "size": "1024x1024"
  }
}
```

#### POST /api/ai/generate/video
Generate or process video content.

**Body:**
```json
{
  "prompt": "Create a short video of ocean waves",
  "duration": 10, // seconds
  "quality": "high", // "low", "medium", "high"
  "format": "mp4"
}
```

#### POST /api/ai/transcribe/audio
Transcribe audio to text.

**Form Data:**
- `audio`: Audio file (mp3, wav, m4a)
- `language`: Language code (optional, e.g., "en", "id")

**Response:**
```json
{
  "success": true,
  "data": {
    "transcription": "Hello, this is the transcribed text...",
    "language": "en",
    "confidence": 0.95,
    "duration": 45.2
  }
}
```

#### POST /api/ai/speech/synthesize
Convert text to speech.

**Body:**
```json
{
  "text": "Hello, this will be converted to speech",
  "voice": "en-US-Standard-A", // optional
  "speed": 1.0, // optional, 0.25-4.0
  "pitch": 0 // optional, -20.0 to 20.0
}
```

---

### 👤 User Management  

#### GET /api/user/profile
Get detailed user profile. **Requires authentication.**

#### PUT /api/user/profile
Update user profile. **Requires authentication.**

**Body:**
```json
{
  "name": "Updated Name",
  "preferences": {
    "language": "en",
    "theme": "dark"
  }
}
```

#### GET /api/user/history
Get user's generation history. **Requires authentication.**

**Query Parameters:**
- `limit`: Number of results (default: 20, max: 100)
- `offset`: Pagination offset
- `type`: Filter by type ("text", "image", "video", "audio")
- `startDate`: Filter from date (ISO string)
- `endDate`: Filter to date (ISO string)

---

### 📁 Media Management

#### POST /api/media/upload
Upload media files. **Requires authentication.**

**Form Data:**
- `file`: Media file
- `type`: "image" | "audio" | "video" | "document"
- `description`: Optional description

#### GET /api/media/:id
Get media file information. **Requires authentication.**

#### DELETE /api/media/:id  
Delete media file. **Requires authentication.**

---

## 🚨 Error Codes

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | Bad Request | Invalid request format or parameters |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 413 | Payload Too Large | File or request too large |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

---

## 📊 Rate Limiting

- **Default**: 100 requests per 15 minutes per IP
- **Authentication**: 5 attempts per 15 minutes per IP
- **AI Generation**: 10 requests per minute per user
- **File Upload**: 5 uploads per minute per user

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699272600
```

---

## 🔧 CORS Configuration

**Allowed Origins:**
- `https://foto-video-creative-suite.vercel.app`
- `http://localhost:5173` (development)
- `http://localhost:3000` (development)

**Allowed Methods:** GET, POST, PUT, DELETE, OPTIONS  
**Allowed Headers:** Content-Type, Authorization, X-API-Key

---

## 📈 Monitoring Headers

All responses include monitoring headers:

```http
X-Response-Time: 45ms
X-Cache: HIT|MISS
X-Cache-Age: 30
API-Version: 1.0.0
X-API-Version: 1.0.0
```

---

## 🧪 Testing Examples

### cURL Examples

```bash
# Health check
curl https://foto-video-creative-suite-backend.vercel.app/api/health

# Login
curl -X POST https://foto-video-creative-suite-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Generate text (with auth)
curl -X POST https://foto-video-creative-suite-backend.vercel.app/api/ai/generate/text \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"prompt":"Write a haiku about coding","maxTokens":100}'
```

### JavaScript/TypeScript Examples

```typescript
// API client setup
const API_BASE = 'https://foto-video-creative-suite-backend.vercel.app/api';

// Login function
async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return await response.json();
}

// Generate text with authentication
async function generateText(prompt: string, token: string) {
  const response = await fetch(`${API_BASE}/ai/generate/text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ prompt, maxTokens: 500 })
  });
  return await response.json();
}
```

---

## 📞 Support

For API support and questions:
- **Documentation**: This document
- **Health Check**: `GET /api/health/detailed` for service status
- **Error Tracking**: All errors include `errorId` for support reference

---

*Last updated: November 6, 2025*  
*API Version: 1.0.0*