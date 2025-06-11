import { NextResponse } from "next/server"
import { verify } from "jsonwebtoken"
import { getUserById } from "@/lib/auth"
import { getDatabase } from "@/lib/db"

interface DBInstallment {
  id: string
  description: string
  startDate: string
  totalInstallments: number
  installmentAmount: number
  totalAmount: number
  paidInstallments: number
  creditCardId?: string
  category: string
  categoryColor: string
  categoryIcon: string
  creditCardName?: string
  creditCardColor?: string
}

interface DBTransaction {
  id: string
  date: string
  description: string
  amount: number
  type: "income" | "expense"
  category: string
  categoryColor: string
  categoryIcon: string
  user_id: string
}

interface InvoiceItem {
  id: string
  date: Date
  description: string
  category: string
  categoryColor: string
  categoryIcon: string
  installmentNumber: number
  totalInstallments: number
  installmentAmount: number
  totalAmount: number
  creditCardId?: string
  creditCardName?: string
  creditCardColor?: string
  type: "installment"
  year: number
  startDate: string
}

interface FormattedTransaction {
  id: string
  date: Date
  description: string
  category: string
  categoryColor: string
  categoryIcon: string
  amount: number
  type: "expense" | "income"
  year: number
}

interface CategoryExpense {
  total: number
  color: string
}

interface CategoryExpenses {
  [category: string]: CategoryExpense
}

interface UserDataCount {
  installmentsCount: number
  transactionsCount: number
}

interface DataInfo {
  hasRealData: boolean
  totalDataCount: UserDataCount
  currentMonthCount: UserDataCount
}

interface InvoiceSummary {
  totalExpenses: number
  totalIncome: number
  totalInstallments: number
  balance: number
}

interface InvoiceResponse {
  invoiceItems: InvoiceItem[]
  transactions: FormattedTransaction[]
  summary: InvoiceSummary
  expensesByCategory: CategoryExpenses
  dataInfo: DataInfo
}

interface AllInstallment {
  id: string
  description: string
  startDate: string
  totalInstallments: number
  installmentAmount: number
}

