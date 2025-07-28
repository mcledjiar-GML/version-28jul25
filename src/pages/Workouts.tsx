
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStudent } from '../context/StudentContext';
import Layout from '../components/Layout';
import DashboardHeader from '../components/DashboardHeader';
import { Dumbbell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import AirtableService from '@/services/AirtableService';
import { Workout } from '@/services/types/airtable.types';
import WorkoutCard from '@/components/workouts/WorkoutCard';
import WorkoutHistoryTable from '@/components/workouts/WorkoutHistoryTable';
import { Skeleton } from '@/components/ui/skeleton';

const Workouts = () => {
  const { student } = useStudent();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if user is logged in
  useEffect(() => {
    if (!student) {
      navigate('/');
    } else {
      fetchWorkouts();
    }
  }, [student, navigate]);

  const fetchWorkouts = async () => {
    if (student) {
      setIsLoading(true);
      try {
        const fetchedWorkouts = await AirtableService.getStudentWorkouts(student.id);
        setWorkouts(fetchedWorkouts);
      } catch (error) {
        console.error('Error fetching workouts:', error);
      } finally {
        setIsLoading(false);
      }
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
      </motion.div>
    </Layout>
  );
};

export default Workouts;
