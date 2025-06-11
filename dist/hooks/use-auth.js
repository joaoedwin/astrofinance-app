"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = useAuth;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const use_toast_1 = require("@/hooks/use-toast");
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutos em milissegundos
const ACCESS_TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutos em milissegundos
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 dias em milissegundos
const TOKEN_CHECK_INTERVAL = 60 * 1000; // 1 minuto
function useAuth() {
    const [user, setUser] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [showSessionExpired, setShowSessionExpired] = (0, react_1.useState)(false);
    const [token, setToken] = (0, react_1.useState)(null);
    const router = (0, navigation_1.useRouter)();
    // Inicializa o token do localStorage e verifica autenticação
    (0, react_1.useEffect)(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            setToken(storedToken);
            checkAuth(); // Verifica autenticação imediatamente quando há token
        }
        else {
            setIsLoading(false);
        }
    }, []);
    // Verifica autenticação sempre que o token mudar
    (0, react_1.useEffect)(() => {
        if (token) {
            checkAuth();
        }
    }, [token]);
    // Verifica o token periodicamente
    (0, react_1.useEffect)(() => {
        if (!token)
            return;
        const checkTokenInterval = setInterval(async () => {
            try {
                const response = await fetch("/api/auth/me", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    const error = await response.json();
                    // Se o token expirou, fazer logout imediatamente
                    if (error.message === "Token inválido" || error.message === "jwt expired") {
                        console.error("[AUTH] Token expirado, fazendo logout");
                        handleAuthError();
                        return;
                    }
                    throw new Error(error.message || "Token inválido");
                }
            }
            catch (error) {
                console.error("[AUTH] Erro ao verificar token:", error);
                handleAuthError();
            }
        }, TOKEN_CHECK_INTERVAL);
        return () => clearInterval(checkTokenInterval);
    }, [token]);
    // Monitora inatividade
    (0, react_1.useEffect)(() => {
        if (!user)
            return;
        let inactivityTimer;
        let lastActivity = Date.now();
        const resetTimer = () => {
            lastActivity = Date.now();
            if (inactivityTimer)
                clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                const timeSinceLastActivity = Date.now() - lastActivity;
                if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
                    handleAuthError();
                }
            }, INACTIVITY_TIMEOUT);
        };
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, resetTimer);
        });
        resetTimer();
        return () => {
            if (inactivityTimer)
                clearTimeout(inactivityTimer);
            events.forEach(event => {
                document.removeEventListener(event, resetTimer);
            });
        };
    }, [user]);
    const refreshAccessToken = async () => {
        try {
            const refreshToken = localStorage.getItem("refreshToken");
            if (!refreshToken)
                throw new Error("No refresh token");
            const response = await fetch("/api/auth/refresh", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
            });
            if (!response.ok) {
                throw new Error("Failed to refresh token");
            }
            const data = await response.json();
            // Atualiza tokens
            localStorage.setItem("token", data.token);
            setToken(data.token);
            // Atualiza cookies com flags de segurança
            document.cookie = `token=${data.token}; path=/; max-age=${ACCESS_TOKEN_EXPIRY / 1000}; SameSite=Strict; Secure`;
            return data.token;
        }
        catch (error) {
            console.error("[AUTH] Erro ao atualizar token:", error);
            handleAuthError();
            throw error;
        }
    };
    const checkAuth = async () => {
        try {
            if (!token) {
                setUser(null);
                setIsLoading(false);
                return;
            }
            const response = await fetch("/api/auth/me", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const error = await response.json();
                // Se o token expirou, fazer logout imediatamente
                if (error.message === "Token inválido" || error.message === "jwt expired") {
                    console.error("[AUTH] Token expirado, fazendo logout");
                    handleAuthError();
                    return;
                }
                if (response.status === 401) {
                    try {
                        const newToken = await refreshAccessToken();
                        const retryResponse = await fetch("/api/auth/me", {
                            headers: {
                                Authorization: `Bearer ${newToken}`,
                            },
                        });
                        if (!retryResponse.ok)
                            throw new Error("Failed to refresh session");
                        const data = await retryResponse.json();
                        setUser(data.user);
                        return;
                    }
                    catch (error) {
                        handleAuthError();
                        throw new Error("Não autenticado");
                    }
                }
                throw new Error("Não autenticado");
            }
            const data = await response.json();
            setUser(data.user);
            // Atualiza cookie com flags de segurança
            document.cookie = `token=${token}; path=/; max-age=${ACCESS_TOKEN_EXPIRY / 1000}; SameSite=Strict; Secure`;
        }
        catch (error) {
            console.error("[AUTH] Erro ao verificar autenticação:", error);
            handleAuthError();
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleAuthError = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        document.cookie = "token=; path=/; max-age=0";
        document.cookie = "jwt=; path=/; max-age=0";
        setShowSessionExpired(true);
        router.push("/login");
    };
    const handleSessionExpiredClose = () => {
        setShowSessionExpired(false);
        router.push("/login");
    };
    const login = async (email, password) => {
        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Erro ao fazer login");
            }
            const data = await response.json();
            // Armazena tokens
            localStorage.setItem("token", data.tokens.accessToken);
            localStorage.setItem("refreshToken", data.tokens.refreshToken);
            setToken(data.tokens.accessToken);
            // Atualiza cookies com flags de segurança
            document.cookie = `token=${data.tokens.accessToken}; path=/; max-age=${ACCESS_TOKEN_EXPIRY / 1000}; SameSite=Strict; Secure`;
            setUser(data.user);
            router.push("/dashboard");
        }
        catch (error) {
            console.error("[AUTH] Erro ao fazer login:", error);
            (0, use_toast_1.toast)({
                title: "Erro ao fazer login",
                description: error instanceof Error ? error.message : "Erro ao fazer login",
                variant: "destructive",
            });
        }
    };
    const logout = () => {
        // Limpa todos os dados de sessão
        setToken(null);
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        document.cookie = "token=; path=/; max-age=0";
        document.cookie = "jwt=; path=/; max-age=0";
        setUser(null);
        router.push("/login");
    };
    const register = async (name, email, password) => {
        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message);
            }
            const data = await response.json();
            // Armazena tokens
            localStorage.setItem("token", data.token);
            localStorage.setItem("refreshToken", data.refreshToken);
            // Configura cookies com flags de segurança
            document.cookie = `token=${data.token}; path=/; max-age=${ACCESS_TOKEN_EXPIRY / 1000}; SameSite=Strict; Secure`;
            setUser(data.user);
            (0, use_toast_1.toast)({
                title: "Registro realizado com sucesso",
                description: "Você será redirecionado para o dashboard.",
            });
            router.push("/dashboard");
        }
        catch (error) {
            (0, use_toast_1.toast)({
                title: "Erro ao registrar",
                description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
                variant: "destructive",
            });
            throw error;
        }
    };
    return {
        user,
        isLoading,
        login,
        logout,
        register,
        checkAuth,
        showSessionExpired,
        setShowSessionExpired,
        handleSessionExpiredClose,
        token
    };
}
