
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Calculation } from "@/services/types/airtable.types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface CalcHistoryTableProps {
  calculations: Calculation[];
}

const CalcHistoryTable = ({ calculations }: CalcHistoryTableProps) => {
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-32">Date</TableHead>
            <TableHead>BMR</TableHead>
            <TableHead>BCJ</TableHead>
            <TableHead>BCJ / Obj</TableHead>
            <TableHead>Protéines</TableHead>
            <TableHead>Glucides</TableHead>
            <TableHead>Lipides</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calculations.map((calc) => (
            <TableRow key={calc.id}>
              <TableCell className="font-medium">
                {format(new Date(calc.date), 'dd MMM yyyy', { locale: fr })}
              </TableCell>
              <TableCell>{formatNumber(calc.bmr)}</TableCell>
              <TableCell>{formatNumber(calc.bcj)}</TableCell>
              <TableCell>{formatNumber(calc.objective || 0)}</TableCell>
              <TableCell>{formatNumber(calc.proteinKcal || (calc.protein * 4))}</TableCell>
              <TableCell>{formatNumber(calc.carbsKcal || (calc.carbs * 4))}</TableCell>
              <TableCell>{formatNumber(calc.fatKcal || (calc.fat * 9))}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CalcHistoryTable;
