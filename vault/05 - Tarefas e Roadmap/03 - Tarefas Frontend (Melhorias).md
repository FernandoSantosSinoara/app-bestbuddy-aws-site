# 💻 Roadmap — Tarefas e Melhorias do Frontend
tags: #frontend #melhorias #ux #ui #tarefas #concluido #pendencias

Este documento registra as melhorias de interface, experiência do usuário (UX) e integrações do **Frontend do Best Buddy**, detalhando o que já foi **concluído com sucesso** e estruturando o **backlog de tarefas pendentes**.

---

## ✅ 1. Melhorias Já Concluídas e Validadas

Todas as 5 melhorias técnicas prioritárias levantadas inicialmente foram **completamente construídas e homologadas no frontend**:

### 1.1 Captura e Armazenamento do Usuário no Login (`authService.js`)
- **Status:** [x] Concluído
- **O que foi feito:** 
  - O método `login()` recebe `data.user` retornado pelo token JWT e o persiste via `bbStorage.saveSession()`.
  - O componente `Navigation.js` consome o usuário do storage e exibe:
    - Saudação personalizada (*"Olá, Nome"*).
    - Avatar com foto ou inicial do nome.
    - Botão de "Sair" com limpeza limpa de sessão e redirecionamento.
    - Botões "Entrar" e "Cadastre-se" quando o visitante estiver deslogado.

---

### 1.2 Substituição de `prompt()` por Modais Modernos com Tailwind
- **Status:** [x] Concluído
- **O que foi feito:**
  - As caixas nativas e intrusivas `prompt()` do navegador foram **completamente eliminadas**.
  - Criado o modal moderno com Tailwind para **"🚨 Reportar Pet Perdido"** diretamente em `pages/animals/index.html`.
  - Formulário completo com validação de campos obrigatórios, seleção de Estado e Cidade via IBGE e pré-carregamento do WhatsApp do tutor.

---

### 1.3 Pré-preenchimento e Desburocratização da Adoção
- **Status:** [x] Concluído
- **O que foi feito:**
  - O antigo formulário de 5 etapas foi substituído pela conexão direta via **WhatsApp**.
  - O botão *"Quero Adotar"* abre imediatamente uma conversa com o tutor via link `https://wa.me/55...` com mensagem pré-formatada informando o pet de interesse.
  - Elimina abandono de formulário e acelera a adoção responsável.

---

### 1.4 Modais para Anunciar Adoção e Reportar Desaparecimento
- **Status:** [x] Concluído
- **O que foi feito:**
  - Construídos os dois botões de ação no topo da página de animais:
    - `+ Anunciar Pet para Adoção`
    - `+ Reportar Pet Perdido`
  - Ambos os modais contam com integração à API de Localidades do IBGE (`ibgeService.js`) com cache e preenchimento inteligente de telefone.
  - Exibição de preview com estatística em tempo real da compressão de imagem (ex: *-98% economizado*).

---

### 1.5 Exibição de Fotos com Tratamento Inteligente e Fallbacks
- **Status:** [x] Concluído
- **O que foi feito:**
  - `AnimalCard.js` e `animal-detail.js` tratam tanto URLs absolutas da API Django quanto imagens relativas (`/media/...`) e links externos de seed.
  - Placeholder visual elegante e harmonioso com as cores do Best Buddy caso o pet não possua foto cadastrada.

---

### 1.6 Compressão de Fotos no Navegador (Canvas API Nativa)
- **Status:** [x] Concluído
- **O que foi feito:**
  - Módulo `frontend/js/utils/image-compressor.js` implementado.
  - Aceita fotos de celular de até 50 MB, redimensiona proporcionalmente para no máximo 1080px e exporta como WebP (qualidade 85%).
  - Purgamento automático de metadados sensíveis EXIF/GPS antes do tráfego de rede (Conformidade com LGPD).

---

### 1.7 Aba "👤 Meus Anúncios" e Gestão de Pets pelo Tutor
- **Status:** [x] Concluído
- **O que foi feito:**
  - Aba comutável na página de animais: **"🐾 Todos os Pets"** vs **"👤 Meus Anúncios"**.
  - Permite ao tutor visualizar todos os seus anúncios ativos, alterar status para `ADOTADO` ou `ENCONTRADO` e excluir o pet da plataforma com confirmação.

---

## ⏳ 2. Tarefas e Melhorias Pendentes no Frontend (Roadmap Ativo)

As tarefas a seguir compõem o próximo ciclo de desenvolvimento do frontend:

### 📌 Tarefa F1: Tela de Redefinição de Senha (`reset-password.html` e `reset-password.js`)
* **Contexto:** O backend já possui o endpoint funcional `POST /api/usuarios/redefinir-senha/` que valida o token criptografado e atualiza a senha. A tela `forgot-password.html` já envia o pedido, mas ainda falta a tela de aterrissagem do link.
* **Arquivo a criar:** `frontend/pages/auth/reset-password.html` e `frontend/js/pages/reset-password.js`
* **Especificação da tela:**
  1. Capturar o parâmetro `?token=...` da URL via `URLSearchParams`.
  2. Se o token não existir na URL, exibir estado de erro com botão para voltar ao login.
  3. Formulário com 2 campos:
     - `Nova Senha` (mínimo 6 caracteres).
     - `Confirmar Nova Senha` (validação de igualdade em tempo real).
  4. Botão *"Salvar Nova Senha"* com indicador de loading.
  5. Ao concluir com sucesso, exibir alerta de confirmação e redirecionar automaticamente para `/pages/auth/login.html`.

