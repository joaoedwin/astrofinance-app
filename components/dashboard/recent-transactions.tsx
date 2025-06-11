"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: "income" | "expense"
  category: string
}

interface RecentTransactionsProps {
  transactions: Transaction[]
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  // Memoizar as 5 transações mais recentes
  const recent = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  }, [transactions])

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
        <CardTitle className="text-base sm:text-lg">Transações Recentes</CardTitle>
      </CardHeader>
      <CardContent className="px-0 sm:px-6 pb-3 sm:pb-6">
        {/* Versão para desktop */}
        <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell>
                    <Badge
                      variant={transaction.type === "income" ? "outline" : "destructive"}
                      className={
                        transaction.type === "income"
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700"
                          : ""
                      }
                    >
                      {transaction.type === "income" ? "Receita" : "Despesa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={transaction.type === "income" ? "text-emerald-600" : "text-rose-600"}>
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Versão para mobile */}
        <div className="block sm:hidden">
          <div className="divide-y">
            {recent.map((transaction) => (
              <div key={transaction.id} className="px-4 py-3 flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm line-clamp-1">{transaction.description}</span>
                  <span className={`font-semibold ${transaction.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>{formatDate(transaction.date)}</span>
                    <span>•</span>
                    <span>{transaction.category}</span>
                  </div>
                  <Badge
                    variant={transaction.type === "income" ? "outline" : "destructive"}
                    className={`text-[10px] px-1 py-0 h-4 ${
                      transaction.type === "income"
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700"
                        : ""
                    }`}
                  >
                    {transaction.type === "income" ? "Receita" : "Despesa"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
