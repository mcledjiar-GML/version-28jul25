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
  const [selectedWeek, setSelectedWeek] = useState('');
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
    
    // Initialiser la semaine actuelle
    const getCurrentWeek = () => {
      const now = new Date();
      const year = now.getFullYear();
      const week = Math.ceil(((now.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7);
      return `${year}-W${String(week).padStart(2, '0')}`;
    };
    setSelectedWeek(getCurrentWeek());
  }, []);

  // Filtrer les élèves pour la recherche
  const filteredStudents = students.filter(student =>
    student.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.profession && student.profession.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

        {/* Section TEST - Semaine à Calculer */}
        <div className="bg-red-100 border-2 border-red-500 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-red-800 mb-4">🔴 SECTION TEST - SEMAINE À CALCULER</h2>
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Calculator className="h-5 w-5 text-purple-600 mr-2" />
              Semaine à Calculer
            </h3>
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner la semaine
                </label>
                <input
                  type="week"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1 md:flex-none">
                <button
                  onClick={() => {
                    console.log('TEST: Bouton cliqué!');
                    alert(`Semaine sélectionnée: ${selectedWeek}`);
                  }}
                  className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center justify-center"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  🚀 TEST - Lancer le Calcul
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              SECTION TEST: Sélectionnez la semaine pour les calculs.
              {selectedWeek && (
                <span className="font-medium text-purple-600 ml-2">
                  Semaine sélectionnée: {selectedWeek}
                </span>
              )}
            </p>
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

        {/* Message de test */}
        <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-4 mb-8">
          <p className="text-yellow-800 font-medium">
            🧪 Fichier de test créé. Si vous voyez cette section, les modifications fonctionnent !
          </p>
        </div>

      </div>
    </div>
  );
};

export default AdminNutritionalCalculations;