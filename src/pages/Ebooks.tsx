
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Book, BookOpen, ArrowDown } from 'lucide-react';
import EbookService from '../services/ebooks/ebookService';
import { Ebook } from '../services/types/airtable.types';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useStudent } from '../context/StudentContext';
import DashboardHeader from '../components/DashboardHeader';

const Ebooks = () => {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { student } = useStudent();

  useEffect(() => {
    const loadEbooks = async () => {
      try {
        setIsLoading(true);
        const data = await EbookService.getPublishedEbooks();
        setEbooks(data);
      } catch (error) {
        console.error('Erreur lors du chargement des eBooks:', error);
        toast.error('Impossible de charger les eBooks. Veuillez réessayer plus tard.');
      } finally {
        setIsLoading(false);
      }
    };

    loadEbooks();
  }, []);

  const handleDownload = (ebook: Ebook) => {
    if (!ebook.urlEbook) {
      toast.error("Le lien de téléchargement n'est pas disponible.");
      return;
    }
    
    // Ouvrir le lien dans un nouvel onglet
    window.open(ebook.urlEbook, '_blank');
    
    // Afficher un toast de confirmation
    toast.success(`Téléchargement de "${ebook.titre}" commencé`);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 bg-yellow-50 rounded-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <DashboardHeader 
            title="eBooks" 
            subtitle="Ressources exclusives pour votre programme"
            icon={<BookOpen className="h-5 w-5 text-yellow-500" />}
            action={
              <div className="flex items-center text-sm font-medium">
                <BookOpen className="h-5 w-5 text-yellow-500 mr-2" />
                <span>
                  {ebooks.length} {ebooks.length > 1 ? 'eBooks disponibles' : 'eBook disponible'}
                </span>
              </div>
            }
          />

          <div className="bg-white border border-yellow-200 rounded-lg p-6 mb-8 shadow-sm">
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">Bibliothèque de ressources</h2>
            <p className="text-yellow-700">
              Découvrez notre collection d'eBooks conçus pour vous aider à atteindre vos objectifs. 
              Ces guides vous fourniront des conseils précieux pour optimiser votre parcours de transformation.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden h-[360px] animate-pulse">
                  <div className="h-48 bg-yellow-100" />
                  <CardHeader className="bg-yellow-50 h-24" />
                  <CardFooter className="bg-yellow-50 h-20" />
                </Card>
              ))}
            </div>
          ) : ebooks.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-yellow-200 shadow-sm">
              <Book className="h-16 w-16 text-yellow-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Aucun eBook disponible</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                De nouveaux eBooks seront bientôt ajoutés à cette bibliothèque.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ebooks.map((ebook) => (
                <motion.div
                  key={ebook.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <Card className="h-full flex flex-col overflow-hidden border-2 border-yellow-100 hover:border-yellow-300 transition-all duration-300 bg-white">
                    <div className="flex flex-col items-center justify-center pt-10 pb-5">
                      <Book className="h-20 w-20 text-yellow-500 mb-6" />
                      <CardTitle className="text-2xl font-bold text-center uppercase mb-2">
                        {ebook.titre}
                      </CardTitle>
                      {ebook.sousTitre && (
                        <CardDescription className="text-center text-gray-600 px-6 text-sm leading-relaxed max-w-lg">
                          {ebook.sousTitre}
                        </CardDescription>
                      )}
                    </div>
                    <div className="mt-auto px-6 pb-6 w-full">
                      <Button 
                        onClick={() => handleDownload(ebook)} 
                        className="w-full bg-yellow-600 hover:bg-yellow-700 flex items-center justify-center gap-2 py-6"
                      >
                        <ArrowDown className="h-5 w-5" />
                        Télécharger
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default Ebooks;
