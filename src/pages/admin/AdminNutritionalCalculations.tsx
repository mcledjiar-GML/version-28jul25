import React, { useState, useEffect } from 'react';
import { Calculator, Activity, Target, Users, Search, TrendingUp, Zap, Utensils, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { airtableService } from '../../services/airtable/airtableService';
import { Student } from '../../services/types/airtable.types';

const AdminNutritionalCalculations: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const allStudents = await airtableService.getStudents();
        setStudents(allStudents);
        if (allStudents.length > 0) {
          setSelectedStudent(allStudents[0]);
        }
      } catch (err) {
        setError('Erreur lors du chargement des élèves');
        console.error('Error fetching students:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Filtrer les élèves pour la recherche
  const filteredStudents = students.filter(student =>
    student.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.profession && student.profession.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculs nutritionnels
  const calculateBMR = (student: Student) => {
    if (!student.age || !student.poids_actuel || !student.taille) return 0;
    
    // Formule de Harris-Benedict
    if (student.sexe === 'Femme') {
      return 655 + (9.6 * student.poids_actuel) + (1.8 * student.taille) - (4.7 * student.age);
    } else {
      return 66 + (13.7 * student.poids_actuel) + (5 * student.taille) - (6.8 * student.age);
    }
  };

  const calculateTDEE = (bmr: number, activityLevel: string = 'Modérée') => {
    const multipliers = {
      'Sédentaire': 1.2,
      'Légère': 1.375,
      'Modérée': 1.55,
      'Intense': 1.725,
      'Très intense': 1.9
    };
    return bmr * (multipliers[activityLevel as keyof typeof multipliers] || 1.55);
  };

  const calculateMacros = (calories: number, goal: string = 'Maintien') => {
    let proteinRatio, carbRatio, fatRatio;
    
    switch (goal) {
      case 'Perte de poids':
        proteinRatio = 0.35; carbRatio = 0.30; fatRatio = 0.35;
        break;
      case 'Prise de masse':
        proteinRatio = 0.25; carbRatio = 0.45; fatRatio = 0.30;
        break;
      default:
        proteinRatio = 0.30; carbRatio = 0.40; fatRatio = 0.30;
    }

    return {
      protein: Math.round((calories * proteinRatio) / 4),
      carbs: Math.round((calories * carbRatio) / 4),
      fat: Math.round((calories * fatRatio) / 9)
    };
  };

  // Statistiques globales
  const globalStats = {
    totalStudents: students.length,
    avgBMR: students.length > 0 ? Math.round(students.reduce((sum, s) => sum + calculateBMR(s), 0) / students.length) : 0,
    avgTDEE: students.length > 0 ? Math.round(students.reduce((sum, s) => sum + calculateTDEE(calculateBMR(s)), 0) / students.length) : 0,
    mostCommonGoal: students.reduce((acc, s) => {
      acc[s.objectif_physique || 'Non défini'] = (acc[s.objectif_physique || 'Non défini'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  const renderStudentCalculations = (student: Student) => {
    const bmr = calculateBMR(student);
    const tdee = calculateTDEE(bmr);
    const goalCalories = student.objectif_physique === 'Perte de poids' ? tdee - 300 : 
                        student.objectif_physique === 'Prise de masse' ? tdee + 300 : tdee;
    const macros = calculateMacros(goalCalories, student.objectif_physique);

    return (
      <div className="space-y-6">
        {/* Calculs de base */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">BMR (Métabolisme de base)</p>
                <p className="text-2xl font-bold">{Math.round(bmr)} kcal</p>
                <p className="text-blue-100 text-xs mt-1">Calories au repos</p>
              </div>
              <Zap className="h-8 w-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">TDEE (Besoins totaux)</p>
                <p className="text-2xl font-bold">{Math.round(tdee)} kcal</p>
                <p className="text-green-100 text-xs mt-1">Avec activité physique</p>
              </div>
              <Activity className="h-8 w-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Objectif calorique</p>
                <p className="text-2xl font-bold">{Math.round(goalCalories)} kcal</p>
                <p className="text-purple-100 text-xs mt-1">{student.objectif_physique || 'Maintien'}</p>
              </div>
              <Target className="h-8 w-8 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Répartition des macronutriments */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <Utensils className="h-6 w-6 text-orange-500 mr-2" />
            Répartition des Macronutriments
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-red-600">{macros.protein}g</span>
              </div>
              <h4 className="font-semibold text-gray-800">Protéines</h4>
              <p className="text-sm text-gray-600">{Math.round((macros.protein * 4 / goalCalories) * 100)}% des calories</p>
              <p className="text-xs text-gray-500 mt-1">4 kcal/g</p>
            </div>

            <div className="text-center">
              <div className="bg-yellow-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-yellow-600">{macros.carbs}g</span>
              </div>
              <h4 className="font-semibold text-gray-800">Glucides</h4>
              <p className="text-sm text-gray-600">{Math.round((macros.carbs * 4 / goalCalories) * 100)}% des calories</p>
              <p className="text-xs text-gray-500 mt-1">4 kcal/g</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-green-600">{macros.fat}g</span>
              </div>
              <h4 className="font-semibold text-gray-800">Lipides</h4>
              <p className="text-sm text-gray-600">{Math.round((macros.fat * 9 / goalCalories) * 100)}% des calories</p>
              <p className="text-xs text-gray-500 mt-1">9 kcal/g</p>
            </div>
          </div>
        </div>

        {/* Recommandations */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Recommandations Personnalisées</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>• <strong>Hydratation :</strong> {Math.round(student.poids_actuel * 35)}ml d'eau par jour</p>
            <p>• <strong>Repas :</strong> Répartir en {student.nombre_repas || 3} repas + collations</p>
            <p>• <strong>Timing :</strong> Consommer des protéines à chaque repas</p>
            {student.objectif_physique === 'Perte de poids' && (
              <p>• <strong>Déficit :</strong> -300 kcal/jour pour une perte progressive</p>
            )}
            {student.objectif_physique === 'Prise de masse' && (
              <p>• <strong>Surplus :</strong> +300 kcal/jour pour une prise de masse contrôlée</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des calculs nutritionnels...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="mr-4 p-2 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <Calculator className="h-8 w-8 text-purple-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">
              Calculs Nutritionnels - Administration
            </h1>
            <span className="ml-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Admin
            </span>
          </div>
          <p className="text-gray-600">
            Gérez les calculs nutritionnels de tous vos élèves
          </p>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Élèves</p>
                <p className="text-2xl font-bold text-gray-800">{globalStats.totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">BMR Moyen</p>
                <p className="text-2xl font-bold text-gray-800">{globalStats.avgBMR}</p>
                <p className="text-xs text-gray-500">kcal/jour</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">TDEE Moyen</p>
                <p className="text-2xl font-bold text-gray-800">{globalStats.avgTDEE}</p>
                <p className="text-xs text-gray-500">kcal/jour</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Objectif Principal</p>
                <p className="text-lg font-bold text-gray-800">
                  {Object.entries(globalStats.mostCommonGoal).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Sélecteur d'élève et recherche */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Rechercher un élève..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex-1">
              <select
                value={selectedStudent?.id || ''}
                onChange={(e) => {
                  const student = students.find(s => s.id === e.target.value);
                  setSelectedStudent(student || null);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Sélectionner un élève</option>
                {filteredStudents.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.prenom} {student.nom} - {student.objectif_physique || 'Pas d\'objectif'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Affichage des calculs */}
        {selectedStudent ? (
          <div>
            <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="bg-purple-100 rounded-full p-2 mr-3">
                  <Users className="h-5 w-5 text-purple-600" />
                </span>
                Calculs pour {selectedStudent.prenom} {selectedStudent.nom}
                <span className="ml-3 text-sm font-normal text-gray-500">
                  ({selectedStudent.age} ans, {selectedStudent.sexe}, {selectedStudent.profession})
                </span>
              </h2>
            </div>
            {renderStudentCalculations(selectedStudent)}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Calculator className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Sélectionnez un élève
            </h3>
            <p className="text-gray-600">
              Choisissez un élève dans la liste pour voir ses calculs nutritionnels
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNutritionalCalculations;