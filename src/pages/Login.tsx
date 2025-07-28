
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStudent } from '../context/StudentContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const Login = () => {
  const { student, accessCode, setAccessCode, login, isLoading } = useStudent();
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // If student is already logged in, redirect to dashboard
  useEffect(() => {
    if (student) {
      navigate('/dashboard');
    }
  }, [student, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!accessCode.trim()) {
      setError("Veuillez saisir un code d'accès");
      toast.error("Veuillez saisir un code d'accès");
      return;
    }
    
    try {
      const success = await login();
      if (!success) {
        setError("Accès refusé. Veuillez vérifier votre code d'accès ou contacter votre coach si votre compte est suspendu.");
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      setError("Une erreur est survenue lors de la tentative de connexion. Veuillez réessayer.");
      toast.error("Erreur de connexion");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-coach-50 to-white p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-8 md:p-10 w-full max-w-md"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-coach-100 rounded-2xl flex items-center justify-center mb-4">
              <svg 
                className="w-8 h-8 text-coach-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Espace Personnel</h1>
            <p className="text-muted-foreground text-sm">
              Accédez à votre suivi personnalisé
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label 
                htmlFor="accessCode" 
                className="block text-sm font-medium text-gray-700"
              >
                Code d'accès
              </label>
              <Input
                id="accessCode"
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Entrez votre code d'accès"
                className="w-full"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-coach-600 hover:bg-coach-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Connexion en cours..." : "Accéder à mon espace"}
            </Button>
          </form>

          <div className="mt-8 text-center text-xs text-gray-500">
            <p>Besoin d'aide ? Contactez votre coach.</p>
            <p className="mt-1">© {new Date().getFullYear()} Coach Sportif</p>
          </div>
        </motion.div>
      </motion.div>
      
      <div className="mt-8 text-center text-gray-600">
        <p className="text-sm">
          Développé avec <span className="text-blue-500">💙</span> par{" "}
          <a 
            href="https://croissanceconsulting.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-medium hover:text-gray-800 underline transition-colors"
          >
            Croissance Consulting
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
