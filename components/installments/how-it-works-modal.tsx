"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState } from "react"

interface HowItWorksModalProps {
  type: "invoice" | "installments"
}

export function HowItWorksModal({ type }: HowItWorksModalProps) {
  const [open, setOpen] = useState(false)
  
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
      description: "Guia completo para gerenciar seus parcelamentos",
      sections: [
        {
          title: "Adicionar um novo parcelamento",
          content: "Clique no botão '+ Novo Parcelamento' no topo da página. Preencha todos os campos: descrição da compra, valor total, número de parcelas, data da primeira parcela e selecione a categoria e o cartão de crédito usado."
        },
        {
          title: "Navegar entre meses",
          content: "Use as setas (< >) ao lado do seletor de mês/ano para visualizar parcelas passadas ou futuras. Alternativamente, selecione um mês e ano específicos nos menus suspensos para ver as parcelas daquele período."
        },
        {
          title: "Entender os status",
          content: "Parcelas são marcadas automaticamente como 'Pagas' (passadas), 'Pendentes' (mês atual) ou 'Futuras' (próximos meses). A barra de progresso mostra quantas parcelas já foram pagas em relação ao total."
        },
        {
          title: "Editar um parcelamento",
          content: "Clique no ícone de menu (três pontos) à direita de qualquer parcelamento e selecione 'Editar'. Você pode modificar a descrição, valor, número de parcelas, cartão de crédito ou categoria."
        },
        {
          title: "Excluir um parcelamento",
          content: "Clique no ícone de menu (três pontos) à direita de qualquer parcelamento e selecione 'Excluir'. Confirme a exclusão no diálogo que aparece. Atenção: isso excluirá todas as parcelas futuras."
        },
        {
          title: "Gerenciar cartões",
          content: "Para adicionar, editar ou remover cartões de crédito, clique no botão 'Gerenciar Cartões' no final da página de parcelamentos. Cada cartão pode ter um nome personalizado e uma cor para identificação rápida."
        },
        {
          title: "Visualizar total mensal",
          content: "No topo da página, o card 'Total do Mês' mostra a soma de todas as parcelas do mês atual, ajudando no planejamento financeiro."
        },
        {
          title: "Integração com Transações",
          content: "Parcelas são automaticamente adicionadas como transações na data correspondente. Você pode visualizá-las também na página de Transações, filtradas por categoria."
        }
      ]
    }
  }

  const selectedContent = content[type]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 sm:h-10 text-xs sm:text-sm gap-1 sm:gap-2">
          <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline">Como funciona?</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base sm:text-lg">{selectedContent.title}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {selectedContent.description}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4 -mr-4 mt-2">
          <div className="grid gap-3 sm:gap-4 py-2">
            {selectedContent.sections.map((section, index) => (
              <div key={index} className="space-y-1 sm:space-y-2">
                <h4 className="font-medium text-sm sm:text-base leading-none">{section.title}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <DialogFooter className="mt-4 sm:mt-6 flex">
          <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto text-xs sm:text-sm">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 