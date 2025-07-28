
import { toast } from "sonner";
import AirtableApiService from "../api/airtableApi";
import { Goal } from "../types/airtable.types";
import { mockGoals } from "../mocks/airtableMocks";

class GoalService {
  async getStudentGoals(studentId: string): Promise<Goal[]> {
    if (!AirtableApiService.isConfigured) {
      return this.getStudentGoalsMock(studentId);
    }
    
    try {
      // Récupérer le nom de l'élève
      const studentName = await this.getStudentName(studentId);
      console.log("Fetching goals for student:", studentName);
      
      const formula = encodeURIComponent(`{StudentId} = '${studentId}'`);
      const goals = await AirtableApiService.fetchFromAirtable<any>('Goals', { filterByFormula: formula });
      
      console.log("Regular goals fetched:", goals);
      
      // Récupérer les mesures pour ajouter l'objectif de poids
      const measurements = await this.getStudentMeasurements(studentId);
      const latestMeasurement = measurements[0]; // La plus récente mesure
      
      // Récupérer les données de l'élève pour obtenir le poids initial et le poids cible
      const studentData = await this.getStudentData(studentId);
      const initialWeight = studentData?.initialWeight;
      const targetWeight = studentData?.targetWeight;
      
      let allGoals = goals.map(goal => ({
        id: goal.id,
        studentId: goal.StudentId,
        description: goal.Description,
        targetDate: goal.TargetDate,
        status: goal.Status.toLowerCase() as 'pending' | 'in-progress' | 'achieved',
      }));
      
      // Ajouter l'objectif de poids si les données nécessaires sont disponibles
      if (latestMeasurement && latestMeasurement.weightRemaining !== undefined) {
        let weightDescription = `Atteindre l'objectif de poids`;
        
        if (targetWeight) {
          weightDescription += ` (${targetWeight} kg)`;
        }
        
        if (latestMeasurement.weightRemaining !== undefined) {
          weightDescription += ` - ${Math.abs(latestMeasurement.weightRemaining).toFixed(1)} kg restants`;
        }
        
        const weightGoal: Goal = {
          id: 'weight-goal',
          studentId: studentId,
          description: weightDescription,
          targetDate: new Date().toISOString().split('T')[0], // Date du jour
          status: latestMeasurement.weightRemaining <= 0 ? 'achieved' : 'in-progress',
          // Ajout des données supplémentaires pour l'affichage
          initialWeight,
          targetWeight,
          currentWeight: latestMeasurement.weight,
          weightRemaining: latestMeasurement.weightRemaining
        };
        
        console.log("Adding weight goal:", weightGoal);
        allGoals.unshift(weightGoal); // Ajouter en première position
      }
      
      return allGoals;
    } catch (error) {
      console.error('Error getting goals:', error);
      toast.error("Erreur lors de la récupération des objectifs");
      return [];
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
      
      // Fallback: retourner l'ID comme nom
      return studentId;
    } catch (error) {
      console.error('Error getting student name:', error);
      return studentId;
    }
  }
  
  // Méthode pour récupérer les mesures de l'élève
  private async getStudentMeasurements(studentId: string): Promise<any[]> {
    try {
      // On utilise le service d'AirtableApi directement pour éviter les dépendances circulaires
      const studentName = await this.getStudentName(studentId);
      const formula = `{Élève}='${studentName}'`;
      
      const measurements = await AirtableApiService.fetchFromAirtable<any>('Mesures', { 
        filterByFormula: formula 
      });
      
      // Trier les mesures par date (de la plus récente à la plus ancienne)
      return measurements
        .map(measurement => ({
          id: measurement.id,
          date: measurement["Date de Mesure"],
          weight: Number(measurement["Poids"]) || 0,
          weightLost: measurement["Poids Perdu"] ? Number(measurement["Poids Perdu"]) : undefined,
          weightRemaining: measurement["Perte Restant"] ? Number(measurement["Perte Restant"]) : undefined,
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error getting measurements for goals:', error);
      return [];
    }
  }
  
  // Méthode pour récupérer les données de l'élève
  private async getStudentData(studentId: string): Promise<any> {
    try {
      const students = await AirtableApiService.fetchFromAirtable<any>('Élèves', {
        filterByFormula: `{ID}='${studentId}'`
      });
      
      if (students && students.length > 0) {
        return {
          initialWeight: students[0]["Poids Initial"] ? Number(students[0]["Poids Initial"]) : undefined,
          targetWeight: students[0]["Objectif Poids"] ? Number(students[0]["Objectif Poids"]) : undefined,
          height: students[0]["Taille"] ? Number(students[0]["Taille"]) : undefined
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting student data:', error);
      return null;
    }
  }
  
  // Version mock pour le développement
  private async getStudentGoalsMock(studentId: string): Promise<Goal[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Ajouter un objectif de poids aux objectifs mockés avec des données simulées
    const weightGoal: Goal = {
      id: 'weight-goal',
      studentId: studentId,
      description: "Atteindre l'objectif de poids (70 kg) - 3.5 kg restants",
      targetDate: new Date().toISOString().split('T')[0], // Date du jour
      status: 'in-progress',
      initialWeight: 80,
      targetWeight: 70,
      currentWeight: 73.5,
      weightRemaining: 3.5
    };
    
    const regularGoals = mockGoals.filter(goal => goal.studentId === studentId);
    return [weightGoal, ...regularGoals];
  }
}

export default new GoalService();
