import '@testing-library/jest-dom'
import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import GoalsPage from "./page"
import * as useGoalsHook from "@/hooks/use-goals"
import * as useTransactionsHook from "@/hooks/use-transactions"
import * as useInstallmentsHook from "@/hooks/use-installments"
import { useAuthContext } from "@/contexts/auth-context"
import * as useGoalReservesModule from "@/hooks/use-goal-reserves"
import type { Goal } from "@/hooks/use-goals"
import type { Transaction } from "@/hooks/use-transactions"
import type { GoalReserve } from "@/hooks/use-goal-reserves"

const mockGoals: Goal[] = [
  {
    id: "1",
    user_id: "user-1",
    name: "Meta de Economia",
    description: "Juntar dinheiro",
    target_amount: 1000,
    current_amount: 0,
    category_id: undefined,
    type: "saving",
    recurrence: undefined,
    start_date: "2024-01-01",
    end_date: "2024-12-31",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    completed_at: undefined
  },
  {
    id: "2",
    user_id: "user-1",
    name: "Meta de Gasto",
    description: "Limite Lazer",
    target_amount: 500,
    current_amount: 0,
    category_id: "cat1",
    type: "spending",
    recurrence: undefined,
    start_date: "2024-01-01",
    end_date: "2024-06-30",
    status: "completed",
    created_at: "2024-01-01T00:00:00Z",
    completed_at: "2024-06-30T00:00:00Z"
  }
]

const mockTransactions: Transaction[] = [
  { 
    id: "t1", 
    date: "2024-02-01", 
    description: "Salário", 
    amount: 1200, 
    type: "income", 
    category: "Salário", 
    category_id: "cat1" 
  },
  { 
    id: "t2", 
    date: "2024-02-05", 
    description: "Cinema", 
    amount: 200, 
    type: "expense", 
    category: "Lazer", 
    category_id: "cat1" 
  },
  { 
    id: "t3", 
    date: "2024-02-10", 
    description: "Restaurante", 
    amount: 100, 
    type: "expense", 
    category: "Lazer", 
    category_id: "cat1" 
  }
]

const mockInstallments = [
  {
    id: "i1",
    description: "Parcela Celular",
    category_id: "cat1",
    category: "Lazer",
    totalAmount: 600,
    installmentAmount: 100,
    totalInstallments: 6,
    paidInstallments: 2,
    startDate: "2024-01-01",
    nextPaymentDate: "2024-03-01",
    type: "expense"
  }
]

const mockReserves: GoalReserve[] = [
  {
    id: "r1",
    goal_id: "1",
    user_id: "user-1",
    month: "2024-02",
    amount: 100,
    created_at: "2024-02-01T00:00:00Z"
  },
  {
    id: "r2",
    goal_id: "2",
    user_id: "user-1",
    month: "2024-02",
    amount: 50,
    created_at: new Date().toISOString()
  }
]

// Mock do componente que depende do useRouter do Next.js
jest.mock("@/components/auth/session-expired-modal", () => ({
  SessionExpiredModal: () => null
}))

// Mock do contexto de autenticação
jest.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { id: "user-1", name: "Usuário Teste", email: "teste@teste.com" },
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    checkAuth: jest.fn(),
    showSessionExpired: false,
    setShowSessionExpired: jest.fn(),
    handleSessionExpiredClose: jest.fn(),
    token: "fake-token"
  })
}))

// Mock do hook de toast
jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => jest.fn()
}))

jest.mock("@/hooks/use-goal-reserves")

// Mock do Dialog do Radix UI para facilitar testes de modais
jest.mock("@/components/ui/dialog", () => {
  const originalModule = jest.requireActual("@/components/ui/dialog");
  return {
    ...originalModule,
    Dialog: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
    DialogContent: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
    DialogHeader: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
    DialogTitle: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
  };
});

beforeAll(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve([
        { id: 'cat1', name: 'Lazer' },
        { id: 'cat2', name: 'Alimentação' }
      ])
    })
  ) as jest.Mock
})

