import { storage } from '../storage';
import { exchangeRateService } from './exchange-api';

/**
 * Currency conversion service that uses real exchange rates from the database
 * and external APIs to provide accurate currency conversions.
 */
export class CurrencyConverter {
  private static instance: CurrencyConverter;
  private conversionCache: Map<string, { rate: number; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache for conversions

  static getInstance(): CurrencyConverter {
    if (!CurrencyConverter.instance) {
      CurrencyConverter.instance = new CurrencyConverter();
    }
    return CurrencyConverter.instance;
  }

  /**
   * Convert any currency amount to USD using real exchange rates
   */
  async convertToUSD(amount: number, fromCurrency: string): Promise<number> {
    if (amount === 0) return 0;

    // Handle USD and USD-pegged currencies directly
    if (fromCurrency === 'card-usd' || fromCurrency === 'usd') {
      return amount;
    }

    // Handle stablecoins (USDT, USDC) that are pegged to USD
    if (fromCurrency.includes('usdt') || fromCurrency === 'usdc') {
      return amount; // 1:1 with USD
    }

    const cacheKey = `${fromCurrency}-usd`;
    const cached = this.conversionCache.get(cacheKey);
    
    // Return cached rate if available and fresh
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return amount * cached.rate;
    }

    try {
      // First try to get rate from database
      let rate = await this.getRateFromDatabase(fromCurrency, 'card-usd');
      
      // If no database rate, try external API
      if (!rate) {
        rate = await exchangeRateService.getRate(fromCurrency, 'usd');
      }

      // Cache the rate
      this.conversionCache.set(cacheKey, { rate, timestamp: Date.now() });
      
      return amount * rate;
    } catch (error) {
      console.error(`Error converting ${fromCurrency} to USD:`, error);
      
      // Fallback to basic known rates for critical currencies
      const fallbackRates: { [key: string]: number } = {
        'btc': 65000,      // Approximate BTC price
        'eth': 3500,       // Approximate ETH price
        'card-eur': 1.08,  // EUR to USD
        'card-mdl': 0.055, // MDL to USD (1/18)
        'eur': 1.08,
        'mdl': 0.055
      };
      
      const fallbackRate = fallbackRates[fromCurrency] || 1;
      console.warn(`Using fallback rate for ${fromCurrency}: ${fallbackRate}`);
      
      return amount * fallbackRate;
    }
  }

  /**
   * Convert amounts to a common base currency for comparison and aggregation
   */
  async convertToBaseCurrency(amounts: Array<{ amount: number; currency: string }>): Promise<number> {
    let totalUSD = 0;
    
    for (const item of amounts) {
      const usdValue = await this.convertToUSD(item.amount, item.currency);
      totalUSD += usdValue;
    }
    
    return totalUSD;
  }

  /**
   * Get exchange rate from database first, fallback to API
   */
  private async getRateFromDatabase(fromCurrency: string, toCurrency: string): Promise<number | null> {
    try {
      // Try direct pair
      let rate = await storage.getExchangeRate(fromCurrency, toCurrency);
      if (rate) {
        return parseFloat(rate.rate);
      }

      // Try with USD as intermediate currency for card-* currencies
      if (toCurrency.startsWith('card-')) {
        const fiatCurrency = toCurrency.replace('card-', '');
        rate = await storage.getExchangeRate(fromCurrency, fiatCurrency);
        if (rate) {
          return parseFloat(rate.rate);
        }
      }

      // Try reverse pair and invert
      rate = await storage.getExchangeRate(toCurrency, fromCurrency);
      if (rate) {
        const rateValue = parseFloat(rate.rate);
        return rateValue !== 0 ? 1 / rateValue : 0;
      }

      return null;
    } catch (error) {
      console.error('Error getting rate from database:', error);
      return null;
    }
  }

  /**
   * Convert multiple currency amounts to USD and return the breakdown
   */
  async convertMultipleToUSD(items: Array<{ currency: string; amount: number }>): Promise<Array<{ currency: string; amount: number; usdValue: number }>> {
    const results = [];
    
    for (const item of items) {
      const usdValue = await this.convertToUSD(item.amount, item.currency);
      results.push({
        currency: item.currency,
        amount: item.amount,
        usdValue: Math.round(usdValue * 100) / 100 // Round to 2 decimal places
      });
    }
    
    return results;
  }

  /**
   * Clear the conversion cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.conversionCache.clear();
  }
}

export const currencyConverter = CurrencyConverter.getInstance();