import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { LanguageSelector } from "./language-selector";
import { ThemeToggle } from "./theme-toggle";
import { AuthProviders } from "./auth-providers";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { User, LogIn, Settings, LogOut, Menu, X } from "lucide-react";

export function Header() {
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          
          {/* Desktop Navigation */}
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
        
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Mobile Menu Button */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden p-2"
                data-testid="button-mobile-menu"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle className="text-left flex items-center space-x-2">
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">CF</span>
                  </div>
                  <span className="text-lg font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    {t('header.title')}
                  </span>
                </SheetTitle>
              </SheetHeader>
              
              {/* Mobile Navigation */}
              <nav className="flex flex-col space-y-4 mt-8">
                <Link 
                  href="/" 
                  className="text-foreground hover:text-primary transition-colors py-3 px-2 rounded-lg hover:bg-accent text-lg"
                  data-testid="mobile-link-exchange"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('header.nav.exchange')}
                </Link>
                <Link 
                  href="/rates" 
                  className="text-muted-foreground hover:text-primary transition-colors py-3 px-2 rounded-lg hover:bg-accent text-lg"
                  data-testid="mobile-link-rates"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('header.nav.rates')}
                </Link>
                <Link 
                  href="/about" 
                  className="text-muted-foreground hover:text-primary transition-colors py-3 px-2 rounded-lg hover:bg-accent text-lg"
                  data-testid="mobile-link-about"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('header.nav.about')}
                </Link>
                <Link 
                  href="/support" 
                  className="text-muted-foreground hover:text-primary transition-colors py-3 px-2 rounded-lg hover:bg-accent text-lg"
                  data-testid="mobile-link-support"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('header.nav.support')}
                </Link>
                
                {/* Mobile Actions */}
                <div className="border-t pt-4 mt-6 space-y-4">
                  <Link href="/order-status" data-testid="mobile-link-track-order" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" size="lg" className="w-full text-base">
                      {t('header.trackOrder')}
                    </Button>
                  </Link>
                  
                  {/* Mobile Auth Section */}
                  {isLoading ? (
                    <div className="w-full h-12 rounded-lg bg-gray-200 animate-pulse"></div>
                  ) : isAuthenticated && user ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.profileImageUrl || ''} alt={user.firstName || 'User'} />
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}`
                              : user.email || 'User'
                            }
                          </p>
                          {user.email && (
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="ghost" size="lg" className="w-full justify-start text-base">
                          <User className="mr-3 h-5 w-5" />
                          Dashboard
                        </Button>
                      </Link>
                      
                      {user.role === 'admin' && (
                        <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="ghost" size="lg" className="w-full justify-start text-base">
                            <Settings className="mr-3 h-5 w-5" />
                            Admin Panel
                          </Button>
                        </Link>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="lg"
                        className="w-full justify-start text-base text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          window.location.href = '/api/logout';
                        }}
                        data-testid="mobile-button-logout"
                      >
                        <LogOut className="mr-3 h-5 w-5" />
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <AuthProviders 
                        buttonSize="lg" 
                        layout="vertical"
                        title="Sign in to your account"
                        showTitle={true}
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  {/* Mobile Settings */}
                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Theme</span>
                      <ThemeToggle />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Language</span>
                      <LanguageSelector />
                    </div>
                  </div>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
          
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSelector />
            <ThemeToggle />
            <Link href="/order-status" data-testid="link-track-order">
              <Button variant="outline" size="sm">
                {t('header.trackOrder')}
              </Button>
            </Link>
            
            {/* Desktop Authentication Section */}
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
            ) : isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="button-user-menu">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImageUrl || ''} alt={user.firstName || 'User'} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-sm">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user.email || 'User'
                        }
                      </p>
                      {user.email && (
                        <p className="w-[200px] truncate text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <Link href="/dashboard">
                    <DropdownMenuItem data-testid="link-dashboard">
                      <User className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/admin">
                      <DropdownMenuItem data-testid="link-admin">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => window.location.href = '/api/logout'}
                    data-testid="button-logout-header"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    size="sm"
                    data-testid="button-login-header"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  <AuthProviders 
                    buttonSize="sm" 
                    layout="vertical"
                    title="Choose your sign-in method"
                    showTitle={true}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}