
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Database, Key } from 'lucide-react';
import { toast } from 'sonner';
import AirtableService from '../services/AirtableService';

const AirtableConfig = () => {
  const navigate = useNavigate();
  const [baseId, setBaseId] = useState('');
  const [apiKey, setApiKey] = useState('');
  
  useEffect(() => {
    // Récupérer les valeurs sauvegardées localement
    const savedBaseId = localStorage.getItem('airtable_base_id');
    const savedApiKey = localStorage.getItem('airtable_api_key');
    
    if (savedBaseId) setBaseId(savedBaseId);
    if (savedApiKey) setApiKey(savedApiKey);
  }, []);
  
  const handleSave = () => {
    if (!baseId || !apiKey) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    
    try {
      // Enregistrer la configuration
      AirtableService.configure(baseId, apiKey);
      toast.success("Configuration Airtable enregistrée");
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving Airtable configuration:', error);
      toast.error("Erreur lors de l'enregistrement de la configuration");
    }
  };
  
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Configuration Airtable</h1>
          <p className="text-muted-foreground">
            Configurez votre connexion à Airtable pour accéder à vos données
          </p>
        </div>
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2 text-coach-500" />
              Paramètres de connexion
            </CardTitle>
            <CardDescription>
              Entrez les informations de votre base Airtable
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="baseId">ID de la base</Label>
              <Input
                id="baseId"
                placeholder="app12345abcdef"
                value={baseId}
                onChange={(e) => setBaseId(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                L'ID de votre base se trouve dans l'URL d'Airtable (ex: airtable.com/{baseId}/...)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="apiKey">Clé API</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="key12345abcdef"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Vous pouvez générer une clé API dans les paramètres de votre compte Airtable
              </p>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg text-yellow-800">
              <p className="font-medium mb-1">Important :</p>
              <p className="text-sm">
                Ces informations seront stockées localement dans votre navigateur.
                Assurez-vous d'être sur un appareil de confiance.
              </p>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleSave} className="bg-coach-500 hover:bg-coach-600 text-white">
                <Key className="h-4 w-4 mr-2" />
                Enregistrer la configuration
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-8 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-4">Guide de configuration</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">1. Obtenez votre clé API Airtable</h3>
              <p className="text-muted-foreground mb-2">
                Connectez-vous à votre compte Airtable, puis allez dans vos paramètres de compte.
                Sous "API", vous pouvez générer une nouvelle clé API personnelle.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">2. Trouvez l'ID de votre base</h3>
              <p className="text-muted-foreground mb-2">
                Ouvrez votre base dans Airtable. L'ID de la base se trouve dans l'URL :
                https://airtable.com/{baseId}/...
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">3. Structure de la base de données</h3>
              <p className="text-muted-foreground mb-2">
                Assurez-vous que votre base contient les tables suivantes avec les champs correspondants :
              </p>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>
                  <strong>Students</strong> : Name, AccessCode, Email
                </li>
                <li>
                  <strong>Goals</strong> : StudentId, Description, TargetDate, Status
                </li>
                <li>
                  <strong>Measurements</strong> : StudentId, Date, Weight, Height, BodyFat, MusclePercentage
                </li>
                <li>
                  <strong>Calculations</strong> : StudentId, Date, BMR, BCJ, Protein, Carbs, Fat
                </li>
                <li>
                  <strong>Workouts</strong> : StudentId, Date, Title, Description, Exercises
                </li>
                <li>
                  <strong>MealPlans</strong> : StudentId, Date, Meals
                </li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default AirtableConfig;
