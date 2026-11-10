# ⚖️ Regras de Negócio (RN)
tags: #regras-de-negocio #rn #politicas #validacoes #best-buddy

As Regras de Negócio estabelecem as diretrizes funcionais e restrições mandatórias do sistema **Best Buddy** para o MVP. Elas devem ser rigorosamente validadas tanto na camada de apresentação (frontend) quanto, obrigatoriamente, na camada de persistência e validação da API (backend).

> [!NOTE]
> Regras relacionadas a validação Twilio WhatsApp, contas de ONG, credenciamento de serviços e sistema de denúncias foram migradas para [[08 - Implementações futuras]].

---

## 📋 Catálogo de Regras de Negócio Ativas

### `RN01` — Acesso e Navegação Pública
* **Regra:** O visitante não autenticado tem direito pleno de navegar, filtrar e visualizar todos os cards do sistema (animais para adoção e animais perdidos), bem como acessar o link direto para falar com o tutor via WhatsApp.
* **Fundamentação:** O propósito da plataforma é dar máxima visibilidade aos animais que precisam de um lar e aos pets perdidos. Exigir login para visualização reduziria drasticamente o alcance das adoções e resgates.

---

### `RN02` — Ações Ativas Exigem Autenticação
* **Regra:** Qualquer ação ativa no sistema (anunciar animal para adoção, reportar animal perdido) exige autenticação ativa do usuário.
* **Comportamento:** Os botões de ação continuam visíveis para o visitante. Ao clicar deslogado, é direcionado para a tela de login/cadastro preservando a rota de retorno (`next=/...`).

---

### `RN03` — Cota de 5 Animais Ativos para Usuários
* **Regra:** Cada usuário só pode manter ativos simultaneamente no máximo **5 registros de animais** (somatório de anúncios para adoção com status `Disponível` e animais perdidos com status `Perdido`) na tabela unificada `Animal`.
* **Enforcement:** Ao tentar cadastrar o 6º animal ativo, o backend retorna HTTP 400 informando que o limite foi atingido.

---

### `RN04` — Titularidade e Isolamento de Edição
* **Regra:** Cada usuário possui controle exclusivo apenas sobre os registros que ele próprio criou (`registro.tutor_id == request.user.id`). Usuários comuns não podem alterar nem excluir cards de terceiros.

---

### `RN05` — Contato Obrigatório e Adoção Direta Peer-to-Peer
* **Regra:** 
  1. **Telefone Obrigatório:** O anúncio de qualquer animal (seja para adoção ou perdido) **deve obrigatoriamente possuir um telefone de contato com DDD**, pois essa é a única via de contato entre interessados e anunciantes.
  2. **Validação Bloqueante no Frontend:** O frontend valida a presença de DDD brasileiro válido (11 a 99) e tamanho total (10 a 11 dígitos numéricos). Se o campo for inválido, emite o popup `alert("É necessário um número de contato para cadastrar o animal.");` e bloqueia a submissão sem chamar a rota da API.
  3. **Persistência no Backend:** O modelo `Animal.telefone_contato` é obrigatório. Caso uma chamada de API omita o campo, o serializer herda automaticamente o telefone cadastrado no perfil do tutor; se nenhum existir, a API rejeita com HTTP 400.
  4. **Sem Burocracia Intermediária:** A plataforma não retém nem intermedeia propostas via formulários burocráticos internos. O interessado clica no botão "Falar com o Tutor no WhatsApp" e combina diretamente. O tutor altera o status para `Adotado` ou `Encontrado` no seu painel.

---

### `RN06` — Ciclo de Vida e Expiração (90 + 30 Dias)
* **Regra:** Anúncios de animais para adoção inativam-se automaticamente aos 90 dias caso não adotados. O tutor possui uma janela de 30 dias (do 91º ao 120º dia) para reativar o anúncio. Aos 120 dias, registros não reativados são permanentemente expurgados por comando automatizado.

---

### `RN07` — Limite de Tamanho de Textos (255 Caracteres)
* **Regra:** Limite máximo estrito de 255 caracteres para a descrição de animais para adoção e informações de animais perdidos.

---

### `RN08` — Segurança e Confirmação na Edição de Perfil
* **Regra:**
  1. **Imutabilidade do Nome:** O nome do usuário não pode ser alterado após a criação da conta, garantindo a integridade dos cadastros e prevenindo fraudes.
  2. **Alteração de Email com Duplo Fator (2FA):** Exige confirmação da senha atual (1º fator) e validação de token enviado para o novo e-mail (2º fator) antes da efetivação da troca no sistema.
  3. **Alteração de Telefone com Duplo Fator (2FA):** Exige solicitação do usuário autenticado (1º fator) e confirmação de código OTP enviado via WhatsApp (2º fator) antes do novo número ser salvo no perfil.
  4. **Alteração de Senha:** Exige a confirmação da senha atual antes de autorizar a substituição pela nova senha, a qual deve cumprir os critérios de senha forte (mínimo de 8 caracteres, contendo maiúscula, minúscula, número e caractere especial).

---

### `RN09` — Padronização Geográfica (Estado e Cidade)
* **Regra:**
  1. **Estado (UF):** Deve ser validado estritamente através do conjunto fechado das 27 Unidades Federativas (Enum de 2 caracteres).
  2. **Cidade:** Não deve aceitar grafias livres inconsistentes; deve ser preenchida de forma padronizada (via consulta de CEP/ViaCEP com preenchimento em modo leitura ou via catálogo oficial de municípios do IBGE).

---

## 🔗 Próximas Notas Relacionadas
- [[01 - Atores e Matriz de Permissões]] — Perfis e privilégios.
- [[02 - Requisitos Funcionais]] — Especificação funcional completa.
- [[05 - Modelagem de Dados e Relacionamentos]] — Implementação das regras no schema SQL.
- [[08 - Implementações futuras]] — Regras e módulos postergados.
