import { toast } from "sonner";
import AirtableApiService from "../api/airtableApi";
import { Student } from "../types/airtable.types";

class AuthService {
  // Codes admin hardcodés (vous pouvez en ajouter d'autres)
  private adminCodes = [
    'COACH_ADMIN_2025',
    'ADMIN_MC_LEJDIAR',
    'SUPER_COACH_ACCESS'
  ];

  // Utiliser les valeurs configurées dynamiquement au lieu des valeurs hardcodées
  private getTableId(): string {
    return localStorage.getItem('airtable_table_id') || "tbll5MlIcTSqCOLEJ";
  }
  
  private getBaseId(): string {
    return localStorage.getItem('airtable_base_id') || "appXSN9pTszvUfn9I";
  }

  // Vérifier si c'est un code admin
  private isAdminCode(accessCode: string): boolean {
    return this.adminCodes.includes(accessCode);
  }

  // Créer un objet Student admin
  private createAdminStudent(accessCode: string): Student {
    return {
      id: 'admin_' + Date.now(),
      name: 'Coach Admin',
      accessCode: accessCode,
      email: 'coach@coachinbg.com',
      age: null,
      gender: null,
      initialWeight: null,
      targetWeight: null,
      height: null,
      profession: 'Coach Sportif',
      medicalHistory: null,
      activityLevel: null,
      motivation: null,
      diet: null,
      eatingHabits: null,
      mealFrequency: null,
      objectives: 'Gérer les clients',
      birthDate: null,
      status: 'Admin',
      studentCode: null,
      isAdmin: true  // 🎯 Propriété spéciale pour identifier l'admin
    };
  }

