"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BarChart = BarChart;
exports.LineChart = LineChart;
const react_1 = require("react");
const recharts_1 = require("recharts");
function BarChart({ data, index, categories, colors = ["#0369a1"], valueFormatter = (value) => value.toString(), loading = false, }) {
    const chartContainerRef = (0, react_1.useRef)(null);
    const [chartWidth, setChartWidth] = (0, react_1.useState)(0);
    (0, react_1.useEffect)(() => {
        if (chartContainerRef.current) {
            const resizeObserver = new ResizeObserver((entries) => {
                setChartWidth(entries[0].contentRect.width);
            });
            resizeObserver.observe(chartContainerRef.current);
            return () => {
                if (chartContainerRef.current) {
                    resizeObserver.unobserve(chartContainerRef.current);
                }
            };
        }
    }, []);
    if (loading) {
        return (<div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>);
    }
    if (!data || data.length === 0) {
        return (<div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>);
    }
    return (<div ref={chartContainerRef} className="w-full h-full">
      <recharts_1.ResponsiveContainer width="100%" height="100%">
        <recharts_1.BarChart data={data} margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: chartWidth < 500 ? 60 : 5,
        }}>
          <recharts_1.CartesianGrid strokeDasharray="3 3" opacity={0.2}/>
          <recharts_1.XAxis dataKey={index} angle={chartWidth < 500 ? -45 : 0} textAnchor={chartWidth < 500 ? "end" : "middle"} height={60} tick={{ fontSize: 12 }}/>
          <recharts_1.YAxis tick={{ fontSize: 12 }}/>
          <recharts_1.Tooltip formatter={(value) => [valueFormatter(value), ""]} contentStyle={{
            backgroundColor: "white",
            borderRadius: "6px",
            padding: "8px",
            border: "1px solid #e2e8f0",
        }}/>
          <recharts_1.Legend formatter={(value) => <span className="text-sm">{value}</span>}/>
          {categories.map((category, idx) => (<recharts_1.Bar key={category} dataKey={category} name={category} fill={colors[idx % colors.length]} radius={[4, 4, 0, 0]}/>))}
        </recharts_1.BarChart>
      </recharts_1.ResponsiveContainer>
    </div>);
}
function LineChart({ data, index, categories, colors = ["#0369a1"], valueFormatter = (value) => value.toString(), loading = false, }) {
    const chartContainerRef = (0, react_1.useRef)(null);
    const [chartWidth, setChartWidth] = (0, react_1.useState)(0);
    (0, react_1.useEffect)(() => {
        if (chartContainerRef.current) {
            const resizeObserver = new ResizeObserver((entries) => {
                setChartWidth(entries[0].contentRect.width);
            });
            resizeObserver.observe(chartContainerRef.current);
            return () => {
                if (chartContainerRef.current) {
                    resizeObserver.unobserve(chartContainerRef.current);
                }
            };
        }
    }, []);
    if (loading) {
        return (<div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>);
    }
    if (!data || data.length === 0) {
        return (<div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>);
    }
    return (<div ref={chartContainerRef} className="w-full h-full">
      <recharts_1.ResponsiveContainer width="100%" height="100%">
        <recharts_1.LineChart data={data} margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: chartWidth < 500 ? 60 : 5,
        }}>
          <recharts_1.CartesianGrid strokeDasharray="3 3" opacity={0.2}/>
          <recharts_1.XAxis dataKey={index} angle={chartWidth < 500 ? -45 : 0} textAnchor={chartWidth < 500 ? "end" : "middle"} height={60} tick={{ fontSize: 12 }}/>
          <recharts_1.YAxis tick={{ fontSize: 12 }}/>
          <recharts_1.Tooltip formatter={(value) => [valueFormatter(value), ""]} contentStyle={{
            backgroundColor: "white",
            borderRadius: "6px",
            padding: "8px",
            border: "1px solid #e2e8f0",
        }}/>
          <recharts_1.Legend formatter={(value) => <span className="text-sm">{value}</span>}/>
          {categories.map((category, idx) => (<recharts_1.Line key={category} type="monotone" dataKey={category} name={category} stroke={colors[idx % colors.length]} dot={{ r: 4 }} activeDot={{ r: 6 }}/>))}
        </recharts_1.LineChart>
      </recharts_1.ResponsiveContainer>
    </div>);
}
