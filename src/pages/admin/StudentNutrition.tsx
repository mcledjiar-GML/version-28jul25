import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStudent } from '../../context/StudentContext';
import Layout from '../../components/Layout';
import { Utensils, ArrowLeft, Shield, User, Target, Calendar, ChefHat } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MealPlan } from '@/services/types/airtable.types';
import AirtableService from '@/services/AirtableService';
import MealPlanView from '@/components/nutrition/MealPlanView';
import MealPlanHistoryTable from '@/components/nutrition/MealPlanHistoryTable';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient();

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  objectives?: string;
  status?: string;
  diet?: string;
}

const StudentNutritionContent = () => {
  const { student } = useStudent();
  const navigate = useNavigate();
  const location = useLocation();
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(null);
  
  // Récupérer le code de l'élève depuis la navigation
  const { studentCode } = location.state || {};

  useEffect(() => {
    if (!student) {
      navigate('/');
      return;
    }
    
    if (!student.isAdmin) {
      navigate('/dashboard');
      return;
    }

    if (!studentCode) {
      navigate('/nutrition');
      return;
    }
  }, [student, navigate, studentCode]);
  
  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (!studentCode) return;

      try {
        console.log('🍽️ Chargement du profil de l\'élève:', studentCode);
        
        // Charger le profil de l'élève
        const airtableApi = (AirtableService as any).apiService;
        const studentsData = await airtableApi.fetchAllRecords('Élèves');
        
        const targetStudent = studentsData.find((record: any) => {
          const fields = record.fields || record;
          return fields.code === studentCode || record.id === studentCode;
        });

        if (!targetStudent) {
          console.error('Élève introuvable');
          navigate('/nutrition');
          return;
        }

        const fields = targetStudent.fields || targetStudent;
        const profile: StudentProfile = {
          id: targetStudent.id,
          name: fields.Nom || fields.Name || 'Nom non défini',
          email: fields['E-mail'] || fields.Email || 'Email non défini',
          objectives: fields.Objectifs || fields.objectives || '',
          status: fields.Statut || fields.Status || 'Actif',
          diet: fields['Régime Alimentaire'] || fields.Diet || null
        };

        setStudentProfile(profile);
      } catch (error) {
        console.error('❌ Erreur lors du chargement du profil:', error);
      }
    };
    
    fetchStudentProfile();
  }, [studentCode, navigate]);

  // Fetch meal plans data
  const { data: mealPlans = [], isLoading, error } = useQuery({
    queryKey: ['mealPlans', studentProfile?.id],
    queryFn: () => studentProfile ? AirtableService.getStudentMealPlans(studentProfile.id) : Promise.resolve([]),
    enabled: !!studentProfile,
  });

  // Sort meal plans by date (newest first)
  const sortedMealPlans = [...mealPlans].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Get the latest meal plan
  const latestMealPlan = sortedMealPlans.length > 0 ? sortedMealPlans[0] : null;
  
  // Get the rest of the meal plans for history
  const mealPlanHistory = latestMealPlan ? sortedMealPlans.filter(mp => mp.id !== latestMealPlan.id) : [];

  const getStatusBadge = (status: string = 'Actif') => {
    const config = {
      'Actif': 'bg-green-100 text-green-700 border-green-200',
      'Pause': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Inactif': 'bg-red-100 text-red-700 border-red-200',
    };
    return config[status as keyof typeof config] || config['Actif'];
  };

  if (!student?.isAdmin) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-6 pb-8 bg-red-50 rounded-lg"
    >
      {/* Header avec bouton retour */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/nutrition', { replace: true })}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux Plans Alimentaires
        </Button>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Utensils className="h-8 w-8 text-red-500" />
            <h1 className="text-3xl font-bold">
              Plan Alimentaire de {studentProfile?.name || 'Élève'}
            </h1>
            <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
              <Shield className="h-3 w-3 mr-1" />
              Vue Admin
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Plan nutritionnel personnalisé et historique complet
          </p>
        </div>
      </div>

      {!studentProfile ? (
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      ) : (
        <>
          {/* Informations de l'élève */}
          <Card className="mb-6 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-red-500" />
                Profil Nutritionnel de l'Élève
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nom</p>
                  <p className="font-medium">{studentProfile.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{studentProfile.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <Badge className={getStatusBadge(studentProfile.status)}>
                    {studentProfile.status || 'Actif'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Régime</p>
                  <p className="font-medium">{studentProfile.diet || 'Standard'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Objectifs</p>
                  <p className="font-medium">{studentProfile.objectives || 'Non défini'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques des plans alimentaires */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-red-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Plans</p>
                    <p className="text-2xl font-bold text-red-600">{mealPlans.length}</p>
                  </div>
                  <ChefHat className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Plan Actuel</p>
                    <p className="text-lg font-bold text-green-600">
                      {latestMealPlan ? '✅ Actif' : '⚪ Aucun'}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Historique</p>
                    <p className="text-2xl font-bold text-blue-600">{mealPlanHistory.length}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Dernière MAJ</p>
                    <p className="text-sm font-bold text-purple-600">
                      {latestMealPlan ? new Date(latestMealPlan.date).toLocaleDateString('fr-FR') : '-'}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="space-y-6">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          )}

          {/* Error state */}
          {error && (
            <Card className="p-6 text-center border border-red-200 bg-red-50 shadow-sm">
              <CardHeader>
                <CardTitle>Erreur de chargement</CardTitle>
                <CardDescription>
                  Impossible de charger les plans alimentaires de l'élève.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* No meal plans state */}
          {!isLoading && !error && mealPlans.length === 0 && (
            <Card className="p-6 text-center border border-red-200 bg-red-50 shadow-sm">
              <CardHeader>
                <CardTitle>Aucun plan alimentaire</CardTitle>
                <CardDescription>
                  Cet élève n'a pas encore de plan alimentaire assigné.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Latest meal plan */}
          {!isLoading && !error && latestMealPlan && !selectedMealPlan && (
            <div className="mb-10">
              <Card className="border-red-200 bg-red-100 mb-4">
                <CardContent className="p-4">
                  <h2 className="text-xl font-semibold text-red-800">
                    🍽️ Plan Alimentaire Actuel - {new Date(latestMealPlan.date).toLocaleDateString('fr-FR')}
                  </h2>
                </CardContent>
              </Card>
              <MealPlanView mealPlan={latestMealPlan} />
            </div>
          )}

          {/* Selected meal plan from history */}
          {selectedMealPlan && (
            <div className="mb-10">
              <Button 
                variant="outline"
                className="mb-4"
                onClick={() => setSelectedMealPlan(null)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la vue d'ensemble
              </Button>
              <MealPlanView mealPlan={selectedMealPlan} />
            </div>
          )}

          {/* Meal plan history */}
          {!isLoading && !error && mealPlanHistory.length > 0 && !selectedMealPlan && (
            <div>
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📈 Historique Complet des Plans Alimentaires
                  </CardTitle>
                  <CardDescription>
                    Tous les plans nutritionnels de l'élève ({mealPlans.length} plans au total)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MealPlanHistoryTable 
                    mealPlans={mealPlanHistory} 
                    onSelectMealPlan={setSelectedMealPlan} 
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

// Main component that wraps the content with the QueryClientProvider
const StudentNutrition = () => {
  return (
    <Layout>
      <QueryClientProvider client={queryClient}>
        <StudentNutritionContent />
      </QueryClientProvider>
    </Layout>
  );
};

export default StudentNutrition;