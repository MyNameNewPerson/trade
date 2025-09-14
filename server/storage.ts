import { type Currency, type ExchangeRate, type Order, type KycRequest, type User, type WalletSetting, type PlatformSetting, type InsertCurrency, type InsertExchangeRate, type InsertOrder, type InsertKycRequest, type InsertUser, type UpsertUser, type InsertWalletSetting, type InsertPlatformSetting, type CreateOrderRequest } from "@shared/schema";
import { randomUUID } from "crypto";
import { exchangeRateService } from "./services/exchange-api";
import { telegramService } from "./services/telegram";

export interface IStorage {
  // Currency operations
  getCurrencies(): Promise<Currency[]>;
  getCurrency(id: string): Promise<Currency | undefined>;
  createCurrency(currency: InsertCurrency): Promise<Currency>;

  // Exchange rate operations
  getExchangeRate(fromCurrency: string, toCurrency: string): Promise<ExchangeRate | undefined>;
  getLatestRates(): Promise<ExchangeRate[]>;
  createExchangeRate(rate: InsertExchangeRate): Promise<ExchangeRate>;

  // Order operations
  createOrder(order: CreateOrderRequest): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  updateOrderStatus(id: string, status: string, updates?: Partial<Order>): Promise<Order | undefined>;
  getOrders(): Promise<Order[]>;
  getUserOrders(userId: string): Promise<Order[]>;

  // KYC operations
  createKycRequest(request: InsertKycRequest): Promise<KycRequest>;
  getKycRequest(orderId: string): Promise<KycRequest | undefined>;
  updateKycRequest(id: string, updates: Partial<KycRequest>): Promise<KycRequest | undefined>;

  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Wallet settings operations
  getWalletSettings(): Promise<WalletSetting[]>;
  getWalletSetting(currency: string): Promise<WalletSetting | undefined>;
  createWalletSetting(wallet: InsertWalletSetting): Promise<WalletSetting>;
  updateWalletSetting(id: string, updates: Partial<WalletSetting>): Promise<WalletSetting | undefined>;
  
  // Platform settings operations
  getPlatformSettings(): Promise<PlatformSetting[]>;
  getPlatformSetting(key: string): Promise<PlatformSetting | undefined>;
  setPlatformSetting(setting: InsertPlatformSetting): Promise<PlatformSetting>;
}

export class MemStorage implements IStorage {
  private currencies: Map<string, Currency> = new Map();
  private exchangeRates: Map<string, ExchangeRate> = new Map();
  private orders: Map<string, Order> = new Map();
  private kycRequests: Map<string, KycRequest> = new Map();
  private users: Map<string, User> = new Map();
  private walletSettings: Map<string, WalletSetting> = new Map();
  private platformSettings: Map<string, PlatformSetting> = new Map();

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize supported currencies
    const supportedCurrencies: Currency[] = [
      {
        id: 'btc',
        name: 'Bitcoin',
        symbol: 'BTC',
        type: 'crypto',
        network: 'BTC',
        minAmount: '0.001',
        maxAmount: '10',
        isActive: true,
        iconUrl: 'https://cryptoicons.org/api/icon/btc/200'
      },
      {
        id: 'eth',
        name: 'Ethereum',
        symbol: 'ETH',
        type: 'crypto',
        network: 'ETH',
        minAmount: '0.01',
        maxAmount: '100',
        isActive: true,
        iconUrl: 'https://cryptoicons.org/api/icon/eth/200'
      },
      {
        id: 'usdt-trc20',
        name: 'Tether TRC20',
        symbol: 'USDT',
        type: 'crypto',
        network: 'TRC20',
        minAmount: '50',
        maxAmount: '50000',
        isActive: true,
        iconUrl: 'https://cryptoicons.org/api/icon/usdt/200'
      },
      {
        id: 'usdt-erc20',
        name: 'Tether ERC20',
        symbol: 'USDT',
        type: 'crypto',
        network: 'ERC20',
        minAmount: '50',
        maxAmount: '50000',
        isActive: true,
        iconUrl: 'https://cryptoicons.org/api/icon/usdt/200'
      },
      {
        id: 'usdc',
        name: 'USD Coin',
        symbol: 'USDC',
        type: 'crypto',
        network: 'ERC20',
        minAmount: '50',
        maxAmount: '50000',
        isActive: true,
        iconUrl: 'https://cryptoicons.org/api/icon/usdc/200'
      },
      {
        id: 'card-mdl',
        name: 'Visa/MasterCard MDL',
        symbol: 'MDL',
        type: 'fiat',
        network: null,
        minAmount: '500',
        maxAmount: '500000',
        isActive: true,
        iconUrl: null
      },
      {
        id: 'card-usd',
        name: 'Visa/MasterCard USD',
        symbol: 'USD',
        type: 'fiat',
        network: null,
        minAmount: '50',
        maxAmount: '50000',
        isActive: true,
        iconUrl: null
      },
      {
        id: 'card-eur',
        name: 'Visa/MasterCard EUR',
        symbol: 'EUR',
        type: 'fiat',
        network: null,
        minAmount: '50',
        maxAmount: '50000',
        isActive: true,
        iconUrl: null
      }
    ];

