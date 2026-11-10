# 📊 Status — Matriz de Funcionalidades
tags: #status #funcionalidades #inventory #fullstack #integrado

Este documento é o inventário detalhado de todas as tarefas e funcionalidades do projeto Best Buddy, detalhando o que está funcionando no **Frontend (Mock)**, **Frontend (Real)**, **Backend Django** e no **Banco de Dados (SQLite e MySQL)**.

---

## 1. Tabela Geral de Funcionalidades

| Módulo / Funcionalidade          |  Front (Modo Mock)  |          Front (Modo Real)           |        Backend (Django REST)        |           Banco (SQLite / MySQL)            |
| :------------------------------- | :-----------------: | :----------------------------------: | :---------------------------------: | :-----------------------------------------: |
| Módulo / Funcionalidade          |  Front (Modo Mock)  |          Front (Modo Real)           |        Backend (Django REST)        |           Banco (SQLite / MySQL)            |
| :------------------------------- | :-----------------: | :----------------------------------: | :---------------------------------: | :-----------------------------------------: |
| **Login com Email e Senha**      |     🟢 Funciona     |  🟢 Funciona (`data.user` no header)  | 🟢 Funciona (`/api/token/` c/ user) |      🟢 Tabela `usuarios_usuario` ok        |
| **Renovação de Token (Refresh)** |     🟢 Mockado      |  🟢 Silent refresh c/ auto-retry 401  | 🟢 Funciona (`/api/token/refresh/`) |            🟢 Tokens stateless              |
| **Cadastro de Usuário (PF)**     |     🟢 Funciona     |         🟢 Rápido sem CPF            |      🟢 Registro simplificado       | 🟢 Tabela `usuarios_usuario` sem fricção    |
| **Recuperação de Senha (Token)** |     🟢 Funciona     |    🟢 Token assinado via email/API   |  🟢 Endpoints de recuperação prontos | 🟢 Validado via `test_endpoints.py`         |
| **Guarda de Rotas (AuthGuard)**  |     🟢 Funciona     |  🟢 Redireciona para Home com aviso   |        🟢 `IsAuthenticated`         |                    N/A                      |
| **Listagem Unificada de Animais**|  🟢 Vitrine ativa   |   🟢 Filtros de Adoção e Perdidos    | 🟢 `GET /api/animais/` (`AllowAny`) |     🟢 Tabela unificada `animais_animal`    |
| **Filtros Geográficos (IBGE)**   |     🟢 Funciona     |   🟢 27 UFs + Datalist de Cidades    | 🟢 Suporte a `?estado=` e `?cidade=`| 🟢 Campos `estado` e `cidade` no model      |
| **Detalhes do Animal**           |     🟢 Funciona     |        🟢 Ficha completa c/ ID       | 🟢 `GET /api/animais/{id}/`         |       🟢 Com `castrado`, `descricao` e `imagem` |
| **Cadastro de Animal (POST)**    |     🟢 Funciona     |   🟢 Modal Popup c/ Upload e validação | 🟢 Multipart, cota máx 5 e Pillow | 🟢 Persistência unificada com `imagem` real |
| **Contato Direto via WhatsApp**  |     🟢 Funciona     |  🟢 Link direto sem burocracia       | 🟢 `telefone_contato` obrigatório   | 🟢 Campo no model e fallback do tutor       |
| **Gestão do Pet pelo Tutor**     |     🟢 Funciona     |   🟢 Concluir status e Excluir pet   | 🟢 PATCH status e DELETE tutor-only | 🟢 Proteção contra exclusão por terceiros   |
| **Carrossel da Home**            |     🟢 Funciona     |        🟢 Funciona (Estático)        |                 N/A                 |                    N/A                      |
| **Mural de Notícias**            |  ❌ Descontinuado   |          ❌ Descontinuado            |   ❌ Abandonado (HTTP 404)          |       ❌ Tabela descontinuada               |
| **Feed de Posts da Comunidade**  |  ❌ Descontinuado   |          ❌ Descontinuado            |   ❌ Abandonado (HTTP 404)          |       ❌ Tabela descontinuada               |
| **Mural de Desaparecidos**       |     🟢 Funciona     | 🟢 Unificado em `animals/index.html` | 🟢 `GET /api/animais/?tipo=PERDIDO` | 🟢 Tabela unificada `animais_animal`        |
| **Reportar Desaparecido**        |     🟢 Funciona     |   🟢 Modal unificado no frontend     |   🟢 POST em `/api/animais/`        |  🟢 Registro persistido no banco            |
| **Logout**                       |  🟢 Limpa storage   |     🟢 Limpa storage e vai p/ Home   |           N/A (Stateless)           |                    N/A                      |

---

## 2. O que Está 100% Pronto no Frontend

