# 🐾 Best Buddy — Obsidian Vault (MOC)
tags: #moc #best-buddy #index

Bem-vindo ao **Obsidian Vault** de documentação técnica, integração e roadmap do projeto **Best Buddy**.

Este repositório de notas documenta tanto o **Backend Django REST** quanto o **Frontend Tailwind/Vanilla JS**, mapeando todas as funcionalidades, contratos de API, divergências encontradas, estado dos bancos de dados (SQLite e migração planejada para MySQL) e o plano de ação detalhado.

---

## 🗺️ Mapa de Conteúdo (MOC)

### 📌 00 - Visão Geral & Arquitetura
- [[01 - Visão Geral do Projeto]] — Contexto, proposta da ONG, histórico e estrutura dos repositórios.
- [[02 - Arquitetura do Sistema]] — Visão de arquitetura desacoplada, fluxo de comunicação e tecnologias.
- [[03 - Transição SQLite para MySQL]] — Estratégia de banco de dados atual (SQLite) e guia de migração para MySQL.

### 🎨 01 - Frontend (Best_Buddy/frontend)
- [[01 - Estrutura e Tecnologias]] — Organização de pastas, Vanilla JS + Tailwind, sem build no deploy.
- [[02 - Fluxos de Telas e Páginas]] — Detalhamento de cada tela (Auth, Home, Animais, Adoção, Comunidade).
- [[03 - Serviços e Camada de API]] — Como funcionam `bbClient`, `bbStorage` e os `services`.
- [[04 - Mocks e Modo Desacoplado]] — Funcionamento do toggle `USE_MOCKS`, latência artificial e dados fake.
- [[05 - Design System e Tailwind]] — Paleta de cores, tipografia, `@apply`, microanimações e tokens.

### ⚙️ 02 - Backend (Best_Buddy - Django REST)
- [[01 - Arquitetura Django REST]] — Configurações centrais, apps instaladas, middlewares e JWT.
- [[02 - App Usuários e Autenticação]] — Modelo customizado `Usuario`, perfis PF/PJ, registro e pendências.
- [[03 - App Animais]] — Modelagem atual, serializers, permissões e correção de tabela.
- [[04 - App Adoções]] — Análise crítica do modelo atual (desacoplado do animal) e proposta de reformulação.
- [[05 - App Comunidade (Planejamento)]] — Especificação completa do novo app a ser criado no Django.

### 🔗 03 - Integração & Contratos de API
- [[01 - Contrato de API (Endpoints)]] — Especificação completa dos endpoints esperados pelo front.
- [[02 - Matriz de Divergências (Front vs Back)]] — Tabela comparativa do que o front envia vs o que o back aceita.
- [[03 - Fluxo de Autenticação JWT]] — Ciclo de vida dos tokens de acesso/refresh e armazenamento de sessão.

### 📊 04 - Status & Funcionalidades
- [[01 - Matriz de Funcionalidades (O que funciona)]] — Inventário funcional: o que roda no front mock, no front real e no back.
- [[02 - Diagnóstico dos Bugs Atuais]] — Análise de causa raiz (RCA) dos problemas críticos (tabela SQLite, serializers, etc.).

### 🚀 05 - Tarefas & Roadmap
- [[00 - MOC Tarefas e Roadmap]] — Índice e síntese do módulo de execução e sprints.
- [[01 - Checklist de Correções Imediatas]] — Passo a passo prioritário das correções imediatas (100% concluído).
- [[02 - Tarefas Backend (Django)]] — Especificação técnica do código implementado e tarefas pendentes no Django.
- [[03 - Tarefas Frontend (Melhorias)]] — Melhorias concluídas (UX, modais) e backlog de telas pendentes.
- [[04 - Guia de Execução e Testes]] — Como rodar ambos os projetos localmente e executar a suíte de 14 testes.
- [[05 - Configuração e Uso do Docker]] — Como executar todo o ecossistema (Django + MySQL + Nginx) via Docker Compose.
- [[06 - Guia de Alinhamento da Equipe e Novo Roadmap]] — Guia de alinhamento com histórico de sprints e novo roadmap (Sprints 4 e 5).
- [[07 - Otimizacao de Imagens (Pillow e WebP)]] — Arquitetura de compressão de fotos em Dupla Camada (Canvas API + Pillow WebP).

### 📋 06 - Requisitos & Modelagem (Auditado)
- [[00 - MOC Requisitos e Modelagem]] — Índice central da especificação canônica do sistema.
- [[01 - Atores e Matriz de Permissões]] — Visitante, Comum, ONG, Staff e SuperUser com restrições e poderes.
- [[02 - Requisitos Funcionais]] — RF01 a RF40 categorizados por módulos funcionais.
- [[03 - Requisitos Não Funcionais]] — RNF01 a RNF07 com métricas e critérios de aceitação.
- [[04 - Regras de Negócio]] — RN01 a RN12 (Cota de 5, ilimitado para ONGs, ciclo 90+30 dias, moderação).
- [[05 - Modelagem de Dados e Relacionamentos]] — Diagrama ERD em Mermaid e Dicionário de 8 tabelas.
- [[06 - Matriz de Gap Analysis (O que Adicionar, Ajustar e Remover)]] — Confronto direto: código atual vs requisitos.
- [[07 - Plano de Ação e Roadmap de Implementação]] — Cronograma detalhado em 5 fases de execução.
- [[09 - Privacidade, Dados Sensiveis (LGPD) e Termos de Adesao]] — Tratamento LGPD, dados sensíveis, cookies/storage e modais de consentimento.

---

## ⚡ Status Rápido do Projeto

| Componente | Estado Atual | Detalhes / Última Atualização |
| :--- | :--- | :--- |
| **Frontend (Mock)** | 🟢 100% Funcional | Mantido como fallback offline em `js/mocks/`. |
| **Frontend (API Real)** | 🟢 100% Integrado | Autenticação, navbar dinâmica, vitrines com filtros IBGE, modais Tailwind e compressão Canvas. |
| **Backend (Auth & Perfil)** | 🟢 100% Funcional | Cadastro sem atrito, login JWT, edição de perfil, recuperação de senha e validação de WhatsApp Twilio. |
| **Backend (Animais)** | 🟢 100% Funcional | Tabela unificada (`ADOCAO` e `PERDIDO`), herança de contato, controle de cota (5) e gestão pelo tutor. |
| **Adoções & Comunidade** | 🟢 Consolidado | Intermediação burocrática substituída por WhatsApp direto; central única de animais na vitrine. |
| **Banco de Dados** | 🟢 SQLite + MySQL | SQLite local e MySQL 8.0 `utf8mb4` no Docker totalmente operacionais e migrados. |
| **Docker & DevOps** | 🟢 100% Operacional | `docker-compose.yml` orquestrando Nginx, Django e MySQL com seed e migrações automáticas. |
| **Testes Automatizados** | 🟢 14/14 Passando | Suíte de testes `test_endpoints.py` validando todos os fluxos com código 0. |

