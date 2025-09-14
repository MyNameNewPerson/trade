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

interface BybitTickerResponse {
  retCode: number;
  result: {
    list: Array<{
      symbol: string;
      lastPrice: string;
    }>;
  };
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
        // Check for direct fiat pair fallback first
        const directFallback = this.getFallbackRate(fromCurrency, toCurrency);
        if (directFallback !== 1) {
          console.log(`Using direct fiat fallback for ${fromCurrency} to ${toCurrency}: ${directFallback}`);
          rate = directFallback;
        } else {
          // For fiat conversions, get USD rate first then convert
          const fiatCurrency = toCurrency.replace('card-', '').toLowerCase();
          const usdRate = await this.getCryptoToUSDRate(fromCurrency);
          rate = fiatCurrency === 'usd' ? usdRate : await this.convertUSDToFiat(usdRate, fiatCurrency);
        }
      } else {
        // Crypto to crypto
        rate = await this.getCryptoCryptoRate(fromCurrency, toCurrency);
      }

      // Cache the result
      this.cache.set(cacheKey, { rate, timestamp: Date.now() });
      return rate;
    } catch (error) {
      console.log(`All APIs failed for ${fromCurrency} to ${toCurrency}, using fallback:`, error instanceof Error ? error.message : String(error));
      const fallbackRate = this.getFallbackRate(fromCurrency, toCurrency);
      this.cache.set(cacheKey, { rate: fallbackRate, timestamp: Date.now() });
      return fallbackRate;
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
          },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        }
      );

      if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
      
      const data: CoinGeckoResponse = await response.json();
      return data[coinId]?.usd || 0;
    } catch (error) {
      console.log('CoinGecko failed, trying Binance:', error instanceof Error ? error.message : String(error));
      return this.getBinanceRate(currency);
    }
  }

  private async getBinanceRate(currency: string): Promise<number> {
    const symbolMap = {
      'btc': 'BTCUSDT',
      'eth': 'ETHUSDT',
      'usdc': 'USDCUSDT'
    };

    // Handle stablecoins directly
    if (currency.includes('usdt') || currency === 'usdc') {
      return 1.0;
    }

    const symbol = symbolMap[currency as keyof typeof symbolMap];
    if (!symbol) {
      throw new Error(`No symbol mapping for ${currency}`);
    }

    try {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      if (!response.ok) throw new Error(`Binance API error: ${response.status}`);
      
      const data: BinanceTickerResponse = await response.json();
      return parseFloat(data.price);
    } catch (error) {
      console.log('Binance API failed, trying Bybit:', error instanceof Error ? error.message : String(error));
      return this.getBybitRate(currency);
    }
  }

  private async getBybitRate(currency: string): Promise<number> {
    const symbolMap = {
      'btc': 'BTCUSDT',
      'eth': 'ETHUSDT',
      'usdt-trc20': 'USDTUSDC', // USDT to USDC as proxy for USD
      'usdt-erc20': 'USDTUSDC',
      'usdc': 'USDCUSDT'
    };

    const symbol = symbolMap[currency as keyof typeof symbolMap];
    if (!symbol) return 1; // Default for stablecoins

    try {
      const response = await fetch(
        `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol}`,
        {
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        }
      );
      
      if (!response.ok) throw new Error(`Bybit API error: ${response.status}`);
      
      const data: BybitTickerResponse = await response.json();
      
      if (data.retCode !== 0 || !data.result?.list?.[0]) {
        throw new Error('Bybit API returned invalid data');
      }
      
      const price = parseFloat(data.result.list[0].lastPrice);
      
      // For USDT pairs, return close to 1
      if (currency.includes('usdt')) {
        return 1.0;
      }
      
      return price;
    } catch (error) {
      console.log('Bybit API failed, using fallback:', error instanceof Error ? error.message : String(error));
      return this.getFallbackRate(currency, 'usd');
    }
  }

  private async getCryptoCryptoRate(fromCurrency: string, toCurrency: string): Promise<number> {
    try {
      const fromUSD = await this.getCryptoToUSDRate(fromCurrency);
      const toUSD = await this.getCryptoToUSDRate(toCurrency);
      
      // Check if we got valid rates (not fallback 1 or 0)
      if (toUSD === 0 || fromUSD === 0 || (fromUSD === 1 && toUSD === 1)) {
        throw new Error('Invalid USD rates received, using direct pair fallback');
      }
      
      return fromUSD / toUSD;
    } catch (error) {
      console.log(`USD conversion failed for ${fromCurrency}-${toCurrency}, using direct fallback:`, error instanceof Error ? error.message : String(error));
      return this.getFallbackRate(fromCurrency, toCurrency);
    }
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
    // Comprehensive fallback rates with current market values
    const fallbackRates: { [key: string]: number } = {
      // Crypto to fiat - CURRENT MARKET RATES (September 2025)
      'usdt-trc20-card-mdl': 18.0,    // 1 USDT = 18 MDL
      'usdt-erc20-card-mdl': 18.0,    // 1 USDT = 18 MDL
      'usdt-trc20-card-usd': 1.0,     // 1 USDT = 1 USD
      'usdt-erc20-card-usd': 1.0,     // 1 USDT = 1 USD
      'usdt-trc20-card-eur': 0.92,    // 1 USDT = 0.92 EUR
      'usdt-erc20-card-eur': 0.92,    // 1 USDT = 0.92 EUR
      'usdc-card-usd': 1.0,           // 1 USDC = 1 USD
      'usdc-card-eur': 0.92,          // 1 USDC = 0.92 EUR
      'usdc-card-mdl': 18.0,          // 1 USDC = 18 MDL
      'btc-card-usd': 95000,          // 1 BTC = 95,000 USD
      'btc-card-eur': 87400,          // 1 BTC = 87,400 EUR
      'btc-card-mdl': 1710000,        // 1 BTC = 1,710,000 MDL
      'eth-card-usd': 3800,           // 1 ETH = 3,800 USD
      'eth-card-eur': 3496,           // 1 ETH = 3,496 EUR
      'eth-card-mdl': 68400,          // 1 ETH = 68,400 MDL
      // Crypto to USD (for conversions)
      'btc-usd': 95000,
      'eth-usd': 3800,
      'usdt-trc20-usd': 1.0,
      'usdt-erc20-usd': 1.0,
      'usdc-usd': 1.0,
      // Crypto to crypto
      'btc-usdt-trc20': 95000,
      'btc-usdt-erc20': 95000,
      'btc-usdc': 95000,
      'eth-usdt-trc20': 3800,
      'eth-usdt-erc20': 3800,
      'eth-usdc': 3800,
      'usdt-trc20-usdt-erc20': 1.0,
      'usdt-erc20-usdt-trc20': 1.0,
      'usdt-trc20-usdc': 1.0,
      'usdt-erc20-usdc': 1.0,
      // Reverse pairs
      'usdt-trc20-btc': 0.0000105,
      'usdt-erc20-btc': 0.0000105,
      'usdc-btc': 0.0000105,
      'usdt-trc20-eth': 0.000263,
      'usdt-erc20-eth': 0.000263,
      'usdc-eth': 0.000263,
    };

    const key = `${fromCurrency}-${toCurrency}`;
    const rate = fallbackRates[key];
    
    if (rate) {
      return rate;
    }
    
    // For debugging - only log missing pairs that we expect to exist
    if (toCurrency.startsWith('card-') || fromCurrency === 'btc' || fromCurrency === 'eth') {
      console.warn(`No fallback rate for ${key}, using 1`);
    }
    return 1;
  }

  async getAllRates(): Promise<Array<{ fromCurrency: string; toCurrency: string; rate: string }>> {
    const pairs = [
      // Stablecoins to fiat
      { from: 'usdt-trc20', to: 'card-mdl' },
      { from: 'usdt-erc20', to: 'card-mdl' },
      { from: 'usdt-trc20', to: 'card-usd' },
      { from: 'usdt-erc20', to: 'card-usd' },
      { from: 'usdt-trc20', to: 'card-eur' },
      { from: 'usdt-erc20', to: 'card-eur' },
      { from: 'usdc', to: 'card-usd' },
      { from: 'usdc', to: 'card-eur' },
      // Major crypto to fiat
      { from: 'btc', to: 'card-mdl' },
      { from: 'btc', to: 'card-usd' },
      { from: 'btc', to: 'card-eur' },
      { from: 'eth', to: 'card-mdl' },
      { from: 'eth', to: 'card-usd' },
      { from: 'eth', to: 'card-eur' },
      // Crypto to crypto
      { from: 'btc', to: 'usdt-trc20' },
      { from: 'btc', to: 'usdt-erc20' },
      { from: 'btc', to: 'usdc' },
      { from: 'eth', to: 'usdt-trc20' },
      { from: 'eth', to: 'usdt-erc20' },
      { from: 'eth', to: 'usdc' },
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