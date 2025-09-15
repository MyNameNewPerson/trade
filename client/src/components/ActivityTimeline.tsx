import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, User, Wallet, Settings, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface TimelineActivity {
  id: string;
  action: string;
  target: string;
  targetId?: string;
  description: string;
  adminId: string;
  adminEmail?: string;
  timestamp: string;
  metadata?: any;
}

interface ActivityTimelineProps {
  activities?: TimelineActivity[];
  isLoading?: boolean;
  className?: string;
}


export function ActivityTimeline({ activities = [], isLoading = false, className }: ActivityTimelineProps) {
  const getActivityIcon = (action: string, target: string) => {
    if (action.includes('user')) return User;
    if (action.includes('wallet') || target === 'wallet') return Wallet;
    if (action.includes('setting') || target === 'platform_setting') return Settings;
    if (action.includes('deactivate') || action.includes('delete')) return AlertCircle;
    if (action.includes('create') || action.includes('approve')) return CheckCircle;
    return Activity;
  };

  const getActivityColor = (action: string) => {
    if (action.includes('create') || action.includes('approve')) return 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400';
    if (action.includes('update') || action.includes('modify')) return 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
    if (action.includes('deactivate') || action.includes('delete')) return 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400';
    return 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400';
  };

  const getActionBadge = (action: string) => {
    const actionMap: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
      create_user: { label: 'Created', variant: 'default' },
      update_user: { label: 'Updated', variant: 'secondary' },
      deactivate_user: { label: 'Deactivated', variant: 'destructive' },
      create_wallet: { label: 'Created', variant: 'default' },
      update_wallet: { label: 'Updated', variant: 'secondary' },
      update_setting: { label: 'Modified', variant: 'outline' },
      create_currency: { label: 'Added', variant: 'default' },
    };

    const badgeInfo = actionMap[action] || { label: 'Action', variant: 'outline' as const };
    return <Badge variant={badgeInfo.variant} className="text-xs">{badgeInfo.label}</Badge>;
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (isLoading) {
    return (
      <Card className={`bg-white dark:bg-gray-800 ${className}`}>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-white dark:bg-gray-800 ${className}`} data-testid="activity-timeline">
      <CardHeader>
        <CardTitle className="flex items-center text-gray-900 dark:text-white">
          <Clock className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
          Recent Activity
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Latest admin actions and system events
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4" data-testid="activity-timeline-list">
          {!activities || activities.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
              No recent activity to display
            </div>
          ) : (
            activities.map((activity, index) => {
              const Icon = getActivityIcon(activity.action, activity.target);
              const iconColor = getActivityColor(activity.action);
              
              return (
                <div 
                  key={activity.id} 
                  className="flex items-start space-x-3 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0"
                  data-testid={`row-activity-${activity.id}`}
                >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${iconColor}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {getActionBadge(activity.action)}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          by {activity.adminEmail || `Admin ${activity.adminId}`}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.description}
                      </p>
                      {activity.targetId && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Target: {activity.targetId}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
          )}
        </div>
      </CardContent>
    </Card>
  );
}