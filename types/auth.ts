export interface User {
  id: string
  email: string
  name: string
  image?: string
  role: "admin" | "user"
  isAdmin?: boolean
}

export interface AuthContextType {
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

// Tipos para API
export interface AuthUser {
  id: string
  email: string
  name: string
  image?: string
  role: "admin" | "user"
}

export interface AuthResponse {
  user: AuthUser
  tokens: {
    accessToken: string
    refreshToken: string
  }
}

export interface AuthTokenPayload {
  id: string
  email: string
  role: "admin" | "user"
  exp: number
} 