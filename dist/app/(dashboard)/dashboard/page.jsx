"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DashboardPage;
const use_dashboard_data_1 = require("@/hooks/use-dashboard-data");
const dashboard_cards_1 = require("@/components/dashboard/dashboard-cards");
const overview_1 = require("@/components/dashboard/overview");
const recent_transactions_1 = require("@/components/dashboard/recent-transactions");
const react_1 = require("react");
function DashboardPage() {
    const [token, setToken] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        setToken(localStorage.getItem("token"));
    }, []);
    const { dashboard, reports, transactions, loading, error } = (0, use_dashboard_data_1.useDashboardData)(token || "");
    if (loading) {
        return <div className="flex justify-center items-center h-96">Carregando...</div>;
    }
    if (error) {
        return (<div className="flex flex-col items-center justify-center h-96 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">Erro ao carregar o dashboard</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80" onClick={() => window.location.reload()}>
          Tentar novamente
        </button>
      </div>);
    }
    return (<div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <dashboard_cards_1.DashboardCards currentBalance={dashboard?.currentBalance || 0} balanceChange={dashboard?.balanceChange || 0} monthlyIncome={dashboard?.monthlyIncome || 0} incomeChange={dashboard?.incomeChange || 0} monthlyExpenses={dashboard?.monthlyExpenses || 0} expensesChange={dashboard?.expensesChange || 0} highestExpense={dashboard?.highestExpense || 0} highestExpenseCategory={dashboard?.highestExpenseCategory}/>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-7">
          <overview_1.Overview />
        </div>
      </div>
        <div>
          <recent_transactions_1.RecentTransactions transactions={transactions}/>
      </div>
    </div>);
}
