# Configuração de Deployment na Vercel

## Variáveis de Ambiente Necessárias

Configure as seguintes variáveis de ambiente no painel da Vercel:

1. Acesse o dashboard da Vercel e navegue até o seu projeto
2. Clique na aba "Settings" e depois em "Environment Variables"
3. Adicione as seguintes variáveis:

- `JWT_SECRET`: Uma string segura para assinar tokens JWT (ex: astrofinance_production_jwt_secret_key_12345)
- `JWT_REFRESH_SECRET`: Uma string segura para assinar tokens de refresh (ex: astrofinance_production_refresh_key_67890)
- `JWT_EXPIRES_IN`: Tempo de expiração do token JWT (ex: 1d)
- `JWT_REFRESH_EXPIRES_IN`: Tempo de expiração do token de refresh (ex: 7d)

Após adicionar as variáveis, clique em "Save" e então redeploy o projeto.

## Configuração de Build

O projeto está configurado para usar o arquivo vercel.json que define:

- Configurações de build
- Regiões de deploy

## Resolução de Problemas com Build

Se encontrar erros relacionados a renderização estática ou geração de páginas, considere:

1. Verificar se todas as rotas que usam `useSearchParams()` estão envolvidas em `<Suspense>`
2. Garantir que rotas API que usam request/response estão definidas como servidores dinâmicos

## Configuração do Banco de Dados

Para persistência de dados na produção, considere as seguintes opções:

1. **SQLite na Vercel**:
   - O SQLite funciona apenas para demonstração, pois a Vercel tem sistema de arquivos efêmero
   - Ideal apenas para ambientes de desenvolvimento ou demonstração

2. **Cloudflare D1 (Recomendado)**:
   - Criar um banco de dados D1 no Cloudflare
   - Implementar API Workers para acessar o banco
   - Conectar o frontend Next.js com as APIs do Cloudflare

3. **Banco de dados externo**:
   - Utilizar serviços como Supabase, PlanetScale, ou similar
   - Atualizar os arquivos de conexão com o banco

## Migrações

Para configurar o banco de dados na Vercel:

1. Use o script de inicialização no ambiente local
2. Exporte o esquema e dados para o ambiente de produção

## Monitoramento

Após o deploy, verifique os logs da Vercel para garantir que:

- O banco de dados está funcionando corretamente
- As APIs estão respondendo conforme esperado
- Os tokens JWT estão sendo gerados e validados corretamente 