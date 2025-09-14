import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Shield, 
  Wallet, 
  Users, 
  Key,
  LogOut,
  CheckCircle,
  AlertCircle,
  Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-purple-400" />
              <div>
                <h1 className="text-xl font-bold">CryptoFlow Admin</h1>
                <p className="text-sm text-gray-400">Панель управления платформой</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <div className="font-medium">{user.email}</div>
                <div className="text-gray-400">Administrator</div>
              </div>
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="text-gray-300 hover:text-white"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Exit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="wallets" className="space-y-8">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="wallets" className="data-[state=active]:bg-purple-600">
              <Wallet className="h-4 w-4 mr-2" />
              Кошельки
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-purple-600">
              <Settings className="h-4 w-4 mr-2" />
              Настройки
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-purple-600">
              <Key className="h-4 w-4 mr-2" />
              Безопасность
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-purple-600">
              <Users className="h-4 w-4 mr-2" />
              Пользователи
            </TabsTrigger>
          </TabsList>

          {/* Wallet Settings */}
          <TabsContent value="wallets" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Wallet className="h-5 w-5 mr-2" />
                  Настройка кошельков
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Управление адресами кошельков для получения депозитов
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {['btc', 'eth', 'usdt-trc20', 'usdt-erc20', 'usdc'].map(currency => (
                  <WalletSettingForm
                    key={currency}
                    currency={currency}
                    existing={walletSettings.find(w => w.currency === currency)}
                    onSave={saveWalletSetting}
                  />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Platform Settings */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Настройки платформы
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Общие настройки и конфигурация системы
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PlatformSettingForm
                  settingKey="platform_fee_percent"
                  label="Комиссия платформы (%)"
                  description="Процент комиссии с каждой сделки"
                  existing={platformSettings.find(s => s.key === 'platform_fee_percent')}
                  onSave={savePlatformSetting}
                />
                <PlatformSettingForm
                  settingKey="min_exchange_amount_usd"
                  label="Минимальная сумма обмена (USD)"
                  description="Минимальная сумма для проведения обмена"
                  existing={platformSettings.find(s => s.key === 'min_exchange_amount_usd')}
                  onSave={savePlatformSetting}
                />
                <PlatformSettingForm
                  settingKey="support_email"
                  label="Email поддержки"
                  description="Контактный email для пользователей"
                  existing={platformSettings.find(s => s.key === 'support_email')}
                  onSave={savePlatformSetting}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Key className="h-5 w-5 mr-2" />
                  Настройки безопасности
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Управление API ключами и токенами безопасности
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-orange-500 bg-orange-500/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-orange-200">
                    Будьте осторожны при изменении ключей безопасности. Неправильная конфигурация может нарушить работу системы.
                  </AlertDescription>
                </Alert>
                
                <PlatformSettingForm
                  settingKey="telegram_bot_token"
                  label="Telegram Bot Token"
                  description="Токен бота для уведомлений"
                  existing={platformSettings.find(s => s.key === 'telegram_bot_token')}
                  onSave={savePlatformSetting}
                  sensitive
                />
                <PlatformSettingForm
                  settingKey="telegram_chat_id"
                  label="Telegram Chat ID"
                  description="ID чата для отправки уведомлений"
                  existing={platformSettings.find(s => s.key === 'telegram_chat_id')}
                  onSave={savePlatformSetting}
                />
                <PlatformSettingForm
                  settingKey="bybit_api_key"
                  label="Bybit API Key"
                  description="API ключ для мониторинга депозитов"
                  existing={platformSettings.find(s => s.key === 'bybit_api_key')}
                  onSave={savePlatformSetting}
                  sensitive
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Management */}
          <TabsContent value="users" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Управление пользователями
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Создание и управление учетными записями
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="border-blue-500 bg-blue-500/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-blue-200">
                    Функция управления пользователями будет добавлена в следующих версиях.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
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