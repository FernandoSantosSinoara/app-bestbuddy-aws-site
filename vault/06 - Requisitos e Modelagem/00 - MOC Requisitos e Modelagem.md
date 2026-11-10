# 📋 Requisitos & Modelagem — Mapa de Conteúdo (MOC)
tags: #moc #requisitos #regras-de-negocio #modelagem #gap-analysis #best-buddy

Este módulo do **Obsidian Vault** reúne a documentação canônica de requisitos funcionais, não funcionais, regras de negócio, modelagem de banco de dados e a auditoria de divergências (**Gap Analysis**) do projeto **Best Buddy**, consolidando as decisões de produto: **tabela única de animais**, **foco no MVP (Adoção e Perdidos)**, **edição de perfil** e **postergação de serviços, ONGs e denúncias para implementações futuras**.

---

## 🗺️ Estrutura da Documentação

### 1. [[01 - Atores e Matriz de Permissões]]
- Mapeamento dos perfis ativos do MVP: Visitante, Usuário Autenticado (Tutor), Staff e SuperUser.
- Matriz de permissões CRUD com segregação clara entre o escopo atual e recursos futuros.

### 2. [[02 - Requisitos Funcionais]]
- Catálogo completo de 17 requisitos funcionais organizados em 4 módulos prioritários:
  - Módulo 1: Autenticação, Perfil e Controle de Acesso (`RF01` a `RF04`).
  - Módulo 2: Animais para Adoção (`RF05` a `RF11`).
  - Módulo 3: Animais Perdidos (`RF12` a `RF15`).
  - Módulo 4: Rotina Automática de Expiração 90 + 30 dias (`RF16` e `RF17`).

### 3. [[03 - Requisitos Não Funcionais]]
- Critérios de qualidade técnica: **RNF01 a RNF08** (Usabilidade, Mobile-First, Compatibilidade Cross-Browser, Desempenho, Segurança e Criptografia, Integridade Transacional, Arquitetura Modular e Isolamento da Rota Administrativa).

### 4. [[04 - Regras de Negócio]]
- Detalhamento das regras mandatórias do MVP: **RN01 a RN09** (Navegação pública, Ações autenticadas, Cota de 5 animais, Titularidade de edição, Adoção direta peer-to-peer, Ciclo 90+30 dias, Limite de 255 chars, Segurança no perfil e Padronização geográfica de Estado e Cidade).

### 5. [[05 - Modelagem de Dados e Relacionamentos]]
- Diagrama Entidade-Relacionamento (ERD) e Dicionário de Dados com foco nas tabelas ativas (`Usuario`, `Animal`) e demarcação dos modelos de backlog.

### 6. [[06 - Matriz de Gap Analysis (O que Adicionar, Ajustar e Remover)]]
- Comparativo direto entre o código atual (`Best_Buddy`) e a especificação consolidada.

### 7. [[07 - Plano de Ação e Roadmap de Implementação]]
- Checklist operacional estruturado em sprints para guiar a execução das mudanças.

### 8. [[08 - Implementações futuras]]
- Backlog de evolução: Twilio WhatsApp, Contas de ONG com cota ilimitada, Catálogo de Serviços e Clínicas, Sistema Universal de Denúncias, Moderação Avançada de Staff e Recuperação de Senha por Email.

### 9. [[09 - Privacidade, Dados Sensiveis (LGPD) e Termos de Adesao]]
- Tratamento de privacidade e conformidade com a LGPD (Lei 13.709/2018), mapeamento de dados sensíveis e PII, política de armazenamento local/cookies e especificação dos 5 modais e componentes de consentimento.

---

## 🔗 Links Rápidos
- Retornar ao índice geral: [[00 - MOC (Início)]]
- Visão de arquitetura: [[02 - Arquitetura do Sistema]]
- Contratos de API: [[01 - Contrato de API (Endpoints)]]
