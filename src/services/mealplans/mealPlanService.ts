
import { toast } from "sonner";
import AirtableApiService from "../api/airtableApi";
import { MealPlan, Meal, MealItem } from "../types/airtable.types";
import { mockMealPlans } from "../mocks/airtableMocks";

class MealPlanService {
  async getStudentMealPlans(studentId: string): Promise<MealPlan[]> {
    if (!AirtableApiService.isConfigured) {
      return this.getStudentMealPlansMock(studentId);
    }
    
    try {
      // Récupérer le nom de l'élève à partir du contexte
      const studentName = await this.getStudentName(studentId);
      console.log("Nom de l'élève pour plans alimentaires:", studentName);
      
      // Construire une formule simple sans caractères spéciaux
      // Airtable peut avoir des problèmes avec les apostrophes et les accolades
      // Essayons avec une approche différente utilisant SEARCH()
      const formula = `SEARCH("${studentName}", {Élève})`;
      console.log("Formule utilisée pour plans alimentaires:", formula);
      
      const planAlimentaire = await AirtableApiService.fetchFromAirtable<any>('Plan Alimentaire', { 
        filterByFormula: formula 
      });
      
      console.log("Plans alimentaires récupérés:", planAlimentaire);
      
      // Transformation des données Airtable en structure MealPlan
      const mealPlansMap = new Map<string, MealPlan>();
      
      // Si nous n'avons pas de plans alimentaires, essayons avec l'ID de l'élève directement
      if (!planAlimentaire || planAlimentaire.length === 0) {
        console.log("Aucun plan alimentaire trouvé, tentative avec l'ID de l'élève:", studentId);
        
        // Récupérer les plans alimentaires en utilisant l'ID au lieu du nom
        const plansById = await AirtableApiService.fetchFromAirtable<any>('Plan Alimentaire', {
          filterByFormula: `{ID Élève}='${studentId}'`
        });
        
        if (plansById && plansById.length > 0) {
          console.log("Plans alimentaires trouvés par ID:", plansById.length);
        } else {
          console.log("Aucun plan alimentaire trouvé par ID non plus.");
          return this.getStudentMealPlansMock(studentId);
        }
      }
      
      
      for (const item of planAlimentaire) {
        const date = item["Semaine"] || new Date().toISOString().split('T')[0];
        const mealType = this.mapMealType(item["Repas"] || "");
        const mealItemId = item.id;
        const mealPlanId = `${studentId}-${date}`;
        const day = item["Jour"] || "1"; // Get the day from Airtable, default to "1" if not present
        
        // Create meal item
        const mealItem: MealItem = {
          id: mealItemId,
          name: item["Aliment"] || "",
          quantity: item["Quantité"] || "",
          calories: this.sumNonNull([
            Number(item["Protéines (kcal)"]) || 0,
            Number(item["Glucides (kcal)"]) || 0,
            Number(item["Lipides (kcal)"]) || 0
          ]),
          protein: Number(item["Protéines (g)"]) || 0,
          carbs: Number(item["Glucides (g)"]) || 0,
          fat: Number(item["Lipides (g)"]) || 0,
          day: day // Add the day property
        };
        
        // Get or create the meal plan
        if (!mealPlansMap.has(mealPlanId)) {
          mealPlansMap.set(mealPlanId, {
            id: mealPlanId,
            studentId: studentId,
            date: date,
            meals: []
          });
        }
        
        const mealPlan = mealPlansMap.get(mealPlanId)!;
        
        // Find or create the meal with this type and day
        let meal = mealPlan.meals.find(m => m.type === mealType && m.day === day);
        if (!meal) {
          meal = {
            id: `${mealPlanId}-${mealType}-${day}`,
            type: mealType,
            items: [],
            day: day // Add the day property
          };
          mealPlan.meals.push(meal);
        }
        
        // Add the item to the meal
        meal.items.push(mealItem);
      }
      
      // Convert map to array and sort by date (newest first)
      return Array.from(mealPlansMap.values())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error getting meal plans:', error);
      toast.error("Erreur lors de la récupération des plans alimentaires");
      return [];
    }
  }
  
  // Helper to map Airtable meal types to our internal types
  private mapMealType(airtableMealType: string): "breakfast" | "lunch" | "dinner" | "snack" {
    switch (airtableMealType) {
      case "Petit Déjeuner": return "breakfast";
      case "Déjeuner": return "lunch";
      case "Dîner": return "dinner";
      case "Collation après Séance": return "snack";
      default: return "snack";
    }
  }
  
  // Helper to sum non-null values
  private sumNonNull(values: number[]): number {
    return values.reduce((sum, val) => sum + (val || 0), 0);
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

  // Version mock pour le développement
  private async getStudentMealPlansMock(studentId: string): Promise<MealPlan[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockMealPlans.filter(mealPlan => mealPlan.studentId === studentId);
  }
}

export default new MealPlanService();
