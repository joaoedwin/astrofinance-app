"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsTable = TransactionsTable;
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const table_1 = require("@/components/ui/table");
const utils_1 = require("@/lib/utils");
function TransactionsTable({ transactions, onToggleType }) {
    const [editingId, setEditingId] = (0, react_1.useState)(null);
    const [editValues, setEditValues] = (0, react_1.useState)({});
    const [animatingId, setAnimatingId] = (0, react_1.useState)(null);
    const animationTimeout = (0, react_1.useRef)(null);
    const handleEdit = (transaction) => {
        setEditingId(transaction.id);
        setEditValues(transaction);
    };
    const handleSave = (id) => {
        // TODO: Implementar salvamento no banco
        setEditingId(null);
        setEditValues({});
    };
    const handleCancel = () => {
        setEditingId(null);
        setEditValues({});
    };
    return (<div className="rounded-md border">
      <table_1.Table>
        <table_1.TableHeader>
          <table_1.TableRow>
            <table_1.TableHead>Data</table_1.TableHead>
            <table_1.TableHead>Descrição</table_1.TableHead>
            <table_1.TableHead>Categoria</table_1.TableHead>
            <table_1.TableHead>Tipo</table_1.TableHead>
            <table_1.TableHead className="text-right">Valor</table_1.TableHead>
            <table_1.TableHead className="w-[100px]">Ações</table_1.TableHead>
          </table_1.TableRow>
        </table_1.TableHeader>
        <table_1.TableBody>
          {transactions.map((transaction) => (<table_1.TableRow key={transaction.id}>
              <table_1.TableCell>
                {editingId === transaction.id ? (<input_1.Input type="date" value={editValues.date ? new Date(editValues.date).toISOString().split("T")[0] : ""} onChange={(e) => setEditValues({ ...editValues, date: new Date(e.target.value) })}/>) : (new Date(transaction.date).toLocaleDateString("pt-BR"))}
              </table_1.TableCell>
              <table_1.TableCell>
                {editingId === transaction.id ? (<input_1.Input value={editValues.description || ""} onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}/>) : (transaction.description)}
              </table_1.TableCell>
              <table_1.TableCell>
                {editingId === transaction.id ? (<input_1.Input value={editValues.category || ""} onChange={(e) => setEditValues({ ...editValues, category: e.target.value })}/>) : (transaction.category)}
              </table_1.TableCell>
              <table_1.TableCell>
                <button type="button" className={`transition-all duration-300 px-2 py-1 rounded-full text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer border-none shadow-sm transform hover:scale-105 active:scale-95 transition-badge ${transaction.type === "income" ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"} ${animatingId === transaction.id ? "animate-badge" : ""}`} style={{ minWidth: 80 }} onClick={async () => {
                const newType = transaction.type === "income" ? "expense" : "income";
                if (onToggleType) {
                    await onToggleType(transaction.id, newType);
                }
                setAnimatingId(transaction.id);
                if (animationTimeout.current)
                    clearTimeout(animationTimeout.current);
                animationTimeout.current = setTimeout(() => setAnimatingId(null), 350);
            }}>
                  {transaction.type === "income" ? "Receita" : "Despesa"}
                </button>
              </table_1.TableCell>
              <table_1.TableCell className="text-right">
                {editingId === transaction.id ? (<input_1.Input type="number" value={editValues.amount || ""} onChange={(e) => setEditValues({ ...editValues, amount: Number(e.target.value) })}/>) : ((0, utils_1.formatCurrency)(transaction.amount))}
              </table_1.TableCell>
              <table_1.TableCell>
                {editingId === transaction.id ? (<div className="flex gap-2">
                    <button_1.Button size="sm" onClick={() => handleSave(transaction.id)}>
                      Salvar
                    </button_1.Button>
                    <button_1.Button size="sm" variant="outline" onClick={handleCancel}>
                      Cancelar
                    </button_1.Button>
                  </div>) : (<button_1.Button size="sm" variant="outline" onClick={() => handleEdit(transaction)}>
                    Editar
                  </button_1.Button>)}
              </table_1.TableCell>
            </table_1.TableRow>))}
        </table_1.TableBody>
      </table_1.Table>
    </div>);
}
<style jsx global>{`
  .transition-badge {
    transition: background-color 0.3s, color 0.3s, transform 0.2s, opacity 0.2s;
  }
  .animate-badge {
    animation: badgePulse 0.3s;
  }
  @keyframes badgePulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.15); opacity: 0.7; }
    100% { transform: scale(1); opacity: 1; }
  }
`}</style>;
