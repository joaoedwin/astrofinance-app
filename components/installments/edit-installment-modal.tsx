"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Info } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CategorySelect, type Category } from "@/components/ui/category-select"
import { getCategories } from "@/lib/supabase"
import { CreditCardManager } from "@/components/credit-card/credit-card-manager"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuthContext } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"

// Tipos
interface Installment {
  id: string
  description: string
  category_id: string
  category: string
  totalAmount: number
  installmentAmount: number
  totalInstallments: number
  paidInstallments: number
  startDate: string
  nextPaymentDate: string
  creditCardId?: string | null
}

interface EditInstallmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (installment: Installment) => void
  installment: Installment
}

interface CreditCardType {
  id: string | number
  name: string
  color: string
  lastFourDigits?: string
}

// Categorias disponíveis
const categories: Category[] = [
  { value: "eletronicos", label: "Eletrônicos" },
  { value: "moveis", label: "Móveis" },
  { value: "vestuario", label: "Vestuário" },
  { value: "educacao", label: "Educação" },
  { value: "saude", label: "Saúde" },
  { value: "lazer", label: "Lazer" },
  { value: "outros", label: "Outros" },
]

export function EditInstallmentModal({ isOpen, onClose, onSave, installment }: EditInstallmentModalProps) {
  const { toast } = useToast()
  const { token } = useAuthContext()
  const [date, setDate] = useState(installment.startDate)
  const [description, setDescription] = useState(installment.description)
  const [category, setCategory] = useState(installment.category_id)
  const [installments, setInstallments] = useState<number>(installment.totalInstallments)
  const [paidInstallments, setPaidInstallments] = useState<number>(installment.paidInstallments)
  const [installmentAmount, setInstallmentAmount] = useState<number>(installment.installmentAmount)
  const [totalAmount, setTotalAmount] = useState<number>(installment.totalAmount)
  const [calculationMode, setCalculationMode] = useState<"total" | "installment">("total")
  const [categories, setCategories] = useState<{ value: string, label: string }[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [installmentAmountInput, setInstallmentAmountInput] = useState<string>("")
  const [creditCards, setCreditCards] = useState<CreditCardType[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string>(installment.creditCardId || "")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true)
        const response = await fetch(`/api/categories?type=expense`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error("Erro ao buscar categorias:", errorData)
          throw new Error(errorData.message || "Erro ao buscar categorias")
        }
        
        const data = await response.json()
        
        setCategories(
          Array.isArray(data) 
            ? data.map((cat: any) => ({ 
                value: cat.id, 
                label: cat.name 
              })) 
            : []
        )
      } catch (error) {
        console.error(error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar as categorias",
          variant: "destructive"
        })
      } finally {
        setLoadingCategories(false)
      }
    }
    
    if (token) {
      fetchCategories()
    }
  }, [token, toast])

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await fetch("/api/credit-cards", {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await response.json()
        setCreditCards(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Erro ao buscar cartões:", error)
        setCreditCards([])
      }
    }
    if (token) {
      fetchCards()
    } else {
      setCreditCards([])
    }
  }, [token])

  // Atualizar os estados quando o parcelamento mudar
  useEffect(() => {
    setDate(installment.startDate)
    setDescription(installment.description)
    setCategory(installment.category_id)
    setInstallments(installment.totalInstallments)
    setPaidInstallments(installment.paidInstallments)
    setInstallmentAmount(installment.installmentAmount)
    setTotalAmount(installment.totalAmount)
  }, [installment])

  // Calcular o valor total ou o valor da parcela quando um deles mudar
  useEffect(() => {
    if (calculationMode === "total" && installments > 0) {
      setInstallmentAmount(totalAmount / installments)
    } else if (calculationMode === "installment" && installments > 0) {
      setTotalAmount(installmentAmount * installments)
    }
  }, [totalAmount, installmentAmount, installments, calculationMode])

  useEffect(() => {
    if (installmentAmount > 0) {
      setInstallmentAmountInput(formatCurrency(installmentAmount).replace("R$", "").trim())
    } else {
      setInstallmentAmountInput("")
    }
  }, [installmentAmount])

  const handleTotalAmountChange = (value: string) => {
    const numericValue = Number.parseFloat(value.replace(/[^\d,-]/g, "").replace(",", "."))
    if (!isNaN(numericValue)) {
      setTotalAmount(numericValue)
      setCalculationMode("total")
    }
  }

  const handleInstallmentAmountChange = (value: string) => {
    setInstallmentAmountInput(value)
    const numericValue = Number.parseFloat(value.replace(/[^\d,-]/g, "").replace(",", "."))
    if (!isNaN(numericValue)) {
      setInstallmentAmount(numericValue)
      setCalculationMode("installment")
    }
  }

  const handleInstallmentAmountBlur = () => {
    if (installmentAmount > 0) {
      setInstallmentAmountInput(formatCurrency(installmentAmount).replace("R$", "").trim())
    } else {
      setInstallmentAmountInput("")
    }
  }

  const handleSave = () => {
    if (!description || !category || installments <= 0 || totalAmount <= 0) {
      return
    }

    const updatedInstallment: Installment = {
      id: installment.id,
      description,
      category_id: category,
      category: categories.find(c => c.value === category)?.label || "",
      totalAmount,
      installmentAmount,
      totalInstallments: installments,
      paidInstallments,
      startDate: date,
      nextPaymentDate: date,
      creditCardId: selectedCardId || null,
    }

    onSave(updatedInstallment)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
        <div className="flex flex-col max-h-[90vh]">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-xl font-bold">Editar Parcelamento</DialogTitle>
            <DialogDescription className="text-base mt-3">Modifique os detalhes do parcelamento.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-8">
            <div className="space-y-8 pb-4">
              <div className="grid grid-cols-2 gap-6">
                {/* Data da Compra */}
                <div className="space-y-3">
                  <Label htmlFor="date" className="text-sm font-medium block">
                    Data da Compra
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-12"
                  />
                </div>

                {/* Descrição */}
                <div className="space-y-3">
                  <Label htmlFor="description" className="text-sm font-medium block">
                    Descrição
                  </Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="h-12"
                    placeholder="Ex: Notebook Dell"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Categoria */}
                <div className="space-y-3">
                  <Label htmlFor="category" className="text-sm font-medium block">
                    Categoria
                  </Label>
                  <CategorySelect
                    value={category}
                    onValueChange={setCategory}
                    categories={categories}
                    onAddCategory={(newCategory) => {
                      setCategory(newCategory.value)
                    }}
                    className="w-full"
                    type="expense"
                  />
                </div>

                {/* Quantidade de Parcelas */}
                <div className="space-y-3">
                  <Label htmlFor="installments" className="text-sm font-medium block">
                    Total de Parcelas
                  </Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="installments"
                      type="number"
                      min="1"
                      max="48"
                      value={installments}
                      onChange={(e) => setInstallments(Number.parseInt(e.target.value) || 1)}
                      className="w-full h-12"
                    />
                  </div>
                </div>
              </div>

              {/* Cartão de Crédito */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="creditCard" className="text-sm font-medium block">Cartão de Crédito <span className="text-xs text-muted-foreground">(opcional)</span></Label>
                  <CreditCardManager buttonProps={{ size: "sm", className: "h-9" }} />
                </div>
                <Select
                  value={selectedCardId || ""}
                  onValueChange={setSelectedCardId}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione um cartão (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(creditCards) && creditCards
                      .filter(card => card && card.id !== undefined && card.id !== null && card.id !== "")
                      .map(card => (
                        <SelectItem key={card.id} value={card.id.toString()}>
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: card.color }} />
                            {card.name}
                            {card.lastFourDigits && (
                              <span className="text-xs text-muted-foreground">•••• {card.lastFourDigits}</span>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {selectedCardId && Array.isArray(creditCards) && (
                  <div className="mt-2 flex items-center gap-2">
                    {creditCards
                      .filter(c => c && c.id && c.id.toString() === selectedCardId)
                      .map(card => (
                        <span key={card.id} className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: card.color, color: '#fff' }}>
                          <span>{card.name}</span>
                          {card.lastFourDigits && <span>•••• {card.lastFourDigits}</span>}
                        </span>
                      ))}
                  </div>
                )}
              </div>

              {/* Valores */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="installmentAmount" className="text-sm font-medium block">
                    Valor da Parcela
                  </Label>
                  <Input
                    id="installmentAmount"
                    value={installmentAmountInput}
                    onChange={(e) => handleInstallmentAmountChange(e.target.value)}
                    onBlur={handleInstallmentAmountBlur}
                    placeholder="0,00"
                    className="h-12"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="totalAmount" className="text-sm font-medium block">
                    Valor Total
                  </Label>
                  <Input
                    id="totalAmount"
                    value={totalAmount > 0 ? formatCurrency(totalAmount).replace("R$", "").trim() : ""}
                    onChange={(e) => handleTotalAmountChange(e.target.value)}
                    placeholder="0,00"
                    className="text-right h-12"
                  />
                </div>
              </div>

              {/* Resumo */}
              <div className="mt-6">
                <div className="rounded-md bg-muted p-6">
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total a pagar:</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground mt-4">
                    <span>{installments}x de:</span>
                    <span>{formatCurrency(installmentAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>Parcelas restantes:</span>
                    <span>{installments - paidInstallments}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 pt-4">
            <Button variant="outline" onClick={onClose} size="lg" className="h-12">
              Cancelar
            </Button>
            <Button onClick={handleSave} size="lg" className="h-12">
              Salvar Alterações
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
