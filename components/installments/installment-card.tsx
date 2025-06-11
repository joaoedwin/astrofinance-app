import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface InstallmentCardProps {
  installment: {
    paidInstallments: number
    totalInstallments: number
    installmentAmount: number
  }
}

export function InstallmentCard({ installment }: InstallmentCardProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
          {installment.paidInstallments}/{installment.totalInstallments}
        </Badge>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p>Parcela {installment.paidInstallments} de {installment.totalInstallments}</p>
                <p>Valor da parcela: {formatCurrency(installment.installmentAmount)}</p>
                <p>Valor total: {formatCurrency(installment.installmentAmount * installment.totalInstallments)}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {formatCurrency(installment.installmentAmount)}
        </span>
      </div>
    </div>
  )
} 