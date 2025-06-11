"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRef, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useAuthContext } from "@/contexts/auth-context"

export function ProfileSettings() {
  const currentRef = useRef<HTMLInputElement>(null)
  const newRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { logout } = useAuthContext()
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const current = currentRef.current?.value || ""
    const newPass = newRef.current?.value || ""
    const confirm = confirmRef.current?.value || ""
    if (!current || !newPass || !confirm) {
      toast({ title: "Preencha todos os campos", variant: "destructive" })
      return
    }
    if (newPass !== confirm) {
      toast({ title: "As senhas não coincidem", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword: current, newPassword: newPass }),
      })
      if (res.status === 401) {
        toast({ title: "Sessão expirada. Faça login novamente.", variant: "destructive" })
        logout()
        return
      }
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erro ao alterar senha")
      }
      toast({ title: "Senha alterada com sucesso" })
      if (currentRef.current) currentRef.current.value = ""
      if (newRef.current) newRef.current.value = ""
      if (confirmRef.current) confirmRef.current.value = ""
    } catch (err: any) {
      toast({ title: err.message || "Erro ao alterar senha", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
        <CardTitle className="text-base sm:text-lg">Alterar senha</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Atualize sua senha para manter sua conta segura.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="grid gap-3 sm:gap-4">
              <div className="grid gap-1.5 sm:gap-2">
                <Label htmlFor="current-password" className="text-xs sm:text-sm">Senha atual</Label>
                <Input 
                  id="current-password" 
                  type="password" 
                  ref={currentRef} 
                  className="h-8 sm:h-10 text-xs sm:text-sm" 
                />
              </div>
              <div className="grid gap-1.5 sm:gap-2">
                <Label htmlFor="new-password" className="text-xs sm:text-sm">Nova senha</Label>
                <Input 
                  id="new-password" 
                  type="password" 
                  ref={newRef} 
                  className="h-8 sm:h-10 text-xs sm:text-sm" 
                />
              </div>
              <div className="grid gap-1.5 sm:gap-2">
                <Label htmlFor="confirm-password" className="text-xs sm:text-sm">Confirmar nova senha</Label>
                <Input 
                  id="confirm-password" 
                  type="password" 
                  ref={confirmRef} 
                  className="h-8 sm:h-10 text-xs sm:text-sm" 
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="px-4 sm:px-6 pb-4 sm:pb-6">
          <Button 
            type="submit" 
            disabled={saving}
            className="h-8 sm:h-10 text-xs sm:text-sm"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
