import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import type { Currency } from "@shared/schema";

const currencyImages = {
  'btc': 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?ixlib=rb-4.0.3&w=100&h=100&fit=crop&crop=center',
  'eth': 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3&w=100&h=100&fit=crop&crop=center',
  'usdt-trc20': 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?ixlib=rb-4.0.3&w=100&h=100&fit=crop&crop=center',
  'usdt-erc20': 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?ixlib=rb-4.0.3&w=100&h=100&fit=crop&crop=center',
  'usdc': 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?ixlib=rb-4.0.3&w=100&h=100&fit=crop&crop=center',
  'card-mdl': 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&w=100&h=100&fit=crop&crop=center',
  'card-usd': 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&w=100&h=100&fit=crop&crop=center',
  'card-eur': 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&w=100&h=100&fit=crop&crop=center',
};

export function CurrencyGrid() {
  const { t } = useTranslation();
  
  const { data: currencies = [], isLoading } = useQuery<Currency[]>({
    queryKey: ['/api/currencies'],
  });

  if (isLoading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('currencies.title')}</h2>
            <p className="text-muted-foreground text-lg">
              {t('currencies.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <CardContent className="text-center p-0">
                  <div className="w-12 h-12 bg-muted rounded-full mx-auto mb-3"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('currencies.title')}</h2>
          <p className="text-muted-foreground text-lg">
            {t('currencies.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {currencies.map((currency) => (
            <Card 
              key={currency.id} 
              className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
              data-testid={`currency-card-${currency.id}`}
            >
              <CardContent className="p-6 text-center">
                <img 
                  src={currencyImages[currency.id as keyof typeof currencyImages] || 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?ixlib=rb-4.0.3&w=100&h=100&fit=crop&crop=center'}
                  alt={currency.name}
                  className="w-12 h-12 mx-auto mb-3 rounded-full object-cover"
                  data-testid={`currency-image-${currency.id}`}
                />
                <h3 className="font-semibold text-sm" data-testid={`currency-name-${currency.id}`}>
                  {currency.name}
                </h3>
                <p className="text-xs text-muted-foreground" data-testid={`currency-symbol-${currency.id}`}>
                  {currency.symbol}
                </p>
                {currency.network && (
                  <p className="text-xs text-muted-foreground" data-testid={`currency-network-${currency.id}`}>
                    {currency.network}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
