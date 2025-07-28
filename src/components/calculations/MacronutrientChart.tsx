
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sandwich } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Calculation } from '@/services/types/airtable.types';

interface MacronutrientChartProps {
  calculation: Calculation;
}

const MacronutrientChart = ({ calculation }: MacronutrientChartProps) => {
  const macroData = [
    { name: 'Protéines', value: calculation.protein, color: '#8B5CF6' },
    { name: 'Glucides', value: calculation.carbs, color: '#eab308' },
    { name: 'Lipides', value: calculation.fat, color: '#f97316' }
  ];

  return (
    <Card className="border border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sandwich className="h-5 w-5 mr-2 text-purple-500" />
          Répartition des macronutriments
        </CardTitle>
        <CardDescription>
          Distribution recommandée des protéines, glucides et lipides
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 h-64 mb-6 md:mb-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={macroData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {macroData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string) => [`${value}g`, name]}
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid #f0f0f0',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="w-full md:w-1/2 flex flex-col justify-center">
          <div className="grid grid-cols-1 gap-4">
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="flex items-center mb-2">
                <div className="w-4 h-4 rounded-full bg-coach-500 mr-2"></div>
                <h3 className="font-medium">Protéines</h3>
              </div>
              <div className="flex justify-between">
                <span>{calculation.protein}g</span>
                <span className="text-gray-500">
                  {calculation.proteinKcal || (calculation.protein * 4)} kcal
                </span>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="flex items-center mb-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
                <h3 className="font-medium">Glucides</h3>
              </div>
              <div className="flex justify-between">
                <span>{calculation.carbs}g</span>
                <span className="text-gray-500">
                  {calculation.carbsKcal || (calculation.carbs * 4)} kcal
                </span>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="flex items-center mb-2">
                <div className="w-4 h-4 rounded-full bg-orange-500 mr-2"></div>
                <h3 className="font-medium">Lipides</h3>
              </div>
              <div className="flex justify-between">
                <span>{calculation.fat}g</span>
                <span className="text-gray-500">
                  {calculation.fatKcal || (calculation.fat * 9)} kcal
                </span>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-coach-50 text-coach-800">
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>
                  {calculation.totalKcal || 
                    ((calculation.protein * 4) + (calculation.carbs * 4) + (calculation.fat * 9))} kcal
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MacronutrientChart;
