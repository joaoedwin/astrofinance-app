import express from 'express'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import jwt from 'jsonwebtoken'
import { getDatabase } from './dist/lib/db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Verificar se as variáveis de ambiente estão definidas
if (!process.env.JWT_SECRET) {
  console.error('AVISO: JWT_SECRET não está definido nas variáveis de ambiente. Usando valor padrão (inseguro para produção).')
}

// Usar a variável de ambiente JWT_SECRET ou um valor padrão para desenvolvimento
const JWT_SECRET = process.env.JWT_SECRET || '99c30cac76ce9f79ba2cd54d472434d5a7eb36632c4b07d2329a3d187f3f7c23'

const app = express()
const port = process.env.PORT || 3001

// Middleware para processar JSON
app.use(express.json())

// Middleware para verificar o token JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' })
  }
}

// Rota para obter categorias
app.get('/api/categories', verifyToken, async (req, res) => {
  try {
    const db = await getDatabase()
    const categories = await db.all(
      'SELECT * FROM categories WHERE user_id = ?', 
      [req.user.id]
    )
    res.json(categories)
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    res.status(500).json({ error: 'Erro ao buscar categorias' })
  }
})

// Rota para criar categoria
app.post('/api/categories', verifyToken, async (req, res) => {
  try {
    const { name, type } = req.body
    
    // Validação básica
    if (!name || !type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Nome e tipo válido (income/expense) são obrigatórios' })
    }
    
    const db = await getDatabase()
    
    const result = await db.run(
      'INSERT INTO categories (name, type, user_id) VALUES (?, ?, ?)',
      [name, type, req.user.id]
    )
    
    const category = await db.get(
      'SELECT * FROM categories WHERE id = ?', 
      [result.lastID]
    )
    
    res.status(201).json(category)
  } catch (error) {
    console.error('Erro ao criar categoria:', error)
    res.status(500).json({ error: 'Erro ao criar categoria' })
  }
})

// Rota para obter transações
app.get('/api/transactions', verifyToken, async (req, res) => {
  try {
    const db = await getDatabase()
    const transactions = await db.all(
      'SELECT t.*, c.name as category_name FROM transactions t ' +
      'LEFT JOIN categories c ON t.category_id = c.id ' +
      'WHERE t.user_id = ? ORDER BY date DESC',
      [req.user.id]
    )
    res.json(transactions)
  } catch (error) {
    console.error('Erro ao buscar transações:', error)
    res.status(500).json({ error: 'Erro ao buscar transações' })
  }
})

// Rota para criar transação
app.post('/api/transactions', verifyToken, async (req, res) => {
  try {
    const { date, description, amount, type, category_id } = req.body
    
    // Validação básica
    if (!date || !description || !amount || !type || !category_id) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' })
    }
    
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Tipo deve ser income ou expense' })
    }
    
    const db = await getDatabase()
    
    // Verificar se a categoria pertence ao usuário
    const categoryExists = await db.get(
      'SELECT id FROM categories WHERE id = ? AND user_id = ?',
      [category_id, req.user.id]
    )
    
    if (!categoryExists) {
      return res.status(400).json({ error: 'Categoria inválida ou não pertence ao usuário' })
    }
    
    const result = await db.run(
      'INSERT INTO transactions (date, description, amount, type, category_id, user_id) VALUES (?, ?, ?, ?, ?, ?)',
      [date, description, amount, type, category_id, req.user.id]
    )
    
    const transaction = await db.get(
      'SELECT t.*, c.name as category_name FROM transactions t ' +
      'LEFT JOIN categories c ON t.category_id = c.id ' +
      'WHERE t.id = ?',
      [result.lastID]
    )
    
    res.status(201).json(transaction)
  } catch (error) {
    console.error('Erro ao criar transação:', error)
    res.status(500).json({ error: 'Erro ao criar transação' })
  }
})

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`)
}) 