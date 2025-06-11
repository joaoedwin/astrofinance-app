"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, CreditCard, Pencil, Trash2, Info, AlertTriangle, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuthContext } from "@/contexts/auth-context"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CreditCard {
  id: number | string
  name: string
  color: string
  lastFourDigits?: string
}

interface CreditCardManagerProps {
  buttonProps?: React.ComponentProps<typeof Button>
  isDialog?: boolean
}

export function CreditCardManager({ buttonProps, isDialog = false }: CreditCardManagerProps) {
  const [cards, setCards] = useState<CreditCard[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentCard, setCurrentCard] = useState<CreditCard | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    color: "#1976d2",
    lastFourDigits: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [cardToDelete, setCardToDelete] = useState<CreditCard | null>(null)
  const [deleteError, setDeleteError] = useState("")
  const { toast } = useToast()
  const { token } = useAuthContext()
  const MAX_CARDS = 6;
  const MAX_NAME_LENGTH = 50;
  const [limitError, setLimitError] = useState("");

  const fetchCards = async () => {
    try {
      if (!token) {
        console.error("Token não disponível")
        return
      }
      
      const response = await fetch("/api/credit-cards", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Erro ao buscar cartões:", errorData.message || response.statusText)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os cartões",
          variant: "destructive"
        })
        return
      }
      
      const data = await response.json()
      const cardList = Array.isArray(data) ? data : []
      setCards(cardList)
      
      // Check if limit is reached when fetching cards
      if (cardList.length >= MAX_CARDS) {
        setLimitError(`Você só pode cadastrar até ${MAX_CARDS} cartões. Exclua um cartão para adicionar outro.`)
      } else {
        setLimitError("")
      }
    } catch (error) {
      console.error("Erro ao buscar cartões:", error)
      setCards([])
      toast({
        title: "Erro",
        description: "Não foi possível carregar os cartões",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    // Fetch cards on mount or when token changes
    if (token) {
      fetchCards()
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validações de segurança
    if (!formData.name.trim()) {
      setErrorMessage("O nome do cartão é obrigatório")
      return
    }
    
    if (formData.name.length > MAX_NAME_LENGTH) {
      setErrorMessage(`O nome do cartão deve ter no máximo ${MAX_NAME_LENGTH} caracteres`)
      return
    }
    
    if (formData.lastFourDigits && !/^\d{0,4}$/.test(formData.lastFourDigits)) {
      setErrorMessage("Os últimos dígitos devem conter apenas números (máx. 4 dígitos)")
      return
    }
    
    setIsSubmitting(true)
    setErrorMessage("")
    
    try {
      if (!token) {
        throw new Error("Usuário não autenticado")
      }
      
      let response;
      
      if (isEditing && currentCard) {
        // Update existing card
        response = await fetch("/api/credit-cards", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            id: currentCard.id,
            name: formData.name.trim(),
            color: formData.color,
            lastFourDigits: formData.lastFourDigits.trim() || null
          })
        });
      } else {
        // Create new card
        response = await fetch("/api/credit-cards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            color: formData.color,
            lastFourDigits: formData.lastFourDigits.trim() || null
          })
        });
      }

      const responseData = await response.json()
      
      if (!response.ok) {
        throw new Error(responseData.message || "Erro ao salvar cartão")
      }

      toast({
        title: "Sucesso",
        description: isEditing ? "Cartão atualizado com sucesso" : "Cartão criado com sucesso"
      })

      if (isDialog) {
        setIsOpen(false)
      }
      fetchCards()
      resetForm()
    } catch (error) {
      console.error("Erro ao salvar cartão:", error)
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível salvar o cartão")
      toast({
        title: "Erro",
        description: "Não foi possível salvar o cartão",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (card: CreditCard) => {
    setCurrentCard(card)
    setFormData({
      name: card.name,
      color: card.color,
      lastFourDigits: card.lastFourDigits || ""
    })
    setIsEditing(true)
    if (isDialog) {
      setIsOpen(true)
    }
    setErrorMessage("")
  }

  const openDeleteConfirmation = (card: CreditCard) => {
    setCardToDelete(card)
    setDeleteError("")
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!cardToDelete || !token) {
      setDeleteConfirmOpen(false)
      return
    }

    setIsSubmitting(true)
    setDeleteError("")
    
    try {
      const response = await fetch(`/api/credit-cards?id=${cardToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      const data = await response.json().catch(() => ({}))
      
      if (!response.ok) {
        const errorMsg = data.message || "Erro ao excluir cartão"
        console.error(errorMsg)
        
        // Mensagem amigável para cartões com parcelamentos
        if (errorMsg.includes("parcelamentos associados")) {
          setDeleteError("Este cartão não pode ser excluído pois possui parcelamentos associados a ele. Remova os parcelamentos primeiro.")
        } else {
          setDeleteError(errorMsg)
        }
        return
      }

      toast({
        title: "Sucesso",
        description: "Cartão excluído com sucesso"
      })

      setDeleteConfirmOpen(false)
      fetchCards()
    } catch (error) {
      console.error("Erro ao excluir cartão:", error)
      setDeleteError("Não foi possível excluir o cartão. Tente novamente mais tarde.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = (card: CreditCard) => {
    openDeleteConfirmation(card)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      color: "#1976d2",
      lastFourDigits: ""
    })
    setCurrentCard(null)
    setIsEditing(false)
    setErrorMessage("")
  }

  // Renderiza apenas o conteúdo interno, sem o Dialog
  const renderContent = () => (
    <>
      {!isEditing && (
        <div className="grid gap-3 sm:gap-4 mt-2">
          {cards.length === 0 ? (
            <div className="text-center py-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-sm sm:text-base">Nenhum cartão cadastrado</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Adicione seu primeiro cartão de crédito
              </p>
            </div>
          ) : (
            <>
              {cards.map((card) => (
                <div key={card.id} className="flex items-center justify-between p-2 sm:p-3 border rounded-md">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div
                      className="w-3 h-3 sm:w-4 sm:h-4 rounded-full"
                      style={{ backgroundColor: card.color || "#888888" }}
                    />
                    <div>
                      <p className="font-medium text-xs sm:text-sm">{card.name}</p>
                      {card.lastFourDigits && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          •••• {card.lastFourDigits}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      onClick={() => handleEdit(card)}
                    >
                      <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-destructive"
                      onClick={() => handleDelete(card)}
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="sr-only">Excluir</span>
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}
          
          {limitError && (
            <div className="mt-2 text-destructive text-[10px] sm:text-xs flex items-center gap-1">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{limitError}</span>
            </div>
          )}
          
          {cards.length < MAX_CARDS && (
            <Button 
              className="mt-2 h-8 sm:h-10 text-xs sm:text-sm"
              onClick={() => {
                resetForm()
                setIsEditing(true)
              }}
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Adicionar Cartão
            </Button>
          )}
        </div>
      )}
      
      {isEditing && (
        <form id="credit-card-form" onSubmit={handleSubmit} className="grid gap-3 sm:gap-4 mt-2">
          <div>
            <Label htmlFor="name" className="text-xs sm:text-sm">Nome do cartão</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              maxLength={MAX_NAME_LENGTH}
              className="h-8 sm:h-10 text-xs sm:text-sm"
            />
          </div>
          
          <div>
            <Label htmlFor="lastFourDigits" className="text-xs sm:text-sm">
              Últimos 4 dígitos (opcional)
            </Label>
            <Input
              id="lastFourDigits"
              value={formData.lastFourDigits}
              onChange={(e) => setFormData({ ...formData, lastFourDigits: e.target.value.replace(/\D/g, '').slice(0, 4) })}
              maxLength={4}
              className="h-8 sm:h-10 text-xs sm:text-sm"
            />
          </div>
          
          <div>
            <Label htmlFor="color" className="text-xs sm:text-sm">Cor do cartão</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                id="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-8 sm:h-10 w-12"
              />
              <div className="flex-1 p-2 border rounded-md flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: formData.color }}
                />
                <span className="text-xs sm:text-sm">{formData.name || "Nome do cartão"}</span>
              </div>
            </div>
          </div>
          
          {errorMessage && (
            <div className="text-destructive text-[10px] sm:text-xs flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{errorMessage}</span>
            </div>
          )}
          
          <div className="flex justify-end gap-2 w-full mt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                resetForm()
                setIsEditing(false)
              }}
              className="h-8 sm:h-10 text-xs sm:text-sm"
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="h-8 sm:h-10 text-xs sm:text-sm"
            >
              {isSubmitting ? "Salvando..." : currentCard ? "Atualizar" : "Adicionar"}
            </Button>
          </div>
        </form>
      )}
    </>
  )

  // Dialog para confirmação de exclusão
  const renderDeleteConfirmDialog = () => (
    <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Excluir Cartão</DialogTitle>
        </DialogHeader>

        {cardToDelete && (
          <div className="flex items-center gap-3 p-3 border rounded-md my-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: cardToDelete.color || "#888888" }}
            />
            <div>
              <p className="font-medium text-sm">{cardToDelete.name}</p>
              {cardToDelete.lastFourDigits && (
                <p className="text-xs text-muted-foreground">
                  •••• {cardToDelete.lastFourDigits}
                </p>
              )}
            </div>
          </div>
        )}

        {deleteError && (
          <div className="text-destructive text-xs flex items-center gap-1 border border-destructive/20 bg-destructive/10 p-3 rounded-md">
            <AlertTriangle className="h-4 w-4" />
            <span>{deleteError}</span>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setDeleteConfirmOpen(false)}
            className="h-8 sm:h-10 text-xs sm:text-sm"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={isSubmitting}
            className="h-8 sm:h-10 text-xs sm:text-sm"
          >
            {isSubmitting ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // Componente principal
  return (
    <>
      {/* Conteúdo principal */}
      <ScrollArea className="flex-1 pr-4 -mr-4">
        {renderContent()}
      </ScrollArea>
      
      {/* Dialog de confirmação de exclusão */}
      {renderDeleteConfirmDialog()}
    </>
  )
} 