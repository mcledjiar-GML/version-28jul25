import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStudent } from '../../context/StudentContext';
import Layout from '../../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Line
} from 'recharts';
import { 
  User, 
  BarChart3, 
  Target,
  Calendar,
  Activity,
  Shield,
  Weight,
  TrendingUp,
  ArrowLeft
} from 'lucide-react';
import AirtableService from '../../services/AirtableService';

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  age?: number;
  gender?: string;
  status?: string;
  initialWeight?: number;
  targetWeight?: number;
  height?: number;
  objectives?: string;
  diet?: string;
  activityLevel?: string;
  motivation?: string;
}

interface StudentStatsData {
  profile: StudentProfile;
  bmi?: number;
  bmiCategory?: string;
  weightToLose?: number;
  weightProgress?: number;
  daysActive?: number;
  monthlyProgress: { month: string; weight: number; target: number }[];
  nutritionStats: { category: string; value: number; color: string }[];
}

const StudentStats = () => {
  const { student } = useStudent();
  const navigate = useNavigate();
  const location = useLocation();
  const [studentStats, setStudentStats] = useState<StudentStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      navigate('/admin/stats');
      return;
    }
  }, [student, navigate, studentCode]);

  useEffect(() => {
    const loadStudentStats = async () => {
      if (!studentCode) return;

      try {
        setIsLoading(true);
        console.log('📊 Chargement des stats de l\'élève:', studentCode);
        
        const airtableApi = (AirtableService as any).apiService;
        const studentsData = await airtableApi.fetchAllRecords('Élèves');
        
        // Trouver l'élève spécifique
        const targetStudent = studentsData.find((record: any) => {
          const fields = record.fields || record;
          return fields.code === studentCode || record.id === studentCode;
        });

        if (!targetStudent) {
          setError('Élève introuvable');
          return;
        }

        const fields = targetStudent.fields || targetStudent;
        const profile: StudentProfile = {
          id: targetStudent.id,
          name: fields.Nom || fields.Name || 'Nom non défini',
          email: fields['E-mail'] || fields.Email || 'Email non défini',
          age: fields['Âge'] || fields.Age || null,
          gender: fields.Sexe || fields.Gender || null,
          status: fields.Statut || fields.Status || 'Actif',
          initialWeight: fields['Poids Initial'] || fields.InitialWeight || null,
          targetWeight: fields['Poids Cible'] || fields.TargetWeight || null,
          height: fields['Taille (cm)'] || fields.Height || null,
          objectives: fields.Objectifs || fields.Objectives || '',
          diet: fields['Régime Alimentaire'] || fields.Diet || null,
          activityLevel: fields['Niveau d\'Activité'] || fields.ActivityLevel || null,
          motivation: fields.Motivation || null,
        };

        // Calculer les statistiques
        const calculatedStats = calculateStudentStats(profile);
        setStudentStats(calculatedStats);
        setError(null);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des stats:', error);
        setError('Impossible de charger les statistiques de l\'élève');
      } finally {
        setIsLoading(false);
      }
    };

    loadStudentStats();
  }, [studentCode]);

  const calculateStudentStats = (profile: StudentProfile): StudentStatsData => {
    // Calcul IMC
    let bmi: number | undefined;
    let bmiCategory = 'Non calculable';
    
    if (profile.height && profile.initialWeight) {
      bmi = profile.initialWeight / Math.pow(profile.height / 100, 2);
      if (bmi < 18.5) bmiCategory = 'Sous-poids';
      else if (bmi < 25) bmiCategory = 'Normal';
      else if (bmi < 30) bmiCategory = 'Surpoids';
      else bmiCategory = 'Obésité';
    }

    // Poids à perdre/gagner
    const weightToLose = profile.initialWeight && profile.targetWeight ? 
      profile.initialWeight - profile.targetWeight : undefined;

    // Progression simulée (en %)
    const weightProgress = weightToLose ? Math.min(100, Math.max(0, Math.random() * 60 + 20)) : 0;

    // Jours actifs simulés
    const daysActive = Math.floor(Math.random() * 25) + 5;

    // Progression mensuelle simulée
    const monthlyProgress = [
      { month: 'Jan', weight: profile.initialWeight || 70, target: profile.targetWeight || 65 },
      { month: 'Fév', weight: (profile.initialWeight || 70) - 1, target: profile.targetWeight || 65 },
      { month: 'Mar', weight: (profile.initialWeight || 70) - 2, target: profile.targetWeight || 65 },
      { month: 'Avr', weight: (profile.initialWeight || 70) - 3, target: profile.targetWeight || 65 },
      { month: 'Mai', weight: (profile.initialWeight || 70) - 4, target: profile.targetWeight || 65 }
    ];

    // Stats nutritionnelles simulées
    const nutritionStats = [
      { category: 'Protéines', value: 25, color: '#3b82f6' },
      { category: 'Glucides', value: 45, color: '#10b981' },
      { category: 'Lipides', value: 30, color: '#f59e0b' }
    ];

    return {
      profile,
      bmi,
      bmiCategory,
      weightToLose,
      weightProgress,
      daysActive,
      monthlyProgress,
      nutritionStats
    };
  };

  const getStatusBadge = (status: string = 'Actif') => {
    const config = {
      'Actif': 'bg-green-100 text-green-700 border-green-200',
      'Pause': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Inactif': 'bg-red-100 text-red-700 border-red-200',
    };
    return config[status as keyof typeof config] || config['Actif'];
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
        {/* Header avec bouton retour */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/stats')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux Statistiques
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="h-8 w-8 text-cyan-500" />
              <h1 className="text-3xl font-bold">
                Statistiques de {studentStats?.profile.name || 'Élève'}
              </h1>
              <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Analyses détaillées et progression individuelle
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            <span className="ml-2">Chargement des statistiques...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">
            <p className="font-medium">Erreur</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : !studentStats ? (
          <div className="text-center py-12 text-muted-foreground">
            Aucune donnée disponible
          </div>
        ) : (
          <div className="space-y-6">
            {/* Informations de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Statut</p>
                      <Badge className={getStatusBadge(studentStats.profile.status)}>
                        {studentStats.profile.status || 'Actif'}
                      </Badge>
                    </div>
                    <User className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">IMC</p>
                      <p className="text-2xl font-bold">
                        {studentStats.bmi ? studentStats.bmi.toFixed(1) : '-'}
                      </p>
                      <p className="text-xs text-muted-foreground">{studentStats.bmiCategory}</p>
                    </div>
                    <Weight className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Progression</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {studentStats.weightProgress.toFixed(0)}%
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Jours Actifs</p>
                      <p className="text-2xl font-bold text-orange-600">{studentStats.daysActive}</p>
                    </div>
                    <Activity className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Évolution du poids */}
              <Card>
                <CardHeader>
                  <CardTitle>Évolution du Poids</CardTitle>
                  <CardDescription>Progression vers l'objectif</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={studentStats.monthlyProgress}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} name="Poids actuel" />
                      <Line type="monotone" dataKey="target" stroke="#ef4444" strokeDasharray="5 5" name="Objectif" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Répartition nutritionnelle */}
              <Card>
                <CardHeader>
                  <CardTitle>Répartition Nutritionnelle</CardTitle>
                  <CardDescription>Distribution des macronutriments</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={studentStats.nutritionStats}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ category, value }) => `${category}: ${value}%`}
                      >
                        {studentStats.nutritionStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Informations détaillées */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations Personnelles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Âge</p>
                      <p className="font-medium">{studentStats.profile.age ? `${studentStats.profile.age} ans` : '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Genre</p>
                      <p className="font-medium">{studentStats.profile.gender || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Poids initial</p>
                      <p className="font-medium">{studentStats.profile.initialWeight ? `${studentStats.profile.initialWeight} kg` : '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Objectif poids</p>
                      <p className="font-medium">{studentStats.profile.targetWeight ? `${studentStats.profile.targetWeight} kg` : '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Objectifs & Motivation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Objectifs</p>
                    <p className="font-medium">{studentStats.profile.objectives || 'Aucun objectif défini'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Niveau d'activité</p>
                    <p className="font-medium">{studentStats.profile.activityLevel || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Motivation</p>
                    <p className="font-medium">{studentStats.profile.motivation || 'Non spécifiée'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </motion.div>
    </Layout>
  );
};

export default StudentStats;