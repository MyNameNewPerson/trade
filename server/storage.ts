import { type Currency, type ExchangeRate, type Order, type KycRequest, type User, type WalletSetting, type PlatformSetting, type EmailToken, type AdminLog, type TelegramConfig, type TelegramHistory, type ExchangeMethod, type InsertCurrency, type InsertExchangeRate, type InsertOrder, type InsertKycRequest, type InsertUser, type UpsertUser, type InsertWalletSetting, type InsertPlatformSetting, type InsertEmailToken, type InsertAdminLog, type InsertTelegramConfig, type InsertTelegramHistory, type InsertExchangeMethod, type CreateOrderRequest, type AdminCreateUserRequest, type AdminUpdateUserRequest, type CreateTelegramConfigRequest, type CreateExchangeMethodRequest, type AdminStats, type RevealTokenRequest, type TestConnectionRequest, type TelegramHistoryFilter, type ChatConfig, type NotificationSetting } from "@shared/schema";
import { currencies, exchangeRates, orders, kycRequests, users, walletSettings, platformSettings, emailTokens, adminLogs, telegramConfigs, telegramHistory, exchangeMethods } from "@shared/schema";
import { randomUUID } from "crypto";
import { exchangeRateService } from "./services/exchange-api";
import { telegramService } from "./services/telegram";
import { encryptionService } from "./services/encryption";
import { db } from "./db";
import { eq, desc, and, or, like, count } from "drizzle-orm";

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
  upsertUser(user: UpsertUser): Promise<User>;
  activateUser(userId: string): Promise<boolean>;
  
  // Email token operations
  createEmailToken(token: InsertEmailToken): Promise<EmailToken>;
  getEmailToken(token: string): Promise<EmailToken | undefined>;
  deleteEmailToken(token: string): Promise<boolean>;
  
  // Wallet settings operations
  getWalletSettings(): Promise<WalletSetting[]>;
  getWalletSetting(currency: string): Promise<WalletSetting | undefined>;
  createWalletSetting(wallet: InsertWalletSetting): Promise<WalletSetting>;
  updateWalletSetting(id: string, updates: Partial<WalletSetting>): Promise<WalletSetting | undefined>;
  
  // Platform settings operations
  getPlatformSettings(): Promise<PlatformSetting[]>;
  getPlatformSetting(key: string): Promise<PlatformSetting | undefined>;
  setPlatformSetting(setting: InsertPlatformSetting): Promise<PlatformSetting>;
  
  // Admin logs operations
  createAdminLog(log: InsertAdminLog): Promise<AdminLog>;
  getAdminLogs(page?: number, limit?: number, adminId?: string): Promise<{ logs: AdminLog[], total: number }>;
  
  // Telegram configs operations  
  getTelegramConfigs(): Promise<TelegramConfig[]>;
  getTelegramConfig(id: string): Promise<TelegramConfig | undefined>;
  createTelegramConfig(config: CreateTelegramConfigRequest, adminId: string): Promise<TelegramConfig>;
  updateTelegramConfig(id: string, updates: Partial<TelegramConfig>): Promise<TelegramConfig | undefined>;
  deleteTelegramConfig(id: string): Promise<boolean>;
  
  // Secure telegram operations
  revealTelegramToken(request: RevealTokenRequest, adminId: string): Promise<{ token: string; signingSecret: string; expiresIn: number }>;
  testTelegramConnection(request: TestConnectionRequest): Promise<{ success: boolean; botInfo?: any; error?: string }>;
  sendTelegramTest(configId: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
  getTelegramStatus(): Promise<{ configured: boolean; hasToken: boolean; hasChatId: boolean; hasSigningSecret: boolean; connectionTest?: any }>;
  
  // Telegram history operations
  getTelegramHistory(filters: TelegramHistoryFilter): Promise<{ history: TelegramHistory[]; total: number }>;
  createTelegramHistory(history: InsertTelegramHistory): Promise<TelegramHistory>;
  updateTelegramTestStatus(configId: string, status: 'success' | 'failed' | 'pending', error?: string): Promise<void>;
  
  // Exchange methods operations
  getExchangeMethods(): Promise<ExchangeMethod[]>;
  getExchangeMethod(id: string): Promise<ExchangeMethod | undefined>;
  createExchangeMethod(method: CreateExchangeMethodRequest, adminId: string): Promise<ExchangeMethod>;
  updateExchangeMethod(id: string, updates: Partial<ExchangeMethod>): Promise<ExchangeMethod | undefined>;
  deleteExchangeMethod(id: string): Promise<boolean>;
  
  // Enhanced user operations for admin
  getAllUsers(page?: number, limit?: number, search?: string): Promise<{ users: User[], total: number }>;
  adminCreateUser(user: AdminCreateUserRequest): Promise<User>;
  adminUpdateUser(id: string, updates: AdminUpdateUserRequest): Promise<User | undefined>;
  deactivateUser(id: string): Promise<boolean>;
  
  // Enhanced currency operations for admin
  updateCurrency(id: string, updates: Partial<Currency>): Promise<Currency | undefined>;
  deleteCurrency(id: string): Promise<boolean>;
  
  // Enhanced wallet operations for admin
  deleteWalletSetting(id: string): Promise<boolean>;
  
  // Stats operations
  getAdminStats(): Promise<AdminStats>;
}

