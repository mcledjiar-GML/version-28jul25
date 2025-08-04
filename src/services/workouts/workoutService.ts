
import { toast } from "sonner";
import AirtableApiService from "../api/airtableApi";
import { 
  Exercise, 
  Workout, 
  WorkoutBlock, 
  WorkoutWeek, 
  WorkoutDay, 
  WorkoutSection,
  BlockCalculation 
} from "../types/airtable.types";
import { mockWorkouts } from "../mocks/airtableMocks";
import { BlockCalculationService } from "./blockCalculations";

class WorkoutService {
  async getStudentWorkouts(studentId: string): Promise<Workout[]> {
    if (!AirtableApiService.isConfigured) {
      return this.getStudentWorkoutsMock(studentId);
    }
    
    try {
      // 🎯 NOUVELLE LOGIQUE : Utiliser l'identifiant unique de l'élève
      const studentCode = await this.getStudentCode(studentId);
      console.log("🆔 Code élève:", studentCode);
      
      // Filtrer par code workout qui commence par l'identifiant de l'élève
      const formula = `FIND('${studentCode}.W.', {Code Workout}) = 1`;
      console.log("🔍 Formule utilisée:", formula);
      
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

  /**
   * 🆔 Récupérer l'identifiant unique de l'élève (pour codes workout)
   */
  private async getStudentCode(studentId: string): Promise<string> {
    try {
      // Si studentId est déjà un code court (comme FFA7), le retourner directement
      if (studentId.length <= 5 && !studentId.startsWith('rec')) {
        console.log(`🎯 Code élève direct: ${studentId}`);
        return studentId;
      }
      
      // Récupérer l'élève depuis Airtable par son code d'accès
      const students = await AirtableApiService.fetchFromAirtable<any>('Élèves', {
        filterByFormula: `{Code}='${studentId}'`
      });
      
      if (students && students.length > 0) {
        // Extraire l'identifiant unique depuis le champ IDU ou similaire
        const student = students[0];
        const uniqueId = student["IDU Eleve"] || student["IDU"] || student["Identifiant"];
        
        if (uniqueId) {
          console.log(`🆔 Identifiant unique trouvé: ${uniqueId}`);
          return uniqueId;
        }
        
        // Si pas d'IDU, utiliser les premiers caractères du nom
        const nom = student["Nom"];
        if (nom) {
          const codeGenere = this.generateCodeFromName(nom);
          console.log(`🔧 Code généré depuis le nom: ${codeGenere}`);
          return codeGenere;
        }
      }
      
      // Fallback: essayer avec tous les champs
      const allStudents = await AirtableApiService.fetchAllRecords('Élèves');
      
      const student = allStudents.find(s => 
        s.id === studentId || 
        s.code === studentId || 
        s.Code === studentId ||
        (s.fields && (s.fields.code === studentId || s.fields.Code === studentId))
      );
      
      if (student) {
        const fields = student.fields || student;
        const uniqueId = fields["IDU Eleve"] || fields["IDU"] || fields["Identifiant"];
        
        if (uniqueId) {
          console.log(`🆔 Identifiant unique trouvé (fallback): ${uniqueId}`);
          return uniqueId;
        }
        
        // Générer un code depuis le nom
        const nom = fields["Nom"];
        if (nom) {
          const codeGenere = this.generateCodeFromName(nom);
          console.log(`🔧 Code généré depuis le nom (fallback): ${codeGenere}`);
          return codeGenere;
        }
      }
      
      console.warn(`🚨 Impossible de trouver l'identifiant unique pour: ${studentId}`);
      return studentId; // Retourner l'ID comme fallback
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du code élève:', error);
      return studentId; // Retourner l'ID comme fallback
    }
  }

  /**
   * 🏷️ Générer un code depuis le nom (si pas d'IDU)
   */
  private generateCodeFromName(nom: string): string {
    // Prendre les premières lettres de chaque mot + chiffres aléatoires
    const mots = nom.split(' ');
    let code = '';
    
    mots.forEach(mot => {
      if (mot.length > 0) {
        code += mot.charAt(0).toUpperCase();
      }
    });
    
    // Ajouter des chiffres pour la unicité
    code += Math.floor(Math.random() * 99).toString().padStart(2, '0');
    
    return code;
  }

  /**
   * 🏋️ NOUVELLE MÉTHODE : Récupérer les blocs d'entraînement structurés
   */
  async getStudentWorkoutBlocks(studentId: string): Promise<WorkoutBlock[]> {
    try {
      console.log(`🏋️ Récupération des blocs d'entraînement pour ${studentId}`);
      
      // Récupérer tous les workouts de l'élève (version brute)
      const rawWorkouts = await this.getStudentWorkoutsRaw(studentId);
      
      if (rawWorkouts.length === 0) {
        console.log(`ℹ️ Aucun workout trouvé pour ${studentId}`);
        return [];
      }

      console.log(`📊 ${rawWorkouts.length} workouts bruts récupérés`);
      
      // Regrouper par hiérarchie : bloc > semaine > jour
      const hierarchy = BlockCalculationService.groupWorkoutsByHierarchy(rawWorkouts);
      const studentHierarchy = hierarchy.get(studentId);
      
      if (!studentHierarchy) {
        return [];
      }

      // Construire les blocs structurés
      const blocks: WorkoutBlock[] = [];
      
      for (const [blockNumber, blockData] of studentHierarchy) {
        const weeks: WorkoutWeek[] = [];
        
        for (const [weekNumber, weekData] of blockData) {
          const days: WorkoutDay[] = [];
          
          for (const [dayNumber, dayWorkouts] of weekData) {
            const workoutDay = this.buildWorkoutDay(dayWorkouts, weekNumber, dayNumber);
            if (workoutDay) {
              days.push(workoutDay);
            }
          }
          
          // Calculer la date de début de semaine (lundi)
          const firstWorkout = Array.from(weekData.values()).flat()[0];
          const weekStartDate = this.calculateWeekStartDate(firstWorkout, weekNumber);
          
          const week: WorkoutWeek = {
            id: `${studentId}-B${blockNumber}-W${weekNumber}`,
            blockId: `${studentId}-B${blockNumber}`,
            weekNumber,
            startDate: weekStartDate,
            days: days.sort((a, b) => a.dayNumber - b.dayNumber),
            isComplete: this.isWeekComplete(days),
            isCurrent: false // Sera calculé plus tard
          };
          
          weeks.push(week);
        }
        
        // Calculer la date de début du bloc (première semaine)
        const firstWeek = weeks.sort((a, b) => a.weekNumber - b.weekNumber)[0];
        const blockStartDate = firstWeek ? firstWeek.startDate : new Date().toISOString().split('T')[0];
        
        const block: WorkoutBlock = {
          id: `${studentId}-B${blockNumber}`,
          studentId,
          blockNumber,
          startDate: blockStartDate,
          weeks: weeks.sort((a, b) => a.weekNumber - b.weekNumber),
          isComplete: weeks.length >= 4 && weeks.every(w => w.isComplete),
          isCurrent: false // Sera calculé plus tard
        };
        
        blocks.push(block);
      }
      
      // Trier les blocs par numéro et marquer le bloc courant
      blocks.sort((a, b) => b.blockNumber - a.blockNumber);
      
      // Calculer quel est le bloc/semaine courant
      const calculation = BlockCalculationService.calculateBlockStatus(blocks, studentId);
      
      // Marquer les blocs et semaines courantes
      blocks.forEach(block => {
        block.isCurrent = block.blockNumber === calculation.currentBlock;
        
        block.weeks.forEach(week => {
          week.isCurrent = week.startDate === calculation.currentWeek;
        });
      });
      
      console.log(`✅ ${blocks.length} blocs structurés créés`);
      console.log(`📊 Statut calculé:`, calculation);
      
      return blocks;
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des blocs:', error);
      return [];
    }
  }

  /**
   * 🎯 Récupérer les données brutes des workouts depuis Airtable
   */
  private async getStudentWorkoutsRaw(studentId: string): Promise<any[]> {
    try {
      // 🎯 NOUVELLE LOGIQUE : Utiliser l'identifiant unique de l'élève
      const studentCode = await this.getStudentCode(studentId);
      console.log(`🆔 Code élève récupéré: ${studentCode}`);
      
      // Filtrer par code workout qui commence par l'identifiant de l'élève
      // Format: FFA7.W.2025-06-09 où FFA7 est l'identifiant unique
      const formula = `FIND('${studentCode}.W.', {Code Workout}) = 1`;
      console.log(`🔍 Formule Airtable: ${formula}`);
      
      const workoutsRaw = await AirtableApiService.fetchFromAirtable('Workout', { 
        filterByFormula: formula 
      });
      
      console.log(`📋 ${workoutsRaw.length} workouts bruts récupérés pour ${studentCode}`);
      console.log('🔍 Échantillon de données brutes:', workoutsRaw.slice(0, 3));
      
      // Nettoyer et valider les données
      const cleanedWorkouts = this.cleanAndValidateWorkoutData(workoutsRaw);
      console.log(`✅ ${cleanedWorkouts.length} workouts valides après nettoyage`);
      
      return cleanedWorkouts;
      
    } catch (error) {
      console.error('❌ Erreur récupération workouts bruts:', error);
      return [];
    }
  }

  /**
   * 🧹 Nettoyer et valider les données des workouts
   */
  private cleanAndValidateWorkoutData(rawData: any[]): any[] {
    const cleanedData: any[] = [];
    
    rawData.forEach((record, index) => {
      try {
        // Détecter si les données sont corrompues ou mélangées
        const cleaned = this.sanitizeWorkoutRecord(record);
        
        if (cleaned && this.isValidWorkoutRecord(cleaned)) {
          cleanedData.push(cleaned);
        } else {
          console.warn(`⚠️ Enregistrement ${index} ignoré - données invalides:`, record);
        }
        
      } catch (error) {
        console.error(`❌ Erreur nettoyage enregistrement ${index}:`, error, record);
      }
    });
    
    return cleanedData;
  }

  /**
   * 🧼 Nettoyer un enregistrement workout individuel
   */
  private sanitizeWorkoutRecord(record: any): any | null {
    if (!record) return null;
    
    // Si c'est un objet avec fields, utiliser fields
    const data = record.fields || record;
    
    // 🎯 NOUVEAU : Parser le code workout pour extraire les infos
    const codeWorkout = data['Code Workout'] || data.CodeWorkout || data.Code || '';
    const workoutInfo = this.parseWorkoutCode(codeWorkout);
    
    // Identifier les champs principaux même si mal nommés
    const cleaned: any = {
      id: record.id || `workout-${Math.random()}`,
      // Code Workout
      'Code Workout': codeWorkout,
      // Élève (extrait du code)
      Élève: workoutInfo.studentCode || data['Élève'] || data.Eleve || data.Student || data.Name || '',
      // Bloc
      Bloc: this.parseBlockNumber(data.Bloc || data.Block || data.B || ''),
      // Semaine (date extraite du code ou champ direct)
      Semaine: workoutInfo.weekDate || this.parseWeekDate(data.Semaine || data.Week || data.Date || data.S || ''),
      // Jour
      Jour: this.parseDayNumber(data.Jour || data.Day || data.J || data.D || ''),
      // Partie
      Partie: this.parsePartNumber(data.Partie || data.Part || data.P || ''),
      // Exercice
      Exercice: this.parseExerciseName(data.Exercice || data.Exercise || data.Ex || data.E || ''),
      // Format de travail / Répétitions
      'Format de Travail': data['Format de Travail'] || data.Format || data.Reps || data.Rep || data.R || '',
      // Séries
      Séries: this.parseSeriesNumber(data.Séries || data.Series || data.Sets || data.Set || data.S || ''),
      // Repos
      Rest: data.Rest || data.Repos || data.R || '',
      // Charge
      'Charge (Kg)': this.parseWeight(data['Charge (Kg)'] || data.Charge || data.Weight || data.W || ''),
      // Notes
      Notes: data.Notes || data.Note || data.N || ''
    };
    
    return cleaned;
  }

  /**
   * 🔍 Parser le code workout (FFA7.W.2025-06-09)
   */
  private parseWorkoutCode(codeWorkout: string): {
    studentCode: string;
    weekDate: string;
    isValid: boolean;
  } {
    const defaultResult = {
      studentCode: '',
      weekDate: '',
      isValid: false
    };
    
    if (!codeWorkout || typeof codeWorkout !== 'string') {
      return defaultResult;
    }
    
    // Format attendu: IDENTIFIANT.W.YYYY-MM-DD
    const match = codeWorkout.match(/^([A-Z0-9]+)\.W\.(\d{4}-\d{2}-\d{2})$/);
    
    if (match) {
      return {
        studentCode: match[1],
        weekDate: match[2],
        isValid: true
      };
    }
    
    // Essayer de parser un format plus flexible
    const flexMatch = codeWorkout.match(/([A-Z0-9]+).*?(\d{4}-\d{2}-\d{2})/);
    
    if (flexMatch) {
      return {
        studentCode: flexMatch[1],
        weekDate: flexMatch[2],
        isValid: true
      };
    }
    
    return defaultResult;
  }

  /**
   * ✅ Valider qu'un enregistrement workout est correct
   */
  private isValidWorkoutRecord(record: any): boolean {
    // Doit avoir au minimum un élève, un exercice et une partie
    return !!(
      record.Élève && 
      record.Exercice && 
      record.Partie &&
      record.Bloc !== null &&
      record.Jour !== null
    );
  }

  /**
   * 🔢 Parser le numéro de bloc
   */
  private parseBlockNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const match = value.match(/\d+/);
      return match ? parseInt(match[0]) : 1;
    }
    return 1;
  }

