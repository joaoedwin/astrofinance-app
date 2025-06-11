# Finance App

Um aplicativo de finanças pessoais construído com Next.js, TypeScript e SQLite.

## Configuração do Ambiente

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:
```env
# JWT
JWT_SECRET=your-secret-key-change-this-in-production

# Database
DATABASE_URL=file:./finance.db
```

4. Inicialize o banco de dados:
```bash
npm run db:init
```

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## Tecnologias Utilizadas

- Next.js
- TypeScript
- Tailwind CSS
- SQLite
- ESLint
- PostCSS

## Estrutura do Projeto

- `/app` - Páginas e rotas da aplicação
- `/components` - Componentes reutilizáveis
- `/lib` - Utilitários e configurações
- `/public` - Arquivos estáticos
- `/scripts` - Scripts de utilidade

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a versão de produção
- `npm start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter
- `npm run type-check` - Verifica os tipos TypeScript
- `npm run db:init` - Inicializa o banco de dados

## Funcionalidades

- Autenticação de usuários
- Gerenciamento de categorias
- Registro de transações
- Dashboard com resumo financeiro
- Interface responsiva e moderna

## Pré-requisitos

- Node.js 18 ou superior
- npm ou yarn

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/finance-app.git
cd finance-app
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:
```env
# JWT
JWT_SECRET=your-secret-key-change-this-in-production

# Database
DATABASE_URL=file:./finance.db
```

4. Inicialize o banco de dados:
```bash
npm run db:init
```

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`.

## Estrutura do Projeto

```
finance-app/
├── app/                    # Páginas e rotas da API
├── components/            # Componentes React
│   ├── auth/             # Componentes de autenticação
│   ├── layouts/          # Layouts da aplicação
│   ├── settings/         # Componentes de configurações
│   ├── transactions/     # Componentes de transações
│   └── ui/               # Componentes de UI reutilizáveis
├── hooks/                # Hooks personalizados
├── lib/                  # Utilitários e configurações
├── scripts/             # Scripts de utilidade
└── public/              # Arquivos estáticos
```

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a versão de produção
- `npm run start` - Inicia o servidor de produção
- `npm run db:init` - Inicializa o banco de dados
- `npm run lint` - Executa o linter
- `npm run type-check` - Verifica os tipos TypeScript

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'Add some amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes. 