export class PostgreSQLStorage implements IStorage {
  private rateCache: Map<string, { rate: ExchangeRate; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes cache
  private readonly RATE_UPDATE_INTERVAL = 15 * 60 * 1000; // Update rates every 15 minutes
  private isInitialized = false;
  private isInitializing = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Start background initialization - completely non-blocking
    this.startBackgroundInitialization();
    // Start rate update interval
    setInterval(() => this.updateRatesInBackground(), this.RATE_UPDATE_INTERVAL);
  }
  
  private startBackgroundInitialization() {
    // Initialize in the background without blocking anything
    setTimeout(() => {
      this.initializeData().catch(error => {
        console.error('Background initialization error:', error);
        // Retry after 5 seconds if failed
        setTimeout(() => this.startBackgroundInitialization(), 5000);
      });
    }, 100); // Small delay to let server start first
  }

  private async initializeData() {
    if (this.isInitialized || this.isInitializing) return;
    
    this.isInitializing = true;
    try {
      // Quick count check instead of selecting all currencies
      const currencyCount = await db.select({ count: currencies.id }).from(currencies).limit(1);
      
      if (currencyCount.length === 0) {
        // Initialize supported currencies
        const supportedCurrencies: InsertCurrency[] = [
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

        // Use transaction for bulk insert for better performance
        await db.insert(currencies).values(supportedCurrencies).onConflictDoNothing();
        console.log('Initialized currencies in database');
      }
      
      // Initialize exchange rates if none exist (non-blocking)
      this.initializeFallbackRates().catch(console.error);
      
      this.isInitialized = true;
      console.log('✅ Storage initialization completed successfully');
    } catch (error) {
      console.error('❌ Error initializing data:', error);
    } finally {
      this.isInitializing = false;
    }
  }

  private async updateRatesInBackground() {
    try {
      console.log('Updating exchange rates...');
      await this.refreshRatesFromAPI();
    } catch (error) {
      console.error('Error updating rates in background:', error);
    }
  }

  private async refreshRatesFromAPI() {
    try {
      const realRates = await exchangeRateService.getAllRates();
      
      if (realRates && realRates.length > 0) {
        // Validate currency pairs against active currencies
        const activeCurrencies = await this.getCurrencies();
        const activeCurrencyIds = new Set(activeCurrencies.map(c => c.id));
        
        const validRates = realRates.filter(rate => 
          activeCurrencyIds.has(rate.fromCurrency) && activeCurrencyIds.has(rate.toCurrency)
        );
        
        for (const rate of validRates) {
          const rateData: ExchangeRate = {
            id: randomUUID(),
            fromCurrency: rate.fromCurrency,
            toCurrency: rate.toCurrency,
            rate: rate.rate,
            timestamp: new Date()
          };
          
          // Update cache
          this.rateCache.set(`${rate.fromCurrency}-${rate.toCurrency}`, {
            rate: rateData,
            timestamp: Date.now()
          });
          
          // Update/insert in database
          await db.insert(exchangeRates).values(rateData)
            .onConflictDoNothing();
        }
      }
    } catch (error) {
      console.error('Error refreshing rates from API:', error);
      // Ensure fallback rates exist
      await this.initializeFallbackRates();
    }
  }

  private async initializeFallbackRates() {
    try {
      // Quick count check for better performance
      const rateCount = await db.select({ count: exchangeRates.id }).from(exchangeRates).limit(1);
      
      if (rateCount.length === 0) {
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
        
        const fallbackRateData: InsertExchangeRate[] = fallbackRates.map(rate => ({
          id: randomUUID(),
          fromCurrency: rate.from,
          toCurrency: rate.to,
          rate: rate.rate,
          timestamp: new Date()
        }));
        
        await db.insert(exchangeRates).values(fallbackRateData);
        console.log('Initialized fallback exchange rates');
      }
    } catch (error) {
      console.error('Error initializing fallback rates:', error);
    }
  }

  // Currency operations
  async getCurrencies(): Promise<Currency[]> {
    return await db.select().from(currencies).where(eq(currencies.isActive, true));
  }

  async getCurrency(id: string): Promise<Currency | undefined> {
    const result = await db.select().from(currencies).where(eq(currencies.id, id)).limit(1);
    return result[0];
  }

  async createCurrency(currency: InsertCurrency): Promise<Currency> {
    const result = await db.insert(currencies).values(currency).returning();
    return result[0];
  }

  // Exchange rate operations with caching
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<ExchangeRate | undefined> {
    const cacheKey = `${fromCurrency}-${toCurrency}`;
    const cached = this.rateCache.get(cacheKey);
    
    // Return cached rate if it's fresh
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.rate;
    }
    
    // Get from database
    const result = await db.select()
      .from(exchangeRates)
      .where(and(
        eq(exchangeRates.fromCurrency, fromCurrency),
        eq(exchangeRates.toCurrency, toCurrency)
      ))
      .orderBy(desc(exchangeRates.timestamp))
      .limit(1);
    
    if (result[0]) {
      // Update cache
      this.rateCache.set(cacheKey, {
        rate: result[0],
        timestamp: Date.now()
      });
      return result[0];
    }
    
    return undefined;
  }