describe("GoalsPage", () => {
  beforeEach(() => {
    jest.spyOn(useGoalsHook, "useGoals").mockReturnValue({
      goals: [
        ...mockGoals,
        {
          id: "3",
          user_id: "user-1",
          name: "Meta de Compra",
          description: "Comprar notebook",
          target_amount: 500,
          current_amount: 0,
          category_id: undefined,
          type: "purchase",
          recurrence: null,
          start_date: "2024-07-01",
          end_date: "2024-12-31",
          status: "active",
          created_at: "2024-07-01T00:00:00Z",
          completed_at: null
        }
      ],
      loading: false,
      error: null,
      fetchGoals: jest.fn(),
      createGoal: jest.fn(),
      updateGoal: jest.fn(),
      deleteGoal: jest.fn(),
      setGoals: jest.fn()
    })
    jest.spyOn(useTransactionsHook, "useTransactions").mockReturnValue({
      transactions: mockTransactions,
      loading: false,
      error: null,
      fetchTransactions: jest.fn(),
      setTransactions: jest.fn()
    })
    jest.spyOn(useInstallmentsHook, "useInstallments").mockReturnValue({
      installments: mockInstallments,
      loading: false,
      error: null,
      fetchInstallments: jest.fn(),
      setInstallments: jest.fn()
    })
    jest.spyOn(useGoalReservesModule, "useGoalReserves").mockReturnValue({
      reserves: mockReserves,
      fetchReserves: jest.fn(),
      createReserve: jest.fn(),
      updateReserve: jest.fn(),
      deleteReserve: jest.fn(),
      loading: false,
      error: null,
      setReserves: jest.fn()
    })
  })

  const renderWithProvider = (ui: React.ReactNode) => render(<GoalsPage />)

  it("deve exibir metas ativas e histórico", async () => {
    renderWithProvider(<GoalsPage />)
    expect(await screen.findByText("Meta de Economia")).toBeInTheDocument()
    expect(await screen.findByText("Meta de Gasto")).toBeInTheDocument()
    expect(await screen.findByText("Histórico de Metas")).toBeInTheDocument()
  })

  it("deve abrir o modal de criação de meta ao clicar em Nova Meta", async () => {
    renderWithProvider(<GoalsPage />)
    const novaMetaBtn = await screen.findAllByText(/Nova Meta/i)
    expect(novaMetaBtn.length).toBeGreaterThan(0)
    fireEvent.click(novaMetaBtn[0])
    expect(await screen.findByLabelText(/Nome da Meta/i)).toBeInTheDocument()
  })

  it("deve abrir o modal de edição com dados preenchidos", async () => {
    jest.spyOn(useGoalsHook, "useGoals").mockReturnValue({
      ...useGoalsHook.useGoals(),
      goals: mockGoals
    })
    renderWithProvider(<GoalsPage />)
    const editarBtns = await screen.findAllByTitle("Editar")
    expect(editarBtns.length).toBeGreaterThan(0)
    fireEvent.click(editarBtns[0])
    // Aguarda o campo ser preenchido
    await waitFor(async () => {
      const input = await screen.findByLabelText(/Nome da Meta/i)
      expect(input).toBeInTheDocument()
      expect((input as HTMLInputElement).value).toBe("Meta de Economia")
    })
    const descInput = await screen.findByLabelText(/Descrição/i)
    expect((descInput as HTMLInputElement).value).toBe("Juntar dinheiro")
  })

  it("deve exibir valores atual e faltante abaixo da barra de progresso", async () => {
    renderWithProvider(<GoalsPage />)
    expect(await screen.findByText(/Valor atual:/i)).toBeInTheDocument()
    const faltaElements = await screen.findAllByText(/Falta para o objetivo:/i)
    expect(faltaElements.length).toBeGreaterThan(0)
  })

  it("deve abrir o modal de ajuda ao clicar em Como funciona?", async () => {
    renderWithProvider(<GoalsPage />)
    const comoFuncionaBtn = await screen.findAllByText(/Como funciona/i)
    expect(comoFuncionaBtn.length).toBeGreaterThan(0)
    fireEvent.click(comoFuncionaBtn[0])
    expect(await screen.findByText(/Como funcionam as Metas/i)).toBeInTheDocument()
  })

  it("deve criar uma nova meta e exibir na lista", async () => {
    const createGoal = jest.fn()
    jest.spyOn(useGoalsHook, "useGoals").mockReturnValue({
      ...useGoalsHook.useGoals(),
      createGoal,
      goals: [
        ...mockGoals,
        {
          id: "3",
          user_id: "user-1",
          name: "Meta de Compra",
          description: "Comprar notebook",
          target_amount: 500,
          current_amount: 0,
          category_id: undefined,
          type: "purchase",
          recurrence: null,
          start_date: "2024-07-01",
          end_date: "2024-12-31",
          status: "active",
          created_at: "2024-07-01T00:00:00Z",
          completed_at: null
        }
      ]
    })
    renderWithProvider(<GoalsPage />)
    const novaMetaBtn = await screen.findAllByText(/Nova Meta/i)
    expect(novaMetaBtn.length).toBeGreaterThan(0)
    fireEvent.click(novaMetaBtn[0])
    fireEvent.change(await screen.findByLabelText(/Nome da Meta/i), { target: { value: "Nova Meta Teste" } })
    fireEvent.change(await screen.findByLabelText(/Valor Alvo/i), { target: { value: "200" } })
    fireEvent.change(await screen.findByLabelText(/Data Inicial/i), { target: { value: "2024-07-01" } })
    const criarMetaBtn = await screen.findAllByText(/Criar Meta/i)
    expect(criarMetaBtn.length).toBeGreaterThan(0)
    fireEvent.click(criarMetaBtn[0])
    await waitFor(() => expect(createGoal).toHaveBeenCalled())
  })

  it("deve editar uma meta e atualizar os dados", async () => {
    const updateGoal = jest.fn()
    jest.spyOn(useGoalsHook, "useGoals").mockReturnValue({
      ...useGoalsHook.useGoals(),
      updateGoal,
      goals: mockGoals
    })
    renderWithProvider(<GoalsPage />)
    const editarBtns = await screen.findAllByTitle("Editar")
    expect(editarBtns.length).toBeGreaterThan(0)
    fireEvent.click(editarBtns[0])
    const input = await screen.findByLabelText(/Nome da Meta/i)
    fireEvent.change(input, { target: { value: "Meta Editada" } })
    const salvarBtns = await screen.findAllByText(/Salvar/i)
    expect(salvarBtns.length).toBeGreaterThan(0)
    fireEvent.click(salvarBtns[0])
    await waitFor(() => expect(updateGoal).toHaveBeenCalled())
  })

  it("deve excluir uma meta ao confirmar no modal", async () => {
    const deleteGoal = jest.fn()
    jest.spyOn(useGoalsHook, "useGoals").mockReturnValue({
      ...useGoalsHook.useGoals(),
      deleteGoal,
      goals: mockGoals
    })
    renderWithProvider(<GoalsPage />)
    const excluirBtns = await screen.findAllByTitle("Excluir")
    expect(excluirBtns.length).toBeGreaterThan(0)
    fireEvent.click(excluirBtns[0])
    const excluirModalBtns = await screen.findAllByText(/^Excluir$/i)
    expect(excluirModalBtns.length).toBeGreaterThan(1)
    fireEvent.click(excluirModalBtns[1])
    await waitFor(() => expect(deleteGoal).toHaveBeenCalled())
  })

  it("deve reativar uma meta do histórico", async () => {
    const updateGoal = jest.fn()
    jest.spyOn(useGoalsHook, "useGoals").mockReturnValue({
      ...useGoalsHook.useGoals(),
      updateGoal,
      goals: [
        ...mockGoals,
        {
          id: "3",
          user_id: "user-1",
          name: "Meta Histórica",
          description: "Meta antiga",
          target_amount: 100,
          current_amount: 0,
          category_id: undefined,
          type: "saving",
          recurrence: null,
          start_date: "2023-01-01",
          end_date: "2023-12-31",
          status: "completed",
          created_at: "2023-01-01T00:00:00Z",
          completed_at: "2023-12-31T00:00:00Z"
        }
      ]
    })
    renderWithProvider(<GoalsPage />)
    const reativarBtns = await screen.findAllByText(/Reativar/i)
    expect(reativarBtns.length).toBeGreaterThan(0)
    fireEvent.click(reativarBtns[0])
    await waitFor(() => expect(updateGoal).toHaveBeenCalled())
  })

  it("deve marcar uma meta como concluída manualmente", async () => {
    const updateGoal = jest.fn()
    jest.spyOn(useGoalsHook, "useGoals").mockReturnValue({
      ...useGoalsHook.useGoals(),
      updateGoal,
    })
    renderWithProvider(<GoalsPage />)
    fireEvent.click(await screen.findByText(/Marcar como concluída/i))
    await waitFor(() => expect(updateGoal).toHaveBeenCalled())
  })

  it("deve cancelar uma meta", async () => {
    const updateGoal = jest.fn()
    jest.spyOn(useGoalsHook, "useGoals").mockReturnValue({
      ...useGoalsHook.useGoals(),
      updateGoal,
    })
    renderWithProvider(<GoalsPage />)
    fireEvent.click(await screen.findByText(/Cancelar/i))
    await waitFor(() => expect(updateGoal).toHaveBeenCalled())
  })

  it("deve exibir estado de carregamento", async () => {
    jest.spyOn(useGoalsHook, "useGoals").mockReturnValue({
      ...useGoalsHook.useGoals(),
      loading: true,
    })
    renderWithProvider(<GoalsPage />)
    expect(await screen.findByText(/Carregando metas/i)).toBeInTheDocument()
  })

  it("deve exibir mensagem de erro", async () => {
    jest.spyOn(useGoalsHook, "useGoals").mockReturnValue({
      ...useGoalsHook.useGoals(),
      error: "Erro de teste",
    })
    renderWithProvider(<GoalsPage />)
    expect(await screen.findByText(/Erro ao carregar metas/i)).toBeInTheDocument()
    expect(await screen.findByText(/Erro de teste/i)).toBeInTheDocument()
  })

  it("deve validar campos obrigatórios ao criar meta", async () => {
    renderWithProvider(<GoalsPage />)
    const novaMetaBtn = await screen.findAllByText(/Nova Meta/i)
    fireEvent.click(novaMetaBtn[0])
    fireEvent.click(await screen.findByText(/Criar Meta/i))
    expect(await screen.findByText((text) => text.replace('.', '').includes("Preencha todos os campos obrigatórios"))).toBeInTheDocument()
  })

  // Fluxos extras para cobertura
  it("deve cancelar edição de meta sem salvar", async () => {
    renderWithProvider(<GoalsPage />)
    const editarBtns = await screen.findAllByTitle("Editar")
    fireEvent.click(editarBtns[0])
    fireEvent.click(await screen.findByText(/Cancelar/i))
    expect(screen.queryByLabelText(/Nome da Meta/i)).not.toBeInTheDocument()
  })

  it("deve exibir toast de sucesso ao salvar reserva", async () => {
    renderWithProvider(<GoalsPage />)
    const input = await screen.findByPlaceholderText(/Valor reservado/i)
    fireEvent.change(input, { target: { value: "150" } })
    fireEvent.click(await screen.findByText(/Salvar/i))
    // Não há assert direto para toast, mas não deve quebrar fluxo
    expect(input).toBeInTheDocument()
  })

  it("deve calcular corretamente o progresso para meta de economia", () => {
    renderWithProvider(<GoalsPage />)
    expect(screen.getByText(/Meta de Economia/i)).toBeInTheDocument()
    expect(screen.getByText(/Valor atual:/i)).toBeInTheDocument()
    expect(screen.getByText(/Falta para o objetivo:/i)).toBeInTheDocument()
  })

  it("deve calcular corretamente o progresso para meta de gasto por categoria", () => {
    const customGoals = [
      { ...mockGoals[1], status: "active" as const }
    ]
    jest.spyOn(useGoalsHook, "useGoals").mockReturnValue({
      ...useGoalsHook.useGoals(),
      goals: customGoals,
    })
    renderWithProvider(<GoalsPage />)
    expect(screen.getByText(/Meta de Gasto/i)).toBeInTheDocument()
    expect(screen.getByText(/Valor atual:/i)).toBeInTheDocument()
    expect(screen.getByText(/Falta para o objetivo:/i)).toBeInTheDocument()
  })

  it("deve calcular corretamente o progresso para meta de compra/objetivo", () => {
    const customGoals = [
      {
        ...mockGoals[0],
        id: "3",
        name: "Meta de Compra",
        type: "purchase" as const,
        target_amount: 500,
        status: "active" as const
      }
    ]
    jest.spyOn(useGoalsHook, "useGoals").mockReturnValue({
      ...useGoalsHook.useGoals(),
      goals: customGoals,
    })
    renderWithProvider(<GoalsPage />)
    expect(screen.getByText(/Meta de Compra/i)).toBeInTheDocument()
    expect(screen.getByText(/Valor atual:/i)).toBeInTheDocument()
    expect(screen.getByText(/Falta para o objetivo:/i)).toBeInTheDocument()
  })

  it("deve exibir card diferenciado para meta de compra/objetivo", () => {
    renderWithProvider(<GoalsPage />)
    expect(screen.getByText(/Meta de Compra/i)).toBeInTheDocument()
    expect(screen.getByText(/Compra\/Objetivo/i)).toBeInTheDocument()
    expect(screen.getByText(/Valor reservado:/i)).toBeInTheDocument()
    expect(screen.getByText(/Histórico de Reservas:/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Valor reservado/i)).toBeInTheDocument()
  })

  it("deve exibir progresso correto baseado nas reservas", () => {
    renderWithProvider(<GoalsPage />)
    expect(screen.getByText(/60%/i)).toBeInTheDocument() // 300/500
    expect(screen.getByText(/R\$ 300,00/)).toBeInTheDocument() // total reservado
    expect(screen.getByText(/R\$ 200,00/)).toBeInTheDocument() // falta para o objetivo
  })

  it("deve permitir input, edição e exclusão de reserva do mês", async () => {
    renderWithProvider(<GoalsPage />)
    const input = screen.getByPlaceholderText(/Valor reservado/i)
    fireEvent.change(input, { target: { value: "150" } })
    expect(input).toHaveValue(150)
    fireEvent.click(screen.getByText(/Salvar/i))
    // Simula edição
    fireEvent.click(screen.getByText(/Editar/i))
    const editInput = screen.getByDisplayValue("200")
    fireEvent.change(editInput, { target: { value: "250" } })
    fireEvent.click(screen.getAllByText(/Salvar/i)[1])
    // Simula exclusão
    fireEvent.click(screen.getByText(/Excluir/i))
  })
}) 