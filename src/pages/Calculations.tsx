import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStudent } from '../context/StudentContext';
import AirtableService, { Calculation } from '../services/AirtableService';
import Layout from '../components/Layout';
import DashboardHeader from '../components/DashboardHeader';
import { Calculator, Flame, BarChart3, Target, Eye, Mail, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import CalorieCard from '../components/calculations/CalorieCard';
import MacronutrientChart from '../components/calculations/MacronutrientChart';
import ExplanationCard from '../components/calculations/ExplanationCard';
import CalcHistoryTable from '../components/calculations/CalcHistoryTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface StudentData {
  id: string;
  name: string;
  email: string;
  code: string;
  status?: string;
  objectives?: string;
  hasCalculations?: boolean;
  latestCalculationDate?: string;
}

const Calculations = () => {
  const { student } = useStudent();
  const navigate = useNavigate();
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [latestCalculation, setLatestCalculation] = useState<Calculation | null>(null);
  const [studentsData, setStudentsData] = useState<StudentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!student) {
      navigate('/');
      return;
    }
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (student.isAdmin) {
          // Vue admin : charger tous les élèves avec leurs calculs
          console.log('🧮 Chargement des calculs pour tous les élèves...');
          
          const airtableApi = (AirtableService as any).apiService;
          const studentsAirtableData = await airtableApi.fetchAllRecords('Élèves');
          
          const studentsWithCalculations = await Promise.all(
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

              // Vérifier si l'élève a des calculs
              try {
                const studentCalculations = await AirtableService.getStudentCalculations(record.id);
                studentData.hasCalculations = studentCalculations.length > 0;
                if (studentCalculations.length > 0) {
                  const latest = studentCalculations.sort((a, b) => 
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                  )[0];
                  studentData.latestCalculationDate = latest.date;
                }
              } catch (error) {
                console.error(`Erreur calculs pour élève ${record.id}:`, error);
                studentData.hasCalculations = false;
              }

              return studentData;
            })
          );

          setStudentsData(studentsWithCalculations);
        } else {
          // Vue élève : charger ses propres calculs
          const calculationsData = await AirtableService.getStudentCalculations(student.id);
          if (calculationsData.length > 0) {
            const sortedCalculations = calculationsData.sort((a, b) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            setLatestCalculation(sortedCalculations[0]);
            setCalculations(sortedCalculations);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error("Erreur lors de la récupération des données");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [student, navigate]);

  const handleViewStudentCalculations = (studentData: StudentData) => {
    // Naviguer vers la page de calculs individuels de l'élève
    navigate('/admin/student-calculations', { state: { studentCode: studentData.code } });
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

  const objective = student.objectives || student.objective || "objectif";

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="p-6 pb-8 bg-purple-50 rounded-lg"
      >
        <DashboardHeader
          title={student.isAdmin ? "Calculs Nutritionnels - Vue Admin" : "Calculs Nutritionnels"}
          subtitle={student.isAdmin ? "Gestion des calculs nutritionnels pour tous les élèves" : "BMR, BCJ et macronutriments personnalisés"}
          icon={<Calculator size={20} className="text-purple-500" />}
          className="mb-6"
        />

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : student.isAdmin ? (
          // Vue Admin : Liste des élèves avec calculs
          <Card className="border border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-purple-500" />
                Liste des Élèves - Calculs Nutritionnels
                <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              </CardTitle>
              <CardDescription>
                Cliquez sur un élève pour voir ses calculs nutritionnels et historique complet
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
                      <TableHead>Calculs</TableHead>
                      <TableHead>Dernier Calcul</TableHead>
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
                          {studentData.hasCalculations ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              ✅ Disponibles
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                              ⚪ Aucun
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {studentData.latestCalculationDate ? (
                            <span className="text-sm">
                              {format(new Date(studentData.latestCalculationDate), 'dd/MM/yyyy', { locale: fr })}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewStudentCalculations(studentData)}
                            disabled={!studentData.hasCalculations}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            {studentData.hasCalculations ? 'Voir Calculs' : 'Aucun calcul'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : !latestCalculation ? (
          <Card className="p-6 mt-6 text-center border border-purple-200">
            <p className="text-muted-foreground">Aucun calcul nutritionnel disponible pour le moment.</p>
          </Card>
        ) : (
          <>
            <div className="mt-6 mb-4 glass-card p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-muted-foreground text-sm">
                BLOC du {format(new Date(latestCalculation.date), 'dd MMMM yyyy', { locale: fr })}
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="mb-8"
            >
              <CalorieCard 
                title={`Besoin Calorique Journalier pour ${objective}`}
                description="Calories adaptées à votre objectif"
                value={latestCalculation.objective || 0}
                icon={Target}
                explanation="Ce calcul représente vos besoins caloriques journaliers ajustés en fonction de votre objectif personnel."
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mb-8"
            >
              <MacronutrientChart calculation={latestCalculation} />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <CalorieCard 
                  title="Métabolisme de Base (BMR)"
                  description="Calories nécessaires au repos"
                  value={latestCalculation.bmr}
                  icon={Flame}
                  explanation="Le métabolisme de base représente les calories dont votre corps a besoin pour maintenir ses fonctions vitales au repos."
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <CalorieCard 
                  title="Besoin Calorique Journalier (BCJ)"
                  description="Calories nécessaires avec activité"
                  value={latestCalculation.bcj}
                  icon={BarChart3}
                  explanation="Le BCJ prend en compte votre niveau d'activité physique et représente la quantité de calories dont vous avez besoin quotidiennement."
                />
              </motion.div>
            </div>

            {calculations.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="mb-8"
              >
                <h2 className="text-xl font-semibold mb-4">Historique des calculs (kcal)</h2>
                <Card className="border border-purple-200">
                  <CalcHistoryTable calculations={calculations} />
                </Card>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <ExplanationCard />
            </motion.div>
          </>
        )}
      </motion.div>
    </Layout>
  );
};

export default Calculations;
