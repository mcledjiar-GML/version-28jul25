// Types pour les données Airtable
export interface Student {
  id: string;
  name: string;
  prenom?: string;
  nom?: string;
  accessCode: string;
  email: string;
  age?: number | null;
  sexe?: string | null;
  gender?: string | null;
  poids_actuel?: number | null;
  initialWeight?: number | null;
  targetWeight?: number | null;
  taille?: number | null;
  height?: number | null;
  objectif_physique?: string | null;
  profession?: string | null;
  medicalHistory?: string | null;
  activityLevel?: string | null;
  motivation?: string | null;
  diet?: string | null;
  eatingHabits?: string | null;
  mealFrequency?: string | null;
  objectives?: string | null;
  birthDate?: string | null;
  status?: string | null;
  studentCode?: string | null;
  isAdmin?: boolean;  // 🎯 NOUVELLE PROPRIÉTÉ ADMIN
  semaine_a_calculer?: string | null; // 📅 SEMAINE À CALCULER
}

export interface Goal {
  id: string;
  studentId: string;
  description: string;
  targetDate: string;
  status: 'En cours' | 'Atteint' | 'En pause';
  createdAt: string;
}

export interface Measurement {
  id: string;
  studentId: string;
  date: string;
  weight: number;
  height?: number;
  bodyFat?: number;
  musclePercentage?: number;
  waistCircumference?: number;
  hipCircumference?: number;
  armCircumference?: number;
  thighCircumference?: number;
  notes?: string;
}

export interface Calculation {
  id: string;
  studentId: string;
  date: string;
  bmr: number;
  bcj: number;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  waterIntake: number;
  notes?: string;
}

// ==========================================
// 🏋️ NOUVELLE STRUCTURE BLOCS D'ENTRAÎNEMENT
// ==========================================

export interface WorkoutBlock {
  id: string;
  studentId: string;
  blockNumber: number;
  startDate: string; // Date du lundi de la première semaine
  weeks: WorkoutWeek[];
  isComplete: boolean; // True si 4 semaines complètes
  isCurrent: boolean; // True si c'est le bloc courant
}

export interface WorkoutWeek {
  id: string;
  blockId: string;
  weekNumber: number; // 1, 2, 3, 4 dans le bloc
  startDate: string; // Date du lundi de cette semaine
  days: WorkoutDay[];
  isComplete: boolean; // True si tous les jours programmés sont présents
  isCurrent: boolean; // True si c'est la semaine courante
}

export interface WorkoutDay {
  id: string;
  weekId: string;
  dayNumber: number; // 1=Lundi, 2=Mardi, etc.
  date: string;
  warmup?: WorkoutSection; // Échauffement
  mainParts: WorkoutSection[]; // 2-3 parties principales
  notes?: string;
}

export interface WorkoutSection {
  id: string;
  name: string; // "Échauffement", "Partie 1", "Partie 2", etc.
  exercises: Exercise[];
}

export interface Exercise {
  id: string;
  name: string;
  type: string; // Type d'exercice
  sets: number;
  reps: number | string; // Peut être "12-15", "Max", etc.
  weight?: number;
  restTime?: number; // Temps de repos en secondes
  notes?: string;
}

// ==========================================
// 🎯 ANCIENNE INTERFACE (pour compatibilité)
// ==========================================
export interface Workout {
  id: string;
  studentId: string;
  date?: string;
  title?: string;
  description?: string;
  exercises?: Exercise[];
  duration?: number;
  notes?: string;
  // Nouvelles propriétés pour la transition
  week?: string;
  day?: string | number;
  block?: string | number;
  part?: string;
  code?: string; // Code unique ex: FFA7.W.2025-06-09
}

// ==========================================
// 🧮 LOGIQUE MÉTIER - CALCULS DE BLOCS
// ==========================================
export interface BlockCalculation {
  studentId: string;
  currentBlock: number;
  currentWeek: string; // Date du lundi courant
  nextBlock: number;
  nextWeek: string; // Date du prochain lundi
  lastCompletedWeek?: string;
  isPaused: boolean;
  pausedSince?: string;
}

export interface MealPlan {
  id: string;
  studentId: string;
  date: string;
  meals: Meal[];
  totalCalories: number;
  notes?: string;
}

export interface Meal {
  time: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Ebook {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
  coverImage?: string;
  downloadCount?: number;
  createdAt: string;
}