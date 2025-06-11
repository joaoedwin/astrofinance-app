"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthProvider = AuthProvider;
exports.useAuthContext = useAuthContext;
const react_1 = require("react");
const use_auth_1 = require("@/hooks/use-auth");
const session_expired_modal_1 = require("@/components/auth/session-expired-modal");
const react_2 = __importDefault(require("react"));
const AuthContext = (0, react_1.createContext)(undefined);
function AuthProvider({ children }) {
    const auth = (0, use_auth_1.useAuth)();
    // Bloqueia o botão direito quando a sessão expira
    react_2.default.useEffect(() => {
        function handleContextMenu(e) {
            if (auth.showSessionExpired) {
                e.preventDefault();
                return false;
            }
        }
        if (auth.showSessionExpired) {
            document.addEventListener("contextmenu", handleContextMenu);
        }
        else {
            document.removeEventListener("contextmenu", handleContextMenu);
        }
        return () => {
            document.removeEventListener("contextmenu", handleContextMenu);
        };
    }, [auth.showSessionExpired]);
    return (<AuthContext.Provider value={auth}>
      {children}
      <session_expired_modal_1.SessionExpiredModal isOpen={auth.showSessionExpired} onClose={auth.handleSessionExpiredClose}/>
    </AuthContext.Provider>);
}
function useAuthContext() {
    const context = (0, react_1.useContext)(AuthContext);
    if (context === undefined) {
        throw new Error("useAuthContext must be used within an AuthProvider");
    }
    return context;
}
