interface ExchangeRateResponse {
  [key: string]: number;
}

interface CoinGeckoResponse {
  [coinId: string]: {
    [currency: string]: number;
  };
}

interface BinanceTickerResponse {
  symbol: string;
  price: string;
}

export class ExchangeRateService {
  private static instance: ExchangeRateService;
  private cache: Map<string, { rate: number; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  static getInstance(): ExchangeRateService {
    if (!ExchangeRateService.instance) {
      ExchangeRateService.instance = new ExchangeRateService();
    }
    return ExchangeRateService.instance;
  }

  async getRate(fromCurrency: string, toCurrency: string): Promise<number> {
    const cacheKey = `${fromCurrency}-${toCurrency}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.rate;
    }

    try {
      let rate: number;
      
      if (toCurrency.startsWith('card-')) {
        // For fiat conversions, get USD rate first then convert
        const fiatCurrency = toCurrency.replace('card-', '').toLowerCase();
        const usdRate = await this.getCryptoToUSDRate(fromCurrency);
        rate = fiatCurrency === 'usd' ? usdRate : await this.convertUSDToFiat(usdRate, fiatCurrency);
      } else {
        // Crypto to crypto
        rate = await this.getCryptoCryptoRate(fromCurrency, toCurrency);
      }

      // Cache the result
      this.cache.set(cacheKey, { rate, timestamp: Date.now() });
      return rate;
    } catch (error) {
      console.error(`Failed to get exchange rate for ${fromCurrency} to ${toCurrency}:`, error);
      return this.getFallbackRate(fromCurrency, toCurrency);
    }
  }

  private async getCryptoToUSDRate(currency: string): Promise<number> {
    const coinIds = {
      'btc': 'bitcoin',
      'eth': 'ethereum',
      'usdt-trc20': 'tether',
      'usdt-erc20': 'tether',
      'usdc': 'usd-coin'
    };

    const coinId = coinIds[currency as keyof typeof coinIds];
    if (!coinId) throw new Error(`Unsupported currency: ${currency}`);

    // Try CoinGecko first
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) throw new Error('CoinGecko API error');
      
      const data: CoinGeckoResponse = await response.json();
      return data[coinId]?.usd || 0;
    } catch (error) {
      console.warn('CoinGecko failed, trying Binance:', error);
      return this.getBinanceRate(currency);
    }
  }

  private async getBinanceRate(currency: string): Promise<number> {
    const symbolMap = {
      'btc': 'BTCUSDT',
      'eth': 'ETHUSDT',
      'usdt-trc20': 'USDTUSD', // USDT is ~1 USD
      'usdt-erc20': 'USDTUSD',
      'usdc': 'USDCUSDT'
    };

    const symbol = symbolMap[currency as keyof typeof symbolMap];
    if (!symbol) return 1; // Default for stablecoins

    try {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
      if (!response.ok) throw new Error('Binance API error');
      
      const data: BinanceTickerResponse = await response.json();
      return parseFloat(data.price);
    } catch (error) {
      console.error('Binance API failed:', error);
      return this.getFallbackRate(currency, 'usd');
    }
  }

  private async getCryptoCryptoRate(fromCurrency: string, toCurrency: string): Promise<number> {
    const fromUSD = await this.getCryptoToUSDRate(fromCurrency);
    const toUSD = await this.getCryptoToUSDRate(toCurrency);
    
    if (toUSD === 0) return 0;
    return fromUSD / toUSD;
  }

  private async convertUSDToFiat(usdAmount: number, fiatCurrency: string): Promise<number> {
    // For simplicity, using hardcoded rates. In production, use forex API
    const fiatRates = {
      'mdl': 18.0,  // USD to MDL
      'eur': 0.85,  // USD to EUR
      'usd': 1.0    // USD to USD
    };

    const rate = fiatRates[fiatCurrency as keyof typeof fiatRates] || 1;
    return usdAmount * rate;
  }

  private getFallbackRate(fromCurrency: string, toCurrency: string): number {
    // Fallback rates similar to original mock data
    const fallbackRates: { [key: string]: number } = {
      'usdt-trc20-card-mdl': 16.16,
      'usdt-erc20-card-mdl': 16.14,
      'btc-usdt-trc20': 97500.00,
      'eth-usdt-trc20': 3850.00,
      'usdt-trc20-card-usd': 1.0,
      'usdt-erc20-card-usd': 1.0,
      'usdc-card-usd': 1.0,
    };

    const key = `${fromCurrency}-${toCurrency}`;
    return fallbackRates[key] || 1;
  }

  async getAllRates(): Promise<Array<{ fromCurrency: string; toCurrency: string; rate: string }>> {
    const pairs = [
      { from: 'usdt-trc20', to: 'card-mdl' },
      { from: 'usdt-erc20', to: 'card-mdl' },
      { from: 'usdt-trc20', to: 'card-usd' },
      { from: 'usdt-erc20', to: 'card-usd' },
      { from: 'usdc', to: 'card-usd' },
      { from: 'btc', to: 'usdt-trc20' },
      { from: 'eth', to: 'usdt-trc20' },
    ];

    const rates = await Promise.all(
      pairs.map(async (pair) => {
        const rate = await this.getRate(pair.from, pair.to);
        return {
          fromCurrency: pair.from,
          toCurrency: pair.to,
          rate: rate.toFixed(8)
        };
      })
    );

    return rates;
  }
}

export const exchangeRateService = ExchangeRateService.getInstance();