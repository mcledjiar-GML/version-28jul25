import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStudent } from '../../context/StudentContext';
import Layout from '../../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Search, 
  Filter, 
  Eye,
  Mail,
  Calendar,
  Activity,
  TrendingUp,
  Shield,
  User
} from 'lucide-react';
import AirtableService from '../../services/AirtableService';

interface StudentData {
  id: string;
  name: string;
  email: string;
  code: string;
  status?: string;
  profession?: string;
  lastActive?: string;
  objectives?: string;
  age?: number;
  initialWeight?: number;
  targetWeight?: number;
}

const AdminStudents = () => {
  const { student } = useStudent();
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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

  // Charger les données des élèves
  useEffect(() => {
    const loadStudents = async () => {
      try {
        setIsLoading(true);
        console.log('🔍 Chargement des élèves depuis Airtable...');
        
        // Utiliser le service Airtable pour récupérer les élèves
        const airtableApi = (AirtableService as any).apiService;
        const studentsData = await airtableApi.fetchAllRecords('Élèves');
        
        console.log('📊 Données brutes reçues:', studentsData);
        
        // Transformer les données
        const transformedStudents: StudentData[] = studentsData.map((record: any) => {
          const fields = record.fields || record;
          return {
            id: record.id,
            name: fields.Nom || fields.Name || fields.name || 'Nom non défini',
            email: fields['E-mail'] || fields.Email || fields.email || 'Email non défini',
            code: fields.code || record.id,
            status: fields.Statut || fields.Status || 'Actif',
            profession: fields.Profession || fields.profession || '',
            objectives: fields.Objectifs || fields.objectives || '',
            age: fields['Âge'] || fields.Age || fields.age || null,
            initialWeight: fields['Poids Initial'] || fields['Initial Weight'] || null,
            targetWeight: fields['Poids Cible'] || fields['Target Weight'] || null,
            lastActive: new Date().toLocaleDateString('fr-FR') // Placeholder
          };
        });

        console.log('✅ Élèves transformés:', transformedStudents);
        setStudents(transformedStudents);
        setFilteredStudents(transformedStudents);
        setError(null);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des élèves:', error);
        setError('Impossible de charger les données des élèves');
      } finally {
        setIsLoading(false);
      }
    };

    if (student?.isAdmin) {
      loadStudents();
    }
  }, [student]);

  // Filtrer les élèves selon la recherche
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(
        (student) =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (student.profession && student.profession.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredStudents(filtered);
    }
  }, [searchTerm, students]);

  const handleViewStudent = (studentData: StudentData) => {
    // Naviguer vers le profil de l'élève avec son code d'accès
    navigate('/profile', { state: { studentCode: studentData.code, isAdminView: true } });
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
              <Users className="h-8 w-8 text-indigo-500" />
              <h1 className="text-3xl font-bold">Gestion des Élèves</h1>
              <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Vue d'ensemble de tous vos élèves et de leurs informations
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredStudents.length} élève(s) {students.length !== filteredStudents.length && `sur ${students.length}`}
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Élèves</p>
                  <p className="text-2xl font-bold">{students.length}</p>
                </div>
                <User className="h-6 w-6 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Actifs</p>
                  <p className="text-2xl font-bold text-green-600">
                    {students.filter(s => s.status === 'Actif').length}
                  </p>
                </div>
                <Activity className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">En Pause</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {students.filter(s => s.status === 'Pause').length}
                  </p>
                </div>
                <Calendar className="h-6 w-6 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avec Objectifs</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {students.filter(s => s.objectives && s.objectives.trim() !== '').length}
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recherche */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email, code d'accès ou profession..."
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

        {/* Tableau des élèves */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Élèves</CardTitle>
            <CardDescription>
              Informations détaillées sur chaque élève inscrit
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                <span className="ml-2">Chargement des élèves...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                <p className="font-medium">Erreur</p>
                <p className="text-sm">{error}</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'Aucun élève trouvé pour cette recherche' : 'Aucun élève trouvé'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Code d'accès</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Profession</TableHead>
                      <TableHead>Âge</TableHead>
                      <TableHead>Poids Initial</TableHead>
                      <TableHead>Objectif</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((studentData) => (
                      <TableRow key={studentData.id}>
                        <TableCell className="font-medium">{studentData.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{studentData.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {studentData.code}
                          </code>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(studentData.status)}
                        </TableCell>
                        <TableCell>{studentData.profession || '-'}</TableCell>
                        <TableCell>{studentData.age ? `${studentData.age} ans` : '-'}</TableCell>
                        <TableCell>{studentData.initialWeight ? `${studentData.initialWeight} kg` : '-'}</TableCell>
                        <TableCell className="max-w-xs truncate" title={studentData.objectives}>
                          {studentData.objectives || '-'}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewStudent(studentData)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Voir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
};

export default AdminStudents;