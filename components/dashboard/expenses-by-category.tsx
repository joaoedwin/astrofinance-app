"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { useMemo } from "react"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

interface CategoryData {
  name: string
  value: number
}

interface ExpensesByCategoryProps {
  data: CategoryData[]
  loading?: boolean
}

export function ExpensesByCategory({ data, loading }: ExpensesByCategoryProps) {
  const chartData = useMemo(() => Array.isArray(data) ? data : [], [data])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[350px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-[350px] text-muted-foreground">
        <span>Nenhuma despesa encontrada para exibir o gráfico.</span>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
        >
          {(chartData ?? []).map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`R$ ${value}`, undefined]} />
      </PieChart>
    </ResponsiveContainer>
  )
}
