import { useState, useCallback } from "react"
import { useAuthContext } from "@/contexts/auth-context"

export interface Installment {
  id: string
  description: string
  category_id: string
  category: string
  totalAmount: number
  installmentAmount: number
  totalInstallments: number
  paidInstallments: number
  startDate: string
  nextPaymentDate: string
  type: string
}

export function useInstallments() {
  const { token } = useAuthContext()
  const [installments, setInstallments] = useState<Installment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInstallments = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/installments", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Erro ao buscar parcelamentos" }));
        throw new Error(errorData.message || "Erro ao buscar parcelamentos");
      }
      const data = await res.json();
      setInstallments(Array.isArray(data) ? data : []); // API retorna array diretamente
    } catch (err: any) {
      setError(err.message);
      setInstallments([]); // Limpar em caso de erro
    } finally {
      setLoading(false)
    }
  }, [token])

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
  }
}

// Tipos para dados de criação e atualização, para melhor clareza
type CreateInstallmentPayload = Omit<Installment, 'id' | 'userId' | 'created_at' | 'paidInstallments' | 'type' | 'category' | 'nextPaymentDate'> & { creditCardId?: number | null };
type UpdateInstallmentPayload = Partial<Omit<CreateInstallmentPayload, 'userId'>>;


function useInstallments() {
  const { token } = useAuthContext()
  const [installments, setInstallments] = useState<Installment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInstallments = useCallback(async () => {
    // ... (código existente de fetchInstallments, já corrigido)
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/installments", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Erro ao buscar parcelamentos" }));
        throw new Error(errorData.message || "Erro ao buscar parcelamentos");
      }
      const data = await res.json();
      setInstallments(Array.isArray(data) ? data : []); // API retorna array diretamente
    } catch (err: any) {
      setError(err.message);
      setInstallments([]); // Limpar em caso de erro
    } finally {
      setLoading(false);
    }
  }, [token])

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