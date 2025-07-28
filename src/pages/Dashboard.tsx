import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStudent } from '../context/StudentContext';
import { useIsMobile } from '../hooks/use-mobile';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Ruler, 
  Calculator, 
  Dumbbell, 
  Utensils, 
  Settings,
  LogOut,
  BookOpen,
  Users,
  BarChart3,
  Database,
  Shield
} from 'lucide-react';

const Dashboard = () => {
  const { student, logout, isAirtableConfigured } = useStudent();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (!student) {
      navigate('/');
    }
  }, [student, navigate]);

  if (!student) return null;

  // 🎯 Détecter si l'utilisateur est admin
  const isAdmin = student.isAdmin || false;
  
  // Menu pour les élèves normaux
  const studentMenuItems = [
    {
      title: 'Profil & Objectifs',
      description: 'Consultez votre fiche bilan et vos objectifs',
      icon: <FileText size={24} />,
      href: '/profile',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Mesures',
      description: 'Suivez l\'évolution de vos mesures corporelles',
      icon: <Ruler size={24} />,
      href: '/measurements',
      color: 'bg-green-500',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Calculs Nutritionnels',
      description: 'BMR, BCJ et macronutriments personnalisés',
      icon: <Calculator size={24} />,
      href: '/calculations',
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Entraînements',
      description: 'Accédez à vos programmes d\'entraînement',
      icon: <Dumbbell size={24} />,
      href: '/workouts',
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Plan Alimentaire',
      description: 'Suivez votre plan alimentaire personnalisé',
      icon: <Utensils size={24} />,
      href: '/nutrition',
      color: 'bg-red-500',
      bgColor: 'bg-red-50'
    },
    {
      title: 'eBooks',
      description: 'Accédez aux ressources exclusives',
      icon: <BookOpen size={24} />,
      href: '/ebooks',
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50'
    },
  ];

  // Menu pour l'admin/coach
  const adminMenuItems = [
    {
      title: 'Gestion des Élèves',
      description: 'Voir tous les élèves et leurs données',
      icon: <Users size={24} />,
      href: '/admin/students',
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Statistiques',
      description: 'Analyses et rapports de progression',
      icon: <BarChart3 size={24} />,
      href: '/admin/stats',
      color: 'bg-cyan-500',
      bgColor: 'bg-cyan-50'
    },
    {
      title: 'Configuration Airtable',
      description: 'Paramètres de la base de données',
      icon: <Database size={24} />,
      href: '/airtable-config',
      color: 'bg-gray-500',
      bgColor: 'bg-gray-50'
    },
    {
      title: 'Profils & Objectifs',
      description: 'Gestion des profils élèves',
      icon: <FileText size={24} />,
      href: '/profile',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Mesures Globales',
      description: 'Vue d\'ensemble des mesures',
      icon: <Ruler size={24} />,
      href: '/measurements',
      color: 'bg-green-500',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Calculs Nutritionnels',
      description: 'Outils de calcul pour tous',
      icon: <Calculator size={24} />,
      href: '/calculations',
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Programmes d\'Entraînement',
      description: 'Création et gestion des workouts',
      icon: <Dumbbell size={24} />,
      href: '/workouts',
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Plans Alimentaires',
      description: 'Gestion des régimes alimentaires',
      icon: <Utensils size={24} />,
      href: '/nutrition',
      color: 'bg-red-500',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Ressources eBooks',
      description: 'Gestion de la bibliothèque',
      icon: <BookOpen size={24} />,
      href: '/ebooks',
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50'
    },
  ];

  const menuItems = isAdmin ? adminMenuItems : studentMenuItems;

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">
                Bienvenue, {student.name}
              </h1>
              {isAdmin && (
                <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {isAdmin 
                ? 'Interface d\'administration - Gérez vos élèves et leurs données' 
                : 'Accédez à votre espace personnel pour suivre vos progrès'
              }
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>

        {!isAirtableConfigured && !isAdmin && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="font-medium text-yellow-800">Connectez votre base Airtable</p>
                <p className="text-sm text-yellow-700">
                  Configurez votre base Airtable pour accéder à vos données réelles
                </p>
              </div>
              <Button 
                className="bg-yellow-600 hover:bg-yellow-700 text-white w-full md:w-auto"
                onClick={() => navigate('/airtable-config')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurer Airtable
              </Button>
            </CardContent>
          </Card>
        )}
        
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`}>
          {menuItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card className={`h-full hover:shadow-md transition-shadow overflow-hidden animated-card ${item.bgColor} border-${item.color.split('-')[1]}-200`}>
                <CardHeader className="pb-2">
                  <div className={`w-12 h-12 rounded-lg ${item.color} flex items-center justify-center text-white mb-4`}>
                    {item.icon}
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button 
                    className={`w-full text-white bg-${item.color.split('-')[1]}-500 hover:bg-${item.color.split('-')[1]}-600`}
                    onClick={() => navigate(item.href)}
                  >
                    Accéder
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {isAdmin && (
          <motion.div 
            className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="font-semibold text-red-800 mb-2">🔑 Codes d'accès admin disponibles :</h3>
            <div className="flex flex-wrap gap-2 text-sm">
              <code className="bg-red-100 px-2 py-1 rounded">COACH_ADMIN_2025</code>
              <code className="bg-red-100 px-2 py-1 rounded">ADMIN_MC_LEJDIAR</code>
              <code className="bg-red-100 px-2 py-1 rounded">SUPER_COACH_ACCESS</code>
            </div>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
};

export default Dashboard;