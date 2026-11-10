# 🚀 Plano de Ação e Roadmap de Implementação
tags: #roadmap #tarefas #checklist #implementacao #ibge #best-buddy

Este documento estrutura o plano de execução técnica das mudanças do **Best Buddy**, atualizado após a integração do frontend recente e consolidando a utilização da **API de Localidades do IBGE** para eliminação de campos digitáveis e otimização total do banco de dados (sem necessidade de catálogo local de cidades).

---

## 🧭 Visão Geral do Fluxo com API do IBGE

```
[Frontend: ibgeService.js]
       │
       ├──> GET /estados ───────> Popula <select> de Estados (27 UFs)
       │
       └──> GET /estados/{UF}/municipios ─> Popula <select> de Cidades dinamicamente
                                                        │
[Envio para API Django] <───────────────────────────────┘
       │
       └──> Salva apenas: estado="SP" e cidade="Campinas" (sem catálogo no banco!)
```

---

## 🎯 Fases de Implementação Manual (Passo a Passo)

### 🧱 Fase 1: Backend — Modelagem e Migrações (`animais/models.py`)
*Objetivo: Preparar o modelo `Animal` para armazenar a UF do Enum e contato obrigatório.*
- [x] **1.1 Enum de Estados no Model:**
  - Criar `class Estado(models.TextChoices)` com as 27 siglas e nomes das UFs.
  - Adicionar campo `estado = models.CharField(max_length=2, choices=Estado.choices, default='SP', verbose_name="Estado (UF)")`.
- [x] **1.2 Campo de Contato Obrigatório:**
  - Adicionar `telefone_contato = models.CharField(max_length=20, default='', verbose_name="Telefone de contato do tutor")` como campo obrigatório.
  - Atualizar a property `@property def contato(self):` para retornar `self.telefone_contato or (self.tutor.telefone if self.tutor else "")`.
- [x] **1.3 Executar Migrações:**
  - Migrações `0002` e `0003` aplicadas com sucesso no app `animais`.
- [x] **1.4 Descontinuação do App `comunidade`:**
  - Removido `comunidade` de `INSTALLED_APPS` e `config/urls.py` (mural de notícias e posts encerrados).

---

### ⚙️ Fase 2: Backend — Serializer e Filtros da API (`animais/`)
*Objetivo: Expor os novos campos na API, validar contato obrigatório e permitir filtro de busca por Estado.*
- [x] **2.1 Atualização de Campos no `AnimaisSerializer`:**
  - Incluir `'estado'`, `'telefone_contato'` e `'contato'` na lista `fields` e `read_only_fields`.
- [x] **2.2 Validação de Contato:**
  - Regra: O anúncio DEVE possuir telefone de contato com DDD. Caso não seja enviado no payload, é preenchido com o telefone validado do tutor, ou rejeitado com "É necessário um número de contato para cadastrar o animal.".
- [x] **2.3 Filtro por Estado na View (`AnimaisViewSet`):**
  - No método `get_queryset()` de `animais/views.py`, adicionar suporte ao query param `?estado=SP` e `?cidade=Campinas`.
- [x] **2.4 Teste da Fase 2:**
  - Validado via `python test_endpoints.py` (100% de sucesso nos 14 testes, incluindo 404 para comunidade).

---

### 🌐 Fase 3: Frontend — Serviço de Integração com o IBGE (`js/services/ibgeService.js`)
*Objetivo: Criar um módulo JavaScript centralizado, leve e reutilizável para consultar estados e cidades sem onerar o banco.*
- [x] **3.1 Criação de `js/services/ibgeService.js`:**
  - Lista estática das 27 UFs brasileiras (`getEstados()`).
  - `getCidadesPorEstado(uf)` com cache de 2 níveis (RAM + `sessionStorage`) e timeout com `AbortController`.
  - Documentação atualizada no vault (`vault/01 - Frontend/03 - Serviços e Camada de API.md`).
- [x] **3.2 Importação nas Páginas:**
  - Incluído `<script src="../../js/services/ibgeService.js"></script>` em `animals/index.html` e `community/index.html`.

---

### 📝 Fase 4: Frontend — Formulários de Anúncio com IBGE e Contato Flexível
*Objetivo: Eliminar campo de texto livre de cidade e aplicar cascata de seleção Estado $\rightarrow$ Cidade nos modais de publicação.*
- [x] **4.1 Modal de Adoção (`pages/animals/index.html` e `js/pages/animals.js`):**
  - No HTML: Grid com `<select id="pet-estado">` e input com `<datalist id="pet-cidades-list">` para busca digitável leve.
  - Telefone inteligente com pré-carregamento do perfil.
  - No JS: UFs preenchidas via `ibgeService.getEstados()`, cidades carregadas no `change` e desabilitadas até seleção da UF.
- [x] **4.2 Modal de Animal Perdido (`pages/community/index.html` e `js/pages/community.js`):**
  - Mesma estrutura: selects em cascata Estado $\rightarrow$ Cidade via `ibgeService` com `<datalist>` e telefone inteligente.

---

### 🔍 Fase 5: Frontend — Filtros Geográficos nas Vitrines
*Objetivo: Permitir que visitantes filtrem os animais por Estado e Cidade de forma estruturada.*
- [x] **5.1 Dropdowns de Filtro nas Vitrines (`animals/index.html` e `animals.js`):**
  - Adicionado `<select id="filter-estado">` com opção "Todos os estados" e as 27 UFs.
  - Adicionado `<input id="filter-cidade" list="filter-cidades-list">` com autocompleção inteligente.
- [x] **5.2 Integração com a Busca:**
  - Ao alterar Estado ou Cidade, dispara a busca passando `?estado=UF&cidade=Nome`.
  - Suporte implementado tanto para o backend Django real quanto para o mock no `animalService.js`.
  - Formatação visual dos cards atualizada: `📍 Cidade - UF`.

---

### ⏳ Fase 6: Rotina de Expiração Automática (90 + 30 dias)
*Objetivo: Automatizar o ciclo de vida dos anúncios (`RF16` e `RF17`).*
- [ ] **6.1 Comando Django (`animais/management/commands/expirar_anuncios.py`):**
  - Inativar anúncios com mais de 90 dias (`status = 'INATIVO'`, `inativado_em = now()`).
  - Excluir registros inativos há mais de 30 dias (120 dias no total).
- [ ] **6.2 Teste do Comando:**
  - Executar `python manage.py expirar_anuncios` e validar a atualização no banco.

---

### 🧪 Fase 7: Testes Integrados e Homologação Final
- [ ] **7.1 Bateria de Testes (`test_endpoints.py`):**
  - Validar criação de animais com `estado` e `cidade` do IBGE.
  - Validar filtros combinados.
  - Validar cota de 5 animais.
- [ ] **7.2 Homologação no Navegador:**
  - Testar fluxo completo de visitante navegando, filtrando por estado/cidade, logando, anunciando com os selects do IBGE e testando botão de WhatsApp.
