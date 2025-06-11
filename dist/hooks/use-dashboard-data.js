"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDashboardData = useDashboardData;
const react_1 = require("react");
function useDashboardData(token) {
    const [dashboard, setDashboard] = (0, react_1.useState)(null);
    const [transactions, setTransactions] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const fetchAll = (0, react_1.useCallback)(async () => {
        setLoading(true);
        setError(null);
        try {
            const [dashboardRes, transactionsRes] = await Promise.all([
                fetch("/api/dashboard", { headers: { Authorization: `Bearer ${token}` } }),
                fetch("/api/transactions", { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const handleResponse = async (res, errorMessage) => {
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({ message: errorMessage }));
                    throw new Error(errorData.message || errorMessage);
                }
                return res.json();
            };
            const [dashboardData, transactionsData] = await Promise.all([
                handleResponse(dashboardRes, "Erro ao buscar dashboard"),
                handleResponse(transactionsRes, "Erro ao buscar transações"),
            ]);
            setDashboard(dashboardData);
            setTransactions(transactionsData);
        }
        catch (e) {
            setDashboard(null);
            setTransactions([]);
            setError(e.message || "Erro desconhecido ao buscar dados");
        }
        finally {
            setLoading(false);
        }
    }, [token]);
    (0, react_1.useEffect)(() => {
        if (token)
            fetchAll();
    }, [token, fetchAll]);
    return { dashboard, transactions, loading, error, refetch: fetchAll };
}
