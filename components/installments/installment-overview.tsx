"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"
import { PlusCircle, Pencil, Trash2, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react"
import { NewInstallmentModal } from "@/components/installments/new-installment-modal"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EditInstallmentModal } from "@/components/installments/edit-installment-modal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCardManager } from "@/components/credit-card/credit-card-manager"
import { CreditCardModal } from "@/components/credit-card/credit-card-modal"

interface BaseInstallment {
  id: string
  description: string
  category_id: string
  category: string
  totalAmount: number
  installmentAmount: number
  totalInstallments: number
  paidInstallments: number
  startDate: string
  nextPaymentDate: string
  creditCardId?: string | null
  creditCardName?: string | null
  creditCardColor?: string | null
}

interface InstallmentWithStatus extends BaseInstallment {
  installmentNumber: number
  status: 'Pago' | 'Pendente' | 'Futuro'
}

type Installment = BaseInstallment | InstallmentWithStatus

export function InstallmentOverview() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedInstallment, setSelectedInstallment] = useState<BaseInstallment | null>(null)
  const [installments, setInstallments] = useState<BaseInstallment[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const now = new Date()
    return (now.getMonth() + 1).toString().padStart(2, "0")
  })
  const [currentYear, setCurrentYear] = useState<string>(() => {
    return new Date().getFullYear().toString()
  })

  const months = [
    { value: "01", label: "Janeiro" },
    { value: "02", label: "Fevereiro" },
    { value: "03", label: "Março" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Maio" },
    { value: "06", label: "Junho" },
    { value: "07", label: "Julho" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ]
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString())

  const previousMonth = () => {
    let month = Number.parseInt(currentMonth)
    let year = Number.parseInt(currentYear)
    if (month === 1) {
      month = 12
      year -= 1
    } else {
      month -= 1
    }
    setCurrentMonth(month.toString().padStart(2, "0"))
    setCurrentYear(year.toString())
  }
  const nextMonth = () => {
    let month = Number.parseInt(currentMonth)
    let year = Number.parseInt(currentYear)
    if (month === 12) {
      month = 1
      year += 1
    } else {
      month += 1
    }
    setCurrentMonth(month.toString().padStart(2, "0"))
    setCurrentYear(year.toString())
  }

  useEffect(() => {
    const fetchInstallments = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await fetch("/api/installments", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        const data = await response.json()
        if (data.installments) {
          setInstallments(data.installments)
        }
      } catch (error) {
        console.error("Erro ao buscar parcelamentos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchInstallments()
  }, [])

  // Função para recarregar os parcelamentos após qualquer operação
  const reloadInstallments = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/installments", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.installments) {
        setInstallments(data.installments)
      }
    } catch (error) {
      console.error("Erro ao buscar parcelamentos:", error)
    } finally {
      setLoading(false)
    }
  }

  // Função para filtrar e calcular a parcela do mês selecionado
  function getInstallmentsForMonth(): InstallmentWithStatus[] {
    return installments
      .map((installment): InstallmentWithStatus | null => {
        const start = new Date(installment.startDate)
        const startMonth = start.getMonth() + 1
        const startYear = start.getFullYear()
        const total = installment.totalInstallments
        const monthsDiff = (Number(currentYear) - startYear) * 12 + (Number(currentMonth) - startMonth)
        
        if (monthsDiff < 0 || monthsDiff >= total) return null
        
        const selectedDate = new Date(Number(currentYear), Number(currentMonth) - 1)
        const installmentDate = new Date(startYear, startMonth - 1 + monthsDiff)
        let status: 'Pago' | 'Pendente' | 'Futuro' = 'Pendente'
        
        if (installmentDate < selectedDate) status = 'Pago'
        else if (installmentDate > selectedDate) status = 'Futuro'
        
        return {
          ...installment,
          installmentNumber: monthsDiff + 1,
          status,
        }
      })
      .filter((inst): inst is InstallmentWithStatus => inst !== null)
  }

  const filteredInstallments = getInstallmentsForMonth()
  const totalMonthlyInstallments = filteredInstallments.reduce((total, installment) => total + installment.installmentAmount, 0)

  const addInstallment = async (newInstallment: BaseInstallment) => {
    setIsModalOpen(false)
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Token não encontrado")
      
      await fetch("/api/installments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newInstallment,
          categoryId: newInstallment.category_id
        })
      })
      await reloadInstallments()
    } catch (error) {
      console.error("Erro ao criar parcelamento:", error)
    } finally {
      setLoading(false)
    }
  }

  const editInstallment = async (updatedInstallment: BaseInstallment) => {
    setIsEditModalOpen(false)
    setSelectedInstallment(null)
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Token não encontrado")
      
      await fetch("/api/installments", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...updatedInstallment,
          categoryId: updatedInstallment.category_id
        })
      })
      await reloadInstallments()
    } catch (error) {
      console.error("Erro ao editar parcelamento:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteInstallment = async () => {
    if (!selectedInstallment) return
    setIsDeleteDialogOpen(false)
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Token não encontrado")
      
      await fetch("/api/installments", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id: selectedInstallment.id })
      })
      setSelectedInstallment(null)
      await reloadInstallments()
    } catch (error) {
      console.error("Erro ao excluir parcelamento:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (installment: BaseInstallment) => {
    setSelectedInstallment(installment)
    setIsEditModalOpen(true)
  }

  const handleDelete = (installment: BaseInstallment) => {
    setSelectedInstallment(installment)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-sm">
        <CardHeader className="pb-6">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={previousMonth} className="h-8 sm:h-10 px-2">
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Mês anterior</span>
              </Button>
              
              <Select
                value={currentMonth}
                onValueChange={setCurrentMonth}
              >
                <SelectTrigger className="w-[130px] h-8 sm:h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value} className="text-xs sm:text-sm">
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={currentYear}
                onValueChange={setCurrentYear}
              >
                <SelectTrigger className="w-[100px] h-8 sm:h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year} className="text-xs sm:text-sm">
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button size="sm" variant="outline" onClick={nextMonth} className="h-8 sm:h-10 px-2">
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Próximo mês</span>
              </Button>
            </div>
            
            <div className="ml-auto flex items-center gap-2">
              <CreditCardModal buttonProps={{ 
                size: "sm", 
                className: "h-8 sm:h-10 text-xs sm:text-sm px-2 sm:px-4" 
              }} />
              
              <Button
                onClick={() => setIsModalOpen(true)}
                className="h-8 sm:h-10 text-xs sm:text-sm px-2 sm:px-4"
              >
                <PlusCircle className="h-3.5 w-3.5 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Novo Parcelamento</span>
                <span className="xs:hidden">Novo</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Mensal em Parcelas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalMonthlyInstallments)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Valor total de parcelas para este mês</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Parcelamentos Ativos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredInstallments.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total de compras parceladas ativas neste mês</p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-bold">Parcelamentos do Mês</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium">Descrição</TableHead>
                    <TableHead className="font-medium">Categoria</TableHead>
                    <TableHead className="w-[200px] font-medium">Progresso</TableHead>
                    <TableHead className="font-medium">Parcela</TableHead>
                    <TableHead className="font-medium">Cartão</TableHead>
                    <TableHead className="font-medium">Valor Parcela</TableHead>
                    <TableHead className="font-medium">Valor Total</TableHead>
                    <TableHead className="font-medium">Status</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInstallments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhum parcelamento encontrado para este mês
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInstallments.filter(Boolean).map((installment) => (
                      <TableRow key={installment.id}>
                        <TableCell className="font-medium">{installment.description}</TableCell>
                        <TableCell>{installment.category}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <Progress
                              value={(installment.installmentNumber / installment.totalInstallments) * 100}
                              className="h-2"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>
                                {installment.installmentNumber} de {installment.totalInstallments} parcelas
                              </span>
                              <span>
                                {Math.round((installment.installmentNumber / installment.totalInstallments) * 100)}%
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {installment.installmentNumber}/{installment.totalInstallments}
                        </TableCell>
                        <TableCell>
                          {installment.creditCardId && installment.creditCardName ? (
                            <span className="flex items-center gap-2">
                              <span 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: installment.creditCardColor || undefined }} 
                              />
                              {installment.creditCardName}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{formatCurrency(installment.installmentAmount)}</TableCell>
                        <TableCell>{formatCurrency(installment.totalAmount)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              installment.status === 'Pago'
                                ? 'default'
                                : installment.status === 'Futuro'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {installment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Abrir menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(installment)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(installment)} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <NewInstallmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={addInstallment} />

      {selectedInstallment && (
        <EditInstallmentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedInstallment(null)
          }}
          onSave={editInstallment}
          installment={selectedInstallment}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este parcelamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteInstallment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
