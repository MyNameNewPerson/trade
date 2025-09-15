import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { KPICard } from "@/components/KPICard";
import { VolumeChart } from "@/components/VolumeChart";
import { CurrencyPieChart } from "@/components/CurrencyPieChart";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Wallet,
  RefreshCw,
  AlertCircle,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalOrders: number;
  completedOrders: number;
  totalCurrencies: number;
  activeCurrencies: number;
  totalWallets: number;
  activeWallets: number;
}

interface DashboardData {
  stats: AdminStats;
  recentActivity: Array<{
    id: string;
    action: string;
    target: string;
    targetId?: string;
    description: string;
    adminId: string;
    timestamp: string;
  }>;
  recentOrders: Array<{
    id: string;
    fromCurrency: string;
    toCurrency: string;
    fromAmount: string;
    toAmount: string;
    status: string;
    createdAt: string;
  }>;
  exchanges24h: number;
  totalVolume: number;
  volumeByDay: Array<{
    date: string;
    volume: number;
    orders: number;
  }>;
  currencyDistribution: Array<{
    name: string;
    value: number;
    percentage: number;
    color: string;
  }>;
}


export function AdminDashboardPage() {
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch dashboard data
  const { 
    data: dashboardData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<DashboardData>({
    queryKey: ['/api/admin/dashboard-stats'],
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Dashboard Updated",
        description: "Latest data has been loaded successfully",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Unable to refresh dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Get real data from backend - no mock calculations
  const exchanges24h = dashboardData?.exchanges24h || 0;
  const totalVolume = dashboardData?.totalVolume || 0;

  if (error) {
    return (
      <AdminLayout 
        title="Dashboard" 
        currentSection="dashboard"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Dashboard' }
        ]}
      >
        <div className="space-y-6">
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-700 dark:text-red-300">
              Failed to load dashboard data. Please check your connection and try again.
            </AlertDescription>
          </Alert>
          <div className="flex justify-center">
            <Button 
              onClick={handleRefresh} 
              disabled={refreshing}
              data-testid="button-retry-dashboard"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
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
      <div className="space-y-6" data-testid="admin-dashboard">
        {/* Header with Refresh Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dashboard Overview
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor your platform's key metrics and recent activity
            </p>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing || isLoading}
            variant="outline"
            data-testid="button-refresh-dashboard"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total Users"
            value={dashboardData?.stats.totalUsers || 0}
            change={{
              value: 12,
              label: "from last month"
            }}
            icon={Users}
            color="blue"
            isLoading={isLoading}
            testId="kpi-total-users"
          />

          <KPICard
            title="Total Volume"
            value={totalVolume > 1000000 ? `$${(totalVolume / 1000000).toFixed(1)}M` : `$${Math.round(totalVolume).toLocaleString()}`}
            change={{
              value: 8,
              label: "from last month"
            }}
            icon={DollarSign}
            color="green"
            isLoading={isLoading}
            testId="kpi-total-volume"
          />

          <KPICard
            title="Exchanges (24h)"
            value={exchanges24h}
            change={{
              value: 23,
              label: "from yesterday"
            }}
            icon={TrendingUp}
            color="purple"
            isLoading={isLoading}
            testId="kpi-exchanges-24h"
          />

          <KPICard
            title="Active Wallets"
            value={dashboardData?.stats.activeWallets || 0}
            icon={Wallet}
            color="orange"
            isLoading={isLoading}
            testId="kpi-active-wallets"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Volume Chart - Takes 2/3 width on large screens */}
          <div className="xl:col-span-2">
            <VolumeChart 
              data={dashboardData?.volumeByDay || []} 
              isLoading={isLoading}
            />
          </div>

          {/* Currency Distribution - Takes 1/3 width on large screens */}
          <div className="xl:col-span-1">
            <CurrencyPieChart 
              data={dashboardData?.currencyDistribution || []} 
              isLoading={isLoading} 
            />
          </div>
        </div>

        {/* Bottom Section - Recent Activity and Quick Stats */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent Activity Timeline - Takes 2/3 width */}
          <div className="xl:col-span-2">
            <ActivityTimeline 
              activities={dashboardData?.recentActivity || []} 
              isLoading={isLoading}
            />
          </div>

          {/* Quick Stats Card - Takes 1/3 width */}
          <div className="xl:col-span-1">
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Quick Stats
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  System health and performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Active Users</span>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {dashboardData?.stats.activeUsers || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Completed Orders</span>
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {dashboardData?.stats.completedOrders || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Active Currencies</span>
                      <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                        {dashboardData?.stats.activeCurrencies || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Currencies</span>
                      <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                        {dashboardData?.stats.totalCurrencies || 0}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}