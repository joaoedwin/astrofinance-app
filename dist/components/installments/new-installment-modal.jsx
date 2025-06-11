"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewInstallmentModal = NewInstallmentModal;
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const dialog_1 = require("@/components/ui/dialog");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/lib/utils");
const tooltip_1 = require("@/components/ui/tooltip");
const category_select_1 = require("@/components/ui/category-select");
const credit_card_manager_1 = require("@/components/credit-card/credit-card-manager");
const select_1 = require("@/components/ui/select");
const auth_context_1 = require("@/contexts/auth-context");
const use_toast_1 = require("@/components/ui/use-toast");
function NewInstallmentModal({ isOpen, onClose, onSave }) {
    const { toast } = (0, use_toast_1.useToast)();
    const { token } = (0, auth_context_1.useAuthContext)();
    const [date, setDate] = (0, react_1.useState)(() => {
        const today = new Date();
        const offset = today.getTimezoneOffset();
        return new Date(today.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
    });
    const [description, setDescription] = (0, react_1.useState)("");
    const [category, setCategory] = (0, react_1.useState)("");
    const [installments, setInstallments] = (0, react_1.useState)(1);
    const [installmentAmount, setInstallmentAmount] = (0, react_1.useState)(0);
    const [totalAmount, setTotalAmount] = (0, react_1.useState)(0);
    const [calculationMode, setCalculationMode] = (0, react_1.useState)("total");
    const [categories, setCategories] = (0, react_1.useState)([]);
    const [loadingCategories, setLoadingCategories] = (0, react_1.useState)(true);
    const [installmentAmountInput, setInstallmentAmountInput] = (0, react_1.useState)("");
    const [totalAmountInput, setTotalAmountInput] = (0, react_1.useState)("");
    const [lastEdited, setLastEdited] = (0, react_1.useState)("installment");
    const [creditCards, setCreditCards] = (0, react_1.useState)([]);
    const [selectedCardId, setSelectedCardId] = (0, react_1.useState)("none");
    const [saving, setSaving] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const fetchCategories = async () => {
            try {
                setLoadingCategories(true);
                // Buscamos todas as categorias sem filtro
                const response = await fetch(`/api/categories`, {
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
    const formatBRL = (value) => value.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    const handleInstallmentAmountChange = (value) => {
        setInstallmentAmountInput(value);
        setLastEdited("installment");
        const parcela = parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.'));
        if (!isNaN(parcela) && parcela > 0 && installments > 0) {
            const total = parcela * installments;
            setTotalAmountInput(formatBRL(total));
        }
    };
    const handleTotalAmountChange = (value) => {
        setTotalAmountInput(value);
        setLastEdited("total");
        const total = parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.'));
        if (!isNaN(total) && total > 0 && installments > 0) {
            const parcela = total / installments;
            setInstallmentAmountInput(formatBRL(parcela));
        }
    };
    const handleInstallmentsChange = (value) => {
        const n = parseInt(value);
        setInstallments(n);
        if (lastEdited === "installment") {
            const parcela = parseFloat(installmentAmountInput.replace(/[^\d,-]/g, "").replace(",", "."));
            if (!isNaN(parcela) && parcela > 0 && n > 0) {
                const total = parcela * n;
                setTotalAmountInput(formatBRL(total));
            }
        }
        else {
            const total = parseFloat(totalAmountInput.replace(/[^\d,-]/g, "").replace(",", "."));
            if (!isNaN(total) && total > 0 && n > 0) {
                const parcela = total / n;
                setInstallmentAmountInput(formatBRL(parcela));
            }
        }
    };
    // Para salvar, converter os valores string para número
    const getInstallmentAmount = () => parseFloat(installmentAmountInput.replace(/[^\d,-]/g, "").replace(",", ".")) || 0;
    const getTotalAmount = () => parseFloat(totalAmountInput.replace(/[^\d,-]/g, "").replace(",", ".")) || 0;
    const handleSave = () => {
        if (!description || !category || installments <= 0 || getTotalAmount() <= 0) {
            return;
        }
        const newInstallment = {
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
        };
        onSave(newInstallment);
        resetForm();
    };
    const resetForm = () => {
        setDate(() => {
            const today = new Date();
            const offset = today.getTimezoneOffset();
            return new Date(today.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
        });
        setDescription("");
        setCategory("");
        setInstallments(1);
        setInstallmentAmountInput("");
        setTotalAmountInput("");
        setLastEdited("installment");
        setSelectedCardId("none");
    };
    // Sincronizar os campos conforme o último editado
    (0, react_1.useEffect)(() => {
        if (lastEdited === 'installment' && installmentAmount > 0 && installments > 0) {
            const total = installmentAmount * installments;
            setTotalAmount(total);
            setTotalAmountInput(total > 0 ? (0, utils_1.formatCurrency)(total).replace("R$", "").trim() : "");
        }
        if (lastEdited === 'total' && totalAmount > 0 && installments > 0) {
            const parcela = totalAmount / installments;
            setInstallmentAmount(parcela);
            setInstallmentAmountInput(parcela > 0 ? (0, utils_1.formatCurrency)(parcela).replace("R$", "").trim() : "");
        }
        // eslint-disable-next-line
    }, [installmentAmount, totalAmount, installments, lastEdited]);
    // Sincronizar os inputs ao abrir/fechar modal
    (0, react_1.useEffect)(() => {
        setInstallmentAmountInput(installmentAmount > 0 ? (0, utils_1.formatCurrency)(installmentAmount).replace("R$", "").trim() : "");
        setTotalAmountInput(totalAmount > 0 ? (0, utils_1.formatCurrency)(totalAmount).replace("R$", "").trim() : "");
    }, [isOpen]);
    console.log('creditCards:', creditCards);
    return (<dialog_1.Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                onClose();
                resetForm();
            }
        }}>
      <dialog_1.DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
        <div className="flex flex-col max-h-[90vh]">
          <dialog_1.DialogHeader className="p-8 pb-4">
            <dialog_1.DialogTitle className="text-xl font-bold">Novo Parcelamento</dialog_1.DialogTitle>
            <dialog_1.DialogDescription className="text-base mt-3">
              Adicione um novo parcelamento ao seu controle financeiro.
            </dialog_1.DialogDescription>
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
            setCategories((prev) => [...prev, newCategory]);
            setCategory(newCategory.value);
        }} className="h-12" disabled={loadingCategories} type="expense"/>
                </div>

                {/* Quantidade de Parcelas */}
                <div className="space-y-3">
                  <label_1.Label htmlFor="installments" className="text-sm font-medium block">
                    Qtd. de Parcelas
                  </label_1.Label>
                  <div className="flex items-center gap-4">
                    <input_1.Input id="installments" type="number" min="1" max="48" value={installments} onChange={(e) => handleInstallmentsChange(e.target.value)} className="w-full h-12"/>
                    <tooltip_1.TooltipProvider>
                      <tooltip_1.Tooltip>
                        <tooltip_1.TooltipTrigger asChild>
                          <lucide_react_1.Info className="h-5 w-5 text-muted-foreground"/>
                        </tooltip_1.TooltipTrigger>
                        <tooltip_1.TooltipContent>
                          <p>Número máximo de parcelas: 48</p>
                        </tooltip_1.TooltipContent>
                      </tooltip_1.Tooltip>
                    </tooltip_1.TooltipProvider>
                  </div>
                </div>
              </div>

              {/* Cartão de Crédito */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label_1.Label htmlFor="creditCard" className="text-sm font-medium block">Cartão de Crédito <span className="text-xs text-muted-foreground">(opcional)</span></label_1.Label>
                  <credit_card_manager_1.CreditCardManager buttonProps={{ size: "sm", className: "h-9" }}/>
                </div>
                <select_1.Select value={selectedCardId || "none"} onValueChange={(value) => setSelectedCardId(value)}>
                  <select_1.SelectTrigger className="h-12">
                    <select_1.SelectValue placeholder="Selecione um cartão (opcional)"/>
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    <select_1.SelectItem value="none">Nenhum</select_1.SelectItem>
                    {Array.isArray(creditCards) && creditCards.length > 0 &&
            creditCards
                .filter(card => card &&
                (typeof card.id === "string" || typeof card.id === "number") &&
                String(card.id).trim() !== "" &&
                card.name && typeof card.name === "string")
                .map(card => (<select_1.SelectItem key={card.id} value={card.id.toString()}>
                            <span className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: card.color }}/>
                              {card.name}
                              {card.lastFourDigits && (<span className="text-xs text-muted-foreground">•••• {card.lastFourDigits}</span>)}
                            </span>
                          </select_1.SelectItem>))}
                  </select_1.SelectContent>
                </select_1.Select>
                {selectedCardId && selectedCardId !== "none" && Array.isArray(creditCards) && (<div className="mt-2 flex items-center gap-2">
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
                  <input_1.Input id="installmentAmount" value={installmentAmountInput} onChange={(e) => handleInstallmentAmountChange(e.target.value)} placeholder="0,00" className="h-12"/>
                </div>

                <div className="space-y-3">
                  <label_1.Label htmlFor="totalAmount" className="text-sm font-medium block">
                    Valor Total
                  </label_1.Label>
                  <input_1.Input id="totalAmount" value={totalAmountInput} onChange={(e) => handleTotalAmountChange(e.target.value)} placeholder="0,00" className="text-right h-12"/>
                </div>
              </div>

              {/* Resumo */}
              <div className="mt-6">
                <div className="rounded-md bg-muted p-6">
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total a pagar:</span>
                    <span>{(0, utils_1.formatCurrency)(getTotalAmount())}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground mt-4">
                    <span>{installments}x de:</span>
                    <span>{(0, utils_1.formatCurrency)(getInstallmentAmount())}</span>
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
              Salvar
            </button_1.Button>
          </dialog_1.DialogFooter>
        </div>
      </dialog_1.DialogContent>
    </dialog_1.Dialog>);
}
