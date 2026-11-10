# 🛡️ Requisitos Não Funcionais (RNF)
tags: #requisitos-nao-funcionais #rnf #arquitetura #seguranca #desempenho #best-buddy

Este documento detalha os **Requisitos Não Funcionais (RNF01 a RNF08)** que governam a qualidade técnica, arquitetura, usabilidade e segurança do **Best Buddy**.

---

## 📐 Catálogo de Requisitos Não Funcionais

### `RNF01` — Usabilidade e Acessibilidade Visual
* **Objetivo:** Garantir uma experiência fluida, amigável e acessível.
* **Critérios de Aceitação:**
  - Interface em português do Brasil (pt-BR) com linguagem acolhedora.
  - Feedback visual imediato para ações assíncronas (esqueletos de carregamento, spinners, toasts de sucesso/erro).
  - Áreas de clique/toque confortáveis (mínimo de 44x44 pixels em botões mobile).
  - Contraste visual adequado de cores (padrão WCAG AA para textos e fundos).

### `RNF02` — Responsividade e Mobile-First
* **Objetivo:** Adaptação dinâmica a qualquer dispositivo.
* **Critérios de Aceitação:**
  - Layout totalmente responsivo utilizando classes utilitárias do Tailwind CSS.
  - Comportamento testado e validado em três faixas de resolução:
    - Mobile: `< 640px` (Smartphones).
    - Tablet: `640px` a `1024px`.
    - Desktop: `> 1024px`.
  - Tabelas e cards reorganizados em fluxo vertical em telas estreitas para eliminar scroll horizontal indesejado.

### `RNF03` — Compatibilidade Cross-Browser
* **Objetivo:** Funcionamento idêntico em qualquer navegador moderno.
* **Critérios de Aceitação:**
  - Total compatibilidade com as duas últimas versões estáveis dos principais navegadores:
    - Google Chrome
    - Mozilla Firefox
    - Microsoft Edge
    - Opera
    - Apple Safari (iOS / macOS)
  - Sem dependência de recursos experimentais proprietários não padronizados pelo W3C.

### `RNF04` — Desempenho e Eficiência
* **Objetivo:** Navegação rápida e baixo consumo de banda.
* **Critérios de Aceitação:**
  - Tempo de carregamento inicial da página (First Contentful Paint) `< 1.5s` em conexões padrão 4G.
  - Tempo de resposta médio da API REST (endpoints de leitura) `< 300ms`.
  - Compactação e redimensionamento de imagens antes do armazenamento no backend.
  - Carregamento postergado de imagens (`loading="lazy"`) em vitrines longas.

### `RNF05` — Segurança e Criptografia
* **Objetivo:** Proteção rigorosa de dados pessoais e credenciais.
* **Critérios de Aceitação:**
  - Senhas armazenadas com hash criptográfico irreversível e salting automático (PBKDF2 com HMAC SHA-256 do Django).
  - Autenticação via JSON Web Tokens (JWT) com Access Token efêmero (60 minutos) e Refresh Token seguro.
  - Sanitização automática de entradas para prevenção de **Cross-Site Scripting (XSS)** e uso estrito do ORM Django para blindagem contra **SQL Injection**.
  - Headers de segurança configurados e **CORS** restrito à porta do frontend autorizado.
  - Proteção de dados de contato e documentos (CPF/CNPJ) contra indexação ou vazamento em endpoints abertos.

### `RNF06` — Confiabilidade e Integridade Transacional
* **Objetivo:** Prevenção de inconsistências e dados corrompidos.
* **Critérios de Aceitação:**
  - Execução de operações críticas que envolvam múltiplas tabelas sob blocos de transação atômica (`transaction.atomic()`).
  - Chaves estrangeiras com regras explícitas de integridade referencial:
    - `CASCADE`: para dados diretamente dependentes do usuário/animal.
    - `SET_NULL`: para preservar histórico de auditoria ou propostas de adoção.
  - Tratamento padronizado de exceções na API devolvendo payloads estruturados de erro (`{ "detail": "...", "code": 400 }`).

### `RNF07` — Arquitetura Modular e Manutenibilidade
* **Objetivo:** Código desacoplado, limpo e de fácil evolução.
* **Critérios de Aceitação:**
  - Separação estrita entre Frontend (Vanilla JS + Tailwind + Nginx) e Backend (Django REST Framework).
  - Estrutura do backend dividida em aplicações Django coesas (`usuarios`, `animais`, `servicos`, `comunidade`, `denuncias`, `adocoes`).
  - Frontend modularizado em serviços (`services/`), componentes (`components/`), utilitários (`utils/`) e páginas (`pages/`).
### `RNF08` — Isolamento da Rota Administrativa
* **Objetivo:** Blindagem de segurança de endpoints internos.
* **Critérios de Aceitação:**
  - A rota `/admin/` não deve possuir links visíveis na navegação pública da aplicação.
  - Acesso restrito estritamente a usuários autenticados com `is_staff=True` ou `is_superuser=True`, retornando `403 Forbidden` ou redirecionando para login seguro.

---

## 🔗 Próximas Notas Relacionadas
- [[02 - Requisitos Funcionais]] — Requisitos de negócio suportados por estes RNFs.
- [[04 - Regras de Negócio]] — Regras invioláveis do sistema.
- [[05 - Modelagem de Dados e Relacionamentos]] — Estrutura relacional do banco.
