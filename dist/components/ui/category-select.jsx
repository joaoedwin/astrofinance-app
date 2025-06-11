"use client";
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategorySelect = CategorySelect;
const React = __importStar(require("react"));
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/lib/utils");
const use_toast_1 = require("@/components/ui/use-toast");
const auth_context_1 = require("@/contexts/auth-context");
function CategorySelect({ value, onValueChange, categories, onAddCategory, placeholder = "Selecione a categoria", className, disabled = false, type }) {
    const [inputValue, setInputValue] = (0, react_1.useState)("");
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [showDropdown, setShowDropdown] = (0, react_1.useState)(false);
    const inputRef = (0, react_1.useRef)(null);
    const dropdownRef = (0, react_1.useRef)(null);
    const { toast } = (0, use_toast_1.useToast)();
    const { token } = (0, auth_context_1.useAuthContext)();
    const [open, setOpen] = React.useState(false);
    (0, react_1.useEffect)(() => {
        const selected = categories.find(cat => cat.value === value);
        setInputValue(selected ? selected.label : "");
    }, [value, categories]);
    (0, react_1.useEffect)(() => {
        if (showDropdown && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showDropdown]);
    (0, react_1.useEffect)(() => {
        if (showDropdown && dropdownRef.current) {
            const selectedIdx = categories.findIndex(cat => cat.value === value);
            if (selectedIdx >= 0) {
                const item = dropdownRef.current.children[selectedIdx];
                if (item)
                    item.scrollIntoView({ block: "nearest" });
            }
        }
    }, [showDropdown, value, categories]);
    const filteredCategories = inputValue.trim() === ""
        ? categories
        : categories.filter((category) => category.label.toLowerCase().includes(inputValue.toLowerCase()));
    const exists = categories.some((cat) => cat.label.toLowerCase() === inputValue.toLowerCase());
    const handleSelect = (cat) => {
        onValueChange(cat.value);
        setInputValue(cat.label);
        setShowDropdown(false);
    };
    const handleCreate = async () => {
        if (!inputValue.trim() || exists || loading)
            return;
        // Validar o nome da categoria
        if (inputValue.trim().length > 50) {
            toast({
                title: "Nome muito longo",
                description: "O nome da categoria deve ter no máximo 50 caracteres.",
                variant: "destructive",
            });
            return;
        }
        try {
            setLoading(true);
            // Usar tipo 'expense' como padrão
            const response = await fetch("/api/categories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: inputValue.trim(),
                    type: "expense" // Sempre enviar um tipo válido
                })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Erro ao criar categoria");
            }
            const newCategory = await response.json();
            // Mapear para o formato esperado pelo componente
            const category = {
                value: newCategory.id,
                label: newCategory.name,
            };
            if (onAddCategory) {
                onAddCategory(category);
            }
            onValueChange(category.value);
            setInputValue(category.label);
            setShowDropdown(false);
            toast({
                title: "Categoria criada",
                description: `A categoria "${newCategory.name}" foi criada com sucesso.`,
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Não foi possível criar a categoria";
            console.error("[CategorySelect] Erro ao criar categoria:", error);
            toast({
                title: "Erro ao criar categoria",
                description: errorMessage,
                variant: "destructive",
            });
        }
        finally {
            setLoading(false);
        }
    };
    const handleInputChange = (e) => {
        const newValue = e.target.value.substring(0, 50); // Limitar o comprimento
        setInputValue(newValue);
        setShowDropdown(true);
        // Se o valor exato for encontrado, seleciona a categoria
        const found = categories.find(cat => cat.label.toLowerCase() === newValue.toLowerCase());
        if (found) {
            onValueChange(found.value);
        }
    };
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (!exists && inputValue.trim()) {
                handleCreate();
            }
            else if (filteredCategories.length === 1) {
                handleSelect(filteredCategories[0]);
            }
        }
        else if (e.key === "Escape") {
            setShowDropdown(false);
        }
    };
    return (<div className={(0, utils_1.cn)("relative h-12", className)}>
      <input ref={inputRef} type="text" className="w-full rounded-md border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder={placeholder} value={inputValue} onChange={handleInputChange} onFocus={() => {
            setShowDropdown(true);
        }} onBlur={() => setTimeout(() => setShowDropdown(false), 150)} onKeyDown={handleKeyDown} disabled={disabled} autoComplete="off" style={{ background: inputValue ? "#fff" : undefined }}/>
      {showDropdown && (inputValue || filteredCategories.length > 0) && (<ul ref={dropdownRef} className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-auto">
          {filteredCategories.map(cat => (<li key={cat.value} className={(0, utils_1.cn)("px-4 py-2 cursor-pointer hover:bg-accent flex items-center justify-between", value === cat.value && "bg-accent text-primary")} onClick={() => handleSelect(cat)}>
              <span>{cat.label}</span>
              {value === cat.value && <lucide_react_1.Check className="h-4 w-4 text-primary"/>}
            </li>))}
          {!exists && inputValue.trim() && !loading && (<li className="px-4 py-2 cursor-pointer text-primary flex items-center gap-2 hover:bg-accent" onClick={handleCreate}>
              <lucide_react_1.PlusCircle className="h-4 w-4"/> Criar "{inputValue}"
            </li>)}
          {loading && (<li className="px-4 py-2 flex items-center gap-2 text-primary">
              <lucide_react_1.Loader2 className="h-4 w-4 animate-spin"/> Criando categoria...
            </li>)}
        </ul>)}
    </div>);
}
