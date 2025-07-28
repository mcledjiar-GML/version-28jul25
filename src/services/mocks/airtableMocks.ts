
import { Student, Goal, Measurement, Calculation, Workout, MealPlan } from '../types/airtable.types';

// Mock student data - now empty as we've removed the demo codes
export const mockStudent: Student = {
  id: '',
  name: '',
  accessCode: '',
  email: ''
};

// Mock goals data
export const mockGoals: Goal[] = [
  {
    id: '1',
    studentId: '1',
    description: 'Perdre 5kg',
    targetDate: '2023-12-31',
    status: 'in-progress'
  },
  {
    id: '2',
    studentId: '1',
    description: 'Courir un semi-marathon',
    targetDate: '2024-03-15',
    status: 'pending'
  }
];

// Mock measurements data
export const mockMeasurements: Measurement[] = [
  {
    id: '1',
    studentId: '1',
    date: '2023-10-01',
    weight: 83,
    height: 182,
    bodyFat: 18,
    musclePercentage: 40
  },
  {
    id: '2',
    studentId: '1',
    date: '2023-11-01',
    weight: 81.5,
    height: 182,
    bodyFat: 17.5,
    musclePercentage: 41
  },
  {
    id: '3',
    studentId: '1',
    date: '2023-12-01',
    weight: 80,
    height: 182,
    bodyFat: 16.8,
    musclePercentage: 42
  }
];

// Mock calculations data
export const mockCalculations: Calculation[] = [
  {
    id: '1',
    studentId: '1',
    date: '2023-12-01',
    bmr: 1800,
    bcj: 2400,
    protein: 160,
    carbs: 240,
    fat: 80
  }
];

// Mock workouts data
export const mockWorkouts: Workout[] = [
  {
    id: '1',
    studentId: '1',
    week: '2023-12-05',
    day: '1',
    block: '2',
    part: '1',
    exercises: [
      {
        id: '1',
        name: 'Squat',
        format: '4x10',
        rest: '90s',
        weight: 80,
        notes: 'Augmenter le poids progressivement'
      },
      {
        id: '2',
        name: 'Presse à cuisse',
        format: '3x12',
        rest: '60s',
        weight: 120
      },
      {
        id: '3',
        name: 'Extension des jambes',
        format: '3x15',
        rest: '60s',
        weight: 60
      }
    ]
  },
  {
    id: '2',
    studentId: '1',
    week: '2023-12-07',
    day: '2',
    block: '2',
    part: '2',
    exercises: [
      {
        id: '1',
        name: 'Développé couché',
        format: '4x8',
        rest: '90s',
        weight: 70
      },
      {
        id: '2',
        name: 'Élévations latérales',
        format: '3x12',
        rest: '60s',
        weight: 10
      },
      {
        id: '3',
        name: 'Dips',
        format: '3x10',
        rest: '60s',
        weight: 0,
        notes: 'Poids du corps'
      }
    ]
  }
];

// Mock meal plans data
export const mockMealPlans: MealPlan[] = [
  {
    id: '1',
    studentId: '1',
    date: '2023-12-05',
    meals: [
      {
        id: '1',
        type: 'breakfast',
        items: [
          {
            id: '1',
            name: 'Flocons d\'avoine',
            quantity: '80g',
            calories: 300,
            protein: 10,
            carbs: 50,
            fat: 5
          },
          {
            id: '2',
            name: 'Protéine whey',
            quantity: '30g',
            calories: 120,
            protein: 24,
            carbs: 3,
            fat: 1
          }
        ]
      },
      {
        id: '2',
        type: 'lunch',
        items: [
          {
            id: '1',
            name: 'Poulet grillé',
            quantity: '150g',
            calories: 250,
            protein: 45,
            carbs: 0,
            fat: 8
          },
          {
            id: '2',
            name: 'Riz complet',
            quantity: '100g',
            calories: 130,
            protein: 3,
            carbs: 28,
            fat: 1
          },
          {
            id: '3',
            name: 'Légumes variés',
            quantity: '150g',
            calories: 80,
            protein: 3,
            carbs: 15,
            fat: 0
          }
        ]
      }
    ]
  }
];
