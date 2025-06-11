"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Edit, Plus, Trash, Search, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuthContext } from "@/contexts/auth-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Category {
  id: string
  name: string
  user_id: string
  created_at: string
  updated_at: string
}

export function CategorySettings() {
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [open, setOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [filterText, setFilterText] = useState("")
  const { toast } = useToast()
  const { token } = useAuthContext()
  const [saving, setSaving] = useState(false)
  
  // Filtrar categorias por texto
  useEffect(() => {
    let result = [...categories]
    
    // Filtrar por texto
    if (filterText) {
      result = result.filter(cat => 
        cat.name.toLowerCase().includes(filterText.toLowerCase())
      )
    }
    
    // Ordenar por nome
    result.sort((a, b) => a.name.localeCompare(b.name))
    
    setFilteredCategories(result)
  }, [categories, filterText])

  useEffect(() => {
    if (token) {
      loadCategories()
    }
  }, [token])

  const loadCategories = async () => {
    if (!token) return
    
    setLoading(true)
    try {
      // Buscamos todas as categorias sem filtrar por tipo
      const response = await fetch("/api/categories", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Erro ao buscar categorias")
      }
      
      const data = await response.json()
      console.log("Categorias carregadas:", data)
      setCategories(data)
    } catch (error) {
      console.error("Erro ao carregar categorias:", error)
      toast({
        title: "Erro ao carregar categorias",
        description: "Não foi possível carregar as categorias. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !token) return

    setSaving(true)
    try {
      if (editingCategory) {
        // Editar categoria existente
        const response = await fetch("/api/categories", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            id: editingCategory.id,
            name: name.trim()
          })
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || "Erro ao atualizar categoria")
        }
        
        toast({
          title: "Categoria atualizada",
          description: `A categoria "${name}" foi atualizada com sucesso.`,
        })
      } else {
        // Criar nova categoria (sem tipo especificado)
        const response = await fetch("/api/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            name: name.trim()
          })
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || "Erro ao criar categoria")
        }
        
        toast({
          title: "Categoria criada",
          description: `A categoria "${name}" foi criada com sucesso.`,
        })
      }

      await loadCategories()
      setOpen(false)
      resetForm()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar categoria"
      console.error("Erro ao salvar categoria:", error)
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingCategory || !token) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/categories?id=${deletingCategory.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Erro ao excluir categoria")
      }
      
      toast({
        title: "Categoria excluída",
        description: `A categoria &quot;${deletingCategory.name}&quot; foi excluída com sucesso.`,
      })
      
      await loadCategories()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao excluir categoria"
      console.error("Erro ao excluir categoria:", error)
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setDeleteDialogOpen(false)
      setDeletingCategory(null)
    }
  }

  const resetForm = () => {
    setEditingCategory(null)
    setName("")
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Categorias</CardTitle>
          <CardDescription>Gerencie as categorias do seu controle financeiro.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-background text-foreground">
            <form onSubmit={handleAddEdit}>
              <DialogHeader>
                <DialogTitle>{editingCategory ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
                <DialogDescription>
                  {editingCategory
                    ? "Edite o nome da categoria existente."
                    : "Adicione uma nova categoria para organizar suas transações."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="col-span-3"
                    maxLength={50}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar categorias..."
              className="pl-10 w-full sm:w-[250px]"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>

          {loading && categories.length === 0 ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center">
                        Nenhuma categoria encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingCategory(category)
                                setName(category.name)
                                setOpen(true)
                              }}
                              disabled={category.user_id === "default"}
                              title={category.user_id === "default" ? "Categorias padrão não podem ser editadas" : "Editar"}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button 
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDeletingCategory(category)
                                setDeleteDialogOpen(true)
                              }}
                              disabled={category.user_id === "default"}
                              title={category.user_id === "default" ? "Categorias padrão não podem ser excluídas" : "Excluir"}
                            >
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Excluir</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmação de exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria &quot;{deletingCategory?.name}&quot;?
              <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                <strong>Atenção:</strong> Não será possível excluir categorias que possuem transações ou parcelamentos associados.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
