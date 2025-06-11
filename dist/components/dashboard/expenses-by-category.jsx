"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpensesByCategory = ExpensesByCategory;
const recharts_1 = require("recharts");
const react_1 = require("react");
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];
function ExpensesByCategory({ data, loading }) {
    const chartData = (0, react_1.useMemo)(() => Array.isArray(data) ? data : [], [data]);
    if (loading) {
        return (<div className="flex justify-center items-center h-[350px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>);
    }
    if (!chartData || chartData.length === 0) {
        return (<div className="flex flex-col justify-center items-center h-[350px] text-muted-foreground">
        <span>Nenhuma despesa encontrada para exibir o gráfico.</span>
      </div>);
    }
    return (<recharts_1.ResponsiveContainer width="100%" height={350}>
      <recharts_1.PieChart>
        <recharts_1.Pie data={chartData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
          {(chartData ?? []).map((entry, index) => (<recharts_1.Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>))}
        </recharts_1.Pie>
        <recharts_1.Tooltip formatter={(value) => [`R$ ${value}`, undefined]}/>
      </recharts_1.PieChart>
    </recharts_1.ResponsiveContainer>);
}
