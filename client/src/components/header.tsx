import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "./language-selector";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, LogIn, Settings, LogOut } from "lucide-react";

export function Header() {
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading } = useAuth();

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
            <Button variant="outline" size="sm">
              {t('header.trackOrder')}
            </Button>
          </Link>
          
          {/* Authentication Section */}
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
            <Button 
              onClick={() => window.location.href = '/api/login'}
              size="sm"
              data-testid="button-login-header"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
