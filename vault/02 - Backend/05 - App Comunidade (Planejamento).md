# 👥 Backend — App Comunidade (Descontinuado / Abandonado)
tags: #backend #comunidade #descontinuado #decisao-arquitetural

> [!WARNING]
> **Status: DESCONTINUADO / ABANDONADO**
> Por decisão de produto e simplificação arquitetural, o módulo de "Comunidade" (incluindo o feed livre de postagens de usuários e o mural de notícias institucionais) foi descontinuado do sistema.

---

## 1. Motivação da Decisão de Arquitetura

1. **Foco no Core Business**: O objetivo primordial da Best Buddy é viabilizar **Adoções Responsáveis** e o **Reencontro de Animais Perdidos** de forma ágil, segura e sem fricção.
2. **Eliminação de Riscos de Moderação**: Um feed aberto de postagens exigiria moderação contínua de conteúdo, denúncias de comentários e infraestrutura de rede social que fogem ao escopo do produto.
3. **Consolidação dos Animais Desaparecidos**: Os animais desaparecidos deixaram de ser tratados como posts de comunidade e foram unificados na tabela principal `animais_animal` sob o discriminador `tipo_servico = 'PERDIDO'`, compartilhando toda a infraestrutura de fotos, filtros geográficos por IBGE e contato direto via WhatsApp.

---

## 2. Destino de Cada Funcionalidade

| Recurso Original | Destino Arquitetural | Status Atual |
| :--- | :--- | :--- |
| **Feed de Posts (`comunidade_post`)** | Descontinuado integralmente. Código e rotas removidos. | ❌ Abandonado (HTTP 404) |
| **Mural de Notícias (`comunidade_noticia`)** | Descontinuado. Home substituída por vitrine de animais em destaque. | ❌ Abandonado (HTTP 404) |
| **Animais Desaparecidos (`comunidade_animaldesaparecido`)** | Migrado para a tabela única `animais_animal` (`tipo_servico='PERDIDO'`). | 🟢 Ativo no App `animais` |

---

## 3. Estado Atual no Código

- **`config/settings.py`**: O app `'comunidade'` foi removido de `INSTALLED_APPS`.
- **`config/urls.py`**: A rota `path('api/comunidade/', ...)` foi desativada. Qualquer requisição para `/api/comunidade/noticias/` ou `/api/comunidade/posts/` retorna HTTP 404 (*Not Found*).
- **Frontend**:
  - Removido `communityService.js` e `pages/community.js`.
  - Página `pages/community/index.html` transformada em redirecionador leve para `/pages/animals/index.html#bb-lost-section`.
  - Navbar exibe apenas *Home*, *Animais* e *Meu Perfil*.
