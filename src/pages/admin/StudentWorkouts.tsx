import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStudent } from '../../context/StudentContext';
import Layout from '../../components/Layout';
import { Dumbbell, ArrowLeft, Shield, User, Target, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import AirtableService from '@/services/AirtableService';
import { Workout } from '@/services/types/airtable.types';
import WorkoutCard from '@/components/workouts/WorkoutCard';
import WorkoutHistoryTable from '@/components/workouts/WorkoutHistoryTable';

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  objectives?: string;
  status?: string;
}

const StudentWorkouts = () => {
  const { student } = useStudent();
  const navigate = useNavigate();
  const location = useLocation();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
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
      navigate('/workouts');
      return;
    }
  }, [student, navigate, studentCode]);
  
  useEffect(() => {
    const fetchStudentWorkouts = async () => {
      if (!studentCode) return;

      setIsLoading(true);
      try {
        console.log('💪 Chargement des workouts de l\'élève:', studentCode);
        
        // Charger le profil de l'élève
        const airtableApi = (AirtableService as any).apiService;
        const studentsData = await airtableApi.fetchAllRecords('Élèves');
        
        const targetStudent = studentsData.find((record: any) => {
          const fields = record.fields || record;
          return fields.code === studentCode || record.id === studentCode;
        });

        if (!targetStudent) {
          console.error('Élève introuvable');
          navigate('/workouts');
          return;
        }

        const fields = targetStudent.fields || targetStudent;
        const profile: StudentProfile = {
          id: targetStudent.id,
          name: fields.Nom || fields.Name || 'Nom non défini',
          email: fields['E-mail'] || fields.Email || 'Email non défini',
          objectives: fields.Objectifs || fields.objectives || '',
          status: fields.Statut || fields.Status || 'Actif'
        };

        setStudentProfile(profile);

        // Charger les workouts de l'élève
        const fetchedWorkouts = await AirtableService.getStudentWorkouts(profile.id);
        setWorkouts(fetchedWorkouts);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des workouts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStudentWorkouts();
  }, [studentCode, navigate]);

  // Get the most recent workout week
  const latestWorkouts = workouts.length > 0 
    ? workouts.filter(w => w.week === workouts[0].week)
    : [];
    
  // Group latest workouts by day
  const workoutsByDay = latestWorkouts.reduce<Record<string, Workout[]>>((acc, workout) => {
    if (!acc[workout.day]) {
      acc[workout.day] = [];
    }
    acc[workout.day].push(workout);
    return acc;
  }, {});
  
  // Get sorted days
  const sortedDays = Object.keys(workoutsByDay).sort((a, b) => Number(a) - Number(b));
  
  // Get the rest of the workouts for history (from older weeks)
  const workoutHistory = workouts.filter(w => w.week !== (workouts[0]?.week || ''));

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
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="p-6 pb-8 bg-orange-50 rounded-lg"
      >
        {/* Header avec bouton retour */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/workouts')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux Workouts
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Dumbbell className="h-8 w-8 text-orange-500" />
              <h1 className="text-3xl font-bold">
                Workouts de {studentProfile?.name || 'Élève'}
              </h1>
              <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                <Shield className="h-3 w-3 mr-1" />
                Vue Admin
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Programmes d'entraînement et historique complet
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        ) : (
          <>
            {/* Informations de l'élève */}
            <Card className="mb-6 border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-orange-500" />
                  Profil de l'Élève
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nom</p>
                    <p className="font-medium">{studentProfile?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{studentProfile?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Statut</p>
                    <Badge className={getStatusBadge(studentProfile?.status)}>
                      {studentProfile?.status || 'Actif'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Objectifs</p>
                    <p className="font-medium">{studentProfile?.objectives || 'Non défini'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistiques des workouts */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Workouts</p>
                      <p className="text-2xl font-bold text-orange-600">{workouts.length}</p>
                    </div>
                    <Dumbbell className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Semaines</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {workouts.length > 0 ? new Set(workouts.map(w => w.week)).size : 0}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Blocs</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {workouts.length > 0 ? new Set(workouts.map(w => w.block)).size : 0}
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Dernier Bloc</p>
                      <p className="text-2xl font-bold text-green-600">
                        {workouts.length > 0 ? workouts[0].block : '-'}
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* No workouts state */}
            {workouts.length === 0 ? (
              <Card className="p-6 mt-6 text-center border border-orange-200 bg-orange-50 shadow-sm">
                <CardHeader>
                  <CardTitle>Aucun entraînement disponible</CardTitle>
                  <CardDescription>
                    Cet élève n'a pas encore de programmes d'entraînement assignés.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <>
                {/* Programme actuel */}
                {latestWorkouts.length > 0 && (
                  <div className="mb-10">
                    <Card className="border-orange-200 bg-orange-100 mb-4">
                      <CardContent className="p-4">
                        <h2 className="text-xl font-semibold text-orange-800">
                          💪 Programme Actuel - Semaine {latestWorkouts[0].week} - Bloc {latestWorkouts[0].block}
                        </h2>
                      </CardContent>
                    </Card>
                    
                    {sortedDays.map((day) => (
                      <div key={day} className="mb-8 last:mb-0">
                        <h3 className="text-lg font-semibold text-orange-800 mb-4 pb-2 border-b border-orange-200">
                          Jour {day}
                        </h3>
                        <div className="space-y-6">
                          {workoutsByDay[day].map(workout => (
                            <WorkoutCard key={workout.id} workout={workout} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Historique complet */}
                {workoutHistory.length > 0 && (
                  <div>
                    <Card className="border-orange-200">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          📈 Historique Complet des Entraînements
                        </CardTitle>
                        <CardDescription>
                          Tous les programmes d'entraînement de l'élève ({workouts.length} workouts au total)
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <WorkoutHistoryTable workouts={workoutHistory} />
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </motion.div>
    </Layout>
  );
};

export default StudentWorkouts;