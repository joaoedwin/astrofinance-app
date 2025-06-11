"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminPage;
const use_admin_guard_1 = require("@/hooks/use-admin-guard");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const tabs_1 = require("@/components/ui/tabs");
const react_1 = require("react");
const use_toast_1 = require("@/hooks/use-toast");
const utils_1 = require("@/lib/utils");
function AdminPage() {
    const { isAdmin, isLoading } = (0, use_admin_guard_1.useAdminGuard)();
    const [users, setUsers] = (0, react_1.useState)([]);
    const [newUser, setNewUser] = (0, react_1.useState)({ name: "", email: "" });
    const [generatedPassword, setGeneratedPassword] = (0, react_1.useState)("");
    const [notification, setNotification] = (0, react_1.useState)({ message: "", type: "update" });
    (0, react_1.useEffect)(() => {
        if (isAdmin) {
            loadUsers();
        }
    }, [isAdmin]);
    const createUser = async () => {
        try {
            const password = (0, utils_1.generatePassword)();
            const response = await fetch("/api/admin/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ ...newUser, password }),
            });
            if (!response.ok)
                throw new Error("Erro ao criar usuário");
            setGeneratedPassword(password);
            (0, use_toast_1.toast)({
                title: "Usuário criado com sucesso",
                description: "A senha foi gerada e está disponível para cópia.",
            });
            // Limpar formulário
            setNewUser({ name: "", email: "" });
            loadUsers();
        }
        catch (error) {
            (0, use_toast_1.toast)({
                title: "Erro ao criar usuário",
                description: error instanceof Error ? error.message : "Tente novamente",
                variant: "destructive",
            });
        }
    };
    const createNotification = async () => {
        try {
            const response = await fetch("/api/admin/notifications", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(notification),
            });
            if (!response.ok)
                throw new Error("Erro ao criar notificação");
            (0, use_toast_1.toast)({
                title: "Notificação criada com sucesso",
                description: "Todos os usuários serão notificados.",
            });
            // Limpar formulário
            setNotification({ message: "", type: "update" });
        }
        catch (error) {
            (0, use_toast_1.toast)({
                title: "Erro ao criar notificação",
                description: error instanceof Error ? error.message : "Tente novamente",
                variant: "destructive",
            });
        }
    };
    const loadUsers = async () => {
        try {
            const response = await fetch("/api/admin/users", {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            if (!response.ok)
                throw new Error("Erro ao carregar usuários");
            const data = await response.json();
            setUsers(data);
        }
        catch (error) {
            (0, use_toast_1.toast)({
                title: "Erro ao carregar usuários",
                description: error instanceof Error ? error.message : "Tente novamente",
                variant: "destructive",
            });
        }
    };
    if (isLoading)
        return <div>Carregando...</div>;
    if (!isAdmin)
        return null;
    return (<div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Administração</h1>
      
      <tabs_1.Tabs defaultValue="users">
        <tabs_1.TabsList>
          <tabs_1.TabsTrigger value="users">Usuários</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="notifications">Notificações</tabs_1.TabsTrigger>
        </tabs_1.TabsList>
        
        <tabs_1.TabsContent value="users" className="space-y-4">
          <div className="bg-card p-4 rounded-lg space-y-4">
            <h2 className="text-xl font-semibold">Criar Novo Usuário</h2>
            <div className="space-y-2">
              <input_1.Input placeholder="Nome" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}/>
              <input_1.Input placeholder="E-mail" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}/>
              <button_1.Button onClick={createUser}>Criar Usuário</button_1.Button>
            </div>
            {generatedPassword && (<div className="mt-4 p-4 bg-muted rounded">
                <p>Senha gerada: <code className="bg-background p-1 rounded">{generatedPassword}</code></p>
                <p className="text-sm text-muted-foreground mt-2">
                  Copie esta senha e envie para o usuário. Ela não será mostrada novamente.
                </p>
              </div>)}
          </div>
          
          <div className="bg-card p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Usuários Cadastrados</h2>
            <div className="space-y-2">
              {users.map(user => (<div key={user.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="space-x-2">
                    <button_1.Button variant="outline" size="sm">Editar</button_1.Button>
                    <button_1.Button variant="destructive" size="sm">Excluir</button_1.Button>
                  </div>
                </div>))}
            </div>
          </div>
        </tabs_1.TabsContent>
        
        <tabs_1.TabsContent value="notifications" className="space-y-4">
          <div className="bg-card p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Criar Notificação</h2>
            <div className="space-y-2">
              <textarea className="w-full min-h-[100px] p-2 rounded-md border" placeholder="Mensagem" value={notification.message} onChange={(e) => setNotification({ ...notification, message: e.target.value })}/>
              <select className="w-full p-2 rounded-md border" value={notification.type} onChange={(e) => setNotification({ ...notification, type: e.target.value })}>
                <option value="update">Atualização</option>
                <option value="announce">Anúncio</option>
              </select>
              <button_1.Button onClick={createNotification}>Criar Notificação</button_1.Button>
            </div>
          </div>
        </tabs_1.TabsContent>
      </tabs_1.Tabs>
    </div>);
}
