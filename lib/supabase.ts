export interface Category {
  id: string
  name: string
  type: "income" | "expense"
  color: string
  icon: string
  userId: string
}

export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: "income" | "expense"
  categoryId: string
  userId: string
}

export async function getCategories(userId: string, type?: "income" | "expense"): Promise<Category[]> {
  const params = new URLSearchParams({ userId })
  if (type) {
    params.append("type", type)
  }

  const response = await fetch(`/api/categories?${params.toString()}`)
  if (!response.ok) {
    throw new Error("Erro ao buscar categorias")
  }

  return response.json()
}

export async function createCategory(name: string, type: "income" | "expense"): Promise<Category> {
  const response = await fetch("/api/categories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, type }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Erro ao criar categoria")
  }

  return response.json()
}

export async function createTransaction({
  amount,
  date,
  description,
  type,
  categoryId,
}: {
  amount: number
  date: string
  description: string
  type: "income" | "expense"
  categoryId: string
}): Promise<Transaction> {
  const response = await fetch("/api/transactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount, date, description, type, categoryId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Erro ao criar transação")
  }

  return response.json()
} 