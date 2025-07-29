import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStudent } from '../../context/StudentContext';
import AirtableService, { Calculation } from '../../services/AirtableService';
import Layout from '../../components/Layout';
import { Calculator, Flame, BarChart3, Target, ArrowLeft, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import CalorieCard from '../../components/calculations/CalorieCard';
import MacronutrientChart from '../../components/calculations/MacronutrientChart';
import ExplanationCard from '../../components/calculations/ExplanationCard';
import CalcHistoryTable from '../../components/calculations/CalcHistoryTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  objectives?: string;
}

const StudentCalculations = () => {
  const { student } = useStudent();
  const navigate = useNavigate();
  const location = useLocation();
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [latestCalculation, setLatestCalculation] = useState<Calculation | null>(null);
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
      navigate('/calculations');
      return;
    }
  }, [student, navigate, studentCode]);
  
  useEffect(() => {
    const fetchStudentCalculations = async () => {
      if (!studentCode) return;

      setIsLoading(true);
      try {
        console.log('🧮 Chargement des calculs nutritionnels de l\'élève:', studentCode);
        
        // Charger le profil de l'élève
        const airtableApi = (AirtableService as any).apiService;
        const studentsData = await airtableApi.fetchAllRecords('Élèves');
        
        const targetStudent = studentsData.find((record: any) => {
          const fields = record.fields || record;
          return fields.code === studentCode || record.id === studentCode;
        });

        if (!targetStudent) {
          toast.error('Élève introuvable');
          navigate('/calculations');
          return;
        }

        const fields = targetStudent.fields || targetStudent;
        const profile: StudentProfile = {
          id: targetStudent.id,
          name: fields.Nom || fields.Name || 'Nom non défini',
          email: fields['E-mail'] || fields.Email || 'Email non défini',
          objectives: fields.Objectifs || fields.objectives || ''
        };

        setStudentProfile(profile);

        // Charger les calculs de l'élève
        const calculationsData = await AirtableService.getStudentCalculations(profile.id);
        if (calculationsData.length > 0) {
          const sortedCalculations = calculationsData.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setLatestCalculation(sortedCalculations[0]);
          setCalculations(sortedCalculations);
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des calculs:', error);
        toast.error("Erreur lors de la récupération des calculs nutritionnels");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStudentCalculations();
  }, [studentCode, navigate]);

  if (!student?.isAdmin) return null;

  const objective = studentProfile?.objectives || "objectif";

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="p-6 pb-8 bg-purple-50 rounded-lg"
      >
        {/* Header avec bouton retour */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/calculations')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux Calculs
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Calculator className="h-8 w-8 text-purple-500" />
              <h1 className="text-3xl font-bold">
                Calculs de {studentProfile?.name || 'Élève'}
              </h1>
              <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                <Shield className="h-3 w-3 mr-1" />
                Vue Admin
              </Badge>
            </div>
            <p className="text-muted-foreground">
              BMR, BCJ et macronutriments - Historique complet
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : !latestCalculation ? (
          <Card className="p-6 mt-6 text-center border border-purple-200">
            <CardHeader>
              <CardTitle>Aucun calcul disponible</CardTitle>
              <CardDescription>
                Cet élève n'a pas encore de calculs nutritionnels enregistrés.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <>
            {/* Informations de l'élève */}
            <Card className="mb-6 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-500" />
                  Profil de l'Élève
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nom</p>
                    <p className="font-medium">{studentProfile?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{studentProfile?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Objectif</p>
                    <p className="font-medium">{objective || 'Non défini'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calcul actuel */}
            <div className="mt-6 mb-4 glass-card p-4 bg-purple-100 border border-purple-300 rounded-lg">
              <p className="text-purple-800 font-medium text-sm">
                📊 CALCUL ACTUEL - {format(new Date(latestCalculation.date), 'dd MMMM yyyy', { locale: fr })}
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
                description="Calories adaptées à l'objectif de l'élève"
                value={latestCalculation.objective || 0}
                icon={Target}
                explanation="Ce calcul représente les besoins caloriques journaliers ajustés en fonction de l'objectif personnel de l'élève."
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
                  explanation="Le métabolisme de base représente les calories dont le corps de l'élève a besoin pour maintenir ses fonctions vitales au repos."
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
                  explanation="Le BCJ prend en compte le niveau d'activité physique de l'élève et représente la quantité de calories dont il a besoin quotidiennement."
                />
              </motion.div>
            </div>

            {/* Historique complet */}
            {calculations.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="mb-8"
              >
                <Card className="border border-purple-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      📈 Historique Complet des Calculs
                    </CardTitle>
                    <CardDescription>
                      Évolution des calculs nutritionnels de l'élève ({calculations.length} calculs)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CalcHistoryTable calculations={calculations} />
                  </CardContent>
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

export default StudentCalculations;