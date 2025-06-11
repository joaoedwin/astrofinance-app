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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Info } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn, formatCurrency } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CategorySelect } from "@/components/ui/category-select"
import { getCategories, type Category as SupabaseCategory } from "@/lib/supabase"
import { CreditCardManager } from "@/components/credit-card/credit-card-manager"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuthContext } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

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
  type: string
  creditCardId?: string | null
}

interface CreditCardType {
  id: string | number
  name: string
  color: string
  lastFourDigits?: string
}

interface NewInstallmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (installment: Installment) => void
}

export function NewInstallmentModal({ isOpen, onClose, onSave }: NewInstallmentModalProps) {
  const { toast } = useToast()
  const { token } = useAuthContext()
  const [date, setDate] = useState(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    return new Date(today.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
  })
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<string>("")
  const [installments, setInstallments] = useState(1)
  const [installmentAmount, setInstallmentAmount] = useState<number>(0)
  const [totalAmount, setTotalAmount] = useState<number>(0)
  const [calculationMode, setCalculationMode] = useState<"total" | "installment">("total")
  const [categories, setCategories] = useState<{ value: string, label: string }[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [installmentAmountInput, setInstallmentAmountInput] = useState("")
  const [totalAmountInput, setTotalAmountInput] = useState("")
  const [lastEdited, setLastEdited] = useState<'installment' | 'total'>("installment")
  const [creditCards, setCreditCards] = useState<CreditCardType[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string>("none")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true)
        // Buscamos todas as categorias sem filtro
        const response = await fetch(`/api/categories`, {
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

  const formatBRL = (value: number) => value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })

  const handleInstallmentAmountChange = (value: string) => {
    setInstallmentAmountInput(value)
    setLastEdited("installment")
    const parcela = parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.'))
    if (!isNaN(parcela) && parcela > 0 && installments > 0) {
      const total = parcela * installments
      setTotalAmountInput(formatBRL(total))
    }
  }

  const handleTotalAmountChange = (value: string) => {
    setTotalAmountInput(value)
    setLastEdited("total")
    const total = parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.'))
    if (!isNaN(total) && total > 0 && installments > 0) {
      const parcela = total / installments
      setInstallmentAmountInput(formatBRL(parcela))
    }
  }

  const handleInstallmentsChange = (value: string) => {
    const n = parseInt(value)
    setInstallments(n)
    if (lastEdited === "installment") {
      const parcela = parseFloat(installmentAmountInput.replace(/[^\d,-]/g, "").replace(",", "."))
      if (!isNaN(parcela) && parcela > 0 && n > 0) {
        const total = parcela * n
        setTotalAmountInput(formatBRL(total))
      }
    } else {
      const total = parseFloat(totalAmountInput.replace(/[^\d,-]/g, "").replace(",", "."))
      if (!isNaN(total) && total > 0 && n > 0) {
        const parcela = total / n
        setInstallmentAmountInput(formatBRL(parcela))
      }
    }
  }

  // Para salvar, converter os valores string para número
  const getInstallmentAmount = () => parseFloat(installmentAmountInput.replace(/[^\d,-]/g, "").replace(",", ".")) || 0
  const getTotalAmount = () => parseFloat(totalAmountInput.replace(/[^\d,-]/g, "").replace(",", ".")) || 0

  const handleSave = () => {
    if (!description || !category || installments <= 0 || getTotalAmount() <= 0) {
      return
    }
    const newInstallment: Installment = {
      id: Date.now().toString(),
      description,
      category_id: category,
      category: categories.find(c => c.value === category)?.label || "",
      totalAmount: getTotalAmount(),
      installmentAmount: getInstallmentAmount(),
      totalInstallments: installments,
      paidInstallments: 0,
      startDate: date,
      nextPaymentDate: date,
      type: 'expense',
      creditCardId: selectedCardId === "none" ? null : selectedCardId,
    }
    onSave(newInstallment)
    resetForm()
  }

  const resetForm = () => {
    setDate(() => {
      const today = new Date();
      const offset = today.getTimezoneOffset();
      return new Date(today.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
    })
    setDescription("")
    setCategory("")
    setInstallments(1)
    setInstallmentAmountInput("")
    setTotalAmountInput("")
    setLastEdited("installment")
    setSelectedCardId("none")
  }

  // Sincronizar os campos conforme o último editado
  useEffect(() => {
    if (lastEdited === 'installment' && installmentAmount > 0 && installments > 0) {
      const total = installmentAmount * installments
      setTotalAmount(total)
      setTotalAmountInput(total > 0 ? formatCurrency(total).replace("R$", "").trim() : "")
    }
    if (lastEdited === 'total' && totalAmount > 0 && installments > 0) {
      const parcela = totalAmount / installments
      setInstallmentAmount(parcela)
      setInstallmentAmountInput(parcela > 0 ? formatCurrency(parcela).replace("R$", "").trim() : "")
    }
    // eslint-disable-next-line
  }, [installmentAmount, totalAmount, installments, lastEdited])

  // Sincronizar os inputs ao abrir/fechar modal
  useEffect(() => {
    setInstallmentAmountInput(installmentAmount > 0 ? formatCurrency(installmentAmount).replace("R$", "").trim() : "")
    setTotalAmountInput(totalAmount > 0 ? formatCurrency(totalAmount).replace("R$", "").trim() : "")
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base sm:text-lg">Novo Parcelamento</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Cadastre uma compra parcelada ou despesa recorrente
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4 -mr-4">
          <form id="new-installment-form" className="space-y-3 sm:space-y-4">
            <div className="space-y-2 sm:space-y-3">
              <div>
                <Label htmlFor="description" className="text-xs sm:text-sm">Descrição</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-8 sm:h-10 text-xs sm:text-sm"
                />
              </div>
              
              <div>
                <Label className="text-xs sm:text-sm">Data da primeira parcela</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-8 sm:h-10 text-xs sm:text-sm"
                />
              </div>
              
              <div>
                <Label className="text-xs sm:text-sm">Categoria</Label>
                {loadingCategories ? (
                  <div className="text-xs sm:text-sm text-muted-foreground">Carregando...</div>
                ) : (
                  <CategorySelect
                    value={category}
                    onValueChange={setCategory}
                    categories={categories}
                    type="expense"
                    className="h-8 sm:h-10 text-xs sm:text-sm"
                  />
                )}
              </div>
              
              <div>
                <Label htmlFor="installments" className="text-xs sm:text-sm">Número de parcelas</Label>
                <Input
                  id="installments"
                  type="number"
                  min={1}
                  max={99}
                  value={installments}
                  onChange={(e) => handleInstallmentsChange(e.target.value)}
                  className="h-8 sm:h-10 text-xs sm:text-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="installment-amount" className="text-xs sm:text-sm">Valor por parcela</Label>
                  <Input
                    id="installment-amount"
                    value={installmentAmountInput}
                    onChange={(e) => handleInstallmentAmountChange(e.target.value)}
                    placeholder="0,00"
                    className="h-8 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="total-amount" className="text-xs sm:text-sm">Valor total</Label>
                  <Input
                    id="total-amount"
                    value={totalAmountInput}
                    onChange={(e) => handleTotalAmountChange(e.target.value)}
                    placeholder="0,00"
                    className="h-8 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-xs sm:text-sm">Cartão de Crédito (opcional)</Label>
                <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                  <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="Selecione um cartão (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {creditCards.map((card) => (
                      <SelectItem key={card.id} value={String(card.id)}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: card.color || '#888888' }}
                          ></div>
                          <span>{card.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </ScrollArea>
        
        <DialogFooter className="mt-4 sm:mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose} className="h-8 sm:h-10 text-xs sm:text-sm">
            Cancelar
          </Button>
          <Button 
            type="submit" 
            onClick={handleSave} 
            disabled={!description || !category || installments <= 0 || getTotalAmount() <= 0 || saving}
            className="h-8 sm:h-10 text-xs sm:text-sm"
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
