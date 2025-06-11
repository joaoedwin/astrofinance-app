"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CategorySelect, type Category } from "@/components/ui/category-select"
import { getCategories, type Category as SupabaseCategory, createTransaction } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { useAuthContext } from "@/contexts/auth-context"

interface NewTransactionButtonProps {
  fullWidth?: boolean
  iconOnly?: boolean
}

export function NewTransactionButton({ fullWidth = false, iconOnly = false }: NewTransactionButtonProps) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState("expense")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().substring(0, 10);
  })
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const { token } = useAuthContext()

  useEffect(() => {
    if (token) {
      loadCategories()
    }
  }, [token])

  const loadCategories = async () => {
    try {
      if (!token) {
        console.error("Token não disponível para buscar categorias")
        return
      }
      
      const response = await fetch(`/api/categories`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
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
      console.error("Erro ao buscar categorias:", error)
      toast({
        title: "Erro ao carregar categorias",
        description: "Não foi possível carregar as categorias. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Função para formatar o valor
  const formatValueForSubmission = (value: string): number => {
    // Remover caracteres não numéricos, mas manter vírgula e substituí-la por ponto
    const cleanedValue = value.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(cleanedValue);
  }

  const handleSave = async () => {
    if (!description || !category || !amount || !date || saving) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }
    
    setSaving(true)
    try {
      const formattedAmount = parseFloat(amount.replace(/[^\d,]/g, '').replace(',', '.'))
      const selectedDate = date
      
      if (!token) {
        throw new Error("Usuário não autenticado. Faça login novamente.")
      }
      
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: formattedAmount,
          date: selectedDate,
          description,
          type: type as "income" | "expense",
          categoryId: category,
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || "Erro ao criar transação")
      }
      
      const result = await response.json()
      
      toast({
        title: "Transação criada",
        description: "A transação foi salva com sucesso.",
      })
      setOpen(false)
      resetForm()
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Erro ao salvar transação",
        description: error.message || "Não foi possível salvar a transação.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setType("expense")
    setAmount("")
    const today = new Date();
    setDate(today.toISOString().substring(0, 10));
    setCategory("")
    setDescription("")
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          resetForm()
        }
        setOpen(open)
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="default"
          size={iconOnly ? "icon" : "default"}
          className={fullWidth ? "w-full" : ""}
        >
          {!iconOnly && <PlusCircle className="mr-2 h-4 w-4" />}
          {iconOnly ? <PlusCircle className="h-4 w-4" /> : "Nova Transação"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
          <DialogDescription>
            Adicione uma nova transação ao seu histórico financeiro.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Tipo
            </Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Receita</SelectItem>
                <SelectItem value="expense">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Valor
            </Label>
            <Input
              id="amount"
              type="text"
              className="col-span-3"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Data
            </Label>
            <Input
              id="date"
              type="date"
              className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm col-span-3"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Categoria
            </Label>
            <div className="col-span-3">
              <CategorySelect
                value={category}
                onValueChange={setCategory}
                categories={categories}
                onAddCategory={(newCategory) => {
                  setCategories([...categories, newCategory])
                  setCategory(newCategory.value)
                }}
                type={type as "income" | "expense"}
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Descrição
            </Label>
            <Textarea
              id="description"
              placeholder="Descreva a transação"
              className="col-span-3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? (
              <span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Salvando...</span>
            ) : (
              "Salvar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
