# AstroFinance API

API para gerenciamento de finanças pessoais desenvolvida com Cloudflare Workers, Hono e banco de dados D1.

## Visão Geral

AstroFinance API é uma API completa para gerenciamento de finanças pessoais, incluindo:

- Autenticação de usuários
- Gerenciamento de categorias
- Registro de transações
- Controle de parcelamentos
- Gerenciamento de cartões de crédito
- Definição e acompanhamento de metas financeiras
- Sistema de notificações
- Relatórios financeiros

## URL Base

```
https://astrofinance-api.joaoedumiranda.workers.dev/api
```

## Autenticação

A API utiliza autenticação baseada em tokens JWT. Para acessar endpoints protegidos, você precisa incluir o token no cabeçalho `Authorization`:

```
Authorization: Bearer seu_token_jwt
```

### Endpoints de Autenticação

#### Registro de Usuário

```
POST /auth/register
```

Corpo da requisição:
```json
{
  "name": "Nome do Usuário",
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

#### Login

```
POST /auth/login
```

Corpo da requisição:
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

Resposta:
```json
{
  "token": "seu_token_jwt",
  "refreshToken": "seu_refresh_token",
  "user": {
    "id": "user_id",
    "name": "Nome do Usuário",
    "email": "usuario@exemplo.com",
    "role": "user"
  }
}
```

#### Atualizar Token

```
POST /auth/refresh
```

Corpo da requisição:
```json
{
  "refreshToken": "seu_refresh_token"
}
```

#### Obter Dados do Usuário Logado

```
GET /auth/me
```

#### Alterar Senha

```
POST /auth/change-password
```

Corpo da requisição:
```json
{
  "currentPassword": "senha_atual",
  "newPassword": "nova_senha"
}
```

## Categorias

### Listar Categorias

```
GET /categories
```

Parâmetros de consulta opcionais:
- `type`: Filtrar por tipo ('income' ou 'expense')

### Criar Categoria

```
POST /categories
```

Corpo da requisição:
```json
{
  "name": "Nome da Categoria",
  "type": "income",
  "color": "#4CAF50",
  "icon": "icon-name"
}
```

### Obter Categoria por ID

```
GET /categories/:id
```

### Atualizar Categoria

```
PUT /categories/:id
```

### Excluir Categoria

```
DELETE /categories/:id
```

## Transações

### Listar Transações

```
GET /transactions
```

Parâmetros de consulta opcionais:
- `type`: Filtrar por tipo ('income' ou 'expense')
- `startDate`: Data inicial (YYYY-MM-DD)
- `endDate`: Data final (YYYY-MM-DD)
- `categoryId`: ID da categoria
- `limit`: Limite de resultados
- `offset`: Deslocamento para paginação

### Criar Transação

```
POST /transactions
```

Corpo da requisição:
```json
{
  "date": "2023-05-15",
  "description": "Descrição da transação",
  "amount": 150.00,
  "type": "income",
  "category_id": "id_da_categoria"
}
```

### Obter Transação por ID

```
GET /transactions/:id
```

### Atualizar Transação

```
PUT /transactions/:id
```

### Excluir Transação

```
DELETE /transactions/:id
```

### Obter Resumo de Transações

```
GET /transactions/summary?startDate=2023-05-01&endDate=2023-05-31
```

## Parcelamentos

### Listar Parcelamentos

```
GET /installments
```

Parâmetros de consulta opcionais:
- `categoryId`: Filtrar por categoria
- `creditCardId`: Filtrar por cartão de crédito

### Criar Parcelamento

```
POST /installments
```

Corpo da requisição:
```json
{
  "description": "Descrição do parcelamento",
  "category_id": "id_da_categoria",
  "totalAmount": 1200.00,
  "totalInstallments": 12,
  "startDate": "2023-05-15",
  "nextPaymentDate": "2023-06-15",
  "creditCardId": 1
}
```

### Obter Parcelamento por ID

```
GET /installments/:id
```

### Atualizar Parcelamento

```
PUT /installments/:id
```

### Excluir Parcelamento

```
DELETE /installments/:id
```

## Cartões de Crédito

### Listar Cartões de Crédito

```
GET /credit-cards
```

### Criar Cartão de Crédito

```
POST /credit-cards
```

Corpo da requisição:
```json
{
  "name": "Nome do Cartão",
  "color": "#FF5722",
  "lastFourDigits": "1234",
  "bank": "Nome do Banco",
  "cardLimit": 5000
}
```

### Obter Cartão de Crédito por ID

```
GET /credit-cards/:id
```

### Atualizar Cartão de Crédito

```
PUT /credit-cards/:id
```

### Excluir Cartão de Crédito

```
DELETE /credit-cards/:id
```

## Metas Financeiras

### Listar Metas

```
GET /goals
```

Parâmetros de consulta opcionais:
- `type`: Filtrar por tipo ('saving', 'spending', 'purchase')
- `status`: Filtrar por status ('active', 'completed', 'cancelled')
- `categoryId`: Filtrar por categoria

### Criar Meta

```
POST /goals
```

Corpo da requisição:
```json
{
  "name": "Nome da Meta",
  "description": "Descrição da meta",
  "target_amount": 5000.00,
  "current_amount": 1000.00,
  "category_id": "id_da_categoria",
  "type": "saving",
  "start_date": "2023-05-01",
  "end_date": "2023-12-31"
}
```

### Obter Meta por ID

```
GET /goals/:id
```

### Atualizar Meta

```
PUT /goals/:id
```

### Excluir Meta

```
DELETE /goals/:id
```

### Listar Reservas de uma Meta

```
GET /goals/:id/reserves
```

### Adicionar Reserva a uma Meta

```
POST /goals/:id/reserves
```

Corpo da requisição:
```json
{
  "amount": 500.00,
  "month": "2023-05"
}
```

### Excluir Reserva

```
DELETE /goals/:goalId/reserves/:reserveId
```

## Notificações

### Listar Notificações

```
GET /notifications
```

Parâmetros de consulta opcionais:
- `read`: Filtrar por status de leitura (0 ou 1)

### Marcar Notificação como Lida

```
PUT /notifications/:id
```

Corpo da requisição:
```json
{
  "read": 1
}
```

### Marcar Todas as Notificações como Lidas

```
PUT /notifications/read-all
```

### Criar Notificação (somente admin)

```
POST /notifications
```

Corpo da requisição:
```json
{
  "message": "Mensagem da notificação",
  "type": "info",
  "description": "Descrição detalhada",
  "user_id": "id_do_usuario"
}
```

### Excluir Notificação

```
DELETE /notifications/:id
```

## Relatórios

### Relatório Mensal

```
GET /reports/monthly?startDate=2023-01-01&endDate=2023-12-31
```

### Relatório por Categoria

```
GET /reports/by-category?startDate=2023-01-01&endDate=2023-12-31
```

### Relatório de Fluxo de Caixa

```
GET /reports/cash-flow?startDate=2023-01-01&endDate=2023-12-31
```

### Relatório de Metas

```
GET /reports/goals
```

## Status da API

```
GET /health
```

## Inicialização do Banco de Dados

```
GET /api/init-db
```

**Nota**: Esta rota é apenas para desenvolvimento e deve ser removida em produção.

## Integração com Frontend

Para integrar com seu frontend, atualize as URLs das requisições para apontar para a URL base da API:

```javascript
const API_BASE_URL = "https://astrofinance-api.joaoedumiranda.workers.dev/api";

// Exemplo de função helper para requisições
const apiFetch = (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });
}

// Uso:
apiFetch('/transactions').then(res => res.json())
```

## Segurança

- Todas as rotas são protegidas com rate limiting para evitar abusos
- Tokens JWT com tempo de expiração curto (15 minutos)
- Refresh tokens com duração mais longa (7 dias)
- Senhas armazenadas com hash bcrypt
- Cabeçalhos de segurança HTTP implementados

## Tecnologias Utilizadas

- Cloudflare Workers: Plataforma serverless
- Hono: Framework web leve para Cloudflare Workers
- D1 Database: Banco de dados SQL serverless da Cloudflare
- TypeScript: Tipagem estática
- Zod: Validação de dados
- JWT: Autenticação baseada em tokens

## Desenvolvimento

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Configure o wrangler.toml com suas credenciais
4. Execute localmente: `npm run dev`
5. Faça deploy: `npm run deploy`

## Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests. 