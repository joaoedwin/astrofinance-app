import { getDatabase } from "../lib/db"
import { randomUUID } from "crypto"

async function main() {
  try {
    console.log("Inicializando banco de dados...")
    const db = getDatabase()
    
    // Inserir categorias padrão
    const defaultCategories = [
      { name: "Salário", type: "income" },
      { name: "Investimentos", type: "income" },
      { name: "Alimentação", type: "expense" },
      { name: "Moradia", type: "expense" },
      { name: "Transporte", type: "expense" },
      { name: "Saúde", type: "expense" },
      { name: "Educação", type: "expense" },
      { name: "Lazer", type: "expense" },
      { name: "Outros", type: "expense" }
    ]

    for (const category of defaultCategories) {
      db.prepare("INSERT OR IGNORE INTO categories (id, name, type, user_id) VALUES (?, ?, ?, ?)")
        .run(randomUUID(), category.name, category.type, "system")
    }

    console.log("Banco de dados inicializado com sucesso!")
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error)
    process.exit(1)
  }
}

main() 