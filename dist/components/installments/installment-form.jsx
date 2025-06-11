"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstallmentForm = InstallmentForm;
const react_1 = require("react");
const label_1 = require("@/components/ui/label");
const input_1 = require("@/components/ui/input");
const select_1 = require("@/components/ui/select");
const credit_card_manager_1 = require("@/components/credit-card/credit-card-manager");
const auth_context_1 = require("@/contexts/auth-context");
const use_toast_1 = require("@/components/ui/use-toast");
function InstallmentForm({ onSubmit, initialData }) {
    const { toast } = (0, use_toast_1.useToast)();
    const { token } = (0, auth_context_1.useAuthContext)();
    const [cards, setCards] = (0, react_1.useState)([]);
    const [selectedCardId, setSelectedCardId] = (0, react_1.useState)(initialData?.creditCardId || null);
    const [formData, setFormData] = (0, react_1.useState)({
        description: initialData?.description || "",
        categoryId: initialData?.categoryId || "",
        totalAmount: initialData?.totalAmount || "",
        installmentAmount: initialData?.installmentAmount || "",
        totalInstallments: initialData?.totalInstallments || "",
        paidInstallments: initialData?.paidInstallments || "",
        startDate: initialData?.startDate || "",
        nextPaymentDate: initialData?.nextPaymentDate || "",
    });
    const [saving, setSaving] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const fetchCards = async () => {
            try {
                const response = await fetch("/api/credit-cards", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const data = await response.json();
                setCards(data);
            }
            catch (error) {
                console.error("Erro ao carregar cartões:", error);
            }
        };
        fetchCards();
    }, [token]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            creditCardId: selectedCardId
        });
    };
    return (<form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label_1.Label htmlFor="description">Descrição</label_1.Label>
        <input_1.Input id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required/>
      </div>

      <div className="space-y-2">
        <label_1.Label htmlFor="categoryId">Categoria</label_1.Label>
        <input_1.Input id="categoryId" type="number" value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value) })} required/>
      </div>

      <div className="space-y-2">
        <label_1.Label htmlFor="totalAmount">Valor Total</label_1.Label>
        <input_1.Input id="totalAmount" type="number" step="0.01" value={formData.totalAmount} onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) })} required/>
      </div>

      <div className="space-y-2">
        <label_1.Label htmlFor="installmentAmount">Valor da Parcela</label_1.Label>
        <input_1.Input id="installmentAmount" type="number" step="0.01" value={formData.installmentAmount} onChange={(e) => setFormData({ ...formData, installmentAmount: parseFloat(e.target.value) })} required/>
      </div>

      <div className="space-y-2">
        <label_1.Label htmlFor="totalInstallments">Total de Parcelas</label_1.Label>
        <input_1.Input id="totalInstallments" type="number" value={formData.totalInstallments} onChange={(e) => setFormData({ ...formData, totalInstallments: parseInt(e.target.value) })} required/>
      </div>

      <div className="space-y-2">
        <label_1.Label htmlFor="paidInstallments">Parcelas Pagas</label_1.Label>
        <input_1.Input id="paidInstallments" type="number" value={formData.paidInstallments} onChange={(e) => setFormData({ ...formData, paidInstallments: parseInt(e.target.value) })} required/>
      </div>

      <div className="space-y-2">
        <label_1.Label htmlFor="startDate">Data de Início</label_1.Label>
        <input_1.Input id="startDate" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required/>
      </div>

      <div className="space-y-2">
        <label_1.Label htmlFor="nextPaymentDate">Próximo Pagamento</label_1.Label>
        <input_1.Input id="nextPaymentDate" type="date" value={formData.nextPaymentDate} onChange={(e) => setFormData({ ...formData, nextPaymentDate: e.target.value })} required/>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label_1.Label htmlFor="creditCard">Cartão de Crédito</label_1.Label>
          <credit_card_manager_1.CreditCardManager />
        </div>
        <select_1.Select value={selectedCardId?.toString() || "none"} onValueChange={(value) => setSelectedCardId(value !== "none" ? parseInt(value) : null)}>
          <select_1.SelectTrigger>
            <select_1.SelectValue placeholder="Selecione um cartão"/>
          </select_1.SelectTrigger>
          <select_1.SelectContent>
            <select_1.SelectItem value="none">Nenhum</select_1.SelectItem>
            {cards.map((card) => (<select_1.SelectItem key={card.id} value={card.id.toString()}>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: card.color }}/>
                  <span>{card.name}</span>
                  {card.lastFourDigits && (<span className="text-sm text-muted-foreground">
                      •••• {card.lastFourDigits}
                    </span>)}
                </div>
              </select_1.SelectItem>))}
          </select_1.SelectContent>
        </select_1.Select>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md">
          {initialData ? "Atualizar" : "Criar"}
        </button>
      </div>
    </form>);
}
