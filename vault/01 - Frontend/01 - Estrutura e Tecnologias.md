# 🌐 Frontend — Estrutura e Tecnologias
tags: #frontend #architecture #tailwind #vanillajs

## 1. Filosofia de Desenvolvimento

O frontend do Best Buddy (`best-buddy-frontend-tailwind/frontend`) foi desenvolvido com foco em:
1. **Simplicidade de Execução**: Não depende de Node.js, Webpack, Vite ou build complexo para ser servido. Arquivos HTML, JS e CSS estáticos prontos para uso.
2. **Deploy Sem Fricção**: Publicado diretamente no GitHub Pages via `.github/workflows/deploy.yml`. O CSS gerado (`css/tailwind.build.css`) é versionado.
3. **Desacoplamento Completo**: Implementação com padrão **Service Layer + Mock Layer**. O frontend não quebra se o backend estiver fora do ar.

---

## 2. Árvore de Diretórios

```
frontend/
├── index.html                     # Ponto de entrada (redireciona para home ou login)
├── package.json                   # Scripts de compilação do Tailwind CLI
├── tailwind.config.js             # Configuração de design tokens (cores, fontes, animações)
├── README.md                      # Instruções de execução local
├── .github/
│   └── workflows/
│       └── deploy.yml             # Workflow de deploy automático no GitHub Pages
├── assets/                        # Imagens estáticas e placeholders
├── css/
│   ├── src/
│   │   └── input.css              # Fonte Tailwind com @apply e classes de componentes
│   └── tailwind.build.css         # CSS final compilado e minificado
├── pages/
│   ├── auth/                      # login.html, register.html, forgot-password.html
│   ├── home/                      # index.html (Painel com notícias e posts)
│   ├── community/                 # index.html (Comunidade e animais desaparecidos)
│   ├── animals/                   # index.html (Catálogo) e detail.html (Detalhe do pet)
│   └── adoption/                  # create.html (Formulário de solicitação de adoção)
└── js/
    ├── config.js                  # Chave mestra: USE_MOCKS, API_BASE_URL, latência
    ├── api/
    │   └── client.js              # bbClient: Fetch wrapper com injeção de Bearer Token
    ├── utils/
    │   ├── storage.js             # bbStorage: Gerenciador de localStorage
    │   ├── auth-guard.js          # Porteiro: bloqueia acesso sem token
    │   └── validation.js          # bbValidation: Validador genérico de formulários
    ├── mocks/
    │   ├── mock-utils.js          # bbMockDelay e bbMockError para simular latência de rede
    │   └── mock-data.js           # Usuários, animais, posts e notícias mockados
    ├── services/
    │   ├── authService.js         # login, register, reset de senha, logout
    │   ├── animalService.js       # listagem, detalhe, criação de animais
    │   ├── adoptionService.js     # submissão de solicitação de adoção
    │   └── communityService.js    # notícias, posts e desaparecidos
    ├── components/
    │   ├── Navigation.js          # Header principal + avatar + saudação
    │   ├── AuthHeader.js          # Header minimalista para telas de login/cadastro
    │   ├── Footer.js              # Rodapé com informações de contato
    │   ├── AnimalCard.js          # Card da grade de adoção
    │   ├── PostCard.js            # Card de postagem da comunidade
    │   ├── MissingAnimalCard.js   # Card de pet desaparecido
    │   └── StateView.js           # Loading skeleton, estado vazio e mensagem de erro
    └── pages/
        ├── login.js               # Lógica da tela de login
        ├── register.js            # Lógica da tela de cadastro
        ├── forgot-password.js     # Lógica do fluxo de recuperação de senha
        ├── home.js                # Lógica da tela inicial (carrossel, notícias, posts)
        ├── community.js           # Lógica da tela de comunidade e reporte de desaparecidos
        ├── animals.js             # Lógica da listagem de pets
        ├── animal-detail.js       # Lógica da tela de detalhe do pet
        └── adoption.js            # Lógica do formulário de adoção
```

---

## 3. Como Rodar Localmente

Para rodar apenas o frontend estático:
```bash
cd C:\Users\T480\Documents\GitHub\Bestbuddy\best-buddy-frontend-tailwind\frontend
python -m http.server 5500
```
Acesse: `http://localhost:5500`

### Para compilar/modificar estilos Tailwind:
```bash
npm install
npm run watch:css    # Recompila automaticamente ao editar input.css ou tailwind.config.js
npm run build:css    # Build único minificado para commit
```

Veja também:
- [[02 - Fluxos de Telas e Páginas]]
- [[03 - Serviços e Camada de API]]
- [[04 - Mocks e Modo Desacoplado]]
