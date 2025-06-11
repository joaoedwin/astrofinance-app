"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelpModal = HelpModal;
const react_1 = __importDefault(require("react"));
const dialog_1 = require("@/components/ui/dialog");
const button_1 = require("@/components/ui/button");
const lucide_react_1 = require("lucide-react");
function HelpModal({ open, onClose }) {
    return (<dialog_1.Dialog open={open} onOpenChange={onClose}>
      <dialog_1.DialogContent className="max-w-lg">
        <dialog_1.DialogHeader>
          <dialog_1.DialogTitle className="flex items-center gap-2">
            <lucide_react_1.Info className="h-5 w-5 text-primary"/>
            Como funcionam as Metas?
          </dialog_1.DialogTitle>
        </dialog_1.DialogHeader>
        <div className="space-y-4 text-sm">
          <p>
            <b>Metas</b> ajudam você a planejar, economizar e controlar seus gastos de forma simples e visual.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <b>Meta de Economia Mensal:</b> Defina quanto deseja economizar em um período. O sistema soma todas as receitas, subtrai todas as despesas e parcelas do mês/período. O progresso mostra quanto você já economizou em relação ao objetivo, mas a meta só será concluída automaticamente após a data final, se o valor for atingido.
            </li>
            <li>
              <b>Meta de Gasto por Categoria:</b> Defina um limite de gasto para uma categoria (ex: Lazer, Alimentação). O sistema soma todas as despesas e parcelas dessa categoria no período. Se passar de 100%, você recebe um alerta após a data final.
            </li>
            <li>
              <b>Meta de Compra/Objetivo:</b> Ideal para juntar dinheiro para um sonho (ex: viagem, notebook). O progresso mostra quanto você já acumulou em receitas no período da meta, mas a meta só será concluída automaticamente após a data final, se o valor for atingido.
            </li>
          </ul>
          <div className="bg-muted rounded p-3 text-xs">
            <b>Dicas:</b>
            <ul className="list-disc pl-4 mt-1 space-y-1">
              <li>Inclua todas as suas receitas e despesas para um acompanhamento fiel.</li>
              <li>Parcelamentos contam como despesa no mês de cada parcela.</li>
              <li>Você pode reativar, concluir ou cancelar metas a qualquer momento.</li>
              <li><b>Importante:</b> O progresso é apenas informativo até a data final. A meta só será marcada como concluída automaticamente após a data final, se o objetivo for atingido.</li>
            </ul>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Dúvidas ou sugestões? Fale com o suporte ou consulte a documentação completa.
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button_1.Button variant="outline" onClick={onClose}>Fechar</button_1.Button>
        </div>
      </dialog_1.DialogContent>
    </dialog_1.Dialog>);
}
