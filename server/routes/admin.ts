import { Router, type Response, type RequestHandler } from 'express';
import { AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth';
import { updateWalletSchema, updateSettingSchema } from '@shared/schema';
import { storage } from '../storage';
import { z } from 'zod';

const adminRouter = Router();

// Apply authentication middleware to all admin routes
adminRouter.use(authenticateToken as RequestHandler);
adminRouter.use(requireAdmin as RequestHandler);

// Get wallet settings
adminRouter.get('/wallets', (async (req: AuthRequest, res: Response) => {
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
adminRouter.post('/wallets', (async (req: AuthRequest, res: Response) => {
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
}) as RequestHandler);

// Get platform settings
adminRouter.get('/settings', (async (req: AuthRequest, res: Response) => {
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
adminRouter.post('/settings', (async (req: AuthRequest, res: Response) => {
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
}) as RequestHandler);

// Get system status
adminRouter.get('/status', (async (req: AuthRequest, res: Response) => {
  try {
    const stats = {
      orders: {
        total: (await storage.getOrders()).length,
        pending: (await storage.getOrders()).filter(o => o.status === 'awaiting_deposit').length,
        completed: (await storage.getOrders()).filter(o => o.status === 'completed').length,
      },
      wallets: {
        configured: (await storage.getWalletSettings()).length,
      },
      settings: {
        configured: (await storage.getPlatformSettings()).length,
      }
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}) as RequestHandler);

export { adminRouter };