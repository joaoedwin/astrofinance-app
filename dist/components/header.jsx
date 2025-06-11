"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Header;
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const mode_toggle_1 = require("@/components/mode-toggle");
const user_nav_1 = require("@/components/user-nav");
const use_mobile_1 = require("@/hooks/use-mobile");
const use_notifications_1 = require("@/hooks/use-notifications");
const react_1 = require("react");
function Header({ setSidebarOpen }) {
    const isMobile = (0, use_mobile_1.useMobile)();
    const { notifications, unreadCount, fetchNotifications, markAsRead, deleteNotification, loading } = (0, use_notifications_1.useNotifications)();
    const [showPopup, setShowPopup] = (0, react_1.useState)(false);
    const popupRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        fetchNotifications();
    }, [fetchNotifications]);
    // Fechar popup ao clicar fora
    (0, react_1.useEffect)(() => {
        function handleClickOutside(event) {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setShowPopup(false);
            }
        }
        if (showPopup) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showPopup]);
    return (<header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        {isMobile && (<button_1.Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="md:hidden">
            <lucide_react_1.Menu className="h-5 w-5"/>
            <span className="sr-only">Toggle menu</span>
          </button_1.Button>)}
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">FT</span>
          </div>
          <span className="font-bold hidden md:inline-block">FinanceTrack</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button_1.Button variant="ghost" size="icon" onClick={() => setShowPopup((v) => !v)} className="relative h-8 w-8 flex items-center justify-center">
          <lucide_react_1.Bell className="h-5 w-5"/>
          {unreadCount > 0 && (<span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">{unreadCount}</span>)}
          <span className="sr-only">Notificações</span>
        </button_1.Button>
        {showPopup && (<div ref={popupRef} className="absolute right-0 top-full mt-1 w-80 max-h-96 bg-white dark:bg-zinc-900 border rounded shadow-lg z-50 overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <span className="font-semibold">Notificações</span>
              <button_1.Button variant="ghost" size="icon" onClick={() => setShowPopup(false)}><lucide_react_1.X className="h-4 w-4"/></button_1.Button>
            </div>
            <div className="divide-y">
              {loading ? (<div className="p-4 text-center text-muted-foreground">Carregando...</div>) : notifications.length === 0 ? (<div className="p-4 text-center text-muted-foreground">Nenhuma notificação</div>) : notifications.map((n) => (<div key={n.id} className={`flex items-start gap-2 px-4 py-3 ${n.read ? "bg-muted" : "bg-white dark:bg-zinc-900"}`}>
                  <div className="flex-1">
                    <div className="text-sm font-medium mb-1">{n.type === "goal_reserve" ? "Reserva de Meta" : n.type === "goal_limit" ? "Limite de Gasto" : n.type === "update" ? "Atualização" : "Aviso"}</div>
                    <div className="text-xs text-muted-foreground mb-1">{n.message}</div>
                    <div className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("pt-BR")}</div>
                  </div>
                  {!n.read && (<button_1.Button size="sm" variant="outline" onClick={() => markAsRead(n.id)} className="text-xs">Marcar como lida</button_1.Button>)}
                  <button_1.Button size="sm" variant="ghost" onClick={() => deleteNotification(n.id)} className="text-xs text-destructive">Excluir</button_1.Button>
                </div>))}
            </div>
          </div>)}
        <mode_toggle_1.ModeToggle />
        <user_nav_1.UserNav />
      </div>
    </header>);
}
