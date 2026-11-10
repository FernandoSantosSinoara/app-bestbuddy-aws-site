# 🧪 Roadmap — Guia de Execução e Testes Integrados
tags: #testing #execucao #guia #powershell #dev #e2e #test-endpoints

Este guia fornece o passo a passo prático para inicializar ambos os ambientes localmente e executar a suíte completa de testes automatizados e manuais do **Best Buddy**.

---

## ⚡ Inicialização Rápida em 1 Clique (Sem Docker)

Caso não possua o Docker instalado ou não queira gerenciar containers, utilize os scripts automatizados na raiz do repositório:

- **Para subir tudo (MySQL/SQLite, Backend e Frontend):**
  Dê um duplo clique ou execute no terminal:
  ```cmd
  start.bat
  ```
  *O script detecta o Python, ativa o ambiente virtual `venv`, verifica o serviço `MySQL80` (com fallback seguro para SQLite), executa as migrações, popula o banco e abre as janelas do Backend (`:8000`), Frontend (`:5500`) e seu navegador automaticamente.*

- **Para parar todos os serviços e liberar as portas:**
  ```cmd
  stop.bat
  ```

---

## 1. Como Iniciar o Backend Django (Modo Manual)

Abra um terminal (PowerShell) no diretório raiz do backend (`Best_Buddy`):

```powershell
# 1. Ativar o ambiente virtual Python (se configurado) ou usar o Python global
# .\venv\Scripts\Activate.ps1

# 2. Executar as migrações do banco de dados
python manage.py migrate

# 3. Popular o banco com dados de teste (se for a primeira execução)
python seed_data.py

# 4. Iniciar o servidor de desenvolvimento na porta 8000
python manage.py runserver 127.0.0.1:8000
```

> [!NOTE]
> - O Django responderá em: `http://127.0.0.1:8000/`
> - API de Animais em: `http://127.0.0.1:8000/api/animais/`
> - Painel Administrativo em: `http://127.0.0.1:8000/admin/`

---

## 2. Como Iniciar o Frontend

Abra um segundo terminal no diretório do frontend (`Best_Buddy/frontend`):

```powershell
# Iniciar servidor estático local na porta 5500
python -m http.server 5500
```

> [!TIP]
> A porta 5500 é permitida nas regras de CORS do backend (`config/settings.py`). Acesse pelo navegador em: `http://localhost:5500`.

---

## 3. Roteiro de Testes Ponta a Ponta (E2E Manual)

### Teste 1: Experiência do Visitante (Acesso Público Sem Login)
1. Abra `http://localhost:5500` em uma janela anônima (sem sessão salva).
2. Verifique que a página inicial abre **sem redirecionar para login**:
   - Navbar exibe botões *"Entrar"* e *"Cadastre-se"*.
   - Carrossel no topo e faixa animada de logo funcionando suavemente.
   - Seção de vitrine de pets carregando cards reais ou do mock.
3. Clique em *"Animais"* na navbar:
   - A página de animais abre normalmente.
   - Seção 1 exibe **Animais Perdidos & Desaparecidos**.
   - Seção 2 exibe **Animais Prontos para Adoção**.
   - Filtros por Estado (27 UFs) e Cidades do IBGE preenchem dinamicamente.
4. Clique em um card de pet para abrir a ficha de detalhes (`detail.html?id=...`).
5. Clique no botão verde *"Conversar via WhatsApp"*:
   - Deve disparar a abertura do WhatsApp com mensagem pré-formatada.

---

### Teste 2: Autenticação, Perfil e Verificação de WhatsApp
1. Clique em *"Cadastre-se"* (`/pages/auth/register.html`):
   - Preencha nome, email, telefone e senha (sem necessidade de CPF).
   - O sistema valida a unicidade do telefone em tempo real.
   - Cadastro realizado com sucesso e redirecionamento para o perfil ou home.
2. Acesse *"Meu Perfil"* (`/pages/auth/profile.html`):
   - Teste a alteração de nome e telefone.
   - Teste o envio de código WhatsApp Twilio (em modo dev, utilize o código `123456`).
   - Após verificação, o selo verde *"WhatsApp Validado"* é exibido.

---

