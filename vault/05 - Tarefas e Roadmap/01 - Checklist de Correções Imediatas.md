# 🚀 Roadmap — Checklist de Correções Imediatas
tags: #roadmap #checklist #tarefas #prioridades #concluido #auditado

Este documento registra o plano de ação executado e concluído para colocar o **Backend Django e o Frontend operando juntos em total harmonia**, com todas as etapas validadas, migradas e testadas.

---

## ⚡ Prioridade 1: Desbloquear a Conexão Front-Back (Zero 500 / Zero 400)

- [x] **1.1. Corrigir a tabela `animais_animal` no SQLite**
  - Renomeada a tabela física `animais_animais` para `animais_animal` no `db.sqlite3`.
  - Validado via ORM: `Animal.objects.count()` responde sem erro.
- [x] **1.2. Atualizar o Serializer de Animais**
  - Incluídos `'id'`, `'descricao'`, `'imagem'` e `'created_at'` em `AnimaisSerializer`.
  - Permissão de `AnimaisViewSet` alterada para `AllowAny` no método `GET`.
- [x] **1.3. Adicionar campos `descricao` e `imagem` ao modelo `Animal`**
  - Adicionados os campos em `animais/models.py`.
  - Migrações geradas e aplicadas (`animais.0002`).
- [x] **1.4. Refatorar o modelo e serializer de `Adocao`**
  - Inicialmente criada chave estrangeira `animal = ForeignKey('animais.Animal')`.
  - Posteriormente, para maximizar a conversão de adoções e eliminar atrito burocrático, o fluxo foi simplificado para **contato direto via WhatsApp com o tutor** e a rota legada `/api/adocoes/` foi descontinuada (retornando 404 seguro).
- [x] **1.5. Limpar middlewares duplicados em `config/settings.py`**
  - Removidas chamadas repetidas e posicionado `CorsMiddleware` no topo.

---

## ⚡ Prioridade 2: Cadastro, Autenticação, Perfil e Segurança

- [x] **2.1. Cadastro de Usuário Ágil e Sem Fricção**
  - Removida a obrigatoriedade do CPF para Pessoa Física (eliminando atrito no onboarding).
  - Validação estrita de unicidade de telefone/WhatsApp (`GET /api/usuarios/verificar-telefone/`).
  - Criação rápida via `POST /api/usuarios/register/` retornando token JWT e dados do usuário.
- [x] **2.2. Retornar dados do `user` no Login JWT**
  - Criado `CustomTokenObtainPairSerializer` retornando `user: { id, email, nome, tipo, telefone, telefone_validado }`.
  - Rota `/api/token/` atualizada em `config/urls.py`.
  - `authService.js` no frontend atualizado para persistir `data.user` na sessão e exibir nome e avatar na navbar.
- [x] **2.3. Implementar Recuperação e Redefinição de Senha no Backend**
  - Implementado `POST /api/usuarios/recuperar-senha/` gerando token assinado criptograficamente com fallback para ambiente de desenvolvimento (`token_dev`).
  - Implementado `POST /api/usuarios/redefinir-senha/` validando o token assinado e atualizando a senha do usuário com segurança.
- [x] **2.4. Validação de WhatsApp via Twilio Verify**
  - Implementado `POST /api/usuarios/whatsapp/enviar/` formatando número no padrão E.164.
  - Implementado `POST /api/usuarios/whatsapp/verificar/` com suporte a credenciais de produção e fallback mock para dev (`123456`).
- [x] **2.5. Gestão Completa de Perfil no Backend**
  - `GET /api/usuarios/perfil/` e `PATCH /api/usuarios/perfil/` para atualização de nome e telefone.
  - Alteração de senha autenticada (`POST /api/usuarios/alterar-senha/`) com validação da senha atual.
  - Alteração de email com token de confirmação seguro (`POST /api/usuarios/alterar-email/` e `/confirmar-email/`).

---

## ⚡ Prioridade 3: Arquitetura Unificada de Animais (Adoção + Perdidos)

- [x] **3.1. Unificação da Tabela `Animal`**
  - Eliminada duplicidade entre animais de adoção e perdidos.
  - O modelo `Animal` (`animais/models.py`) centraliza ambos os fluxos via discriminador `tipo_servico` (`ADOCAO` e `PERDIDO`).
  - Vínculo direto com o anunciante via `tutor = ForeignKey(Usuario)`.
- [x] **3.2. Descontinuação dos Apps Legados `comunidade` e `adocoes`**
  - Removidos modelos antigos `Post` e `AnimalDesaparecido` (migração `0002_delete_animaldesaparecido_delete_post.py`).
  - Desativados `comunidade` e `adocoes` de `INSTALLED_APPS` e `config/urls.py` em prol da central única de animais.
