"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategorySettings = CategorySettings;
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const table_1 = require("@/components/ui/table");
const dialog_1 = require("@/components/ui/dialog");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const lucide_react_1 = require("lucide-react");
const use_toast_1 = require("@/components/ui/use-toast");
const auth_context_1 = require("@/contexts/auth-context");
const alert_dialog_1 = require("@/components/ui/alert-dialog");
function CategorySettings() {
    const [categories, setCategories] = (0, react_1.useState)([]);
    const [filteredCategories, setFilteredCategories] = (0, react_1.useState)([]);
    const [open, setOpen] = (0, react_1.useState)(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = (0, react_1.useState)(false);
    const [editingCategory, setEditingCategory] = (0, react_1.useState)(null);
    const [deletingCategory, setDeletingCategory] = (0, react_1.useState)(null);
    const [name, setName] = (0, react_1.useState)("");
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [filterText, setFilterText] = (0, react_1.useState)("");
    const { toast } = (0, use_toast_1.useToast)();
    const { token } = (0, auth_context_1.useAuthContext)();
    const [saving, setSaving] = (0, react_1.useState)(false);
    // Filtrar categorias por texto
    (0, react_1.useEffect)(() => {
        let result = [...categories];
        // Filtrar por texto
        if (filterText) {
            result = result.filter(cat => cat.name.toLowerCase().includes(filterText.toLowerCase()));
        }
        // Ordenar por nome
        result.sort((a, b) => a.name.localeCompare(b.name));
        setFilteredCategories(result);
    }, [categories, filterText]);
    (0, react_1.useEffect)(() => {
        if (token) {
            loadCategories();
        }
    }, [token]);
    const loadCategories = async () => {
        if (!token)
            return;
        setLoading(true);
        try {
            // Buscamos todas as categorias sem filtrar por tipo
            const response = await fetch("/api/categories", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Erro ao buscar categorias");
            }
            const data = await response.json();
            console.log("Categorias carregadas:", data);
            setCategories(data);
        }
        catch (error) {
            console.error("Erro ao carregar categorias:", error);
            toast({
                title: "Erro ao carregar categorias",
                description: "Não foi possível carregar as categorias. Tente novamente.",
                variant: "destructive",
            });
        }
        finally {
            setLoading(false);
        }
    };
    const handleAddEdit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !token)
            return;
        setSaving(true);
        try {
            if (editingCategory) {
                // Editar categoria existente
                const response = await fetch("/api/categories", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        id: editingCategory.id,
                        name: name.trim()
                    })
                });
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || "Erro ao atualizar categoria");
                }
                toast({
                    title: "Categoria atualizada",
                    description: `A categoria "${name}" foi atualizada com sucesso.`,
                });
            }
            else {
                // Criar nova categoria (sem tipo especificado)
                const response = await fetch("/api/categories", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: name.trim()
                    })
                });
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || "Erro ao criar categoria");
                }
                toast({
                    title: "Categoria criada",
                    description: `A categoria "${name}" foi criada com sucesso.`,
                });
            }
            await loadCategories();
            setOpen(false);
            resetForm();
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Erro ao salvar categoria";
            console.error("Erro ao salvar categoria:", error);
            toast({
                title: "Erro",
                description: errorMessage,
                variant: "destructive",
            });
        }
        finally {
            setSaving(false);
        }
    };
    const handleDelete = async () => {
        if (!deletingCategory || !token)
            return;
        setLoading(true);
        try {
            const response = await fetch(`/api/categories?id=${deletingCategory.id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Erro ao excluir categoria");
            }
            toast({
                title: "Categoria excluída",
                description: `A categoria "${deletingCategory.name}" foi excluída com sucesso.`,
            });
            await loadCategories();
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Erro ao excluir categoria";
            console.error("Erro ao excluir categoria:", error);
            toast({
                title: "Erro",
                description: errorMessage,
                variant: "destructive",
            });
        }
        finally {
            setLoading(false);
            setDeleteDialogOpen(false);
            setDeletingCategory(null);
        }
    };
    const resetForm = () => {
        setEditingCategory(null);
        setName("");
    };
    return (<card_1.Card>
      <card_1.CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <card_1.CardTitle>Categorias</card_1.CardTitle>
          <card_1.CardDescription>Gerencie as categorias do seu controle financeiro.</card_1.CardDescription>
        </div>
        <dialog_1.Dialog open={open} onOpenChange={setOpen}>
          <dialog_1.DialogTrigger asChild>
            <button_1.Button size="sm" onClick={() => resetForm()}>
              <lucide_react_1.Plus className="mr-2 h-4 w-4"/>
              Nova Categoria
            </button_1.Button>
          </dialog_1.DialogTrigger>
          <dialog_1.DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddEdit}>
              <dialog_1.DialogHeader>
                <dialog_1.DialogTitle>{editingCategory ? "Editar Categoria" : "Nova Categoria"}</dialog_1.DialogTitle>
                <dialog_1.DialogDescription>
                  {editingCategory
            ? "Edite o nome da categoria existente."
            : "Adicione uma nova categoria para organizar suas transações."}
                </dialog_1.DialogDescription>
              </dialog_1.DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label_1.Label htmlFor="name" className="text-right">
                    Nome
                  </label_1.Label>
                  <input_1.Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" maxLength={50} required/>
                </div>
              </div>
              <dialog_1.DialogFooter>
                <button_1.Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                  Cancelar
                </button_1.Button>
                <button_1.Button type="submit" disabled={saving}>
                  {saving ? (<>
                      <lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                      Salvando...
                    </>) : ("Salvar")}
                </button_1.Button>
              </dialog_1.DialogFooter>
            </form>
          </dialog_1.DialogContent>
        </dialog_1.Dialog>
      </card_1.CardHeader>
      <card_1.CardContent>
        <div className="space-y-4">
          <div className="flex items-center relative">
            <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
            <input_1.Input placeholder="Buscar categorias..." className="pl-10 w-full sm:w-[250px]" value={filterText} onChange={(e) => setFilterText(e.target.value)}/>
          </div>

          {loading && categories.length === 0 ? (<div className="flex justify-center items-center py-10">
              <lucide_react_1.Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
            </div>) : (<div className="rounded-md border">
              <table_1.Table>
                <table_1.TableHeader>
                  <table_1.TableRow>
                    <table_1.TableHead>Nome</table_1.TableHead>
                    <table_1.TableHead className="w-[100px] text-right">Ações</table_1.TableHead>
                  </table_1.TableRow>
                </table_1.TableHeader>
                <table_1.TableBody>
                  {filteredCategories.length === 0 ? (<table_1.TableRow>
                      <table_1.TableCell colSpan={2} className="h-24 text-center">
                        Nenhuma categoria encontrada.
                      </table_1.TableCell>
                    </table_1.TableRow>) : (filteredCategories.map((category) => (<table_1.TableRow key={category.id}>
                        <table_1.TableCell className="font-medium">{category.name}</table_1.TableCell>
                        <table_1.TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button_1.Button variant="ghost" size="icon" onClick={() => {
                    setEditingCategory(category);
                    setName(category.name);
                    setOpen(true);
                }} disabled={category.user_id === "default"} title={category.user_id === "default" ? "Categorias padrão não podem ser editadas" : "Editar"}>
                              <lucide_react_1.Edit className="h-4 w-4"/>
                              <span className="sr-only">Editar</span>
                            </button_1.Button>
                            <button_1.Button variant="ghost" size="icon" onClick={() => {
                    setDeletingCategory(category);
                    setDeleteDialogOpen(true);
                }} disabled={category.user_id === "default"} title={category.user_id === "default" ? "Categorias padrão não podem ser excluídas" : "Excluir"}>
                              <lucide_react_1.Trash className="h-4 w-4"/>
                              <span className="sr-only">Excluir</span>
                            </button_1.Button>
                          </div>
                        </table_1.TableCell>
                      </table_1.TableRow>)))}
                </table_1.TableBody>
              </table_1.Table>
            </div>)}
        </div>
      </card_1.CardContent>
      
      <alert_dialog_1.AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <alert_dialog_1.AlertDialogContent>
          <alert_dialog_1.AlertDialogHeader>
            <alert_dialog_1.AlertDialogTitle>Confirmação de exclusão</alert_dialog_1.AlertDialogTitle>
            <alert_dialog_1.AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{deletingCategory?.name}"?
              <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                <strong>Atenção:</strong> Não será possível excluir categorias que possuem transações ou parcelamentos associados.
              </div>
            </alert_dialog_1.AlertDialogDescription>
          </alert_dialog_1.AlertDialogHeader>
          <alert_dialog_1.AlertDialogFooter>
            <alert_dialog_1.AlertDialogCancel disabled={loading}>Cancelar</alert_dialog_1.AlertDialogCancel>
            <alert_dialog_1.AlertDialogAction onClick={handleDelete} disabled={loading}>
              {loading ? (<>
                  <lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                  Excluindo...
                </>) : ("Excluir")}
            </alert_dialog_1.AlertDialogAction>
          </alert_dialog_1.AlertDialogFooter>
        </alert_dialog_1.AlertDialogContent>
      </alert_dialog_1.AlertDialog>
    </card_1.Card>);
}
