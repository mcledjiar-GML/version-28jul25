import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Dumbbell } from 'lucide-react';
import Layout from '../components/Layout';
import DashboardHeader from '../components/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WorkoutBlock, WorkoutWeek } from '@/services/types/airtable.types';

const WorkoutDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  console.log('WorkoutDetail - location.state:', location.state);
  
  const { block, week, studentId, workoutDate } = location.state || {};
  
  // Données de fallback si les vraies données manquent
  const fallbackBlock = block || { blockNumber: 4, id: 'block-4', startDate: '2025-06-16' };
  const fallbackWeek = week || { startDate: '2025-06-16', weekNumber: 1, id: 'week-1' };
  const displayDate = workoutDate || '16 juin 2025';
  
  if (!location.state) {
    console.warn('Pas de données dans location.state, utilisation des données de fallback');
  }

  // Utiliser les données de fallback si les vraies données manquent
  const displayBlock = fallbackBlock;
  const displayWeek = fallbackWeek;

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="p-6 pb-8 bg-orange-50 rounded-lg"
      >
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/workouts')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <DashboardHeader
            title={`Semaine d'Entraînement - Bloc ${displayBlock.blockNumber}`}
            subtitle={`Semaine du ${displayDate}`}
            icon={<Dumbbell size={20} className="text-orange-500" />}
          />
        </div>

        {/* Affichage dynamique selon la date */}
        <div className="space-y-8">
          {/* Jour 1 */}
          <Card className="border border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                Jour 1 - {displayDate}
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
              </div>
            </CardContent>
          </Card>

          {/* Jour 2 */}
          <Card className="border border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                Jour 2 - {displayDate}
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
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </Layout>
  );
};

export default WorkoutDetail;