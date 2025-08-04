// ==========================================
// 🧮 LOGIQUE MÉTIER - CALCULS DE BLOCS D'ENTRAÎNEMENT
// ==========================================

import { BlockCalculation, WorkoutBlock, WorkoutWeek } from '../types/airtable.types';

export class BlockCalculationService {
  
  /**
   * 📅 Obtenir le lundi d'une date donnée
   */
  static getMondayOfWeek(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Dimanche = 0, donc -6 pour le lundi
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0); // Reset time to start of day
    return monday;
  }

  /**
   * 📅 Obtenir le prochain lundi
   */
  static getNextMonday(date: Date): Date {
    const currentMonday = this.getMondayOfWeek(new Date(date));
    const nextMonday = new Date(currentMonday);
    nextMonday.setDate(currentMonday.getDate() + 7);
    return nextMonday;
  }

  /**
   * 📅 Formater une date en string YYYY-MM-DD
   */
  static formatDateToString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * 🔢 Calculer le numéro de bloc à partir d'une date de début et date courante
   */
  static calculateBlockNumber(startDate: Date, currentDate: Date): number {
    const diffTime = currentDate.getTime() - startDate.getTime();
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    return Math.floor(diffWeeks / 4) + 1; // Blocs de 4 semaines, commençant à 1
  }

  /**
   * 🔢 Calculer le numéro de semaine dans un bloc (1-4)
   */
  static calculateWeekInBlock(startDate: Date, currentDate: Date): number {
    const diffTime = currentDate.getTime() - startDate.getTime();
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    return (diffWeeks % 4) + 1; // 1, 2, 3, 4
  }

  /**
   * 🎯 CALCUL PRINCIPAL : Déterminer bloc et semaine courante/suivante
   */
  static calculateBlockStatus(
    workoutBlocks: WorkoutBlock[], 
    studentId: string, 
    currentDate: Date = new Date()
  ): BlockCalculation {
    
    console.log(`🧮 Calcul du statut des blocs pour l'élève ${studentId}`);
    
    // Trier les blocs par numéro (plus récent en premier)
    const sortedBlocks = workoutBlocks
      .filter(block => block.studentId === studentId)
      .sort((a, b) => b.blockNumber - a.blockNumber);

    if (sortedBlocks.length === 0) {
      // Aucun bloc existant - commencer au bloc 1
      const currentMonday = this.getMondayOfWeek(new Date(currentDate));
      return {
        studentId,
        currentBlock: 1,
        currentWeek: this.formatDateToString(currentMonday),
        nextBlock: 1,
        nextWeek: this.formatDateToString(currentMonday),
        isPaused: false
      };
    }

    const latestBlock = sortedBlocks[0];
    const currentMonday = this.getMondayOfWeek(new Date(currentDate));
    
    // Trouver la semaine la plus récente réalisée
    let lastCompletedWeek: string | undefined;
    let mostRecentWeekDate = new Date(0); // Epoch
    
    for (const block of sortedBlocks) {
      for (const week of block.weeks) {
        const weekDate = new Date(week.startDate);
        if (weekDate > mostRecentWeekDate && week.isComplete) {
          mostRecentWeekDate = weekDate;
          lastCompletedWeek = week.startDate;
        }
      }
    }

    console.log(`📊 Dernière semaine complétée: ${lastCompletedWeek}`);
    console.log(`📊 Bloc le plus récent: ${latestBlock.blockNumber}`);

    // Vérifier si le bloc courant est complet (4 semaines)
    const currentBlockComplete = latestBlock.weeks.length >= 4 && 
                                latestBlock.weeks.every(w => w.isComplete);

    let currentBlock: number;
    let nextBlock: number;
    let currentWeek: string;
    let nextWeek: string;
    
    if (currentBlockComplete) {
      // Bloc courant terminé -> passer au suivant
      currentBlock = latestBlock.blockNumber;
      nextBlock = latestBlock.blockNumber + 1;
      nextWeek = this.formatDateToString(this.getNextMonday(mostRecentWeekDate));
      currentWeek = lastCompletedWeek || this.formatDateToString(currentMonday);
    } else {
      // Bloc courant en cours
      currentBlock = latestBlock.blockNumber;
      nextBlock = latestBlock.blockNumber; // Reste dans le même bloc
      
      // Trouver la prochaine semaine disponible dans le bloc courant
      const existingWeeks = latestBlock.weeks.map(w => w.weekNumber).sort();
      const nextWeekNumber = Math.max(...existingWeeks, 0) + 1;
      
      if (nextWeekNumber <= 4) {
        // Encore de la place dans le bloc courant
        if (lastCompletedWeek) {
          nextWeek = this.formatDateToString(this.getNextMonday(new Date(lastCompletedWeek)));
        } else {
          nextWeek = this.formatDateToString(currentMonday);
        }
        currentWeek = lastCompletedWeek || this.formatDateToString(currentMonday);
      } else {
        // Bloc plein mais pas complet -> passer au suivant
        nextBlock = latestBlock.blockNumber + 1;
        nextWeek = this.formatDateToString(this.getNextMonday(mostRecentWeekDate));
        currentWeek = lastCompletedWeek || this.formatDateToString(currentMonday);
      }
    }

    // Détecter une pause (plus de 2 semaines sans activité)
    const twoWeeksAgo = new Date(currentDate);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const isPaused = lastCompletedWeek ? 
      new Date(lastCompletedWeek) < twoWeeksAgo : false;

    const result: BlockCalculation = {
      studentId,
      currentBlock,
      currentWeek,
      nextBlock,
      nextWeek,
      lastCompletedWeek,
      isPaused,
      pausedSince: isPaused ? lastCompletedWeek : undefined
    };

    console.log(`✅ Résultat du calcul:`, result);
    return result;
  }

  /**
   * 🔄 Générer le code unique pour un workout (ex: FFA7.W.2025-06-09)
   */
  static generateWorkoutCode(studentCode: string, weekStartDate: string): string {
    // Extraire les 4 premiers caractères du code étudiant
    const studentPrefix = studentCode.substring(0, 4);
    return `${studentPrefix}.W.${weekStartDate}`;
  }

  /**
   * 📊 Regrouper les workouts par élève > bloc > semaine > jour
   */
  static groupWorkoutsByHierarchy(workouts: any[]): Map<string, Map<number, Map<number, Map<number, any[]>>>> {
    const hierarchy = new Map<string, Map<number, Map<number, Map<number, any[]>>>>();
    
    workouts.forEach(workout => {
      const studentId = workout.studentId || workout.Élève;
      const blockNum = parseInt(workout.block || workout.Bloc) || 1;
      const weekNum = parseInt(workout.weekNumber || workout.Semaine) || 1;
      const dayNum = parseInt(workout.day || workout.Jour) || 1;

      // Créer la hiérarchie si elle n'existe pas
      if (!hierarchy.has(studentId)) {
        hierarchy.set(studentId, new Map());
      }
      
      const studentMap = hierarchy.get(studentId)!;
      if (!studentMap.has(blockNum)) {
        studentMap.set(blockNum, new Map());
      }
      
      const blockMap = studentMap.get(blockNum)!;
      if (!blockMap.has(weekNum)) {
        blockMap.set(weekNum, new Map());
      }
      
      const weekMap = blockMap.get(weekNum)!;
      if (!weekMap.has(dayNum)) {
        weekMap.set(dayNum, []);
      }
      
      weekMap.get(dayNum)!.push(workout);
    });

    return hierarchy;
  }

  /**
   * 📈 Analyser la progression d'un élève (statistiques)
   */
  static analyzeStudentProgress(blocks: WorkoutBlock[]): {
    totalBlocks: number;
    completedBlocks: number;
    totalWeeks: number;
    completedWeeks: number;
    completionRate: number;
    lastActivity: string | null;
  } {
    const totalBlocks = blocks.length;
    const completedBlocks = blocks.filter(b => b.isComplete).length;
    
    let totalWeeks = 0;
    let completedWeeks = 0;
    let lastActivity: Date | null = null;

    blocks.forEach(block => {
      totalWeeks += block.weeks.length;
      completedWeeks += block.weeks.filter(w => w.isComplete).length;
      
      block.weeks.forEach(week => {
        const weekDate = new Date(week.startDate);
        if (!lastActivity || weekDate > lastActivity) {
          lastActivity = weekDate;
        }
      });
    });

    const completionRate = totalWeeks > 0 ? (completedWeeks / totalWeeks) * 100 : 0;

    return {
      totalBlocks,
      completedBlocks,
      totalWeeks,
      completedWeeks,
      completionRate: Math.round(completionRate),
      lastActivity: lastActivity ? this.formatDateToString(lastActivity) : null
    };
  }
}