"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonthlyInvoice = MonthlyInvoice;
const react_1 = require("react");
const card_1 = require("@/components/ui/card");
const table_1 = require("@/components/ui/table");
const button_1 = require("@/components/ui/button");
const utils_1 = require("@/lib/utils");
const lucide_react_1 = require("lucide-react");
const select_1 = require("@/components/ui/select");
const navigation_1 = require("next/navigation");
const use_toast_1 = require("../ui/use-toast");
const separator_1 = require("@/components/ui/separator");
const jspdf_1 = require("jspdf");
const jspdf_autotable_1 = __importDefault(require("jspdf-autotable"));
const dialog_1 = require("@/components/ui/dialog");
const progress_1 = require("@/components/ui/progress");
// Componente do Modal de Carregamento do PDF
function PDFLoadingModal({ isOpen, progress }) {
    return (<dialog_1.Dialog open={isOpen}>
      <dialog_1.DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center justify-center space-y-6 p-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-purple-100">
            <lucide_react_1.FileDown className="w-8 h-8 text-purple-600"/>
          </div>
          <div className="space-y-2 text-center">
            <h3 className="text-lg font-semibold">Gerando PDF</h3>
            <p className="text-sm text-muted-foreground">
              Por favor, aguarde enquanto geramos seu arquivo...
            </p>
          </div>
          <div className="w-full space-y-2">
            <progress_1.Progress value={progress} className="w-full"/>
            <p className="text-sm text-center text-muted-foreground">{progress}%</p>
          </div>
        </div>
      </dialog_1.DialogContent>
    </dialog_1.Dialog>);
}
function MonthlyInvoice() {
    const router = (0, navigation_1.useRouter)();
    const [currentMonth, setCurrentMonth] = (0, react_1.useState)(() => {
        const now = new Date();
        return (now.getMonth() + 1).toString().padStart(2, "0");
    });
    const [currentYear, setCurrentYear] = (0, react_1.useState)(() => {
        const now = new Date();
        return now.getFullYear().toString();
    });
    const [invoiceItems, setInvoiceItems] = (0, react_1.useState)([]);
    const [transactions, setTransactions] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [creditCards, setCreditCards] = (0, react_1.useState)([]);
    const [selectedCardId, setSelectedCardId] = (0, react_1.useState)(null);
    const [searchTerm, setSearchTerm] = (0, react_1.useState)("");
    const [categoryFilter, setCategoryFilter] = (0, react_1.useState)(null);
    const [minValue, setMinValue] = (0, react_1.useState)("");
    const [maxValue, setMaxValue] = (0, react_1.useState)("");
    const [showOnlyUnpaid, setShowOnlyUnpaid] = (0, react_1.useState)(false);
    const [categories, setCategories] = (0, react_1.useState)([]);
    const [activeTab, setActiveTab] = (0, react_1.useState)("all");
    const [summary, setSummary] = (0, react_1.useState)({
        totalExpenses: 0,
        totalIncome: 0,
        totalInstallments: 0,
        balance: 0
    });
    const [showSessionExpired, setShowSessionExpired] = (0, react_1.useState)(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = (0, react_1.useState)(false);
    const [pdfProgress, setPdfProgress] = (0, react_1.useState)(0);
    const [showPdfModal, setShowPdfModal] = (0, react_1.useState)(false);
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
    ];
    // Função helper para formatar valores
    const formatAmount = (value) => {
        if (typeof value === 'number')
            return value;
        if (typeof value === 'string')
            return parseFloat(value) || 0;
        return 0;
    };
    // Ajustar o range de anos para incluir o ano atual e mais 2 anos à frente
    const years = Array.from({ length: 3 }, (_, i) => {
        const year = new Date().getFullYear() + i;
        return {
            value: year.toString(),
            label: year.toString()
        };
    });
    const refreshToken = async () => {
        try {
            const refreshToken = localStorage.getItem("refreshToken");
            if (!refreshToken) {
                throw new Error("Refresh token não encontrado");
            }
            const response = await fetch("/api/auth/refresh", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ refreshToken }),
            });
            if (!response.ok) {
                throw new Error("Falha ao atualizar o token");
            }
            const data = await response.json();
            localStorage.setItem("token", data.token);
            localStorage.setItem("refreshToken", data.refreshToken);
            return data.token;
        }
        catch (error) {
            console.error("Erro ao atualizar token:", error);
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            router.push("/login");
            throw error;
        }
    };
    const handleApiError = async (error) => {
        if (error.message?.includes("jwt expired") || error.message?.includes("jwt malformed") || error.message?.includes("invalid token")) {
            try {
                const newToken = await refreshToken();
                return newToken;
            }
            catch (refreshError) {
                // Mostrar modal de sessão expirada
                setShowSessionExpired(true);
                return null;
            }
        }
        throw error;
    };
    const fetchInvoiceItems = async () => {
        try {
            setLoading(true);
            let token = localStorage.getItem("token");
            if (!token) {
                setShowSessionExpired(true);
                return;
            }
            let response = await fetch(`/api/invoice?month=${currentMonth}&year=${currentYear}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!response.ok) {
                if (response.status === 401) {
                    token = await handleApiError(new Error("jwt expired"));
                    if (!token)
                        return;
                    response = await fetch(`/api/invoice?month=${currentMonth}&year=${currentYear}`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                }
                else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }
            const data = await response.json();
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
            const itemsWithPaymentStatus = itemsToUse.map((item) => ({
                ...item,
                isPaid: false,
                isDemoData: !dataInfo.hasRealData || (itemsToUse.length === 0 && transactionsToUse.length === 0)
            }));
            setInvoiceItems(itemsWithPaymentStatus);
            // Marcar transações de demonstração
            const transactionsWithDemoFlag = transactionsToUse.map((transaction) => ({
                ...transaction,
                isDemoData: !dataInfo.hasRealData || (itemsToUse.length === 0 && transactionsToUse.length === 0)
            }));
            // Extrair categorias únicas
            const uniqueCategories = Array.from(new Set([...itemsToUse, ...transactionsToUse].map((item) => item.category)));
            setCategories(uniqueCategories);
            // Salvar transações e resumo
            setTransactions(transactionsWithDemoFlag);
            // Calcular totais para o resumo se não tiver vindo da API
            if (data.summary) {
                setSummary(data.summary);
            }
            else {
                // Calcular totais para o resumo
                const demoTotalExpenses = transactionsToUse
                    .filter((t) => t.type === "expense")
                    .reduce((sum, t) => sum + (t.amount || 0), 0);
                const demoTotalIncome = transactionsToUse
                    .filter((t) => t.type === "income")
                    .reduce((sum, t) => sum + (t.amount || 0), 0);
                const demoTotalInstallments = itemsToUse
                    .reduce((sum, item) => sum + (item.installmentAmount || 0), 0);
                setSummary({
                    totalExpenses: demoTotalExpenses,
                    totalIncome: demoTotalIncome,
                    totalInstallments: demoTotalInstallments,
                    balance: demoTotalIncome - demoTotalExpenses - demoTotalInstallments
                });
            }
        }
        catch (error) {
            console.error("Erro ao buscar faturas:", error);
            if (error instanceof Error && error.message.includes("jwt expired")) {
                setShowSessionExpired(true);
            }
            else {
                (0, use_toast_1.toast)({
                    title: "Erro ao carregar dados",
                    description: "Não foi possível carregar as faturas. Tente novamente mais tarde.",
                    variant: "destructive",
                });
            }
        }
        finally {
            setLoading(false);
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
                    if (!token)
                        return;
                    response = await fetch("/api/credit-cards", {
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json"
                        }
                    });
                }
                else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }
            const data = await response.json();
            if (Array.isArray(data)) {
                setCreditCards(data);
            }
        }
        catch (error) {
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
    (0, react_1.useEffect)(() => {
        fetchInvoiceItems();
        fetchCreditCards();
    }, [currentMonth, currentYear]);
    // Filtrar itens da fatura e transações
    const filteredItems = (() => {
        // Iniciar com as transações ou parcelas de acordo com a aba ativa
        let items = [];
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
        return items.filter((item) => {
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
        }).sort((a, b) => {
            // Ordenar por data (mais recentes primeiro)
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
    })();
    // Calcular totais filtrados
    const totalFilteredExpenses = filteredItems
        .filter((item) => item.type === "expense")
        .reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalFilteredIncome = filteredItems
        .filter((item) => item.type === "income")
        .reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalFilteredInstallments = filteredItems
        .filter((item) => item.type === "installment")
        .reduce((sum, item) => sum + (item.installmentAmount || 0), 0);
    const totalMonthlyExpenses = totalFilteredInstallments + totalFilteredExpenses;
    const totalMonthlyIncome = totalFilteredIncome;
    const previousMonth = () => {
        let month = Number.parseInt(currentMonth);
        let year = Number.parseInt(currentYear);
        if (month === 1) {
            month = 12;
            year -= 1;
        }
        else {
            month -= 1;
        }
        setCurrentMonth(month.toString().padStart(2, "0"));
        setCurrentYear(year.toString());
    };
    const nextMonth = () => {
        let month = Number.parseInt(currentMonth);
        let year = Number.parseInt(currentYear);
        if (month === 12) {
            month = 1;
            year += 1;
        }
        else {
            month += 1;
        }
        setCurrentMonth(month.toString().padStart(2, "0"));
        setCurrentYear(year.toString());
    };
    const handleGeneratePDF = async () => {
        try {
            setIsGeneratingPDF(true);
            setShowPdfModal(true);
            setPdfProgress(0);
            // Simular progresso
            const progressInterval = setInterval(() => {
                setPdfProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);
            // Criar novo documento PDF
            const doc = new jspdf_1.jsPDF();
            // Configurar fonte para suportar caracteres especiais
            doc.setFont("helvetica");
            // Adicionar título
            doc.setFontSize(20);
            doc.text(`Fatura - ${months.find((m) => m.value === currentMonth)?.label} ${currentYear}`, 20, 20);
            // Adicionar informações de totais
            doc.setFontSize(12);
            doc.setTextColor(100);
            const totalsY = 35;
            doc.text("Resumo da Fatura:", 20, totalsY);
            // Linha separadora
            doc.setDrawColor(200);
            doc.line(20, totalsY + 5, 190, totalsY + 5);
            // Totais
            const totalsStartY = totalsY + 15;
            doc.setTextColor(0);
            doc.text("Despesas:", 20, totalsStartY);
            doc.text((0, utils_1.formatCurrency)(summary.totalExpenses), 150, totalsStartY, { align: "right" });
            doc.text("Parcelamentos:", 20, totalsStartY + 10);
            doc.text((0, utils_1.formatCurrency)(summary.totalInstallments), 150, totalsStartY + 10, { align: "right" });
            doc.text("Receitas:", 20, totalsStartY + 20);
            doc.text((0, utils_1.formatCurrency)(summary.totalIncome), 150, totalsStartY + 20, { align: "right" });
            // Linha separadora
            doc.line(20, totalsStartY + 25, 190, totalsStartY + 25);
            // Total geral
            doc.setFont("helvetica", "bold");
            doc.text("Total:", 20, totalsStartY + 35);
            doc.text((0, utils_1.formatCurrency)(summary.totalIncome - (summary.totalExpenses + summary.totalInstallments)), 150, totalsStartY + 35, { align: "right" });
            doc.setFont("helvetica", "normal");
            // Adicionar tabela de transações
            const tableStartY = totalsStartY + 50;
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
                (0, utils_1.formatCurrency)(item.installmentAmount || item.amount || 0),
                item.creditCardName || "-"
            ]);
            (0, jspdf_autotable_1.default)(doc, {
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
                    const pageSize = doc.internal.pageSize;
                    const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                    doc.setFontSize(8);
                    doc.setTextColor(150);
                    doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, 20, pageHeight - 10);
                    doc.text(`Página ${data.pageNumber}`, 190, pageHeight - 10, { align: "right" });
                }
            });
            // Adicionar seção de gastos por categoria
            const categoryData = Object.entries(filteredItems
                .filter(item => item.type !== "income")
                .reduce((acc, item) => {
                const amount = item.installmentAmount || item.amount || 0;
                if (!acc[item.category]) {
                    acc[item.category] = 0;
                }
                acc[item.category] += amount;
                return acc;
            }, {}))
                .sort(([, a], [, b]) => b - a)
                .map(([category, total]) => [
                category,
                (0, utils_1.formatCurrency)(total)
            ]);
            if (categoryData.length > 0) {
                doc.addPage();
                doc.setFontSize(16);
                doc.text("Gastos por Categoria", 20, 20);
                (0, jspdf_autotable_1.default)(doc, {
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
                });
            }
            // Quando o PDF estiver pronto
            setPdfProgress(100);
            setTimeout(() => {
                // Salvar o PDF
                doc.save(`fatura-${currentMonth}-${currentYear}.pdf`);
                clearInterval(progressInterval);
                setShowPdfModal(false);
                (0, use_toast_1.toast)({
                    title: "PDF gerado com sucesso!",
                    description: "O arquivo foi baixado para o seu computador.",
                    duration: 3000,
                });
            }, 500);
        }
        catch (error) {
            console.error("Erro ao gerar PDF:", error);
            (0, use_toast_1.toast)({
                title: "Erro ao gerar PDF",
                description: "Não foi possível gerar o arquivo PDF. Tente novamente.",
                variant: "destructive",
            });
        }
        finally {
            setIsGeneratingPDF(false);
        }
    };
    const resetFilters = () => {
        setSelectedCardId(null);
        setSearchTerm("");
        setCategoryFilter(null);
        setMinValue("");
        setMaxValue("");
    };
    const markAllAsPaid = () => {
        setInvoiceItems(items => items.map(item => ({ ...item, isPaid: true })));
    };
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
            }
            catch (error) {
                console.error("Erro ao processar parcela:", error, installment);
                return null;
            }
        })
            .filter(Boolean);
    }
    return (<div className="space-y-8">
      <PDFLoadingModal isOpen={showPdfModal} progress={pdfProgress}/>
      <div className="space-y-8">
        <card_1.Card className="shadow-sm">
          <card_1.CardHeader className="pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-center gap-4">
                <button_1.Button variant="outline" size="icon" onClick={previousMonth} className="h-10 w-10">
                  <lucide_react_1.ChevronLeft className="h-5 w-5"/>
                </button_1.Button>
                <div className="flex items-center gap-3">
                  <select_1.Select value={currentMonth} onValueChange={setCurrentMonth}>
                    <select_1.SelectTrigger className="w-[160px] h-10">
                      <select_1.SelectValue placeholder="Mês"/>
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      {months.map((month) => (<select_1.SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </select_1.SelectItem>))}
                    </select_1.SelectContent>
                  </select_1.Select>
                  <select_1.Select value={currentYear} onValueChange={setCurrentYear}>
                    <select_1.SelectTrigger className="w-[120px] h-10">
                      <select_1.SelectValue placeholder="Ano"/>
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      {years.map((year) => (<select_1.SelectItem key={year.value} value={year.value}>
                          {year.label}
                        </select_1.SelectItem>))}
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>
                <button_1.Button variant="outline" size="icon" onClick={nextMonth} className="h-10 w-10">
                  <lucide_react_1.ChevronRight className="h-5 w-5"/>
                </button_1.Button>
              </div>
              <div className="flex gap-2">
                <button_1.Button variant="outline" onClick={handleGeneratePDF} className="h-10" disabled={isGeneratingPDF}>
                  {isGeneratingPDF ? (<>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"/>
                      Gerando PDF...
                    </>) : (<>
                      <lucide_react_1.Download className="mr-2 h-5 w-5"/>
                      Gerar PDF
                    </>)}
                </button_1.Button>
              </div>
            </div>
          </card_1.CardHeader>
        </card_1.Card>

        <div className="grid gap-8 md:grid-cols-3">
          <card_1.Card className="md:col-span-2 shadow-sm">
            <card_1.CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <lucide_react_1.FileText className="h-6 w-6 text-primary"/>
                  <div>
                    <card_1.CardTitle className="text-2xl font-bold">
                      Fatura - {months.find((m) => m.value === currentMonth)?.label} {currentYear}
                    </card_1.CardTitle>
                    <card_1.CardDescription className="text-base mt-1">
                      Visão geral de todas as transações e parcelas do mês
                    </card_1.CardDescription>
                  </div>
                </div>
              </div>
            </card_1.CardHeader>
            <card_1.CardContent>
              {loading ? (<div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>) : (<div className="rounded-md border overflow-x-auto">
                  <table_1.Table>
                    <table_1.TableHeader>
                      <table_1.TableRow>
                        <table_1.TableHead className="font-medium">Data</table_1.TableHead>
                        <table_1.TableHead className="font-medium">Descrição</table_1.TableHead>
                        <table_1.TableHead className="font-medium">Categoria</table_1.TableHead>
                        <table_1.TableHead className="font-medium">Tipo</table_1.TableHead>
                        <table_1.TableHead className="font-medium">Valor</table_1.TableHead>
                        <table_1.TableHead className="font-medium">Cartão</table_1.TableHead>
                      </table_1.TableRow>
                    </table_1.TableHeader>
                    <table_1.TableBody>
                      {filteredItems.length === 0 ? (<table_1.TableRow>
                          <table_1.TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Nenhum registro encontrado para este mês
                          </table_1.TableCell>
                        </table_1.TableRow>) : (filteredItems.map((item) => (<table_1.TableRow key={item.id}>
                            <table_1.TableCell>
                              {new Date(item.date).toLocaleDateString("pt-BR")}
                            </table_1.TableCell>
                            <table_1.TableCell className="font-medium">
                              {item.description}
                            </table_1.TableCell>
                            <table_1.TableCell>{item.category}</table_1.TableCell>
                            <table_1.TableCell>
                              <div className="flex items-center gap-2">
                                {item.type === "installment" && (<>
                                    <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200">
                                      Parcelamento
                                    </div>
                                    <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200">
                                      {item.installmentNumber}/{item.totalInstallments}
                                    </div>
                                  </>)}
                                {item.type === "expense" && (<div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-red-50 text-red-700 hover:bg-red-100 border-red-200">
                                    Despesa
                                  </div>)}
                                {item.type === "income" && (<div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
                                    Receita
                                  </div>)}
                              </div>
                            </table_1.TableCell>
                            <table_1.TableCell>{(0, utils_1.formatCurrency)(item.installmentAmount || item.amount || 0)}</table_1.TableCell>
                            <table_1.TableCell>
                              {item.creditCardName ? (<span className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.creditCardColor || '#888' }}/>
                                  {item.creditCardName}
                                </span>) : (<span className="text-muted-foreground">-</span>)}
                            </table_1.TableCell>
                          </table_1.TableRow>)))}
                    </table_1.TableBody>
                  </table_1.Table>
                </div>)}
            </card_1.CardContent>
          </card_1.Card>

          {/* Card de Totais */}
          <div className="space-y-8">
            <card_1.Card className="shadow-sm">
              <card_1.CardHeader>
                <card_1.CardTitle className="text-xl font-bold">
                  Total da Fatura - {months.find((m) => m.value === currentMonth)?.label}/{currentYear}
                </card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Despesas:</span>
                    <span className="font-medium text-red-600">{(0, utils_1.formatCurrency)(summary.totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Parcelamentos:</span>
                    <span className="font-medium text-purple-600">{(0, utils_1.formatCurrency)(summary.totalInstallments)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Receitas:</span>
                    <span className="font-medium text-green-600">{(0, utils_1.formatCurrency)(summary.totalIncome)}</span>
                  </div>
                  <separator_1.Separator className="my-4"/>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-lg">
                      {(0, utils_1.formatCurrency)(summary.totalIncome - (summary.totalExpenses + summary.totalInstallments))}
                    </span>
                  </div>
                </div>
              </card_1.CardContent>
            </card_1.Card>

            <card_1.Card className="shadow-sm">
              <card_1.CardHeader>
                <card_1.CardTitle className="text-xl font-bold">
                  Gastos por Categoria
                </card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="space-y-4">
                  {Object.entries(filteredItems
            .filter(item => item.type !== "income")
            .reduce((acc, item) => {
            const amount = item.installmentAmount || item.amount || 0;
            if (!acc[item.category]) {
                acc[item.category] = 0;
            }
            acc[item.category] += amount;
            return acc;
        }, {}))
            .sort(([, a], [, b]) => b - a)
            .map(([category, total]) => (<div key={category} className="flex justify-between items-center">
                        <span className="text-muted-foreground">{category}:</span>
                        <span className="font-medium">{(0, utils_1.formatCurrency)(total)}</span>
                      </div>))}
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </div>
        </div>
      </div>
    </div>);
}
