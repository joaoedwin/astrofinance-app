"use client"

import React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, PlusCircle, Pencil, Trash, Info } from "lucide-react"
import { useGoals, type Goal } from "@/hooks/use-goals"
import { GoalForm } from "./GoalForm"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useTransactions } from "@/hooks/use-transactions"
import { isWithinInterval, parseISO, format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { useInstallments } from "@/hooks/use-installments"
import { HelpModal } from "./HelpModal"
import { useGoalReserves } from "@/hooks/use-goal-reserves"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import type { GoalType, GoalStatus, Transaction } from "@/types/database"

export default function GoalsPage() {
  const { goals, loading, error, fetchGoals, createGoal, updateGoal, deleteGoal } = useGoals()
  const { transactions, loading: loadingTx, fetchTransactions } = useTransactions()
  const { installments, fetchInstallments } = useInstallments()
  const { reserves, fetchReserves, createReserve, updateReserve, deleteReserve, loading: loadingReserves } = useGoalReserves()
  const { toast } = useToast()
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [reserveInput, setReserveInput] = useState<{ [goalId: string]: string }>({})
  const [editingReserveId, setEditingReserveId] = useState<string | null>(null)
  const [reserveEditValue, setReserveEditValue] = useState<string>("")
  const [showHistoryModal, setShowHistoryModal] = useState<string | null>(null)

  useEffect(() => {
    fetchGoals()
    fetchTransactions()
    fetchInstallments()
  }, [fetchGoals, fetchTransactions, fetchInstallments])

  useEffect(() => {
    if (goals.length > 0) {
      fetchReserves(); // busca todas as reservas do usuário após carregar metas
    }
  }, [goals, fetchReserves])

  const handleCreateGoal = async (data: any) => {
    setCreating(true)
    await createGoal(data)
    setCreating(false)
    setShowCreate(false)
  }

  const handleEditGoal = async (data: any) => {
    setCreating(true)
    await updateGoal({ ...editingGoal, ...data })
    setCreating(false)
    setEditingGoal(null)
  }

  const handleDeleteGoal = async () => {
    if (!deletingGoal) return
    setDeleting(true)
    await deleteGoal(deletingGoal.id)
    setDeleting(false)
    setDeletingGoal(null)
  }

  const calculateGoalStatus = (
    goal: Goal,
    progress: number,
    type: "saving" | "spending" | "purchase",
    currentStatus: "active" | "completed" | "cancelled",
    endDate: Date | null
  ): "active" | "completed" | "cancelled" => {
    if (currentStatus !== "active") return currentStatus
    
    const today = new Date()
    if (progress >= 100 && endDate && today > endDate) {
      return type === "spending" ? "cancelled" : "completed"
    }
    
    return currentStatus
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          Metas
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 sm:h-10 text-xs sm:text-sm" onClick={() => setShowHelp(true)}>
            <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" /> <span className="hidden xs:inline">Como funciona?</span>
          </Button>
          <Button variant="default" size="sm" className="h-8 sm:h-10 text-xs sm:text-sm gap-1 sm:gap-2" onClick={() => setShowCreate(true)}>
            <PlusCircle className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            Nova Meta
          </Button>
        </div>
      </div>
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
        {loading && (
          <Card className="col-span-full text-center py-8 sm:py-12">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Carregando metas...</CardTitle>
            </CardHeader>
          </Card>
        )}
        {error && (
          <Card className="col-span-full text-center py-8 sm:py-12">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Erro ao carregar metas</CardTitle>
              <CardDescription className="text-xs sm:text-sm">{error}</CardDescription>
            </CardHeader>
          </Card>
        )}
        {!loading && !error && goals.length === 0 && (
          <Card className="col-span-full text-center py-8 sm:py-12">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Nenhuma meta cadastrada</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Crie sua primeira meta para começar a acompanhar seu progresso financeiro!</CardDescription>
            </CardHeader>
          </Card>
        )}
        {/* Renderizar metas ativas */}
        {goals.filter(g => g.status === "active").map(goal => {
          if (goal.type === "purchase") {
            // Reservas dessa meta
            const goalReserves = reserves.filter(r => r.goal_id === goal.id)
            const totalReservado = goalReserves.reduce((sum, r) => sum + Number(r.amount), 0)
            const valorFaltante = Math.max(0, Number(goal.target_amount) - totalReservado)
            const progress = Math.max(0, Math.min(100, Math.round((totalReservado / Number(goal.target_amount)) * 100)))
            // Mês atual
            const now = new Date()
            const mesAtual = format(now, "yyyy-MM")
            const reservaAtual = goalReserves.find(r => r.month === mesAtual)
            return (
              <Card key={goal.id} className="border-2 border-blue-400">
                <CardHeader className="flex flex-col sm:flex-row items-start justify-between gap-2 px-3 sm:px-6 py-3 sm:py-6">
                  <div>
                    <CardTitle className="text-base sm:text-lg">
                      {goal.name} <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs text-blue-600">Compra/Objetivo</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">{goal.description}</CardDescription>
                    <div className="mt-2 flex flex-wrap gap-2 items-center">
                      <Badge variant={progress >= 100 ? "success" : "secondary"} className="text-[10px] sm:text-xs h-5 sm:h-6">
                        {progress >= 100 ? "Concluída" : "Ativa"}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => updateGoal({ ...goal, status: "completed" })} 
                        disabled={progress < 100}
                        className="h-6 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3"
                      >
                        Marcar como concluída
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => updateGoal({ ...goal, status: "cancelled" })}
                        className="h-6 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3"
                      >
                        Cancelar
                      </Button>
                    </div>
                    {progress >= 100 && (
                      <div className="text-emerald-600 text-[10px] sm:text-xs mt-1 font-semibold">Parabéns! Você atingiu sua meta 🎉</div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2 sm:mt-0">
                    <button className="p-1.5 sm:p-2 rounded hover:bg-muted" title="Editar" onClick={() => setEditingGoal(goal)}>
                      <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    <button className="p-1.5 sm:p-2 rounded hover:bg-muted text-destructive" title="Excluir" onClick={() => setDeletingGoal(goal)}>
                      <Trash className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-xs sm:text-sm text-muted-foreground mb-2">Valor alvo: R$ {Number(goal.target_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                  <div className="mb-2">
                    <Progress value={progress} />
                    <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 text-right">{progress}%</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 flex flex-col gap-1">
                      <span>Valor reservado: <b>R$ {totalReservado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</b></span>
                      <span>Falta para o objetivo: <b>R$ {valorFaltante.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</b></span>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="font-semibold text-xs sm:text-sm mb-1">Reserva do mês atual ({mesAtual}):</div>
                    <div className="flex flex-wrap items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                      {reservaAtual ? (
                        editingReserveId === reservaAtual.id ? (
                          <><Input type="number" min={0} step={0.01} value={reserveEditValue} onChange={e => setReserveEditValue(e.target.value)} className="w-24 sm:w-32 h-7 sm:h-9 text-xs sm:text-sm" />
                          <Button 
                            size="sm" 
                            onClick={async () => { 
                              await updateReserve(reservaAtual.id, Number(reserveEditValue)); 
                              setEditingReserveId(null); 
                              toast({ 
                                title: "Reserva atualizada!",
                                description: "O valor da reserva foi atualizado com sucesso."
                              }); 
                            }} 
                            disabled={loadingReserves}
                            className="h-7 sm:h-9 text-[10px] sm:text-xs"
                          >
                            Salvar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setEditingReserveId(null)}
                            className="h-7 sm:h-9 text-[10px] sm:text-xs"
                          >
                            Cancelar
                          </Button></>
                        ) : (
                          <><span className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-300">R$ {Number(reservaAtual.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => { setEditingReserveId(reservaAtual.id); setReserveEditValue(String(reservaAtual.amount)); }}
                            className="h-7 sm:h-9 text-[10px] sm:text-xs"
                          >
                            Editar
                          </Button></>
                        )
                      ) : (
                        <form className="flex flex-wrap gap-2 items-center" onSubmit={async e => {
                          e.preventDefault();
                          try {
                            await createReserve({ goal_id: goal.id, month: mesAtual, amount: Number(reserveInput[goal.id] || 0) });
                            setReserveInput(v => ({ ...v, [goal.id]: "" }));
                            toast({ 
                              title: "Reserva salva!",
                              description: "Nova reserva adicionada com sucesso."
                            });
                          } catch (err: any) {
                            if (err?.message?.includes("409")) {
                              toast({ 
                                title: "Erro",
                                description: "Já existe uma reserva para este mês.",
                                variant: "destructive"
                              });
                              await fetchReserves(goal.id);
                            } else {
                              toast({ 
                                title: "Erro",
                                description: "Erro ao salvar reserva. Tente novamente.",
                                variant: "destructive"
                              });
                            }
                          }
                        }}>
                          <Input 
                            type="number" 
                            min={0} 
                            step={0.01} 
                            value={reserveInput[goal.id] || ""} 
                            onChange={e => setReserveInput(v => ({ ...v, [goal.id]: e.target.value }))} 
                            className="w-24 sm:w-32 h-7 sm:h-9 text-xs sm:text-sm" 
                            placeholder="Valor reservado" 
                            disabled={!!reservaAtual} 
                          />
                          <Button 
                            size="sm" 
                            type="submit" 
                            disabled={loadingReserves || !reserveInput[goal.id] || !!reservaAtual}
                            className="h-7 sm:h-9 text-[10px] sm:text-xs"
                          >
                            Salvar
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setShowHistoryModal(goal.id)}
                      className="h-7 sm:h-9 text-[10px] sm:text-xs"
                    >
                      Histórico de Reservas
                    </Button>
                    {showHistoryModal === goal.id && (
                      <Dialog open={true} onOpenChange={() => setShowHistoryModal(null)}>
                        <DialogContent aria-describedby={undefined} className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Histórico de Reservas</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-2">
                            {goalReserves.length === 0 ? (
                              <div className="text-xs text-muted-foreground">Nenhuma reserva registrada ainda.</div>
                            ) : (
                              <ul className="text-xs text-muted-foreground space-y-1">
                                {goalReserves.sort((a, b) => a.month.localeCompare(b.month)).map(r => (
                                  <li key={r.id} className={`flex justify-between items-center ${r.month === mesAtual ? "font-bold text-blue-700 dark:text-blue-300" : ""}`}>
                                    <span>{r.month}</span>
                                    <span>R$ {Number(r.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                                    <Button size="sm" variant="outline" onClick={() => { setEditingReserveId(r.id); setReserveEditValue(String(r.amount)); setShowHistoryModal(null); }}>Editar</Button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          } else {
            // Cálculo real do progresso
            let valorAtual = 0
            let valorFaltante = 0
            let progress = 0
            let status: "active" | "completed" | "cancelled" = goal.status
            
            if (transactions && transactions.length > 0) {
              const start = goal.start_date ? parseISO(goal.start_date) : null
              const end = goal.end_date ? parseISO(goal.end_date) : null
              
              // Filtrar transações por período
              const txInPeriod = transactions.filter(tx => {
                const txDate = parseISO(tx.date)
                if (start && end) return isWithinInterval(txDate, { start, end })
                if (start) return txDate >= start
                return true
              })
              
              // Cálculos específicos por tipo de meta
              if (goal.type === "saving") {
                const income = txInPeriod.filter(tx => tx.type === "income").reduce((sum, tx) => sum + Number(tx.amount), 0)
                const expense = txInPeriod.filter(tx => tx.type === "expense").reduce((sum, tx) => sum + Number(tx.amount), 0)
                const saved = income - expense
                valorAtual = saved
                valorFaltante = Math.max(0, Number(goal.target_amount) - saved)
                progress = Math.max(0, Math.min(100, Math.round((saved / Number(goal.target_amount)) * 100)))
              } else if (goal.type === "spending") {
                const spent = txInPeriod
                  .filter(tx => tx.category_id === goal.category_id && tx.type === "expense")
                  .reduce((sum, tx) => sum + Number(tx.amount), 0)
                valorAtual = spent
                valorFaltante = Math.max(0, Number(goal.target_amount) - spent)
                progress = Math.max(0, Math.min(100, Math.round((spent / Number(goal.target_amount)) * 100)))
              } else if (goal.type === "purchase") {
                const income = txInPeriod.filter(tx => tx.type === "income").reduce((sum, tx) => sum + Number(tx.amount), 0)
                valorAtual = income
                valorFaltante = Math.max(0, Number(goal.target_amount) - income)
                progress = Math.max(0, Math.min(100, Math.round((income / Number(goal.target_amount)) * 100)))
              }
              
              // Atualizar status se necessário
              const newStatus = calculateGoalStatus(goal, progress, goal.type, status, end)
              if (newStatus !== status) {
                status = newStatus
                updateGoal({ ...goal, status })
              }
            }
            
            return (
              <Card key={goal.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle>{goal.name}</CardTitle>
                    <CardDescription>{goal.description}</CardDescription>
                    <div className="mt-2 flex gap-2 items-center">
                      <Badge variant={status === "completed" ? "success" : status === "cancelled" ? "destructive" : "secondary"}>
                        {status === "completed" ? "Concluída" : status === "cancelled" ? "Cancelada" : "Ativa"}
                      </Badge>
                      {status === "active" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => updateGoal({ ...goal, status: "completed" })}>
                            Marcar como concluída
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => updateGoal({ ...goal, status: "cancelled" })}>
                            Cancelar
                          </Button>
                        </>
                      )}
                    </div>
                    {status === "completed" && (
                      <div className="text-emerald-600 text-xs mt-1 font-semibold">Parabéns! Você atingiu sua meta 🎉</div>
                    )}
                    {status === "cancelled" && (
                      <div className="text-rose-600 text-xs mt-1 font-semibold">Atenção: meta cancelada!</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="p-2 rounded hover:bg-muted"
                      title="Editar"
                      onClick={() => setEditingGoal(goal)}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 rounded hover:bg-muted text-destructive"
                      title="Excluir"
                      onClick={() => setDeletingGoal(goal)}
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-2">
                    Tipo: {goal.type === "saving" ? "Economia" : goal.type === "spending" ? "Gasto" : "Objetivo"}
                    {goal.category_id && <span> • Categoria vinculada</span>}
                  </div>
                  <div className="font-semibold mb-2">
                    Valor alvo: R$ {Number(goal.target_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="mb-2">
                    <Progress value={progress} />
                    <div className="text-xs text-muted-foreground mt-1 text-right">{progress}%</div>
                    <div className="text-xs text-muted-foreground mt-1 flex flex-col gap-1">
                      <span>Valor atual: <b>R$ {valorAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</b></span>
                      <span>Falta para o objetivo: <b>R$ {valorFaltante.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</b></span>
                    </div>
                  </div>
                  {/* Progresso visual será atualizado com integração real */}
                </CardContent>
              </Card>
            )
          }
        })}
      </div>
      {/* Histórico de metas */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Histórico de Metas</h2>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {goals.filter(g => g.status !== "active").length === 0 && (
            <Card className="col-span-full text-center py-8">
              <CardContent className="text-muted-foreground">
                Em breve: acompanhe aqui todas as metas concluídas, canceladas ou recorrentes.
              </CardContent>
            </Card>
          )}
          {goals.filter(g => g.status !== "active").map(goal => (
            <Card key={goal.id} className="opacity-70">
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle>{goal.name}</CardTitle>
                  <CardDescription>{goal.description}</CardDescription>
                  <div className="mt-2 flex gap-2 items-center">
                    <Badge variant={goal.status === "completed" ? "success" : goal.status === "cancelled" ? "secondary" : "secondary"}>
                      {goal.status === "completed" ? "Concluída" : "Cancelada"}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => updateGoal({ ...goal, status: "active" })}>Reativar</Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeletingGoal(goal)}>Excluir</Button>
                  </div>
                  {goal.status === "completed" && (
                    <div className="text-emerald-600 text-xs mt-1 font-semibold">Parabéns! Você atingiu sua meta 🎉</div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      {/* Modal de criação de meta */}
      <GoalForm
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreateGoal}
        loading={creating}
      />
      {/* Modal de edição de meta */}
      <GoalForm
        open={!!editingGoal}
        onClose={() => setEditingGoal(null)}
        onSubmit={handleEditGoal}
        loading={creating}
        initialData={editingGoal}
      />
      {/* Modal de confirmação de exclusão */}
      <Dialog open={!!deletingGoal} onOpenChange={() => setDeletingGoal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir Meta</DialogTitle>
          </DialogHeader>
          <div className="py-4">Tem certeza que deseja excluir a meta <b>{deletingGoal?.name}</b>?</div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeletingGoal(null)} disabled={deleting}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteGoal} disabled={deleting}>{deleting ? "Excluindo..." : "Excluir"}</Button>
          </div>
        </DialogContent>
      </Dialog>
      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  )
} 