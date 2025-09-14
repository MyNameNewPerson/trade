import type { Request, Response, NextFunction } from 'express';
import type { User } from '@shared/schema';
import { storage } from '../storage';

export interface AuthRequest extends Request {
  user?: User;
}

// Middleware to check if user is authenticated via Replit Auth
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check if user is authenticated via session (Replit Auth)
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Get user data from session
  const sessionUser = req.user as any;
  if (!sessionUser?.claims?.sub) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  try {
    // Fetch user from database using Replit ID
    const userId = sessionUser.claims.sub.toString();
    const dbUser = await storage.getUser(userId);
    
    if (!dbUser || !dbUser.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Attach user to request
    req.user = dbUser;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to require admin role
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

// Middleware to require any authenticated user
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  next();
};

// Legacy middleware for backward compatibility (using session-based auth)
export const isAuthenticated = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const sessionUser = req.user as any;
  if (!sessionUser?.claims?.sub) {
    return res.status(401).json({ message: 'Invalid session' });
  }

  try {
    const userId = sessionUser.claims.sub.toString();
    const dbUser = await storage.getUser(userId);
    
    if (!dbUser || !dbUser.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    req.user = dbUser;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};