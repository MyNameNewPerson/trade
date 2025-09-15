import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PieChart as PieIcon } from "lucide-react";

interface CurrencyData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface CurrencyPieChartProps {
  data?: CurrencyData[];
  isLoading?: boolean;
  className?: string;
}


export function CurrencyPieChart({ data = [], isLoading = false, className }: CurrencyPieChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card className={`bg-white dark:bg-gray-800 ${className}`}>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-56 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  const renderCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white">{data.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Volume: {formatCurrency(data.value)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Share: {data.percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="flex flex-wrap gap-4 justify-center mt-4">
        {payload.map((entry: any, index: number) => (
          <li key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            ></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {entry.value} ({data.find(d => d.name === entry.value)?.percentage}%)
            </span>
          </li>
        ))}
      </ul>
    );
  };

  // Handle empty data state
  if (!data || data.length === 0) {
    return (
      <Card className={`bg-white dark:bg-gray-800 ${className}`} data-testid="currency-pie-chart">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <PieIcon className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
            Currency Distribution
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            No currency data available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
            No currency distribution data to display
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalVolume = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className={`bg-white dark:bg-gray-800 ${className}`} data-testid="currency-pie-chart">
      <CardHeader>
        <CardTitle className="flex items-center text-gray-900 dark:text-white">
          <PieIcon className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
          Currency Distribution
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Trading volume by cryptocurrency ({formatCurrency(totalVolume)} total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80" data-testid="currency-pie-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={renderCustomTooltip} />
              <Legend content={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}