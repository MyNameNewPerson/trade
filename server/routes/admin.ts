import { Router, type Response, type RequestHandler } from 'express';
import { type AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth';
import { logAdminAction, executeAdminLog, updateAdminLogTargetId, AdminActions, AdminTargets } from '../middleware/admin-logger';
import { 
  updateWalletSchema, 
  updateSettingSchema, 
  adminCreateUserSchema, 
  adminUpdateUserSchema,
  createTelegramConfigSchema,
  createExchangeMethodSchema,
  insertCurrencySchema
} from '@shared/schema';
import { storage } from '../storage';
import { z } from 'zod';

const adminRouter = Router();

// Apply authentication middleware to all admin routes
adminRouter.use(authenticateToken as RequestHandler);
adminRouter.use(requireAdmin as RequestHandler);
adminRouter.use(executeAdminLog);

// =====================
// DASHBOARD & STATS
// =====================

// Get admin stats for dashboard
adminRouter.get('/stats',
  logAdminAction('view_stats', AdminTargets.PLATFORM_SETTING, 'Admin viewed platform stats'),
  (async (req: AuthRequest, res: Response) => {
  try {
    const stats = await storage.getAdminStats();
    res.json(stats);
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}) as RequestHandler);

// Get dashboard data (stats + recent activity)
adminRouter.get('/dashboard',
  logAdminAction('view_dashboard', AdminTargets.PLATFORM_SETTING, 'Admin viewed dashboard'),
  (async (req: AuthRequest, res: Response) => {
  try {
    const [stats, recentLogs, recentOrders] = await Promise.all([
      storage.getAdminStats(),
      storage.getAdminLogs(1, 10), // Recent 10 admin actions
      storage.getOrders() // Will be limited to recent orders in implementation
    ]);

    res.json({
      stats,
      recentActivity: recentLogs.logs,
      recentOrders: recentOrders.slice(0, 5) // Last 5 orders
    });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}) as RequestHandler);

// =====================
// USERS MANAGEMENT
// =====================

// Get all users with pagination
adminRouter.get('/users',
  logAdminAction('list_users', AdminTargets.USER, 'Admin viewed users list'),
  (async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;

    const result = await storage.getAllUsers(page, limit, search);
    res.json(result);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}) as RequestHandler);

// Get specific user
adminRouter.get('/users/:id',
  logAdminAction('view_user', AdminTargets.USER, 'Admin viewed user details'),
  (async (req: AuthRequest, res: Response) => {
  try {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}) as RequestHandler);

// Create new user
adminRouter.post('/users', 
  logAdminAction(AdminActions.CREATE_USER, AdminTargets.USER, 'Admin created new user'),
  (async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = adminCreateUserSchema.parse(req.body);
      
      const newUser = await storage.adminCreateUser(validatedData);
      updateAdminLogTargetId(req, newUser.id);
      
      res.status(201).json(newUser);
    } catch (error) {
      console.error('Create user error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input data',
          details: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }) as RequestHandler
);

// Update user
adminRouter.put('/users/:id',
  logAdminAction(AdminActions.UPDATE_USER, AdminTargets.USER, 'Admin updated user'),
  (async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = adminUpdateUserSchema.parse(req.body);
      
      const updatedUser = await storage.adminUpdateUser(req.params.id, validatedData);
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input data',
          details: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }) as RequestHandler
);

// Deactivate user
adminRouter.delete('/users/:id',
  logAdminAction(AdminActions.DEACTIVATE_USER, AdminTargets.USER, 'Admin deactivated user'),
  (async (req: AuthRequest, res: Response) => {
    try {
      const success = await storage.deactivateUser(req.params.id);
      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Deactivate user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }) as RequestHandler
);

// =====================
// TELEGRAM MANAGEMENT
// =====================

// Get telegram configs
adminRouter.get('/telegram-configs',
  logAdminAction('list_telegram_configs', AdminTargets.TELEGRAM, 'Admin viewed telegram configs'),
  (async (req: AuthRequest, res: Response) => {
  try {
    const configs = await storage.getTelegramConfigs();
    res.json(configs);
  } catch (error) {
    console.error('Get telegram configs error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}) as RequestHandler);

// Create telegram config
adminRouter.post('/telegram-configs',
  logAdminAction(AdminActions.CREATE_TELEGRAM_CONFIG, AdminTargets.TELEGRAM, 'Admin created telegram config'),
  (async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = createTelegramConfigSchema.parse(req.body);
      
      const newConfig = await storage.createTelegramConfig(validatedData, req.user!.id);
      updateAdminLogTargetId(req, newConfig.id);
      
      res.status(201).json(newConfig);
    } catch (error) {
      console.error('Create telegram config error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input data',
          details: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }) as RequestHandler
);

// Update telegram config
adminRouter.put('/telegram-configs/:id',
  logAdminAction(AdminActions.UPDATE_TELEGRAM_CONFIG, AdminTargets.TELEGRAM, 'Admin updated telegram config'),
  (async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = createTelegramConfigSchema.partial().parse(req.body);
      
      const updatedConfig = await storage.updateTelegramConfig(req.params.id, validatedData);
      if (!updatedConfig) {
        return res.status(404).json({
          success: false,
          error: 'Telegram config not found',
        });
      }

      res.json(updatedConfig);
    } catch (error) {
      console.error('Update telegram config error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input data',
          details: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }) as RequestHandler
);

// Delete telegram config
adminRouter.delete('/telegram-configs/:id',
  logAdminAction(AdminActions.DELETE_TELEGRAM_CONFIG, AdminTargets.TELEGRAM, 'Admin deleted telegram config'),
  (async (req: AuthRequest, res: Response) => {
    try {
      const success = await storage.deleteTelegramConfig(req.params.id);
      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Telegram config not found',
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Delete telegram config error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }) as RequestHandler
);

// =====================
// WALLETS MANAGEMENT  
// =====================

// Get wallet settings
adminRouter.get('/wallets',
  logAdminAction('list_wallets', AdminTargets.WALLET, 'Admin viewed wallet settings'),
  (async (req: AuthRequest, res: Response) => {
  try {
    const wallets = await storage.getWalletSettings();
    res.json(wallets);
  } catch (error) {
    console.error('Get wallets error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}) as RequestHandler);

// Create or update wallet setting
adminRouter.post('/wallets',
  logAdminAction(AdminActions.CREATE_WALLET, AdminTargets.WALLET, 'Admin created/updated wallet setting'),
  (async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = updateWalletSchema.parse(req.body);
      
      // Check if wallet already exists
      const existing = await storage.getWalletSetting(validatedData.currency);
      
      if (existing) {
        // Update existing wallet
        const updated = await storage.updateWalletSetting(existing.id, {
          address: validatedData.address,
          network: validatedData.network,
          isActive: validatedData.isActive,
        });
        updateAdminLogTargetId(req, existing.id);
        res.json(updated);
      } else {
        // Create new wallet setting
        const newWallet = await storage.createWalletSetting({
          currency: validatedData.currency,
          address: validatedData.address,
          network: validatedData.network,
          isActive: validatedData.isActive,
          createdBy: req.user!.id,
        });
        updateAdminLogTargetId(req, newWallet.id);
        res.status(201).json(newWallet);
      }
    } catch (error) {
      console.error('Create/update wallet error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input data',
          details: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }) as RequestHandler
);

// Update wallet setting
adminRouter.put('/wallets/:id',
  logAdminAction(AdminActions.UPDATE_WALLET, AdminTargets.WALLET, 'Admin updated wallet setting'),
  (async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = updateWalletSchema.partial().parse(req.body);
      
      const updated = await storage.updateWalletSetting(req.params.id, validatedData);
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Wallet setting not found',
        });
      }

      res.json(updated);
    } catch (error) {
      console.error('Update wallet error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input data',
          details: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }) as RequestHandler
);

// Delete wallet setting
adminRouter.delete('/wallets/:id',
  logAdminAction(AdminActions.DELETE_WALLET, AdminTargets.WALLET, 'Admin deleted wallet setting'),
  (async (req: AuthRequest, res: Response) => {
    try {
      const success = await storage.deleteWalletSetting(req.params.id);
      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Wallet setting not found',
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Delete wallet error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }) as RequestHandler
);

// =====================
// CURRENCIES MANAGEMENT
// =====================

// Get currencies
adminRouter.get('/currencies',
  logAdminAction('list_currencies', AdminTargets.CURRENCY, 'Admin viewed currencies'),
  (async (req: AuthRequest, res: Response) => {
  try {
    const currencies = await storage.getCurrencies();
    res.json(currencies);
  } catch (error) {
    console.error('Get currencies error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}) as RequestHandler);

// Create currency
adminRouter.post('/currencies',
  logAdminAction(AdminActions.CREATE_CURRENCY, AdminTargets.CURRENCY, 'Admin created currency'),
  (async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = insertCurrencySchema.parse(req.body);
      
      const newCurrency = await storage.createCurrency(validatedData);
      updateAdminLogTargetId(req, newCurrency.id);
      
      res.status(201).json(newCurrency);
    } catch (error) {
      console.error('Create currency error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input data',
          details: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }) as RequestHandler
);

// Update currency
adminRouter.put('/currencies/:id',
  logAdminAction(AdminActions.UPDATE_CURRENCY, AdminTargets.CURRENCY, 'Admin updated currency'),
  (async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = insertCurrencySchema.partial().parse(req.body);
      
      const updated = await storage.updateCurrency(req.params.id, validatedData);
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Currency not found',
        });
      }

      res.json(updated);
    } catch (error) {
      console.error('Update currency error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input data',
          details: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }) as RequestHandler
);

// Delete currency (with usage check)
adminRouter.delete('/currencies/:id',
  logAdminAction(AdminActions.DELETE_CURRENCY, AdminTargets.CURRENCY, 'Admin deleted currency'),
  (async (req: AuthRequest, res: Response) => {
    try {
      // Check if currency is being used in orders or exchange rates
      const orders = await storage.getOrders();
      const isUsedInOrders = orders.some(order => 
        order.fromCurrency === req.params.id || order.toCurrency === req.params.id
      );

      if (isUsedInOrders) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete currency that is used in existing orders',
        });
      }

      const success = await storage.deleteCurrency(req.params.id);
      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Currency not found',
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Delete currency error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }) as RequestHandler
);

// =====================
// EXCHANGE METHODS MANAGEMENT
// =====================

// Get exchange methods
adminRouter.get('/exchange-methods',
  logAdminAction('list_exchange_methods', AdminTargets.EXCHANGE_METHOD, 'Admin viewed exchange methods'),
  (async (req: AuthRequest, res: Response) => {
  try {
    const methods = await storage.getExchangeMethods();
    res.json(methods);
  } catch (error) {
    console.error('Get exchange methods error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}) as RequestHandler);

// Create exchange method
adminRouter.post('/exchange-methods',
  logAdminAction(AdminActions.CREATE_EXCHANGE_METHOD, AdminTargets.EXCHANGE_METHOD, 'Admin created exchange method'),
  (async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = createExchangeMethodSchema.parse(req.body);
      
      const newMethod = await storage.createExchangeMethod(validatedData, req.user!.id);
      updateAdminLogTargetId(req, newMethod.id);
      
      res.status(201).json(newMethod);
    } catch (error) {
      console.error('Create exchange method error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input data',
          details: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }) as RequestHandler
);

// Update exchange method
adminRouter.put('/exchange-methods/:id',
  logAdminAction(AdminActions.UPDATE_EXCHANGE_METHOD, AdminTargets.EXCHANGE_METHOD, 'Admin updated exchange method'),
  (async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = createExchangeMethodSchema.partial().parse(req.body);
      
      const updated = await storage.updateExchangeMethod(req.params.id, validatedData);
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Exchange method not found',
        });
      }

      res.json(updated);
    } catch (error) {
      console.error('Update exchange method error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input data',
          details: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }) as RequestHandler
);

// Delete exchange method
adminRouter.delete('/exchange-methods/:id',
  logAdminAction(AdminActions.DELETE_EXCHANGE_METHOD, AdminTargets.EXCHANGE_METHOD, 'Admin deleted exchange method'),
  (async (req: AuthRequest, res: Response) => {
    try {
      const success = await storage.deleteExchangeMethod(req.params.id);
      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Exchange method not found',
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Delete exchange method error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }) as RequestHandler
);

// =====================
// PLATFORM SETTINGS
// =====================

// Get platform settings
adminRouter.get('/settings',
  logAdminAction('view_settings', AdminTargets.PLATFORM_SETTING, 'Admin viewed platform settings'),
  (async (req: AuthRequest, res: Response) => {
  try {
    const settings = await storage.getPlatformSettings();
    
    // Filter sensitive settings in response
    const safeSettings = settings.map(setting => ({
      ...setting,
      value: setting.isEncrypted ? '***ENCRYPTED***' : setting.value,
    }));
    
    res.json(safeSettings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}) as RequestHandler);

// Create or update platform setting
adminRouter.post('/settings',
  logAdminAction(AdminActions.UPDATE_PLATFORM_SETTING, AdminTargets.PLATFORM_SETTING, 'Admin updated platform setting'),
  (async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = updateSettingSchema.parse(req.body);
      
      const setting = await storage.setPlatformSetting({
        key: validatedData.key,
        value: validatedData.value,
        description: validatedData.description,
        isEncrypted: validatedData.isEncrypted,
        updatedBy: req.user!.id,
      });

      // Return safe version without sensitive data
      res.json({
        ...setting,
        value: setting.isEncrypted ? '***ENCRYPTED***' : setting.value,
      });
    } catch (error) {
      console.error('Create/update setting error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input data',
          details: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }) as RequestHandler
);

// =====================
// ADMIN LOGS
// =====================

// Get admin logs with pagination
adminRouter.get('/logs',
  logAdminAction('view_logs', AdminTargets.PLATFORM_SETTING, 'Admin viewed audit logs'),
  (async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const adminId = req.query.adminId as string;

    const result = await storage.getAdminLogs(page, limit, adminId);
    res.json(result);
  } catch (error) {
    console.error('Get admin logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}) as RequestHandler);

// Get logs for specific admin
adminRouter.get('/logs/:adminId',
  logAdminAction('view_admin_logs', AdminTargets.PLATFORM_SETTING, 'Admin viewed specific admin logs'),
  (async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await storage.getAdminLogs(page, limit, req.params.adminId);
    res.json(result);
  } catch (error) {
    console.error('Get admin logs by admin error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}) as RequestHandler);

// =====================
// ORDERS MANAGEMENT
// =====================

// Get all orders (existing endpoint but moved here for organization)
adminRouter.get('/orders',
  logAdminAction('view_orders', 'order', 'Admin viewed orders list'),
  (async (req: AuthRequest, res: Response) => {
  try {
    const orders = await storage.getOrders();
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}) as RequestHandler);

// Update order status (existing endpoint but moved here)
adminRouter.patch('/orders/:id/status',
  logAdminAction('update_order_status', 'order', 'Admin updated order status'),
  (async (req: AuthRequest, res: Response) => {
    try {
      const { status, txHash, payoutTxHash } = req.body;
      
      const updates: any = {};
      if (txHash) updates.txHash = txHash;
      if (payoutTxHash) updates.payoutTxHash = payoutTxHash;
      
      const order = await storage.updateOrderStatus(req.params.id, status, updates);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
        });
      }
      
      res.json(order);
    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }) as RequestHandler
);

export { adminRouter };