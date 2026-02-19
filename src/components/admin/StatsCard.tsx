import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
  description?: string;
  iconClassName?: string;
}

export function StatsCard({ title, value, icon, trend, description, iconClassName }: StatsCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <div className={cn(
                'flex items-center gap-1 text-xs font-medium',
                trend.positive ? 'text-success' : 'text-destructive'
              )}>
                {trend.positive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{Math.abs(trend.value)}%</span>
                <span className="text-muted-foreground">vs last week</span>
              </div>
            )}
          </div>
          <div className={cn(
            'p-3 rounded-xl transition-transform duration-300 group-hover:scale-110',
            iconClassName || 'gradient-primary'
          )}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