  async getLatestRates(): Promise<ExchangeRate[]> {
    // Return all cached rates if available
    const cachedRates = Array.from(this.rateCache.values())
      .filter(cached => (Date.now() - cached.timestamp) < this.CACHE_TTL)
      .map(cached => cached.rate);
    
    if (cachedRates.length > 0) {
      return cachedRates;
    }
    
    // Otherwise get from database
    const result = await db.select().from(exchangeRates).orderBy(desc(exchangeRates.timestamp));
    
    // Update cache
    result.forEach(rate => {
      this.rateCache.set(`${rate.fromCurrency}-${rate.toCurrency}`, {
        rate,
        timestamp: Date.now()
      });
    });
    
    return result;
  }

  async createExchangeRate(rate: InsertExchangeRate): Promise<ExchangeRate> {
    const result = await db.insert(exchangeRates).values(rate).returning();
    
    // Update cache
    this.rateCache.set(`${rate.fromCurrency}-${rate.toCurrency}`, {
      rate: result[0],
      timestamp: Date.now()
    });
    
    return result[0];
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
      console.error('Failed to get real-time rate, using cached/stored rate:', error);
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

    const newOrder: InsertOrder = {
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

    const result = await db.insert(orders).values(newOrder).returning();
    
    // Send Telegram notification
    try {
      if (telegramService.isConfigured()) {
        await telegramService.sendOrderNotification(result[0]);
        console.log(`Telegram notification sent for order ${orderId}`);
      } else {
        console.log('Telegram not configured, skipping notification');
      }
    } catch (error) {
      console.error('Failed to send Telegram notification:', error);
    }
    
    return result[0];
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return result[0];
  }

  async updateOrderStatus(id: string, status: string, updates?: Partial<Order>): Promise<Order | undefined> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
      ...updates
    };

