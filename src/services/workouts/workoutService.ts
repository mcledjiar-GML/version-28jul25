
import { toast } from "sonner";
import AirtableApiService from "../api/airtableApi";
import { Exercise, Workout } from "../types/airtable.types";
import { mockWorkouts } from "../mocks/airtableMocks";

class WorkoutService {
  async getStudentWorkouts(studentId: string): Promise<Workout[]> {
    if (!AirtableApiService.isConfigured) {
      return this.getStudentWorkoutsMock(studentId);
    }
    
    try {
      // Récupérer le nom de l'élève à partir du contexte
      const studentName = await this.getStudentName(studentId);
      console.log("Nom de l'élève:", studentName);
      
      // Utiliser la formule Airtable avec le nom de l'élève (même approche que measurementService)
      const formula = `{Élève}='${studentName}'`;
      console.log("Formule utilisée:", formula);
      
      const workoutsRaw = await AirtableApiService.fetchFromAirtable('Workout', { 
        filterByFormula: formula 
      });
      
      console.log('Données workouts brutes reçues:', workoutsRaw);
      
      // Group workouts by week, day, and block
      const workoutGroups = new Map<string, any[]>();
      
      workoutsRaw.forEach((workout: any) => {
        const key = `${workout.Semaine}-${workout.Jour}-${workout.Bloc}`;
        if (!workoutGroups.has(key)) {
          workoutGroups.set(key, []);
        }
        workoutGroups.get(key)?.push(workout);
      });
      
      // Format each group into a workout with exercises
      const workouts: Workout[] = [];
      
      workoutGroups.forEach((exercises, key) => {
        if (exercises.length > 0) {
          const firstExercise = exercises[0];
          
          const workout: Workout = {
            id: key,
            studentId: studentId,
            week: firstExercise.Semaine,
            day: firstExercise.Jour,
            block: firstExercise.Bloc,
            part: firstExercise.Partie,
            exercises: exercises.map(ex => ({
              id: ex.id,
              name: ex.Exercice,
              format: ex['Format de Travail'],
              rest: ex.Rest,
              weight: ex['Charge (Kg)'],
              notes: ex.Notes,
              part: ex.Partie  // Adding the individual exercise's partie
            }))
          };
          
          workouts.push(workout);
        }
      });
      
      // Sort workouts by date (week), with most recent first
      return workouts.sort((a, b) => {
        // Parse dates and compare them
        const dateA = new Date(a.week);
        const dateB = new Date(b.week);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error('Error getting workouts:', error);
      toast.error("Erreur lors de la récupération des entraînements");
      return this.getStudentWorkoutsMock(studentId);
    }
  }

  // Méthode pour récupérer le nom de l'élève à partir de son ID
  private async getStudentName(studentId: string): Promise<string> {
    try {
      // Récupérer l'élève depuis Airtable
      const students = await AirtableApiService.fetchFromAirtable<any>('Élèves', {
        filterByFormula: `{ID}='${studentId}'`
      });
      
      if (students && students.length > 0) {
        return students[0]["Nom"];
      }
      
      // Si on ne trouve pas l'élève avec l'ID, essayer avec le code directement
      const studentsByCode = await AirtableApiService.fetchFromAirtable<any>('Élèves', {
        filterByFormula: `{code}='${studentId}'`
      });
      
      if (studentsByCode && studentsByCode.length > 0) {
        return studentsByCode[0]["Nom"];
      }
      
      // Fallback: essayer avec tous les champs
      const allStudents = await AirtableApiService.fetchAllRecords('Élèves');
      
      const student = allStudents.find(s => 
        s.id === studentId || 
        s.code === studentId || 
        s.ID === studentId || 
        s["IDU Eleve"] === studentId
      );
      
      if (student) {
        return student["Nom"];
      }
      
      console.warn(`Impossible de trouver le nom de l'élève avec l'ID: ${studentId}`);
      return studentId; // Retourner l'ID comme fallback
    } catch (error) {
      console.error('Erreur lors de la récupération du nom de l\'élève:', error);
      return studentId; // Retourner l'ID comme fallback
    }
  }

  // Mock version for development
  private async getStudentWorkoutsMock(studentId: string): Promise<Workout[]> {
    console.log('Utilisation des données mock pour les workouts');
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockWorkouts.filter(workout => workout.studentId === studentId);
  }
}

export default new WorkoutService();
