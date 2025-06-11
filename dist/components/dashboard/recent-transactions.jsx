"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecentTransactions = RecentTransactions;
const table_1 = require("@/components/ui/table");
const badge_1 = require("@/components/ui/badge");
const utils_1 = require("@/lib/utils");
const react_1 = require("react");
function RecentTransactions({ transactions }) {
    // Memoizar as 5 transações mais recentes
    const recent = (0, react_1.useMemo)(() => {
        return [...transactions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [transactions]);
    return (<table_1.Table>
      <table_1.TableHeader>
        <table_1.TableRow>
          <table_1.TableHead>Data</table_1.TableHead>
          <table_1.TableHead>Descrição</table_1.TableHead>
          <table_1.TableHead>Categoria</table_1.TableHead>
          <table_1.TableHead>Tipo</table_1.TableHead>
          <table_1.TableHead className="text-right">Valor</table_1.TableHead>
        </table_1.TableRow>
      </table_1.TableHeader>
      <table_1.TableBody>
        {recent.map((transaction) => (<table_1.TableRow key={transaction.id}>
            <table_1.TableCell>{(0, utils_1.formatDate)(transaction.date)}</table_1.TableCell>
            <table_1.TableCell>{transaction.description}</table_1.TableCell>
            <table_1.TableCell>{transaction.category}</table_1.TableCell>
            <table_1.TableCell>
              <badge_1.Badge variant={transaction.type === "income" ? "outline" : "destructive"} className={transaction.type === "income"
                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700"
                : ""}>
                {transaction.type === "income" ? "Receita" : "Despesa"}
              </badge_1.Badge>
            </table_1.TableCell>
            <table_1.TableCell className="text-right">
              <span className={transaction.type === "income" ? "text-emerald-600" : "text-rose-600"}>
                {transaction.type === "income" ? "+" : "-"}
                {(0, utils_1.formatCurrency)(transaction.amount)}
              </span>
            </table_1.TableCell>
          </table_1.TableRow>))}
      </table_1.TableBody>
    </table_1.Table>);
}
