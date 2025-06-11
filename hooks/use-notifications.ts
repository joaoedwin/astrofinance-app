import { useState, useCallback, useEffect } from "react";
import { useAuthContext } from "@/contexts/auth-context";

export interface Notification {
  id: string;
  user_id: string;
  type: "goal_reserve" | "goal_limit" | "update" | "announce";
  goal_id?: string | null;
  message: string;
  read: 0 | 1;
  created_at: string;
}

// Intervalo de polling em milissegundos (1 minuto)
const POLLING_INTERVAL = 60000;

export function useNotifications() {
  const { token } = useAuthContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [pollingEnabled, setPollingEnabled] = useState<boolean>(true);

  const fetchNotifications = useCallback(async (onlyUnread = false) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/notifications${onlyUnread ? "?unread=1" : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao buscar notificações");
      const data = await res.json();
      setNotifications(data);
      setLastChecked(new Date());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Configurar polling para verificar novas notificações
  useEffect(() => {
    if (!token || !pollingEnabled) return;

    // Buscar notificações imediatamente ao montar o componente
    fetchNotifications();

    // Configurar intervalo para verificar novas notificações
    const intervalId = setInterval(() => {
      console.log("Verificando novas notificações...");
      fetchNotifications();
    }, POLLING_INTERVAL);

    // Limpar intervalo quando o componente for desmontado
    return () => clearInterval(intervalId);
  }, [token, fetchNotifications, pollingEnabled]);

  const createNotification = useCallback(async (notification: Partial<Notification>) => {
    if (!token) return null;
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
      if (!res.ok) throw new Error("Erro ao criar notificação");
      const data = await res.json();
      setNotifications((prev) => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const markAsRead = useCallback(async (id: string) => {
    if (!token) return null;
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
      if (!res.ok) throw new Error("Erro ao marcar como lida");
      const data = await res.json();
      setNotifications((prev) => prev.map((n) => (n.id === id ? data : n)));
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const deleteNotification = useCallback(async (id: string) => {
    if (!token) return false;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/notifications?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao deletar notificação");
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Habilitar/desabilitar polling
  const togglePolling = (enabled: boolean) => {
    setPollingEnabled(enabled);
  };

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
    lastChecked,
    pollingEnabled,
    togglePolling,
  };
} 