import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "./language-selector";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";

export function Header() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">CF</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              {t('header.title')}
            </span>
          </Link>
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="text-foreground hover:text-primary transition-colors" data-testid="link-exchange">
              {t('header.nav.exchange')}
            </Link>
            <Link href="/rates" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-rates">
              {t('header.nav.rates')}
            </Link>
            <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-about">
              {t('header.nav.about')}
            </Link>
            <Link href="/support" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-support">
              {t('header.nav.support')}
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <LanguageSelector />
          <ThemeToggle />
          <Link href="/order-status" data-testid="link-track-order">
            <Button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors">
              {t('header.trackOrder')}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
