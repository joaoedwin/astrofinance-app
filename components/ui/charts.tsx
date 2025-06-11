"use client"

import { useEffect, useRef, useState } from "react"
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface ChartProps {
  data: Array<Record<string, any>>
  index: string
  categories: string[]
  colors?: string[]
  valueFormatter?: (value: number) => string
  loading?: boolean
}

export function BarChart({
  data,
  index,
  categories,
  colors = ["#0369a1"],
  valueFormatter = (value: number) => value.toString(),
  loading = false,
}: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null)
  const [chartWidth, setChartWidth] = useState(0)

  useEffect(() => {
    if (chartContainerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        setChartWidth(entries[0].contentRect.width)
      })
      
      resizeObserver.observe(chartContainerRef.current)
      
      return () => {
        if (chartContainerRef.current) {
          resizeObserver.unobserve(chartContainerRef.current)
        }
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    )
  }

  return (
    <div ref={chartContainerRef} className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: chartWidth < 500 ? 60 : 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis
            dataKey={index}
            angle={chartWidth < 500 ? -45 : 0}
            textAnchor={chartWidth < 500 ? "end" : "middle"}
            height={60}
            tick={{ fontSize: 12 }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            formatter={(value: number) => [valueFormatter(value), ""]}
            contentStyle={{
              backgroundColor: "white",
              borderRadius: "6px",
              padding: "8px",
              border: "1px solid #e2e8f0",
            }}
          />
          <Legend formatter={(value: string) => <span className="text-sm">{value}</span>} />
          {categories.map((category: string, idx: number) => (
            <Bar
              key={category}
              dataKey={category}
              name={category}
              fill={colors[idx % colors.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function LineChart({
  data,
  index,
  categories,
  colors = ["#0369a1"],
  valueFormatter = (value: number) => value.toString(),
  loading = false,
}: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null)
  const [chartWidth, setChartWidth] = useState(0)

  useEffect(() => {
    if (chartContainerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        setChartWidth(entries[0].contentRect.width)
      })
      
      resizeObserver.observe(chartContainerRef.current)
      
      return () => {
        if (chartContainerRef.current) {
          resizeObserver.unobserve(chartContainerRef.current)
        }
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    )
  }

  return (
    <div ref={chartContainerRef} className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: chartWidth < 500 ? 60 : 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis
            dataKey={index}
            angle={chartWidth < 500 ? -45 : 0}
            textAnchor={chartWidth < 500 ? "end" : "middle"}
            height={60}
            tick={{ fontSize: 12 }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            formatter={(value: number) => [valueFormatter(value), ""]}
            contentStyle={{
              backgroundColor: "white",
              borderRadius: "6px",
              padding: "8px",
              border: "1px solid #e2e8f0",
            }}
          />
          <Legend formatter={(value: string) => <span className="text-sm">{value}</span>} />
          {categories.map((category: string, idx: number) => (
            <Line
              key={category}
              type="monotone"
              dataKey={category}
              name={category}
              stroke={colors[idx % colors.length]}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
} 