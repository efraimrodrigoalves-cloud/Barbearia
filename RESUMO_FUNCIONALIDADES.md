# =============================================
# BARBERSHOP APP - DOCUMENTAÇÃO COMPLETA
# Sistema de Gestão para Barbearias
# =============================================

## 📋 ÍNDICE
1. [Visão Geral](#visão-geral)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Funcionalidades do Cliente](#funcionalidades-do-cliente)
5. [Painel Gerencial](#painel-gerencial)
6. [Sistema de Permissões](#sistema-de-permissões)
7. [Banco de Dados](#banco-de-dados)
8. [Scripts SQL Necessários](#scripts-sql-necessários)
9. [Sistema de Logs](#sistema-de-logs)
10. [Guia para Desenvolvedores](#guia-para-desenvolvedores)
11. [Regras Obrigatórias de Desenvolvimento](#regras-obrigatórias-de-desenvolvimento)
12. [APIs e Integrações](#apis-e-integrações)
13. [Padrões de Código](#padrões-de-código)
14. [Skills Disponíveis](#skills-disponíveis-agentes-especializados)
15. [Troubleshooting](#troubleshooting)
16. [Comandos Úteis](#comandos-úteis)
17. [Variáveis de Ambiente](#variáveis-de-ambiente)
18. [Fluxo de Autenticação](#fluxo-de-autenticação-detalhado)
19. [Componentes Reutilizáveis](#componentes-reutilizáveis)
20. [Hooks Customizados](#hooks-customizados)
21. [Limitações Conhecidas](#limitações-conhecidas)
22. [Roadmap](#roadmap--funcionalidades-futuras)
23. [Contatos e Suporte](#contatos-e-suporte)
24. [Configuração de Dev](#configuração-de-ambiente-de-desenvolvimento)
25. [Estratégia de Cache](#estratégia-de-cache)
26. [Fluxos de Erro](#fluxos-de-erro-globais)
27. [Gerenciamento de Estado](#gerenciamento-de-estado)
28. [Deep Linking](#deep-linking)
29. [Testes](#testes)
30. [CI/CD Pipeline](#cicd-pipeline)
31. [Dependências Críticas](#dependências-críticas)
32. [Performance Budgets](#performance-budgets)
33. [Acessibilidade](#acessibilidade)
34. [Internacionalização](#internacionalização-i18n)
35. [Backup/Restore e Monitoramento](#backuprestore-e-monitoramento)
36. [Changelog](#changelog)

---

## 🎯 VISÃO GERAL

Sistema completo de gestão para barbearias com:
- **App Mobile** (React Native/Expo) para clientes e barbeiros
- **Backend** Supabase (PostgreSQL + Auth + Storage)
- **Painel Gerencial** completo com 10+ módulos
- **Sistema de permissões** granular (Admin/Barbeiro/Cliente)
- **Logs detalhados** para debugging

---

## 🛠️ STACK TECNOLÓGICO

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React Native | 0.73+ | Framework mobile |
| Expo | 51+ | Build e deploy |
| Expo Router | 3+ | Navegação (file-based) |
| Supabase | Latest | Backend, Auth, Storage |
| NativeWind | 4+ | Estilização (Tailwind CSS) |
| TypeScript | 5+ | Tipagem estática |
| PostgreSQL | 15+ | Banco de dados (via Supabase) |

---

## 📁 ESTRUTURA DO PROJETO

```
barbershop_app/mobile/
├── app/                          # Telas e Rotas (Expo Router)
│   ├── (tabs)/                   # Abas principais
│   │   ├── index.tsx            # Tela inicial (cliente)
│   │   ├── appointments.tsx     # Agenda do cliente
│   │   ├── admin.tsx            # Painel gerencial (10+ módulos)
│   │   └── profile.tsx          # Perfil do cliente
│   ├── (auth)/                   # Autenticação
│   │   ├── login.tsx            # Login
│   │   └── register.tsx         # Cadastro
│   ├── booking/                  # Fluxo de agendamento (7 telas)
│   │   ├── index.tsx            # Seleção de serviço
│   │   ├── barber.tsx           # Seleção de barbeiro
│   │   ├── datetime.tsx         # Data e horário
│   │   ├── confirm.tsx          # Confirmação
│   │   ├── payment.tsx          # Pagamento (PIX/Cartão/Dinheiro)
│   │   ├── success.tsx          # Sucesso
│   │   └── review.tsx           # Avaliação
│   ├── profile/                  # Telas do perfil (7 telas)
│   │   ├── preferences.tsx      # Preferências
│   │   ├── wallet.tsx           # Carteira digital
│   │   ├── loyalty.tsx          # Pontos de fidelidade
│   │   ├── gallery.tsx          # Galeria de fotos
│   │   ├── catalog.tsx          # Catálogo de estilos
│   │   ├── recurring.tsx        # Agendamento recorrente
│   │   └── reminders.tsx        # Lembretes
│   ├── barber/
│   │   ├── [id].tsx             # Perfil público do barbeiro
│   │   └── profile.tsx          # Perfil do barbeiro (admin)
│   └── _layout.tsx              # Layout raiz
├── components/                   # Componentes reutilizáveis
│   ├── ui/                      # Componentes UI base
│   ├── themed-text.tsx          # Texto com tema
│   ├── themed-view.tsx          # View com tema
│   ├── haptic-tab.tsx           # Tab com feedback tátil
│   └── parallax-scroll-view.tsx # Scroll com parallax
├── constants/                    # Constantes do app
├── hooks/                        # Custom hooks
│   ├── use-color-scheme.ts      # Detecção de tema
│   └── use-theme-color.ts       # Cores do tema
├── lib/                          # Bibliotecas e utilitários
│   ├── supabase.ts              # Configuração Supabase
│   ├── mercadopago.ts           # Integração Mercado Pago
│   ├── whatsapp.ts              # Integração WhatsApp
│   ├── notifications.ts         # Push notifications
│   ├── logger.ts                # Sistema de logs
│   ├── errorHandler.ts          # Tratamento centralizado de erros
│   ├── cache.ts                 # Cache com TTL
│   └── AuthContext.tsx          # Contexto de autenticação global
├── scripts/                      # Scripts utilitários
├── supabase_*.sql               # Scripts do banco (12 arquivos)
├── .agent/                       # Agentes e Skills
│   ├── agents/                  # 20 agentes especializados
│   ├── skills/                  # 38 core skills
│   ├── awesome-skills/          # 1.297 awesome skills
│   └── workflows/               # 11 workflows
└── RESUMO_FUNCIONALIDADES.md    # Documentação completa
```

---

## 📱 FUNCIONALIDADES DO CLIENTE

### 🔐 Autenticação
- Login com email/senha
- Cadastro de novos usuários
- Logout
- Sessão persistente
- Recuperação de senha

### 🏠 Tela Inicial
- Saudação personalizada (Bom dia/Boa tarde/Boa noite)
- Banner de agendamento rápido
- Lista horizontal de serviços com ícones
- Lista horizontal de profissionais com avaliações
- Navegação para todas as seções

### 📅 Agendamento
- Seleção de serviço
- Seleção de barbeiro (com avaliações)
- Seleção de data (próximos 7 dias)
- Seleção de horário disponível
- Visual de horários ocupados/bloqueados
- Confirmação com dados do cliente
- Integração com mensalistas (baixa automática)
- Proteção contra double-tap

### 💳 Pagamento (5 métodos)

#### Fluxo Completo de Pagamento
O pagamento é a etapa final do agendamento (após seleção de serviço, barbeiro, data e confirmação).

**Arquivo:** `app/booking/payment.tsx`
**Tabelas:** `payment_transactions`, `appointments`, `client_wallet`, `wallet_transactions`
**Logs:** `[PAGAMENTO]`

#### Métodos Disponíveis

| Método | Tipo | Fluxo | Status |
|--------|------|-------|--------|
| **Carteira Digital** | Online | Débito automático do saldo | ✅ Funcional |
| **PIX** | Online | QR Code via Mercado Pago | ✅ Funcional |
| **Cartão de Crédito (Online)** | Online | Checkout Pro Mercado Pago | ✅ Funcional |
| **Dinheiro** | Presencial | Paga na barbearia | ✅ Funcional |
| **Cartão na Barbearia** | Presencial | Crédito/débito presencial | ✅ Funcional |

#### Fluxo: Carteira Digital
```
1. Verifica saldo do cliente
2. Se saldo >= valor: debita e cria agendamento
3. Se saldo < valor: sugere adicionar créditos
4. Registra transação em wallet_transactions
5. Redireciona para tela de sucesso
```

#### Fluxo: PIX
```
1. Cria pagamento via Mercado Pago API
2. Exibe QR Code (base64) e código PIX
3. Monitora status a cada 5 segundos
4. Botão "Já Paguei" verifica confirmação
5. Quando aprovado: cria agendamento + redireciona
6. Timeout: 30 minutos (expiração do PIX)
```

#### Fluxo: Cartão de Crédito (Online)
```
1. Cria preferência de pagamento no Mercado Pago
2. Abre checkout do MP no navegador externo
3. Usuário preenche dados do cartão no site do MP
4. MP redireciona para deep link:
   - barbershop://booking/success → pagamento aprovado
   - barbershop://booking/failure → pagamento recusado
   - barbershop://booking/pending → pagamento pendente
5. Deep link cria agendamento + atualiza transação
6. Redireciona para tela de sucesso
```

#### Fluxo: Dinheiro / Cartão na Barbearia
```
1. Cria agendamento com payment_status: 'pending'
2. Registra transação com status: 'pending'
3. Redireciona para tela de sucesso
4. Barbeiro confirma pagamento presencialmente no painel
```

#### Deep Links de Retorno (Mercado Pago)
| URL | Descrição | Ação |
|-----|-----------|------|
| `barbershop://booking/success` | Pagamento aprovado | Cria agendamento + redireciona |
| `barbershop://booking/failure` | Pagamento recusado | Mostra erro + permite tentar |
| `barbershop://booking/pending` | Pagamento pendente | Mostra mensagem informativa |

#### Configuração (app.json)
```json
{
  "expo": {
    "scheme": "barbershop"
  }
}
```

### ⭐ Avaliações
- Avaliação após serviço concluído (1-5 estrelas)
- Comentário opcional
- Média visível no perfil do barbeiro
- Histórico de avaliações

### 👤 Perfil do Cliente

#### 💰 Carteira Digital
- Saldo pré-pago
- Histórico de transações
- Depósitos
- Pagamentos com saldo

#### 🎯 Pontos de Fidelidade
- Sistema de níveis (Bronze, Prata, Ouro, Platina, Diamante)
- Progresso visual para próximo nível
- Recompensas resgatáveis
- Histórico de transações de pontos

#### ✂️ Preferências Salvas
- Barbeiro preferido
- Serviço preferido
- Horário preferido
- Dia da semana preferido
- Tipo de cabelo
- Estilo de barba
- Observações pessoais

#### 📸 Galeria de Fotos
- Histórico visual dos cortes
- Fotos antes/depois
- Agrupamento por mês
- Visualização em tela cheia

#### 🔄 Agendamento Recorrente
- Configuração automática
- Frequência (semanal, quinzenal, mensal)
- Horário preferido
- Próximo agendamento calculado

#### 🎨 Catálogo de Estilos
- Galeria de cortes disponíveis
- Filtro por categoria
- Preços e durações
- Tags de estilo

#### 🔔 Lembretes
- Lembrete de manutenção (retoque)
- Lembrete de promoções
- Recorrência automática

### 📋 Minha Agenda
- Agendamentos futuros
- Histórico de agendamentos
- Status de cada agendamento
- Botão de avaliar (após conclusão)

---

## 🖥️ PAINEL GERENCIAL

### 📊 Dashboard
- Agendamentos hoje
- Faturamento hoje/mês
- Taxa de ocupação
- Ticket médio
- Comparação semanal
- Timeline do dia
- Próximos clientes (com telefone)
- Serviços mais populares
- Avaliações recentes
- Barbeiro destaque
- Atalhos rápidos
- Notificações internas
- **Gráficos (NOVO):**
  - Faturamento dos últimos 7 dias (barras)
  - Horários mais procurados (barras horizontais)
  - Desempenho dos barbeiros (barras horizontais)

### 📅 Agenda
- **Próximos:** Agendamentos futuros
- **Últimos:** Agendamentos passados
- **Bloqueios:** Gerenciar horários bloqueados
- **Espera:** Lista de espera de clientes

### 👥 Clientes
- Lista com busca
- Ordenação alfabética
- Dados de contato
- Observações do barbeiro
- Botões WhatsApp/Ligar
- Histórico de visitas
- **Detalhes expandidos do perfil** (NOVO):
  - Saldo da carteira digital
  - Pontos de fidelidade e nível
  - **Preferências completas:**
    - Barbeiro preferido
    - Serviço preferido
    - Horário preferido
    - Dia da semana preferido
    - Tipo de cabelo
    - Estilo de barba
    - Sensibilidade da pele
    - Preferências de produtos
    - Observações do cliente
  - Agendamento recorrente (serviço, frequência)
  - Galeria de fotos (até 6 miniaturas)

### ✂️ Serviços
- CRUD completo
- Nome, preço, duração
- Ícone do serviço

### 👤 Equipe
- Cadastro de profissionais
- **Criar contas de acesso** (email/senha)
- **Configurar permissões** por colaborador
- **Alterar senhas**
- Comissões por barbeiro
- Metas mensais
- Avaliações
- Ativar/Desativar contas

### 💵 Financeiro
- Filtros de período (Hoje, 15/30/60 dias, Personalizado)
- Calendário para filtro personalizado
- Resultado (receitas - despesas)
- Lista de receitas
- Lista de despesas

### 💳 Mensalistas
- Cadastro de assinaturas
- Controle de cortes utilizados
- Histórico de uso
- Renovar/Cancelar
- Baixa automática

### 💰 Caixa
- Abertura com saldo inicial
- Movimentações (entrada/saída)
- Saldo esperado
- Fechamento com conferência

### ⋯ Mais
- **Indicações:** Registrar e acompanhar
- **Estoque:** Produtos e movimentações
- **Fidelidade:** Recompensas cadastradas
- **Link Online:** Configuração de agendamento público
- **Permissões:** Configurar acesso dos barbeiros

---

## 🔐 SISTEMA DE PERMISSÕES

### Roles
| Role | Descrição |
|------|-----------|
| **admin** | Dono da barbearia (acesso total) |
| **barber** | Funcionário (acesso limitado) |
| **client** | Cliente (apenas app) |

### Permissões Configuráveis
- `can_view_dashboard` - Ver dashboard
- `can_view_agenda` - Ver agenda
- `can_edit_appointments` - Editar agendamentos
- `can_view_clients` - Ver clientes
- `can_edit_clients` - Editar clientes
- `can_view_services` - Ver serviços
- `can_edit_services` - Editar serviços
- `can_view_team` - Ver equipe
- `can_edit_team` - Editar equipe
- `can_view_finance` - Ver financeiro
- `can_view_commissions` - Ver comissões
- `can_view_cash_register` - Ver caixa
- `can_view_subscriptions` - Ver mensalistas
- `can_view_settings` - Ver configurações
- `can_manage_barbers` - Gerenciar barbeiros

---

## 🗄️ BANCO DE DADOS

### Tabelas Principais (31 tabelas)

| # | Tabela | Descrição | Campos Principais |
|---|--------|-----------|-------------------|
| 1 | `profiles` | Usuários do sistema | id, name, email, phone, role |
| 2 | `services` | Serviços oferecidos | id, name, price, duration, icon |
| 3 | `barbers` | Profissionais | id, name, rating, photo, active |
| 4 | `appointments` | Agendamentos | id, client_id, barber_id, service_id, date, time, status |
| 5 | `reviews` | Avaliações | id, appointment_id, rating, comment |
| 6 | `role_permissions` | Permissões por role | role, permission, enabled |
| 7 | `barber_accounts` | Contas de barbeiros | id, barber_id, email, password_hash |
| 8 | `barber_commissions` | Comissões | id, barber_id, percentage |
| 9 | `commission_records` | Registro de comissões | id, barber_id, appointment_id, value |
| 10 | `cash_register` | Controle de caixa | id, date, opening_balance, closing_balance |
| 11 | `cash_movements` | Movimentações do caixa | id, register_id, type, value, description |
| 12 | `monthly_subscriptions` | Assinaturas mensais | id, client_id, plan, cuts_total, cuts_used |
| 13 | `subscription_usage` | Uso de assinaturas | id, subscription_id, appointment_id |
| 14 | `schedule_blocks` | Bloqueios de horário | id, barber_id, date, start_time, end_time, reason |
| 15 | `waiting_list` | Lista de espera | id, client_id, barber_id, desired_date, status |
| 16 | `internal_notifications` | Notificações internas | id, title, message, read, created_at |
| 17 | `barber_goals` | Metas por barbeiro | id, barber_id, month, target, achieved |
| 18 | `referrals` | Indicações | id, client_id, referred_name, status, reward |
| 19 | `client_wallet` | Carteira digital | id, client_id, balance |
| 20 | `wallet_transactions` | Transações da carteira | id, wallet_id, type, value, description |
| 21 | `loyalty_points` | Pontos de fidelidade | id, client_id, points, level |
| 22 | `loyalty_levels` | Níveis de fidelidade | id, name, min_points, benefits |
| 23 | `loyalty_rewards` | Recompensas | id, name, points_cost, description, active |
| 24 | `client_preferences` | Preferências do cliente | id, client_id, preferred_barber, preferred_service, hair_type |
| 25 | `client_photos` | Galeria de fotos | id, client_id, appointment_id, photo_url, type |
| 26 | `client_reminders` | Lembretes | id, client_id, type, frequency, next_date |
| 27 | `recurring_appointments` | Agendamentos recorrentes | id, client_id, barber_id, service_id, frequency |
| 28 | `style_catalog` | Catálogo de estilos | id, name, category, price, duration, tags |
| 29 | `notification_queue` | Fila de notificações WhatsApp | id, phone, message, status, sent_at |
| 30 | `online_booking_config` | Config agendamento online | id, enabled, link_slug, services_allowed |
| 31 | `payment_transactions` | Transações de pagamento (PIX, Cartão, Dinheiro, Presencial) | id, appointment_id, client_id, amount, payment_method, mp_payment_id, status, pix_qr_code, card_last_four |

### Relacionamentos Importantes
```
profiles 1:N appointments (client_id)
barbers 1:N appointments (barber_id)
services 1:N appointments (service_id)
appointments 1:1 reviews
appointments 1:N client_photos
appointments 1:N payment_transactions
profiles 1:1 client_wallet
profiles 1:1 loyalty_points
barbers 1:N barber_commissions
cash_register 1:N cash_movements
```

---

## 📜 SCRIPTS SQL NECESSÁRIOS

Execute na ordem:

| # | Arquivo | Descrição | Dependências |
|---|---------|-----------|--------------|
| 1 | `supabase_schema.sql` | Tabelas básicas | Nenhuma |
| 2 | `supabase_rls.sql` | Políticas de segurança | Schema |
| 3 | `supabase_notifications.sql` | Notificações WhatsApp | Schema |
| 4 | `supabase_monthly.sql` | Mensalistas | Schema |
| 5 | `supabase_schedule_blocks.sql` | Bloqueios | Schema |
| 6 | `supabase_commissions_cash.sql` | Comissões e caixa | Schema |
| 7 | `supabase_medium_features.sql` | Metas, espera | Schema |
| 8 | `supabase_low_priority.sql` | Indicações, estoque | Schema |
| 9 | `supabase_roles_permissions.sql` | Permissões | Schema |
| 10 | `supabase_barber_accounts.sql` | Contas de barbeiros | Schema, Permissions |
| 11 | `supabase_client_features.sql` | Carteira, fidelidade, preferências, galeria, catálogo | Schema |
| 12 | `supabase_payments.sql` | Transações de pagamento, Mercado Pago | Schema |

### Scripts de Correção (usar quando necessário)
- `fix_profiles.sql` - Corrige perfis duplicados/orfãos
- `fix_rls_*.sql` - Corrige políticas RLS
- `fix_old_appointments.sql` - Limpa agendamentos antigos
- `cleanup_duplicates.sql` - Remove duplicatas
- `verify_database.sql` - Verifica integridade do banco

---

## 📝 SISTEMA DE LOGS

### Prefixos Obrigatórios
| Prefixo | Contexto | Quando Usar |
|---------|----------|-------------|
| `[BARBERSHOP]` | Logs gerais | Funções utilitárias, helpers |
| `[ADMIN]` | Painel gerencial | Todas as telas do admin |
| `[TABS]` | Navegação | Mudanças de aba |
| `[AUTH]` | Autenticação | Login, logout, registro |
| `[DATA]` | Operações no banco | Qualquer query Supabase |
| `[SCREEN]` | Renderização de telas | useEffect, carregamento |
| `[BOOKING]` | Agendamentos | Fluxo de agendamento |
| `[CARTEIRA]` | Carteira digital | Operações de saldo |
| `[FIDELIDADE]` | Pontos | Operações de pontos |
| `[PREFERÊNCIAS]` | Preferências | CRUD de preferências |
| `[GALERIA]` | Fotos | Upload/visualização |
| `[CATÁLOGO]` | Estilos | Consulta ao catálogo |
| `[RECORRENTE]` | Agendamento recorrente | Configuração/execução |
| `[LEMBRETES]` | Lembretes | Criação/disparo |
| `[COLABORADORES]` | Contas de barbeiros | CRUD de contas |
| `[WHATSAPP]` | Integração WhatsApp | Envio de mensagens |
| `[FINANCEIRO]` | Financeiro | Relatórios, filtros |
| `[CAIXA]` | Caixa | Abertura, fechamento, movimentos |
| `[PAGAMENTO]` | Pagamento | PIX, Cartão, Dinheiro, Carteira, Presencial |
| `[ERRO]` | Erros críticos | Todos os catch blocks |

### Formato de Log Obrigatório
```typescript
// LOG OBRIGATÓRIO em toda função:
console.log('[PREFIXO] Descrição da operação:', { dados_relevantes });

// Exemplos:
console.log('[AUTH] Tentativa de login:', { email });
console.log('[DATA] Buscando agendamentos:', { barberId, date });
console.log('[ERRO] Falha ao criar agendamento:', error.message);
```

### Quando Registrar Log
- **INÍCIO** de toda função principal
- **ANTES** de toda chamada ao Supabase
- **DEPOIS** de toda resposta do Supabase (sucesso ou erro)
- **TODOS** os blocos catch
- **MUDANÇAS** de estado importantes
- **NAVEGAÇÃO** entre telas
- **INTERAÇÕES** do usuário críticas (login, pagamento, agendamento)

---

## 👨‍💻 GUIA PARA DESENVOLVEDORES

### Configuração Inicial
```bash
cd barbershop_app/mobile
npm install
npx expo start
```

### Variáveis de Ambiente (.env)
```
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
```

### Estrutura de Código
- **Componentes** seguem padrão React Native
- **Estilização** com NativeWind (Tailwind CSS)
- **Navegação** com Expo Router (file-based)
- **Backend** com Supabase (PostgreSQL)

---

## ⚠️ REGRAS OBRIGATÓRIAS DE DESESENVOLVIMENTO

### 1. LOGS (OBRIGATÓRIO)
```typescript
// TODO arquivo DEVE ter logs em TODAS as funções
// TODO bloco catch DEVE logar o erro
// TODO acesso ao banco DEVE ter log antes e depois

// Modelo:
export default function MinhaFuncao() {
  console.log('[PREFIXO] Iniciando MinhaFuncao');
  
  try {
    console.log('[PREFIXO] Executando operação:', params);
    const result = await supabase.from('tabela').select();
    console.log('[PREFIXO] Operação concluída:', { count: result.data?.length });
    return result;
  } catch (error) {
    console.log('[ERRO] Falha em MinhaFuncao:', error.message);
    throw error;
  }
}
```

### 2. COMENTÁRIOS (OBRIGATÓRIO)
```typescript
// TODO função DEVE ter comentário explicando o que faz
// TODO bloco complexo DEVE ter comentário explicando a lógica
// TODO TODO arquivo DEVE ter header com descrição

/**
 * Tela de Confirmação de Agendamento
 * 
 * Esta tela exibe o resumo do agendamento antes de confirmar.
 * Recebe service_id, barber_id, date e time via query params.
 * 
 * Fluxo:
 * 1. Carrega dados do serviço e barbeiro
 * 2. Exibe resumo com preços
 * 3. Verifica se cliente é mensalista (baixa automática)
 * 4. Confirma agendamento no Supabase
 * 5. Redireciona para tela de sucesso
 * 
 * Tabelas utilizadas: services, barbers, appointments, monthly_subscriptions
 * Logs: [BOOKING]
 */
export default function BookingConfirm() {
  // Log de entrada na tela
  console.log('[BOOKING] Entrando na tela de confirmação');
  
  // Recupera parâmetros da URL
  const { service_id, barber_id, date, time } = useLocalSearchParams();
  
  // Carrega dados do serviço
  // Log antes da query
  console.log('[BOOKING] Carregando dados do serviço:', { service_id });
  const { data: service } = await supabase
    .from('services')
    .select('*')
    .eq('id', service_id)
    .single();
  // Log após query
  console.log('[BOOKING] Serviço carregado:', { name: service?.name });
}
```

### 3. ATUALIZAÇÃO DO RESUMO (OBRIGATÓRIO)
A cada nova funcionalidade, alteração de estrutura ou nova API:

```
1. Implementar funcionalidade
2. Adicionar logs obrigatórios
3. Adicionar comentários detalhados
4. ATUALIZAR ESTE DOCUMENTO:
   - Adicionar na seção de funcionalidades
   - Atualizar seção de banco de dados (se nova tabela)
   - Atualizar seção de APIs (se nova integração)
   - Atualizar estrutura do projeto (se novos arquivos)
   - Adicionar no changelog com data
   - Atualizar status de implementação
```

### 4. PADRÃO PARA NOVA FUNCIONALIDADE
```
Passo 1: Criar tabela SQL (se necessário)
         → Adicionar script em supabase_[nome].sql
         → Documentar campos no RESUMO_FUNCIONALIDADES.md

Passo 2: Criar tela em app/
         → Usar prefixo de log correto
         → Comentar toda a lógica
         → Tratar todos os erros

Passo 3: Criar componente (se necessário)
         → Adicionar em components/
         → Documentar props

Passo 4: Adicionar logs
         → Início de funções
         → Antes/depois de queries
         → Todos os catch blocks

Passo 5: Atualizar RESUMO_FUNCIONALIDADES.md
         → Funcionalidade
         → Tabela (se nova)
         → API (se nova)
         → Changelog
```

### 5. CONVENÇÕES DE CÓDIGO
- **Tipagem:** TypeScript estrito, nunca usar `any`
- **Nomes:** camelCase para variáveis, PascalCase para componentes
- **Imports:** Agrupar por tipo (react, expo, supabase, componentes, utils)
- **Erros:** Sempre tratar com try/catch e logar
- **Loading:** Sempre mostrar indicador de carregamento
- **Feedback:** Sempre mostrar toast/alert de sucesso ou erro

---

## 🔌 APIs E INTEGRAÇÕES

### Supabase (Backend Principal)
| Endpoint | Método | Descrição | Tabela |
|----------|--------|-----------|--------|
| `/rest/v1/profiles` | GET/POST/PUT | CRUD de usuários | profiles |
| `/rest/v1/services` | GET/POST/PUT/DELETE | CRUD de serviços | services |
| `/rest/v1/barbers` | GET/POST/PUT | CRUD de barbeiros | barbers |
| `/rest/v1/appointments` | GET/POST/PUT | CRUD de agendamentos | appointments |
| `/rest/v1/reviews` | GET/POST | Avaliações | reviews |
| `/rest/v1/cash_register` | GET/POST/PUT | Controle de caixa | cash_register |
| `/rest/v1/monthly_subscriptions` | GET/POST/PUT | Mensalistas | monthly_subscriptions |
| `/rest/v1/client_wallet` | GET/PUT | Carteira digital | client_wallet |
| `/rest/v1/loyalty_points` | GET/PUT | Fidelidade | loyalty_points |
| `/rest/v1/schedule_blocks` | GET/POST/DELETE | Bloqueios | schedule_blocks |
| `/rest/v1/barber_accounts` | GET/POST/PUT | Contas de barbeiros | barber_accounts |
| `/rest/v1/payment_transactions` | GET/POST/PUT | Transações de pagamento | payment_transactions |
| `/rest/v1/role_permissions` | GET/PUT | Permissões | role_permissions |

### Autenticação Supabase
```typescript
// Login
supabase.auth.signInWithPassword({ email, password })

// Registro
supabase.auth.signUp({ email, password, options: { data: { name } } })

// Logout
supabase.auth.signOut()

// Sessão atual
supabase.auth.getSession()

// Recuperação de senha
supabase.auth.resetPasswordForEmail(email)
```

### WhatsApp (Integração Futura)
| Endpoint | Descrição | Status |
|----------|-----------|--------|
| `whatsapp.ts` | Envio de confirmações | Implementado |
| `notification_queue` | Fila de mensagens | Implementado |

### Push Notifications
| Função | Descrição | Arquivo |
|--------|-----------|---------|
| `registerForPushNotifications()` | Registra dispositivo | lib/notifications.ts |
| `scheduleLocalNotification()` | Notificação local | lib/notifications.ts |

### Mercado Pago (Integração de Pagamento)
| Endpoint | Descrição | Status | Arquivo |
|----------|-----------|--------|---------|
| `/v1/payments` | Criar pagamento PIX | ✅ | lib/mercadopago.ts |
| `/checkout/preferences` | Criar preferência de pagamento | ✅ | lib/mercadopago.ts |
| `/v1/payments/{id}` | Consultar status de pagamento | ✅ | lib/mercadopago.ts |
| Webhook | Receber notificações de pagamento | ❌ Pendente | - |

### Deep Linking (Retorno do Checkout)
| URL | Descrição | Arquivo |
|-----|-----------|---------|
| `barbershop://booking/success` | Pagamento aprovado | app/booking/payment.tsx |
| `barbershop://booking/failure` | Pagamento recusado | app/booking/payment.tsx |
| `barbershop://booking/pending` | Pagamento pendente | app/booking/payment.tsx |

---

## 📐 PADRÕES DE CÓDIGO

### Modelo de Tela (Screen Template)
```typescript
/**
 * [Nome da Tela]
 * 
 * Descrição: O que esta tela faz
 * Parâmetros: Query params esperados
 * Tabelas: Tabelas do Supabase utilizadas
 * Logs: Prefixo usado
 */

import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

const LOG_PREFIX = '[NOME]'; // Definir prefixo de log

export default function NomeTela() {
  // Estados
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  
  // Parâmetros
  const params = useLocalSearchParams();
  
  // Log de entrada
  console.log(`${LOG_PREFIX} Entrando na tela`, params);
  
  // Carregamento inicial
  useEffect(() => {
    loadData();
  }, []);
  
  // Função de carregamento com logs
  const loadData = async () => {
    console.log(`${LOG_PREFIX} Iniciando carregamento de dados`);
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('tabela')
        .select('*');
      
      if (error) {
        console.log(`${LOG_PREFIX} Erro ao carregar dados:`, error.message);
        throw error;
      }
      
      console.log(`${LOG_PREFIX} Dados carregados:`, { count: data?.length });
      setData(data);
    } catch (error) {
      console.log(`[ERRO] Falha em loadData:`, error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Loading state
  if (loading) {
    return <ActivityIndicator />;
  }
  
  // Render
  return (
    <View>
      {/* Conteúdo */}
    </View>
  );
}
```

### Modelo de Componente (Component Template)
```typescript
/**
 * [Nome do Componente]
 * 
 * Descrição: O que este componente faz
 * Props: Lista de props com tipos
 * Uso: Exemplo de uso
 */

import { View, Text } from 'react-native';

// Definição de props
interface NomeComponenteProps {
  titulo: string;
  descricao?: string;
  onPress: () => void;
}

export default function NomeComponente({ titulo, descricao, onPress }: NomeComponenteProps) {
  return (
    <View>
      <Text>{titulo}</Text>
      {descricao && <Text>{descricao}</Text>}
    </View>
  );
}
```

---

## 🧠 SKILLS DISPONÍVEIS (AGENTES ESPECIALIZADOS)

O projeto possui **38 core skills** em `.agent/skills/` e **1.297 awesome skills** em `.agent/awesome-skills/` que são carregadas automaticamente quando o request do desenvolvedor ativa o domínio específico. Cada skill contém conhecimento especializado, scripts de validação e anti-patterns a evitar.

### Catálogo Completo de Skills
- **Core Skills (38):** `.agent/skills/` - Skills principais do projeto
- **Awesome Skills (1.297):** `.agent/awesome-skills/` - Biblioteca estendida
- **Catálogo:** `.agent/awesome-skills/SKILLS_CATALOG.md`

### Como Funciona
```
Desenvolvedor faz request → Sistema analisa keywords/domains
    → Consulta SKILLS_CATALOG.md para skills relevantes
    → Carrega SKILL.md da skill selecionada
    → Aplica conhecimento especializado
```

### Carregamento Automático
**SEMPRE que o projeto for carregado:**
1. Analisar contexto da tarefa
2. Consultar `.agent/awesome-skills/SKILLS_CATALOG.md`
3. Selecionar skills relevantes
4. Carregar SKILL.md antes de executar
5. Anunciar expertise sendo aplicada

### Skills Essenciais para Este Projeto

#### 📱 MOBILE (Uso diário no Barbershop)

| Skill | Quando Usar | O Que Faz | Script de Validação |
|-------|-------------|-----------|---------------------|
| **mobile-design** | Criar/editar telas, componentes touch, navegação | Touch targets ≥44px, thumb zone, FlatList optimization, platform conventions iOS/Android | `python scripts/mobile_audit.py .` |
| **clean-code** | Qualquer escrita de código | SRP, DRY, KISS, funções ≤20 linhas, nomes claros | - |
| **performance-profiling** | App lento, scroll travando, tela demorando | Core Web Vitals, bundle analysis, memory leaks | `python scripts/lighthouse_audit.py <url>` |

**Exemplo de uso no Barbershop:**
```
"Estou criando a tela de agendamento"
→ mobile-design ativa automaticamente
→ Aplica: FlatList para horários, 48px touch targets, loading state

"O scroll da lista de barbeiros está travando"
→ performance-profiling ativa
→ Sugere: React.memo, useCallback, removeClippedSubviews
```

#### 🗄️ BANCO DE DADOS (Qualquer alteração no Supabase)

| Skill | Quando Usar | O Que Faz | Script de Validação |
|-------|-------------|-----------|---------------------|
| **database-design** | Criar tabela, adicionar coluna, migration, index | Schema design, normalização, indexes, N+1 queries | `python scripts/schema_validator.py .` |
| **systematic-debugging** | Query retornando erro, dados inconsistentes | Método 4 fases: Reproduzir → Isolar → Entender → Corrigir | - |

**Exemplo de uso no Barbershop:**
```
"Vou adicionar tabela de cupons de desconto"
→ database-design ativa
→ Sugere: campos, relacionamentos com appointments, indexes

"Agendamento não aparece para o barbeiro"
→ systematic-debugging ativa
→ Verifica: RLS policies, status, barber_id correto
```

#### 🔒 SEGURANÇA (Auth, RLS, dados sensíveis)

| Skill | Quando Usar | O Que Faz | Script de Validação |
|-------|-------------|-----------|---------------------|
| **vulnerability-scanner** | Revisão de segurança, RLS, auth | OWASP 2025, supply chain, attack surface | `python scripts/security_scan.py .` |
| **code-review-checklist** | Antes de commit, PR review | Checklist: injeção, XSS, secrets hardcoded | - |

**Exemplo de uso no Barbershop:**
```
"Revisar as policies de RLS do módulo financeiro"
→ vulnerability-scanner ativa
→ Verifica: least privilege, exposed data, injection

"Verificar se tem secret hardcoded no código"
→ vulnerability-scanner ativa
→ Busca: api_key, token, password em arquivos
```

#### 🧪 TESTES (Qualquer funcionalidade nova ou bug fix)

| Skill | Quando Usar | O Que Faz | Script de Validação |
|-------|-------------|-----------|---------------------|
| **testing-patterns** | Criar testes, aumentar cobertura | Pirâmide de testes, AAA pattern, mocking | `python scripts/test_runner.py .` |
| **tdd-workflow** | Desenvolvimento guiado por testes | RED-GREEN-REFACTOR cycle | - |

**Exemplo de uso no Barbershop:**
```
"Escrever testes para o fluxo de agendamento"
→ testing-patterns ativa
→ Sugere: unit para lógica, integration para Supabase, E2E para fluxo
```

#### 🏗️ ARQUITETURA (Decisões técnicas, refactoring)

| Skill | Quando Usar | O Que Faz | Script de Validação |
|-------|-------------|-----------|---------------------|
| **architecture** | Nova feature complexa, refactoring | ADR, trade-offs, simplicidade primeiro | - |
| **plan-writing** | Antes de implementar feature complexa | Breakdown em tarefas de 2-5min, critérios de verificação | - |
| **nodejs-best-practices** | Configuração, async, error handling | Frameworks, validação com Zod, layered architecture | - |

**Exemplo de uso no Barbershop:**
```
"Quero adicionar sistema de pagamento com PIX"
→ architecture ativa
→ Analisa: integração com gateway, segurança, impacto no schema

"Planejar a implementação do módulo de estoque"
→ plan-writing ativa
→ Gera: tarefas específicas com critérios de verificação
```

#### 🔍 DEBUGGING (Qualquer problema/bug)

| Skill | Quando Usar | O Que Faz | Script de Validação |
|-------|-------------|-----------|---------------------|
| **systematic-debugging** | Bug, erro, comportamento inesperado | 4 fases: Reproduzir → Isolar → Entender → Corrigir | - |
| **behavioral-modes** | Adaptar abordagem ao tipo de tarefa | Modos: Brainstorm, Implement, Debug, Review, Ship | - |

**Exemplo de uso no Barbershop:**
```
"Login está retornando erro 401"
→ systematic-debugging ativa
→ Fase 1: Reproduzir o erro
→ Fase 2: Isolar (sessão? credenciais? RLS?)
→ Fase 3: Root cause (token expirado?)
→ Fase 4: Fix + verificar
```

#### 🚀 DEPLOY (Publicação, produção)

| Skill | Quando Usar | O Que Faz | Script de Validação |
|-------|-------------|-----------|---------------------|
| **deployment-procedures** | Build, publicação, rollback | Deploy seguro, verificação pós-deploy | - |
| **lint-and-validate** | Antes de commit | Lint, typecheck | `python scripts/lint_runner.py .` |

#### 📡 API (Integrações externas)

| Skill | Quando Usar | O Que Faz | Script de Validação |
|-------|-------------|-----------|---------------------|
| **api-patterns** | Nova integração, WhatsApp, pagamentos | REST vs GraphQL, response format, versioning | `python scripts/api_validator.py .` |

### Skills de Apoio (Uso menos frequente)

| Skill | Quando Usar |
|-------|-------------|
| **intelligent-routing** | Sistema decide automaticamente qual skill usar |
| **parallel-agents** | Tarefa complexa que precisa de múltiplas skills simultâneas |
| **documentation-templates** | Criar README, docs de API, comentários padronizados |
| **frontend-design** | Design de UI/UX, cores, tipografia |
| **i18n-localization** | Se precisar de múltiplos idiomas no futuro |
| **seo-fundamentals** | Se criar landing page ou site do barbeiro |
| **web-design-guidelines** | Se criar painel web no futuro |

### Mapeamento de Cenário → Skill

| Cenário no Barbershop | Skills a Usar |
|-----------------------|---------------|
| Criar nova tela de agendamento | mobile-design + clean-code + testing-patterns |
| Adicionar tabela de cupons | database-design + architecture |
| Bug no login | systematic-debugging + vulnerability-scanner |
| Review de código antes do merge | code-review-checklist + clean-code |
| App lento na lista de clientes | performance-profiling + mobile-design |
| Integrar gateway de pagamento | api-patterns + vulnerability-scanner + architecture |
| Planejar módulo de estoque | plan-writing + architecture + database-design |
| Preparar para produção | deployment-procedures + lint-and-validate + vulnerability-scanner |
| Refatorar painel admin | architecture + clean-code + testing-patterns |
| Adicionar notificações push | api-patterns + mobile-design + nodejs-best-practices |

### Scripts de Validação Disponíveis

Execute após implementações para validar qualidade:

```bash
# Mobile (telas, componentes)
python .agent/skills/mobile-design/scripts/mobile_audit.py .

# Segurança (RLS, auth, secrets)
python .agent/skills/vulnerability-scanner/scripts/security_scan.py .

# Banco de dados (schema, indexes)
python .agent/skills/database-design/scripts/schema_validator.py .

# Testes (cobertura)
python .agent/skills/testing-patterns/scripts/test_runner.py .

# API (endpoints, responses)
python .agent/skills/api-patterns/scripts/api_validator.py .

# Lint e typecheck
python .agent/skills/lint-and-validate/scripts/lint_runner.py .
```

---

## 🔧 TROUBLESHOOTING

### Problemas Comuns

#### Erro de autenticação
```
Solução: Verificar se a sessão está válida
Log: [AUTH] Verificando sessão
Arquivo: lib/supabase.ts
```

#### Agendamento não aparece
```
Solução: Verificar RLS policies e status do agendamento
Log: [BOOKING] Verificando agendamento
Tabela: appointments
```

#### RLS bloqueando acesso
```
Solução: Verificar role do usuário e policies
Scripts: fix_rls_*.sql
Tabela: role_permissions
```

#### Performance lenta
```
Solução: Verificar indexes e queries N+1
Logs: [DATA] Tempo de query
Dica: Usar .select('campos_especificos') ao invés de .select('*')
```

#### Mensalista sem baixa automática
```
Solução: Verificar se subscription está ativa
Log: [BOOKING] Verificando mensalista
Tabela: monthly_subscriptions
```

---

## 💻 CONFIGURAÇÃO DE AMBIENTE DE DESENVOLVIMENTO

### Pré-requisitos

| Ferramenta | Versão Mínima | Onde Instalar |
|------------|---------------|---------------|
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | Incluído com Node |
| Git | 2+ | https://git-scm.com |
| Expo CLI | Latest | `npm install -g expo-cli` |
| EAS CLI | Latest | `npm install -g eas-cli` |

### Para iOS (apenas Mac)
| Ferramenta | Onde Instalar |
|------------|---------------|
| Xcode | App Store |
| CocoaPods | `sudo gem install cocoapods` |
| iOS Simulator | Incluído com Xcode |

### Para Android
| Ferramenta | Onde Instalar |
|------------|---------------|
| Android Studio | https://developer.android.com/studio |
| Android SDK | Via Android Studio |
| Java JDK | 17+ via Android Studio |

### Passo a Passo Completo

```bash
# 1. Clonar repositório
git clone [URL_DO_REPO]
cd barbershop_app/mobile

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com as credenciais corretas

# 4. Instalar pods (apenas iOS)
cd ios && pod install && cd ..

# 5. Iniciar servidor
npx expo start

# 6. Abrir no device/simulator
# Pressionar 'i' para iOS, 'a' para Android, 'w' para web
```

### Estrutura de Dependências

| Categoria | Pacotes |
|-----------|---------|
| **Core** | react, react-native, expo |
| **Navegação** | expo-router |
| **Backend** | @supabase/supabase-js |
| **Estilização** | nativewind, tailwindcss |
| **UI** | @expo/vector-icons, expo-image |
| **Notificações** | expo-notifications |
| **Storage** | expo-secure-store |
| **Utilidades** | expo-haptics, expo-linking |

---

## 🚨 FLUXOS DE ERRO GLOBAIS

### Tratamento de Erros Supabase

```typescript
// lib/errorHandler.ts - SUGESTÃO
export function handleSupabaseError(error: any, context: string) {
  console.log(`[ERRO] ${context}:`, error.message);
  
  const knownErrors: Record<string, string> = {
    'Invalid login credentials': 'Email ou senha incorretos',
    'Email not confirmed': 'Confirme seu email antes de entrar',
    'JWT expired': 'Sessão expirada, faça login novamente',
    'duplicate key': 'Este registro já existe',
    'foreign key': 'Registro relacionado não encontrado',
    'permission denied': 'Você não tem permissão para esta ação',
  };
  
  for (const [key, message] of Object.entries(knownErrors)) {
    if (error.message?.includes(key)) {
      return message;
    }
  }
  
  return 'Ocorreu um erro inesperado. Tente novamente.';
}

// Uso em telas:
try {
  const { data, error } = await supabase.from('appointments').select();
  if (error) throw error;
} catch (error) {
  const message = handleSupabaseError(error, 'Carregar agendamentos');
  Alert.alert('Erro', message);
}
```

### Estados de Erro por Tela

| Tela | Erro Esperado | Comportamento |
|------|---------------|---------------|
| Login | Credenciais inválidas | Toast + manter campos |
| Agendamento | Sem horários | Mostrar mensagem + sugestão |
| Lista vazia | Sem dados | Ilustração + CTA |
| Sem conexão | Network error | Banner de offline |
| Sem permissão | 403/401 | Redirecionar para login |

---

## 🔗 DEEP LINKING

### URLs do App

| Rota | URL | Uso |
|------|-----|-----|
| Home | `barbershop://` | Abertura do app |
| Login | `barbershop://login` | Link de convite |
| Agendamento | `barbershop://booking` | Link de agendamento |

### Como Testar

```bash
# iOS
xcrun simctl openurl booted "barbershop://booking"

# Android
adb shell am start -a android.intent.action.VIEW -d "barbershop://booking"
```

### Configuração (app.json)

```json
{
  "expo": {
    "scheme": "barbershop"
  }
}
```

---

## 🔄 GERENCIAMENTO DE ESTADO

### Arquitetura Atual

```
Estado Local (useState)
├── Dados da tela atual
├── Loading states
├── Form states
└── UI states (modals, etc.)

Parâmetros de Rota (useLocalSearchParams)
├── IDs de seleção (service_id, barber_id)
├── Datas e horários
└── Navegação entre etapas

Supabase (Estado Remoto)
├── Dados persistentes
├── Autenticação
└── Realtime subscriptions (futuro)
```

### Quando Usar Cada Abordagem

| Cenário | Solução |
|---------|---------|
| Estado de tela simples | `useState` |
| Estado compartilhado entre componentes | `useContext` ou prop drilling |
| Dados que vêm do servidor | `useState` + `useEffect` + Supabase |
| Estado global (auth, tema) | `useContext` com provider |
| Formulários complexos | `useState` por campo ou biblioteca |

### Sugestão: Context para Auth

```typescript
// lib/AuthContext.tsx - SUGESTÃO
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      setLoading(false);
    });
    
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
    });
  }, []);
  
  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

---

## 💾 ESTRATÉGIA DE CACHE

### Cache Atual

| Dado | Estratégia | Duração |
|------|-----------|---------|
| Sessão | SecureStore | Até logout/expiração |
| Perfil do usuário | Estado em memória | Até refresh |
| Serviços | Estado em memória | Até reload da tela |
| Barbeiros | Estado em memória | Até reload da tela |

### Onde Implementar Cache Futuro

```typescript
// Sugestão: lib/cache.ts
import * as SecureStore from 'expo-secure-store';

export async function cacheData(key: string, data: any, ttl: number) {
  const item = {
    data,
    expires: Date.now() + ttl
  };
  await SecureStore.setItemAsync(key, JSON.stringify(item));
}

export async function getCachedData(key: string) {
  const raw = await SecureStore.getItemAsync(key);
  if (!raw) return null;
  
  const item = JSON.parse(raw);
  if (Date.now() > item.expires) {
    await SecureStore.deleteItemAsync(key);
    return null;
  }
  
  return item.data;
}
```

### Recomendações de TTL

| Dado | TTL Sugerido |
|------|-------------|
| Lista de serviços | 5 minutos |
| Lista de barbeiros | 5 minutos |
| Horários disponíveis | 1 minuto |
| Perfil do usuário | 10 minutos |
| Histórico de agendamentos | 2 minutos |

---

## 🧪 TESTES

### Status Atual

| Tipo | Status | Cobertura |
|------|--------|-----------|
| Unitários | ❌ Não implementado | 0% |
| Integração | ❌ Não implementado | 0% |
| E2E | ❌ Não implementado | 0% |

### Como Configurar

```bash
# Instalar
npm install --save-dev jest jest-expo @testing-library/react-native

# Rodar testes
npm test
```

### Onde Criar Testes

```
__tests__/
├── booking.test.tsx
├── auth.test.tsx
└── admin.test.tsx
```

---

## 🚀 CI/CD PIPELINE

### Status Atual

| Pipeline | Status |
|----------|--------|
| Build automático | ❌ Não configurado |
| Testes automáticos | ❌ Não configurado |
| Deploy automático | ❌ Não configurado |

### Como Configurar EAS Build

```bash
# Login no Expo
eas login

# Configurar projeto
eas build:configure

# Build de desenvolvimento
eas build --profile development --platform android

# Build de produção
eas build --profile production --platform all
```

### Perfis de Build (eas.json)

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

---

## 👥 CONTATOS E SUPORTE

### Equipe do Projeto

| Função | Contato | Responsabilidade |
|--------|---------|------------------|
| **Dono do Projeto** | [PREENCHER] | Decisões de negócio, credenciais |
| **Desenvolvedor Lead** | [PREENCHER] | Arquitetura, code review |
| **Suporte Técnico** | [PREENCHER] | Dúvidas, problemas urgentes |

### Acesso aos Serviços

| Serviço | URL | Quem tem acesso |
|---------|-----|-----------------|
| Supabase Dashboard | https://supabase.com/dashboard | Dono + Dev Lead |
| Expo Dashboard | https://expo.dev | Dono + Dev Lead |
| GitHub Repository | [PREENCHER] | Equipe de desenvolvimento |
| Google Play Console | [PREENCHER] | Dono |
| Apple Developer | [PREENCHER] | Dono |

### Documentação Externa

| Documentação | URL |
|--------------|-----|
| Expo Docs | https://docs.expo.dev |
| React Native Docs | https://reactnative.dev/docs |
| Supabase Docs | https://supabase.com/docs |
| Expo Router | https://docs.expo.dev/router/introduction |
| NativeWind | https://www.nativewind.dev |

### Canais de Comunicação

| Canal | Uso |
|-------|-----|
| [PREENCHER] | Dúvidas gerais |
| [PREENCHER] | Urgências / Bugs em produção |
| [PREENCHER] | Reuniões de planejamento |

---

## 📦 DEPENDÊNCIAS CRÍTICAS

### Pacotes Essenciais

| Pacote | Versão | Uso | Cuidado ao Atualizar |
|--------|--------|-----|----------------------|
| expo | 51+ | Framework principal | Seguir guia de upgrade |
| react-native | 0.73+ | Base mobile | Testar iOS e Android |
| @supabase/supabase-js | Latest | Backend | Verificar breaking changes |
| expo-router | 3+ | Navegação | Seguir migração guide |
| nativewind | 4+ | Estilização | Compatível com Tailwind |

### Como Atualizar Expo

```bash
# Atualizar Expo SDK (forma segura)
npx expo install --fix

# Verificar o que mudou
npx expo-doctor
```

### Cuidados

- Nunca atualizar `expo` e `react-native` separadamente
- Sempre testar iOS e Android após atualização
- Verificar changelog antes de atualizar Supabase

---

## 🗺️ ROADMAP / FUNCIONALIDADES FUTURAS

### Fase 1 - MVP (CONCLUÍDO ✅)
- [x] Autenticação (login/cadastro)
- [x] Agendamento básico
- [x] Painel gerencial
- [x] Avaliações
- [x] Sistema de permissões

### Fase 2 - Expansão (CONCLUÍDO ✅)
- [x] Carteira digital
- [x] Pontos de fidelidade
- [x] Preferências salvas
- [x] Galeria de fotos
- [x] Agendamento recorrente
- [x] Lembretes

### Fase 3 - Integrações (EM ANDAMENTO 🔄)
- [x] Gateway de pagamento (PIX/Cartão/Dinheiro/Presencial)
- [x] WhatsApp API (parcial)
- [ ] Push notifications reais (EAS)
- [ ] Webhook Mercado Pago (atualização automática de status)
- [ ] Sincronização com Google Calendar

### Fase 4 - Crescimento (PLANEJADO 📋)
- [ ] Modo offline com cache
- [ ] Relatórios avançados (gráficos)
- [ ] Sistema de cupons de desconto
- [ ] Indicação com recompensa
- [ ] Chat interno barbeiro-cliente

### Fase 5 - Escala (FUTURO 🔮)
- [ ] Multi-tenant (SaaS)
- [ ] App para barbeiro dedicado
- [ ] API pública para integrações
- [ ] Painel web (React)
- [ ] Sistema de franquias

### Priorização de Features

| Feature | Prioridade | Esforço | Impacto |
|---------|------------|---------|---------|
| Gateway de pagamento | Alta | Médio | Alto |
| Push notifications | Alta | Baixo | Médio |
| Modo offline | Média | Alto | Alto |
| Cupons de desconto | Média | Médio | Médio |
| Multi-tenant | Baixa | Alto | Alto |

---

## ⚡ PERFORMANCE BUDGETS

### Metas de Performance

| Métrica | Meta | Como Medir |
|---------|------|------------|
| Tempo de abertura | < 3 segundos | Stopwatch |
| Scroll de listas | 60 fps | DevTools |
| Tempo de resposta API | < 500ms | Logs |
| Tamanho do bundle | < 20 MB | `npx expo export --dump-sourcemap` |

### Regras de Otimização

| Regra | Motivo |
|-------|--------|
| Usar FlatList para listas > 10 itens | ScrollView renderiza tudo |
| Memoizar itens de lista com React.memo | Evita re-renders |
| Usar useCallback para renderItem | Evita re-renders |
| Evitar imagens grandes (> 500KB) | Impacta carregamento |
| Lazy load de telas pesadas | Reduz bundle inicial |

---

## ⚠️ LIMITAÇÕES CONHECIDAS

### Limitações Técnicas

| Limitação | Descrição | Impacto | Workaround |
|-----------|-----------|---------|------------|
| **Agendamento apenas 7 dias** | Só permite agendar para próximos 7 dias | Médio | Alterar constante em datetime.tsx |
| **Sem suporte a tablet** | Layout não otimizado para tablets | Baixo | Usar SafeAreaView |
| **Sem offline mode** | App precisa de conexão | Médio | Implementar cache local |
| **WhatsApp manual** | Notificações via link, não API automática | Médio | Configurar API WhatsApp |
| **Sessão de 1 hora** | Token expira em 1h, refresh em 7d | Baixo | Refresh automático já implementado |
| **Sem multi-tenant** | Cada barbearia precisa instância própria | Alto | Planejar SaaS futuro |

### Limitações de Funcionalidade

| Feature | Status | Motivo |
|---------|--------|--------|
| Pagamento com cartão online | ✅ Implementado | Checkout Pro Mercado Pago via deep linking |
| Pagamento presencial (Dinheiro) | ✅ Implementado | Agendamento confirmado, paga na barbearia |
| Pagamento presencial (Cartão) | ✅ Implementado | Crédito ou débito presencial na barbearia |
| Notificação push real | ⚠️ Parcial | Requer EAS Build configurado |
| Sincronização offline | ❌ Não implementado | Complexidade alta |
| Relatórios avançados | ❌ Não implementado | Foco no MVP |
| Multi-idioma | ❌ Não implementado | Foco em PT-BR |
| Modo escuro completo | ⚠️ Parcial | NativeWind configurado, faltam ajustes |

### Bugs Conhecidos

| Bug | Severidade | Arquivo | Status |
|-----|------------|---------|--------|
| Horários não atualizam ao mudar data | Médio | booking/datetime.tsx | ✅ Corrigido |
| Foto não salva sem conexão | Baixo | profile/gallery.tsx | ✅ Corrigido |
| Logout não limpa cache local | Baixo | profile.tsx | ✅ Corrigido |

---

## ♿ ACESSIBILIDADE

### Regras Obrigatórias

| Regra | Implementação |
|-------|---------------|
| Touch targets ≥ 44px | Padding mínimo nos botões |
| Contraste de cores | Mínimo 4.5:1 para texto |
| Labels em elementos | `accessibilityLabel` em botões |
| Suporte a leitores de tela | `accessibilityRole` correto |

### Props de Acessibilidade

```typescript
// Botão acessível
<TouchableOpacity
  accessibilityLabel="Agendar horário"
  accessibilityRole="button"
  accessibilityHint="Toque para selecionar horário"
>
  <Text>10:00</Text>
</TouchableOpacity>

// Imagem acessível
<Image
  source={foto}
  accessibilityLabel="Foto do barbeiro João"
  accessibilityRole="image"
/>
```

### Checklist de Acessibilidade

- [ ] Todos os botões têm `accessibilityLabel`
- [ ] Imagens informativas têm `accessibilityLabel`
- [ ] Contraste de cores adequado
- [ ] Touch targets ≥ 44px
- [ ] Navegação por teclado funciona

---

## 🪝 HOOKS CUSTOMIZADOS

### Hooks Disponíveis

| Hook | Arquivo | Função |
|------|---------|--------|
| `useColorScheme` | hooks/use-color-scheme.ts | Detecta tema do device (dark/light) |
| `useColorScheme` | hooks/use-color-scheme.web.ts | Mesmo para web |
| `useThemeColor` | hooks/use-theme-color.ts | Retorna cor baseada no tema |

### Como Usar

```typescript
// useColorScheme - Detectar tema
import { useColorScheme } from '@/hooks/use-color-scheme';

function MinhaTela() {
  const colorScheme = useColorScheme(); // 'light' | 'dark' | null
  const isDark = colorScheme === 'dark';
  
  return (
    <View style={{ backgroundColor: isDark ? '#000' : '#fff' }}>
      {/* conteúdo */}
    </View>
  );
}

// useThemeColor - Cor do tema
import { useThemeColor } from '@/hooks/use-theme-color';

function MeuComponente() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  
  return (
    <View style={{ backgroundColor }}>
      <Text style={{ color: textColor }}>Texto</Text>
    </View>
  );
}
```

### Hooks do Expo Router (Built-in)

| Hook | Função | Uso |
|------|--------|-----|
| `useRouter()` | Navegação programática | `router.push('/booking')` |
| `useLocalSearchParams()` | Parâmetros da URL | `const { id } = useLocalSearchParams()` |
| `useSegments()` | Segmentos da rota atual | `['booking', 'confirm']` |
| `usePathname()` | Path atual | `/booking/confirm` |
| `useNavigation()` | Objeto de navegação | Acesso a setOptions, goBack |

### Hooks do Supabase (Sugestão para criar)

```typescript
// hooks/useAuth.ts - SUGESTÃO
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
  }, []);
  
  return { user, loading };
}

// hooks/useProfile.ts - SUGESTÃO
export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  
  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => setProfile(data));
    }
  }, [user]);
  
  return { profile };
}
```

---

## 🌐 INTERNACIONALIZAÇÃO (i18n)

### Status Atual

| Idioma | Status |
|--------|--------|
| Português (BR) | ✅ Padrão |
| Inglês | ❌ Não implementado |
| Espanhol | ❌ Não implementado |

### Como Implementar Futuro

```bash
# Instalar biblioteca
npm install i18next react-i18next

# Criar estrutura
locales/
├── pt-BR.json
├── en.json
└── es.json
```

### Strings Atualmente Hardcoded

- Mensagens de erro
- Labels de botões
- Títulos de telas
- Textos de notificação

**Nota:** Para suporte multi-idioma, todas as strings devem ser extraídas para arquivos de tradução.

---

## 🧩 COMPONENTES REUTILIZÁVEIS

### Componentes Disponíveis

| Componente | Arquivo | Função |
|------------|---------|--------|
| `ThemedText` | components/themed-text.tsx | Texto com tema claro/escuro |
| `ThemedView` | components/themed-view.tsx | View com tema claro/escuro |
| `HapticTab` | components/haptic-tab.tsx | Tab com feedback tátil |
| `HelloWave` | components/hello-wave.tsx | Animação de onda |
| `ParallaxScrollView` | components/parallax-scroll-view.tsx | Scroll com efeito parallax |
| `ExternalLink` | components/external-link.tsx | Link que abre navegador |
| `Collapsible` | components/ui/collapsible.tsx | Seção expansível |
| `IconSymbol` | components/ui/icon-symbol.tsx | Ícone (iOS/Android) |

### Como Usar

```typescript
// ThemedText - Texto com tema
import { ThemedText } from '@/components/themed-text';

<ThemedText type="title">Título</ThemedText>
<ThemedText type="subtitle">Subtítulo</ThemedText>
<ThemedText type="default">Texto normal</ThemedText>

// ThemedView - Container com tema
import { ThemedView } from '@/components/themed-view';

<ThemedView style={{ flex: 1 }}>
  {/* conteúdo */}
</ThemedView>

// Collapsible - Seção expansível
import { Collapsible } from '@/components/ui/collapsible';

<Collapsible title="Detalhes">
  <Text>Conteúdo oculto</Text>
</Collapsible>

// ExternalLink - Link externo
import { ExternalLink } from '@/components/external-link';

<ExternalLink href="https://wa.me/5511999999999">
  <Text>Abrir WhatsApp</Text>
</ExternalLink>
```

### Props do ThemedText

| Prop | Tipo | Valores | Descrição |
|------|------|---------|-----------|
| `type` | string | default, title, subtitle, link | Estilo do texto |
| `lightColor` | string | #hex | Cor tema claro |
| `darkColor` | string | #hex | Cor tema escuro |

---

## 💾 BACKUP/RESTORE E MONITORAMENTO

### Backup do Banco (Supabase)

| Método | Frequência | Responsável |
|--------|------------|-------------|
| Backup automático Supabase | Diário | Supabase (automático) |
| Export manual | Semanal | Dono do projeto |
| Backup de scripts SQL | A cada alteração | Dev Lead |

### Como Fazer Backup Manual

```
1. Acessar Supabase Dashboard
2. Database → Backups
3. Download do backup mais recente
4. Salvar em local seguro
```

### Como Restaurar

```
1. Acessar Supabase Dashboard
2. Database → Backups
3. Selecionar backup
4. Clicar em "Restore"
```

### Monitoramento de Erros

| Ferramenta | Status | Uso |
|------------|--------|-----|
| Console logs | ✅ Ativo | Debug em desenvolvimento |
| Expo Error Log | ⚠️ Parcial | Erros em produção |
| Sentry | ❌ Não configurado | Monitoramento avançado |

### Como Configurar Sentry (Futuro)

```bash
# Instalar
npm install @sentry/react-native

# Configurar em App.tsx
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'SEU_DSN_AQUI',
});
```

---

## 🔑 FLUXO DE AUTENTICAÇÃO DETALHADO

### Diagrama do Fluxo
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Login     │────▶│  Supabase   │────▶│   Session   │
│   Screen    │     │    Auth     │     │   Created   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   │                   ▼
       │                   │           ┌─────────────┐
       │                   │           │  JWT Token  │
       │                   │           │  (1 hour)   │
       │                   │           └─────────────┘
       │                   │                   │
       │                   ▼                   ▼
       │           ┌─────────────┐     ┌─────────────┐
       │           │   Profile   │     │   Redirect  │
       │           │   Created   │     │   to Home   │
       │           └─────────────┘     └─────────────┘
```

### Tipos de Usuário e Fluxo

| Tipo | Cadastro | Tela Inicial | Permissões |
|------|----------|--------------|------------|
| **Client** | Register screen | Home (tabs) | Agendar, ver perfil |
| **Barber** | Criado pelo Admin | Painel Admin (limitado) | Ver agenda, clientes |
| **Admin** | Primeiro usuário ou manual | Painel Admin (total) | Tudo |

### Como Funciona o Refresh Token
```
1. Usuário faz login → Recebe access_token (1h) + refresh_token (7d)
2. A cada requisição → Supabase usa access_token automaticamente
3. Quando access_token expira → Supabase usa refresh_token para obter novo
4. Se refresh_token expirar → Usuário precisa fazer login novamente
5. Sessão persiste entre aberturas do app (SecureStore)
```

### Arquivos de Autenticação
| Arquivo | Função |
|---------|--------|
| `lib/supabase.ts` | Configuração do cliente Supabase |
| `app/(auth)/login.tsx` | Tela de login |
| `app/(auth)/register.tsx` | Tela de cadastro |
| `app/(tabs)/_layout.tsx` | Verificação de sessão |

### Tratamento de Erros de Auth
| Erro | Causa | Solução |
|------|------|---------|
| `Invalid login credentials` | Email/senha incorretos | Mostrar mensagem genérica |
| `Email not confirmed` | Email não verificado | Instruir verificar email |
| `User already registered` | Email já cadastrado | Redirecionar para login |
| `Token expired` | Sessão expirada | Refresh automático ou logout |
| `Network error` | Sem conexão | Mostrar mensagem de rede |

---

## 🛠️ COMANDOS ÚTEIS

### Desenvolvimento
```bash
# Iniciar servidor de desenvolvimento
npx expo start

# Iniciar com cache limpo
npx expo start --clear

# Iniciar no iOS Simulator
npx expo start --ios

# Iniciar no Android Emulator
npx expo start --android

# Iniciar no navegador (web)
npx expo start --web
```

### Build e Deploy
```bash
# Build para produção (EAS)
eas build --platform android
eas build --platform ios
eas build --platform all

# Submit para lojas
eas submit --platform android
eas submit --platform ios

# Build local (development client)
npx expo run:ios
npx expo run:android
```

### Dependências
```bash
# Instalar dependências
npm install

# Adicionar pacote
npm install nome-do-pacote

# Adicionar como devDependency
npm install --save-dev nome-do-pacote

# Atualizar Expo SDK
npx expo install --fix

# Verificar dependências desatualizadas
npm outdated
```

### Banco de Dados (Supabase)
```bash
# Executar SQL no Supabase CLI (se instalado)
supabase db push
supabase migration new nome_da_migration
supabase db reset

# Ou executar scripts manualmente via Dashboard:
# Supabase → SQL Editor → Colar conteúdo do script → Run
```

### Debug
```bash
# Abrir dev menu no device
# iOS: Cmd+D / Android: Cmd+M

# Ver logs do Expo
npx expo start --dev-client

# Limpar cache do Metro
npx expo start --clear

# Verificar TypeScript
npx tsc --noEmit

# Verificar ESLint
npx eslint . --ext .ts,.tsx
```

---

## 🔐 VARIÁVEIS DE AMBIENTE

### Arquivo .env (OBRIGATÓRIO)
```
# Supabase (OBRIGATÓRIO)
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx

# WhatsApp Business API (OPCIONAL - para notificações)
WHATSAPP_API_URL=https://graph.facebook.com/v17.0
WHATSAPP_PHONE_NUMBER_ID=xxx
WHATSAPP_ACCESS_TOKEN=xxx
WHATSAPP_VERIFY_TOKEN=xxx

# Expo Push Notifications (OPCIONAL)
EXPO_PROJECT_ID=xxx
```

### Onde obter as credenciais

| Variável | Onde obter | Responsável |
|----------|------------|-------------|
| SUPABASE_URL | Dashboard Supabase → Settings → API | Dono do projeto |
| SUPABASE_ANON_KEY | Dashboard Supabase → Settings → API | Dono do projeto |
| WHATSAPP_* | Meta Business Suite → WhatsApp API | Dono do projeto |
| EXPO_PROJECT_ID | Expo Dashboard → Projects | Dono do projeto |

### Regras de Segurança
- **NUNCA** commitar `.env` no git (já está no .gitignore)
- **NUNCA** logar valores de variáveis sensíveis
- **SEMPRE** usar prefixo `EXPO_PUBLIC_` para variáveis acessíveis no client
- Variáveis sem prefixo ficam apenas no server (Expo dev)

---

## 📋 CHANGELOG

| Data | Versão | Mudança | Arquivo |
|------|--------|---------|---------|
| 31/03/2026 | 5.0 | Implementados: errorHandler, cache, AuthContext. Documentação de pagamento completa | errorHandler.ts, cache.ts, AuthContext.tsx |
| 31/03/2026 | 4.3 | Catálogo de 1.297 awesome skills integrado ao projeto | awesome-skills/, GEMINI.md, ARCHITECTURE.md |
| 31/03/2026 | 4.2 | Corrigidos 3 bugs: horários não atualizam, galeria offline, logout com cache | datetime.tsx, gallery.tsx, profile.tsx |
| 31/03/2026 | 4.1 | Adicionadas opções de pagamento presencial (Dinheiro, Cartão na Barbearia) | payment.tsx, supabase_payments.sql |
| 31/03/2026 | 4.0 | Pagamento com Cartão de Crédito via Mercado Pago Checkout Pro | payment.tsx, app.json |
| 31/03/2026 | 4.0 | Deep linking configurado para retorno do Mercado Pago | payment.tsx, app.json |
| 30/03/2026 | 3.3 | Gráficos no Dashboard (faturamento, horários, barbeiros) | admin.tsx |
| 30/03/2026 | 3.2 | Preferências completas do cliente no painel admin | admin.tsx |
| 30/03/2026 | 3.1 | Detalhes expandidos do cliente no painel admin | admin.tsx |
| 30/03/2026 | 3.0 | Adicionadas 20 seções técnicas para desenvolvedores seniores | RESUMO_FUNCIONALIDADES.md |
| 30/03/2026 | 2.1 | Adicionada seção de Skills (38 agentes especializados) | RESUMO_FUNCIONALIDADES.md |
| 30/03/2026 | 2.0 | Documentação completa atualizada | RESUMO_FUNCIONALIDADES.md |
| 30/03/2026 | 2.0 | Adicionadas regras obrigatórias | RESUMO_FUNCIONALIDADES.md |
| 30/03/2026 | 2.0 | Adicionada seção de APIs | RESUMO_FUNCIONALIDADES.md |
| 30/03/2026 | 2.0 | Adicionados padrões de código | RESUMO_FUNCIONALIDADES.md |
| 30/03/2026 | 2.0 | Adicionado troubleshooting | RESUMO_FUNCIONALIDADES.md |

---

## 🚀 STATUS DE IMPLEMENTAÇÃO

| Categoria | Funcionalidade | Status | Última Atualização |
|-----------|----------------|--------|-------------------|
| **Core** | Autenticação | ✅ | 30/03/2026 |
| **Core** | Agendamento | ✅ | 30/03/2026 |
| **Core** | Avaliações | ✅ | 30/03/2026 |
| **Perfil** | Carteira Digital | ✅ | 30/03/2026 |
| **Perfil** | Pontos de Fidelidade | ✅ | 30/03/2026 |
| **Perfil** | Preferências | ✅ | 30/03/2026 |
| **Perfil** | Galeria de Fotos | ✅ | 30/03/2026 |
| **Perfil** | Catálogo de Estilos | ✅ | 30/03/2026 |
| **Perfil** | Agendamento Recorrente | ✅ | 30/03/2026 |
| **Perfil** | Lembretes | ✅ | 30/03/2026 |
| **Painel** | Dashboard | ✅ | 30/03/2026 |
| **Painel** | Agenda | ✅ | 30/03/2026 |
| **Painel** | Clientes | ✅ | 30/03/2026 |
| **Painel** | Serviços | ✅ | 30/03/2026 |
| **Painel** | Equipe | ✅ | 30/03/2026 |
| **Painel** | Financeiro | ✅ | 30/03/2026 |
| **Painel** | Mensalistas | ✅ | 30/03/2026 |
| **Painel** | Caixa | ✅ | 30/03/2026 |
| **Painel** | Permissões | ✅ | 30/03/2026 |
| **Sistema** | Logs | ✅ | 30/03/2026 |
| **Sistema** | RLS | ✅ | 30/03/2026 |
| **Integração** | WhatsApp | ✅ | 30/03/2026 |
| **Integração** | Push Notifications | ✅ | 30/03/2026 |
| **Integração** | Pagamento PIX | ✅ | 31/03/2026 |
| **Integração** | Pagamento Cartão de Crédito | ✅ | 31/03/2026 |
| **Integração** | Deep Linking (Mercado Pago) | ✅ | 31/03/2026 |
| **Integração** | Pagamento Dinheiro (presencial) | ✅ | 31/03/2026 |
| **Integração** | Pagamento Cartão na Barbearia | ✅ | 31/03/2026 |

---

*Documento atualizado em: 31/03/2026*
*Versão: 5.0*
*Total de funcionalidades: 45+*
*Total de tabelas: 31*
*Total de telas: 25+*
*Total de APIs documentadas: 12+*
*Total de core skills: 38*
*Total de awesome skills: 1.297*
*Total de skills disponíveis: 1.335*
*Total de seções técnicas: 36*
*Total de libs utilitárias: 8*
