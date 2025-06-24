import { NextResponse } from "next/server"
import { getDatabase, randomUUID } from "@/lib/db"
import { verify } from "jsonwebtoken"
import { getUserById } from "@/lib/auth"
import type { User } from '@/types/database'

// Forçar renderização dinâmica para evitar problemas de 404
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Middleware para verificar se o usuário é admin
async function isAdmin(request: Request) {
  const auth = request.headers.get("Authorization")
  if (!auth) return false
  const token = auth.split(" ")[1]
  try {
    const decoded = verify(token, process.env.JWT_SECRET || "your-secret-key") as { userId: string }
    const db = getDatabase()
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(decoded.userId) as User
    return user && user.role === "admin"
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  try {
    const adminId = await getAdminId(request)
    if (!adminId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }
    
    const { type, message, userId, description } = await request.json()
    
    if (!type || !message || message.trim() === '') {
      return NextResponse.json({ error: "Mensagem e tipo são campos obrigatórios" }, { status: 400 })
    }
    
    if (!['update', 'announce'].includes(type)) {
      return NextResponse.json({ error: "Tipo de notificação inválido" }, { status: 400 })
    }
    
    const db = getDatabase()
    const now = new Date().toISOString()
    
    // Gerar um ID único para a notificação
    const notificationId = randomUUID()
    
    // Verificar se o usuário existe quando userId é fornecido
    if (userId) {
      const user = await db.get<User>('SELECT * FROM users WHERE id = ?', [userId])
      if (!user) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
      }
      
      // Inserir notificação para um usuário específico
      const result = db.prepare('INSERT INTO notifications (id, user_id, type, message, description, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(notificationId, userId, type, message, description || null, adminId, now)
      
      if (result.changes === 0) {
        return NextResponse.json({ error: "Erro ao criar notificação" }, { status: 500 })
      }
    } else {
      // Inserir notificação global (para todos os usuários)
      const result = db.prepare('INSERT INTO notifications (id, user_id, type, message, description, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(notificationId, null, type, message, description || null, adminId, now)
      
      if (result.changes === 0) {
        return NextResponse.json({ error: "Erro ao criar notificação" }, { status: 500 })
      }
    }
    
    // Buscar a notificação criada para retornar
    const createdNotification = db.prepare(`
      SELECT 
        n.id, 
        n.user_id, 
        n.type, 
        n.message, 
        n.description, 
        n.created_at, 
        u.name as creator_name,
        u2.name as recipient_name
      FROM notifications n
      LEFT JOIN users u ON n.created_by = u.id
      LEFT JOIN users u2 ON n.user_id = u2.id
      WHERE n.id = ?
    `).get(notificationId)
    
    return NextResponse.json({ 
      success: true, 
      message: "Notificação criada com sucesso",
      notification: createdNotification
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar notificação:', error)
    return NextResponse.json({ error: 'Erro ao criar notificação' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    if (!await isAdmin(request)) {
      return NextResponse.json({ message: "Acesso negado" }, { status: 403 })
    }
    const db = getDatabase()
    
    // Usamos uma consulta que não agrupa por id para retornar todos os registros
    const notifications = db.prepare(`
      SELECT 
        n.id, 
        n.user_id, 
        n.type, 
        n.message, 
        n.description, 
        n.created_at, 
        u.name as creator_name,
        u2.name as recipient_name,
        n.rowid
      FROM notifications n
      LEFT JOIN users u ON n.created_by = u.id
      LEFT JOIN users u2 ON n.user_id = u2.id
      WHERE n.type IN ('update', 'announce')
      ORDER BY n.created_at DESC
    `).all() as Array<{
      id?: string;
      rowid: number;
      user_id: string | null;
      type: string;
      message: string;
      description?: string;
      created_at: string;
      creator_name?: string;
      recipient_name?: string;
    }>;
    
    // Garantir que todas as notificações tenham IDs válidos
    const validatedNotifications = notifications.map(notification => {
      if (!notification.id) {
        console.warn("Notificação sem ID encontrada no banco de dados, corrigindo...");
        const newId = randomUUID();
        
        // Atualizar o registro no banco de dados
        try {
          db.prepare("UPDATE notifications SET id = ? WHERE rowid = ?").run(newId, notification.rowid);
          notification.id = newId;
        } catch (err) {
          console.error("Erro ao atualizar ID da notificação:", err);
        }
      }
      
      // Remover o campo rowid antes de retornar para o cliente
      const { rowid, ...notificationWithoutRowId } = notification;
      return notificationWithoutRowId;
    });
    
    return NextResponse.json(validatedNotifications)
  } catch (error) {
    console.error("[API] Erro ao buscar notificações:", error)
    return NextResponse.json({ message: "Erro ao buscar notificações" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    if (!await isAdmin(request)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const body = await request.json()
    const { id, type, message, description } = body
    
    if (!id) {
      return NextResponse.json({ error: "ID da notificação não informado" }, { status: 400 })
    }
    
    if (!message) {
      return NextResponse.json({ error: "Mensagem da notificação não pode estar vazia" }, { status: 400 })
    }
    
    if (type && !['update', 'announce'].includes(type)) {
      return NextResponse.json({ error: "Tipo de notificação inválido" }, { status: 400 })
    }

    const db = getDatabase()
    
    // Verificar se a notificação existe
    const notification = db.prepare("SELECT * FROM notifications WHERE id = ?").get(id)
    
    if (!notification) {
      return NextResponse.json({ error: "Notificação não encontrada" }, { status: 404 })
    }

    // Atualizar a notificação
    db.prepare(`
      UPDATE notifications 
      SET message = ?, type = ?, description = ?
      WHERE id = ?
    `).run(message, type, description || null, id)
    
    // Buscar a notificação atualizada
    const updatedNotification = db.prepare(`
      SELECT 
        n.id, 
        n.user_id, 
        n.type, 
        n.message, 
        n.description, 
        n.created_at, 
        u.name as creator_name,
        u2.name as recipient_name
      FROM notifications n
      LEFT JOIN users u ON n.created_by = u.id
      LEFT JOIN users u2 ON n.user_id = u2.id
      WHERE n.id = ?
    `).get(id)

    return NextResponse.json({ 
      success: true, 
      message: "Notificação atualizada com sucesso",
      notification: updatedNotification
    })
  } catch (error) {
    console.error("Erro ao atualizar notificação:", error)
    return NextResponse.json({ error: 'Erro ao atualizar notificação' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    if (!await isAdmin(request)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json({ error: "ID da notificação não informado" }, { status: 400 })
    }
    
    const db = getDatabase()
    
    // Verificar se a notificação existe antes de excluir
    const notification = db.prepare("SELECT * FROM notifications WHERE id = ?").get(id)
    
    if (!notification) {
      return NextResponse.json({ error: "Notificação não encontrada" }, { status: 404 })
    }
    
    // Excluir a notificação
    const result = db.prepare('DELETE FROM notifications WHERE id = ?').run(id)
    
    if (result.changes === 0) {
      return NextResponse.json({ error: "Não foi possível excluir a notificação" }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true,
      message: "Notificação excluída com sucesso" 
    })
  } catch (error) {
    console.error("Erro ao excluir notificação:", error)
    return NextResponse.json({ error: 'Erro ao excluir notificação' }, { status: 500 })
  }
}

// Função auxiliar para pegar o id do admin logado
async function getAdminId(request: Request): Promise<string|null> {
  const auth = request.headers.get("Authorization")
  if (!auth) return null
  const token = auth.split(" ")[1]
  try {
    const decoded = verify(token, process.env.JWT_SECRET || "your-secret-key") as { userId: string }
    const db = getDatabase()
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(decoded.userId) as User
    return user && user.role === "admin" ? user.id : null
  } catch {
    return null
  }
} 