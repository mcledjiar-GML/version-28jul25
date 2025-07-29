
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStudent } from '../context/StudentContext';
import Layout from '../components/Layout';
import DashboardHeader from '../components/DashboardHeader';
import { Dumbbell, Eye, Mail, Shield, Target, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AirtableService from '@/services/AirtableService';
import { Workout } from '@/services/types/airtable.types';
import WorkoutCard from '@/components/workouts/WorkoutCard';
import WorkoutHistoryTable from '@/components/workouts/WorkoutHistoryTable';
import { Skeleton } from '@/components/ui/skeleton';

interface StudentData {
  id: string;
  name: string;
  email: string;
  code: string;
  status?: string;
  objectives?: string;
  hasWorkouts?: boolean;
  totalWorkouts?: number;
  latestWeek?: string;
  latestBlock?: string;
}

const Workouts = () => {
  const { student } = useStudent();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [studentsData, setStudentsData] = useState<StudentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if user is logged in
  useEffect(() => {
    if (!student) {
      navigate('/');
    } else {
      fetchData();
    }
  }, [student, navigate]);

  const fetchData = async () => {
    if (!student) return;
    
    setIsLoading(true);
    try {
      if (student.isAdmin) {
        // Vue admin : charger tous les élèves avec leurs workouts
        console.log('💪 Chargement des workouts pour tous les élèves...');
        
        const airtableApi = (AirtableService as any).apiService;
        const studentsAirtableData = await airtableApi.fetchAllRecords('Élèves');
        
        const studentsWithWorkouts = await Promise.all(
          studentsAirtableData.map(async (record: any) => {
            const fields = record.fields || record;
            const studentData: StudentData = {
              id: record.id,
              name: fields.Nom || fields.Name || 'Nom non défini',
              email: fields['E-mail'] || fields.Email || 'Email non défini',
              code: fields.code || record.id,
              status: fields.Statut || fields.Status || 'Actif',
              objectives: fields.Objectifs || fields.objectives || ''
            };

            // Vérifier si l'élève a des workouts
            try {
              const studentWorkouts = await AirtableService.getStudentWorkouts(record.id);
              studentData.hasWorkouts = studentWorkouts.length > 0;
              studentData.totalWorkouts = studentWorkouts.length;
              
              if (studentWorkouts.length > 0) {
                const latest = studentWorkouts[0]; // Le plus récent
                studentData.latestWeek = latest.week;
                studentData.latestBlock = latest.block;
              }
            } catch (error) {
              console.error(`Erreur workouts pour élève ${record.id}:`, error);
              studentData.hasWorkouts = false;
              studentData.totalWorkouts = 0;
            }

            return studentData;
          })
        );

        setStudentsData(studentsWithWorkouts);
      } else {
        // Vue élève : charger ses propres workouts
        const fetchedWorkouts = await AirtableService.getStudentWorkouts(student.id);
        setWorkouts(fetchedWorkouts);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  // Group history workouts by block (4 weeks per block)
  const workoutsByBlock = workoutHistory.reduce<Record<string, Workout[]>>((acc, workout) => {
    if (!acc[workout.block]) {
      acc[workout.block] = [];
    }
    acc[workout.block].push(workout);
    return acc;
  }, {});

  const handleViewStudentWorkouts = (studentData: StudentData) => {
    // Naviguer vers la page de workouts individuels de l'élève
    navigate('/admin/student-workouts', { state: { studentCode: studentData.code } });
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
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="p-6 pb-8 bg-orange-50 rounded-lg"
      >
        <DashboardHeader
          title={student.isAdmin ? "Gestion Workouts - Vue Admin" : "Entraînements"}
          subtitle={student.isAdmin ? "Création et gestion des programmes d'entraînement" : "Accédez à vos programmes d'entraînement"}
          icon={<Dumbbell size={20} className="text-orange-500" />}
        />

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        )}

        {!isLoading && student.isAdmin ? (
          // Vue Admin : Liste des élèves avec workouts
          <Card className="border border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-orange-500" />
                Liste des Élèves - Programmes d'Entraînement
                <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              </CardTitle>
              <CardDescription>
                Cliquez sur un élève pour voir ses programmes d'entraînement et historique complet
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
                      <TableHead>Objectifs</TableHead>
                      <TableHead>Workouts</TableHead>
                      <TableHead>Semaine</TableHead>
                      <TableHead>Bloc</TableHead>
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
                        <TableCell className="max-w-xs truncate" title={studentData.objectives}>
                          {studentData.objectives || '-'}
                        </TableCell>
                        <TableCell>
                          {studentData.hasWorkouts ? (
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-700 border-green-200">
                                ✅ {studentData.totalWorkouts}
                              </Badge>
                            </div>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                              ⚪ Aucun
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {studentData.latestWeek ? (
                            <Badge variant="outline" className="bg-blue-50">
                              S{studentData.latestWeek}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {studentData.latestBlock ? (
                            <Badge variant="outline" className="bg-purple-50">
                              B{studentData.latestBlock}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewStudentWorkouts(studentData)}
                            disabled={!studentData.hasWorkouts}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            {studentData.hasWorkouts ? 'Voir Workouts' : 'Aucun workout'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* No workouts state */}
            {!isLoading && workouts.length === 0 && (
              <Card className="p-6 mt-6 text-center border border-orange-200 bg-orange-50 shadow-sm">
                <p className="text-muted-foreground">
                  Aucun entraînement disponible pour le moment.
                </p>
              </Card>
            )}

            {/* Latest workouts by day */}
            {!isLoading && latestWorkouts.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xl font-semibold mb-4">Dernier entraînement</h2>
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

            {/* Workout history */}
            {!isLoading && workoutHistory.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Historique des entraînements</h2>
                <WorkoutHistoryTable workouts={workoutHistory} />
              </div>
            )}
          </>
        )}
      </motion.div>
    </Layout>
  );
};

export default Workouts;
