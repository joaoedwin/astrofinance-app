"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

export function useAdminGuard() {
  const auth = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (!auth.isLoading && (!auth.user || auth.user.role !== "admin")) {
      toast({
        title: "Acesso Negado",
        description: "Você não tem permissão para acessar esta área.",
        variant: "destructive",
      })
      router.push("/dashboard")
    }
  }, [auth.user, auth.isLoading, router])

  return { isAdmin: auth.user?.role === "admin", isLoading: auth.isLoading }
} 