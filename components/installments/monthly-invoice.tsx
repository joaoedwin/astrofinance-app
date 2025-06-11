"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { 
  FileText, ChevronLeft, ChevronRight, Download, PieChart, 
  CreditCard, Filter, BarChart3, Calendar, CheckCircle, FileDown,
  Info
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { LineChart, BarChart } from "@/components/ui/charts"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { toast } from "../ui/use-toast"
import { SessionExpiredModal } from "@/components/auth/session-expired-modal"
import { Separator } from "@/components/ui/separator"
import { jsPDF } from "jspdf"
import { default as autoTable } from 'jspdf-autotable'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Componente do Modal de Carregamento do PDF
function PDFLoadingModal({ isOpen, progress }: { isOpen: boolean; progress: number }) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Gerando PDF</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Por favor, aguarde enquanto geramos seu arquivo...
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-6 p-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-purple-100">
            <FileDown className="w-8 h-8 text-purple-600" />
          </div>
          <div className="w-full space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-center text-muted-foreground">{progress}%</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Remover a declaração de módulo que não está funcionando
type AutoTableOptions = {
  startY: number;
  head: string[][];
  body: string[][];
  headStyles: {
    fillColor: number[];
    textColor: number[];
    fontSize: number;
    fontStyle: string;
  };
  bodyStyles: {
    fontSize: number;
  };
  columnStyles: {
    [key: string]: { cellWidth: number };
  };
  margin: {
    top: number;
    left: number;
    right: number;
  };
  didDrawPage?: (data: { pageNumber: number }) => void;
}

interface ExtendedJsPDF extends jsPDF {
  autoTable: (options: AutoTableOptions) => jsPDF;
}

// Tipos
interface InvoiceItem {
  id: string
  date: Date
  description: string
  category: string
  installmentNumber: number
  totalInstallments: number
  installmentAmount: number
  totalAmount: number
  creditCardId?: string | null
  creditCardName?: string | null
  creditCardColor?: string | null
  isPaid?: boolean
  isDemoData: boolean
  year?: number
  startDate?: string
}

interface CreditCard {
  id: string | number
  name: string
  color: string
  lastFourDigits?: string
}

