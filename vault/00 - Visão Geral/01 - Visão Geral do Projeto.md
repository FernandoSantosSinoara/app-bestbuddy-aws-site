# 🐾 Visão Geral do Projeto Best Buddy
tags: #overview #best-buddy #contexto

## 1. O que é o Best Buddy?
O **Best Buddy** é uma plataforma comunitária voltada para proteção animal, adoção responsável e localização de animais perdidos. O ecossistema visa conectar:
- **Adotantes** (Pessoas Físicas) interessados em acolher cães e gatos.
- **ONGs e Protetores Independentes** (Pessoas Jurídicas / Físicas) que resgatam e cuidam de animais em situação de vulnerabilidade.
- **A Comunidade Local**, compartilhando avisos de animais desaparecidos, notícias sobre feiras de adoção e campanhas de castração/vacinação.

---

## 2. Histórico e Estrutura do Repositório Unificado (Branch: `bruno`)

Inicialmente, o frontend e o backend foram concebidos em pastas/projetos separados por equipes distintas. Para permitir versionamento consistente, implantação contínua e compartilhamento em equipe, o projeto foi **unificado na branch `bruno` do repositório `Best_Buddy`**:

```
Best_Buddy/ (Repositório Git - Branch: bruno)
├── frontend/                          # Aplicação Web completa (Tailwind + Vanilla JS + Nginx)
├── adocoes/                           # App Django de solicitações de adoção
├── animais/                           # App Django de animais cadastrados
├── comunidade/                        # App Django de notícias, posts e desaparecidos
├── config/                            # Configurações do Django (settings, urls, wsgi)
├── usuarios/                          # App Django de autenticação e perfis (PF/PJ)
├── fixtures/                          # Dados de carga inicial (seed_data.json)
├── media/                             # Arquivos de mídia estática
├── vault/                             # Cofre de documentação estruturado para Obsidian
├── db.sqlite3                         # Banco SQLite local pronto e migrado
├── docker-compose.yml                 # Orquestrador com caminhos relativos (db, backend, frontend)
├── Dockerfile                         # Build do container Django
├── entrypoint.sh                      # Inicialização, espera pelo MySQL e seed
├── manage.py                          # CLI do Django
├── seed_data.py                       # Carga inicial automatizada
├── test_endpoints.py                  # Suíte de testes automatizados (9/9 endpoints)
└── requirements.txt                   # Dependências Python
```

---

## 3. Principais Módulos do Sistema

```mermaid
graph TD
    A[Best Buddy System] --> B[Autenticação & Perfis]
    A --> C[Catálogo de Animais]
    A --> D[Fluxo de Adoção]
    A --> E[Comunidade & Notícias]
    A --> F[Animais Desaparecidos]

    B --> B1[Login JWT]
    B --> B2[Cadastro PF / PJ]
    B --> B3[Recuperação de Senha por PIN]

    C --> C1[Listagem de Animais]
    C --> C2[Detalhes do Animal]
    C --> C3[Filtros e Status]

    D --> D1[Solicitação de Adoção]
    D --> D2[Questionário de Aptidão]
    D --> D3[Gestão de Status Aberta/Finalizada]

    E --> E1[Mural de Notícias da ONG]
    E --> E2[Posts da Comunidade]

    F --> F1[Mural de Desaparecidos]
    F --> F2[Registro de Novo Desaparecido]
```

---

## 4. Próximos Passos Gerais
1. Alinhar modelos do backend Django com as necessidades das telas reais do frontend.
2. Corrigir o estado das tabelas e migrações no banco de dados SQLite atual.
3. Conectar o frontend à API real (desligando os Mocks no `js/config.js`).
4. Estruturar a infraestrutura para transição suave para **MySQL**.

Veja também:
- [[02 - Arquitetura do Sistema]]
- [[03 - Transição SQLite para MySQL]]
- [[01 - Matriz de Funcionalidades (O que funciona)]]
