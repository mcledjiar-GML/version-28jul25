
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { MealPlan } from "@/services/types/airtable.types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";

interface MealPlanHistoryTableProps {
  mealPlans: MealPlan[];
  onSelectMealPlan: (mealPlan: MealPlan) => void;
}

const MealPlanHistoryTable = ({ mealPlans, onSelectMealPlan }: MealPlanHistoryTableProps) => {
  // Calculate total calories for a meal plan
  const calculateTotalCalories = (mealPlan: MealPlan) => {
    return mealPlan.meals.flatMap(m => m.items).reduce((sum, item) => sum + (item.calories || 0), 0);
  };

  // Count total number of days in a meal plan
  const countDays = (mealPlan: MealPlan) => {
    return new Set(mealPlan.meals.map(meal => meal.day || "1")).size;
  };
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-32">Date</TableHead>
            <TableHead>Jours</TableHead>
            <TableHead>Calories</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mealPlans.map((mealPlan) => (
            <TableRow key={mealPlan.id}>
              <TableCell className="font-medium">
                {format(new Date(mealPlan.date), 'dd MMM yyyy', { locale: fr })}
              </TableCell>
              <TableCell>{countDays(mealPlan)} jours</TableCell>
              <TableCell>{calculateTotalCalories(mealPlan)} kcal</TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-600 hover:text-red-700"
                  onClick={() => onSelectMealPlan(mealPlan)}
                >
                  Voir
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default MealPlanHistoryTable;
