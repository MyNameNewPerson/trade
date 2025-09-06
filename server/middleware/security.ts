import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class SecurityMiddleware {
  private rateLimitMap: Map<string, RateLimitEntry> = new Map();
  private readonly WINDOW_SIZE = 60 * 1000; // 1 minute
  private readonly MAX_REQUESTS = 60; // requests per window

  private cleanupOldEntries() {
    const now = Date.now();
    for (const [key, entry] of this.rateLimitMap.entries()) {
      if (now > entry.resetTime) {
        this.rateLimitMap.delete(key);
      }
    }
  }

  rateLimiter = (req: Request, res: Response, next: NextFunction) => {
    this.cleanupOldEntries();
    
    const clientId = this.getClientId(req);
    const now = Date.now();
    const entry = this.rateLimitMap.get(clientId);

    if (!entry || now > entry.resetTime) {
      // Create new entry
      this.rateLimitMap.set(clientId, {
        count: 1,
        resetTime: now + this.WINDOW_SIZE
      });
      next();
      return;
    }

    if (entry.count >= this.MAX_REQUESTS) {
      res.status(429).json({ 
        error: 'Too many requests',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      });
      return;
    }

    entry.count++;
    next();
  };

  private getClientId(req: Request): string {
    // Use a combination of IP and User-Agent for identification
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? (forwarded as string).split(',')[0] : req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    return `${ip}-${userAgent.substring(0, 50)}`;
  }

  validateInput = (req: Request, res: Response, next: NextFunction) => {
    // Sanitize common XSS attempts
    const sanitizeValue = (value: any): any => {
      if (typeof value === 'string') {
        // Remove potentially dangerous characters
        return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                   .replace(/javascript:/gi, '')
                   .replace(/on\w+\s*=\s*["\'][^"\']*["\']/gi, '');
      }
      if (typeof value === 'object' && value !== null) {
        const sanitized: any = Array.isArray(value) ? [] : {};
        for (const key in value) {
          sanitized[key] = sanitizeValue(value[key]);
        }
        return sanitized;
      }
      return value;
    };

    if (req.body) {
      req.body = sanitizeValue(req.body);
    }
    
    if (req.query) {
      req.query = sanitizeValue(req.query);
    }

    next();
  };

  corsHeaders = (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }

    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    
    next();
  };

  // Specific rate limiting for order creation (more restrictive)
  orderCreationLimiter = (req: Request, res: Response, next: NextFunction) => {
    const clientId = this.getClientId(req);
    const now = Date.now();
    const windowSize = 5 * 60 * 1000; // 5 minutes
    const maxOrders = 3; // max 3 orders per 5 minutes
    
    const key = `order_${clientId}`;
    const entry = this.rateLimitMap.get(key);

    if (!entry || now > entry.resetTime) {
      this.rateLimitMap.set(key, {
        count: 1,
        resetTime: now + windowSize
      });
      next();
      return;
    }

    if (entry.count >= maxOrders) {
      res.status(429).json({
        error: 'Order creation rate limit exceeded. Please wait before creating another order.',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      });
      return;
    }

    entry.count++;
    next();
  };
}

export const security = new SecurityMiddleware();