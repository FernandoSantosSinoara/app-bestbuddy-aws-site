# 👥 Atores e Matriz de Permissões
tags: #atores #permissoes #rbac #seguranca #best-buddy

Este documento define os **5 perfis de acesso** (atores) do sistema **Best Buddy**, especificando os privilégios, limites operacionais e restrições de cada categoria de usuário.

---

## 🎭 1. Definição dos Atores

### 1. Visitante (Não Autenticado)
* **Perfil:** Qualquer pessoa acessando o site sem login ou cadastro prévio.
* **Poderes / Acesso Liberado:**
  - **Acesso público e irrestrito liberado** para navegar e visualizar todas as vitrines da plataforma (catálogo de animais para adoção, mural de animais perdidos, catálogo de serviços e notícias/campanhas), sem exigir login ou cadastro prévio para consulta.
  - Visualização dos detalhes completos dos anúncios e contato direto com o tutor via WhatsApp ou telefone para manifestar interesse de adoção ou fornecer informações sobre pets desaparecidos.
* **Restrições:**
  - **Não pode** cadastrar animais para adoção nem reportar perdidos.
  - **Não pode** solicitar credenciamento no catalogo de serviços.
  - **Não pode registrar denúncias** (exige autenticação obrigatória).
  - Se clicar em botões de ação restrita, é redirecionado automaticamente para a tela de login/cadastro.
  - Proibido de acessar a rota administrativa (`/admin/`), recebendo erro `403 Forbidden`.

### 2. Usuário Autenticado (Comum / Tutor)
* **Perfil:** Usuário cadastrado pelo fluxo de autenticação com login ativo via JWT.
* **Poderes:**
  - Acessar a tela **"Editar Perfil"** para alterar seu email (com senha atual), alterar senha (com senha atual) e atualizar telefone de contato.
  - Cadastrar até **5 animais ativos** simultâneos (adoção ou perdidos na tabela unificada `Animal`).
  - Editar e gerenciar exclusivamente os seus próprios anúncios (incluindo marcar seu animal como "Adotado" ou "Encontrado").
* **Restrições:**
  - Bloqueado de cadastrar novos animais ao atingir a cota de 5 registros ativos.
  - Não pode editar nem excluir registros de outros usuários.
  - Proibido de acessar o painel `/admin/`.

### 3. Usuário de ONG *(Implementação Futura — ver [[08 - Implementações futuras]])*
* **Perfil:** Conta institucional com privilégio de cadastro ilimitado de animais, a ser implementada na fase seguinte.

### 4. Staff (Moderador / Gestor Operacional)
* **Perfil:** Moderador cadastrado por um SuperUser no painel Django (`is_staff=True`, `is_superuser=False`).
* **Poderes:**
  - Acessar o painel administrativo (`/admin/`).
  - Inativar cadastros de animais considerados falsos, abusivos ou irregulares.
* **Restrições:**
  - Não pode alterar ou excluir contas de outros membros da Staff ou de SuperUsers.

### 5. SuperUser (Administrador Geral)
* **Perfil:** Administrador supremo do sistema (`is_superuser=True`).
* **Poderes:**
  - Acesso total e irrestrito ao painel Django e banco de dados.
  - Criar, editar, redefinir senhas e gerenciar contas de Staff e Usuários.
  - Gerenciamento direto de todas as tabelas e parâmetros da aplicação.

---

## 📊 2. Matriz de Permissões CRUD

### A. Funcionalidades Ativas (MVP)

| Recurso / Funcionalidade | Visitante (Anônimo) | Usuário Autenticado (Tutor) | Staff (Moderador) | SuperUser (Admin) |
| :--- | :---: | :---: | :---: | :---: |
| **Visualizar vitrines públicas (Adoção / Perdidos)** | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim |
| **Contato direto via WhatsApp com o tutor** | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim |
| **Gerenciar próprio perfil (Email/Senha/Telefone)** | ❌ Não | ✅ Sim | ✅ Sim | ✅ Sim |
| **Cadastrar animal para adoção** | ❌ Não (Redireciona) | 🟡 Sim (Até 5 ativos) | 🟢 Sim | 🟢 Sim |
| **Cadastrar animal perdido** | ❌ Não (Redireciona) | 🟡 Sim (Até 5 ativos) | 🟢 Sim | 🟢 Sim |
| **Editar próprios animais/anúncios** | ❌ Não | ✅ Sim | ✅ Sim | ✅ Sim |
| **Concluir anúncio (Adotado / Encontrado)** | ❌ Não | ✅ Sim | ✅ Sim | ✅ Sim |
| **Editar/Excluir animais de terceiros** | ❌ Não | ❌ Não | ❌ Não | 🟢 Sim |
| **Inativar cards de terceiros (Moderação)** | ❌ Não | ❌ Não | ✅ Sim | ✅ Sim |
| **Acessar painel administrativo (`/admin/`)** | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ Sim | ✅ Sim |
| **Gerenciar contas de Staff** | ❌ Não | ❌ Não | ❌ Proibido | 🟢 Sim |

### B. Funcionalidades Postergadas / Descontinuadas

| Recurso | Status | Documentação |
| :--- | :---: | :--- |
| **Validação de WhatsApp via Twilio** | 🚀 Futuro | [[08 - Implementações futuras#📱 Módulo Futuro 1: Validação de WhatsApp via Twilio Verify]] |
| **Cota Ilimitada e Upgrade de ONG** | 🚀 Futuro | [[08 - Implementações futuras#🏢 Módulo Futuro 2: Solicitação e Upgrade de Contas de ONG]] |
| **Catálogo de Serviços e Clínicas** | 🚀 Futuro | [[08 - Implementações futuras#🏥 Módulo Futuro 3: Catálogo de Serviços Profissionais e Clínicas]] |
| **Sistema Universal de Denúncias** | 🚀 Futuro | [[08 - Implementações futuras#🚨 Módulo Futuro 4: Sistema Universal de Denúncias]] |
| **Mural de Posts da Comunidade** | ❌ Descontinuado | Abandonado por decisão de produto em favor de foco em adoção/perdidos |

---

## 🔗 Próximas Notas Relacionadas
- [[02 - Requisitos Funcionais]] — Especificação de cada funcionalidade.
- [[04 - Regras de Negócio]] — Regras de cota, expiração e moderação.
- [[05 - Modelagem de Dados e Relacionamentos]] — Como esses perfis se refletem no banco de dados.
