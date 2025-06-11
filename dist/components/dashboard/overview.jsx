"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Overview = Overview;
const card_1 = require("@/components/ui/card");
const recharts_1 = require("recharts");
const recharts_2 = require("recharts");
const use_dashboard_data_1 = require("@/hooks/use-dashboard-data");
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57'];
function Overview() {
    const { dashboard, loading } = (0, use_dashboard_data_1.useDashboardData)(localStorage.getItem("token") || "");
    if (loading) {
        return (<div className="flex justify-center items-center h-[350px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>);
    }
    return (<div className="grid gap-4 md:grid-cols-2">
      <card_1.Card className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <card_1.CardHeader>
          <card_1.CardTitle>Evolução Financeira</card_1.CardTitle>
          <card_1.CardDescription>Histórico de receitas, despesas e saldo dos últimos 12 meses</card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="h-[350px]">
            <recharts_1.ResponsiveContainer width="100%" height="100%">
              <recharts_1.BarChart data={dashboard?.monthlyData || []}>
                <recharts_1.XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                <recharts_1.YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`}/>
                <recharts_1.Tooltip formatter={(value) => [`R$ ${value}`, undefined]} labelFormatter={(label) => `Mês: ${label}`}/>
                <recharts_1.Legend />
                <recharts_1.Bar dataKey="income" name="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]}/>
                <recharts_1.Bar dataKey="expenses" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]}/>
                <recharts_1.Bar dataKey="balance" name="Saldo" fill="#3b82f6" radius={[4, 4, 0, 0]}/>
              </recharts_1.BarChart>
            </recharts_1.ResponsiveContainer>
          </div>
        </card_1.CardContent>
      </card_1.Card>
      <card_1.Card className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <card_1.CardHeader>
          <card_1.CardTitle>Distribuição de Despesas</card_1.CardTitle>
          <card_1.CardDescription>Despesas por categoria no mês atual</card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="flex justify-center items-center h-[350px] w-full">
            {dashboard?.expensesByCategory && dashboard.expensesByCategory.length > 0 ? (<recharts_1.ResponsiveContainer width="100%" height={350}>
                <recharts_2.PieChart>
                  <recharts_2.Pie data={dashboard.expensesByCategory} cx="50%" cy="50%" labelLine={false} outerRadius={120} fill="#8884d8" dataKey="value" nameKey="category" label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}>
                    {dashboard.expensesByCategory.map((entry, index) => (<recharts_2.Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>))}
                  </recharts_2.Pie>
                  <recharts_1.Tooltip formatter={(value) => [`R$ ${value}`, undefined]}/>
                </recharts_2.PieChart>
              </recharts_1.ResponsiveContainer>) : (<div className="flex flex-col justify-center items-center h-full text-muted-foreground">
                <span>Nenhuma despesa encontrada para exibir o gráfico.</span>
                <span className="text-sm mt-2">Adicione despesas para ver a distribuição por categoria.</span>
              </div>)}
          </div>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
