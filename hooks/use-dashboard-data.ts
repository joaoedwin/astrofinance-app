import { useState, useEffect, useCallback } from "react"
import { useAuthContext } from "@/contexts/auth-context"

export function useDashboardData(token: string) {
  const { user } = useAuthContext()
  const [dashboard, setDashboard] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [month, setMonth] = useState<string>(() => (new Date().getMonth() + 1).toString().padStart(2, '0'))
  const [year, setYear] = useState<string>(() => new Date().getFullYear().toString()) // Mantido para possível uso futuro, mas não usado no fetch atual

  const fetchAll = useCallback(async () => {
    if (!token || !user?.id) { // user.id é usado para determinar se podemos prosseguir, mesmo que não seja enviado
      // setError("Usuário não autenticado"); // Pode ser redundante se o token já é verificado
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // A rota /api/dashboard-summary agora obtém o mês/ano atual internamente e userId do token
      const [dashboardSummaryRes, transactionsRes] = await Promise.all([
        fetch(`/api/dashboard-summary`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/transactions", { headers: { Authorization: `Bearer ${token}` } }), // Mantém busca de transações
      ]);

      const handleResponse = async (res: Response, errorMessage: string) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: errorMessage }));
          console.error(`Error fetching ${res.url}: ${res.status} ${res.statusText}`, errorData);
          throw new Error(errorData.message || errorMessage);
        }
        return res.json();
      };

      const dashboardSummaryData = await handleResponse(dashboardSummaryRes, "Erro ao buscar resumo do dashboard");
      const transactionsData = await handleResponse(transactionsRes, "Erro ao buscar transações");

      // O estado 'dashboard' agora espera a estrutura de DashboardSummaryResponse
      setDashboard(dashboardSummaryData);
      setTransactions(transactionsData);

    } catch (e: any) {
      console.error("useDashboardData fetchAll error:", e);
      setDashboard(null);
      setTransactions([]);
      setError(e.message || "Erro desconhecido ao buscar dados do dashboard");
    } finally {
      setLoading(false);
    }
  }, [token, user?.id]); // Removido month, year das dependências do useCallback, pois não são usados no fetch

  useEffect(() => {
    if (token && user?.id) {
        fetchAll();
    } else if (!token) {
        // Se não há token, não tentar buscar e limpar dados/loading
        setLoading(false);
        setDashboard(null);
        setTransactions([]);
    }
  }, [token, user?.id, fetchAll]);

  // Manter month, setMonth, year, setYear no retorno se a UI ainda os usa para controlar algo,
  // mesmo que o fetch não os use diretamente por enquanto.
  return { dashboard, transactions, loading, error, refetch: fetchAll, month, setMonth, year, setYear };
} 