import type { Express } from "express";
import { authRouter } from './routes/auth';
import { adminRouter } from './routes/admin';
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { createOrderSchema } from "@shared/schema";
import { z } from "zod";
import { security } from "./middleware/security";
import { setupAuth as setupReplitAuth, isAuthenticated as isReplitAuthenticated, requireAdmin as requireReplitAdmin } from "./replitAuth";
import { setupLocalAuth, isAuthenticated as isLocalAuthenticated, requireAdmin as requireLocalAdmin } from "./auth/local";
import { setupOAuthProviders } from "./oauthProviders";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Determine auth provider based on environment
  const useReplitAuth = process.env.AUTH_PROVIDER === 'replit' && process.env.REPLIT_DOMAINS;
  
  // Setup authentication based on environment
  let isAuthenticated, requireAdmin;
  if (useReplitAuth) {
    console.log('🔐 Using Replit authentication');
    await setupReplitAuth(app);
    isAuthenticated = isReplitAuthenticated;
    requireAdmin = requireReplitAdmin;
  } else {
    console.log('🔐 Using local authentication');
    await setupLocalAuth(app);
    isAuthenticated = isLocalAuthenticated;
    requireAdmin = requireLocalAdmin;
  }
  
  // Setup OAuth providers (Google, GitHub)
  const baseUrl = process.env.APP_BASE_URL || 
    (process.env.NODE_ENV === 'production' 
      ? `https://${process.env.HOSTNAME || 'localhost'}` 
      : 'http://localhost:5000');
  setupOAuthProviders(app, baseUrl);
  
  // Apply security middleware
  app.use(security.corsHeaders);
  app.use('/api', security.rateLimiter);
  app.use('/api', security.validateInput);
  
  // WebSocket server for real-time rate updates
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    perMessageDeflate: false,
    maxPayload: 1024 * 1024, // 1MB
  });
  
  // Store connected clients with connection info
  const clients = new Map<WebSocket, { id: string; connectedAt: Date }>();
  
  wss.on('connection', (ws, req) => {
    const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    clients.set(ws, { id: clientId, connectedAt: new Date() });
    
    console.log(`WebSocket client connected: ${clientId} (${clients.size} total)`);
    
    // Send initial rates with error handling
    storage.getLatestRates()
      .then(rates => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'rates_update',
            data: rates,
            timestamp: new Date().toISOString()
          }));
        }
      })
      .catch(error => {
        console.error('Error sending initial rates to client:', error);
      });
    
    // Heartbeat ping every 30 seconds to keep connection alive
    const heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);
    
    ws.on('pong', () => {
      // Client responded to ping - connection is alive
    });
    
    ws.on('close', (code, reason) => {
      clearInterval(heartbeatInterval);
      const clientInfo = clients.get(ws);
      clients.delete(ws);
      console.log(`WebSocket client disconnected: ${clientInfo?.id || 'unknown'} (code: ${code}, reason: ${reason?.toString() || 'none'}) (${clients.size} remaining)`);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket client error:', error);
      clearInterval(heartbeatInterval);
      const clientInfo = clients.get(ws);
      clients.delete(ws);
      if (clientInfo) {
        console.log(`Removed error client: ${clientInfo.id}`);
      }
    });
  });

  // Broadcast rate updates to all connected clients with error handling
  const broadcastRateUpdate = (rates: any[]) => {
    if (clients.size === 0) return; // No clients to broadcast to
    
    const message = JSON.stringify({
      type: 'rates_update',
      data: rates,
      timestamp: new Date().toISOString()
    });
    
    const deadClients: WebSocket[] = [];
    
    clients.forEach((clientInfo, client) => {
      try {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        } else {
          deadClients.push(client);
        }
      } catch (error) {
        console.error(`Error sending message to client ${clientInfo.id}:`, error);
        deadClients.push(client);
      }
    });
    
    // Clean up dead connections
    deadClients.forEach(client => {
      const clientInfo = clients.get(client);
      clients.delete(client);
      if (clientInfo) {
        console.log(`Cleaned up dead client: ${clientInfo.id}`);
      }
    });
  };

  // Sync WebSocket broadcasts with storage update interval to avoid unnecessary overhead
  // Broadcast cached rates to WebSocket clients every 15 minutes (matches storage interval)
  setInterval(async () => {
    if (clients.size === 0) {
      console.log('Skipping WebSocket broadcast - no connected clients');
      return;
    }
    
    try {
      const rates = await storage.getLatestRates(); // This uses cache, no API calls
      broadcastRateUpdate(rates);
      console.log(`Broadcasted rate updates to ${clients.size} WebSocket clients`);
    } catch (error) {
      console.error('Error broadcasting cached rates:', error);
    }
  }, 900000); // 15 minutes - sync with storage update interval for efficiency

  // API Routes
  
  // Authentication routes
  app.use('/api/auth', authRouter);
  
  // Admin routes
  app.use('/api/admin', adminRouter);
  
  // Get supported currencies
  app.get('/api/currencies', async (req, res) => {
    try {
      const currencies = await storage.getCurrencies();
      res.json(currencies);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch currencies' });
    }
  });

  // Get exchange rates (uses cache - no API calls)
  app.get('/api/rates', async (req, res) => {
    try {
      const rates = await storage.getLatestRates(); // Returns cached rates
      res.set('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
      res.json(rates);
    } catch (error) {
      console.error('Error fetching rates:', error);
      res.status(500).json({ error: 'Failed to fetch rates' });
    }
  });

  // Get specific exchange rate (with currency validation)
  app.get('/api/rates/:from/:to', async (req, res) => {
    try {
      const { from, to } = req.params;
      
      // Validate currencies exist and are active
      const [fromCurrency, toCurrency] = await Promise.all([
        storage.getCurrency(from),
        storage.getCurrency(to)
      ]);
      
      if (!fromCurrency || !fromCurrency.isActive) {
        return res.status(400).json({ error: `Invalid or inactive currency: ${from}` });
      }
      
      if (!toCurrency || !toCurrency.isActive) {
        return res.status(400).json({ error: `Invalid or inactive currency: ${to}` });
      }
      
      const rate = await storage.getExchangeRate(from, to);
      
      if (!rate) {
        return res.status(404).json({ error: 'Exchange rate not found' });
      }
      
      res.set('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
      res.json(rate);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch exchange rate' });
    }
  });

  // Create new order
  app.post('/api/orders', security.orderCreationLimiter, async (req, res) => {
    try {
      const validatedData = createOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);
      
      // Broadcast new order to WebSocket clients
      const message = JSON.stringify({
        type: 'new_order',
        data: order
      });
      
      clients.forEach((clientInfo, client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
      
      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Order validation error:', error.errors);
        res.status(400).json({ error: 'Invalid request data', details: error.errors });
      } else {
        console.error('Order creation error:', error);
        res.status(500).json({ error: 'Failed to create order' });
      }
    }
  });

  // Get order by ID
  app.get('/api/orders/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  });

  // Update order status (admin endpoint)
  app.patch('/api/orders/:id/status', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, txHash, payoutTxHash } = req.body;
      
      const updates: any = {};
      if (txHash) updates.txHash = txHash;
      if (payoutTxHash) updates.payoutTxHash = payoutTxHash;
      
      const order = await storage.updateOrderStatus(id, status, updates);
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      // Broadcast order update
      const message = JSON.stringify({
        type: 'order_update',
        data: order
      });
      
      clients.forEach((clientInfo, client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update order' });
    }
  });

  // Get user orders (authenticated user endpoint)
  app.get('/api/orders/user', isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user?.id) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const orders = await storage.getUserOrders(user.id);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user orders' });
    }
  });

  // Get all orders (admin endpoint)
  app.get('/api/admin/orders', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  // Create KYC request (with rate limiting and validation)
  app.post('/api/kyc', security.kycRateLimiter, async (req, res) => {
    try {
      const { orderId, documentType } = req.body;
      
      // Validate the order exists
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      // Check if KYC request already exists
      const existingKyc = await storage.getKycRequest(orderId);
      if (existingKyc) {
        return res.status(409).json({ error: 'KYC request already exists for this order' });
      }
      
      const kycRequest = await storage.createKycRequest({
        orderId,
        status: 'pending',
        documentType,
        reason: null,
        documentUrl: null
      });
      
      res.json(kycRequest);
    } catch (error) {
      console.error('Error creating KYC request:', error);
      res.status(500).json({ error: 'Failed to create KYC request' });
    }
  });

  // Get KYC request by order ID
  app.get('/api/kyc/:orderId', async (req, res) => {
    try {
      const { orderId } = req.params;
      const kycRequest = await storage.getKycRequest(orderId);
      
      if (!kycRequest) {
        return res.status(404).json({ error: 'KYC request not found' });
      }
      
      res.json(kycRequest);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch KYC request' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // Readiness check endpoint
  app.get('/api/ready', async (req, res) => {
    try {
      // Check database connectivity
      await storage.getCurrencies();
      
      res.json({ 
        status: 'ready', 
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          storage: 'initialized'
        }
      });
    } catch (error) {
      console.error('Readiness check failed:', error);
      res.status(503).json({ 
        status: 'not_ready', 
        timestamp: new Date().toISOString(),
        error: 'Database connection failed'
      });
    }
  });

  return httpServer;
}
