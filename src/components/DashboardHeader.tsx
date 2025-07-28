
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  className?: string;
  action?: ReactNode;
}

const DashboardHeader = ({
  title,
  subtitle,
  icon,
  className,
  action
}: DashboardHeaderProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn(
      "mb-8 flex flex-col space-y-2",
      className
    )}>
      <div className={cn(
        "flex items-start justify-between gap-4",
        isMobile && action ? "flex-col" : ""
      )}>
        <div className="flex items-start">
          {icon && (
            <div className="mr-3 p-2 rounded-full bg-coach-100 text-coach-600 flex-shrink-0 mt-1">
              {icon}
            </div>
          )}
          <div className="text-left">
            <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
            {subtitle && (
              <p className="text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        
        {action && (
          <div className={cn(
            "flex-shrink-0",
            isMobile ? "w-full mt-2" : ""
          )}>
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;
