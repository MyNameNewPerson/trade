import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  Wallet, 
  Coins, 
  ArrowLeftRight, 
  FileText, 
  Settings,
  Shield,
  X,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  currentSection: string;
  onClose: () => void;
}

const navigationItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: BarChart3,
    href: "/admin",
    badge: null
  },
  {
    id: "users",
    label: "Users",
    icon: Users,
    href: "/admin/users",
    badge: null
  },
  {
    id: "telegram",
    label: "Telegram",
    icon: MessageSquare,
    href: "/admin/telegram",
    badge: null
  },
  {
    id: "wallets",
    label: "Wallets",
    icon: Wallet,
    href: "/admin/wallets",
    badge: null
  },
  {
    id: "currencies",
    label: "Currencies",
    icon: Coins,
    href: "/admin/currencies",
    badge: null
  },
  {
    id: "exchanges",
    label: "Exchange Methods",
    icon: ArrowLeftRight,
    href: "/admin/exchanges",
    badge: null
  },
  {
    id: "logs",
    label: "Logs",
    icon: FileText,
    href: "/admin/logs",
    badge: "New"
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: "/admin/settings",
    badge: null
  }
];

export function AdminSidebar({ currentSection, onClose }: SidebarProps) {
  const [location] = useLocation();

  const isActive = (item: typeof navigationItems[0]) => {
    return location === item.href || (item.id === "dashboard" && location === "/admin");
  };

  return (
    <div className="flex h-full w-64 flex-col bg-white dark:bg-gray-800 shadow-lg">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900 dark:text-white">CryptoFlow</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</span>
          </div>
        </div>
        
        {/* Mobile close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          data-testid="button-close-sidebar"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`
                group flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                ${active 
                  ? 'bg-purple-100 text-purple-900 dark:bg-purple-900/20 dark:text-purple-100' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                }
              `}
              onClick={onClose}
              data-testid={`nav-link-${item.id}`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`h-5 w-5 flex-shrink-0 ${
                  active ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                }`} />
                <span className="truncate">{item.label}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                {item.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {item.badge}
                  </Badge>
                )}
                {active && (
                  <ChevronRight className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <Separator className="mx-3" />

      {/* Footer */}
      <div className="p-4">
        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-900 dark:text-white">System Status</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">All systems operational</p>
          </div>
        </div>
      </div>
    </div>
  );
}