"use client"

import { useAdminGuard } from "@/hooks/use-admin-guard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect, useRef } from "react"
import { toast } from "@/hooks/use-toast"
import { generatePassword } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Copy, Bell, Megaphone, PencilIcon, Trash2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface AdminUser {
  id: string
  name: string
  email: string
  role: "admin" | "user"
}

interface Notification {
  id: string
  type: "update" | "announce"
  message: string
  description?: string
  created_at: string
  creator_name?: string
  user_id?: string | null
  recipient_name?: string
}

export default function AdminPage() {
  const { isAdmin, isLoading } = useAdminGuard()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [newUser, setNewUser] = useState<{ name: string; email: string; role: "admin" | "user" }>({ name: "", email: "", role: "user" })
  const [generatedPassword, setGeneratedPassword] = useState("")
  const [notification, setNotification] = useState<{ message: string, type: "update" | "announce", description?: string }>({ message: "", type: "update", description: "" })
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState<AdminUser | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showPassword, setShowPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const passwordRef = useRef<HTMLInputElement>(null)
  const [notificationUserId, setNotificationUserId] = useState<string>("")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [editingNotificationId, setEditingNotificationId] = useState<string | null>(null)
  const [deletingNotificationId, setDeletingNotificationId] = useState<string | null>(null)

  useEffect(() => {
    if (isAdmin) {
      loadUsers()
      loadNotifications()
    }
  }, [isAdmin])

  const loadNotifications = async () => {
    try {
      console.log("Carregando notificações do servidor...")
      const response = await fetch("/api/admin/notifications", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      })
      if (!response.ok) throw new Error("Erro ao carregar notificações")
      const data = await response.json()
      
      console.log("Notificações carregadas do servidor:", data)
      setNotifications(data)
    } catch (error) {
      console.error("Erro ao carregar notificações:", error)
      toast({
        title: "Erro ao carregar notificações",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    }
  }

  const createNotification = async () => {
    try {
      setLoading(true)
      
      // Validar dados
      if (!notification.message.trim()) {
        toast({
          title: "Erro ao criar notificação",
          description: "A mensagem da notificação não pode estar vazia",
          variant: "destructive",
        })
        return
      }
      
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ 
          ...notification, 
          userId: notificationUserId === "all" ? undefined : notificationUserId || undefined 
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao criar notificação")
      }
      
      toast({
        title: "Notificação criada com sucesso",
        description: notificationUserId && notificationUserId !== "all" 
          ? "Usuário notificado." 
          : "Todos os usuários serão notificados.",
        variant: "default"
      })
      
      // Limpar formulário
      setNotification({ message: "", type: "update", description: "" })
      setNotificationUserId("")
      
      // Recarregar notificações
      await loadNotifications()
    } catch (error) {
      console.error("Erro ao criar notificação:", error)
      toast({
        title: "Erro ao criar notificação",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      })
      if (!response.ok) throw new Error("Erro ao carregar usuários")
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      toast({
        title: "Erro ao carregar usuários",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    }
  }

  const handleCreateOrEditUser = async (user: Partial<AdminUser> & { password?: string, resetPassword?: boolean }) => {
    setLoading(true)
    try {
      let response
      if (editUser) {
        response = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
          body: JSON.stringify({ ...user, id: editUser.id })
        })
      } else {
        response = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
          body: JSON.stringify(user)
        })
      }
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Erro ao salvar usuário")
      if (data.password) setShowPassword(data.password)
      setShowUserModal(false)
      setEditUser(null)
      loadUsers()
      toast({ title: "Usuário salvo com sucesso" })
    } catch (error) {
      toast({ title: "Erro ao salvar usuário", description: error instanceof Error ? error.message : "Tente novamente", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (passwordRef.current) {
      passwordRef.current.select()
      document.execCommand('copy')
      toast({ title: "Senha copiada para a área de transferência" })
    }
  }

  const handleDeleteUser = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/users?id=${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      })
      if (!response.ok) throw new Error("Erro ao excluir usuário")
      setShowDeleteModal(null)
      loadUsers()
      toast({ title: "Usuário excluído com sucesso" })
    } catch (error) {
      toast({ title: "Erro ao excluir usuário", description: error instanceof Error ? error.message : "Tente novamente", variant: "destructive" })
    }
  }

  const handleEditNotification = (notification: Notification) => {
    if (!notification.id) {
      toast({
        title: "Erro ao editar",
        description: "Esta notificação não possui um ID válido.",
        variant: "destructive"
      });
      return;
    }

    setEditingNotificationId(null)
    setNotificationUserId("")
    setNotification({ message: "", type: "update", description: "" })
    
    setTimeout(() => {
      setNotification({
        message: notification.message,
        type: notification.type,
        description: notification.description || ""
      })
      setNotificationUserId(notification.user_id || "all")
      setEditingNotificationId(notification.id)
    }, 50)
  }

  const handleDeleteNotification = async (id: string | null | undefined, alreadyCleared = false) => {
    if (!id) {
      toast({ 
        title: "Erro ao excluir notificação", 
        description: "ID da notificação é inválido", 
        variant: "destructive" 
      });
      return;
    }
    
    try {
      // Só limpa o ID se ainda não foi limpo (pelo modal, por exemplo)
      if (!alreadyCleared) {
        setDeletingNotificationId(null);
      }
      
      const response = await fetch(`/api/admin/notifications?id=${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao excluir notificação");
      }
      
      // Atualizar a lista localmente para feedback imediato
      setNotifications(prev => prev.filter(n => n.id !== id));
      
      toast({ 
        title: "Notificação excluída com sucesso",
        variant: "default"
      });
      
      // Recarregar notificações do servidor para garantir consistência
      loadNotifications();
    } catch (error) {
      console.error("Erro ao excluir notificação:", error);
      toast({ 
        title: "Erro ao excluir notificação", 
        description: error instanceof Error ? error.message : "Tente novamente", 
        variant: "destructive" 
      });
    }
  }

  const saveEditNotification = async () => {
    if (!editingNotificationId) return
    
    try {
      setLoading(true)
      
      const response = await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ 
          id: editingNotificationId, 
          type: notification.type,
          message: notification.message,
          description: notification.description
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao editar notificação");
      }
      
      toast({ 
        title: "Notificação editada com sucesso",
        variant: "default"
      });
      
      setNotification({ message: "", type: "update", description: "" });
      setNotificationUserId("");
      setEditingNotificationId(null);
      
      // Recarregar notificações
      await loadNotifications();
    } catch (error) {
      console.error("Erro ao editar notificação:", error);
      toast({ 
        title: "Erro ao editar notificação", 
        description: error instanceof Error ? error.message : "Tente novamente", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) return <div>Carregando...</div>
  if (!isAdmin) return null

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Administração</h1>
      
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Usuários</CardTitle>
              <CardDescription>
                Adicione, edite ou remova usuários do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => {
                  setNewUser({ name: "", email: "", role: "user" })
                  setShowUserModal(true)
                }}
                className="mb-4"
              >
                Adicionar Usuário
              </Button>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "destructive" : "default"}>
                            {user.role === "admin" ? "Administrador" : "Usuário"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setEditUser(user)
                                setShowUserModal(true)
                              }}
                            >
                              <PencilIcon className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => setShowDeleteModal(user)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Excluir</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Criar Notificação
              </CardTitle>
              <CardDescription>
                Envie atualizações ou anúncios para todos os usuários ou para um usuário específico.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="Mensagem da notificação" 
                className="min-h-[100px]"
                value={notification.message}
                onChange={e => setNotification({ ...notification, message: e.target.value })}
              />
              
              <Textarea 
                placeholder="Descrição (opcional)" 
                className="min-h-[80px]"
                value={notification.description || ""}
                onChange={e => setNotification({ ...notification, description: e.target.value })}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  value={notification.type}
                  onValueChange={(value) => setNotification({ ...notification, type: value as "update" | "announce" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de notificação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="update">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        <span>Atualização</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="announce">
                      <div className="flex items-center gap-2">
                        <Megaphone className="h-4 w-4" />
                        <span>Anúncio</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={notificationUserId || ""}
                  onValueChange={setNotificationUserId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Destinatário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <span>Todos os usuários</span>
                      </div>
                    </SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              {editingNotificationId && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setNotification({ message: "", type: "update", description: "" })
                    setNotificationUserId("")
                    setEditingNotificationId(null)
                  }}
                >
                  Cancelar
                </Button>
              )}
              <Button 
                onClick={editingNotificationId ? saveEditNotification : createNotification}
                disabled={!notification.message || loading}
              >
                {loading ? "Processando..." : (editingNotificationId ? "Salvar Alterações" : "Criar Notificação")}
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Notificações Enviadas</CardTitle>
              <CardDescription>
                Histórico de notificações enviadas para os usuários.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <AlertCircle className="mb-2 h-10 w-10" />
                  <p>Nenhuma notificação enviada ainda.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Mensagem</TableHead>
                          <TableHead>Destinatário</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {notifications.map((notification, index) => {
                          return (
                            <TableRow key={notification.id || index}>
                              <TableCell>
                                <Badge 
                                  variant={notification.type === "announce" ? "secondary" : "default"}
                                  className="flex w-fit items-center gap-1"
                                >
                                  {notification.type === "announce" ? (
                                    <>
                                      <Megaphone className="h-3 w-3" />
                                      <span>Anúncio</span>
                                    </>
                                  ) : (
                                    <>
                                      <Bell className="h-3 w-3" />
                                      <span>Atualização</span>
                                    </>
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  {notification.message}
                                </div>
                                {notification.description && (
                                  <div className="text-xs text-muted-foreground line-clamp-1">
                                    {notification.description}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {notification.user_id ? (
                                  notification.recipient_name || "Usuário específico"
                                ) : (
                                  "Todos os usuários"
                                )}
                              </TableCell>
                              <TableCell>
                                {format(new Date(notification.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleEditNotification(notification)}
                                    disabled={!notification.id}
                                    title="Editar notificação"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                    <span className="sr-only">Editar</span>
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => notification.id && setDeletingNotificationId(notification.id)}
                                    disabled={!notification.id}
                                    title="Excluir notificação"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Excluir</span>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
            <DialogDescription>Preencha os dados do usuário.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Nome"
              value={editUser ? editUser.name : newUser.name}
              onChange={e => editUser ? setEditUser({ ...editUser, name: e.target.value }) : setNewUser({ ...newUser, name: e.target.value })}
            />
            <Input
              placeholder="E-mail"
              value={editUser ? editUser.email : newUser.email}
              onChange={e => editUser ? setEditUser({ ...editUser, email: e.target.value }) : setNewUser({ ...newUser, email: e.target.value })}
            />
            <Select
              value={editUser ? editUser.role : newUser.role}
              onValueChange={role => editUser ? setEditUser({ ...editUser, role: role as "admin" | "user" }) : setNewUser({ ...newUser, role: role as "admin" | "user" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de usuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
            
            {!editUser && (
              <div className="flex gap-2">
                <Input
                  placeholder="Senha (gerada automaticamente)"
                  value={generatedPassword}
                  onChange={e => setGeneratedPassword(e.target.value)}
                />
                <Button type="button" variant="outline" onClick={() => setGeneratedPassword(generatePassword())}>
                  Gerar
                </Button>
              </div>
            )}
            
            {editUser && (
              <div className="flex items-center">
                <input type="checkbox" id="resetPassword" className="mr-2" />
                <label htmlFor="resetPassword">Redefinir senha</label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              onClick={() => {
                if (editUser) {
                  const resetPassword = document.getElementById("resetPassword") as HTMLInputElement
                  handleCreateOrEditUser({
                    name: editUser.name,
                    email: editUser.email,
                    role: editUser.role,
                    resetPassword: resetPassword?.checked
                  })
                } else {
                  handleCreateOrEditUser({
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role,
                    password: generatedPassword || undefined
                  })
                }
              }}
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={Boolean(showDeleteModal)} onOpenChange={(open) => !open && setShowDeleteModal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário {showDeleteModal?.name}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => showDeleteModal && handleDeleteUser(showDeleteModal.id)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog 
        open={Boolean(deletingNotificationId)} 
        onOpenChange={(open) => {
          if (!open) setDeletingNotificationId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir notificação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta notificação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                // Verifica se o ID existe e é válido antes de prosseguir
                const id = deletingNotificationId;
                if (id) {
                  // Limpa o ID antes da chamada para evitar clicks duplos
                  setDeletingNotificationId(null);
                  // Chama a função de exclusão, indicando que o ID já foi limpo
                  handleDeleteNotification(id, true);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {showPassword && (
        <Dialog open={Boolean(showPassword)} onOpenChange={(open) => !open && setShowPassword("")}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Senha do usuário</DialogTitle>
              <DialogDescription>
                Copie esta senha e envie para o usuário. Ela não poderá ser visualizada novamente.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              <Input readOnly value={showPassword} ref={passwordRef} />
              <Button variant="outline" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button>Fechar</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 