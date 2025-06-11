"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileSettings = ProfileSettings;
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const react_1 = require("react");
const use_toast_1 = require("@/components/ui/use-toast");
const auth_context_1 = require("@/contexts/auth-context");
function ProfileSettings() {
    const currentRef = (0, react_1.useRef)(null);
    const newRef = (0, react_1.useRef)(null);
    const confirmRef = (0, react_1.useRef)(null);
    const { toast } = (0, use_toast_1.useToast)();
    const { logout } = (0, auth_context_1.useAuthContext)();
    const [saving, setSaving] = (0, react_1.useState)(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        const current = currentRef.current?.value || "";
        const newPass = newRef.current?.value || "";
        const confirm = confirmRef.current?.value || "";
        if (!current || !newPass || !confirm) {
            toast({ title: "Preencha todos os campos", variant: "destructive" });
            return;
        }
        if (newPass !== confirm) {
            toast({ title: "As senhas não coincidem", variant: "destructive" });
            return;
        }
        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ currentPassword: current, newPassword: newPass }),
            });
            if (res.status === 401) {
                toast({ title: "Sessão expirada. Faça login novamente.", variant: "destructive" });
                logout();
                return;
            }
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Erro ao alterar senha");
            }
            toast({ title: "Senha alterada com sucesso" });
            if (currentRef.current)
                currentRef.current.value = "";
            if (newRef.current)
                newRef.current.value = "";
            if (confirmRef.current)
                confirmRef.current.value = "";
        }
        catch (err) {
            toast({ title: err.message || "Erro ao alterar senha", variant: "destructive" });
        }
        finally {
            setSaving(false);
        }
    };
    return (<card_1.Card>
      <card_1.CardHeader>
        <card_1.CardTitle>Alterar senha</card_1.CardTitle>
        <card_1.CardDescription>Atualize sua senha para manter sua conta segura.</card_1.CardDescription>
      </card_1.CardHeader>
      <form onSubmit={handleSubmit}>
        <card_1.CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label_1.Label htmlFor="current-password">Senha atual</label_1.Label>
                <input_1.Input id="current-password" type="password" ref={currentRef}/>
              </div>
              <div className="grid gap-2">
                <label_1.Label htmlFor="new-password">Nova senha</label_1.Label>
                <input_1.Input id="new-password" type="password" ref={newRef}/>
              </div>
              <div className="grid gap-2">
                <label_1.Label htmlFor="confirm-password">Confirmar nova senha</label_1.Label>
                <input_1.Input id="confirm-password" type="password" ref={confirmRef}/>
              </div>
            </div>
          </div>
        </card_1.CardContent>
        <card_1.CardFooter>
          <button_1.Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar alterações"}</button_1.Button>
        </card_1.CardFooter>
      </form>
    </card_1.Card>);
}
