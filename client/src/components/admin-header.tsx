import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  LogOut, 
  User, 
  ChevronRight,
  Bell,
  Search,
  Settings
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { BreadcrumbItem } from "./admin-types";
import { useToast } from "@/hooks/use-toast";

interface AdminHeaderProps {
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
  onMenuClick: () => void;
}

interface AdminUser {
  id: string;
  email: string;
  role: string;
}

export function AdminHeader({ title, breadcrumbs = [], onMenuClick }: AdminHeaderProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [notifications] = useState(3); // Mock notifications count

  useEffect(() => {
    // Get user info from localStorage or API
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      try {
        const response = await fetch('/api/auth/verify', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const result = await response.json();
          setUser(result.user);
        }
      } catch (error) {
        console.error('Failed to get user info:', error);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    setLocation('/admin/login');
  };

  const getPageTitle = () => {
    if (title) return title;
    
    // Generate title from current path
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    
    if (lastSegment === 'admin' || !lastSegment) return 'Dashboard';
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  };

  const getCurrentBreadcrumbs = (): BreadcrumbItem[] => {
    if (breadcrumbs.length > 0) return breadcrumbs;
    
    // Generate breadcrumbs from current path
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    
    const crumbs: BreadcrumbItem[] = [
      { label: 'Admin', href: '/admin' }
    ];
    
    if (segments.length > 1) {
      const section = segments[segments.length - 1];
      if (section !== 'admin') {
        crumbs.push({ 
          label: section.charAt(0).toUpperCase() + section.slice(1) 
        });
      }
    }
    
    return crumbs;
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800 sm:px-6 lg:px-8">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          data-testid="button-mobile-menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm">
          {getCurrentBreadcrumbs().map((crumb, index) => (
            <div key={index} className="flex items-center space-x-2">
              {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  data-testid={`breadcrumb-${index}`}
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="font-medium text-gray-900 dark:text-white">
                  {crumb.label}
                </span>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Page title */}
      <div className="hidden sm:block">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search..."
              className="w-64 pl-9 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
              data-testid="input-search"
            />
          </div>
        </div>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="sm"
          className="relative text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {notifications > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {notifications}
            </Badge>
          )}
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              data-testid="button-user-menu"
            >
              <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium">
                  {user?.email || 'Admin'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Administrator
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem data-testid="menu-item-profile">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem data-testid="menu-item-settings">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="text-red-600 dark:text-red-400"
              data-testid="menu-item-logout"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}