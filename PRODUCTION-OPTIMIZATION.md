# Production Optimization Configuration

## Frontend Performance

### Vite Bundle Analysis
```bash
npm install --save-dev rollup-plugin-visualizer
```

Add to vite.config.ts:
```typescript
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['./components/Header', './components/TabButton'],
          services: ['./services/backendService']
        }
      }
    }
  }
});
```

### Service Worker for Caching
Create `public/sw.js`:
```javascript
const CACHE_NAME = 'foto-video-suite-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

## Backend Performance

### Compression Middleware
```typescript
import compression from 'compression';

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
}));
```

### Response Caching
```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ 
  stdTTL: 600, // 10 minutes
  checkperiod: 120 
});

// Cache middleware for AI responses
const cacheMiddleware = (duration: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.originalUrl;
    const cached = cache.get(key);
    
    if (cached) {
      return res.json(cached);
    }
    
    const originalJson = res.json;
    res.json = function(data) {
      cache.set(key, data, duration);
      return originalJson.call(this, data);
    };
    
    next();
  };
};
```

### Database Connection Pooling (PostgreSQL)
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};
```

## Security Enhancements

### Request Sanitization
```typescript
import xss from 'xss';
import { body, validationResult } from 'express-validator';

const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    });
  }
  next();
};

app.use(sanitizeInput);
```

### API Key Rotation
```typescript
interface ApiKeyConfig {
  primary: string;
  secondary?: string;
  rotationDate: Date;
}

const getActiveApiKey = (): string => {
  const config: ApiKeyConfig = {
    primary: process.env.GEMINI_API_KEY!,
    secondary: process.env.GEMINI_API_KEY_SECONDARY,
    rotationDate: new Date(process.env.KEY_ROTATION_DATE || Date.now())
  };
  
  // Use secondary key if rotation is due
  if (config.secondary && Date.now() > config.rotationDate.getTime()) {
    return config.secondary;
  }
  
  return config.primary;
};
```

## Monitoring and Logging

### Structured Logging
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'foto-video-suite',
    version: process.env.npm_package_version 
  },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### Health Checks with Metrics
```typescript
interface HealthMetrics {
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  activeConnections: number;
  requestsPerMinute: number;
  errorRate: number;
}

let requestCount = 0;
let errorCount = 0;

const getHealthMetrics = (): HealthMetrics => {
  return {
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    activeConnections: 0, // Track from connection pool
    requestsPerMinute: requestCount,
    errorRate: errorCount / requestCount * 100
  };
};
```

## Load Testing

### Artillery.js Configuration
Create `artillery.yml`:
```yaml
config:
  target: https://your-backend.vercel.app
  phases:
    - duration: 60
      arrivalRate: 10
      name: Warm up
    - duration: 120
      arrivalRate: 50
      name: Ramp up load
    - duration: 300
      arrivalRate: 100
      name: Sustained load
  variables:
    apiKey: "your-test-api-key"

scenarios:
  - name: Health Check
    weight: 20
    flow:
      - get:
          url: /api/health

  - name: Text Generation
    weight: 80
    flow:
      - post:
          url: /api/auth/login
          json:
            email: demo@example.com
            password: password123
          capture:
            - json: $.data.accessToken
              as: token
      - post:
          url: /api/ai/text/generate
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            prompt: "Generate a test prompt"
            maxTokens: 100
```

Run load test:
```bash
npm install -g artillery
artillery run artillery.yml
```

## CDN and Asset Optimization

### CloudFront Configuration
```json
{
  "Origins": [{
    "DomainName": "your-app.vercel.app",
    "Id": "vercel-origin",
    "CustomOriginConfig": {
      "HTTPPort": 443,
      "OriginProtocolPolicy": "https-only"
    }
  }],
  "DefaultCacheBehavior": {
    "TargetOriginId": "vercel-origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "CachePolicyId": "managed-caching-optimized",
    "ResponseHeadersPolicyId": "managed-security-headers"
  }
}
```

### Image Optimization
```typescript
// Add to backend for image processing
import sharp from 'sharp';

const optimizeImage = async (buffer: Buffer): Promise<Buffer> => {
  return sharp(buffer)
    .resize(1920, 1080, { 
      fit: 'inside',
      withoutEnlargement: true 
    })
    .jpeg({ 
      quality: 80,
      progressive: true 
    })
    .toBuffer();
};
```