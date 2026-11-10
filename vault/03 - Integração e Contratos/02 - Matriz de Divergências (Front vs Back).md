# ⚖️ Integração — Matriz de Divergências (Frontend vs Backend)
tags: #integracao #divergencias #gap-analysis #bugs #drf #vanillajs #resolvido

Este documento detalha o histórico de inconsistências encontradas entre o frontend e o backend Django, bem como o **status de resolução** aplicado em cada item.

---

## 1. Tabela Comparativa de Divergências e Resolução

| Área / Recurso | O que o Frontend Envia / Espera | Situação Anterior | Status Atual / Ação Realizada |
| :--- | :--- | :--- | :--- |
| **Banco de Dados (Animais)** | Espera carregar a lista de pets (`GET /api/animais/`) | `sqlite3.OperationalError: no such table: animais_animal` | 🟢 **Resolvido**: Tabela renomeada para `animais_animal` no SQLite e migrations unificadas. |
| **Campos de Animais (`id`)** | Exige `animal.id` para links de detalhe e solicitação de adoção | `AnimaisSerializer` omitia o campo `id` | 🟢 **Resolvido**: Adicionado `'id'` e `'created_at'` no `AnimaisSerializer`. |
| **Campos de Animais (`descricao`)** | Exibe na tela de detalhe (`animal-detail.html`) | Campo não existia no model `Animal` | 🟢 **Resolvido**: Campo `descricao = models.TextField(blank=True, null=True)` adicionado e migrado. |
| **Campos de Animais (`imagem`)** | Renderiza foto ou placeholder | Campo não existia no model `Animal` | 🟢 **Resolvido**: Campo `imagem = models.CharField(max_length=500, blank=True, null=True)` adicionado (suporta URLs diretas). |
| **Permissão de Animais** | Usuário deslogado pode navegar na lista de animais para adoção | `AnimaisViewSet` exigia `IsAuthenticated` para `GET` | 🟢 **Resolvido**: Permissão configurada com `AllowAny` para leitura (`GET`) e autenticado para escrita (`POST`). |
| **Adoção (Model)** | Envia `animal_id`, dados do adotante e questionário de aptidão | `Adocao` duplicava dados do animal e não tinha FK nem adotante | 🟢 **Resolvido**: Model refatorado com `ForeignKey('animais.Animal')`, `ForeignKey('usuarios.Usuario')` e campos do questionário. |
| **Adoção (Serializer)** | Envia `{ animal_id, nome_adotante, motivacao, ... }` | Serializer esperava dados duplicados do animal | 🟢 **Resolvido**: `AdocoesSerializer` atualizado com `PrimaryKeyRelatedField` apontando para `animal`. |
| **Cadastro de Usuário (CPF)** | Frontend valida e envia `"cpf"` no registro (`register.js`) | `PessoaFisica` não possuía `cpf` | 🟢 **Resolvido**: Campo `cpf` reincluído em `PessoaFisica` e integrado no `RegisterUsuarioSerializer`. |
| **Login e Sessão (`user`)** | Navbar espera dados do usuário logado (`nome`, `iniciais`) | `/api/token/` devolvia apenas `{ "access", "refresh" }` | 🟢 **Resolvido**: Criado `CustomTokenObtainPairSerializer` retornando `{ access, refresh, user: { id, email, nome, tipo } }`. |
| **Comunidade (Notícias)** | Home chama `GET /api/comunidade/noticias/` | App `comunidade` inexistente (404) | 🟢 **Resolvido**: App `comunidade` criado com model `Noticia` e endpoint `GET /api/comunidade/noticias/` ativo. |
| **Comunidade (Posts)** | Home e Comunidade chamam `GET /api/comunidade/posts/` | App `comunidade` inexistente (404) | 🟢 **Resolvido**: Model `Post` criado com endpoints `GET` e `POST` em `/api/comunidade/posts/`. |
| **Animais Desaparecidos** | Comunidade chama `GET/POST /api/comunidade/desaparecidos/` | App `comunidade` inexistente (404) | 🟢 **Resolvido**: Model `AnimalDesaparecido` criado com endpoints `GET` e `POST` em `/api/comunidade/desaparecidos/`. |
| **CORS Settings** | Frontend roda em `http://localhost:5500` | Middlewares duplicados no `settings.py` | 🟢 **Resolvido**: Limpeza das duplicatas mantendo `CorsMiddleware` no topo de `MIDDLEWARE`. |
| **Upload / Links de Mídia** | Fotos de animais e posts | `MEDIA_URL` e `MEDIA_ROOT` não configurados | 🟢 **Resolvido**: Diretório e URLs de mídia estática configurados em `settings.py` e `urls.py`. |
| **Recuperação de Senha (PIN)** | Telas chamam `/password-reset/` e `/password-reset/confirm/` | Endpoints não implementados | 🟡 **Futuro / Opcional**: Frontend possui fallback visual; backend pronto para receber serviço de email SMTP. |

---

## 2. Status Atual da Conexão com API Real (`USE_MOCKS: false`)

Com as correções aplicadas e validadas:
1. **Login**: 🟢 Retorna JWT e o payload `user`. O `authService` salva a sessão e a Navbar renderiza as saudações e o avatar com as iniciais do usuário.
2. **Cadastro**: 🟢 Cria a conta gravando nome, email, senha e CPF/CNPJ.
3. **Home**: 🟢 Carrega carrossel, notícias da ONG e feed de posts da comunidade direto do banco.
4. **Animais**: 🟢 Lista os animais com fotos, badges e links de detalhe corretos (`detail.html?id=1`). Leitura pública liberada para visitantes.
5. **Adoção**: 🟢 Submissão processada com sucesso (`HTTP 201 Created`), gravando a intenção de adoção com chave estrangeira para o animal.
6. **Comunidade**: 🟢 Mural de desaparecidos e feed interativo totalmente integrados e funcionais.

Veja os guias relacionados:
- [[01 - Checklist de Correções Imediatas]]
- [[04 - Guia de Execução e Testes]]
- [[05 - Configuração e Uso do Docker]]
