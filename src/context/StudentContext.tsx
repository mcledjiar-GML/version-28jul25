
import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode 
} from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AirtableService, { Student } from '../services/AirtableService';

interface StudentContextType {
  student: Student | null;
  isLoading: boolean;
  accessCode: string;
  setAccessCode: (code: string) => void;
  login: (code?: string) => Promise<boolean>;
  logout: () => void;
  isAirtableConfigured: boolean;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider = ({ children }: { children: ReactNode }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [accessCode, setAccessCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAirtableConfigured, setIsAirtableConfigured] = useState<boolean>(true);
  const navigate = useNavigate();

  // Vérifier la configuration d'Airtable et la session sauvegardée
  useEffect(() => {
    setIsAirtableConfigured(AirtableService.isConfigured);
    
    const savedAccessCode = localStorage.getItem('accessCode');
    if (savedAccessCode) {
      setAccessCode(savedAccessCode);
      login(savedAccessCode).catch(error => {
        console.error('Auto-login error:', error);
      });
    }
  }, []);

  const login = async (code?: string) => {
    setIsLoading(true);
    const codeToUse = code || accessCode;
    
    if (!codeToUse || codeToUse.trim() === '') {
      setIsLoading(false);
      toast.error("Veuillez saisir un code d'accès");
      return false;
    }
    
    try {
      console.log('Tentative de connexion avec code:', codeToUse);
      
      // Vérification avec Airtable
      const studentData = await AirtableService.verifyAccess(codeToUse);
      
      if (studentData) {
        console.log('Connexion réussie:', studentData);
        setStudent(studentData);
        localStorage.setItem('accessCode', codeToUse);
        localStorage.setItem('studentName', studentData.name); // Stocker le nom pour une utilisation ultérieure
        toast.success(`Bienvenue, ${studentData.name} !`);
        navigate('/dashboard');
        return true;
      } else {
        console.log('Code invalide ou compte inactif:', codeToUse);
        toast.error("Accès refusé. Veuillez vérifier votre code d'accès ou contacter votre coach.");
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error("Erreur lors de la connexion. Veuillez réessayer.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setStudent(null);
    setAccessCode('');
    localStorage.removeItem('accessCode');
    localStorage.removeItem('studentName');
    navigate('/');
    toast.success('Déconnexion réussie');
  };

  return (
    <StudentContext.Provider value={{
      student,
      isLoading,
      accessCode,
      setAccessCode,
      login,
      logout,
      isAirtableConfigured
    }}>
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = () => {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
};
