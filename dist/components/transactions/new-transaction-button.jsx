"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewTransactionButton = NewTransactionButton;
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const lucide_react_1 = require("lucide-react");
const dialog_1 = require("@/components/ui/dialog");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const select_1 = require("@/components/ui/select");
const textarea_1 = require("@/components/ui/textarea");
const category_select_1 = require("@/components/ui/category-select");
const use_toast_1 = require("@/hooks/use-toast");
const auth_context_1 = require("@/contexts/auth-context");
function NewTransactionButton({ fullWidth = false, iconOnly = false }) {
    const [open, setOpen] = (0, react_1.useState)(false);
    const [type, setType] = (0, react_1.useState)("expense");
    const [amount, setAmount] = (0, react_1.useState)("");
    const [date, setDate] = (0, react_1.useState)(() => {
        const today = new Date();
        return today.toISOString().substring(0, 10);
    });
    const [category, setCategory] = (0, react_1.useState)("");
    const [description, setDescription] = (0, react_1.useState)("");
    const [categories, setCategories] = (0, react_1.useState)([]);
    const [saving, setSaving] = (0, react_1.useState)(false);
    const { token } = (0, auth_context_1.useAuthContext)();
    (0, react_1.useEffect)(() => {
        if (token) {
            loadCategories();
        }
    }, [token]);
    const loadCategories = async () => {
        try {
            if (!token) {
                console.error("Token não disponível para buscar categorias");
                return;
            }
            const response = await fetch(`/api/categories`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erro ao buscar categorias");
            }
            const data = await response.json();
            setCategories(Array.isArray(data)
                ? data.map((cat) => ({
                    value: cat.id,
                    label: cat.name
                }))
                : []);
        }
        catch (error) {
            console.error("Erro ao buscar categorias:", error);
            (0, use_toast_1.toast)({
                title: "Erro ao carregar categorias",
                description: "Não foi possível carregar as categorias. Tente novamente.",
                variant: "destructive",
            });
        }
    };
    // Função para formatar o valor
    const formatValueForSubmission = (value) => {
        // Remover caracteres não numéricos, mas manter vírgula e substituí-la por ponto
        const cleanedValue = value.replace(/[^\d,]/g, '').replace(',', '.');
        return parseFloat(cleanedValue);
    };
    const handleSave = async () => {
        if (!description || !category || !amount || !date || saving) {
            (0, use_toast_1.toast)({
                title: "Campos obrigatórios",
                description: "Preencha todos os campos obrigatórios.",
                variant: "destructive",
            });
            return;
        }
        setSaving(true);
        try {
            const formattedAmount = parseFloat(amount.replace(/[^\d,]/g, '').replace(',', '.'));
            const selectedDate = date;
            if (!token) {
                throw new Error("Usuário não autenticado. Faça login novamente.");
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
                    type: type,
                    categoryId: category,
                })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || error.message || "Erro ao criar transação");
            }
            const result = await response.json();
            (0, use_toast_1.toast)({
                title: "Transação criada",
                description: "A transação foi salva com sucesso.",
            });
            setOpen(false);
            resetForm();
            window.location.reload();
        }
        catch (error) {
            (0, use_toast_1.toast)({
                title: "Erro ao salvar transação",
                description: error.message || "Não foi possível salvar a transação.",
                variant: "destructive",
            });
        }
        finally {
            setSaving(false);
        }
    };
    const resetForm = () => {
        setType("expense");
        setAmount("");
        const today = new Date();
        setDate(today.toISOString().substring(0, 10));
        setCategory("");
        setDescription("");
    };
    return (<dialog_1.Dialog open={open} onOpenChange={(open) => {
            if (!open) {
                resetForm();
            }
            setOpen(open);
        }}>
      <dialog_1.DialogTrigger asChild>
        <button_1.Button variant="default" size={iconOnly ? "icon" : "default"} className={fullWidth ? "w-full" : ""}>
          {!iconOnly && <lucide_react_1.PlusCircle className="mr-2 h-4 w-4"/>}
          {iconOnly ? <lucide_react_1.PlusCircle className="h-4 w-4"/> : "Nova Transação"}
        </button_1.Button>
      </dialog_1.DialogTrigger>
      <dialog_1.DialogContent className="sm:max-w-[425px]">
        <dialog_1.DialogHeader>
          <dialog_1.DialogTitle>Nova Transação</dialog_1.DialogTitle>
          <dialog_1.DialogDescription>
            Adicione uma nova transação ao seu histórico financeiro.
          </dialog_1.DialogDescription>
        </dialog_1.DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label_1.Label htmlFor="type" className="text-right">
              Tipo
            </label_1.Label>
            <select_1.Select value={type} onValueChange={setType}>
              <select_1.SelectTrigger className="col-span-3">
                <select_1.SelectValue placeholder="Selecione o tipo"/>
              </select_1.SelectTrigger>
              <select_1.SelectContent>
                <select_1.SelectItem value="income">Receita</select_1.SelectItem>
                <select_1.SelectItem value="expense">Despesa</select_1.SelectItem>
              </select_1.SelectContent>
            </select_1.Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label_1.Label htmlFor="amount" className="text-right">
              Valor
            </label_1.Label>
            <input_1.Input id="amount" type="text" className="col-span-3" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label_1.Label htmlFor="date" className="text-right">
              Data
            </label_1.Label>
            <input_1.Input id="date" type="date" className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm col-span-3" value={date} onChange={(e) => setDate(e.target.value)}/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label_1.Label htmlFor="category" className="text-right">
              Categoria
            </label_1.Label>
            <div className="col-span-3">
              <category_select_1.CategorySelect value={category} onValueChange={setCategory} categories={categories} onAddCategory={(newCategory) => {
            setCategories([...categories, newCategory]);
            setCategory(newCategory.value);
        }} type={type}/>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label_1.Label htmlFor="description" className="text-right">
              Descrição
            </label_1.Label>
            <textarea_1.Textarea id="description" placeholder="Descreva a transação" className="col-span-3" value={description} onChange={(e) => setDescription(e.target.value)}/>
          </div>
        </div>
        <dialog_1.DialogFooter>
          <button_1.Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? (<span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Salvando...</span>) : ("Salvar")}
          </button_1.Button>
        </dialog_1.DialogFooter>
      </dialog_1.DialogContent>
    </dialog_1.Dialog>);
}
