// ==========================================
// 📊 COMPOSANT STATISTIQUES DE PROGRESSION WORKOUT
// ==========================================

import React from 'react';
import { BlockCalculation } from '@/services/types/airtable.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  CheckCircle, 
  Clock,
  Pause,
  Play,
  BarChart3
} from 'lucide-react';

interface WorkoutProgressStatsProps {
  progress: {
    totalBlocks: number;
    completedBlocks: number;
    totalWeeks: number;
    completedWeeks: number;
    completionRate: number;
    lastActivity: string | null;
    currentStatus: BlockCalculation;
  };
  studentName?: string;
}

const WorkoutProgressStats: React.FC<WorkoutProgressStatsProps> = ({
  progress,
  studentName
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusColor = (isPaused: boolean) => {
    if (isPaused) return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-green-100 text-green-700 border-green-200";
  };

  const getStatusIcon = (isPaused: boolean) => {
    if (isPaused) return <Pause className="h-4 w-4" />;
    return <Play className="h-4 w-4" />;
  };

  const getStatusText = (isPaused: boolean) => {
    if (isPaused) return "En pause";
    return "Actif";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Statut actuel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getStatusIcon(progress.currentStatus.isPaused)}
            Statut
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Badge className={getStatusColor(progress.currentStatus.isPaused)}>
              {getStatusText(progress.currentStatus.isPaused)}
            </Badge>
            
            <div className="text-sm text-gray-600">
              <p>Bloc {progress.currentStatus.currentBlock}</p>
              <p className="text-xs">
                Semaine du {formatDate(progress.currentStatus.currentWeek)}
              </p>
            </div>
            
            {progress.currentStatus.isPaused && progress.currentStatus.pausedSince && (
              <p className="text-xs text-orange-600">
                Depuis le {formatDate(progress.currentStatus.pausedSince)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progression globale */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            Progression
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-blue-600">
                {progress.completionRate}%
              </span>
              <Badge variant="outline" className="bg-blue-50">
                {progress.completedWeeks}/{progress.totalWeeks}
              </Badge>
            </div>
            
            <Progress 
              value={progress.completionRate} 
              className="h-2"
            />
            
            <p className="text-xs text-gray-600">
              Semaines complétées
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Blocs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-500" />
            Blocs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-purple-600">
                {progress.totalBlocks}
              </span>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">
                  {progress.completedBlocks}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Total</span>
              <span>Terminés</span>
            </div>
            
            <Progress 
              value={progress.totalBlocks > 0 ? (progress.completedBlocks / progress.totalBlocks) * 100 : 0} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Dernière activité */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            Dernière activité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {progress.lastActivity ? (
              <>
                <p className="text-lg font-semibold text-gray-800">
                  {formatDate(progress.lastActivity)}
                </p>
                <p className="text-xs text-gray-600">
                  Il y a {Math.floor((new Date().getTime() - new Date(progress.lastActivity).getTime()) / (1000 * 60 * 60 * 24))} jours
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">
                Aucune activité enregistrée
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Prochaine étape (carte étendue) */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-500" />
            Prochaine étape
            {studentName && (
              <Badge variant="outline" className="bg-indigo-50">
                {studentName}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-800">Bloc suivant</h4>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-purple-50">
                  Bloc {progress.currentStatus.nextBlock}
                </Badge>
                {progress.currentStatus.nextBlock !== progress.currentStatus.currentBlock && (
                  <span className="text-sm text-gray-600">
                    (Nouveau bloc)
                  </span>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-800">Prochaine semaine</h4>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">
                  {formatDate(progress.currentStatus.nextWeek)}
                </span>
              </div>
            </div>
          </div>
          
          {progress.currentStatus.isPaused && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 text-orange-700">
                <Pause className="h-4 w-4" />
                <span className="font-medium">Programme en pause</span>
              </div>
              <p className="text-sm text-orange-600 mt-1">
                L'élève reprendra son programme là où il s'est arrêté.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkoutProgressStats;