"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGoals = useGoals;
const react_1 = require("react");
const auth_context_1 = require("@/contexts/auth-context");
function useGoals() {
    const { token } = (0, auth_context_1.useAuthContext)();
    const [goals, setGoals] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const fetchGoals = (0, react_1.useCallback)(async () => {
        if (!token)
            return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/goals", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok)
                throw new Error("Erro ao buscar metas");
            const data = await res.json();
            setGoals(data);
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    }, [token]);
    const createGoal = (0, react_1.useCallback)(async (goal) => {
        if (!token)
            return null;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/goals", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(goal)
            });
            if (!res.ok)
                throw new Error("Erro ao criar meta");
            const data = await res.json();
            setGoals((prev) => [data, ...prev]);
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
    const updateGoal = (0, react_1.useCallback)(async (goal) => {
        if (!token || !goal.id)
            return null;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/goals", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(goal)
            });
            if (!res.ok)
                throw new Error("Erro ao atualizar meta");
            const data = await res.json();
            setGoals((prev) => prev.map((g) => (g.id === data.id ? data : g)));
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
    const deleteGoal = (0, react_1.useCallback)(async (id) => {
        if (!token)
            return false;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/goals?id=${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok)
                throw new Error("Erro ao deletar meta");
            setGoals((prev) => prev.filter((g) => g.id !== id));
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
        goals,
        loading,
        error,
        fetchGoals,
        createGoal,
        updateGoal,
        deleteGoal,
        setGoals
    };
}
