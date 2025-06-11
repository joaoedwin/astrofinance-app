"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronDown, Trash, X, Calendar as CalendarIcon } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { CategorySelect, type Category } from "@/components/ui/category-select"
import { getCategories, type Category as SupabaseCategory } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useAuthContext } from "@/contexts/auth-context"

// Tipos
interface Transaction {
  id: string
  date: Date | string
  description: string
  amount: number
  type: "income" | "expense"
  category: string
  category_id: string
}

interface EditableTransactionTableProps {
  initialTransactions: Transaction[]
}

interface APICategory {
  id: string
  name: string
}

export function EditableTransactionTable({ initialTransactions }: EditableTransactionTableProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions ?? [])
  const [editingCell, setEditingCell] = useState<{
    id: string
    field: "date" | "description" | "category" | "type" | "amount" | null
  }>({ id: "", field: null })
  const [editValue, setEditValue] = useState<string | number | Date>("")
  const [categories, setCategories] = useState<Category[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { token } = useAuthContext()
  const [saving, setSaving] = useState(false)

  // Debug logs
  console.log("EditableTransactionTable - Recebendo initialTransactions:", 
    Array.isArray(initialTransactions) ? `${initialTransactions.length} transações` : "não é array", 
    initialTransactions
  );

  useEffect(() => {
    console.log("EditableTransactionTable - useEffect - Atualizando transactions:", 
      Array.isArray(initialTransactions) ? `${initialTransactions.length} transações` : "não é array");
    
    // Garantir que initialTransactions seja um array
    const safeTransactions = Array.isArray(initialTransactions) ? initialTransactions : [];
    setTransactions(safeTransactions);
  }, [initialTransactions])

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
      
      console.log("Buscando categorias com token:", token)
      
      const response = await fetch("/api/categories", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error("Erro na resposta da API:", errorData)
        throw new Error(errorData.message || "Erro ao buscar categorias")
      }
      
      const data = await response.json() as APICategory[]
      console.log("Categorias recebidas:", data)
      
      // Converter para o formato esperado pelo componente CategorySelect
      setCategories(
        Array.isArray(data) 
          ? data.map((cat) => ({ 
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

  // Foca no input quando começar a editar
  useEffect(() => {
    if (editingCell.field && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingCell])

  // Função para iniciar a edição de uma célula
  const startEditing = useCallback((id: string, field: "date" | "description" | "category" | "type" | "amount", value: any) => {
    setEditingCell({ id, field })
    
    if (field === "category") {
      // Se o valor for um nome de categoria, encontra o ID correspondente
      if (typeof value === 'string' && !categories.some(cat => cat.value === value)) {
        const category = categories.find(cat => cat.label === value);
        setEditValue(category ? category.value : "");
      } else {
        setEditValue(value);
      }
    } else if (field === "date") {
      // Formatação de data
      if (value instanceof Date) {
        // Formatação correta de data para o campo input
        const dateStr = new Date(value).toISOString().substring(0, 10);
        setEditValue(dateStr);
      } else {
        setEditValue(value);
      }
    } else {
      setEditValue(value);
    }
  }, [categories])

  // Função para carregar categorias com um tipo específico
  const loadCategoriesByType = async (type: "income" | "expense") => {
    try {
      if (!token) {
        console.error("Token não disponível para buscar categorias")
        return
      }
      
      const response = await fetch(`/api/categories?type=${type}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error("Erro ao buscar categorias")
      }
      
      const data = await response.json() as APICategory[]
      
      setCategories(
        Array.isArray(data) 
          ? data.map((cat) => ({ 
              value: cat.id, 
              label: cat.name 
            })) 
          : []
      )
    } catch (error) {
      console.error("Erro ao buscar categorias por tipo:", error)
      toast({
        title: "Erro ao carregar categorias",
        description: "Não foi possível carregar as categorias.",
        variant: "destructive",
      })
    }
  }

  // Função para salvar a edição
  const saveEdit = useCallback(async (id: string) => {
    const transaction = transactions.find((t) => t.id === id)
    if (!transaction || !token) return
    
    const updatedTransaction = { ...transaction }
    
    switch (editingCell.field) {
      case "date":
        // Garantir que a data é salva no formato correto
        updatedTransaction.date = editValue as string;
        break
      case "description":
        updatedTransaction.description = editValue as string
        break
      case "category": {
        // Encontrar o nome da categoria a partir do ID
        const categoryObj = categories.find(cat => cat.value === editValue);
        if (categoryObj) {
          updatedTransaction.category = categoryObj.label;
          updatedTransaction.category_id = categoryObj.value;
        }
        break
      }
      case "type":
        updatedTransaction.type = editValue as "income" | "expense"
        break
      case "amount":
        updatedTransaction.amount = Number(editValue)
        break
    }
    
    // Preparar dados para a API - garantir que todos os campos obrigatórios estejam presentes
    const transactionData = {
      amount: updatedTransaction.amount,
      date: updatedTransaction.date instanceof Date ? updatedTransaction.date.toISOString().split('T')[0] : updatedTransaction.date,
      description: updatedTransaction.description,
      type: updatedTransaction.type,
      category_id: updatedTransaction.category_id
    }
    
    // Persistir edição na API com o token de autenticação
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(transactionData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error("Erro detalhado:", errorData)
        throw new Error(errorData.error || "Erro ao atualizar transação")
      }
      
      setTransactions(transactions.map((t) => (t.id === id ? updatedTransaction : t)))
      setEditingCell({ id: "", field: null })
      setEditValue("")
    } catch (error) {
      console.error("Erro ao salvar transação:", error)
      toast({
        title: "Erro ao salvar transação",
        description: "Não foi possível salvar a transação. Tente novamente.",
        variant: "destructive",
      })
    }
  }, [transactions, editingCell, editValue, categories, toast, token])

  // Função para cancelar a edição
  const cancelEdit = useCallback(() => {
    setEditingCell({ id: "", field: null })
    setEditValue("")
  }, [])

  // Função para excluir uma transação
  const deleteTransaction = useCallback(async (id: string) => {
    setDeleteId(id)
  }, [])

  const confirmDelete = async () => {
    if (!deleteId || !token) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/transactions/${deleteId}`, { 
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao excluir transação");
      }
      
      setTransactions(transactions.filter((t) => t.id !== deleteId))
      toast({ 
        title: "Transação excluída", 
        description: "A transação foi removida com sucesso." 
      })
    } catch (error) {
      console.error("Erro ao excluir transação:", error);
      toast({ 
        title: "Erro ao excluir transação", 
        description: error instanceof Error ? error.message : "Não foi possível excluir a transação.", 
        variant: "destructive" 
      })
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const memoizedTransactions = useMemo(() => transactions ?? [], [transactions])

  // Função para formatar datas de exibição corretamente
  const formatDateDisplay = (dateValue: string | Date): string => {
    if (!dateValue) return 'Data inválida';
    
    try {
      // Criar uma nova data a partir do valor
      let date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
      
      // Compensar o ajuste de fuso horário
      const utcDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60 * 1000));
      
      // Formatar para exibição no formato brasileiro
      return utcDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    } catch (e) {
      console.error("Erro ao formatar data:", e);
      return 'Data inválida';
    }
  }

  const handleCategoryChange = (value: string) => {
    setEditValue(value)
  }

  const onAddCategory = async (category: Category) => {
    try {
      if (!token) return

      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: category.label })
      })

      if (!response.ok) {
        throw new Error("Erro ao criar categoria")
      }

      const newCategory = await response.json() as APICategory
      const categoryOption = { value: newCategory.id, label: newCategory.name }
      setCategories([...categories, categoryOption])
      return categoryOption
    } catch (error) {
      console.error("Erro ao criar categoria:", error)
      toast({
        title: "Erro ao criar categoria",
        description: "Não foi possível criar a categoria.",
        variant: "destructive",
      })
      return null
    }
  }

  // Adicionar a função onToggleType
  const onToggleType = async (id: string, newType: "income" | "expense") => {
    try {
      const transaction = transactions.find((t) => t.id === id)
      if (!transaction || !token) return

      // Atualiza localmente para efeito instantâneo
      setTransactions((prev) => prev.map((t) => t.id === id ? { ...t, type: newType } : t))
      
      // Preparar dados para a API - garantir que todos os campos obrigatórios estejam presentes
      const transactionData = {
        amount: transaction.amount,
        date: transaction.date instanceof Date ? transaction.date.toISOString().split('T')[0] : transaction.date,
        description: transaction.description,
        type: newType,
        category_id: transaction.category_id
      }
      
      // Salva no banco
      const response = await fetch(`/api/transactions/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(transactionData),
      })

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro detalhado:", errorData);
        throw new Error(errorData.error || "Erro ao atualizar transação")
      }

      toast({ title: "Tipo alterado", description: `Agora é ${newType === "income" ? "Receita" : "Despesa"}.` })
    } catch (error) {
      console.error("Erro ao alterar tipo:", error)
      // Reverte a mudança local em caso de erro
      setTransactions((prev) => prev.map((t) => t.id === id ? { ...t, type: t.type === "income" ? "expense" : "income" } : t))
      toast({ 
        title: "Erro ao alterar tipo", 
        description: "Não foi possível salvar no banco.", 
        variant: "destructive" 
      })
    }
  }

  return (
    <>
      {/* Versão desktop da tabela */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                {/* Célula de data */}
                <TableCell onClick={() => startEditing(transaction.id, "date", transaction.date)}>
                  {editingCell.id === transaction.id && editingCell.field === "date" ? (
                    <div className="flex items-center gap-2">
                      <Input
                        ref={inputRef}
                        type="date"
                        value={editValue as string}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-8 w-[150px]"
                      />
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => saveEdit(transaction.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={cancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      {formatDateDisplay(transaction.date)}
                    </div>
                  )}
                </TableCell>

                {/* Célula de descrição */}
                <TableCell onClick={() => startEditing(transaction.id, "description", transaction.description)}>
                  {editingCell.id === transaction.id && editingCell.field === "description" ? (
                    <div className="flex items-center gap-2">
                      <Input
                        ref={inputRef}
                        value={editValue as string}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-8"
                      />
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => saveEdit(transaction.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={cancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    transaction.description
                  )}
                </TableCell>

                {/* Célula de categoria */}
                <TableCell onClick={() => startEditing(transaction.id, "category", transaction.category_id || transaction.category)}>
                  {editingCell.id === transaction.id && editingCell.field === "category" ? (
                    <div className="flex items-center gap-2">
                      <CategorySelect
                        value={editValue as string}
                        onValueChange={handleCategoryChange}
                        categories={categories}
                        onAddCategory={onAddCategory}
                        className="w-[200px]"
                        type={transaction.type}
                      />
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => saveEdit(transaction.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={cancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    transaction.category
                  )}
                </TableCell>

                {/* Célula de tipo */}
                <TableCell>
                  <Badge
                    variant={transaction.type === "income" ? "outline" : "destructive"}
                    className={
                      transaction.type === "income"
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer"
                        : "cursor-pointer"
                    }
                    onClick={() => onToggleType(transaction.id, transaction.type === "income" ? "expense" : "income")}
                >
                  {transaction.type === "income" ? "Receita" : "Despesa"}
                  </Badge>
              </TableCell>

                {/* Célula de valor */}
                <TableCell className="text-right" onClick={() => startEditing(transaction.id, "amount", transaction.amount)}>
                {editingCell.id === transaction.id && editingCell.field === "amount" ? (
                    <div className="flex items-center justify-end gap-2">
                    <Input
                      ref={inputRef}
                      type="number"
                      value={editValue as number}
                        onChange={(e) => setEditValue(parseFloat(e.target.value))}
                        className="h-8 w-[100px]"
                    />
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => saveEdit(transaction.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={cancelEdit}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                    <span className={transaction.type === "income" ? "text-emerald-600" : "text-rose-600"}>
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </span>
                )}
              </TableCell>

                {/* Botão de excluir */}
              <TableCell>
                <Button
                  variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setDeleteId(transaction.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>

      {/* Versão mobile da tabela */}
      <div className="block sm:hidden">
        <div className="divide-y">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="py-3">
              {/* Linha principal */}
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex-1">
                  {editingCell.id === transaction.id && editingCell.field === "description" ? (
                    <div className="flex items-center gap-2">
                      <Input
                        ref={inputRef}
                        value={editValue as string}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-8 text-sm"
                      />
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => saveEdit(transaction.id)}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={cancelEdit}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="font-medium text-sm line-clamp-1" 
                      onClick={() => startEditing(transaction.id, "description", transaction.description)}
                    >
                      {transaction.description}
                    </div>
                  )}
                </div>
                <div className="ml-2">
                  {editingCell.id === transaction.id && editingCell.field === "amount" ? (
                    <div className="flex items-center gap-2">
                      <Input
                        ref={inputRef}
                        type="number"
                        value={editValue as number}
                        onChange={(e) => setEditValue(parseFloat(e.target.value))}
                        className="h-8 w-[100px] text-sm"
                      />
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => saveEdit(transaction.id)}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={cancelEdit}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className={`font-semibold text-sm ${transaction.type === "income" ? "text-emerald-600" : "text-rose-600"}`}
                      onClick={() => startEditing(transaction.id, "amount", transaction.amount)}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Linha secundária */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {editingCell.id === transaction.id && editingCell.field === "date" ? (
                    <div className="flex items-center gap-2">
                      <Input
                        ref={inputRef}
                        type="date"
                        value={editValue as string}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-7 w-[130px] text-xs"
                      />
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveEdit(transaction.id)}>
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEdit}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <span onClick={() => startEditing(transaction.id, "date", transaction.date)}>
                      {formatDateDisplay(transaction.date)}
                    </span>
                  )}
                  <span>•</span>
                  {editingCell.id === transaction.id && editingCell.field === "category" ? (
                    <div className="flex items-center gap-2">
                      <CategorySelect
                        value={editValue as string}
                        onValueChange={handleCategoryChange}
                        categories={categories}
                        onAddCategory={onAddCategory}
                        className="w-[150px]"
                        type={transaction.type}
                      />
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveEdit(transaction.id)}>
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEdit}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <span onClick={() => startEditing(transaction.id, "category", transaction.category_id || transaction.category)}>
                      {transaction.category}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={transaction.type === "income" ? "outline" : "destructive"}
                    className={`text-[10px] px-1.5 py-0 h-5 ${
                      transaction.type === "income"
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700"
                        : ""
                    }`}
                    onClick={() => onToggleType(transaction.id, transaction.type === "income" ? "expense" : "income")}
                  >
                    {transaction.type === "income" ? "Receita" : "Despesa"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setDeleteId(transaction.id)}
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p>Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
