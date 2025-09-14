import { type Currency, type ExchangeRate, type Order, type KycRequest, type User, type WalletSetting, type PlatformSetting, type InsertCurrency, type InsertExchangeRate, type InsertOrder, type InsertKycRequest, type InsertUser, type UpsertUser, type InsertWalletSetting, type InsertPlatformSetting, type CreateOrderRequest } from "@shared/schema";
import { currencies, exchangeRates, orders, kycRequests, users, walletSettings, platformSettings } from "@shared/schema";
import { randomUUID } from "crypto";
import { exchangeRateService } from "./services/exchange-api";
import { telegramService } from "./services/telegram";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

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

export class PostgreSQLStorage implements IStorage {
  private rateCache: Map<string, { rate: ExchangeRate; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache
  private readonly RATE_UPDATE_INTERVAL = 2 * 60 * 1000; // Update rates every 2 minutes
  private isInitialized = false;

  constructor() {
    this.initializeData().catch(console.error);
    // Start rate update interval
    setInterval(() => this.updateRatesInBackground(), this.RATE_UPDATE_INTERVAL);
  }

  private async initializeData() {
    if (this.isInitialized) return;
    
    try {
      // Check if currencies already exist
      const existingCurrencies = await db.select().from(currencies);
      
      if (existingCurrencies.length === 0) {
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

        await db.insert(currencies).values(supportedCurrencies);
        console.log('Initialized currencies in database');
      }
      
      // Initialize exchange rates if none exist
      await this.initializeFallbackRates();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing data:', error);
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
      const existingRates = await db.select().from(exchangeRates).limit(1);
      
      if (existingRates.length === 0) {
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