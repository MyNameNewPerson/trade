import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, CreditCard, History, LogOut, Shield } from "lucide-react";
import { type Order } from "@shared/schema";

export default function UserDashboard() {
  const { user, isLoading } = useAuth();

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders/user"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const recentOrders = orders?.slice(0, 5) || [];
  const completedOrders = orders?.filter(o => o.status === 'completed').length || 0;
  const totalVolume = orders?.reduce((sum, order) => sum + parseFloat(order.fromAmount), 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header with User Info */}
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center space-y-0 pb-4">
            <div className="flex items-center space-x-4 flex-1">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.profileImageUrl || ''} alt={user.firstName || 'User'} />
                <AvatarFallback>
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.email || 'User Dashboard'
                  }
                </h1>
                <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                    {user.role === 'admin' ? (
                      <>
                        <Shield className="w-3 h-3 mr-1" />
                        Administrator
                      </>
                    ) : (
                      'User'
                    )}
                  </Badge>
                  <Badge variant={user.isActive ? 'default' : 'outline'}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/api/logout'}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </CardHeader>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-orders">{orders?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {completedOrders} completed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-volume">
                ${totalVolume.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all exchanges
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Member Since</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-member-since">
                {new Date(user.createdAt).toLocaleDateString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Account created
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
            <CardDescription>
              Your latest exchange transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-4">
                    <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                  No transactions yet
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Start your first exchange to see transactions here.
                </p>
                <div className="mt-6">
                  <Button onClick={() => window.location.href = '/'} data-testid="button-start-exchange">
                    Start Exchange
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`order-${order.id}`}>
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {order.fromAmount} {order.fromCurrency.toUpperCase()} → {order.toAmount} {order.toCurrency.toUpperCase()}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString()} • {order.rateType}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={
                        order.status === 'completed' ? 'default' :
                        order.status === 'failed' ? 'destructive' : 
                        'secondary'
                      }
                      data-testid={`status-${order.id}`}
                    >
                      {order.status}
                    </Badge>
                  </div>
                ))}
                
                {recentOrders.length >= 5 && (
                  <>
                    <Separator />
                    <div className="text-center">
                      <Button variant="outline" data-testid="button-view-all-orders">
                        View All Transactions
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}