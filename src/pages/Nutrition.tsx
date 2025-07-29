
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStudent } from '../context/StudentContext';
import Layout from '../components/Layout';
import DashboardHeader from '../components/DashboardHeader';
import { Utensils, Eye, Mail, Shield, ChefHat, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MealPlan } from '@/services/types/airtable.types';
import AirtableService from '@/services/AirtableService';
import MealPlanView from '@/components/nutrition/MealPlanView';
import MealPlanHistoryTable from '@/components/nutrition/MealPlanHistoryTable';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

// Create a client
const queryClient = new QueryClient();

interface StudentData {
  id: string;
  name: string;
  email: string;
  code: string;
  status?: string;
  objectives?: string;
  diet?: string;
  hasMealPlans?: boolean;
  totalMealPlans?: number;
  latestMealPlanDate?: string;
}

// Wrapper component with the query client
const NutritionContent = () => {
  const { student } = useStudent();
  const navigate = useNavigate();
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(null);
  const [studentsData, setStudentsData] = useState<StudentData[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0, message: '' });
  
  // Check if user is logged in
  useEffect(() => {
    if (!student) {
      navigate('/');
    } else if (student.isAdmin) {
      // Vérifier si on a des données en cache (moins de 5 minutes)
      const cacheKey = 'nutrition_students_cache';
      const cacheTimeKey = 'nutrition_students_cache_time';
      const cachedData = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(cacheTimeKey);
      
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      const isCacheValid = cacheTime && parseInt(cacheTime) > fiveMinutesAgo;
      
      if (cachedData && isCacheValid && studentsData.length === 0) {
        // Utiliser les données en cache
        console.log('📦 Utilisation du cache pour les plans alimentaires');
        setStudentsData(JSON.parse(cachedData));
      } else if (studentsData.length === 0) {
        // Charger les données fraîches
        fetchStudentsData();
      }
    }
  }, [student, navigate]);

  // Fonction utilitaire pour créer une promesse avec timeout
  const withTimeout = (promise: Promise<any>, timeoutMs: number) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
      )
    ]);
  };

  // Fonction pour traiter les élèves par petits groupes
  const processStudentsInBatches = async (students: any[], batchSize = 3) => {
    const results: StudentData[] = [];
    const totalBatches = Math.ceil(students.length / batchSize);
    
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      const currentBatch = Math.floor(i / batchSize) + 1;
      
      // Mettre à jour le progrès
      setLoadingProgress({
        current: i,
        total: students.length,
        message: `Chargement groupe ${currentBatch}/${totalBatches} (${batch.length} élèves)`
      });
      
      console.log(`📊 Traitement du groupe ${currentBatch}/${totalBatches} (${batch.length} élèves)`);
      
      const batchResults = await Promise.allSettled(
        batch.map(async (studentData: StudentData) => {
          try {
            // Timeout de 3 secondes par élève
            const studentMealPlans = await withTimeout(
              AirtableService.getStudentMealPlans(studentData.id),
              3000
            );
            
            return {
              ...studentData,
              hasMealPlans: studentMealPlans.length > 0,
              totalMealPlans: studentMealPlans.length,
              latestMealPlanDate: studentMealPlans.length > 0 ? 
                studentMealPlans.sort((a, b) => 
                  new Date(b.date).getTime() - new Date(a.date).getTime()
                )[0].date : undefined
            };
          } catch (error) {
            console.warn(`Timeout ou erreur pour élève ${studentData.name}:`, error);
            return {
              ...studentData,
              hasMealPlans: false,
              totalMealPlans: 0
            };
          }
        })
      );

      // Traiter les résultats du batch
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // En cas d'échec, garder les données de base
          results.push(batch[index]);
        }
      });

      // Mettre à jour l'interface après chaque batch
      setStudentsData([...results]);

      // Petite pause entre les batches pour éviter de surcharger l'API
      if (i + batchSize < students.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Terminer le progrès
    setLoadingProgress({
      current: students.length,
      total: students.length,
      message: 'Chargement terminé'
    });

    return results;
  };

  // Fetch students data for admin view
  const fetchStudentsData = async () => {
    if (adminLoading) return; // Éviter les appels multiples
    
    setAdminLoading(true);
    setAdminError(null);
    setLoadingProgress({ current: 0, total: 0, message: 'Initialisation...' });
    
    try {
      console.log('🍽️ Chargement de la liste des élèves...');
      
      const airtableApi = (AirtableService as any).apiService;
      
      // Timeout de 10 secondes pour la liste des élèves
      const studentsAirtableData = await withTimeout(
        airtableApi.fetchAllRecords('Élèves'),
        10000
      );
      
      // Charger les élèves d'abord sans les plans alimentaires pour un affichage plus rapide
      const studentsBasicData = studentsAirtableData.map((record: any) => {
        const fields = record.fields || record;
        return {
          id: record.id,
          name: fields.Nom || fields.Name || 'Nom non défini',
          email: fields['E-mail'] || fields.Email || 'Email non défini',
          code: fields.code || record.id,
          status: fields.Statut || fields.Status || 'Actif',
          objectives: fields.Objectifs || fields.objectives || '',
          diet: fields['Régime Alimentaire'] || fields.Diet || 'Standard',
          hasMealPlans: false,
          totalMealPlans: 0
        };
      });

      // Afficher les élèves immédiatement
      setStudentsData(studentsBasicData);
      setAdminLoading(false);

      console.log(`📊 ${studentsBasicData.length} élèves trouvés. Chargement des statistiques par groupes...`);
      
      // Traiter les plans alimentaires par petits groupes
      const studentsWithMealPlans = await processStudentsInBatches(studentsBasicData);
      
      // Sauvegarder en cache
      const cacheKey = 'nutrition_students_cache';
      const cacheTimeKey = 'nutrition_students_cache_time';
      localStorage.setItem(cacheKey, JSON.stringify(studentsWithMealPlans));
      localStorage.setItem(cacheTimeKey, Date.now().toString());
      
      console.log('✅ Toutes les données des plans alimentaires chargées et mises en cache');
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des élèves:', error);
      if (error.message === 'Timeout') {
        setAdminError('Le chargement prend trop de temps. Vérifiez votre connexion internet.');
      } else {
        setAdminError('Impossible de charger la liste des élèves. Vérifiez votre connexion.');
      }
      setAdminLoading(false);
    }
  };

  // Fetch meal plans data for student view
  const { data: mealPlans = [], isLoading, error } = useQuery({
    queryKey: ['mealPlans', student?.id],
    queryFn: () => student && !student.isAdmin ? AirtableService.getStudentMealPlans(student.id) : Promise.resolve([]),
    enabled: !!student && !student.isAdmin,
  });

  // Sort meal plans by date (newest first)
  const sortedMealPlans = [...mealPlans].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Get the latest meal plan
  const latestMealPlan = sortedMealPlans.length > 0 ? sortedMealPlans[0] : null;
  
  // Get the rest of the meal plans for history
  const mealPlanHistory = latestMealPlan ? sortedMealPlans.filter(mp => mp.id !== latestMealPlan.id) : [];

  const handleViewStudentNutrition = (studentData: StudentData) => {
    // Naviguer vers la page de nutrition individuelle de l'élève
    navigate('/admin/student-nutrition', { state: { studentCode: studentData.code } });
  };

  const getStatusBadge = (status: string = 'Actif') => {
    const statusConfig = {
      'Actif': { variant: 'default', color: 'bg-green-100 text-green-700 border-green-200' },
      'Pause': { variant: 'secondary', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      'Inactif': { variant: 'destructive', color: 'bg-red-100 text-red-700 border-red-200' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Actif'];
    
    return (
      <Badge className={config.color}>
        {status}
      </Badge>
    );
  };

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
      {(isLoading || adminLoading) && (
        <div className="space-y-6 mt-6">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      )}

      {!isLoading && student.isAdmin ? (
        // Vue Admin : Liste des élèves avec plans alimentaires
        <div className="mt-6">
          {/* Message d'erreur si présent */}
          {adminError && (
            <Card className="mb-4 border-red-300 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-red-600">⚠️</span>
                    <p className="text-red-700 font-medium">{adminError}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setStudentsData([]);
                      setLoadingProgress({ current: 0, total: 0, message: '' });
                      fetchStudentsData();
                    }}
                  >
                    Réessayer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card className="border border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-red-500" />
                  Liste des Élèves - Plans Alimentaires
                  <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                    <Shield className="h-3 w-3 mr-1" />
                    Admin
                  </Badge>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setStudentsData([]);
                    setLoadingProgress({ current: 0, total: 0, message: '' });
                    fetchStudentsData();
                  }}
                  disabled={adminLoading}
                >
                  {adminLoading ? 'Chargement...' : 'Actualiser'}
                </Button>
              </CardTitle>
              <CardDescription>
                Cliquez sur un élève pour voir ses plans alimentaires et historique complet
              </CardDescription>
            </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Régime</TableHead>
                    <TableHead>Objectifs</TableHead>
                    <TableHead>Plans</TableHead>
                    <TableHead>Dernier Plan</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsData.map((studentData) => (
                    <TableRow key={studentData.id}>
                      <TableCell className="font-medium">{studentData.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{studentData.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(studentData.status)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50">
                          {studentData.diet}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={studentData.objectives}>
                        {studentData.objectives || '-'}
                      </TableCell>
                      <TableCell>
                        {studentData.hasMealPlans ? (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              ✅ {studentData.totalMealPlans}
                            </Badge>
                          </div>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                            ⚪ Aucun
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {studentData.latestMealPlanDate ? (
                          <span className="text-sm">
                            {new Date(studentData.latestMealPlanDate).toLocaleDateString('fr-FR')}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewStudentNutrition(studentData)}
                          disabled={!studentData.hasMealPlans}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          {studentData.hasMealPlans ? 'Voir Plans' : 'Aucun plan'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Indicateur de chargement des statistiques */}
              {adminLoading && studentsData.length > 0 && (
                <div className="py-4 bg-red-50 rounded-lg mt-4">
                  <div className="flex items-center justify-center mb-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500 mr-2"></div>
                    <span className="text-sm text-red-600">
                      {loadingProgress.message || 'Chargement des statistiques des plans alimentaires...'}
                    </span>
                  </div>
                  {/* Barre de progression */}
                  {loadingProgress.total > 0 && (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-32 bg-red-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, (loadingProgress.current / loadingProgress.total) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-xs text-red-600">
                        {loadingProgress.current}/{loadingProgress.total}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </div>
      ) : (
        <>
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
        </>
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
