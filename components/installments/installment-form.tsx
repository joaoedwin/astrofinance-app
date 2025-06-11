"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCardManager } from "@/components/credit-card/credit-card-manager"
import { useAuthContext } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"

interface InstallmentFormProps {
  onSubmit: (data: any) => void
  initialData?: {
    description?: string
    categoryId?: number
    totalAmount?: number
    installmentAmount?: number
    totalInstallments?: number
    paidInstallments?: number
    startDate?: string
    nextPaymentDate?: string
    creditCardId?: number | null
  }
}

interface CreditCard {
  id: number
  name: string
  color: string
  lastFourDigits?: string
}

export function InstallmentForm({ onSubmit, initialData }: InstallmentFormProps) {
  const { toast } = useToast()
  const { token } = useAuthContext()
  const [cards, setCards] = useState<CreditCard[]>([])
  const [selectedCardId, setSelectedCardId] = useState<number | null>(initialData?.creditCardId || null)
  const [formData, setFormData] = useState({
    description: initialData?.description || "",
    categoryId: initialData?.categoryId || "",
    totalAmount: initialData?.totalAmount || "",
    installmentAmount: initialData?.installmentAmount || "",
    totalInstallments: initialData?.totalInstallments || "",
    paidInstallments: initialData?.paidInstallments || "",
    startDate: initialData?.startDate || "",
    nextPaymentDate: initialData?.nextPaymentDate || "",
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await fetch("/api/credit-cards", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        const data = await response.json()
        setCards(data)
      } catch (error) {
        console.error("Erro ao carregar cartões:", error)
      }
    }

    fetchCards()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      creditCardId: selectedCardId
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryId">Categoria</Label>
        <Input
          id="categoryId"
          type="number"
          value={formData.categoryId}
          onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value) })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="totalAmount">Valor Total</Label>
        <Input
          id="totalAmount"
          type="number"
          step="0.01"
          value={formData.totalAmount}
          onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="installmentAmount">Valor da Parcela</Label>
        <Input
          id="installmentAmount"
          type="number"
          step="0.01"
          value={formData.installmentAmount}
          onChange={(e) => setFormData({ ...formData, installmentAmount: parseFloat(e.target.value) })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="totalInstallments">Total de Parcelas</Label>
        <Input
          id="totalInstallments"
          type="number"
          value={formData.totalInstallments}
          onChange={(e) => setFormData({ ...formData, totalInstallments: parseInt(e.target.value) })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="paidInstallments">Parcelas Pagas</Label>
        <Input
          id="paidInstallments"
          type="number"
          value={formData.paidInstallments}
          onChange={(e) => setFormData({ ...formData, paidInstallments: parseInt(e.target.value) })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="startDate">Data de Início</Label>
        <Input
          id="startDate"
          type="date"
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nextPaymentDate">Próximo Pagamento</Label>
        <Input
          id="nextPaymentDate"
          type="date"
          value={formData.nextPaymentDate}
          onChange={(e) => setFormData({ ...formData, nextPaymentDate: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="creditCard">Cartão de Crédito</Label>
          <CreditCardManager />
        </div>
        <Select
          value={selectedCardId?.toString() || "none"}
          onValueChange={(value: string) => setSelectedCardId(value !== "none" ? parseInt(value) : null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um cartão" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum</SelectItem>
            {cards.map((card) => (
              <SelectItem key={card.id} value={card.id.toString()}>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: card.color }}
                  />
                  <span>{card.name}</span>
                  {card.lastFourDigits && (
                    <span className="text-sm text-muted-foreground">
                      •••• {card.lastFourDigits}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md"
        >
          {initialData ? "Atualizar" : "Criar"}
        </button>
      </div>
    </form>
  )
} 