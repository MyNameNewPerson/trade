import type { Express } from "express";
import { authRouter } from './routes/auth';
import { adminRouter } from './routes/admin';
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { createOrderSchema } from "@shared/schema";
import { z } from "zod";
import { security } from "./middleware/security";
import { setupAuth, isAuthenticated, requireAdmin } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup Replit Auth
  await setupAuth(app);
  
  // Apply security middleware
  app.use(security.corsHeaders);
  app.use('/api', security.rateLimiter);
  app.use('/api', security.validateInput);
  
  // WebSocket server for real-time rate updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected to WebSocket');
    
    // Send initial rates
    storage.getLatestRates().then(rates => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'rates_update',
          data: rates
        }));
      }
    });
    
    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected from WebSocket');
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  // Broadcast rate updates to all connected clients
  const broadcastRateUpdate = (rates: any[]) => {
    const message = JSON.stringify({
      type: 'rates_update',
      data: rates
    });
    
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // Update rates from real exchanges every 30 seconds
  setInterval(async () => {
    try {
      const rates = await storage.getLatestRates();
      broadcastRateUpdate(rates);
    } catch (error) {
      console.error('Error updating rates:', error);
    }
  }, 30000);

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

  // Get exchange rates
  app.get('/api/rates', async (req, res) => {
    try {
      const rates = await storage.getLatestRates();
      res.json(rates);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch rates' });
    }
  });

  // Get specific exchange rate
  app.get('/api/rates/:from/:to', async (req, res) => {
    try {
      const { from, to } = req.params;
      const rate = await storage.getExchangeRate(from, to);
      
      if (!rate) {
        return res.status(404).json({ error: 'Exchange rate not found' });
      }
      
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
      
      clients.forEach(client => {
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
      
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update order' });
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

  // Create KYC request
  app.post('/api/kyc', async (req, res) => {
    try {
      const { orderId, documentType } = req.body;
      
      const kycRequest = await storage.createKycRequest({
        orderId,
        status: 'pending',
        documentType,
        reason: null,
        documentUrl: null
      });
      
      res.json(kycRequest);
    } catch (error) {
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
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return httpServer;
}
