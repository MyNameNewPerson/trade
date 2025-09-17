import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  RefreshCw,
  Search,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  Eye,
  Settings,
  Users,
  Wallet,
  Coins,
  MessageSquare
} from "lucide-react";

interface AdminLog {
  id: string;
  adminId: string;
  action: string;
  target: string;
  targetId?: string;
  description: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface AdminLogsResponse {
  logs: AdminLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ACTION_LABELS: Record<string, string> = {
  'create_user': 'Создание пользователя',
  'update_user': 'Обновление пользователя',
  'delete_user': 'Удаление пользователя',
  'create_wallet': 'Создание кошелька',
  'update_wallet': 'Обновление кошелька',
  'delete_wallet': 'Удаление кошелька',
  'create_currency': 'Создание валюты',
  'update_currency': 'Обновление валюты',
  'delete_currency': 'Удаление валюты',
  'create_telegram': 'Создание Telegram конфига',
  'update_telegram': 'Обновление Telegram конфига',
  'delete_telegram': 'Удаление Telegram конфига',
  'view_logs': 'Просмотр логов',
  'login': 'Вход в систему',
  'logout': 'Выход из системы',
};

const TARGET_LABELS: Record<string, string> = {
  'user': 'Пользователь',
  'wallet': 'Кошелек',
  'currency': 'Валюта',
  'telegram': 'Telegram',
  'platform_setting': 'Настройка платформы',
  'exchange_method': 'Метод обмена',
};

const ACTION_COLORS: Record<string, string> = {
  'create': 'bg-green-100 text-green-800',
  'update': 'bg-blue-100 text-blue-800',
  'delete': 'bg-red-100 text-red-800',
  'view': 'bg-gray-100 text-gray-800',
  'login': 'bg-purple-100 text-purple-800',
  'logout': 'bg-orange-100 text-orange-800',
};

const getActionColor = (action: string): string => {
  for (const [key, color] of Object.entries(ACTION_COLORS)) {
    if (action.toLowerCase().includes(key)) {
      return color;
    }
  }
  return 'bg-gray-100 text-gray-800';
};

const getTargetIcon = (target: string) => {
  const icons: Record<string, typeof Eye> = {
    'user': Users,
    'wallet': Wallet,
    'currency': Coins,
    'telegram': MessageSquare,
    'platform_setting': Settings,
    'exchange_method': Activity,
  };
  return icons[target] || Eye;
};

export function AdminLogsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const limit = 25;

  // Fetch admin logs
  const {
    data: logsData,
    isLoading: isLoadingLogs,
    error: logsError,
    refetch: refetchLogs
  } = useQuery({
    queryKey: ['admin-logs', currentPage, searchQuery, selectedAdmin, selectedAction, selectedTarget],
    queryFn: async (): Promise<AdminLogsResponse> => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      if (selectedAdmin) params.append('adminId', selectedAdmin);
      if (searchQuery) params.append('search', searchQuery);
      if (selectedAction) params.append('action', selectedAction);
      if (selectedTarget) params.append('target', selectedTarget);

      const response = await fetch(`/api/admin/logs?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }

      return response.json();
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    refetchLogs();
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedAdmin('');
    setSelectedAction('');
    setSelectedTarget('');
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatUserAgent = (userAgent?: string) => {
    if (!userAgent) return 'Неизвестно';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Другой';
  };

  const totalPages = logsData?.totalPages || 1;

  return (
    <AdminLayout currentSection="logs">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-2">
            <FileText className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Логи администратора
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Аудит действий и системные логи
              </p>
            </div>
          </div>
          <Button onClick={() => refetchLogs()} className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Обновить</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">Всего записей</p>
                  <p className="text-2xl font-bold">{logsData?.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-full">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">Текущая страница</p>
                  <p className="text-2xl font-bold">{currentPage} из {totalPages}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">За сеанс</p>
                  <p className="text-2xl font-bold">{logsData?.logs?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-full">
                  <Search className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">Фильтры</p>
                  <p className="text-2xl font-bold">
                    {[searchQuery, selectedAdmin, selectedAction, selectedTarget].filter(Boolean).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Фильтры и поиск
            </CardTitle>
            <CardDescription>
              Найдите нужные логи по ключевым словам и фильтрам
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Поиск</Label>
                  <Input
                    id="search"
                    placeholder="Поиск по описанию..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="admin">Администратор</Label>
                  <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                    <SelectTrigger>
                      <SelectValue placeholder="Все администраторы" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Все администраторы</SelectItem>
                      <SelectItem value="admin-1">admin@cryptoflow.com</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="action">Действие</Label>
                  <Select value={selectedAction} onValueChange={setSelectedAction}>
                    <SelectTrigger>
                      <SelectValue placeholder="Все действия" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Все действия</SelectItem>
                      {Object.entries(ACTION_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="target">Цель</Label>
                  <Select value={selectedTarget} onValueChange={setSelectedTarget}>
                    <SelectTrigger>
                      <SelectValue placeholder="Все цели" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Все цели</SelectItem>
                      {Object.entries(TARGET_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button type="button" variant="outline" onClick={resetFilters}>
                  Сбросить фильтры
                </Button>
                <div className="flex items-center space-x-2">
                  <Button type="submit">
                    <Search className="h-4 w-4 mr-2" />
                    Применить фильтры
                  </Button>
                  <Button type="button" variant="outline" onClick={() => refetchLogs()}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Логи действий</span>
              {logsData && (
                <span className="text-sm font-normal text-gray-500">
                  Показано {logsData.logs?.length || 0} из {logsData.total} записей
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logsError && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Ошибка загрузки логов: {logsError.message}
                </AlertDescription>
              </Alert>
            )}

            {isLoadingLogs ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
                <span className="ml-2 text-gray-600">Загрузка логов...</span>
              </div>
            ) : (
              <>
                {!logsData?.logs?.length ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Логи не найдены</p>
                    <p className="text-gray-400 text-sm">Попробуйте изменить фильтры или выполнить какие-то действия</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Время</TableHead>
                          <TableHead>Администратор</TableHead>
                          <TableHead>Действие</TableHead>
                          <TableHead>Цель</TableHead>
                          <TableHead>Описание</TableHead>
                          <TableHead>IP-адрес</TableHead>
                          <TableHead>Браузер</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logsData.logs.map((log) => {
                          const TargetIcon = getTargetIcon(log.target);
                          
                          return (
                            <TableRow key={log.id}>
                              <TableCell className="font-mono text-xs">
                                {formatDate(log.createdAt)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                                    <User className="h-4 w-4 text-white" />
                                  </div>
                                  <span className="text-sm">{log.adminId}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={getActionColor(log.action)}>
                                  {ACTION_LABELS[log.action] || log.action}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <TargetIcon className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm">
                                    {TARGET_LABELS[log.target] || log.target}
                                  </span>
                                  {log.targetId && (
                                    <code className="text-xs bg-gray-100 px-1 rounded">
                                      {log.targetId}
                                    </code>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="max-w-xs truncate" title={log.description}>
                                {log.description}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {log.ipAddress || 'Неизвестно'}
                              </TableCell>
                              <TableCell className="text-xs">
                                {formatUserAgent(log.userAgent)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Pagination */}
                {logsData && totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        Предыдущая
                      </Button>
                      <span className="text-sm text-gray-600">
                        Страница {currentPage} из {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Следующая
                      </Button>
                    </div>
                    <div className="text-sm text-gray-500">
                      Всего записей: {logsData.total}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}