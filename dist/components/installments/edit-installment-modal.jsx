"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditInstallmentModal = EditInstallmentModal;
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const dialog_1 = require("@/components/ui/dialog");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const utils_1 = require("@/lib/utils");
const category_select_1 = require("@/components/ui/category-select");
const credit_card_manager_1 = require("@/components/credit-card/credit-card-manager");
const select_1 = require("@/components/ui/select");
const auth_context_1 = require("@/contexts/auth-context");
const use_toast_1 = require("@/components/ui/use-toast");
// Categorias disponíveis
const categories = [
    { value: "eletronicos", label: "Eletrônicos" },
    { value: "moveis", label: "Móveis" },
    { value: "vestuario", label: "Vestuário" },
    { value: "educacao", label: "Educação" },
    { value: "saude", label: "Saúde" },
    { value: "lazer", label: "Lazer" },
    { value: "outros", label: "Outros" },
];
function EditInstallmentModal({ isOpen, onClose, onSave, installment }) {
    const { toast } = (0, use_toast_1.useToast)();
    const { token } = (0, auth_context_1.useAuthContext)();
    const [date, setDate] = (0, react_1.useState)(installment.startDate);
    const [description, setDescription] = (0, react_1.useState)(installment.description);
    const [category, setCategory] = (0, react_1.useState)(installment.category_id);
    const [installments, setInstallments] = (0, react_1.useState)(installment.totalInstallments);
    const [paidInstallments, setPaidInstallments] = (0, react_1.useState)(installment.paidInstallments);
    const [installmentAmount, setInstallmentAmount] = (0, react_1.useState)(installment.installmentAmount);
    const [totalAmount, setTotalAmount] = (0, react_1.useState)(installment.totalAmount);
    const [calculationMode, setCalculationMode] = (0, react_1.useState)("total");
    const [categories, setCategories] = (0, react_1.useState)([]);
    const [loadingCategories, setLoadingCategories] = (0, react_1.useState)(true);
    const [installmentAmountInput, setInstallmentAmountInput] = (0, react_1.useState)("");
    const [creditCards, setCreditCards] = (0, react_1.useState)([]);
    const [selectedCardId, setSelectedCardId] = (0, react_1.useState)(installment.creditCardId || "");
    const [saving, setSaving] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const fetchCategories = async () => {
            try {
                setLoadingCategories(true);
                const response = await fetch(`/api/categories?type=expense`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error("Erro ao buscar categorias:", errorData);
                    throw new Error(errorData.message || "Erro ao buscar categorias");
                }
                const data = await response.json();
                console.log("Categorias recebidas:", data); // Debug
                setCategories(Array.isArray(data)
                    ? data.map((cat) => ({
                        value: cat.id,
                        label: cat.name
                    }))
                    : []);
            }
            catch (error) {
                console.error(error);
                toast({
                    title: "Erro",
                    description: "Não foi possível carregar as categorias",
                    variant: "destructive"
                });
            }
            finally {
                setLoadingCategories(false);
            }
        };
        if (token) {
            fetchCategories();
        }
    }, [token, toast]);
    (0, react_1.useEffect)(() => {
        const fetchCards = async () => {
            try {
                const response = await fetch("/api/credit-cards", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await response.json();
                setCreditCards(Array.isArray(data) ? data : []);
            }
            catch (error) {
                console.error("Erro ao buscar cartões:", error);
                setCreditCards([]);
            }
        };
        if (token) {
            fetchCards();
        }
        else {
            setCreditCards([]);
        }
    }, [token]);
    // Atualizar os estados quando o parcelamento mudar
    (0, react_1.useEffect)(() => {
        setDate(installment.startDate);
        setDescription(installment.description);
        setCategory(installment.category_id);
        setInstallments(installment.totalInstallments);
        setPaidInstallments(installment.paidInstallments);
        setInstallmentAmount(installment.installmentAmount);
        setTotalAmount(installment.totalAmount);
    }, [installment]);
    // Calcular o valor total ou o valor da parcela quando um deles mudar
    (0, react_1.useEffect)(() => {
        if (calculationMode === "total" && installments > 0) {
            setInstallmentAmount(totalAmount / installments);
        }
        else if (calculationMode === "installment" && installments > 0) {
            setTotalAmount(installmentAmount * installments);
        }
    }, [totalAmount, installmentAmount, installments, calculationMode]);
    (0, react_1.useEffect)(() => {
        if (installmentAmount > 0) {
            setInstallmentAmountInput((0, utils_1.formatCurrency)(installmentAmount).replace("R$", "").trim());
        }
        else {
            setInstallmentAmountInput("");
        }
    }, [installmentAmount]);
    const handleTotalAmountChange = (value) => {
        const numericValue = Number.parseFloat(value.replace(/[^\d,-]/g, "").replace(",", "."));
        if (!isNaN(numericValue)) {
            setTotalAmount(numericValue);
            setCalculationMode("total");
        }
    };
    const handleInstallmentAmountChange = (value) => {
        setInstallmentAmountInput(value);
        const numericValue = Number.parseFloat(value.replace(/[^\\d,-]/g, "").replace(",", "."));
        if (!isNaN(numericValue)) {
            setInstallmentAmount(numericValue);
            setCalculationMode("installment");
        }
    };
    const handleInstallmentAmountBlur = () => {
        if (installmentAmount > 0) {
            setInstallmentAmountInput((0, utils_1.formatCurrency)(installmentAmount).replace("R$", "").trim());
        }
        else {
            setInstallmentAmountInput("");
        }
    };
    const handleSave = () => {
        if (!description || !category || installments <= 0 || totalAmount <= 0) {
            return;
        }
        const updatedInstallment = {
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
        };
        onSave(updatedInstallment);
    };
    return (<dialog_1.Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                onClose();
            }
        }}>
      <dialog_1.DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
        <div className="flex flex-col max-h-[90vh]">
          <dialog_1.DialogHeader className="p-8 pb-4">
            <dialog_1.DialogTitle className="text-xl font-bold">Editar Parcelamento</dialog_1.DialogTitle>
            <dialog_1.DialogDescription className="text-base mt-3">Modifique os detalhes do parcelamento.</dialog_1.DialogDescription>
          </dialog_1.DialogHeader>

          <div className="flex-1 overflow-y-auto px-8">
            <div className="space-y-8 pb-4">
              <div className="grid grid-cols-2 gap-6">
                {/* Data da Compra */}
                <div className="space-y-3">
                  <label_1.Label htmlFor="date" className="text-sm font-medium block">
                    Data da Compra
                  </label_1.Label>
                  <input_1.Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12"/>
                </div>

                {/* Descrição */}
                <div className="space-y-3">
                  <label_1.Label htmlFor="description" className="text-sm font-medium block">
                    Descrição
                  </label_1.Label>
                  <input_1.Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="h-12" placeholder="Ex: Notebook Dell"/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Categoria */}
                <div className="space-y-3">
                  <label_1.Label htmlFor="category" className="text-sm font-medium block">
                    Categoria
                  </label_1.Label>
                  <category_select_1.CategorySelect value={category} onValueChange={setCategory} categories={categories} onAddCategory={(newCategory) => {
            setCategory(newCategory.value);
        }} className="h-12"/>
                </div>

                {/* Quantidade de Parcelas */}
                <div className="space-y-3">
                  <label_1.Label htmlFor="installments" className="text-sm font-medium block">
                    Total de Parcelas
                  </label_1.Label>
                  <div className="flex items-center gap-4">
                    <input_1.Input id="installments" type="number" min="1" max="48" value={installments} onChange={(e) => setInstallments(Number.parseInt(e.target.value) || 1)} className="w-full h-12"/>
                  </div>
                </div>
              </div>

              {/* Cartão de Crédito */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label_1.Label htmlFor="creditCard" className="text-sm font-medium block">Cartão de Crédito <span className="text-xs text-muted-foreground">(opcional)</span></label_1.Label>
                  <credit_card_manager_1.CreditCardManager buttonProps={{ size: "sm", className: "h-9" }}/>
                </div>
                <select_1.Select value={selectedCardId || ""} onValueChange={setSelectedCardId}>
                  <select_1.SelectTrigger className="h-12">
                    <select_1.SelectValue placeholder="Selecione um cartão (opcional)"/>
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    {Array.isArray(creditCards) && creditCards
            .filter(card => card && card.id !== undefined && card.id !== null && card.id !== "")
            .map(card => (<select_1.SelectItem key={card.id} value={card.id.toString()}>
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: card.color }}/>
                            {card.name}
                            {card.lastFourDigits && (<span className="text-xs text-muted-foreground">•••• {card.lastFourDigits}</span>)}
                          </span>
                        </select_1.SelectItem>))}
                  </select_1.SelectContent>
                </select_1.Select>
                {selectedCardId && Array.isArray(creditCards) && (<div className="mt-2 flex items-center gap-2">
                    {creditCards
                .filter(c => c && c.id && c.id.toString() === selectedCardId)
                .map(card => (<span key={card.id} className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: card.color, color: '#fff' }}>
                          <span>{card.name}</span>
                          {card.lastFourDigits && <span>•••• {card.lastFourDigits}</span>}
                        </span>))}
                  </div>)}
              </div>

              {/* Valores */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label_1.Label htmlFor="installmentAmount" className="text-sm font-medium block">
                    Valor da Parcela
                  </label_1.Label>
                  <input_1.Input id="installmentAmount" value={installmentAmountInput} onChange={(e) => handleInstallmentAmountChange(e.target.value)} onBlur={handleInstallmentAmountBlur} placeholder="0,00" className="h-12"/>
                </div>

                <div className="space-y-3">
                  <label_1.Label htmlFor="totalAmount" className="text-sm font-medium block">
                    Valor Total
                  </label_1.Label>
                  <input_1.Input id="totalAmount" value={totalAmount > 0 ? (0, utils_1.formatCurrency)(totalAmount).replace("R$", "").trim() : ""} onChange={(e) => handleTotalAmountChange(e.target.value)} placeholder="0,00" className="text-right h-12"/>
                </div>
              </div>

              {/* Resumo */}
              <div className="mt-6">
                <div className="rounded-md bg-muted p-6">
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total a pagar:</span>
                    <span>{(0, utils_1.formatCurrency)(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground mt-4">
                    <span>{installments}x de:</span>
                    <span>{(0, utils_1.formatCurrency)(installmentAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>Parcelas restantes:</span>
                    <span>{installments - paidInstallments}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <dialog_1.DialogFooter className="p-8 pt-4">
            <button_1.Button variant="outline" onClick={onClose} size="lg" className="h-12">
              Cancelar
            </button_1.Button>
            <button_1.Button onClick={handleSave} size="lg" className="h-12">
              Salvar Alterações
            </button_1.Button>
          </dialog_1.DialogFooter>
        </div>
      </dialog_1.DialogContent>
    </dialog_1.Dialog>);
}
