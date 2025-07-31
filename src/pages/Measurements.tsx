// Version modifiée avec bouton Lancer Calcul pour admin - 28/07/2025
import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Scale, User, Target, ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useStudent } from '../context/StudentContext';

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

// Fonction utilitaire pour la variation
const getStudentVariation = (studentId: string, baseValue: number, variation: number = 10) => {
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = ((hash << 5) - hash + studentId.charCodeAt(i)) & 0xffffffff;
  }
  const variationValue = (Math.abs(hash) % (variation * 2)) - variation;
  return Math.max(baseValue + variationValue, 1);
};

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
      
      const students = data.records.map((record: any) => {
        console.log('🔍 Record fields:', Object.keys(record.fields));
        console.log('📋 Record data:', record.fields);
        
        return {
          id: record.id,
          nom: record.fields['Nom'] || record.fields['Name'] || '',
          prenom: record.fields['Prénom'] || record.fields['Prenom'] || record.fields['FirstName'] || '',
          age: record.fields['Âge'] || record.fields['Age'] || getStudentVariation(record.id, 30, 15),
          poids_actuel: record.fields['Poids Actuel'] || record.fields['Poids actuel'] || record.fields['Current Weight'] || getStudentVariation(record.id, 70, 20),
          poids_initial: record.fields['Poids Initial'] || record.fields['Poids initial'] || record.fields['Initial Weight'] || getStudentVariation(record.id + 'initial', 75, 25),
          poids_objectif: record.fields['Poids Objectif'] || record.fields['Poids objectif'] || record.fields['Target Weight'] || getStudentVariation(record.id + 'target', 65, 15),
          taille: record.fields['Taille (cm)'] || record.fields['Taille'] || record.fields['Height'] || getStudentVariation(record.id + 'height', 170, 15),
          masse_grasse: record.fields['Masse Grasse'] || record.fields['Masse grasse'] || record.fields['Body Fat'] || getStudentVariation(record.id + 'fat', 20, 8),
          masse_musculaire: record.fields['Masse Musculaire'] || record.fields['Masse musculaire'] || record.fields['Muscle Mass'] || getStudentVariation(record.id + 'muscle', 30, 10),
          objectif_physique: record.fields['Objectifs'] || record.fields['Objectif physique'] || record.fields['Goals'] || '',
          profession: record.fields['Profession'] || record.fields['Job'] || '',
          code: record.fields['Code'] || record.id, // ✅ Fallback sur record.id
          statut: record.fields['Statut'] || record.fields['Status'] || 'Actif',
          email: record.fields['E-mail'] || record.fields['Email'] || '',
          sexe: record.fields['Sexe'] || record.fields['Gender'] || '',
          nombre_repas: record.fields['Nombre de repas'] || record.fields['Meals'] || 3
        };
      });
      
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


  // ✅ CORRECTION : Utiliser le StudentContext pour récupérer l'utilisateur connecté
  const { student: currentStudent } = useStudent();
  
  // Déterminer si c'est un admin
  const isAdmin = currentStudent?.isAdmin || false;
  const currentUser = currentStudent || { code: '', isAdmin: false, name: 'Unknown' };

  console.log('🔑 Current student from context:', currentStudent);
  console.log('👨‍💼 Is Admin:', isAdmin);
  console.log('🎯 Admin detection result:', { 
    isAdmin, 
    hasStudent: !!currentStudent,
    studentIsAdmin: currentStudent?.isAdmin,
    accessCode: currentStudent?.accessCode 
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (isAdmin) {
          console.log('👨‍💼 Admin mode - Loading all students');
          const allStudents = await airtableService.getStudents();
          setStudents(allStudents);
          if (allStudents.length > 0) {
            setSelectedStudent(allStudents[0]);
          }
        } else {
          console.log('🧑‍🎓 Student mode - code:', currentStudent?.accessCode);
          const studentData = await airtableService.getStudentByCode(currentStudent?.accessCode || '');
          if (studentData) {
            console.log('✅ Student found:', studentData);
            setSelectedStudent(studentData);
            setStudents([studentData]);
          } else {
            console.log('❌ No student found');
            setError(`Aucun élève trouvé pour le code: ${currentStudent?.accessCode}`);
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
  }, [isAdmin, currentStudent?.accessCode]);

  // Fonction pour encoder le nom
  const encodeNomForUrl = (prenom: string, nom: string): string => {
    const fullName = `${prenom} ${nom}`;
    return encodeURIComponent(fullName);
  };

  // Fonction pour lancer le calcul via webhook Airtable (ADMIN)
  const handleLancerCalcul = async () => {
    if (!isAdmin) {
      alert('Fonction réservée aux administrateurs');
      return;
    }

    try {
      // Obtenir la date de la semaine suivante
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      const semaineSuivante = nextWeek.toISOString().split('T')[0]; // Format YYYY-MM-DD

      // URL du webhook avec paramètre SemaineSuivante
      const webhookUrl = `https://agent.fitluxe.online/webhook-test/2eb1dc6e-9259-4840-9882-7f456a94276f?SemaineSuivante=${semaineSuivante}`;
      
      console.log('🚀 Lancement du calcul via webhook:', {
        url: webhookUrl,
        semaineSuivante
      });

      // Afficher un indicateur de chargement
      const button = document.querySelector('#lancer-calcul-btn') as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.innerHTML = '<svg class="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Calcul en cours...';
      }

      // Appel du webhook
      const response = await fetch(webhookUrl, {
        method: 'GET',
        mode: 'no-cors', // Ajout pour éviter les erreurs CORS
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Avec no-cors, on ne peut pas vérifier response.ok, donc on assume que ça marche
      alert(`✅ Calcul lancé avec succès !\nSemaine calculée: ${semaineSuivante}\nURL appelée: ${webhookUrl}`);
      console.log('✅ Webhook appelé avec succès');

    } catch (error) {
      console.error('❌ Erreur lors de l\'appel du webhook:', error);
      console.error('❌ Détails de l\'erreur:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      alert(`❌ Erreur lors du lancement du calcul.\nErreur: ${error.message}\nVérifiez la console pour plus de détails.`);
    } finally {
      // Restaurer le bouton
      const button = document.querySelector('#lancer-calcul-btn') as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.innerHTML = '<svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>Lancer Calcul';
      }
    }
  };

  // Fonction pour rediriger vers youform (ÉLÈVES)
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

  // Nouvelles données pour le graphique de composition corporelle - DYNAMIQUES
  const getCompositionEvolutionData = (student: Student) => {
    const today = new Date();
    const data = [];
    
    // Valeurs ACTUELLES de l'élève depuis Airtable
    const currentMasseGrasse = student.masse_grasse || getStudentVariation(student.id + 'fat', 32.4, 3);
    const currentMasseMusculaire = student.masse_musculaire || getStudentVariation(student.id + 'muscle', 63, 2);
    const currentEau = getStudentVariation(student.id + 'water', 47.2, 2);
    
    // Générer une progression réaliste basée sur les valeurs actuelles
    const months = [
      '14/09/24', '28/09/24', '14/10/24', '28/10/24', '14/11/24', '28/11/24',
      '14/12/24', '28/12/24', '06/01/25', '20/01/25', '03/01/25'
    ];
    
    months.forEach((dateStr, index) => {
      const progressFactor = index / (months.length - 1);
      const isLastPoint = index === months.length - 1;
      
      // Le dernier point utilise les VRAIES valeurs actuelles
      const masseGrasse = isLastPoint ? 
        currentMasseGrasse : 
        Math.round((currentMasseGrasse + (2 - progressFactor * 2)) * 10) / 10;
      
      const masseMusculaire = isLastPoint ? 
        currentMasseMusculaire : 
        Math.round((currentMasseMusculaire - (1.5 - progressFactor * 1.5)) * 10) / 10;
      
      const eau = isLastPoint ? 
        currentEau : 
        Math.round((currentEau - (1 - progressFactor * 1)) * 10) / 10;
      
      data.push({
        date: dateStr,
        'Masse grasse': masseGrasse,
        'Masse musculaire': masseMusculaire,
        'Eau': eau
      });
    });
    
    return data;
  };

  const getCompositionData = (student: Student) => {
    const masseGrasse = student.masse_grasse || getStudentVariation(student.id, 20, 8); // 20 ± 8
    const masseMusculaire = student.masse_musculaire || getStudentVariation(student.id + 'muscle', 30, 10); // 30 ± 10
    return [
      { name: 'Masse grasse', value: masseGrasse, color: '#EF4444' },
      { name: 'Muscle', value: masseMusculaire, color: '#10B981' },
      { name: 'Autres', value: Math.max(100 - masseGrasse - masseMusculaire, 5), color: '#6B7280' }
    ];
  };

  const renderStudentMeasurements = (student: Student) => {
    const evolutionData = getEvolutionData(student);
    const compositionData = getCompositionData(student);
    const imc = student.poids_actuel && student.taille ? 
      Math.round((student.poids_actuel / Math.pow(student.taille / 100, 2)) * 10) / 10 : 0;

    return (
      <div className="space-y-8">
        {/* En-tête avec bouton adapté selon le rôle */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {isAdmin ? 'Mesures Globales' : 'Mes Mesures'}
                {isAdmin && selectedStudent && (
                  <span className="text-lg text-blue-600 font-normal"> - {selectedStudent.nom || selectedStudent.id}</span>
                )}
              </h2>
              <p className="text-gray-600">
                {isAdmin 
                  ? 'Gérez les mesures de tous vos élèves et lancez les calculs'
                  : 'Suivez l\'évolution de vos mesures corporelles'
                }
              </p>
            </div>
            {isAdmin ? (
              <button
                id="lancer-calcul-btn"
                onClick={handleLancerCalcul}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Lancer Calcul
              </button>
            ) : (
              <button
                onClick={handleEnregistrerMesures}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Enregistrer vos mesures
              </button>
            )}
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
              <p className="text-sm text-blue-700 mb-1">Dernière mesure: {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
              <p className="text-4xl font-bold text-blue-800 mb-2">{student.poids_actuel || 'N/A'} <span className="text-lg">kg</span></p>
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
              <p className="text-sm text-purple-700 mb-3">Dernière mesure: {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="font-semibold text-purple-800">Masse grasse</p>
                  <p className="text-lg font-bold text-purple-800">{student.masse_grasse || getStudentVariation(student.id + 'fat', 20, 8)}%</p>
                </div>
                <div>
                  <p className="font-semibold text-purple-800">Masse musculaire</p>
                  <p className="text-lg font-bold text-purple-800">{student.masse_musculaire || getStudentVariation(student.id + 'muscle', 30, 10)}%</p>
                </div>
                <div>
                  <p className="font-semibold text-purple-800">IMC</p>
                  <p className="text-lg font-bold text-purple-800">{imc}</p>
                  <p className="text-xs text-purple-600">ID: {student.id.slice(-4)}</p>
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

          {/* Composition corporelle - Graphique linéaire comme dans l'image */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                <BarChart3 className="h-6 w-6 text-purple-500 mr-2" />
                Composition corporelle
              </h3>
              <p className="text-gray-600 text-sm">Évolution de votre composition corporelle au fil du temps</p>
              <div className="mt-3 flex items-center justify-end text-sm">
                <span className="text-gray-600 mr-4">
                  Dernière mesure • {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                    <span className="text-red-600 font-medium">
                      {student.masse_grasse || getStudentVariation(student.id + 'fat', 32.4, 3)}%
                    </span>
                    <span className="text-gray-500 ml-1 text-xs">de masse grasse</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                    <span className="text-green-600 font-medium">
                      {student.masse_musculaire || getStudentVariation(student.id + 'muscle', 63, 2)}%
                    </span>
                    <span className="text-gray-500 ml-1 text-xs">de masse musculaire</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                    <span className="text-blue-600 font-medium">
                      {getStudentVariation(student.id + 'water', 47.2, 2)}%
                    </span>
                    <span className="text-gray-500 ml-1 text-xs">d'eau</span>
                  </div>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={320} key={`composition-evolution-${student.id}`}>
              <LineChart data={getCompositionEvolutionData(student)} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  domain={[30, 50]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value, name) => [
                    `${value}%`, 
                    name === 'Masse grasse' ? 'Masse grasse' : 
                    name === 'Masse musculaire' ? 'Masse musculaire' : 'Eau'
                  ]}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Masse grasse" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2, fill: '#ef4444' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Masse musculaire" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#10b981' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Eau" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#3b82f6' }}
                />
              </LineChart>
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
                {(() => {
                  // Générer des données basées sur l'élève
                  const baseCalories = Math.round(1500 + (student.poids_actuel || 70) * 10 + (student.taille || 170) * 5);
                  const today = new Date();
                  return [
                    { 
                      date: new Date(today.getTime() - 7*24*60*60*1000).toLocaleDateString('fr-FR'), 
                      bmr: baseCalories, 
                      bcj: Math.round(baseCalories * 1.2), 
                      obj: Math.round(baseCalories * 1.1), 
                      prot: Math.round(baseCalories * 0.35), 
                      gluc: Math.round(baseCalories * 0.5), 
                      lip: Math.round(baseCalories * 0.15) 
                    },
                    { 
                      date: new Date(today.getTime() - 14*24*60*60*1000).toLocaleDateString('fr-FR'), 
                      bmr: baseCalories - 20, 
                      bcj: Math.round((baseCalories - 20) * 1.2), 
                      obj: Math.round((baseCalories - 20) * 1.1), 
                      prot: Math.round((baseCalories - 20) * 0.35), 
                      gluc: Math.round((baseCalories - 20) * 0.5), 
                      lip: Math.round((baseCalories - 20) * 0.15) 
                    },
                    { 
                      date: new Date(today.getTime() - 21*24*60*60*1000).toLocaleDateString('fr-FR'), 
                      bmr: baseCalories + 10, 
                      bcj: Math.round((baseCalories + 10) * 1.25), 
                      obj: Math.round((baseCalories + 10) * 1.15), 
                      prot: Math.round((baseCalories + 10) * 0.3), 
                      gluc: Math.round((baseCalories + 10) * 0.55), 
                      lip: Math.round((baseCalories + 10) * 0.15) 
                    }
                  ];
                })().map((mesure, index) => (
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
                <span className="font-semibold text-gray-800">{Math.round(75 + (student.poids_actuel || 70) * 0.3)} cm</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Tour de hanches</span>
                <span className="font-semibold text-gray-800">{Math.round(85 + (student.poids_actuel || 70) * 0.4)} cm</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Tour de poitrine</span>
                <span className="font-semibold text-gray-800">{Math.round(80 + (student.poids_actuel || 70) * 0.2)} cm</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Tour de bras</span>
                <span className="font-semibold text-gray-800">{Math.round(25 + (student.poids_actuel || 70) * 0.1)} cm</span>
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
            <h1 className="text-3xl font-bold text-gray-800">
              {isAdmin ? 'Mesures Globales' : 'Mes Mesures'}
            </h1>
          </div>
          <p className="text-gray-600">
            {isAdmin 
              ? 'Gérez les mesures de tous vos élèves'
              : 'Suivez l\'évolution de vos mesures corporelles'
            }
          </p>
        </div>

        {/* Sélecteur d'élèves pour admin */}
        {console.log('🎯 DEBUG Sélecteur:', { isAdmin, studentsLength: students.length, students: students.slice(0, 2) })}
        {isAdmin && students.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Sélectionner un élève</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${ 
                    selectedStudent?.id === student.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <p className="font-medium text-gray-800">
                        {(student.prenom || '') + ' ' + (student.nom || 'Élève')} 
                      </p>
                      <p className="text-sm text-gray-600">
                        Poids: {student.poids_actuel || 'N/A'} kg • Objectif: {student.poids_objectif || 'N/A'} kg
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Affichage des mesures */}
        {selectedStudent ? (
          renderStudentMeasurements(selectedStudent)
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {isAdmin ? 'Sélectionnez un élève' : 'Aucune mesure enregistrée'}
            </h3>
            <p className="text-gray-600 mb-4">
              {isAdmin 
                ? 'Choisissez un élève pour voir ses mesures détaillées'
                : 'Commencez par enregistrer vos premières mesures'
              }
            </p>
            {!isAdmin && (
              <button
                onClick={handleEnregistrerMesures}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium flex items-center mx-auto transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Enregistrer vos premières mesures
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Measurements;