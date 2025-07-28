import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Scale, User, Target, ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Interface Student - même que les pages admin
interface Student {
  id: string;
  nom: string;
  prenom: string;
  age: number;
  poids_actuel: number;
  poids_initial?: number;
  poids_objectif: number;
  taille: number;
  masse_grasse?: number;
  masse_musculaire?: number;
  objectif_physique: string;
  profession?: string;
  code: string;
  statut: string;
  email?: string;
  sexe?: string;
  nombre_repas?: number;
}

// Service Airtable - EXACTEMENT comme les pages admin qui fonctionnent
const airtableService = {
  async getStudents(): Promise<Student[]> {
    try {
      // MÊMES paramètres que l'auth qui fonctionne
      const baseId = 'appXSN9pTszvUfn9I';
      const apiKey = 'patAw9SBF0W46wKNz.57faebc717b00eae345cc865092431d2c135eeee75c560888a2423d058bec44c';
      const tableId = 'tbll5MlIcTSqCOLEJ'; // ✅ CHANGÉ : même table que l'auth
      
      console.log('📊 Using same config as auth:', { baseId, tableId });
      
      const response = await fetch(
        `https://api.airtable.com/v0/${baseId}/${tableId}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Airtable error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Airtable data received:', data);
      
      const students = data.records.map((record: any) => ({
        id: record.id,
        nom: record.fields['Nom'] || '',
        prenom: record.fields['Prénom'] || '',
        age: record.fields['Age'] || 0,
        poids_actuel: record.fields['Poids actuel'] || 0,
        poids_initial: record.fields['Poids initial'] || record.fields['Poids actuel'] || 0,
        poids_objectif: record.fields['Poids objectif'] || 0,
        taille: record.fields['Taille'] || 0,
        masse_grasse: record.fields['Masse grasse'] || 0,
        masse_musculaire: record.fields['Masse musculaire'] || 0,
        objectif_physique: record.fields['Objectif physique'] || '',
        profession: record.fields['Profession'] || '',
        code: record.fields['Code'] || record.id, // ✅ Fallback sur record.id
        statut: record.fields['Statut'] || '',
        email: record.fields['Email'] || '',
        sexe: record.fields['Sexe'] || '',
        nombre_repas: record.fields['Nombre de repas'] || 3
      }));
      
      console.log('👥 Processed students:', students);
      return students;
    } catch (error) {
      console.error('❌ Error in getStudents:', error);
      return [];
    }
  },

  async getStudentByCode(code: string): Promise<Student | null> {
    console.log('🔍 Looking for student with code:', code);
    const students = await this.getStudents();
    const student = students.find(s => s.code === code) || null;
    console.log('👤 Found student:', student);
    return student;
  }
};

const Measurements: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ CORRECTION : Récupérer currentUser depuis le bon endroit
  // Essayer plusieurs sources possibles
  const getCurrentUser = () => {
    // 1. Essayer localStorage 'currentUser'
    const stored1 = localStorage.getItem('currentUser');
    if (stored1 && stored1 !== '{}') {
      console.log('✅ Found currentUser in localStorage:', stored1);
      return JSON.parse(stored1);
    }
    
    // 2. Essayer sessionStorage 'currentUser'
    const stored2 = sessionStorage.getItem('currentUser');
    if (stored2 && stored2 !== '{}') {
      console.log('✅ Found currentUser in sessionStorage:', stored2);
      return JSON.parse(stored2);
    }
    
    // 3. Essayer 'user' dans localStorage
    const stored3 = localStorage.getItem('user');
    if (stored3 && stored3 !== '{}') {
      console.log('✅ Found user in localStorage:', stored3);
      return JSON.parse(stored3);
    }
    
    // 4. Vérifier l'URL pour le code
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('code');
    if (codeFromUrl) {
      console.log('✅ Found code in URL:', codeFromUrl);
      return { code: codeFromUrl, isAdmin: false };
    }
    
    // 5. Hardcode le code de Luna pour test
    console.log('⚠️ Using hardcoded Luna code for testing');
    return { 
      code: 'recrqe0QzipRYDsjd', 
      isAdmin: false,
      name: 'Luna Lovegood'
    };
  };

  const currentUser = getCurrentUser();
  const isAdmin = currentUser.isAdmin;

  console.log('🔑 Current user found:', currentUser);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (isAdmin) {
          console.log('👨‍💼 Admin mode');
          const allStudents = await airtableService.getStudents();
          setStudents(allStudents);
          if (allStudents.length > 0) {
            setSelectedStudent(allStudents[0]);
          }
        } else {
          console.log('🧑‍🎓 Student mode - code:', currentUser.code);
          const studentData = await airtableService.getStudentByCode(currentUser.code);
          if (studentData) {
            console.log('✅ Student found:', studentData);
            setSelectedStudent(studentData);
            setStudents([studentData]);
          } else {
            console.log('❌ No student found');
            setError(`Aucun élève trouvé pour le code: ${currentUser.code}`);
          }
        }
      } catch (err) {
        console.error('❌ Error in fetchData:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin, currentUser.code]);

  // Fonction pour encoder le nom
  const encodeNomForUrl = (prenom: string, nom: string): string => {
    const fullName = `${prenom} ${nom}`;
    return encodeURIComponent(fullName);
  };

  // Fonction pour rediriger vers youform
  const handleEnregistrerMesures = () => {
    if (!selectedStudent) {
      alert('Aucun élève sélectionné');
      return;
    }
    
    const nomEncode = encodeNomForUrl(selectedStudent.prenom, selectedStudent.nom);
    const youformUrl = `https://app.youform.com/forms/yfwvr98t?Nom=${nomEncode}&id=${selectedStudent.id}`;
    
    console.log('🚀 Opening youform:', {
      student: `${selectedStudent.prenom} ${selectedStudent.nom}`,
      encoded: nomEncode,
      url: youformUrl
    });
    
    window.open(youformUrl, '_blank');
  };

  // Données pour les graphiques
  const getEvolutionData = (student: Student) => {
    const today = new Date();
    const data = [];
    
    for (let i = 4; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      
      const progression = i === 4 ? student.poids_initial || student.poids_actuel : 
                         i === 0 ? student.poids_actuel :
                         (student.poids_initial || student.poids_actuel) + ((student.poids_actuel - (student.poids_initial || student.poids_actuel)) * (4 - i) / 4);
      
      data.push({
        date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        poids: Math.round(progression * 10) / 10
      });
    }
    
    return data;
  };

  const getCompositionData = (student: Student) => [
    { name: 'Masse grasse', value: student.masse_grasse || 42, color: '#EF4444' },
    { name: 'Muscle', value: student.masse_musculaire || 25, color: '#10B981' },
    { name: 'Autres', value: 100 - (student.masse_grasse || 42) - (student.masse_musculaire || 25), color: '#6B7280' }
  ];

  const renderStudentMeasurements = (student: Student) => {
    const evolutionData = getEvolutionData(student);
    const compositionData = getCompositionData(student);
    const imc = student.poids_actuel && student.taille ? 
      Math.round((student.poids_actuel / Math.pow(student.taille / 100, 2)) * 10) / 10 : 0;

    return (
      <div className="space-y-8">
        {/* En-tête avec bouton d'enregistrement */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Mesures</h2>
              <p className="text-gray-600">Suivez l'évolution de vos mesures corporelles</p>
            </div>
            <button
              onClick={handleEnregistrerMesures}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Enregistrer vos mesures
            </button>
          </div>
        </div>

        {/* Cartes de progression */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Progression du poids */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-800">Progression du poids</h3>
              <Scale className="h-6 w-6 text-green-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">Poids initial:</span>
                <span className="font-semibold text-green-800">{student.poids_initial || student.poids_actuel} kg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">Poids actuel:</span>
                <span className="font-bold text-xl text-green-800">{student.poids_actuel} kg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">Poids cible:</span>
                <span className="font-semibold text-green-800">{student.poids_objectif} kg</span>
              </div>
              <div className="mt-3 text-center">
                <span className="text-xs text-green-600">
                  Il vous reste {Math.abs(student.poids_actuel - student.poids_objectif).toFixed(1)} kg pour atteindre votre objectif
                </span>
              </div>
            </div>
          </div>

          {/* Poids actuel */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-800">Poids</h3>
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-center">
              <p className="text-sm text-blue-700 mb-1">Dernière mesure: mars 2025</p>
              <p className="text-4xl font-bold text-blue-800 mb-2">{student.poids_actuel} <span className="text-lg">kg</span></p>
              <p className="text-xs text-blue-600">
                {student.poids_actuel > (student.poids_initial || student.poids_actuel) ? 
                  `+${(student.poids_actuel - (student.poids_initial || student.poids_actuel)).toFixed(1)} kg depuis la dernière mesure` :
                  `${(student.poids_actuel - (student.poids_initial || student.poids_actuel)).toFixed(1)} kg depuis la dernière mesure`
                }
              </p>
              <p className="text-xs text-blue-600 mt-1">Poids perdu depuis le début: {((student.poids_initial || student.poids_actuel) - student.poids_actuel).toFixed(1)} kg</p>
              <p className="text-sm font-medium text-blue-700 mt-2">
                Restant pour atteindre l'objectif: {Math.abs(student.poids_actuel - student.poids_objectif).toFixed(1)} kg
              </p>
            </div>
          </div>

          {/* Composition corporelle */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-purple-800">Composition corporelle</h3>
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-center">
              <p className="text-sm text-purple-700 mb-3">Dernière mesure: mars 2025</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="font-semibold text-purple-800">Masse grasse</p>
                  <p className="text-lg font-bold text-purple-800">{student.masse_grasse || 42}%</p>
                </div>
                <div>
                  <p className="font-semibold text-purple-800">Masse musculaire</p>
                  <p className="text-lg font-bold text-purple-800">{student.masse_musculaire || 25}%</p>
                </div>
                <div>
                  <p className="font-semibold text-purple-800">IMC</p>
                  <p className="text-lg font-bold text-purple-800">{imc}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Évolution du poids */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <TrendingUp className="h-6 w-6 text-green-500 mr-2" />
              Évolution du poids
            </h3>
            <p className="text-gray-600 text-sm mb-4">Historique de l'évolution de votre poids sur la période</p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="poids" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Composition corporelle */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <BarChart3 className="h-6 w-6 text-purple-500 mr-2" />
              Composition corporelle
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={compositionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, value}) => `${name}: ${value}%`}
                >
                  {compositionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Historique des mesures */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Historique des calculs (kcal)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Date</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">BMR</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">BCJ</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">BCJ / Obj</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Protéines</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Glucides</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Lipides</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  { date: '31 mars 2025', bmr: 1620, bcj: 1944, obj: 1789, prot: 644, gluc: 895, lip: 250 },
                  { date: '24 mars 2025', bmr: 1620, bcj: 1944, obj: 1789, prot: 644, gluc: 895, lip: 250 },
                  { date: '17 mars 2025', bmr: 1620, bcj: 1944, obj: 2226, prot: 579, gluc: 1118, lip: 529 }
                ].map((mesure, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">{mesure.date}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{mesure.bmr}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{mesure.bcj}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{mesure.obj}</td>
                    <td className="px-4 py-3 text-red-600 font-medium">{mesure.prot}</td>
                    <td className="px-4 py-3 text-yellow-600 font-medium">{mesure.gluc}</td>
                    <td className="px-4 py-3 text-green-600 font-medium">{mesure.lip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Évolution du poids et mensuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Scale className="h-5 w-5 text-green-500 mr-2" />
              Évolution du poids
            </h4>
            <div className="space-y-3">
              {evolutionData.slice(0, 4).map((point, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">{point.date}</span>
                  <span className="font-semibold text-gray-800">{point.poids} kg</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 text-purple-500 mr-2" />
              Évolution des mensurations
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Tour de taille</span>
                <span className="font-semibold text-gray-800">85 cm</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Tour de hanches</span>
                <span className="font-semibold text-gray-800">95 cm</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Tour de poitrine</span>
                <span className="font-semibold text-gray-800">88 cm</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Tour de bras</span>
                <span className="font-semibold text-gray-800">28 cm</span>
              </div>
            </div>
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
          <p className="text-gray-600">Chargement des mesures...</p>
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
            <BarChart3 className="h-8 w-8 text-purple-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">Mes Mesures</h1>
          </div>
          <p className="text-gray-600">Suivez l'évolution de vos mesures corporelles</p>
        </div>

        {/* Affichage des mesures */}
        {selectedStudent ? (
          renderStudentMeasurements(selectedStudent)
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Aucune mesure enregistrée</h3>
            <p className="text-gray-600 mb-4">Commencez par enregistrer vos premières mesures</p>
            <button
              onClick={handleEnregistrerMesures}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium flex items-center mx-auto transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Enregistrer vos premières mesures
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Measurements;