import type { RequestHandler } from 'express';
import { storage } from '../storage';
import type { InsertAdminLog } from '@shared/schema';

export interface AdminActionRequest extends Request {
  user?: any;
  adminAction?: {
    action: string;
    target: string;
    targetId?: string;
    description: string;
    metadata?: any;
  };
}

export const logAdminAction = (
  action: string,
  target: string,
  description: string
): RequestHandler => {
  return async (req: AdminActionRequest & any, res, next) => {
    // Store action details for later logging
    req.adminAction = {
      action,
      target,
      description,
      metadata: {
        method: req.method,
        path: req.path,
        body: req.body,
        params: req.params,
        query: req.query
      }
    };

    // Continue to the actual route handler
    next();
  };
};

export const executeAdminLog: RequestHandler = async (req: AdminActionRequest & any, res, next) => {
  const originalSend = res.send;
  
  // Override res.send to capture response and log action
  res.send = function(data: any) {
    // Only log if action was successful (not an error response)
    if (req.adminAction && res.statusCode >= 200 && res.statusCode < 300) {
      const user = req.user;
      if (user?.claims?.sub) {
        const logData: InsertAdminLog = {
          adminId: user.claims.sub.toString(),
          action: req.adminAction.action,
          target: req.adminAction.target,
          targetId: req.adminAction.targetId || req.params.id || null,
          description: req.adminAction.description,
          metadata: {
            ...req.adminAction.metadata,
            responseStatus: res.statusCode,
            timestamp: new Date().toISOString()
          },
          ipAddress: req.ip || req.connection.remoteAddress || null,
          userAgent: req.get('User-Agent') || null
        };

        // Log asynchronously to not block response
        storage.createAdminLog(logData).catch(error => {
          console.error('Failed to log admin action:', error);
        });
      }
    }

    // Call original send method
    return originalSend.call(this, data);
  };

  next();
};

// Helper function to update targetId after creation
export const updateAdminLogTargetId = (req: AdminActionRequest & any, targetId: string) => {
  if (req.adminAction) {
    req.adminAction.targetId = targetId;
  }
};

// Predefined action descriptions for consistency
export const AdminActions = {
  // User actions
  CREATE_USER: 'create_user',
  UPDATE_USER: 'update_user', 
  DEACTIVATE_USER: 'deactivate_user',
  ACTIVATE_USER: 'activate_user',
  
  // Wallet actions
  CREATE_WALLET: 'create_wallet',
  UPDATE_WALLET: 'update_wallet',
  DELETE_WALLET: 'delete_wallet',
  
  // Currency actions
  CREATE_CURRENCY: 'create_currency',
  UPDATE_CURRENCY: 'update_currency',
  DELETE_CURRENCY: 'delete_currency',
  
  // Telegram actions
  CREATE_TELEGRAM_CONFIG: 'create_telegram_config',
  UPDATE_TELEGRAM_CONFIG: 'update_telegram_config',
  DELETE_TELEGRAM_CONFIG: 'delete_telegram_config',
  
  // Exchange method actions
  CREATE_EXCHANGE_METHOD: 'create_exchange_method',
  UPDATE_EXCHANGE_METHOD: 'update_exchange_method',
  DELETE_EXCHANGE_METHOD: 'delete_exchange_method',
  
  // Settings actions
  UPDATE_PLATFORM_SETTING: 'update_platform_setting'
} as const;

export const AdminTargets = {
  USER: 'user',
  WALLET: 'wallet',
  CURRENCY: 'currency',
  TELEGRAM: 'telegram',
  EXCHANGE_METHOD: 'exchange_method',
  PLATFORM_SETTING: 'platform_setting'
} as const;