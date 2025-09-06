import { useTranslation } from "react-i18next";
import { Header } from "@/components/header";
import { ExchangeWidget } from "@/components/exchange-widget";
import { FeaturesSection } from "@/components/features-section";
import { CurrencyGrid } from "@/components/currency-grid";
import { SupportChat } from "@/components/support-chat";
import { Footer } from "@/components/footer";

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased transition-colors duration-300">
      <Header />
      
      {/* Hero Section */}
      <main className="min-h-screen gradient-bg">
        <div className="container mx-auto px-4 py-12">
          {/* Hero Content */}
          <div className="text-center mb-12 text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in" data-testid="text-hero-title">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/80 animate-slide-up" data-testid="text-hero-subtitle">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center space-x-2" data-testid="feature-support">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>{t('hero.features.support')}</span>
              </div>
              <div className="flex items-center space-x-2" data-testid="feature-no-registration">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>{t('hero.features.noRegistration')}</span>
              </div>
              <div className="flex items-center space-x-2" data-testid="feature-best-rates">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>{t('hero.features.bestRates')}</span>
              </div>
            </div>
          </div>

          {/* Exchange Widget */}
          <div id="exchange">
            <ExchangeWidget />
          </div>
        </div>
      </main>

      {/* Features Section */}
      <FeaturesSection />

      {/* Supported Currencies */}
      <CurrencyGrid />

      {/* Support Chat */}
      <SupportChat />

      {/* Footer */}
      <Footer />
    </div>
  );
}
