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
  Coins,
  Plus,
  Pencil,
  Trash2,
  Power,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from "lucide-react";

interface Currency {
  id: string;
  name: string;
  symbol: string;
  type: 'crypto' | 'fiat';
  network: string | null;
  minAmount: string;
  maxAmount: string;
  isActive: boolean;
  iconUrl: string | null;
}

interface CurrencyFormData {
  id: string;
  name: string;
  symbol: string;
  type: 'crypto' | 'fiat';
  network: string;
  minAmount: string;
  maxAmount: string;
  isActive: boolean;
  iconUrl: string;
}

export function AdminCurrenciesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [formData, setFormData] = useState<CurrencyFormData>({
    id: '',
    name: '',
    symbol: '',
    type: 'crypto',
    network: '',
    minAmount: '',
    maxAmount: '',
    isActive: true,
    iconUrl: ''
  });

  // Fetch currencies
  const { data: currencies = [], isLoading, error, refetch } = useQuery<Currency[]>({
    queryKey: ['/api/admin/currencies'],
    retry: 2,
  });

  // Create currency mutation
  const createMutation = useMutation({
    mutationFn: async (data: CurrencyFormData) => {
      const response = await fetch('/api/admin/currencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create currency');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Валюта создана",
        description: "Новая валюта успешно добавлена в систему",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/currencies'] });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка создания",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update currency mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CurrencyFormData> }) => {
      const response = await fetch(`/api/admin/currencies/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update currency');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Валюта обновлена",
        description: "Изменения успешно сохранены",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/currencies'] });
      setEditingCurrency(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка обновления",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Toggle active status mutation
  const toggleMutation = useMutation({
    mutationFn: async (currency: Currency) => {
      const response = await fetch(`/api/admin/currencies/${currency.id}/toggle`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to toggle currency status');
      }

      return response.json();
    },
    onSuccess: (_, currency) => {
      toast({
        title: currency.isActive ? "Валюта деактивирована" : "Валюта активирована",
        description: `${currency.name} теперь ${currency.isActive ? 'неактивна' : 'активна'}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/currencies'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete currency mutation
  const deleteMutation = useMutation({
    mutationFn: async (currencyId: string) => {
      const response = await fetch(`/api/admin/currencies/${currencyId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete currency');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Валюта удалена",
        description: "Валюта была успешно удалена из системы",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/currencies'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка удаления",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      symbol: '',
      type: 'crypto',
      network: '',
      minAmount: '',
      maxAmount: '',
      isActive: true,
      iconUrl: ''
    });
  };

  const handleEdit = (currency: Currency) => {
    setEditingCurrency(currency);
    setFormData({
      id: currency.id,
      name: currency.name,
      symbol: currency.symbol,
      type: currency.type,
      network: currency.network || '',
      minAmount: currency.minAmount,
      maxAmount: currency.maxAmount,
      isActive: currency.isActive,
      iconUrl: currency.iconUrl || ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCurrency) {
      updateMutation.mutate({ id: editingCurrency.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: "Обновлено",
        description: "Список валют успешно обновлен",
      });
    } catch (error) {
      toast({
        title: "Ошибка обновления",
        description: "Не удалось обновить список валют",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <AdminLayout
        title="Управление валютами"
        currentSection="currencies"
        breadcrumbs={[
          { label: 'Админ', href: '/admin' },
          { label: 'Валюты' }
        ]}
      >
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-700 dark:text-red-300">
            Не удалось загрузить список валют. Проверьте подключение и попробуйте снова.
          </AlertDescription>
        </Alert>
        <div className="flex justify-center mt-4">
          <Button onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Повторить попытку
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Управление валютами"
      currentSection="currencies"
      breadcrumbs={[
        { label: 'Админ', href: '/admin' },
        { label: 'Валюты' }
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Управление валютами
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Добавляйте, редактируйте и управляйте валютами для обмена
            </p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Обновить
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setEditingCurrency(null); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить валюту
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <Coins className="h-5 w-5 mr-2" />
                      {editingCurrency ? 'Редактировать валюту' : 'Новая валюта'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingCurrency ? 'Изменить параметры валюты' : 'Добавить новую валюту в систему'}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="currency-id">ID валюты</Label>
                        <Input
                          id="currency-id"
                          placeholder="btc, eth, usdt"
                          value={formData.id}
                          onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase() })}
                          disabled={!!editingCurrency}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="currency-symbol">Символ</Label>
                        <Input
                          id="currency-symbol"
                          placeholder="BTC, ETH, USDT"
                          value={formData.symbol}
                          onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="currency-name">Название</Label>
                      <Input
                        id="currency-name"
                        placeholder="Bitcoin, Ethereum, Tether"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="currency-type">Тип</Label>
                        <Select value={formData.type} onValueChange={(value: 'crypto' | 'fiat') => setFormData({ ...formData, type: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="crypto">Криптовалюта</SelectItem>
                            <SelectItem value="fiat">Фиатная валюта</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="currency-network">Сеть</Label>
                        <Input
                          id="currency-network"
                          placeholder="BTC, ETH, TRC20, ERC20"
                          value={formData.network}
                          onChange={(e) => setFormData({ ...formData, network: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="min-amount">Мин. сумма</Label>
                        <Input
                          id="min-amount"
                          type="number"
                          step="any"
                          placeholder="0.001"
                          value={formData.minAmount}
                          onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="max-amount">Макс. сумма</Label>
                        <Input
                          id="max-amount"
                          type="number"
                          step="any"
                          placeholder="10"
                          value={formData.maxAmount}
                          onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="icon-url">URL иконки (необязательно)</Label>
                      <Input
                        id="icon-url"
                        placeholder="https://cryptoicons.org/api/icon/btc/200"
                        value={formData.iconUrl}
                        onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is-active"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      />
                      <Label htmlFor="is-active">Активна</Label>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {
                      setShowCreateDialog(false);
                      setEditingCurrency(null);
                      resetForm();
                    }}>
                      Отмена
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {(createMutation.isPending || updateMutation.isPending) && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                      {editingCurrency ? 'Сохранить' : 'Создать'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Currencies Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Coins className="h-5 w-5 mr-2" />
              Список валют ({currencies.length})
            </CardTitle>
            <CardDescription>
              Управление всеми поддерживаемыми валютами в системе
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
                    </div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : currencies.length === 0 ? (
              <div className="text-center py-8">
                <Coins className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  Нет валют
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Добавьте первую валюту для начала работы с системой обмена
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Валюта</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Сеть</TableHead>
                    <TableHead>Лимиты</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currencies.map((currency) => (
                    <TableRow key={currency.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {currency.iconUrl ? (
                            <img 
                              src={currency.iconUrl} 
                              alt={currency.symbol}
                              className="h-8 w-8 rounded-full"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {currency.symbol.slice(0, 2)}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {currency.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {currency.symbol} ({currency.id})
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={currency.type === 'crypto' ? 'default' : 'secondary'}>
                          {currency.type === 'crypto' ? 'Крипто' : 'Фиат'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {currency.network ? (
                          <Badge variant="outline">{currency.network}</Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{currency.minAmount} — {currency.maxAmount}</div>
                          <div className="text-gray-500">{currency.symbol}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {currency.isActive ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className={currency.isActive ? 'text-green-600' : 'text-red-600'}>
                            {currency.isActive ? 'Активна' : 'Неактивна'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              handleEdit(currency);
                              setShowCreateDialog(true);
                            }}
                            data-testid={`edit-currency-${currency.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleMutation.mutate(currency)}
                            disabled={toggleMutation.isPending}
                            data-testid={`toggle-currency-${currency.id}`}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (window.confirm(`Вы уверены, что хотите удалить валюту ${currency.name}?`)) {
                                deleteMutation.mutate(currency.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`delete-currency-${currency.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}