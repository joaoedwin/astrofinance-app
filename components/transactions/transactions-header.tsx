"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Filter } from "lucide-react"
import { NewTransactionButton } from "@/components/transactions/new-transaction-button"
import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

interface TransactionsHeaderProps {
  search: string
  onSearchChange: (value: string) => void
  type: "all" | "income" | "expense"
  onTypeChange: (type: "all" | "income" | "expense") => void
  category: string
  onCategoryChange: (category: string) => void
  order: "newest" | "oldest" | "highest" | "lowest"
  onOrderChange: (order: "newest" | "oldest" | "highest" | "lowest") => void
  dateStart: string
  onDateStartChange: (date: string) => void
  dateEnd: string
  onDateEndChange: (date: string) => void
  categories: string[]
}

export function TransactionsHeader({ search, onSearchChange, type, onTypeChange, category, onCategoryChange, order, onOrderChange, dateStart, onDateStartChange, dateEnd, onDateEndChange, categories }: TransactionsHeaderProps) {
  const [openFilters, setOpenFilters] = useState(false)
  
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* Primeira linha - Busca e Nova Transação */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <Input
            placeholder="Buscar transações..."
            className="w-full h-9 sm:h-10 text-sm"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
        
        {/* Botão de filtros em dispositivos móveis */}
        <div className="flex sm:hidden">
          <Sheet open={openFilters} onOpenChange={setOpenFilters}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-2.5">
                <Filter className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh]">
              <SheetHeader className="mb-4">
                <SheetTitle>Filtros</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Tipo</label>
                    <Select value={type} onValueChange={(val) => { onTypeChange(val as any); }}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="income">Receitas</SelectItem>
                        <SelectItem value="expense">Despesas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Categoria</label>
                    <Select value={category} onValueChange={onCategoryChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat === "all" ? "Todas as categorias" : cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Ordenar por</label>
                    <Select value={order} onValueChange={(val) => { onOrderChange(val as any); }}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Ordenar por" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Mais recentes</SelectItem>
                        <SelectItem value="oldest">Mais antigas</SelectItem>
                        <SelectItem value="highest">Maior valor</SelectItem>
                        <SelectItem value="lowest">Menor valor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Período</label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        className="w-full"
                        value={dateStart}
                        onChange={e => onDateStartChange(e.target.value)}
                        placeholder="Data inicial"
                      />
                      <Input
                        type="date"
                        className="w-full"
                        value={dateEnd}
                        onChange={e => onDateEndChange(e.target.value)}
                        placeholder="Data final"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <Button 
                    className="w-full" 
                    onClick={() => setOpenFilters(false)}
                  >
                    Aplicar Filtros
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        <NewTransactionButton />
      </div>
      
      {/* Filtros para desktop */}
      <div className="hidden sm:flex sm:flex-row gap-2">
        <Select value={type} onValueChange={onTypeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="income">Receitas</SelectItem>
            <SelectItem value="expense">Despesas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat === "all" ? "Todas as categorias" : cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={order} onValueChange={onOrderChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Mais recentes</SelectItem>
            <SelectItem value="oldest">Mais antigas</SelectItem>
            <SelectItem value="highest">Maior valor</SelectItem>
            <SelectItem value="lowest">Menor valor</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 ml-auto">
          <Input
            type="date"
            className="w-[140px]"
            value={dateStart}
            onChange={e => onDateStartChange(e.target.value)}
            placeholder="Data inicial"
          />
          <Input
            type="date"
            className="w-[140px]"
            value={dateEnd}
            onChange={e => onDateEndChange(e.target.value)}
            placeholder="Data final"
          />
        </div>
      </div>
    </div>
  )
}
