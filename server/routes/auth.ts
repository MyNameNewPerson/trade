import { Router, type Request, type Response, type RequestHandler } from 'express';
import { type AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth';
import { storage } from '../storage';
import { registerSchema } from '@shared/schema';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { emailService } from '../services/email';

const authRouter = Router();

// Unified user endpoint - works with both Replit Auth and OAuth
authRouter.get('/user', (async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is authenticated via session
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user data from session (works for both Replit Auth and OAuth)
    const sessionUser = req.user as any;
    if (!sessionUser?.claims?.sub) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Fetch user from database
    const userId = sessionUser.claims.sub.toString();
    const dbUser = await storage.getUser(userId);
    
    if (!dbUser || !dbUser.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Return user data in format expected by frontend
    res.json({
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      profileImageUrl: dbUser.profileImageUrl,
      role: dbUser.role,
      isActive: dbUser.isActive,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}) as RequestHandler);

// Get current user info (via Replit Auth session) - legacy endpoint
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

// Login with email and password
authRouter.post('/login', (async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    // Find user by email
    const user = await storage.getUserByEmail(email);

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Check if account is activated
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account not activated. Please check your email and activate your account first.',
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Create session object compatible with existing auth system
    const sessionUser = {
      claims: {
        sub: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        profile_image_url: user.profileImageUrl,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
      },
      provider: 'local'
    };

    // Store user in session (compatible with passport session)
    req.login(sessionUser, (err) => {
      if (err) {
        console.error('Session creation error:', err);
        return res.status(500).json({
          success: false,
          error: 'Login failed. Please try again.',
        });
      }

      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
        },
      });
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.',
    });
  }
}) as RequestHandler);

// Register new user with email confirmation
authRouter.post('/register', (async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = registerSchema.parse(req.body);
    const { login, email, password } = validatedData;

    // Check if user with this email or login already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        error: 'User with this email already exists' 
      });
    }

    // Hash password with salt rounds 12 (2025 best practice)
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user with inactive status
    const newUser = await storage.createUser({
      email,
      password: hashedPassword,
      firstName: login, // Use login as firstName for now
      lastName: null,
      profileImageUrl: null,
      role: 'user',
      isActive: false,
    });

    // Generate activation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store activation token
    await storage.createEmailToken({
      userId: newUser.id,
      token,
      expiresAt,
    });

    // Send activation email
    const emailSent = await emailService.sendActivationEmail(email, login, token);
    
    if (!emailSent) {
      console.warn(`⚠️  Registration completed but activation email could not be sent to ${email}`);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to activate your account.',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        isActive: newUser.isActive,
      },
      emailSent,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed. Please try again.',
    });
  }
}) as RequestHandler);

// Activate user account with email token
authRouter.get('/activate', (async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Activation token is required',
      });
    }

    // Find the email token
    const emailToken = await storage.getEmailToken(token);

    if (!emailToken) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired activation token',
      });
    }

    // Check if token has expired
    if (new Date() > new Date(emailToken.expiresAt)) {
      // Clean up expired token
      await storage.deleteEmailToken(token);
      return res.status(400).json({
        success: false,
        error: 'Activation token has expired. Please register again.',
      });
    }

    // Activate the user
    const activated = await storage.activateUser(emailToken.userId);

    if (!activated) {
      return res.status(500).json({
        success: false,
        error: 'Failed to activate account. Please try again.',
      });
    }

    // Clean up the used token
    await storage.deleteEmailToken(token);

    // Get user info to return
    const user = await storage.getUser(emailToken.userId);

    res.json({
      success: true,
      message: 'Account activated successfully! You can now log in.',
      user: user ? {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        isActive: user.isActive,
      } : null,
    });

  } catch (error) {
    console.error('Account activation error:', error);
    res.status(500).json({
      success: false,
      error: 'Account activation failed. Please try again.',
    });
  }
}) as RequestHandler);

export { authRouter };