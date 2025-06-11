"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditableTransactionTable = EditableTransactionTable;
const react_1 = require("react");
const table_1 = require("@/components/ui/table");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/lib/utils");
const category_select_1 = require("@/components/ui/category-select");
const use_toast_1 = require("@/components/ui/use-toast");
const dialog_1 = require("@/components/ui/dialog");
const auth_context_1 = require("@/contexts/auth-context");
function EditableTransactionTable({ initialTransactions }) {
    const [transactions, setTransactions] = (0, react_1.useState)(initialTransactions ?? []);
    const [editingCell, setEditingCell] = (0, react_1.useState)({ id: "", field: null });
    const [editValue, setEditValue] = (0, react_1.useState)("");
    const [categories, setCategories] = (0, react_1.useState)([]);
    const inputRef = (0, react_1.useRef)(null);
    const { toast } = (0, use_toast_1.useToast)();
    const [deleteId, setDeleteId] = (0, react_1.useState)(null);
    const [deleting, setDeleting] = (0, react_1.useState)(false);
    const { token } = (0, auth_context_1.useAuthContext)();
    const [saving, setSaving] = (0, react_1.useState)(false);
    // Debug logs
    console.log("EditableTransactionTable - Recebendo initialTransactions:", Array.isArray(initialTransactions) ? `${initialTransactions.length} transações` : "não é array", initialTransactions);
    (0, react_1.useEffect)(() => {
        console.log("EditableTransactionTable - useEffect - Atualizando transactions:", Array.isArray(initialTransactions) ? `${initialTransactions.length} transações` : "não é array");
        // Garantir que initialTransactions seja um array
        const safeTransactions = Array.isArray(initialTransactions) ? initialTransactions : [];
        setTransactions(safeTransactions);
    }, [initialTransactions]);
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
            console.log("Buscando categorias com token:", token);
            const response = await fetch("/api/categories", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error("Erro na resposta da API:", errorData);
                throw new Error(errorData.message || "Erro ao buscar categorias");
            }
            const data = await response.json();
            console.log("Categorias recebidas:", data);
            // Converter para o formato esperado pelo componente CategorySelect
            setCategories(Array.isArray(data)
                ? data.map((cat) => ({
                    value: cat.id,
                    label: cat.name
                }))
                : []);
        }
        catch (error) {
            console.error("Erro ao buscar categorias:", error);
            toast({
                title: "Erro ao carregar categorias",
                description: "Não foi possível carregar as categorias. Tente novamente.",
                variant: "destructive",
            });
        }
    };
    // Foca no input quando começar a editar
    (0, react_1.useEffect)(() => {
        if (editingCell.field && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editingCell]);
    // Função para iniciar a edição de uma célula
    const startEditing = (0, react_1.useCallback)((id, field, value) => {
        setEditingCell({ id, field });
        if (field === "category") {
            // Se o valor for um nome de categoria, encontra o ID correspondente
            if (typeof value === 'string' && !categories.some(cat => cat.value === value)) {
                const category = categories.find(cat => cat.label === value);
                setEditValue(category ? category.value : "");
            }
            else {
                setEditValue(value);
            }
        }
        else if (field === "date") {
            // Formatação de data
            if (value instanceof Date) {
                // Formatação correta de data para o campo input
                const dateStr = new Date(value).toISOString().substring(0, 10);
                setEditValue(dateStr);
            }
            else {
                setEditValue(value);
            }
        }
        else {
            setEditValue(value);
        }
    }, [categories]);
    // Função para carregar categorias com um tipo específico
    const loadCategoriesByType = async (type) => {
        try {
            if (!token) {
                console.error("Token não disponível para buscar categorias");
                return;
            }
            const response = await fetch(`/api/categories?type=${type}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error("Erro ao buscar categorias");
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
            console.error("Erro ao buscar categorias por tipo:", error);
            toast({
                title: "Erro ao carregar categorias",
                description: "Não foi possível carregar as categorias.",
                variant: "destructive",
            });
        }
    };
    // Função para salvar a edição
    const saveEdit = (0, react_1.useCallback)(async (id) => {
        const transaction = transactions.find((t) => t.id === id);
        if (!transaction || !token)
            return;
        const updatedTransaction = { ...transaction };
        switch (editingCell.field) {
            case "date":
                // Garantir que a data é salva no formato correto
                updatedTransaction.date = editValue;
                break;
            case "description":
                updatedTransaction.description = editValue;
                break;
            case "category": {
                // Encontrar o nome da categoria a partir do ID
                const categoryObj = categories.find(cat => cat.value === editValue);
                updatedTransaction.category = categoryObj ? categoryObj.label : editValue;
                break;
            }
            case "type":
                updatedTransaction.type = editValue;
                break;
            case "amount":
                updatedTransaction.amount = Number(editValue);
                break;
        }
        // Persistir edição na API com o token de autenticação
        try {
            const response = await fetch(`/api/transactions/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` // Adicionando o token
                },
                body: JSON.stringify(updatedTransaction),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erro ao atualizar transação");
            }
            setTransactions(transactions.map((t) => (t.id === id ? updatedTransaction : t)));
            setEditingCell({ id: "", field: null });
            setEditValue("");
        }
        catch (error) {
            console.error("Erro ao salvar transação:", error);
            toast({
                title: "Erro ao salvar transação",
                description: "Não foi possível salvar a transação. Tente novamente.",
                variant: "destructive",
            });
        }
    }, [transactions, editingCell, editValue, categories, toast, token]);
    // Função para cancelar a edição
    const cancelEdit = (0, react_1.useCallback)(() => {
        setEditingCell({ id: "", field: null });
        setEditValue("");
    }, []);
    // Função para excluir uma transação
    const deleteTransaction = (0, react_1.useCallback)(async (id) => {
        setDeleteId(id);
    }, []);
    const confirmDelete = async () => {
        if (!deleteId || !token)
            return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/transactions/${deleteId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Erro ao excluir transação");
            }
            setTransactions(transactions.filter((t) => t.id !== deleteId));
            toast({
                title: "Transação excluída",
                description: "A transação foi removida com sucesso."
            });
        }
        catch (error) {
            console.error("Erro ao excluir transação:", error);
            toast({
                title: "Erro ao excluir transação",
                description: error instanceof Error ? error.message : "Não foi possível excluir a transação.",
                variant: "destructive"
            });
        }
        finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };
    const memoizedTransactions = (0, react_1.useMemo)(() => transactions ?? [], [transactions]);
    // Função para formatar datas de exibição corretamente
    const formatDateDisplay = (dateValue) => {
        if (!dateValue)
            return 'Data inválida';
        try {
            // Criar uma nova data a partir do valor
            let date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
            // Compensar o ajuste de fuso horário
            const utcDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60 * 1000));
            // Formatar para exibição no formato brasileiro
            return utcDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        }
        catch (e) {
            console.error("Erro ao formatar data:", e);
            return 'Data inválida';
        }
    };
    return (<div className="rounded-md border">
      <table_1.Table>
        <table_1.TableHeader>
          <table_1.TableRow>
            <table_1.TableHead>Data</table_1.TableHead>
            <table_1.TableHead>Descrição</table_1.TableHead>
            <table_1.TableHead>Categoria</table_1.TableHead>
            <table_1.TableHead>Tipo</table_1.TableHead>
            <table_1.TableHead className="text-right">Valor</table_1.TableHead>
            <table_1.TableHead className="w-[100px]">Ações</table_1.TableHead>
          </table_1.TableRow>
        </table_1.TableHeader>
        <table_1.TableBody>
          {(memoizedTransactions ?? []).map((transaction) => (<table_1.TableRow key={transaction.id}>
              {/* Célula de Data */}
              <table_1.TableCell>
                {editingCell.id === transaction.id && editingCell.field === "date" ? (<div className="flex items-center space-x-2">
                    <input_1.Input ref={inputRef} type="date" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-[150px]"/>
                    <button_1.Button size="icon" variant="ghost" onClick={() => saveEdit(transaction.id)}>
                      <lucide_react_1.Check className="h-4 w-4"/>
                    </button_1.Button>
                    <button_1.Button size="icon" variant="ghost" onClick={cancelEdit}>
                      <lucide_react_1.X className="h-4 w-4"/>
                    </button_1.Button>
                  </div>) : (<div className="cursor-pointer rounded px-2 py-1 hover:bg-muted" onClick={() => {
                    // Ao iniciar edição, garantir que a data está correta
                    const dateValue = transaction.date;
                    let formattedDate;
                    if (typeof dateValue === 'string') {
                        // Compensar o ajuste de fuso horário
                        const date = new Date(dateValue);
                        formattedDate = date.toISOString().substring(0, 10);
                    }
                    else if (dateValue instanceof Date) {
                        formattedDate = dateValue.toISOString().substring(0, 10);
                    }
                    else {
                        formattedDate = new Date().toISOString().substring(0, 10);
                    }
                    startEditing(transaction.id, "date", formattedDate);
                }}>
                    {formatDateDisplay(transaction.date)}
                  </div>)}
              </table_1.TableCell>

              {/* Célula de Descrição */}
              <table_1.TableCell>
                {editingCell.id === transaction.id && editingCell.field === "description" ? (<div className="flex items-center space-x-2">
                    <input_1.Input ref={inputRef} value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-[200px]"/>
                    <button_1.Button size="icon" variant="ghost" onClick={() => saveEdit(transaction.id)}>
                      <lucide_react_1.Check className="h-4 w-4"/>
                    </button_1.Button>
                    <button_1.Button size="icon" variant="ghost" onClick={cancelEdit}>
                      <lucide_react_1.X className="h-4 w-4"/>
                    </button_1.Button>
                  </div>) : (<div className="flex items-center gap-2">
                  <div className="cursor-pointer rounded px-2 py-1 hover:bg-muted" onClick={() => startEditing(transaction.id, "description", transaction.description)}>
                    {transaction.description}
                    </div>
                  </div>)}
              </table_1.TableCell>

              {/* Célula de Categoria */}
              <table_1.TableCell>
                {editingCell.id === transaction.id && editingCell.field === "category" ? (<div className="flex items-center space-x-2">
                    <category_select_1.CategorySelect value={String(editValue || "")} onValueChange={(value) => setEditValue(value)} categories={categories} onAddCategory={(newCategory) => {
                    setCategories([...categories, newCategory]);
                    setEditValue(newCategory.value);
                }} className="w-[150px]"/>
                    <button_1.Button size="icon" variant="ghost" onClick={() => saveEdit(transaction.id)}>
                      <lucide_react_1.Check className="h-4 w-4"/>
                    </button_1.Button>
                    <button_1.Button size="icon" variant="ghost" onClick={cancelEdit}>
                      <lucide_react_1.X className="h-4 w-4"/>
                    </button_1.Button>
                  </div>) : (<div className="cursor-pointer rounded px-2 py-1 hover:bg-muted" onClick={() => startEditing(transaction.id, "category", categories.find((c) => c.label === transaction.category)?.value || "")}>
                    {transaction.category}
                  </div>)}
              </table_1.TableCell>

              {/* Célula de Tipo */}
              <table_1.TableCell>
                <button type="button" className={`transition-all duration-300 px-3 py-1 rounded-full font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer border-none shadow-sm transform hover:scale-105 active:scale-95 ${transaction.type === "income" ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`} style={{ minWidth: 80 }} onClick={async () => {
                const newType = transaction.type === "income" ? "expense" : "income";
                // Atualiza localmente para efeito instantâneo
                setTransactions((prev) => prev.map((t) => t.id === transaction.id ? { ...t, type: newType } : t));
                // Salva no banco
                try {
                    const response = await fetch(`/api/transactions/${transaction.id}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ ...transaction, type: newType }),
                    });
                    if (!response.ok) {
                        throw new Error("Erro ao atualizar transação");
                    }
                    toast({ title: "Tipo alterado", description: `Agora é ${newType === "income" ? "Receita" : "Despesa"}.` });
                }
                catch (error) {
                    console.error("Erro ao alterar tipo:", error);
                    // Reverte a mudança local em caso de erro
                    setTransactions((prev) => prev.map((t) => t.id === transaction.id ? { ...t, type: transaction.type } : t));
                    toast({
                        title: "Erro ao alterar tipo",
                        description: "Não foi possível salvar no banco.",
                        variant: "destructive"
                    });
                }
            }}>
                  {transaction.type === "income" ? "Receita" : "Despesa"}
                </button>
              </table_1.TableCell>

              {/* Célula de Valor */}
              <table_1.TableCell className="text-right">
                {editingCell.id === transaction.id && editingCell.field === "amount" ? (<div className="flex items-center justify-end space-x-2">
                    <input_1.Input ref={inputRef} type="number" step="0.01" value={editValue} onChange={(e) => setEditValue(Number(e.target.value))} className="w-[120px]"/>
                    <button_1.Button size="icon" variant="ghost" onClick={() => saveEdit(transaction.id)}>
                      <lucide_react_1.Check className="h-4 w-4"/>
                    </button_1.Button>
                    <button_1.Button size="icon" variant="ghost" onClick={cancelEdit}>
                      <lucide_react_1.X className="h-4 w-4"/>
                    </button_1.Button>
                  </div>) : (<div className="cursor-pointer rounded px-2 py-1 hover:bg-muted text-right" onClick={() => startEditing(transaction.id, "amount", transaction.amount)}>
                    <span className={transaction.type === "income" ? "text-emerald-600" : "text-rose-600"}>
                      {transaction.type === "income" ? "+" : "-"}
                      {(0, utils_1.formatCurrency)(transaction.amount)}
                    </span>
                  </div>)}
              </table_1.TableCell>

              {/* Célula de Ações */}
              <table_1.TableCell>
                <button_1.Button variant="ghost" size="icon" onClick={() => deleteTransaction(transaction.id)}>
                  <lucide_react_1.Trash className="h-4 w-4"/>
                  <span className="sr-only">Excluir</span>
                </button_1.Button>
              </table_1.TableCell>
            </table_1.TableRow>))}
        </table_1.TableBody>
      </table_1.Table>
      {/* Modal de confirmação de exclusão */}
      <dialog_1.Dialog open={!!deleteId} onOpenChange={(open) => { if (!open)
        setDeleteId(null); }}>
        <dialog_1.DialogContent>
          <dialog_1.DialogHeader>
            <dialog_1.DialogTitle>Confirmar exclusão</dialog_1.DialogTitle>
          </dialog_1.DialogHeader>
          <p>Tem certeza que deseja excluir esta transação? Essa ação não pode ser desfeita.</p>
          <dialog_1.DialogFooter>
            <button_1.Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>Cancelar</button_1.Button>
            <button_1.Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Excluindo..." : "Excluir"}
            </button_1.Button>
          </dialog_1.DialogFooter>
        </dialog_1.DialogContent>
      </dialog_1.Dialog>
    </div>);
}