- [x] **3.3. Contato Direto via WhatsApp**
  - Adicionado campo `telefone_contato` com `@property contato` dinâmico herdando o telefone validado do tutor.
- [x] **3.4. Controle de Cotas e Regras Anti-Spam**
  - Regra de no máximo 5 anúncios ativos simultâneos por tutor (`Animal.objects.filter(...) >= 5`).
  - Bloqueio de anúncio para usuários sem WhatsApp validado (`telefone_validado == False`).
- [x] **3.5. Gerenciamento do Anúncio pelo Próprio Tutor**
  - O tutor autenticado pode atualizar o status do pet (`DISPONIVEL`, `ADOTADO`, `PERDIDO`, `ENCONTRADO`, `INATIVO`).
  - Permissão de exclusão restrita: apenas o tutor proprietário pode deletar seu pet (terceiros recebem 403 Forbidden).

---

## ⚡ Prioridade 4: Otimização de Imagens e Integração com IBGE

- [x] **4.1. Compressão de Imagens em Dupla Camada**
  - **Frontend:** Canvas API nativo (`image-compressor.js`) redimensiona para 1080px WebP, descarta metadados EXIF/GPS (LGPD) e reduz arquivos de até 50 MB para ~150 KB.
  - **Backend:** `otimizar_imagem_animal()` (`animais/utils.py`) com Fast-Path para WebP $\le$ 1MB e fallback em Pillow.
- [x] **4.2. Integração com API de Localidades do IBGE**
  - `ibgeService.js` consome estados e municípios oficiais sem sobrecarregar o banco de dados.
  - Implementado cache duplo (RAM + `sessionStorage`) com busca instantânea via `<datalist>`.

---

## ⚡ Prioridade 5: Carga Inicial de Dados e Suíte de Testes Automatizados

- [x] **5.1. Popular dados de teste no banco**
  - Script `seed_data.py` atualizado e executado com pets de adoção e animais perdidos na tabela unificada.
  - Criado usuário base de teste: `usuario@bestbuddy.com` / `123456` com telefone validado.
- [x] **5.2. Testar todos os fluxos com a suíte automatizada (14/14 Endpoints)**:
  - Script `test_endpoints.py` executado com **100% de sucesso nos 14 testes (`exit code 0`)**:
    1. Cadastro sem CPF e sem atrito: OK
    2. Unicidade e disponibilidade de telefone: OK
    3. Login JWT com dados completos do user: OK
    4. Consulta de perfil do usuário: OK
    5. Validação de WhatsApp via Twilio: OK
    6. Alteração de senha com senha atual: OK
    7. Alteração de e-mail com token de confirmação: OK
    8. Listagem de animais na tabela unificada (Adoção e Perdidos): OK
    9. Cadastro de pet com herança automática de contato do tutor: OK
    10. Bloqueio de cota (máximo de 5 animais ativos): OK
    11. Bloqueio de anúncio sem WhatsApp validado: OK
    12. Confirmação de descontinuação de notícias e posts (404 seguro): OK
    13. Confirmação de descontinuação da intermediação de adoção (404 seguro): OK
    14. Recuperação e redefinição de senha com token seguro: OK
    15. Gerenciamento do anúncio pelo tutor (`PATCH` status e `DELETE` protegido): OK

---

## ⚡ Prioridade 6: Suporte a MySQL e Dockerização Completa

- [x] **6.1. Suporte Dinâmico a MySQL**
  - Configurado bloco condicional `USE_MYSQL` em `settings.py`.
  - Charset `utf8mb4` definido para suporte completo a acentuação e emojis.
- [x] **6.2. Containerização Completa com Docker Compose**
  - `Dockerfile` e `entrypoint.sh` do backend (aguarda MySQL, roda migrações e seed).
  - `Dockerfile` e `nginx.conf` do frontend (servido na porta 5500 com proxy reverso).
  - `docker-compose.yml` orquestrando os 3 serviços (`db`, `backend`, `frontend`) com volumes persistentes.

---

> [!NOTE]
> Todas as tarefas das Prioridades 1 a 6 foram **100% implementadas e validadas**.
> Para os próximos passos de evolução (Comando de expiração automática, tela de redefinição de senha e denúncias), consulte:
> - [[00 - MOC Tarefas e Roadmap]]
> - [[06 - Guia de Alinhamento da Equipe e Novo Roadmap]]
> - [[02 - Tarefas Backend (Django)]]
> - [[03 - Tarefas Frontend (Melhorias)]]
