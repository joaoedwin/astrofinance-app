"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GoalsPage;
const react_1 = __importDefault(require("react"));
const react_2 = require("react");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const lucide_react_1 = require("lucide-react");
const use_goals_1 = require("@/hooks/use-goals");
const GoalForm_1 = require("./GoalForm");
const progress_1 = require("@/components/ui/progress");
const dialog_1 = require("@/components/ui/dialog");
const use_transactions_1 = require("@/hooks/use-transactions");
const date_fns_1 = require("date-fns");
const badge_1 = require("@/components/ui/badge");
const use_installments_1 = require("@/hooks/use-installments");
const HelpModal_1 = require("./HelpModal");
const use_goal_reserves_1 = require("@/hooks/use-goal-reserves");
const input_1 = require("@/components/ui/input");
const use_toast_1 = require("@/components/ui/use-toast");
function GoalsPage() {
    const { goals, loading, error, fetchGoals, createGoal, updateGoal, deleteGoal } = (0, use_goals_1.useGoals)();
    const { transactions, loading: loadingTx, fetchTransactions } = (0, use_transactions_1.useTransactions)();
    const { installments, fetchInstallments } = (0, use_installments_1.useInstallments)();
    const { reserves, fetchReserves, createReserve, updateReserve, deleteReserve, loading: loadingReserves } = (0, use_goal_reserves_1.useGoalReserves)();
    const showToast = (0, use_toast_1.useToast)();
    const [showCreate, setShowCreate] = (0, react_2.useState)(false);
    const [creating, setCreating] = (0, react_2.useState)(false);
    const [editingGoal, setEditingGoal] = (0, react_2.useState)(null);
    const [deletingGoal, setDeletingGoal] = (0, react_2.useState)(null);
    const [deleting, setDeleting] = (0, react_2.useState)(false);
    const [showHelp, setShowHelp] = (0, react_2.useState)(false);
    const [reserveInput, setReserveInput] = (0, react_2.useState)({});
    const [editingReserveId, setEditingReserveId] = (0, react_2.useState)(null);
    const [reserveEditValue, setReserveEditValue] = (0, react_2.useState)("");
    const [showHistoryModal, setShowHistoryModal] = (0, react_2.useState)(null);
    (0, react_2.useEffect)(() => {
        fetchGoals();
        fetchTransactions();
        fetchInstallments();
    }, [fetchGoals, fetchTransactions, fetchInstallments]);
    (0, react_2.useEffect)(() => {
        if (goals.length > 0) {
            fetchReserves(); // busca todas as reservas do usuário após carregar metas
        }
    }, [goals, fetchReserves]);
    const handleCreateGoal = async (data) => {
        setCreating(true);
        await createGoal(data);
        setCreating(false);
        setShowCreate(false);
    };
    const handleEditGoal = async (data) => {
        setCreating(true);
        await updateGoal({ ...editingGoal, ...data });
        setCreating(false);
        setEditingGoal(null);
    };
    const handleDeleteGoal = async () => {
        if (!deletingGoal)
            return;
        setDeleting(true);
        await deleteGoal(deletingGoal.id);
        setDeleting(false);
        setDeletingGoal(null);
    };
    return (<div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <lucide_react_1.BarChart3 className="h-6 w-6 text-primary"/>
          Metas
        </h1>
        <div className="flex gap-2">
          <button_1.Button variant="outline" onClick={() => setShowHelp(true)}>
            <lucide_react_1.Info className="h-4 w-4 mr-1"/> Como funciona?
          </button_1.Button>
          <button_1.Button variant="default" className="gap-2" onClick={() => setShowCreate(true)}>
            <lucide_react_1.PlusCircle className="h-5 w-5"/>
            Nova Meta
          </button_1.Button>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {loading && (<card_1.Card className="col-span-full text-center py-12">
            <card_1.CardHeader>
              <card_1.CardTitle>Carregando metas...</card_1.CardTitle>
            </card_1.CardHeader>
          </card_1.Card>)}
        {error && (<card_1.Card className="col-span-full text-center py-12">
            <card_1.CardHeader>
              <card_1.CardTitle>Erro ao carregar metas</card_1.CardTitle>
              <card_1.CardDescription>{error}</card_1.CardDescription>
            </card_1.CardHeader>
          </card_1.Card>)}
        {!loading && !error && goals.length === 0 && (<card_1.Card className="col-span-full text-center py-12">
            <card_1.CardHeader>
              <card_1.CardTitle>Nenhuma meta cadastrada</card_1.CardTitle>
              <card_1.CardDescription>Crie sua primeira meta para começar a acompanhar seu progresso financeiro!</card_1.CardDescription>
            </card_1.CardHeader>
          </card_1.Card>)}
        {/* Renderizar metas ativas */}
        {goals.filter(g => g.status === "active").map(goal => {
            if (goal.type === "purchase") {
                // Reservas dessa meta
                const goalReserves = reserves.filter(r => r.goal_id === goal.id);
                const totalReservado = goalReserves.reduce((sum, r) => sum + Number(r.amount), 0);
                const valorFaltante = Math.max(0, Number(goal.target_amount) - totalReservado);
                const progress = Math.max(0, Math.min(100, Math.round((totalReservado / Number(goal.target_amount)) * 100)));
                // Mês atual
                const now = new Date();
                const mesAtual = (0, date_fns_1.format)(now, "yyyy-MM");
                const reservaAtual = goalReserves.find(r => r.month === mesAtual);
                return (<card_1.Card key={goal.id} className="border-2 border-blue-400">
                <card_1.CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div>
                    <card_1.CardTitle>{goal.name} <span className="ml-2 text-xs text-blue-600">Compra/Objetivo</span></card_1.CardTitle>
                    <card_1.CardDescription>{goal.description}</card_1.CardDescription>
                    <div className="mt-2 flex gap-2 items-center">
                      <badge_1.Badge variant={progress >= 100 ? "success" : "secondary"}>{progress >= 100 ? "Concluída" : "Ativa"}</badge_1.Badge>
                      <button_1.Button size="sm" variant="outline" onClick={() => updateGoal({ ...goal, status: "completed" })} disabled={progress < 100}>Marcar como concluída</button_1.Button>
                      <button_1.Button size="sm" variant="ghost" onClick={() => updateGoal({ ...goal, status: "cancelled" })}>Cancelar</button_1.Button>
                    </div>
                    {progress >= 100 && (<div className="text-emerald-600 text-xs mt-1 font-semibold">Parabéns! Você atingiu sua meta 🎉</div>)}
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 rounded hover:bg-muted" title="Editar" onClick={() => setEditingGoal(goal)}>
                      <lucide_react_1.Pencil className="h-4 w-4"/>
                    </button>
                    <button className="p-2 rounded hover:bg-muted text-destructive" title="Excluir" onClick={() => setDeletingGoal(goal)}>
                      <lucide_react_1.Trash className="h-4 w-4"/>
                    </button>
                  </div>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="text-sm text-muted-foreground mb-2">Valor alvo: R$ {Number(goal.target_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                  <div className="mb-2">
                    <progress_1.Progress value={progress}/>
                    <div className="text-xs text-muted-foreground mt-1 text-right">{progress}%</div>
                    <div className="text-xs text-muted-foreground mt-1 flex flex-col gap-1">
                      <span>Valor reservado: <b>R$ {totalReservado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</b></span>
                      <span>Falta para o objetivo: <b>R$ {valorFaltante.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</b></span>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="font-semibold mb-1">Reserva do mês atual ({mesAtual}):</div>
                    <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                      {reservaAtual ? (editingReserveId === reservaAtual.id ? (<><input_1.Input type="number" min={0} step={0.01} value={reserveEditValue} onChange={e => setReserveEditValue(e.target.value)} className="w-32"/>
                          <button_1.Button size="sm" onClick={async () => { await updateReserve(reservaAtual.id, Number(reserveEditValue)); setEditingReserveId(null); showToast({ title: "Reserva atualizada!" }); }} disabled={loadingReserves}>Salvar</button_1.Button>
                          <button_1.Button size="sm" variant="ghost" onClick={() => setEditingReserveId(null)}>Cancelar</button_1.Button></>) : (<><span className="text-sm font-semibold text-blue-700 dark:text-blue-300">R$ {Number(reservaAtual.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                          <button_1.Button size="sm" variant="outline" onClick={() => { setEditingReserveId(reservaAtual.id); setReserveEditValue(String(reservaAtual.amount)); }}>Editar</button_1.Button></>)) : (<form className="flex gap-2 items-center" onSubmit={async (e) => {
                            e.preventDefault();
                            try {
                                await createReserve({ goal_id: goal.id, month: mesAtual, amount: Number(reserveInput[goal.id] || 0) });
                                setReserveInput(v => ({ ...v, [goal.id]: "" }));
                                showToast({ title: "Reserva salva!" });
                            }
                            catch (err) {
                                if (err?.message?.includes("409")) {
                                    showToast({ title: "Já existe uma reserva para este mês." });
                                    await fetchReserves(goal.id);
                                }
                                else {
                                    showToast({ title: "Erro ao salvar reserva." });
                                }
                            }
                        }}>
                          <input_1.Input type="number" min={0} step={0.01} value={reserveInput[goal.id] || ""} onChange={e => setReserveInput(v => ({ ...v, [goal.id]: e.target.value }))} className="w-32" placeholder="Valor reservado" disabled={!!reservaAtual}/>
                          <button_1.Button size="sm" type="submit" disabled={loadingReserves || !reserveInput[goal.id] || !!reservaAtual}>Salvar</button_1.Button>
                        </form>)}
                    </div>
                  </div>
                  <div className="mt-4">
                    <button_1.Button size="sm" variant="outline" onClick={() => setShowHistoryModal(goal.id)}>Histórico de Reservas</button_1.Button>
                    {showHistoryModal === goal.id && (<dialog_1.Dialog open={true} onOpenChange={() => setShowHistoryModal(null)}>
                        <dialog_1.DialogContent aria-describedby={undefined} className="max-w-md">
                          <dialog_1.DialogHeader>
                            <dialog_1.DialogTitle>Histórico de Reservas</dialog_1.DialogTitle>
                          </dialog_1.DialogHeader>
                          <div className="space-y-2">
                            {goalReserves.length === 0 ? (<div className="text-xs text-muted-foreground">Nenhuma reserva registrada ainda.</div>) : (<ul className="text-xs text-muted-foreground space-y-1">
                                {goalReserves.sort((a, b) => a.month.localeCompare(b.month)).map(r => (<li key={r.id} className={`flex justify-between items-center ${r.month === mesAtual ? "font-bold text-blue-700 dark:text-blue-300" : ""}`}>
                                    <span>{r.month}</span>
                                    <span>R$ {Number(r.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                                    <button_1.Button size="sm" variant="outline" onClick={() => { setEditingReserveId(r.id); setReserveEditValue(String(r.amount)); setShowHistoryModal(null); }}>Editar</button_1.Button>
                                  </li>))}
                              </ul>)}
                          </div>
                        </dialog_1.DialogContent>
                      </dialog_1.Dialog>)}
                  </div>
                </card_1.CardContent>
              </card_1.Card>);
            }
            else {
                // Cálculo real do progresso
                let progress = 0;
                let status = goal.status;
                let valorAtual = 0;
                let valorFaltante = 0;
                if (transactions && transactions.length > 0) {
                    const start = goal.start_date ? (0, date_fns_1.parseISO)(goal.start_date) : null;
                    const end = goal.end_date ? (0, date_fns_1.parseISO)(goal.end_date) : null;
                    // Filtrar transações por período
                    const txInPeriod = transactions.filter(tx => {
                        const txDate = (0, date_fns_1.parseISO)(tx.date);
                        if (start && end)
                            return (0, date_fns_1.isWithinInterval)(txDate, { start, end });
                        if (start)
                            return txDate >= start;
                        return true;
                    });
                    // Filtrar parcelas do período
                    let installmentsInPeriod = [];
                    if (installments && installments.length > 0 && start) {
                        installmentsInPeriod = installments.flatMap(inst => {
                            const instStart = (0, date_fns_1.parseISO)(inst.startDate);
                            for (let i = 0; i < inst.totalInstallments; i++) {
                                const parcelaDate = new Date(instStart.getFullYear(), instStart.getMonth() + i, instStart.getDate());
                                if ((!end && parcelaDate >= start) ||
                                    (start && end && parcelaDate >= start && parcelaDate <= end)) {
                                    return [{
                                            ...inst,
                                            parcelaDate,
                                            parcelaNumber: i + 1
                                        }];
                                }
                            }
                            return [];
                        });
                    }
                    if (goal.type === "saving") {
                        const income = txInPeriod.filter(tx => tx.type === "income").reduce((sum, tx) => sum + Number(tx.amount), 0);
                        const expense = txInPeriod.filter(tx => tx.type === "expense").reduce((sum, tx) => sum + Number(tx.amount), 0);
                        // Somar parcelas do período como despesa
                        const installmentsTotal = installmentsInPeriod.reduce((sum, inst) => sum + Number(inst.installmentAmount), 0);
                        const saved = income - (expense + installmentsTotal);
                        valorAtual = saved;
                        valorFaltante = Math.max(0, Number(goal.target_amount) - saved);
                        progress = Math.max(0, Math.min(100, Math.round((saved / Number(goal.target_amount)) * 100)));
                        // Só marca como concluída automaticamente se a data final já passou e atingiu o valor
                        const today = new Date();
                        if (progress >= 100 && end && today > end)
                            status = "completed";
                    }
                    else if (goal.type === "spending") {
                        // Gasto por categoria
                        const catTx = txInPeriod.filter(tx => tx.category_id === goal.category_id && tx.type === "expense");
                        // Somar parcelas da categoria
                        const catInstallments = installmentsInPeriod.filter(inst => inst.category_id === goal.category_id);
                        const spent = catTx.reduce((sum, tx) => sum + Number(tx.amount), 0) + catInstallments.reduce((sum, inst) => sum + Number(inst.installmentAmount), 0);
                        valorAtual = spent;
                        valorFaltante = Math.max(0, Number(goal.target_amount) - spent);
                        progress = Math.max(0, Math.min(100, Math.round((spent / Number(goal.target_amount)) * 100)));
                        // Só marca como ultrapassada automaticamente se a data final já passou e ultrapassou o valor
                        const today = new Date();
                        if (progress >= 100 && end && today > end)
                            status = "over";
                    }
                    else if (goal.type === "purchase") {
                        const income = txInPeriod.filter(tx => tx.type === "income").reduce((sum, tx) => sum + Number(tx.amount), 0);
                        valorAtual = income;
                        valorFaltante = Math.max(0, Number(goal.target_amount) - income);
                        progress = Math.max(0, Math.min(100, Math.round((income / Number(goal.target_amount)) * 100)));
                        // Só marca como concluída automaticamente se a data final já passou e atingiu o valor
                        const today = new Date();
                        if (progress >= 100 && end && today > end)
                            status = "completed";
                    }
                    // Atualiza status automaticamente se necessário
                    if ((status === "completed" || status === "over") && goal.status === "active" && status !== "active") {
                        updateGoal({ ...goal, status });
                    }
                }
                return (<card_1.Card key={goal.id}>
                <card_1.CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div>
                    <card_1.CardTitle>{goal.name}</card_1.CardTitle>
                    <card_1.CardDescription>{goal.description}</card_1.CardDescription>
                    <div className="mt-2 flex gap-2 items-center">
                      <badge_1.Badge variant={status === "completed" ? "success" : status === "over" ? "destructive" : "secondary"}>
                        {status === "completed" ? "Concluída" : status === "over" ? "Ultrapassada" : "Ativa"}
                      </badge_1.Badge>
                      {goal.status !== "cancelled" && (<>
                          {status !== "completed" && status !== "over" && (<button_1.Button size="sm" variant="outline" onClick={() => updateGoal({ ...goal, status: "completed" })}>Marcar como concluída</button_1.Button>)}
                          {status !== "cancelled" && (<button_1.Button size="sm" variant="ghost" onClick={() => updateGoal({ ...goal, status: "cancelled" })}>Cancelar</button_1.Button>)}
                        </>)}
                    </div>
                    {status === "completed" && (<div className="text-emerald-600 text-xs mt-1 font-semibold">Parabéns! Você atingiu sua meta 🎉</div>)}
                    {status === "over" && (<div className="text-rose-600 text-xs mt-1 font-semibold">Atenção: você ultrapassou o limite da meta!</div>)}
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 rounded hover:bg-muted" title="Editar" onClick={() => setEditingGoal(goal)}>
                      <lucide_react_1.Pencil className="h-4 w-4"/>
                    </button>
                    <button className="p-2 rounded hover:bg-muted text-destructive" title="Excluir" onClick={() => setDeletingGoal(goal)}>
                      <lucide_react_1.Trash className="h-4 w-4"/>
                    </button>
                  </div>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="text-sm text-muted-foreground mb-2">
                    Tipo: {goal.type === "saving" ? "Economia" : goal.type === "spending" ? "Gasto" : "Objetivo"}
                    {goal.category_id && <span> • Categoria vinculada</span>}
                  </div>
                  <div className="font-semibold mb-2">
                    Valor alvo: R$ {Number(goal.target_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="mb-2">
                    <progress_1.Progress value={progress}/>
                    <div className="text-xs text-muted-foreground mt-1 text-right">{progress}%</div>
                    <div className="text-xs text-muted-foreground mt-1 flex flex-col gap-1">
                      <span>Valor atual: <b>R$ {valorAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</b></span>
                      <span>Falta para o objetivo: <b>R$ {valorFaltante.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</b></span>
                    </div>
                  </div>
                  {/* Progresso visual será atualizado com integração real */}
                </card_1.CardContent>
              </card_1.Card>);
            }
        })}
      </div>
      {/* Histórico de metas */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Histórico de Metas</h2>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {goals.filter(g => g.status !== "active").length === 0 && (<card_1.Card className="col-span-full text-center py-8">
              <card_1.CardContent className="text-muted-foreground">
                Em breve: acompanhe aqui todas as metas concluídas, canceladas ou recorrentes.
              </card_1.CardContent>
            </card_1.Card>)}
          {goals.filter(g => g.status !== "active").map(goal => (<card_1.Card key={goal.id} className="opacity-70">
              <card_1.CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <card_1.CardTitle>{goal.name}</card_1.CardTitle>
                  <card_1.CardDescription>{goal.description}</card_1.CardDescription>
                  <div className="mt-2 flex gap-2 items-center">
                    <badge_1.Badge variant={goal.status === "completed" ? "success" : goal.status === "cancelled" ? "secondary" : "secondary"}>
                      {goal.status === "completed" ? "Concluída" : "Cancelada"}
                    </badge_1.Badge>
                    <button_1.Button size="sm" variant="outline" onClick={() => updateGoal({ ...goal, status: "active" })}>Reativar</button_1.Button>
                    <button_1.Button size="sm" variant="destructive" onClick={() => setDeletingGoal(goal)}>Excluir</button_1.Button>
                  </div>
                  {goal.status === "completed" && (<div className="text-emerald-600 text-xs mt-1 font-semibold">Parabéns! Você atingiu sua meta 🎉</div>)}
                </div>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="text-sm text-muted-foreground mb-2">
                  Tipo: {goal.type === "saving" ? "Economia" : goal.type === "spending" ? "Gasto" : "Objetivo"}
                  {goal.category_id && <span> • Categoria vinculada</span>}
                </div>
                <div className="font-semibold">
                  Valor alvo: R$ {Number(goal.target_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Status: {goal.status === "completed" ? "Concluída" : "Cancelada"}
                </div>
              </card_1.CardContent>
            </card_1.Card>))}
        </div>
      </div>
      {/* Modal de criação de meta */}
      <GoalForm_1.GoalForm open={showCreate} onClose={() => setShowCreate(false)} onSubmit={handleCreateGoal} loading={creating}/>
      {/* Modal de edição de meta */}
      <GoalForm_1.GoalForm open={!!editingGoal} onClose={() => setEditingGoal(null)} onSubmit={handleEditGoal} loading={creating} initialData={editingGoal}/>
      {/* Modal de confirmação de exclusão */}
      <dialog_1.Dialog open={!!deletingGoal} onOpenChange={() => setDeletingGoal(null)}>
        <dialog_1.DialogContent className="max-w-sm">
          <dialog_1.DialogHeader>
            <dialog_1.DialogTitle>Excluir Meta</dialog_1.DialogTitle>
          </dialog_1.DialogHeader>
          <div className="py-4">Tem certeza que deseja excluir a meta <b>{deletingGoal?.name}</b>?</div>
          <div className="flex justify-end gap-2 mt-4">
            <button_1.Button variant="outline" onClick={() => setDeletingGoal(null)} disabled={deleting}>Cancelar</button_1.Button>
            <button_1.Button variant="destructive" onClick={handleDeleteGoal} disabled={deleting}>{deleting ? "Excluindo..." : "Excluir"}</button_1.Button>
          </div>
        </dialog_1.DialogContent>
      </dialog_1.Dialog>
      <HelpModal_1.HelpModal open={showHelp} onClose={() => setShowHelp(false)}/>
    </div>);
}