    supportedCurrencies.forEach(currency => {
      this.currencies.set(currency.id, currency);
    });

    // Initialize exchange rates
    const initialRates: ExchangeRate[] = [
      {
        id: randomUUID(),
        fromCurrency: 'usdt-trc20',
        toCurrency: 'card-mdl',
        rate: '16.16',
        timestamp: new Date()
      },
      {
        id: randomUUID(),
        fromCurrency: 'usdt-erc20',
        toCurrency: 'card-mdl',
        rate: '16.14',
        timestamp: new Date()
      },
      {
        id: randomUUID(),
        fromCurrency: 'btc',
        toCurrency: 'usdt-trc20',
        rate: '97500.00',
        timestamp: new Date()
      },
      {
        id: randomUUID(),
        fromCurrency: 'eth',
        toCurrency: 'usdt-trc20',
        rate: '3850.00',
        timestamp: new Date()
      }
    ];

    initialRates.forEach(rate => {
      this.exchangeRates.set(`${rate.fromCurrency}-${rate.toCurrency}`, rate);
    });
  }

  async getCurrencies(): Promise<Currency[]> {
    return Array.from(this.currencies.values()).filter(c => c.isActive);
  }

  async getCurrency(id: string): Promise<Currency | undefined> {
    return this.currencies.get(id);
  }

  async createCurrency(currency: InsertCurrency): Promise<Currency> {
    const newCurrency: Currency = {
      ...currency,
      network: currency.network ?? null,
      isActive: currency.isActive ?? true,
      iconUrl: currency.iconUrl ?? null
    };
    this.currencies.set(currency.id, newCurrency);
    return newCurrency;
  }

  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<ExchangeRate | undefined> {
    return this.exchangeRates.get(`${fromCurrency}-${toCurrency}`);
  }

  async getLatestRates(): Promise<ExchangeRate[]> {
    // Update rates from external API
    try {
      const realRates = await exchangeRateService.getAllRates();
      
      // Update stored rates if we got valid data
      if (realRates && realRates.length > 0) {
        for (const rate of realRates) {
          const rateData: ExchangeRate = {
            id: randomUUID(),
            fromCurrency: rate.fromCurrency,
            toCurrency: rate.toCurrency,
            rate: rate.rate,
            timestamp: new Date()
          };
          this.exchangeRates.set(`${rate.fromCurrency}-${rate.toCurrency}`, rateData);
        }
      } else {
        // Ensure we have fallback rates if no stored rates exist
        if (this.exchangeRates.size === 0) {
          this.initializeFallbackRates();
        }
      }
    } catch (error) {
      // Silently handle errors and ensure fallback rates
      if (this.exchangeRates.size === 0) {
        this.initializeFallbackRates();
      }
    }

    return Array.from(this.exchangeRates.values());
  }

  private initializeFallbackRates() {
    const fallbackRates = [
      { from: 'btc', to: 'usdt-erc20', rate: '90000' },
      { from: 'btc', to: 'usdt-trc20', rate: '90000' },
      { from: 'btc', to: 'card-usd', rate: '90000' },
      { from: 'eth', to: 'usdt-erc20', rate: '3200' },
      { from: 'eth', to: 'usdt-trc20', rate: '3200' },
      { from: 'eth', to: 'card-usd', rate: '3200' },
      { from: 'usdt-erc20', to: 'btc', rate: '0.000011' },
      { from: 'usdt-erc20', to: 'eth', rate: '0.0003125' },
      { from: 'usdt-erc20', to: 'card-usd', rate: '1' },
      { from: 'usdt-trc20', to: 'btc', rate: '0.000011' },
      { from: 'usdt-trc20', to: 'eth', rate: '0.0003125' },
      { from: 'usdt-trc20', to: 'card-usd', rate: '1' },
      { from: 'usdt-trc20', to: 'card-mdl', rate: '18.5' },
      { from: 'usdt-trc20', to: 'card-eur', rate: '0.92' },
    ];
    
    for (const rate of fallbackRates) {
      const rateData: ExchangeRate = {
        id: randomUUID(),
        fromCurrency: rate.from,
        toCurrency: rate.to,
        rate: rate.rate,
        timestamp: new Date()
      };
      this.exchangeRates.set(`${rate.from}-${rate.to}`, rateData);
    }
  }

  async createExchangeRate(rate: InsertExchangeRate): Promise<ExchangeRate> {
    const newRate: ExchangeRate = {
      id: rate.id || randomUUID(),
      ...rate,
      timestamp: rate.timestamp || new Date()
    };
    this.exchangeRates.set(`${rate.fromCurrency}-${rate.toCurrency}`, newRate);
    return newRate;
  }

  async createOrder(orderRequest: CreateOrderRequest): Promise<Order> {
    const orderId = 'CF-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    
    // Calculate amounts and fees
    const fromAmount = parseFloat(orderRequest.fromAmount);
    const platformFee = fromAmount * 0.005; // 0.5% fee
    const networkFee = orderRequest.fromCurrency.includes('usdt') ? 2 : 0.0001;
    
    // Get real-time exchange rate
    let exchangeRate: number;
    try {
      exchangeRate = await exchangeRateService.getRate(orderRequest.fromCurrency, orderRequest.toCurrency);
    } catch (error) {
      console.error('Failed to get real-time rate, using fallback:', error);
      const rate = await this.getExchangeRate(orderRequest.fromCurrency, orderRequest.toCurrency);
      exchangeRate = rate ? parseFloat(rate.rate) : 1;
    }
    
    const effectiveAmount = fromAmount - platformFee - networkFee;
    const toAmount = effectiveAmount * exchangeRate;

    // Generate deposit address (mock)
    const depositAddress = this.generateDepositAddress(orderRequest.fromCurrency);

    // Mask card number if provided
    let cardDetails = null;
    if (orderRequest.cardDetails) {
      cardDetails = {
        ...orderRequest.cardDetails,
        number: this.maskCardNumber(orderRequest.cardDetails.number)
      };
    }

    const newOrder: Order = {
      id: orderId,
      userId: orderRequest.userId || null,
      fromCurrency: orderRequest.fromCurrency,
      toCurrency: orderRequest.toCurrency,
      fromAmount: fromAmount.toString(),
      toAmount: toAmount.toString(),
      exchangeRate: exchangeRate.toString(),
      rateType: orderRequest.rateType,
      status: 'awaiting_deposit',
      depositAddress,
      recipientAddress: orderRequest.recipientAddress || null,
      cardDetails,
      contactEmail: orderRequest.contactEmail || null,
      platformFee: platformFee.toString(),
      networkFee: networkFee.toString(),
      rateLockExpiry: orderRequest.rateType === 'fixed' ? 
        new Date(Date.now() + 10 * 60 * 1000) : null, // 10 minutes lock
      txHash: null,
      payoutTxHash: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.orders.set(orderId, newOrder);
    
    // Send Telegram notification
    try {
      if (telegramService.isConfigured()) {
        await telegramService.sendOrderNotification(newOrder);
        console.log(`Telegram notification sent for order ${orderId}`);
      } else {
        console.log('Telegram not configured, skipping notification');
      }
    } catch (error) {
      console.error('Failed to send Telegram notification:', error);
    }
    
    return newOrder;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async updateOrderStatus(id: string, status: string, updates?: Partial<Order>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const updatedOrder = {
      ...order,
      status,
      ...updates,
      updatedAt: new Date()
    };

    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.userId === userId);
  }

  async createKycRequest(request: InsertKycRequest): Promise<KycRequest> {
    const newRequest: KycRequest = {
      id: request.id || randomUUID(),
      status: request.status,
      orderId: request.orderId,
      documentType: request.documentType ?? null,
      documentUrl: request.documentUrl ?? null,
      reason: request.reason ?? null,
      createdAt: request.createdAt || new Date(),
      updatedAt: request.updatedAt || new Date()
    };
    
    this.kycRequests.set(newRequest.id, newRequest);
    return newRequest;
  }

  async getKycRequest(orderId: string): Promise<KycRequest | undefined> {
    return Array.from(this.kycRequests.values()).find(req => req.orderId === orderId);
  }

  async updateKycRequest(id: string, updates: Partial<KycRequest>): Promise<KycRequest | undefined> {
    const request = this.kycRequests.get(id);
    if (!request) return undefined;

    const updatedRequest = {
      ...request,
      ...updates,
      updatedAt: new Date()
    };

    this.kycRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!userData.id) {
      throw new Error('User ID is required for upsert operation');
    }

    const existing = this.users.get(userData.id);
    
    if (existing) {
      // Update existing user
      const updated: User = {
        ...existing,
        email: userData.email ?? existing.email,
        firstName: userData.firstName ?? existing.firstName,
        lastName: userData.lastName ?? existing.lastName,
        profileImageUrl: userData.profileImageUrl ?? existing.profileImageUrl,
        updatedAt: new Date(),
      };
      this.users.set(userData.id, updated);
      return updated;
    } else {
      // Create new user
      const newUser: User = {
        id: userData.id,
        email: userData.email ?? null,
        firstName: userData.firstName ?? null,
        lastName: userData.lastName ?? null,
        profileImageUrl: userData.profileImageUrl ?? null,
        role: 'user',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(userData.id, newUser);
      return newUser;
    }
  }

  // Additional user operations  
  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: randomUUID(),
      email: user.email ?? null,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      profileImageUrl: user.profileImageUrl ?? null,
      role: user.role || 'user',
      isActive: user.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Wallet settings operations
  async getWalletSettings(): Promise<WalletSetting[]> {
    return Array.from(this.walletSettings.values()).filter(w => w.isActive);
  }

  async getWalletSetting(currency: string): Promise<WalletSetting | undefined> {
    return Array.from(this.walletSettings.values()).find(w => w.currency === currency && w.isActive);
  }

  async createWalletSetting(wallet: InsertWalletSetting): Promise<WalletSetting> {
    const newWallet: WalletSetting = {
      id: randomUUID(),
      currency: wallet.currency,
      address: wallet.address,
      network: wallet.network,
      isActive: wallet.isActive ?? true,
      createdAt: new Date(),
      createdBy: wallet.createdBy
    };
    
    this.walletSettings.set(newWallet.id, newWallet);
    return newWallet;
  }

  async updateWalletSetting(id: string, updates: Partial<WalletSetting>): Promise<WalletSetting | undefined> {
    const wallet = this.walletSettings.get(id);
    if (!wallet) return undefined;

    const updatedWallet = { ...wallet, ...updates };
    this.walletSettings.set(id, updatedWallet);
    return updatedWallet;
  }

  // Platform settings operations
  async getPlatformSettings(): Promise<PlatformSetting[]> {
    return Array.from(this.platformSettings.values());
  }

  async getPlatformSetting(key: string): Promise<PlatformSetting | undefined> {
    return Array.from(this.platformSettings.values()).find(s => s.key === key);
  }

  async setPlatformSetting(setting: InsertPlatformSetting): Promise<PlatformSetting> {
    const existing = await this.getPlatformSetting(setting.key);
    
    if (existing) {
      const updated: PlatformSetting = {
        ...existing,
        value: setting.value,
        description: setting.description ?? existing.description,
        isEncrypted: setting.isEncrypted ?? false,
        updatedAt: new Date(),
        updatedBy: setting.updatedBy
      };
      this.platformSettings.set(existing.id, updated);
      return updated;
    } else {
      const newSetting: PlatformSetting = {
        id: randomUUID(),
        key: setting.key,
        value: setting.value,
        description: setting.description ?? null,
        isEncrypted: setting.isEncrypted ?? false,
        updatedAt: new Date(),
        updatedBy: setting.updatedBy
      };
      this.platformSettings.set(newSetting.id, newSetting);
      return newSetting;
    }
  }

  private generateDepositAddress(currency: string): string {
    // Mock address generation based on currency type
    switch (currency) {
      case 'btc':
        return '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'; // Mock BTC address
      case 'eth':
      case 'usdt-erc20':
      case 'usdc':
        return '0x' + Math.random().toString(16).substring(2, 42).padStart(40, '0'); // Mock ETH address
      case 'usdt-trc20':
        return 'T' + Math.random().toString(36).substring(2, 35).toUpperCase(); // Mock TRON address
      default:
        return Math.random().toString(36).substring(2, 35);
    }
  }

  private maskCardNumber(cardNumber: string): string {
    const clean = cardNumber.replace(/\D/g, '');
    return clean.slice(0, 4) + '****' + clean.slice(-4);
  }
}