---

### 📌 Tarefa F2: Indicador de Expiração de Anúncio e Botão de Renovação
* **Contexto:** Com a regra de ciclo de vida de 90 dias dos anúncios, o tutor precisa saber quando seu pet está próximo de ser inativado.
* **Local:** Aba *"Meus Anúncios"* em `frontend/pages/animals/index.html` e `animals.js`.
* **Especificação:**
  - Calcular os dias restantes: $90 - (\text{Data Atual} - \text{Data de Criação})$.
  - Exibir um badge visual de aviso:
    - Se $> 30$ dias: badge neutro (ex: `⏳ Ativo por mais 54 dias`).
    - Se $\le 30$ dias: badge âmbar de atenção (ex: `⚠️ Expira em 18 dias`).
  - Adicionar botão *"🔄 Renovar Anúncio"* que atualiza a data e reinicia a contagem de 90 dias.

---

### 📌 Tarefa F3: Modal de Denúncia de Anúncio no Card e Detalhe
* **Contexto:** Permitir que visitantes autenticados reportem conteúdos impróprios, maus-tratos ou pets já adotados.
* **Local:** `AnimalCard.js` e `animal-detail.js`.
* **Especificação:**
  - Adicionar botão discreto *"🚨 Denunciar"* no canto do card ou na ficha técnica.
  - Se o usuário não estiver logado, redirecionar ou exibir alerta para entrar na conta.
  - Modal Tailwind contendo:
    - Select de categoria: *Maus-tratos*, *Fraude/Golpe*, *Informações Falsas*, *Animal já adotado/encontrado*, *Outro*.
    - Textarea com justificativa detalhada (mínimo 15 caracteres).
    - Submissão via `POST /api/animais/{id}/denunciar/`.
    - Toast de confirmação: *"Denúncia enviada com sucesso para análise da moderação."*

---

### 📌 Tarefa F4: Tela Amigável 404 para Pets Inativos ou Inexistentes
* **Contexto:** Quando um usuário acessa `detail.html?id=999` com um ID que já foi inativado ou excluído.
* **Especificação:**
  - Substituir tela em branco ou erro genérico por um `StateView` ilustrado:
    - Ilustração amigável com cachorrinho curioso.
    - Mensagem: *"Ops! Este amiguinho não está mais disponível ou o anúncio foi finalizado."*
    - Botão: *"Ver outros pets disponíveis para adoção"*.

---

### 📌 Tarefa F5: Revisão de Imagens Estáticas, Direitos Autorais e Créditos (`frontend/assets/images`)
* **Contexto:** Auditoria de ativos identificou que as fotos estáticas do Hero Carousel (`cachorroDeLado.jpg`, `cachorroComABocaAberta.jpg` e `cachorroCoberto.jpg`) não possuem metadados de autoria ou rastreabilidade de licença registrados no repositório. Embora sejam aceitáveis para prototipagem/ambiente acadêmico, o lançamento em produção exige blindagem jurídica contra infração de copyright. (Nota: 3 SVGs não utilizados totalizando ~10,5 MB foram movidos para `vault/assets/` e adicionados ao `.gitignore`).
* **Especificação da tarefa:**
  1. **Substituição ou Homologação das Fotos:**
     - Escolher fotos definitivas em bancos de imagens com licença livre para uso comercial irrestrito (ex: Unsplash License, Pexels License, CC0) ou adotar fotografias reais de animais atendidos pelas ONGs/iniciativa.
     - Assegurar padrão técnico de Hero: resolução de 1600px de largura, formato JPEG/WebP leve (~150 KB – 250 KB) e proporção 3:2.
  2. **Criação do Arquivo de Licenças e Créditos:**
     - Criar `frontend/assets/images/CREDITS.md` catalogando todos os arquivos estáticos da pasta com: nome do arquivo, fonte original (URL), autor/fotógrafo e tipo de licença.
  3. **Limpeza de Ativos Legados:**
     - Avaliar se o arquivo `biscoitos-caindo.gif` (1,09 MB) terá destinação no frontend; caso contrário, excluí-lo ou arquivá-lo no vault para poupar tráfego e espaço.

---

## 🔗 Próximas Notas Relacionadas
- [[00 - MOC Tarefas e Roadmap]]
- [[01 - Checklist de Correções Imediatas]]
- [[02 - Tarefas Backend (Django)]]
- [[06 - Guia de Alinhamento da Equipe e Novo Roadmap]]
- [[07 - Otimizacao de Imagens (Pillow e WebP)]]
