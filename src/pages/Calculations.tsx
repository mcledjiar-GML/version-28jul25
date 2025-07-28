import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStudent } from '../context/StudentContext';
import AirtableService, { Calculation } from '../services/AirtableService';
import Layout from '../components/Layout';
import DashboardHeader from '../components/DashboardHeader';
import { Calculator, Flame, BarChart3, Target } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import CalorieCard from '../components/calculations/CalorieCard';
import MacronutrientChart from '../components/calculations/MacronutrientChart';
import ExplanationCard from '../components/calculations/ExplanationCard';
import CalcHistoryTable from '../components/calculations/CalcHistoryTable';
import { Card } from '@/components/ui/card';

const Calculations = () => {
  const { student } = useStudent();
  const navigate = useNavigate();
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [latestCalculation, setLatestCalculation] = useState<Calculation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!student) {
      navigate('/');
      return;
    }
    
    const fetchCalculations = async () => {
      setIsLoading(true);
      try {
        const calculationsData = await AirtableService.getStudentCalculations(student.id);
        if (calculationsData.length > 0) {
          const sortedCalculations = calculationsData.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setLatestCalculation(sortedCalculations[0]);
          setCalculations(sortedCalculations);
        }
      } catch (error) {
        console.error('Error fetching calculations:', error);
        toast.error("Erreur lors de la récupération des calculs");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCalculations();
  }, [student, navigate]);

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
