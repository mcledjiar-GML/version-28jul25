// ==========================================
// 🏋️ COMPOSANT D'AFFICHAGE DES BLOCS D'ENTRAÎNEMENT
// ==========================================

import React from 'react';
import { WorkoutBlock, WorkoutWeek, WorkoutDay, WorkoutSection } from '@/services/types/airtable.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Dumbbell, 
  Target, 
  Flame,
  CheckCircle,
  Circle,
  Pause,
  Play
} from 'lucide-react';
import { useState } from 'react';

interface WorkoutBlockViewProps {
  blocks: WorkoutBlock[];
  isAdmin?: boolean;
  onCreateWorkout?: (blockNumber: number, weekNumber: number) => void;
  onEditWorkout?: (blockId: string, weekId: string, dayId: string) => void;
}

const WorkoutBlockView: React.FC<WorkoutBlockViewProps> = ({
  blocks,
  isAdmin = false,
  onCreateWorkout,
  onEditWorkout
}) => {
  const [openBlocks, setOpenBlocks] = useState<Set<string>>(new Set());
  const [openWeeks, setOpenWeeks] = useState<Set<string>>(new Set());

  const toggleBlock = (blockId: string) => {
    const newOpenBlocks = new Set(openBlocks);
    if (newOpenBlocks.has(blockId)) {
      newOpenBlocks.delete(blockId);
    } else {
      newOpenBlocks.add(blockId);
    }
    setOpenBlocks(newOpenBlocks);
  };

  const toggleWeek = (weekId: string) => {
    const newOpenWeeks = new Set(openWeeks);
    if (newOpenWeeks.has(weekId)) {
      newOpenWeeks.delete(weekId);
    } else {
      newOpenWeeks.add(weekId);
    }
    setOpenWeeks(newOpenWeeks);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getDayName = (dayNumber: number) => {
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    return days[dayNumber - 1] || `Jour ${dayNumber}`;
  };

  const renderExercise = (exercise: any, index: number) => (
    <div key={exercise.id || index} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <h5 className="font-medium text-gray-900">{exercise.name}</h5>
        {exercise.type && (
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
            {exercise.type}
          </span>
        )}
      </div>
      
      <div className="text-right text-sm space-y-1">
        <div className="flex items-center gap-2">
          <Target className="h-3 w-3 text-blue-500" />
          <span className="font-medium">
            {exercise.sets} × {exercise.reps}
          </span>
        </div>
        
        {exercise.weight && (
          <div className="flex items-center gap-2">
            <Dumbbell className="h-3 w-3 text-orange-500" />
            <span>{exercise.weight} kg</span>
          </div>
        )}
        
        {exercise.restTime && (
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-green-500" />
            <span>{Math.floor(exercise.restTime / 60)}min{exercise.restTime % 60 > 0 ? ` ${exercise.restTime % 60}s` : ''}</span>
          </div>
        )}
        
        {exercise.notes && (
          <div className="text-xs text-gray-600 italic max-w-32">
            {exercise.notes}
          </div>
        )}
      </div>
    </div>
  );

  const renderSection = (section: WorkoutSection) => (
    <div key={section.id} className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        {section.name.toLowerCase().includes('échauffement') ? (
          <Flame className="h-4 w-4 text-red-500" />
        ) : (
          <Dumbbell className="h-4 w-4 text-blue-500" />
        )}
        <h4 className="font-semibold text-gray-800">{section.name}</h4>
        <Badge variant="outline" className="text-xs">
          {section.exercises.length} exercice{section.exercises.length > 1 ? 's' : ''}
        </Badge>
      </div>
      
      <div className="space-y-2">
        {section.exercises.map((exercise, index) => renderExercise(exercise, index))}
      </div>
    </div>
  );

  const renderDay = (day: WorkoutDay, weekId: string) => (
    <Card key={day.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-500" />
              <CardTitle className="text-lg">
                {getDayName(day.dayNumber)}
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              {formatDate(day.date)}
            </Badge>
          </div>
          
          {isAdmin && onEditWorkout && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditWorkout(weekId.split('-')[0], weekId, day.id)}
            >
              Modifier
            </Button>
          )}
        </div>
        
        {day.notes && (
          <CardDescription className="text-sm italic">
            {day.notes}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {day.warmup && renderSection(day.warmup)}
        {day.mainParts.map(section => renderSection(section))}
      </CardContent>
    </Card>
  );

  const renderWeek = (week: WorkoutWeek, blockNumber: number) => {
    const isOpen = openWeeks.has(week.id);
    
    return (
      <div key={week.id} className="border border-gray-200 rounded-lg mb-4">
        <Collapsible open={isOpen} onOpenChange={() => toggleWeek(week.id)}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {week.isCurrent ? (
                    <Play className="h-4 w-4 text-green-500" />
                  ) : week.isComplete ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-400" />
                  )}
                  <h3 className="font-semibold text-gray-800">
                    Semaine {week.weekNumber}
                  </h3>
                </div>
                
                <Badge 
                  variant={week.isCurrent ? "default" : week.isComplete ? "secondary" : "outline"}
                  className={week.isCurrent ? "bg-green-100 text-green-700" : ""}
                >
                  {week.isCurrent ? "En cours" : week.isComplete ? "Terminée" : "À venir"}
                </Badge>
                
                <span className="text-sm text-gray-600">
                  Du {formatDate(week.startDate)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50">
                  {week.days.length} jour{week.days.length > 1 ? 's' : ''}
                </Badge>
                
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="p-4 pt-0 space-y-4">
              {week.days.length > 0 ? (
                week.days.map(day => renderDay(day, week.id))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>Aucun entraînement programmé cette semaine</p>
                  {isAdmin && onCreateWorkout && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => onCreateWorkout(blockNumber, week.weekNumber)}
                    >
                      Créer un entraînement
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  const renderBlock = (block: WorkoutBlock) => {
    const isOpen = openBlocks.has(block.id);
    
    return (
      <Card key={block.id} className="mb-6">
        <Collapsible open={isOpen} onOpenChange={() => toggleBlock(block.id)}>
          <CollapsibleTrigger asChild>
            <CardHeader className="hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {block.isCurrent ? (
                      <Play className="h-5 w-5 text-green-500" />
                    ) : block.isComplete ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Pause className="h-5 w-5 text-gray-400" />
                    )}
                    <CardTitle className="text-xl">
                      Bloc {block.blockNumber}
                    </CardTitle>
                  </div>
                  
                  <Badge 
                    variant={block.isCurrent ? "default" : block.isComplete ? "secondary" : "outline"}
                    className={block.isCurrent ? "bg-green-100 text-green-700" : ""}
                  >
                    {block.isCurrent ? "Bloc courant" : block.isComplete ? "Terminé" : "À venir"}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right text-sm text-gray-600">
                    <p>Débuté le {formatDate(block.startDate)}</p>
                    <p>{block.weeks.length}/4 semaines</p>
                  </div>
                  
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0">
              {block.weeks.length > 0 ? (
                block.weeks.map(week => renderWeek(week, block.blockNumber))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Dumbbell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>Aucune semaine programmée dans ce bloc</p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  if (blocks.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Dumbbell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <CardTitle className="text-xl text-gray-600 mb-2">
            Aucun bloc d'entraînement
          </CardTitle>
          <CardDescription>
            {isAdmin 
              ? "Créez le premier bloc d'entraînement pour cet élève" 
              : "Votre coach n'a pas encore créé vos programmes d'entraînement"
            }
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {blocks.map(block => renderBlock(block))}
    </div>
  );
};

export default WorkoutBlockView;