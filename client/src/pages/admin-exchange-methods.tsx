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
import { Textarea } from "@/components/ui/textarea";
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
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  Power,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Wallet,
  ArrowUpDown
} from "lucide-react";

interface ExchangeMethod {
  id: string;
  name: string;
  code: string;
  type: 'fiat_in' | 'fiat_out' | 'crypto_in' | 'crypto_out';
  supportedCurrencies: string[];
  parameters: any;
  isEnabled: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface Currency {
  id: string;
  name: string;
  symbol: string;
  type: 'crypto' | 'fiat';
  isActive: boolean;
}

interface ExchangeMethodFormData {
  name: string;
  code: string;
  type: 'fiat_in' | 'fiat_out' | 'crypto_in' | 'crypto_out';
  supportedCurrencies: string[];
  description: string;
  isEnabled: boolean;
  parameters: {
    minAmount?: string;
    maxAmount?: string;
    fee?: string;
    processingTime?: string;
    [key: string]: any;
  };
}

export function AdminExchangeMethodsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ExchangeMethod | null>(null);
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [formData, setFormData] = useState<ExchangeMethodFormData>({
    name: '',
    code: '',
    type: 'fiat_out',
    supportedCurrencies: [],
    description: '',
    isEnabled: true,
    parameters: {
      minAmount: '',
      maxAmount: '',
      fee: '',
      processingTime: ''
    }
  });

  // Fetch exchange methods
  const { data: methods = [], isLoading, error, refetch } = useQuery<ExchangeMethod[]>({
    queryKey: ['/api/admin/exchange-methods'],
    retry: 2,
  });

  // Fetch currencies for selection
  const { data: currencies = [] } = useQuery<Currency[]>({
    queryKey: ['/api/admin/currencies'],
    retry: 2,
  });

  // Create method mutation
  const createMutation = useMutation({
    mutationFn: async (data: ExchangeMethodFormData) => {
      const response = await fetch('/api/admin/exchange-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create exchange method');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Способ обмена создан",
        description: "Новый способ обмена успешно добавлен в систему",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/exchange-methods'] });
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

  // Update method mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ExchangeMethodFormData> }) => {
      const response = await fetch(`/api/admin/exchange-methods/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update exchange method');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Способ обмена обновлен",
        description: "Изменения успешно сохранены",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/exchange-methods'] });
      setEditingMethod(null);
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

  // Delete method mutation
  const deleteMutation = useMutation({
    mutationFn: async (methodId: string) => {
      const response = await fetch(`/api/admin/exchange-methods/${methodId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete exchange method');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Способ обмена удален",
        description: "Способ обмена был успешно удален из системы",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/exchange-methods'] });
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
      name: '',
      code: '',
      type: 'fiat_out',
      supportedCurrencies: [],
      description: '',
      isEnabled: true,
      parameters: {
        minAmount: '',
        maxAmount: '',
        fee: '',
        processingTime: ''
      }
    });
    setSelectedCurrencies([]);
  };

  const handleEdit = (method: ExchangeMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      code: method.code,
      type: method.type,
      supportedCurrencies: method.supportedCurrencies,
      description: method.description || '',
      isEnabled: method.isEnabled,
      parameters: method.parameters || {
        minAmount: '',
        maxAmount: '',
        fee: '',
        processingTime: ''
      }
    });
    setSelectedCurrencies(method.supportedCurrencies);
  };

  const handleCurrencyToggle = (currencyId: string) => {
    const newSelected = selectedCurrencies.includes(currencyId)
      ? selectedCurrencies.filter(id => id !== currencyId)
      : [...selectedCurrencies, currencyId];
    
    setSelectedCurrencies(newSelected);
    setFormData({ ...formData, supportedCurrencies: newSelected });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingMethod) {
      updateMutation.mutate({ id: editingMethod.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'fiat_in':
      case 'fiat_out':
        return <CreditCard className="h-4 w-4" />;
      case 'crypto_in':
      case 'crypto_out':
        return <Wallet className="h-4 w-4" />;
      default:
        return <ArrowUpDown className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'fiat_in': return 'Фиат → Крипто';
      case 'fiat_out': return 'Крипто → Фиат';
      case 'crypto_in': return 'Крипто → Крипто (вход)';
      case 'crypto_out': return 'Крипто → Крипто (выход)';
      default: return type;
    }
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: "Обновлено",
        description: "Список способов обмена успешно обновлен",
      });
    } catch (error) {
      toast({
        title: "Ошибка обновления",
        description: "Не удалось обновить список способов обмена",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <AdminLayout
        title="Способы обмена"
        currentSection="exchange-methods"
        breadcrumbs={[
          { label: 'Админ', href: '/admin' },
          { label: 'Способы обмена' }
        ]}
      >
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-700 dark:text-red-300">
            Не удалось загрузить список способов обмена. Проверьте подключение и попробуйте снова.
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
      title="Способы обмена"
      currentSection="exchange-methods"
      breadcrumbs={[
        { label: 'Админ', href: '/admin' },
        { label: 'Способы обмена' }
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Способы обмена
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Управление способами ввода и вывода средств
            </p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Обновить
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setEditingMethod(null); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить способ
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <ArrowUpDown className="h-5 w-5 mr-2" />
                      {editingMethod ? 'Редактировать способ обмена' : 'Новый способ обмена'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingMethod ? 'Изменить параметры способа обмена' : 'Добавить новый способ обмена валют'}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="method-name">Название</Label>
                        <Input
                          id="method-name"
                          placeholder="Банковская карта"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="method-code">Код</Label>
                        <Input
                          id="method-code"
                          placeholder="bank_card"
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                          disabled={!!editingMethod}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="method-type">Тип операции</Label>
                      <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fiat_in">Фиат → Крипто (ввод фиата)</SelectItem>
                          <SelectItem value="fiat_out">Крипто → Фиат (вывод в фиат)</SelectItem>
                          <SelectItem value="crypto_in">Крипто → Крипто (ввод крипто)</SelectItem>
                          <SelectItem value="crypto_out">Крипто → Крипто (вывод крипто)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Поддерживаемые валюты</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto border rounded p-2">
                        {currencies.filter(currency => 
                          (formData.type.includes('fiat') && currency.type === 'fiat') ||
                          (formData.type.includes('crypto') && currency.type === 'crypto')
                        ).map((currency) => (
                          <div key={currency.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`currency-${currency.id}`}
                              checked={selectedCurrencies.includes(currency.id)}
                              onChange={() => handleCurrencyToggle(currency.id)}
                              className="rounded"
                            />
                            <Label htmlFor={`currency-${currency.id}`} className="text-sm">
                              {currency.symbol} ({currency.name})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="method-description">Описание</Label>
                      <Textarea
                        id="method-description"
                        placeholder="Описание способа обмена..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Параметры</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="min-amount">Мин. сумма</Label>
                          <Input
                            id="min-amount"
                            type="number"
                            step="any"
                            placeholder="50"
                            value={formData.parameters.minAmount}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              parameters: { ...formData.parameters, minAmount: e.target.value }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="max-amount">Макс. сумма</Label>
                          <Input
                            id="max-amount"
                            type="number"
                            step="any"
                            placeholder="10000"
                            value={formData.parameters.maxAmount}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              parameters: { ...formData.parameters, maxAmount: e.target.value }
                            })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fee">Комиссия (%)</Label>
                          <Input
                            id="fee"
                            type="number"
                            step="0.01"
                            placeholder="2.5"
                            value={formData.parameters.fee}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              parameters: { ...formData.parameters, fee: e.target.value }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="processing-time">Время обработки</Label>
                          <Input
                            id="processing-time"
                            placeholder="5-10 минут"
                            value={formData.parameters.processingTime}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              parameters: { ...formData.parameters, processingTime: e.target.value }
                            })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is-enabled"
                        checked={formData.isEnabled}
                        onCheckedChange={(checked) => setFormData({ ...formData, isEnabled: checked })}
                      />
                      <Label htmlFor="is-enabled">Включен</Label>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {
                      setShowCreateDialog(false);
                      setEditingMethod(null);
                      resetForm();
                    }}>
                      Отмена
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {(createMutation.isPending || updateMutation.isPending) && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                      {editingMethod ? 'Сохранить' : 'Создать'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Methods Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowUpDown className="h-5 w-5 mr-2" />
              Список способов обмена ({methods.length})
            </CardTitle>
            <CardDescription>
              Управление всеми способами ввода и вывода средств
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
            ) : methods.length === 0 ? (
              <div className="text-center py-8">
                <ArrowUpDown className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  Нет способов обмена
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Добавьте первый способ обмена для начала работы
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Способ</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Валюты</TableHead>
                    <TableHead>Параметры</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {methods.map((method) => (
                    <TableRow key={method.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                            {getTypeIcon(method.type)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {method.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {method.code}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getTypeLabel(method.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {method.supportedCurrencies.slice(0, 3).map(currencyId => {
                            const currency = currencies.find(c => c.id === currencyId);
                            return (
                              <Badge key={currencyId} variant="secondary" className="text-xs">
                                {currency?.symbol || currencyId}
                              </Badge>
                            );
                          })}
                          {method.supportedCurrencies.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{method.supportedCurrencies.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {method.parameters?.minAmount && method.parameters?.maxAmount && (
                            <div>{method.parameters.minAmount} — {method.parameters.maxAmount}</div>
                          )}
                          {method.parameters?.fee && (
                            <div className="text-gray-500">Комиссия: {method.parameters.fee}%</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {method.isEnabled ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className={method.isEnabled ? 'text-green-600' : 'text-red-600'}>
                            {method.isEnabled ? 'Включен' : 'Отключен'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              handleEdit(method);
                              setShowCreateDialog(true);
                            }}
                            data-testid={`edit-method-${method.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (window.confirm(`Вы уверены, что хотите удалить способ "${method.name}"?`)) {
                                deleteMutation.mutate(method.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`delete-method-${method.id}`}
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