  /**
   * 📅 Parser la date de semaine
   */
  private parseWeekDate(value: any): string {
    if (!value) return new Date().toISOString().split('T')[0];
    
    // Si c'est déjà une date ISO
    if (typeof value === 'string' && value.match(/\d{4}-\d{2}-\d{2}/)) {
      return value;
    }
    
    // Essayer de parser une date française
    if (typeof value === 'string') {
      const frenchDateMatch = value.match(/(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i);
      if (frenchDateMatch) {
        const months = {
          'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
          'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
          'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
        };
        const day = frenchDateMatch[1].padStart(2, '0');
        const month = months[frenchDateMatch[2].toLowerCase() as keyof typeof months] || '01';
        const year = frenchDateMatch[3];
        return `${year}-${month}-${day}`;
      }
    }
    
    return new Date().toISOString().split('T')[0];
  }

  /**
   * 📆 Parser le numéro de jour
   */
  private parseDayNumber(value: any): number {
    if (typeof value === 'number') return Math.max(1, Math.min(7, value));
    if (typeof value === 'string') {
      const match = value.match(/\d+/);
      return match ? Math.max(1, Math.min(7, parseInt(match[0]))) : 1;
    }
    return 1;
  }

  /**
   * 🎯 Parser le numéro de partie
   */
  private parsePartNumber(value: any): number {
    if (typeof value === 'number') return Math.max(1, value);
    if (typeof value === 'string') {
      const match = value.match(/\d+/);
      return match ? Math.max(1, parseInt(match[0])) : 1;
    }
    return 1;
  }

  /**
   * 🏋️ Parser le nom d'exercice
   */
  private parseExerciseName(value: any): string {
    if (!value) return 'Exercice';
    
    const name = value.toString().trim();
    
    // Nettoyer les caractères spéciaux et fragments
    let cleaned = name
      .replace(/[^\w\s\-'àáâäçéèêëïîôùûüÿñæœ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Si trop court ou vide, donner un nom par défaut
    if (cleaned.length < 2) {
      return 'Exercice';
    }
    
    return cleaned;
  }

  /**
   * 🔢 Parser le nombre de séries
   */
  private parseSeriesNumber(value: any): number {
    if (typeof value === 'number') return Math.max(1, value);
    if (typeof value === 'string') {
      const match = value.match(/\d+/);
      return match ? Math.max(1, parseInt(match[0])) : 1;
    }
    return 1;
  }

  /**
   * ⚖️ Parser le poids
   */
  private parseWeight(value: any): number | undefined {
    if (typeof value === 'number') return value > 0 ? value : undefined;
    if (typeof value === 'string') {
      const match = value.match(/(\d+(?:\.\d+)?)/);
      return match ? parseFloat(match[0]) : undefined;
    }
    return undefined;
  }

  /**
   * 🏷️ Générer le nom d'une partie
   */
  private generatePartName(partNumber: number): string {
    if (partNumber === 1) {
      return 'Échauffement';
    } else if (partNumber === 2) {
      return 'Partie Principale 1';
    } else if (partNumber === 3) {
      return 'Partie Principale 2';
    } else if (partNumber === 4) {
      return 'Récupération/Cardio';
    } else {
      return `Partie ${partNumber}`;
    }
  }

  /**
   * 🏗️ Construire un jour d'entraînement à partir des exercices bruts
   */
  private buildWorkoutDay(dayWorkouts: any[], weekNumber: number, dayNumber: number): WorkoutDay | null {
    if (dayWorkouts.length === 0) return null;
    
    const firstWorkout = dayWorkouts[0];
    
    // Grouper les exercices par partie
    const partiesMap = new Map<string, any[]>();
    
    dayWorkouts.forEach(workout => {
      // Utiliser le numéro de partie nettoyé pour créer le nom
      const partieNumber = workout.Partie || workout.part || 1;
      const partieName = this.generatePartName(partieNumber);
      
      if (!partiesMap.has(partieName)) {
        partiesMap.set(partieName, []);
      }
      partiesMap.get(partieName)!.push(workout);
    });
    
    // Construire les sections
    const mainParts: WorkoutSection[] = [];
    let warmup: WorkoutSection | undefined;
    
    for (const [partieName, exercises] of partiesMap) {
      const section: WorkoutSection = {
        id: `W${weekNumber}-D${dayNumber}-${partieName.replace(/\s+/g, '-')}`,
        name: partieName,
        exercises: exercises
          .filter(ex => ex.Exercice && ex.Exercice.trim().length > 0) // Filtrer les exercices vides
          .map((ex, index) => ({
            id: ex.id || `${ex.Exercice}-${weekNumber}-${dayNumber}-${index}`,
            name: ex.Exercice.trim(),
            type: ex.Type || 'Standard',
            sets: ex.Séries || 1,
            reps: ex['Format de Travail'] || '10',
            weight: ex['Charge (Kg)'] || undefined,
            restTime: this.parseRestTime(ex.Rest),
            notes: ex.Notes || undefined
          }))
      };
      
      // Ne créer la section que si elle a des exercices valides
      if (section.exercises.length > 0) {
        if (partieName.toLowerCase().includes('échauffement') || 
            partieName.toLowerCase().includes('warmup') ||
            partieName.toLowerCase().includes('warm up')) {
          warmup = section;
        } else {
          mainParts.push(section);
        }
      }
    }
    
    // Calculer la date du jour
    const weekStartDate = this.calculateWeekStartDate(firstWorkout, weekNumber);
    const dayDate = new Date(weekStartDate);
    dayDate.setDate(dayDate.getDate() + (dayNumber - 1));
    
    return {
      id: `W${weekNumber}-D${dayNumber}`,
      weekId: `W${weekNumber}`,
      dayNumber,
      date: dayDate.toISOString().split('T')[0],
      warmup,
      mainParts: mainParts.sort((a, b) => a.name.localeCompare(b.name)),
      notes: firstWorkout.Notes || undefined
    };
  }

  /**
   * 📅 Calculer la date de début de semaine (lundi)
   */
  private calculateWeekStartDate(workout: any, weekNumber: number): string {
    // Essayer d'extraire la date depuis le workout
    if (workout.Semaine && typeof workout.Semaine === 'string' && workout.Semaine.match(/\d{4}-\d{2}-\d{2}/)) {
      return workout.Semaine;
    }
    
    if (workout.Date) {
      const date = new Date(workout.Date);
      return BlockCalculationService.formatDateToString(BlockCalculationService.getMondayOfWeek(date));
    }
    
    // Fallback : utiliser la date courante
    const today = new Date();
    const monday = BlockCalculationService.getMondayOfWeek(today);
    return BlockCalculationService.formatDateToString(monday);
  }

  /**
   * ✅ Vérifier si une semaine est complète
   */
  private isWeekComplete(days: WorkoutDay[]): boolean {
    // Une semaine est complète si elle a au moins 2 jours d'entraînement
    // et que chaque jour a au moins une partie principale
    return days.length >= 2 && days.every(day => day.mainParts.length > 0);
  }

  /**
   * ⏱️ Parser le temps de repos
   */
  private parseRestTime(restString: string | number | undefined): number | undefined {
    if (typeof restString === 'number') return restString;
    if (!restString) return undefined;
    
    const str = restString.toString().toLowerCase();
    
    // Chercher des patterns comme "2min", "90s", "1min30"
    const minMatch = str.match(/(\d+)\s*min/);
    const secMatch = str.match(/(\d+)\s*s/);
    
    if (minMatch) {
      return parseInt(minMatch[1]) * 60;
    }
    
    if (secMatch) {
      return parseInt(secMatch[1]);
    }
    
    // Essayer de parser comme nombre
    const num = parseInt(str);
    return isNaN(num) ? undefined : num;
  }

  /**
   * 🧮 Calculer le statut des blocs pour un élève
   */
  async calculateBlockStatus(studentId: string): Promise<BlockCalculation> {
    const blocks = await this.getStudentWorkoutBlocks(studentId);
    return BlockCalculationService.calculateBlockStatus(blocks, studentId);
  }

  /**
   * 📊 Obtenir les statistiques de progression d'un élève
   */
  async getStudentProgress(studentId: string): Promise<{
    totalBlocks: number;
    completedBlocks: number;
    totalWeeks: number;
    completedWeeks: number;
    completionRate: number;
    lastActivity: string | null;
    currentStatus: BlockCalculation;
  }> {
    const blocks = await this.getStudentWorkoutBlocks(studentId);
    const stats = BlockCalculationService.analyzeStudentProgress(blocks);
    const currentStatus = BlockCalculationService.calculateBlockStatus(blocks, studentId);
    
    return {
      ...stats,
      currentStatus
    };
  }

  // Mock version for development
  private async getStudentWorkoutsMock(studentId: string): Promise<Workout[]> {
    console.log('🧪 Utilisation des données mock pour les workouts');
    console.log(`🔍 Recherche workouts pour studentId: ${studentId}`);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Pour Féline Faure, simuler des workouts avec codes
    if (studentId === 'rech0KgjCrK24UrBH') {
      console.log('🎯 Données mock pour Féline Faure avec codes workout');
      return mockWorkouts.map(workout => {
        // Ajouter des codes workout simulés
        return {
          ...workout,
          // Simuler que nous avons extrait FFA7 comme identifiant pour Féline
          code: `FFA7.W.${workout.week}`
        };
      });
    }
    
    return mockWorkouts.filter(workout => workout.studentId === studentId);
  }
}

export default new WorkoutService();
