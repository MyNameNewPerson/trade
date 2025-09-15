import { Header } from "@/components/header";
import { ExchangeWidget } from "@/components/exchange-widget";
import { useTranslation } from "react-i18next";

export default function ExchangeOnly() {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative">
      {/* Falling Stars Background Effect */}
      <div className="falling-stars-container">
        <div className="falling-star"></div>
        <div className="falling-star"></div>
        <div className="falling-star"></div>
        <div className="falling-star"></div>
        <div className="falling-star"></div>
        <div className="falling-star"></div>
        <div className="falling-star"></div>
      </div>
      
      <Header />
      
      {/* Simple, clean exchange page */}
      <main className="min-h-[calc(100vh-4rem)] relative z-10">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          {/* Simple, minimal header */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2" data-testid="text-exchange-title">
              {t('exchange.pageTitle')}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto" data-testid="text-exchange-description">
              {t('exchange.pageDescription')}
            </p>
          </div>
          
          {/* Exchange Widget - Main Focus */}
          <div className="flex justify-center">
            <ExchangeWidget />
          </div>
        </div>
      </main>
    </div>
  );
}