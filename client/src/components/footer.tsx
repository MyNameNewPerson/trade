import { useTranslation } from "react-i18next";
import { Link } from "wouter";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-muted/30 py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2" data-testid="link-footer-home">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">CF</span>
              </div>
              <span className="text-xl font-bold">{t('header.title')}</span>
            </Link>
            <p className="text-muted-foreground text-sm" data-testid="text-footer-description">
              {t('footer.description')}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('footer.services')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors" data-testid="link-crypto-exchange">
                  {t('footer.links.cryptoExchange')}
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-foreground transition-colors" data-testid="link-card-payouts">
                  {t('footer.links.cardPayouts')}
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-foreground transition-colors" data-testid="link-fixed-rate">
                  {t('footer.links.fixedRate')}
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-foreground transition-colors" data-testid="link-float-rate">
                  {t('footer.links.floatRate')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('footer.support')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors" data-testid="link-help-center">
                  {t('footer.links.helpCenter')}
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-foreground transition-colors" data-testid="link-contact-us">
                  {t('footer.links.contactUs')}
                </Link>
              </li>
              <li>
                <Link href="/order-status" className="hover:text-foreground transition-colors" data-testid="link-track-order-footer">
                  {t('footer.links.trackOrder')}
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-foreground transition-colors" data-testid="link-api-docs">
                  {t('footer.links.apiDocs')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors" data-testid="link-terms">
                  {t('footer.links.terms')}
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-foreground transition-colors" data-testid="link-privacy">
                  {t('footer.links.privacy')}
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-foreground transition-colors" data-testid="link-aml">
                  {t('footer.links.aml')}
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-foreground transition-colors" data-testid="link-kyc">
                  {t('footer.links.kyc')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground" data-testid="text-copyright">
            {t('footer.copyright')}
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-twitter">
              <span className="sr-only">Twitter</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-telegram">
              <span className="sr-only">Telegram</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
