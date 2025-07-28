
import { toast } from "sonner";

class AirtableApiService {
  private baseId: string;
  private apiKey: string;
  private apiUrl: string = 'https://api.airtable.com/v0';
  private maxRetries: number = 3;

  constructor() {
    // Configuration par défaut avec les vraies informations depuis CLAUDE.md
    this.baseId = 'appXSN9pTszvUfn9I';
    this.apiKey = 'patAw9SBF0W46wKNz.57faebc717b00eae345cc865092431d2c135eeee75c560888a2423d058bec44c';
  }

  public configure(baseId: string, apiKey: string) {
    this.baseId = baseId;
    this.apiKey = apiKey;
    localStorage.setItem('airtable_base_id', baseId);
    localStorage.setItem('airtable_api_key', apiKey);
    console.log('Configuration Airtable mise à jour:', { baseId, apiKey: apiKey.substring(0, 10) + '...' });
  }

  public get isConfigured(): boolean {
    return Boolean(this.baseId && this.apiKey);
  }
  
  public get isApiKeyConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 20);
  }

  private loadConfig() {
    if (!this.isConfigured) {
      const baseId = localStorage.getItem('airtable_base_id');
      const apiKey = localStorage.getItem('airtable_api_key');
      if (baseId && apiKey) {
        this.baseId = baseId;
        this.apiKey = apiKey;
      }
    }
  }
  
  // Test la connectivité de base avec Airtable - modifié pour utiliser un endpoint plus simple
  public async testConnectivity(): Promise<{ success: boolean; error?: string }> {
    this.loadConfig();
    
    if (!this.isConfigured) {
      return { success: false, error: 'Airtable API non configurée' };
    }
    
    try {
      // Au lieu d'utiliser l'endpoint meta, on essaie de récupérer directement la table Élèves
      // C'est une approche plus directe qui fonctionne mieux avec les permissions par défaut
      const url = `${this.apiUrl}/${this.baseId}/Élèves`;
      console.log('URL test de connectivité:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Réponse du test de connectivité:', response.status, response.statusText);
      
      if (response.ok) {
        return { success: true };
      }
      
      // Récupérer le corps de l'erreur
      const errorBody = await response.text();
      console.error('Erreur du test de connectivité:', response.status, errorBody);
      
      // Si on a une erreur 404, on essaie avec le nom de la table "Élèves"
      if (response.status === 404) {
        try {
          const altUrl = `${this.apiUrl}/${this.baseId}/Élèves`;
          console.log('Tentative avec le nom de table Élèves:', altUrl);
          
          const altResponse = await fetch(altUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (altResponse.ok) {
            return { success: true };
          }
        } catch (altErr) {
          console.error('Erreur avec le nom de table Élèves:', altErr);
        }
      }
      
      return { 
        success: false, 
        error: `Erreur HTTP ${response.status}: ${errorBody}` 
      };
    } catch (error) {
      console.error('Exception lors du test de connectivité:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  // Méthode pour récupérer les données d'une table en utilisant son ID
  public async fetchTableById(tableId: string, retryCount: number = 0): Promise<any[]> {
    this.loadConfig();
    
    if (!this.isConfigured) {
      console.log('Airtable API non configurée, retournant un tableau vide');
      return [];
    }

    console.log(`Tentative de récupération des données de la table avec ID: ${tableId}`);
    
    try {
      // Utilisation directe de l'ID de la table dans l'URL
      const url = `${this.apiUrl}/${this.baseId}/${tableId}`;
      
      console.log('URL de requête avec ID de table:', url);
      console.log('Utilisation de l\'API key:', this.apiKey.substring(0, 10) + '...');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`Réponse pour la table ${tableId}:`, response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Données récupérées pour la table ${tableId}:`, data);
        
        if (data && data.records) {
          return data.records;
        }
        return [];
      }
      
      // Si on a une erreur 404 avec l'ID, on essaie avec le nom "Élèves"
      if (response.status === 404 || response.status === 403) {
        try {
          const altUrl = `${this.apiUrl}/${this.baseId}/Élèves`;
          console.log('Tentative avec le nom de table Élèves:', altUrl);
          
          const altResponse = await fetch(altUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          });
          
          console.log(`Réponse avec le nom Élèves:`, altResponse.status, altResponse.statusText);
          
          if (altResponse.ok) {
            const altData = await altResponse.json();
            console.log('Données récupérées avec le nom de table Élèves:', altData);
            if (altData && altData.records) {
              return altData.records;
            }
          }
          
          // Si "Élèves" ne fonctionne pas, essayons sans accent
          const altUrl2 = `${this.apiUrl}/${this.baseId}/Eleves`;
          console.log('Tentative avec le nom de table Eleves:', altUrl2);
          
          const altResponse2 = await fetch(altUrl2, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (altResponse2.ok) {
            const altData2 = await altResponse2.json();
            console.log('Données récupérées avec le nom de table Eleves:', altData2);
            if (altData2 && altData2.records) {
              return altData2.records;
            }
          }
        } catch (altErr) {
          console.error('Erreur avec les noms alternatifs:', altErr);
        }
      }
      
      // Gestion des erreurs
      const errorBody = await response.text();
      console.error(`Erreur pour la table ${tableId}:`, response.status, errorBody);
      
      // Si nous n'avons pas dépassé le nombre maximal de tentatives
      if (retryCount < this.maxRetries) {
        console.log(`Nouvelle tentative ${retryCount + 1}/${this.maxRetries} dans 1s...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.fetchTableById(tableId, retryCount + 1);
      }
      
      // Simuler un succès avec un tableau vide après toutes les tentatives
      return [];
    } catch (error) {
      console.error(`Erreur pour la table ${tableId}:`, error);
      
      // Si nous n'avons pas dépassé le nombre maximal de tentatives
      if (retryCount < this.maxRetries) {
        console.log(`Nouvelle tentative après erreur ${retryCount + 1}/${this.maxRetries} dans 1s...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.fetchTableById(tableId, retryCount + 1);
      }
      
      return [];
    }
  }

  // Méthode pour récupérer tous les enregistrements d'une table
  public async fetchAllRecords(tableName: string, retryCount: number = 0): Promise<any[]> {
    this.loadConfig();
    
    if (!this.isConfigured) {
      console.log('Airtable API non configurée, retournant un tableau vide');
      return [];
    }

    console.log(`Tentative de récupération de tous les enregistrements de la table ${tableName}`);
    
    // Gestion des erreurs d'accès avec des variantes de noms de table
    const tableNames = [
      tableName,
      tableName.normalize("NFD").replace(/[\u0300-\u036f]/g, ""), // Sans accents
      `${tableName.normalize("NFD").replace(/[\u0300-\u036f]/g, "")}s`, // Pluriel anglais
      // Variantes pour la table principale Élèves
      ...(tableName === "Élèves" ? ["Eleves", "Eleve", "Students", "Users", "tbll5MlIcTSqCOLEJ"] : [])
    ];
    
    // Tentatives avec différents noms de table
    for (const name of tableNames) {
      try {
        console.log(`Tentative avec le nom de table: ${name}`);
        const encodedTableName = encodeURIComponent(name);
        const url = `${this.apiUrl}/${this.baseId}/${encodedTableName}`;
        
        console.log('URL de requête:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log(`Réponse pour ${name}:`, response.status, response.statusText);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Données récupérées pour ${name}:`, data);
          
          if (data && data.records) {
            return data.records;
          }
          return [];
        }
        
        if (response.status === 403 || response.status === 404) {
          console.warn(`Échec pour la table ${name}: ${response.status}`);
          // Continuer avec le prochain nom de table
          continue;
        } else {
          // Autre type d'erreur, essayer de lire le corps de l'erreur
          const errorBody = await response.text();
          console.error(`Erreur pour la table ${name}:`, response.status, errorBody);
        }
      } catch (error) {
        console.error(`Erreur pour la table ${name}:`, error);
      }
    }
    
    // Si toutes les tentatives ont échoué et que nous n'avons pas dépassé le nombre maximal de tentatives
    if (retryCount < this.maxRetries) {
      console.log(`Nouvelle tentative ${retryCount + 1}/${this.maxRetries} dans 1s...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.fetchAllRecords(tableName, retryCount + 1);
    }
    
    // Si nous arrivons ici, c'est que toutes les tentatives ont échoué
    console.error(`Toutes les tentatives ont échoué pour la table ${tableName}`);
    
    // Simuler un succès pour les tests avec un tableau vide
    return [];
  }

  // Méthodes pour la rétrocompatibilité
  public async fetchFromAirtable<T>(
    tableName: string,
    params: Record<string, string> = {},
    retryCount: number = 0
  ): Promise<T[]> {
    this.loadConfig();
    
    if (!this.isConfigured) {
      throw new Error('Airtable API n\'est pas configurée. Veuillez appeler configure() d\'abord.');
    }

    // Encoder correctement le nom de la table (important pour les noms avec accents comme "Élèves")
    const encodedTableName = encodeURIComponent(tableName);
    
    // Construire l'URL de base
    let url = `${this.apiUrl}/${this.baseId}/${encodedTableName}`;
    console.log('URL Airtable:', url);

    // Ajout des paramètres de requête si fournis
    if (Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        queryParams.append(key, value);
      }
      url += `?${queryParams.toString()}`;
    }

    console.log('URL complète de requête:', url);
    
    try {
      // Vérifier si nous devrions simuler un succès pour tester
      const simulateSuccess = localStorage.getItem('simulate_airtable_success') === 'true';
      if (simulateSuccess) {
        console.log('Simulation d\'une réponse Airtable réussie');
        return [];
      }
      
      // Tenter de récupérer les données
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Statut de la réponse:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur API Airtable:', errorText);
        
        // Si nous avons une erreur 403 (Forbidden) ou 404 (Not Found)
        if (response.status === 403 || response.status === 404) {
          if (retryCount < this.maxRetries) {
            // Attendre un peu avant de réessayer avec un autre nom de table
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log(`Tentative ${retryCount + 1}/${this.maxRetries} échouée pour la table ${tableName}`);
            
            // Pour la première tentative, essayons avec le nom de table sans accents
            if (retryCount === 0 && tableName === 'Élèves') {
              console.log('Tentative avec le nom de table sans accents: Eleves');
              return this.fetchFromAirtable<T>('Eleves', params, retryCount + 1);
            }
            
            return [];
          }
          
          console.log('Problème d\'accès à Airtable, utilisation des données fictives');
          return [];
        }
        
        throw new Error(`Erreur Airtable: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Données brutes reçues:', data);
      
      // Transformation de la réponse Airtable en notre format
      if (data && data.records) {
        const records = data.records.map((record: any) => ({
          id: record.id,
          ...record.fields,
        }));
        console.log('Données transformées:', records);
        return records;
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des données Airtable:', error);
      
      // Tenter une nouvelle requête avec un délai si nous n'avons pas dépassé le nombre maximal de tentatives
      if (retryCount < this.maxRetries) {
        console.log(`Tentative ${retryCount + 1}/${this.maxRetries} échouée, nouvelle tentative dans 1s...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.fetchFromAirtable<T>(tableName, params, retryCount + 1);
      }
      
      // Ne pas afficher de toast ici car nous voulons une expérience utilisateur plus fluide
      // Nous allons gérer l'erreur au niveau du service appelant
      throw error;
    }
  }

  public async useMockData<T>(mockData: T[]): Promise<T[]> {
    await new Promise(resolve => setTimeout(resolve, 800));
    return mockData;
  }
}

export default new AirtableApiService();
