import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStudent } from '../../context/StudentContext';
import Layout from '../../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Target,
  Calendar,
  Activity,
  Shield,
  Weight,
  UserCheck,
  Clock
} from 'lucide-react';
import AirtableService from '../../services/AirtableService';

interface StatsData {
  totalStudents: number;
  activeStudents: number;
  pausedStudents: number;
  studentsWithGoals: number;
  averageAge: number;
  averageWeight: number;
  ageDistribution: { ageGroup: string; count: number }[];
  statusDistribution: { name: string; value: number; color: string }[];
  weightGoals: { type: string; count: number }[];
  professionDistribution: { profession: string; count: number }[];
  monthlyProgress: { month: string; active: number; total: number }[];
}

const AdminStats = () => {
  const { student } = useStudent();
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vérifier que l'utilisateur est admin
  useEffect(() => {
    if (!student) {
      navigate('/');
      return;
    }
    
    if (!student.isAdmin) {
      navigate('/dashboard');
      return;
    }
  }, [student, navigate]);

  // Charger et analyser les données
  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true);
        console.log('📊 Chargement des statistiques...');
        
        const airtableApi = (AirtableService as any).apiService;
        const studentsData = await airtableApi.fetchAllRecords('Élèves');
        
        // Analyser les données
        const analyzedStats = analyzeStudentData(studentsData);
        setStats(analyzedStats);
        setError(null);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des stats:', error);
        setError('Impossible de charger les statistiques');
      } finally {
        setIsLoading(false);
      }
    };

    if (student?.isAdmin) {
      loadStats();
    }
  }, [student]);

  const analyzeStudentData = (data: any[]): StatsData => {
    const totalStudents = data.length;
    
    // Traitement des données
    const processedStudents = data.map(record => {
      const fields = record.fields || record;
      return {
        status: fields.Statut || fields.Status || 'Actif',
        age: fields['Âge'] || fields.Age || null,
        weight: fields['Poids Initial'] || fields['Initial Weight'] || null,
        objectives: fields.Objectifs || fields.objectives || '',
        profession: fields.Profession || fields.profession || 'Non spécifié'
      };
    });

    // Statistiques de base
    const activeStudents = processedStudents.filter(s => s.status === 'Actif').length;
    const pausedStudents = processedStudents.filter(s => s.status === 'Pause').length;
    const studentsWithGoals = processedStudents.filter(s => s.objectives.trim() !== '').length;
    
    // Moyennes
    const validAges = processedStudents.filter(s => s.age).map(s => s.age);
    const averageAge = validAges.length > 0 ? Math.round(validAges.reduce((sum, age) => sum + age, 0) / validAges.length) : 0;
    
    const validWeights = processedStudents.filter(s => s.weight).map(s => s.weight);
    const averageWeight = validWeights.length > 0 ? Math.round(validWeights.reduce((sum, weight) => sum + weight, 0) / validWeights.length) : 0;

    // Distribution par âge
    const ageGroups = {
      '15-20 ans': 0,
      '21-30 ans': 0,
      '31-40 ans': 0,
      '41+ ans': 0
    };
    
    validAges.forEach(age => {
      if (age <= 20) ageGroups['15-20 ans']++;
      else if (age <= 30) ageGroups['21-30 ans']++;
      else if (age <= 40) ageGroups['31-40 ans']++;
      else ageGroups['41+ ans']++;
    });

    const ageDistribution = Object.entries(ageGroups).map(([ageGroup, count]) => ({
      ageGroup,
      count
    }));

    // Distribution par statut
    const statusCounts = {
      'Actif': activeStudents,
      'Pause': pausedStudents,
      'Inactif': totalStudents - activeStudents - pausedStudents
    };

    const statusDistribution = [
      { name: 'Actif', value: statusCounts.Actif, color: '#10b981' },
      { name: 'Pause', value: statusCounts.Pause, color: '#f59e0b' },
      { name: 'Inactif', value: statusCounts.Inactif, color: '#ef4444' }
    ].filter(item => item.value > 0);

    // Objectifs de poids
    const weightGoalCounts = {
      'Perte de poids': 0,
      'Prise de masse': 0,
      'Maintien': 0,
      'Non défini': 0
    };

    processedStudents.forEach(student => {
      const objective = student.objectives.toLowerCase();
      if (objective.includes('perte') || objective.includes('maigrir') || objective.includes('perdre')) {
        weightGoalCounts['Perte de poids']++;
      } else if (objective.includes('prise') || objective.includes('muscle') || objective.includes('masse')) {
        weightGoalCounts['Prise de masse']++;
      } else if (objective.includes('maintien') || objective.includes('stabiliser')) {
        weightGoalCounts['Maintien']++;
      } else {
        weightGoalCounts['Non défini']++;
      }
    });

    const weightGoals = Object.entries(weightGoalCounts)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => ({ type, count }));

    // Distribution par profession (top 5)
    const professionCounts: { [key: string]: number } = {};
    processedStudents.forEach(student => {
      const prof = student.profession || 'Non spécifié';
      professionCounts[prof] = (professionCounts[prof] || 0) + 1;
    });

    const professionDistribution = Object.entries(professionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([profession, count]) => ({ profession, count }));

    // Données temporelles simulées (pour l'exemple)
    const monthlyProgress = [
      { month: 'Jan', active: Math.floor(activeStudents * 0.8), total: Math.floor(totalStudents * 0.8) },
      { month: 'Fév', active: Math.floor(activeStudents * 0.85), total: Math.floor(totalStudents * 0.85) },
      { month: 'Mar', active: Math.floor(activeStudents * 0.9), total: Math.floor(totalStudents * 0.9) },
      { month: 'Avr', active: Math.floor(activeStudents * 0.95), total: Math.floor(totalStudents * 0.95) },
      { month: 'Mai', active: activeStudents, total: totalStudents }
    ];

    return {
      totalStudents,
      activeStudents,
      pausedStudents,
      studentsWithGoals,
      averageAge,
      averageWeight,
      ageDistribution,
      statusDistribution,
      weightGoals,
      professionDistribution,
      monthlyProgress
    };
  };

  if (!student?.isAdmin) {
    return null;
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="h-8 w-8 text-cyan-500" />
              <h1 className="text-3xl font-bold">Statistiques</h1>
              <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Analyses et rapports de progression de vos élèves
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            <span className="ml-2">Calcul des statistiques...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">
            <p className="font-medium">Erreur</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : !stats ? (
          <div className="text-center py-12 text-muted-foreground">
            Aucune donnée disponible
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Élèves</p>
                      <p className="text-3xl font-bold">{stats.totalStudents}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Taux d'Activité</p>
                      <p className="text-3xl font-bold text-green-600">
                        {Math.round((stats.activeStudents / stats.totalStudents) * 100)}%
                      </p>
                    </div>
                    <Activity className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Âge Moyen</p>
                      <p className="text-3xl font-bold text-purple-600">{stats.averageAge} ans</p>
                    </div>
                    <Calendar className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Poids Moyen</p>
                      <p className="text-3xl font-bold text-orange-600">{stats.averageWeight} kg</p>
                    </div>
                    <Weight className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distribution par statut */}
              <Card>
                <CardHeader>
                  <CardTitle>Répartition par Statut</CardTitle>
                  <CardDescription>État d'activité des élèves</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={stats.statusDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {stats.statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Distribution par âge */}
              <Card>
                <CardHeader>
                  <CardTitle>Répartition par Âge</CardTitle>
                  <CardDescription>Groupes d'âge des élèves</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={stats.ageDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ageGroup" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Objectifs de poids */}
              <Card>
                <CardHeader>
                  <CardTitle>Objectifs de Poids</CardTitle>
                  <CardDescription>Types d'objectifs des élèves</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={stats.weightGoals}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top professions */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Professions</CardTitle>
                  <CardDescription>Professions les plus représentées</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={stats.professionDistribution} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="profession" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Évolution temporelle */}
            <Card>
              <CardHeader>
                <CardTitle>Évolution Mensuelle</CardTitle>
                <CardDescription>Progression du nombre d'élèves actifs</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={stats.monthlyProgress}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="total" stackId="1" stroke="#94a3b8" fill="#e2e8f0" />
                    <Area type="monotone" dataKey="active" stackId="2" stroke="#10b981" fill="#10b981" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>
    </Layout>
  );
};

export default AdminStats;