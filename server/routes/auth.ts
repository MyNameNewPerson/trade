import { Router, type Request, type Response, type RequestHandler } from 'express';
import { type AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth';
import { storage } from '../storage';

const authRouter = Router();

// Get current user info (via Replit Auth session)
authRouter.get('/me', authenticateToken as RequestHandler, ((req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    user: {
      id: req.user!.id,
      email: req.user!.email,
      firstName: req.user!.firstName,
      lastName: req.user!.lastName,
      profileImageUrl: req.user!.profileImageUrl,
      role: req.user!.role,
      isActive: req.user!.isActive,
    },
  });
}) as RequestHandler);

// Verify current session
authRouter.get('/verify', authenticateToken as RequestHandler, ((req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    user: {
      id: req.user!.id,
      email: req.user!.email,
      firstName: req.user!.firstName,
      lastName: req.user!.lastName,
      role: req.user!.role,
    },
  });
}) as RequestHandler);

// Update user role (admin only)
authRouter.patch('/users/:id/role', authenticateToken as RequestHandler, requireAdmin as RequestHandler, (async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be "admin" or "user"',
      });
    }

    const updatedUser = await storage.updateUser(id, { role });
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      },
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}) as RequestHandler);

// Get all users (admin only)
authRouter.get('/users', authenticateToken as RequestHandler, requireAdmin as RequestHandler, (async (req: AuthRequest, res: Response) => {
  try {
    // Note: This would need to be implemented in storage if we need to list all users
    // For now, return the current user as an array
    res.json({
      success: true,
      users: [{
        id: req.user!.id,
        email: req.user!.email,
        firstName: req.user!.firstName,
        lastName: req.user!.lastName,
        role: req.user!.role,
        isActive: req.user!.isActive,
        createdAt: req.user!.createdAt,
      }],
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}) as RequestHandler);

// Update user status (admin only)
authRouter.patch('/users/:id/status', authenticateToken as RequestHandler, requireAdmin as RequestHandler, (async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be boolean',
      });
    }

    const updatedUser = await storage.updateUser(id, { isActive });
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      },
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}) as RequestHandler);

export { authRouter };