    const result = await db.update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();

    return result[0];
  }

  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  // KYC operations
  async createKycRequest(request: InsertKycRequest): Promise<KycRequest> {
    const result = await db.insert(kycRequests).values(request).returning();
    return result[0];
  }

  async getKycRequest(orderId: string): Promise<KycRequest | undefined> {
    const result = await db.select().from(kycRequests)
      .where(eq(kycRequests.orderId, orderId))
      .limit(1);
    return result[0];
  }

  async updateKycRequest(id: string, updates: Partial<KycRequest>): Promise<KycRequest | undefined> {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    const result = await db.update(kycRequests)
      .set(updateData)
      .where(eq(kycRequests.id, id))
      .returning();

    return result[0];
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!userData.id) {
      throw new Error('User ID is required for upsert operation');
    }

    const existing = await this.getUser(userData.id);
    
    if (existing) {
      // Update existing user
      const updateData = {
        email: userData.email ?? existing.email,
        firstName: userData.firstName ?? existing.firstName,
        lastName: userData.lastName ?? existing.lastName,
        profileImageUrl: userData.profileImageUrl ?? existing.profileImageUrl,
        updatedAt: new Date(),
      };
      
      const result = await db.update(users)
        .set(updateData)
        .where(eq(users.id, userData.id))
        .returning();
      
      return result[0];
    } else {
      // Create new user
      const newUser = {
        id: userData.id,
        email: userData.email ?? null,
        firstName: userData.firstName ?? null,
        lastName: userData.lastName ?? null,
        profileImageUrl: userData.profileImageUrl ?? null,
        role: 'user',
        isActive: true,
      };
      
      const result = await db.insert(users).values(newUser).returning();
      return result[0];
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    const result = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    return result[0];
  }

  async activateUser(userId: string): Promise<boolean> {
    try {
      const result = await db.update(users)
        .set({ isActive: true, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error('Error activating user:', error);
      return false;
    }
  }

  // Email token operations
  async createEmailToken(token: InsertEmailToken): Promise<EmailToken> {
    const result = await db.insert(emailTokens).values(token).returning();
    return result[0];
  }

  async getEmailToken(token: string): Promise<EmailToken | undefined> {
    const result = await db.select().from(emailTokens)
      .where(eq(emailTokens.token, token))
      .limit(1);
    return result[0];
  }

  async deleteEmailToken(token: string): Promise<boolean> {
    try {
      const result = await db.delete(emailTokens)
        .where(eq(emailTokens.token, token))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error('Error deleting email token:', error);
      return false;
    }
  }

  // Wallet settings operations
  async getWalletSettings(): Promise<WalletSetting[]> {
    return await db.select().from(walletSettings);
  }

  async getWalletSetting(currency: string): Promise<WalletSetting | undefined> {
    const result = await db.select().from(walletSettings)
      .where(eq(walletSettings.currency, currency))
      .limit(1);
    return result[0];
  }

  async createWalletSetting(wallet: InsertWalletSetting): Promise<WalletSetting> {
    const result = await db.insert(walletSettings).values(wallet).returning();
    return result[0];
  }

  async updateWalletSetting(id: string, updates: Partial<WalletSetting>): Promise<WalletSetting | undefined> {
    const result = await db.update(walletSettings)
      .set(updates)
      .where(eq(walletSettings.id, id))
      .returning();

    return result[0];
  }

  // Platform settings operations
  async getPlatformSettings(): Promise<PlatformSetting[]> {
    return await db.select().from(platformSettings);
  }

  async getPlatformSetting(key: string): Promise<PlatformSetting | undefined> {
    const result = await db.select().from(platformSettings)
      .where(eq(platformSettings.key, key))
      .limit(1);
    return result[0];
  }

  async setPlatformSetting(setting: InsertPlatformSetting): Promise<PlatformSetting> {
    const result = await db.insert(platformSettings)
      .values(setting)
      .onConflictDoUpdate({
        target: platformSettings.key,
        set: {
          value: setting.value,
          description: setting.description,
          isEncrypted: setting.isEncrypted,
          updatedAt: new Date(),
          updatedBy: setting.updatedBy
        }
      })
      .returning();

    return result[0];
  }

  // Admin logs operations
  async createAdminLog(log: InsertAdminLog): Promise<AdminLog> {
    const result = await db.insert(adminLogs).values(log).returning();
    return result[0];
  }

  async getAdminLogs(page = 1, limit = 50, adminId?: string): Promise<{ logs: AdminLog[], total: number }> {
    const offset = (page - 1) * limit;
    
    const whereClause = adminId ? eq(adminLogs.adminId, adminId) : undefined;
    
    const [logs, totalResult] = await Promise.all([
      db.select()
        .from(adminLogs)
        .where(whereClause)
        .orderBy(desc(adminLogs.createdAt))
        .offset(offset)
        .limit(limit),
      db.select({ count: count() })
        .from(adminLogs)
        .where(whereClause)
    ]);
    
    return {
      logs,
      total: totalResult[0].count
    };
  }

  // Telegram configs operations
  async getTelegramConfigs(): Promise<TelegramConfig[]> {
    const configs = await db.select().from(telegramConfigs).orderBy(desc(telegramConfigs.createdAt));
    
    // Decrypt bot tokens for API responses
    return configs.map(config => ({
      ...config,
      botToken: encryptionService.decrypt(config.botToken)
    }));
  }

  async getTelegramConfig(id: string): Promise<TelegramConfig | undefined> {
    const result = await db.select().from(telegramConfigs)
      .where(eq(telegramConfigs.id, id))
      .limit(1);
    
    if (result[0]) {
      return {
        ...result[0],
        botToken: encryptionService.decrypt(result[0].botToken) // Decrypt for API response
      };
    }
    return result[0];
  }

  async createTelegramConfig(config: CreateTelegramConfigRequest, adminId: string): Promise<TelegramConfig> {
    const configData: InsertTelegramConfig = {
      ...config,
      botToken: encryptionService.encrypt(config.botToken), // Encrypt the bot token
      createdBy: adminId
    };
    
    const result = await db.insert(telegramConfigs).values(configData).returning();
    const decryptedResult = {
      ...result[0],
      botToken: encryptionService.decrypt(result[0].botToken) // Return decrypted for API response
    };
    return decryptedResult;
  }

  async updateTelegramConfig(id: string, updates: Partial<TelegramConfig>): Promise<TelegramConfig | undefined> {
    // Encrypt bot token if it's being updated
    if (updates.botToken) {
      updates.botToken = encryptionService.encrypt(updates.botToken);
    }
    const result = await db.update(telegramConfigs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(telegramConfigs.id, id))
      .returning();
    
    if (result[0]) {
      return {
        ...result[0],
        botToken: encryptionService.decrypt(result[0].botToken) // Return decrypted
      };
    }
    return result[0];
  }

  async deleteTelegramConfig(id: string): Promise<boolean> {
    const result = await db.delete(telegramConfigs)
      .where(eq(telegramConfigs.id, id))
      .returning();
    return result.length > 0;
  }

  // Exchange methods operations
  async getExchangeMethods(): Promise<ExchangeMethod[]> {
    return await db.select().from(exchangeMethods).orderBy(desc(exchangeMethods.createdAt));
  }

  async getExchangeMethod(id: string): Promise<ExchangeMethod | undefined> {
    const result = await db.select().from(exchangeMethods)
      .where(eq(exchangeMethods.id, id))
      .limit(1);
    return result[0];
  }

  async createExchangeMethod(method: CreateExchangeMethodRequest, adminId: string): Promise<ExchangeMethod> {
    const methodData: InsertExchangeMethod = {
      ...method,
      createdBy: adminId
    };
    
    const result = await db.insert(exchangeMethods).values(methodData).returning();
    return result[0];
  }

  async updateExchangeMethod(id: string, updates: Partial<ExchangeMethod>): Promise<ExchangeMethod | undefined> {
    const result = await db.update(exchangeMethods)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(exchangeMethods.id, id))
      .returning();
    return result[0];
  }

  async deleteExchangeMethod(id: string): Promise<boolean> {
    const result = await db.delete(exchangeMethods)
      .where(eq(exchangeMethods.id, id))
      .returning();
    return result.length > 0;
  }

  // Enhanced user operations for admin
  async getAllUsers(page = 1, limit = 20, search?: string): Promise<{ users: User[], total: number }> {
    const offset = (page - 1) * limit;
    
    const searchFilter = search ? or(
      like(users.email, `%${search}%`),
      like(users.firstName, `%${search}%`),
      like(users.lastName, `%${search}%`)
    ) : undefined;
    
    const [userList, totalResult] = await Promise.all([
      db.select()
        .from(users)
        .where(searchFilter)
        .orderBy(desc(users.createdAt))
        .offset(offset)
        .limit(limit),
      db.select({ count: count() })
        .from(users)
        .where(searchFilter)
    ]);
    
    return {
      users: userList,
      total: totalResult[0].count
    };
  }

  async adminCreateUser(user: AdminCreateUserRequest): Promise<User> {
    const userData: InsertUser = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      password: null // No password for admin-created users
    };
    
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  }

  async adminUpdateUser(id: string, updates: AdminUpdateUserRequest): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deactivateUser(id: string): Promise<boolean> {
    const result = await db.update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result.length > 0;
  }

  // Enhanced currency operations for admin
  async updateCurrency(id: string, updates: Partial<Currency>): Promise<Currency | undefined> {
    const result = await db.update(currencies)
      .set(updates)
      .where(eq(currencies.id, id))
      .returning();
    return result[0];
  }

  async deleteCurrency(id: string): Promise<boolean> {
    const result = await db.delete(currencies)
      .where(eq(currencies.id, id))
      .returning();
    return result.length > 0;
  }

  // Enhanced wallet operations for admin
  async deleteWalletSetting(id: string): Promise<boolean> {
    const result = await db.delete(walletSettings)
      .where(eq(walletSettings.id, id))
      .returning();
    return result.length > 0;
  }

  // Stats operations
  async getAdminStats(): Promise<AdminStats> {
    const [
      allUsers,
      allOrders,
      allCurrencies,
      allWallets
    ] = await Promise.all([
      db.select().from(users),
      db.select().from(orders),
      db.select().from(currencies),
      db.select().from(walletSettings)
    ]);

    const activeUsers = allUsers.filter(user => user.isActive);
    const completedOrders = allOrders.filter(order => order.status === 'completed');
    const activeCurrencies = allCurrencies.filter(currency => currency.isActive);
    const activeWallets = allWallets.filter(wallet => wallet.isActive);

    return {
      totalUsers: allUsers.length,
      activeUsers: activeUsers.length,
      totalOrders: allOrders.length,
      completedOrders: completedOrders.length,
      totalCurrencies: allCurrencies.length,
      activeCurrencies: activeCurrencies.length,
      totalWallets: allWallets.length,
      activeWallets: activeWallets.length
    };
  }

  // Helper methods
  private generateDepositAddress(currency: string): string {
    // Mock address generation based on currency type
    if (currency === 'btc') {
      return '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
    } else if (currency === 'eth' || currency.includes('erc20')) {
      return '0x742d35Cc6634C0532925a3b8D0c2AC4B5d4A2c37';
    } else if (currency.includes('trc20')) {
      return 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgj3xDT';
    }
    return 'mock-deposit-address';
  }

  private maskCardNumber(cardNumber: string): string {
    if (cardNumber.length < 4) return cardNumber;
    return '**** **** **** ' + cardNumber.slice(-4);
  }
}

// Export the storage instance
export const storage = new PostgreSQLStorage();