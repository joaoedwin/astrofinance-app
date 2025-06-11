"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, RadialBarChart, RadialBar, Legend } from "recharts"
import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

// Cores para os gráficos
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d", "#ffc658", "#ff8042", "#d53e4f", "#66c2a5"]

// Interface para os dados
interface CategoryData {
  name: string
  value: number
  percentage: number
  fill?: string
}

interface ExpenseByCategoryChartsProps {
  data: CategoryData[]
  loading?: boolean
}

export function ExpenseByCategoryCharts({ data, loading }: ExpenseByCategoryChartsProps) {
  // Processar dados para os gráficos
  const chartData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return []
    
    return data.map((item, index) => ({
      name: item.name,
      value: item.value,
      percentage: item.percentage,
      fill: COLORS[index % COLORS.length]
    }))
  }, [data])

  // Processamento de dados para o gráfico radial
  const radialData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return []
    
    return data.map((item, index) => ({
      name: item.name,
      value: item.percentage, // Usamos a porcentagem para o gráfico radial
      fill: COLORS[index % COLORS.length]
    })).slice(0, 5) // Limitar a 5 categorias para melhor visualização
  }, [data])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-[200px] text-muted-foreground">
        <span>Nenhuma despesa encontrada para exibir o gráfico.</span>
      </div>
    )
  }

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Despesas por Categoria</CardTitle>
        <CardDescription>Distribuição das despesas por categoria no período selecionado</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gráfico de pizza */}
          <div className="h-[240px]">
            <p className="text-sm font-medium text-center mb-2">Gráfico de Pizza</p>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Valor']}
                  labelFormatter={(name) => `Categoria: ${name}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico radial */}
          <div className="h-[240px]">
            <p className="text-sm font-medium text-center mb-2">Top 5 Categorias (% do total)</p>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="20%" 
                outerRadius="80%" 
                barSize={10} 
                data={radialData}
              >
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={5}
                  label={{ fill: '#fff', fontSize: 10 }}
                />
                <Legend 
                  iconSize={10} 
                  layout="vertical" 
                  verticalAlign="middle" 
                  align="right"
                  wrapperStyle={{ fontSize: '10px' }}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Percentual']}
                  labelFormatter={(name) => `Categoria: ${name}`}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 