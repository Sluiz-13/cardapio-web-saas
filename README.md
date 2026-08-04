# cardapio-saas

> **Se você é uma instância do Claude lendo isso pela primeira vez**: este documento existe pra te dar contexto completo antes de escrever qualquer código. Leia inteiro antes de propor arquitetura. O projeto tem histórico real de produção (não é greenfield teórico) — várias decisões aqui vieram de bug real, cliente real, dinheiro real (Pix testado com pagamento verdadeiro). Trate as seções "Erros já cometidos" e "Decisões e o porquê" como restrições de projeto, não sugestões.

## O que é isso

`cardapio-saas` é a evolução multi-tenant de um sistema de cardápio digital + pedido + pagamento que já foi **construído do zero, testado e entregue** para um cliente real (um quiosque/restaurante) como produto single-tenant, no repositório [`cardapio-web`](https://github.com/Sluiz-13/cardapio-web) (tag `v1.0-quiosque-to-em-casa` marca o ponto exato entregue).

Este projeto **reaproveita a mesma base de código**, generalizando pra atender múltiplos restaurantes simultaneamente, com um novo painel de administração da plataforma.

**Decisão de negócio importante**: o SaaS só está sendo iniciado *depois* de validar o produto com um cliente pagante real por semanas de uso — não é suposição de mercado, é extensão de algo que já funciona.

## Stack

- **Next.js 14 (App Router) + TypeScript**
- **PostgreSQL + Prisma ORM**
- **NextAuth** (Credentials) — autenticação
- **Zod** — validação de toda entrada de API
- **Tailwind CSS**
- **Docker Compose** (dev) → **VPS + Docker Compose + Nginx + Certbot** (produção, deploy-alvo)
- **Playwright** — testes E2E

## Arquitetura já pronta pra multi-tenant (herdada, não precisa redesenhar)

O `cardapio-web` foi **deliberadamente** desenhado desde o primeiro commit pra virar SaaS, mesmo operando single-tenant:

- Toda tabela de negócio carrega `restaurantId` (`Order`, `Product`, `Category`, `Coupon`, `DeliveryFee`, `BusinessHours`, etc.)
- A sessão do admin carrega `restaurantId` (via `AdminUser.restaurantId` → embutido no JWT)
- **Toda** rota `/api/admin/*` escopa queries usando `restaurantId` da sessão, com o padrão `updateMany`/`deleteMany` + `where` composto (nunca `findUnique` por id sozinho) — isso é proteção básica contra IDOR entre restaurantes
- Cardápio do cliente já é multi-tenant nativo: `/r/[slug]`, uma URL por restaurante

**Conclusão prática**: `/r/[slug]` (cardápio do cliente) e o admin de restaurante (`/admin/*`) não precisam ser redesenhados pro SaaS — só precisam de auditoria de segurança mais rigorosa (ver seção própria) e, potencialmente, customização visual por tenant.

## O que já existe e funciona (não reconstruir do zero)

**Cardápio do cliente (`/r/[slug]`)**
- Categorias, produtos com imagem/descrição/preço, ingredientes removíveis, extras pagos
- Disponibilidade de produto por dia da semana (`availableDays: Int[]`, vazio = todo dia)
- Carrinho, modal de personalização, toast de feedback
- Checkout: nome, telefone, entrega ou retirada, endereço completo, forma de pagamento
- Taxa de entrega por bairro: texto livre normalizado (sem acento/maiúsculo) comparado contra cadastro do admin, com taxa padrão de fallback
- Cupom de desconto: percentual ou fixo, pedido mínimo, limite de uso, expiração, **e opcionalmente restrito a um produto específico** (desconto calculado só na linha daquele produto)
- Troco pra pagamento em dinheiro
- **Pix sem gateway**: gera QR Code real (padrão EMV/BR Code do Banco Central) + Copia-e-Cola, a partir da própria chave Pix do restaurante — zero custo, zero API paga. Testado com dinheiro real.
- Horário de funcionamento por dia da semana + switch manual de "aberto/fechado" (o manual sempre pode fechar mesmo dentro do horário programado)
- Endereço/telefone/tempo médio de entrega do restaurante, footer com crédito do desenvolvedor
- Aviso de privacidade/LGPD linkado no checkout

**Admin do restaurante (`/admin/*`)**
- Login (NextAuth Credentials + bcrypt), troca de senha e e-mail (ambos exigem senha atual)
- CRUD de categorias e produtos (com removíveis/extras/dias de disponibilidade)
- CRUD de cupons (geral ou por produto)
- CRUD de taxas de entrega por bairro + taxa padrão
- Configurações: horário de funcionamento, chave Pix, dados de contato
- Painel de pedidos: colunas por status (`NEW → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED`; pedidos de retirada pulam `OUT_FOR_DELIVERY`), com atualização quase-tempo-real via **polling** (8s) + som (gerado via Web Audio API, sem arquivo de áudio) + destaque visual em pedido novo
- Histórico/timeline de status de cada pedido (tabela `OrderStatusHistory`)
- Selo "Pix aguardando conferência" — como não há gateway, o admin confirma manualmente que o Pix caiu na conta, olhando o próprio app do banco
- Botão de WhatsApp manual (link `wa.me` com mensagem pré-preenchida por status, editável antes de enviar — não é envio automático)
- Impressão de cupom em layout de impressora térmica (rota própria, fora do layout com nav)
- Financeiro: faturamento do dia, ticket médio, últimas vendas, **exportação CSV** (delimitador `;`, não `,` — importante pro Excel em pt-BR, que usa vírgula como separador decimal)
- Rate limiting em memória (por IP) no endpoint público de criação de pedido

**Testes**
- Suite E2E com Playwright (`tests/e2e/`), usando `data-testid` nos elementos-chave — cobre fluxo de cliente (adicionar item, checkout, pagamento em dinheiro) e admin (login, pedido aparecendo e avançando status)

## Decisões de arquitetura e o porquê (não mudar sem motivo forte)

- **Dinheiro sempre em centavos (`Int`), nunca `Float`** — evita erro de ponto flutuante em cálculo financeiro
- **Preço/desconto/taxa sempre recalculados no servidor**, nunca confiados no que vem do client — proteção contra manipulação via DevTools
- **`notifications-api`**: microsserviço separado (Express + Socket.IO + Nodemailer) por decisão deliberada — notificação tem ciclo de vida diferente de pedido/pagamento. Toda chamada pra ele é *best-effort* (nunca derruba o fluxo principal se falhar). **Está pausado hoje** (não hospedado) — o tempo real do admin usa polling in-app, que já resolve o essencial sem essa dependência
- **Sem gateway de pagamento integrado** — decisão do primeiro cliente: cartão é cobrado fisicamente pelo motoboy, Pix usa QR estático sem intermediário. A rota de webhook existe, documentada, pronta pra plugar um gateway no futuro, mas sem uso ativo
- **Deploy-alvo é VPS + Docker Compose + Nginx + Certbot**, não serverless — parcialmente porque o polling/tempo real do admin se beneficia de processo Node persistente

## Erros já cometidos durante o desenvolvimento (não repetir)

1. **Colar código em blocos parciais quebra fácil** — tags JSX de abertura (`<a`, `<div`) sumiram múltiplas vezes ao colar trechos no meio de arquivo grande. Quando o risco de erro de cópia é alto, mandar o **arquivo inteiro**, não só o trecho.
2. **Reaproveitar uma classe utilitária com `w-full` embutido dentro de um contexto flex/grid quebra layout** de forma não-óbvia (o `w-full` briga com `flex-1`/`w-20` no mesmo elemento). Lição: separar string de estilo "visual" (cor, borda, padding) de "dimensão" (largura) quando a mesma classe é reaproveitada em contextos de layout diferentes.
3. **Rota de API dentro de `src/app/admin/...` em vez de `src/app/api/admin/...`** faz o Next.js servir o JSON cru no lugar da página (o `route.ts` e o `page.tsx` competem pelo mesmo segmento de URL). Sempre conferir o caminho antes de criar endpoint.
4. **`git pull` sozinho não sincroniza `node_modules` nem schema do banco** — sempre rodar `npm install && npx prisma generate && npx prisma migrate deploy` ao trocar de máquina.
5. **Oracle Cloud Free Tier (ARM)** sofre de falta de capacidade crônica em algumas regiões (erro "Out of capacity"), especialmente com um único Availability Domain — não é erro seu, é conhecido. Home region é fixada no cadastro e **não pode ser trocada depois**.
6. **Render free tier é ótimo pra validar build/HTTPS antes da VPS**, mas o Postgres gratuito **expira e é apagado** — nunca tratar como armazenamento de produção real.
7. **Testar Pix com dinheiro real revelou um caso prático**: algumas contas bancárias pessoais (ex: Poupança) não estão habilitadas pra receber Pix via QR Code/"Pix Cobrança" comercial, mesmo que Pix manual pra mesma chave funcione normal. **Todo restaurante novo no SaaS deveria testar a própria chave Pix com um pagamento real de valor baixo antes de divulgar o cardápio publicamente** — vale virar um passo formal de onboarding.
8. **CSV pra Excel em pt-BR**: usar `;` como delimitador de campo, não `,` — vírgula já é o separador decimal do locale brasileiro, e um valor tipo `18,00` sem essa troca quebra a importação.

## Segurança já implementada (base a manter, mas reforçar antes de múltiplos tenants pagantes)

- Senha com hash `bcrypt`
- Toda rota `/api/admin/*` escopada por `restaurantId` da sessão (proteção IDOR básica)
- Validação de entrada com Zod em toda rota
- `middleware.ts` protege todas as rotas `/admin/*` exceto `/admin/login`
- LGPD: aviso de privacidade + script de anonimização de dado antigo (`lgpd:anonymize`) — ainda não agendado via cron
- Rate limiting em memória, por processo — **não escala** se um dia rodar múltiplas instâncias (precisaria migrar pra algo tipo Redis)

**Importante**: a proteção IDOR atual foi suficiente pra um cliente confiando no próprio sistema. Com múltiplos restaurantes pagantes reais no mesmo banco, um vazamento de dado entre tenants deixa de ser hipotético e vira incidente de verdade — vale uma auditoria de segurança formal (testes automatizados específicos de cross-tenant leakage) antes de onboardar o segundo cliente de verdade.

## Pontos a resolver pro SaaS (o motivo desta conversa existir)

1. **Painel Super Admin da plataforma** (não existe ainda) — você precisa conseguir:
   - Cadastrar/editar/desativar restaurantes (criar `Restaurant` + primeiro `AdminUser` de cada um)
   - Ver todos os tenants numa lista, com status e métricas básicas
   - Ver faturamento agregado da plataforma (não só por restaurante)
   - Provavelmente precisa de um novo conceito de "role" de plataforma, separado do `AdminRole` (`OWNER`/`STAFF`) que hoje é escopado *dentro* de um restaurante
2. **Onboarding de restaurante novo** — decidir: continua manual (você cadastra cada um pelo painel super admin) por enquanto, ou já nasce self-service (formulário público, criação automática)? Recomendo manual pra validar os primeiros SaaS-clientes, automatiza depois.
3. **Planos e feature gating** — campo `plan` no `Restaurant`, checagens no código habilitando/desabilitando funcionalidade por plano
4. **Cobrança recorrente dos donos de restaurante** (diferente de qualquer gateway de pedido) — decisão grande, pode esperar validar demanda primeiro
5. **Customização visual por restaurante** — hoje a paleta de cor (`chili` laranja, etc.) é fixa no `tailwind.config.ts`. Pro SaaS, isso precisa virar dado (`Restaurant.primaryColor`, `Restaurant.logoUrl`) aplicado dinamicamente
6. **Auditoria de segurança formal** de isolamento entre tenants (ver seção acima)
7. **Rate limiting compartilhado** entre instâncias (se escalar horizontalmente)
8. **Decisão sobre `notifications-api`**: investir e hospedar de verdade pra WebSocket real (tempo real de verdade pra todos os tenants), ou manter só polling in-app (mais simples de manter, já funciona)
9. **Gateway de pagamento pro SaaS**: provavelmente Pagar.me ou Asaas, por causa do **split de pagamento nativo** (cobra comissão automática de cada restaurante repassando o resto pro dono) — Mercado Pago tem via "Marketplace", mais burocrático

## O que reaproveitar tal como está

- `/r/[slug]` (cardápio do cliente) inteiro
- `/admin/*` (painel do dono de restaurante) inteiro — reforçar segurança, não redesenhar
- Todo o schema Prisma existente — a base de dados já foi pensada pra isso desde o início

## Repositório de origem

https://github.com/Sluiz-13/cardapio-web — tag `v1.0-quiosque-to-em-casa` marca o ponto exato entregue ao primeiro cliente. Consultar esse repo (ou este README) antes de tomar decisão de arquitetura que já foi resolvida lá.