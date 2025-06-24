"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, MegaphoneIcon, Info, HomeIcon, LayoutDashboard } from "lucide-react"
import { useAuthContext } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

interface Notification {
  id: string | null
  message: string
  type: string
  created_at: string
  description?: string
  read?: 0 | 1
}

export default function UpdatesPage() {
  const [updates, setUpdates] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { user, isLoading } = useAuthContext()

  // Verificação de autenticação
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Acesso negado",
        description: "Você precisa estar autenticado para acessar esta página.",
        variant: "destructive",
      })
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (!user) return
    
    // Usando a API correta de notificações para usuários regulares
    fetch("/api/notifications", {
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("Falha ao carregar notificações")
        }
        return res.json()
      })
      .then(data => {
        // Filtrando apenas os tipos update e announce
        const filteredData = data.filter((n: Notification) => 
          n.type === "update" || n.type === "announce"
        );
        // Gerando IDs únicos para notificações com ID nulo
        const processedData = filteredData.map((notification: Notification, index: number) => {
          if (notification.id === null) {
            return { ...notification, id: `generated-${index}-${Date.now()}` };
          }
          return notification;
        });
        console.log("Notificações carregadas:", processedData);
        setUpdates(processedData)
        setLoading(false)
      })
      .catch(error => {
        console.error("Erro ao carregar notificações:", error);
        toast({
          title: "Erro ao carregar notificações",
          description: "Tente novamente mais tarde.",
          variant: "destructive",
        })
        setLoading(false);
      })
  }, [user])

  // Agrupar notificações por tipo
  const announcements = updates.filter(n => n.type === "announce");
  const updatesOnly = updates.filter(n => n.type === "update");

  // Se estiver carregando o status de autenticação, mostre um indicador de carregamento
  if (isLoading) {
    return (
      <div className="container p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  // Se não estiver autenticado, não renderize o conteúdo
  if (!user) {
    return null
  }

  return (
    <div className="container p-6 max-w-7xl mx-auto">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex flex-col space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Central de Atualizações</h2>
            <p className="text-muted-foreground">
              Esta página centraliza todas as atualizações e anúncios importantes do sistema FinanceTrack.

// Forçar renderização dinâmica para evitar problemas com cookies
export const dynamic = 'force-dynamic';
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')} className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>
        
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="announcements">Anúncios</TabsTrigger>
            <TabsTrigger value="updates">Atualizações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : updates.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {updates.map((notification) => (
                  <Card key={notification.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <Link href={`/dashboard/updates/${notification.id}`} className="block">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {notification.type === "announce" ? (
                              <div className="rounded-full bg-amber-500/10 p-1 text-amber-500">
                                <MegaphoneIcon className="h-4 w-4" />
                              </div>
                            ) : (
                              <div className="rounded-full bg-blue-500/10 p-1 text-blue-500">
                                <Bell className="h-4 w-4" />
                              </div>
                            )}
                            <CardTitle className="text-lg">
                              {notification.type === "announce" ? "Anúncio" : "Atualização"}
                            </CardTitle>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="font-medium text-base mb-1 line-clamp-2">{notification.message}</div>
                        {notification.description && (
                          <CardDescription className="line-clamp-2">{notification.description}</CardDescription>
                        )}
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <Info className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-lg font-medium">Nenhuma atualização disponível no momento.</p>
                  <p className="text-sm text-muted-foreground mt-2">Volte mais tarde para ver novidades.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="announcements" className="space-y-4">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : announcements.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {announcements.map((notification) => (
                  <Card key={notification.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <Link href={`/dashboard/updates/${notification.id}`} className="block">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="rounded-full bg-amber-500/10 p-1 text-amber-500">
                              <MegaphoneIcon className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-lg">Anúncio</CardTitle>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="font-medium text-base mb-1 line-clamp-2">{notification.message}</div>
                        {notification.description && (
                          <CardDescription className="line-clamp-2">{notification.description}</CardDescription>
                        )}
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <Info className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-lg font-medium">Nenhum anúncio disponível no momento.</p>
                  <p className="text-sm text-muted-foreground mt-2">Volte mais tarde para ver novidades.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="updates" className="space-y-4">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : updatesOnly.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {updatesOnly.map((notification) => (
                  <Card key={notification.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <Link href={`/dashboard/updates/${notification.id}`} className="block">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="rounded-full bg-blue-500/10 p-1 text-blue-500">
                              <Bell className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-lg">Atualização</CardTitle>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="font-medium text-base mb-1 line-clamp-2">{notification.message}</div>
                        {notification.description && (
                          <CardDescription className="line-clamp-2">{notification.description}</CardDescription>
                        )}
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <Info className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-lg font-medium">Nenhuma atualização disponível no momento.</p>
                  <p className="text-sm text-muted-foreground mt-2">Volte mais tarde para ver novidades.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 