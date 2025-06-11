"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownIcon, ArrowUpIcon, DollarSign, TrendingDown } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useMemo } from "react"

interface DashboardCardsProps {
  currentBalance: number
  balanceChange: number
  monthlyIncome: number
  incomeChange: number
  monthlyExpenses: number
  expensesChange: number
  highestExpense: number
  highestExpenseCategory?: string
}

export function DashboardCards(props: DashboardCardsProps) {
  const {
    currentBalance,
    balanceChange,
    monthlyIncome,
    incomeChange,
    monthlyExpenses,
    expensesChange,
    highestExpense,
    highestExpenseCategory
  } = props

  // Memoizar os valores para evitar re-renderizações desnecessárias
  const cards = useMemo(() => ([
    {
      title: "Saldo Atual",
      value: formatCurrency(currentBalance),
      change: `${balanceChange > 0 ? "+" : ""}${balanceChange.toFixed(1)}% em relação ao mês anterior`,
      icon: <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />,
    },
    {
      title: "Receitas (Mês)",
      value: formatCurrency(monthlyIncome),
      change: `${incomeChange > 0 ? "+" : ""}${incomeChange.toFixed(1)}% em relação ao mês anterior`,
      icon: <ArrowUpIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />,
    },
    {
      title: "Despesas (Mês)",
      value: formatCurrency(monthlyExpenses),
      change: `${expensesChange > 0 ? "+" : ""}${expensesChange.toFixed(1)}% em relação ao mês anterior`,
      icon: <ArrowDownIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-500" />,
    },
    {
      title: "Maior Gasto",
      value: formatCurrency(highestExpense),
      change: highestExpenseCategory ? `Categoria: ${highestExpenseCategory}` : "Maior despesa do mês",
      icon: <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />,
    },
  ]), [currentBalance, balanceChange, monthlyIncome, incomeChange, monthlyExpenses, expensesChange, highestExpense, highestExpenseCategory])

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => (
        <Card key={card.title} className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">{card.title}</CardTitle>
            {card.icon}
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-base sm:text-2xl font-bold">{card.value}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">{card.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
