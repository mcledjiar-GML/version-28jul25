// Types pour les données Airtable
export interface Student {
  id: string;
  name: string;
  accessCode: string;
  email: string;
  age?: number | null;
  gender?: string | null;
  initialWeight?: number | null;
  targetWeight?: number | null;
  height?: number | null;
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

export interface Workout {
  id: string;
  studentId: string;
  date: string;
  title: string;
  description?: string;
  exercises: Exercise[];
  duration?: number;
  notes?: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  restTime?: number;
  notes?: string;
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