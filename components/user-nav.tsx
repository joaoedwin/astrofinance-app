"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreditCard, LogOut, Settings, User, Bell, X, Check, ExternalLink, RefreshCw } from "lucide-react"
import { useAuthContext } from "@/contexts/auth-context"
import { useRef } from "react"
import { useRouter } from "next/navigation"
import { useNotifications, Notification } from "@/hooks/use-notifications"
import React from "react"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

interface User {
  name: string
  email: string
  image?: string
  role?: string
}

interface AuthContext {
  user: User | null
}

// Expandir a interface de Notification para incluir description
interface ExtendedNotification extends Notification {
  description?: string;
}

export function UserNav() {
  const { user } = useAuthContext() as AuthContext
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { 
    notifications: rawNotifications, 
    unreadCount, 
    fetchNotifications, 
    markAsRead,
    pollingEnabled,
    togglePolling,
    lastChecked
  } = useNotifications()
  const [showNotifications, setShowNotifications] = React.useState(false)
  
  // Tratamos as notificações como ExtendedNotification
  const notifications = rawNotifications as ExtendedNotification[]

  // Garantir que o polling esteja ativo (não precisamos mais chamar fetchNotifications aqui,
  // pois o polling já está fazendo isso automaticamente)
  React.useEffect(() => {
    // Garantir que o polling esteja ativo
    if (!pollingEnabled) {
      togglePolling(true);
    }
    
    // Quando o dropdown é aberto, forçamos uma atualização imediata
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications, fetchNotifications, pollingEnabled, togglePolling]);

  const handleAvatarClick = () => {
    if (!user) {
      router.push("/login")
      return
    }
    fileInputRef.current?.click()
  }
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append("avatar", file)
    const res = await fetch("/api/upload-avatar", {
      method: "POST",
      body: formData,
    })
    if (res.ok) {
      window.location.reload()
    }
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ markAllRead: true }),
      })
      
      if (res.ok) {
        await fetchNotifications()
        toast({
          title: "Notificações",
          description: "Todas as notificações foram marcadas como lidas",
        })
      }
    } catch (error) {
      console.error("Erro ao marcar notificações como lidas:", error)
    }
  }

  const handleNotificationClick = async (id: string) => {
    try {
      await markAsRead(id)
      // Mantém o dropdown aberto
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error)
    }
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {/* Menu de notificações */}
      <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-muted"
            aria-label="Notificações"
          >
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            {unreadCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 min-w-4 sm:min-w-5 h-4 sm:h-5 px-0.5 sm:px-1 text-[10px] sm:text-xs flex items-center justify-center">
                {unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[280px] sm:w-80 flex flex-col" style={{ maxHeight: "90vh" }}>
          <div className="flex items-center justify-between p-3 sm:p-4 border-b">
            <DropdownMenuLabel className="p-0 text-sm sm:text-base font-semibold">
              Notificações
              <div className="text-[10px] sm:text-xs text-muted-foreground font-normal flex items-center gap-1">
                Última atualização: {lastChecked.toLocaleTimeString()}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 sm:h-5 sm:w-5 p-0 hover:bg-transparent" 
                  onClick={() => fetchNotifications()}
                >
                  <RefreshCw className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span className="sr-only">Atualizar</span>
                </Button>
              </div>
            </DropdownMenuLabel>
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-6 sm:h-8 px-1 sm:px-2 text-xs">
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="text-[10px] sm:text-xs">Marcar todas</span>
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-8 sm:w-8" onClick={() => setShowNotifications(false)}>
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="sr-only">Fechar</span>
              </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1" style={{ height: "auto", maxHeight: "60vh" }}>
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Não há notificações</p>
              </div>
            ) : (
              <div className="py-2">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`px-4 py-2 hover:bg-muted cursor-pointer transition-colors ${notification.read === 0 ? 'bg-accent/50' : ''}`}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`mt-0.5 text-${notification.type === 'announce' ? 'amber' : 'blue'}-500`}>
                        {notification.type === 'announce' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-megaphone">
                            <path d="m3 11 18-5v12L3 14v-3z" />
                            <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
                          </svg>
                        ) : (
                          <Bell className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className={`text-sm font-medium ${notification.read === 0 ? 'font-semibold' : ''}`}>
                          {notification.message}
                        </p>
                        {notification.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{notification.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.created_at).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                      {notification.type === 'update' || notification.type === 'announce' ? (
                        <Link href={`/dashboard/updates/${notification.id}`} onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <div className="p-2 border-t mt-auto">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs sm:text-sm h-7 sm:h-8" 
              onClick={() => {
                setShowNotifications(false)
                router.push("/dashboard/updates")
              }}
            >
              Ver todas as atualizações
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-7 w-7 sm:h-8 sm:w-8 rounded-full">
            <Avatar className="h-7 w-7 sm:h-8 sm:w-8" onClick={handleAvatarClick}>
              <AvatarImage src={user?.image || "/placeholder.svg"} alt={user?.name || "Avatar"} />
              <AvatarFallback>{user?.name ? user.name[0].toUpperCase() : "?"}</AvatarFallback>
            </Avatar>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
          </Button>
        </DropdownMenuTrigger>
        {user && (
          <DropdownMenuContent className="w-48 sm:w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-xs sm:text-sm font-medium leading-none">{user.name}</p>
                <p className="text-[10px] sm:text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="px-2 py-1 sm:py-1.5 text-xs sm:text-sm font-normal" onClick={() => router.push("/settings")}> 
                <User className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="px-2 py-1 sm:py-1.5 text-xs sm:text-sm font-normal" onClick={() => router.push("/settings?tab=app")}> 
                <Settings className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              {user.role === "admin" && (
                <DropdownMenuItem className="px-2 py-1 sm:py-1.5 text-xs sm:text-sm font-normal" onClick={() => router.push("/admin")}>
                  <Settings className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Administração</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </DropdownMenuContent>
        )}
      </DropdownMenu>
    </div>
  )
}
