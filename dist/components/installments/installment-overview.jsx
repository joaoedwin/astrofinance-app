"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstallmentOverview = InstallmentOverview;
const react_1 = require("react");
const card_1 = require("@/components/ui/card");
const table_1 = require("@/components/ui/table");
const badge_1 = require("@/components/ui/badge");
const button_1 = require("@/components/ui/button");
const progress_1 = require("@/components/ui/progress");
const utils_1 = require("@/lib/utils");
const lucide_react_1 = require("lucide-react");
const new_installment_modal_1 = require("@/components/installments/new-installment-modal");
const dropdown_menu_1 = require("@/components/ui/dropdown-menu");
const edit_installment_modal_1 = require("@/components/installments/edit-installment-modal");
const alert_dialog_1 = require("@/components/ui/alert-dialog");
const select_1 = require("@/components/ui/select");
const credit_card_manager_1 = require("@/components/credit-card/credit-card-manager");
function InstallmentOverview() {
    const [isModalOpen, setIsModalOpen] = (0, react_1.useState)(false);
    const [isEditModalOpen, setIsEditModalOpen] = (0, react_1.useState)(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = (0, react_1.useState)(false);
    const [selectedInstallment, setSelectedInstallment] = (0, react_1.useState)(null);
    const [installments, setInstallments] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [currentMonth, setCurrentMonth] = (0, react_1.useState)(() => {
        const now = new Date();
        return (now.getMonth() + 1).toString().padStart(2, "0");
    });
    const [currentYear, setCurrentYear] = (0, react_1.useState)(() => {
        return new Date().getFullYear().toString();
    });
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
    const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString());
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
    (0, react_1.useEffect)(() => {
        const fetchInstallments = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch("/api/installments", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (data.installments) {
                    setInstallments(data.installments);
                }
            }
            catch (error) {
                console.error("Erro ao buscar parcelamentos:", error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchInstallments();
    }, []);
    // Função para recarregar os parcelamentos após qualquer operação
    const reloadInstallments = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("/api/installments", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.installments) {
                setInstallments(data.installments);
            }
        }
        catch (error) {
            console.error("Erro ao buscar parcelamentos:", error);
        }
        finally {
            setLoading(false);
        }
    };
    // Função para filtrar e calcular a parcela do mês selecionado
    function getInstallmentsForMonth() {
        return installments
            .map((installment) => {
            const start = new Date(installment.startDate);
            const startMonth = start.getMonth() + 1;
            const startYear = start.getFullYear();
            const total = installment.totalInstallments;
            // Calcular o número da parcela para o mês/ano selecionado
            const monthsDiff = (Number(currentYear) - startYear) * 12 + (Number(currentMonth) - startMonth);
            if (monthsDiff < 0 || monthsDiff >= total)
                return null; // Fora do range
            // Calcular status
            const selectedDate = new Date(Number(currentYear), Number(currentMonth) - 1);
            const installmentDate = new Date(startYear, startMonth - 1 + monthsDiff);
            let status = 'Pendente';
            if (installmentDate < selectedDate)
                status = 'Pago';
            else if (installmentDate > selectedDate)
                status = 'Futuro';
            return {
                ...installment,
                installmentNumber: monthsDiff + 1,
                status,
            };
        })
            .filter(Boolean);
    }
    const filteredInstallments = getInstallmentsForMonth();
    const totalMonthlyInstallments = filteredInstallments.reduce((total, installment) => total + installment.installmentAmount, 0);
    const addInstallment = async (newInstallment) => {
        setIsModalOpen(false);
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
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
            });
            await reloadInstallments();
        }
        catch (error) {
            console.error("Erro ao criar parcelamento:", error);
        }
        finally {
            setLoading(false);
        }
    };
    const editInstallment = async (updatedInstallment) => {
        setIsEditModalOpen(false);
        setSelectedInstallment(null);
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
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
            });
            await reloadInstallments();
        }
        catch (error) {
            console.error("Erro ao editar parcelamento:", error);
        }
        finally {
            setLoading(false);
        }
    };
    const deleteInstallment = async () => {
        if (!selectedInstallment)
            return;
        setIsDeleteDialogOpen(false);
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            await fetch("/api/installments", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ id: selectedInstallment.id })
            });
            setSelectedInstallment(null);
            await reloadInstallments();
        }
        catch (error) {
            console.error("Erro ao excluir parcelamento:", error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleEdit = (installment) => {
        setSelectedInstallment(installment);
        setIsEditModalOpen(true);
    };
    const handleDelete = (installment) => {
        setSelectedInstallment(installment);
        setIsDeleteDialogOpen(true);
    };
    return (<div className="space-y-8">
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
                    {years.map((year) => (<select_1.SelectItem key={year} value={year}>
                        {year}
                      </select_1.SelectItem>))}
                  </select_1.SelectContent>
                </select_1.Select>
              </div>
              <button_1.Button variant="outline" size="icon" onClick={nextMonth} className="h-10 w-10">
                <lucide_react_1.ChevronRight className="h-5 w-5"/>
              </button_1.Button>
            </div>
            <div className="flex gap-2">
              <credit_card_manager_1.CreditCardManager buttonProps={{ size: "lg", className: "h-11" }}/>
              <button_1.Button onClick={() => setIsModalOpen(true)} size="lg" className="h-11">
                <lucide_react_1.PlusCircle className="mr-2 h-5 w-5"/>
                Novo Parcelamento
              </button_1.Button>
            </div>
          </div>
        </card_1.CardHeader>
        <card_1.CardContent>
          {loading ? (<div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>) : (<div className="grid gap-8 md:grid-cols-2">
              <card_1.Card className="shadow-sm">
                <card_1.CardHeader className="pb-3">
                  <card_1.CardTitle className="text-sm font-medium">Total Mensal em Parcelas</card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="text-2xl font-bold">{(0, utils_1.formatCurrency)(totalMonthlyInstallments)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Valor total de parcelas para este mês</p>
                </card_1.CardContent>
              </card_1.Card>
              <card_1.Card className="shadow-sm">
                <card_1.CardHeader className="pb-3">
                  <card_1.CardTitle className="text-sm font-medium">Parcelamentos Ativos</card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="text-2xl font-bold">{filteredInstallments.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total de compras parceladas ativas neste mês</p>
                </card_1.CardContent>
              </card_1.Card>
            </div>)}
        </card_1.CardContent>
      </card_1.Card>

      <card_1.Card className="shadow-sm">
        <card_1.CardHeader className="pb-6">
          <card_1.CardTitle className="text-xl font-bold">Parcelamentos do Mês</card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent>
          {loading ? (<div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>) : (<div className="rounded-md border overflow-x-auto">
              <table_1.Table>
                <table_1.TableHeader>
                  <table_1.TableRow>
                    <table_1.TableHead className="font-medium">Descrição</table_1.TableHead>
                    <table_1.TableHead className="font-medium">Categoria</table_1.TableHead>
                    <table_1.TableHead className="w-[200px] font-medium">Progresso</table_1.TableHead>
                    <table_1.TableHead className="font-medium">Parcela</table_1.TableHead>
                    <table_1.TableHead className="font-medium">Cartão</table_1.TableHead>
                    <table_1.TableHead className="font-medium">Valor Parcela</table_1.TableHead>
                    <table_1.TableHead className="font-medium">Valor Total</table_1.TableHead>
                    <table_1.TableHead className="font-medium">Status</table_1.TableHead>
                    <table_1.TableHead className="w-[80px]"></table_1.TableHead>
                  </table_1.TableRow>
                </table_1.TableHeader>
                <table_1.TableBody>
                  {filteredInstallments.length === 0 ? (<table_1.TableRow>
                      <table_1.TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhum parcelamento encontrado para este mês
                      </table_1.TableCell>
                    </table_1.TableRow>) : (filteredInstallments.filter(Boolean).map((installment) => (<table_1.TableRow key={installment.id}>
                        <table_1.TableCell className="font-medium">{installment.description}</table_1.TableCell>
                        <table_1.TableCell>{installment.category}</table_1.TableCell>
                        <table_1.TableCell>
                          <div className="flex flex-col gap-2">
                            <progress_1.Progress value={(installment.installmentNumber / installment.totalInstallments) * 100} className="h-2"/>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>
                                {installment.installmentNumber} de {installment.totalInstallments} parcelas
                              </span>
                              <span>
                                {Math.round((installment.installmentNumber / installment.totalInstallments) * 100)}%
                              </span>
                            </div>
                          </div>
                        </table_1.TableCell>
                        <table_1.TableCell>
                          {installment.installmentNumber}/{installment.totalInstallments}
                        </table_1.TableCell>
                        <table_1.TableCell>
                          {installment.creditCardId && installment.creditCardName ? (<span className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: installment.creditCardColor }}/>
                              {installment.creditCardName}
                            </span>) : (<span className="text-muted-foreground">-</span>)}
                        </table_1.TableCell>
                        <table_1.TableCell>{(0, utils_1.formatCurrency)(installment.installmentAmount)}</table_1.TableCell>
                        <table_1.TableCell>{(0, utils_1.formatCurrency)(installment.totalAmount)}</table_1.TableCell>
                        <table_1.TableCell>
                          <badge_1.Badge variant={installment.status === 'Pago'
                    ? 'default'
                    : installment.status === 'Futuro'
                        ? 'secondary'
                        : 'outline'}>
                            {installment.status}
                          </badge_1.Badge>
                        </table_1.TableCell>
                        <table_1.TableCell>
                          <dropdown_menu_1.DropdownMenu>
                            <dropdown_menu_1.DropdownMenuTrigger asChild>
                              <button_1.Button variant="ghost" size="icon">
                                <lucide_react_1.MoreHorizontal className="h-4 w-4"/>
                                <span className="sr-only">Abrir menu</span>
                              </button_1.Button>
                            </dropdown_menu_1.DropdownMenuTrigger>
                            <dropdown_menu_1.DropdownMenuContent align="end">
                              <dropdown_menu_1.DropdownMenuItem onClick={() => handleEdit(installment)}>
                                <lucide_react_1.Pencil className="mr-2 h-4 w-4"/>
                                Editar
                              </dropdown_menu_1.DropdownMenuItem>
                              <dropdown_menu_1.DropdownMenuItem onClick={() => handleDelete(installment)} className="text-red-600">
                                <lucide_react_1.Trash2 className="mr-2 h-4 w-4"/>
                                Excluir
                              </dropdown_menu_1.DropdownMenuItem>
                            </dropdown_menu_1.DropdownMenuContent>
                          </dropdown_menu_1.DropdownMenu>
                        </table_1.TableCell>
                      </table_1.TableRow>)))}
                </table_1.TableBody>
              </table_1.Table>
            </div>)}
        </card_1.CardContent>
      </card_1.Card>

      <new_installment_modal_1.NewInstallmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={addInstallment}/>

      {selectedInstallment && (<edit_installment_modal_1.EditInstallmentModal isOpen={isEditModalOpen} onClose={() => {
                setIsEditModalOpen(false);
                setSelectedInstallment(null);
            }} onSave={editInstallment} installment={selectedInstallment}/>)}

      <alert_dialog_1.AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <alert_dialog_1.AlertDialogContent>
          <alert_dialog_1.AlertDialogHeader>
            <alert_dialog_1.AlertDialogTitle>Confirmar exclusão</alert_dialog_1.AlertDialogTitle>
            <alert_dialog_1.AlertDialogDescription>
              Tem certeza que deseja excluir este parcelamento? Esta ação não pode ser desfeita.
            </alert_dialog_1.AlertDialogDescription>
          </alert_dialog_1.AlertDialogHeader>
          <alert_dialog_1.AlertDialogFooter>
            <alert_dialog_1.AlertDialogCancel>Cancelar</alert_dialog_1.AlertDialogCancel>
            <alert_dialog_1.AlertDialogAction onClick={deleteInstallment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </alert_dialog_1.AlertDialogAction>
          </alert_dialog_1.AlertDialogFooter>
        </alert_dialog_1.AlertDialogContent>
      </alert_dialog_1.AlertDialog>
    </div>);
}
