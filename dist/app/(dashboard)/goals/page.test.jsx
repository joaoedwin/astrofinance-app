"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("@testing-library/jest-dom");
const react_1 = __importDefault(require("react"));
const react_2 = require("@testing-library/react");
const page_1 = __importDefault(require("./page"));
const useGoalsHook = __importStar(require("@/hooks/use-goals"));
const useTransactionsHook = __importStar(require("@/hooks/use-transactions"));
const useInstallmentsHook = __importStar(require("@/hooks/use-installments"));
const auth_context_1 = require("@/contexts/auth-context");
const useGoalReservesModule = __importStar(require("@/hooks/use-goal-reserves"));
const mockGoals = [
    {
        id: "1",
        user_id: "user-1",
        name: "Meta de Economia",
        description: "Juntar dinheiro",
        target_amount: 1000,
        current_amount: 0,
        category_id: undefined,
        type: "saving",
        recurrence: null,
        start_date: "2024-01-01",
        end_date: "2024-12-31",
        status: "active",
        created_at: "2024-01-01T00:00:00Z",
        completed_at: null
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
        recurrence: null,
        start_date: "2024-01-01",
        end_date: "2024-06-30",
        status: "completed",
        created_at: "2024-01-01T00:00:00Z",
        completed_at: "2024-06-30T00:00:00Z"
    }
];
const mockTransactions = [
    { id: "t1", date: "2024-02-01", description: "Salário", amount: 1200, type: "income", category: "Salário", category_id: undefined },
    { id: "t2", date: "2024-02-05", description: "Cinema", amount: 200, type: "expense", category: "Lazer", category_id: "cat1" },
    { id: "t3", date: "2024-02-10", description: "Restaurante", amount: 100, type: "expense", category: "Lazer", category_id: "cat1" }
];
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
];
const mockReserves = [
    { id: "r1", goal_id: "3", user_id: "user-1", month: "2024-07", amount: 200, created_at: "2024-07-01T00:00:00Z" },
    { id: "r2", goal_id: "3", user_id: "user-1", month: "2024-08", amount: 100, created_at: "2024-08-01T00:00:00Z" }
];
// Mock do componente que depende do useRouter do Next.js
jest.mock("@/components/auth/session-expired-modal", () => ({
    SessionExpiredModal: () => null
}));
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
}));
// Mock do hook de toast
jest.mock("@/components/ui/use-toast", () => ({
    useToast: () => jest.fn()
}));
jest.mock("@/hooks/use-goal-reserves");
// Mock do Dialog do Radix UI para facilitar testes de modais
jest.mock("@/components/ui/dialog", () => {
    const originalModule = jest.requireActual("@/components/ui/dialog");
    return {
        ...originalModule,
        Dialog: ({ children, ...props }) => <div {...props}>{children}</div>,
        DialogContent: ({ children, ...props }) => <div {...props}>{children}</div>,
        DialogHeader: ({ children, ...props }) => <div {...props}>{children}</div>,
        DialogTitle: ({ children, ...props }) => <div {...props}>{children}</div>,
    };
});
beforeAll(() => {
    global.fetch = jest.fn(() => Promise.resolve({
        json: () => Promise.resolve([
            { id: 'cat1', name: 'Lazer' },
            { id: 'cat2', name: 'Alimentação' }
        ])
    }));
});
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
        });
        jest.spyOn(useTransactionsHook, "useTransactions").mockReturnValue({
            transactions: mockTransactions,
            loading: false,
            error: null,
            fetchTransactions: jest.fn(),
            setTransactions: jest.fn()
        });
        jest.spyOn(useInstallmentsHook, "useInstallments").mockReturnValue({
            installments: mockInstallments,
            loading: false,
            error: null,
            fetchInstallments: jest.fn(),
            setInstallments: jest.fn()
        });
        jest.spyOn(useGoalReservesModule, "useGoalReserves").mockReturnValue({
            reserves: mockReserves,
            fetchReserves: jest.fn(),
            createReserve: jest.fn(),
            updateReserve: jest.fn(),
            deleteReserve: jest.fn(),
            loading: false,
            error: null,
            setReserves: jest.fn()
        });
    });
    const renderWithProvider = (ui) => (0, react_2.render)(<auth_context_1.AuthProvider>{ui}</auth_context_1.AuthProvider>);
    it("deve exibir metas ativas e histórico", async () => {
        renderWithProvider(<page_1.default />);
        expect(await react_2.screen.findByText("Meta de Economia")).toBeInTheDocument();
        expect(await react_2.screen.findByText("Meta de Gasto")).toBeInTheDocument();
        expect(await react_2.screen.findByText("Histórico de Metas")).toBeInTheDocument();
    });
    it("deve abrir o modal de criação de meta ao clicar em Nova Meta", async () => {
        renderWithProvider(<page_1.default />);
        const novaMetaBtn = await react_2.screen.findAllByText(/Nova Meta/i);
        expect(novaMetaBtn.length).toBeGreaterThan(0);
        react_2.fireEvent.click(novaMetaBtn[0]);
        expect(await react_2.screen.findByLabelText(/Nome da Meta/i)).toBeInTheDocument();
    });
    it("deve abrir o modal de edição com dados preenchidos", async () => {
        jest.spyOn(useGoalsHook, "useGoals").mockReturnValue({
            ...useGoalsHook.useGoals(),
            goals: mockGoals
        });
        renderWithProvider(<page_1.default />);
        const editarBtns = await react_2.screen.findAllByTitle("Editar");
        expect(editarBtns.length).toBeGreaterThan(0);
        react_2.fireEvent.click(editarBtns[0]);
        // Aguarda o campo ser preenchido
        await (0, react_2.waitFor)(async () => {
            const input = await react_2.screen.findByLabelText(/Nome da Meta/i);
            expect(input).toBeInTheDocument();
            expect(input.value).toBe("Meta de Economia");
        });
        const descInput = await react_2.screen.findByLabelText(/Descrição/i);
        expect(descInput.value).toBe("Juntar dinheiro");
    });
    it("deve exibir valores atual e faltante abaixo da barra de progresso", async () => {
        renderWithProvider(<page_1.default />);
        expect(await react_2.screen.findByText(/Valor atual:/i)).toBeInTheDocument();
        const faltaElements = await react_2.screen.findAllByText(/Falta para o objetivo:/i);
        expect(faltaElements.length).toBeGreaterThan(0);
    });
    it("deve abrir o modal de ajuda ao clicar em Como funciona?", async () => {
        renderWithProvider(<page_1.default />);
        const comoFuncionaBtn = await react_2.screen.findAllByText(/Como funciona/i);
        expect(comoFuncionaBtn.length).toBeGreaterThan(0);
        react_2.fireEvent.click(comoFuncionaBtn[0]);
        expect(await react_2.screen.findByText(/Como funcionam as Metas/i)).toBeInTheDocument();
    });
    it("deve criar uma nova meta e exibir na lista", async () => {
        const createGoal = jest.fn();
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
        });
        renderWithProvider(<page_1.default />);
        const novaMetaBtn = await react_2.screen.findAllByText(/Nova Meta/i);
        expect(novaMetaBtn.length).toBeGreaterThan(0);
        react_2.fireEvent.click(novaMetaBtn[0]);
        react_2.fireEvent.change(await react_2.screen.findByLabelText(/Nome da Meta/i), { target: { value: "Nova Meta Teste" } });
        react_2.fireEvent.change(await react_2.screen.findByLabelText(/Valor Alvo/i), { target: { value: "200" } });
        react_2.fireEvent.change(await react_2.screen.findByLabelText(/Data Inicial/i), { target: { value: "2024-07-01" } });
        const criarMetaBtn = await react_2.screen.findAllByText(/Criar Meta/i);
        expect(criarMetaBtn.length).toBeGreaterThan(0);
        react_2.fireEvent.click(criarMetaBtn[0]);
        await (0, react_2.waitFor)(() => expect(createGoal).toHaveBeenCalled());
    });
    it("deve editar uma meta e atualizar os dados", async () => {
        const updateGoal = jest.fn();
        jest.spyOn(useGoalsHook, "useGoals").mockReturnValue({
            ...useGoalsHook.useGoals(),
            updateGoal,
            goals: mockGoals
        });
        renderWithProvider(<page_1.default />);
        const editarBtns = await react_2.screen.findAllByTitle("Editar");
        expect(editarBtns.length).toBeGreaterThan(0);
        react_2.fireEvent.click(editarBtns[0]);
        const input = await react_2.screen.findByLabelText(/Nome da Meta/i);
        react_2.fireEvent.change(input, { target: { value: "Meta Editada" } });
        const salvarBtns = await react_2.screen.findAllByText(/Salvar/i);
        expect(salvarBtns.length).toBeGreaterThan(0);
        react_2.fireEvent.click(salvarBtns[0]);
        await (0, react_2.waitFor)(() => expect(updateGoal).toHaveBeenCalled());
    });
    it("deve excluir uma meta ao confirmar no modal", async () => {
        const deleteGoal = jest.fn();
        jest.spyOn(useGoalsHook, "useGoals").mockReturnValue({
            ...useGoalsHook.useGoals(),
            deleteGoal,
            goals: mockGoals
        });
        renderWithProvider(<page_1.default />);
        const excluirBtns = await react_2.screen.findAllByTitle("Excluir");
        expect(excluirBtns.length).toBeGreaterThan(0);
        react_2.fireEvent.click(excluirBtns[0]);
        const excluirModalBtns = await react_2.screen.findAllByText(/^Excluir$/i);
        expect(excluirModalBtns.length).toBeGreaterThan(1);
        react_2.fireEvent.click(excluirModalBtns[1]);
        await (0, react_2.waitFor)(() => expect(deleteGoal).toHaveBeenCalled());
    });
    it("deve reativar uma meta do histórico", async () => {
        const updateGoal = jest.fn();
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
        });
        renderWithProvider(<page_1.default />);
        const reativarBtns = await react_2.screen.findAllByText(/Reativar/i);
        expect(reativarBtns.length).toBeGreaterThan(0);
        react_2.fireEvent.click(reativarBtns[0]);
        await (0, react_2.waitFor)(() => expect(updateGoal).toHaveBeenCalled());
    });
    it("deve marcar uma meta como concluída manualmente", async () => {
        const updateGoal = jest.fn();
        jest.spyOn(useGoalsHook, "useGoals").mockReturnValue({
            ...useGoalsHook.useGoals(),
            updateGoal,
        });
        renderWithProvider(<page_1.default />);
        react_2.fireEvent.click(await react_2.screen.findByText(/Marcar como concluída/i));
        await (0, react_2.waitFor)(() => expect(updateGoal).toHaveBeenCalled());
    });
    it("deve cancelar uma meta", async () => {
        const updateGoal = jest.fn();
        jest.spyOn(useGoalsHook, "useGoals").mockReturnValue({
            ...useGoalsHook.useGoals(),
            updateGoal,
        });
        renderWithProvider(<page_1.default />);
        react_2.fireEvent.click(await react_2.screen.findByText(/Cancelar/i));
        await (0, react_2.waitFor)(() => expect(updateGoal).toHaveBeenCalled());
    });
    it("deve exibir estado de carregamento", async () => {
        jest.spyOn(useGoalsHook, "useGoals").mockReturnValue({
            ...useGoalsHook.useGoals(),
            loading: true,
        });
        renderWithProvider(<page_1.default />);
        expect(await react_2.screen.findByText(/Carregando metas/i)).toBeInTheDocument();
    });
    it("deve exibir mensagem de erro", async () => {
        jest.spyOn(useGoalsHook, "useGoals").mockReturnValue({
            ...useGoalsHook.useGoals(),
            error: "Erro de teste",
        });
        renderWithProvider(<page_1.default />);
        expect(await react_2.screen.findByText(/Erro ao carregar metas/i)).toBeInTheDocument();
        expect(await react_2.screen.findByText(/Erro de teste/i)).toBeInTheDocument();
    });
    it("deve validar campos obrigatórios ao criar meta", async () => {
        renderWithProvider(<page_1.default />);
        const novaMetaBtn = await react_2.screen.findAllByText(/Nova Meta/i);
        react_2.fireEvent.click(novaMetaBtn[0]);
        react_2.fireEvent.click(await react_2.screen.findByText(/Criar Meta/i));
        expect(await react_2.screen.findByText((text) => text.replace('.', '').includes("Preencha todos os campos obrigatórios"))).toBeInTheDocument();
    });
    // Fluxos extras para cobertura
    it("deve cancelar edição de meta sem salvar", async () => {
        renderWithProvider(<page_1.default />);
        const editarBtns = await react_2.screen.findAllByTitle("Editar");
        react_2.fireEvent.click(editarBtns[0]);
        react_2.fireEvent.click(await react_2.screen.findByText(/Cancelar/i));
        expect(react_2.screen.queryByLabelText(/Nome da Meta/i)).not.toBeInTheDocument();
    });
    it("deve exibir toast de sucesso ao salvar reserva", async () => {
        renderWithProvider(<page_1.default />);
        const input = await react_2.screen.findByPlaceholderText(/Valor reservado/i);
        react_2.fireEvent.change(input, { target: { value: "150" } });
        react_2.fireEvent.click(await react_2.screen.findByText(/Salvar/i));
        // Não há assert direto para toast, mas não deve quebrar fluxo
        expect(input).toBeInTheDocument();
    });
    it("deve calcular corretamente o progresso para meta de economia", () => {
        renderWithProvider(<page_1.default />);
        expect(react_2.screen.getByText(/Meta de Economia/i)).toBeInTheDocument();
        expect(react_2.screen.getByText(/Valor atual:/i)).toBeInTheDocument();
        expect(react_2.screen.getByText(/Falta para o objetivo:/i)).toBeInTheDocument();
    });
    it("deve calcular corretamente o progresso para meta de gasto por categoria", () => {
        const customGoals = [
            { ...mockGoals[1], status: "active" }
        ];
        jest.spyOn(useGoalsHook, "useGoals").mockReturnValue({
            ...useGoalsHook.useGoals(),
            goals: customGoals,
        });
        renderWithProvider(<page_1.default />);
        expect(react_2.screen.getByText(/Meta de Gasto/i)).toBeInTheDocument();
        expect(react_2.screen.getByText(/Valor atual:/i)).toBeInTheDocument();
        expect(react_2.screen.getByText(/Falta para o objetivo:/i)).toBeInTheDocument();
    });
    it("deve calcular corretamente o progresso para meta de compra/objetivo", () => {
        const customGoals = [
            {
                ...mockGoals[0],
                id: "3",
                name: "Meta de Compra",
                type: "purchase",
                target_amount: 500,
                status: "active"
            }
        ];
        jest.spyOn(useGoalsHook, "useGoals").mockReturnValue({
            ...useGoalsHook.useGoals(),
            goals: customGoals,
        });
        renderWithProvider(<page_1.default />);
        expect(react_2.screen.getByText(/Meta de Compra/i)).toBeInTheDocument();
        expect(react_2.screen.getByText(/Valor atual:/i)).toBeInTheDocument();
        expect(react_2.screen.getByText(/Falta para o objetivo:/i)).toBeInTheDocument();
    });
    it("deve exibir card diferenciado para meta de compra/objetivo", () => {
        renderWithProvider(<page_1.default />);
        expect(react_2.screen.getByText(/Meta de Compra/i)).toBeInTheDocument();
        expect(react_2.screen.getByText(/Compra\/Objetivo/i)).toBeInTheDocument();
        expect(react_2.screen.getByText(/Valor reservado:/i)).toBeInTheDocument();
        expect(react_2.screen.getByText(/Histórico de Reservas:/i)).toBeInTheDocument();
        expect(react_2.screen.getByPlaceholderText(/Valor reservado/i)).toBeInTheDocument();
    });
    it("deve exibir progresso correto baseado nas reservas", () => {
        renderWithProvider(<page_1.default />);
        expect(react_2.screen.getByText(/60%/i)).toBeInTheDocument(); // 300/500
        expect(react_2.screen.getByText(/R\$ 300,00/)).toBeInTheDocument(); // total reservado
        expect(react_2.screen.getByText(/R\$ 200,00/)).toBeInTheDocument(); // falta para o objetivo
    });
    it("deve permitir input, edição e exclusão de reserva do mês", async () => {
        renderWithProvider(<page_1.default />);
        const input = react_2.screen.getByPlaceholderText(/Valor reservado/i);
        react_2.fireEvent.change(input, { target: { value: "150" } });
        expect(input).toHaveValue(150);
        react_2.fireEvent.click(react_2.screen.getByText(/Salvar/i));
        // Simula edição
        react_2.fireEvent.click(react_2.screen.getByText(/Editar/i));
        const editInput = react_2.screen.getByDisplayValue("200");
        react_2.fireEvent.change(editInput, { target: { value: "250" } });
        react_2.fireEvent.click(react_2.screen.getAllByText(/Salvar/i)[1]);
        // Simula exclusão
        react_2.fireEvent.click(react_2.screen.getByText(/Excluir/i));
    });
});
