
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ExplanationCard = () => {
  return (
    <Card className="border border-purple-200">
      <CardHeader>
        <CardTitle>À quoi servent ces calculs ?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>
          <strong>Métabolisme de Base (BMR)</strong> : C'est la quantité d'énergie que votre corps dépense au repos pour maintenir ses fonctions vitales (respiration, circulation sanguine, etc.). Il est calculé en fonction de votre âge, poids, taille et sexe.
        </p>
        
        <p>
          <strong>Besoin Calorique Journalier (BCJ)</strong> : Il prend en compte votre BMR et y ajoute l'énergie dépensée par vos activités quotidiennes et l'exercice physique. C'est un indicateur de la quantité de calories que vous devriez consommer quotidiennement.
        </p>
        
        <p>
          <strong>Macronutriments</strong> : La répartition entre protéines, glucides et lipides est personnalisée en fonction de vos objectifs. Les protéines sont essentielles pour la construction musculaire, les glucides fournissent de l'énergie, et les lipides sont importants pour diverses fonctions hormonales et cellulaires.
        </p>
      </CardContent>
    </Card>
  );
};

export default ExplanationCard;
