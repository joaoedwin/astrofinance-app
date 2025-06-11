"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useInstallments = useInstallments;
const react_1 = require("react");
const auth_context_1 = require("@/contexts/auth-context");
function useInstallments() {
    const { token } = (0, auth_context_1.useAuthContext)();
    const [installments, setInstallments] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const fetchInstallments = (0, react_1.useCallback)(async () => {
        if (!token)
            return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/installments", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok)
                throw new Error("Erro ao buscar parcelamentos");
            const data = await res.json();
            setInstallments(data.installments || []);
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    }, [token]);
    return {
        installments,
        loading,
        error,
        fetchInstallments,
        setInstallments
    };
}
