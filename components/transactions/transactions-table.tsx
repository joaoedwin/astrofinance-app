"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"

interface Transaction {
  id: string
  date: Date
  description: string
  amount: number
  type: "income" | "expense"
  category: string
}

interface TransactionsTableProps {
  transactions: Transaction[]
  onToggleType?: (id: string, newType: "income" | "expense") => void
}

export function TransactionsTable({ transactions, onToggleType }: TransactionsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<Transaction>>({})
  const [animatingId, setAnimatingId] = useState<string | null>(null)
  const animationTimeout = useRef<NodeJS.Timeout | null>(null)

  const handleEdit = (transaction: Transaction) => {
    setEditingId(transaction.id)
    setEditValues(transaction)
  }

  const handleSave = (id: string) => {
    // TODO: Implementar salvamento no banco
    setEditingId(null)
    setEditValues({})
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditValues({})
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                {editingId === transaction.id ? (
                  <Input
                    type="date"
                    value={editValues.date ? new Date(editValues.date).toISOString().split("T")[0] : ""}
                    onChange={(e) => setEditValues({ ...editValues, date: new Date(e.target.value) })}
                  />
                ) : (
                  new Date(transaction.date).toLocaleDateString("pt-BR")
                )}
              </TableCell>
              <TableCell>
                {editingId === transaction.id ? (
                  <Input
                    value={editValues.description || ""}
                    onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                  />
                ) : (
                  transaction.description
                )}
              </TableCell>
              <TableCell>
                {editingId === transaction.id ? (
                  <Input
                    value={editValues.category || ""}
                    onChange={(e) => setEditValues({ ...editValues, category: e.target.value })}
                  />
                ) : (
                  transaction.category
                )}
              </TableCell>
              <TableCell>
                <button
                  type="button"
                  className={`transition-all duration-300 px-2 py-1 rounded-full text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer border-none shadow-sm transform hover:scale-105 active:scale-95 transition-badge ${transaction.type === "income" ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"} ${animatingId === transaction.id ? "animate-badge" : ""}`}
                  style={{ minWidth: 80 }}
                  onClick={async () => {
                    const newType = transaction.type === "income" ? "expense" : "income"
                    if (onToggleType) {
                      await onToggleType(transaction.id, newType)
                    }
                    setAnimatingId(transaction.id)
                    if (animationTimeout.current) clearTimeout(animationTimeout.current)
                    animationTimeout.current = setTimeout(() => setAnimatingId(null), 350)
                  }}
                >
                  {transaction.type === "income" ? "Receita" : "Despesa"}
                </button>
              </TableCell>
              <TableCell className="text-right">
                {editingId === transaction.id ? (
                  <Input
                    type="number"
                    value={editValues.amount || ""}
                    onChange={(e) => setEditValues({ ...editValues, amount: Number(e.target.value) })}
                  />
                ) : (
                  formatCurrency(transaction.amount)
                )}
              </TableCell>
              <TableCell>
                {editingId === transaction.id ? (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSave(transaction.id)}>
                      Salvar
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel}>
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => handleEdit(transaction)}>
                    Editar
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

<style jsx global>{`
  .transition-badge {
    transition: background-color 0.3s, color 0.3s, transform 0.2s, opacity 0.2s;
  }
  .animate-badge {
    animation: badgePulse 0.3s;
  }
  @keyframes badgePulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.15); opacity: 0.7; }
    100% { transform: scale(1); opacity: 1; }
  }
`}</style>
