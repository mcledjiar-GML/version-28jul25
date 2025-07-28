
import AirtableApiService from '../api/airtableApi';
import { Ebook } from '../types/airtable.types';

class EbookService {
  private readonly tableId = 'tbl3o8gKR5AiwIxCQ';
  
  public async getPublishedEbooks(): Promise<Ebook[]> {
    try {
      console.log('Récupération des eBooks publiés...');
      const records = await AirtableApiService.fetchTableById(this.tableId);
      
      if (!records || records.length === 0) {
        console.log('Aucun eBook trouvé');
        return [];
      }
      
      // Filtrer les eBooks publiés et formater les données
      const publishedEbooks = records
        .filter(record => record.fields.Statut === 'Publié')
        .map(record => ({
          id: record.id,
          titre: record.fields.Titre || '',
          sousTitre: record.fields['Sous-titre'] || '',
          description: record.fields.Description || '',
          statut: record.fields.Statut as 'En préparation' | 'Publié' | 'Archivé',
          urlEbook: record.fields['URL eBook'] || ''
        }));
      
      console.log(`${publishedEbooks.length} eBooks publiés trouvés`);
      return publishedEbooks;
    } catch (error) {
      console.error('Erreur lors de la récupération des eBooks:', error);
      return [];
    }
  }
}

export default new EbookService();
