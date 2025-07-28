
import { toast } from "sonner";
import AirtableApiService from "../api/airtableApi";
import { Calculation } from "../types/airtable.types";
import { mockCalculations } from "../mocks/airtableMocks";

class CalculationService {
  async getStudentCalculations(studentId: string): Promise<Calculation[]> {
    if (!AirtableApiService.isConfigured) {
      console.log("Airtable not configured, using mock data");
      return this.getStudentCalculationsMock(studentId);
    }
    
    try {
      // Étape 1: Récupérer le nom de l'élève à partir du contexte
      const studentName = await this.getStudentName(studentId);
      console.log("Nom de l'élève:", studentName);
      
      // Étape 2: Utiliser la formule Airtable avec le nom de l'élève
      const formula = `{Élève}='${studentName}'`;
      console.log("Formule utilisée:", formula);
      
      const calculations = await AirtableApiService.fetchFromAirtable<any>('BCJ', { 
        filterByFormula: formula 
      });
      
      console.log("Calculs récupérés:", calculations);
      
      if (calculations.length > 0) {
        // Mapper les données reçues au format attendu
        return this.mapCalculations(calculations, studentId);
      } else {
        console.log("Aucun calcul trouvé, utilisation des données de test");
        return this.getStudentCalculationsMock(studentId);
      }
    } catch (error) {
      console.error('Error getting calculations:', error);
      toast.error("Erreur lors de la récupération des calculs");
      return this.getStudentCalculationsMock(studentId);
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
  
  // Méthode pour normaliser les données des calculs
  private mapCalculations(calculations: any[], studentId: string): Calculation[] {
    return calculations.map(calculation => ({
      id: calculation.id,
      studentId: calculation.StudentId || calculation["IDU Élève"] || calculation.Élève || studentId,
      date: calculation.Date || calculation.Semaine,
      bmr: calculation.BMR || calculation["BMR (kcal)"] || 0,
      bcj: calculation.BCJ || calculation["BCJ (kcal)"] || 0,
      protein: calculation.Protein || calculation["Protéines (g)"] || 0,
      carbs: calculation.Carbs || calculation["Glucides (g)"] || 0,
      fat: calculation.Fat || calculation["Lipides (g)"] || 0,
      proteinKcal: calculation["Protéines (kcal)"] || 0,
      carbsKcal: calculation["Glucides (kcal)"] || 0,
      fatKcal: calculation["Lipides (kcal)"] || 0,
      proteinPercentage: calculation["Protéines (%)"] || 0,
      carbsPercentage: calculation["Glucides (%)"] || 0,
      fatPercentage: calculation["Lipides (%)"] || 0,
      totalGrams: calculation["Total (g)"] || 0,
      totalKcal: calculation["Total (kcal)"] || 0,
      objective: calculation["BCJ / Obj (kcal)"] || 0
    }));
  }

  // Version mock pour le développement
  private async getStudentCalculationsMock(studentId: string): Promise<Calculation[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`Using mock data for student ${studentId}`);
    return mockCalculations.filter(calculation => calculation.studentId === studentId);
  }
}

export default new CalculationService();
