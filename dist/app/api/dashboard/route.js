"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const db_js_1 = require("@/lib/db.js");
// Função auxiliar para determinar o valor de uma transação ou instalação
function getItemAmount(item) {
    if ('amount' in item && typeof item.amount === 'number') {
        return item.amount;
    }
    if ('installmentAmount' in item && typeof item.installmentAmount === 'number') {
        return item.installmentAmount;
    }
    return 0;
}
// Função auxiliar para verificar o tipo da transação
function isTransactionType(type) {
    return type === 'income' || type === 'expense';
}
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const month = searchParams.get('month');
        const year = searchParams.get('year');
        if (!userId || !month || !year) {
            return server_1.NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
        }
        const db = (0, db_js_1.getDatabase)();
        // Busca transações do mês
        const monthTransactions = await db.all(`SELECT t.*, c.name as category 
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? AND strftime('%Y-%m', t.date) = ?`, [userId, `${year}-${month.padStart(2, '0')}`]);
        // Busca parcelas do mês
        const monthInstallments = await db.all(`SELECT i.*, c.name as category 
       FROM installments i
       LEFT JOIN categories c ON i.category_id = c.id
       WHERE i.userId = ? AND strftime('%Y-%m', i.nextPaymentDate) = ?`, [userId, `${year}-${month.padStart(2, '0')}`]);
        // Calcula totais do mês atual
        const totalIncome = monthTransactions
            .filter(t => isTransactionType(t.type) && t.type === 'income')
            .reduce((sum, t) => sum + getItemAmount(t), 0);
        const totalExpense = monthTransactions
            .filter(t => isTransactionType(t.type) && t.type === 'expense')
            .reduce((sum, t) => sum + getItemAmount(t), 0) +
            monthInstallments.reduce((sum, i) => sum + getItemAmount(i), 0);
        // Calcula despesas por categoria
        const expensesByCategory = [...monthTransactions, ...monthInstallments]
            .filter((item) => isTransactionType(item.type) && item.type === 'expense' && typeof item.category === 'string')
            .reduce((acc, item) => {
            const amount = getItemAmount(item);
            const existingCategory = acc.find(c => c.category === item.category);
            if (existingCategory) {
                existingCategory.amount += amount;
            }
            else {
                acc.push({
                    category: item.category,
                    amount,
                    percentage: 0
                });
            }
            return acc;
        }, [])
            .map(category => ({
            ...category,
            percentage: (category.amount / totalExpense) * 100
        }))
            .sort((a, b) => b.amount - a.amount);
        const currentMonthData = {
            transactions: monthTransactions,
            installments: monthInstallments,
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            expensesByCategory
        };
        // Busca dados do mês anterior para comparação
        const previousMonth = month === '1' ? '12' : String(Number(month) - 1).padStart(2, '0');
        const previousYear = month === '1' ? String(Number(year) - 1) : year;
        const previousMonthTransactions = await db.all(`SELECT t.*, c.name as category 
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? AND strftime('%Y-%m', t.date) = ?`, [userId, `${previousYear}-${previousMonth}`]);
        const previousMonthInstallments = await db.all(`SELECT i.*, c.name as category 
       FROM installments i
       LEFT JOIN categories c ON i.category_id = c.id
       WHERE i.userId = ? AND strftime('%Y-%m', i.nextPaymentDate) = ?`, [userId, `${previousYear}-${previousMonth}`]);
        const previousTotalIncome = previousMonthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + getItemAmount(t), 0);
        const previousTotalExpense = previousMonthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + getItemAmount(t), 0) +
            previousMonthInstallments.reduce((sum, i) => sum + getItemAmount(i), 0);
        const previousMonthData = {
            transactions: previousMonthTransactions,
            installments: previousMonthInstallments,
            totalIncome: previousTotalIncome,
            totalExpense: previousTotalExpense,
            balance: previousTotalIncome - previousTotalExpense,
            expensesByCategory: []
        };
        // Calcula dados mensais para o gráfico
        const monthlyData = [];
        for (let i = 11; i >= 0; i--) {
            const currentDate = new Date(Number(year), Number(month) - i - 1);
            const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
            const yearStr = String(currentDate.getFullYear());
            const transactions = await db.all(`SELECT t.*, c.name as category 
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = ? AND strftime('%Y-%m', t.date) = ?`, [userId, `${yearStr}-${monthStr}`]);
            const installments = await db.all(`SELECT i.*, c.name as category 
         FROM installments i
         LEFT JOIN categories c ON i.category_id = c.id
         WHERE i.userId = ? AND strftime('%Y-%m', i.nextPaymentDate) = ?`, [userId, `${yearStr}-${monthStr}`]);
            const income = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + getItemAmount(t), 0);
            const expenses = transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + getItemAmount(t), 0) +
                installments.reduce((sum, i) => sum + getItemAmount(i), 0);
            monthlyData.push({
                month: currentDate.toLocaleString('pt-BR', { month: 'short' }).toUpperCase(),
                income,
                expenses,
                balance: income - expenses
            });
        }
        const response = {
            currentMonth: currentMonthData,
            previousMonth: previousMonthData,
            trends: {
                income: previousTotalIncome ? ((totalIncome - previousTotalIncome) / previousTotalIncome) * 100 : 0,
                expense: previousTotalExpense ? ((totalExpense - previousTotalExpense) / previousTotalExpense) * 100 : 0,
                balance: previousMonthData.balance ? ((currentMonthData.balance - previousMonthData.balance) / Math.abs(previousMonthData.balance)) * 100 : 0
            },
            monthlyData
        };
        return server_1.NextResponse.json(response);
    }
    catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        return server_1.NextResponse.json({ error: 'Erro ao buscar dados do dashboard' }, { status: 500 });
    }
}