### Teste 3: Anunciar Pet e Compressão de Imagens
1. Na página de animais, clique em `+ Anunciar Pet para Adoção`:
   - Se o usuário não tiver WhatsApp validado, o sistema avisa e orienta a validação prévia.
   - Com o WhatsApp validado, o modal abre.
   - Selecione uma foto pesada da sua câmera (5 MB a 25 MB).
   - O utilitário `image-compressor.js` processa o arquivo na memória RAM em ~150ms:
     > Preview exibe: `Foto otimizada: ~140 KB (-98%) • original: 8.5 MB`
   - Selecione o Estado (ex: SP) e digite a Cidade no `<datalist>`.
   - Submeta o formulário: o pet surge na vitrine e na aba *"👤 Meus Anúncios"*.

---

### Teste 4: Gestão do Anúncio pelo Tutor
1. Na página de animais, clique na aba *"👤 Meus Anúncios"*:
   - Apenas os pets cadastrados pelo seu usuário são listados.
   - Clique em *"Marcar como Adotado"*: o card atualiza o status.
   - Clique em *"Excluir Anúncio"*: o pet é removido da plataforma.

---

## 4. Bateria Completa de Testes Automatizados (14/14 Endpoints)

No diretório raiz `Best_Buddy`, execute a suíte de testes automatizados:

```powershell
python test_endpoints.py
```

### O que este script valida com precisão:

| # | Endpoint / Funcionalidade | Condição de Sucesso |
| :-: | :--- | :--- |
| **0** | `POST /api/usuarios/register/` | Criação de PF sem CPF obrigatório (HTTP 201) e retorno de token JWT |
| **0.1** | `POST /api/usuarios/register/` (Duplicado) | Bloqueio de telefone duplicado com HTTP 400 |
| **0.2** | `GET /api/usuarios/verificar-telefone/` | Retorna `disponivel: true/false` corretamente para o cliente |
| **1** | `POST /api/token/` | Login JWT retornando payload completo (`id`, `email`, `telefone`, `telefone_validado`) |
| **2** | `GET /api/usuarios/perfil/` | Leitura autenticada com ID e status de validação de contato |
| **3** | `POST /api/usuarios/whatsapp/...` | Envio e validação de código Twilio com fallback dev (`123456`) |
| **4** | `POST /api/usuarios/alterar-senha/` | Rejeição de senha atual incorreta e sucesso com a senha correta |
| **5** | `POST /api/usuarios/alterar-email/` | Geração de token criptografado e confirmação via `/confirmar-email/` |
| **6** | `GET /api/animais/` | Listagem da tabela unificada com filtros `?tipo_servico=ADOCAO` e `PERDIDO` |
| **7** | `POST /api/animais/` | Criação de anúncio com herança automática do telefone validado do tutor |
| **8** | Enforcement de Cota Anti-Spam | Bloqueio com HTTP 400 ao tentar cadastrar mais de 5 pets ativos simultâneos |
| **9** | Bloqueio Sem WhatsApp Validado | Bloqueio com HTTP 400 ao tentar anunciar sem validação prévia de contato |
| **10**| Descontinuação de Notícias | Rota legada `/api/comunidade/noticias/` retorna HTTP 404 (segurança) |
| **11**| Descontinuação de Posts | Rota legada `/api/comunidade/posts/` retorna HTTP 404 (segurança) |
| **12**| Descontinuação de Adoções Burocráticas | Rota legada `/api/adocoes/` retorna HTTP 404 em prol do WhatsApp direto |
| **13**| Recuperação e Redefinição de Senha | Geração de token criptográfico assinado e redefinição com nova senha |
| **14**| Gerenciamento pelo Tutor | Tutor altera status (`PATCH`) e exclui (`DELETE`); terceiros recebem HTTP 403 |

**Resultado esperado:**
```text
=== TODOS OS TESTES PASSARAM COM SUCESSO! ===
Exit Code: 0
```

---

## 5. Como Executar com Docker Compose

Para rodar todo o ecossistema (Backend Django, Banco MySQL 8.0 e Frontend Nginx) com orquestração automática:

```powershell
docker compose up --build
```

O container do backend executa automaticamente:
1. Aguarda o MySQL estar pronto na porta 3306.
2. Executa `python manage.py migrate --noinput`.
3. Popula a base com `python seed_data.py`.
4. Sobe o Django na porta 8000 e o Nginx na porta 5500.

Veja o guia detalhado em:
- [[05 - Configuração e Uso do Docker]]
- [[00 - MOC Tarefas e Roadmap]]
