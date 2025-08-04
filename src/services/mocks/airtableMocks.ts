
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

// Mock workouts data - Format Airtable réaliste pour Féline Faure avec codes workout
export const mockWorkouts: Workout[] = [
  {
    id: '1',
    studentId: 'rech0KgjCrK24UrBH', // Code d'accès Féline
    week: '2025-03-17',
    day: '1',
    block: '2',
    part: '1',
    exercises: [
      {
        id: '1',
        name: 'Kcal SKierg',
        format: 'WARM UP x3',
        rest: '',
        weight: 0,
        notes: ''
      },
      {
        id: '2',
        name: 'Jumping Jack',
        format: 'WARM UP x3',
        rest: '',
        weight: 0,
        notes: ''
      },
      {
        id: '3',
        name: 'Bearwalk',
        format: 'WARM UP x3',
        rest: '',
        weight: 0,
        notes: ''
      }
    ]
  },
  {
    id: '2',
    studentId: 'rech0KgjCrK24UrBH',
    week: '2025-03-17',
    day: '1',
    block: '2',
    part: '2',
    exercises: [
      {
        id: '4',
        name: 'Push press',
        format: 'AMRAP 15\' : Max tour possible',
        rest: '',
        weight: 0,
        notes: 'haltère'
      },
      {
        id: '5',
        name: 'Jumping jack',
        format: 'AMRAP 15\' : Max tour possible',
        rest: '',
        weight: 0,
        notes: ''
      },
      {
        id: '6',
        name: 'Bearwalk',
        format: 'AMRAP 15\' : Max tour possible',
        rest: '',
        weight: 0,
        notes: ''
      }
    ]
  },
  {
    id: '3',
    studentId: 'rech0KgjCrK24UrBH',
    week: '2025-03-17',
    day: '1',
    block: '2',
    part: '3',
    exercises: [
      {
        id: '7',
        name: 'Squat jump',
        format: '21 - 15 - 9 - 7 - 5 - 1',
        rest: '',
        weight: 0,
        notes: ''
      },
      {
        id: '8',
        name: 'Thruster',
        format: '21 - 15 - 9 - 7 - 5 - 1',
        rest: '',
        weight: 0,
        notes: ''
      }
    ]
  },
  {
    id: '4',
    studentId: 'rech0KgjCrK24UrBH',
    week: '2025-03-17',
    day: '1',
    block: '2',
    part: '4',
    exercises: [
      {
        id: '9',
        name: 'Assault bike',
        format: 'Tabata 20/10',
        rest: '',
        weight: 0,
        notes: ''
      }
    ]
  },
  {
    id: '5',
    studentId: 'rech0KgjCrK24UrBH',
    week: '2025-03-17',
    day: '2',
    block: '2',
    part: '1',
    exercises: [
      {
        id: '10',
        name: 'Kcal SKierg',
        format: 'WARM UP x3',
        rest: '',
        weight: 0,
        notes: ''
      },
      {
        id: '11',
        name: 'Jumping Jack',
        format: 'WARM UP x3',
        rest: '',
        weight: 0,
        notes: ''
      },
      {
        id: '12',
        name: 'Bearwalk',
        format: 'WARM UP x3',
        rest: '',
        weight: 0,
        notes: ''
      }
    ]
  },
  {
    id: '6',
    studentId: 'rech0KgjCrK24UrBH',
    week: '2025-03-17',
    day: '2',
    block: '2',
    part: '2',
    exercises: [
      {
        id: '13',
        name: 'Thruster',
        format: 'HiiT : 45s work / 15s rest - 5 Tour',
        rest: '1\' repos',
        weight: 0,
        notes: ''
      },
      {
        id: '14',
        name: 'Farmer Walk',
        format: 'HiiT : 45s work / 15s rest - 5 Tour',
        rest: '1\' repos',
        weight: 0,
        notes: ''
      },
      {
        id: '15',
        name: 'Burpees',
        format: 'HiiT : 45s work / 15s rest - 5 Tour',
        rest: '1\' repos',
        weight: 0,
        notes: ''
      },
      {
        id: '16',
        name: 'Reverse crunch',
        format: 'HiiT : 45s work / 15s rest - 5 Tour',
        rest: '1\' repos',
        weight: 0,
        notes: ''
      }
    ]
  },
  {
    id: '7',
    studentId: 'rech0KgjCrK24UrBH',
    week: '2025-03-17',
    day: '2',
    block: '2',
    part: '3',
    exercises: [
      {
        id: '17',
        name: 'Inclinaison latéral',
        format: '30s work /coté : 3 tour',
        rest: '30/45s repos',
        weight: 0,
        notes: ''
      }
    ]
  },
  {
    id: '8',
    studentId: 'rech0KgjCrK24UrBH',
    week: '2025-03-17',
    day: '2',
    block: '2',
    part: '4',
    exercises: [
      {
        id: '18',
        name: 'Marche rapide',
        format: '1,5km : Pente 5 / vitesse 6',
        rest: '',
        weight: 0,
        notes: ''
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
