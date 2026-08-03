# cardapio-web

Sistema de cardápio digital com painel administrativo, checkout com múltiplas
formas de pagamento e impressão de pedidos. Projeto próprio, arquitetado
desde o início pensando em virar SaaS multi-restaurante — hoje operando
**single-tenant**.

## Stack

- **Next.js 14 (App Router) + TypeScript**
- **PostgreSQL + Prisma ORM**
- **NextAuth** (Credentials) para autenticação do admin
- **Zod** para validação de toda entrada de API
- **Tailwind CSS** para estilização
- **Docker Compose** para o banco em desenvolvimento

## Arquitetura de serviços

┌──────────────────┐ HTTP (Bearer key) ┌──────────────────────┐
│ cardapio-web │ ─────────────────────▶ │ notifications-api │
│ (este repo) │ │ (repo separado) │
│ Next.js + Prisma │ │ Express + Socket.IO │
└──────────────────┘ └──────────────────────┘
▲
│ webhook (a implementar)
┌──────────────────┐
│ Gateway de pagto │ em definição
└──────────────────┘

`notifications-api` é um serviço separado por escolha deliberada: notificação
(e-mail, tempo real) tem ciclo de vida e modelo de falha diferente de
pedido/pagamento. Se ele cair, o checkout continua funcionando — a chamada em
`src/lib/notifications-client.ts` é *best-effort* e nunca derruba o fluxo
principal.

## Setup local

```bash
git clone https://github.com/Sluiz-13/cardapio-web.git
cd cardapio-web
npm install
cp .env.example .env   # preencher os valores, ver seção abaixo
docker compose up -d
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
``` 

Acesse:
- Cardápio do cliente: `http://localhost:3000/r/quiosque-to-em-casa`
- Painel admin: `http://localhost:3000/admin/login`
  - Login criado pelo seed: `admin@quiosque.com` / `troque-esta-senha`
  - **Troque essa senha assim que logar** em `/admin/conta`

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Connection string do Postgres |
| `NEXTAUTH_SECRET` | Gerar com `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL da aplicação (`http://localhost:3000` em dev) |
| `NOTIFICATIONS_API_URL` | URL do serviço `notifications-api` |
| `NOTIFICATIONS_API_KEY` | Chave compartilhada com o `notifications-api` |
| `MERCADOPAGO_ACCESS_TOKEN` | (pendente — gateway de pagamento em definição) |
| `MERCADOPAGO_WEBHOOK_SECRET` | (pendente) |

## Rotas

### Públicas (sem autenticação)

| Rota | Método | Descrição |
|---|---|---|
| `/r/[slug]` | página | Cardápio digital do cliente final |
| `/privacidade` | página | Aviso de privacidade / LGPD |
| `/api/orders` | `POST` | Cria um pedido. Recalcula preço no servidor a partir do banco (nunca confia no valor vindo do client). Rate limited: 5 pedidos / 5 min por IP |
| `/api/payments/webhook` | `POST` | Recebe confirmação de pagamento do gateway. Estrutura pronta, validação de assinatura pendente até definição do provider |

### Admin (autenticação via NextAuth, escopadas por `restaurantId` da sessão)

| Rota | Método | Descrição |
|---|---|---|
| `/admin/login` | página | Login |
| `/admin` | página | Painel de pedidos em tempo real (colunas por status) |
| `/admin/produtos` | página | CRUD de produtos (removíveis, extras, ativar/desativar) |
| `/admin/categorias` | página | CRUD de categorias |
| `/admin/financeiro` | página | Faturamento do dia, ticket médio, últimas vendas |
| `/admin/conta` | página | Trocar senha |
| `/admin/pedidos/[id]/imprimir` | página | Cupom de impressão (formato térmico) |
| `/api/auth/[...nextauth]` | `GET/POST` | Handler do NextAuth |
| `/api/admin/categories` | `GET/POST` | Listar / criar categoria |
| `/api/admin/categories/[id]` | `PATCH/DELETE` | Editar / remover categoria |
| `/api/admin/products` | `GET/POST` | Listar / criar produto |
| `/api/admin/products/[id]` | `PATCH/DELETE` | Editar (inclusive removíveis/extras) / remover produto |
| `/api/admin/orders/[id]/status` | `PATCH` | Avança o status de um pedido |
| `/api/admin/financeiro` | `GET` | Métricas financeiras do dia |
| `/api/admin/account/password` | `PATCH` | Troca a própria senha |

## Regras de dinheiro e pagamento (não mudar sem motivo forte)

1. Preço é sempre armazenado em **centavos** (`Int`), nunca `Float`.
2. O preço do pedido é **sempre recalculado no servidor** a partir do banco
   (`src/app/api/orders/route.ts`) — o carrinho no client é só UI.
3. Um pedido só vira `NEW` (visível pro admin) quando o pagamento é
   confirmado — via webhook (Pix/cartão) ou imediatamente no caso de
   "Dinheiro na entrega". Nunca confiar em redirect de navegador.
4. Todo webhook precisa ser idempotente e ter assinatura validada antes de
   processar — ainda pendente até a escolha do gateway.

## Segurança implementada

- Senha de admin com hash `bcrypt`, nunca texto puro
- Toda rota `/api/admin/*` valida sessão e escopa queries por
  `restaurantId` (`updateMany`/`deleteMany` com `where` composto) — isso
  evita um admin acessar/editar dado de outro restaurante (proteção IDOR,
  pré-requisito para o futuro multi-tenant)
- Validação de entrada com Zod em toda rota de API
- Rate limiting em `/api/orders` (rota pública, sem login)
- `middleware.ts` protege todas as rotas `/admin/*` exceto `/admin/login`

## LGPD

- Aviso de privacidade em `/privacidade`, linkado no checkout
- Base legal: execução de contrato (art. 7º, V) — coletamos apenas o
  necessário para processar o pedido
- Script de anonimização de dado antigo: `npm run lgpd:anonymize`
  (remove nome/telefone/endereço de pedidos finalizados há mais de 90 dias,
  mantém valor/itens para fins contábeis). Ainda não agendado via cron —
  pendente até a VPS de produção estar definida.

## Roadmap

- [x] Auth, CRUD de cardápio, painel de pedidos, impressão
- [x] Tela cliente conectada ao banco com checkout completo
- [x] Rate limiting, troca de senha, tela financeira, LGPD básico
- [ ] Gateway de pagamento definitivo (Pix/cartão) — aguardando decisão
- [ ] Validação de assinatura do webhook (depende do gateway)
- [ ] Integração com `notifications-api` em produção (hoje só roda local)
- [ ] Deploy em VPS com domínio próprio
- [ ] Revisão AppSec formal antes de generalizar para multi-tenant