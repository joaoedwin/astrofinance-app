"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-xl lg:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base sm:text-lg">Como usar a página de Transações</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-3 sm:space-y-4 text-sm sm:text-base">
            <p>
              A página de Transações é o centro de controle para todas as suas movimentações financeiras. Aqui você pode:
            </p>
            <div className="space-y-1 sm:space-y-2">
              <h4 className="font-semibold">🔍 Filtros e Buscas</h4>
              <ul className="list-disc pl-4 sm:pl-6 space-y-0.5 sm:space-y-1">
                <li>Use a barra de busca para encontrar transações específicas</li>
                <li>Filtre por período usando os seletores de data</li>
                <li>Filtre por tipo (Receitas/Despesas) ou categorias</li>
                <li>Ordene suas transações por data ou valor</li>
              </ul>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <h4 className="font-semibold">✏️ Gerenciamento</h4>
              <ul className="list-disc pl-4 sm:pl-6 space-y-0.5 sm:space-y-1">
                <li>Adicione novas transações com o botão "Nova Transação"</li>
                <li>Edite qualquer campo clicando diretamente nele</li>
                <li>Alterne entre receita e despesa clicando no tipo</li>
                <li>Exclua transações usando o ícone de lixeira</li>
              </ul>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <h4 className="font-semibold">📊 Visualização</h4>
              <ul className="list-disc pl-4 sm:pl-6 space-y-0.5 sm:space-y-1">
                <li>Valores positivos (verde) representam receitas</li>
                <li>Valores negativos (vermelho) representam despesas</li>
                <li>Todas as alterações são salvas automaticamente</li>
              </ul>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 sm:mt-4">
              Dica: Use as categorias consistentemente para ter uma melhor visão de seus gastos no dashboard.
            </p>
          </div>
        </ScrollArea>
        
        <DialogFooter className="mt-4 sm:mt-6 flex">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto text-xs sm:text-sm">Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 