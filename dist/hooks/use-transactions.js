"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTransactions = useTransactions;
const react_1 = require("react");
const auth_context_1 = require("@/contexts/auth-context");
function useTransactions() {
    const { token } = (0, auth_context_1.useAuthContext)();
    const [transactions, setTransactions] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const fetchTransactions = (0, react_1.useCallback)(async () => {
        if (!token)
            return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/transactions", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok)
                throw new Error("Erro ao buscar transações");
            const data = await res.json();
            setTransactions(data);
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    }, [token]);
    return {
        transactions,
        loading,
        error,
        fetchTransactions,
        setTransactions
    };
}