export async function GET(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json(
        { message: "Token não fornecido", code: "TOKEN_MISSING" },
        { status: 401 }
      )
    }

    try {
      const decoded = verify(token, process.env.JWT_SECRET || "your-secret-key") as { userId: string }
      const user = await getUserById(decoded.userId)
      if (!user) {
        return NextResponse.json(
          { message: "Usuário não encontrado", code: "USER_NOT_FOUND" },
          { status: 404 }
        )
      }

      // Obter parâmetros de consulta
      const { searchParams } = new URL(request.url)
      const month = searchParams.get("month") || new Date().getMonth() + 1
      const year = searchParams.get("year") || new Date().getFullYear()
      
      // Converter para números para facilitar a comparação
      const monthInt = parseInt(month.toString())
      const yearInt = parseInt(year.toString())
      
      console.log(`Buscando transações para o mês ${monthInt}/${yearInt} para o usuário ID: ${user.id}`)
      
      const db = getDatabase()
      
      // 1. Verificar se existem dados no banco de dados para o usuário
      interface UserDataResult {
        installmentsCount: number
        transactionsCount: number
      }

      const userHasData = db.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM installments WHERE userId = ?) as installmentsCount,
          (SELECT COUNT(*) FROM transactions WHERE user_id = ?) as transactionsCount
      `).get(user.id, user.id) as UserDataResult
      
      console.log("Verificação de dados do usuário:", userHasData)
      
      // Buscar todas as parcelas para verificação
      const allInstallments = db.prepare(`
        SELECT 
          i.id, 
          i.description, 
          i.startDate,
          i.totalInstallments,
          i.installmentAmount
        FROM installments i
        WHERE i.userId = ?
      `).all(user.id) as AllInstallment[]
      
      // Log de debug para verificar o formato das datas
      if (allInstallments.length > 0) {
        console.log("DEBUG - Exemplo de data da primeira parcela:", {
          original: allInstallments[0].startDate,
          asDateObject: new Date(allInstallments[0].startDate),
          month: new Date(allInstallments[0].startDate).getMonth() + 1,
          year: new Date(allInstallments[0].startDate).getFullYear()
        })
      }
      
      // 2. Buscar parcelas (todas)
      const installments = db.prepare(`
        SELECT 
          i.id, 
          i.description, 
          i.totalAmount, 
          i.installmentAmount, 
          i.totalInstallments, 
          i.paidInstallments,
          i.startDate,
          i.creditCardId,
          c.name as category,
          c.color as categoryColor,
          c.icon as categoryIcon,
          cc.name as creditCardName,
          cc.color as creditCardColor
        FROM installments i
        JOIN categories c ON i.category_id = c.id
        LEFT JOIN credit_cards cc ON i.creditCardId = cc.id
        WHERE i.userId = ?
        ORDER BY i.startDate DESC
      `).all(user.id) as DBInstallment[]
      
      // 3. Buscar transações regulares do mês/ano específico
      // Nota: Quando filtrar por mês específico, não filtrar pelo ano (as datas estão em 2025)
      const transactions = db.prepare(`
        SELECT 
          t.id, 
          t.date,
          t.description, 
          t.amount,
          t.type,
          c.name as category,
          c.color as categoryColor,
          c.icon as categoryIcon,
          t.user_id
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ?
        AND strftime('%m', t.date) = ?
        ORDER BY t.date DESC
      `).all(user.id, monthInt.toString().padStart(2, '0')) as DBTransaction[]
      
      console.log(`Dados brutos: ${installments.length} parcelas e ${transactions.length} transações para o mês ${monthInt}`)
      
      // Verificação completa de todas as transações
      const allTransactions = db.prepare(`
        SELECT COUNT(*) as total, strftime('%m', date) as month 
        FROM transactions 
        WHERE user_id = ? 
        GROUP BY month
      `).all(user.id)
      
      console.log("Distribuição de transações por mês:", allTransactions)
      
      // Verificar explicitamente as transações encontradas
      if (transactions.length > 0) {
        const firstTransaction = transactions[0]
        console.log("Exemplo de transação encontrada:", {
          ...firstTransaction,
          date_parsed: new Date(firstTransaction.date).toISOString(),
          user_id: firstTransaction.user_id
        })
      } else {
        console.log("Nenhuma transação encontrada. Parâmetros de busca:", {
          user_id: user.id,
          month: monthInt.toString().padStart(2, '0'), 
          year: yearInt
        })
        
        // Verificar se há transações com outras datas
        interface SampleTransaction {
          id: string
          date: string
          description: string
          user_id: string
        }
        
        const sampleTransaction = db.prepare("SELECT id, date, description, user_id FROM transactions WHERE user_id = ? LIMIT 1").get(user.id) as SampleTransaction | undefined
        if (sampleTransaction) {
          const sampleDate = new Date(sampleTransaction.date)
          console.log("Exemplo de transação do usuário:", {
            ...sampleTransaction, 
            date_month: sampleDate.getMonth() + 1,
            date_month_string: (sampleDate.getMonth() + 1).toString(),
            date_month_padded: (sampleDate.getMonth() + 1).toString().padStart(2, '0')
          })
        }
      }
      
      // 4. Transformar os dados para o formato esperado pela UI
      const invoiceItems = installments.flatMap((installment: DBInstallment): InvoiceItem[] => {
        try {
          const startDate = new Date(installment.startDate)
          const startMonth = startDate.getMonth() + 1
          const startYear = startDate.getFullYear()
          
          console.log(`Processando parcela "${installment.description}" (ID: ${installment.id}): início ${startMonth}/${startYear}, total ${installment.totalInstallments} parcelas`);
          
          // Calcular a diferença em meses entre a data de início e o mês/ano solicitado
          const monthsDiff = (yearInt - startYear) * 12 + (monthInt - startMonth)
          const currentInstallmentNumber = monthsDiff + 1
          
          // Se a parcela ainda não começou ou já terminou, não incluir
          if (currentInstallmentNumber < 1 || currentInstallmentNumber > installment.totalInstallments) {
            console.log(`Parcela "${installment.description}" (ID: ${installment.id}) fora do range: diff=${monthsDiff}, total=${installment.totalInstallments}`);
            return []
          }
          
          // Calcular a data da parcela atual
          const parcela = new Date(startYear, startMonth - 1 + monthsDiff, startDate.getDate())
          
          console.log(`Parcela "${installment.description}" (ID: ${installment.id}) incluída: parcela ${currentInstallmentNumber}/${installment.totalInstallments}`);
          
          return [{
            id: `${installment.id}-${currentInstallmentNumber}`,
            date: parcela,
            description: installment.description,
            category: installment.category,
            categoryColor: installment.categoryColor,
            categoryIcon: installment.categoryIcon,
            installmentNumber: currentInstallmentNumber,
            totalInstallments: installment.totalInstallments,
            installmentAmount: installment.installmentAmount,
            totalAmount: installment.totalAmount,
            creditCardId: installment.creditCardId,
            creditCardName: installment.creditCardName,
            creditCardColor: installment.creditCardColor,
            type: "installment",
            year: parcela.getFullYear(),
            startDate: installment.startDate
          }]
        } catch (err) {
          console.error(`Erro processando parcela ${installment.id}:`, err)
          return []
        }
      })

      // Remover duplicatas baseado no ID da parcela
      const uniqueInvoiceItems = Array.from(new Map(invoiceItems.map(item => [item.id, item])).values())
      
      console.log(`Após processamento e remoção de duplicatas: ${uniqueInvoiceItems.length} parcelas para o mês ${monthInt}`)
      
      // 5. Transformar as transações para o mesmo formato
      const formattedTransactions = transactions
        .map((transaction: DBTransaction): FormattedTransaction | null => {
          try {
            const transactionDate = new Date(transaction.date)
            return {
              id: transaction.id,
              date: transactionDate,
              description: transaction.description,
              category: transaction.category,
              categoryColor: transaction.categoryColor,
              categoryIcon: transaction.categoryIcon,
              amount: transaction.amount,
              type: transaction.type === "expense" ? "expense" : "income",
              year: transactionDate.getFullYear()
            }
          } catch (err) {
            console.error(`Erro processando transação ${transaction.id}:`, err)
            return null
          }
        })
        .filter((t): t is FormattedTransaction => t !== null)
      
      console.log(`Transações formatadas: ${formattedTransactions.length}`)
      
      // 6. Calcular totais para o mês
      const totalExpenses = formattedTransactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0)
      
      const totalIncome = formattedTransactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0)
      
      const totalInstallments = uniqueInvoiceItems
        .reduce((sum, item) => sum + item.installmentAmount, 0)
      
      // 7. Agrupar por categoria para gráficos
      const expensesByCategory = [...formattedTransactions, ...uniqueInvoiceItems]
        .filter(item => item.type !== "income")
        .reduce<CategoryExpenses>((acc, item) => {
          const amount = 'amount' in item ? item.amount : item.installmentAmount
          if (!acc[item.category]) {
            acc[item.category] = {
              total: 0,
              color: item.categoryColor
            }
          }
          acc[item.category].total += amount
          return acc
        }, {})

      const response: InvoiceResponse = {
        invoiceItems: uniqueInvoiceItems,
        transactions: formattedTransactions,
        summary: {
          totalExpenses,
          totalIncome,
          totalInstallments,
          balance: totalIncome - totalExpenses - totalInstallments
        },
        expensesByCategory,
        dataInfo: {
          hasRealData: userHasData.installmentsCount > 0 || userHasData.transactionsCount > 0,
          totalDataCount: {
            installmentsCount: userHasData.installmentsCount,
            transactionsCount: userHasData.transactionsCount
          },
          currentMonthCount: {
            installmentsCount: uniqueInvoiceItems.length,
            transactionsCount: formattedTransactions.length
          }
        }
      }

      return NextResponse.json(response)
    } catch (verifyError) {
      console.error("Erro ao verificar token:", verifyError)
      if (verifyError instanceof Error && verifyError.message.includes("jwt expired")) {
        return NextResponse.json(
          { 
            message: "Token expirado", 
            code: "TOKEN_EXPIRED",
            expiredAt: (verifyError as any).expiredAt 
          },
          { status: 401 }
        )
      }
      return NextResponse.json(
        { message: "Token inválido", code: "TOKEN_INVALID" },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error("Erro ao buscar faturas:", error)
    return NextResponse.json(
      { 
        message: "Erro ao buscar faturas", 
        error: (error as Error).message,
        code: "INTERNAL_ERROR"
      },
      { status: 500 }
    )
  }
}
