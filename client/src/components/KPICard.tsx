import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
  };
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  isLoading?: boolean;
  testId: string;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    icon: 'text-blue-600 dark:text-blue-400',
    change: 'text-blue-600 dark:text-blue-400'
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/20',
    icon: 'text-green-600 dark:text-green-400',
    change: 'text-green-600 dark:text-green-400'
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/20',
    icon: 'text-purple-600 dark:text-purple-400',
    change: 'text-purple-600 dark:text-purple-400'
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/20',
    icon: 'text-orange-600 dark:text-orange-400',
    change: 'text-orange-600 dark:text-orange-400'
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/20',
    icon: 'text-red-600 dark:text-red-400',
    change: 'text-red-600 dark:text-red-400'
  }
};

export function KPICard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color, 
  isLoading = false, 
  testId 
}: KPICardProps) {
  const colors = colorClasses[color];

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800" data-testid={`${testId}-loading`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className={`h-12 w-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
              <Icon className={`h-6 w-6 ${colors.icon}`} />
            </div>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mt-2 animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 transition-all duration-200 hover:shadow-lg" data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid={`${testId}-title`}>
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1" data-testid={`${testId}-value`}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          </div>
          <div className={`h-12 w-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
            <Icon className={`h-6 w-6 ${colors.icon}`} />
          </div>
        </div>
        {change && (
          <p className={`text-xs mt-2 ${change.value >= 0 ? colors.change : 'text-red-600 dark:text-red-400'}`} data-testid={`${testId}-change`}>
            {change.value >= 0 ? '+' : ''}{change.value}% {change.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}