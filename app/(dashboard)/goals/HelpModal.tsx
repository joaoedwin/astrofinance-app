"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Info className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Como funcionam as Metas?
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
            <p>
              <b>Metas</b> ajudam você a planejar, economizar e controlar seus gastos de forma simples e visual.
            </p>
            <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-2">
              <li>
                <b>Meta de Economia Mensal:</b> Defina quanto deseja economizar em um período. O sistema soma todas as receitas, subtrai todas as despesas e parcelas do mês/período. O progresso mostra quanto você já economizou em relação ao objetivo.
              </li>
              <li>
                <b>Meta de Gasto por Categoria:</b> Defina um limite de gasto para uma categoria (ex: Lazer, Alimentação). O sistema soma todas as despesas e parcelas dessa categoria no período.
              </li>
              <li>
                <b>Meta de Compra/Objetivo:</b> Ideal para juntar dinheiro para um sonho (ex: viagem, notebook). O progresso mostra quanto você já acumulou em receitas no período da meta.
              </li>
            </ul>
            <div className="bg-muted rounded p-2 sm:p-3 text-[10px] sm:text-xs">
              <b>Dicas:</b>
              <ul className="list-disc pl-3 sm:pl-4 mt-1 space-y-0.5 sm:space-y-1">
                <li>Inclua todas as suas receitas e despesas para um acompanhamento fiel.</li>
                <li>Parcelamentos contam como despesa no mês de cada parcela.</li>
                <li>Você pode reativar, concluir ou cancelar metas a qualquer momento.</li>
                <li><b>Importante:</b> O progresso é apenas informativo até a data final. A meta só será marcada como concluída automaticamente após a data final, se o objetivo for atingido.</li>
              </ul>
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
              Dúvidas ou sugestões? Fale com o suporte ou consulte a documentação completa.
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter className="mt-4 sm:mt-6 flex">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto text-xs sm:text-sm">Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 