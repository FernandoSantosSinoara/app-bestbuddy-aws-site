# 🐾 Best Buddy — Front-end (Tailwind CSS + Vanilla JS)

Interface web moderna, leve e responsiva para a plataforma **Best Buddy**, desenvolvida com **HTML5 semântico**, **Vanilla JavaScript (ES6+)** e **Tailwind CSS v3**.

Projetada com arquitetura desacoplada: possui uma **camada de Mocks** que permite testar e navegar por 100% das telas sem backend, e pode ser conectada à **API Django real** alterando uma única chave de configuração.

---

## 🚀 Funcionalidades

- **Autenticação & Sessão**:
  - Telas de **Login**, **Cadastro** (com validação de CPF) e **Recuperação de Senha em 2 etapas** (PIN + nova senha).
  - Guarda de rotas (`auth-guard.js`) que protege páginas privadas e redireciona para login com parâmetro `?next=`.
  - Persistência segura de tokens e dados do usuário via `localStorage` centralizado (`storage.js`).
  - Cabeçalho dinâmico que exibe o primeiro nome do usuário autenticado e avatar com iniciais.
- **Painel Inicial (Home)**:
  - Carrossel de destaques institucional no topo.
  - Mural de notícias e comunicados da ONG com tratamento de loading/erro.
  - Feed de postagens da comunidade.
- **Catálogo de Animais & Desaparecidos**:
  - Grade de pets disponíveis para adoção e mural de animais desaparecidos com filtros de localização (IBGE).
  - Badges de status em alto contraste (`.bb-status-badge`) com tipografia encorpada (`font-weight: 800`) e gradientes temáticos (vermelho de alerta para *Desaparecido*, azul para *Adoção*), legíveis sobre qualquer foto.
  - Skeletons animados (`.bb-skeleton`) para transições suaves de carregamento.
  - Ficha técnica completa do pet (`detail.html?id=<id>`) com detalhes de saúde, castração e botão de contato direto via WhatsApp.
- **Formulário de Anúncio em Modal Popup**:
  - Abertura imediata na tela do usuário como Popup responsivo (`.bb-modal`) com backdrop e botão "X" de fechar.
  - Totalmente adaptado para dispositivos móveis, sem rolagem horizontal.
  - **Upload Inteligente e Otimização de Imagens (Canvas API & WebP)**: Seleção de arquivos de até **50 MB** com redução automática no navegador para formato **WebP (~150 KB)** via HTML5 Canvas em memória. Elimina consumo excessivo de dados móveis (economia de até 98% de banda), exibe preview em tempo real com indicador de economia e descarta metadados EXIF/GPS para total conformidade com a LGPD e privacidade do usuário.
  - Informações do pet com status de **Castrado** (Sim, Não, Em andamento) e contato com máscara automática.
- **Design System Responsivo**:
  - Estilizado com Tailwind CSS via classes semânticas `bb-*` compostas por `@apply`.
  - Microanimações fluidas e suporte nativo a `prefers-reduced-motion` para acessibilidade.

---

## 🐳 Como Rodar COM Docker (Recomendado)

Você pode executar o frontend junto com todo o ecossistema (Backend Django + Banco MySQL 8.0) com um único comando.

### Execução com todo o ecossistema (Backend + MySQL + Frontend):
Na pasta raiz do projeto (`Bestbuddy` ou `Best_Buddy`):
```powershell
docker compose up --build
```
- Acesse o frontend em: **`http://localhost:5500`**
- As chamadas para `/api/` e `/media/` são direcionadas automaticamente pelo Nginx para o backend Django!

### Execução isolada do container Frontend:
Caso queira subir apenas o container do frontend com Nginx:
```powershell
cd frontend
docker build -t bestbuddy-front .
docker run -p 5500:80 bestbuddy-front
```
Acesse: `http://localhost:5500`

---

## 💻 Como Rodar SEM Docker (Servidor Estático Local)

