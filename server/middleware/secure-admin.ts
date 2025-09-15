import type { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from './auth';
import { randomUUID } from 'crypto';
import { storage } from '../storage';
import { CryptoService } from '../services/crypto';

interface SecureSession {
  id: string;
  adminId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: number;
  expiresAt: number;
  permissions: string[];
}

interface RateLimit {
  attempts: number;
  lastAttempt: number;
  blockedUntil?: number;
}

// In-memory storage for secure sessions (could be moved to Redis in production)
const secureSessions = new Map<string, SecureSession>();
const rateLimits = new Map<string, RateLimit>();

const SESSION_DURATION = 15 * 60 * 1000; // 15 минут
const MAX_ATTEMPTS = 3;
const BLOCK_DURATION = 30 * 60 * 1000; // 30 минут блокировки

export class SecureAdminService {
  // Очистить просроченные сессии
  static cleanupExpiredSessions() {
    const now = Date.now();
    for (const [sessionId, session] of Array.from(secureSessions.entries())) {
      if (session.expiresAt < now) {
        secureSessions.delete(sessionId);
      }
    }
  }

  // Проверить rate limit
  static checkRateLimit(identifier: string): { allowed: boolean; remainingTime?: number } {
    const now = Date.now();
    const limit = rateLimits.get(identifier);

    if (limit?.blockedUntil && limit.blockedUntil > now) {
      return { 
        allowed: false, 
        remainingTime: Math.ceil((limit.blockedUntil - now) / 1000) 
      };
    }

    if (!limit || now - limit.lastAttempt > 60000) { // Сброс через 1 минуту
      rateLimits.set(identifier, { attempts: 1, lastAttempt: now });
      return { allowed: true };
    }

    if (limit.attempts >= MAX_ATTEMPTS) {
      // Блокируем на 30 минут
      limit.blockedUntil = now + BLOCK_DURATION;
      rateLimits.set(identifier, limit);
      return { 
        allowed: false, 
        remainingTime: Math.ceil(BLOCK_DURATION / 1000) 
      };
    }

    limit.attempts++;
    limit.lastAttempt = now;
    rateLimits.set(identifier, limit);
    return { allowed: true };
  }

  // Создать защищенную сессию
  static async createSecureSession(
    adminId: string, 
    ipAddress: string, 
    userAgent: string,
    permissions: string[] = ['telegram_view']
  ): Promise<string> {
    this.cleanupExpiredSessions();

    const sessionId = randomUUID();
    const session: SecureSession = {
      id: sessionId,
      adminId,
      ipAddress,
      userAgent,
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_DURATION,
      permissions
    };

    secureSessions.set(sessionId, session);

    // Логируем создание сессии
    await storage.createAdminLog({
      adminId,
      action: 'create_secure_session',
      target: 'telegram',
      description: `Created secure session for Telegram access`,
      metadata: { sessionId, permissions, ipAddress },
      ipAddress,
      userAgent
    });

    return sessionId;
  }

  // Проверить защищенную сессию
  static validateSecureSession(
    sessionId: string, 
    adminId: string, 
    ipAddress: string, 
    requiredPermission: string
  ): { valid: boolean; session?: SecureSession; reason?: string } {
    this.cleanupExpiredSessions();

    const session = secureSessions.get(sessionId);
    if (!session) {
      return { valid: false, reason: 'Session not found' };
    }

    if (session.expiresAt < Date.now()) {
      secureSessions.delete(sessionId);
      return { valid: false, reason: 'Session expired' };
    }

    if (session.adminId !== adminId) {
      return { valid: false, reason: 'Session belongs to different admin' };
    }

    // Проверяем IP (можно сделать более гибкой)
    if (session.ipAddress !== ipAddress) {
      return { valid: false, reason: 'IP address mismatch' };
    }

    if (!session.permissions.includes(requiredPermission)) {
      return { valid: false, reason: 'Insufficient permissions' };
    }

    return { valid: true, session };
  }

  // Отозвать сессию
  static revokeSession(sessionId: string): boolean {
    return secureSessions.delete(sessionId);
  }

  // Получить активные сессии админа
  static getAdminSessions(adminId: string): SecureSession[] {
    this.cleanupExpiredSessions();
    return Array.from(secureSessions.values()).filter(s => s.adminId === adminId);
  }
}

// Middleware для проверки пароля администратора
export const requireAdminPassword = (requiredPermission: string = 'telegram_view') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { adminPassword, secureSessionId } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const rateLimitKey = `${req.user.id}_${clientIP}`;

    // Проверяем rate limit
    const rateCheck = SecureAdminService.checkRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      await storage.createAdminLog({
        adminId: req.user.id,
        action: 'rate_limit_exceeded',
        target: 'telegram',
        description: `Rate limit exceeded for secure access`,
        metadata: { remainingTime: rateCheck.remainingTime },
        ipAddress: clientIP,
        userAgent
      });

      return res.status(429).json({ 
        error: 'Too many attempts', 
        remainingTime: rateCheck.remainingTime 
      });
    }

    // Если есть активная сессия, проверяем её
    if (secureSessionId) {
      const validation = SecureAdminService.validateSecureSession(
        secureSessionId, 
        req.user.id, 
        clientIP, 
        requiredPermission
      );

      if (validation.valid) {
        // Продлеваем сессию на каждое использование
        validation.session!.expiresAt = Date.now() + SESSION_DURATION;
        return next();
      } else {
        // Логируем неудачную попытку использования сессии
        await storage.createAdminLog({
          adminId: req.user.id,
          action: 'invalid_secure_session',
          target: 'telegram',
          description: `Invalid secure session: ${validation.reason}`,
          metadata: { sessionId: secureSessionId, reason: validation.reason },
          ipAddress: clientIP,
          userAgent
        });
      }
    }

    // Требуем пароль для создания новой сессии
    if (!adminPassword) {
      return res.status(400).json({ 
        error: 'Admin password required for secure access',
        requirePassword: true
      });
    }

    // Проверяем пароль (в реальном приложении должен быть хеширован)
    try {
      const user = await storage.getUserByEmail(req.user.email!);
      if (!user || !user.password) {
        await storage.createAdminLog({
          adminId: req.user.id,
          action: 'password_verification_failed',
          target: 'telegram',
          description: 'Admin password not set or user not found',
          ipAddress: clientIP,
          userAgent
        });

        return res.status(400).json({ 
          error: 'Admin password not configured' 
        });
      }

      const bcrypt = await import('bcryptjs');
      const passwordValid = await bcrypt.compare(adminPassword, user.password);

      if (!passwordValid) {
        await storage.createAdminLog({
          adminId: req.user.id,
          action: 'invalid_admin_password',
          target: 'telegram',
          description: 'Invalid admin password provided for secure access',
          ipAddress: clientIP,
          userAgent
        });

        return res.status(401).json({ 
          error: 'Invalid admin password' 
        });
      }

      // Создаем защищенную сессию
      const permissions = [requiredPermission];
      if (requiredPermission === 'telegram_view') {
        permissions.push('telegram_manage'); // Можно просматривать и управлять
      }

      const sessionId = await SecureAdminService.createSecureSession(
        req.user.id,
        clientIP,
        userAgent,
        permissions
      );

      // Добавляем sessionId в ответ
      res.locals.secureSessionId = sessionId;
      next();

    } catch (error) {
      console.error('Admin password verification error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// Middleware для проверки защищенной сессии
export const requireSecureSession = (requiredPermission: string = 'telegram_view') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { secureSessionId } = req.query;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    if (!secureSessionId) {
      return res.status(401).json({ 
        error: 'Secure session required',
        requireSecureAuth: true 
      });
    }

    const validation = SecureAdminService.validateSecureSession(
      secureSessionId as string,
      req.user.id,
      clientIP,
      requiredPermission
    );

    if (!validation.valid) {
      await storage.createAdminLog({
        adminId: req.user.id,
        action: 'invalid_secure_session',
        target: 'telegram',
        description: `Invalid secure session: ${validation.reason}`,
        metadata: { sessionId: secureSessionId, reason: validation.reason },
        ipAddress: clientIP,
        userAgent: req.get('User-Agent') || 'unknown'
      });

      return res.status(401).json({ 
        error: 'Invalid secure session',
        reason: validation.reason,
        requireSecureAuth: true 
      });
    }

    // Продлеваем сессию
    validation.session!.expiresAt = Date.now() + SESSION_DURATION;
    next();
  };
};

// Cleanup job - запускать каждые 5 минут
setInterval(() => {
  SecureAdminService.cleanupExpiredSessions();
}, 5 * 60 * 1000);