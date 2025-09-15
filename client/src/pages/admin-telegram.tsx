import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  MessageSquare, 
  Bot, 
  Send, 
  Settings, 
  TestTube, 
  History, 
  Users, 
  Webhook,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Copy,
  QrCode,
  HelpCircle,
  Globe,
  Shield,
  Bell,
  FileText,
  Search,
  Filter,
  Calendar,
  Download,
  Upload,
  Zap
} from "lucide-react";

import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface TelegramConfig {
  id: string;
  name: string;
  botToken: string;
  chatId: string;
  isDefault: boolean;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationHistory {
  id: string;
  type: string;
  chatId: string;
  message: string;
  status: 'sent' | 'failed' | 'pending';
  sentAt: string;
  errorMessage?: string;
}

interface BotInfo {
  id: number;
  first_name: string;
  username: string;
  can_join_groups: boolean;
  can_read_all_group_messages: boolean;
  supports_inline_queries: boolean;
}

interface TelegramStatus {
  configured: boolean;
  hasToken: boolean;
  hasChatId: boolean;
  hasSigningSecret: boolean;
  connectionTest?: {
    success: boolean;
    botInfo?: BotInfo;
    error?: string;
  };
}

export function AdminTelegramPage() {
  const { toast } = useToast();
  
  // Form states
  const [newConfig, setNewConfig] = useState({
    name: '',
    botToken: '',
    chatId: '',
    description: '',
    isDefault: false,
    isActive: true
  });
  
  // UI States
  const [showTokens, setShowTokens] = useState<{ [key: string]: boolean }>({});
  const [selectedConfig, setSelectedConfig] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    newOrders: true,
    orderStatus: true,
    payments: true,
    systemAlerts: true,
    adminActions: false
  });
  
  // History filters
  const [historyFilters, setHistoryFilters] = useState({
    search: '',
    type: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 20
  });

  // Fetch telegram configs
  const { 
    data: telegramConfigs = [], 
    isLoading: configsLoading,
    refetch: refetchConfigs
  } = useQuery<TelegramConfig[]>({
    queryKey: ['/api/admin/telegram-configs'],
    retry: 2,
  });

  // Fetch telegram status
  const { 
    data: telegramStatus,
    isLoading: statusLoading,
    refetch: refetchStatus
  } = useQuery<TelegramStatus>({
    queryKey: ['/api/admin/telegram/status'],
    retry: 2,
  });

  // Fetch notification history
  const { 
    data: notificationHistory = [],
    isLoading: historyLoading,
    refetch: refetchHistory
  } = useQuery<NotificationHistory[]>({
    queryKey: ['/api/admin/telegram/history', historyFilters],
    retry: 2,
  });

  // Create config mutation
  const createConfigMutation = useMutation({
    mutationFn: async (configData: Omit<TelegramConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await apiRequest('POST', '/api/admin/telegram-configs', configData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuration Created",
        description: "Telegram bot configuration has been added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/telegram-configs'] });
      setShowAddModal(false);
      setNewConfig({
        name: '',
        botToken: '',
        chatId: '',
        description: '',
        isDefault: false,
        isActive: true
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create telegram configuration",
        variant: "destructive",
      });
    },
  });

  // Update config mutation
  const updateConfigMutation = useMutation({
    mutationFn: async ({ id, ...configData }: Partial<TelegramConfig> & { id: string }) => {
      const response = await apiRequest('PUT', `/api/admin/telegram-configs/${id}`, configData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuration Updated",
        description: "Telegram bot configuration has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/telegram-configs'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update telegram configuration",
        variant: "destructive",
      });
    },
  });

  // Delete config mutation
  const deleteConfigMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/admin/telegram-configs/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuration Deleted",
        description: "Telegram bot configuration has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/telegram-configs'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete telegram configuration",
        variant: "destructive",
      });
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (configId: string) => {
      setTestingConnection(true);
      const response = await apiRequest('POST', `/api/admin/telegram/test-connection`, { configId });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Connection Successful",
          description: `Connected to bot: ${data.botInfo?.first_name || 'Unknown'}`,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: data.error || "Unable to connect to Telegram bot",
          variant: "destructive",
        });
      }
      setTestingConnection(false);
      refetchStatus();
    },
    onError: () => {
      toast({
        title: "Test Failed",
        description: "Failed to test telegram connection",
        variant: "destructive",
      });
      setTestingConnection(false);
    },
  });

  // Send test message mutation
  const sendTestMutation = useMutation({
    mutationFn: async ({ configId, message }: { configId: string; message: string }) => {
      setSendingTest(true);
      const response = await apiRequest('POST', `/api/admin/telegram/send-test`, {
        configId,
        message: message || 'Test message from CryptoFlow Admin Panel'
      });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Test Message Sent",
          description: "Test message was sent successfully to Telegram",
        });
      } else {
        toast({
          title: "Send Failed",
          description: data.error || "Failed to send test message",
          variant: "destructive",
        });
      }
      setSendingTest(false);
      refetchHistory();
    },
    onError: () => {
      toast({
        title: "Send Failed",
        description: "Failed to send test message",
        variant: "destructive",
      });
      setSendingTest(false);
    },
  });

  // Toggle token visibility
  const toggleTokenVisibility = (configId: string) => {
    setShowTokens(prev => ({
      ...prev,
      [configId]: !prev[configId]
    }));
  };

  // Mask token for display
  const maskToken = (token: string) => {
    if (token.length <= 8) return '••••••••';
    return '••••••••' + token.slice(-4);
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} has been copied to clipboard`,
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'pending': return <RefreshCw className="h-4 w-4 animate-spin" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <AdminLayout
      title="Telegram Management"
      currentSection="telegram"
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Telegram Management' }
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Telegram Management</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure Telegram bots and notification settings
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchConfigs()}
              disabled={configsLoading}
              data-testid="button-refresh-configs"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${configsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
              <DialogTrigger asChild>
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  data-testid="button-add-config"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bot Config
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Telegram Bot Configuration</DialogTitle>
                  <DialogDescription>
                    Create a new Telegram bot configuration for notifications
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="config-name">Configuration Name</Label>
                    <Input
                      id="config-name"
                      placeholder="e.g., Main Bot, Alerts Bot"
                      value={newConfig.name}
                      onChange={(e) => setNewConfig(prev => ({ ...prev, name: e.target.value }))}
                      data-testid="input-config-name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="bot-token">Bot Token</Label>
                    <Input
                      id="bot-token"
                      placeholder="1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                      value={newConfig.botToken}
                      onChange={(e) => setNewConfig(prev => ({ ...prev, botToken: e.target.value }))}
                      data-testid="input-bot-token"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="chat-id">Chat ID</Label>
                    <Input
                      id="chat-id"
                      placeholder="-1001234567890 or @channel_name"
                      value={newConfig.chatId}
                      onChange={(e) => setNewConfig(prev => ({ ...prev, chatId: e.target.value }))}
                      data-testid="input-chat-id"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of this bot configuration"
                      value={newConfig.description}
                      onChange={(e) => setNewConfig(prev => ({ ...prev, description: e.target.value }))}
                      data-testid="input-description"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is-default"
                      checked={newConfig.isDefault}
                      onCheckedChange={(checked) => setNewConfig(prev => ({ ...prev, isDefault: !!checked }))}
                      data-testid="checkbox-is-default"
                    />
                    <Label htmlFor="is-default">Set as default bot</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is-active"
                      checked={newConfig.isActive}
                      onCheckedChange={(checked) => setNewConfig(prev => ({ ...prev, isActive: !!checked }))}
                      data-testid="checkbox-is-active"
                    />
                    <Label htmlFor="is-active">Activate immediately</Label>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddModal(false)}
                      data-testid="button-cancel-config"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => createConfigMutation.mutate(newConfig)}
                      disabled={createConfigMutation.isPending || !newConfig.name || !newConfig.botToken || !newConfig.chatId}
                      data-testid="button-save-config"
                    >
                      {createConfigMutation.isPending ? 'Creating...' : 'Create Bot'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Telegram Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Bots</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {telegramConfigs.length}
                  </p>
                </div>
                <Bot className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Bots</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {telegramConfigs.filter(c => c.isActive).length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Connection</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {telegramStatus?.configured ? 'Connected' : 'Not Connected'}
                  </p>
                </div>
                {telegramStatus?.configured ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Messages Today</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {notificationHistory.filter(h => 
                      new Date(h.sentAt).toDateString() === new Date().toDateString()
                    ).length}
                  </p>
                </div>
                <Send className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="configs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="configs" data-testid="tab-configs">
              <Settings className="h-4 w-4 mr-2" />
              Configurations
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="templates" data-testid="tab-templates">
              <FileText className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="testing" data-testid="tab-testing">
              <TestTube className="h-4 w-4 mr-2" />
              Testing
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              <History className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Bot Configurations Tab */}
          <TabsContent value="configs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Bot Configurations
                </CardTitle>
                <CardDescription>
                  Manage your Telegram bot configurations and connection settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {configsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                ) : telegramConfigs.length === 0 ? (
                  <div className="text-center py-12">
                    <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Bot Configurations</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Get started by adding your first Telegram bot configuration
                    </p>
                    <Button onClick={() => setShowAddModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Bot
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {telegramConfigs.map((config) => (
                      <div 
                        key={config.id}
                        className="p-4 border rounded-lg bg-white dark:bg-gray-800 space-y-3"
                        data-testid={`config-card-${config.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`h-3 w-3 rounded-full ${config.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <h4 className="font-medium text-gray-900 dark:text-white">{config.name}</h4>
                            {config.isDefault && (
                              <Badge variant="secondary" data-testid={`badge-default-${config.id}`}>Default</Badge>
                            )}
                            <Badge 
                              variant={config.isActive ? "default" : "secondary"}
                              data-testid={`badge-status-${config.id}`}
                            >
                              {config.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => testConnectionMutation.mutate(config.id)}
                              disabled={testingConnection}
                              data-testid={`button-test-${config.id}`}
                            >
                              <TestTube className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateConfigMutation.mutate({
                                id: config.id,
                                isActive: !config.isActive
                              })}
                              data-testid={`button-toggle-${config.id}`}
                            >
                              {config.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteConfigMutation.mutate(config.id)}
                              disabled={deleteConfigMutation.isPending}
                              data-testid={`button-delete-${config.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Bot Token</Label>
                            <div className="flex items-center space-x-2 mt-1">
                              <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                {showTokens[config.id] ? config.botToken : maskToken(config.botToken)}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleTokenVisibility(config.id)}
                                data-testid={`button-toggle-token-${config.id}`}
                              >
                                {showTokens[config.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(config.botToken, 'Bot token')}
                                data-testid={`button-copy-token-${config.id}`}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">Chat ID</Label>
                            <div className="flex items-center space-x-2 mt-1">
                              <code 
                                className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                                data-testid={`chat-id-${config.id}`}
                              >
                                {config.chatId}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(config.chatId, 'Chat ID')}
                                data-testid={`button-copy-chat-${config.id}`}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {config.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{config.description}</p>
                        )}
                        
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Created: {formatDate(config.createdAt)} • Updated: {formatDate(config.updatedAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Notification Types */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                    Notification Types
                  </CardTitle>
                  <CardDescription>
                    Configure which events trigger Telegram notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notify-new-orders">New Orders</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Notify when new exchange orders are created
                      </p>
                    </div>
                    <Switch
                      id="notify-new-orders"
                      checked={notificationSettings.newOrders}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({
                        ...prev,
                        newOrders: checked
                      }))}
                      data-testid="notify-new-orders"
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notify-order-status">Order Status Changes</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Notify when order status is updated
                      </p>
                    </div>
                    <Switch
                      id="notify-order-status"
                      checked={notificationSettings.orderStatus}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({
                        ...prev,
                        orderStatus: checked
                      }))}
                      data-testid="notify-order-status"
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notify-payments">Payment Confirmations</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Notify when payments are confirmed
                      </p>
                    </div>
                    <Switch
                      id="notify-payments"
                      checked={notificationSettings.payments}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({
                        ...prev,
                        payments: checked
                      }))}
                      data-testid="notify-payments"
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notify-system-alerts">System Alerts</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Notify about system errors and warnings
                      </p>
                    </div>
                    <Switch
                      id="notify-system-alerts"
                      checked={notificationSettings.systemAlerts}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({
                        ...prev,
                        systemAlerts: checked
                      }))}
                      data-testid="notify-system-alerts"
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notify-admin-actions">Admin Actions</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Notify about administrative actions
                      </p>
                    </div>
                    <Switch
                      id="notify-admin-actions"
                      checked={notificationSettings.adminActions}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({
                        ...prev,
                        adminActions: checked
                      }))}
                      data-testid="notify-admin-actions"
                    />
                  </div>
                  
                  <div className="pt-4">
                    <Button className="w-full" data-testid="button-save-notification-settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Save Notification Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Chat Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                    Chat Management
                  </CardTitle>
                  <CardDescription>
                    Manage chat configurations and webhook settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Current Chat Information</Label>
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Chat ID:</span>
                          <code className="text-xs bg-white dark:bg-gray-800 px-1 rounded">
                            {telegramConfigs.find(c => c.isDefault)?.chatId || 'Not configured'}
                          </code>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Chat Type:</span>
                          <span className="text-xs">
                            {telegramConfigs.find(c => c.isDefault)?.chatId?.startsWith('@') ? 'Channel' : 
                             telegramConfigs.find(c => c.isDefault)?.chatId?.startsWith('-100') ? 'Supergroup' :
                             telegramConfigs.find(c => c.isDefault)?.chatId?.startsWith('-') ? 'Group' : 'Private'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label>Webhook Configuration</Label>
                    <div className="mt-2 space-y-3">
                      <div>
                        <Label className="text-xs">Webhook URL</Label>
                        <Input
                          placeholder="https://your-domain.com/api/telegram/webhook"
                          className="text-xs"
                          data-testid="input-webhook-url"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">Webhook Status: Not configured</span>
                      </div>
                      
                      <Button variant="outline" size="sm" className="w-full" data-testid="button-setup-webhook">
                        <Webhook className="h-4 w-4 mr-2" />
                        Setup Webhook
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label>Quick Setup</Label>
                    <div className="mt-2 space-y-2">
                      <Button variant="outline" size="sm" className="w-full" data-testid="button-generate-qr">
                        <QrCode className="h-4 w-4 mr-2" />
                        Generate QR Code
                      </Button>
                      <Button variant="outline" size="sm" className="w-full" data-testid="button-setup-guide">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Setup Instructions
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Message Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
                  Message Templates
                </CardTitle>
                <CardDescription>
                  Customize notification message templates with dynamic variables
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Use variables like <code>{"{orderID}"}</code>, <code>{"{amount}"}</code>, <code>{"{currency}"}</code>, <code>{"{status}"}</code> in your templates
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="template-new-order">New Order Template</Label>
                      <Textarea
                        id="template-new-order"
                        placeholder="🆕 New Order #{orderID}&#10;Amount: {amount} {fromCurrency}&#10;Target: {toAmount} {toCurrency}&#10;Status: {status}"
                        className="h-24 text-xs"
                        data-testid="template-new-order"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="template-payment">Payment Confirmation Template</Label>
                      <Textarea
                        id="template-payment"
                        placeholder="✅ Payment Confirmed&#10;Order: #{orderID}&#10;Amount: {amount} {currency}&#10;TX: {txHash}"
                        className="h-24 text-xs"
                        data-testid="template-payment"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="template-status">Status Update Template</Label>
                      <Textarea
                        id="template-status"
                        placeholder="🔄 Order Status Update&#10;Order: #{orderID}&#10;New Status: {status}&#10;Updated: {timestamp}"
                        className="h-24 text-xs"
                        data-testid="template-status"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="template-system">System Alert Template</Label>
                      <Textarea
                        id="template-system"
                        placeholder="🚨 System Alert&#10;Type: {alertType}&#10;Message: {message}&#10;Time: {timestamp}"
                        className="h-24 text-xs"
                        data-testid="template-system"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Button data-testid="button-save-templates">
                    <Upload className="h-4 w-4 mr-2" />
                    Save Templates
                  </Button>
                  <Button variant="outline" data-testid="button-reset-templates">
                    Reset to Default
                  </Button>
                  <Button variant="outline" data-testid="button-preview-templates">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Testing Tab */}
          <TabsContent value="testing" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Connection Testing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TestTube className="h-5 w-5 mr-2 text-red-600 dark:text-red-400" />
                    Connection Testing
                  </CardTitle>
                  <CardDescription>
                    Test your Telegram bot connections and functionality
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Select Bot Configuration</Label>
                    <Select 
                      value={selectedConfig} 
                      onValueChange={setSelectedConfig}
                      data-testid="select-test-config"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a bot configuration" />
                      </SelectTrigger>
                      <SelectContent>
                        {telegramConfigs.map((config) => (
                          <SelectItem key={config.id} value={config.id}>
                            {config.name} {config.isDefault && '(Default)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedConfig && (
                    <div className="space-y-3">
                      <Button
                        onClick={() => testConnectionMutation.mutate(selectedConfig)}
                        disabled={testingConnection}
                        className="w-full"
                        data-testid="button-test-connection"
                      >
                        <TestTube className={`h-4 w-4 mr-2 ${testingConnection ? 'animate-spin' : ''}`} />
                        {testingConnection ? 'Testing Connection...' : 'Test Connection'}
                      </Button>
                      
                      <div>
                        <Label>Test Message</Label>
                        <Textarea
                          placeholder="Enter a test message to send..."
                          className="h-20"
                          data-testid="input-test-message"
                        />
                      </div>
                      
                      <Button
                        onClick={() => sendTestMutation.mutate({
                          configId: selectedConfig,
                          message: 'Test message from CryptoFlow Admin Panel'
                        })}
                        disabled={sendingTest}
                        variant="outline"
                        className="w-full"
                        data-testid="button-send-test"
                      >
                        <Send className={`h-4 w-4 mr-2 ${sendingTest ? 'animate-spin' : ''}`} />
                        {sendingTest ? 'Sending...' : 'Send Test Message'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bot Status Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                    Bot Status & Information
                  </CardTitle>
                  <CardDescription>
                    Current bot status and configuration details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {statusLoading ? (
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex justify-between">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Configuration Status</span>
                        <Badge 
                          variant={telegramStatus?.configured ? "default" : "secondary"}
                          data-testid="status-telegram-connection"
                        >
                          {telegramStatus?.configured ? 'Configured' : 'Not Configured'}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Bot Token</span>
                        <Badge variant={telegramStatus?.hasToken ? "default" : "secondary"}>
                          {telegramStatus?.hasToken ? 'Set' : 'Missing'}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Chat ID</span>
                        <Badge variant={telegramStatus?.hasChatId ? "default" : "secondary"}>
                          {telegramStatus?.hasChatId ? 'Set' : 'Missing'}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Signing Secret</span>
                        <Badge variant={telegramStatus?.hasSigningSecret ? "default" : "secondary"}>
                          {telegramStatus?.hasSigningSecret ? 'Set' : 'Missing'}
                        </Badge>
                      </div>

                      {telegramStatus?.connectionTest?.botInfo && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <Label className="text-xs font-medium text-green-700 dark:text-green-400">Bot Information</Label>
                          <div className="mt-1 text-xs space-y-1">
                            <div>Name: {telegramStatus.connectionTest.botInfo.first_name}</div>
                            <div>Username: @{telegramStatus.connectionTest.botInfo.username}</div>
                            <div>Groups: {telegramStatus.connectionTest.botInfo.can_join_groups ? 'Yes' : 'No'}</div>
                            <div>Inline: {telegramStatus.connectionTest.botInfo.supports_inline_queries ? 'Yes' : 'No'}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notification History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="h-5 w-5 mr-2 text-teal-600 dark:text-teal-400" />
                  Notification History
                </CardTitle>
                <CardDescription>
                  View and manage sent Telegram notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* History Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search messages..."
                      value={historyFilters.search}
                      onChange={(e) => setHistoryFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10"
                      data-testid="input-search-messages"
                    />
                  </div>
                  
                  <Select
                    value={historyFilters.type}
                    onValueChange={(value) => setHistoryFilters(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="w-40" data-testid="filter-message-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="order">Order</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={historyFilters.status}
                    onValueChange={(value) => setHistoryFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="w-32" data-testid="filter-message-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" size="sm" data-testid="button-export-history">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                {/* History Table */}
                {historyLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-3 border rounded">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/12 animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                ) : notificationHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Messages</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      No notification messages found
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Chat ID</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notificationHistory.map((message) => (
                        <TableRow key={message.id}>
                          <TableCell className="text-xs" data-testid={`msg-timestamp-${message.id}`}>
                            {formatDate(message.sentAt)}
                          </TableCell>
                          <TableCell data-testid={`msg-type-${message.id}`}>
                            <Badge variant="outline">{message.type}</Badge>
                          </TableCell>
                          <TableCell className="text-xs" data-testid={`msg-chat-${message.id}`}>
                            <code>{message.chatId}</code>
                          </TableCell>
                          <TableCell className="max-w-md" data-testid={`msg-preview-${message.id}`}>
                            <div className="truncate text-sm">
                              {message.message.length > 50 
                                ? message.message.substring(0, 50) + '...' 
                                : message.message}
                            </div>
                          </TableCell>
                          <TableCell data-testid={`msg-status-${message.id}`}>
                            <Badge className={getStatusColor(message.status)}>
                              {getStatusIcon(message.status)}
                              <span className="ml-1">{message.status}</span>
                            </Badge>
                          </TableCell>
                          <TableCell data-testid={`msg-actions-${message.id}`}>
                            <div className="flex items-center space-x-1">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-3 w-3" />
                              </Button>
                              {message.status === 'failed' && (
                                <Button variant="ghost" size="sm">
                                  <RefreshCw className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}