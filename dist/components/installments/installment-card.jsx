"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstallmentCard = InstallmentCard;
const badge_1 = require("@/components/ui/badge");
const utils_1 = require("@/lib/utils");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const tooltip_1 = require("@/components/ui/tooltip");
function InstallmentCard({ installment }) {
    return (<div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-2">
        <badge_1.Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
          {installment.paidInstallments}/{installment.totalInstallments}
        </badge_1.Badge>
        <tooltip_1.TooltipProvider>
          <tooltip_1.Tooltip>
            <tooltip_1.TooltipTrigger asChild>
              <button_1.Button variant="ghost" size="icon" className="h-8 w-8">
                <lucide_react_1.Info className="h-4 w-4"/>
              </button_1.Button>
            </tooltip_1.TooltipTrigger>
            <tooltip_1.TooltipContent>
              <div className="space-y-1">
                <p>Parcela {installment.paidInstallments} de {installment.totalInstallments}</p>
                <p>Valor da parcela: {(0, utils_1.formatCurrency)(installment.installmentAmount)}</p>
                <p>Valor total: {(0, utils_1.formatCurrency)(installment.installmentAmount * installment.totalInstallments)}</p>
              </div>
            </tooltip_1.TooltipContent>
          </tooltip_1.Tooltip>
        </tooltip_1.TooltipProvider>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {(0, utils_1.formatCurrency)(installment.installmentAmount)}
        </span>
      </div>
    </div>);
}
