"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CategorySelect } from "@/components/ui/category-select"
import { format } from "date-fns"
import { useAuthContext } from "@/contexts/auth-context"
import { ScrollArea } from "@/components/ui/scroll-area"

interface GoalFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  loading?: boolean
  initialData?: any
}

export function GoalForm({ open, onClose, onSubmit, loading, initialData }: GoalFormProps) {
  const [name, setName] = useState(initialData?.name || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [targetAmount, setTargetAmount] = useState(initialData?.target_amount || "")
  const [type, setType] = useState(initialData?.type || "saving")
  const [categoryId, setCategoryId] = useState(initialData?.category_id || "")
  const [recurrence, setRecurrence] = useState(initialData?.recurrence || "none")
  const [startDate, setStartDate] = useState(initialData?.start_date || format(new Date(), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState(initialData?.end_date || "")
  const [error, setError] = useState("")
  const [categories, setCategories] = useState<{ value: string, label: string }[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const { token } = useAuthContext()

  useEffect(() => {
    if (!open || !token) return
    setLoadingCategories(true)
    fetch("/api/categories", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setCategories(Array.isArray(data) ? data.map((cat: any) => ({ value: cat.id, label: cat.name })) : [])
      })
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false))
  }, [open, token])

  useEffect(() => {
    setName(initialData?.name || "")
    setDescription(initialData?.description || "")
    setTargetAmount(initialData?.target_amount || "")
    setType(initialData?.type || "saving")
    setCategoryId(initialData?.category_id || "")
    setRecurrence(initialData?.recurrence || "none")
    setStartDate(initialData?.start_date || format(new Date(), "yyyy-MM-dd"))
    setEndDate(initialData?.end_date || "")
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !targetAmount || !type || !startDate) {
      setError("Preencha todos os campos obrigatórios.")
      return
    }
    setError("")
    onSubmit({
      name,
      description,
      target_amount: Number(targetAmount),
      type,
      category_id: categoryId || null,
      recurrence: recurrence === "none" ? null : recurrence,
      start_date: startDate,
      end_date: endDate || null
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base sm:text-lg">{initialData ? "Editar Meta" : "Nova Meta"}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4 -mr-4">
          <form id="goal-form" onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label htmlFor="goal-name" className="block text-xs sm:text-sm font-medium mb-1">Nome da Meta *</label>
              <Input 
                id="goal-name" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                maxLength={50} 
                className="h-8 sm:h-10 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="goal-description" className="block text-xs sm:text-sm font-medium mb-1">Descrição</label>
              <Input 
                id="goal-description" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                maxLength={120} 
                className="h-8 sm:h-10 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="goal-target" className="block text-xs sm:text-sm font-medium mb-1">Valor Alvo (R$) *</label>
              <Input 
                id="goal-target" 
                type="number" 
                min={0} 
                step={0.01} 
                value={targetAmount} 
                onChange={e => setTargetAmount(e.target.value)} 
                required 
                className="h-8 sm:h-10 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Tipo de Meta *</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saving">Economia Mensal</SelectItem>
                  <SelectItem value="spending">Gasto por Categoria</SelectItem>
                  <SelectItem value="purchase">Compra/Objetivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {type === "purchase" && (
              <div className="bg-muted rounded p-2 sm:p-3 text-[10px] sm:text-xs text-muted-foreground">
                Todo mês, você será lembrado de informar quanto do seu saldo deseja reservar para este objetivo. O progresso será calculado com base nesses valores informados.
              </div>
            )}
            {type !== "purchase" && (
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Categoria</label>
                {loadingCategories ? (
                  <div className="text-muted-foreground text-[10px] sm:text-xs">Carregando categorias...</div>
                ) : (
                  <CategorySelect
                    value={categoryId}
                    onValueChange={setCategoryId}
                    categories={categories}
                    type={type === "spending" ? "expense" : "income"}
                    placeholder="Selecione a categoria"
                  />
                )}
              </div>
            )}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Recorrência</label>
              <Select value={recurrence} onValueChange={setRecurrence}>
                <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="Recorrência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                  <SelectItem value="custom">Personalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label htmlFor="goal-start-date" className="block text-xs sm:text-sm font-medium mb-1">Data Inicial *</label>
                <Input 
                  id="goal-start-date" 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                  required 
                  className="h-8 sm:h-10 text-xs sm:text-sm"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="goal-end-date" className="block text-xs sm:text-sm font-medium mb-1">Data Final</label>
                <Input 
                  id="goal-end-date" 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)} 
                  className="h-8 sm:h-10 text-xs sm:text-sm"
                />
              </div>
            </div>
            {error && <div className="text-red-500 text-[10px] sm:text-xs">{error}</div>}
          </form>
        </ScrollArea>
        
        <DialogFooter className="mt-4 sm:mt-6 flex">
          <div className="flex justify-end gap-2 w-full">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="h-8 sm:h-10 text-xs sm:text-sm">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              form="goal-form" 
              disabled={loading}
              className="h-8 sm:h-10 text-xs sm:text-sm"
            >
              {loading ? "Salvando..." : initialData ? "Salvar" : "Criar Meta"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 