import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useEffect, useState } from "react";
import type { ExchangeRate, Currency } from "@shared/schema";

export default function Rates() {
  const { t } = useTranslation();
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  
  const { data: currencies = [] } = useQuery<Currency[]>({
    queryKey: ['/api/currencies'],
  });

  const { data: initialRates = [] } = useQuery<ExchangeRate[]>({
    queryKey: ['/api/rates'],
  });

  const { lastMessage } = useWebSocket("/ws");

  useEffect(() => {
    if (initialRates.length > 0) {
      setRates(initialRates);
    }
  }, [initialRates]);

  useEffect(() => {
    if (lastMessage && lastMessage.type === 'rates_update') {
      setRates(lastMessage.data);
    }
  }, [lastMessage]);

  const getCurrencyInfo = (currencyId: string) => {
    return currencies.find(c => c.id === currencyId) || { symbol: currencyId.toUpperCase(), name: currencyId };
  };

  const formatRate = (rate: string) => {
    const numRate = parseFloat(rate);
    if (numRate >= 1) {
      return numRate.toFixed(2);
    } else if (numRate >= 0.01) {
      return numRate.toFixed(4);
    } else {
      return numRate.toFixed(8);
    }
  };

  const groupedRates = rates.reduce((acc, rate) => {
    const from = rate.fromCurrency;
    if (!acc[from]) {
      acc[from] = [];
    }
    acc[from].push(rate);
    return acc;
  }, {} as Record<string, ExchangeRate[]>);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            {t('rates.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('rates.subtitle')}
          </p>
        </div>

        {/* Live Indicator */}
        <div className="flex items-center justify-center mb-8">
          <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
            {t('rates.liveRates')}
          </Badge>
        </div>

        {/* Rates Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(groupedRates).map(([fromCurrency, currencyRates]) => {
            const fromInfo = getCurrencyInfo(fromCurrency);
            
            return (
              <Card key={fromCurrency} className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {fromInfo.symbol?.substring(0, 2)}
                    </div>
                    <div>
                      <div className="font-semibold">{fromInfo.symbol}</div>
                      <div className="text-sm text-muted-foreground">{fromInfo.name}</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currencyRates.map((rate) => {
                    const toInfo = getCurrencyInfo(rate.toCurrency);
                    const isCard = rate.toCurrency.startsWith('card-');
                    
                    return (
                      <div key={rate.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {isCard ? '💳' : toInfo.symbol?.substring(0, 1)}
                          </div>
                          <div className="text-sm">
                            <div className="font-medium">{toInfo.symbol}</div>
                            {isCard && (
                              <div className="text-xs text-blue-600">{t('rates.cardPayout')}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            {formatRate(rate.rate)}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Live
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-gradient-to-br from-primary/5 to-purple-600/5 rounded-xl p-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">{t('rates.realTime')}</h3>
              <p className="text-muted-foreground">{t('rates.realTimeDesc')}</p>
            </div>
            <div>
              <ArrowRight className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">{t('rates.lowFees')}</h3>
              <p className="text-muted-foreground">{t('rates.lowFeesDesc')}</p>
            </div>
            <div>
              <TrendingDown className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">{t('rates.bestRates')}</h3>
              <p className="text-muted-foreground">{t('rates.bestRatesDesc')}</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}