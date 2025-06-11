"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TransactionsPage;
const headers_1 = require("next/headers");
const db_1 = require("@/lib/db");
const transactions_client_1 = require("@/components/transactions/transactions-client");
const jsonwebtoken_1 = require("jsonwebtoken");
function TransactionsPage() {
    const cookieStore = (0, headers_1.cookies)();
    const cookieToken = cookieStore.get("token")?.value;
    const jwtToken = cookieStore.get("jwt")?.value;
    const authToken = cookieToken || jwtToken;
    let allTransactions = [];
    console.log("[TRANSACTIONS] Verificando token de auth:", !!authToken);
    try {
        const db = (0, db_1.getDatabase)();
        if (authToken) {
            try {
                const decoded = (0, jsonwebtoken_1.verify)(authToken, process.env.JWT_SECRET || "your-secret-key");
                const userId = decoded.userId;
                console.log("[TRANSACTIONS] Usuário autenticado com ID:", userId);
                const rawUserTransactions = db.prepare(`
          SELECT t.*, c.name as category_name, c.id as category_id
          FROM transactions t
          JOIN categories c ON t.category_id = c.id
          WHERE t.user_id = ?
          ORDER BY t.date DESC
        `).all(userId);
                allTransactions = rawUserTransactions.map(tx => ({
                    id: tx.id,
                    date: new Date(tx.date),
                    description: tx.description,
                    amount: Number(tx.amount),
                    type: tx.type,
                    category: tx.category_name,
                    category_id: tx.category_id
                }));
                console.log(`[TRANSACTIONS] Usando ${allTransactions.length} transações do usuário autenticado`);
            }
            catch (error) {
                console.error("[TRANSACTIONS] Erro ao verificar token:", error);
            }
        }
    }
    catch (err) {
        console.error("[TRANSACTIONS] Erro ao acessar banco de dados:", err);
    }
    return (<div className="flex flex-col gap-4">
      <transactions_client_1.TransactionsClient transactions={allTransactions}/>
    </div>);
}
