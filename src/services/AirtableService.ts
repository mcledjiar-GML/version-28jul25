
import AirtableApiService from './api/airtableApi';
import AuthService from './auth/authService';
import GoalService from './goals/goalService';
import MeasurementService from './measurements/measurementService';
import CalculationService from './calculations/calculationService';
import WorkoutService from './workouts/workoutService';
import MealPlanService from './mealplans/mealPlanService';

// Export all types from the types file
export * from './types/airtable.types';

class AirtableService {
  private apiService = AirtableApiService;
  private authService = AuthService;
  private goalService = GoalService;
  private measurementService = MeasurementService;
  private calculationService = CalculationService;
  private workoutService = WorkoutService;
  private mealPlanService = MealPlanService;

  // Configuration methods
  public configure(baseId: string, apiKey: string) {
    this.apiService.configure(baseId, apiKey);
  }

  // Authentication
  public verifyAccess(accessCode: string) {
    return this.authService.verifyAccess(accessCode);
  }

  // Goals
  public getStudentGoals(studentId: string) {
    return this.goalService.getStudentGoals(studentId);
  }

  // Measurements
  public getStudentMeasurements(studentId: string) {
    return this.measurementService.getStudentMeasurements(studentId);
  }

  // Calculations
  public getStudentCalculations(studentId: string) {
    return this.calculationService.getStudentCalculations(studentId);
  }

  // Workouts
  public getStudentWorkouts(studentId: string) {
    return this.workoutService.getStudentWorkouts(studentId);
  }

  // Meal Plans
  public getStudentMealPlans(studentId: string) {
    return this.mealPlanService.getStudentMealPlans(studentId);
  }

  // Add the isConfigured getter
  get isConfigured() {
    return true; // Always return true since we have the default configuration
  }
}

export default new AirtableService();
