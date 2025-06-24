"use client"

import { useDashboardData } from "@/hooks/use-dashboard-data"
import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, CreditCard, Plus, X } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuthContext } from "@/contexts/auth-context"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { CreditCardModal } from "@/components/credit-card/credit-card-modal"
import { ExpenseByCategoryCharts } from "@/components/dashboard/expense-category-charts"

// Forçar renderização dinâmica para evitar problemas com cookies
export const dynamic = 'force-dynamic';

// Interface para os cartões de crédito
interface CreditCard {
  id: number
  userId: string
  name: string
  color: string
  lastFourDigits: string
  bank?: string
  cardLimit?: number
  createdAt: string
  updatedAt: string
}

// Tipos de período para o gráfico
type ChartPeriod = 'Mensal' | 'Semanal' | 'Anual' | 'Personalizado';

// Interface para representar um período selecionável
interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Interface para categorias de despesa
interface CategoryExpense {
  category: string;
  amount: number;
  percentage: number;
}

export default function DashboardPage() {
  const [token, setToken] = useState<string | null>(null)
  const { user } = useAuthContext()
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const [isCardModalOpen, setIsCardModalOpen] = useState(false)
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('Mensal')
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { startDate: startOfMonth, endDate: endOfMonth };
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  useEffect(() => {
    setToken(localStorage.getItem("token"))
  }, [])

  // Buscar cartões de crédito do usuário
  useEffect(() => {
    const fetchCreditCards = async () => {
      if (!token || !user?.id) return
      
      try {
        const response = await fetch(`/api/credit-cards?userId=${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          setCreditCards(data)
        }
      } catch (error) {
        console.error("Erro ao buscar cartões:", error)
      }
    }
    
    fetchCreditCards()
  }, [token, user])

  const { dashboard, transactions, loading, error } = useDashboardData(token || "")

  // Criar dados do mini gráfico para o saldo
  const miniChartData = dashboard?.monthlyData?.slice(-6).map((item: any) => ({
    name: item.month,
    value: item.balance
  })) || []

  // Função para processar dados baseados no período selecionado
  const processChartData = useMemo(() => {
    if (!dashboard?.monthlyData) return []

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    switch (chartPeriod) {
      case 'Semanal': {
        // Identificar a semana atual
        const currentDate = new Date();
        const dayOfWeek = currentDate.getDay(); // 0 = domingo, 6 = sábado
        const startDay = new Date(currentDate);
        startDay.setDate(currentDate.getDate() - dayOfWeek);
        
        // Gerar dados para cada dia da semana atual
        const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const weekData = [];
        
        // Obter transações da semana
        const weekTransactions = transactions?.filter((transaction: any) => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= startDay && transactionDate <= currentDate;
        });
        
        // Calcular receitas e despesas por dia
        for (let i = 0; i <= dayOfWeek; i++) {
          const dayDate = new Date(startDay);
          dayDate.setDate(startDay.getDate() + i);
          
          const dayTransactions = weekTransactions?.filter((transaction: any) => {
            const transactionDate = new Date(transaction.date);
            return transactionDate.getDate() === dayDate.getDate() && 
                   transactionDate.getMonth() === dayDate.getMonth() &&
                   transactionDate.getFullYear() === dayDate.getFullYear();
          }) || [];
          
          const income = dayTransactions
            .filter((t: any) => t.type === 'income')
            .reduce((sum: number, t: any) => sum + t.amount, 0);
          
          const expenses = dayTransactions
            .filter((t: any) => t.type === 'expense')
            .reduce((sum: number, t: any) => sum + t.amount, 0);
          
          weekData.push({
            name: weekDays[i],
            income,
            expenses,
            balance: income - expenses
          });
        }
        
        // Se estamos no início da semana, adicionar previsão para o resto da semana
        while (weekData.length < 7) {
          const lastDayData: { income: number; expenses: number; balance: number } = weekData.length > 0 
            ? { 
                income: weekData[weekData.length - 1].income, 
                expenses: weekData[weekData.length - 1].expenses,
                balance: weekData[weekData.length - 1].balance
              } 
            : { income: 0, expenses: 0, balance: 0 };
            
          weekData.push({
            name: weekDays[weekData.length],
            income: lastDayData.income * 0.2, // Previsão simplificada
            expenses: lastDayData.expenses * 0.2,
            balance: (lastDayData.income - lastDayData.expenses) * 0.2
          });
        }
        
        return weekData;
      }
      
      case 'Anual': {
        // Criar estrutura para armazenar dados mensais do ano atual
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const yearData = Array(12).fill(0).map((_, index) => ({
          name: monthNames[index],
          income: 0,
          expenses: 0,
          balance: 0
        }));
        
        // Processar dados de transações agregados por mês para o ano atual
        transactions?.forEach((transaction: any) => {
          const transactionDate = new Date(transaction.date);
          // Verificar se a transação é do ano atual
          if (transactionDate.getFullYear() === currentYear) {
            const monthIndex = transactionDate.getMonth();
            if (transaction.type === 'income') {
              yearData[monthIndex].income += transaction.amount;
              yearData[monthIndex].balance += transaction.amount;
            } else if (transaction.type === 'expense') {
              yearData[monthIndex].expenses += transaction.amount;
              yearData[monthIndex].balance -= transaction.amount;
            }
          }
        });
        
        // Obter dados mensais do dashboard, caso as transações não tenham todos os dados
        if (dashboard?.monthlyData && dashboard.monthlyData.length > 0) {
          dashboard.monthlyData.forEach((monthData: any) => {
            if (monthData.month && monthData.month.length >= 3) {
              const monthName = monthData.month.substring(0, 3);
              const monthIndex = monthNames.findIndex(
                name => name.toLowerCase() === monthName.toLowerCase()
              );
              
              if (monthIndex !== -1) {
                // Se os dados de transações são insuficientes, usamos os dados do dashboard
                if (yearData[monthIndex].income === 0 && yearData[monthIndex].expenses === 0) {
                  yearData[monthIndex].income = monthData.income || 0;
                  yearData[monthIndex].expenses = monthData.expenses || 0;
                  yearData[monthIndex].balance = monthData.balance || 0;
                }
              }
            }
          });
        }
        
        // Retornar todos os meses
        return yearData;
      }
      
      case 'Mensal': {
        // Para visualização mensal, mostrar todos os dias do mês atual
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        // Criar array com todos os dias do mês
        const daysData = Array(daysInMonth).fill(0).map((_, index) => ({
          name: `${index + 1}`,
          income: 0,
          expenses: 0,
          balance: 0
        }));
        
        // Preencher com dados reais de transações
        transactions?.forEach((transaction: any) => {
          const transactionDate = new Date(transaction.date);
          if (
            transactionDate.getMonth() === currentMonth &&
            transactionDate.getFullYear() === currentYear
          ) {
            const dayIndex = transactionDate.getDate() - 1;
            if (transaction.type === 'income') {
              daysData[dayIndex].income += transaction.amount;
              daysData[dayIndex].balance += transaction.amount;
            } else if (transaction.type === 'expense') {
              daysData[dayIndex].expenses += transaction.amount;
              daysData[dayIndex].balance -= transaction.amount;
            }
          }
        });
        
        return daysData;
      }
      
      case 'Personalizado': {
        // Implementação para período personalizado
        if (!dateRange.startDate || !dateRange.endDate) {
          return [];
        }
        
        // Criar um array de datas entre startDate e endDate
        const dates: Date[] = [];
        const currentDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        
        while (currentDate <= endDate) {
          dates.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Transformar em formato para o gráfico
        const customData = dates.map(date => ({
          name: `${date.getDate()}/${date.getMonth() + 1}`,
          income: 0,
          expenses: 0,
          balance: 0
        }));
        
        // Preencher com dados reais de transações
        transactions?.forEach((transaction: any) => {
          const transactionDate = new Date(transaction.date);
          const index = dates.findIndex(date => 
            date.getDate() === transactionDate.getDate() &&
            date.getMonth() === transactionDate.getMonth() &&
            date.getFullYear() === transactionDate.getFullYear()
          );
          
          if (index !== -1) {
            if (transaction.type === 'income') {
              customData[index].income += transaction.amount;
              customData[index].balance += transaction.amount;
            } else if (transaction.type === 'expense') {
              customData[index].expenses += transaction.amount;
              customData[index].balance -= transaction.amount;
            }
          }
        });
        
        return customData;
      }
      
      default:
        return dashboard.monthlyData;
    }
  }, [dashboard?.monthlyData, chartPeriod, transactions, dateRange]);

  // Função para formatar porcentagens com apenas uma casa decimal
  const formatPercentage = (value: number) => {
    return value ? parseFloat(value.toFixed(1)) : 0;
  }

  // Funções para navegação entre cartões
  const nextCard = () => {
    setActiveCardIndex((prev) => (prev + 1) % creditCards.length);
  };

  const prevCard = () => {
    setActiveCardIndex((prev) => (prev - 1 + creditCards.length) % creditCards.length);
  };

  // Handler para mudança de período do gráfico
  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setChartPeriod(e.target.value as ChartPeriod)
  }

  if (loading) {
    return <div className="flex justify-center items-center h-96">Carregando...</div>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">Erro ao carregar o dashboard</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
          onClick={() => window.location.reload()}
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  // Transações recentes - limite de 5
  const recentTransactions = transactions
    ?.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    ?.slice(0, 5) || []

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Olá {user?.name || 'Usuário'}, Bem-vindo!</h1>
      </div>

      {/* Layout do dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Área principal - 3/4 da largura em telas grandes */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Card principal do saldo */}
          <Card className="bg-gray-900 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-gray-300 mb-2">Meu Saldo</h2>
                  <p className="text-3xl font-bold">{formatCurrency(dashboard?.currentMonth?.balance || 0)}</p>
                </div>
                <div className="w-24 h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={miniChartData}>
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#4ade80" 
                        strokeWidth={2} 
                        dot={false} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="text-xs text-green-400 text-right">
                    +{formatPercentage(dashboard?.trends?.balance || 0)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Três cards de métricas (Receitas, Despesas, Economias) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Receitas */}
            <Card className="bg-green-50 border-green-100">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-gray-600 text-sm font-medium">Total de Receitas</h3>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold">{formatCurrency(dashboard?.currentMonth?.totalIncome || 0)}</p>
                  <div className="text-xs text-green-600">+{formatPercentage(dashboard?.trends?.income || 0)}%</div>
                </div>
                <div className="mt-2 h-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboard?.monthlyData?.slice(-4)}>
                      <Area 
                        type="monotone" 
                        dataKey="income" 
                        stroke="#22c55e" 
                        fill="#22c55e" 
                        fillOpacity={0.2} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Despesas */}
            <Card className="bg-red-50 border-red-100">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-gray-600 text-sm font-medium">Total de Despesas</h3>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold">{formatCurrency(dashboard?.currentMonth?.totalExpense || 0)}</p>
                  <div className="text-xs text-red-600">+{formatPercentage(dashboard?.trends?.expense || 0)}%</div>
                </div>
                <div className="mt-2 h-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboard?.monthlyData?.slice(-4)}>
                      <Area 
                        type="monotone" 
                        dataKey="expenses" 
                        stroke="#ef4444" 
                        fill="#ef4444" 
                        fillOpacity={0.2} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Economia/Poupança */}
            <Card className="bg-blue-50 border-blue-100">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-gray-600 text-sm font-medium">Total de Economias</h3>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold">{formatCurrency((dashboard?.currentMonth?.balance || 0) * 0.2)}</p>
                  <div className="text-xs text-blue-600">+{formatPercentage(Math.round((dashboard?.trends?.balance || 0) * 0.8))}%</div>
                </div>
                <div className="mt-2 h-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboard?.monthlyData?.slice(-4)}>
                      <Area 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.2} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico principal - Visão geral */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Visão Geral</CardTitle>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span className="text-xs text-gray-500">Receitas</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span className="text-xs text-gray-500">Despesas</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select 
                      className="bg-gray-100 rounded-md px-3 py-1 text-xs border border-gray-200"
                      value={chartPeriod}
                      onChange={handlePeriodChange}
                    >
                      <option>Mensal</option>
                      <option>Semanal</option>
                      <option>Anual</option>
                      <option>Personalizado</option>
                    </select>
                    
                    {chartPeriod === 'Personalizado' && (
                      <Dialog open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-7 text-xs px-2"
                          >
                            Selecionar Período
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Selecionar Período</DialogTitle>
                            <DialogDescription>
                              Escolha o período para visualizar os dados financeiros.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Data Inicial</label>
                                <input 
                                  type="date" 
                                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                  value={dateRange.startDate.toISOString().split('T')[0]}
                                  onChange={(e) => {
                                    const newDate = e.target.value ? new Date(e.target.value) : new Date();
                                    setDateRange(prev => ({...prev, startDate: newDate}));
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Data Final</label>
                                <input 
                                  type="date" 
                                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                  value={dateRange.endDate.toISOString().split('T')[0]}
                                  onChange={(e) => {
                                    const newDate = e.target.value ? new Date(e.target.value) : new Date();
                                    setDateRange(prev => ({...prev, endDate: newDate}));
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button 
                              variant="outline" 
                              onClick={() => setIsDatePickerOpen(false)}
                            >
                              Cancelar
                            </Button>
                            <Button
                              onClick={() => {
                                // Validar datas
                                if (dateRange.startDate > dateRange.endDate) {
                                  alert('A data inicial deve ser anterior à data final');
                                  return;
                                }
                                setIsDatePickerOpen(false);
                              }}
                            >
                              Aplicar
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={processChartData}
                    margin={{ top: 5, right: 10, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      stroke="#888888"
                      interval={processChartData.length > 12 ? 'preserveStartEnd' : 0}
                      angle={processChartData.length > 30 ? -45 : 0}
                      textAnchor={processChartData.length > 30 ? "end" : "middle"}
                      height={processChartData.length > 30 ? 50 : 30}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      stroke="#888888"
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      formatter={(value) => [`$${value}`, undefined]}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #f0f0f0',
                        borderRadius: '8px',
                        padding: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#22c55e" 
                      strokeWidth={3}
                      dot={processChartData.length > 30 ? false : { stroke: '#22c55e', strokeWidth: 2, r: 4 }}
                      activeDot={{ stroke: '#22c55e', strokeWidth: 2, r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#ef4444" 
                      strokeWidth={3}
                      dot={processChartData.length > 30 ? false : { stroke: '#ef4444', strokeWidth: 2, r: 4 }}
                      activeDot={{ stroke: '#ef4444', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Adicionar gráficos de despesa por categoria */}
          {dashboard?.currentMonth?.expensesByCategory && (
            <ExpenseByCategoryCharts 
              data={dashboard.currentMonth.expensesByCategory.map((category: CategoryExpense) => ({
                name: category.category,
                value: category.amount,
                percentage: category.percentage
              }))}
              loading={loading}
            />
          )}
        </div>

        {/* Barra lateral - 1/4 da largura em telas grandes */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Transações recentes */}
          <Card>
            <CardHeader className="pb-2 flex justify-between items-center">
              <CardTitle className="text-lg">Transações Recentes</CardTitle>
              <Link href="/transactions">
                <Button variant="link" size="sm" className="text-primary text-xs">Ver todas</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction: any) => (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 bg-gray-100">
                        <AvatarFallback>{transaction.description[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{transaction.description}</p>
                        <p className="text-xs text-gray-500">{transaction.category}</p>
                      </div>
                    </div>
                    <p className={`text-sm font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Meus Cartões */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2 flex justify-between items-center">
              <CardTitle className="text-lg">Meus Cartões</CardTitle>
              <CreditCardModal 
                open={isCardModalOpen}
                onOpenChange={setIsCardModalOpen}
                buttonProps={{
                  variant: "outline",
                  size: "sm",
                  className: "h-8 sm:h-10 text-xs sm:text-sm px-2 sm:px-4"
                }}
              />
            </CardHeader>
            <CardContent className="p-0">
              {creditCards.length > 0 ? (
                <div className="relative">
                  {/* Área do cartão com altura fixa */}
                  <div className="h-[220px] relative">
                    {/* Botões de navegação */}
                    {creditCards.length > 1 && (
                      <>
                        <button 
                          onClick={prevCard}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 z-20 bg-white/80 dark:bg-gray-800/80 rounded-full p-1 shadow-md hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
                          aria-label="Cartão anterior"
                        >
                          <ChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                        </button>
                        <button 
                          onClick={nextCard}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 z-20 bg-white/80 dark:bg-gray-800/80 rounded-full p-1 shadow-md hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
                          aria-label="Próximo cartão"
                        >
                          <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                        </button>
                      </>
                    )}
                    
                    {/* Carrossel de cartões */}
                    <div className="px-6 pt-4 pb-2 h-full flex items-center">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeCardIndex}
                          initial={{ opacity: 0, scale: 0.9, x: 100 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.9, x: -100 }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          className="w-full"
                        >
                          <div 
                            className="w-full text-white rounded-xl p-5 h-44 flex flex-col justify-between relative overflow-hidden shadow-lg transform transition-transform hover:scale-[1.02] cursor-pointer"
                            style={{ backgroundColor: creditCards[activeCardIndex].color || '#1f2937' }}
                            onClick={() => setIsCardModalOpen(true)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="z-10">
                                <p className="text-xs text-gray-100 font-medium opacity-90">
                                  {creditCards[activeCardIndex].bank || creditCards[activeCardIndex].name}
                                </p>
                                <p className="text-lg font-bold mt-4 tracking-wider">
                                  **** **** **** {creditCards[activeCardIndex].lastFourDigits}
                                </p>
                              </div>
                              <CreditCard className="text-white opacity-70" />
                            </div>
                            <div className="z-10 flex justify-between items-end">
                              <div>
                                <p className="text-xs text-gray-100 opacity-80">CARTÃO</p>
                                <p className="text-sm font-semibold">{creditCards[activeCardIndex].name}</p>
                              </div>
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-white/30 rounded-full mr-1"></div>
                                <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                              </div>
                            </div>
                            {/* Elementos decorativos com cor personalizada */}
                            <div 
                              className="absolute right-0 top-0 w-40 h-40 rounded-full transform translate-x-20 -translate-y-20"
                              style={{ backgroundColor: `${creditCards[activeCardIndex].color}90`, filter: 'blur(5px)' }}
                            ></div>
                            <div 
                              className="absolute left-0 bottom-0 w-32 h-32 rounded-full transform -translate-x-16 translate-y-16"
                              style={{ backgroundColor: `${creditCards[activeCardIndex].color}90`, filter: 'blur(5px)' }}
                            ></div>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    
                    {/* Indicador de cartões */}
                    {creditCards.length > 1 && (
                      <div className="flex justify-center gap-1.5 pb-4">
                        {creditCards.map((_, index) => (
                          <button 
                            key={index}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                              index === activeCardIndex 
                                ? 'bg-primary w-4' 
                                : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                            onClick={() => setActiveCardIndex(index)}
                            aria-label={`Ir para cartão ${index + 1}`}
                          ></button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Informações adicionais do cartão */}
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex justify-between items-center text-sm">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Cartão atual</p>
                        <p className="font-medium">{creditCards[activeCardIndex].name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {activeCardIndex + 1} de {creditCards.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 px-6 text-gray-500">
                  <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-3 opacity-50" />
                  <p className="font-medium mb-1">Nenhum cartão cadastrado</p>
                  <p className="text-sm text-gray-400">Adicione um cartão para visualizá-lo aqui</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
