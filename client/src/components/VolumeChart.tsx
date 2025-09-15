import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from "lucide-react";

interface VolumeData {
  date: string;
  volume: number;
  orders: number;
}

interface VolumeChartProps {
  data: VolumeData[];
  isLoading?: boolean;
  className?: string;
}


export function VolumeChart({ data = [], isLoading = false, className }: VolumeChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
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
          <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  // Calculate trend from real data
  const latestVolume = data && data.length > 0 ? data[data.length - 1]?.volume || 0 : 0;
  const previousVolume = data && data.length > 1 ? data[data.length - 2]?.volume || 0 : 0;
  const trend = previousVolume > 0 ? ((latestVolume - previousVolume) / previousVolume) * 100 : 0;

  // Handle empty data state
  if (!data || data.length === 0) {
    return (
      <Card className={`bg-white dark:bg-gray-800 ${className}`} data-testid="volume-chart">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <TrendingUp className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
            Transaction Volume (7 Days)
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            No volume data available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
            No transaction data to display
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-white dark:bg-gray-800 ${className}`} data-testid="volume-chart">
      <CardHeader>
        <CardTitle className="flex items-center text-gray-900 dark:text-white">
          <TrendingUp className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
          Transaction Volume (7 Days)
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Daily transaction volume and order counts
          {trend !== 0 && (
            <span className={`ml-2 text-xs ${trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {trend >= 0 ? '+' : ''}{trend.toFixed(1)}% from yesterday
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80" data-testid="volume-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                className="text-xs text-gray-600 dark:text-gray-400"
              />
              <YAxis 
                tickFormatter={formatCurrency}
                className="text-xs text-gray-600 dark:text-gray-400"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
                labelFormatter={(date) => formatDate(date as string)}
                formatter={(value, name) => [
                  name === 'volume' ? formatCurrency(value as number) : `${value} orders`,
                  name === 'volume' ? 'Volume' : 'Orders'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="volume" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}