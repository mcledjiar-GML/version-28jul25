
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface CalorieCardProps {
  title: string;
  description: string;
  value: number;
  unit?: string;
  icon: LucideIcon;
  explanation?: string;
}

const CalorieCard = ({ 
  title, 
  description, 
  value, 
  unit = "kcal", 
  icon: Icon, 
  explanation 
}: CalorieCardProps) => {
  
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  return (
    <Card className="overflow-hidden h-full border border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Icon className="h-5 w-5 mr-2 text-purple-500" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold mb-2">
          {formatNumber(value)} <span className="text-base font-normal text-gray-500">{unit}</span>
        </div>
        {explanation && (
          <p className="text-sm text-muted-foreground">{explanation}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default CalorieCard;
