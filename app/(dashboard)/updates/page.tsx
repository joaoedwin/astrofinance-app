import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Notification {
  id: string
  message: string
  type: string
  created_at: string
  description?: string
}

export default function UpdatesPage() {
  const [updates, setUpdates] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/admin/notifications", {
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(data => {
        setUpdates(data)
        setLoading(false)
      })
  }, [])

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Atualizações e Anúncios</h1>
      {loading ? <div>Carregando...</div> : (
        <div className="space-y-6">
          {updates.map((n) => (
            <div key={n.id} className="p-4 rounded border bg-card shadow">
              <Link href={`/dashboard/updates/${n.id}`} className="block hover:underline">
                <div className="font-semibold text-lg mb-1">{n.type === "announce" ? "📢 Anúncio" : "🔔 Atualização"}</div>
                <div className="prose prose-sm dark:prose-invert mb-2">{n.message}</div>
                {n.description && <div className="prose prose-xs dark:prose-invert text-muted-foreground mb-2">{n.description}</div>}
                <div className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("pt-BR")}</div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 