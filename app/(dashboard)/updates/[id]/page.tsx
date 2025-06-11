'use client';

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

interface Notification {
  id: string
  message: string
  type: string
  created_at: string
  description?: string
  creator_name?: string
}

export default function UpdateDetailPage() {
  const params = useParams()
  const [notification, setNotification] = useState<Notification | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!params?.id) return
    fetch(`/api/admin/notifications`, {
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(data => {
        const found = data.find((n: Notification) => n.id === params.id)
        setNotification(found)
        setLoading(false)
      })
  }, [params?.id])

  if (loading) return <div className="p-6">Carregando...</div>
  if (!notification) return <div className="p-6">Atualização não encontrada.</div>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">{notification.type === "announce" ? "📢 Anúncio" : "🔔 Atualização"}</h1>
      <div className="prose prose-lg dark:prose-invert mb-4">{notification.message}</div>
      {notification.description && <div className="prose prose-sm dark:prose-invert text-muted-foreground mb-4">{notification.description}</div>}
      <div className="text-xs text-muted-foreground mb-2">{new Date(notification.created_at).toLocaleString("pt-BR")}</div>
      {notification.creator_name && <div className="text-xs text-muted-foreground">Criado por: {notification.creator_name}</div>}
    </div>
  )
} 