Como o CSS compilado (`css/tailwind.build.css`) já vem versionado no repositório, **não é necessário rodar Node.js** para visualizar ou usar o site.

Basta servir a pasta como arquivos estáticos:

```powershell
cd frontend

# Usando o servidor HTTP do Python:
python -m http.server 5500
```

Abra no navegador: **`http://localhost:5500`**

---

## 🔄 Alternando entre Modo Mock e API Real

O controle é feito exclusivamente no arquivo [`js/config.js`](./js/config.js):

```javascript
window.BB_CONFIG = {
  USE_MOCKS: false,                        // true = dados fake; false = chama a API Django real
  API_BASE_URL: "http://127.0.0.1:8000/api", // Endereço da API Django
  MOCK_LATENCY_MS: 0,                      // Latência artificial (ms) para simular carregamento no modo mock
};
```

- **`USE_MOCKS: true` (Modo Mock)**:
  - Funciona totalmente offline / sem backend.
  - Credenciais de teste: `usuario@bestbuddy.com` / `123456`.
  - 6 animais, posts e notícias simulados em memória.
- **`USE_MOCKS: false` (Modo API Real)**:
  - Faz chamadas HTTP reais via `fetch` para o backend Django com tokens JWT no header `Authorization: Bearer <token>`.

---

## 🎨 Editando Estilos (Tailwind CSS)

Caso queira alterar classes, tokens ou criar novos estilos:

```powershell
# 1. Instalar dependências do Tailwind CLI (uma única vez):
npm install

# 2. Recompilar automaticamente enquanto edita:
npm run watch:css

# 3. Compilar versão final minificada:
npm run build:css
```

- **Arquivo fonte editável**: `css/src/input.css` (onde as classes `bb-*` são compostas via `@apply`).
- **Configuração de tokens**: `tailwind.config.js` (paleta de cores, fontes, sombras e animações).
- **Arquivo gerado**: `css/tailwind.build.css` (nunca editar manualmente).

---

## 📁 Estrutura de Diretórios

```
frontend/
├── index.html                 # Ponto de entrada (redireciona para home ou login)
├── Dockerfile                 # Container Nginx para servir arquivos estáticos
├── nginx.conf                 # Configuração do Nginx com proxy para API
├── tailwind.config.js         # Tokens visuais (cores brand/surface/ink, fontes, animações)
├── package.json               # Scripts build:css e watch:css
├── API_CONTRACT.md            # Especificação dos endpoints esperados da API
├── ARCHITECTURE.md            # Guia de arquitetura arquivo por arquivo
├── pages/
│   ├── auth/                  # login.html, register.html, forgot-password.html
│   ├── home/                  # index.html (Carrossel, notícias, posts)
│   ├── community/             # index.html (Posts e desaparecidos)
│   ├── animals/               # index.html (Catálogo) e detail.html (Ficha do pet)
│   └── adoption/              # create.html (Formulário de solicitação de adoção)
├── js/
│   ├── config.js              # Chave mestra: USE_MOCKS e API_BASE_URL
│   ├── api/client.js          # bbClient: Cliente fetch com injeção de JWT
│   ├── mocks/                 # mock-data.js e mock-utils.js
│   ├── services/              # authService, animalService, adoptionService, communityService
│   ├── components/            # Navigation, Footer, AnimalCard, PostCard, StateView
│   ├── pages/                 # Lógica específica de cada tela HTML
│   └── utils/                 # storage.js, validation.js, auth-guard.js
├── css/
│   ├── src/input.css          # Fonte Tailwind com @apply e classes bb-*
│   └── tailwind.build.css     # CSS gerado e minificado carregado pelas páginas
└── .github/workflows/deploy.yml # Pipeline de CI/CD para o GitHub Pages
```

---

## 🌐 Deploy no GitHub Pages

O projeto publica automaticamente o site estático a cada `push` na branch `main` através do GitHub Actions configurado em `.github/workflows/deploy.yml`.

Como o CSS compilado já é commitado no repositório, o deploy é 100% estático e instantâneo.
