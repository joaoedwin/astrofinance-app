"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoalForm = GoalForm;
const react_1 = __importDefault(require("react"));
const react_2 = require("react");
const dialog_1 = require("@/components/ui/dialog");
const input_1 = require("@/components/ui/input");
const button_1 = require("@/components/ui/button");
const select_1 = require("@/components/ui/select");
const category_select_1 = require("@/components/ui/category-select");
const date_fns_1 = require("date-fns");
const auth_context_1 = require("@/contexts/auth-context");
function GoalForm({ open, onClose, onSubmit, loading, initialData }) {
    const [name, setName] = (0, react_2.useState)(initialData?.name || "");
    const [description, setDescription] = (0, react_2.useState)(initialData?.description || "");
    const [targetAmount, setTargetAmount] = (0, react_2.useState)(initialData?.target_amount || "");
    const [type, setType] = (0, react_2.useState)(initialData?.type || "saving");
    const [categoryId, setCategoryId] = (0, react_2.useState)(initialData?.category_id || "");
    const [recurrence, setRecurrence] = (0, react_2.useState)(initialData?.recurrence || "none");
    const [startDate, setStartDate] = (0, react_2.useState)(initialData?.start_date || (0, date_fns_1.format)(new Date(), "yyyy-MM-dd"));
    const [endDate, setEndDate] = (0, react_2.useState)(initialData?.end_date || "");
    const [error, setError] = (0, react_2.useState)("");
    const [categories, setCategories] = (0, react_2.useState)([]);
    const [loadingCategories, setLoadingCategories] = (0, react_2.useState)(false);
    const { token } = (0, auth_context_1.useAuthContext)();
    (0, react_2.useEffect)(() => {
        if (!open || !token)
            return;
        setLoadingCategories(true);
        fetch("/api/categories", { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
            setCategories(Array.isArray(data) ? data.map((cat) => ({ value: cat.id, label: cat.name })) : []);
        })
            .catch(() => setCategories([]))
            .finally(() => setLoadingCategories(false));
    }, [open, token]);
    (0, react_2.useEffect)(() => {
        setName(initialData?.name || "");
        setDescription(initialData?.description || "");
        setTargetAmount(initialData?.target_amount || "");
        setType(initialData?.type || "saving");
        setCategoryId(initialData?.category_id || "");
        setRecurrence(initialData?.recurrence || "none");
        setStartDate(initialData?.start_date || (0, date_fns_1.format)(new Date(), "yyyy-MM-dd"));
        setEndDate(initialData?.end_date || "");
    }, [initialData]);
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !targetAmount || !type || !startDate) {
            setError("Preencha todos os campos obrigatórios.");
            return;
        }
        setError("");
        onSubmit({
            name,
            description,
            target_amount: Number(targetAmount),
            type,
            category_id: categoryId || null,
            recurrence: recurrence === "none" ? null : recurrence,
            start_date: startDate,
            end_date: endDate || null
        });
    };
    return (<dialog_1.Dialog open={open} onOpenChange={onClose}>
      <dialog_1.DialogContent className="max-w-md">
        <dialog_1.DialogHeader>
          <dialog_1.DialogTitle>{initialData ? "Editar Meta" : "Nova Meta"}</dialog_1.DialogTitle>
        </dialog_1.DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="goal-name" className="block text-sm font-medium mb-1">Nome da Meta *</label>
            <input_1.Input id="goal-name" value={name} onChange={e => setName(e.target.value)} required maxLength={50}/>
          </div>
          <div>
            <label htmlFor="goal-description" className="block text-sm font-medium mb-1">Descrição</label>
            <input_1.Input id="goal-description" value={description} onChange={e => setDescription(e.target.value)} maxLength={120}/>
          </div>
          <div>
            <label htmlFor="goal-target" className="block text-sm font-medium mb-1">Valor Alvo (R$) *</label>
            <input_1.Input id="goal-target" type="number" min={0} step={0.01} value={targetAmount} onChange={e => setTargetAmount(e.target.value)} required/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Meta *</label>
            <select_1.Select value={type} onValueChange={setType}>
              <select_1.SelectTrigger>
                <select_1.SelectValue placeholder="Tipo"/>
              </select_1.SelectTrigger>
              <select_1.SelectContent>
                <select_1.SelectItem value="saving">Economia Mensal</select_1.SelectItem>
                <select_1.SelectItem value="spending">Gasto por Categoria</select_1.SelectItem>
                <select_1.SelectItem value="purchase">Compra/Objetivo</select_1.SelectItem>
              </select_1.SelectContent>
            </select_1.Select>
          </div>
          {type === "purchase" && (<div className="bg-muted rounded p-3 text-xs text-muted-foreground">
              Todo mês, você será lembrado de informar quanto do seu saldo deseja reservar para este objetivo. O progresso será calculado com base nesses valores informados.
            </div>)}
          {type !== "purchase" && (<div>
              <label className="block text-sm font-medium mb-1">Categoria</label>
              {loadingCategories ? (<div className="text-muted-foreground text-sm">Carregando categorias...</div>) : (<category_select_1.CategorySelect value={categoryId} onValueChange={setCategoryId} categories={categories} type={type === "spending" ? "expense" : "income"} placeholder="Selecione a categoria"/>)}
            </div>)}
          <div>
            <label className="block text-sm font-medium mb-1">Recorrência</label>
            <select_1.Select value={recurrence} onValueChange={setRecurrence}>
              <select_1.SelectTrigger>
                <select_1.SelectValue placeholder="Recorrência"/>
              </select_1.SelectTrigger>
              <select_1.SelectContent>
                <select_1.SelectItem value="none">Nenhuma</select_1.SelectItem>
                <select_1.SelectItem value="monthly">Mensal</select_1.SelectItem>
                <select_1.SelectItem value="yearly">Anual</select_1.SelectItem>
                <select_1.SelectItem value="custom">Personalizada</select_1.SelectItem>
              </select_1.SelectContent>
            </select_1.Select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="goal-start-date" className="block text-sm font-medium mb-1">Data Inicial *</label>
              <input_1.Input id="goal-start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required/>
            </div>
            <div className="flex-1">
              <label htmlFor="goal-end-date" className="block text-sm font-medium mb-1">Data Final</label>
              <input_1.Input id="goal-end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)}/>
            </div>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex justify-end gap-2 mt-4">
            <button_1.Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</button_1.Button>
            <button_1.Button type="submit" disabled={loading}>{loading ? "Salvando..." : initialData ? "Salvar" : "Criar Meta"}</button_1.Button>
          </div>
        </form>
      </dialog_1.DialogContent>
    </dialog_1.Dialog>);
}
