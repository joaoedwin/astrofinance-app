// import { randomUUID } from 'crypto' // Removido - crypto.randomUUID() é global em Workers
import type { Category, Transaction } from '../types/database' // Adicionado Transaction aqui

// Funções para manipulação de categorias
export async function getCategories(d1: D1Database, userId: string, type?: 'income' | 'expense'): Promise<Category[]> {
  let query = 'SELECT * FROM categories WHERE user_id = ?'
  const params: any[] = [userId]

  if (type) {
    query += ' AND type = ?'
    params.push(type)
  }
  query += ' ORDER BY name'

  const { results } = await d1.prepare(query).bind(...params).all<Category>()
  return results || []
}

export async function createCategory(d1: D1Database, name: string, type: 'income' | 'expense', userId: string): Promise<Category | null> {
  const id = crypto.randomUUID() // Alterado para crypto.randomUUID()

  const insertQuery = 'INSERT INTO categories (id, name, type, user_id) VALUES (?, ?, ?, ?)'
  await d1.prepare(insertQuery).bind(id, name, type, userId).run()

  const selectQuery = 'SELECT * FROM categories WHERE id = ? AND user_id = ?'
  const category = await d1.prepare(selectQuery).bind(id, userId).first<Category>()

  return category
}

export async function updateCategory(d1: D1Database, id: string, name: string, type: 'income' | 'expense', userId: string): Promise<Category | null> {
  const updateQuery = 'UPDATE categories SET name = ?, type = ? WHERE id = ? AND user_id = ?'
  await d1.prepare(updateQuery).bind(name, type, id, userId).run()

  const selectQuery = 'SELECT * FROM categories WHERE id = ? AND user_id = ?'
  const category = await d1.prepare(selectQuery).bind(id, userId).first<Category>()

  return category
}

export async function deleteCategory(d1: D1Database, id: string, userId: string): Promise<boolean> {
  const query = 'DELETE FROM categories WHERE id = ? AND user_id = ?'
  const { success } = await d1.prepare(query).bind(id, userId).run()
  return success
}

export async function getCategoryById(d1: D1Database, categoryId: string, userId: string): Promise<Category | null> {
  const query = 'SELECT * FROM categories WHERE id = ? AND user_id = ?';
  const category = await d1.prepare(query).bind(categoryId, userId).first<Category>();
  return category;
}

// --- Funções para Transações ---
export async function getTransactions(
  d1: D1Database,
  userId: string,
  month?: string, // formato YYYY-MM
  type?: 'income' | 'expense'
): Promise<(Transaction & { category_name?: string })[]> {
  let query = `
    SELECT t.*, c.name as category_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ?
  `;
  const params: any[] = [userId];

  if (month) {
    query += " AND strftime('%Y-%m', t.date) = ?";
    params.push(month);
  }
  if (type) {
    query += " AND t.type = ?";
    params.push(type);
  }
  query += ' ORDER BY t.date DESC, t.created_at DESC';
  
  const { results } = await d1.prepare(query).bind(...params).all<Transaction & { category_name?: string }>();
  return results || [];
}

export async function getTransactionById(d1: D1Database, id: string, userId: string): Promise<(Transaction & { category_name?: string }) | null> {
  const query = `
    SELECT t.*, c.name as category_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ? AND t.user_id = ?
  `;
  return await d1.prepare(query).bind(id, userId).first<Transaction & { category_name?: string }>();
}

