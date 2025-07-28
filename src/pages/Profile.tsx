import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStudent } from '../context/StudentContext';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Mail, 
  Calendar, 
  Briefcase, 
  Target, 
  Activity,
  Users,
  Search,
  Shield,
  Weight,
  Ruler,
  Utensils,
  Heart
} from 'lucide-react';
import AirtableService from '../services/AirtableService';

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  age?: number;
  gender?: string;
  profession?: string;
  birthDate?: string;
  status?: string;
  // Objectifs physiques
  initialWeight?: number;
  targetWeight?: number;
  height?: number;
  objectives?: string;
  // Profil alimentaire
  diet?: string;
  eatingHabits?: string;
  mealFrequency?: string;
  // Activité
  activityLevel?: string;
  medicalHistory?: string;
  motivation?: string;
}

const Profile = () => {
  const { student } = useStudent();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<StudentProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!student) {
      navigate('/');
    }
  }, [student, navigate]);

  // Charger les profils des élèves si admin
  useEffect(() => {
    if (student?.isAdmin) {
      loadAllProfiles();
    }
  }, [student]);

  // Filtrer les profils selon la recherche
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredProfiles(profiles);
    } else {
      const filtered = profiles.filter(
        (profile) =>
          profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (profile.profession && profile.profession.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (profile.objectives && profile.objectives.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredProfiles(filtered);
    }
  }, [searchTerm, profiles]);

  const loadAllProfiles = async () => {
    try {
      setIsLoading(true);
      console.log('👥 Chargement de tous les profils élèves...');
      
      const airtableApi = (AirtableService as any).apiService;
      const studentsData = await airtableApi.fetchAllRecords('Élèves');
      
      const transformedProfiles: StudentProfile[] = studentsData.map((record: any) => {
        const fields = record.fields || record;
        return {
          id: record.id,
          name: fields.Nom || fields.Name || 'Nom non défini',
          email: fields['E-mail'] || fields.Email || 'Email non défini',
          age: fields['Âge'] || fields.Age || null,
          gender: fields.Sexe || fields.Gender || null,
          profession: fields.Profession || null,
          birthDate: fields['Date de naissance'] || fields.BirthDate || null,
          status: fields.Statut || fields.Status || 'Actif',
          // Objectifs physiques
          initialWeight: fields['Poids Initial'] || fields.InitialWeight || null,
          targetWeight: fields['Poids Cible'] || fields.TargetWeight || null,
          height: fields['Taille (cm)'] || fields.Height || null,
          objectives: fields.Objectifs || fields.Objectives || '',
          // Profil alimentaire
          diet: fields['Régime Alimentaire'] || fields.Diet || null,
          eatingHabits: fields['Habitudes Alimentaires Spécifiques'] || fields.EatingHabits || null,
          mealFrequency: fields['Fréquence de Repas'] || fields.MealFrequency || null,
          // Activité
          activityLevel: fields['Niveau d\'Activité'] || fields.ActivityLevel || null,
          medicalHistory: fields['Antécédents Médicaux & Sportifs'] || fields.MedicalHistory || null,
          motivation: fields.Motivation || null,
        };
      });

      setProfiles(transformedProfiles);
      setFilteredProfiles(transformedProfiles);
      setError(null);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des profils:', error);
      setError('Impossible de charger les profils des élèves');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string = 'Actif') => {
    const config = {
      'Actif': 'bg-green-100 text-green-700 border-green-200',
      'Pause': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Inactif': 'bg-red-100 text-red-700 border-red-200',
    };
    return config[status as keyof typeof config] || config['Actif'];
  };

  const calculateAge = (birthDate: string): number | null => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (!student) return null;

  // Vue élève : afficher son propre profil
  if (!student.isAdmin) {
    return (
      <Layout>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Profil & Objectifs</h1>
            <p className="text-muted-foreground">
              Consultez votre fiche bilan et vos objectifs
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informations Personnelles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-500" />
                  Informations Personnelles
                </CardTitle>
                <Badge className={getStatusBadge(student.status || 'Actif')}>
                  {student.status || 'Actif'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-center">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600">
                      {student.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Nom</p>
                    <p className="font-medium">{student.name}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{student.email}</p>
                  </div>
                  
                  {student.age && (
                    <div>
                      <p className="text-sm text-muted-foreground">Âge</p>
                      <p className="font-medium">{student.age} ans</p>
                    </div>
                  )}
                  
                  {student.gender && (
                    <div>
                      <p className="text-sm text-muted-foreground">Sexe</p>
                      <p className="font-medium">{student.gender}</p>
                    </div>
                  )}
                  
                  {student.birthDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">Date de naissance</p>
                      <p className="font-medium">{new Date(student.birthDate).toLocaleDateString('fr-FR')}</p>
                    </div>
                  )}
                  
                  {student.profession && (
                    <div>
                      <p className="text-sm text-muted-foreground">Profession</p>
                      <p className="font-medium">{student.profession}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Objectifs Physiques */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-blue-500" />
                  Objectifs Physiques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Poids initial</p>
                    <p className="text-xl font-bold">{student.initialWeight ? `${student.initialWeight} kg` : '- kg'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Poids cible</p>
                    <p className="text-xl font-bold">{student.targetWeight ? `${student.targetWeight} kg` : '- kg'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Taille</p>
                    <p className="text-xl font-bold">{student.height ? `${student.height} cm` : '- cm'}</p>
                  </div>
                </div>
                
                {student.objectives && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Objectif principal</p>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {student.objectives}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profil Alimentaire */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Utensils className="h-5 w-5 mr-2 text-green-500" />
                  Profil Alimentaire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Régime alimentaire</p>
                    <p className="font-medium">{student.diet || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fréquence de repas</p>
                    <p className="font-medium">{student.mealFrequency || '-'}</p>
                  </div>
                </div>
                
                {student.eatingHabits && (
                  <div>
                    <p className="text-sm text-muted-foreground">Habitudes alimentaires</p>
                    <p className="font-medium">{student.eatingHabits}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activité */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-orange-500" />
                  Activité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {student.activityLevel && (
                  <div>
                    <p className="text-sm text-muted-foreground">Niveau d'activité</p>
                    <p className="font-medium">{student.activityLevel}</p>
                  </div>
                )}
                
                {student.medicalHistory && (
                  <div>
                    <p className="text-sm text-muted-foreground">Antécédents médicaux & sportifs</p>
                    <p className="font-medium">{student.medicalHistory}</p>
                  </div>
                )}
                
                {student.motivation && (
                  <div>
                    <p className="text-sm text-muted-foreground">Motivation</p>
                    <p className="font-medium">{student.motivation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </Layout>
    );
  }

  // Vue admin : afficher tous les profils d'élèves
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header Admin */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-8 w-8 text-blue-500" />
              <h1 className="text-3xl font-bold">Profils & Objectifs</h1>
              <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Gestion des profils et objectifs de tous vos élèves
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredProfiles.length} profil(s) {profiles.length !== filteredProfiles.length && `sur ${profiles.length}`}
          </div>
        </div>

        {/* Recherche */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, profession ou objectif..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              {searchTerm && (
                <Button variant="outline" size="sm" onClick={() => setSearchTerm('')}>
                  Effacer
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profils des élèves */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Chargement des profils...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">
            <p className="font-medium">Erreur</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchTerm ? 'Aucun profil trouvé pour cette recherche' : 'Aucun profil trouvé'}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProfiles.map((profile) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">
                            {profile.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <CardTitle className="text-lg">{profile.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{profile.profession || 'Profession non spécifiée'}</p>
                        </div>
                      </div>
                      <Badge className={getStatusBadge(profile.status)}>
                        {profile.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Infos de base */}
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Mail className="h-3 w-3 mr-2 text-muted-foreground" />
                        <span className="truncate">{profile.email}</span>
                      </div>
                      {profile.age && (
                        <div className="flex items-center text-sm">
                          <Calendar className="h-3 w-3 mr-2 text-muted-foreground" />
                          <span>{profile.age} ans</span>
                        </div>
                      )}
                    </div>

                    {/* Objectifs physiques */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-2 flex items-center">
                        <Target className="h-3 w-3 mr-1" />
                        Objectifs Physiques
                      </h4>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <p className="text-muted-foreground">Initial</p>
                          <p className="font-medium">{profile.initialWeight ? `${profile.initialWeight}kg` : '-'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Cible</p>
                          <p className="font-medium">{profile.targetWeight ? `${profile.targetWeight}kg` : '-'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Taille</p>
                          <p className="font-medium">{profile.height ? `${profile.height}cm` : '-'}</p>
                        </div>
                      </div>
                      {profile.objectives && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs bg-white">
                            {profile.objectives}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Profil alimentaire & activité */}
                    <div className="space-y-2 text-sm">
                      {profile.diet && (
                        <div className="flex items-center">
                          <Utensils className="h-3 w-3 mr-2 text-green-500" />
                          <span>{profile.diet}</span>
                        </div>
                      )}
                      {profile.activityLevel && (
                        <div className="flex items-center">
                          <Activity className="h-3 w-3 mr-2 text-orange-500" />
                          <span>{profile.activityLevel}</span>
                        </div>
                      )}
                      {profile.motivation && (
                        <div className="flex items-center">
                          <Heart className="h-3 w-3 mr-2 text-red-500" />
                          <span className="truncate">{profile.motivation}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </Layout>
  );
};

export default Profile;