import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Wallet,
  Plus,
  Pencil,
  Trash2,
  Power,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Copy
} from "lucide-react";

interface WalletSetting {
  id: string;
  currency: string;
  address: string;
  network: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

interface WalletFormData {
  currency: string;
  address: string;
  network: string;
  isActive: boolean;
}

const SUPPORTED_CURRENCIES = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', networks: ['BTC'] },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', networks: ['ERC20'] },
  { id: 'usdt-trc20', name: 'USDT (TRC20)', symbol: 'USDT', networks: ['TRC20'] },
  { id: 'usdt-erc20', name: 'USDT (ERC20)', symbol: 'USDT', networks: ['ERC20'] },
  { id: 'usdc', name: 'USD Coin', symbol: 'USDC', networks: ['ERC20', 'TRC20'] },
];

export function AdminWalletsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingWallet, setEditingWallet] = useState<WalletSetting | null>(null);
  const [formData, setFormData] = useState<WalletFormData>({
    currency: '',
    address: '',
    network: '',
    isActive: true,
  });

  // Fetch wallets
  const {
    data: wallets = [],
    isLoading: isLoadingWallets,
    error: walletsError
  } = useQuery({
    queryKey: ['admin-wallets'],
    queryFn: async () => {
      const response = await fetch('/api/admin/wallets', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch wallets');
      }
      return response.json();
    },
  });

  // Create wallet mutation
  const createWalletMutation = useMutation({
    mutationFn: async (data: WalletFormData) => {
      const response = await fetch('/api/admin/wallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create wallet');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-wallets'] });
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: "Успешно",
        description: "Кошелек создан успешно",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update wallet mutation
  const updateWalletMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<WalletFormData> }) => {
      const response = await fetch(`/api/admin/wallets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update wallet');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-wallets'] });
      setEditingWallet(null);
      resetForm();
      toast({
        title: "Успешно",
        description: "Кошелек обновлен успешно",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete wallet mutation
  const deleteWalletMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/wallets/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete wallet');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-wallets'] });
      toast({
        title: "Успешно",
        description: "Кошелек удален успешно",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      currency: '',
      address: '',
      network: '',
      isActive: true,
    });
  };

  const handleCreate = () => {
    setEditingWallet(null);
    resetForm();
    setShowCreateDialog(true);
  };

  const handleEdit = (wallet: WalletSetting) => {
    setEditingWallet(wallet);
    setFormData({
      currency: wallet.currency,
      address: wallet.address,
      network: wallet.network,
      isActive: wallet.isActive,
    });
    setShowCreateDialog(true);
  };

  const handleSubmit = () => {
    if (!formData.currency || !formData.address || !formData.network) {
      toast({
        title: "Ошибка валидации",
        description: "Заполните все обязательные поля",
        variant: "destructive",
      });
      return;
    }

    if (editingWallet) {
      updateWalletMutation.mutate({ id: editingWallet.id, data: formData });
    } else {
      createWalletMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот кошелек?')) {
      deleteWalletMutation.mutate(id);
    }
  };

  const toggleWalletStatus = (wallet: WalletSetting) => {
    updateWalletMutation.mutate({
      id: wallet.id,
      data: { isActive: !wallet.isActive }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Скопировано",
        description: "Адрес скопирован в буфер обмена",
      });
    });
  };

  const getCurrencyInfo = (currencyId: string) => {
    return SUPPORTED_CURRENCIES.find(c => c.id === currencyId) || 
           { id: currencyId, name: currencyId.toUpperCase(), symbol: currencyId.toUpperCase(), networks: [] };
  };

  const getAvailableNetworks = (currencyId: string) => {
    const currency = SUPPORTED_CURRENCIES.find(c => c.id === currencyId);
    return currency?.networks || [];
  };

  useEffect(() => {
    if (formData.currency) {
      const networks = getAvailableNetworks(formData.currency);
      if (networks.length === 1 && !formData.network) {
        setFormData(prev => ({ ...prev, network: networks[0] }));
      }
    }
  }, [formData.currency]);

  return (
    <AdminLayout currentSection="wallets">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Wallet className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Управление кошельками
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Настройка адресов кошельков для получения платежей
              </p>
            </div>
          </div>
          <Button onClick={handleCreate} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Добавить кошелек</span>
          </Button>
        </div>

        {/* Wallets Grid */}
        {walletsError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Ошибка загрузки кошельков: {walletsError.message}
            </AlertDescription>
          </Alert>
        )}

        {isLoadingWallets ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-600">Загрузка кошельков...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wallets.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Wallet className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Кошельки не настроены</p>
                <p className="text-gray-400 text-sm">Добавьте первый кошелек для приема платежей</p>
                <Button onClick={handleCreate} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить кошелек
                </Button>
              </div>
            ) : (
              wallets.map((wallet: WalletSetting) => {
                const currencyInfo = getCurrencyInfo(wallet.currency);
                return (
                  <Card key={wallet.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {currencyInfo.symbol}
                            </span>
                          </div>
                          <div>
                            <CardTitle className="text-lg">{currencyInfo.name}</CardTitle>
                            <CardDescription>{wallet.network}</CardDescription>
                          </div>
                        </div>
                        <Badge variant={wallet.isActive ? "default" : "secondary"}>
                          {wallet.isActive ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {wallet.isActive ? 'Активен' : 'Неактивен'}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-gray-500 uppercase tracking-wider">
                            Адрес кошелька
                          </Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <code className="flex-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono break-all">
                              {wallet.address}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(wallet.address)}
                              className="h-8 w-8 p-0"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(wallet)}
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleWalletStatus(wallet)}
                              className="h-8 w-8 p-0"
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(wallet.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(wallet.createdAt).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingWallet ? 'Редактировать кошелек' : 'Добавить кошелек'}
              </DialogTitle>
              <DialogDescription>
                {editingWallet 
                  ? 'Обновите данные кошелька для приема платежей' 
                  : 'Добавьте новый кошелек для приема платежей от пользователей'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="currency">Валюта *</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value, network: '' }))}
                  disabled={!!editingWallet}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите валюту" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map((currency) => (
                      <SelectItem key={currency.id} value={currency.id}>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{currency.symbol}</span>
                          <span className="text-gray-500">- {currency.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.currency && (
                <div>
                  <Label htmlFor="network">Сеть *</Label>
                  <Select 
                    value={formData.network} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, network: value }))}
                    disabled={!!editingWallet}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите сеть" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableNetworks(formData.currency).map((network) => (
                        <SelectItem key={network} value={network}>
                          {network}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="address">Адрес кошелька *</Label>
                <Input
                  id="address"
                  placeholder="Введите адрес кошелька"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="font-mono"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Активен</Label>
              </div>
            </div>

            <DialogFooter className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
                disabled={createWalletMutation.isPending || updateWalletMutation.isPending}
              >
                Отмена
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={createWalletMutation.isPending || updateWalletMutation.isPending}
              >
                {createWalletMutation.isPending || updateWalletMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingWallet ? 'Сохранить' : 'Создать'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}