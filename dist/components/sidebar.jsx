"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Sidebar;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const utils_1 = require("@/lib/utils");
const button_1 = require("@/components/ui/button");
const scroll_area_1 = require("@/components/ui/scroll-area");
const sheet_1 = require("@/components/ui/sheet");
const lucide_react_1 = require("lucide-react");
const use_mobile_1 = require("@/hooks/use-mobile");
const new_transaction_button_1 = require("@/components/transactions/new-transaction-button");
const auth_context_1 = require("@/contexts/auth-context");
function Sidebar({ open, setOpen }) {
    const pathname = (0, navigation_1.usePathname)();
    const isMobile = (0, use_mobile_1.useMobile)();
    const [mounted, setMounted] = (0, react_1.useState)(false);
    const { logout, user } = (0, auth_context_1.useAuthContext)();
    // Prevent hydration mismatch
    (0, react_1.useEffect)(() => {
        setMounted(true);
    }, []);
    if (!mounted) {
        return null;
    }
    const routes = [
        {
            label: "Dashboard",
            icon: lucide_react_1.LayoutDashboard,
            href: "/dashboard",
            active: pathname === "/dashboard",
        },
        {
            label: "Transações",
            icon: lucide_react_1.CreditCard,
            href: "/transactions",
            active: pathname === "/transactions",
        },
        {
            label: "Parcelamentos",
            icon: lucide_react_1.Calendar,
            href: "/installments",
            active: pathname === "/installments",
        },
        {
            label: "Fatura Mensal",
            icon: lucide_react_1.FileText,
            href: "/invoice",
            active: pathname === "/invoice",
        },
        {
            label: "Metas",
            icon: lucide_react_1.BarChart3,
            href: "/goals",
            active: pathname === "/goals",
        },
        {
            label: "Configurações",
            icon: lucide_react_1.Settings,
            href: "/settings",
            active: pathname === "/settings",
        },
        // Adiciona o link de administração apenas para usuários admin
        ...(user?.role === "admin" ? [
            {
                label: "Administração",
                icon: lucide_react_1.Shield,
                href: "/admin",
                active: pathname === "/admin",
            }
        ] : []),
    ];
    const SidebarContent = (<>
      <div className="flex h-14 items-center border-b px-4">
        <link_1.default href="/dashboard" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">FT</span>
          </div>
          {(open || isMobile) && <span className="font-bold">FinanceTrack</span>}
        </link_1.default>
        {isMobile && (<button_1.Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="ml-auto">
            <lucide_react_1.X className="h-5 w-5"/>
            <span className="sr-only">Fechar menu</span>
          </button_1.Button>)}
        {!isMobile && (<button_1.Button variant="ghost" size="icon" onClick={() => setOpen(!open)} className="ml-auto">
            {open ? <lucide_react_1.ChevronLeft className="h-5 w-5"/> : <lucide_react_1.ChevronRight className="h-5 w-5"/>}
            <span className="sr-only">Toggle sidebar</span>
          </button_1.Button>)}
      </div>
      <scroll_area_1.ScrollArea className="flex-1 px-2 py-4">
        <div className="mb-4 px-2">
          {open || isMobile ? <new_transaction_button_1.NewTransactionButton fullWidth/> : <new_transaction_button_1.NewTransactionButton iconOnly/>}
        </div>
        <div className="space-y-1 px-2">
          {routes.map((route) => (<button_1.Button key={route.href} variant={route.active ? "secondary" : "ghost"} size="sm" className={(0, utils_1.cn)("w-full justify-start", {
                "bg-secondary": route.active,
                "px-2": !open && !isMobile,
            })} asChild>
              <link_1.default href={route.href}>
                <route.icon className={(0, utils_1.cn)("h-4 w-4", open || isMobile ? "mr-2" : "")}/>
                {(open || isMobile) && route.label}
              </link_1.default>
            </button_1.Button>))}
        </div>
      </scroll_area_1.ScrollArea>
      <div className="mt-auto border-t p-4">
        <button_1.Button variant="ghost" size="sm" className="w-full justify-start" onClick={logout}>
          <lucide_react_1.LogOut className={(0, utils_1.cn)("h-4 w-4", open || isMobile ? "mr-2" : "")}/>
          {(open || isMobile) && "Sair"}
        </button_1.Button>
      </div>
    </>);
    // Mobile: Sheet component
    if (isMobile) {
        return (<sheet_1.Sheet open={open} onOpenChange={setOpen}>
        <sheet_1.SheetContent side="left" className="p-0 w-[280px]">
          <div className="flex h-full flex-col">{SidebarContent}</div>
        </sheet_1.SheetContent>
      </sheet_1.Sheet>);
    }
    // Desktop: Regular sidebar - REMOVIDA A CLASSE 'hidden md:flex' que estava causando o problema
    return (<div className={(0, utils_1.cn)("flex flex-col h-screen border-r bg-sidebar transition-all duration-300", {
            "w-[280px]": open,
            "w-[70px]": !open,
        })}>
      {SidebarContent}
    </div>);
}
