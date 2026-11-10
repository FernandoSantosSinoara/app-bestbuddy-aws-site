# 🔍 Matriz de Gap Analysis (O que Adicionar, Ajustar e Remover)
tags: #gap-analysis #auditoria #divergencias #comparativo #roadmap #best-buddy

Este documento apresenta a análise de divergências entre a base de código do projeto (`Best_Buddy`) e as diretrizes consolidadas e simplificadas de arquitetura.

---

## 🟢 1. O que ADICIONAR ao Projeto (Foco MVP)

| Recurso / Item | Onde Deve Ser Adicionado | Detalhes Técnicos da Adição | Prioridade |
| :--- | :--- | :--- | :---: |
| **Tela "Editar Perfil"** | Frontend: `pages/auth/profile.html`<br>Backend: `usuarios/views.py` | Telas e endpoints para: 1) Alteração de email com 2FA (senha atual + token por email); 2) Alteração de senha com confirmação de senha atual; 3) Alteração de telefone com 2FA (código OTP WhatsApp); 4) Bloqueio de alteração de nome (imutável após criação). | 🔴 Alta |
| **Campo `telefone` no Usuário** | Backend: `usuarios/models.py`<br>Frontend: `register.html` e `profile.html` | Inclusão de `telefone` (CharField obrigatório e único com DDD) diretamente no modelo `Usuario`. | 🔴 Alta |
| **Tabela Unificada de Animais (`Animal`)** | Backend: `animais/models.py`<br>Frontend: `animals/index.html` e modais | Unificar adoção e animais perdidos em uma única tabela com flag `tipo_servico` (`ADOCAO` / `PERDIDO`). Contato resolvido via FK com o tutor (`animal.tutor.telefone`). | 🔴 Alta |
| **Padronização Geográfica (Estado e Cidade)** | Backend: `animais/models.py`<br>Frontend: formulários de animais | Adicionar campo `estado` (Enum de 27 UFs) e integração com ViaCEP/IBGE para preenchimento de cidade e estado sem permitir digitação livre inconsistente. | 🔴 Alta |
| **Cota de 5 Animais Ativos** | Backend: `animais/serializers.py` e `views.py` | Validação estrita impedindo o cadastro do 6º animal ativo (adoção + perdido) para o usuário comum. | 🔴 Alta |

### 🚀 Itens Postergados para o Backlog de Futuras Fases
*Consultar [[08 - Implementações futuras]] para especificações detalhadas:*
- **Integração com Twilio Verify (WhatsApp):** Validação por OTP gerenciado.
- **Módulo de Serviços Credenciados:** Vitrine profissional, CRMV e aprovação Staff.
- **Módulo de Solicitação e Upgrade de ONG:** CNPJ e cota ilimitada de animais.
- **Módulo Universal de Denúncias:** Categorias em Enum e fila de triagem.

---

## 🟡 2. O que AJUSTAR no Projeto

| Recurso / Item a Ajustar | Situação Anterior | Como Deve Ficar Conforme as Novas Diretrizes | Prioridade |
| :--- | :--- | :--- | :---: |
| **Contato nos Cards de Animais** | Campo de texto livre (`contato = models.CharField`) digitado em cada animal. | **Telefone Obrigatório com DDD**: O anúncio exige número válido com DDD. O front bloqueia submissões inválidas com popup antes da chamada de rota. O backend garante o campo e herda do tutor caso omitido. | 🔴 Alta |
| **Cadastro Inicial de Usuário** | Exigia dados de pessoa física/jurídica completos. | Aceitar `email`, `senha`, `confirmação_de_senha` e `telefone` (opcional). Demais dados são preenchidos no perfil ou fluxos específicos. | 🔴 Alta |
| **Filtros e Visualização de Animais** | Telas e endpoints fragmentados entre adoção e desaparecidos em apps distintos. | Vitrine com filtros ou abas unificadas para "Adoção" e "Animais Perdidos" consumindo a mesma tabela `animais_animal`. | 🔴 Alta |
| **Navegação do Header (Navbar)** | Exibia links descontinuados. | Incluir link "Meu Perfil" para usuário logado, exibir status do WhatsApp e remover referências a posts e comunidade. | 🟡 Média |

---

## 🔴 3. O que REMOVER ou DESCONTINUAR

| Item a Remover / Descontinuar | Onde Estava | Motivo da Remoção / O que Fazer | Prioridade |
| :--- | :--- | :--- | :---: |
| **Módulo Completo de Comunidade & Notícias** | `comunidade/`, `config/urls.py`, `settings.py`, `communityService.js`, `pages/community/` | **Abandonado por completo**: O mural livre de postagens de usuários e notícias foi descontinuado do produto. Rotas retornam HTTP 404. | 🔴 Alta |
| **Tabela Local `ValidacaoWhatsapp`** | Proposta anterior / models | **Removida**: O controle de OTP e envio via WhatsApp é gerenciado pelo Twilio Verify, sem necessidade de tabela local de PINs. | 🔴 Alta |
| **Tabela Separada `AnimalDesaparecido`** | `comunidade/models.py` | **Unificada**: Migrada para `animais_animal` com `tipo_servico='PERDIDO'`. | 🔴 Alta |
| **Formulário de Interesse em Adoção** | `adocoes/models.py`, `frontend/pages/adoption/` | **Descontinuado**: Adoção é feita por contato direto com o tutor via WhatsApp. Questionário interno descartado. | 🔴 Alta |

---

## 🔗 Próximas Notas Relacionadas
- [[07 - Plano de Ação e Roadmap de Implementação]] — Passos de implementação.
- [[05 - Modelagem de Dados e Relacionamentos]] — Schema de banco de dados consolidado.
- [[02 - Requisitos Funcionais]] — Especificação de cada requisito.