export function MonthlyInvoice() {
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const now = new Date()
    return (now.getMonth() + 1).toString().padStart(2, "0")
  })
  const [currentYear, setCurrentYear] = useState<string>(() => {
    const now = new Date()
    return now.getFullYear().toString()
  })
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [minValue, setMinValue] = useState<string>("")
  const [maxValue, setMaxValue] = useState<string>("")
  const [showOnlyUnpaid, setShowOnlyUnpaid] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<"installments" | "transactions" | "all">("all")
  const [summary, setSummary] = useState<{
    totalExpenses: number,
    totalIncome: number,
    totalInstallments: number,
    balance: number
  }>({
    totalExpenses: 0,
    totalIncome: 0,
    totalInstallments: 0,
    balance: 0
  })
  const [showSessionExpired, setShowSessionExpired] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [pdfProgress, setPdfProgress] = useState(0)
  const [showPdfModal, setShowPdfModal] = useState(false)

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

  // Função helper para formatar valores
  const formatAmount = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return 0;
  }

  // Ajustar o range de anos para incluir o ano atual e mais 2 anos à frente
  const years = Array.from({ length: 3 }, (_, i) => {
    const year = new Date().getFullYear() + i
    return {
      value: year.toString(),
      label: year.toString()
    }
  })

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken")
      if (!refreshToken) {
        throw new Error("Refresh token não encontrado")
      }

      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        throw new Error("Falha ao atualizar o token")
      }

      const data = await response.json()
      localStorage.setItem("token", data.token)
      localStorage.setItem("refreshToken", data.refreshToken)
      return data.token
    } catch (error) {
      console.error("Erro ao atualizar token:", error)
      localStorage.removeItem("token")
      localStorage.removeItem("refreshToken")
      router.push("/login")
      throw error
    }
  }

  const handleApiError = async (error: any) => {
    if (error.message?.includes("jwt expired") || error.message?.includes("jwt malformed") || error.message?.includes("invalid token")) {
      try {
        const newToken = await refreshToken()
        return newToken
      } catch (refreshError) {
        // Mostrar modal de sessão expirada
        setShowSessionExpired(true)
        return null
      }
    }
    throw error
  }

  const fetchInvoiceItems = async () => {
    try {
      setLoading(true)
      let token = localStorage.getItem("token")
      if (!token) {
        setShowSessionExpired(true)
        return
      }

      let response = await fetch(`/api/invoice?month=${currentMonth}&year=${currentYear}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          token = await handleApiError(new Error("jwt expired"))
          if (!token) return
          
          response = await fetch(`/api/invoice?month=${currentMonth}&year=${currentYear}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        } else {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
      }

        const data = await response.json()
      
      // Verificar se temos dados
      let itemsToUse = data.invoiceItems || [];
      let transactionsToUse = data.transactions || [];
      const dataInfo = data.dataInfo || { 
        hasRealData: false, 
        totalDataCount: { installmentsCount: 0, transactionsCount: 0 },
        currentMonthCount: { installmentsCount: 0, transactionsCount: 0 }
      };
      
      // Se não tivermos dados para este mês/ano específico, mas existem dados no banco
      if ((itemsToUse.length === 0 && transactionsToUse.length === 0) && dataInfo.hasRealData) {
        console.log(`Não existem dados para ${months.find((m) => m.value === currentMonth)?.label}/${currentYear}, mas existem dados em outros meses.`);
        console.log(`Total de dados: ${dataInfo.totalDataCount.installmentsCount} parcelas e ${dataInfo.totalDataCount.transactionsCount} transações no banco.`);
      } 
      // Se não temos dados em nenhum lugar (nem neste mês, nem em outros)
      else if (itemsToUse.length === 0 && transactionsToUse.length === 0) {
        console.log("Não existem dados para este mês nem para outros meses. Usando dados de demonstração.");
      } 
      // Temos dados reais para este mês
      else {
        console.log(`Dados reais encontrados: ${itemsToUse.length} parcelas e ${transactionsToUse.length} transações para ${months.find((m) => m.value === currentMonth)?.label}/${currentYear}`);
      }
        
      // Adicionar status de pagamento padrão como falso
      const itemsWithPaymentStatus = itemsToUse.map((item: any) => ({
        ...item,
        isPaid: false,
        isDemoData: !dataInfo.hasRealData || (itemsToUse.length === 0 && transactionsToUse.length === 0)
      }));
      setInvoiceItems(itemsWithPaymentStatus);
      
      // Marcar transações de demonstração
      const transactionsWithDemoFlag = transactionsToUse.map((transaction: any) => ({
        ...transaction,
        isDemoData: !dataInfo.hasRealData || (itemsToUse.length === 0 && transactionsToUse.length === 0)
      }));
      
      // Extrair categorias únicas
      const uniqueCategories = Array.from(
        new Set([...itemsToUse, ...transactionsToUse].map((item: any) => item.category))
      ) as string[];
      setCategories(uniqueCategories);

      // Salvar transações e resumo
      setTransactions(transactionsWithDemoFlag);
      
      // Calcular totais para o resumo se não tiver vindo da API
      if (data.summary) {
        setSummary(data.summary);
      } else {
        // Calcular totais para o resumo
        const demoTotalExpenses = transactionsToUse
          .filter((t: any) => t.type === "expense")
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
        
        const demoTotalIncome = transactionsToUse
          .filter((t: any) => t.type === "income")
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
        
        const demoTotalInstallments = itemsToUse
          .reduce((sum: number, item: any) => sum + (item.installmentAmount || 0), 0);
          
        setSummary({
          totalExpenses: demoTotalExpenses,
          totalIncome: demoTotalIncome,
          totalInstallments: demoTotalInstallments,
          balance: demoTotalIncome - demoTotalExpenses - demoTotalInstallments
        });
        }
      } catch (error) {
        console.error("Erro ao buscar faturas:", error)
      if (error instanceof Error && error.message.includes("jwt expired")) {
        setShowSessionExpired(true)
      } else {
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar as faturas. Tente novamente mais tarde.",
          variant: "destructive",
        })
      }
      } finally {
        setLoading(false)
    }
  };

  const fetchCreditCards = async () => {
    try {
      let token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      let response = await fetch("/api/credit-cards", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          token = await handleApiError(new Error("jwt malformed"));
          if (!token) return;
          
          response = await fetch("/api/credit-cards", {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          });
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setCreditCards(data);
      }
    } catch (error) {
      console.error("Erro ao buscar cartões:", error);
      // Em caso de erro, usar dados de demonstração
      setCreditCards([
        {
          id: "1",
          name: "Nubank",
          color: "#7A1FA2",
          lastFourDigits: "1234"
        },
        {
          id: "2",
          name: "Itaú",
          color: "#EC7000",
          lastFourDigits: "5678"
        }
      ]);
    }
  };

  useEffect(() => {
    fetchInvoiceItems();
    fetchCreditCards();
  }, [currentMonth, currentYear]);

  // Filtrar itens da fatura e transações
  const filteredItems = (() => {
    // Iniciar com as transações ou parcelas de acordo com a aba ativa
    let items: any[] = [];
    
    if (activeTab === "all" || activeTab === "installments") {
      items = [...items, ...invoiceItems];
    }
    
    if (activeTab === "all" || activeTab === "transactions") {
      // Filtrar transações pelo mês E ano corretos
      items = [...items, ...transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() + 1 === parseInt(currentMonth) && 
               transactionDate.getFullYear() === parseInt(currentYear);
      })];
    }
    
    return items.filter((item: any) => {
      // Filtro por cartão (só aplicável para parcelas)
      if (selectedCardId && item.creditCardId !== selectedCardId && item.type !== "income" && item.type !== "expense") {
        return false;
      }
      
      // Filtro por texto
      if (searchTerm && !item.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filtro por categoria
      if (categoryFilter && item.category !== categoryFilter) {
        return false;
      }
      
      // Filtro por valor mínimo
      const itemAmount = formatAmount(item.installmentAmount || item.amount || 0);
      if (minValue && itemAmount < parseFloat(minValue)) {
        return false;
      }
      
      // Filtro por valor máximo
      if (maxValue && itemAmount > parseFloat(maxValue)) {
        return false;
      }
      
      // Filtro por status de pagamento (só aplicável para parcelas)
      if (showOnlyUnpaid && item.isPaid && item.type !== "income" && item.type !== "expense") {
        return false;
      }
      
      return true;
    }).sort((a: any, b: any) => {
      // Ordenar por data (mais recentes primeiro)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  })();

  // Calcular totais filtrados
  const totalFilteredExpenses = filteredItems
    .filter((item: any) => item.type === "expense")
    .reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
  
  const totalFilteredIncome = filteredItems
    .filter((item: any) => item.type === "income")
    .reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
  
  const totalFilteredInstallments = filteredItems
    .filter((item: any) => item.type === "installment")
    .reduce((sum: number, item: any) => sum + (item.installmentAmount || 0), 0);
  
  const totalMonthlyExpenses = totalFilteredInstallments + totalFilteredExpenses;
  
  const totalMonthlyIncome = totalFilteredIncome;

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

  const handleGeneratePDF = async () => {
    try {
      setIsGeneratingPDF(true)
      setShowPdfModal(true)
      setPdfProgress(0)
      
      // Simular progresso
      const progressInterval = setInterval(() => {
        setPdfProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)
      
      // Criar novo documento PDF
      const doc = new jsPDF()
      
      // Configurar fonte para suportar caracteres especiais
      doc.setFont("helvetica")
      
      // Adicionar título
      doc.setFontSize(20)
      doc.text(
        `Fatura - ${months.find((m) => m.value === currentMonth)?.label} ${currentYear}`,
        20,
        20
      )
      
      // Adicionar informações de totais
      doc.setFontSize(12)
      doc.setTextColor(100)
      
      const totalsY = 35
      doc.text("Resumo da Fatura:", 20, totalsY)
      
      // Linha separadora
      doc.setDrawColor(200)
      doc.line(20, totalsY + 5, 190, totalsY + 5)
      
      // Totais
      const totalsStartY = totalsY + 15
      doc.setTextColor(0)
      doc.text("Despesas:", 20, totalsStartY)
      doc.text(formatCurrency(summary.totalExpenses), 150, totalsStartY, { align: "right" })
      
      doc.text("Parcelamentos:", 20, totalsStartY + 10)
      doc.text(formatCurrency(summary.totalInstallments), 150, totalsStartY + 10, { align: "right" })
      
      doc.text("Receitas:", 20, totalsStartY + 20)
      doc.text(formatCurrency(summary.totalIncome), 150, totalsStartY + 20, { align: "right" })
      
      // Linha separadora
      doc.line(20, totalsStartY + 25, 190, totalsStartY + 25)
      
      // Total geral
      doc.setFont("helvetica", "bold")
      doc.text("Total:", 20, totalsStartY + 35)
      doc.text(
        formatCurrency(summary.totalIncome - (summary.totalExpenses + summary.totalInstallments)),
        150,
        totalsStartY + 35,
        { align: "right" }
      )
      doc.setFont("helvetica", "normal")
      
      // Adicionar tabela de transações
      const tableStartY = totalsStartY + 50
      
      // Preparar dados para a tabela
      const tableData = filteredItems.map(item => [
        new Date(item.date).toLocaleDateString("pt-BR"),
        item.description,
        item.category,
        item.type === "installment" 
          ? `Parcelamento (${item.installmentNumber}/${item.totalInstallments})`
          : item.type === "expense"
          ? "Despesa"
          : "Receita",
        formatCurrency(item.installmentAmount || item.amount || 0),
        item.creditCardName || "-"
      ])

      autoTable(doc, {
        startY: tableStartY,
        head: [["Data", "Descrição", "Categoria", "Tipo", "Valor", "Cartão"]],
        body: tableData,
        headStyles: {
          fillColor: [75, 75, 75],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: "bold"
        },
        bodyStyles: {
          fontSize: 9
        },
        columnStyles: {
          0: { cellWidth: 23 },
          1: { cellWidth: 40 },
          2: { cellWidth: 30 },
          3: { cellWidth: 35 },
          4: { cellWidth: 23 },
          5: { cellWidth: 35 }
        },
        margin: { top: 20, left: 15, right: 15 },
        didDrawPage: (data) => {
          // Adicionar rodapé
          const pageSize = doc.internal.pageSize
          const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight()
          doc.setFontSize(8)
          doc.setTextColor(150)
          doc.text(
            `Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
            20,
            pageHeight - 10
          )
          doc.text(
            `Página ${data.pageNumber}`,
            190,
            pageHeight - 10,
            { align: "right" }
          )
        }
      })
      
      // Adicionar seção de gastos por categoria
      const categoryData = Object.entries(
        filteredItems
          .filter(item => item.type !== "income")
          .reduce((acc: any, item: any) => {
            const amount = item.installmentAmount || item.amount || 0
            if (!acc[item.category]) {
              acc[item.category] = 0
            }
            acc[item.category] += amount
            return acc
          }, {})
      )
        .sort(([, a]: any, [, b]: any) => b - a)
        .map(([category, total]: any) => [
          category,
          formatCurrency(total)
        ])
      
      if (categoryData.length > 0) {
        doc.addPage()
        doc.setFontSize(16)
        doc.text("Gastos por Categoria", 20, 20)
        
        autoTable(doc, {
          startY: 30,
          head: [["Categoria", "Total"]],
          body: categoryData,
          headStyles: {
            fillColor: [75, 75, 75],
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: "bold"
          },
          bodyStyles: {
            fontSize: 9
          },
          columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 50 }
          },
          margin: { top: 20, left: 20, right: 20 }
        })
      }
      
      // Quando o PDF estiver pronto
      setPdfProgress(100)
      setTimeout(() => {
        // Salvar o PDF
        doc.save(`fatura-${currentMonth}-${currentYear}.pdf`)
        
        clearInterval(progressInterval)
        setShowPdfModal(false)
        
        toast({
          title: "PDF gerado com sucesso!",
          description: "O arquivo foi baixado para o seu computador.",
          duration: 3000,
        })
      }, 500)
      
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o arquivo PDF. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const resetFilters = () => {
    setSelectedCardId(null)
    setSearchTerm("")
    setCategoryFilter(null)
    setMinValue("")
    setMaxValue("")
  }

  // Função para filtrar e calcular a parcela do mês selecionado
  function getInstallmentsForMonth() {
    // Remover duplicatas baseado no ID da parcela
    const uniqueItems = Array.from(new Map(invoiceItems.map(item => [item.id, item])).values());
    
    return uniqueItems
      .map((installment) => {
        try {
          const startDate = new Date(installment.startDate || installment.date);
          
          // Normalizar as datas para o primeiro dia do mês para evitar problemas com dias diferentes
          const startDateNormalized = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
          const targetDateNormalized = new Date(Number(currentYear), Number(currentMonth) - 1, 1);
          
          // Calcular o número total de meses entre as datas
          const monthsDiff = (targetDateNormalized.getFullYear() - startDateNormalized.getFullYear()) * 12 
            + (targetDateNormalized.getMonth() - startDateNormalized.getMonth());
          
          // Calcular o número da parcela (1-based)
          const currentInstallmentNumber = monthsDiff + 1;
          
          // Verificar se esta parcela deve ser mostrada neste mês
          if (currentInstallmentNumber < 1 || currentInstallmentNumber > installment.totalInstallments) {
            return null;
          }
          
          // Retornar a parcela com o número correto
          return {
            ...installment,
            installmentNumber: currentInstallmentNumber,
            year: targetDateNormalized.getFullYear(),
            month: targetDateNormalized.getMonth() + 1,
            startDate: startDate.toISOString()
          };
        } catch (error) {
          console.error("Erro ao processar parcela:", error, installment);
          return null;
        }
      })
      .filter(Boolean);
  }

  return (
    <>
      <PDFLoadingModal isOpen={showPdfModal} progress={pdfProgress} />
      {showSessionExpired && (
        <SessionExpiredModal 
          isOpen={showSessionExpired} 
          onClose={() => setShowSessionExpired(false)} 
        />
      )}
      
      <Card className="shadow-sm">
        <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={previousMonth} 
                className="h-8 sm:h-10 w-8 sm:w-10 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Mês anterior</span>
              </Button>
              
              <div className="flex gap-2">
                <Select value={currentMonth} onValueChange={setCurrentMonth}>
                  <SelectTrigger className="w-[120px] sm:w-[140px] h-8 sm:h-10 text-xs sm:text-sm">
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
                
                <Select value={currentYear} onValueChange={setCurrentYear}>
                  <SelectTrigger className="w-[90px] sm:w-[110px] h-8 sm:h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year.value} value={year.value} className="text-xs sm:text-sm">
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={nextMonth} 
                className="h-8 sm:h-10 w-8 sm:w-10 p-0"
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Próximo mês</span>
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGeneratePDF} 
                disabled={isGeneratingPDF} 
                className="h-8 sm:h-10 text-xs sm:text-sm gap-1 sm:gap-2"
              >
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Exportar PDF</span>
                <span className="xs:hidden">PDF</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <div className="space-y-8">
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="md:col-span-2 shadow-sm">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle className="text-2xl font-bold">
                        Fatura - {months.find((m) => m.value === currentMonth)?.label} {currentYear}
                      </CardTitle>
                      <CardDescription className="text-base mt-1">
                        Visão geral de todas as transações e parcelas do mês
                      </CardDescription>
                    </div>
                  </div>
                </div>
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
                          <TableHead className="font-medium">Data</TableHead>
                          <TableHead className="font-medium">Descrição</TableHead>
                          <TableHead className="font-medium">Categoria</TableHead>
                          <TableHead className="font-medium">Tipo</TableHead>
                          <TableHead className="font-medium">Valor</TableHead>
                          <TableHead className="font-medium">Cartão</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              Nenhum registro encontrado para este mês
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredItems.map((item: any) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                {new Date(item.date).toLocaleDateString("pt-BR")}
                              </TableCell>
                              <TableCell className="font-medium">
                                {item.description}
                              </TableCell>
                              <TableCell>{item.category}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {item.type === "installment" && (
                                    <>
                                      <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200">
                                        Parcelamento
                                      </div>
                                      <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200">
                                        {item.installmentNumber}/{item.totalInstallments}
                                      </div>
                                    </>
                                  )}
                                  {item.type === "expense" && (
                                    <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-red-50 text-red-700 hover:bg-red-100 border-red-200">
                                      Despesa
                                    </div>
                                  )}
                                  {item.type === "income" && (
                                    <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
                                      Receita
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{formatCurrency(item.installmentAmount || item.amount || 0)}</TableCell>
                              <TableCell>
                                {item.creditCardName ? (
                                  <span className="flex items-center gap-2">
                                    <span 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: item.creditCardColor || '#888' }} 
                                    />
                                    {item.creditCardName}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
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

            {/* Card de Totais */}
            <div className="space-y-8">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">
                    Total da Fatura - {months.find((m) => m.value === currentMonth)?.label}/{currentYear}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Despesas:</span>
                      <span className="font-medium text-red-600">{formatCurrency(summary.totalExpenses)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Parcelamentos:</span>
                      <span className="font-medium text-purple-600">{formatCurrency(summary.totalInstallments)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Receitas:</span>
                      <span className="font-medium text-green-600">{formatCurrency(summary.totalIncome)}</span>
                    </div>
                    <Separator className="my-4" />
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-lg">
                        {formatCurrency(summary.totalIncome - (summary.totalExpenses + summary.totalInstallments))}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">
                    Gastos por Categoria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(filteredItems
                      .filter(item => item.type !== "income")
                      .reduce((acc: any, item: any) => {
                        const amount = item.installmentAmount || item.amount || 0;
                        if (!acc[item.category]) {
                          acc[item.category] = 0;
                        }
                        acc[item.category] += amount;
                        return acc;
                      }, {}))
                      .sort(([, a]: any, [, b]: any) => b - a)
                      .map(([category, total]: any) => (
                        <div key={category} className="flex justify-between items-center">
                          <span className="text-muted-foreground">{category}:</span>
                          <span className="font-medium">{formatCurrency(total)}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Card>
    </>
  )
}
