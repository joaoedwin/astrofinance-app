export interface Category {
  id: string
  name: string
  type: "income" | "expense"
  color: string
  icon: string
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

export async function createCategory(name: string, type: "income" | "expense"): Promise<{ id: string, name: string }> {
  const response = await fetch("/api/categories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, type }),
  })

  if (!response.ok) {
    throw new Error("Erro ao criar categoria")
  }

  return response.json()
} 