export async function createTransaction(d1: D1Database, data: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction | null> {
  const id = crypto.randomUUID(); // Alterado para crypto.randomUUID()
  const query = `
    INSERT INTO transactions (id, date, description, amount, type, category_id, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  await d1.prepare(query).bind(
    id,
    data.date,
    data.description,
    data.amount,
    data.type,
    data.category_id,
    data.user_id
  ).run();

  return await getTransactionById(d1, id, data.user_id);
}

export async function updateTransaction(d1: D1Database, id: string, userId: string, data: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at'>>): Promise<Transaction | null> {
  const { date, description, amount, type, category_id } = data;
  if (!date || !description || amount === undefined || !type || !category_id) {
    throw new Error("Campos insuficientes para atualização da transação.");
  }

  const query = `
    UPDATE transactions
    SET date = ?, description = ?, amount = ?, type = ?, category_id = ?
    WHERE id = ? AND user_id = ?
  `;
  await d1.prepare(query).bind(
    date,
    description,
    amount,
    type,
    category_id,
    id,
    userId
  ).run();

  return await getTransactionById(d1, id, userId);
}

export async function deleteTransaction(d1: D1Database, id: string, userId: string): Promise<boolean> {
  const query = 'DELETE FROM transactions WHERE id = ? AND user_id = ?';
  const { success } = await d1.prepare(query).bind(id, userId).run();
  return success;
}

// --- Funções para Goals ---
import type { Goal, GoalStatus, GoalType, GoalRecurrence, GoalReserve } from '../types/database'; // Adicionado GoalReserve

export async function getGoals(d1: D1Database, userId: string): Promise<Goal[]> {
  const query = `
    SELECT g.*, c.name as category_name
    FROM goals g
    LEFT JOIN categories c ON g.category_id = c.id
    WHERE g.user_id = ?
    ORDER BY g.created_at DESC
  `;
  const { results } = await d1.prepare(query).bind(userId).all<Goal & { category_name?: string }>();
  return results || [];
}

export async function getGoalById(d1: D1Database, id: string, userId: string): Promise<(Goal & { category_name?: string }) | null> {
  const query = `
    SELECT g.*, c.name as category_name
    FROM goals g
    LEFT JOIN categories c ON g.category_id = c.id
    WHERE g.id = ? AND g.user_id = ?
  `;
  return await d1.prepare(query).bind(id, userId).first<Goal & { category_name?: string }>();
}

// Para criação, alguns campos têm default no DB (current_amount, status, created_at)
// ou são opcionais (description, category_id, recurrence, end_date, completed_at)
type CreateGoalData = {
  user_id: string;
  name: string;
  description?: string;
  target_amount: number;
  category_id?: string;
  type: GoalType;
  recurrence?: GoalRecurrence;
  start_date: string; // YYYY-MM-DD
  end_date?: string;   // YYYY-MM-DD
};

export async function createGoal(d1: D1Database, data: CreateGoalData): Promise<Goal | null> {
  const id = crypto.randomUUID();
  const query = `
    INSERT INTO goals (id, user_id, name, description, target_amount, category_id, type, recurrence, start_date, end_date, status, current_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 0)
  `;
  await d1.prepare(query).bind(
    id,
    data.user_id,
    data.name,
    data.description || null,
    data.target_amount,
    data.category_id || null,
    data.type,
    data.recurrence || null,
    data.start_date,
    data.end_date || null
  ).run();

  return await getGoalById(d1, id, data.user_id);
}

// Para update, permitir atualização de campos selecionados.
// Não permitir update direto de current_amount aqui, usar addAmountToGoal.
type UpdateGoalData = Partial<Omit<CreateGoalData, 'user_id'> & { status?: GoalStatus, completed_at?: string | null }>;

export async function updateGoal(d1: D1Database, id: string, userId: string, data: UpdateGoalData): Promise<Goal | null> {
  // Construir a query de update dinamicamente é mais complexo e seguro.
  // Por simplicidade, vamos permitir atualizar um conjunto fixo de campos.
  // ATENÇÃO: Isso é simplificado. Uma implementação real deveria validar os campos
  // e construir a query SET dinamicamente para evitar sobrescrever com null indevidamente.
  const { name, description, target_amount, category_id, type, recurrence, start_date, end_date, status, completed_at } = data;

  if (!name || !target_amount || !type || !start_date) { // Validar campos obrigatórios mínimos para um update
    throw new Error("Campos essenciais (name, target_amount, type, start_date) devem ser fornecidos para atualização.");
  }

  const query = `
    UPDATE goals
    SET name = ?, description = ?, target_amount = ?, category_id = ?, type = ?,
        recurrence = ?, start_date = ?, end_date = ?, status = ?, completed_at = ?
    WHERE id = ? AND user_id = ?
  `;
  await d1.prepare(query).bind(
    name,
    description || null,
    target_amount,
    category_id || null,
    type,
    recurrence || null,
    start_date,
    end_date || null,
    status || 'active', // Default status se não fornecido
    status === 'completed' && !completed_at ? new Date().toISOString() : completed_at, // Define completed_at se status for completed
    id,
    userId
  ).run();

  return await getGoalById(d1, id, userId);
}

export async function deleteGoal(d1: D1Database, id: string, userId: string): Promise<boolean> {
  // Considerar o que acontece com goal_reserves associadas (ON DELETE CASCADE no D1 deve cuidar disso)
  const query = 'DELETE FROM goals WHERE id = ? AND user_id = ?';
  const { success } = await d1.prepare(query).bind(id, userId).run();
  return success;
}

export async function addAmountToGoal(d1: D1Database, id: string, userId: string, amountToAdd: number): Promise<Goal | null> {
  // Primeiro, buscar a meta para garantir que ela existe e pertence ao usuário
  const goal = await getGoalById(d1, id, userId);
  if (!goal) {
    return null; // Ou lançar um erro
  }

  // Atualizar current_amount e verificar se atingiu o target_amount
  const newCurrentAmount = (goal.current_amount || 0) + amountToAdd;
  let newStatus = goal.status;
  let newCompletedAt = goal.completed_at;

  if (newCurrentAmount >= goal.target_amount && goal.status !== 'completed') {
    newStatus = 'completed';
    newCompletedAt = new Date().toISOString();
  }

  // Se o valor adicionado for negativo e baixar do target, e estava completa, reativar? (Regra de negócio)
  // Por enquanto, vamos manter simples: uma vez completa, permanece completa a menos que explicitamente mudada.

  const query = `
    UPDATE goals
    SET current_amount = ?, status = ?, completed_at = ?
    WHERE id = ? AND user_id = ?
  `;
  await d1.prepare(query).bind(
    newCurrentAmount,
    newStatus,
    newCompletedAt,
    id,
    userId
  ).run();

  // Retornar a meta atualizada
  // Precisamos buscar novamente para ter todos os campos, incluindo category_name
  const updatedGoal = await getGoalById(d1, id, userId);
  return updatedGoal;
}

// --- Funções para Credit Cards ---
import type { CreditCard } from '../types/database';

export async function getCreditCards(d1: D1Database, userId: string): Promise<CreditCard[]> {
  const query = 'SELECT * FROM credit_cards WHERE userId = ? ORDER BY name ASC';
  const { results } = await d1.prepare(query).bind(userId).all<CreditCard>();
  return results || [];
}

export async function getCreditCardById(d1: D1Database, id: number, userId: string): Promise<CreditCard | null> {
  const query = 'SELECT * FROM credit_cards WHERE id = ? AND userId = ?';
  return await d1.prepare(query).bind(id, userId).first<CreditCard>();
}

// Para criação, createdAt e updatedAt serão definidos. ID é autoincrementado.
type CreateCreditCardData = Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt'>;

export async function createCreditCard(d1: D1Database, data: CreateCreditCardData): Promise<CreditCard | null> {
  const now = new Date().toISOString();
  const query = `
    INSERT INTO credit_cards (userId, name, color, lastFourDigits, bank, cardLimit, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  // D1 .run() retorna meta.last_row_id para INTEGER PRIMARY KEY
  const { meta } = await d1.prepare(query).bind(
    data.userId,
    data.name,
    data.color,
    data.lastFourDigits || null,
    data.bank || null,
    data.cardLimit || null,
    now,
    now
  ).run();

  if (meta.last_row_id) {
    return await getCreditCardById(d1, meta.last_row_id, data.userId);
  }
  return null;
}

type UpdateCreditCardData = Partial<Omit<CreditCard, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

export async function updateCreditCard(d1: D1Database, id: number, userId: string, data: UpdateCreditCardData): Promise<CreditCard | null> {
  const now = new Date().toISOString();
  // Construir a query de update dinamicamente seria mais robusto
  // Por simplicidade, atualizaremos os campos fornecidos.
  const { name, color, lastFourDigits, bank, cardLimit } = data;

  // Pelo menos um campo para atualizar deve ser fornecido
  if (name === undefined && color === undefined && lastFourDigits === undefined && bank === undefined && cardLimit === undefined) {
    throw new Error("Nenhum dado fornecido para atualização do cartão de crédito.");
  }

  // Coletar campos e valores para o SET dinamicamente
  const setClauses: string[] = [];
  const params: any[] = [];

  if (name !== undefined) { setClauses.push('name = ?'); params.push(name); }
  if (color !== undefined) { setClauses.push('color = ?'); params.push(color); }
  if (lastFourDigits !== undefined) { setClauses.push('lastFourDigits = ?'); params.push(lastFourDigits); }
  if (bank !== undefined) { setClauses.push('bank = ?'); params.push(bank); }
  if (cardLimit !== undefined) { setClauses.push('cardLimit = ?'); params.push(cardLimit); }

  params.push(now); // for updatedAt
  params.push(id);
  params.push(userId);

  const query = `
    UPDATE credit_cards
    SET ${setClauses.join(', ')}, updatedAt = ?
    WHERE id = ? AND userId = ?
  `;

  await d1.prepare(query).bind(...params).run();
  return await getCreditCardById(d1, id, userId);
}

export async function deleteCreditCard(d1: D1Database, id: number, userId: string): Promise<boolean> {
  // Verificar se existem parcelamentos usando este cartão antes de deletar
  const installmentCheckQuery = 'SELECT COUNT(*) as count FROM installments WHERE creditCardId = ? AND userId = ?';
  const { results: installmentResults } = await d1.prepare(installmentCheckQuery).bind(id, userId).all<{count: number}>();
  if (installmentResults && installmentResults[0] && installmentResults[0].count > 0) {
    throw new Error("Não é possível excluir um cartão de crédito que possui parcelamentos associados.");
  }

  const query = 'DELETE FROM credit_cards WHERE id = ? AND userId = ?';
  const { success } = await d1.prepare(query).bind(id, userId).run();
  return success;
}

// --- Funções para Notifications ---
import type { Notification } from '../types/database';

export async function getNotifications(d1: D1Database, userId: string, onlyUnread: boolean = false): Promise<Notification[]> {
  let query = 'SELECT * FROM notifications WHERE user_id = ?';
  const params: any[] = [userId];
  if (onlyUnread) {
    query += ' AND read = 0';
  }
  query += ' ORDER BY created_at DESC';
  const { results } = await d1.prepare(query).bind(...params).all<Notification>();
  return results || [];
}

export async function getNotificationById(d1: D1Database, id: string, userId: string): Promise<Notification | null> {
    const query = 'SELECT * FROM notifications WHERE id = ? AND user_id = ?';
    return await d1.prepare(query).bind(id, userId).first<Notification>();
}

// 'read' tem default 0, 'created_at' é default no DB.
type CreateNotificationData = Omit<Notification, 'id' | 'created_at' | 'read'>;

export async function createNotification(d1: D1Database, data: CreateNotificationData): Promise<Notification | null> {
  const id = crypto.randomUUID();
  const query = `
    INSERT INTO notifications (id, user_id, type, message, description, created_by, goal_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  await d1.prepare(query).bind(
    id,
    data.user_id,
    data.type || null,
    data.message || null,
    data.description || null,
    data.created_by || null,
    data.goal_id || null
  ).run();

  // Não podemos usar getNotificationById diretamente se user_id pode ser NULL na tabela para notificações de sistema.
  // Mas para notificações criadas aqui, user_id é obrigatório no tipo CreateNotificationData.
  return await d1.prepare('SELECT * FROM notifications WHERE id = ?').bind(id).first<Notification>();
}

export async function markNotificationAsRead(d1: D1Database, id: string, userId: string): Promise<Notification | null> {
  // Garantir que a notificação pertence ao usuário antes de marcar como lida
  const notification = await getNotificationById(d1, id, userId);
  if (!notification) {
    throw new Error("Notificação não encontrada ou não pertence ao usuário.");
  }
  const query = 'UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?';
  await d1.prepare(query).bind(id, userId).run();
  return { ...notification, read: 1 }; // Retorna a notificação atualizada otimisticamente
}

export async function markAllNotificationsAsRead(d1: D1Database, userId: string): Promise<boolean> {
  const query = 'UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0';
  const { success, meta } = await d1.prepare(query).bind(userId).run();
  // success indica que a query rodou, meta.changes dirá quantas foram atualizadas.
  return success && (meta.changes !== undefined && meta.changes > 0);
}

export async function deleteNotification(d1: D1Database, id: string, userId: string): Promise<boolean> {
  const query = 'DELETE FROM notifications WHERE id = ? AND user_id = ?';
  const { success } = await d1.prepare(query).bind(id, userId).run();
  return success;
}


// --- Funções para Installments ---
import type { Installment } from '../types/database';
import { addMonths, format as formatDateFns } from 'date-fns'; // Para calcular nextPaymentDate

export async function getInstallments(d1: D1Database, userId: string): Promise<Installment[]> {
  const query = `
    SELECT
      i.*,
      c.name as category_name,
      cc.name as credit_card_name
    FROM installments i
    JOIN categories c ON i.category_id = c.id
    LEFT JOIN credit_cards cc ON i.creditCardId = cc.id
    WHERE i.userId = ?
    ORDER BY i.nextPaymentDate ASC, i.createdAt DESC
  `;
  const { results } = await d1.prepare(query).bind(userId).all<Installment>();
  return results || [];
}

export async function getInstallmentById(d1: D1Database, id: string, userId: string): Promise<Installment | null> {
  const query = `
    SELECT
      i.*,
      c.name as category_name,
      cc.name as credit_card_name
    FROM installments i
    JOIN categories c ON i.category_id = c.id
    LEFT JOIN credit_cards cc ON i.creditCardId = cc.id
    WHERE i.id = ? AND i.userId = ?
  `;
  return await d1.prepare(query).bind(id, userId).first<Installment>();
}

// paidInstallments e type têm defaults. created_at é automático.
type CreateInstallmentData = Omit<Installment, 'id' | 'created_at' | 'paidInstallments' | 'type' | 'category_name' | 'credit_card_name'>;

export async function createInstallment(d1: D1Database, data: CreateInstallmentData): Promise<Installment | null> {
  const id = crypto.randomUUID();
  // nextPaymentDate é geralmente o mesmo que startDate para a primeira parcela,
  // ou calculado com base na recorrência (assumindo mensal aqui)
  const nextPaymentDate = data.startDate; // Pode ser ajustado se a lógica for diferente

  const query = `
    INSERT INTO installments
      (id, description, category_id, totalAmount, installmentAmount, totalInstallments,
       startDate, nextPaymentDate, userId, type, creditCardId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'expense', ?)
  `;
  await d1.prepare(query).bind(
    id, data.description, data.category_id, data.totalAmount, data.installmentAmount, data.totalInstallments,
    data.startDate, nextPaymentDate, data.userId, data.creditCardId || null
  ).run();

  return await getInstallmentById(d1, id, data.userId);
}

// Não permitir update de paidInstallments ou nextPaymentDate diretamente aqui. Usar payNextInstallment.
type UpdateInstallmentData = Partial<Omit<CreateInstallmentData, 'userId'>>;

export async function updateInstallment(d1: D1Database, id: string, userId: string, data: UpdateInstallmentData): Promise<Installment | null> {
  const { description, category_id, totalAmount, installmentAmount, totalInstallments, startDate, creditCardId } = data;

  // Validar que pelo menos um campo está sendo atualizado
  if (Object.keys(data).length === 0) {
    throw new Error("Nenhum dado fornecido para atualização do parcelamento.");
  }

  // Reconstruir a query dinamicamente para atualizar apenas os campos fornecidos
  const setClauses: string[] = [];
  const params: any[] = [];

  if (description !== undefined) { setClauses.push('description = ?'); params.push(description); }
  if (category_id !== undefined) { setClauses.push('category_id = ?'); params.push(category_id); }
  if (totalAmount !== undefined) { setClauses.push('totalAmount = ?'); params.push(totalAmount); }
  if (installmentAmount !== undefined) { setClauses.push('installmentAmount = ?'); params.push(installmentAmount); }
  if (totalInstallments !== undefined) { setClauses.push('totalInstallments = ?'); params.push(totalInstallments); }
  if (startDate !== undefined) {
    setClauses.push('startDate = ?'); params.push(startDate);
    // Se startDate muda, nextPaymentDate também deveria ser recalculado, mas isso complica.
    // Por enquanto, se startDate for atualizado, nextPaymentDate não é automaticamente atualizado aqui.
    // A lógica de payNextInstallment lida com o avanço de nextPaymentDate.
  }
  if (creditCardId !== undefined) { setClauses.push('creditCardId = ?'); params.push(creditCardId); }

  if (setClauses.length === 0) {
    throw new Error("Nenhum campo válido fornecido para atualização.");
  }

  params.push(id);
  params.push(userId);

  const query = `UPDATE installments SET ${setClauses.join(', ')} WHERE id = ? AND userId = ?`;

  await d1.prepare(query).bind(...params).run();
  return await getInstallmentById(d1, id, userId);
}

export async function deleteInstallment(d1: D1Database, id: string, userId: string): Promise<boolean> {
  const query = 'DELETE FROM installments WHERE id = ? AND userId = ?';
  const { success } = await d1.prepare(query).bind(id, userId).run();
  return success;
}

export async function payNextInstallment(d1: D1Database, id: string, userId: string): Promise<Installment | null> {
  const installment = await getInstallmentById(d1, id, userId);
  if (!installment) {
    throw new Error("Parcelamento não encontrado ou não pertence ao usuário.");
  }

  if (installment.paidInstallments >= installment.totalInstallments) {
    throw new Error("Todas as parcelas já foram pagas.");
  }

  const newPaidInstallments = installment.paidInstallments + 1;
  let newNextPaymentDate = installment.nextPaymentDate;

  if (newPaidInstallments < installment.totalInstallments) {
    // Calcula a próxima data de pagamento adicionando 1 mês à data da última nextPaymentDate
    // É importante que nextPaymentDate esteja no formato YYYY-MM-DD
    try {
      const currentNextPayment = new Date(installment.nextPaymentDate + "T00:00:00"); // Adicionar T00:00:00 para evitar problemas de fuso horário ao parsear
      newNextPaymentDate = formatDateFns(addMonths(currentNextPayment, 1), 'yyyy-MM-dd');
    } catch (e) {
      console.error("Erro ao calcular nova nextPaymentDate:", e);
      throw new Error("Formato inválido da nextPaymentDate para calcular o próximo pagamento.");
    }
  }
  // Se for a última parcela, nextPaymentDate pode ser mantida ou definida como null/outro valor.
  // Por enquanto, ela será a data da última parcela paga.

  const query = 'UPDATE installments SET paidInstallments = ?, nextPaymentDate = ? WHERE id = ? AND userId = ?';
  await d1.prepare(query).bind(newPaidInstallments, newNextPaymentDate, id, userId).run();

  return await getInstallmentById(d1, id, userId);
}


// --- Funções para Goal Reserves ---
import type { GoalReserve } from '../types/database';

export async function getGoalReserves(d1: D1Database, userId: string, goalId?: string): Promise<GoalReserve[]> {
  let query = 'SELECT * FROM goal_reserves WHERE user_id = ?';
  const params: any[] = [userId];
  if (goalId) {
    query += ' AND goal_id = ?';
    params.push(goalId);
  }
  query += ' ORDER BY month DESC';
  const { results } = await d1.prepare(query).bind(...params).all<GoalReserve>();
  return results || [];
}

export async function getGoalReserveById(d1: D1Database, id: string, userId: string): Promise<GoalReserve | null> {
  const query = 'SELECT * FROM goal_reserves WHERE id = ? AND user_id = ?';
  return await d1.prepare(query).bind(id, userId).first<GoalReserve>();
}

type CreateGoalReserveData = Omit<GoalReserve, 'id' | 'created_at'>;

export async function createGoalReserve(d1: D1Database, data: CreateGoalReserveData): Promise<GoalReserve | null> {
  const id = crypto.randomUUID();
  // Verificar se já existe uma reserva para esta meta, usuário e mês
  const existingQuery = 'SELECT id FROM goal_reserves WHERE goal_id = ? AND user_id = ? AND month = ?';
  const existing = await d1.prepare(existingQuery).bind(data.goal_id, data.user_id, data.month).first();
  if (existing) {
    // Se existir, atualiza em vez de criar uma nova (ou pode lançar erro, dependendo da regra de negócio)
    // Por simplicidade, vamos atualizar se existir.
    // throw new Error('Reserva para este mês e meta já existe.');
    // console.warn(`Reserva para ${data.goal_id} no mês ${data.month} já existe. Atualizando...`);
    // return updateGoalReserve(d1, existing.id as string, data.user_id, { amount: data.amount });
    // OU, para manter o UNIQUE constraint e forçar o usuário a usar PUT:
    try {
        const query = 'INSERT INTO goal_reserves (id, goal_id, user_id, month, amount) VALUES (?, ?, ?, ?, ?)';
        await d1.prepare(query).bind(id, data.goal_id, data.user_id, data.month, data.amount).run();
        return await getGoalReserveById(d1, id, data.user_id);
    } catch (e: any) {
        if (e.message && e.message.includes('UNIQUE constraint failed')) {
            throw new Error('Reserva para este mês e meta já existe. Use a atualização.');
        }
        throw e;
    }
  }

  const query = 'INSERT INTO goal_reserves (id, goal_id, user_id, month, amount) VALUES (?, ?, ?, ?, ?)';
  await d1.prepare(query).bind(id, data.goal_id, data.user_id, data.month, data.amount).run();
  return await getGoalReserveById(d1, id, data.user_id);
}

type UpdateGoalReserveData = Partial<Pick<GoalReserve, 'amount'>>;

export async function updateGoalReserve(d1: D1Database, id: string, userId: string, data: UpdateGoalReserveData): Promise<GoalReserve | null> {
  if (data.amount === undefined) {
    throw new Error("Valor (amount) é obrigatório para atualização da reserva.");
  }
  const query = 'UPDATE goal_reserves SET amount = ? WHERE id = ? AND user_id = ?';
  await d1.prepare(query).bind(data.amount, id, userId).run();
  return await getGoalReserveById(d1, id, userId);
}

export async function deleteGoalReserve(d1: D1Database, id: string, userId: string): Promise<boolean> {
  const query = 'DELETE FROM goal_reserves WHERE id = ? AND user_id = ?';
  const { success } = await d1.prepare(query).bind(id, userId).run();
  return success;
}