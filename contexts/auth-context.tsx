"use client"

import { createContext, useContext, ReactNode } from "react"
import { useAuth } from "@/hooks/use-auth"
import { SessionExpiredModal } from "@/components/auth/session-expired-modal"
import React from "react"
import { AuthContextType } from "@/types/auth"

// Criação do contexto com valor padrão
const defaultContext: AuthContextType = {
  user: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  register: async () => {},
  checkAuth: async () => {},
  showSessionExpired: false,
  setShowSessionExpired: () => {},
  handleSessionExpiredClose: () => {},
  token: null
}

export const AuthContext = createContext<AuthContextType>(defaultContext)

// Provider Component
export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const auth = useAuth()

  // Bloqueia o botão direito quando a sessão expira
  React.useEffect(() => {
    function handleContextMenu(e: MouseEvent) {
      if (auth.showSessionExpired) {
        e.preventDefault()
        return false
      }
    }
    if (auth.showSessionExpired) {
      document.addEventListener("contextmenu", handleContextMenu)
    } else {
      document.removeEventListener("contextmenu", handleContextMenu)
    }
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu)
    }
  }, [auth.showSessionExpired])

  return (
    <AuthContext.Provider value={auth}>
      {children}
      <SessionExpiredModal 
        isOpen={auth.showSessionExpired} 
        onClose={auth.handleSessionExpiredClose} 
      />
    </AuthContext.Provider>
  )
}

// Hook para usar o contexto
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider")
  }
  return context
} 