import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import { 
  currencies, 
  exchangeRates, 
  orders, 
  kycRequests, 
  users, 
  walletSettings, 
  platformSettings 
} from "@shared/schema";

// Database Storage implementation - blueprint:javascript_database  
export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Additional user operations  
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  // Currency operations
  async getCurrencies(): Promise<Currency[]> {
    return await db.select().from(currencies);
  }

  async getCurrency(id: string): Promise<Currency | undefined> {
    const [currency] = await db.select().from(currencies).where(eq(currencies.id, id));
    return currency;
  }

  async createCurrency(currency: InsertCurrency): Promise<Currency> {
    const [newCurrency] = await db.insert(currencies).values(currency).returning();
    return newCurrency;
  }

  // Exchange rate operations
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<ExchangeRate | undefined> {
    const [rate] = await db.select().from(exchangeRates)
      .where(sql`${exchangeRates.fromCurrency} = ${fromCurrency} AND ${exchangeRates.toCurrency} = ${toCurrency}`);
    return rate;
  }

  async getLatestRates(): Promise<ExchangeRate[]> {
    return await db.select().from(exchangeRates);
  }

  async createExchangeRate(rate: InsertExchangeRate): Promise<ExchangeRate> {
    const [newRate] = await db.insert(exchangeRates).values(rate).returning();
    return newRate;
  }

  // Order operations
  async createOrder(orderRequest: CreateOrderRequest): Promise<Order> {
    const orderId = 'CF-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    
    // Calculate amounts and fees
    const fromAmount = parseFloat(orderRequest.fromAmount);
    const platformFee = fromAmount * 0.005; // 0.5% fee
    const networkFee = orderRequest.fromCurrency.includes('usdt') ? 2 : 0.0001;
    
    // Get real-time exchange rate
    let exchangeRate: number;
    try {
      exchangeRate = await exchangeRateService.getRate(orderRequest.fromCurrency, orderRequest.toCurrency);
    } catch (error) {
      console.error('Failed to get real-time rate, using fallback:', error);
      const rate = await this.getExchangeRate(orderRequest.fromCurrency, orderRequest.toCurrency);
      exchangeRate = rate ? parseFloat(rate.rate) : 1;
    }
    
    const effectiveAmount = fromAmount - platformFee - networkFee;
    const toAmount = effectiveAmount * exchangeRate;

    // Generate deposit address (mock)
    const depositAddress = this.generateDepositAddress(orderRequest.fromCurrency);

    // Mask card number if provided
    let cardDetails = null;
    if (orderRequest.cardDetails) {
      cardDetails = {
        ...orderRequest.cardDetails,
        number: this.maskCardNumber(orderRequest.cardDetails.number)
      };
    }

    const orderData = {
      id: orderId,
      userId: orderRequest.userId || null,
      fromCurrency: orderRequest.fromCurrency,
      toCurrency: orderRequest.toCurrency,
      fromAmount: fromAmount.toString(),
      toAmount: toAmount.toString(),
      exchangeRate: exchangeRate.toString(),
      rateType: orderRequest.rateType,
      status: 'awaiting_deposit',
      depositAddress,
      recipientAddress: orderRequest.recipientAddress || null,
      cardDetails,
      contactEmail: orderRequest.contactEmail || null,
      platformFee: platformFee.toString(),
      networkFee: networkFee.toString(),
      rateLockExpiry: orderRequest.rateType === 'fixed' ? 
        new Date(Date.now() + 10 * 60 * 1000) : null, // 10 minutes lock
      txHash: null,
      payoutTxHash: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [newOrder] = await db.insert(orders).values(orderData).returning();
    
    // Send Telegram notification
    try {
      if (telegramService.isConfigured()) {
        await telegramService.sendOrderNotification(newOrder);
        console.log(`Telegram notification sent for order ${orderId}`);
      } else {
        console.log('Telegram not configured, skipping notification');
      }
    } catch (error) {
      console.error('Failed to send Telegram notification:', error);
    }
    
    return newOrder;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async updateOrderStatus(id: string, status: string, updates?: Partial<Order>): Promise<Order | undefined> {
    const updateData = {
      status,
      ...updates,
      updatedAt: new Date()
    };
    
    const [order] = await db.update(orders).set(updateData).where(eq(orders.id, id)).returning();
    return order;
  }

  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.userId, userId));
  }

  // KYC operations
  async createKycRequest(request: InsertKycRequest): Promise<KycRequest> {
    const [newRequest] = await db.insert(kycRequests).values(request).returning();
    return newRequest;
  }

  async getKycRequest(orderId: string): Promise<KycRequest | undefined> {
    const [request] = await db.select().from(kycRequests).where(eq(kycRequests.orderId, orderId));
    return request;
  }

  async updateKycRequest(id: string, updates: Partial<KycRequest>): Promise<KycRequest | undefined> {
    const [request] = await db.update(kycRequests).set(updates).where(eq(kycRequests.id, id)).returning();
    return request;
  }

  // Wallet settings operations
  async getWalletSettings(): Promise<WalletSetting[]> {
    return await db.select().from(walletSettings).where(eq(walletSettings.isActive, true));
  }

  async getWalletSetting(currency: string): Promise<WalletSetting | undefined> {
    const [wallet] = await db.select().from(walletSettings)
      .where(sql`${walletSettings.currency} = ${currency} AND ${walletSettings.isActive} = true`);
    return wallet;
  }

  async createWalletSetting(wallet: InsertWalletSetting): Promise<WalletSetting> {
    const [newWallet] = await db.insert(walletSettings).values(wallet).returning();
    return newWallet;
  }

  async updateWalletSetting(id: string, updates: Partial<WalletSetting>): Promise<WalletSetting | undefined> {
    const [wallet] = await db.update(walletSettings).set(updates).where(eq(walletSettings.id, id)).returning();
    return wallet;
  }

  // Platform settings operations
  async getPlatformSettings(): Promise<PlatformSetting[]> {
    return await db.select().from(platformSettings);
  }

  async getPlatformSetting(key: string): Promise<PlatformSetting | undefined> {
    const [setting] = await db.select().from(platformSettings).where(eq(platformSettings.key, key));
    return setting;
  }

  async setPlatformSetting(setting: InsertPlatformSetting): Promise<PlatformSetting> {
    const [newSetting] = await db.insert(platformSettings).values(setting)
      .onConflictDoUpdate({
        target: platformSettings.key,
        set: {
          value: setting.value,
          updatedAt: new Date(),
        },
      }).returning();
    return newSetting;
  }

  private generateDepositAddress(currency: string): string {
    // Mock address generation based on currency type
    switch (currency) {
      case 'btc':
        return '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'; // Mock BTC address
      case 'eth':
      case 'usdt-erc20':
      case 'usdc':
        return '0x' + Math.random().toString(16).substring(2, 42).padStart(40, '0'); // Mock ETH address
      case 'usdt-trc20':
        return 'T' + Math.random().toString(36).substring(2, 35).toUpperCase(); // Mock TRON address
      default:
        return Math.random().toString(36).substring(2, 35);
    }
  }

  private maskCardNumber(cardNumber: string): string {
    const clean = cardNumber.replace(/\D/g, '');
    return clean.slice(0, 4) + '****' + clean.slice(-4);
  }
}

export const storage = new DatabaseStorage();
