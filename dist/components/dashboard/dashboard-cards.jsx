"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardCards = DashboardCards;
const card_1 = require("@/components/ui/card");
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/lib/utils");
const react_1 = require("react");
function DashboardCards(props) {
    const { currentBalance, balanceChange, monthlyIncome, incomeChange, monthlyExpenses, expensesChange, highestExpense, highestExpenseCategory } = props;
    // Memoizar os valores para evitar re-renderizações desnecessárias
    const cards = (0, react_1.useMemo)(() => ([
        {
            title: "Saldo Atual",
            value: (0, utils_1.formatCurrency)(currentBalance),
            change: `${balanceChange > 0 ? "+" : ""}${balanceChange.toFixed(1)}% em relação ao mês anterior`,
            icon: <lucide_react_1.DollarSign className="h-4 w-4 text-muted-foreground"/>,
        },
        {
            title: "Receitas (Mês)",
            value: (0, utils_1.formatCurrency)(monthlyIncome),
            change: `${incomeChange > 0 ? "+" : ""}${incomeChange.toFixed(1)}% em relação ao mês anterior`,
            icon: <lucide_react_1.ArrowUpIcon className="h-4 w-4 text-emerald-500"/>,
        },
        {
            title: "Despesas (Mês)",
            value: (0, utils_1.formatCurrency)(monthlyExpenses),
            change: `${expensesChange > 0 ? "+" : ""}${expensesChange.toFixed(1)}% em relação ao mês anterior`,
            icon: <lucide_react_1.ArrowDownIcon className="h-4 w-4 text-rose-500"/>,
        },
        {
            title: "Maior Gasto",
            value: (0, utils_1.formatCurrency)(highestExpense),
            change: highestExpenseCategory ? `Categoria: ${highestExpenseCategory}` : "Maior despesa do mês",
            icon: <lucide_react_1.TrendingDown className="h-4 w-4 text-muted-foreground"/>,
        },
    ]), [currentBalance, balanceChange, monthlyIncome, incomeChange, monthlyExpenses, expensesChange, highestExpense, highestExpenseCategory]);
    return (<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => (<card_1.Card key={card.title} className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <card_1.CardTitle className="text-sm font-medium">{card.title}</card_1.CardTitle>
            {card.icon}
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.change}</p>
          </card_1.CardContent>
        </card_1.Card>))}
    </div>);
}
