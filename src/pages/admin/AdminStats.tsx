import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStudent } from '../../context/StudentContext';
import Layout from '../../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  Clock,
  Eye,
  Mail
} from 'lucide-react';
import AirtableService from '../../services/AirtableService';

interface StatsData {
  totalStudents: number;
  activeStudents: number;
  pausedStudents: number;
  averageAge: number;
  averageWeight: number;
  activityRate: number;
  // Nouvelles statistiques
  topObjectives: { objective: string; count: number }[];
  imcDistribution: { category: string; count: number; color: string }[];
  ageDistribution: { ageGroup: string; count: number }[];
  statusDistribution: { name: string; value: number; color: string }[];
  dietDistribution: { diet: string; count: number }[];
  activityLevels: { level: string; count: number; color: string }[];
  motivationSources: { source: string; count: number }[];
  genderDistribution: { gender: string; count: number; color: string }[];
  progressionData: { student: string; progress: number }[];
  monthlyEvolution: { month: string; active: number; total: number }[];
  studentsData: StudentData[];
}

interface StudentData {
  id: string;
  name: string;
  email: string;
  code: string;
  status?: string;
  age?: number;
  weight?: number;
  objectives?: string;
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

  const handleViewStudentStats = (studentData: StudentData) => {
    // Naviguer vers la page de statistiques individuelles de l'élève
    navigate('/admin/student-stats', { state: { studentCode: studentData.code } });
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

  const analyzeStudentData = (data: any[]): StatsData => {
    const totalStudents = data.length;
    
    // Traitement des données
    const processedStudents = data.map(record => {
      const fields = record.fields || record;
      return {
        name: fields.Nom || fields.Name || 'Élève',
        status: fields.Statut || fields.Status || 'Actif',
        age: fields['Âge'] || fields.Age || null,
        gender: fields.Sexe || fields.Gender || null,
        weight: fields['Poids Initial'] || fields['Initial Weight'] || null,
        targetWeight: fields['Poids Cible'] || fields['Target Weight'] || null,
        height: fields['Taille (cm)'] || fields.Height || null,
        objectives: fields.Objectifs || fields.objectives || '',
        diet: fields['Régime Alimentaire'] || fields.Diet || null,
        activityLevel: fields['Niveau d\'Activité'] || fields.ActivityLevel || null,
        motivation: fields.Motivation || null
      };
    });

    // Données des élèves pour la liste
    const studentsData: StudentData[] = data.map(record => {
      const fields = record.fields || record;
      return {
        id: record.id,
        name: fields.Nom || fields.Name || 'Nom non défini',
        email: fields['E-mail'] || fields.Email || 'Email non défini',
        code: fields.code || record.id,
        status: fields.Statut || fields.Status || 'Actif',
        age: fields['Âge'] || fields.Age || null,
        weight: fields['Poids Initial'] || fields['Initial Weight'] || null,
        objectives: fields.Objectifs || fields.objectives || ''
      };
    });

    // Statistiques de base
    const activeStudents = processedStudents.filter(s => s.status === 'Actif').length;
    const pausedStudents = processedStudents.filter(s => s.status === 'Pause').length;
    const activityRate = totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0;
    
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

    // Top Objectifs
    const objectiveCounts: { [key: string]: number } = {};
    processedStudents.forEach(student => {
      if (student.objectives.trim()) {
        const obj = student.objectives.trim();
        objectiveCounts[obj] = (objectiveCounts[obj] || 0) + 1;
      }
    });
    
    const topObjectives = Object.entries(objectiveCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([objective, count]) => ({ objective, count }));

    // Distribution IMC
    const imcCategories = {
      'Sous-poids': 0,
      'Normal': 0,
      'Surpoids': 0,
      'Obésité': 0
    };
    
    processedStudents.forEach(student => {
      if (student.weight && student.height) {
        const imc = student.weight / Math.pow(student.height / 100, 2);
        if (imc < 18.5) imcCategories['Sous-poids']++;
        else if (imc < 25) imcCategories['Normal']++;
        else if (imc < 30) imcCategories['Surpoids']++;
        else imcCategories['Obésité']++;
      }
    });

    const imcDistribution = [
      { category: 'Sous-poids', count: imcCategories['Sous-poids'], color: '#3b82f6' },
      { category: 'Normal', count: imcCategories['Normal'], color: '#10b981' },
      { category: 'Surpoids', count: imcCategories['Surpoids'], color: '#f59e0b' },
      { category: 'Obésité', count: imcCategories['Obésité'], color: '#ef4444' }
    ].filter(item => item.count > 0);

    // Distribution par régime alimentaire
    const dietCounts: { [key: string]: number } = {};
    processedStudents.forEach(student => {
      const diet = student.diet || 'Non spécifié';
      dietCounts[diet] = (dietCounts[diet] || 0) + 1;
    });
    
    const dietDistribution = Object.entries(dietCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([diet, count]) => ({ diet, count }));

    // Niveaux d'activité
    const activityCounts = {
      'Sédentaire': 0,
      'Peu actif': 0,
      'Modérément actif': 0,
      'Très actif': 0
    };
    
    processedStudents.forEach(student => {
      const level = student.activityLevel || 'Non spécifié';
      if (level.toLowerCase().includes('sédentaire') || level.toLowerCase().includes('faible')) {
        activityCounts['Sédentaire']++;
      } else if (level.toLowerCase().includes('peu') || level.toLowerCase().includes('léger')) {
        activityCounts['Peu actif']++;
      } else if (level.toLowerCase().includes('modéré') || level.toLowerCase().includes('moyen')) {
        activityCounts['Modérément actif']++;
      } else if (level.toLowerCase().includes('élevé') || level.toLowerCase().includes('intense') || level.toLowerCase().includes('très')) {
        activityCounts['Très actif']++;
      }
    });

    const activityLevels = [
      { level: 'Sédentaire', count: activityCounts['Sédentaire'], color: '#ef4444' },
      { level: 'Peu actif', count: activityCounts['Peu actif'], color: '#f59e0b' },
      { level: 'Modérément actif', count: activityCounts['Modérément actif'], color: '#10b981' },
      { level: 'Très actif', count: activityCounts['Très actif'], color: '#3b82f6' }
    ].filter(item => item.count > 0);

    // Sources de motivation
    const motivationCounts: { [key: string]: number } = {};
    processedStudents.forEach(student => {
      if (student.motivation && student.motivation.trim()) {
        const motivation = student.motivation.trim();
        motivationCounts[motivation] = (motivationCounts[motivation] || 0) + 1;
      }
    });
    
    const motivationSources = Object.entries(motivationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([source, count]) => ({ source, count }));

    // Distribution par genre
    const genderCounts = {
      'Homme': processedStudents.filter(s => s.gender && s.gender.toLowerCase().includes('homme')).length,
      'Femme': processedStudents.filter(s => s.gender && s.gender.toLowerCase().includes('femme')).length,
      'Non spécifié': processedStudents.filter(s => !s.gender).length
    };

    const genderDistribution = [
      { gender: 'Homme', count: genderCounts['Homme'], color: '#3b82f6' },
      { gender: 'Femme', count: genderCounts['Femme'], color: '#ec4899' },
      { gender: 'Non spécifié', count: genderCounts['Non spécifié'], color: '#6b7280' }
    ].filter(item => item.count > 0);

    // Données de progression (simulées)
    const progressionData = processedStudents
      .filter(s => s.weight && s.targetWeight)
      .slice(0, 10)
      .map(student => ({
        student: student.name,
        progress: student.weight && student.targetWeight ? 
          Math.min(100, Math.max(0, Math.round(((student.weight - student.targetWeight) / student.weight) * 100))) : 0
      }));

    // Évolution mensuelle
    const monthlyEvolution = [
      { month: 'Jan', active: Math.floor(activeStudents * 0.7), total: Math.floor(totalStudents * 0.8) },
      { month: 'Fév', active: Math.floor(activeStudents * 0.75), total: Math.floor(totalStudents * 0.85) },
      { month: 'Mar', active: Math.floor(activeStudents * 0.85), total: Math.floor(totalStudents * 0.9) },
      { month: 'Avr', active: Math.floor(activeStudents * 0.9), total: Math.floor(totalStudents * 0.95) },
      { month: 'Mai', active: activeStudents, total: totalStudents }
    ];

    return {
      totalStudents,
      activeStudents,
      pausedStudents,
      averageAge,
      averageWeight,
      activityRate,
      topObjectives,
      imcDistribution,
      ageDistribution,
      statusDistribution,
      dietDistribution,
      activityLevels,
      motivationSources,
      genderDistribution,
      progressionData,
      monthlyEvolution,
      studentsData
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
            {/* Liste des élèves */}
            <Card>
              <CardHeader>
                <CardTitle>Liste des Élèves</CardTitle>
                <CardDescription>
                  Cliquez sur un élève pour voir ses statistiques individuelles
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
                        <TableHead>Âge</TableHead>
                        <TableHead>Poids</TableHead>
                        <TableHead>Objectifs</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.studentsData.map((studentData) => (
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
                          <TableCell>{studentData.age ? `${studentData.age} ans` : '-'}</TableCell>
                          <TableCell>{studentData.weight ? `${studentData.weight} kg` : '-'}</TableCell>
                          <TableCell className="max-w-xs truncate" title={studentData.objectives}>
                            {studentData.objectives || '-'}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleViewStudentStats(studentData)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Stats
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

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
                      <p className="text-3xl font-bold text-green-600">{stats.activityRate}%</p>
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

            {/* Graphiques - Ligne 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Répartition par statut */}
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

              {/* Répartition par âge */}
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

              {/* Distribution IMC */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribution IMC</CardTitle>
                  <CardDescription>Catégories d'IMC des élèves</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={stats.imcDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        label={({ category, count }) => `${category}: ${count}`}
                      >
                        {stats.imcDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Graphiques - Ligne 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Top Objectifs */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Objectifs</CardTitle>
                  <CardDescription>Objectifs les plus fréquents</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={stats.topObjectives}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="objective" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Niveaux d'Activité */}
              <Card>
                <CardHeader>
                  <CardTitle>Niveaux d'Activité</CardTitle>
                  <CardDescription>Répartition par niveau d'activité</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={stats.activityLevels}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        label={({ level, count }) => `${level}: ${count}`}
                      >
                        {stats.activityLevels.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Répartition par Genre */}
              <Card>
                <CardHeader>
                  <CardTitle>Répartition par Genre</CardTitle>
                  <CardDescription>Distribution hommes/femmes</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={stats.genderDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        label={({ gender, count }) => `${gender}: ${count}`}
                      >
                        {stats.genderDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Graphiques - Ligne 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Régimes Alimentaires */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Régimes Alimentaires</CardTitle>
                  <CardDescription>Régimes les plus suivis</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={stats.dietDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="diet" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Sources de Motivation */}
              <Card>
                <CardHeader>
                  <CardTitle>Sources de Motivation</CardTitle>
                  <CardDescription>Principales motivations des élèves</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={stats.motivationSources}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="source" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
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
                  <AreaChart data={stats.monthlyEvolution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="total" stackId="1" stroke="#94a3b8" fill="#e2e8f0" name="Total Élèves" />
                    <Area type="monotone" dataKey="active" stackId="2" stroke="#10b981" fill="#10b981" name="Élèves Actifs" />
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