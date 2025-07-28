
import { Exercise, Workout } from "@/services/types/airtable.types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

interface WorkoutCardProps {
  workout: Workout;
}

const WorkoutCard = ({ workout }: WorkoutCardProps) => {
  // Format the date
  const formattedDate = format(new Date(workout.week), 'dd MMMM yyyy', { locale: fr });
  
  // Sort exercises by 'Partie' field (from smallest to largest)
  const sortedExercises = [...workout.exercises].sort((a, b) => {
    const partA = a.part || workout.part || "0";
    const partB = b.part || workout.part || "0";
    
    // Convert to numbers if possible for proper numerical sorting
    const numA = isNaN(Number(partA)) ? 0 : Number(partA);
    const numB = isNaN(Number(partB)) ? 0 : Number(partB);
    
    return numA - numB;
  });
  
  return (
    <Card className="border-orange-200 shadow-sm">
      <CardHeader className="bg-orange-50 pb-3 border-b border-orange-100">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <CardTitle className="text-xl font-medium text-orange-800">
            Semaine du {formattedDate}
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-orange-100 rounded-full text-sm font-medium text-orange-700">
              Bloc {workout.block}
            </div>
            <div className="px-3 py-1 bg-orange-100 rounded-full text-sm font-medium text-orange-700">
              Jour {workout.day}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partie</TableHead>
                <TableHead>Exercice</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Repos</TableHead>
                <TableHead>Charge (kg)</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedExercises.map((exercise) => (
                <TableRow key={exercise.id}>
                  <TableCell className="font-medium text-orange-700">
                    {exercise.part || workout.part || 'Principal'}
                  </TableCell>
                  <TableCell className="font-medium">{exercise.name}</TableCell>
                  <TableCell>{exercise.format}</TableCell>
                  <TableCell>{exercise.rest}</TableCell>
                  <TableCell>{exercise.weight}</TableCell>
                  <TableCell className="max-w-[300px]">{exercise.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkoutCard;
