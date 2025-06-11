"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsClient = TransactionsClient;
const react_1 = require("react");
const transactions_header_1 = require("@/components/transactions/transactions-header");
const editable_transaction_table_1 = require("@/components/transactions/editable-transaction-table");
const button_1 = require("@/components/ui/button");
const lucide_react_1 = require("lucide-react");
const HelpModal_1 = require("@/app/(dashboard)/transactions/HelpModal");
function TransactionsClient({ transactions }) {
    const [search, setSearch] = (0, react_1.useState)("");
    const [type, setType] = (0, react_1.useState)("all");
    const [category, setCategory] = (0, react_1.useState)("all");
    const [order, setOrder] = (0, react_1.useState)("newest");
    const [dateStart, setDateStart] = (0, react_1.useState)("");
    const [dateEnd, setDateEnd] = (0, react_1.useState)("");
    const [localTransactions, setLocalTransactions] = (0, react_1.useState)([]);
    const [showHelp, setShowHelp] = (0, react_1.useState)(false);
    console.log("TransactionsClient - Recebido nas props:", transactions ? `${transactions.length} transações` : "nenhuma transação", transactions);
    // Garantir que os dados sejam processados corretamente
    (0, react_1.useEffect)(() => {
        console.log("TransactionsClient - useEffect - Processando transações:", transactions);
        // Garantir que transactions é um array e que cada objeto tem o formato esperado
        if (Array.isArray(transactions)) {
            const processedTransactions = transactions.map(tx => {
                try {
                    // Garantir que date seja um objeto Date válido
                    const txDate = tx.date instanceof Date ? tx.date : new Date(tx.date);
                    return {
                        id: tx.id || `temp-${Math.random()}`,
                        date: txDate,
                        description: tx.description || "",
                        amount: typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount) || 0,
                        type: tx.type === 'income' ? 'income' : 'expense',
                        category: tx.category || "Sem categoria"
                    };
                }
                catch (e) {
                    console.error("Erro ao processar transação:", tx, e);
                    return null;
                }
            }).filter(Boolean);
            setLocalTransactions(processedTransactions);
            console.log("TransactionsClient - Transações processadas:", processedTransactions.length);
        }
        else {
            console.warn("TransactionsClient - transactions não é um array:", transactions);
            setLocalTransactions([]);
        }
    }, [transactions]);
    const onToggleType = async (id, newType) => {
        try {
            await fetch(`/api/transactions/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...localTransactions.find(t => t.id === id), type: newType }),
            });
            setLocalTransactions(prev => prev.map(t => t.id === id ? { ...t, type: newType } : t));
        }
        catch {
            // opcional: toast de erro
        }
    };
    const filteredTransactions = (0, react_1.useMemo)(() => {
        return localTransactions.filter(transaction => {
            // Filtrar por texto de busca
            const matchesSearch = search === "" ||
                transaction.description.toLowerCase().includes(search.toLowerCase()) ||
                transaction.category.toLowerCase().includes(search.toLowerCase());
            // Filtrar por tipo
            const matchesType = type === "all" || transaction.type === type;
            // Filtrar por categoria
            const matchesCategory = category === "all" || transaction.category === category;
            // Filtrar por data de início
            let matchesDateStart = true;
            if (dateStart) {
                const txDate = new Date(transaction.date);
                const startDate = new Date(dateStart);
                // Resetar horas para comparar apenas datas
                txDate.setHours(0, 0, 0, 0);
                startDate.setHours(0, 0, 0, 0);
                matchesDateStart = txDate >= startDate;
            }
            // Filtrar por data final
            let matchesDateEnd = true;
            if (dateEnd) {
                const txDate = new Date(transaction.date);
                const endDate = new Date(dateEnd);
                // Resetar horas para comparar apenas datas
                txDate.setHours(0, 0, 0, 0);
                endDate.setHours(0, 0, 0, 0);
                matchesDateEnd = txDate <= endDate;
            }
            return matchesSearch && matchesType && matchesCategory && matchesDateStart && matchesDateEnd;
        });
    }, [localTransactions, search, type, category, dateStart, dateEnd]);
    // Extrair categorias únicas para o filtro
    const categories = (0, react_1.useMemo)(() => {
        const set = new Set(localTransactions.map(t => t.category));
        return ["all", ...Array.from(set)];
    }, [localTransactions]);
    // Ordenar transações com base na seleção de ordem
    const getOrderedTransactions = (0, react_1.useMemo)(() => {
        console.log("TransactionsClient - getOrderedTransactions - Calculando com", filteredTransactions.length, "transações filtradas");
        const filtered = [...filteredTransactions];
        switch (order) {
            case "newest":
                return filtered.sort((a, b) => {
                    const dateA = a.date instanceof Date ? a.date : new Date(a.date);
                    const dateB = b.date instanceof Date ? b.date : new Date(b.date);
                    return dateB.getTime() - dateA.getTime(); // Data mais recente primeiro
                });
            case "oldest":
                return filtered.sort((a, b) => {
                    const dateA = a.date instanceof Date ? a.date : new Date(a.date);
                    const dateB = b.date instanceof Date ? b.date : new Date(b.date);
                    return dateA.getTime() - dateB.getTime(); // Data mais antiga primeiro
                });
            case "highest":
                return filtered.sort((a, b) => b.amount - a.amount); // Maior valor primeiro
            case "lowest":
                return filtered.sort((a, b) => a.amount - b.amount); // Menor valor primeiro
            default:
                return filtered;
        }
    }, [filteredTransactions, order]);
    console.log("TransactionsClient - Render - Transações ordenadas:", getOrderedTransactions.length);
    return (<>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Transações</h1>
        <div className="flex gap-2">
          <button_1.Button variant="outline" onClick={() => setShowHelp(true)}>
            <lucide_react_1.Info className="h-4 w-4 mr-1"/> Como funciona?
          </button_1.Button>
        </div>
      </div>
      {transactions.length === 0 && (<div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 text-yellow-800 mb-4">
          <h3 className="font-medium">Problema Detectado</h3>
          <p>Não encontramos transações no banco de dados.</p>
          <p className="mt-2 text-sm">Soluções:</p>
          <ol className="list-decimal ml-5 text-sm">
            <li>Faça login novamente para obter um novo token</li>
            <li>Verifique se há transações no banco de dados</li>
            <li>Verifique se as datas das transações são válidas</li>
          </ol>
        </div>)}
      <transactions_header_1.TransactionsHeader search={search} onSearchChange={setSearch} type={type} onTypeChange={setType} category={category} onCategoryChange={setCategory} order={order} onOrderChange={setOrder} dateStart={dateStart} onDateStartChange={setDateStart} dateEnd={dateEnd} onDateEndChange={setDateEnd} categories={categories}/>
      {transactions && transactions.length === 0 ? (<div className="py-6 text-center text-gray-500">
          <p>Nenhuma transação encontrada</p>
          <p className="text-sm mt-2">Clique em "Nova Transação" para adicionar uma transação</p>
        </div>) : (<editable_transaction_table_1.EditableTransactionTable initialTransactions={getOrderedTransactions}/>)}
      <HelpModal_1.HelpModal open={showHelp} onClose={() => setShowHelp(false)}/>
    </>);
}
