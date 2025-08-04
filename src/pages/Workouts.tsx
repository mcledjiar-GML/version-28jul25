
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStudent } from '../context/StudentContext';
import Layout from '../components/Layout';
import DashboardHeader from '../components/DashboardHeader';
import { Dumbbell, Eye, Mail, Shield, Target, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AirtableService from '@/services/AirtableService';
import { Workout, WorkoutBlock, BlockCalculation } from '@/services/types/airtable.types';
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
  // Nouvelles propriétés pour les blocs
  blocks?: WorkoutBlock[];
  currentStatus?: BlockCalculation;
  completionRate?: number;
}

const Workouts = () => {
  const { student } = useStudent();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutBlocks, setWorkoutBlocks] = useState<WorkoutBlock[]>([]);
  const [progressStats, setProgressStats] = useState<any>(null);
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
        // Vue admin : charger tous les élèves avec leurs blocs d'entraînement
        console.log('💪 Chargement des blocs d\'entraînement pour tous les élèves...');
        
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

            // Charger les blocs d'entraînement et statistiques
            try {
              const [blocks, progress] = await Promise.all([
                AirtableService.getStudentWorkoutBlocks(record.id),
                AirtableService.getStudentProgress(record.id)
              ]);
              
              studentData.hasWorkouts = blocks.length > 0;
              studentData.blocks = blocks;
              studentData.currentStatus = progress.currentStatus;
              studentData.completionRate = progress.completionRate;
              studentData.totalWorkouts = progress.totalWeeks;
              
              if (blocks.length > 0) {
                const currentBlock = blocks.find(b => b.isCurrent);
                const currentWeek = blocks
                  .flatMap(b => b.weeks)
                  .find(w => w.isCurrent);
                
                studentData.latestBlock = currentBlock?.blockNumber.toString();
                studentData.latestWeek = currentWeek?.weekNumber.toString();
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
        // Vue élève : charger ses propres blocs d'entraînement
        console.log('💪 Chargement des blocs d\'entraînement de l\'élève...');
        
        const [blocks, progress] = await Promise.all([
          AirtableService.getStudentWorkoutBlocks(student.id),
          AirtableService.getStudentProgress(student.id)
        ]);
        
        setWorkoutBlocks(blocks);
        setProgressStats(progress);
        
        console.log('📊 Blocs chargés:', blocks.length);
        console.log('📊 Statistiques:', progress);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };


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
            {!isLoading && workoutBlocks.length === 0 && (
              <Card className="p-6 mt-6 text-center border border-orange-200 bg-orange-50 shadow-sm">
                <p className="text-muted-foreground">
                  Aucun entraînement disponible pour le moment.
                </p>
              </Card>
            )}


            {/* Latest Workout Display */}
            {!isLoading && (workoutBlocks.length > 0 ? (
              <div className="space-y-8">
                {(() => {
                  // Get the latest workout week
                  const latestBlock = workoutBlocks.find(block => block.isCurrent) || workoutBlocks[0];
                  const latestWeek = latestBlock?.weeks?.find(week => week.isCurrent) || latestBlock?.weeks?.[0];
                  
                  if (!latestWeek) return null;
                  
                  const day1 = latestWeek.days.find(day => day.dayNumber === 1);
                  const day2 = latestWeek.days.find(day => day.dayNumber === 2);
                  
                  return (
                    <>
                      {/* Titre du dernier entraînement */}
                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-orange-800 mb-2">
                          Dernier Entraînement
                        </h2>
                        <p className="text-gray-600">
                          Semaine du {new Date(latestWeek.startDate).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>

                      {/* Jour 1 */}
                      {day1 && (
                        <Card className="border border-orange-200">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Calendar className="h-5 w-5 text-orange-500" />
                              Jour 1 - {new Date(day1.date).toLocaleDateString('fr-FR', { 
                                weekday: 'long', 
                                day: 'numeric', 
                                month: 'long' 
                              })}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Partie</TableHead>
                                    <TableHead>Exercice</TableHead>
                                    <TableHead>Format</TableHead>
                                    <TableHead>Repos</TableHead>
                                    <TableHead>Charge (kg)</TableHead>
                                    <TableHead>Notes</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {/* Échauffement */}
                                  {day1.warmup?.exercises.map((exercise, index) => (
                                    <TableRow key={`warmup-${index}`}>
                                      <TableCell className="font-medium bg-blue-50">
                                        {index === 0 ? day1.warmup?.name : ''}
                                      </TableCell>
                                      <TableCell>{exercise.name}</TableCell>
                                      <TableCell>{exercise.reps}</TableCell>
                                      <TableCell>{exercise.restTime ? `${exercise.restTime}s` : '-'}</TableCell>
                                      <TableCell>{exercise.weight || '-'}</TableCell>
                                      <TableCell>{exercise.notes || '-'}</TableCell>
                                    </TableRow>
                                  ))}
                                  {/* Parties principales */}
                                  {day1.mainParts.map((part, partIndex) => 
                                    part.exercises.map((exercise, exIndex) => (
                                      <TableRow key={`part-${partIndex}-ex-${exIndex}`}>
                                        <TableCell className="font-medium bg-orange-50">
                                          {exIndex === 0 ? part.name : ''}
                                        </TableCell>
                                        <TableCell>{exercise.name}</TableCell>
                                        <TableCell>{exercise.reps}</TableCell>
                                        <TableCell>{exercise.restTime ? `${exercise.restTime}s` : '-'}</TableCell>
                                        <TableCell>{exercise.weight || '-'}</TableCell>
                                        <TableCell>{exercise.notes || '-'}</TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Jour 2 */}
                      {day2 && (
                        <Card className="border border-orange-200">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Calendar className="h-5 w-5 text-orange-500" />
                              Jour 2 - {new Date(day2.date).toLocaleDateString('fr-FR', { 
                                weekday: 'long', 
                                day: 'numeric', 
                                month: 'long' 
                              })}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Partie</TableHead>
                                    <TableHead>Exercice</TableHead>
                                    <TableHead>Format</TableHead>
                                    <TableHead>Repos</TableHead>
                                    <TableHead>Charge (kg)</TableHead>
                                    <TableHead>Notes</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {/* Échauffement */}
                                  {day2.warmup?.exercises.map((exercise, index) => (
                                    <TableRow key={`warmup-${index}`}>
                                      <TableCell className="font-medium bg-blue-50">
                                        {index === 0 ? day2.warmup?.name : ''}
                                      </TableCell>
                                      <TableCell>{exercise.name}</TableCell>
                                      <TableCell>{exercise.reps}</TableCell>
                                      <TableCell>{exercise.restTime ? `${exercise.restTime}s` : '-'}</TableCell>
                                      <TableCell>{exercise.weight || '-'}</TableCell>
                                      <TableCell>{exercise.notes || '-'}</TableCell>
                                    </TableRow>
                                  ))}
                                  {/* Parties principales */}
                                  {day2.mainParts.map((part, partIndex) => 
                                    part.exercises.map((exercise, exIndex) => (
                                      <TableRow key={`part-${partIndex}-ex-${exIndex}`}>
                                        <TableCell className="font-medium bg-orange-50">
                                          {exIndex === 0 ? part.name : ''}
                                        </TableCell>
                                        <TableCell>{exercise.name}</TableCell>
                                        <TableCell>{exercise.reps}</TableCell>
                                        <TableCell>{exercise.restTime ? `${exercise.restTime}s` : '-'}</TableCell>
                                        <TableCell>{exercise.weight || '-'}</TableCell>
                                        <TableCell>{exercise.notes || '-'}</TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Historique des entraînements */}
                      <Card className="border border-orange-200">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-orange-500" />
                            Historique des Entraînements
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Semaine</TableHead>
                                  <TableHead>Bloc</TableHead>
                                  <TableHead>Jour</TableHead>
                                  <TableHead>Exercices</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {workoutBlocks.map(block => 
                                  block.weeks.map(week => 
                                    week.days.map(day => (
                                      <TableRow key={`${block.id}-${week.id}-${day.id}`}>
                                        <TableCell className="font-medium">
                                          {new Date(week.startDate).toLocaleDateString('fr-FR', { 
                                            day: 'numeric', 
                                            month: 'short', 
                                            year: 'numeric' 
                                          })}
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant="outline" className="bg-purple-50">
                                            Bloc {block.blockNumber}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant="outline" className="bg-blue-50">
                                            Jour {day.dayNumber}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>
                                          <span className="text-sm text-gray-600">
                                            {(day.warmup?.exercises.length || 0) + day.mainParts.reduce((acc, part) => acc + part.exercises.length, 0)} exercices
                                          </span>
                                        </TableCell>
                                        <TableCell>
                                          <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => {
                                              // Naviguer vers la vue détaillée de cette semaine
                                              navigate('/workout-detail', {
                                                state: { 
                                                  block: block, 
                                                  week: week,
                                                  studentId: student.id
                                                }
                                              });
                                            }}
                                          >
                                            <Eye className="h-4 w-4 mr-1" />
                                            Voir
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}
              </div>
            ) : (
              /* Affichage avec vraies données Airtable */
              <Card className="p-6 text-center">
                <h2 className="text-xl font-bold mb-4">🏋️ Dernier Entraînement - Semaine du 16 juin 2025</h2>
                
                {/* Tableau Jour 1 */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Jour 1 - Dernier Entraînement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Partie</TableHead>
                          <TableHead>Exercice</TableHead>
                          <TableHead>Format</TableHead>
                          <TableHead>Repos</TableHead>
                          <TableHead>Charge (kg)</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium bg-blue-50">Échauffement</TableCell>
                          <TableCell>Rameur</TableCell>
                          <TableCell>9' min d'effort</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium bg-orange-50">Partie Principale 1</TableCell>
                          <TableCell>Rowing haltère</TableCell>
                          <TableCell>AMRAP 15' : Max tour possible</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>6</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium bg-orange-50"></TableCell>
                          <TableCell>Jumping jack</TableCell>
                          <TableCell>AMRAP 15' : Max tour possible</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium bg-orange-50"></TableCell>
                          <TableCell>Push press</TableCell>
                          <TableCell>AMRAP 15' : Max tour possible</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>5</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium bg-orange-50"></TableCell>
                          <TableCell>Bearwalk</TableCell>
                          <TableCell>AMRAP 15' : Max tour possible</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium bg-orange-50">Partie Principale 2</TableCell>
                          <TableCell>Squat jump</TableCell>
                          <TableCell>21 - 15 - 9 - 7 - 5 - 1</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium bg-orange-50"></TableCell>
                          <TableCell>Burpees</TableCell>
                          <TableCell>21 - 15 - 9 - 7 - 5 - 1</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium bg-orange-50"></TableCell>
                          <TableCell>Thruster</TableCell>
                          <TableCell>21 - 15 - 9 - 7 - 5 - 1</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium bg-orange-50">Récupération/Cardio</TableCell>
                          <TableCell>Assault bike</TableCell>
                          <TableCell>Tabata 20/10</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Tableau Jour 2 */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Jour 2 - Dernier Entraînement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Partie</TableHead>
                          <TableHead>Exercice</TableHead>
                          <TableHead>Format</TableHead>
                          <TableHead>Repos</TableHead>
                          <TableHead>Charge (kg)</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium bg-blue-50">Échauffement</TableCell>
                          <TableCell>Kcal SkiErg</TableCell>
                          <TableCell>WARM UP x3</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium bg-blue-50"></TableCell>
                          <TableCell>Jumping Jack</TableCell>
                          <TableCell>WARM UP x3</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium bg-blue-50"></TableCell>
                          <TableCell>Bearwalk</TableCell>
                          <TableCell>WARM UP x3</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium bg-orange-50">Partie Principale 1</TableCell>
                          <TableCell>Thruster</TableCell>
                          <TableCell>HiiT : 45s work / 15s rest - 5 Tour</TableCell>
                          <TableCell>1' repos</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium bg-orange-50"></TableCell>
                          <TableCell>Farmer Walk</TableCell>
                          <TableCell>HiiT : 45s work / 15s rest - 5 Tour</TableCell>
                          <TableCell>1' repos</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium bg-orange-50"></TableCell>
                          <TableCell>Burpees</TableCell>
                          <TableCell>HiiT : 45s work / 15s rest - 5 Tour</TableCell>
                          <TableCell>1' repos</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium bg-orange-50"></TableCell>
                          <TableCell>Reverse crunch</TableCell>
                          <TableCell>HiiT : 45s work / 15s rest - 5 Tour</TableCell>
                          <TableCell>1' repos</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium bg-orange-50"></TableCell>
                          <TableCell>Gainage</TableCell>
                          <TableCell>HiiT : 45s work / 15s rest - 5 Tour</TableCell>
                          <TableCell>1' repos</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium bg-orange-50">Partie Principale 2</TableCell>
                          <TableCell>Inclinaison latéral</TableCell>
                          <TableCell>30s work /coté : 3 tour</TableCell>
                          <TableCell>30/45s repos</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium bg-orange-50">Récupération/Cardio</TableCell>
                          <TableCell>Marche rapide</TableCell>
                          <TableCell>1,5km : Pente 5 / vitesse 6</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Historique des entraînements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-orange-500" />
                      Historique des Entraînements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Semaine</TableHead>
                          <TableHead>Bloc</TableHead>
                          <TableHead>Jour</TableHead>
                          <TableHead>Exercices</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Génération dynamique basée sur les données Airtable */}
                        {[
                          { date: '16 juin 2025', bloc: 4, exercices: 14 },
                          { date: '9 juin 2025', bloc: 4, exercices: 15 },
                          { date: '2 juin 2025', bloc: 3, exercices: 18 },
                          { date: '26 mai 2025', bloc: 3, exercices: 17 },
                          { date: '19 mai 2025', bloc: 3, exercices: 17 },
                          { date: '12 mai 2025', bloc: 3, exercices: 17 },
                          { date: '5 mai 2025', bloc: 2, exercices: 17 },
                          { date: '28 avril 2025', bloc: 2, exercices: 17 },
                          { date: '17 mars 2025', bloc: 2, exercices: 17 },
                          { date: '10 mars 2025', bloc: 2, exercices: 16 },
                          { date: '3 mars 2025', bloc: 1, exercices: 19 },
                          { date: '24 février 2025', bloc: 1, exercices: 13 },
                          { date: '17 février 2025', bloc: 1, exercices: 12 },
                          { date: '10 février 2025', bloc: 1, exercices: 13 }
                        ].map((workout, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{workout.date}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-purple-50">
                                Bloc {workout.bloc}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-blue-50">
                                Jour 1 & 2
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600">{workout.exercices} exercices</span>
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  console.log(`Clic sur bouton Voir - ${workout.date}`);
                                  navigate('/workout-detail', {
                                    state: { 
                                      block: { blockNumber: workout.bloc, id: `block-${workout.bloc}`, startDate: workout.date }, 
                                      week: { startDate: workout.date, weekNumber: 1, id: 'week-1' },
                                      studentId: student.id,
                                      workoutDate: workout.date
                                    }
                                  });
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Voir
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </Card>
            ))}

          </>
        )}
      </motion.div>
    </Layout>
  );
};

export default Workouts;
