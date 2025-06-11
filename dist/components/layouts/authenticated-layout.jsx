"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticatedLayout = AuthenticatedLayout;
const auth_context_1 = require("@/contexts/auth-context");
const navigation_1 = require("next/navigation");
const react_1 = require("react");
const sidebar_1 = require("@/components/sidebar");
function AuthenticatedLayout({ children }) {
    const { user, logout } = (0, auth_context_1.useAuthContext)();
    const router = (0, navigation_1.useRouter)();
    (0, react_1.useEffect)(() => {
        if (!user) {
            router.push("/login");
        }
    }, [user, router]);
    if (!user) {
        return null;
    }
    return (<div className="flex h-screen">
      <sidebar_1.Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>);
}
