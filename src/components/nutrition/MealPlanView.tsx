
import { MealPlan } from "@/services/types/airtable.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface MealPlanViewProps {
  mealPlan: MealPlan;
}

const MealPlanView = ({ mealPlan }: MealPlanViewProps) => {
  // Format meal type for display
  const formatMealType = (type: string) => {
    switch (type) {
      case "breakfast": return "Petit Déjeuner";
      case "lunch": return "Déjeuner";
      case "snack": return "Collation";
      case "dinner": return "Dîner";
      default: return type;
    }
  };

  // Order meal types for consistent display
  const mealTypeOrder = ["breakfast", "lunch", "snack", "dinner"];
  
  // Group meals by day
  const mealsByDay = mealPlan.meals.reduce((groups, meal) => {
    const day = meal.day || "1";
    if (!groups[day]) {
      groups[day] = [];
    }
    groups[day].push(meal);
    return groups;
  }, {} as Record<string, typeof mealPlan.meals>);

  // Get days sorted numerically
  const days = Object.keys(mealsByDay).sort((a, b) => {
    // Convert day strings to numbers for proper sorting (handle non-numeric values too)
    const dayA = parseInt(a) || 0;
    const dayB = parseInt(b) || 0;
    return dayA - dayB;
  });

  // Calculate total macros for a meal
  const calculateMealMacros = (items: typeof mealPlan.meals[0]['items']) => {
    return items.reduce((totals, item) => {
      return {
        calories: totals.calories + (item.calories || 0),
        protein: totals.protein + (item.protein || 0),
        carbs: totals.carbs + (item.carbs || 0),
        fat: totals.fat + (item.fat || 0),
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  // Calculate total calories for a day
  const calculateDayCalories = (dayMeals: typeof mealPlan.meals) => {
    return dayMeals.flatMap(meal => meal.items)
      .reduce((total, item) => total + (item.calories || 0), 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Plan du {format(new Date(mealPlan.date), 'dd MMMM yyyy', { locale: fr })}
        </h2>
      </div>

      {days.map(day => (
        <Card key={day} className="overflow-hidden border-red-200 shadow-sm">
          <CardHeader className="bg-red-100 pb-2">
            <CardTitle className="text-lg">Programme journalier - Jour {day}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {/* Sort meals by mealTypeOrder and then render */}
              {[...mealsByDay[day]].sort((a, b) => 
                mealTypeOrder.indexOf(a.type) - mealTypeOrder.indexOf(b.type)
              ).map(meal => (
                <div key={meal.id} className="p-4">
                  <h3 className="font-medium text-red-700 mb-2">{formatMealType(meal.type)}</h3>
                  <div className="space-y-3">
                    {meal.items.map((item, itemIndex) => (
                      <div key={`${meal.id}-${itemIndex}`} className="pl-2 border-l-2 border-red-100">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{item.quantity}</p>
                          </div>
                          <div className="text-right text-sm">
                            <p className="font-medium">{item.calories || 0} kcal</p>
                            <p className="text-muted-foreground">
                              P: {item.protein || 0}g • C: {item.carbs || 0}g • L: {item.fat || 0}g
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-red-100">
                    <div className="flex justify-between text-sm text-red-600 font-medium">
                      <span>Total {formatMealType(meal.type)}</span>
                      <span>
                        {calculateMealMacros(meal.items).calories} kcal
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-red-50 border-t border-red-200">
              <div className="flex justify-between font-medium text-red-700">
                <span>Total Jour {day}</span>
                <span>{calculateDayCalories(mealsByDay[day])} kcal</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="border-red-200 shadow-sm bg-red-50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Total programme</p>
              <p className="text-2xl font-bold">
                {mealPlan.meals.flatMap(m => m.items).reduce((sum, item) => sum + (item.calories || 0), 0)} kcal
              </p>
            </div>
            <div className="flex gap-4">
              <div>
                <p className="text-sm font-medium text-red-600">Protéines</p>
                <p className="text-xl">
                  {mealPlan.meals.flatMap(m => m.items).reduce((sum, item) => sum + (item.protein || 0), 0)}g
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-amber-600">Glucides</p>
                <p className="text-xl">
                  {mealPlan.meals.flatMap(m => m.items).reduce((sum, item) => sum + (item.carbs || 0), 0)}g
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600">Lipides</p>
                <p className="text-xl">
                  {mealPlan.meals.flatMap(m => m.items).reduce((sum, item) => sum + (item.fat || 0), 0)}g
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MealPlanView;
