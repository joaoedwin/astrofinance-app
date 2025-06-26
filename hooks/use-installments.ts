import { useState, useCallback } from "react";
import { useAuthContext } from "@/contexts/auth-context";

export interface Installment {
  id: string;
  description: string;
  category_id: string;
  category: string; // Este virá do JOIN no backend ou precisará ser buscado separadamente
  totalAmount: number;
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  startDate: string; // YYYY-MM-DD
  nextPaymentDate: string; // YYYY-MM-DD
  type: string; // Geralmente 'expense'
  userId?: string; // Adicionado, pois é parte do modelo de dados retornado pela API
  created_at?: string;
  creditCardId?: number | null;
  credit_card_name?: string; // Virá do JOIN
}

// Tipos para dados de criação e atualização, para melhor clareza
type CreateInstallmentPayload = Omit<Installment, 'id' | 'userId' | 'created_at' | 'paidInstallments' | 'type' | 'category' | 'nextPaymentDate' | 'credit_card_name'> & { creditCardId?: number | null };
type UpdateInstallmentPayload = Partial<Omit<CreateInstallmentPayload, 'userId'>>;

export function useInstallments() {
  const { token } = useAuthContext();
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInstallments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/installments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Erro ao buscar parcelamentos" }));
        throw new Error(errorData.message || "Erro ao buscar parcelamentos");
      }
      const data = await res.json();
      setInstallments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
      setInstallments([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createInstallment = useCallback(async (installmentData: CreateInstallmentPayload) => {
    if (!token) throw new Error("Usuário não autenticado");
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/installments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(installmentData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro ao criar parcelamento' }));
        throw new Error(errorData.message || 'Erro ao criar parcelamento');
      }
      const newInstallment = await response.json();
      setInstallments((prev) => [newInstallment, ...prev].sort((a,b) => new Date(b.nextPaymentDate).getTime() - new Date(a.nextPaymentDate).getTime()));
      return newInstallment;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const updateInstallment = useCallback(async (id: string, installmentData: UpdateInstallmentPayload) => {
    if (!token) throw new Error("Usuário não autenticado");
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/installments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(installmentData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro ao atualizar parcelamento' }));
        throw new Error(errorData.message || 'Erro ao atualizar parcelamento');
      }
      const updatedInstallment = await response.json();
      setInstallments((prev) => prev.map((inst) => (inst.id === id ? updatedInstallment : inst)));
      return updatedInstallment;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const deleteInstallment = useCallback(async (id: string) => {
    if (!token) throw new Error("Usuário não autenticado");
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/installments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro ao deletar parcelamento' }));
        throw new Error(errorData.message || 'Erro ao deletar parcelamento');
      }
      setInstallments((prev) => prev.filter((inst) => inst.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const payInstallment = useCallback(async (id: string) => {
    if (!token) throw new Error("Usuário não autenticado");
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/installments/${id}/pay`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro ao pagar parcela' }));
        throw new Error(errorData.message || 'Erro ao pagar parcela');
      }
      const updatedInstallment = await response.json();
      setInstallments((prev) => prev.map((inst) => (inst.id === id ? updatedInstallment : inst)));
      return updatedInstallment;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  return {
    installments,
    loading,
    error,
    fetchInstallments,
    setInstallments,
    createInstallment,
    updateInstallment,
    deleteInstallment,
    payInstallment,
  };
}