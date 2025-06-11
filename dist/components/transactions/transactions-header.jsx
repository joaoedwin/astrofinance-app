"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsHeader = TransactionsHeader;
const input_1 = require("@/components/ui/input");
const select_1 = require("@/components/ui/select");
const new_transaction_button_1 = require("@/components/transactions/new-transaction-button");
const react_1 = require("react");
function TransactionsHeader({ search, onSearchChange, type, onTypeChange, category, onCategoryChange, order, onOrderChange, dateStart, onDateStartChange, dateEnd, onDateEndChange, categories }) {
    const [open, setOpen] = (0, react_1.useState)(false);
    return (<div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex w-full sm:w-auto items-center gap-2">
          <input_1.Input placeholder="Buscar transações..." className="w-full sm:w-[300px]" value={search} onChange={e => onSearchChange(e.target.value)}/>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-2">
          <input_1.Input type="date" className="w-[140px]" value={dateStart} onChange={e => onDateStartChange(e.target.value)} placeholder="Data inicial"/>
          <input_1.Input type="date" className="w-[140px]" value={dateEnd} onChange={e => onDateEndChange(e.target.value)} placeholder="Data final"/>
          <new_transaction_button_1.NewTransactionButton />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <select_1.Select value={type} onValueChange={onTypeChange}>
          <select_1.SelectTrigger className="w-full sm:w-[180px]">
            <select_1.SelectValue placeholder="Tipo"/>
          </select_1.SelectTrigger>
          <select_1.SelectContent>
            <select_1.SelectItem value="all">Todos os tipos</select_1.SelectItem>
            <select_1.SelectItem value="income">Receitas</select_1.SelectItem>
            <select_1.SelectItem value="expense">Despesas</select_1.SelectItem>
          </select_1.SelectContent>
        </select_1.Select>
        <select_1.Select value={category} onValueChange={onCategoryChange}>
          <select_1.SelectTrigger className="w-full sm:w-[180px]">
            <select_1.SelectValue placeholder="Categoria"/>
          </select_1.SelectTrigger>
          <select_1.SelectContent>
            {categories.map((cat) => (<select_1.SelectItem key={cat} value={cat}>{cat === "all" ? "Todas as categorias" : cat}</select_1.SelectItem>))}
          </select_1.SelectContent>
        </select_1.Select>
        <select_1.Select value={order} onValueChange={onOrderChange}>
          <select_1.SelectTrigger className="w-[160px]">
            <select_1.SelectValue placeholder="Ordenar por"/>
          </select_1.SelectTrigger>
          <select_1.SelectContent>
            <select_1.SelectItem value="newest">Mais recentes</select_1.SelectItem>
            <select_1.SelectItem value="oldest">Mais antigas</select_1.SelectItem>
            <select_1.SelectItem value="highest">Maior valor</select_1.SelectItem>
            <select_1.SelectItem value="lowest">Menor valor</select_1.SelectItem>
          </select_1.SelectContent>
        </select_1.Select>
      </div>
    </div>);
}
