"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { PieChart, Pie, Cell } from "recharts"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { useEffect, useState } from "react"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57']

// Custom month formatter to show more readable month names
const formatMonth = (month: string) => {
  // Convert abbreviated months to more recognizable format
  const months: Record<string, string> = {
    'JAN.': 'Jan',
    'FEV.': 'Fev',
    'MAR.': 'Mar',
    'ABR.': 'Abr',
    'MAI.': 'Mai',
    'JUN.': 'Jun',
    'JUL.': 'Jul',
    'AGO.': 'Ago',
    'SET.': 'Set',
    'OUT.': 'Out',
    'NOV.': 'Nov',
    'DEZ.': 'Dez'
  }
  
  return months[month] || month
}

// Full month names for tooltips
const getFullMonthName = (month: string) => {
  const fullMonths: Record<string, string> = {
    'JAN.': 'Janeiro',
    'FEV.': 'Fevereiro',
    'MAR.': 'Março',
    'ABR.': 'Abril',
    'MAI.': 'Maio',
    'JUN.': 'Junho',
    'JUL.': 'Julho',
    'AGO.': 'Agosto',
    'SET.': 'Setembro',
    'OUT.': 'Outubro',
    'NOV.': 'Novembro',
    'DEZ.': 'Dezembro'
  }
  
  return fullMonths[month] || month
}

export function Overview() {
  const { dashboard, loading } = useDashboardData(localStorage.getItem("token") || "")
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    
    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)
    
    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[250px] sm:h-[350px]">
        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
      <Card className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
          <CardTitle className="text-base sm:text-lg">Evolução Financeira</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Histórico de receitas, despesas e saldo dos últimos 12 meses</CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
          <div className="h-[200px] sm:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard?.monthlyData || []}>
                <XAxis 
                  dataKey="month" 
                  stroke="#888888" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                  tickMargin={5}
                  tickFormatter={formatMonth}
                  interval={isMobile ? 1 : 0}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$${value}`}
                  width={45}
                />
                <Tooltip 
                  formatter={(value) => [`R$ ${value}`, undefined]} 
                  labelFormatter={(label) => `Mês: ${getFullMonthName(label)}`}
                  contentStyle={{ 
                    fontSize: '12px',
                    backgroundColor: 'var(--tooltip-bg, #ffffff)',
                    color: 'var(--tooltip-text, #000000)',
                    border: '1px solid var(--tooltip-border, #cccccc)'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} />
                <Bar dataKey="income" name="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="balance" name="Saldo" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
          <CardTitle className="text-base sm:text-lg">Distribuição de Despesas</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Despesas por categoria no mês atual</CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
          <div className="flex justify-center items-center h-[200px] sm:h-[350px] w-full">
            {dashboard?.currentMonth?.expensesByCategory && dashboard.currentMonth.expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboard.currentMonth.expensesByCategory.map((cat: any) => ({
                      name: cat.category,
                      value: cat.amount
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => {
                      const displayName = isMobile && name.length > 10 
                        ? `${name.substring(0, 8)}...` 
                        : name;
                      return `${displayName} (${(percent * 100).toFixed(0)}%)`
                    }}
                  >
                    {dashboard.currentMonth.expensesByCategory.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`R$ ${value}`, undefined]} 
                    contentStyle={{ 
                      fontSize: '12px',
                      backgroundColor: 'var(--tooltip-bg, #ffffff)',
                      color: 'var(--tooltip-text, #000000)',
                      border: '1px solid var(--tooltip-border, #cccccc)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col justify-center items-center h-full text-muted-foreground text-center px-4">
                <span className="text-sm sm:text-base">Nenhuma despesa encontrada para exibir o gráfico.</span>
                <span className="text-xs sm:text-sm mt-2">Adicione despesas para ver a distribuição por categoria.</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}