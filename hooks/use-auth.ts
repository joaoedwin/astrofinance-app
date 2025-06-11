"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { SessionExpiredModal } from "@/components/auth/session-expired-modal"
import { AuthContextType, User } from "@/types/auth"

export interface AuthHookResult {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (name: string, email: string, password: string) => Promise<void>
  checkAuth: () => Promise<void>
  showSessionExpired: boolean
  setShowSessionExpired: (show: boolean) => void
  handleSessionExpiredClose: () => void
  token: string | null
}

const INACTIVITY_TIMEOUT = 5 * 60 * 1000 // 5 minutos em milissegundos
const ACCESS_TOKEN_EXPIRY = 15 * 60 * 1000 // 15 minutos em milissegundos
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7 dias em milissegundos
const TOKEN_CHECK_INTERVAL = 60 * 1000 // 1 minuto

// Função auxiliar para configurar cookies seguros
const setCookie = (name: string, value: string, maxAge: number) => {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Strict; Secure`;
}

// Função auxiliar para obter um cookie pelo nome
const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

// Função auxiliar para remover um cookie
const removeCookie = (name: string) => {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Strict; Secure`;
}

export function useAuth(): AuthContextType {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSessionExpired, setShowSessionExpired] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const router = useRouter()

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    
    // Limpar token do localStorage (mantido para compatibilidade)
    localStorage.removeItem("token")
    localStorage.removeItem("refreshToken")
    
    // Limpar cookies
    removeCookie("token")
    removeCookie("jwt")
    removeCookie("refreshToken")
    
    router.push("/login")
  }, [router])

  // Inicializa o token do cookie ou localStorage e verifica autenticação
  useEffect(() => {
    // Tentar obter token do cookie primeiro (mais seguro)
    let currentToken = getCookie("token");
    
    // Se não encontrar no cookie, verificar localStorage (compatibilidade)
    if (!currentToken) {
      currentToken = localStorage.getItem("token");
      
      // Se encontrou no localStorage, mover para cookie para maior segurança
      if (currentToken) {
        setCookie("token", currentToken, ACCESS_TOKEN_EXPIRY / 1000);
      }
    }
    
    if (currentToken) {
      setToken(currentToken);
      checkAuth(); // Verifica autenticação imediatamente quando há token
    } else {
      setIsLoading(false);
    }
  }, [])

  // Verifica autenticação sempre que o token mudar
  useEffect(() => {
    if (token) {
      checkAuth()
    }
  }, [token])

  // Verifica o token periodicamente
  useEffect(() => {
    if (!token) return

    const checkTokenInterval = setInterval(async () => {
      try {
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const error = await response.json()
          // Se o token expirou, fazer logout imediatamente
          if (error.message === "Token inválido" || error.message === "jwt expired") {
            console.error("[AUTH] Token expirado, fazendo logout")
            handleAuthError()
            return
          }
          throw new Error(error.message || "Token inválido")
        }
      } catch (error) {
        console.error("[AUTH] Erro ao verificar token:", error)
        handleAuthError()
      }
    }, TOKEN_CHECK_INTERVAL)

    return () => clearInterval(checkTokenInterval)
  }, [token])

  // Monitora inatividade
  useEffect(() => {
    if (!user) return

    let inactivityTimer: NodeJS.Timeout
    let lastActivity = Date.now()

    const resetTimer = () => {
      lastActivity = Date.now()
      if (inactivityTimer) clearTimeout(inactivityTimer)
      inactivityTimer = setTimeout(() => {
        const timeSinceLastActivity = Date.now() - lastActivity
        if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
          handleAuthError()
        }
      }, INACTIVITY_TIMEOUT)
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer)
    })

    resetTimer()

    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer)
      events.forEach(event => {
        document.removeEventListener(event, resetTimer)
      })
    }
  }, [user])

  const refreshAccessToken = async () => {
    try {
      // Tentar obter refresh token do cookie primeiro
      let refreshToken = getCookie("refreshToken");
      
      // Se não encontrar no cookie, verificar localStorage (compatibilidade)
      if (!refreshToken) {
        refreshToken = localStorage.getItem("refreshToken");
      }
      
      if (!refreshToken) throw new Error("No refresh token");

      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        throw new Error("Failed to refresh token")
      }

      const data = await response.json()
      
      // Atualiza tokens no localStorage (compatibilidade)
      localStorage.setItem("token", data.token)
      
      // Atualiza tokens nos cookies (segurança)
      setCookie("token", data.token, ACCESS_TOKEN_EXPIRY / 1000)
      
      setToken(data.token)
      
      return data.token
    } catch (error) {
      console.error("[AUTH] Erro ao atualizar token:", error)
      handleAuthError()
      throw error
    }
  }

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true)
      if (!token) {
        setUser(null)
        setIsLoading(false)
        return
      }

      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        // Se o token expirou, fazer logout imediatamente
        if (error.message === "Token inválido" || error.message === "jwt expired") {
          console.error("[AUTH] Token expirado, fazendo logout")
          handleAuthError()
          return
        }

        if (response.status === 401) {
          try {
            const newToken = await refreshAccessToken()
            const retryResponse = await fetch("/api/auth/me", {
              headers: {
                Authorization: `Bearer ${newToken}`,
              },
            })
            if (!retryResponse.ok) throw new Error("Failed to refresh session")
            const data = await retryResponse.json()
            setUser(data.user)
            return
          } catch (error) {
            handleAuthError()
            throw new Error("Não autenticado")
          }
        }
        throw new Error("Não autenticado")
      }

      const data = await response.json()
      setUser(data.user)
      
      // Atualiza cookie com flags de segurança
      setCookie("token", token, ACCESS_TOKEN_EXPIRY / 1000)
    } catch (error) {
      console.error("[AUTH] Erro ao verificar autenticação:", error)
      handleAuthError()
    } finally {
      setIsLoading(false)
    }
  }, [token])

  const handleAuthError = () => {
    setUser(null)
    setToken(null)
    
    // Limpar token do localStorage
    localStorage.removeItem("token")
    localStorage.removeItem("refreshToken")
    
    // Limpar cookies
    removeCookie("token")
    removeCookie("jwt")
    removeCookie("refreshToken")
    
    setShowSessionExpired(true)
    router.push("/login")
  }

  const handleSessionExpiredClose = useCallback(() => {
    setShowSessionExpired(false)
    logout()
  }, [logout])

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Erro ao fazer login")
      }

      const data = await response.json()
      
      // Armazena tokens no localStorage (compatibilidade)
      localStorage.setItem("token", data.tokens.accessToken)
      localStorage.setItem("refreshToken", data.tokens.refreshToken)
      
      // Armazena tokens nos cookies (segurança)
      setCookie("token", data.tokens.accessToken, ACCESS_TOKEN_EXPIRY / 1000)
      setCookie("refreshToken", data.tokens.refreshToken, REFRESH_TOKEN_EXPIRY / 1000)
      
      setToken(data.tokens.accessToken)
      setUser(data.user)
      router.push("/dashboard")
    } catch (error) {
      console.error("[AUTH] Erro ao fazer login:", error)
      toast({
        title: "Erro ao fazer login",
        description: error instanceof Error ? error.message : "Erro ao fazer login",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message)
      }

      const data = await response.json()
      
      // Armazena tokens no localStorage (compatibilidade)
      localStorage.setItem("token", data.token)
      localStorage.setItem("refreshToken", data.refreshToken)
      
      // Armazena tokens nos cookies (segurança)
      setCookie("token", data.token, ACCESS_TOKEN_EXPIRY / 1000)
      setCookie("refreshToken", data.refreshToken, REFRESH_TOKEN_EXPIRY / 1000)
      
      setUser(data.user)

      toast({
        title: "Registro realizado com sucesso",
        description: "Você será redirecionado para o dashboard.",
      })

      router.push("/dashboard")
    } catch (error) {
      toast({
        title: "Erro ao registrar",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [router])

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
    token,
  }
} 