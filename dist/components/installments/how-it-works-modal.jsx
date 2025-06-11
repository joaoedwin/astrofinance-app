"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HowItWorksModal = HowItWorksModal;
const dialog_1 = require("@/components/ui/dialog");
const button_1 = require("@/components/ui/button");
const lucide_react_1 = require("lucide-react");
function HowItWorksModal({ type }) {
    const content = {
        invoice: {
            title: "Como funcionam as Faturas?",
            description: "Entenda como gerenciar suas faturas mensais",
            sections: [
                {
                    title: "Visão Geral",
                    content: "A página de faturas mostra todas as suas despesas mensais, incluindo gastos únicos e parcelas de compras parceladas."
                },
                {
                    title: "Filtros",
                    content: "Use os filtros para encontrar transações específicas por cartão, categoria, valor ou período."
                },
                {
                    title: "Exportação",
                    content: "Você pode exportar sua fatura mensal em PDF, incluindo um resumo detalhado e gráficos."
                },
                {
                    title: "Status de Pagamento",
                    content: "Acompanhe quais despesas já foram pagas e quais ainda estão pendentes."
                }
            ]
        },
        installments: {
            title: "Como funcionam os Parcelamentos?",
            description: "Entenda como gerenciar seus parcelamentos",
            sections: [
                {
                    title: "Visão Geral",
                    content: "A página de parcelamentos mostra todas as suas compras parceladas, organizadas por data e cartão."
                },
                {
                    title: "Acompanhamento",
                    content: "Veja facilmente quantas parcelas já foram pagas e quantas ainda faltam para cada compra."
                },
                {
                    title: "Valor Total",
                    content: "Visualize tanto o valor de cada parcela quanto o valor total da compra."
                },
                {
                    title: "Organização",
                    content: "Os parcelamentos são agrupados por cartão de crédito para melhor controle."
                }
            ]
        }
    };
    const selectedContent = content[type];
    return (<dialog_1.Dialog>
      <dialog_1.DialogTrigger asChild>
        <button_1.Button variant="outline" className="gap-2">
          <lucide_react_1.Info className="h-4 w-4"/>
          Como funciona?
        </button_1.Button>
      </dialog_1.DialogTrigger>
      <dialog_1.DialogContent className="sm:max-w-[425px]">
        <dialog_1.DialogHeader>
          <dialog_1.DialogTitle>{selectedContent.title}</dialog_1.DialogTitle>
          <dialog_1.DialogDescription>
            {selectedContent.description}
          </dialog_1.DialogDescription>
        </dialog_1.DialogHeader>
        <div className="grid gap-4 py-4">
          {selectedContent.sections.map((section, index) => (<div key={index} className="space-y-2">
              <h4 className="font-medium leading-none">{section.title}</h4>
              <p className="text-sm text-muted-foreground">
                {section.content}
              </p>
            </div>))}
        </div>
      </dialog_1.DialogContent>
    </dialog_1.Dialog>);
}
