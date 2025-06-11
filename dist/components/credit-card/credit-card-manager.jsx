"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditCardManager = CreditCardManager;
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const dialog_1 = require("@/components/ui/dialog");
const lucide_react_1 = require("lucide-react");
const use_toast_1 = require("@/components/ui/use-toast");
const auth_context_1 = require("@/contexts/auth-context");
function CreditCardManager({ buttonProps }) {
    const [cards, setCards] = (0, react_1.useState)([]);
    const [isOpen, setIsOpen] = (0, react_1.useState)(false);
    const [isEditing, setIsEditing] = (0, react_1.useState)(false);
    const [currentCard, setCurrentCard] = (0, react_1.useState)(null);
    const [formData, setFormData] = (0, react_1.useState)({
        name: "",
        color: "#1976d2",
        lastFourDigits: ""
    });
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    const [errorMessage, setErrorMessage] = (0, react_1.useState)("");
    const [deleteConfirmOpen, setDeleteConfirmOpen] = (0, react_1.useState)(false);
    const [cardToDelete, setCardToDelete] = (0, react_1.useState)(null);
    const [deleteError, setDeleteError] = (0, react_1.useState)("");
    const { toast } = (0, use_toast_1.useToast)();
    const { token } = (0, auth_context_1.useAuthContext)();
    const MAX_CARDS = 6;
    const MAX_NAME_LENGTH = 50;
    const [limitError, setLimitError] = (0, react_1.useState)("");
    const [saving, setSaving] = (0, react_1.useState)(false);
    const fetchCards = async () => {
        try {
            if (!token) {
                console.error("Token não disponível");
                return;
            }
            const response = await fetch("/api/credit-cards", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Erro ao buscar cartões:", errorData.message || response.statusText);
                toast({
                    title: "Erro",
                    description: "Não foi possível carregar os cartões",
                    variant: "destructive"
                });
                return;
            }
            const data = await response.json();
            setCards(Array.isArray(data) ? data : []);
        }
        catch (error) {
            console.error("Erro ao buscar cartões:", error);
            setCards([]);
            toast({
                title: "Erro",
                description: "Não foi possível carregar os cartões",
                variant: "destructive"
            });
        }
    };
    (0, react_1.useEffect)(() => {
        if (isOpen && token) {
            fetchCards();
        }
    }, [isOpen, token]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validações de segurança
        if (!formData.name.trim()) {
            setErrorMessage("O nome do cartão é obrigatório");
            return;
        }
        if (formData.name.length > MAX_NAME_LENGTH) {
            setErrorMessage(`O nome do cartão deve ter no máximo ${MAX_NAME_LENGTH} caracteres`);
            return;
        }
        if (formData.lastFourDigits && !/^\d{0,4}$/.test(formData.lastFourDigits)) {
            setErrorMessage("Os últimos dígitos devem conter apenas números (máx. 4 dígitos)");
            return;
        }
        if (!isEditing && cards.length >= MAX_CARDS) {
            setLimitError(`Você só pode cadastrar até ${MAX_CARDS} cartões. Exclua um cartão para adicionar outro.`);
            toast({
                title: "Limite atingido",
                description: `Você só pode cadastrar até ${MAX_CARDS} cartões. Exclua um cartão para adicionar outro.`,
                variant: "destructive"
            });
            return;
        }
        else {
            setLimitError("");
        }
        setIsSubmitting(true);
        setErrorMessage("");
        try {
            if (!token) {
                throw new Error("Usuário não autenticado");
            }
            const url = "/api/credit-cards";
            const method = isEditing ? "PUT" : "POST";
            const body = {
                ...formData,
                name: formData.name.trim(),
                lastFourDigits: formData.lastFourDigits.trim() || null,
                id: isEditing && currentCard ? currentCard.id : undefined
            };
            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });
            const responseData = await response.json();
            if (!response.ok) {
                throw new Error(responseData.message || "Erro ao salvar cartão");
            }
            toast({
                title: "Sucesso",
                description: isEditing ? "Cartão atualizado com sucesso" : "Cartão criado com sucesso"
            });
            setIsOpen(false);
            fetchCards();
            resetForm();
        }
        catch (error) {
            console.error("Erro ao salvar cartão:", error);
            setErrorMessage(error instanceof Error ? error.message : "Não foi possível salvar o cartão");
            toast({
                title: "Erro",
                description: "Não foi possível salvar o cartão",
                variant: "destructive"
            });
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleEdit = (card) => {
        setCurrentCard(card);
        setFormData({
            name: card.name,
            color: card.color,
            lastFourDigits: card.lastFourDigits || ""
        });
        setIsEditing(true);
        setIsOpen(true);
        setErrorMessage("");
    };
    const openDeleteConfirmation = (card) => {
        setCardToDelete(card);
        setDeleteError("");
        setDeleteConfirmOpen(true);
    };
    const handleConfirmDelete = async () => {
        if (!cardToDelete || !token) {
            setDeleteConfirmOpen(false);
            return;
        }
        setIsSubmitting(true);
        setDeleteError("");
        try {
            const response = await fetch(`/api/credit-cards?id=${cardToDelete.id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                const errorMsg = data.message || "Erro ao excluir cartão";
                console.error(errorMsg);
                // Mensagem amigável para cartões com parcelamentos
                if (errorMsg.includes("parcelamentos associados")) {
                    setDeleteError("Este cartão não pode ser excluído pois possui parcelamentos associados a ele. Remova os parcelamentos primeiro.");
                }
                else {
                    setDeleteError(errorMsg);
                }
                return;
            }
            toast({
                title: "Sucesso",
                description: "Cartão excluído com sucesso"
            });
            setDeleteConfirmOpen(false);
            fetchCards();
        }
        catch (error) {
            console.error("Erro ao excluir cartão:", error);
            setDeleteError("Não foi possível excluir o cartão. Tente novamente mais tarde.");
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleDelete = (card) => {
        openDeleteConfirmation(card);
    };
    const resetForm = () => {
        setFormData({
            name: "",
            color: "#1976d2",
            lastFourDigits: ""
        });
        setCurrentCard(null);
        setIsEditing(false);
        setErrorMessage("");
    };
    const sanitizeInput = (input) => {
        // Remove caracteres potencialmente perigosos
        return input.replace(/[<>"'&]/g, "");
    };
    return (<>
      <dialog_1.Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open)
                resetForm();
        }}>
        <dialog_1.DialogTrigger asChild>
          <button_1.Button variant="default" {...buttonProps}>
            <lucide_react_1.CreditCard className="h-5 w-5 mr-2"/>
            Gerenciar Cartões
          </button_1.Button>
        </dialog_1.DialogTrigger>
        <dialog_1.DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
          <div className="flex flex-col max-h-[90vh]">
            <dialog_1.DialogHeader className="p-6 pb-4">
              <dialog_1.DialogTitle className="flex items-center gap-2">
                {isEditing ? <lucide_react_1.Pencil className="h-5 w-5 text-primary"/> : <lucide_react_1.Plus className="h-5 w-5 text-primary"/>}
                {isEditing ? "Editar Cartão" : "Novo Cartão"}
              </dialog_1.DialogTitle>
              <dialog_1.DialogDescription>Cadastre até 6 cartões para usar em seus parcelamentos.</dialog_1.DialogDescription>
            </dialog_1.DialogHeader>
            
            <div className="flex-1 overflow-y-auto px-6">
              <form onSubmit={handleSubmit} className="space-y-6 mb-8">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <label_1.Label htmlFor="color">Cor</label_1.Label>
                    <input id="color" type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-10 h-10 rounded-full border-none shadow" style={{ background: formData.color }}/>
                  </div>
                  <div>
                    <label_1.Label htmlFor="name">Nome do Cartão</label_1.Label>
                    <input_1.Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: sanitizeInput(e.target.value).substring(0, MAX_NAME_LENGTH) })} required className="h-12 text-base" placeholder="Ex: Nubank, Itaú, Santander..." maxLength={MAX_NAME_LENGTH}/>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.name.length}/{MAX_NAME_LENGTH} caracteres
                    </p>
                  </div>
                  <div>
                    <label_1.Label htmlFor="lastFourDigits">Últimos 4 dígitos (opcional)</label_1.Label>
                    <input_1.Input id="lastFourDigits" value={formData.lastFourDigits} onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "").substring(0, 4);
            setFormData({ ...formData, lastFourDigits: value });
        }} maxLength={4} pattern="[0-9]*" inputMode="numeric" className="h-12 text-base" placeholder="0000"/>
                  </div>
                </div>
                
                {errorMessage && (<div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md text-sm">
                    {errorMessage}
                  </div>)}
                
                <div className="flex justify-end gap-2 mt-4">
                  <button_1.Button type="submit" size="lg" className="h-11 px-8" disabled={isSubmitting || (!isEditing && cards.length >= MAX_CARDS)}>
                    {isSubmitting ? "Salvando..." : isEditing ? "Atualizar" : "Salvar"}
                  </button_1.Button>
                </div>
                
                {(!isEditing && cards.length >= MAX_CARDS) && (<div className="flex items-center justify-center gap-2 mt-4 mx-auto max-w-xs border border-[#232946] bg-[#f3f3ff] text-[#232946] rounded-md px-4 py-2 text-sm">
                    <lucide_react_1.Info className="h-4 w-4 text-[#232946]"/>
                    <span>Você só pode cadastrar até {MAX_CARDS} cartões. Exclua um cartão para adicionar outro.</span>
                  </div>)}
              </form>
              
              <div className="space-y-4 mb-8">
                <h3 className="font-medium text-lg mb-2">Cartões Cadastrados</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {cards.length === 0 && <div className="text-muted-foreground text-sm">Nenhum cartão cadastrado ainda.</div>}
                  {Array.isArray(cards) && cards.map((card) => (<div key={card.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted" style={{ borderLeftColor: card.color, borderLeftWidth: 6 }}>
                      <div className="flex items-center gap-3">
                        <lucide_react_1.CreditCard className="h-5 w-5" style={{ color: card.color }}/>
                        <span className="font-medium text-base">{card.name}</span>
                        {card.lastFourDigits && (<span className="text-xs text-muted-foreground">
                            •••• {card.lastFourDigits}
                          </span>)}
                      </div>
                      <div className="flex gap-2">
                        <button_1.Button variant="ghost" size="icon" onClick={() => handleEdit(card)}>
                          <lucide_react_1.Pencil className="h-4 w-4"/>
                        </button_1.Button>
                        <button_1.Button variant="ghost" size="icon" onClick={() => handleDelete(card)}>
                          <lucide_react_1.Trash2 className="h-4 w-4"/>
                        </button_1.Button>
                      </div>
                    </div>))}
                </div>
              </div>
            </div>
          </div>
        </dialog_1.DialogContent>
      </dialog_1.Dialog>

      {/* Modal de confirmação de exclusão */}
      <dialog_1.Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <dialog_1.DialogContent className="sm:max-w-[425px]">
          <dialog_1.DialogHeader>
            <dialog_1.DialogTitle className="flex items-center gap-2">
              <lucide_react_1.AlertTriangle className="h-5 w-5 text-destructive"/>
              Confirmar exclusão
            </dialog_1.DialogTitle>
            <dialog_1.DialogDescription>
              Tem certeza que deseja excluir o cartão{" "}
              <span className="font-semibold">{cardToDelete?.name}</span>?
            </dialog_1.DialogDescription>
          </dialog_1.DialogHeader>
          
          {deleteError && (<div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md text-sm flex items-start gap-3">
              <lucide_react_1.AlertCircle className="h-5 w-5 shrink-0 mt-0.5"/>
              <span>{deleteError}</span>
            </div>)}
          
          <dialog_1.DialogFooter className="gap-2 sm:gap-0 mt-4">
            <button_1.Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={isSubmitting}>
              Cancelar
            </button_1.Button>
            <button_1.Button variant="destructive" onClick={handleConfirmDelete} disabled={isSubmitting}>
              {isSubmitting ? "Excluindo..." : "Excluir cartão"}
            </button_1.Button>
          </dialog_1.DialogFooter>
        </dialog_1.DialogContent>
      </dialog_1.Dialog>
    </>);
}
