# Menuair (repo: cardapio-web-saas)

> **Se você é uma instância do Claude lendo isso pela primeira vez**: este projeto já está em **produção real**, com domínio próprio, VPS, e um cliente sendo onboardado. Não é mais fase de protótipo. Trate mudanças com o cuidado correspondente — qualquer alteração em rota `/api/*` merece rodar a suite de segurança antes de dar como concluída (ver seção própria abaixo). O histórico completo de decisões está numa conversa anterior, longa demais pra recolar aqui — mas **quase todo trabalho recente foi feito puxando código direto do GitHub**, então esta conversa nova pode continuar normalmente sem precisar desse histórico: basta baixar o repo (`codeload.github.com` ou `raw.githubusercontent.com`, ambos em domínios liberados) antes de propor qualquer mudança.

## O que é isso

**Menuair** é um SaaS multi-tenant de cardápio digital para restaurantes brasileiros: cardápio online, pedido com Pix (manual, sem gateway), e um painel administrativo completo por restaurante. Além disso, tem um painel de **Super Admin** (`/platform`) que gerencia todos os tenants, cobrança de assinatura (também Pix manual), planos, cupons, etc.

Evoluiu de um projeto single-tenant (`cardapio-web`) que foi testado com cliente real, incluindo pagamento Pix real de baixo valor, antes de virar SaaS.

**Nome comercial: Menuair.** Domínio: `menuair.com.br`. (Nomes descartados no caminho: Tableos, Comensal, Servio, Restio — todos colidiam com produtos existentes no mercado.)

## Stack

