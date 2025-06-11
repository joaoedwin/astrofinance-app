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
function HelpModal({ open, onClose }) {
    return (<dialog_1.Dialog open={open} onOpenChange={onClose}>
      <dialog_1.DialogContent className="max-w-2xl">
        <dialog_1.DialogHeader>
          <dialog_1.DialogTitle>Como usar a página de Transações</dialog_1.DialogTitle>
          <dialog_1.DialogDescription className="space-y-4 pt-4 text-base">
            <p>
              A página de Transações é o centro de controle para todas as suas movimentações financeiras. Aqui você pode:
            </p>
            <div className="space-y-2">
              <h4 className="font-semibold">🔍 Filtros e Buscas</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Use a barra de busca para encontrar transações específicas por descrição ou categoria</li>
                <li>Filtre por período usando os seletores de data inicial e final</li>
                <li>Filtre por tipo (Receitas/Despesas) ou categorias específicas</li>
                <li>Ordene suas transações por data ou valor</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">✏️ Gerenciamento</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Adicione novas transações usando o botão "Nova Transação"</li>
                <li>Edite qualquer campo clicando diretamente nele</li>
                <li>Alterne rapidamente entre receita e despesa clicando no tipo</li>
                <li>Exclua transações usando o ícone de lixeira</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">📊 Visualização</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Valores positivos (verde) representam receitas</li>
                <li>Valores negativos (vermelho) representam despesas</li>
                <li>Todas as alterações são salvas automaticamente</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Dica: Use as categorias consistentemente para ter uma melhor visão de seus gastos no dashboard.
            </p>
          </dialog_1.DialogDescription>
        </dialog_1.DialogHeader>
        <div className="flex justify-end mt-4">
          <button_1.Button variant="outline" onClick={onClose}>Fechar</button_1.Button>
        </div>
      </dialog_1.DialogContent>
    </dialog_1.Dialog>);
}
