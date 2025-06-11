"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNotifications = useNotifications;
const react_1 = require("react");
const auth_context_1 = require("@/contexts/auth-context");
function useNotifications() {
    const { token } = (0, auth_context_1.useAuthContext)();
    const [notifications, setNotifications] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const fetchNotifications = (0, react_1.useCallback)(async (onlyUnread = false) => {
        if (!token)
            return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/notifications${onlyUnread ? "?unread=1" : ""}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok)
                throw new Error("Erro ao buscar notificações");
            const data = await res.json();
            setNotifications(data);
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    }, [token]);
    const createNotification = (0, react_1.useCallback)(async (notification) => {
        if (!token)
            return null;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/notifications", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(notification),
            });
            if (!res.ok)
                throw new Error("Erro ao criar notificação");
            const data = await res.json();
            setNotifications((prev) => [data, ...prev]);
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
    const markAsRead = (0, react_1.useCallback)(async (id) => {
        if (!token)
            return null;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/notifications", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ id, read: true }),
            });
            if (!res.ok)
                throw new Error("Erro ao marcar como lida");
            const data = await res.json();
            setNotifications((prev) => prev.map((n) => (n.id === id ? data : n)));
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
    const deleteNotification = (0, react_1.useCallback)(async (id) => {
        if (!token)
            return false;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/notifications?id=${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok)
                throw new Error("Erro ao deletar notificação");
            setNotifications((prev) => prev.filter((n) => n.id !== id));
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
    const unreadCount = notifications.filter((n) => n.read === 0).length;
    return {
        notifications,
        loading,
        error,
        fetchNotifications,
        createNotification,
        markAsRead,
        deleteNotification,
        unreadCount,
        setNotifications,
    };
}
