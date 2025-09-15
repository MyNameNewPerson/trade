import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Wallet, 
  Key,
  AlertCircle,
  Save,
  BarChart3,
  DollarSign,
  TrendingUp,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";

interface AdminUser {
  id: string;
  email: string;
  role: string;
}

interface WalletSetting {
  id: string;
  currency: string;
  address: string;
  network: string;
  isActive: boolean;
  createdAt: string;
}

interface PlatformSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  isEncrypted: boolean;
  updatedAt: string;
}

export function AdminPanelPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletSettings, setWalletSettings] = useState<WalletSetting[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSetting[]>([]);

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLocation('/admin/login');
      return;
    }

    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.user.role !== 'admin') {
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges",
            variant: "destructive",
          });
          setLocation('/');
          return;
        }
        setUser(result.user);
      } else {
        localStorage.removeItem('auth_token');
        setLocation('/admin/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth_token');
      setLocation('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      // Load wallet settings
      const walletResponse = await fetch('/api/admin/wallets', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (walletResponse.ok) {
        const wallets = await walletResponse.json();
        setWalletSettings(wallets);
      }

      // Load platform settings
      const settingsResponse = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (settingsResponse.ok) {
        const settings = await settingsResponse.json();
        setPlatformSettings(settings);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    setLocation('/admin/login');
  };

  const saveWalletSetting = async (currency: string, address: string, network: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch('/api/admin/wallets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currency, address, network, isActive: true }),
      });

      if (response.ok) {
        toast({
          title: "Wallet Updated",
          description: `${currency.toUpperCase()} wallet address has been saved`,
        });
        loadData();
      } else {
        throw new Error('Failed to save wallet');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save wallet setting",
        variant: "destructive",
      });
    }
  };

  const savePlatformSetting = async (key: string, value: string, description?: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          key, 
          value, 
          description,
          isEncrypted: key.includes('secret') || key.includes('key') || key.includes('token')
        }),
      });

      if (response.ok) {
        toast({
          title: "Setting Updated",
          description: `${key} has been saved`,
        });
        loadData();
      } else {
        throw new Error('Failed to save setting');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save platform setting",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AdminLayout 
      title="Dashboard" 
      currentSection="dashboard"
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Dashboard' }
      ]}
    >
      {/* Dashboard Overview */}
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">1,234</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">+12% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Volume</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">$2.1M</p>
                </div>
                <div className="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">+8% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Exchanges</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">856</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">+23% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Wallets</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">5</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Configured wallets</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Wallet Settings */}
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <Wallet className="h-5 w-5 mr-2" />
                Wallet Configuration
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Configure wallet addresses for deposits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Wallet Forms */}
              {['btc', 'eth', 'usdt-trc20'].slice(0, 3).map(currency => (
                <div key={currency} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                      <Wallet className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{currency.toUpperCase()}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {walletSettings.find(w => w.currency === currency)?.isActive ? 'Configured' : 'Not configured'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    data-testid={`button-configure-${currency}`}
                  >
                    Configure
                  </Button>
                </div>
              ))}
              <Button className="w-full" data-testid="button-view-all-wallets">
                View All Wallets
              </Button>
            </CardContent>
          </Card>

          {/* Platform Settings */}
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <Settings className="h-5 w-5 mr-2" />
                Platform Settings
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Quick access to key platform configurations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Platform Fee</p>
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {platformSettings.find(s => s.key === 'platform_fee_percent')?.value || '2.5'}%
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Min Exchange</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    ${platformSettings.find(s => s.key === 'min_exchange_amount_usd')?.value || '50'}
                  </p>
                </div>
              </div>
              <Button className="w-full" data-testid="button-view-all-settings">
                View All Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 dark:text-white">
              <BarChart3 className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Latest system events and transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { action: 'New user registration', time: '2 minutes ago', status: 'success' },
                { action: 'BTC wallet address updated', time: '15 minutes ago', status: 'info' },
                { action: 'Platform settings modified', time: '1 hour ago', status: 'warning' },
                { action: 'Exchange rate updated', time: '2 hours ago', status: 'info' },
                { action: 'System backup completed', time: '4 hours ago', status: 'success' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`h-2 w-2 rounded-full ${
                      activity.status === 'success' ? 'bg-green-500' :
                      activity.status === 'warning' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

// Wallet Setting Form Component
function WalletSettingForm({ 
  currency, 
  existing, 
  onSave 
}: { 
  currency: string;
  existing?: WalletSetting;
  onSave: (currency: string, address: string, network: string) => void;
}) {
  const [address, setAddress] = useState(existing?.address || '');
  const [network, setNetwork] = useState(existing?.network || getDefaultNetwork(currency));

  const handleSave = () => {
    if (address.trim()) {
      onSave(currency, address, network);
    }
  };

  return (
    <div className="p-4 border border-gray-600 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Label className="text-white font-medium">{currency.toUpperCase()}</Label>
          {existing?.isActive && <Badge variant="secondary" className="text-xs">Active</Badge>}
        </div>
        {existing && (
          <div className="text-xs text-gray-400">
            Updated: {new Date(existing.createdAt).toLocaleDateString()}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-sm text-gray-300">Сеть</Label>
          <Input
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white mt-1"
            placeholder="Network"
            data-testid={`input-network-${currency}`}
          />
        </div>
        <div className="md:col-span-2">
          <Label className="text-sm text-gray-300">Адрес кошелька</Label>
          <div className="flex mt-1 space-x-2">
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder={`Enter ${currency.toUpperCase()} address`}
              data-testid={`input-address-${currency}`}
            />
            <Button 
              onClick={handleSave}
              disabled={!address.trim()}
              className="bg-purple-600 hover:bg-purple-700"
              data-testid={`button-save-${currency}`}
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Platform Setting Form Component
function PlatformSettingForm({ 
  settingKey, 
  label, 
  description, 
  existing,
  onSave,
  sensitive = false
}: { 
  settingKey: string;
  label: string;
  description: string;
  existing?: PlatformSetting;
  onSave: (key: string, value: string, description?: string) => void;
  sensitive?: boolean;
}) {
  const [value, setValue] = useState(existing?.value || '');

  const handleSave = () => {
    if (value.trim()) {
      onSave(settingKey, value, description);
    }
  };

  return (
    <div className="p-4 border border-gray-600 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <Label className="text-white font-medium">{label}</Label>
        {existing && (
          <div className="flex items-center space-x-2">
            {existing.isEncrypted && <Badge variant="outline" className="text-xs">Encrypted</Badge>}
            <div className="text-xs text-gray-400">
              Updated: {new Date(existing.updatedAt).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>
      
      <p className="text-sm text-gray-400 mb-3">{description}</p>
      
      <div className="flex space-x-2">
        <Input
          type={sensitive ? "password" : "text"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="bg-gray-700 border-gray-600 text-white"
          placeholder={`Enter ${label.toLowerCase()}`}
          data-testid={`input-${settingKey}`}
        />
        <Button 
          onClick={handleSave}
          disabled={!value.trim()}
          className="bg-purple-600 hover:bg-purple-700"
          data-testid={`button-save-${settingKey}`}
        >
          <Save className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Helper function to get default network for currency
function getDefaultNetwork(currency: string): string {
  const networks: { [key: string]: string } = {
    'btc': 'Bitcoin',
    'eth': 'Ethereum',
    'usdt-trc20': 'TRC20',
    'usdt-erc20': 'ERC20',
    'usdc': 'ERC20',
  };
  return networks[currency] || 'Unknown';
}