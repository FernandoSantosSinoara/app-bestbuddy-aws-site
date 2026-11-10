# 🎨 Frontend — Design System e Tailwind CSS
tags: #frontend #design #tailwind #css #ui

## 1. Padrão de Estilos e Tokens

O projeto utiliza **Tailwind CSS v3**, integrando os tokens visuais em `tailwind.config.js` e compondo as classes semânticas `bb-*` via `@apply` no arquivo `css/src/input.css`.

Isso traz duas grandes vantagens:
1. **Nenhum nome de classe quebrou**: Os arquivos HTML continuam utilizando classes limpas como `.bb-card`, `.bb-btn`, `.bb-input`.
2. **Design Tokens Centralizados**: Cores, sombras e tipografia podem ser alterados em um só lugar.

---

## 2. Paleta de Cores (Tokens)

### Brand (Identidade Best Buddy - Verde Pet)
- `brand-50` até `brand-900`: Escala de verde natural.
- `brand-500`: `#10B981` (Verde Principal para botões primários, ícones e destaques).
- `brand-600`: `#059669` (Estado de hover).

### Surface (Fundos e Containers)
- Fundo escuro/neutro elegante:
  - `surface-900`: `#0F172A` (Fundo principal da página).
  - `surface-800`: `#1E293B` (Fundo dos cards e formulários).
  - `surface-700`: `#334155` (Superfície elevada, bordas e tags).

### Ink (Tipografia e Contrastes)
- `ink-100`: `#F8FAFC` (Títulos e textos de alto contraste).
- `ink-300`: `#CBD5E1` (Textos secundários e descrições).
- `ink-500`: `#64748B` (Placeholders, metadados e legendas).

---

## 3. Tipografia
- **Display (Títulos e Logotipo)**: `Sora`, sans-serif (pesos 600 e 700).
- **Body (Textos e Formulários)**: `Inter`, sans-serif (pesos 400 e 500).
- Importadas diretamente via Google Fonts no `input.css`.

---

## 4. Classes de Componentes (`bb-*`)

| Classe | Função |
| :--- | :--- |
| `.bb-btn` | Botão base com transição suave e foco visível. |
| `.bb-btn--primary` | Botão verde com hover elevado. |
| `.bb-btn--secondary`| Botão neutro com borda para ações secundárias (ex.: Sair). |
| `.bb-card` | Container com borda sutil, cantos arredondados (`rounded-xl`) e fundo `surface-800`. |
| `.bb-input` | Campo de formulário com estados de foco (`brand-500`) e erro (`border-red-500`). |
| `.bb-alert` | Banners de notificação (`--success` verde, `--error` vermelho). |
| `.bb-animal-card__image` | Container da imagem do pet com aspect-ratio 1:1 e suporte a placeholder. |
| `.bb-skeleton` | Efeito shimmer animado para placeholders de carregamento. |
| `.bb-stagger` | Animação escalonada em cascata para listas de cards. |
| `.bb-modal` / `.bb-modal-dialog` | Modal popup centralizado com backdrop escuro blur, botão X, scroll interno e layout responsivo mobile. |
| `.bb-status-badge` | Tag em pílula de alto contraste sobreposta à foto do pet (`font-weight: 800`, text-shadow e borda translúcida). |
| `.bb-status-badge--perdido` | Variante de alerta com gradiente vermelho (`#ef4444` -> `#dc2626`) para animais desaparecidos. |
| `.bb-status-badge--adocao` | Variante azul com gradiente para animais disponíveis para adoção. |
| `.bb-status-badge--adotado` | Variante verde com gradiente para anúncio de adoção concluída. |
| `.bb-status-badge--encontrado` | Variante ciano com gradiente para pet perdido recuperado. |

---

## 5. Acessibilidade e Movimento Reduzido

No `css/src/input.css`, há tratamento explícito para acessibilidade:
```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```
Isso garante que usuários sensíveis a animações no sistema operacional não sofram tontura ou desconforto visual.

Veja também:
- [[01 - Estrutura e Tecnologias]]
- [[02 - Fluxos de Telas e Páginas]]