- **Next.js 14 (App Router) + TypeScript**, Prisma 5.20 + PostgreSQL, NextAuth (Credentials, duas instâncias separadas — ver "Auth" abaixo), Tailwind CSS, Recharts (gráficos), Playwright (testes de segurança), Docker Compose + Nginx + Certbot em produção.
- **Fontes**: Inter (padrão), Fraunces (títulos de destaque na landing), Oswald (só no cardápio público `/r/[slug]`, herdado do projeto original), JetBrains Mono.
- **Design tokens** (`tailwind.config.ts`): `surface-bg` (#F7F8FA), `brand` (#C75A1B), usados no `/admin` e `/platform`. O cardápio público (`/r/[slug]`) usa tokens próprios (`chili`, `ink`, `paper`) — são independentes de propósito, não confundir os dois sistemas.

## Produção

- **VPS**: HostGator, Ubuntu 22.04, Docker Compose (`docker-compose.yml` + `Dockerfile` na raiz — a app roda em container, não só o Postgres).
- **Domínio**: `menuair.com.br`, DNS + proxy pela **Cloudflare** (SSL ativo via Certbot na origem também — dupla camada). Há uma regra de firewall na Cloudflare bloqueando todo tráfego fora do Brasil (`ip.src.country ne "BR"`).
- **Uploads (logo de restaurante)**: usa **bind mount** (`/srv/menuair/uploads` na VPS, não volume Docker nomeado) — isso é proposital. O Next.js em produção só serve arquivos de `public/` que existiam **no momento do build**; uploads feitos depois de rodando (como logo) não são servidos pelo próprio Next.js. Por isso o Nginx tem uma regra `location /uploads/ { alias /srv/menuair/uploads/; }` servindo esses arquivos diretamente, contornando essa limitação. Se algum dia migrar uploads pra S3/Cloudinary, essa regra de Nginx (e o `docker-compose.yml`) pode ser removida.
- **Ambiente de teste/smoke**: Render (free tier) — usado só pra validar `npm run build` e testar fluxo antes de ir pra VPS. **Nunca guarda dado real** (Postgres free do Render expira e é apagado).

## O que já existe (não reconstruir)

**Cardápio público (`/r/[slug]`)**: idêntico em espírito ao projeto original single-tenant — carrinho, Pix, cupom, taxa de entrega por bairro, horário de funcionamento. Agora também tem: logo do restaurante, banner de "fechado" (cardápio continua navegável mesmo fechado, só bloqueia finalizar pedido — bloqueio replicado no server em `/api/orders`, nunca só no client), e **memória de dados do cliente** via `localStorage` (não é login — só pré-preenche nome/telefone/endereço no próximo pedido no mesmo navegador, com confirmação explícita, `src/lib/customer-storage.ts`).

**Admin do restaurante (`/admin/*`)**: painel completo, redesenhado com design system próprio (`src/components/ui/`: Button, Card, Input, Badge, Modal, Table, EmptyState, Skeleton, Toast, Sidebar, WhatsAppFab). Rotas: Pedidos (board com polling 8s, som, exclusão = soft-cancel pra `status: CANCELED`, nunca DELETE de verdade), Dashboard (gráfico, só Pro), Produtos, Categorias, Financeiro, Relatórios (exportação CSV, só Pro), Plano (upgrade/downgrade com solicitação + Pix, vencimento visível, aviso de renovação), Conta, Configurações (inclui upload de logo), Cupons, Entregas.

**Super Admin (`/platform/*`)**: Dashboard (KPIs: total de restaurantes, receita mensal **da assinatura** — não confundir com faturamento de vendas dos restaurantes —, ativos, pendentes/desativados), Restaurantes (CRUD completo, cobrança Pix, confirmação manual de pagamento, aprovação de troca de plano), Planos (visão geral + solicitações pendentes), Financeiro (receita da plataforma, histórico de pagamentos, inadimplentes), Usuários (lista de todos os AdminUsers de todos os tenants, pra suporte), Cupons (desconto de assinatura, só na 1ª cobrança), Conta, Configurações (chave Pix da própria plataforma).

**Landing page (`/`)**: página de vendas do próprio Menuair (diferente do cardápio de cada restaurante). Formulário de contratação gera mensagem pro WhatsApp **ou** e-mail pré-preenchidos — sem backend, sem tabela de leads. Prints reais do produto em `public/screenshots/` (menu, product, checkout, confirm, admin-pedidos — nomes exatos usados no código, `.jpeg`/`.png` conforme salvos). `/termos` e `/privacidade` são páginas independentes (a primeira é sobre o serviço Menuair; a segunda é o aviso de LGPD do pedido, usado no checkout de qualquer restaurante).

## Auth — duas sessões completamente isoladas

- **Admin de restaurante**: `src/lib/auth.ts`, cookie padrão do NextAuth, protege `/admin/*`.
- **Super Admin da plataforma**: `src/lib/platform-auth.ts`, cookie próprio (`platform-session-token`), protege `/platform/*`. **Nunca** reutiliza `next-auth/react` (`signIn`/`signOut`) pra essa sessão — o helper client-side é `src/lib/platform-auth-client.ts`, que fala direto com `/api/platform-auth/*` via fetch manual. Motivo: `next-auth/react` assume por padrão o endpoint `/api/auth/*`, e como não há `<SessionProvider>` no app, usar os helpers padrão nas telas de `/platform` bateria no endpoint errado (o do admin de restaurante).
- Cookie `secure` de ambos depende do protocolo real de `NEXTAUTH_URL` (`https://` vs `http://`), não de `NODE_ENV` — já foi bug real em produção (login "voltava sozinho" porque o cookie era descartado pelo navegador em conexão HTTP).

## Segurança

- Rate limiting em `src/lib/rate-limit.ts` — cai em memória local por padrão, mas se `REDIS_URL` estiver definida, usa Redis (atômico via Lua) — necessário só se um dia escalar horizontalmente (múltiplas instâncias da app).
- Headers de segurança + CSP em `next.config.js` — **CSP só roda em produção** (`NODE_ENV === "production"`), porque o `next dev` usa `eval()` no hot-reload e uma CSP estrita quebra isso.
- Suite de auditoria cross-tenant: `tests/security/` (Playwright, `npm run test:security`). Cria dois tenants do zero a cada rodada e tenta invadir dado um do outro em toda rota relevante. **35 testes, todos precisam passar.** Rodar de novo sempre que criar/alterar rota `/api/admin/*` ou `/api/platform/*` — já pegou pelo menos um bug real (rota de confirmar pagamento de pedido tinha sido sobrescrita com o conteúdo errado numa reorganização de arquivos).
- `PlatformPayment`: tabela de histórico de pagamento da assinatura (data + valor), criada junto com a confirmação de pagamento — sem ela, KPIs de receita mensal não têm como ser calculados corretamente (só existia `Restaurant.lastPaymentConfirmedAt`, um timestamp único, sobrescrito a cada pagamento).

## Erros já cometidos (não repetir)

- **Prisma + Alpine**: `node:20-alpine` precisa de `apk add --no-cache openssl` explícito no Dockerfile, senão o Prisma quebra com erro de schema engine.
- **Next.js não serve arquivo novo em `public/` após o build** — ver seção "Uploads" acima. Isso vale pra qualquer coisa que vire upload de usuário no futuro, não só logo.
- **Arquivo de rota colado no lugar errado**: já aconteceu do conteúdo de uma rota (`/api/platform/.../confirm-payment`) aparecer dentro do arquivo de outra rota (`/api/admin/.../confirm-payment`) depois de uma sessão de reorganização de pastas. Sintoma: erro **405 Method Not Allowed** onde deveria ser outro código — sinal de que o handler HTTP esperado não existe mais naquele arquivo. Sempre conferir o conteúdo real do arquivo (não assumir pelo nome do arquivo) quando o comportamento não bater com o esperado.
- **`npx prisma` sem `node_modules` instalado baixa a versão mais recente do Prisma** (podendo ser major version diferente da fixada no `package.json`), gerando erro de schema incompatível. Sempre `npm install` antes de qualquer comando `prisma` num ambiente novo.

## Workflow com o Luiz

- Luiz cola o código manualmente (Claude não tem acesso direto ao ambiente dele) — sempre mandar blocos completos e claros de "troque X por Y", nunca fragmento ambíguo.
- Pastas novas: formato `mkdir -p "caminho/da/pasta"`.
- Confirmar antes de mudanças estruturais grandes (reorganização de pasta, troca de padrão de nav, etc.) — várias vezes esse tipo de mudança gerou 404/bug por arquivo acabar no lugar errado.
- Segurança é prioridade declarada: "segurança perfeita, sem rotas expostas" — todo endpoint novo precisa de sessão + escopo por `restaurantId`/`isPlatformAdmin` desde o primeiro rascunho, não como retrofit.