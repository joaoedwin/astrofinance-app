"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAdminGuard = useAdminGuard;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const auth_context_1 = require("@/contexts/auth-context");
const use_toast_1 = require("@/hooks/use-toast");
function useAdminGuard() {
    const { user, isLoading } = (0, auth_context_1.useAuthContext)();
    const router = (0, navigation_1.useRouter)();
    (0, react_1.useEffect)(() => {
        if (!isLoading && (!user || user.role !== "admin")) {
            (0, use_toast_1.toast)({
                title: "Acesso Negado",
                description: "Você não tem permissão para acessar esta área.",
                variant: "destructive",
            });
            router.push("/dashboard");
        }
    }, [user, isLoading, router]);
    return { isAdmin: user?.role === "admin", isLoading };
}
