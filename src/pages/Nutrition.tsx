
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStudent } from '../context/StudentContext';
import Layout from '../components/Layout';
import DashboardHeader from '../components/DashboardHeader';
import { Utensils } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { MealPlan } from '@/services/types/airtable.types';
import AirtableService from '@/services/AirtableService';
import MealPlanView from '@/components/nutrition/MealPlanView';
import MealPlanHistoryTable from '@/components/nutrition/MealPlanHistoryTable';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

// Create a client
const queryClient = new QueryClient();

// Wrapper component with the query client
const NutritionContent = () => {
  const { student } = useStudent();
  const navigate = useNavigate();
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(null);
  
  // Check if user is logged in
  useEffect(() => {
    if (!student) {
      navigate('/');
    }
  }, [student, navigate]);

  // Fetch meal plans data
  const { data: mealPlans = [], isLoading, error } = useQuery({
    queryKey: ['mealPlans', student?.id],
    queryFn: () => student ? AirtableService.getStudentMealPlans(student.id) : Promise.resolve([]),
    enabled: !!student,
  });

  // Sort meal plans by date (newest first)
  const sortedMealPlans = [...mealPlans].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Get the latest meal plan
  const latestMealPlan = sortedMealPlans.length > 0 ? sortedMealPlans[0] : null;
  
  // Get the rest of the meal plans for history
  const mealPlanHistory = latestMealPlan ? sortedMealPlans.filter(mp => mp.id !== latestMealPlan.id) : [];

  if (!student) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-6 pb-8 bg-red-50 rounded-lg"
    >
      <DashboardHeader
        title={student.isAdmin ? "Plans Alimentaires - Vue Admin" : "Plan Alimentaire"}
        subtitle={student.isAdmin ? "Gestion de la nutrition pour tous les élèves" : "Suivez votre plan alimentaire personnalisé"}
        icon={<Utensils size={20} className="text-red-500" />}
      />

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-6 mt-6">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card className="p-6 mt-6 text-center border border-red-200 bg-red-50 shadow-sm">
          <p className="text-red-500">Erreur lors du chargement du plan alimentaire.</p>
        </Card>
      )}

      {/* No meal plans state */}
      {!isLoading && !error && mealPlans.length === 0 && (
        <Card className="p-6 mt-6 text-center border border-red-200 bg-red-50 shadow-sm">
          <p className="text-muted-foreground">
            Votre plan alimentaire personnalisé sera bientôt disponible.
          </p>
        </Card>
      )}

      {/* Latest meal plan */}
      {!isLoading && !error && latestMealPlan && !selectedMealPlan && (
        <div className="mb-10 mt-6">
          <h2 className="text-xl font-semibold mb-4">Dernier plan alimentaire</h2>
          <MealPlanView mealPlan={latestMealPlan} />
        </div>
      )}

      {/* Selected meal plan from history */}
      {selectedMealPlan && (
        <div className="mb-10 mt-6">
          <button 
            className="text-red-600 hover:text-red-700 flex items-center mb-4"
            onClick={() => setSelectedMealPlan(null)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 rotate-180">
              <path d="m9 18 6-6-6-6"/>
            </svg>
            <span>Retour</span>
          </button>
          <MealPlanView mealPlan={selectedMealPlan} />
        </div>
      )}

      {/* Meal plan history */}
      {!isLoading && !error && mealPlanHistory.length > 0 && !selectedMealPlan && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Historique des plans alimentaires</h2>
          <MealPlanHistoryTable 
            mealPlans={mealPlanHistory} 
            onSelectMealPlan={setSelectedMealPlan} 
          />
        </div>
      )}
    </motion.div>
  );
};

// Main component that wraps the content with the QueryClientProvider
const Nutrition = () => {
  return (
    <Layout>
      <QueryClientProvider client={queryClient}>
        <NutritionContent />
      </QueryClientProvider>
    </Layout>
  );
};

export default Nutrition;
