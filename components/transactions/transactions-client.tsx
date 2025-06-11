"use client"
import { useState, useEffect, useMemo } from "react"
import { TransactionsHeader } from "@/components/transactions/transactions-header"
import { EditableTransactionTable } from "@/components/transactions/editable-transaction-table"
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"
import { HelpModal } from "@/app/(dashboard)/transactions/HelpModal"
import { useAuthContext } from "@/contexts/auth-context"

interface Transaction {
  id: string
  date: Date
  description: string
  amount: number
  type: "income" | "expense"
  category: string
  category_id: string
}

interface TransactionsClientProps {
  transactions: Transaction[]
}

export function TransactionsClient({ transactions }: TransactionsClientProps) {
  const [search, setSearch] = useState("")
  const [type, setType] = useState<"all" | "income" | "expense">("all")
  const [category, setCategory] = useState<string>("all")
  const [order, setOrder] = useState<"newest" | "oldest" | "highest" | "lowest">("newest")
  const [dateStart, setDateStart] = useState<string>("")
  const [dateEnd, setDateEnd] = useState<string>("")
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>([])
  const [showHelp, setShowHelp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { token } = useAuthContext()
  
  console.log("TransactionsClient - Recebido nas props:", transactions?.length || 0, "transações", transactions);
  
  // Carregar transações do servidor se não houver nenhuma
  useEffect(() => {
    // Se já temos transações das props, usamos elas
    if (Array.isArray(transactions) && transactions.length > 0) {
      processTransactions(transactions);
      return;
    }
    
    // Se não temos transações, vamos carregá-las do servidor
    async function loadTransactions() {
      if (!token) return;
      
      try {
        setIsLoading(true);
        console.log("TransactionsClient - Carregando transações do servidor");
        
        const currentDate = new Date();
        const month = (currentDate.getMonth() + 1).toString(); // Janeiro é 0
        const year = currentDate.getFullYear().toString();
        
        const response = await fetch(`/api/transactions/by-month?month=${month}&year=${year}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Erro ao carregar transações: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`TransactionsClient - Carregadas ${data.length} transações do servidor`);
        processTransactions(data);
      } catch (error) {
        console.error("TransactionsClient - Erro ao carregar transações:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadTransactions();
  }, [token, transactions]);
  
  // Processar transações para garantir formato correto
  const processTransactions = (data: any[]) => {
    if (!Array.isArray(data)) {
      console.warn("TransactionsClient - Dados não são um array:", data);
      setLocalTransactions([]);
      return;
    }
    
    try {
      const processedTransactions = data.map(tx => {
        try {
          // Garantir que date seja um objeto Date válido
          const txDate = tx.date instanceof Date ? tx.date : new Date(tx.date);
          
          return {
            id: tx.id || `temp-${Math.random()}`,
            date: txDate,
            description: tx.description || "",
            amount: typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount) || 0,
            type: tx.type === 'income' ? 'income' : 'expense',
            category: tx.category || "Sem categoria",
            category_id: tx.category_id || ""
          };
        } catch (e) {
          console.error("Erro ao processar transação:", tx, e);
          return null;
        }
      }).filter(Boolean) as Transaction[];
      
      setLocalTransactions(processedTransactions);
      console.log("TransactionsClient - Transações processadas:", processedTransactions.length);
    } catch (error) {
      console.error("TransactionsClient - Erro ao processar transações:", error);
      setLocalTransactions([]);
    }
  };

  const onToggleType = async (id: string, newType: "income" | "expense") => {
    try {
      await fetch(`/api/transactions/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ ...localTransactions.find(t => t.id === id), type: newType }),
      })
      setLocalTransactions(prev => prev.map(t => t.id === id ? { ...t, type: newType } : t))
    } catch {
      // opcional: toast de erro
    }
  }

  const filteredTransactions = useMemo(() => {
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
  const categories = useMemo(() => {
    const set = new Set(localTransactions.map(t => t.category))
    return ["all", ...Array.from(set)]
  }, [localTransactions])

  // Ordenar transações com base na seleção de ordem
  const getOrderedTransactions = useMemo(() => {
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

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Transações</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 sm:h-10 text-xs sm:text-sm" onClick={() => setShowHelp(true)}>
            <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" /> <span className="hidden xs:inline">Como funciona?</span>
          </Button>
        </div>
      </div>
      <TransactionsHeader
        search={search}
        onSearchChange={setSearch}
        type={type}
        onTypeChange={setType}
        category={category}
        onCategoryChange={setCategory}
        order={order}
        onOrderChange={setOrder}
        dateStart={dateStart}
        onDateStartChange={setDateStart}
        dateEnd={dateEnd}
        onDateEndChange={setDateEnd}
        categories={categories}
      />
      {isLoading ? (
        <div className="py-4 sm:py-6 text-center text-gray-500">
          <p className="text-sm sm:text-base">Carregando transações...</p>
        </div>
      ) : localTransactions.length === 0 ? (
        <div className="py-4 sm:py-6 text-center text-gray-500">
          <p className="text-sm sm:text-base">Nenhuma transação encontrada</p>
          <p className="text-xs sm:text-sm mt-2">Clique em &quot;Nova Transação&quot; para adicionar uma transação</p>
        </div>
      ) : (
        <EditableTransactionTable initialTransactions={getOrderedTransactions} />
      )}
      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
    </>
  )
} 