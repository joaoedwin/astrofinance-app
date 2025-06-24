import { NextResponse } from "next/server"
import { getDatabase, randomUUID } from "@/lib/db"
import { verify } from "jsonwebtoken"
import { getUserById } from "@/lib/auth"

// Forçar renderização dinâmica para evitar problemas de 404
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    // Verificar autenticação
    const token = request.headers.get("Authorization")?.split(" ")[1]
    if (!token) {
      console.error("[API] Token não fornecido")
      return NextResponse.json({ message: "Token não fornecido" }, { status: 401 })
    }

    try {
      const decoded = verify(token, process.env.JWT_SECRET || "your-secret-key") as { userId: string }
      const user = await getUserById(decoded.userId)
      if (!user) {
        console.error("[API] Usuário não encontrado")
        return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 })
      }

      const db = getDatabase()
      // Buscar tanto as categorias do usuário quanto as categorias "default" (sem filtrar por tipo)
      const query = "SELECT * FROM categories WHERE user_id = ? OR user_id = 'default' ORDER BY name"
      const params = [user.id]

      const categories = db.prepare(query).all(...params)
      
      return NextResponse.json(categories)
    } catch (error) {
      console.error("[API] Erro na verificação do token:", error)
      return NextResponse.json({ message: "Token inválido" }, { status: 401 })
    }
  } catch (error) {
    console.error("[API] Erro ao buscar categorias:", error)
    return NextResponse.json(
      { message: "Erro ao buscar categorias" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Verificar autenticação
    const token = request.headers.get("Authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ message: "Token não fornecido" }, { status: 401 })

    const decoded = verify(token, process.env.JWT_SECRET || "your-secret-key") as { userId: string }
    const user = await getUserById(decoded.userId)
    if (!user) return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 })
    
    const body = await request.json()
    // Define o tipo padrão como 'expense' se não for fornecido
    const { name, type = "expense", color, icon } = body
    
    // Validação e sanitização dos dados
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ message: "Nome é obrigatório e deve ser uma string válida" }, { status: 400 })
    }
    
    const sanitizedName = name.trim().substring(0, 50).replace(/[<>"']/g, "")
    const validatedColor = color && typeof color === 'string' && color.match(/^#[0-9A-Fa-f]{6}$/)
      ? color
      : "#" + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
    
    const validatedIcon = icon && typeof icon === 'string' && icon.trim().length > 0
      ? icon.trim().substring(0, 20).replace(/[<>"']/g, "")
      : "tag"
    
    const db = getDatabase()
    const id = randomUUID()
    const now = new Date().toISOString()
    
    // Verificar limite de categorias por usuário
    const categoryCount = db.prepare(
      `SELECT COUNT(*) as count FROM categories WHERE user_id = ?`
    ).get(user.id) as { count: number }
    
    const MAX_CATEGORIES = 50
    if (categoryCount && categoryCount.count >= MAX_CATEGORIES) {
      return NextResponse.json(
        { message: `Limite de ${MAX_CATEGORIES} categorias atingido` },
        { status: 400 }
      )
    }
    
    // Verificar se a categoria já existe para este usuário
    const existingCategory = db.prepare(
      "SELECT * FROM categories WHERE user_id = ? AND name = ?"
    ).get(user.id, sanitizedName)
    
    if (existingCategory) {
      return NextResponse.json(
        { message: `Já existe uma categoria '${sanitizedName}'` },
        { status: 400 }
      )
    }
    
    // Inserir categoria - garantir que type seja 'income' ou 'expense'
    const finalType = ["income", "expense"].includes(type) ? type : "expense";
    
    db.prepare(
      "INSERT INTO categories (id, name, type, color, icon, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(id, sanitizedName, finalType, validatedColor, validatedIcon, user.id, now, now)
    
    const category = db.prepare("SELECT * FROM categories WHERE id = ?").get(id)
    
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("[API] Erro ao criar categoria:", error)
    return NextResponse.json(
      { message: "Erro ao criar categoria" },
      { status: 500 }
    )
  }
}

// Simplificar o método PUT também
export async function PUT(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ message: "Token não fornecido" }, { status: 401 })

    const decoded = verify(token, process.env.JWT_SECRET || "your-secret-key") as { userId: string }
    const user = await getUserById(decoded.userId)
    if (!user) return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 })
    
    const body = await request.json()
    const { id, name } = body
    
    // Validação dos dados
    if (!id) {
      return NextResponse.json({ message: "ID da categoria é obrigatório" }, { status: 400 })
    }
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ message: "Nome é obrigatório e deve ser uma string válida" }, { status: 400 })
    }
    
    const sanitizedName = name.trim().substring(0, 50).replace(/[<>"']/g, "")
    
    const db = getDatabase()
    const now = new Date().toISOString()
    
    // Verificar se a categoria existe e pertence ao usuário
    const category = db.prepare(
      "SELECT * FROM categories WHERE id = ? AND user_id = ?"
    ).get(id, user.id)
    
    if (!category) {
      return NextResponse.json({ message: "Categoria não encontrada" }, { status: 404 })
    }
    
    // Atualizar apenas o nome
    db.prepare(
      "UPDATE categories SET name = ?, updated_at = ? WHERE id = ? AND user_id = ?"
    ).run(sanitizedName, now, id, user.id)
    
    const updatedCategory = db.prepare("SELECT * FROM categories WHERE id = ?").get(id)
    
    return NextResponse.json(updatedCategory)
  } catch (error) {
    console.error("[API] Erro ao atualizar categoria:", error)
    return NextResponse.json({ message: "Erro ao atualizar categoria" }, { status: 500 })
  }
}

// Adicionar endpoint DELETE para excluir categorias
export async function DELETE(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ message: "Token não fornecido" }, { status: 401 })

    const decoded = verify(token, process.env.JWT_SECRET || "your-secret-key") as { userId: string }
    const user = await getUserById(decoded.userId)
    if (!user) return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 })
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json({ message: "ID da categoria é obrigatório" }, { status: 400 })
    }
    
    const db = getDatabase()
    
    // Verificar se a categoria existe e pertence ao usuário
    const category = db.prepare(
      "SELECT * FROM categories WHERE id = ? AND user_id = ?"
    ).get(id, user.id)
    
    if (!category) {
      return NextResponse.json({ message: "Categoria não encontrada" }, { status: 404 })
    }
    
    // Verificar se existem transações usando esta categoria
    const transactionsCount = db.prepare(
      "SELECT COUNT(*) as count FROM transactions WHERE category_id = ?"
    ).get(id) as { count: number }
    
    if (transactionsCount && transactionsCount.count > 0) {
      return NextResponse.json(
        { message: "Não é possível excluir uma categoria que possui transações associadas" },
        { status: 400 }
      )
    }
    
    // Verificar se existem parcelamentos usando esta categoria
    const installmentsCount = db.prepare(
      "SELECT COUNT(*) as count FROM installments WHERE category_id = ?"
    ).get(id) as { count: number }
    
    if (installmentsCount && installmentsCount.count > 0) {
      return NextResponse.json(
        { message: "Não é possível excluir uma categoria que possui parcelamentos associados" },
        { status: 400 }
      )
    }
    
    // Excluir a categoria
    db.prepare("DELETE FROM categories WHERE id = ? AND user_id = ?").run(id, user.id)
    
    return NextResponse.json({ message: "Categoria excluída com sucesso" })
  } catch (error) {
    console.error("[API] Erro ao excluir categoria:", error)
    return NextResponse.json({ message: "Erro ao excluir categoria" }, { status: 500 })
  }
} 