"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGoalReserves = useGoalReserves;
const react_1 = require("react");
const auth_context_1 = require("@/contexts/auth-context");
function useGoalReserves() {
    const { token } = (0, auth_context_1.useAuthContext)();
    const [reserves, setReserves] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const fetchReserves = (0, react_1.useCallback)(async (goalId, month) => {
        if (!token)
            return;
        setLoading(true);
        setError(null);
        try {
            let url = "/api/goals/reserves";
            const params = [];
            if (goalId)
                params.push(`goal_id=${goalId}`);
            if (month)
                params.push(`month=${month}`);
            if (params.length > 0)
                url += `?${params.join("&")}`;
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok)
                throw new Error("Erro ao buscar reservas");
            const data = await res.json();
            setReserves((prev) => {
                if (goalId) {
                    // Remove reservas do goalId e adiciona as novas
                    const filtered = prev.filter(r => r.goal_id !== goalId);
                    return [...filtered, ...data];
                }
                // Se não filtrando, sobrescreve tudo
                return data;
            });
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    }, [token]);
    const createReserve = (0, react_1.useCallback)(async (reserve) => {
        if (!token)
            return null;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/goals/reserves", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(reserve),
            });
            if (!res.ok)
                throw new Error("Erro ao criar reserva");
            const data = await res.json();
            setReserves((prev) => [data, ...prev]);
            return data;
        }
        catch (err) {
            setError(err.message);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [token]);
    const updateReserve = (0, react_1.useCallback)(async (id, amount) => {
        if (!token)
            return null;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/goals/reserves", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ id, amount }),
            });
            if (!res.ok)
                throw new Error("Erro ao atualizar reserva");
            const data = await res.json();
            setReserves((prev) => prev.map((r) => (r.id === id ? data : r)));
            return data;
        }
        catch (err) {
            setError(err.message);
            return null;
        }
        finally {
            setLoading(false);
        }
    }, [token]);
    const deleteReserve = (0, react_1.useCallback)(async (id) => {
        if (!token)
            return false;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/goals/reserves?id=${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok)
                throw new Error("Erro ao deletar reserva");
            setReserves((prev) => prev.filter((r) => r.id !== id));
            return true;
        }
        catch (err) {
            setError(err.message);
            return false;
        }
        finally {
            setLoading(false);
        }
    }, [token]);
    return {
        reserves,
        loading,
        error,
        fetchReserves,
        createReserve,
        updateReserve,
        deleteReserve,
        setReserves,
    };
}
