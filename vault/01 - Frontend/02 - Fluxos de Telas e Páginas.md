# 📱 Frontend — Fluxos de Telas e Páginas
tags: #frontend #ui #ux #paginas #fluxos

Este documento detalha o comportamento funcional de cada tela do frontend, incluindo validações, formulários e integração.

---

## 1. Módulo de Autenticação (`pages/auth/`)

### `login.html` & `login.js`
- **Objetivo**: Autenticar o usuário na plataforma.
- **Campos**: `email` e `password`.
- **Validações Client-side**:
  - `email`: obrigatório e formato válido de email.
  - `password`: obrigatório.
- **Fluxo de Submissão**:
  1. Bloqueia botão e exibe spinner (`Entrando...`).
  2. Chama `authService.login({ email, password })`.
  3. Salva a sessão com `bbStorage.setSession(session)`.
  4. Redireciona para o parâmetro `?next=` da query string ou para `/pages/home/index.html`.
  5. Se falhar, exibe alerta vermelho com a mensagem de erro da API.
- **Credenciais de Teste no Modo Mock**:
  - `usuario@bestbuddy.com` / `123456`

---

### `register.html` & `register.js`
- **Objetivo**: Cadastro de novos adotantes (Pessoa Física).
- **Campos**:
  - `nome` (obrigatório)
  - `cpf` (obrigatório, validação de 11 dígitos)
  - `email` (obrigatório, formato válido)
  - `telefone` (opcional / máscara)
  - `senha` (mínimo de 6 caracteres)
  - `confirmar_senha` (deve ser idêntica à senha)
- **Fluxo de Submissão**:
  1. Chama `authService.register(payload)` enviando `{ nome, cpf, email, telefone, password: senha, tipo: "PF" }`.
  2. Ao receber sucesso, exibe banner verde e redireciona após 1.2s para `login.html`.

---

### `forgot-password.html` & `forgot-password.js`
- **Objetivo**: Recuperação de senha em 2 etapas.
- **Etapa 1 (Solicitação)**:
  - Usuário informa o `email`.
  - Chama `authService.requestPasswordReset(email)`.
  - Oculta o form 1 e exibe o form 2.
- **Etapa 2 (Confirmação)**:
  - Usuário informa o `PIN` recebido e a `nova_senha` (mínimo 6 caracteres).
  - Chama `authService.confirmPasswordReset({ email, pin, password })`.
  - Redireciona para `login.html`.

---

## 2. Telas Internas e Vitrines

### `pages/home/index.html` & `home.js`
- **Objetivo**: Página inicial da plataforma, apresentando o propósito e os pets disponíveis.
- **Componentes**:
  - `bbRenderHeroCarousel("#bb-hero")`: Carrossel informativo com chamadas para adoção e localização de pets perdidos.
  - `#bb-home-pets`: Grade de destaque com até 4 animais disponíveis para adoção (`animalService.list({ tipo_servico: "ADOCAO" })`).
  - Botão de atalho para a vitrine completa: "Ver todos os pets →".
- **Decisão de Produto**:
  - As antigas seções de notícias e posts da comunidade foram **descontinuadas/abandonadas** em prol do foco central na causa animal e contato direto via WhatsApp.

---

### `pages/community/index.html` (Descontinuado / Redirecionamento)
> [!NOTE]
> **Módulo Descontinuado:** Conforme decisão de produto, o mural livre de postagens de usuários e notícias foi abandonado. O reporte de animais desaparecidos foi unificado na página de animais.
- Acessos a esta rota são imediatamente redirecionados via client-side para `/pages/animals/index.html#bb-lost-section`.

---

### `pages/animals/index.html` & `animals.js`
- **Objetivo**: Central unificada de animais para adoção responsável e animais desaparecidos.
- **Vitrines Independentes na Mesma Página**:
  - **🚨 Animais Desaparecidos** (`#bb-lost-section`): Cards com identificação visual de emergência, último local visto e contato do tutor.
  - **🐾 Animais para Adoção** (`#bb-adopt-section`): Cards de pets disponíveis com foto, características, raça, idade e localização.
- **Abas de Visualização**:
  - "Todos os Pets": Exibe todos os animais cadastrados na plataforma.
  - "Meus Anúncios": Filtra automaticamente pelos anúncios cadastrados pelo usuário autenticado (`tutor_id`).
- **Filtros Geográficos Inteligentes com IBGE**:
  - `<select id="filter-estado">`: Lista estática das 27 UFs brasileiras (sem chamada de rede).
  - `<input id="filter-cidade" list="filter-cidades-list">`: Autocomplete leve via `<datalist>` carregado sob demanda da API do IBGE via `ibgeService.js` com cache de 2 níveis (RAM + `sessionStorage`).
  - `<select id="filter-tipo-animal">`: Filtra por Cachorro, Gato ou Outro.
- **Modal Unificado de Publicação (`#adopt-modal`)**:
  - Botões de abertura: `+ Anunciar Pet para Adoção` e `+ Reportar Pet Perdido`.
  - Seletor de Serviço (`#pet-servico`): Alterna entre Adoção e Animal Perdido, ajustando títulos e exibindo condicionalmente o campo `#wrap-pet-local` (Último local visto).
  - Seleção em cascata Estado $\rightarrow$ Cidade com `<datalist>`.
  - **Telefone de Contato Obrigatório (`#pet-telefone`)**:
    - Aplica máscara automática brasileira `(XX) XXXXX-XXXX`.
    - Pré-preenchido com o telefone do perfil caso o usuário logado possua.
    - **Validação Bloqueante no Frontend**: Verifica se o DDD é válido (11 a 99) e se possui 10 ou 11 dígitos. Caso inválido, bloqueia o envio com `alert("É necessário um número de contato para cadastrar o animal.");`, impedindo a chamada de rota da API.
- **Gerenciamento pelo Tutor**:
  - Cards do próprio usuário logado exibem botão para concluir o anúncio ("Marcar como Adotado" ou "Marcar como Encontrado") e botão para excluir o anúncio.

---

### `pages/animals/detail.html` & `animal-detail.js`
- **Objetivo**: Ficha técnica e perfil detalhado do animal escolhido.
- **Parâmetro de URL**: `?id=<id>`
- **Exibição**:
  - Imagem do pet e tipo de animal (`Cachorro`, `Gato`, `Outro`).
  - Badges informativos: Raça, Idade aproximada, Sexo formatado (Macho/Fêmea/Indeterminado) e Localização (`📍 Cidade - UF`).
  - Status de vacinação e uso de medicamentos contínuos.
  - Descrição comportamental / características.
  - **Botão de Ação Primário**: **"Falar com o Tutor no WhatsApp"** (link direto para `https://wa.me/55...` com mensagem pré-formatada).
  - **Botão Secundário**: **"Denunciar Card"** (para reporte de anúncios irregulares).

---

### `pages/adoption/create.html` (Descontinuado)
> [!WARNING]
> **Fluxo Descontinuado:** Conforme a especificação revisada em [[02 - Requisitos Funcionais#RF13 — Contato Direto para Adoção (Sem Formulário Intermediário)]], o questionário burocrático de aptidão foi removido. A negociação ocorre diretamente com o tutor via WhatsApp.

---

Veja também:
- [[02 - Requisitos Funcionais]]
- [[05 - Modelagem de Dados e Relacionamentos]]
- [[06 - Matriz de Gap Analysis (O que Adicionar, Ajustar e Remover)]]