  // Authentication
  async verifyAccess(accessCode: string): Promise<Student | null> {
    // 🧹 NETTOYER LE CODE D'ACCÈS (supprimer espaces début/fin + caractères invisibles)
    const cleanedAccessCode = accessCode.trim().replace(/[\u200B-\u200D\uFEFF]/g, '');
    
    console.log('🧹 Code original:', `"${accessCode}"`);
    console.log('🧹 Code nettoyé:', `"${cleanedAccessCode}"`);
    
    // 🎯 VÉRIFICATION ADMIN EN PREMIER
    if (this.isAdminCode(cleanedAccessCode)) {
      console.log('🔑 Accès admin détecté avec le code:', accessCode);
      const adminStudent = this.createAdminStudent(accessCode);
      console.log('✅ Connexion admin réussie:', adminStudent);
      return adminStudent;
    }

    // En mode démo ou développement, utiliser les données fictives
    if (!AirtableApiService.isConfigured) {
      console.log('Mode démo: utilisation de données fictives');
      return this.verifyAccessMock(cleanedAccessCode);
    }
    
    try {
      console.log('🔍 Tentative de vérification avec le code:', cleanedAccessCode);
      console.log('📊 Informations de configuration Airtable:');
      console.log(`- Base ID: ${this.getBaseId()}`);
      console.log(`- Table ID: ${this.getTableId()}`);
      console.log(`- API Key configurée: ${AirtableApiService.isApiKeyConfigured ? 'Oui' : 'Non'}`);
      
      // Tester la connectivité de base avec Airtable avant de tenter l'accès à la table
      const connectivityTest = await AirtableApiService.testConnectivity();
      console.log('🌐 Résultat du test de connectivité:', connectivityTest);
      
      if (!connectivityTest.success) {
        console.error('❌ Échec du test de connectivité Airtable:', connectivityTest.error);
        console.warn('⚠️ Connexion à Airtable impossible');
        return null;
      }
      
      // Essayons de récupérer les données avec des méthodes alternatives
      let eleves = await AirtableApiService.fetchTableById(this.getTableId());
      
      // Si aucun élève n'est récupéré avec l'ID, essayons avec le nom
      if (!eleves || eleves.length === 0) {
        console.log('🔄 Tentative avec le nom de table "Élèves"');
        try {
          eleves = await AirtableApiService.fetchAllRecords('Élèves');
        } catch (err) {
          console.error('❌ Erreur avec le nom Élèves:', err);
        }
      }
      
      console.log(`✅ ${eleves?.length || 0} élèves récupérés depuis Airtable`);
      
      if (eleves && eleves.length > 0) {
        console.log('🔍 Structure détaillée des données récupérées:');
        eleves.forEach((eleve: any, index: number) => {
          console.log(`📋 Élève ${index + 1} - ID: ${eleve.id}:`);
          console.log('  - Fields disponibles:', eleve.fields ? Object.keys(eleve.fields) : 'Aucun');
          console.log('  - Champ Code:', eleve.fields?.Code);
          console.log('  - Champ code (minuscule):', eleve.fields?.code);
          console.log('  - Nom:', eleve.fields?.Nom);
          console.log('  - Tous les champs:', eleve.fields);
        });

        // Rechercher un élève avec le code d'accès correspondant
        const matchingEleve = eleves.find((eleve: any) => {
          console.log(`🔍 Vérification élève ${eleve.id}:`);
          
          // Tester toutes les variantes possibles, en priorité la colonne "Code"
          const possibleCodes = [
            eleve.fields?.Code,        // 🎯 PRIORITÉ: Colonne "Code" d'Airtable
            eleve.fields?.["Code"],    // 🎯 Variante avec crochets
            eleve.id,                  // ID Airtable (fallback)
            eleve.fields?.code,        // Variante minuscule
            eleve.fields?.["code"],
            eleve.fields?.AccessCode,
            eleve.fields?.["AccessCode"],
            eleve.fields?.["fld2B3uc2SCCu3bhT"],
            eleve.code,
            eleve.AccessCode
          ];
          
          console.log('🔑 Codes possibles trouvés:', possibleCodes.filter(Boolean));
          console.log('🔍 Détail des codes pour cet élève:', possibleCodes.map((code, index) => ({ index, code })));
          
          const isMatch = possibleCodes.some(code => code === cleanedAccessCode);
          
          if (isMatch) {
            console.log('✅ MATCH TROUVÉ!');
          }
          
          return isMatch;
        });
        
        if (matchingEleve) {
          console.log('🎉 Élève trouvé:', matchingEleve);
          
          // Extraire les champs selon la structure Airtable
          const fields = matchingEleve.fields || matchingEleve;
          
          // Vérifier le statut de l'élève
          const status = fields["Statut"] || fields["fldIOn1hHf5zB762X"] || fields.Statut || 'Actif';
          console.log('📊 Statut de l\'élève:', status);
          
          // Autoriser tous les statuts pour le moment (pour débugger)
          console.log('✅ Accès autorisé (debug mode)');
          
          // Construire un objet Student complet avec les détails supplémentaires
          return {
            id: matchingEleve.id,
            name: fields.Nom || fields["fldqgtzUUGEbyuvQF"] || fields.Name || fields.name || 'Élève',
            accessCode: cleanedAccessCode,
            email: fields["E-mail"] || fields["fldiswtPGMq9yr6E3"] || fields.Email || fields.email || '',
            // Ajout des champs supplémentaires
            age: fields["Âge"] || fields["fld8Vw1HWTKEw4jn8"] || null,
            gender: fields["Sexe"] || fields["fld7XAznXJH1WtyMN"] || null,
            initialWeight: fields["Poids Initial"] || fields["fld82XocJlHxb7iIx"] || null,
            targetWeight: fields["Poids Cible"] || fields["fldTqxmxv8wPQnhTR"] || null,
            height: fields["Taille (cm)"] || fields["fldIqFArOG8ZQlSfU"] || null,
            profession: fields["Profession"] || fields["fldzKnvfv3YDkFzvg"] || null,
            medicalHistory: fields["Antécédents Médicaux & Sportifs"] || fields["fldJKFzBeLsOkelOn"] || null,
            activityLevel: fields["Niveau d'Activité"] || fields["fldzCNDy4Nl8T19lP"] || null,
            motivation: fields["Motivation"] || fields["fldKov8E7oDliEiCi"] || null,
            diet: fields["Régime Alimentaire"] || fields["fldo508yN3Ny9YIwm"] || null,
            eatingHabits: fields["Habitudes Alimentaires Spécifiques"] || fields["fld8KahK2SURAbaer"] || null,
            mealFrequency: fields["Fréquence de Repas"] || fields["fldo8qtXMMY5RW5TC"] || null,
            objectives: fields["Objectifs"] || fields["fld2rLbZsXv1ryqBZ"] || null,
            birthDate: fields["Date de naissance"] || fields["fldNFRFGZkFfZo712"] || null,
            status: status,
            studentCode: fields["IDU Eleve"] || fields["fldcbSf4aqCxWXLCD"] || null,
            isAdmin: false  // 🎯 Les élèves normaux ne sont pas admin
          };
        } else {
          console.log('❌ Aucun élève trouvé avec ce code dans la table Élèves');
          console.log('🔑 Code recherché:', cleanedAccessCode);
          console.log('🔍 Codes disponibles:', eleves.map((e: any) => ({
            id: e.id,
            codeField: e.fields?.Code || e.fields?.code || e.code,
            name: e.fields?.Nom || e.Nom
          })));
        }
      } else {
        console.warn('⚠️ Aucun élève récupéré depuis Airtable, vérification des accès directs');
      }
      
      console.log('❌ Aucun élève trouvé avec ce code après vérification');
      return null;
    } catch (error) {
      console.error('❌ Error verifying access:', error);
      return null;
    }
  }

  // Version mock pour le développement
  private async verifyAccessMock(accessCode: string): Promise<Student | null> {
    await new Promise(resolve => setTimeout(resolve, 800));
    return null; // Ne plus utiliser les codes de démo
  }
}

export default new AuthService();