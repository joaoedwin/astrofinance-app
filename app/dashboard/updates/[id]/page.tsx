"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Bell, MegaphoneIcon, CalendarIcon, UserIcon, HomeIcon, LayoutDashboard } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useAuthContext } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

interface Notification {
  id: string | null
  message: string
  type: string
  created_at: string
  description?: string
  creator_name?: string
  read?: 0 | 1
  notes?: string
}

export default function UpdateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [notification, setNotification] = useState<Notification | null>(null)
  const [loading, setLoading] = useState(true)
  const [relatedUpdates, setRelatedUpdates] = useState<Notification[]>([])
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
    if (!params?.id || !user) return
    
    fetch(`/api/notifications`, {
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("Falha ao carregar notificações")
        }
        return res.json()
      })
      .then(data => {
        // Processar IDs nulos
        const processedData = data.map((n: Notification, index: number) => {
          if (n.id === null) {
            return { ...n, id: `generated-${index}-${Date.now()}` };
          }
          return n;
        });
        
        const idToFind = params.id as string;
        // Para IDs gerados na página anterior
        if (idToFind.startsWith('generated-')) {
          // Vamos usar o índice e data de criação para encontrar uma correspondência aproximada
          const parts = idToFind.split('-');
          const index = parseInt(parts[1]);
          
          // Filtrar notificações do mesmo tipo
          const filtered = processedData.filter((n: Notification) => 
            n.type === "update" || n.type === "announce"
          );
          
          // Usar o mesmo índice se possível
          const found = index < filtered.length ? filtered[index] : null;
          setNotification(found);
        } else {
          // Para IDs normais
          const found = processedData.find((n: Notification) => n.id === params.id);
          setNotification(found || null);
        }
        
        // Obter atualizações relacionadas (do mesmo tipo)
        const currentNotification = processedData.find((n: Notification) => 
          n.id === params.id || (idToFind.startsWith('generated-') && processedData.indexOf(n) === parseInt(idToFind.split('-')[1]))
        );

        if (currentNotification) {
          const related = processedData
            .filter((n: Notification) => 
              (n.type === currentNotification.type) && 
              (n.id !== currentNotification?.id) && 
              (n.type === "update" || n.type === "announce")
            )
            .slice(0, 3);
          setRelatedUpdates(related);
        }
        
        setLoading(false);
        
        // Marcar como lida se não estiver
        const foundNotification = processedData.find((n: Notification) => 
          n.id === params.id || 
          (n.id === null && idToFind.startsWith('generated-'))
        );
        
        if (foundNotification && foundNotification.read === 0) {
          fetch('/api/notifications', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({ id: foundNotification.id, read: true })
          }).catch(error => console.error("Erro ao marcar como lida:", error))
        }
      })
      .catch(error => {
        console.error("Erro ao carregar notificação:", error)
        toast({
          title: "Erro ao carregar notificação",
          description: "Não foi possível obter os detalhes. Tente novamente mais tarde.",
          variant: "destructive",
        })
        setLoading(false)
      })
  }, [params?.id, user])

  // Se estiver carregando o status de autenticação, mostre um indicador de carregamento
  if (isLoading) {
    return (
      <div className="container p-6 max-w-4xl mx-auto">
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

  if (loading) return (
    <div className="container p-6 max-w-4xl mx-auto">
      <div className="animate-pulse flex flex-col gap-4">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
      </div>
    </div>
  )
  
  if (!notification) return (
    <div className="container p-6 max-w-4xl mx-auto">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Atualização não encontrada</h1>
          <p className="text-muted-foreground mb-6">A notificação que você está procurando não existe ou foi removida.</p>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/updates">Todas as atualizações</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const formattedDate = new Date(notification.created_at).toLocaleString("pt-BR", {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="container p-6 max-w-4xl mx-auto">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-fit px-2 flex items-center gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => router.push('/dashboard/updates')}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para todas as atualizações
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => router.push('/dashboard')}
          >
            <LayoutDashboard className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <Badge variant={notification.type === "announce" ? "secondary" : "default"} className="px-3 py-1.5">
                <div className="flex items-center gap-2">
                  {notification.type === "announce" ? (
                    <MegaphoneIcon className="h-3.5 w-3.5" />
                  ) : (
                    <Bell className="h-3.5 w-3.5" />
                  )}
                  <span>{notification.type === "announce" ? "Anúncio" : "Atualização"}</span>
                </div>
              </Badge>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarIcon className="h-3.5 w-3.5" />
                <span>{formattedDate}</span>
              </div>
            </div>
            
            <CardTitle className="text-2xl">{notification.message}</CardTitle>
            
            {notification.creator_name && (
              <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                <UserIcon className="h-3.5 w-3.5" />
                <span>Publicado por {notification.creator_name}</span>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="space-y-4">
            {notification.description && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-base leading-relaxed whitespace-pre-wrap">{notification.description}</p>
              </div>
            )}
            
            {notification.notes && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Notas adicionais</h3>
                <div className="bg-muted/50 p-4 rounded-md">
                  <p className="whitespace-pre-wrap text-sm">{notification.notes}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {relatedUpdates.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-semibold">Atualizações relacionadas</h2>
              <Separator className="flex-1" />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {relatedUpdates.map(update => (
                <Card key={update.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <Link href={`/dashboard/updates/${update.id}`} className="block">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {update.type === "announce" ? (
                            <div className="rounded-full bg-amber-500/10 p-1 text-amber-500">
                              <MegaphoneIcon className="h-4 w-4" />
                            </div>
                          ) : (
                            <div className="rounded-full bg-blue-500/10 p-1 text-blue-500">
                              <Bell className="h-4 w-4" />
                            </div>
                          )}
                          <CardTitle className="text-lg">
                            {update.type === "announce" ? "Anúncio" : "Atualização"}
                          </CardTitle>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(update.created_at).toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="font-medium text-base mb-1 line-clamp-2">{update.message}</div>
                      {update.description && (
                        <CardDescription className="line-clamp-2">{update.description}</CardDescription>
                      )}
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 