1. **Design System & Responsividade**:
   - Layout responsivo para Desktop, Tablet e Mobile.
   - Skeletons de loading em todas as vitrines de dados.
   - Microanimações e feedback visual consistente.
   - **Modal Popups Responsivos (`.bb-modal`)**: Formulários de anúncio de pet (adoção e perdido) abrem diretamente centralizados na tela, com botão "X" de fechamento, rolagem interna e sem overflow em telas mobile.
   - **Badges de Status em Alto Contraste (`.bb-status-badge`)**: Tags com gradientes distintos (vermelho de alerta para *Desaparecido*, azul para *Adoção*, verde para *Adotado*, etc.), tipografia em negrito encorpado (`font-weight: 800`) e sombra/borda translúcida, legíveis sobre qualquer foto.
2. **Upload de Imagem & Preview**:
   - Campo de foto com upload direto de arquivos via `<input type="file">` e thumbnail de visualização imediata antes do envio.
   - Validação client-side e server-side estrita: apenas JPEG/PNG e tamanho limite de 5 MB.
3. **Modelagem de Ficha do Pet ("Castrado")**:
   - Substituição do antigo campo "Vacinação" por "Castrado" (Sim, Não, Em andamento), permitindo detalhamento de vacinas no texto livre da descrição.
4. **Autenticação Resiliente & Silent Refresh**:
   - Decodificação e inspeção proativa de expiração de JWT no client (`isTokenExpired`).
   - Renovação transparente no backend sem deslogar o usuário em uso ativo (`refreshAccessToken` com trava de concorrência).
   - Encerramento suave de sessão (redirecionamento à Home com aviso amigável em rotas restritas e atualização reativa da navbar sem quebrar navegação em rotas públicas).
5. **Integração com IBGE (`ibgeService.js`)**:
   - Lista estática síncrona das 27 UFs brasileiras.
   - Municípios carregados sob demanda em `<datalist>` com cache de 2 níveis (RAM + `sessionStorage`).
6. **Formulários e Validação Estrita**:
   - Validação client-side para o `telefone_contato` com DDD obrigatório. Se inválido, emite o popup `alert("É necessário um número de contato para cadastrar o animal.");` e interrompe o fluxo antes de chamar a rota.
   - Máscara automática de telefone brasileiro `(XX) XXXXX-XXXX`.
7. **Navegação Limpa**:
   - Menu sem opções órfãs (apenas *Home*, *Animais* e *Meu Perfil*).
   - Redirecionamento transparente da antiga rota de comunidade para a vitrine de animais perdidos.

---

## 3. O que Está Pronto no Backend

1. **Estrutura Base e Segurança**:
   - Django 6 e Django REST Framework com SimpleJWT.
   - Corsheaders configurado e permissões públicas refinadas (`AllowAny` para visualização, `IsAuthenticated` para anúncios).
2. **Autenticação, Perfil e WhatsApp**:
   - Registro rápido sem CPF.
   - Validação de WhatsApp via Twilio (`/api/usuarios/whatsapp/enviar/` e `/verificar/`).
   - Fluxo completo de recuperação de senha por token assinado (`/recuperar-senha/` e `/redefinir-senha/`).
3. **Tabela Unificada de Animais (`animais_animal`)**:
   - Discriminador `tipo_servico` (`ADOCAO` vs `PERDIDO`).
   - `estado` (Enum 27 UFs) e `cidade` do IBGE.
   - `telefone_contato` como campo obrigatório com fallback do tutor.
   - Cota de no máximo 5 anúncios ativos para usuários comuns (PF).
   - Exclusão e alteração de status restritas ao tutor criador.
4. **Módulo de Comunidade e Notícias**:
   - Descontinuado e removido das rotas (`config/urls.py`) e do `settings.py`, retornando HTTP 404.
5. **Automação & Containerização**:
   - Dockerfile e docker-compose orquestrando Django, MySQL 8.0 e Nginx com migrações e seed automático na inicialização.
   - Suíte de testes `test_endpoints.py` validando 9/9 endpoints com sucesso.

---

## 4. Estado Atual dos Bloqueios (Superados)

Todos os bloqueios arquiteturais anteriores foram resolvidos:
1. ✅ A tabela física foi corrigida para `animais_animal`.
2. ✅ O modelo `Adocao` foi reestruturado para vincular o adotante e o pet via chave estrangeira.
3. ✅ O app `comunidade` foi criado e integrado com suas migrations aplicadas.
4. ✅ O serializer de login agora preenche o objeto `user` no frontend.

Consulte os detalhes técnicos em:
- [[02 - Diagnóstico dos Bugs Atuais]]
- [[01 - Checklist de Correções Imediatas]]
- [[05 - Configuração e Uso do Docker]]
