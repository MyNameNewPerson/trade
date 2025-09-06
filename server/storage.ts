import { type Currency, type ExchangeRate, type Order, type KycRequest, type InsertCurrency, type InsertExchangeRate, type InsertOrder, type InsertKycRequest, type CreateOrderRequest } from "@shared/schema";
import { randomUUID } from "crypto";

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

  // KYC operations
  createKycRequest(request: InsertKycRequest): Promise<KycRequest>;
  getKycRequest(orderId: string): Promise<KycRequest | undefined>;
  updateKycRequest(id: string, updates: Partial<KycRequest>): Promise<KycRequest | undefined>;
}

export class MemStorage implements IStorage {
  private currencies: Map<string, Currency> = new Map();
  private exchangeRates: Map<string, ExchangeRate> = new Map();
  private orders: Map<string, Order> = new Map();
  private kycRequests: Map<string, KycRequest> = new Map();

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
    const newCurrency: Currency = { ...currency };
    this.currencies.set(currency.id, newCurrency);
    return newCurrency;
  }

  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<ExchangeRate | undefined> {
    return this.exchangeRates.get(`${fromCurrency}-${toCurrency}`);
  }

  async getLatestRates(): Promise<ExchangeRate[]> {
    return Array.from(this.exchangeRates.values());
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
    
    // Get exchange rate
    const rate = await this.getExchangeRate(orderRequest.fromCurrency, orderRequest.toCurrency);
    const exchangeRate = rate ? parseFloat(rate.rate) : 1;
    
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

  async createKycRequest(request: InsertKycRequest): Promise<KycRequest> {
    const newRequest: KycRequest = {
      id: request.id || randomUUID(),
      ...request,
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

export const storage = new MemStorage();
